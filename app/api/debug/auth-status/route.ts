import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase'
import { getAuth } from 'firebase/auth'

export async function GET(request: NextRequest) {
  try {
    const currentUser = auth.currentUser
    
    return NextResponse.json({
      success: true,
      authenticated: !!currentUser,
      user: currentUser ? {
        uid: currentUser.uid,
        email: currentUser.email,
        emailVerified: currentUser.emailVerified,
        displayName: currentUser.displayName
      } : null,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('认证状态检查失败:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: '认证状态检查失败',
        details: error.message 
      },
      { status: 500 }
    )
  }
} 