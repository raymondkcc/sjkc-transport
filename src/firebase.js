// ...前面的 Transport 数据库代码保持不变...
import { getAuth } from "firebase/auth"; // <-- 确保顶部引入了 getAuth

// --- 2. KEHADIRAN DATABASE (For reading student names) ---
const kehadiranConfig = {
  apiKey: import.meta.env.VITE_KEHADIRAN_API_KEY,
  authDomain: import.meta.env.VITE_KEHADIRAN_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_KEHADIRAN_PROJECT_ID,
  storageBucket: import.meta.env.VITE_KEHADIRAN_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_KEHADIRAN_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_KEHADIRAN_APP_ID
};

const kehadiranApp = initializeApp(kehadiranConfig, "Kehadiran"); 
export const kehadiranDb = getFirestore(kehadiranApp);
export const kehadiranAuth = getAuth(kehadiranApp); // <-- 新增这行！