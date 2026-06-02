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

    const chat = model.startChat({
      history: prevHistory,
    });

    const result = await chat.sendMessage(userMessage.parts[0].text);
    return result.response.text();
  } catch (error) {
    console.error("Error in getTeacherResponse:", error);
    return `Oh no! I encountered an error: ${error.message}. Please try again.`;
  }
}

/**
 * Generates a random vocabulary word/phrase matching the user's level.
 * @param {string} level - 'Beginner' | 'Intermediate' | 'Advanced'
 * @param {string} direction - 'th-en' (show Thai, translate to English) | 'en-th' (show English, translate to Thai)
 */
export async function generatePracticeWord(level = 'Beginner', direction = 'th-en') {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      word: direction === 'th-en' ? 'แมว' : 'cat',
      hint: 'A small domesticated carnivorous mammal.'
    };
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
    return JSON.parse(text);
  } catch (error) {
    console.error("Error in generatePracticeWord:", error);
    return {
      word: direction === 'th-en' ? 'สุนัข' : 'dog',
      hint: 'A common animal often kept as a pet.'
    };
  }
}

/**
 * Checks the user's translation for a vocabulary word.
 */
export async function checkPracticeTranslation(originalWord, userTranslation, direction) {
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    // Simple local fallback if API Key not set
    const isCorrect = userTranslation.toLowerCase().trim() === (originalWord.toLowerCase().trim() === 'cat' ? 'แมว' : 'cat');
    return {
      isCorrect,
      feedback: isCorrect ? 'Correct!' : 'Incorrect. Try again!',
      correctTranslation: originalWord.toLowerCase().trim() === 'cat' ? 'แมว' : 'cat'
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
    return {
      isCorrect: false,
      feedback: "Failed to grade translation via AI. Please try again.",
      correctTranslation: "Unknown"
    };
  }
}
