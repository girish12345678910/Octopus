import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChatBubbleLeftRightIcon, 
  SparklesIcon, 
  ShieldCheckIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

const LandingPage = ({ onEnterChat }) => {
  const [roomName, setRoomName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleEnterRoom = async () => {
    if (!roomName.trim()) return;
    
    setIsCreating(true);
    try {
      await onEnterChat(roomName);
    } finally {
      setIsCreating(false);
    }
  };

  const generateRandomRoom = () => {
    const adjectives = ['Swift', 'Bright', 'Cool', 'Epic', 'Zen'];
    const nouns = ['Space', 'Haven', 'Hub', 'Zone', 'Realm'];
    const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    setRoomName(`${randomAdj}${randomNoun}${Math.floor(Math.random() * 100)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-12"
        >
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <SparklesIcon className="w-6 h-6 text-yellow-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              OROOM
            </span>
            <span className="text-white"> Enhanced</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Connect anonymously, chat with AI, and engage in meaningful conversations in a safe, moderated environment.
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-8 mb-12"
        >
          {[
            {
              icon: ChatBubbleLeftRightIcon,
              title: 'Anonymous Chat',
              description: 'Chat freely without revealing your identity'
            },
            {
              icon: SparklesIcon,
              title: 'AI-Powered',
              description: 'Intelligent responses powered by Gemini AI'
            },
            {
              icon: ShieldCheckIcon,
              title: 'Safe & Moderated',
              description: 'Advanced moderation keeps conversations healthy'
            }
          ].map((feature, index) => (
            <div key={index} className="bg-black/20 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-6">
              <feature.icon className="w-8 h-8 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </motion.div>

        {/* Room Entry */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="bg-black/20 backdrop-blur-lg border border-gray-700/50 rounded-2xl p-8 max-w-md mx-auto mb-8"
        >
          <h2 className="text-2xl font-bold text-white mb-6">Enter a Room</h2>
          
          <div className="space-y-4">
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              placeholder="Enter room name..."
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={50}
            />
            
            <button
              onClick={generateRandomRoom}
              className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
            >
              Generate random room name
            </button>
            
            <motion.button
              onClick={handleEnterRoom}
              disabled={!roomName.trim() || isCreating}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-700 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isCreating ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Enter Room
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Popular Rooms Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto"
        >
          <motion.button
            onClick={() => onEnterChat('General')}
            className="p-4 bg-blue-600/10 border border-blue-500/30 rounded-xl hover:bg-blue-600/20 transition-colors"
          >
            <h3 className="font-bold text-blue-300">General Chat</h3>
            <p className="text-sm text-gray-400">Open discussion for everyone</p>
          </motion.button>
          
          <motion.button
            onClick={() => onEnterChat('Tech')}
            className="p-4 bg-green-600/10 border border-green-500/30 rounded-xl hover:bg-green-600/20 transition-colors"
          >
            <h3 className="font-bold text-green-300">Tech Talk</h3>
            <p className="text-sm text-gray-400">Discuss technology & coding</p>
          </motion.button>
          
          <motion.button
            onClick={() => onEnterChat('Random')}
            className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-xl hover:bg-purple-600/20 transition-colors"
          >
            <h3 className="font-bold text-purple-300">Random</h3>
            <p className="text-sm text-gray-400">Chat about anything</p>
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
