import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import {
  DashboardRounded,
  CloudUploadRounded,
  SearchRounded,
  ChatRounded,
  SummarizeRounded,
  QuizRounded,
  LightModeRounded,
  DarkModeRounded,
  AutoAwesomeRounded,
  MenuRounded,
  ChevronLeftRounded,
} from '@mui/icons-material';

const Navigation = ({ onMobileClose, isExpanded = false, onToggle, isHorizontal = false }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const [localExpanded, setLocalExpanded] = useState(isExpanded);

  const navItems = [
    {
      name: 'Dashboard',
      path: '/',
      icon: DashboardRounded,
      gradient: 'from-primary-500 to-primary-600',
      description: 'Overview & Analytics'
    },
    {
      name: 'Upload',
      path: '/upload',
      icon: CloudUploadRounded,
      gradient: 'from-success-500 to-success-600',
      description: 'Document Management'
    },
    {
      name: 'Search',
      path: '/search',
      icon: SearchRounded,
      gradient: 'from-accent-500 to-accent-600',
      description: 'Find & Discover'
    },
    {
      name: 'AI Chat',
      path: '/chat',
      icon: ChatRounded,
      gradient: 'from-warning-500 to-warning-600',
      description: 'Legal Assistant'
    },
    {
      name: 'Summarize',
      path: '/summarization',
      icon: SummarizeRounded,
      gradient: 'from-error-500 to-error-600',
      description: 'Document Insights'
    },
    {
      name: 'Q&A Generator',
      path: '/questions',
      icon: QuizRounded,
      gradient: 'from-purple-500 to-purple-600',
      description: 'Question Creation'
    },
  ];

  const isActiveRoute = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = () => {
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const handleToggle = () => {
    const newExpanded = !localExpanded;
    setLocalExpanded(newExpanded);
    if (onToggle) {
      onToggle(newExpanded);
    }
  };

  const currentExpanded = isExpanded !== undefined ? isExpanded : localExpanded;

  // Horizontal layout for fullscreen
  if (isHorizontal) {
    return (
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-8 h-8 rounded-2xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 shadow-glow flex items-center justify-center"
          >
            <AutoAwesomeRounded className="text-white text-lg" />
          </motion.div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-accent-400">
              LegalAI
            </h1>
          </div>
        </div>

        {/* Horizontal Navigation */}
        <nav className="flex items-center space-x-2">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = isActiveRoute(item.path);
            
            return (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <NavLink
                  to={item.path}
                  onClick={handleNavClick}
                  className="group"
                  title={item.description}
                >
                  <motion.div
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer flex items-center space-x-2
                      ${isActive
                        ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 dark:from-primary-400/10 dark:to-accent-400/10 shadow-soft'
                        : 'hover:bg-secondary-100/50 dark:hover:bg-secondary-800/50'
                      }
                    `}
                  >
                    <motion.div
                      className={`
                        p-1.5 rounded-lg transition-all duration-300
                        ${isActive
                          ? `bg-gradient-to-br ${item.gradient} shadow-medium`
                          : 'bg-secondary-200/50 dark:bg-secondary-700/50 group-hover:bg-secondary-300/50 dark:group-hover:bg-secondary-600/50'
                        }
                      `}
                    >
                      <Icon 
                        className={`
                          text-base transition-colors duration-300
                          ${isActive
                            ? 'text-white'
                            : 'text-secondary-600 dark:text-secondary-300'
                          }
                        `}
                      />
                    </motion.div>
                    
                    <span className={`
                      text-sm font-medium transition-colors duration-300 whitespace-nowrap
                      ${isActive
                        ? 'text-secondary-900 dark:text-white'
                        : 'text-secondary-700 dark:text-secondary-200 group-hover:text-secondary-900 dark:group-hover:text-white'
                      }
                    `}>
                      {item.name}
                    </span>
                  </motion.div>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-gradient-to-r from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 hover:from-secondary-200 hover:to-secondary-300 dark:hover:from-secondary-700 dark:hover:to-secondary-600 transition-all duration-300 shadow-soft"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <motion.div
            animate={{ rotate: isDark ? 180 : 0 }}
            transition={{ duration: 0.3 }}
            className="p-1 rounded-lg bg-gradient-to-br from-warning-400 to-warning-500 shadow-medium"
          >
            {isDark ? (
              <DarkModeRounded className="text-white text-base" />
            ) : (
              <LightModeRounded className="text-white text-base" />
            )}
          </motion.div>
        </motion.button>
      </div>
    );
  }

  // Vertical layout (default)
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`border-b border-secondary-200/50 dark:border-secondary-700/50 transition-all duration-300 ${
          currentExpanded ? 'p-6' : 'p-4'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className={`flex items-center transition-all duration-300 ${currentExpanded ? 'space-x-3' : 'space-x-0'}`}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              className={`rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 shadow-glow flex items-center justify-center transition-all duration-300 ${
                currentExpanded ? 'w-10 h-10' : 'w-8 h-8'
              }`}
            >
              <AutoAwesomeRounded className={`text-white transition-all duration-300 ${currentExpanded ? 'text-xl' : 'text-lg'}`} />
            </motion.div>
            
            <AnimatePresence>
              {currentExpanded && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-accent-400 whitespace-nowrap">
                    LegalAI
                  </h1>
                  <p className="text-xs text-secondary-500 dark:text-secondary-400 font-medium whitespace-nowrap">
                    Case Analysis Suite
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Toggle Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleToggle}
            className="p-2 rounded-xl bg-secondary-100 dark:bg-secondary-800 hover:bg-secondary-200 dark:hover:bg-secondary-700 transition-colors duration-200"
          >
            <motion.div
              animate={{ rotate: currentExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              {currentExpanded ? (
                <ChevronLeftRounded className="text-lg text-secondary-600 dark:text-secondary-300" />
              ) : (
                <MenuRounded className="text-lg text-secondary-600 dark:text-secondary-300" />
              )}
            </motion.div>
          </motion.button>
        </div>
      </motion.div>

      {/* Navigation Menu */}
      <nav className={`flex-1 space-y-1 transition-all duration-300 ${currentExpanded ? 'p-4' : 'p-2'}`}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = isActiveRoute(item.path);
          
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <NavLink
                to={item.path}
                onClick={handleNavClick}
                className="group block"
                title={!currentExpanded ? item.name : ''}
              >
                <motion.div
                  whileHover={{ scale: 1.02, x: currentExpanded ? 4 : 0 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative rounded-2xl transition-all duration-300 cursor-pointer
                    ${currentExpanded ? 'p-3' : 'p-2 mx-1'}
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 dark:from-primary-400/10 dark:to-accent-400/10 shadow-soft'
                      : 'hover:bg-secondary-100/50 dark:hover:bg-secondary-800/50'
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && currentExpanded && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-accent-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  {/* Active Indicator for Condensed */}
                  {isActive && !currentExpanded && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-accent-500/20 rounded-2xl"
                      layoutId="activeTabCondensed"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className={`flex items-center transition-all duration-300 ${
                    currentExpanded ? 'space-x-3' : 'justify-center'
                  }`}>
                    <motion.div
                      className={`
                        rounded-xl transition-all duration-300 relative z-10
                        ${currentExpanded ? 'p-2' : 'p-1.5'}
                        ${isActive
                          ? `bg-gradient-to-br ${item.gradient} shadow-medium`
                          : 'bg-secondary-200/50 dark:bg-secondary-700/50 group-hover:bg-secondary-300/50 dark:group-hover:bg-secondary-600/50'
                        }
                      `}
                    >
                      <Icon 
                        className={`
                          transition-colors duration-300
                          ${currentExpanded ? 'text-lg' : 'text-base'}
                          ${isActive
                            ? 'text-white'
                            : 'text-secondary-600 dark:text-secondary-300'
                          }
                        `}
                      />
                    </motion.div>
                    
                    <AnimatePresence>
                      {currentExpanded && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.3 }}
                          className="flex-1 overflow-hidden"
                        >
                          <h3 className={`
                            font-semibold transition-colors duration-300 whitespace-nowrap
                            ${isActive
                              ? 'text-secondary-900 dark:text-white'
                              : 'text-secondary-700 dark:text-secondary-200 group-hover:text-secondary-900 dark:group-hover:text-white'
                            }
                          `}>
                            {item.name}
                          </h3>
                          <p className={`
                            text-xs transition-colors duration-300 whitespace-nowrap
                            ${isActive
                              ? 'text-secondary-600 dark:text-secondary-300'
                              : 'text-secondary-500 dark:text-secondary-400'
                            }
                          `}>
                            {item.description}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Arrow Indicator - Only show when expanded */}
                    <AnimatePresence>
                      {currentExpanded && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: isActive ? 1 : 0 }}
                          exit={{ opacity: 0 }}
                          className="transition-all duration-300"
                        >
                          <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className={`border-t border-secondary-200/50 dark:border-secondary-700/50 space-y-3 transition-all duration-300 ${
        currentExpanded ? 'p-4' : 'p-2'
      }`}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className={`w-full rounded-2xl bg-gradient-to-r from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 hover:from-secondary-200 hover:to-secondary-300 dark:hover:from-secondary-700 dark:hover:to-secondary-600 transition-all duration-300 shadow-soft ${
            currentExpanded ? 'p-3' : 'p-2'
          }`}
          title={!currentExpanded ? (isDark ? 'Dark Mode' : 'Light Mode') : ''}
        >
          <div className={`flex items-center transition-all duration-300 ${
            currentExpanded ? 'justify-start space-x-3' : 'justify-center'
          }`}>
            <motion.div
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className={`rounded-xl bg-gradient-to-br from-warning-400 to-warning-500 shadow-medium ${
                currentExpanded ? 'p-2' : 'p-1.5'
              }`}
            >
              {isDark ? (
                <DarkModeRounded className={`text-white ${currentExpanded ? 'text-lg' : 'text-base'}`} />
              ) : (
                <LightModeRounded className={`text-white ${currentExpanded ? 'text-lg' : 'text-base'}`} />
              )}
            </motion.div>
            
            <AnimatePresence>
              {currentExpanded && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-medium text-secondary-700 dark:text-secondary-200 whitespace-nowrap"
                >
                  {isDark ? 'Dark Mode' : 'Light Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </motion.button>

        <AnimatePresence>
          {currentExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center overflow-hidden"
            >
              <p className="text-xs text-secondary-400 dark:text-secondary-500">
                Powered by AI Technology
              </p>
              <p className="text-xs text-secondary-300 dark:text-secondary-600 mt-1">
                v2.0.1 • Legal Suite
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Navigation;
