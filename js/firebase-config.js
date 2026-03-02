import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyA5Oepf_fItjBW7UVIQy7ziFGL77Ca3wMg",
    authDomain: "brain-app-3ff9b.firebaseapp.com",
    projectId: "brain-app-3ff9b",
    storageBucket: "brain-app-3ff9b.firebasestorage.app",
    messagingSenderId: "501723322553",
    appId: "1:501723322553:web:7950a0b12e442cff176368"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Variables de estado del usuario
let currentUser = null;
let userData = {
    totalScore: 0,
    exercisesCompleted: 0,
    categoriesProgress: {} // Ejemplo: { 'visual-attention': 2, 'memory': 5 }
};

// Función para guardar progreso en Firestore
async function saveProgress() {
    if (!currentUser) return;
    try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, userData, { merge: true });
        console.log("Progreso guardado");
    } catch (e) {
        console.warn("No se pudo guardar en Firebase. Verifique la API Key.");
    }
}

// Función para cargar progreso desde Firestore
async function loadProgress() {
    if (!currentUser) return;
    try {
        const userRef = doc(db, "users", currentUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            userData = docSnap.data();
            if (!userData.categoriesProgress) userData.categoriesProgress = {};
        } else {
            console.log("No existe data previa. Creando nuevo perfil.");
            await saveProgress();
        }
    } catch (e) {
        console.warn("No se pudo cargar de Firebase. Usando datos locales.");
    }
}

export { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, signInAnonymously, currentUser, userData, saveProgress, loadProgress };
