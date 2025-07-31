import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  // 添加数据库 URL（如果需要 Realtime Database）
  databaseURL: "https://pjpcdata-d115f-default-rtdb.asia-southeast1.firebasedatabase.app",
}

// 添加错误处理
let app
try {
  app = initializeApp(firebaseConfig)
  console.log("Firebase 初始化成功")
} catch (error) {
  console.error("Firebase 初始化失败:", error)
  throw error
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export default app
