import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBQeqIXciSAcgEPRaO5vxY2j-AZWru5CFM',
  authDomain: 'ricardo-997a4.firebaseapp.com',
  projectId: 'ricardo-997a4',
  storageBucket: 'ricardo-997a4.firebasestorage.app',
  messagingSenderId: '816054949916',
  appId: '1:816054949916:web:ce07f5d420495419a4e7d9',
  measurementId: 'G-GKNGJTFSPG',
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);

export default app;
