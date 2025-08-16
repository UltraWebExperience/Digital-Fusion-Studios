
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const port = process.env.PORT || 3000;

// Your Gemini API key is now configured to be read securely from Render's environment
const API_KEY = process.env.API_KEY; 

// This check is crucial for a successful deployment
if (!API_KEY) {
    console.error("API_KEY environment variable is not set. The server cannot connect to the Gemini API.");
    // In production, you might want to return an error page. For now, let the server start.
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Use cors middleware to allow requests from your front-end
app.use(cors());

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the root of the project
app.use(express.static(__dirname));

// This is your AI Estimator route
app.post('/api/estimator', async (req, res) => {
    console.log('Request received for AI estimator.');
    
    try {
        const { chatHistory } = req.body;
        
        if (!chatHistory || chatHistory.length === 0) {
            return res.status(400).json({ text: "No chat history provided." });
        }

        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            systemInstruction: "You are a professional project estimator. Your task is to provide a precise cost estimate and a concise summary of the necessary design and development steps for a website project. Always provide a specific dollar amount or a price range, and do not use lists or bullet points. Be direct, professional, and keep the response under 100 words. When asked for a cost, give a cost. Do not evade the question.",
        });

        const chat = model.startChat({
            history: chatHistory,
        });

        const lastUserMessage = chatHistory[chatHistory.length - 1];
        
        if (!lastUserMessage || !lastUserMessage.parts || lastUserMessage.parts.length === 0) {
            return res.status(400).json({ text: "Invalid last message in chat history." });
        }
        
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
