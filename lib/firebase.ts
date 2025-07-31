import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBchBlKL46qpZ7x4KrYhgpfiZrFc6ARd7s",
  authDomain: "pjpcdata-d115f.firebaseapp.com",
  databaseURL: "https://pjpcdata-d115f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "pjpcdata-d115f",
  storageBucket: "pjpcdata-d115f.firebasestorage.app",
  messagingSenderId: "1053989905931",
  appId: "1:1053989905931:web:822783027c06d12425090e",
  measurementId: "G-LLX6JJKD32"
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

// Initialize Analytics (only in browser environment)
let analytics = null
if (typeof window !== 'undefined') {
  try {
    analytics = getAnalytics(app)
  } catch (error) {
    console.warn("Analytics initialization failed:", error)
  }
}

export const auth = getAuth(app)
export const db = getFirestore(app)
export { analytics }
export default app
