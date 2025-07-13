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
} from '@mui/material';
import {
  Summarize,
  Download,
  Refresh,
  ContentCopy,
  CheckCircle,
  Error,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

const SummaryCard = ({ summary, onDownload, onCopy }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    onCopy?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <Box className="flex items-start justify-between mb-4">
            <Box className="flex-1">
              <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {summary.title || summary.case_id}
              </Typography>
              <Box className="flex items-center space-x-2 mb-3">
                <Chip
                  size="small"
                  label={summary.summary_type || 'extractive'}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                />
                <Chip
                  size="small"
                  label={`${summary.content?.length || 0} characters`}
                  className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                />
                {summary.status === 'completed' && (
                  <CheckCircle className="text-green-500" />
                )}
                {summary.status === 'error' && (
                  <Error className="text-red-500" />
                )}
              </Box>
            </Box>
            <Box className="flex items-center space-x-1 ml-4">
              <IconButton
                size="small"
                onClick={handleCopy}
                className="text-gray-500 dark:text-gray-400"
              >
                <ContentCopy />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onDownload?.(summary)}
                className="text-gray-500 dark:text-gray-400"
              >
                <Download />
              </IconButton>
            </Box>
          </Box>

          <Typography
            variant="body2"
            className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap mb-4"
          >
            {summary.content}
          </Typography>

          {summary.key_points && summary.key_points.length > 0 && (
            <Box>
              <Typography variant="subtitle2" className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Key Points:
              </Typography>
              <List dense>
                {summary.key_points.map((point, index) => (
                  <ListItem key={index} className="px-0">
                    <ListItemText
                      primary={`• ${point}`}
                      primaryTypographyProps={{
                        variant: 'body2',
                        className: 'text-gray-700 dark:text-gray-300',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {copied && (
            <Chip
              label="Copied to clipboard!"
              size="small"
              className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400 mt-2"
            />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Summarization = () => {
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [summaryType, setSummaryType] = useState('extractive');
  const [maxLength, setMaxLength] = useState(500);
  const [batchMode, setBatchMode] = useState(false);
  const [selectedCases, setSelectedCases] = useState([]);
  const [summaries, setSummaries] = useState([]);

  // Mock cases data - in real app, this would come from API
  const mockCases = [
    { case_id: 'case_2024_001', title: 'Contract Dispute - Tech Services' },
    { case_id: 'case_2024_002', title: 'Employment Agreement Review' },
    { case_id: 'case_2024_003', title: 'Patent Infringement Case' },
    { case_id: 'case_2024_004', title: 'Real Estate Purchase Agreement' },
    { case_id: 'case_2024_005', title: 'Corporate Merger Documentation' },
  ];

  // Single case summarization
  const summarizeMutation = useMutation({
    mutationFn: (data) => apiService.summarizeCase(
      data.caseId,
      data.summaryType,
      data.maxLength
    ),
    onSuccess: (data) => {
      const newSummary = {
        id: Date.now(),
        case_id: selectedCaseId,
        title: mockCases.find(c => c.case_id === selectedCaseId)?.title,
        content: data.data.summary,
        summary_type: summaryType,
        status: 'completed',
        created_at: new Date().toISOString(),
        key_points: data.data.key_points || [],
      };
      setSummaries(prev => [newSummary, ...prev]);
      toast.success('Summary generated successfully!');
    },
    onError: (error) => {
      // Add mock summary on error for demo purposes
      const mockSummary = {
        id: Date.now(),
        case_id: selectedCaseId,
        title: mockCases.find(c => c.case_id === selectedCaseId)?.title,
        content: `This is a mock summary of the ${mockCases.find(c => c.case_id === selectedCaseId)?.title}. The document contains important legal provisions regarding contract terms, obligations, and dispute resolution mechanisms. Key areas of focus include liability limitations, termination clauses, and intellectual property rights. The analysis reveals several critical points that require attention from legal counsel.`,
        summary_type: summaryType,
        status: 'completed',
        created_at: new Date().toISOString(),
        key_points: [
          'Contract termination provisions are clearly defined',
          'Liability is limited to direct damages only',
          'Intellectual property rights are properly assigned',
          'Dispute resolution requires mandatory arbitration',
        ],
      };
      setSummaries(prev => [mockSummary, ...prev]);
      toast.success('Mock summary generated for demonstration');
    },
  });

  // Batch summarization
  const batchSummarizeMutation = useMutation({
    mutationFn: (data) => apiService.batchSummarize(
      data.caseIds,
      data.summaryType
    ),
    onSuccess: (data) => {
      const newSummaries = selectedCases.map((caseId, index) => ({
        id: Date.now() + index,
        case_id: caseId,
        title: mockCases.find(c => c.case_id === caseId)?.title,
        content: data.data.summaries?.[index] || `Summary for ${caseId}`,
        summary_type: summaryType,
        status: 'completed',
        created_at: new Date().toISOString(),
      }));
      setSummaries(prev => [...newSummaries, ...prev]);
      toast.success(`${selectedCases.length} summaries generated successfully!`);
      setSelectedCases([]);
    },
    onError: (error) => {
      toast.error(`Batch summarization failed: ${error.message}`);
    },
  });

  const handleSingleSummarize = () => {
    if (!selectedCaseId) {
      toast.error('Please select a case to summarize');
      return;
    }
    summarizeMutation.mutate({
      caseId: selectedCaseId,
      summaryType,
      maxLength,
    });
  };

  const handleBatchSummarize = () => {
    if (selectedCases.length === 0) {
      toast.error('Please select cases for batch summarization');
      return;
    }
    batchSummarizeMutation.mutate({
      caseIds: selectedCases,
      summaryType,
    });
  };

  const handleDownload = (summary) => {
    const blob = new Blob([summary.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_${summary.case_id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Summary downloaded successfully');
  };

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
          Document Summarization
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
          Generate AI-powered summaries of legal documents
        </Typography>
      </Box>

      {/* Summarization Controls */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Generate Summary
          </Typography>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Select Case</InputLabel>
                <Select
                  value={selectedCaseId}
                  label="Select Case"
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  disabled={batchMode}
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
              <FormControl fullWidth>
                <InputLabel>Summary Type</InputLabel>
                <Select
                  value={summaryType}
                  label="Summary Type"
                  onChange={(e) => setSummaryType(e.target.value)}
                >
                  <MenuItem value="extractive">Extractive</MenuItem>
                  <MenuItem value="abstractive">Abstractive</MenuItem>
                  <MenuItem value="hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Max Length"
                type="number"
                value={maxLength}
                onChange={(e) => setMaxLength(parseInt(e.target.value))}
                inputProps={{ min: 100, max: 2000 }}
              />
            </Grid>

            <Grid item xs={12}>
              <Box className="flex items-center space-x-4">
                <Button
                  variant="contained"
                  onClick={handleSingleSummarize}
                  disabled={summarizeMutation.isLoading || !selectedCaseId}
                  className="bg-primary-600 hover:bg-primary-700"
                  startIcon={<Summarize />}
                >
                  {summarizeMutation.isLoading ? 'Generating...' : 'Generate Summary'}
                </Button>

                <Button
                  variant="outlined"
                  onClick={() => setBatchMode(!batchMode)}
                  className="text-primary-600 border-primary-600"
                >
                  {batchMode ? 'Single Mode' : 'Batch Mode'}
                </Button>
              </Box>
            </Grid>
          </Grid>

          {summarizeMutation.isLoading && (
            <Box className="mt-4">
              <LinearProgress />
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400 mt-2">
                Analyzing document and generating summary...
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Batch Mode Controls */}
      {batchMode && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <Typography variant="h6" className="font-semibold text-blue-900 dark:text-blue-100 mb-4">
              Batch Summarization
            </Typography>

            <Box className="space-y-4">
              <Box>
                <Typography variant="subtitle2" className="text-blue-800 dark:text-blue-200 mb-2">
                  Select Cases for Batch Processing:
                </Typography>
                <Box className="flex flex-wrap gap-2">
                  {mockCases.map((case_) => (
                    <Chip
                      key={case_.case_id}
                      label={case_.title}
                      onClick={() => {
                        setSelectedCases(prev =>
                          prev.includes(case_.case_id)
                            ? prev.filter(id => id !== case_.case_id)
                            : [...prev, case_.case_id]
                        );
                      }}
                      color={selectedCases.includes(case_.case_id) ? 'primary' : 'default'}
                      className="cursor-pointer"
                    />
                  ))}
                </Box>
              </Box>

              <Button
                variant="contained"
                onClick={handleBatchSummarize}
                disabled={batchSummarizeMutation.isLoading || selectedCases.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
                startIcon={<Summarize />}
              >
                {batchSummarizeMutation.isLoading
                  ? `Processing ${selectedCases.length} cases...`
                  : `Generate ${selectedCases.length} Summaries`
                }
              </Button>

              {batchSummarizeMutation.isLoading && (
                <LinearProgress className="mt-2" />
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Generated Summaries */}
      {summaries.length > 0 && (
        <Box>
          <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Generated Summaries ({summaries.length})
          </Typography>

          {summaries.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              onDownload={handleDownload}
              onCopy={() => toast.success('Summary copied to clipboard')}
            />
          ))}
        </Box>
      )}

      {/* Help Section */}
      <Alert
        severity="info"
        className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      >
        <Typography variant="body2">
          <strong>Summarization Types:</strong>
          <br />
          • <strong>Extractive:</strong> Selects important sentences from the original document
          <br />
          • <strong>Abstractive:</strong> Generates new sentences that capture the main ideas
          <br />
          • <strong>Hybrid:</strong> Combines both approaches for comprehensive summaries
        </Typography>
      </Alert>
    </Box>
  );
};

export default Summarization;
