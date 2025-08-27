import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

console.log('🔑 Firebase Config Check:');
console.log('API Key present:', !!process.env.AIzaSyA4ThiKjxntFh4p_W_BhxwxhwNtOOGksVA);
console.log('API Key length:', process.env.AIzaSyA4ThiKjxntFh4p_W_BhxwxhwNtOOGksVA?.length);
console.log('Project ID:', process.env.oktopus-de656);

const firebaseConfig = {
  apiKey: "AIzaSyA4ThiKjxntFh4p_W_BhxwxhwNtOOGksVA",
  authDomain: "oktopus-de656.firebaseapp.com",
  projectId: "oktopus-de656",
  storageBucket: "oktopus-de656.appspot.com",
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

// Export the signInAnonymously function directly from firebase/auth
export { signInAnonymously };

export default app;
