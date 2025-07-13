import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  IconButton,
  Avatar,
  Chip,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  CircularProgress,
  InputAdornment,
  Paper,
  Fade,
} from '@mui/material';
import {
  SendRounded,
  SmartToyRounded,
  PersonRounded,
  AddRounded,
  DeleteRounded,
  RefreshRounded,
  ContentCopyRounded,
  ThumbUpRounded,
  ThumbDownRounded,
  AutoAwesomeRounded,
  HistoryRounded,
  ChatRounded,
  LightbulbRounded,
  BookmarkRounded,
  MoreVertRounded,
  AttachFileRounded,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MessageBubble = ({ message, isUser, timestamp, onCopy, onFeedback, index }) => {
  const [copied, setCopied] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`flex items-start space-x-3 max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        {/* Avatar */}
        <motion.div
          whileHover={{ scale: 1.1 }}
          className="flex-shrink-0"
        >
          <Avatar
            className={`w-10 h-10 ${
              isUser
                ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium'
                : 'bg-gradient-to-br from-secondary-600 to-secondary-700 shadow-medium'
            }`}
          >
            {isUser ? (
              <PersonRounded className="text-white" />
            ) : (
              <AutoAwesomeRounded className="text-white" />
            )}
          </Avatar>
        </motion.div>

        {/* Message Content */}
        <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
          <motion.div
            className={`
              relative p-4 rounded-2xl shadow-medium backdrop-blur-xl border-0
              ${isUser
                ? 'bg-gradient-to-br from-primary-500 to-accent-500 text-white ml-4'
                : 'bg-white/60 dark:bg-secondary-900/60 text-secondary-900 dark:text-white mr-4'
              }
            `}
            whileHover={{ scale: 1.02, y: -2 }}
            transition={{ duration: 0.2 }}
          >
            {/* Message content */}
            <div className="prose prose-sm max-w-none">
              {isUser ? (
                <Typography variant="body1" className="text-white">
                  {message.content}
                </Typography>
              ) : (
                <ReactMarkdown
                  className="text-secondary-900 dark:text-white"
                  components={{
                    code({node, inline, className, children, ...props}) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match[1]}
                          PreTag="div"
                          className="rounded-xl my-3"
                          {...props}
                        >
                          {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                      ) : (
                        <code className="bg-secondary-100 dark:bg-secondary-800 px-1 py-0.5 rounded text-sm" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc list-inside mb-2">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal list-inside mb-2">{children}</ol>,
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              )}
            </div>

            {/* Message actions */}
            <AnimatePresence>
              {showActions && !isUser && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center justify-end space-x-1 mt-3 pt-3 border-t border-secondary-200/30 dark:border-secondary-700/30"
                >
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      size="small"
                      onClick={handleCopy}
                      className="text-secondary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                    >
                      {copied ? <BookmarkRounded className="text-sm" /> : <ContentCopyRounded className="text-sm" />}
                    </IconButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      size="small"
                      onClick={() => onFeedback?.(message.id, 'like')}
                      className="text-secondary-500 hover:text-success-600 hover:bg-success-50 dark:hover:bg-success-900/20"
                    >
                      <ThumbUpRounded className="text-sm" />
                    </IconButton>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton
                      size="small"
                      onClick={() => onFeedback?.(message.id, 'dislike')}
                      className="text-secondary-500 hover:text-error-600 hover:bg-error-50 dark:hover:bg-error-900/20"
                    >
                      <ThumbDownRounded className="text-sm" />
                    </IconButton>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Timestamp */}
          <Typography
            variant="caption"
            className={`block mt-2 text-secondary-500 dark:text-secondary-400 ${isUser ? 'text-right' : 'text-left'}`}
          >
            {timestamp ? new Date(timestamp).toLocaleTimeString() : 'Just now'}
          </Typography>
        </div>
      </div>
    </motion.div>
  );
};

const ChatSidebar = ({ sessions, currentSession, onSessionSelect, onNewSession, onDeleteSession }) => {
  const [showAll, setShowAll] = useState(false);
  const visibleSessions = showAll ? sessions : sessions.slice(0, 5);

  return (
    <Card className="h-full bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-medium">
              <HistoryRounded className="text-white text-xl" />
            </div>
            <div>
              <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                Chat History
              </Typography>
              <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                {sessions.length} conversation{sessions.length !== 1 ? 's' : ''}
              </Typography>
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <IconButton
              onClick={onNewSession}
              className="bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-medium hover:shadow-large"
            >
              <AddRounded />
            </IconButton>
          </motion.div>
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {visibleSessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02, x: 4 }}
              >
                <ListItemButton
                  selected={currentSession === session.id}
                  onClick={() => onSessionSelect(session.id)}
                  className={`
                    rounded-2xl mb-2 group transition-all duration-300
                    ${currentSession === session.id 
                      ? 'bg-gradient-to-r from-primary-500/20 to-accent-500/20 border border-primary-300 dark:border-primary-600' 
                      : 'hover:bg-secondary-50 dark:hover:bg-secondary-800/50'
                    }
                  `}
                >
                  <div className="flex items-center space-x-3 w-full">
                    <div className={`
                      p-2 rounded-xl transition-all duration-300
                      ${currentSession === session.id
                        ? 'bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium'
                        : 'bg-secondary-200 dark:bg-secondary-700 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30'
                      }
                    `}>
                      <ChatRounded className={`text-sm ${currentSession === session.id ? 'text-white' : 'text-secondary-600 dark:text-secondary-400'}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Typography 
                        variant="body2" 
                        className={`font-medium truncate ${
                          currentSession === session.id 
                            ? 'text-primary-700 dark:text-primary-300' 
                            : 'text-secondary-900 dark:text-white'
                        }`}
                      >
                        {session.title || `Chat ${session.id}`}
                      </Typography>
                      <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400">
                        {session.lastMessage ? session.lastMessage.substring(0, 40) + '...' : 'No messages'}
                      </Typography>
                    </div>
                    
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        className="text-secondary-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                      >
                        <DeleteRounded className="text-sm" />
                      </IconButton>
                    </motion.div>
                  </div>
                </ListItemButton>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {sessions.length > 5 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <Button
              variant="outlined"
              fullWidth
              onClick={() => setShowAll(!showAll)}
              className="rounded-2xl border-secondary-300 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-600"
            >
              {showAll ? 'Show Less' : `Show ${sessions.length - 5} More`}
            </Button>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

const Chat = () => {
  const [message, setMessage] = useState('');
  const [currentSession, setCurrentSession] = useState(1);
  const [sessions, setSessions] = useState([
    { id: 1, title: 'Contract Analysis', lastMessage: 'Can you help me analyze this employment contract?' },
    { id: 2, title: 'Legal Research', lastMessage: 'What are the recent changes in data privacy laws?' },
    { id: 3, title: 'Case Precedents', lastMessage: 'Find similar cases for intellectual property disputes' },
  ]);
  const [messages, setMessages] = useState([
    {
      id: 1,
      content: "Hello! I'm your AI legal assistant. I can help you with legal research, document analysis, case precedents, and answer questions about law. What would you like to know?",
      isUser: false,
      timestamp: new Date().toISOString(),
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const sendMessageMutation = useMutation({
    mutationFn: apiService.sendChatMessage,
    onMutate: async (newMessage) => {
      // Add user message immediately
      const userMessage = {
        id: Date.now(),
        content: newMessage,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);
      setMessage('');
      setIsTyping(true);
      return { userMessage };
    },
    onSuccess: (data, variables, context) => {
      // Add AI response
      const aiMessage = {
        id: Date.now() + 1,
        content: data.data.response || "I apologize, but I encountered an issue. Please try again.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    },
    onError: (error, variables, context) => {
      setIsTyping(false);
      const errorMessage = {
        id: Date.now() + 1,
        content: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    },
  });

  const handleSendMessage = () => {
    if (message.trim()) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewSession = () => {
    const newSession = {
      id: Date.now(),
      title: `New Chat ${sessions.length + 1}`,
      lastMessage: '',
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession.id);
    setMessages([{
      id: 1,
      content: "Hello! I'm your AI legal assistant. How can I help you today?",
      isUser: false,
      timestamp: new Date().toISOString(),
    }]);
  };

  const handleDeleteSession = (sessionId) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession === sessionId && sessions.length > 1) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setCurrentSession(remainingSessions[0].id);
    }
  };

  const handleCopyMessage = () => {
    // Add toast notification for copy action
  };

  const handleFeedback = (messageId, type) => {
    console.log(`Feedback ${type} for message ${messageId}`);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Quick prompts for empty state
  const quickPrompts = [
    "Analyze a contract for key terms and potential issues",
    "Research recent court decisions on data privacy",
    "Explain the differences between various business entity types",
    "Help me draft a non-disclosure agreement",
    "Find relevant case law for intellectual property disputes"
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="h-[calc(100vh-120px)] flex space-x-6"
    >
      {/* Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="w-80 flex-shrink-0"
      >
        <ChatSidebar
          sessions={sessions}
          currentSession={currentSession}
          onSessionSelect={setCurrentSession}
          onNewSession={handleNewSession}
          onDeleteSession={handleDeleteSession}
        />
      </motion.div>

      {/* Main Chat Area */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="flex-1 flex flex-col"
      >
        {/* Header */}
        <Card className="mb-6 bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium">
                  <AutoAwesomeRounded className="text-white text-2xl" />
                </div>
                <div>
                  <Typography variant="h5" className="font-bold text-secondary-900 dark:text-white">
                    AI Legal Assistant
                  </Typography>
                  <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400">
                    Powered by advanced legal AI • Real-time assistance
                  </Typography>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Chip
                  icon={<LightbulbRounded />}
                  label="Expert Mode"
                  className="bg-success-100 text-success-800 dark:bg-success-800/30 dark:text-success-300"
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <IconButton className="text-secondary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                    <MoreVertRounded />
                  </IconButton>
                </motion.div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="flex-1 mb-6 bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large overflow-hidden">
          <CardContent className="p-0 h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <AnimatePresence>
                {messages.map((msg, index) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    isUser={msg.isUser}
                    timestamp={msg.timestamp}
                    onCopy={handleCopyMessage}
                    onFeedback={handleFeedback}
                    index={index}
                  />
                ))}
              </AnimatePresence>

              {/* Typing indicator */}
              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-10 h-10 bg-gradient-to-br from-secondary-600 to-secondary-700 shadow-medium">
                      <AutoAwesomeRounded className="text-white" />
                    </Avatar>
                    <div className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-medium">
                      <div className="flex space-x-1">
                        <motion.div
                          className="w-2 h-2 bg-primary-500 rounded-full"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary-500 rounded-full"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-primary-500 rounded-full"
                          animate={{ y: [0, -10, 0] }}
                          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Quick prompts for empty state */}
              {messages.length === 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-4"
                >
                  <Typography variant="h6" className="text-center text-secondary-600 dark:text-secondary-400 mb-6">
                    Try asking about:
                  </Typography>
                  <div className="grid gap-3">
                    {quickPrompts.map((prompt, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Paper
                          className="p-4 cursor-pointer bg-secondary-50/50 dark:bg-secondary-800/50 backdrop-blur-sm border border-secondary-200/50 dark:border-secondary-700/50 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-300 rounded-2xl"
                          onClick={() => setMessage(prompt)}
                        >
                          <Typography variant="body2" className="text-secondary-700 dark:text-secondary-300">
                            {prompt}
                          </Typography>
                        </Paper>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
          <CardContent className="p-6">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <TextField
                  fullWidth
                  multiline
                  maxRows={4}
                  placeholder="Ask me anything about law, contracts, cases, or legal research..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isTyping}
                  className="rounded-2xl"
                  InputProps={{
                    className: "rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50",
                    startAdornment: (
                      <InputAdornment position="start">
                        <motion.div whileHover={{ scale: 1.1 }}>
                          <IconButton size="small" className="text-secondary-400">
                            <AttachFileRounded />
                          </IconButton>
                        </motion.div>
                      </InputAdornment>
                    ),
                  }}
                />
              </div>
              
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <IconButton
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isTyping}
                  className="w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 text-white shadow-medium hover:shadow-large disabled:opacity-50"
                >
                  {isTyping ? (
                    <CircularProgress size={24} className="text-white" />
                  ) : (
                    <SendRounded />
                  )}
                </IconButton>
              </motion.div>
            </div>
            
            <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 mt-3 block text-center">
              Press Enter to send • Shift+Enter for new line
            </Typography>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default Chat;
