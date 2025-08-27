import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaceSmileIcon } from '@heroicons/react/24/outline';

const EmojiPicker = ({ onEmojiSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const emojiCategories = {
    'Smileys': ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪'],
    'Gestures': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐️', '🖖', '👋', '🤝', '👏', '🙌', '👐'],
    'Objects': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '⭐', '🌟', '✨', '⚡', '🔥'],
    'Nature': ['🌱', '🌿', '🍀', '🌺', '🌸', '🌼', '🌻', '🌹', '🥀', '🌷', '🌳', '🌲', '🌴', '🎋', '🎍', '🌾', '🌵', '🌊', '🌈', '☀️', '🌤️', '⛅', '🌦️', '🌧️']
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
      >
        <FaceSmileIcon className="w-5 h-5 text-gray-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute bottom-12 right-0 w-80 bg-gray-800 border border-gray-600 rounded-2xl p-4 shadow-xl z-50"
          >
            <div className="max-h-64 overflow-y-auto">
              {Object.entries(emojiCategories).map(([category, emojis]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">{category}</h3>
                  <div className="grid grid-cols-8 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          onEmojiSelect(emoji);
                          setIsOpen(false);
                        }}
                        className="text-xl hover:bg-gray-700 rounded p-1 transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EmojiPicker;
