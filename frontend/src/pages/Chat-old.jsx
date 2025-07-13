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
} from '@mui/material';
import {
  Send,
  SmartToy,
  Person,
  Add,
  Delete,
  Refresh,
  ContentCopy,
  ThumbUp,
  ThumbDown,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

const MessageBubble = ({ message, isUser, timestamp, onCopy, onFeedback }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <Box className={`flex items-start space-x-3 max-w-4xl ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
        <Avatar className={`${isUser ? 'bg-primary-600' : 'bg-gray-600'}`}>
          {isUser ? <Person /> : <SmartToy />}
        </Avatar>
        
        <Box className={`flex-1 ${isUser ? 'text-right' : ''}`}>
          <Box
            className={`inline-block p-4 rounded-lg ${
              isUser
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100'
            }`}
          >
            {isUser ? (
              <Typography variant="body1">{message}</Typography>
            ) : (
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                        {children}
                      </code>
                    );
                  },
                }}
                className="prose prose-sm dark:prose-invert max-w-none"
              >
                {message}
              </ReactMarkdown>
            )}
          </Box>
          
          <Box className={`flex items-center mt-2 space-x-2 ${isUser ? 'justify-end' : ''}`}>
            <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
              {timestamp}
            </Typography>
            
            {!isUser && (
              <Box className="flex items-center space-x-1">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <ContentCopy fontSize="small" />
                </IconButton>
                {copied && (
                  <Chip label="Copied!" size="small" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" />
                )}
                <IconButton
                  size="small"
                  onClick={() => onFeedback?.(true)}
                  className="text-gray-500 dark:text-gray-400 hover:text-green-500"
                >
                  <ThumbUp fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onFeedback?.(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-red-500"
                >
                  <ThumbDown fontSize="small" />
                </IconButton>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </motion.div>
  );
};

const ChatSidebar = ({ sessions, currentSession, onSessionSelect, onNewSession, onDeleteSession }) => {
  return (
    <Card className="h-full bg-white dark:bg-gray-800">
      <CardContent className="p-4">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
            Chat Sessions
          </Typography>
          <IconButton
            onClick={onNewSession}
            size="small"
            className="text-primary-600 dark:text-primary-400"
          >
            <Add />
          </IconButton>
        </Box>
        
        <List className="space-y-2">
          {sessions.map((session) => (
            <ListItem key={session.id} disablePadding>
              <ListItemButton
                selected={session.id === currentSession}
                onClick={() => onSessionSelect(session.id)}
                className={`rounded-lg ${
                  session.id === currentSession
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <ListItemText
                  primary={session.title || `Session ${session.id}`}
                  secondary={`${session.messageCount || 0} messages`}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: session.id === currentSession ? 600 : 400,
                  }}
                  secondaryTypographyProps={{
                    fontSize: '0.75rem',
                  }}
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession(session.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        
        {sessions.length === 0 && (
          <Box className="text-center py-8">
            <SmartToy className="text-6xl text-gray-300 dark:text-gray-600 mb-2" />
            <Typography variant="body2" className="text-gray-500 dark:text-gray-400">
              No chat sessions yet
            </Typography>
            <Button
              variant="outlined"
              size="small"
              onClick={onNewSession}
              className="mt-2"
            >
              Start New Chat
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const SuggestedQuestions = ({ onQuestionSelect }) => {
  const questions = [
    "What are the key clauses in contract law?",
    "Explain the difference between tort and contract claims",
    "How do I analyze a legal precedent?",
    "What are the elements of a valid contract?",
    "Summarize this document's main legal points",
    "What are the potential risks in this agreement?",
  ];

  return (
    <Box className="mb-6">
      <Typography variant="h6" className="text-gray-900 dark:text-gray-100 mb-3">
        Suggested Questions
      </Typography>
      <Box className="flex flex-wrap gap-2">
        {questions.map((question, index) => (
          <Chip
            key={index}
            label={question}
            onClick={() => onQuestionSelect(question)}
            className="cursor-pointer hover:bg-primary-50 dark:hover:bg-primary-900/20 text-gray-700 dark:text-gray-300"
          />
        ))}
      </Box>
    </Box>
  );
};

const Chat = () => {
  const [currentSessionId, setCurrentSessionId] = useState('default');
  const [message, setMessage] = useState('');
  const [sessions, setSessions] = useState([
    { id: 'default', title: 'New Chat', messageCount: 0 }
  ]);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load chat history
  const { data: chatHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['chatHistory', currentSessionId],
    queryFn: () => apiService.getChatHistory(currentSessionId),
    onSuccess: (data) => {
      setMessages(data.data.messages || []);
    },
    onError: () => {
      // Use empty messages if history fails to load
      setMessages([]);
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => apiService.sendMessage(
      currentSessionId,
      messageData.message,
      messageData.caseId
    ),
    onSuccess: (data) => {
      const userMessage = {
        content: message,
        isUser: true,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      const aiMessage = {
        content: data.data.response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      setMessage('');
      
      // Update session message count
      setSessions(prev => prev.map(session => 
        session.id === currentSessionId
          ? { ...session, messageCount: (session.messageCount || 0) + 2 }
          : session
      ));
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  const handleSendMessage = () => {
    if (!message.trim() || sendMessageMutation.isLoading) return;
    
    sendMessageMutation.mutate({
      message: message.trim(),
      caseId: null, // TODO: Add case context selection
    });
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewSession = () => {
    const newSessionId = `session_${Date.now()}`;
    const newSession = {
      id: newSessionId,
      title: 'New Chat',
      messageCount: 0,
    };
    
    setSessions(prev => [...prev, newSession]);
    setCurrentSessionId(newSessionId);
    setMessages([]);
  };

  const handleDeleteSession = (sessionId) => {
    if (sessions.length <= 1) {
      toast.error('Cannot delete the last session');
      return;
    }
    
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    
    if (sessionId === currentSessionId) {
      const remainingSessions = sessions.filter(s => s.id !== sessionId);
      setCurrentSessionId(remainingSessions[0].id);
    }
  };

  const handleQuestionSelect = (question) => {
    setMessage(question);
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
          AI Legal Assistant
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
          Ask questions about legal documents, get summaries, and receive expert guidance
        </Typography>
      </Box>

      <Box className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Sidebar */}
        <Box className="lg:col-span-1">
          <ChatSidebar
            sessions={sessions}
            currentSession={currentSessionId}
            onSessionSelect={setCurrentSessionId}
            onNewSession={handleNewSession}
            onDeleteSession={handleDeleteSession}
          />
        </Box>

        {/* Chat Area */}
        <Box className="lg:col-span-3 flex flex-col">
          <Card className="flex-1 bg-white dark:bg-gray-800 flex flex-col">
            <CardContent className="flex-1 p-6 overflow-hidden flex flex-col">
              {/* Messages Container */}
              <Box className="flex-1 overflow-y-auto mb-4">
                {messages.length === 0 && !historyLoading && (
                  <Box className="text-center py-12">
                    <SmartToy className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                    <Typography variant="h6" className="text-gray-500 dark:text-gray-400 mb-2">
                      Welcome to your AI Legal Assistant
                    </Typography>
                    <Typography variant="body2" className="text-gray-400 dark:text-gray-500 mb-6">
                      Ask questions about legal documents, contracts, or legal concepts
                    </Typography>
                    <SuggestedQuestions onQuestionSelect={handleQuestionSelect} />
                  </Box>
                )}

                {historyLoading && (
                  <Box className="flex justify-center py-8">
                    <CircularProgress />
                  </Box>
                )}

                <AnimatePresence>
                  {messages.map((msg, index) => (
                    <MessageBubble
                      key={index}
                      message={msg.content}
                      isUser={msg.isUser}
                      timestamp={msg.timestamp}
                      onCopy={() => toast.success('Message copied to clipboard')}
                      onFeedback={(positive) => 
                        toast.success(positive ? 'Thank you for your feedback!' : 'Feedback noted, we\'ll improve.')
                      }
                    />
                  ))}
                </AnimatePresence>

                {sendMessageMutation.isLoading && (
                  <Box className="flex justify-start mb-4">
                    <Box className="flex items-center space-x-3">
                      <Avatar className="bg-gray-600">
                        <SmartToy />
                      </Avatar>
                      <Box className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                        <Box className="flex items-center space-x-2">
                          <CircularProgress size={16} />
                          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
                            AI is thinking...
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                )}
                
                <div ref={messagesEndRef} />
              </Box>

              {/* Message Input */}
              <Box className="border-t dark:border-gray-700 pt-4">
                <Box className="flex items-end space-x-2">
                  <TextField
                    fullWidth
                    multiline
                    maxRows={4}
                    variant="outlined"
                    placeholder="Ask a legal question or request document analysis..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={sendMessageMutation.isLoading}
                    className="bg-gray-50 dark:bg-gray-700"
                  />
                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!message.trim() || sendMessageMutation.isLoading}
                    className="bg-primary-600 text-white hover:bg-primary-700 disabled:bg-gray-300"
                  >
                    <Send />
                  </IconButton>
                </Box>
                
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mt-2">
                  Press Enter to send, Shift+Enter for new line
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Chat;
