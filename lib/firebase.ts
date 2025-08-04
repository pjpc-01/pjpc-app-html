import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

// 从环境变量获取配置，提供更好的安全性
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBchBlKL46qpZ7x4KrYhgpfiZrFc6ARd7s",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "pjpcdata-d115f.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://pjpcdata-d115f-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "pjpcdata-d115f",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "pjpcdata-d115f.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1053989905931",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1053989905931:web:822783027c06d12425090e",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-LLX6JJKD32"
}

// 验证必要的配置
const requiredConfigKeys = ['apiKey', 'authDomain', 'projectId']
const missingKeys = requiredConfigKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig])

if (missingKeys.length > 0) {
  console.error('Missing required Firebase configuration:', missingKeys)
  throw new Error(`Missing Firebase configuration: ${missingKeys.join(', ')}`)
}

// 添加错误处理和重试机制
let app
let retryCount = 0
const maxRetries = 3

const initializeFirebase = () => {
  try {
    app = initializeApp(firebaseConfig)
    console.log("Firebase 初始化成功")
    return app
  } catch (error) {
    console.error("Firebase 初始化失败:", error)
    if (retryCount < maxRetries) {
      retryCount++
      console.log(`重试 Firebase 初始化 (${retryCount}/${maxRetries})`)
      setTimeout(initializeFirebase, 1000 * retryCount)
    } else {
      throw new Error(`Firebase 初始化失败，已重试 ${maxRetries} 次`)
    }
  }
}

app = initializeFirebase()

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

// 添加连接状态检查
export const checkFirebaseConnection = async () => {
  try {
    // 简单的连接测试
    await auth.authStateReady()
    return { connected: true, error: null }
  } catch (error) {
    return { 
      connected: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
