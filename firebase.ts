import { initializeApp } from "firebase/app";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut as firebaseSignOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA_UIVPkFKTo9EnoqeznfyMU8FraIzBmJs",
  authDomain: "gestione-contabilita.firebaseapp.com",
  projectId: "gestione-contabilita",
  storageBucket: "gestione-contabilita.appspot.com",
  messagingSenderId: "848720574883",
  appId: "1:848720574883:web:b3ad9bcedb0872e9e6c216",
  measurementId: "G-GWDHCVVVPK"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const isConfigured = true;

const signInWithEmail = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
};

const signOut = () => {
    return firebaseSignOut(auth);
};

export { auth, db, signInWithEmail, signOut, isConfigured };