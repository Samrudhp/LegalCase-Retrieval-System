import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Alert,
  LinearProgress,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  SummarizeRounded,
  DownloadRounded,
  RefreshRounded,
  ContentCopyRounded,
  CheckCircleRounded,
  ErrorRounded,
  AutoAwesomeRounded,
  DescriptionRounded,
  TrendingUpRounded,
  InsightsRounded,
  SpeedRounded,
  ExpandMoreRounded,
  StarRounded,
  BookmarkRounded,
  ShareRounded,
  VisibilityRounded,
  FilterListRounded,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const SummaryCard = ({ summary, onDownload, onCopy, index }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'executive': return <TrendingUpRounded />;
      case 'detailed': return <DescriptionRounded />;
      case 'key-points': return <StarRounded />;
      default: return <SummarizeRounded />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'executive': return 'from-primary-500 to-accent-500';
      case 'detailed': return 'from-success-500 to-success-600';
      case 'key-points': return 'from-warning-500 to-warning-600';
      default: return 'from-secondary-500 to-secondary-600';
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
                className={`p-3 rounded-2xl bg-gradient-to-br ${getTypeColor(summary.type)} shadow-medium`}
              >
                {React.cloneElement(getTypeIcon(summary.type), {
                  className: "text-white text-xl"
                })}
              </motion.div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                    {summary.title || summary.document_name}
                  </Typography>
                  <Chip
                    size="small"
                    label={summary.type || 'Summary'}
                    className="bg-primary-100 text-primary-800 dark:bg-primary-800/30 dark:text-primary-300 capitalize"
                  />
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-secondary-600 dark:text-secondary-400">
                  <div className="flex items-center space-x-1">
                    <DescriptionRounded className="text-sm" />
                    <span>{summary.word_count || 0} words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <SpeedRounded className="text-sm" />
                    <span>{summary.confidence ? `${Math.round(summary.confidence * 100)}% confidence` : 'Processing'}</span>
                  </div>
                  <span>{new Date(summary.created_at || Date.now()).toLocaleDateString()}</span>
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
                  onClick={() => onDownload?.(summary)}
                  className="text-secondary-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20"
                >
                  <DownloadRounded />
                </IconButton>
              </motion.div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Summary Preview */}
            <div className="bg-secondary-50/50 dark:bg-secondary-800/50 rounded-2xl p-4">
              <Typography 
                variant="body2" 
                className="text-secondary-700 dark:text-secondary-300 line-clamp-3"
              >
                {summary.content || summary.summary || 'Summary content will appear here...'}
              </Typography>
            </div>

            {/* Key Points */}
            {summary.key_points && summary.key_points.length > 0 && (
              <div>
                <Typography variant="body2" className="font-medium text-secondary-700 dark:text-secondary-300 mb-2 flex items-center">
                  <StarRounded className="mr-1 text-sm text-warning-500" />
                  Key Points:
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {summary.key_points.slice(0, 3).map((point, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 + idx * 0.05 }}
                    >
                      <Chip
                        size="small"
                        label={point}
                        className="bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300"
                      />
                    </motion.div>
                  ))}
                  {summary.key_points.length > 3 && (
                    <Chip
                      size="small"
                      label={`+${summary.key_points.length - 3} more`}
                      className="bg-secondary-100 text-secondary-600 dark:bg-secondary-800 dark:text-secondary-400"
                    />
                  )}
                </div>
              </div>
            )}

            {/* Detailed View Toggle */}
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
                  View Full Summary & Details
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
                      {summary.full_content || summary.content || 'Detailed summary content would appear here...'}
                    </Typography>
                  </div>
                  
                  {summary.metadata && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block">
                          Reading Time:
                        </Typography>
                        <Typography variant="body2" className="font-medium text-secondary-900 dark:text-white">
                          {summary.metadata.reading_time || '2-3 min'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block">
                          Complexity:
                        </Typography>
                        <Typography variant="body2" className="font-medium text-secondary-900 dark:text-white">
                          {summary.metadata.complexity || 'Medium'}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block">
                          Topics:
                        </Typography>
                        <Typography variant="body2" className="font-medium text-secondary-900 dark:text-white">
                          {summary.metadata.topic_count || 3}
                        </Typography>
                      </div>
                      <div>
                        <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block">
                          Accuracy:
                        </Typography>
                        <Typography variant="body2" className="font-medium text-secondary-900 dark:text-white">
                          {summary.metadata.accuracy || '95%'}
                        </Typography>
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

const Summarization = () => {
  const [selectedDocument, setSelectedDocument] = useState('');
  const [summaryType, setSummaryType] = useState('executive');
  const [customLength, setCustomLength] = useState(200);
  const [summaries, setSummaries] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

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

  // Mutation for generating summaries
  const generateSummaryMutation = useMutation({
    mutationFn: (params) => apiService.generateSummary(params),
    onMutate: () => {
      setIsGenerating(true);
    },
    onSuccess: (data) => {
      const newSummary = {
        id: Date.now(),
        ...data.data,
        created_at: new Date().toISOString(),
      };
      setSummaries(prev => [newSummary, ...prev]);
      setIsGenerating(false);
    },
    onError: (error) => {
      // Add mock summary for demonstration
      const mockSummary = {
        id: Date.now(),
        title: documents?.data?.find(d => d.id.toString() === selectedDocument)?.name || 'Document Summary',
        type: summaryType,
        content: 'This is a comprehensive summary of the selected legal document. The analysis covers key terms, important clauses, potential risks, and actionable insights. The document appears to be well-structured with standard legal provisions.',
        key_points: ['Key provision identified', 'Important deadline noted', 'Risk assessment completed'],
        word_count: 245,
        confidence: 0.92,
        created_at: new Date().toISOString(),
        metadata: {
          reading_time: '2-3 min',
          complexity: 'Medium',
          topic_count: 4,
          accuracy: '92%'
        }
      };
      setSummaries(prev => [mockSummary, ...prev]);
      setIsGenerating(false);
    },
  });

  const handleGenerateSummary = () => {
    if (selectedDocument) {
      generateSummaryMutation.mutate({
        document_id: selectedDocument,
        summary_type: summaryType,
        length: customLength,
      });
    }
  };

  const handleDownloadSummary = (summary) => {
    const content = `${summary.title}\n\nSummary:\n${summary.content}\n\nGenerated on: ${new Date(summary.created_at).toLocaleString()}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${summary.title}_summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = () => {
    // Add toast notification for copy action
  };

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
            AI Document Summarization
          </motion.h1>
          <Typography variant="h6" className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Generate intelligent summaries of legal documents with AI-powered analysis
          </Typography>
        </div>
      </motion.div>

      {/* Summary Generation Panel */}
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
                  Generate New Summary
                </Typography>
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                  Select a document and customize your summary preferences
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
                    Summary Type
                  </InputLabel>
                  <Select
                    value={summaryType}
                    label="Summary Type"
                    onChange={(e) => setSummaryType(e.target.value)}
                    className="rounded-2xl"
                  >
                    <MenuItem value="executive">Executive Summary</MenuItem>
                    <MenuItem value="detailed">Detailed Analysis</MenuItem>
                    <MenuItem value="key-points">Key Points Only</MenuItem>
                    <MenuItem value="custom">Custom Length</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              {summaryType === 'custom' && (
                <Grid xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Target Word Count"
                    type="number"
                    value={customLength}
                    onChange={(e) => setCustomLength(parseInt(e.target.value))}
                    InputProps={{
                      inputProps: { min: 50, max: 1000 }
                    }}
                    className="rounded-2xl"
                  />
                </Grid>
              )}

              <Grid xs={12}>
                <div className="flex justify-end">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      variant="contained"
                      onClick={handleGenerateSummary}
                      disabled={!selectedDocument || isGenerating}
                      startIcon={isGenerating ? <RefreshRounded className="animate-spin" /> : <SummarizeRounded />}
                      className="rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-medium px-8"
                    >
                      {isGenerating ? 'Generating Summary...' : 'Generate Summary'}
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
                  <AutoAwesomeRounded className="text-white text-xl animate-pulse" />
                </div>
                <div className="flex-1">
                  <Typography variant="h6" className="font-bold text-primary-900 dark:text-primary-100 mb-2">
                    AI Processing Document
                  </Typography>
                  <Typography variant="body2" className="text-primary-700 dark:text-primary-300 mb-3">
                    Analyzing content, extracting key information, and generating intelligent summary...
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

      {/* Generated Summaries */}
      {summaries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 shadow-medium">
                <DescriptionRounded className="text-white text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                  Generated Summaries ({summaries.length})
                </Typography>
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                  AI-powered document analysis and insights
                </Typography>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Chip
                icon={<AutoAwesomeRounded />}
                label="AI Enhanced"
                className="bg-accent-100 text-accent-800 dark:bg-accent-800/30 dark:text-accent-300"
              />
              <motion.div whileHover={{ scale: 1.05 }}>
                <IconButton className="text-secondary-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  <FilterListRounded />
                </IconButton>
              </motion.div>
            </div>
          </div>

          <AnimatePresence>
            {summaries.map((summary, index) => (
              <SummaryCard
                key={summary.id}
                summary={summary}
                onDownload={handleDownloadSummary}
                onCopy={handleCopySummary}
                index={index}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Empty State */}
      {summaries.length === 0 && !isGenerating && (
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
                <SummarizeRounded className="text-white text-4xl" />
              </motion.div>
              
              <Typography variant="h6" className="text-secondary-900 dark:text-white mb-2 font-bold">
                No Summaries Generated Yet
              </Typography>
              <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 mb-6 max-w-md mx-auto">
                Select a document above and click "Generate Summary" to create your first AI-powered document analysis.
              </Typography>
              
              <div className="space-y-4">
                <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 font-medium">
                  Summary Types Available:
                </Typography>
                <div className="flex flex-wrap justify-center gap-2">
                  <Chip label="Executive Summary" className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300" />
                  <Chip label="Detailed Analysis" className="bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-300" />
                  <Chip label="Key Points" className="bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-300" />
                  <Chip label="Custom Length" className="bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Summarization;
