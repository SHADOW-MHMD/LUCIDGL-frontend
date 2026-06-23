import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCCd5MBeI8wfNOwH1fujk0Sif8Z8pnvKOw",
  authDomain: "lucid-gl.firebaseapp.com",
  projectId: "lucid-gl",
  storageBucket: "lucid-gl.firebasestorage.app",
  messagingSenderId: "649254607753",
  appId: "1:649254607753:web:c6d615e1dc956529459f58",
  measurementId: "G-3KXQ9SX3L1"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

export { app, auth };
