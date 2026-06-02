import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key-to-prevent-crash-during-build');

// Helper to get Gemini Generative Model
function getModel(systemInstruction, isJson = false) {
  return genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
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
5. When communicating in Thai, ALWAYS use the polite particle "ครับ" (masculine polite particle). NEVER use "ค่ะ" or "ครับ/ค่ะ" under any circumstances.
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
      return `ขออภัยเป็นอย่างสูงครับ พอดีขณะนี้โควตาการสนทนาของ Gemini API ฟรีได้เต็มข้อจำกัดแล้ว (429 Rate Limit Exceeded) กรุณาเว้นระยะห่างสักครู่แล้วลองส่งข้อความใหม่อีกครั้ง หรือตรวจสอบและปรับปรุงคีย์ API ในไฟล์ .env นะครับ 🐾`;
    }
    if (msg.includes('API key not valid') || msg.includes('API_KEY_INVALID')) {
      return `ขออภัยครับ คีย์ Gemini API ของคุณไม่ถูกต้องหรือยังไม่ได้เปิดใช้งาน กรุณาตรวจสอบและกรอกคีย์ที่ถูกต้องในไฟล์ .env นะครับ 🐾`;
    }
    return `คุณครู AI ขออภัยด้วยครับ พอดีเกิดข้อขัดข้องชั่วคราวในการประมวลผลข้อความ: ${msg} กรุณาลองส่งใหม่อีกครั้งนะครับ! 🐾`;
  }
}

