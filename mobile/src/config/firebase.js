import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDNOD676C2uh87ggzmSZFNldI2eyI-ECOQ",
  authDomain: "offshift-charleston.firebaseapp.com",
  projectId: "offshift-charleston",
  storageBucket: "offshift-charleston.firebasestorage.app",
  messagingSenderId: "168641222703",
  appId: "1:168641222703:web:63c86ca2ce807272a8ceda",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
