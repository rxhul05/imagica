import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
//@ts-ignore - getReactNativePersistence is available at runtime in RN bundle
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyA-MFjCYm-_AObYGWk0TTICusqowaL3TjE",
    authDomain: "rutuja-21271.firebaseapp.com",
    projectId: "rutuja-21271",
    storageBucket: "rutuja-21271.firebasestorage.app",
    messagingSenderId: "499037363222",
    appId: "1:499037363222:web:387b0516f5d52f911fe937",
    measurementId: "G-YBRYG6V39S"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
});

export const db = getFirestore(app);

export default app;
