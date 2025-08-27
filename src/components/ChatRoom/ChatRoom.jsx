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
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

const ChatRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isJoining, setIsJoining] = useState(true);
  const [joinError, setJoinError] = useState(null);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef();

  // Authenticate user anonymously when joining room
  useEffect(() => {
    let mounted = true;
    
    const authenticateAndJoin = async () => {
      try {
        console.log('🔐 Starting anonymous authentication...');
        
        // Sign in anonymously
        const userCredential = await signInAnonymously(auth);
        console.log('✅ Anonymous auth successful:', userCredential.user.uid);
        
        if (mounted) {
          setIsAuthenticated(true);
          setJoinError(null);
          toast.success('Joined chat room successfully!');
        }
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        
        if (mounted) {
          setJoinError(error.message);
          toast.error(`Failed to join chat room: ${error.message}`);
        }
      } finally {
        if (mounted) {
          setIsJoining(false);
        }
      }
    };

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('✅ User authenticated:', user.uid);
        if (mounted) {
          setIsAuthenticated(true);
          setJoinError(null);
        }
      } else {
        console.log('❌ No user authenticated');
        if (mounted) {
          setIsAuthenticated(false);
        }
      }
    });

    authenticateAndJoin();

    return () => {
      mounted = false;
      unsubscribeAuth();
    };
  }, []);

  // Subscribe to real-time messages after authentication
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    console.log('📡 Setting up message listener for room:', roomId);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc')
    );

    unsubscribeRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        const newMessages = [];
        snapshot.forEach((doc) => {
          newMessages.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('📨 Messages received:', newMessages.length);
        setMessages(newMessages);
        
        // Add welcome message if this is first load
        if (newMessages.length === 0) {
          const welcomeMessages = [
            {
              id: 'welcome-' + Date.now(),
              content: `Welcome to room "${roomId}"! 🎉 Start chatting with others anonymously.`,
              username: 'System',
              type: 'system',
              timestamp: new Date(),
              roomId: roomId
            }
          ];
          setMessages(welcomeMessages);
        }
      },
      (error) => {
        console.error('❌ Message listener error:', error);
        toast.error('Failed to load messages: ' + error.message);
      }
    );

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
    };
  }, [isAuthenticated, roomId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    const messageText = message.trim();
    setMessage('');

    try {
      await addDoc(collection(db, 'messages'), {
        content: messageText,
        username: currentUser?.username || 'Anonymous User',
        userId: currentUser?.id || auth.currentUser?.uid,
        roomId: roomId,
        timestamp: serverTimestamp(),
        type: 'user'
      });

      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message: ' + error.message);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Retry joining room
  const retryJoin = () => {
    setIsJoining(true);
    setJoinError(null);
    window.location.reload(); // Simple retry by reloading
  };

  // Show error state if join failed
  if (joinError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center text-white max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-400 text-2xl">⚠️</span>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-red-400">Failed to Join Chat Room</h1>
            <p className="text-gray-300 mb-6">
              {joinError}
            </p>
          </div>
          
          <div className="space-y-3">
            <button 
              onClick={retryJoin}
              className="w-full bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl transition-colors"
            >
              Retry Join
            </button>
            <button 
              onClick={onLeaveRoom}
              className="w-full bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl transition-colors"
            >
              Back to Landing
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show joining state
  if (isJoining) {
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

  // Main chat interface (same as before but with auth checks)
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
              <p className="text-sm text-gray-400">Anonymous Group Chat</p>
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