// ---------------------------------------------------------------------------
// LOCAL FALLBACK DICTIONARY
// Each entry: { word, hint, correctTranslation }
// th-en[i] and en-th[i] are NOT required to be index-paired anymore.
// findLocalTranslation() searches by word and reads correctTranslation directly.
// ---------------------------------------------------------------------------
const LOCAL_FALLBACKS = {
  Beginner: {
    'th-en': [
      { word: 'แมว', hint: "A small furry pet that says 'meow'. (c_t)", correctTranslation: 'cat' },
      { word: 'สุนัข', hint: "A loyal pet that barks. (d_g)", correctTranslation: 'dog' },
      { word: 'แอปเปิ้ล', hint: "A round red or green fruit. (a__le)", correctTranslation: 'apple' },
      { word: 'กล้วย', hint: "A long yellow fruit. (b___na)", correctTranslation: 'banana' },
      { word: 'หนังสือ', hint: "You read it, it has pages. (b__k)", correctTranslation: 'book' },
      { word: 'โรงเรียน', hint: "Where students go to learn. (s___ol)", correctTranslation: 'school' },
      { word: 'น้ำ', hint: "A clear liquid we drink every day. (w___r)", correctTranslation: 'water' },
      { word: 'บ้าน', hint: "A building where people live. (h___e)", correctTranslation: 'house' },
      { word: 'รถยนต์', hint: "A four-wheeled vehicle on the road. (c_r)", correctTranslation: 'car' },
      { word: 'ดวงอาทิตย์', hint: "The star that gives us light and heat. (s_n)", correctTranslation: 'sun' },
      { word: 'แม่', hint: "A female parent. (m___er)", correctTranslation: 'mother' },
      { word: 'พ่อ', hint: "A male parent. (f___er)", correctTranslation: 'father' },
      { word: 'พี่ชาย', hint: "A male sibling. (b___er)", correctTranslation: 'brother' },
      { word: 'พี่สาว', hint: "A female sibling. (s___er)", correctTranslation: 'sister' },
      { word: 'ครู', hint: "A person who educates students. (t___er)", correctTranslation: 'teacher' },
      { word: 'นักเรียน', hint: "A person who studies at school. (s___nt)", correctTranslation: 'student' },
      { word: 'อาหาร', hint: "Things we eat to get energy. (f__d)", correctTranslation: 'food' },
      { word: 'ข้าว', hint: "A staple grain eaten widely in Asia. (r__e)", correctTranslation: 'rice' },
      { word: 'ปลา', hint: "An animal that lives in water and swims. (f__h)", correctTranslation: 'fish' },
      { word: 'ไก่', hint: "A common poultry bird we eat. (c___en)", correctTranslation: 'chicken' },
      { word: 'ไข่', hint: "An oval object laid by a bird. (e_g)", correctTranslation: 'egg' },
      { word: 'นม', hint: "A white liquid that comes from cows. (m_lk)", correctTranslation: 'milk' },
      { word: 'ขนมปัง', hint: "A baked food made from flour. (b___d)", correctTranslation: 'bread' },
      { word: 'ผัก', hint: "Plants we eat for nutrition. (v_______le)", correctTranslation: 'vegetable' },
      { word: 'ผลไม้', hint: "Sweet food that grows on trees. (f___t)", correctTranslation: 'fruit' },
      { word: 'ส้ม', hint: "A round citrus fruit. (o___ge)", correctTranslation: 'orange' },
      { word: 'มะม่วง', hint: "A tropical yellow-orange fruit. (m__go)", correctTranslation: 'mango' },
      { word: 'สีแดง', hint: "The color of blood and fire. (r_d)", correctTranslation: 'red' },
      { word: 'สีน้ำเงิน', hint: "The color of the sky and ocean. (b__e)", correctTranslation: 'blue' },
      { word: 'สีเขียว', hint: "The color of leaves and grass. (g___n)", correctTranslation: 'green' },
      { word: 'สีเหลือง', hint: "The color of the sun and bananas. (y___ow)", correctTranslation: 'yellow' },
      { word: 'สีขาว', hint: "The color of snow and clouds. (w___e)", correctTranslation: 'white' },
      { word: 'สีดำ', hint: "The darkest color, opposite of white. (b___k)", correctTranslation: 'black' },
      { word: 'มือ', hint: "The body part at the end of your arm. (h__d)", correctTranslation: 'hand' },
      { word: 'เท้า', hint: "The body part at the end of your leg. (f__t)", correctTranslation: 'foot' },
      { word: 'ตา', hint: "The body part you use to see. (e_e)", correctTranslation: 'eye' },
      { word: 'จมูก', hint: "The body part you use to smell. (n__e)", correctTranslation: 'nose' },
      { word: 'ปาก', hint: "The body part you use to eat and speak. (m___h)", correctTranslation: 'mouth' },
      { word: 'ใหญ่', hint: "Large in size, opposite of small. (b_g)", correctTranslation: 'big' },
      { word: 'เล็ก', hint: "Little in size, opposite of big. (s___l)", correctTranslation: 'small' },
      { word: 'ร้อน', hint: "Having a high temperature. (h_t)", correctTranslation: 'hot' },
      { word: 'เย็น', hint: "Having a low temperature. (c_ld)", correctTranslation: 'cold' },
      { word: 'เร็ว', hint: "Moving with great speed. (f__t)", correctTranslation: 'fast' },
      { word: 'ช้า', hint: "Not moving quickly. (s__w)", correctTranslation: 'slow' },
      { word: 'ดี', hint: "Of high quality or moral excellence. (g__d)", correctTranslation: 'good' },
      { word: 'สวย', hint: "Pleasing to the eye. (b________ul)", correctTranslation: 'beautiful' },
      { word: 'เก่า', hint: "Having existed for a long time. (o_d)", correctTranslation: 'old' },
      { word: 'ใหม่', hint: "Recently made or discovered. (n_w)", correctTranslation: 'new' },
      { word: 'นอน', hint: "To rest with your eyes closed at night. (s___p)", correctTranslation: 'sleep' },
      { word: 'กิน', hint: "To put food in your mouth and swallow. (e_t)", correctTranslation: 'eat' },
    ],
    'en-th': [
      { word: 'cat', hint: "สัตว์เลี้ยงขนาดเล็กร้องเหมียวๆ ชอบนอน", correctTranslation: 'แมว' },
      { word: 'dog', hint: "สัตว์เลี้ยงที่ซื่อสัตย์ ร้องเห่าบ๊อกๆ", correctTranslation: 'สุนัข' },
      { word: 'apple', hint: "ผลไม้สีแดงหรือเขียว รสหวานกรอบ", correctTranslation: 'แอปเปิ้ล' },
      { word: 'banana', hint: "ผลไม้สีเหลืองทรงยาว", correctTranslation: 'กล้วย' },
      { word: 'book', hint: "สิ่งที่มีหน้ากระดาษหลายแผ่น ใช้อ่าน", correctTranslation: 'หนังสือ' },
      { word: 'school', hint: "สถานที่ที่เด็กๆ ไปเรียนหนังสือ", correctTranslation: 'โรงเรียน' },
      { word: 'water', hint: "ของเหลวใสๆ ที่เราดื่มทุกวัน", correctTranslation: 'น้ำ' },
      { word: 'house', hint: "ที่อยู่อาศัยของคนและครอบครัว", correctTranslation: 'บ้าน' },
      { word: 'car', hint: "ยานพาหนะสี่ล้อวิ่งบนถนน", correctTranslation: 'รถยนต์' },
      { word: 'sun', hint: "ดาวฤกษ์ที่ให้แสงสว่างและความอบอุ่นแก่โลก", correctTranslation: 'ดวงอาทิตย์' },
      { word: 'mother', hint: "ผู้หญิงที่เป็นพ่อแม่ของเรา ฝ่ายหญิง", correctTranslation: 'แม่' },
      { word: 'father', hint: "ผู้ชายที่เป็นพ่อแม่ของเรา ฝ่ายชาย", correctTranslation: 'พ่อ' },
      { word: 'brother', hint: "พี่หรือน้องที่เป็นผู้ชาย", correctTranslation: 'พี่ชาย' },
      { word: 'sister', hint: "พี่หรือน้องที่เป็นผู้หญิง", correctTranslation: 'พี่สาว' },
      { word: 'teacher', hint: "ผู้ที่สอนหนังสือให้นักเรียน", correctTranslation: 'ครู' },
      { word: 'student', hint: "ผู้ที่กำลังเรียนหนังสืออยู่", correctTranslation: 'นักเรียน' },
      { word: 'food', hint: "สิ่งที่เรากินเพื่อให้มีพลังงาน", correctTranslation: 'อาหาร' },
      { word: 'rice', hint: "ธัญพืชหลักที่คนเอเชียกินเป็นอาหารหลัก", correctTranslation: 'ข้าว' },
      { word: 'fish', hint: "สัตว์ที่อาศัยอยู่ในน้ำและว่ายน้ำได้", correctTranslation: 'ปลา' },
      { word: 'chicken', hint: "สัตว์ปีกที่นิยมนำมาทำอาหาร", correctTranslation: 'ไก่' },
      { word: 'egg', hint: "วัตถุรูปไข่ที่สัตว์ปีกออกมา", correctTranslation: 'ไข่' },
      { word: 'milk', hint: "ของเหลวสีขาวที่ได้จากวัว", correctTranslation: 'นม' },
      { word: 'bread', hint: "อาหารอบที่ทำจากแป้งสาลี", correctTranslation: 'ขนมปัง' },
      { word: 'vegetable', hint: "พืชที่เรากินเพื่อรับสารอาหาร", correctTranslation: 'ผัก' },
      { word: 'fruit', hint: "อาหารหวานที่เติบโตจากต้นไม้", correctTranslation: 'ผลไม้' },
      { word: 'orange', hint: "ผลไม้รสเปรี้ยวหวาน มีสีส้ม", correctTranslation: 'ส้ม' },
      { word: 'mango', hint: "ผลไม้เขตร้อนสีเหลืองส้ม", correctTranslation: 'มะม่วง' },
      { word: 'red', hint: "สีของเลือดและไฟ", correctTranslation: 'สีแดง' },
      { word: 'blue', hint: "สีของท้องฟ้าและมหาสมุทร", correctTranslation: 'สีน้ำเงิน' },
      { word: 'green', hint: "สีของใบไม้และหญ้า", correctTranslation: 'สีเขียว' },
      { word: 'yellow', hint: "สีของดวงอาทิตย์และกล้วย", correctTranslation: 'สีเหลือง' },
      { word: 'white', hint: "สีของหิมะและเมฆ", correctTranslation: 'สีขาว' },
      { word: 'black', hint: "สีที่มืดที่สุด ตรงข้ามกับสีขาว", correctTranslation: 'สีดำ' },
      { word: 'hand', hint: "อวัยวะที่อยู่ปลายแขน ใช้จับสิ่งของ", correctTranslation: 'มือ' },
      { word: 'foot', hint: "อวัยวะที่อยู่ปลายขา ใช้เดิน", correctTranslation: 'เท้า' },
      { word: 'eye', hint: "อวัยวะที่ใช้มองดูสิ่งต่างๆ", correctTranslation: 'ตา' },
      { word: 'nose', hint: "อวัยวะที่ใช้ดมกลิ่น", correctTranslation: 'จมูก' },
      { word: 'mouth', hint: "อวัยวะที่ใช้กินอาหารและพูด", correctTranslation: 'ปาก' },
      { word: 'big', hint: "มีขนาดใหญ่ ตรงข้ามกับเล็ก", correctTranslation: 'ใหญ่' },
      { word: 'small', hint: "มีขนาดเล็ก ตรงข้ามกับใหญ่", correctTranslation: 'เล็ก' },
      { word: 'hot', hint: "มีอุณหภูมิสูง ตรงข้ามกับเย็น", correctTranslation: 'ร้อน' },
      { word: 'cold', hint: "มีอุณหภูมิต่ำ ตรงข้ามกับร้อน", correctTranslation: 'เย็น' },
      { word: 'fast', hint: "เคลื่อนที่ด้วยความเร็วสูง", correctTranslation: 'เร็ว' },
      { word: 'slow', hint: "เคลื่อนที่ช้า ไม่รวดเร็ว", correctTranslation: 'ช้า' },
      { word: 'good', hint: "มีคุณภาพสูงหรือมีความดีงาม", correctTranslation: 'ดี' },
      { word: 'beautiful', hint: "งดงาม น่าพอใจเมื่อมองดู", correctTranslation: 'สวย' },
      { word: 'old', hint: "มีอายุมากหรืออยู่มานาน", correctTranslation: 'เก่า' },
      { word: 'new', hint: "เพิ่งสร้างหรือค้นพบใหม่ๆ", correctTranslation: 'ใหม่' },
      { word: 'sleep', hint: "พักผ่อนโดยหลับตาในตอนกลางคืน", correctTranslation: 'นอน' },
      { word: 'eat', hint: "นำอาหารเข้าปากและกลืน", correctTranslation: 'กิน' },
    ],
  },

  Intermediate: {
    'th-en': [
      { word: 'โอกาส', hint: "A time or circumstance that makes something possible. (o_______ity)", correctTranslation: 'opportunity' },
      { word: 'ความรับผิดชอบ', hint: "A duty or obligation you must carry out. (r____________ity)", correctTranslation: 'responsibility' },
      { word: 'ท้าทาย', hint: "Something that tests your ability and determination. (c_______ge)", correctTranslation: 'challenge' },
      { word: 'ประสบความสำเร็จ', hint: "To achieve your aim or purpose. (s______d)", correctTranslation: 'succeed' },
      { word: 'พัฒนา', hint: "To grow and improve over time. (d_____op)", correctTranslation: 'develop' },
      { word: 'อธิบาย', hint: "To make something clear by describing it. (e____in)", correctTranslation: 'explain' },
      { word: 'ข้อมูล', hint: "Facts and data about a subject. (i__________on)", correctTranslation: 'information' },
      { word: 'เทคโนโลยี', hint: "The application of science for practical use. (t________gy)", correctTranslation: 'technology' },
      { word: 'สิ่งแวดล้อม', hint: "The natural world surrounding living things. (e_________nt)", correctTranslation: 'environment' },
      { word: 'การศึกษา', hint: "The process of learning through study. (e_______on)", correctTranslation: 'education' },
      { word: 'ความรู้', hint: "Facts and understanding gained through experience. (k_______ge)", correctTranslation: 'knowledge' },
      { word: 'ประสบการณ์', hint: "Practical contact with real events or activities. (e_________ce)", correctTranslation: 'experience' },
      { word: 'ทักษะ', hint: "An ability to do something well. (s___l)", correctTranslation: 'skill' },
      { word: 'ความสามารถ', hint: "The power or capacity to do something. (a_____ty)", correctTranslation: 'ability' },
      { word: 'เป้าหมาย', hint: "The result or achievement you aim for. (g__l)", correctTranslation: 'goal' },
      { word: 'แผนการ', hint: "A detailed proposal for doing something. (p__n)", correctTranslation: 'plan' },
      { word: 'แก้ปัญหา', hint: "To find an answer to a difficult problem. (s___e)", correctTranslation: 'solve' },
      { word: 'ตัดสินใจ', hint: "To make a choice or reach a conclusion. (d_____e)", correctTranslation: 'decide' },
      { word: 'ความคิด', hint: "A thought or original suggestion. (i__a)", correctTranslation: 'idea' },
      { word: 'สังคม', hint: "People living together in an organized community. (s_____ty)", correctTranslation: 'society' },
      { word: 'วัฒนธรรม', hint: "The customs, arts, and way of life of a group. (c_____re)", correctTranslation: 'culture' },
      { word: 'ประเพณี', hint: "A long-established custom or belief passed down. (t________on)", correctTranslation: 'tradition' },
      { word: 'เศรษฐกิจ', hint: "The system of trade, industry, and production. (e_____my)", correctTranslation: 'economy' },
      { word: 'การเมือง', hint: "Activities related to governing a country. (p_____cs)", correctTranslation: 'politics' },
      { word: 'สุขภาพ', hint: "The state of being free from illness or injury. (h___th)", correctTranslation: 'health' },
      { word: 'โรงพยาบาล', hint: "A place where sick or injured people receive treatment. (h_______al)", correctTranslation: 'hospital' },
      { word: 'แพทย์', hint: "A person qualified to practice medicine. (d___or)", correctTranslation: 'doctor' },
      { word: 'พยาบาล', hint: "A person trained to care for sick or injured people. (n____e)", correctTranslation: 'nurse' },
      { word: 'ยา', hint: "A substance used to treat illness or pain. (m_______ne)", correctTranslation: 'medicine' },
      { word: 'อาชีพ', hint: "A long-term occupation or profession. (c____r)", correctTranslation: 'career' },
      { word: 'งาน', hint: "An activity done regularly in exchange for payment. (w__k)", correctTranslation: 'work' },
      { word: 'รายได้', hint: "Money received regularly from employment. (i_____e)", correctTranslation: 'income' },
      { word: 'บริษัท', hint: "A commercial business organization. (c_____ny)", correctTranslation: 'company' },
      { word: 'ลูกค้า', hint: "A person who buys goods or services. (c_______er)", correctTranslation: 'customer' },
      { word: 'สินค้า', hint: "An article or item that is offered for sale. (p_____ct)", correctTranslation: 'product' },
      { word: 'ราคา', hint: "The amount of money expected for something. (p___e)", correctTranslation: 'price' },
      { word: 'ตลาด', hint: "A place or system where goods are bought and sold. (m____t)", correctTranslation: 'market' },
      { word: 'ธรรมชาติ', hint: "The physical world including plants, animals, land. (n____e)", correctTranslation: 'nature' },
      { word: 'ป่าไม้', hint: "A large area of land covered with trees. (f____t)", correctTranslation: 'forest' },
      { word: 'ภูเขา', hint: "A large natural elevation of earth and rock. (m_______n)", correctTranslation: 'mountain' },
      { word: 'แม่น้ำ', hint: "A large natural stream of water flowing to the sea. (r____r)", correctTranslation: 'river' },
      { word: 'ทะเล', hint: "The vast expanse of salt water. (s__)", correctTranslation: 'sea' },
      { word: 'สัตว์ป่า', hint: "Animals living in their natural habitat. (w_____fe)", correctTranslation: 'wildlife' },
      { word: 'มลพิษ', hint: "Contamination of the natural environment. (p_______on)", correctTranslation: 'pollution' },
      { word: 'พลังงาน', hint: "The capacity to do work or cause change. (e_____gy)", correctTranslation: 'energy' },
      { word: 'ความยุติธรรม', hint: "Being fair and reasonable in judgements. (j_____ce)", correctTranslation: 'justice' },
      { word: 'ความปลอดภัย', hint: "The condition of being protected from harm. (s____ty)", correctTranslation: 'safety' },
      { word: 'รัฐบาล', hint: "The group with authority to govern a country. (g________nt)", correctTranslation: 'government' },
      { word: 'กฎหมาย', hint: "A system of rules recognized by a country. (l_w)", correctTranslation: 'law' },
      { word: 'ชุมชน', hint: "A group of people living in the same area. (c_______ty)", correctTranslation: 'community' },
    ],
    'en-th': [
      { word: 'opportunity', hint: "ช่วงเวลาหรือสถานการณ์ที่เหมาะสมในการทำบางสิ่ง", correctTranslation: 'โอกาส' },
      { word: 'responsibility', hint: "หน้าที่หรือภาระที่ต้องรับผิดชอบดูแล", correctTranslation: 'ความรับผิดชอบ' },
      { word: 'challenge', hint: "สิ่งที่ท้าทายความสามารถและต้องใช้ความพยายาม", correctTranslation: 'ท้าทาย' },
      { word: 'succeed', hint: "การทำเป้าหมายหรือสิ่งที่ตั้งใจได้สำเร็จ", correctTranslation: 'ประสบความสำเร็จ' },
      { word: 'develop', hint: "การพัฒนาหรือเติบโตขึ้นอย่างต่อเนื่อง", correctTranslation: 'พัฒนา' },
      { word: 'explain', hint: "อธิบายให้เข้าใจชัดเจนยิ่งขึ้น", correctTranslation: 'อธิบาย' },
      { word: 'information', hint: "ข้อมูลหรือข้อเท็จจริงที่ให้ความรู้", correctTranslation: 'ข้อมูล' },
      { word: 'technology', hint: "วิทยาการและนวัตกรรมสมัยใหม่ที่ช่วยอำนวยความสะดวก", correctTranslation: 'เทคโนโลยี' },
      { word: 'environment', hint: "สิ่งแวดล้อมและธรรมชาติรอบตัวเรา", correctTranslation: 'สิ่งแวดล้อม' },
      { word: 'education', hint: "กระบวนการเรียนรู้หรือการให้ความรู้อย่างเป็นระบบ", correctTranslation: 'การศึกษา' },
      { word: 'knowledge', hint: "ความรู้ที่ได้จากการเรียนและประสบการณ์", correctTranslation: 'ความรู้' },
      { word: 'experience', hint: "สิ่งที่ได้สัมผัสหรือเรียนรู้จากการปฏิบัติจริง", correctTranslation: 'ประสบการณ์' },
      { word: 'skill', hint: "ความสามารถพิเศษที่ฝึกฝนจนชำนาญ", correctTranslation: 'ทักษะ' },
      { word: 'ability', hint: "สมรรถภาพหรือความสามารถในการทำสิ่งหนึ่ง", correctTranslation: 'ความสามารถ' },
      { word: 'goal', hint: "เป้าหมายหรือสิ่งที่ต้องการบรรลุ", correctTranslation: 'เป้าหมาย' },
      { word: 'plan', hint: "แผนงานหรือวิธีการที่วางไว้ล่วงหน้า", correctTranslation: 'แผนการ' },
      { word: 'solve', hint: "หาคำตอบหรือแก้ไขปัญหา", correctTranslation: 'แก้ปัญหา' },
      { word: 'decide', hint: "เลือกหรือตัดสินใจในเรื่องหนึ่งๆ", correctTranslation: 'ตัดสินใจ' },
      { word: 'idea', hint: "ความคิดหรือข้อเสนอแนะใหม่", correctTranslation: 'ความคิด' },
      { word: 'society', hint: "กลุ่มคนที่อยู่ร่วมกันในชุมชนที่มีระเบียบ", correctTranslation: 'สังคม' },
      { word: 'culture', hint: "ขนบธรรมเนียมและวิถีชีวิตของกลุ่มคน", correctTranslation: 'วัฒนธรรม' },
      { word: 'tradition', hint: "ประเพณีหรือความเชื่อที่สืบทอดมาแต่โบราณ", correctTranslation: 'ประเพณี' },
      { word: 'economy', hint: "ระบบการค้าและอุตสาหกรรมของประเทศ", correctTranslation: 'เศรษฐกิจ' },
      { word: 'politics', hint: "กิจกรรมที่เกี่ยวกับการปกครองและอำนาจรัฐ", correctTranslation: 'การเมือง' },
      { word: 'health', hint: "สภาวะที่ปราศจากโรคภัยไข้เจ็บ", correctTranslation: 'สุขภาพ' },
      { word: 'hospital', hint: "สถานที่รักษาผู้ป่วยและผู้บาดเจ็บ", correctTranslation: 'โรงพยาบาล' },
      { word: 'doctor', hint: "ผู้ที่มีวุฒิในการรักษาโรค", correctTranslation: 'แพทย์' },
      { word: 'nurse', hint: "ผู้ดูแลและพยาบาลผู้ป่วยในโรงพยาบาล", correctTranslation: 'พยาบาล' },
      { word: 'medicine', hint: "สารที่ใช้รักษาโรคหรือบรรเทาอาการป่วย", correctTranslation: 'ยา' },
      { word: 'career', hint: "อาชีพหรือเส้นทางการทำงานระยะยาว", correctTranslation: 'อาชีพ' },
      { word: 'work', hint: "กิจกรรมที่ทำเป็นประจำเพื่อหารายได้", correctTranslation: 'งาน' },
      { word: 'income', hint: "เงินที่ได้รับจากการทำงานหรือธุรกิจ", correctTranslation: 'รายได้' },
      { word: 'company', hint: "องค์กรธุรกิจที่ก่อตั้งขึ้น", correctTranslation: 'บริษัท' },
      { word: 'customer', hint: "ผู้ที่ซื้อสินค้าหรือใช้บริการ", correctTranslation: 'ลูกค้า' },
      { word: 'product', hint: "สิ่งของหรือบริการที่ผลิตเพื่อขาย", correctTranslation: 'สินค้า' },
      { word: 'price', hint: "จำนวนเงินที่ต้องจ่ายเพื่อซื้อสิ่งของ", correctTranslation: 'ราคา' },
      { word: 'market', hint: "สถานที่หรือระบบที่ใช้ซื้อขายสินค้า", correctTranslation: 'ตลาด' },
      { word: 'nature', hint: "โลกธรรมชาติรวมถึงพืช สัตว์ และภูมิประเทศ", correctTranslation: 'ธรรมชาติ' },
      { word: 'forest', hint: "พื้นที่ขนาดใหญ่ที่ปกคลุมด้วยต้นไม้", correctTranslation: 'ป่าไม้' },
      { word: 'mountain', hint: "ภูมิประเทศสูงชันตามธรรมชาติ", correctTranslation: 'ภูเขา' },
      { word: 'river', hint: "กระแสน้ำธรรมชาติขนาดใหญ่ที่ไหลสู่ทะเล", correctTranslation: 'แม่น้ำ' },
      { word: 'sea', hint: "น้ำเค็มกว้างใหญ่ที่ปกคลุมพื้นโลก", correctTranslation: 'ทะเล' },
      { word: 'wildlife', hint: "สัตว์ที่ดำรงชีวิตในธรรมชาติอย่างอิสระ", correctTranslation: 'สัตว์ป่า' },
      { word: 'pollution', hint: "การปนเปื้อนสิ่งแวดล้อมจากสารพิษหรือของเสีย", correctTranslation: 'มลพิษ' },
      { word: 'energy', hint: "พลังงานที่ใช้ขับเคลื่อนเครื่องจักรและชีวิต", correctTranslation: 'พลังงาน' },
      { word: 'justice', hint: "ความยุติธรรมและการปฏิบัติอย่างเป็นธรรม", correctTranslation: 'ความยุติธรรม' },
      { word: 'safety', hint: "สภาวะที่ปลอดภัยจากอันตราย", correctTranslation: 'ความปลอดภัย' },
      { word: 'government', hint: "กลุ่มบุคคลที่มีอำนาจปกครองประเทศ", correctTranslation: 'รัฐบาล' },
      { word: 'law', hint: "ระบบกฎระเบียบที่สังคมหรือประเทศยอมรับ", correctTranslation: 'กฎหมาย' },
      { word: 'community', hint: "กลุ่มคนที่อาศัยอยู่ในพื้นที่เดียวกัน", correctTranslation: 'ชุมชน' },
    ],
  },

  Advanced: {
    'th-en': [
      { word: 'ความเข้าใจผิด', hint: "A failure to understand something correctly. (m___________ing)", correctTranslation: 'misunderstanding' },
      { word: 'ความกระตือรือร้น', hint: "Intense eagerness and lively interest. (e________sm)", correctTranslation: 'enthusiasm' },
      { word: 'ความหลากหลาย', hint: "A range of many different things or people. (d______ity)", correctTranslation: 'diversity' },
      { word: 'ความยั่งยืน', hint: "The ability to be maintained over the long term. (s_____________ity)", correctTranslation: 'sustainability' },
      { word: 'หลีกเลี่ยงไม่ได้', hint: "Certain to happen and cannot be avoided. (i________ble)", correctTranslation: 'inevitable' },
      { word: 'มีอิทธิพล', hint: "The power to affect others' actions or thinking. (i________ce)", correctTranslation: 'influence' },
      { word: 'การทำงานร่วมกัน', hint: "Working jointly with others to achieve something. (c____________on)", correctTranslation: 'collaboration' },
      { word: 'ความขัดแย้ง', hint: "A serious disagreement or argument between parties. (c_____ct)", correctTranslation: 'conflict' },
      { word: 'จริยธรรม', hint: "Moral principles that govern a person's behavior. (e___cs)", correctTranslation: 'ethics' },
      { word: 'ประเมินค่า', hint: "To judge or assess the value or quality of something. (e______te)", correctTranslation: 'evaluate' },
      { word: 'นวัตกรรม', hint: "The process of introducing new ideas or inventions. (i_______ion)", correctTranslation: 'innovation' },
      { word: 'ความซับซ้อน', hint: "The state of being intricate and hard to understand. (c_______ity)", correctTranslation: 'complexity' },
      { word: 'แนวคิด', hint: "An abstract idea or guiding principle. (c_____pt)", correctTranslation: 'concept' },
      { word: 'ทฤษฎี', hint: "A system of ideas explaining something, based on evidence. (t_____y)", correctTranslation: 'theory' },
      { word: 'การวิจัย', hint: "A systematic investigation to discover new facts. (r______ch)", correctTranslation: 'research' },
      { word: 'สมมติฐาน', hint: "A proposed explanation made as a starting point. (h_______sis)", correctTranslation: 'hypothesis' },
      { word: 'การวิเคราะห์', hint: "Detailed examination of elements or structure. (a______is)", correctTranslation: 'analysis' },
      { word: 'วิพากษ์วิจารณ์', hint: "To point out faults or express disapproval. (c_______ze)", correctTranslation: 'criticize' },
      { word: 'ปรัชญา', hint: "The study of fundamental questions about existence. (p_______phy)", correctTranslation: 'philosophy' },
      { word: 'มนุษยชาติ', hint: "Human beings considered collectively. (h_______ty)", correctTranslation: 'humanity' },
      { word: 'อารยธรรม', hint: "The stage of development of human society with complex culture. (c__________on)", correctTranslation: 'civilization' },
      { word: 'ประชาธิปไตย', hint: "A system of government by elected representatives. (d_______cy)", correctTranslation: 'democracy' },
      { word: 'ความโปร่งใส', hint: "Open and honest dealings without hidden agendas. (t___________cy)", correctTranslation: 'transparency' },
      { word: 'วิกฤต', hint: "A time of intense difficulty or great danger. (c___is)", correctTranslation: 'crisis' },
      { word: 'ความยืดหยุ่น', hint: "The capacity to recover quickly from difficulties. (r_______ce)", correctTranslation: 'resilience' },
      { word: 'กลยุทธ์', hint: "A plan of action designed to achieve a long-term goal. (s_______gy)", correctTranslation: 'strategy' },
      { word: 'การปฏิรูป', hint: "Making changes to improve a system or institution. (r____m)", correctTranslation: 'reform' },
      { word: 'ความเหลื่อมล้ำ', hint: "Lack of equality or fairness between groups. (i_______ity)", correctTranslation: 'inequality' },
      { word: 'โลกาภิวัตน์', hint: "The process of worldwide economic and cultural integration. (g__________on)", correctTranslation: 'globalization' },
      { word: 'การเจรจา', hint: "Discussion aimed at reaching an agreement. (n__________on)", correctTranslation: 'negotiation' },
      { word: 'ปรากฏการณ์', hint: "A fact or occurrence that can be observed and studied. (p__________on)", correctTranslation: 'phenomenon' },
      { word: 'วิวัฒนาการ', hint: "The gradual development of something over a long period. (e________on)", correctTranslation: 'evolution' },
      { word: 'จิตวิทยา', hint: "The scientific study of the human mind and behavior. (p_______gy)", correctTranslation: 'psychology' },
      { word: 'สังคมวิทยา', hint: "The study of human social behavior and organization. (s________gy)", correctTranslation: 'sociology' },
      { word: 'มุมมอง', hint: "A particular way of thinking about or viewing something. (p_________ve)", correctTranslation: 'perspective' },
      { word: 'ข้อสรุป', hint: "A judgment or decision reached through reasoning. (c_______on)", correctTranslation: 'conclusion' },
      { word: 'ลักษณะเฉพาะ', hint: "A feature or quality typical of a person or thing. (c___________ic)", correctTranslation: 'characteristic' },
      { word: 'ความเป็นไปได้', hint: "The state or fact of being possible. (p________ity)", correctTranslation: 'possibility' },
      { word: 'การรับรู้', hint: "The ability to become aware of something through the senses. (p________on)", correctTranslation: 'perception' },
      { word: 'ความเชื่อมั่น', hint: "A feeling of self-assurance arising from your abilities. (c________ce)", correctTranslation: 'confidence' },
      { word: 'ศักยภาพ', hint: "Latent qualities or abilities that may be developed. (p_______al)", correctTranslation: 'potential' },
      { word: 'ความท้าทาย', hint: "A difficult situation requiring great effort to overcome. (a________ty)", correctTranslation: 'adversity' },
      { word: 'ความเป็นผู้นำ', hint: "The ability to guide, inspire, and lead others. (l________ip)", correctTranslation: 'leadership' },
      { word: 'ความคิดสร้างสรรค์', hint: "The ability to produce original and imaginative ideas. (c_______ity)", correctTranslation: 'creativity' },
      { word: 'การปรับตัว', hint: "The process of changing to suit new circumstances. (a________on)", correctTranslation: 'adaptation' },
      { word: 'ความอดทน', hint: "Continued effort and determination despite difficulty. (p__________ce)", correctTranslation: 'perseverance' },
      { word: 'ความชำนาญ', hint: "Expert skill or knowledge in a particular field. (e_______se)", correctTranslation: 'expertise' },
      { word: 'การบริหาร', hint: "The process of organizing and overseeing a business. (m________nt)", correctTranslation: 'management' },
      { word: 'ความน่าเชื่อถือ', hint: "The quality of being trusted, reliable, and believed. (c_________ity)", correctTranslation: 'credibility' },
      { word: 'เชิงกลยุทธ์', hint: "Relating to the planning of long-term goals. (s________ic)", correctTranslation: 'strategic' },
    ],
    'en-th': [
      { word: 'misunderstanding', hint: "การตีความหรือเข้าใจบางสิ่งผิดพลาด", correctTranslation: 'ความเข้าใจผิด' },
      { word: 'enthusiasm', hint: "ความกระตือรือร้นและแรงจูงใจที่เต็มเปี่ยม", correctTranslation: 'ความกระตือรือร้น' },
      { word: 'diversity', hint: "ความหลากหลายของผู้คน แนวคิด หรือสิ่งต่างๆ", correctTranslation: 'ความหลากหลาย' },
      { word: 'sustainability', hint: "ความสามารถในการดำเนินต่อไปอย่างยั่งยืนระยะยาว", correctTranslation: 'ความยั่งยืน' },
      { word: 'inevitable', hint: "สิ่งที่ไม่สามารถหลีกเลี่ยงได้ ต้องเกิดขึ้นแน่นอน", correctTranslation: 'หลีกเลี่ยงไม่ได้' },
      { word: 'influence', hint: "อำนาจในการส่งผลต่อความคิดหรือพฤติกรรมของผู้อื่น", correctTranslation: 'มีอิทธิพล' },
      { word: 'collaboration', hint: "การทำงานร่วมมือกันเพื่อบรรลุเป้าหมาย", correctTranslation: 'การทำงานร่วมกัน' },
      { word: 'conflict', hint: "ความขัดแย้งหรือการโต้แย้งอย่างรุนแรง", correctTranslation: 'ความขัดแย้ง' },
      { word: 'ethics', hint: "หลักจริยธรรมและศีลธรรมที่ควบคุมพฤติกรรม", correctTranslation: 'จริยธรรม' },
      { word: 'evaluate', hint: "ประเมินคุณค่าหรือคุณภาพของบางสิ่งอย่างมีระบบ", correctTranslation: 'ประเมินค่า' },
      { word: 'innovation', hint: "การนำแนวคิดหรือสิ่งประดิษฐ์ใหม่ๆ มาใช้", correctTranslation: 'นวัตกรรม' },
      { word: 'complexity', hint: "ความซับซ้อนและความยุ่งยากของบางสิ่ง", correctTranslation: 'ความซับซ้อน' },
      { word: 'concept', hint: "แนวคิดหรือหลักการที่เป็นนามธรรม", correctTranslation: 'แนวคิด' },
      { word: 'theory', hint: "ระบบแนวคิดที่อธิบายปรากฏการณ์โดยอาศัยหลักฐาน", correctTranslation: 'ทฤษฎี' },
      { word: 'research', hint: "การศึกษาค้นคว้าอย่างเป็นระบบเพื่อค้นหาข้อเท็จจริง", correctTranslation: 'การวิจัย' },
      { word: 'hypothesis', hint: "ข้อสมมติที่ตั้งขึ้นเพื่อรอการพิสูจน์", correctTranslation: 'สมมติฐาน' },
      { word: 'analysis', hint: "การตรวจสอบองค์ประกอบอย่างละเอียดถี่ถ้วน", correctTranslation: 'การวิเคราะห์' },
      { word: 'criticize', hint: "ชี้ข้อบกพร่องหรือแสดงความไม่เห็นด้วย", correctTranslation: 'วิพากษ์วิจารณ์' },
      { word: 'philosophy', hint: "ปรัชญาหรือการศึกษาคำถามพื้นฐานเกี่ยวกับชีวิต", correctTranslation: 'ปรัชญา' },
      { word: 'humanity', hint: "มนุษยชาติหรือมวลมนุษย์ทั้งหมด", correctTranslation: 'มนุษยชาติ' },
      { word: 'civilization', hint: "อารยธรรมหรือขั้นพัฒนาการขั้นสูงของสังคมมนุษย์", correctTranslation: 'อารยธรรม' },
      { word: 'democracy', hint: "ระบบการปกครองแบบประชาธิปไตยที่ประชาชนมีส่วนร่วม", correctTranslation: 'ประชาธิปไตย' },
      { word: 'transparency', hint: "ความโปร่งใสและเปิดเผยในการกระทำและการตัดสินใจ", correctTranslation: 'ความโปร่งใส' },
      { word: 'crisis', hint: "วิกฤตการณ์หรือสถานการณ์ที่ยากลำบากอย่างยิ่ง", correctTranslation: 'วิกฤต' },
      { word: 'resilience', hint: "ความสามารถในการฟื้นตัวจากความยากลำบาก", correctTranslation: 'ความยืดหยุ่น' },
      { word: 'strategy', hint: "กลยุทธ์หรือแผนการระยะยาวเพื่อบรรลุเป้าหมาย", correctTranslation: 'กลยุทธ์' },
      { word: 'reform', hint: "การปฏิรูปหรือเปลี่ยนแปลงระบบเพื่อปรับปรุงให้ดีขึ้น", correctTranslation: 'การปฏิรูป' },
      { word: 'inequality', hint: "ความไม่เท่าเทียมหรือความเหลื่อมล้ำระหว่างกลุ่มคน", correctTranslation: 'ความเหลื่อมล้ำ' },
      { word: 'globalization', hint: "กระบวนการบูรณาการเศรษฐกิจและวัฒนธรรมของโลก", correctTranslation: 'โลกาภิวัตน์' },
      { word: 'negotiation', hint: "การเจรจาต่อรองเพื่อบรรลุข้อตกลง", correctTranslation: 'การเจรจา' },
      { word: 'phenomenon', hint: "ปรากฏการณ์ที่สามารถสังเกตและศึกษาได้", correctTranslation: 'ปรากฏการณ์' },
      { word: 'evolution', hint: "วิวัฒนาการหรือการพัฒนาอย่างค่อยเป็นค่อยไป", correctTranslation: 'วิวัฒนาการ' },
      { word: 'psychology', hint: "จิตวิทยาหรือการศึกษาพฤติกรรมและจิตใจมนุษย์", correctTranslation: 'จิตวิทยา' },
      { word: 'sociology', hint: "สังคมวิทยาหรือการศึกษาพฤติกรรมทางสังคมของมนุษย์", correctTranslation: 'สังคมวิทยา' },
      { word: 'perspective', hint: "มุมมองหรือแนวทางในการคิดและตีความ", correctTranslation: 'มุมมอง' },
      { word: 'conclusion', hint: "ข้อสรุปหรือผลลัพธ์จากการวิเคราะห์และใช้เหตุผล", correctTranslation: 'ข้อสรุป' },
      { word: 'characteristic', hint: "ลักษณะเฉพาะหรือคุณสมบัติที่โดดเด่นของบางสิ่ง", correctTranslation: 'ลักษณะเฉพาะ' },
      { word: 'possibility', hint: "ความเป็นไปได้ที่บางสิ่งจะเกิดขึ้น", correctTranslation: 'ความเป็นไปได้' },
      { word: 'perception', hint: "การรับรู้หรือการตีความสิ่งที่ประสาทสัมผัสรับรู้", correctTranslation: 'การรับรู้' },
      { word: 'confidence', hint: "ความมั่นใจในตนเองและความสามารถของตน", correctTranslation: 'ความเชื่อมั่น' },
      { word: 'potential', hint: "ศักยภาพหรือความสามารถที่ยังไม่ได้พัฒนาเต็มที่", correctTranslation: 'ศักยภาพ' },
      { word: 'adversity', hint: "สภาวะยากลำบากหรือความทุกข์ยากที่ต้องเผชิญ", correctTranslation: 'ความท้าทาย' },
      { word: 'leadership', hint: "ความเป็นผู้นำและความสามารถในการนำและสร้างแรงบันดาลใจ", correctTranslation: 'ความเป็นผู้นำ' },
      { word: 'creativity', hint: "ความคิดสร้างสรรค์และจินตนาการในการสร้างสิ่งใหม่", correctTranslation: 'ความคิดสร้างสรรค์' },
      { word: 'adaptation', hint: "การปรับตัวให้เข้ากับสถานการณ์หรือสิ่งแวดล้อมใหม่", correctTranslation: 'การปรับตัว' },
      { word: 'perseverance', hint: "ความอดทนและความมุ่งมั่นแม้เผชิญกับอุปสรรค", correctTranslation: 'ความอดทน' },
      { word: 'expertise', hint: "ความเชี่ยวชาญหรือทักษะขั้นสูงในสาขาใดสาขาหนึ่ง", correctTranslation: 'ความชำนาญ' },
      { word: 'management', hint: "การบริหารจัดการองค์กรหรือทรัพยากรอย่างมีประสิทธิภาพ", correctTranslation: 'การบริหาร' },
      { word: 'credibility', hint: "ความน่าเชื่อถือและความไว้วางใจที่ผู้อื่นมีต่อคุณ", correctTranslation: 'ความน่าเชื่อถือ' },
      { word: 'strategic', hint: "เกี่ยวกับการวางแผนระยะยาวเพื่อบรรลุเป้าหมายสำคัญ", correctTranslation: 'เชิงกลยุทธ์' },
    ],
  },
};

