import { GoogleGenerativeAI } from '@google/generative-ai';

class GeminiService {
  constructor() {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.error('❌ Missing REACT_APP_GEMINI_API_KEY in environment variables');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash"
    });
  }

  async generateResponse(userMessage, context = '', roomTopic = '') {
    try {
      if (!this.model) {
        throw new Error('Gemini AI not properly initialized - check API key');
      }

      const systemPrompt = `You are a helpful AI assistant in an anonymous chat room called OROOM Enhanced. 
      
      Guidelines:
      - Keep responses engaging, friendly, and concise (under 150 words)
      - Be helpful and supportive
      - Respect anonymity - don't ask for personal information
      - Stay on topic when possible
      - Use emojis occasionally to be more expressive
      
      Room Context: ${roomTopic}
      Recent Context: ${context}
      
      User Message: "${userMessage}"
      
      Respond as the AI assistant:`;

      const result = await this.model.generateContent(systemPrompt);
      const response = await result.response;
      return response.text();
      
    } catch (error) {
      console.error('Gemini API error:', error);
      
      const fallbackResponses = [
        "I'm having trouble processing that right now. Could you try rephrasing? 🤔",
        "That's interesting! Tell me more about your thoughts on this.",
        "I see what you mean. What's your perspective on this topic?",
        "Great point! I'd love to hear more about your experience with this.",
        "That's a fascinating topic! What got you interested in this?"
      ];
      return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    }
  }

  shouldAIRespond(message, lastAIResponse) {
    const hasAIMention = /@(ai|assistant|bot)/i.test(message.content);
    const hasQuestion = /\?/.test(message.content);
    const timeSinceLastAI = lastAIResponse ? 
      (new Date() - new Date(lastAIResponse.timestamp)) / 1000 / 60 : 10;
    
    return hasAIMention || hasQuestion || (Math.random() < 0.3) || timeSinceLastAI > 5;
  }
}

export const geminiService = new GeminiService();
