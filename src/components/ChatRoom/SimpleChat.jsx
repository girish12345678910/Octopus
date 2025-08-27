import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';

const SimpleChat = ({ roomId }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    console.log('Setting up listener for room:', roomId);
    
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Snapshot received:', snapshot.size, 'documents');
      const messageList = [];
      snapshot.forEach((doc) => {
        messageList.push({ id: doc.id, ...doc.data() });
      });
      setMessages(messageList);
    }, (error) => {
      console.error('Error listening to messages:', error);
    });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      console.log('Sending message:', newMessage);
      await addDoc(collection(db, 'messages'), {
        text: newMessage,
        timestamp: new Date(),
        roomId: roomId
      });
      setNewMessage('');
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <h2 className="text-white text-xl">Simple Chat Test - Room: {roomId}</h2>
      </div>
      
      <div className="mb-4 h-64 overflow-y-auto bg-gray-800 p-2">
        {messages.map((msg) => (
          <div key={msg.id} className="text-white mb-2">
            {msg.text}
          </div>
        ))}
      </div>
      
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          className="flex-1 p-2 bg-gray-700 text-white"
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} className="bg-blue-500 text-white px-4 py-2">
          Send
        </button>
      </div>
    </div>
  );
};

export default SimpleChat;
