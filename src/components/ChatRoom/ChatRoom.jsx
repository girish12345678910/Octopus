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
//  profanity filter
import profanityFilter from '../../utils/profanityFilter';

const ChatRoom = ({ roomId, currentUser, onLeaveRoom }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [userWarnings, setUserWarnings] = useState(0); // ✅ Add warning state
  const messagesEndRef = useRef(null);
  const unsubscribeRef = useRef();

  //  authentication useEffect 
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        setConnectionStatus('authenticating');
        console.log('🔐 Starting authentication...');
        
        // Check  authenticated from App.js
        if (auth.currentUser) {
          console.log('✅ Already authenticated from App:', auth.currentUser.uid);
          setIsAuthenticated(true);
          setConnectionStatus('connected');
          return;
        }

        // Only sign in anonymously if no current user
        const userCredential = await signInAnonymously(auth);
        console.log('✅ New anonymous auth:', userCredential.user.uid);
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

  // Real-time message listener 
  useEffect(() => {
    if (!isAuthenticated || !roomId) return;

    console.log('📡 Setting up message listener for room:', roomId);

    // Query 
    const messagesQuery = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    //  onSnapshot listener
    unsubscribeRef.current = onSnapshot(
      messagesQuery,
      (snapshot) => {
        console.log('📨 Snapshot received:', {
          size: snapshot.size,
          changes: snapshot.docChanges().length,
          fromCache: snapshot.metadata.fromCache,
          hasPendingWrites: snapshot.metadata.hasPendingWrites
        });
        
        
        const allMessages = [];
        snapshot.forEach((doc) => {
          const data = doc.data();
          allMessages.push({
            id: doc.id,
            ...data,
            timestamp: data.timestamp?.toDate() || new Date()
          });
        });

        // Sort messages by timestamp t
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

  //  Check if user is banned on component mount
  useEffect(() => {
    const isBanned = localStorage.getItem('userBanned');
    if (isBanned === 'true') {
      toast.error('🚫 You are currently banned from sending messages');
      setIsAuthenticated(false);
    }
  }, []);

  //  Enhanced message sending with profanity filtering
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !isAuthenticated) return;

    const messageText = message.trim();
    
    //  Enhanced profanity analysis
    const analysis = profanityFilter.analyzeProfanity(messageText);
    
    // Handle different profanity levels
    switch (analysis.action) {
      case 'block':
        toast.error(`❌ ${analysis.message}`);
        setUserWarnings(prev => prev + 1);
        
        // Auto-ban after 3 warnings
        if (userWarnings >= 2) {
          toast.error('🚫 You have been temporarily banned for repeated violations');
          localStorage.setItem('userBanned', 'true');
          onLeaveRoom();
          return;
        }
        return;

      case 'warn':
        toast.warn(`⚠️ ${analysis.message}`);
        setUserWarnings(prev => prev + 1);
        // Continue with cleaned message
        break;

      case 'allow':
        // Message is clean
        break;
    }

    const finalMessageText = analysis.cleanText;
    const tempId = Date.now();
    setMessage('');

    console.log('📤 Sending message:', finalMessageText);

    // Optimistic update
    const optimisticMessage = {
      id: `temp-${tempId}`,
      content: finalMessageText,
      username: currentUser?.username || 'Anonymous User',
      userId: currentUser?.id || auth.currentUser?.uid || 'unknown',
      roomId: roomId,
      timestamp: new Date(),
      type: 'user',
      isPending: true
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        content: finalMessageText,
        username: currentUser?.username || 'Anonymous User',
        userId: currentUser?.id || auth.currentUser?.uid || 'unknown',
        roomId: roomId,
        timestamp: serverTimestamp(),
        type: 'user',
        //  Add moderation info
        moderated: analysis.level !== 'clean',
        originalContent: analysis.level !== 'clean' ? messageText : undefined
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

  //  Add real-time typing filter with visual feedback
  const handleInputChange = (e) => {
    const text = e.target.value;
    setMessage(text);

    // Real-time profanity detection with visual feedback
    if (text.length > 0 && profanityFilter.isProfane(text)) {
      e.target.style.borderColor = '#ef4444'; // Red border for inappropriate content
      e.target.style.boxShadow = '0 0 0 1px #ef4444';
    } else {
      e.target.style.borderColor = '#6b7280'; // Normal border
      e.target.style.boxShadow = 'none';
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
      <div>⚠️ Warnings: {userWarnings}/3</div>
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
                  currentUser={currentUser}
                  onReaction={(messageId, reactions) => {
                    console.log('Reaction added to message:', messageId, reactions);
                  }}
                  onReply={(message) => {
                    console.log('Reply to message:', message);
                  }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/*  Enhanced Message Input with Profanity Filter and Warning System */}
      <div className="bg-black/20 backdrop-blur-lg border-t border-gray-700/50 p-4">
        {userWarnings > 0 && (
          <div className="mb-2 p-2 bg-yellow-600/20 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
            ⚠️ Warning: {userWarnings}/3 - Keep conversations respectful or risk being banned
          </div>
        )}
        
        <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
          <div className="flex-1 relative">
            <textarea
              value={message}
              onChange={handleInputChange} 
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder={`Send message to ${roomId}... (Keep it respectful!)`}
              rows={1}
              className="w-full bg-gray-800/50 border border-gray-600/50 rounded-2xl px-4 py-3 pr-16 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none backdrop-blur-lg transition-all duration-200"
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
