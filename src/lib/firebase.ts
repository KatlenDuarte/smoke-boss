import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBL02GZ3b3BavC4Zxo-uFqYhwd_AZiiqRg",
  authDomain: "smoke-boss.firebaseapp.com",
  projectId: "smoke-boss",
  storageBucket: "smoke-boss.firebasestorage.app",
  messagingSenderId: "71744366524",
  appId: "1:71744366524:web:a3f38067e2083d0e272db9",
  measurementId: "G-THL09VFV6J"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta as instâncias para serem usadas nos Hooks e Páginas
export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;