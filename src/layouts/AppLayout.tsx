import { motion, AnimatePresence } from 'framer-motion'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from '../components/layout/Sidebar'
import { Header } from '../components/layout/Header'
import { LevelUpModal } from '../components/animations/LevelUpModal'
import { useUIStore } from '../store/uiStore'
import { Toaster } from 'react-hot-toast'

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export const AppLayout = () => {
  const { sidebarCollapsed, sidebarOpen } = useUIStore()
  const location = useLocation()

  const sidebarWidth = sidebarCollapsed ? 72 : 260

  return (
    <div className="min-h-screen bg-bg-primary">
      {/* Subtle grid background */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0 opacity-50" />

      {/* Sidebar */}
      <Sidebar />

      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Main area — offset by sidebar */}
      <motion.div
        animate={{ marginLeft: sidebarWidth }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="min-h-screen flex flex-col"
      >
        <Header />

        {/* Page content */}
        <main className="flex-1 pt-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="p-4 sm:p-6 min-h-[calc(100vh-64px)]"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>

      {/* Global overlays */}
      <LevelUpModal />

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
