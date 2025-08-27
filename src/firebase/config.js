import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA4IhiKjxntFh4p_W_BhxwxhwNtOOGksVA",
  authDomain: "oktopus-de656.firebaseapp.com",
  projectId: "oktopus-de656",
  storageBucket: "oktopus-de656.firebasestorage.app",
  messagingSenderId: "460467432735",
  appId: "1:460467432735:web:bc7db06ec68470b267142a",
  measurementId: "G-40LD4SZNTE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

export const signInAnonymously = () => signInAnonymously(auth);

export default app;
