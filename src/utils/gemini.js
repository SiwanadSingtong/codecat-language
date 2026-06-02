import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key-to-prevent-crash-during-build');

// Helper to get Gemini Generative Model
function getModel(systemInstruction, isJson = false) {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction,
    ...(isJson ? { generationConfig: { responseMimeType: 'application/json' } } : {}),
  });
}

/**
 * Gets a conversational response from the AI English Teacher.
 * Automatically checks and corrects grammar, especially "is am are".
 */
export async function getTeacherResponse(history, userLevel = 'Beginner') {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return "API Key is not configured. Please add GEMINI_API_KEY to your .env.local file.";
  }

  const systemInstruction = `
You are "Catlingo Teacher", an encouraging, friendly, and expert AI English Teacher.
The student's English proficiency level is: ${userLevel}.

CORE RULES:
1. Adapt your vocabulary, phrasing, and response length to match the student's level (${userLevel}).
   - Beginner: Use short, simple sentences. Explain words if they are slightly hard.
   - Intermediate: Use standard English with a mix of simple and complex sentences.
   - Advanced: Carry out a natural, fluent English conversation.
2. Actively monitor the student's grammar, especially the use of "is", "am", and "are".
   - If the student makes a grammatical error (specifically using "is am are" incorrectly, e.g. "I is", "They am", "He are"), you MUST gently point it out, explain the correct grammar rule in a clear and friendly way (bilingual in English and Thai if they are Beginner), and invite them to try rewriting it.
   - Example correction: "You wrote: 'She am a teacher'. Remember that for singular pronouns like 'She', we use 'is' (She is a teacher). Try saying that!"
3. Keep the conversation engaging. Ask open-ended questions about their day, hobbies, or studies to prompt them to reply.
4. Keep answers relatively concise so the chat flows naturally.
`;

  try {
    const model = getModel(systemInstruction, false);
    
    // Transform history structure to match Gemini API expect format:
    // [{ role: 'user'|'model', parts: [{ text: '...' }] }]
    const formattedHistory = history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    // Extract the latest user message to send as the prompt
    const userMessage = formattedHistory[formattedHistory.length - 1];
    const prevHistory = formattedHistory.slice(0, -1);

    // CRITICAL: Gemini startChat history MUST start with role 'user'.
    // If the first message in prevHistory is from the model, we filter out leading model messages.
    while (prevHistory.length > 0 && prevHistory[0].role === 'model') {
      prevHistory.shift();
    }

    const chat = model.startChat({
      history: prevHistory,
    });

    const result = await chat.sendMessage(userMessage.parts[0].text);
    return result.response.text();
  } catch (error) {
    console.error("Error in getTeacherResponse:", error);
    const msg = error.message || '';
    if (msg.includes('429') || msg.includes('Quota') || msg.includes('quota')) {
      return `ขออภัยเป็นอย่างสูงครับ พอดีขณะนี้โควตาการสนทนาของ Gemini API ฟรีได้เต็มข้อจำกัดแล้ว (429 Rate Limit Exceeded) กรุณาเว้นระยะห่างสักครู่แล้วลองส่งข้อความใหม่อีกครั้ง หรือตรวจสอบและปรับปรุงคีย์ API ในไฟล์ .env.local นะครับ 🐾`;
    }
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      return `ขออภัยครับ คีย์ Gemini API ของคุณไม่ถูกต้องหรือยังไม่ได้เปิดใช้งาน กรุณาตรวจสอบและกรอกคีย์ที่ถูกต้องในไฟล์ .env.local นะครับ 🐾`;
    }
    return `คุณครู AI ขออภัยด้วยครับ พอดีเกิดข้อขัดข้องชั่วคราวในการประมวลผลข้อความ: ${msg} กรุณาลองส่งใหม่อีกครั้งนะครับ! 🐾`;
  }
}

