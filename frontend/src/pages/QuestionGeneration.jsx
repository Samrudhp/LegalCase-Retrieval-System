import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Alert,
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Divider,
  Avatar,
} from '@mui/material';
import {
  QuestionAnswerRounded,
  ExpandMoreRounded,
  ContentCopyRounded,
  DownloadRounded,
  RefreshRounded,
  StarRounded,
  PsychologyRounded,
  HelpRounded,
  AutoAwesomeRounded,
  LightbulbRounded,
  DescriptionRounded,
  TrendingUpRounded,
  InsightsRounded,
  BookmarkRounded,
  ShareRounded,
  SpeedRounded,
  FilterListRounded,
  VisibilityRounded,
  CheckCircleRounded,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const QuestionCard = ({ question, type, onCopy, onDownload, index }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    const text = `Q: ${question.question}\nA: ${question.answer}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'comprehension': return <PsychologyRounded />;
      case 'analysis': return <TrendingUpRounded />;
      case 'application': return <LightbulbRounded />;
      case 'evaluation': return <InsightsRounded />;
      default: return <QuestionAnswerRounded />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'comprehension': return 'from-blue-500 to-blue-600';
      case 'analysis': return 'from-green-500 to-green-600';
      case 'application': return 'from-yellow-500 to-yellow-600';
      case 'evaluation': return 'from-purple-500 to-purple-600';
      default: return 'from-primary-500 to-accent-500';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300';
      case 'medium': return 'bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300';
      case 'hard': return 'bg-error-100 text-error-800 dark:bg-error-900/30 dark:text-error-300';
      default: return 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -5 }}
    >
      <Card className="mb-6 bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-medium hover:shadow-large transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-4 flex-1">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className={`p-3 rounded-2xl bg-gradient-to-br ${getTypeColor(question.type)} shadow-medium`}
              >
                {React.cloneElement(getTypeIcon(question.type), {
                  className: "text-white text-xl"
                })}
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Chip
                    size="small"
                    label={question.type || 'General'}
                    className="bg-primary-100 text-primary-800 dark:bg-primary-800/30 dark:text-primary-300 capitalize"
                  />
                  <Chip
                    size="small"
                    label={question.difficulty || 'Medium'}
                    className={`capitalize ${getDifficultyColor(question.difficulty)}`}
                  />
                  {question.score && (
                    <div className="flex items-center space-x-1">
                      <StarRounded className="text-sm text-warning-500" />
                      <Typography variant="caption" className="text-secondary-600 dark:text-secondary-400">
                        {question.score}/5
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  className="text-secondary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                >
                  {copied ? <CheckCircleRounded /> : <ContentCopyRounded />}
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton
                  size="small"
                  className="text-secondary-400 hover:text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/20"
                >
                  <BookmarkRounded />
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton
                  size="small"
                  className="text-secondary-400 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/20"
                >
                  <ShareRounded />
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton
                  size="small"
                  onClick={() => onDownload?.(question)}
                  className="text-secondary-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20"
                >
                  <DownloadRounded />
                </IconButton>
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Question */}
            <div className="bg-secondary-50/50 dark:bg-secondary-800/50 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Typography variant="caption" className="text-white font-bold">Q</Typography>
                </div>
                <Typography variant="body1" className="text-secondary-900 dark:text-white font-medium">
                  {question.question}
                </Typography>
              </div>
            </div>

            {/* Answer Preview */}
            <div className="bg-gradient-to-r from-accent-50/50 to-primary-50/50 dark:from-accent-900/20 dark:to-primary-900/20 rounded-2xl p-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-500 to-success-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <Typography variant="caption" className="text-white font-bold">A</Typography>
                </div>
                <Typography 
                  variant="body2" 
                  className="text-secondary-700 dark:text-secondary-300 line-clamp-2"
                >
                  {question.answer}
                </Typography>
              </div>
            </div>

            {/* Metadata */}
            {question.metadata && (
              <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
                <div className="flex items-center space-x-1">
                  <SpeedRounded className="text-sm" />
                  <span>Est. time: {question.metadata.estimated_time || '2-3 min'}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <DescriptionRounded className="text-sm" />
                  <span>Source: {question.metadata.source_document || 'Document'}</span>
                </div>
                {question.metadata.learning_objective && (
                  <div className="flex items-center space-x-1">
                    <LightbulbRounded className="text-sm" />
                    <span>Objective: {question.metadata.learning_objective}</span>
                  </div>
                )}
              </div>
            )}

            {/* Detailed Answer */}
            <Accordion 
              expanded={expanded} 
              onChange={() => setExpanded(!expanded)}
              className="bg-transparent shadow-none"
            >
              <AccordionSummary 
                expandIcon={<ExpandMoreRounded className="text-secondary-500" />}
                className="px-0 min-h-0"
              >
                <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 flex items-center">
                  <VisibilityRounded className="mr-1 text-sm" />
                  View Full Answer & Explanation
                </Typography>
              </AccordionSummary>
              <AccordionDetails className="px-0 pt-0">
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <div className="bg-white/50 dark:bg-secondary-900/50 rounded-2xl p-4">
                    <Typography variant="body2" className="text-secondary-700 dark:text-secondary-300 whitespace-pre-line">
                      {question.detailed_answer || question.answer}
                    </Typography>
                  </div>
                  
                  {question.explanation && (
                    <div className="bg-accent-50/50 dark:bg-accent-900/20 rounded-2xl p-4">
                      <Typography variant="caption" className="text-accent-700 dark:text-accent-300 font-medium block mb-2">
                        Explanation:
                      </Typography>
                      <Typography variant="body2" className="text-accent-700 dark:text-accent-300">
                        {question.explanation}
                      </Typography>
                    </div>
                  )}

                  {question.references && question.references.length > 0 && (
                    <div>
                      <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 font-medium block mb-2">
                        References:
                      </Typography>
                      <div className="space-y-1">
                        {question.references.map((ref, idx) => (
                          <Typography key={idx} variant="caption" className="text-secondary-600 dark:text-secondary-400 block">
                            • {ref}
                          </Typography>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AccordionDetails>
            </Accordion>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const QuestionGeneration = () => {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [questionType, setQuestionType] = useState('all');
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState(0);

  // Query for available documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: apiService.getDocuments,
    onSuccess: (data) => {
      // Mock documents if API is not available
      if (!data?.data?.length) {
        return [
          { id: 1, name: 'Employment Contract.pdf', size: '2.1 MB', type: 'contract' },
          { id: 2, name: 'Merger Agreement.docx', size: '5.3 MB', type: 'agreement' },
          { id: 3, name: 'Patent Application.pdf', size: '1.8 MB', type: 'legal' },
          { id: 4, name: 'Privacy Policy.txt', size: '0.5 MB', type: 'policy' },
        ];
      }
    },
  });

  // Mutation for generating questions
  const generateQuestionsMutation = useMutation({
    mutationFn: (params) => apiService.generateQuestions(params),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (data) => {
      setQuestions(data.data.questions || []);
      setIsGenerating(false);
    },
    onError: (error) => {
      // Add mock questions for demonstration
      const mockQuestions = [
        {
          id: 1,
          question: "What are the key termination clauses outlined in this employment contract?",
          answer: "The contract includes standard termination clauses covering notice periods, cause for termination, and severance arrangements.",
          detailed_answer: "The employment contract specifies several termination scenarios: 1) Termination with cause requires no notice period and no severance pay. 2) Termination without cause requires 30 days written notice or pay in lieu. 3) Employee resignation requires 14 days notice. 4) Severance pay is calculated based on length of service, with a minimum of 2 weeks pay for employees with less than 1 year of service.",
          type: 'comprehension',
          difficulty: 'medium',
          score: 4,
          metadata: {
            estimated_time: '3-4 min',
            source_document: 'Employment Contract.pdf',
            learning_objective: 'Understanding contract termination procedures'
          }
        },
        {
          id: 2,
          question: "How does this agreement handle intellectual property rights created during employment?",
          answer: "All intellectual property created during employment belongs to the company, with specific exceptions for pre-existing IP.",
          detailed_answer: "The intellectual property clause establishes that any inventions, designs, software, or creative works developed during employment hours or using company resources automatically transfer to the employer. However, the contract includes a schedule listing any pre-existing intellectual property that remains with the employee. The clause also covers improvements to existing company IP and requires disclosure of any potentially related inventions.",
          type: 'analysis',
          difficulty: 'hard',
          score: 5,
          explanation: "This question tests understanding of IP ownership transfer mechanisms in employment contexts.",
          references: ["Employment Standards Act", "Copyright Act", "Patent Act"],
          metadata: {
            estimated_time: '5-6 min',
            source_document: 'Employment Contract.pdf',
            learning_objective: 'Analyzing IP ownership and transfer provisions'
          }
        },
        {
          id: 3,
          question: "What confidentiality obligations are imposed on the employee?",
          answer: "The employee must maintain strict confidentiality of all proprietary information and trade secrets.",
          detailed_answer: "The confidentiality clause requires the employee to: 1) Not disclose any confidential information during or after employment. 2) Return all confidential materials upon termination. 3) Not use confidential information for personal benefit or to compete with the company. 4) Take reasonable precautions to prevent unauthorized disclosure. The obligation continues indefinitely after employment ends.",
          type: 'comprehension',
          difficulty: 'easy',
          score: 3,
          metadata: {
            estimated_time: '2-3 min',
            source_document: 'Employment Contract.pdf',
            learning_objective: 'Understanding confidentiality requirements'
          }
        }
      ];
      setQuestions(mockQuestions);
      setIsGenerating(false);
    },
  });

  const handleGenerateQuestions = () => {
    if (selectedDocument) {
      generateQuestionsMutation.mutate({
        document_id: selectedDocument,
        question_type: questionType,
        difficulty: difficulty,
        count: questionCount,
      });
    }
  };

  const handleDownloadQuestions = (question) => {
    const content = `Question: ${question.question}\n\nAnswer: ${question.answer}\n\nType: ${question.type}\nDifficulty: ${question.difficulty}\n\nGenerated on: ${new Date().toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `question_${question.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyQuestion = () => {
    // Add toast notification for copy action
  };

  const filteredQuestions = questions.filter(q => {
    if (activeTab === 0) return true; // All
    if (activeTab === 1) return q.type === 'comprehension';
    if (activeTab === 2) return q.type === 'analysis';
    if (activeTab === 3) return q.type === 'application';
    if (activeTab === 4) return q.type === 'evaluation';
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center space-y-4">
          <motion.h1 
            className="text-4xl font-bold bg-gradient-to-r from-secondary-900 via-primary-600 to-accent-600 bg-clip-text text-transparent dark:from-white dark:via-primary-400 dark:to-accent-400"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            AI Question Generation
          </motion.h1>
          <Typography variant="h6" className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Generate intelligent study questions and assessments from legal documents
          </Typography>
        </div>
      </motion.div>

      {/* Question Generation Panel */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
          <CardContent className="p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium">
                <AutoAwesomeRounded className="text-white text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                  Generate New Questions
                </Typography>
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                  Create custom questions and assessments from your documents
                </Typography>
              </div>
            </div>

            <Grid container spacing={4}>
              <Grid xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel className="text-secondary-600 dark:text-secondary-400">
                    Select Document
                  </InputLabel>
                  <Select
                    value={selectedDocument}
                    label="Select Document"
                    onChange={(e) => setSelectedDocument(e.target.value)}
                    className="rounded-2xl"
                  >
                    <MenuItem value="">Choose a document...</MenuItem>
                    <MenuItem value="1">Employment Contract.pdf</MenuItem>
                    <MenuItem value="2">Merger Agreement.docx</MenuItem>
                    <MenuItem value="3">Patent Application.pdf</MenuItem>
                    <MenuItem value="4">Privacy Policy.txt</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel className="text-secondary-600 dark:text-secondary-400">
                    Question Type
                  </InputLabel>
                  <Select
                    value={questionType}
                    label="Question Type"
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="rounded-2xl"
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="comprehension">Comprehension</MenuItem>
                    <MenuItem value="analysis">Analysis</MenuItem>
                    <MenuItem value="application">Application</MenuItem>
                    <MenuItem value="evaluation">Evaluation</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel className="text-secondary-600 dark:text-secondary-400">
                    Difficulty Level
                  </InputLabel>
                  <Select
                    value={difficulty}
                    label="Difficulty Level"
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="rounded-2xl"
                  >
                    <MenuItem value="easy">Easy</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="hard">Hard</MenuItem>
                    <MenuItem value="mixed">Mixed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Number of Questions"
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  InputProps={{
                    inputProps: { min: 1, max: 20 }
                  }}
                  className="rounded-2xl"
                />
              </Grid>

              <Grid xs={12} md={4}>
                <div className="h-full flex items-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="w-full">
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleGenerateQuestions}
                      disabled={!selectedDocument || isGenerating}
                      startIcon={isGenerating ? <RefreshRounded className="animate-spin" /> : <QuestionAnswerRounded />}
                      className="rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-medium py-3"
                    >
                      {isGenerating ? 'Generating...' : 'Generate Questions'}
                    </Button>
                  </motion.div>
                </div>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </motion.div>

      {/* Processing Indicator */}
      {isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="bg-primary-50/50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 shadow-large">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium">
                  <PsychologyRounded className="text-white text-xl animate-pulse" />
                </div>
                <div className="flex-1">
                  <Typography variant="h6" className="font-bold text-primary-900 dark:text-primary-100 mb-2">
                    AI Generating Questions
                  </Typography>
                  <Typography variant="body2" className="text-primary-700 dark:text-primary-300 mb-3">
                    Analyzing document content and creating intelligent questions tailored to your specifications...
                  </Typography>
                  <LinearProgress 
                    className="rounded-full h-2"
                    sx={{
                      backgroundColor: 'rgba(59, 130, 246, 0.2)',
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(to right, #3b82f6, #d946ef)',
                        borderRadius: '4px',
                      }
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Generated Questions */}
      {questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 shadow-medium">
                <QuestionAnswerRounded className="text-white text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                  Generated Questions ({questions.length})
                </Typography>
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                  AI-powered assessment questions
                </Typography>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Chip
                icon={<AutoAwesomeRounded />}
                label="AI Generated"
                className="bg-accent-100 text-accent-800 dark:bg-accent-800/30 dark:text-accent-300"
              />
              <motion.div whileHover={{ scale: 1.05 }}>
                <IconButton className="text-secondary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  <FilterListRounded />
                </IconButton>
              </motion.div>
            </div>
          </div>

          {/* Question Type Tabs */}
          <Card className="mb-6 bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-medium">
            <Tabs 
              value={activeTab} 
              onChange={(e, newValue) => setActiveTab(newValue)}
              className="p-4"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label={`All (${questions.length})`} className="rounded-2xl mx-1" />
              <Tab label={`Comprehension (${questions.filter(q => q.type === 'comprehension').length})`} className="rounded-2xl mx-1" />
              <Tab label={`Analysis (${questions.filter(q => q.type === 'analysis').length})`} className="rounded-2xl mx-1" />
              <Tab label={`Application (${questions.filter(q => q.type === 'application').length})`} className="rounded-2xl mx-1" />
              <Tab label={`Evaluation (${questions.filter(q => q.type === 'evaluation').length})`} className="rounded-2xl mx-1" />
            </Tabs>
          </Card>

          <AnimatePresence>
            {filteredQuestions.map((question, index) => (
              <QuestionCard
                key={question.id}
                question={question}
                type={question.type}
                onDownload={handleDownloadQuestions}
                onCopy={handleCopyQuestion}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {questions.length === 0 && !isGenerating && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-accent-500/10 to-primary-500/10 dark:from-accent-400/10 dark:to-primary-400/10 border border-accent-200 dark:border-accent-800 shadow-large">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-glow flex items-center justify-center"
              >
                <QuestionAnswerRounded className="text-white text-4xl" />
              </motion.div>
              
              <Typography variant="h6" className="text-secondary-900 dark:text-white mb-2 font-bold">
                No Questions Generated Yet
              </Typography>
              <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                Select a document and configure your preferences to generate intelligent questions and assessments.
              </Typography>
              
              <div className="space-y-4">
                <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 font-medium">
                  Question Types Available:
                </Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <Chip label="Comprehension" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" />
                  <Chip label="Analysis" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" />
                  <Chip label="Application" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" />
                  <Chip label="Evaluation" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default QuestionGeneration;
