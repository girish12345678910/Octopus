// src/store/chatStore.js
import { create } from 'zustand';
import { subscript, persist } from 'zustand/middleware';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { geminiService } from '../services/geminiService';

export const useChatStore = create(
  persist(
    (set, get) => ({
      // State
      messages: [],
      currentUser: null,
      currentRoom: null,
      isConnected: false,
      isAiTyping: false,

      // Actions
      setCurrentUser: (user) => set({ currentUser: user }),
      
      setCurrentRoom: (room) => set({ currentRoom: room }),
      
      setConnected: (connected) => set({ isConnected: connected }),

      // Generate anonymous user
      generateAnonymousUser: () => {
        const adjectives = ['Swift', 'Silent', 'Bright', 'Cool', 'Sharp', 'Wise'];
        const animals = ['Fox', 'Eagle', 'Wolf', 'Dolphin', 'Tiger', 'Falcon'];
        
        const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
        const randomAnimal = animals[Math.floor(Math.random() * animals.length)];
        const randomNum = Math.floor(Math.random() * 1000);
        
        return {
          id: `${randomAdj}${randomAnimal}${randomNum}`,
          username: `${randomAdj} ${randomAnimal}`,
          color: `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`,
          createdAt: new Date().toISOString()
        };
      },

      // Send message
      sendMessage: async (content, roomId) => {
        const { currentUser } = get();
        if (!currentUser || !content.trim()) return;

        // Check content safety
        const isSafe = await geminiService.moderateContent(content);
        if (!isSafe) {
          throw new Error('Message contains inappropriate content');
        }

        const message = {
          content: content.trim(),
          userId: currentUser.id,
          username: currentUser.username,
          roomId,
          timestamp: new Date().toISOString(),
          type: 'user'
        };

        // Add to Firestore
        await addDoc(collection(db, 'messages'), message);

        // Trigger AI response (30% chance or if mentioned)
        if (Math.random() < 0.3 || content.toLowerCase().includes('@ai')) {
          setTimeout(() => get().generateAIResponse(content, roomId), 1000);
        }
      },

      // Generate AI response
      generateAIResponse: async (userMessage, roomId) => {
        set({ isAiTyping: true });
        
        try {
          const response = await geminiService.generateResponse(
            userMessage,
            'This is a friendly anonymous chat room conversation.'
          );

          const aiMessage = {
            content: response,
            userId: 'ai-assistant',
            username: 'AI Assistant',
            roomId,
            timestamp: new Date().toISOString(),
            type: 'ai'
          };

          await addDoc(collection(db, 'messages'), aiMessage);
        } catch (error) {
          console.error('AI response error:', error);
        } finally {
          set({ isAiTyping: false });
        }
      },

      // Subscribe to room messages
      subscribeToRoom: (roomId) => {
        const q = query(
          collection(db, 'messages'),
          orderBy('timestamp', 'desc'),
          limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const messages = snapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(msg => msg.roomId === roomId)
            .reverse();
          
          set({ messages });
        });

        set({ isConnected: true });
        return unsubscribe;
      }
    }),
    {
      name: 'oroom-chat-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
