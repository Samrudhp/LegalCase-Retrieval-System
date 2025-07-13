import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
  IconButton,
  Chip,
  Avatar,
  Button,
} from '@mui/material';
import {
  TrendingUpRounded,
  DescriptionRounded,
  SearchRounded,
  ChatRounded,
  RefreshRounded,
  SpeedRounded,
  StarRounded,
  AutoAwesomeRounded,
  TrendingUpOutlined,
  PersonRounded,
  CalendarTodayRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion } from 'framer-motion';

const ModernStatCard = ({ title, value, change, subtitle, icon, gradient, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 30, scale: 0.9 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ 
      duration: 0.6, 
      delay: index * 0.1,
      type: "spring",
      stiffness: 300,
      damping: 25
    }}
    whileHover={{ 
      scale: 1.03,
      y: -5,
      transition: { duration: 0.2 }
    }}
    className="w-full"
  >
    <Card className="h-full w-full relative overflow-hidden bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large hover:shadow-glow transition-all duration-500" 
          sx={{ minHeight: '200px', width: '100%' }}>
      {/* Gradient Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-5`} />
      
      {/* Floating Elements */}
      <div className="absolute top-4 right-4 opacity-10">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        >
          {icon}
        </motion.div>
      </div>

      <CardContent className="p-8 relative z-10">
        <div className="flex items-start justify-between mb-6">
          <motion.div
            className={`p-3 rounded-2xl bg-gradient-to-br ${gradient} shadow-medium`}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            {React.cloneElement(icon, {
              className: "text-white text-2xl"
            })}
          </motion.div>
          
          {change !== undefined && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <Chip
                icon={<TrendingUpOutlined className={`text-sm ${change >= 0 ? 'text-success-600' : 'text-error-600'}`} />}
                label={`${change >= 0 ? '+' : ''}${change}%`}
                size="small"
                className={`
                  font-semibold
                  ${change >= 0 
                    ? 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300' 
                    : 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300'}
                `}
              />
            </motion.div>
          )}
        </div>

        <div className="space-y-2">
          <Typography variant="h6" className="text-secondary-600 dark:text-secondary-400 font-medium">
            {title}
          </Typography>
          
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
          >
            <Typography variant="h3" className="font-bold text-secondary-900 dark:text-white mb-1">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </Typography>
          </motion.div>
          
          <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
            {subtitle}
          </Typography>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const ActivityCard = ({ activity, index }) => {
  const getActivityIcon = (type) => {
    const iconProps = { className: "text-lg" };
    switch (type) {
      case 'upload': return <DescriptionRounded {...iconProps} />;
      case 'search': return <SearchRounded {...iconProps} />;
      case 'summary': return <TrendingUpRounded {...iconProps} />;
      case 'chat': return <ChatRounded {...iconProps} />;
      default: return <DescriptionRounded {...iconProps} />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'upload': return 'from-primary-500 to-primary-600';
      case 'search': return 'from-success-500 to-success-600';
      case 'summary': return 'from-accent-500 to-accent-600';
      case 'chat': return 'from-warning-500 to-warning-600';
      default: return 'from-secondary-500 to-secondary-600';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, x: 8 }}
      className="p-4 rounded-2xl hover:bg-secondary-50/50 dark:hover:bg-secondary-800/30 transition-all duration-300 cursor-pointer group"
    >
      <div className="flex items-center space-x-4">
        <motion.div
          className={`p-3 rounded-xl bg-gradient-to-br ${getActivityColor(activity.type)} shadow-medium`}
          whileHover={{ scale: 1.1, rotate: 5 }}
        >
          {getActivityIcon(activity.type)}
        </motion.div>
        
        <div className="flex-1">
          <Typography variant="body1" className="font-semibold text-secondary-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {activity.description}
          </Typography>
          <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400">
            {activity.time}
          </Typography>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <IconButton size="small" className="text-secondary-400">
            <StarRounded className="text-lg" />
          </IconButton>
        </motion.div>
      </div>
    </motion.div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCases: 0,
    totalSearches: 0,
    chatSessions: 0,
    processingQueue: 0,
  });

  // Query for system statistics
  const { data: statsData, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: apiService.getStats,
    refetchInterval: 30000,
    onError: () => {
      setStats({
        totalCases: 1247,
        totalSearches: 5823,
        chatSessions: 342,
        processingQueue: 3,
      });
    },
  });

  // Mock data
  useEffect(() => {
    if (!statsData) {
      setStats({
        totalCases: 1247,
        totalSearches: 5823,
        chatSessions: 342,
        processingQueue: 3,
      });
    }
  }, [statsData]);

  const activities = [
    { id: 1, type: 'upload', description: 'Corporate Merger Agreement uploaded', time: '2 minutes ago' },
    { id: 2, type: 'search', description: 'Searched for "intellectual property disputes"', time: '8 minutes ago' },
    { id: 3, type: 'summary', description: 'Generated summary for Patent Application', time: '15 minutes ago' },
    { id: 4, type: 'chat', description: 'AI consultation on contract law', time: '23 minutes ago' },
    { id: 5, type: 'upload', description: 'Employment Contract template added', time: '1 hour ago' },
  ];

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      change: 12,
      subtitle: 'Documents processed this month',
      icon: <DescriptionRounded />,
      gradient: 'from-primary-500 to-primary-600'
    },
    {
      title: 'Search Queries',
      value: stats.totalSearches,
      change: 8,
      subtitle: 'Legal research conducted',
      icon: <SearchRounded />,
      gradient: 'from-success-500 to-success-600'
    },
    {
      title: 'AI Consultations',
      value: stats.chatSessions,
      change: 23,
      subtitle: 'Expert AI interactions',
      icon: <ChatRounded />,
      gradient: 'from-accent-500 to-accent-600'
    },
    {
      title: 'Processing Queue',
      value: stats.processingQueue,
      change: -15,
      subtitle: 'Documents being analyzed',
      icon: <SpeedRounded />,
      gradient: 'from-warning-500 to-warning-600'
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="space-y-8 w-full min-h-full"
      style={{ maxWidth: '100%', overflow: 'hidden' }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex items-center justify-between"
      >
        <div className="space-y-2">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-secondary-900 via-primary-600 to-accent-600 bg-clip-text text-transparent dark:from-white dark:via-primary-400 dark:to-accent-400"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Legal Analytics Dashboard
          </motion.h1>
          <div className="flex items-center space-x-4 text-secondary-600 dark:text-secondary-400">
            <div className="flex items-center space-x-2">
              <CalendarTodayRounded className="text-lg" />
              <span className="font-medium">Today, {new Date().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center space-x-2">
              <PersonRounded className="text-lg" />
              <span>Legal Professional</span>
            </div>
          </div>
        </div>
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center space-x-3"
        >
          <Button
            variant="outlined"
            startIcon={<AutoAwesomeRounded />}
            className="rounded-2xl border-primary-300 text-primary-600 hover:bg-primary-50 dark:border-primary-600 dark:text-primary-400"
          >
            AI Insights
          </Button>
          <IconButton 
            onClick={() => refetch()} 
            className="p-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-2xl shadow-medium hover:shadow-glow"
          >
            <RefreshRounded />
          </IconButton>
        </motion.div>
      </motion.div>

      {/* Stats Grid */}
      <Grid container spacing={4} sx={{ width: '100%' }}>
        {statCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={card.title} sx={{ display: 'flex' }}>
            <ModernStatCard {...card} index={index} />
          </Grid>
        ))}
      </Grid>

      {/* Content Grid */}
      <Grid container spacing={6} sx={{ width: '100%' }}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={8} sx={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="flex-1"
          >
            <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium">
                      <TrendingUpRounded className="text-white text-xl" />
                    </div>
                    <div>
                      <Typography variant="h5" className="font-bold text-secondary-900 dark:text-white">
                        Recent Activity
                      </Typography>
                      <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                        Latest system interactions
                      </Typography>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {activities.map((activity, index) => (
                    <ActivityCard key={activity.id} activity={activity} index={index} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>

        {/* Quick Actions & Status */}
        <Grid item xs={12} lg={4} sx={{ display: 'flex', flexDirection: 'column' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="space-y-6 flex-1"
          >
            {/* System Status */}
            <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
              <CardContent className="p-6">
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white mb-4">
                  System Health
                </Typography>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-600 dark:text-secondary-400">Processing Power</span>
                      <span className="font-medium text-secondary-900 dark:text-white">87%</span>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={87} 
                      className="h-2 rounded-full bg-secondary-200 dark:bg-secondary-700"
                      sx={{
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(to right, #0ea5e9, #d946ef)',
                          borderRadius: '4px',
                        }
                      }}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-secondary-600 dark:text-secondary-400">Storage Used</span>
                      <span className="font-medium text-secondary-900 dark:text-white">2.1GB / 10GB</span>
                    </div>
                    <LinearProgress 
                      variant="determinate" 
                      value={21} 
                      className="h-2 rounded-full bg-secondary-200 dark:bg-secondary-700"
                      sx={{
                        '& .MuiLinearProgress-bar': {
                          background: 'linear-gradient(to right, #22c55e, #16a34a)',
                          borderRadius: '4px',
                        }
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Assistant Prompt */}
            <Card className="bg-gradient-to-br from-accent-500/10 to-primary-500/10 dark:from-accent-400/10 dark:to-primary-400/10 border border-accent-200 dark:border-accent-800 shadow-large">
              <CardContent className="p-6 text-center">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="w-16 h-16 mx-auto mb-4 rounded-3xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-glow flex items-center justify-center"
                >
                  <AutoAwesomeRounded className="text-white text-2xl" />
                </motion.div>
                
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white mb-2">
                  Need Legal Insights?
                </Typography>
                <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 mb-4">
                  Our AI assistant is ready to help with legal research and analysis.
                </Typography>
                
                <Button
                  variant="contained"
                  className="rounded-2xl bg-gradient-to-r from-accent-500 to-primary-500 hover:from-accent-600 hover:to-primary-600 shadow-medium"
                  fullWidth
                >
                  Start AI Chat
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default Dashboard;
