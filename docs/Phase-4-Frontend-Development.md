# Phase 4: Frontend Development & React Architecture

## 🎨 Overview

This phase explores the complete frontend development architecture, covering React 19 implementation, modern UI patterns, state management, component design, user experience optimization, and production-ready frontend engineering practices.

## 🏗️ Frontend Architecture Overview

### Modern React Application Structure
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Frontend Architecture                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   React Router (SPA Navigation)          State Management                  │
│         │                                      │                          │
│         ▼                                      ▼                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Dashboard     │    │     Upload      │    │     Search      │        │
│  │   Component     │    │   Component     │    │   Component     │        │
│  │                 │    │                 │    │                 │        │
│  │ • Analytics     │    │ • File Upload   │    │ • Vector Query  │        │
│  │ • Statistics    │    │ • Progress Bar  │    │ • Filter UI     │        │
│  │ • Quick Access  │    │ • Validation    │    │ • Result List   │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│         │                       │                       │                │
│         ▼                       ▼                       ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │      Chat       │    │  Summarization  │    │ Question Gen    │        │
│  │   Component     │    │   Component     │    │   Component     │        │
│  │                 │    │                 │    │                 │        │
│  │ • RAG Interface │    │ • Multi-format  │    │ • AI Generated  │        │
│  │ • Message UI    │    │ • Export Tools  │    │ • Difficulty    │        │
│  │ • Context Mgmt  │    │ • Download      │    │ • Type Filter   │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│         │                       │                       │                │
│         └───────────────────────┼───────────────────────┘                │
│                                 │                                        │
│           ┌─────────────────────────────────────────────────────────────┐  │
│           │                   Shared Components                        │  │
│           │                                                             │  │
│           │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│           │  │   Layout    │  │ Navigation  │  │  API Client │        │  │
│           │  │ Components  │  │   System    │  │   Service   │        │  │
│           │  │             │  │             │  │             │        │  │
│           │  │ • Header    │  │ • Modern UI │  │ • TanStack  │        │  │
│           │  │ • Sidebar   │  │ • Breadcrumb│  │ • Error Hdl │        │  │
│           │  │ • Footer    │  │ • Mobile    │  │ • Caching   │        │  │
│           │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│           └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## ⚛️ React 19 Implementation

### Main Application Setup
```jsx
// src/main.jsx
/**
 * Modern React 19 application entry point with enhanced features
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import { CssBaseline, StyledEngineProvider } from '@mui/material'
import { ErrorBoundary } from 'react-error-boundary'

import App from './App.jsx'
import { theme } from './theme/index.js'
import { ThemeContextProvider } from './contexts/ThemeContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import ErrorFallback from './components/ErrorFallback.jsx'
import './index.css'

// Configure React Query with production optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: (failureCount, error) => {
        if (error.status === 404) return false
        return failureCount < 3
      },
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 1,
    },
  },
})

// Error boundary handler
function handleError(error, info) {
  console.error('Application Error:', error)
  console.error('Error Info:', info)
  
  // Send to monitoring service in production
  if (import.meta.env.PROD) {
    // Analytics/monitoring service call
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      <StyledEngineProvider injectFirst>
        <ThemeContextProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <QueryClientProvider client={queryClient}>
              <NotificationProvider>
                <AuthProvider>
                  <BrowserRouter>
                    <App />
                  </BrowserRouter>
                </AuthProvider>
              </NotificationProvider>
              {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
            </QueryClientProvider>
          </ThemeProvider>
        </ThemeContextProvider>
      </StyledEngineProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
```

