import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  ArrowLeftIcon, 
  UserGroupIcon,
  SparklesIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import MessageBubble from './MessageBubble';
import { firebaseService } from '../../services/firebaseService';
import { geminiService } from '../../services/geminiService';

const ChatRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  // ✅ Declare ALL state variables
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [roomUsers, setRoomUsers] = useState([]);
  const [isAITyping, setIsAITyping] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef();
  const unsubscribeUsersRef = useRef();
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize room with welcome messages
  useEffect(() => {
    if (!roomId || !currentUser) {
      console.error('Missing roomId or currentUser:', { roomId, currentUser });
      return;
    }

    // Add welcome messages
    const welcomeMessages = [
      {
        id: 1,
        content: `Welcome to room "${roomId}"! 🎉`,
        username: 'System',
        type: 'system',
        timestamp: new Date().toISOString()
      },
      {
        id: 2,
        content: `Hello ${currentUser?.username}! I'm here to help make your chat experience better. Feel free to ask me anything! ✨`,
        username: 'AI Assistant',
        type: 'ai',
        timestamp: new Date().toISOString()
      }
    ];
    
    setMessages(welcomeMessages);
  }, [roomId, currentUser]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    const messageText = message.trim();
    setMessage('');

    const newMessage = {
      id: Date.now(),
      content: messageText,
      username: currentUser?.username,
      userId: currentUser?.id,
      type: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);

    // Check if AI should respond
    const lastAIMessage = messages.filter(m => m.type === 'ai').pop();
    const shouldRespond = geminiService.shouldAIRespond({ content: messageText }, lastAIMessage);

    if (shouldRespond) {
      setIsAITyping(true);
      
      setTimeout(async () => {
        try {
          const recentMessages = messages.slice(-5).map(m => `${m.username}: ${m.content}`).join('\n');
          
          const aiResponse = await geminiService.generateResponse(
            messageText, 
            recentMessages,
            roomId
          );

          const aiMessage = {
            id: Date.now() + 1,
            content: aiResponse,
            username: 'AI Assistant',
            type: 'ai',
            timestamp: new Date().toISOString()
          };
          
          setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
          console.error('AI response error:', error);
        } finally {
          setIsAITyping(false);
        }
      }, 1000 + Math.random() * 2000);
    }

    toast.success('Message sent!');
  };

  // ✅ Add error boundary for missing props
  if (!roomId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Error: No Room ID</h1>
          <p>Please go back and select a room.</p>
          <button 
            onClick={onLeaveRoom}
            className="mt-4 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-colors"
          >
            Back to Landing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-lg border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onLeaveRoom}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <ArrowLeftIcon className="w-5 h-5 text-gray-400" />
            </button>
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            <div>
              <h1 className="text-xl font-bold text-white">{roomId}</h1>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  {roomUsers.length} online
                </span>
                {isAITyping && (
                  <div className="flex items-center space-x-1">
                    <SparklesIcon className="w-4 h-4 text-purple-400 animate-pulse" />
                    <span className="text-xs text-purple-400">AI typing...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">{currentUser?.username}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id}
                message={msg}
                isOwn={msg.userId === currentUser?.id}
              />
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-gray-700/50 p-4">
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message... (Press Enter to send, mention @ai for AI)"
              rows={1}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-2xl px-4 py-3 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none backdrop-blur-lg"
              maxLength={500}
            />
            <div className="absolute bottom-2 right-12 text-xs text-gray-500">
              {message.length}/500
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={!message.trim()}
            whileTap={{ scale: 0.95 }}
            whileHover={{ scale: 1.05 }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl p-3 transition-all duration-200 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-5 h-5" />
          </motion.button>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom;
