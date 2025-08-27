import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, UserIcon, PaperClipIcon } from '@heroicons/react/24/outline';

const MessageBubble = ({ message, isOwn, currentUser, onReaction, onReply }) => {
  const [showReactions, setShowReactions] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || {});

  const isAI = message.type === 'ai';
  const isSystem = message.type === 'system';
  const isFile = message.type === 'file';

  const quickReactions = ['❤️', '👍', '😂', '😮', '😢', '🔥'];

  // Enhanced user identification logic from previous fix
  const isUserMessage = isOwn || 
    message.userId === currentUser?.id || 
    message.userId === currentUser?.uid ||
    message.username === currentUser?.username;

  const handleReaction = (emoji) => {
    const newReactions = { ...reactions };
    const currentUserId = currentUser?.id || currentUser?.uid || 'current-user-id';

    if (newReactions[emoji]) {
      if (newReactions[emoji].includes(currentUserId)) {
        newReactions[emoji] = newReactions[emoji].filter(id => id !== currentUserId);
        if (newReactions[emoji].length === 0) {
          delete newReactions[emoji];
        }
      } else {
        newReactions[emoji].push(currentUserId);
      }
    } else {
      newReactions[emoji] = [currentUserId];
    }

    setReactions(newReactions);
    onReaction?.(message.id, newReactions);
    setShowReactions(false);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Now';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3 }}
      className={`group flex ${isUserMessage ? 'justify-end' : 'justify-start'} mb-4`}
      onMouseEnter={() => !isSystem && setShowReactions(true)}
      onMouseLeave={() => setShowReactions(false)}
    >
      <div className={`relative flex items-end space-x-2 max-w-xs lg:max-w-md ${
        isUserMessage ? 'flex-row-reverse space-x-reverse' : ''
      }`}>
        {/* Avatar */}
        {!isSystem && (
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
            isAI 
              ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
              : isUserMessage 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                : 'bg-gradient-to-r from-gray-600 to-gray-700'
          }`}>
            {isAI ? (
              <SparklesIcon className="w-4 h-4 text-white" />
            ) : (
              <UserIcon className="w-4 h-4 text-white" />
            )}
          </div>
        )}

        <div className="relative">
          {/* Message Content */}
          <div className={`px-4 py-2 rounded-2xl backdrop-blur-lg ${
            isSystem
              ? 'bg-gray-600/20 border border-gray-500/30 mx-auto'
              : isAI 
                ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30' 
                : isUserMessage
                  ? 'bg-gradient-to-r from-blue-600/20 to-indigo-600/20 border border-blue-500/30'
                  : 'bg-gray-700/40 border border-gray-600/30'
          } ${
            isUserMessage ? 'rounded-br-md' : 'rounded-bl-md'
          }`}>
            {/* Username */}
            {!isSystem && !isUserMessage && (
              <div className={`text-xs font-medium mb-1 ${
                isAI ? 'text-purple-300' : 'text-gray-300'
              }`}>
                {message.username}
              </div>
            )}
            
            {/* Message Text or File */}
            {isFile ? (
              <div className="space-y-2">
                {message.fileType?.startsWith('image/') ? (
                  <img 
                    src={message.fileUrl} 
                    alt={message.fileName}
                    className="max-w-xs rounded-lg"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <PaperClipIcon className="w-4 h-4" />
                    <a 
                      href={message.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {message.fileName}
                    </a>
                  </div>
                )}
                {message.content && (
                  <div className="text-white text-sm leading-relaxed">
                    {message.content}
                  </div>
                )}
              </div>
            ) : (
              <div className={`text-sm leading-relaxed ${
                isSystem ? 'text-gray-300 text-center' : 'text-white'
              }`}>
                {message.content}
              </div>
            )}
            
            {/* Timestamp */}
            <div className={`text-xs mt-1 opacity-75 ${
              isSystem ? 'text-center text-gray-500' : 'text-gray-400'
            }`}>
              {formatTime(message.timestamp || message.createdAt)}
            </div>

            {/* Pending indicator for optimistic updates */}
            {message.isPending && (
              <div className="text-xs text-gray-400 italic mt-1">
                Sending...
              </div>
            )}
          </div>

          {/* Reactions */}
          {Object.keys(reactions).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {Object.entries(reactions).map(([emoji, users]) => (
                <motion.button
                  key={emoji}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  onClick={() => handleReaction(emoji)}
                  className="flex items-center space-x-1 bg-gray-700/50 rounded-full px-2 py-1 text-xs hover:bg-gray-700/70 transition-colors"
                >
                  <span>{emoji}</span>
                  <span className="text-gray-300">{users.length}</span>
                </motion.button>
              ))}
            </div>
          )}

          {/* Quick Reactions (on hover) */}
          <AnimatePresence>
            {showReactions && !isSystem && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, y: 10 }}
                className={`absolute ${isUserMessage ? 'right-0' : 'left-0'} -top-12 bg-gray-800 border border-gray-600 rounded-full px-2 py-1 flex space-x-1 shadow-lg z-10`}
              >
                {quickReactions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(emoji)}
                    className="text-lg hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default MessageBubble;
