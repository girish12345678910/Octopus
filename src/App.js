import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import LandingPage from './components/LandingPage/LandingPage';
import ChatRoom from './components/ChatRoom/ChatRoom';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Generate anonymous user on app load
  useEffect(() => {
    if (!currentUser) {
      const adjectives = ['Swift', 'Silent', 'Bright', 'Cool', 'Sharp', 'Wise'];
      const animals = ['Fox', 'Eagle', 'Wolf', 'Dolphin', 'Tiger', 'Falcon'];
      
      const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
      const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
      const randomNum = Math.floor(Math.random() * 1000);
      
      setCurrentUser({
        id: `${randomAdj}${randomAnimal}${randomNum}`,
        username: `${randomAdj} ${randomAnimal}`,
        color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
        createdAt: new Date().toISOString()
      });
    }
  }, [currentUser]);

  const handleEnterChat = async (roomName) => {
    setCurrentRoom(roomName);
    setCurrentView('chat');
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    setCurrentView('landing');
  };

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
