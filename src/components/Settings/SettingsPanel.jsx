import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  SunIcon, 
  MoonIcon, 
  SpeakerWaveIcon, 
  SpeakerXMarkIcon,
  UserIcon,
  BellIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';

const SettingsPanel = ({ isOpen, onClose, currentUser, onUserUpdate }) => {
  const { theme, toggleTheme, soundEnabled, toggleSound, isDark } = useTheme();

  const handleUsernameChange = (newUsername) => {
    if (newUsername && newUsername.trim() !== currentUser.username) {
      onUserUpdate({ ...currentUser, username: newUsername.trim() });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className={`w-full max-w-md rounded-2xl border shadow-xl ${
              isDark 
                ? 'bg-gray-900 border-gray-700' 
                : 'bg-white border-gray-200'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
              <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Settings
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
              >
                <XMarkIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Profile Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <UserIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Profile
                  </h3>
                </div>
                
                <div>
                  <label className={`block text-sm font-medium mb-2 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Username
                  </label>
                  <input
                    type="text"
                    defaultValue={currentUser?.username}
                    onBlur={(e) => handleUsernameChange(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isDark 
                        ? 'bg-gray-800 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-300 text-gray-900'
                    }`}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              {/* Appearance Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {isDark ? (
                    <MoonIcon className="w-5 h-5 text-gray-400" />
                  ) : (
                    <SunIcon className="w-5 h-5 text-gray-600" />
                  )}
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Appearance
                  </h3>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Dark Mode
                  </span>
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isDark ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isDark ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Sound Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  {soundEnabled ? (
                    <SpeakerWaveIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  ) : (
                    <SpeakerXMarkIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  )}
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Sound
                  </h3>
                </div>

                <div className="flex items-center justify-between">
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sound Effects
                  </span>
                  <button
                    onClick={toggleSound}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      soundEnabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        soundEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Privacy Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <ShieldCheckIcon className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Privacy
                  </h3>
                </div>

                <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                  <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    Your conversations are anonymous and not linked to any personal information. 
                    Messages are moderated for safety.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <button
                onClick={onClose}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-xl transition-colors"
              >
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SettingsPanel;