/**
 * Generates a random vocabulary word/phrase matching the user's level.
 * @param {string} level - 'Beginner' | 'Intermediate' | 'Advanced'
 * @param {string} direction - 'th-en' | 'en-th'
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
  In this case "correctTranslation" must be the English translation of that Thai word.
- If direction is 'en-th', the "word" must be in ENGLISH, and the student will be asked to translate it to Thai.
  In this case "correctTranslation" must be the Thai translation of that English word.

Provide a short "hint" (definition or context clue, NOT the direct answer) to help the student.

Return ONLY a JSON object in this exact format:
{
  "word": "string",
  "hint": "string",
  "correctTranslation": "string"
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
 * Reads the correctTranslation field directly from the matching entry.
 */
function findLocalTranslation(originalWord, direction) {
  const cleanOriginal = originalWord.toLowerCase().trim();
  for (const level of ['Beginner', 'Intermediate', 'Advanced']) {
    const list = LOCAL_FALLBACKS[level]?.[direction] || [];
    const entry = list.find(item => item.word.toLowerCase().trim() === cleanOriginal);
    if (entry?.correctTranslation) {
      return entry.correctTranslation;
    }
  }
  return null;
}

/**
 * Uses the MyMemory free translation API as a fallback.
 * Free: 5,000 chars/day (anonymous) or 50,000 chars/day (with MYMEMORY_EMAIL env var).
 * Docs: https://mymemory.translated.net/doc/spec.php
 */
