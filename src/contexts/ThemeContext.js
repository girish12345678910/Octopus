import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('dark');
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('oroom-theme') || 'dark';
    const savedSound = localStorage.getItem('oroom-sound') !== 'false';
    setTheme(savedTheme);
    setSoundEnabled(savedSound);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('oroom-theme', newTheme);
  };

  const toggleSound = () => {
    const newSoundSetting = !soundEnabled;
    setSoundEnabled(newSoundSetting);
    localStorage.setItem('oroom-sound', newSoundSetting.toString());
  };

  const playSound = (soundType) => {
    if (!soundEnabled) return;
    
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different sounds for different events
    switch (soundType) {
      case 'message':
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        break;
      case 'notification':
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        break;
      case 'error':
        oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
        break;
      default:
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
    }
    
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const value = {
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    playSound,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={theme}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};
