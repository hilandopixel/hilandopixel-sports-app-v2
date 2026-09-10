// firebase.config.js

// Importa las funciones que necesitas de los SDKs que te hagan falta
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBx97xdGbWlxpVnspKmr7c0qV9pYo2jP5Q",
  authDomain: "hilandopixel-sports-app.firebaseapp.com",
  projectId: "hilandopixel-sports-app",
  storageBucket: "hilandopixel-sports-app.firebasestorage.app",
  messagingSenderId: "445153293632",
  appId: "1:445153293632:web:203f0c2c03afcd37e1b6a5",
  measurementId: "G-78EMW1TY8C"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const db = getFirestore(app);
const auth = getAuth(app);

// Exportar servicios para usarlos en otros módulos JavaScript
export { app, db, auth };