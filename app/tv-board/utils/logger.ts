// 开发环境日志工具
export const devLog = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(...args)
  }
}

export const devWarn = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(...args)
  }
}

export const devError = (...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(...args)
  }
}

// 带前缀的日志
export const tvLog = (...args: any[]) => devLog('[TV]', ...args)
export const tvWarn = (...args: any[]) => devWarn('[TV]', ...args)
export const tvError = (...args: any[]) => devError('[TV]', ...args)
