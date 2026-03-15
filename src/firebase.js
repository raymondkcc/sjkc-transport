// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// =========================================================================
// ⚠️ 安全提示 (IMPORTANT)
// 永远使用 .env 文件来存储您的 API Keys 和配置信息！
// =========================================================================

// --- 1. TRANSPORT DATABASE (For saving parent forms) ---
const transportConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(transportConfig);
export const db = getFirestore(app);


// --- 2. KEHADIRAN DATABASE (For reading student names) ---
const kehadiranConfig = {
  apiKey: import.meta.env.VITE_KEHADIRAN_API_KEY,
  authDomain: import.meta.env.VITE_KEHADIRAN_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_KEHADIRAN_PROJECT_ID,
  storageBucket: import.meta.env.VITE_KEHADIRAN_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_KEHADIRAN_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_KEHADIRAN_APP_ID
};

// 我们给它命名为 "Kehadiran"，防止和上面的主数据库冲突
const kehadiranApp = initializeApp(kehadiranConfig, "Kehadiran"); 
export const kehadiranDb = getFirestore(kehadiranApp);
export const kehadiranAuth = getAuth(kehadiranApp);