async function getMyMemoryTranslation(word, direction) {
  try {
    const langpair = direction === 'th-en' ? 'th|en' : 'en|th';
    const email = process.env.MYMEMORY_EMAIL || '';

    const params = new URLSearchParams({ q: word, langpair });
    if (email) params.set('de', email);

    const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });

    if (!res.ok) return null;

    const data = await res.json();

    if (data.responseStatus === 200 && data.responseData?.translatedText) {
      const translated = data.responseData.translatedText.trim();
      // Reject if translation is the same as input, or an API error message
      if (
        translated &&
        translated.toLowerCase() !== word.toLowerCase() &&
        !translated.toUpperCase().includes('PLEASE SELECT') &&
        !translated.toUpperCase().includes('MYMEMORY WARNING') &&
        !translated.toUpperCase().includes('YOU USED ALL AVAILABLE')
      ) {
        return translated;
      }
    }
    return null;
  } catch (error) {
    console.error('MyMemory API error:', error.message);
    return null;
  }
}

/**
 * Checks the user's translation for a vocabulary word.
 * Fallback chain: Gemini API → knownTranslation → local dict → MyMemory API
 *
 * @param {string} originalWord       - The word shown to the student
 * @param {string} userTranslation    - The student's translation attempt
 * @param {string} direction          - 'th-en' or 'en-th'
 * @param {string|null} knownTranslation - Pre-fetched correct translation (from word generation)
 */
