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
} from '@mui/material';
import {
  QuestionAnswer,
  ExpandMore,
  ContentCopy,
  Download,
  Refresh,
  Star,
  Psychology,
  Help,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const QuestionCard = ({ question, type, onCopy, onDownload }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `Q: ${question.question}\nA: ${question.answer}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'common': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rare': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'unexpected': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'common': return <Help className="text-green-600 dark:text-green-400" />;
      case 'rare': return <Star className="text-orange-600 dark:text-orange-400" />;
      case 'unexpected': return <Psychology className="text-purple-600 dark:text-purple-400" />;
      default: return <QuestionAnswer className="text-gray-600 dark:text-gray-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Accordion className="mb-3 bg-white dark:bg-gray-800 shadow-sm">
        <AccordionSummary
          expandIcon={<ExpandMore />}
          className="hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Box className="flex items-center space-x-3 flex-1">
            {getTypeIcon(type)}
            <Box className="flex-1">
              <Typography variant="body1" className="font-medium text-gray-900 dark:text-gray-100">
                {question.question}
              </Typography>
              <Box className="flex items-center space-x-2 mt-1">
                <Chip
                  size="small"
                  label={type.charAt(0).toUpperCase() + type.slice(1)}
                  className={getTypeColor(type)}
                />
                <Chip
                  size="small"
                  label={`Difficulty: ${question.difficulty || 'Medium'}`}
                  className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                />
              </Box>
            </Box>
          </Box>
        </AccordionSummary>
        
        <AccordionDetails className="border-t dark:border-gray-700">
          <Box className="space-y-4">
            <Box>
              <Typography variant="subtitle2" className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Answer:
              </Typography>
              <Typography variant="body2" className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {question.answer}
              </Typography>
            </Box>

            {question.context && (
              <Box>
                <Typography variant="subtitle2" className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Context:
                </Typography>
                <Typography variant="caption" className="text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded">
                  {question.context}
                </Typography>
              </Box>
            )}

            <Box className="flex items-center justify-between pt-3 border-t dark:border-gray-700">
              <Box className="flex items-center space-x-2">
                {copied && (
                  <Chip
                    label="Copied!"
                    size="small"
                    className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  />
                )}
              </Box>
              <Box className="flex items-center space-x-1">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <ContentCopy />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDownload?.(question)}
                  className="text-gray-500 dark:text-gray-400"
                >
                  <Download />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </motion.div>
  );
};

const QuestionGeneration = () => {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [numQuestions, setNumQuestions] = useState(5);
  const [questions, setQuestions] = useState({
    common: [],
    rare: [],
    unexpected: [],
  });

  // Mock cases data
  const mockCases = [
    { case_id: 'case_2024_001', title: 'Contract Dispute - Tech Services' },
    { case_id: 'case_2024_002', title: 'Employment Agreement Review' },
    { case_id: 'case_2024_003', title: 'Patent Infringement Case' },
    { case_id: 'case_2024_004', title: 'Real Estate Purchase Agreement' },
    { case_id: 'case_2024_005', title: 'Corporate Merger Documentation' },
  ];

  // Mock questions for demo
  const generateMockQuestions = (type, count) => {
    const mockData = {
      common: [
        {
          question: "What are the key terms and conditions outlined in this contract?",
          answer: "The contract outlines payment terms of Net 30, delivery obligations within 14 business days, and standard liability limitations. It includes termination clauses allowing either party to terminate with 30 days notice.",
          difficulty: "Easy",
          context: "This question addresses fundamental contract elements that are typically reviewed first.",
        },
        {
          question: "What are the parties' obligations under this agreement?",
          answer: "The service provider must deliver specified services within agreed timelines and quality standards. The client must provide necessary access, information, and timely payments as outlined in the payment schedule.",
          difficulty: "Easy",
          context: "Understanding mutual obligations is crucial for contract compliance.",
        },
      ],
      rare: [
        {
          question: "How does the force majeure clause specifically address pandemic-related disruptions?",
          answer: "The force majeure clause includes specific language addressing pandemic impacts, allowing for performance delays due to government-mandated lockdowns, supply chain disruptions, and workforce availability issues, with notification requirements within 10 days.",
          difficulty: "Hard",
          context: "This addresses modern contractual considerations that became prominent after COVID-19.",
        },
        {
          question: "What intellectual property indemnification provisions exist for third-party claims?",
          answer: "The agreement includes comprehensive IP indemnification where the service provider agrees to defend and hold harmless the client against third-party IP infringement claims arising from the delivered services, with specified defense procedures and damage limitations.",
          difficulty: "Hard",
          context: "IP indemnification is a sophisticated contractual element requiring careful analysis.",
        },
      ],
      unexpected: [
        {
          question: "If the contract were governed by maritime law instead of state law, how would the dispute resolution mechanism change?",
          answer: "Under maritime law, disputes would likely be subject to federal admiralty jurisdiction, potentially requiring arbitration through maritime arbitration panels rather than state courts, with different limitation periods and remedy structures applying.",
          difficulty: "Expert",
          context: "This explores hypothetical legal frameworks to test deep understanding.",
        },
        {
          question: "How might blockchain technology implementation affect the contract's audit and verification clauses?",
          answer: "Blockchain implementation could provide immutable audit trails, potentially reducing the need for traditional third-party verification while requiring new technical standards for data integrity and smart contract integration protocols.",
          difficulty: "Expert",
          context: "This question explores emerging technology impacts on traditional legal frameworks.",
        },
      ],
    };

    return mockData[type]?.slice(0, count) || [];
  };

  // Mutations for different question types
  const commonQuestionsMutation = useMutation({
    mutationFn: (data) => apiService.generateCommonQuestions(data.caseId, data.numQuestions),
    onSuccess: (data) => {
      setQuestions(prev => ({
        ...prev,
        common: data.data.questions || generateMockQuestions('common', numQuestions),
      }));
      toast.success('Common questions generated successfully!');
    },
    onError: () => {
      setQuestions(prev => ({
        ...prev,
        common: generateMockQuestions('common', numQuestions),
      }));
      toast.success('Mock common questions generated for demonstration');
    },
  });

  const rareQuestionsMutation = useMutation({
    mutationFn: (data) => apiService.generateRareQuestions(data.caseId, data.numQuestions),
    onSuccess: (data) => {
      setQuestions(prev => ({
        ...prev,
        rare: data.data.questions || generateMockQuestions('rare', numQuestions),
      }));
      toast.success('Rare questions generated successfully!');
    },
    onError: () => {
      setQuestions(prev => ({
        ...prev,
        rare: generateMockQuestions('rare', Math.min(numQuestions, 3)),
      }));
      toast.success('Mock rare questions generated for demonstration');
    },
  });

  const unexpectedQuestionsMutation = useMutation({
    mutationFn: (data) => apiService.generateUnexpectedQuestions(data.caseId, data.numQuestions),
    onSuccess: (data) => {
      setQuestions(prev => ({
        ...prev,
        unexpected: data.data.questions || generateMockQuestions('unexpected', numQuestions),
      }));
      toast.success('Unexpected questions generated successfully!');
    },
    onError: () => {
      setQuestions(prev => ({
        ...prev,
        unexpected: generateMockQuestions('unexpected', Math.min(numQuestions, 2)),
      }));
      toast.success('Mock unexpected questions generated for demonstration');
    },
  });

  const handleGenerateQuestions = (type) => {
    if (!selectedCaseId) {
      toast.error('Please select a case first');
      return;
    }

    const data = { caseId: selectedCaseId, numQuestions };

    switch (type) {
      case 'common':
        commonQuestionsMutation.mutate(data);
        break;
      case 'rare':
        rareQuestionsMutation.mutate(data);
        break;
      case 'unexpected':
        unexpectedQuestionsMutation.mutate(data);
        break;
    }
  };

  const handleDownloadQuestions = (type) => {
    const questionsToDownload = questions[type];
    if (questionsToDownload.length === 0) {
      toast.error('No questions to download');
      return;
    }

    const content = questionsToDownload
      .map((q, i) => `${i + 1}. Q: ${q.question}\n   A: ${q.answer}\n`)
      .join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_questions_${selectedCaseId}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Questions downloaded successfully');
  };

  const tabLabels = ['Common Questions', 'Rare Questions', 'Unexpected Questions'];
  const questionTypes = ['common', 'rare', 'unexpected'];
  const currentType = questionTypes[activeTab];

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
          Q&A Generation
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
          Generate targeted questions and answers from legal documents
        </Typography>
      </Box>

      {/* Controls */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Generate Questions
          </Typography>

          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Case</InputLabel>
                <Select
                  value={selectedCaseId}
                  label="Select Case"
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                >
                  {mockCases.map((case_) => (
                    <MenuItem key={case_.case_id} value={case_.case_id}>
                      {case_.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Number of Questions"
                type="number"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value) || 1)}
                inputProps={{ min: 1, max: 10 }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={() => handleGenerateQuestions(currentType)}
                disabled={!selectedCaseId || commonQuestionsMutation.isLoading || rareQuestionsMutation.isLoading || unexpectedQuestionsMutation.isLoading}
                className="bg-primary-600 hover:bg-primary-700"
                startIcon={<QuestionAnswer />}
              >
                Generate
              </Button>
            </Grid>
          </Grid>

          {(commonQuestionsMutation.isLoading || rareQuestionsMutation.isLoading || unexpectedQuestionsMutation.isLoading) && (
            <Box className="mt-4">
              <LinearProgress />
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400 mt-2">
                Analyzing document and generating questions...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Question Tabs */}
      <Card className="bg-white dark:bg-gray-800">
        <Box className="border-b dark:border-gray-700">
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            className="px-6"
          >
            {tabLabels.map((label, index) => (
              <Tab
                key={label}
                label={
                  <Box className="flex items-center space-x-2">
                    <span>{label}</span>
                    {questions[questionTypes[index]].length > 0 && (
                      <Chip
                        size="small"
                        label={questions[questionTypes[index]].length}
                        className="bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400"
                      />
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        <CardContent className="p-6">
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
              {tabLabels[activeTab]} ({questions[currentType].length})
            </Typography>
            
            {questions[currentType].length > 0 && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleDownloadQuestions(currentType)}
                startIcon={<Download />}
                className="text-primary-600 border-primary-600"
              >
                Download All
              </Button>
            )}
          </Box>

          <AnimatePresence>
            {questions[currentType].length > 0 ? (
              questions[currentType].map((question, index) => (
                <QuestionCard
                  key={index}
                  question={question}
                  type={currentType}
                  onCopy={() => toast.success('Question copied to clipboard')}
                  onDownload={(q) => {
                    const content = `Q: ${q.question}\nA: ${q.answer}`;
                    const blob = new Blob([content], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `question_${index + 1}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                    toast.success('Question downloaded');
                  }}
                />
              ))
            ) : (
              <Box className="text-center py-12">
                <QuestionAnswer className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
                <Typography variant="h6" className="text-gray-500 dark:text-gray-400 mb-2">
                  No {currentType} questions generated yet
                </Typography>
                <Typography variant="body2" className="text-gray-400 dark:text-gray-500">
                  Select a case and click "Generate" to create questions
                </Typography>
              </Box>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* Information Cards */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 h-full">
            <CardContent className="p-6">
              <Box className="flex items-center mb-3">
                <Help className="text-green-600 dark:text-green-400 mr-2" />
                <Typography variant="h6" className="font-semibold text-green-900 dark:text-green-100">
                  Common Questions
                </Typography>
              </Box>
              <Typography variant="body2" className="text-green-800 dark:text-green-200">
                Basic questions that address fundamental aspects of the document, suitable for initial review and understanding.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 h-full">
            <CardContent className="p-6">
              <Box className="flex items-center mb-3">
                <Star className="text-orange-600 dark:text-orange-400 mr-2" />
                <Typography variant="h6" className="font-semibold text-orange-900 dark:text-orange-100">
                  Rare Questions
                </Typography>
              </Box>
              <Typography variant="body2" className="text-orange-800 dark:text-orange-200">
                Advanced questions that explore complex legal concepts and edge cases within the document.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 h-full">
            <CardContent className="p-6">
              <Box className="flex items-center mb-3">
                <Psychology className="text-purple-600 dark:text-purple-400 mr-2" />
                <Typography variant="h6" className="font-semibold text-purple-900 dark:text-purple-100">
                  Unexpected Questions
                </Typography>
              </Box>
              <Typography variant="body2" className="text-purple-800 dark:text-purple-200">
                Creative questions that explore hypothetical scenarios and test deep understanding of legal principles.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuestionGeneration;
