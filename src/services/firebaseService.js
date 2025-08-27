import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs
} from 'firebase/firestore';
 
import { db } from '../firebase/config';

// Rest of your service code remains the same...


class FirebaseService {
  // Add a new message
  async addMessage(roomId, message) {
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        ...message,
        roomId,
        timestamp: serverTimestamp(),
        createdAt: new Date().toISOString()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding message:', error);
      throw error;
    }
  }

  // Subscribe to room messages
  subscribeToMessages(roomId, callback) {
    const q = query(
      collection(db, 'messages'),
      where('roomId', '==', roomId),
      orderBy('timestamp', 'asc'),
      limit(100)
    );

    return onSnapshot(q, (querySnapshot) => {
      const messages = [];
      querySnapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() });
      });
      callback(messages);
    });
  }

  // Add user to room
  async addUserToRoom(roomId, user) {
    try {
      await addDoc(collection(db, 'roomUsers'), {
        roomId,
        userId: user.id,
        username: user.username,
        joinedAt: serverTimestamp(),
        isOnline: true,
        lastSeen: serverTimestamp()
      });
    } catch (error) {
      console.error('Error adding user to room:', error);
    }
  }

  // Update user presence
  async updateUserPresence(roomId, userId, isOnline) {
    try {
      const q = query(
        collection(db, 'roomUsers'),
        where('roomId', '==', roomId),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach(async (document) => {
        await updateDoc(doc(db, 'roomUsers', document.id), {
          isOnline,
          lastSeen: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  // Subscribe to room users
  subscribeToRoomUsers(roomId, callback) {
    const q = query(
      collection(db, 'roomUsers'),
      where('roomId', '==', roomId)
    );

    return onSnapshot(q, (querySnapshot) => {
      const users = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(users);
    });
  }

  // Create or join room
  async createRoom(roomId, creator) {
    try {
      await addDoc(collection(db, 'rooms'), {
        roomId,
        name: roomId,
        createdBy: creator.id,
        createdAt: serverTimestamp(),
        isActive: true,
        userCount: 1
      });
    } catch (error) {
      console.error('Error creating room:', error);
    }
  }
}

export const firebaseService = new FirebaseService();