### Advanced App Component with Routing
```jsx
// src/App.jsx
/**
 * Main application component with modern routing and layout management
 */

import { Suspense, lazy, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, LinearProgress } from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { AnimatePresence, motion } from 'framer-motion'

import Layout from './components/Layout.jsx'
import { useAuth } from './hooks/useAuth'
import { useNotification } from './hooks/useNotification'
import LoadingScreen from './components/LoadingScreen.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

// Lazy load components for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'))
const Upload = lazy(() => import('./pages/Upload.jsx'))
const Search = lazy(() => import('./pages/Search.jsx'))
const Chat = lazy(() => import('./pages/Chat.jsx'))
const Summarization = lazy(() => import('./pages/Summarization.jsx'))
const QuestionGeneration = lazy(() => import('./pages/QuestionGeneration.jsx'))
const Settings = lazy(() => import('./pages/Settings.jsx'))
const Profile = lazy(() => import('./pages/Profile.jsx'))

// Route configuration
const routes = [
  { path: '/', element: <Dashboard />, protected: true },
  { path: '/upload', element: <Upload />, protected: true },
  { path: '/search', element: <Search />, protected: true },
  { path: '/chat', element: <Chat />, protected: true },
  { path: '/summarization', element: <Summarization />, protected: true },
  { path: '/questions', element: <QuestionGeneration />, protected: true },
  { path: '/settings', element: <Settings />, protected: true },
  { path: '/profile', element: <Profile />, protected: true },
]

// Page transition variants
const pageVariants = {
  initial: { opacity: 0, x: 20 },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: -20 }
}

const pageTransition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.3
}

function App() {
  const theme = useTheme()
  const { isAuthenticated, isLoading } = useAuth()
  const { showNotification } = useNotification()

  // Global error handling
  useEffect(() => {
    const handleUnhandledRejection = (event) => {
      console.error('Unhandled promise rejection:', event.reason)
      showNotification('An unexpected error occurred', 'error')
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [showNotification])

  // Show loading screen during auth check
  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: theme.palette.background.default,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Layout>
        <Suspense fallback={
          <Box sx={{ width: '100%', mt: 2 }}>
            <LinearProgress />
          </Box>
        }>
          <AnimatePresence mode="wait">
            <Routes>
              {routes.map(({ path, element, protected: isProtected }) => (
                <Route
                  key={path}
                  path={path}
                  element={
                    <motion.div
                      initial="initial"
                      animate="in"
                      exit="out"
                      variants={pageVariants}
                      transition={pageTransition}
                      style={{ width: '100%' }}
                    >
                      {isProtected ? (
                        <ProtectedRoute>
                          {element}
                        </ProtectedRoute>
                      ) : (
                        element
                      )}
                    </motion.div>
                  }
                />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AnimatePresence>
        </Suspense>
      </Layout>
    </Box>
  )
}

export default App
```

## 🎭 Advanced Component Architecture

### Modern Layout Component
```jsx
// src/components/Layout.jsx
/**
 * Advanced responsive layout with modern navigation patterns
 */

import { useState, useEffect } from 'react'
import { 
  Box, 
  Drawer, 
  AppBar, 
  Toolbar, 
  Typography,
  IconButton,
  useMediaQuery,
  Fade,
  Slide
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

import Navigation from './Navigation.jsx'
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import { useAuth } from '../hooks/useAuth'

const DRAWER_WIDTH = 280
const MOBILE_DRAWER_WIDTH = 320

function Layout({ children }) {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { isAuthenticated } = useAuth()

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen)
  }

  // Handle sidebar collapse
  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // Close mobile drawer on route change
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false)
    }
  }, [location.pathname, isMobile])

  // Responsive drawer width
  const drawerWidth = isMobile 
    ? MOBILE_DRAWER_WIDTH 
    : isCollapsed 
      ? 80 
      : DRAWER_WIDTH

  const drawerContent = (
    <Box sx={{ 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      bgcolor: theme.palette.background.paper,
      borderRight: `1px solid ${theme.palette.divider}`
    }}>
      {/* Logo/Brand Area */}
      <Box sx={{ 
        p: 2, 
        borderBottom: `1px solid ${theme.palette.divider}`,
        display: 'flex',
        alignItems: 'center',
        minHeight: 64
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Typography 
            variant="h6" 
            component="div"
            sx={{ 
              fontWeight: 'bold',
              color: theme.palette.primary.main,
              display: isCollapsed && !isMobile ? 'none' : 'block'
            }}
          >
            Legal Case AI
          </Typography>
        </motion.div>
        
        {isMobile && (
          <IconButton 
            onClick={handleDrawerToggle}
            sx={{ ml: 'auto' }}
          >
            <CloseIcon />
          </IconButton>
        )}
      </Box>

      {/* Navigation */}
      <Navigation 
        collapsed={isCollapsed && !isMobile}
        onItemClick={() => isMobile && setMobileOpen(false)}
      />

      {/* Collapse Toggle (Desktop Only) */}
      {!isMobile && isAuthenticated && (
        <Box sx={{ 
          mt: 'auto', 
          p: 1, 
          borderTop: `1px solid ${theme.palette.divider}` 
        }}>
          <IconButton 
            onClick={handleCollapse}
            sx={{ 
              width: '100%',
              borderRadius: 1,
              '&:hover': {
                bgcolor: theme.palette.action.hover
              }
            }}
          >
            <MenuIcon sx={{ 
              transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }} />
          </IconButton>
        </Box>
      )}
    </Box>
  )

  if (!isAuthenticated) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <Slide direction="down" in={true} mountOnEnter unmountOnExit>
          <AppBar 
            position="fixed" 
            sx={{ 
              zIndex: theme.zIndex.drawer + 1,
              bgcolor: theme.palette.background.paper,
              color: theme.palette.text.primary,
              boxShadow: theme.shadows[1]
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div">
                Legal Case AI
              </Typography>
            </Toolbar>
          </AppBar>
        </Slide>
      )}

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { md: drawerWidth }, 
          flexShrink: { md: 0 } 
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: MOBILE_DRAWER_WIDTH,
              bgcolor: theme.palette.background.paper
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              bgcolor: theme.palette.background.paper,
              transition: theme.transitions.create('width', {
                easing: theme.transitions.easing.sharp,
                duration: theme.transitions.duration.enteringScreen,
              }),
              overflowX: 'hidden'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          mt: { xs: 8, md: 0 } // Account for mobile app bar
        }}
      >
        {/* Header (Desktop Only) */}
        {!isMobile && <Header />}
        
        {/* Page Content */}
        <Box sx={{ 
          flexGrow: 1, 
          p: { xs: 1, sm: 2, md: 3 },
          bgcolor: theme.palette.background.default 
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Footer */}
        <Footer />
      </Box>
    </Box>
  )
}

export default Layout
```

