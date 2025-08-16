const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const port = 3000;

// Your Gemini API key
const API_KEY = process.env.API_KEY;

const genAI = new GoogleGenerativeAI(API_KEY);

// Use cors middleware to allow requests from your front-end
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// This is your AI Estimator route
app.post('/api/estimator', async (req, res) => {
    console.log('Request received for AI estimator.');
    
    try {
        const { chatHistory } = req.body;
        
        if (!chatHistory || chatHistory.length === 0) {
            return res.status(400).json({ text: "No chat history provided." });
        }

        // Initialize the model with the correct system instruction
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are a professional project estimator. Your task is to provide a precise cost estimate and a concise summary of the necessary design and development steps for a website project. Always provide a specific dollar amount or a price range, and do not use lists or bullet points. Be direct, professional, and keep the response under 100 words. When asked for a cost, give a cost. Do not evade the question.",
        });

        // Initialize chat with the full chat history
        const chat = model.startChat({
            history: chatHistory,
        });

        // The last message in the chat history is the user's new message
        const lastUserMessage = chatHistory[chatHistory.length - 1];
        
        if (!lastUserMessage || !lastUserMessage.parts || lastUserMessage.parts.length === 0) {
            return res.status(400).json({ text: "Invalid last message in chat history." });
        }
        
        // Send only the latest user message text to the API
        const result = await chat.sendMessage(lastUserMessage.parts[0].text);
        const response = await result.response;
        const aiText = response.text();

        res.json({ text: aiText });

    } catch (error) {
        console.error("Error communicating with Gemini API:", error);
        res.status(500).json({ text: "Sorry, I am unable to provide an estimate at this time. Please try again later." });
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);

});
