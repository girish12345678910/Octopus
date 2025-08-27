import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase/config';
import LandingPage from './components/LandingPage/LandingPage';
import ChatRoom from './components/ChatRoom/ChatRoom';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('loading'); // ✅ Add loading state
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true); // ✅ Auth loading state

  // ✅ Listen for auth state changes to restore session
  useEffect(() => {
    console.log('🔐 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ User authenticated:', user.uid);
        
        // Restore or create user profile
        const userProfile = {
          id: user.uid,
          username: localStorage.getItem('username') || `User ${user.uid.substring(0, 6)}`,
          color: localStorage.getItem('userColor') || `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
          createdAt: new Date().toISOString()
        };
        
        setCurrentUser(userProfile);
        
        // Restore room if user was in one
        const savedRoom = localStorage.getItem('currentRoom');
        if (savedRoom) {
          setCurrentRoom(savedRoom);
          setCurrentView('chat');
        } else {
          setCurrentView('landing');
        }
      } else {
        console.log('❌ No user authenticated');
        setCurrentUser(null);
        setCurrentRoom(null);
        setCurrentView('landing');
        
        // Clear saved data
        localStorage.removeItem('currentRoom');
        localStorage.removeItem('username');
        localStorage.removeItem('userColor');
      }
      
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Generate anonymous user on app load
  useEffect(() => {
    if (!currentUser && !isAuthLoading) {
      const adjectives = ['Swift', 'Silent', 'Bright', 'Cool', 'Sharp', 'Wise'];
      const animals = ['Fox', 'Eagle', 'Wolf', 'Dolphin', 'Tiger', 'Falcon'];
      
      const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      
      const userProfile = {
        id: `${randomAdj}${randomAnimal}${randomNum}`,
        username: `${randomAdj} ${randomAnimal}`,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        createdAt: new Date().toISOString()
      };
      
      setCurrentUser(userProfile);
      
      // Save to localStorage
      localStorage.setItem('username', userProfile.username);
      localStorage.setItem('userColor', userProfile.color);
    }
  }, [currentUser, isAuthLoading]);

  const handleEnterChat = async (roomName) => {
    setCurrentRoom(roomName);
    setCurrentView('chat');
    
    // ✅ Save room to localStorage so it persists on reload
    localStorage.setItem('currentRoom', roomName);
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setCurrentView('landing');
    
    // ✅ Clear saved room
    localStorage.removeItem('currentRoom');
  };

  // Show loading while checking auth state
  if (isAuthLoading || currentView === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Loading OROOM Enhanced...</h1>
          <p className="text-gray-300">Restoring your session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {currentView === 'landing' ? (
        <LandingPage onEnterChat={handleEnterChat} />
      ) : (
        <ChatRoom 
          roomId={currentRoom}
          currentUser={currentUser}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
      
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