### Advanced Navigation Component
```jsx
// src/components/Navigation.jsx
/**
 * Intelligent navigation with role-based access and modern UX
 */

import { useState, useMemo } from 'react'
import { 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText,
  Collapse,
  Chip,
  Badge,
  Tooltip,
  Box,
  Divider,
  Typography
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Dashboard as DashboardIcon,
  CloudUpload as UploadIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Summarize as SummarizeIcon,
  Quiz as QuizIcon,
  Settings as SettingsIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Notifications,
  Analytics
} from '@mui/icons-material'

import { useAuth } from '../hooks/useAuth'
import { useNotificationCount } from '../hooks/useNotificationCount'

// Navigation configuration with role-based access
const navigationConfig = [
  {
    id: 'overview',
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        icon: DashboardIcon,
        path: '/',
        roles: ['user', 'admin'],
        badge: null
      },
      {
        id: 'analytics',
        label: 'Analytics',
        icon: Analytics,
        path: '/analytics',
        roles: ['admin'],
        badge: 'pro'
      }
    ]
  },
  {
    id: 'documents',
    label: 'Document Management',
    items: [
      {
        id: 'upload',
        label: 'Upload Documents',
        icon: UploadIcon,
        path: '/upload',
        roles: ['user', 'admin'],
        badge: null
      },
      {
        id: 'search',
        label: 'Search Cases',
        icon: SearchIcon,
        path: '/search',
        roles: ['user', 'admin'],
        badge: null
      }
    ]
  },
  {
    id: 'ai-tools',
    label: 'AI-Powered Tools',
    items: [
      {
        id: 'chat',
        label: 'AI Chat',
        icon: ChatIcon,
        path: '/chat',
        roles: ['user', 'admin'],
        badge: 'new'
      },
      {
        id: 'summarization',
        label: 'Summarization',
        icon: SummarizeIcon,
        path: '/summarization',
        roles: ['user', 'admin'],
        badge: null
      },
      {
        id: 'questions',
        label: 'Question Generation',
        icon: QuizIcon,
        path: '/questions',
        roles: ['user', 'admin'],
        badge: null
      }
    ]
  },
  {
    id: 'account',
    label: 'Account',
    items: [
      {
        id: 'profile',
        label: 'Profile',
        icon: PersonIcon,
        path: '/profile',
        roles: ['user', 'admin'],
        badge: null
      },
      {
        id: 'settings',
        label: 'Settings',
        icon: SettingsIcon,
        path: '/settings',
        roles: ['user', 'admin'],
        badge: null
      }
    ]
  }
]

function Navigation({ collapsed = false, onItemClick }) {
  const theme = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { count: notificationCount } = useNotificationCount()
  
  const [expandedSections, setExpandedSections] = useState({
    overview: true,
    documents: true,
    'ai-tools': true,
    account: false
  })

  // Filter navigation items based on user role
  const filteredNavigation = useMemo(() => {
    return navigationConfig.map(section => ({
      ...section,
      items: section.items.filter(item => 
        item.roles.includes(user?.role || 'user')
      )
    })).filter(section => section.items.length > 0)
  }, [user?.role])

  const handleSectionToggle = (sectionId) => {
    if (collapsed) return
    
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const handleItemClick = (path) => {
    navigate(path)
    onItemClick?.()
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const renderBadge = (badge) => {
    if (!badge) return null

    const badgeConfig = {
      new: { color: 'success', label: 'NEW' },
      pro: { color: 'warning', label: 'PRO' },
      beta: { color: 'info', label: 'BETA' }
    }

    const config = badgeConfig[badge] || { color: 'default', label: badge.toUpperCase() }

    return (
      <Chip 
        label={config.label}
        size="small"
        color={config.color}
        sx={{ 
          height: 16, 
          fontSize: '0.625rem',
          ml: 1
        }}
      />
    )
  }

  const renderNavigationItem = (item) => {
    const active = isActive(item.path)
    const IconComponent = item.icon

    const listItemButton = (
      <ListItemButton
        onClick={() => handleItemClick(item.path)}
        selected={active}
        sx={{
          borderRadius: 1,
          mx: 1,
          mb: 0.5,
          minHeight: 44,
          '&.Mui-selected': {
            bgcolor: theme.palette.primary.light + '20',
            color: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.light + '30',
            }
          },
          '&:hover': {
            bgcolor: theme.palette.action.hover,
          }
        }}
      >
        <ListItemIcon sx={{ 
          minWidth: collapsed ? 'auto' : 56,
          color: active ? theme.palette.primary.main : 'inherit',
          justifyContent: 'center'
        }}>
          {item.id === 'notifications' ? (
            <Badge badgeContent={notificationCount} color="error">
              <IconComponent />
            </Badge>
          ) : (
            <IconComponent />
          )}
        </ListItemIcon>
        
        {!collapsed && (
          <ListItemText 
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {item.label}
                {renderBadge(item.badge)}
              </Box>
            }
            primaryTypographyProps={{
              variant: 'body2',
              fontWeight: active ? 600 : 400
            }}
          />
        )}
      </ListItemButton>
    )

    if (collapsed) {
      return (
        <Tooltip key={item.id} title={item.label} placement="right">
          <ListItem disablePadding>
            {listItemButton}
          </ListItem>
        </Tooltip>
      )
    }

    return (
      <ListItem key={item.id} disablePadding>
        {listItemButton}
      </ListItem>
    )
  }

  return (
    <Box sx={{ 
      flexGrow: 1, 
      overflow: 'auto',
      '&::-webkit-scrollbar': {
        width: 6,
      },
      '&::-webkit-scrollbar-track': {
        bgcolor: 'transparent',
      },
      '&::-webkit-scrollbar-thumb': {
        bgcolor: theme.palette.divider,
        borderRadius: 3,
      },
    }}>
      <List sx={{ pt: 1, pb: 1 }}>
        {filteredNavigation.map((section, sectionIndex) => (
          <Box key={section.id}>
            {sectionIndex > 0 && <Divider sx={{ my: 1 }} />}
            
            {!collapsed && (
              <ListItem disablePadding>
                <ListItemButton 
                  onClick={() => handleSectionToggle(section.id)}
                  sx={{ 
                    mx: 1, 
                    borderRadius: 1,
                    minHeight: 36,
                    '&:hover': {
                      bgcolor: theme.palette.action.hover,
                    }
                  }}
                >
                  <ListItemText 
                    primary={section.label}
                    primaryTypographyProps={{
                      variant: 'overline',
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem'
                    }}
                  />
                  {expandedSections[section.id] ? <ExpandLess /> : <ExpandMore />}
                </ListItemButton>
              </ListItem>
            )}

            <AnimatePresence>
              {(collapsed || expandedSections[section.id]) && (
                <motion.div
                  initial={collapsed ? {} : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Collapse 
                    in={collapsed || expandedSections[section.id]} 
                    timeout="auto" 
                    unmountOnExit
                  >
                    <List disablePadding>
                      {section.items.map(renderNavigationItem)}
                    </List>
                  </Collapse>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        ))}
      </List>
    </Box>
  )
}

export default Navigation
```