export async function checkPracticeTranslation(originalWord, userTranslation, direction, knownTranslation = null) {
  // Helper to grade locally against a known target translation
  const gradeLocally = (targetTranslation, note = '') => {
    const cleanUser = userTranslation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    const cleanTarget = targetTranslation.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    const isCorrect = cleanUser === cleanTarget;
    return {
      isCorrect,
      feedback: isCorrect
        ? `ถูกต้องแล้วครับ! "${userTranslation}" เป็นคำแปลที่ถูกต้องของ "${originalWord}"${note}`
        : `คำแปลยังไม่ถูกต้องครับ ลองใหม่อีกครั้งนะ${note}`,
      correctTranslation: targetTranslation,
    };
  };

  // --- No API key: use knownTranslation → local dict (no MyMemory call) ---
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    const target = knownTranslation || findLocalTranslation(originalWord, direction) || originalWord;
    return gradeLocally(target);
  }

  // --- Gemini API available: try primary check ---
  const prompt = `
Evaluate the translation.
Original word/phrase: "${originalWord}"
User's translation: "${userTranslation}"
Direction: "${direction}" (if 'th-en', they translated Thai to English. If 'en-th', they translated English to Thai).

You must be flexible! Accept synonyms and natural phrasing. Ignore minor punctuation or capitalization differences.

Return a JSON object in this exact format:
{
  "isCorrect": boolean,
  "feedback": "A short, encouraging explanation written in Thai language (ภาษาไทย) explaining why it is correct or incorrect, pointing out any minor spelling issues or alternative correct answers. Always use the polite particle 'ครับ' and NEVER use 'ค่ะ' or 'ครับ/ค่ะ' under any circumstances.",
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
    const isRateLimit = msg.includes('429') || msg.includes('Quota') || msg.includes('quota');
    const note = isRateLimit
      ? ' (ระบบตรวจอัตโนมัติ เนื่องจาก API ถึงขีดจำกัดชั่วคราวครับ)'
      : ' (ระบบตรวจอัตโนมัติ เนื่องจาก AI ขัดข้องชั่วคราวครับ)';

    // Fallback tier 1: knownTranslation (pre-fetched at word generation time)
    if (knownTranslation) {
      return gradeLocally(knownTranslation, note);
    }

    // Fallback tier 2: local dictionary lookup
    const localMatch = findLocalTranslation(originalWord, direction);
    if (localMatch) {
      return gradeLocally(localMatch, note);
    }

    // Fallback tier 3: MyMemory free translation API
    console.log('Attempting MyMemory fallback for:', originalWord);
    const myMemoryResult = await getMyMemoryTranslation(originalWord, direction);
    if (myMemoryResult) {
      return gradeLocally(myMemoryResult, note + ' (ใช้ MyMemory API ช่วยตรวจครับ)');
    }

    // All fallbacks exhausted — cannot grade
    return {
      isCorrect: null,
      feedback: `ขออภัยครับ ระบบไม่สามารถตรวจคำแปลได้ในขณะนี้ เนื่องจาก AI API ใช้งานไม่ได้ชั่วคราวครับ กรุณาลองใหม่อีกครั้ง`,
      correctTranslation: null,
    };
  }
}
