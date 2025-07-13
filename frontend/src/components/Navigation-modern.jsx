import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
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
} from '@mui/icons-material';

const Navigation = ({ onMobileClose }) => {
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();

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

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 border-b border-secondary-200/50 dark:border-secondary-700/50"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ scale: 1.05, rotate: 5 }}
            className="w-12 h-12 rounded-3xl bg-gradient-to-br from-primary-500 via-primary-600 to-accent-500 shadow-glow flex items-center justify-center"
          >
            <AutoAwesomeRounded className="text-white text-2xl" />
          </motion.div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent dark:from-primary-400 dark:to-accent-400">
              LegalAI
            </h1>
            <p className="text-sm text-secondary-500 dark:text-secondary-400 font-medium">
              Case Analysis Suite
            </p>
          </div>
        </div>
      </motion.div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-6 space-y-2">
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
              >
                <motion.div
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative p-4 rounded-2xl transition-all duration-300 cursor-pointer
                    ${isActive
                      ? 'bg-gradient-to-r from-primary-500/10 to-accent-500/10 dark:from-primary-400/10 dark:to-accent-400/10 shadow-soft'
                      : 'hover:bg-secondary-100/50 dark:hover:bg-secondary-800/50'
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-primary-500 to-accent-500 rounded-r-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}

                  <div className="flex items-center space-x-4">
                    <motion.div
                      className={`
                        p-2 rounded-xl transition-all duration-300
                        ${isActive
                          ? `bg-gradient-to-br ${item.gradient} shadow-medium`
                          : 'bg-secondary-200/50 dark:bg-secondary-700/50 group-hover:bg-secondary-300/50 dark:group-hover:bg-secondary-600/50'
                        }
                      `}
                    >
                      <Icon 
                        className={`
                          text-xl transition-colors duration-300
                          ${isActive
                            ? 'text-white'
                            : 'text-secondary-600 dark:text-secondary-300'
                          }
                        `}
                      />
                    </motion.div>
                    
                    <div className="flex-1">
                      <h3 className={`
                        font-semibold transition-colors duration-300
                        ${isActive
                          ? 'text-secondary-900 dark:text-white'
                          : 'text-secondary-700 dark:text-secondary-200 group-hover:text-secondary-900 dark:group-hover:text-white'
                        }
                      `}>
                        {item.name}
                      </h3>
                      <p className={`
                        text-xs transition-colors duration-300
                        ${isActive
                          ? 'text-secondary-600 dark:text-secondary-300'
                          : 'text-secondary-500 dark:text-secondary-400'
                        }
                      `}>
                        {item.description}
                      </p>
                    </div>

                    {/* Arrow Indicator */}
                    <motion.div
                      className={`
                        transition-all duration-300
                        ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 group-hover:opacity-60 group-hover:translate-x-0'}
                      `}
                    >
                      <svg className="w-4 h-4 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </div>
                </motion.div>
              </NavLink>
            </motion.div>
          );
        })}
      </nav>

      {/* Theme Toggle & Footer */}
      <div className="p-6 border-t border-secondary-200/50 dark:border-secondary-700/50 space-y-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={toggleTheme}
          className="w-full p-4 rounded-2xl bg-gradient-to-r from-secondary-100 to-secondary-200 dark:from-secondary-800 dark:to-secondary-700 hover:from-secondary-200 hover:to-secondary-300 dark:hover:from-secondary-700 dark:hover:to-secondary-600 transition-all duration-300 shadow-soft"
        >
          <div className="flex items-center justify-center space-x-3">
            <motion.div
              animate={{ rotate: isDark ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              className="p-2 rounded-xl bg-gradient-to-br from-warning-400 to-warning-500 shadow-medium"
            >
              {isDark ? (
                <DarkModeRounded className="text-white text-lg" />
              ) : (
                <LightModeRounded className="text-white text-lg" />
              )}
            </motion.div>
            <span className="font-medium text-secondary-700 dark:text-secondary-200">
              {isDark ? 'Dark Mode' : 'Light Mode'}
            </span>
          </div>
        </motion.button>

        <div className="text-center">
          <p className="text-xs text-secondary-400 dark:text-secondary-500">
            Powered by AI Technology
          </p>
          <p className="text-xs text-secondary-300 dark:text-secondary-600 mt-1">
            v2.0.1 • Legal Suite
          </p>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
