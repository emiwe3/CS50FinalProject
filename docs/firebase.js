// import firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";

// imports for firebase authentication
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// imports for firestore 
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// imports for realtime database
import {
  getDatabase,
  ref,
  set,
  update,
  remove,
  onDisconnect,
  onValue,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// contains API keys and project info
const firebaseConfig = {
  apiKey: "AIzaSyBBRZig8OdmRciVLvcsJ8EnMEvGQ-O9s5c",
  authDomain: "marauders-map-51f92.firebaseapp.com",
  projectId: "marauders-map-51f92",
  storageBucket: "marauders-map-51f92.firebasestorage.app",
  messagingSenderId: "969257685712",
  appId: "1:969257685712:web:99ab52c57e20e29e2e84d5",
  databaseURL: "https://marauders-map-51f92-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// export everything in order for firebase usability in other parts of the website
export {
  auth,
  db,
  rtdb,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  updateEmail,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  ref,
  set,
  update,
  remove,
  onDisconnect,
  onValue,
  serverTimestamp
};
