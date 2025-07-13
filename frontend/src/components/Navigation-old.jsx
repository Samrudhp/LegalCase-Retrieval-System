import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme as useMuiTheme,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Upload,
  Search,
  Chat,
  Summarize,
  QuestionAnswer,
  Settings,
  Brightness4,
  Brightness7,
  NotificationsNone,
} from '@mui/icons-material';
import { useTheme } from '../contexts/ThemeContext';

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const muiTheme = useMuiTheme();
  const isMobile = useMediaQuery(muiTheme.breakpoints.down('md'));

  const menuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
    { text: 'Upload', icon: <Upload />, path: '/upload' },
    { text: 'Search', icon: <Search />, path: '/search' },
    { text: 'Chat Assistant', icon: <Chat />, path: '/chat' },
    { text: 'Summarization', icon: <Summarize />, path: '/summarization' },
    { text: 'Q&A Generation', icon: <QuestionAnswer />, path: '/questions' },
    { text: 'Settings', icon: <Settings />, path: '/settings' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawer = (
    <Box sx={{ width: 280 }} className="h-full bg-white dark:bg-gray-900">
      <Box className="p-4 border-b dark:border-gray-700">
        <Typography variant="h6" className="font-bold text-primary-600 dark:text-primary-400">
          LegalCase AI
        </Typography>
        <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
          Legal Document Analysis
        </Typography>
      </Box>
      
      <List className="pt-4">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem
              key={item.text}
              component={Link}
              to={item.path}
              className={`mx-3 mb-1 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
              onClick={() => isMobile && setMobileOpen(false)}
            >
              <ListItemIcon
                className={`min-w-0 mr-3 ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                }}
              />
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <>
      <AppBar
        position="fixed"
        className="bg-white dark:bg-gray-900 shadow-sm border-b dark:border-gray-700"
        elevation={0}
      >
        <Toolbar className="px-4 md:px-6">
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            className="mr-2 md:hidden text-gray-700 dark:text-gray-300"
          >
            <MenuIcon />
          </IconButton>
          
          {!isMobile && (
            <Typography variant="h6" noWrap className="mr-4 font-bold text-primary-600 dark:text-primary-400">
              LegalCase AI
            </Typography>
          )}
          
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Right side actions */}
          <Box className="flex items-center space-x-2">
            <IconButton
              color="inherit"
              className="text-gray-700 dark:text-gray-300"
            >
              <Badge badgeContent={3} color="error">
                <NotificationsNone />
              </Badge>
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              className="text-gray-700 dark:text-gray-300"
            >
              {isDark ? <Brightness7 /> : <Brightness4 />}
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { md: 280 }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: 280,
              border: 'none',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </>
  );
};

export default Navigation;