const LOCAL_FALLBACKS = {
  Beginner: {
    'th-en': [
      { word: 'แมว', hint: 'A small domesticated carnivorous mammal. (c_t)' },
      { word: 'สุนัข', hint: 'A common animal often kept as a pet. (d_g)' },
      { word: 'แอปเปิ้ล', hint: 'A round red or green fruit. (a__le)' },
      { word: 'กล้วย', hint: 'A long yellow fruit. (b___na)' },
      { word: 'หนังสือ', hint: 'You read this. It contains pages. (b__k)' },
      { word: 'โรงเรียน', hint: 'A place where students learn. (s___ool)' },
      { word: 'น้ำ', hint: 'We drink this transparent liquid to survive. (w___r)' },
      { word: 'บ้าน', hint: 'A place where a person or family lives. (h___e)' },
      { word: 'รถยนต์', hint: 'A road vehicle with four wheels. (c_r)' },
      { word: 'ดวงอาทิตย์', hint: 'The star around which the earth orbits. (s_n)' }
    ],
    'en-th': [
      { word: 'cat', hint: 'สัตว์เลี้ยงขนาดเล็กร้องเหมียวๆ' },
      { word: 'dog', hint: 'สัตว์เลี้ยงที่ซื่อสัตย์ เห่าบ๊อกๆ' },
      { word: 'apple', hint: 'ผลไม้สีแดงหรือเขียว มีรสหวานกรอบ' },
      { word: 'banana', hint: 'ผลไม้สีเหลืองทรงยาว ปอกเปลือกกิน' },
      { word: 'book', hint: 'สิ่งที่มีกระดาษเย็บติดกันหลายแผ่นใช้อ่าน' },
      { word: 'school', hint: 'สถานที่เรียนของเด็กนักเรียน' },
      { word: 'water', hint: 'น้ำดื่มใสๆ ที่ขาดไม่ได้ในชีวิตประจำวัน' },
      { word: 'house', hint: 'ที่อยู่อาศัยของคน' },
      { word: 'car', hint: 'ยานพาหนะสี่ล้อวิ่งบนถนน' },
      { word: 'sun', hint: 'ดาวฤกษ์ดวงใหญ่ที่ให้แสงสว่างในตอนกลางวัน' }
    ]
  },
  Intermediate: {
    'th-en': [
      { word: 'โอกาส', hint: 'A time or set of circumstances that makes it possible to do something. (o_______ity)' },
      { word: 'ความรับผิดชอบ', hint: 'The state or fact of having a duty to deal with something. (r____________ity)' },
      { word: 'ท้าทาย', hint: 'A task or situation that tests someone\'s abilities. (c_______ge)' },
      { word: 'ประสบความสำเร็จ', hint: 'Accomplishing an aim or purpose. (s______d)' },
      { word: 'พัฒนา', hint: 'Grow or cause to grow and become more mature, advanced, or elaborate. (d_____op)' },
      { word: 'อธิบาย', hint: 'Make something clear to someone by describing it in more detail. (e____in)' },
      { word: 'ข้อมูล', hint: 'Facts provided or learned about something or someone. (i__________on)' },
      { word: 'เทคโนโลยี', hint: 'The application of scientific knowledge for practical purposes. (t________gy)' },
      { word: 'สิ่งแวดล้อม', hint: 'The surroundings or conditions in which a person, animal, or plant lives. (e_________nt)' },
      { word: 'การศึกษา', hint: 'The process of receiving or giving systematic instruction. (e_______on)' }
    ],
    'en-th': [
      { word: 'opportunity', hint: 'ช่วงเวลาหรือโอกาสที่เหมาะสมในการทำบางสิ่ง' },
      { word: 'responsibility', hint: 'หน้าที่หรือภาระงานที่ต้องรับผิดชอบดูแล' },
      { word: 'challenge', hint: 'สิ่งที่ท้าทายความสามารถหรือต้องใช้ความพยายาม' },
      { word: 'succeed', hint: 'การทำเป้าหมายได้สำเร็จ' },
      { word: 'develop', hint: 'การพัฒนา ปรับปรุงให้ดีขึ้นหรือก้าวหน้าขึ้น' },
      { word: 'explain', hint: 'อธิบายให้เข้าใจชัดเจนยิ่งขึ้น' },
      { word: 'information', hint: 'ข้อมูล ข้อเท็จจริง หรือสารสนเทศ' },
      { word: 'technology', hint: 'วิทยาการและเทคโนโลยีสมัยใหม่' },
      { word: 'environment', hint: 'สิ่งแวดล้อมรอบตัวเรา' },
      { word: 'education', hint: 'การศึกษาหรือการอบรมสั่งสอน' }
    ]
  },
  Advanced: {
    'th-en': [
      { word: 'ความเข้าใจผิด', hint: 'A failure to understand something correctly. (m_______________ing)' },
      { word: 'ความกระตือรือร้น', hint: 'Intense and eager enjoyment, interest, or approval. (e________sm)' },
      { word: 'ความหลากหลาย', hint: 'A range of different things or variety. (d______ity)' },
      { word: 'ความยั่งยืน', hint: 'The ability to be maintained at a certain rate or level. (s____________ity)' },
      { word: 'หลีกเลี่ยงไม่ได้', hint: 'Certain to happen; unavoidable. (i________ble)' },
      { word: 'มีอิทธิพล', hint: 'The capacity to have an effect on the character, development, or behavior of someone or something. (i_______ce)' },
      { word: 'การทำงานร่วมกัน', hint: 'The action of working with someone to produce or create something. (c___________on)' },
      { word: 'ความขัดแย้ง', hint: 'A serious disagreement or argument. (c______ct)' },
      { word: 'จริยธรรม', hint: 'Moral principles that govern a person\'s behavior. (e____s)' },
      { word: 'ประเมินค่า', hint: 'Form an idea of the amount, number, or value of; assess. (e______te)' }
    ],
    'en-th': [
      { word: 'misunderstanding', hint: 'การเข้าใจผิดหรือตีความหมายผิดพลาด' },
      { word: 'enthusiasm', hint: 'ความกระตือรือร้นและแรงใจที่เต็มเปี่ยม' },
      { word: 'diversity', hint: 'ความหลากหลายหรือความแตกต่างทางวัฒนธรรม/สายพันธุ์' },
      { word: 'sustainability', hint: 'ความยั่งยืนที่สามารถรักษาระดับไว้ได้ระยะยาว' },
      { word: 'inevitable', hint: 'สิ่งที่ไม่สามารถหลีกเลี่ยงได้ หรือต้องเกิดขึ้นแน่นอน' },
      { word: 'influence', hint: 'การมีอิทธิพลหรืออำนาจชักจูงความคิดของผู้อื่น' },
      { word: 'collaboration', hint: 'การทำงานร่วมมือร่วมใจกันสร้างสรรค์ผลงาน' },
      { word: 'conflict', hint: 'ความขัดแย้ง ความไม่เห็นด้วยอย่างรุนแรง' },
      { word: 'ethics', hint: 'หลักศีลธรรม จริยธรรม หรือคุณธรรม' },
      { word: 'evaluate', hint: 'ประเมินค่า หรือประเมินผลอย่างเป็นระบบ' }
    ]
  }
};

