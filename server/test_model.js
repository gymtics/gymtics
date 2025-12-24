require('dotenv').config({ path: 'server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGenAI() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (!apiKey) {
        console.error('❌ No API Key found');
        return;
    }
    console.log(`✅ API Key found: ${apiKey.substring(0, 5)}...`);

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // List models
        const modelName = "gemini-flash-latest";
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Test");
        console.log(`✅ Success with ${modelName}`);
        console.log(result.response.text());
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testGenAI();
