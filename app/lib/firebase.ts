import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyBsu0b9Jgln63F_f6y4SerCfbd5yYGar6c',
  authDomain: 'cardapio-82e02.firebaseapp.com',
  projectId: 'cardapio-82e02',
  storageBucket: 'cardapio-82e02.appspot.com',
  messagingSenderId: '554740889117',
  appId: '1:554740889117:web:3f4a6434d4c17fcef7f8f4',
  measurementId: 'G-QZV8E8B3Q2',
};

const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const db = getFirestore(app);