## 🎯 State Management with TanStack Query

### API Service Layer
```jsx
// src/services/api.js
/**
 * Advanced API service with caching, error handling, and optimization
 */

import axios from 'axios'
import { QueryClient } from '@tanstack/react-query'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Create axios instance with interceptors
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Add request ID for tracking
    config.headers['X-Request-ID'] = crypto.randomUUID()
    
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken')
      window.location.href = '/login'
    }
    
    return Promise.reject(error)
  }
)

// API endpoints
export const api = {
  // Document management
  documents: {
    upload: async (formData, onProgress) => {
      const response = await apiClient.post('/api/v1/ingestion/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
      })
      return response.data
    },
    
    list: async (params = {}) => {
      const response = await apiClient.get('/api/v1/ingestion/documents', { params })
      return response.data
    },
    
    getById: async (id) => {
      const response = await apiClient.get(`/api/v1/ingestion/documents/${id}`)
      return response.data
    },
    
    delete: async (id) => {
      const response = await apiClient.delete(`/api/v1/ingestion/documents/${id}`)
      return response.data
    }
  },

  // Search and retrieval
  search: {
    query: async (searchParams) => {
      const response = await apiClient.post('/api/v1/retrieval/search', searchParams)
      return response.data
    },
    
    semantic: async (query, filters = {}) => {
      const response = await apiClient.post('/api/v1/retrieval/semantic', {
        query,
        filters,
        limit: 20
      })
      return response.data
    }
  },

  // AI services
  ai: {
    chat: async (message, sessionId, context = []) => {
      const response = await apiClient.post('/api/v1/chat/message', {
        message,
        session_id: sessionId,
        context
      })
      return response.data
    },
    
    summarize: async (documentId, type = 'comprehensive') => {
      const response = await apiClient.post('/api/v1/summarization/create', {
        document_id: documentId,
        type
      })
      return response.data
    },
    
    generateQuestions: async (documentId, difficulty = 'medium', count = 10) => {
      const response = await apiClient.post('/api/v1/questions/generate', {
        document_id: documentId,
        difficulty,
        count
      })
      return response.data
    }
  },

  // System
  system: {
    health: async () => {
      const response = await apiClient.get('/health')
      return response.data
    },
    
    stats: async () => {
      const response = await apiClient.get('/api/v1/system/stats')
      return response.data
    }
  }
}

// Query keys for React Query
export const queryKeys = {
  documents: {
    all: ['documents'],
    lists: () => [...queryKeys.documents.all, 'list'],
    list: (filters) => [...queryKeys.documents.lists(), { filters }],
    details: () => [...queryKeys.documents.all, 'detail'],
    detail: (id) => [...queryKeys.documents.details(), id],
  },
  search: {
    all: ['search'],
    results: (query) => [...queryKeys.search.all, 'results', query],
  },
  ai: {
    all: ['ai'],
    chat: {
      all: [...queryKeys.ai.all, 'chat'],
      session: (sessionId) => [...queryKeys.ai.chat.all, sessionId],
    },
    summary: (documentId) => [...queryKeys.ai.all, 'summary', documentId],
    questions: (documentId) => [...queryKeys.ai.all, 'questions', documentId],
  },
  system: {
    health: ['system', 'health'],
    stats: ['system', 'stats'],
  }
}
```

