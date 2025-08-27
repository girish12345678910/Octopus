import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Debug environment variables
console.log('🔧 Environment Variable Check:');
console.log('REACT_APP_FIREBASE_API_KEY:', process.env.AIzaSyA4IhiKjxntFh4p_W_BhxwxhwNtOOGksVA);
console.log('Is API key present?', !!process.env.AIzaSyA4IhiKjxntFh4p_W_BhxwxhwNtOOGksVA);
console.log('API key length:', process.env.AIzaSyA4IhiKjxntFh4p_W_BhxwxhwNtOOGksVA?.length);


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

// Export the signInAnonymously function directly from firebase/auth
export { signInAnonymously };

export default app;
