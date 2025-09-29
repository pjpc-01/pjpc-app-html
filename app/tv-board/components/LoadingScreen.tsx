import { motion } from "framer-motion"
// 移除电竞主题引用
import SafeAreaLayout from "./SafeAreaLayout"
import TVBoardContainer from "./TVBoardContainer"

interface LoadingScreenProps {
  center: string
  debugMode?: boolean
}

export default function LoadingScreen({ center, debugMode = false }: LoadingScreenProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-blue-900 min-h-screen">
      <SafeAreaLayout debugMode={debugMode}>
        <TVBoardContainer debugMode={debugMode}>
          <div className="h-full w-full flex items-center justify-center">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-cyan-400 text-4xl font-bold mb-4"
                animate={{
                  opacity: [0.5, 1, 0.5],
                  scale: [0.9, 1.1, 0.9]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                LOADING...
              </motion.div>
              <div className="text-gray-400 text-lg">
                {center} • 正在加载数据
              </div>
              
              {/* 加载动画 */}
              <div className="mt-8 flex justify-center">
                <motion.div
                  className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                />
              </div>
            </motion.div>
          </div>
        </TVBoardContainer>
      </SafeAreaLayout>
    </div>
  )
}
