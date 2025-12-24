require('dotenv').config({ path: 'server/.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) return console.log("No API Key");

    const genAI = new GoogleGenerativeAI(apiKey);

    // There isn't a direct "listModels" on the instance in some versions, 
    // but we can try to use the model manager if available, or just try a standard one.
    // Actually, looking at the docs/error, it seems I might need to just find the right string.
    // Let's try to verify if 'gemini-1.5-flash' works with a different call or just try 'gemini-1.0-pro'.

    // Instead of complex listing which might not be exposed easily in this lib version,
    // let's try a few common ones sequentially.

    const candidates = ["gemini-1.5-flash-latest", "gemini-1.0-pro", "gemini-pro-vision"];

    for (const name of candidates) {
        console.log(`\nTesting: ${name}`);
        try {
            const model = genAI.getGenerativeModel({ model: name });
            const result = await model.generateContent("Test");
            console.log(`✅ SUCCESS with ${name}`);
            return; // Found one!
        } catch (e) {
            console.log(`❌ Failed ${name}: ${e.message.split(':')[0]}`);
        }
    }
}

listModels();
