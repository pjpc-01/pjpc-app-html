import { motion } from "framer-motion"
// 移除电竞主题引用
import SafeAreaLayout from "./SafeAreaLayout"
import TVBoardContainer from "./TVBoardContainer"

interface ErrorScreenProps {
  error: string
  onRetry: () => void
  debugMode?: boolean
}

export default function ErrorScreen({ error, onRetry, debugMode = false }: ErrorScreenProps) {
  return (
    <div className="bg-gradient-to-br from-gray-900 via-black to-blue-900 min-h-screen">
      <SafeAreaLayout debugMode={debugMode}>
        <TVBoardContainer debugMode={debugMode}>
          <div className="h-full w-full flex items-center justify-center">
            <motion.div
              className="text-center max-w-md mx-auto p-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="text-red-400 text-6xl mb-4"
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ⚠️
              </motion.div>
              
              <h1 className="text-red-400 text-2xl font-bold mb-4">
                CONNECTION ERROR
              </h1>
              
              <p className="text-gray-400 text-lg mb-6">
                {error}
              </p>
              
              <motion.button
                onClick={onRetry}
                className="px-6 py-3 bg-red-400/20 text-red-400 rounded-lg border border-red-400/50 hover:bg-red-400/30 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                RETRY CONNECTION
              </motion.button>
            </motion.div>
          </div>
        </TVBoardContainer>
      </SafeAreaLayout>
    </div>
  )
}
