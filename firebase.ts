// These are available globally from the scripts in index.html
const firebase = (window as any).firebase;

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


// Inizializza Firebase solo se la configurazione è stata inserita.
// Questo previene il crash dell'app se le credenziali sono mancanti.
let app, auth, db;

const isConfigured = firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";

if (isConfigured) {
    try {
        app = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        db = firebase.firestore();
    } catch (e) {
        console.error("Errore durante l'inizializzazione di Firebase. Controlla la tua configurazione:", e);
    }
} else {
    console.warn("Configurazione Firebase mancante o incompleta in firebase.ts. L'app verrà eseguita in modalità demo.");
}


const signInWithEmail = (email, password) => {
    if (!auth) {
        return Promise.reject(new Error("Firebase non è configurato. Controlla il file firebase.ts"));
    }
    return auth.signInWithEmailAndPassword(email, password);
};

const signOut = () => {
    if (!auth) {
        return Promise.reject(new Error("Firebase non è configurato."));
    }
    return auth.signOut();
};

export { auth, db, signInWithEmail, signOut, isConfigured };