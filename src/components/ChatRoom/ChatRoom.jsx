import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PaperAirplaneIcon, 
  ArrowLeftIcon, 
  UserGroupIcon 
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
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

const ChatRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef();

  // Authenticate user anonymously
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
        setIsAuthenticated(true);
        console.log('✅ Anonymous auth successful');
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        toast.error('Failed to authenticate');
      }
    };

    authenticateUser();
  }, []);

  // Real-time message listener with proper state updates
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    console.log('📡 Setting up message listener for room:', roomId);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    // ✅ Fixed: Use docChanges() for efficient updates
    unsubscribeRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log('📨 Snapshot received, changes:', snapshot.docChanges().length);
        
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const newMessage = {
              id: change.doc.id,
              ...change.doc.data(),
              timestamp: change.doc.data().timestamp?.toDate() || new Date()
            };
            
            console.log('➕ New message:', newMessage.content);
            
            // ✅ Fixed: Use functional update to prevent state mutations
            setMessages(prevMessages => {
              // Check if message already exists to prevent duplicates
              const exists = prevMessages.some(msg => msg.id === newMessage.id);
              if (exists) return prevMessages;
              
              return [...prevMessages, newMessage];
            });
          }
        });
      },
      (error) => {
        console.error('❌ Message listener error:', error);
        toast.error('Failed to load messages');
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        console.log('🔇 Unsubscribing message listener');
        unsubscribeRef.current();
      }
    };
  }, [isAuthenticated, roomId]);

  // Send message with proper error handling
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    const messageText = message.trim();
    setMessage('');

    console.log('📤 Sending message:', messageText);

    try {
      const messageData = {
        content: messageText,
        username: currentUser?.username || 'Anonymous User',
        userId: currentUser?.id || auth.currentUser?.uid || 'unknown',
        roomId: roomId,
        timestamp: serverTimestamp(),
        type: 'user'
      };

      await addDoc(collection(db, 'messages'), messageData);
      console.log('✅ Message sent successfully');
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
      setMessage(messageText); // Restore message on failure
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // ✅ Fixed: Scroll on messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Show loading while authenticating
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Joining anonymous chat room...</h1>
          <p className="text-gray-300">Authenticating and connecting to room "{roomId}"</p>
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
              <h1 className="text-xl font-bold text-white">Room: {roomId}</h1>
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-400">Anonymous Group Chat</span>
                <span className="text-xs text-green-400">
                  {messages.length} messages
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-300">{currentUser?.username || 'Anonymous'}</p>
            <p className="text-xs text-gray-500">Online</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-400 text-lg mb-2">Welcome to room "{roomId}"! 🎉</p>
              <p className="text-gray-500">Be the first to send a message...</p>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((msg) => (
              <MessageBubble 
                key={msg.id}
                message={msg}
                isOwn={msg.userId === (currentUser?.id || auth.currentUser?.uid)}
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
            />
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