/**
 * Generates a random vocabulary word/phrase matching the user's level.
 * @param {string} level - 'Beginner' | 'Intermediate' | 'Advanced'
 * @param {string} direction - 'th-en' (show Thai, translate to English) | 'en-th' (show English, translate to Thai)
 * @param {string} exclude - Word to avoid to prevent duplicates
 */
export async function generatePracticeWord(level = 'Beginner', direction = 'th-en', exclude = '') {
  const cleanExclude = typeof exclude === 'string' ? exclude.toLowerCase().trim() : '';

  const getLocalFallback = () => {
    const list = LOCAL_FALLBACKS[level]?.[direction] || LOCAL_FALLBACKS['Beginner']['th-en'];
    const filtered = list.filter(item => item.word.toLowerCase().trim() !== cleanExclude);
    const chosenList = filtered.length > 0 ? filtered : list;
    return chosenList[Math.floor(Math.random() * chosenList.length)];
  };

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return getLocalFallback();
  }

  const prompt = `
Generate a random vocabulary word or short phrase matching the English proficiency level: ${level}.
The practice direction is: ${direction}.

- If direction is 'th-en', the "word" must be in THAI, and the student will be asked to translate it to English.
- If direction is 'en-th', the "word" must be in ENGLISH, and the student will be asked to translate it to Thai.

Provide a short "hint" (definition or context in English) to help the student.

Return ONLY a JSON object in this exact format:
{
  "word": "string",
  "hint": "string"
}
`;

  try {
    const model = getModel("You are a helpful language generator.", true);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);
    if (data && data.word && data.word.toLowerCase().trim() !== cleanExclude) {
      return data;
    }
    return getLocalFallback();
  } catch (error) {
    console.error("Error in generatePracticeWord:", error);
    return getLocalFallback();
  }
}

