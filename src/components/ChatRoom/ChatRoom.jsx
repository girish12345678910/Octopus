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
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp,
  where
} from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

const ChatRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef();

  // Authenticate user anonymously when joining room
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        await signInAnonymously(auth);
        setIsAuthenticated(true);
        console.log('✅ User authenticated anonymously');
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        toast.error('Failed to join chat room');
      }
    };

    authenticateUser();
  }, []);

  // Subscribe to real-time messages
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    const messagesQuery = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    unsubscribeRef.current = onSnapshot(messagesQuery, (snapshot) => {
      const newMessages = [];
      snapshot.forEach((doc) => {
        newMessages.push({ id: doc.id, ...doc.data() });
      });
      
      console.log('📨 Real-time messages received:', newMessages.length);
      setMessages(newMessages);
    });

    // Add user to online users list
    addOnlineUser();

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [isAuthenticated, roomId]);

  const addOnlineUser = async () => {
    try {
      await addDoc(collection(db, 'onlineUsers'), {
        roomId,
        username: currentUser.username,
        userId: currentUser.id,
        joinedAt: serverTimestamp(),
        isOnline: true
      });
    } catch (error) {
      console.error('Error adding online user:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    const messageText = message.trim();
    setMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        content: messageText,
        username: currentUser.username,
        userId: currentUser.id,
        roomId: roomId,
        timestamp: serverTimestamp(),
        type: 'user'
      });

      console.log('✅ Message sent to Firebase');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Header with Room Info */}
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
              <h1 className="text-xl font-bold text-white">Room: {roomId}</h1>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">
                  Anonymous Group Chat
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">{currentUser?.username}</p>
            <p className="text-xs text-gray-500">Anonymous User</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
          {!isAuthenticated && (
            <div className="text-center text-gray-400 py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>Joining anonymous chat room...</p>
            </div>
          )}
          
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
              placeholder="Send anonymous message to room... (Press Enter to send)"
              rows={1}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-2xl px-4 py-3 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none backdrop-blur-lg"
              maxLength={500}
              disabled={!isAuthenticated}
            />
          </div>
          
          <motion.button
            type="submit"
            disabled={!message.trim() || !isAuthenticated}
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
