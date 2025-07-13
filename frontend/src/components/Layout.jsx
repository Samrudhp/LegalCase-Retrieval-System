import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Box, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import Navigation from './Navigation';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('lg'));

  // Detect fullscreen changes
  React.useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  const sidebarVariants = {
    open: {
      x: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    closed: {
      x: isMobile ? -320 : (sidebarExpanded ? -320 : -80),
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    }
  };

  const overlayVariants = {
    open: {
      opacity: 1,
      visibility: "visible",
      transition: { duration: 0.3 }
    },
    closed: {
      opacity: 0,
      visibility: "hidden",
      transition: { duration: 0.3 }
    }
  };

  return (
    <Box className="min-h-screen bg-gradient-to-br from-secondary-50 via-white to-primary-50 dark:from-secondary-950 dark:via-secondary-900 dark:to-secondary-950">
      {/* Fullscreen Horizontal Navigation */}
      {isFullScreen && (
        <motion.nav
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-xl border-b border-secondary-200/50 dark:border-secondary-700/50 shadow-large"
        >
          <div className="px-6 py-3">
            <Navigation 
              isHorizontal={true}
              isExpanded={true}
              onMobileClose={() => {}}
            />
          </div>
        </motion.nav>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && !isFullScreen && (
          <motion.div
            variants={overlayVariants}
            initial="closed"
            animate="open"
            exit="closed"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Hidden in fullscreen */}
      {!isFullScreen && (
        <motion.aside
          variants={sidebarVariants}
          initial="closed"
          animate={sidebarOpen || !isMobile ? "open" : "closed"}
          className={`fixed top-0 left-0 z-50 h-full lg:relative lg:z-auto transition-all duration-300 ${
            isMobile ? 'w-80' : (sidebarExpanded ? 'w-80' : 'w-20')
          }`}
        >
          <div className="h-full bg-white/80 dark:bg-secondary-900/80 backdrop-blur-xl border-r border-secondary-200/50 dark:border-secondary-700/50 shadow-large">
            <Navigation 
              onMobileClose={() => setSidebarOpen(false)} 
              isExpanded={isMobile ? true : sidebarExpanded}
              onToggle={setSidebarExpanded}
              isHorizontal={false}
            />
          </div>
        </motion.aside>
      )}

      {/* Main Content */}
      <motion.main
        className={`flex-1 min-h-screen transition-all duration-300 ${
          isFullScreen 
            ? 'pt-20' // Top padding for horizontal nav
            : isMobile 
              ? 'lg:ml-80' 
              : (sidebarExpanded ? 'lg:ml-80' : 'lg:ml-20')
        }`}
      >
        {/* Top Bar for Mobile - Hidden in fullscreen */}
        {isMobile && !isFullScreen && (
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="sticky top-0 z-30 bg-white/90 dark:bg-secondary-900/90 backdrop-blur-lg border-b border-secondary-200/50 dark:border-secondary-700/50 px-6 py-4"
          >
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSidebarOpen(true)}
                className="p-3 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium hover:shadow-glow transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </motion.button>
              
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center space-x-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-secondary-900 dark:text-white">LegalAI</h1>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400">Case Analysis</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Page Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="p-6 lg:p-8 xl:p-12 w-full"
        >
          <div className="w-full">
            <Outlet />
          </div>
        </motion.div>

        {/* Floating Elements for Visual Interest */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-20 right-20 w-32 h-32 bg-gradient-to-br from-primary-200/20 to-accent-200/20 rounded-full blur-xl"
          />
          <motion.div
            animate={{ 
              y: [0, 15, 0],
              rotate: [0, -3, 0]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-20 left-20 w-24 h-24 bg-gradient-to-br from-accent-200/20 to-primary-200/20 rounded-full blur-xl"
          />
        </div>
      </motion.main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
            borderRadius: '16px',
            boxShadow: '0 4px 25px -4px rgba(0, 0, 0, 0.12), 0 8px 16px -4px rgba(0, 0, 0, 0.08)',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
    </Box>
  );
};

export default Layout;