/**
 * Helper to find the correct translation in the local fallback dictionary.
 */
function findLocalTranslation(originalWord, direction) {
  const cleanOriginal = originalWord.toLowerCase().trim();
  const oppositeDirection = direction === 'th-en' ? 'en-th' : 'th-en';
  
  for (const level of ['Beginner', 'Intermediate', 'Advanced']) {
    const list = LOCAL_FALLBACKS[level]?.[direction] || [];
    const index = list.findIndex(item => item.word.toLowerCase().trim() === cleanOriginal);
    if (index !== -1) {
      const oppositeList = LOCAL_FALLBACKS[level]?.[oppositeDirection] || [];
      if (oppositeList[index]) {
        return oppositeList[index].word;
      }
    }
  }
  return null;
}

/**
 * Checks the user's translation for a vocabulary word.
 */
export async function checkPracticeTranslation(originalWord, userTranslation, direction) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const targetTranslation = findLocalTranslation(originalWord, direction) || originalWord;
    const cleanUser = userTranslation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanTarget = targetTranslation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const isCorrect = cleanUser === cleanTarget;
    
    return {
      isCorrect,
      feedback: isCorrect 
        ? `ถูกต้องแล้วครับ! "${userTranslation}" เป็นคำแปลที่ถูกต้องของ "${originalWord}"` 
        : `คำแปลยังไม่ถูกต้องครับ ลองใหม่อีกครั้งนะ`,
      correctTranslation: targetTranslation
    };
  }

  const prompt = `
Evaluate the translation.
Original word/phrase: "${originalWord}"
User's translation: "${userTranslation}"
Direction: "${direction}" (if 'th-en', they translated Thai to English. If 'en-th', they translated English to Thai).

You must be flexible! Accept synonyms and natural phrasing. Ignore minor punctuation or capitalization differences.

Return a JSON object in this exact format:
{
  "isCorrect": boolean,
  "feedback": "A short, encouraging explanation written in Thai language (ภาษาไทย) explaining why it is correct or incorrect, pointing out any minor spelling issues or alternative correct answers.",
  "correctTranslation": "The standard / most common correct translation"
}
`;

  try {
    const model = getModel("You are a language teacher grading a translation test.", true);
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error in checkPracticeTranslation:", error);
    const msg = error.message || '';
    let apiFeedback = "ไม่สามารถตรวจคำแปลผ่าน AI ได้ชั่วคราวเนื่องจากข้อผิดพลาดของระบบ ระบบจึงตรวจคะแนนให้คุณแบบเปรียบเทียบคำตรงเบื้องต้นแทนครับ";
    if (msg.includes('429') || msg.includes('Quota') || msg.includes('quota')) {
      apiFeedback = "ขณะนี้โควตาการประมวลผลของ Gemini API ได้เต็มข้อจำกัดชั่วคราวแล้ว (429 Rate Limit) ระบบจึงตรวจคะแนนให้คุณแบบเปรียบเทียบคำตรงเบื้องต้นแทนครับ";
    }
    
    const targetTranslation = findLocalTranslation(originalWord, direction) || originalWord;
    const cleanUser = userTranslation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const cleanTarget = targetTranslation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
    const isCorrect = cleanUser === cleanTarget;
    
    const statusText = isCorrect ? "ถูกต้องแล้ว! 🎉" : "ยังไม่ถูกต้องครับ ❌";
    
    return {
      isCorrect,
      feedback: `${apiFeedback}\n\nผลลัพธ์: ${statusText}`,
      correctTranslation: targetTranslation
    };
  }
}