## 📱 Responsive Page Components

### Modern Dashboard Component
```jsx
// src/pages/Dashboard.jsx
/**
 * Comprehensive dashboard with analytics and quick actions
 */

import { useState, useMemo } from 'react'
import { 
  Grid, 
  Card, 
  CardContent, 
  Typography, 
  Box,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Button,
  Chip
} from '@mui/material'
import { useTheme } from '@mui/material/styles'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  Description,
  Search,
  Chat,
  MoreVert,
  Add,
  Refresh
} from '@mui/icons-material'

import { api, queryKeys } from '../services/api'
import { useAuth } from '../hooks/useAuth'
import StatsCard from '../components/StatsCard'
import RecentActivity from '../components/RecentActivity'
import QuickActions from '../components/QuickActions'
import DocumentsList from '../components/DocumentsList'
import AnalyticsChart from '../components/AnalyticsChart'

const container = {
  hidden: { opacity: 1, scale: 0 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
}

const item = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1
  }
}

function Dashboard() {
  const theme = useTheme()
  const { user } = useAuth()
  const [anchorEl, setAnchorEl] = useState(null)

  // Fetch dashboard data
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: queryKeys.system.stats,
    queryFn: api.system.stats,
    refetchInterval: 60000, // Refetch every minute
  })

  const { data: recentDocuments, isLoading: documentsLoading } = useQuery({
    queryKey: queryKeys.documents.list({ limit: 5, sort: 'created_at' }),
    queryFn: () => api.documents.list({ limit: 5, sort: 'created_at' }),
  })

  // Calculate dashboard metrics
  const dashboardMetrics = useMemo(() => {
    if (!stats) return null

    return [
      {
        title: 'Total Documents',
        value: stats.documents?.total || 0,
        icon: Description,
        color: theme.palette.primary.main,
        trend: stats.documents?.trend || 0,
        subtitle: 'PDF files processed'
      },
      {
        title: 'Search Queries',
        value: stats.searches?.total || 0,
        icon: Search,
        color: theme.palette.success.main,
        trend: stats.searches?.trend || 0,
        subtitle: 'This month'
      },
      {
        title: 'AI Conversations',
        value: stats.conversations?.total || 0,
        icon: Chat,
        color: theme.palette.info.main,
        trend: stats.conversations?.trend || 0,
        subtitle: 'Active sessions'
      },
      {
        title: 'Processing Rate',
        value: `${stats.processing?.rate || 0}%`,
        icon: TrendingUp,
        color: theme.palette.warning.main,
        trend: stats.processing?.trend || 0,
        subtitle: 'Success rate'
      }
    ]
  }, [stats, theme])

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget)
  }

  const handleMenuClose = () => {
    setAnchorEl(null)
  }

  const handleRefresh = () => {
    refetchStats()
    handleMenuClose()
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3 
      }}>
        <Box>
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome back, {user?.name || 'User'}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's what's happening with your legal case analysis
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            href="/upload"
            sx={{ borderRadius: 2 }}
          >
            Upload Document
          </Button>
          
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem onClick={handleRefresh}>
              <Refresh sx={{ mr: 1 }} />
              Refresh Data
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      {/* Main Content */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
      >
        <Grid container spacing={3}>
          {/* Stats Cards */}
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <motion.div variants={item}>
                  <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
                </motion.div>
              </Grid>
            ))
          ) : (
            dashboardMetrics?.map((metric, index) => (
              <Grid item xs={12} sm={6} lg={3} key={index}>
                <motion.div variants={item}>
                  <StatsCard {...metric} />
                </motion.div>
              </Grid>
            ))
          )}

          {/* Quick Actions */}
          <Grid item xs={12} md={8}>
            <motion.div variants={item}>
              <QuickActions />
            </motion.div>
          </Grid>

          {/* Analytics Chart */}
          <Grid item xs={12} md={4}>
            <motion.div variants={item}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Usage Analytics
                  </Typography>
                  <AnalyticsChart data={stats?.analytics} />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Documents */}
          <Grid item xs={12} md={6}>
            <motion.div variants={item}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Recent Documents
                  </Typography>
                  <DocumentsList 
                    documents={recentDocuments?.data || []} 
                    loading={documentsLoading}
                    compact
                  />
                </CardContent>
              </Card>
            </motion.div>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <motion.div variants={item}>
              <RecentActivity />
            </motion.div>
          </Grid>
        </Grid>
      </motion.div>
    </Box>
  )
}

export default Dashboard
```

---

## 🔗 Next Steps

This phase covered the complete frontend development architecture. Continue to:

- **[Phase 5: DevOps & Deployment](./Phase-5-DevOps-Deployment.md)** - Learn deployment strategies
- **[Phase 6: Complete Workflows](./Phase-6-Complete-Workflows.md)** - See end-to-end system operation

---

*This documentation provides comprehensive coverage of modern React development patterns, state management, and responsive UI design for the Legal Case Retrieval System.*
