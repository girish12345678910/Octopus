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
  where,
  limit
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../../firebase/config';

const ChatRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef();

  // Authenticate user anonymously
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        setConnectionStatus('authenticating');
        console.log('🔐 Starting authentication...');
        
        // Check if already authenticated
        if (auth.currentUser) {
          console.log('✅ Already authenticated:', auth.currentUser.uid);
          setIsAuthenticated(true);
          setConnectionStatus('connected');
          return;
        }

        // Sign in anonymously
        const userCredential = await signInAnonymously(auth);
        console.log('✅ Anonymous auth successful:', userCredential.user.uid);
        setIsAuthenticated(true);
        setConnectionStatus('connected');
        toast.success('Connected to chat room!');
        
      } catch (error) {
        console.error('❌ Authentication failed:', error);
        setConnectionStatus('error');
        toast.error('Failed to authenticate: ' + error.message);
      }
    };

    // Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('👤 Auth state changed - User:', user.uid);
        setIsAuthenticated(true);
        setConnectionStatus('connected');
      } else {
        console.log('👤 Auth state changed - No user');
        setIsAuthenticated(false);
        setConnectionStatus('disconnected');
      }
    });

    authenticateUser();

    return () => unsubscribeAuth();
  }, []);

  // Real-time message listener with improved implementation
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    console.log('📡 Setting up message listener for room:', roomId);

    const messagesQuery = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100) // Limit to last 100 messages for performance
    );

    // Enhanced onSnapshot listener
    unsubscribeRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log('📨 Snapshot received:', {
          size: snapshot.size,
          changes: snapshot.docChanges().length,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites
        });
        
        // Process all documents in the snapshot
        const allMessages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          allMessages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });

        // Sort messages by timestamp to ensure correct order
        allMessages.sort((a, b) => a.timestamp - b.timestamp);
        
        console.log('📋 Setting messages:', allMessages.length, 'total');
        setMessages(allMessages);

        // Update connection status
        if (snapshot.metadata.fromCache) {
          setConnectionStatus('offline');
        } else {
          setConnectionStatus('connected');
        }
      },
      (error) => {
        console.error('❌ Message listener error:', error);
        setConnectionStatus('error');
        toast.error('Failed to load messages: ' + error.message);
      }
    );

    return () => {
      if (unsubscribeRef.current) {
        console.log('🔇 Unsubscribing message listener');
        unsubscribeRef.current();
      }
    };
  }, [isAuthenticated, roomId]);

  // Send message with enhanced error handling and retry logic
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    const messageText = message.trim();
    const tempId = Date.now(); // Temporary ID for optimistic updates
    setMessage('');

    console.log('📤 Sending message:', messageText);

    // Optimistic update - add message immediately to UI
    const optimisticMessage = {
      id: `temp-${tempId}`,
      content: messageText,
      username: currentUser?.username || 'Anonymous User',
      userId: currentUser?.id || auth.currentUser?.uid || 'unknown',
      roomId: roomId,
      timestamp: new Date(),
      type: 'user',
      isPending: true // Mark as pending
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        content: messageText,
        username: currentUser?.username || 'Anonymous User',
        userId: currentUser?.id || auth.currentUser?.uid || 'unknown',
        roomId: roomId,
        timestamp: serverTimestamp(),
        type: 'user'
      };

      const docRef = await addDoc(collection(db, 'messages'), messageData);
      console.log('✅ Message sent with ID:', docRef.id);

      // Remove optimistic message since real one will come via listener
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${tempId}`));
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      
      // Remove optimistic message and restore input
      setMessages(prev => prev.filter(msg => msg.id !== `temp-${tempId}`));
      setMessage(messageText);
      
      toast.error('Failed to send message: ' + error.message);
      
      // Retry logic
      setTimeout(() => {
        toast.error('Message failed. Please try again.');
      }, 2000);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    const timer = setTimeout(scrollToBottom, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  // Debug panel for development
  const DebugPanel = () => (
    <div className="fixed top-4 right-4 bg-black/80 text-white p-3 rounded-lg text-xs max-w-xs">
      <div>🏠 Room: {roomId}</div>
      <div>🔐 Auth: {isAuthenticated ? '✅' : '❌'}</div>
      <div>🌐 Status: {connectionStatus}</div>
      <div>💬 Messages: {messages.length}</div>
      <div>👤 User: {currentUser?.username}</div>
      {messages.slice(-2).map(msg => (
        <div key={msg.id} className="text-xs opacity-75 mt-1">
          {msg.isPending && '⏳'} {msg.username}: {msg.content.substring(0, 15)}...
        </div>
      ))}
    </div>
  );

  // Connection status indicator
  const ConnectionStatus = () => {
    const statusConfig = {
      connecting: { color: 'bg-yellow-400', text: 'Connecting...' },
      authenticating: { color: 'bg-blue-400', text: 'Authenticating...' },
      connected: { color: 'bg-green-400', text: 'Connected' },
      offline: { color: 'bg-orange-400', text: 'Offline' },
      error: { color: 'bg-red-400', text: 'Connection Error' },
      disconnected: { color: 'bg-gray-400', text: 'Disconnected' }
    };

    const status = statusConfig[connectionStatus] || statusConfig.connecting;
    
    return (
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${status.color} animate-pulse`}></div>
        <span className="text-xs text-gray-400">{status.text}</span>
      </div>
    );
  };

  // Show loading while authenticating
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold mb-4">Joining anonymous chat room...</h1>
          <p className="text-gray-300">Authenticating and connecting to room "{roomId}"</p>
          <p className="text-gray-400 text-sm mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Debug Panel - Remove in production */}
      {process.env.NODE_ENV === 'development' && <DebugPanel />}
      
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
            <ConnectionStatus />
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
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <MessageBubble 
                  message={msg}
                  isOwn={msg.userId === (currentUser?.id || auth.currentUser?.uid)}
                  isPending={msg.isPending}
                />
              </motion.div>
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
              placeholder={`Send anonymous message to ${roomId}... (Press Enter to send)`}
              rows={1}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-2xl px-4 py-3 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none backdrop-blur-lg"
              maxLength={500}
              disabled={connectionStatus === 'error' || !isAuthenticated}
            />
            <div className="absolute bottom-2 right-12 text-xs text-gray-500">
              {message.length}/500
            </div>
          </div>
          
          <motion.button
            type="submit"
            disabled={!message.trim() || connectionStatus === 'error' || !isAuthenticated}
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
