import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  IconButton,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Switch,
  FormControlLabel,
  InputAdornment,
  Fade,
} from '@mui/material';
import {
  SearchRounded,
  FilterListRounded,
  ClearRounded,
  DescriptionRounded,
  DateRangeRounded,
  ExpandMoreRounded,
  BookmarkRounded,
  ShareRounded,
  DownloadRounded,
  AutoAwesomeRounded,
  TrendingUpRounded,
  InsightsRounded,
  StarRounded,
  VisibilityRounded,
  SpeedRounded,
  FolderRounded,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const SearchFilters = ({ filters, onFiltersChange, isOpen, onToggle }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-medium">
                <FilterListRounded className="text-white text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                  Search Filters
                </Typography>
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                  Refine your search results
                </Typography>
              </div>
            </div>
            
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="outlined"
                onClick={onToggle}
                endIcon={
                  <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ExpandMoreRounded />
                  </motion.div>
                }
                className="rounded-2xl border-secondary-300 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-600"
              >
                {isOpen ? 'Collapse' : 'Expand'}
              </Button>
            </motion.div>
          </div>

          <Fade in={isOpen}>
            <div className={isOpen ? 'block' : 'hidden'}>
              <Grid container spacing={4}>
                <Grid xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel className="text-secondary-600 dark:text-secondary-400">
                      Document Type
                    </InputLabel>
                    <Select
                      value={filters.documentType || ''}
                      label="Document Type"
                      onChange={(e) => handleFilterChange('documentType', e.target.value)}
                      className="rounded-2xl"
                    >
                      <MenuItem value="">All Types</MenuItem>
                      <MenuItem value="contract">Contracts</MenuItem>
                      <MenuItem value="case">Case Files</MenuItem>
                      <MenuItem value="brief">Legal Briefs</MenuItem>
                      <MenuItem value="memo">Memorandums</MenuItem>
                      <MenuItem value="agreement">Agreements</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel className="text-secondary-600 dark:text-secondary-400">
                      Date Range
                    </InputLabel>
                    <Select
                      value={filters.dateRange || ''}
                      label="Date Range"
                      onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                      className="rounded-2xl"
                    >
                      <MenuItem value="">Any Time</MenuItem>
                      <MenuItem value="today">Today</MenuItem>
                      <MenuItem value="week">This Week</MenuItem>
                      <MenuItem value="month">This Month</MenuItem>
                      <MenuItem value="quarter">This Quarter</MenuItem>
                      <MenuItem value="year">This Year</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel className="text-secondary-600 dark:text-secondary-400">
                      File Size
                    </InputLabel>
                    <Select
                      value={filters.fileSize || ''}
                      label="File Size"
                      onChange={(e) => handleFilterChange('fileSize', e.target.value)}
                      className="rounded-2xl"
                    >
                      <MenuItem value="">Any Size</MenuItem>
                      <MenuItem value="small">Small (&lt; 1MB)</MenuItem>
                      <MenuItem value="medium">Medium (1-10MB)</MenuItem>
                      <MenuItem value="large">Large (&gt; 10MB)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid xs={12} sm={6} md={3}>
                  <div className="h-full flex items-center">
                    <FormControlLabel
                      control={
                        <Switch
                          checked={filters.semanticSearch || false}
                          onChange={(e) => handleFilterChange('semanticSearch', e.target.checked)}
                          className="ml-2"
                        />
                      }
                      label={
                        <div className="flex items-center space-x-2">
                          <AutoAwesomeRounded className="text-accent-500" />
                          <span className="text-secondary-700 dark:text-secondary-300 font-medium">
                            AI Semantic Search
                          </span>
                        </div>
                      }
                    />
                  </div>
                </Grid>
              </Grid>
            </div>
          </Fade>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const SearchResult = ({ result, onSelect, index }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.01, y: -3 }}
    >
      <Card className="mb-6 bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-medium hover:shadow-large transition-all duration-300 group">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium"
                >
                  <DescriptionRounded className="text-white text-lg" />
                </motion.div>
                
                <div className="flex-1">
                  <Typography
                    variant="h6"
                    className="font-bold text-secondary-900 dark:text-white cursor-pointer hover:text-primary-600 dark:hover:text-primary-400 transition-colors mb-1"
                    onClick={() => onSelect(result)}
                  >
                    {result.title || result.filename}
                  </Typography>
                  
                  <div className="flex items-center space-x-3">
                    <Chip
                      size="small"
                      label={result.type || 'Document'}
                      className="bg-primary-100 text-primary-800 dark:bg-primary-800/30 dark:text-primary-300 font-medium"
                    />
                    <div className="flex items-center text-secondary-500 dark:text-secondary-400 text-sm">
                      <DateRangeRounded className="mr-1 text-sm" />
                      {result.created_at ? format(new Date(result.created_at), 'MMM dd, yyyy') : 'Unknown date'}
                    </div>
                    {result.size && (
                      <div className="text-secondary-500 dark:text-secondary-400 text-sm">
                        {(result.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Typography
                variant="body2"
                className="text-secondary-700 dark:text-secondary-300 line-clamp-3 mb-4"
              >
                {result.summary || result.content?.substring(0, 300) + '...'}
              </Typography>

              {result.highlights && result.highlights.length > 0 && (
                <div className="mb-4">
                  <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 flex items-center mb-2">
                    <SpeedRounded className="mr-1 text-sm" />
                    Relevant excerpts:
                  </Typography>
                  {result.highlights.slice(0, 2).map((highlight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + idx * 0.1 }}
                      className="bg-accent-50/50 dark:bg-accent-900/20 border-l-4 border-accent-400 p-3 mb-2 rounded-r-xl"
                    >
                      <Typography
                        variant="caption"
                        className="text-secondary-700 dark:text-secondary-300"
                        dangerouslySetInnerHTML={{ __html: highlight }}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton size="small" className="text-secondary-400 hover:text-warning-500 hover:bg-warning-50 dark:hover:bg-warning-900/20">
                  <BookmarkRounded />
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton size="small" className="text-secondary-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20">
                  <ShareRounded />
                </IconButton>
              </motion.div>
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <IconButton size="small" className="text-secondary-400 hover:text-success-500 hover:bg-success-50 dark:hover:bg-success-900/20">
                  <DownloadRounded />
                </IconButton>
              </motion.div>
            </div>
          </div>

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
                <InsightsRounded className="mr-1 text-sm" />
                Document Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails className="px-0 pt-0">
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
              >
                <Grid container spacing={3}>
                  <Grid xs={6} sm={3}>
                    <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block mb-1">
                      Case ID:
                    </Typography>
                    <Typography variant="body2" className="text-secondary-900 dark:text-white font-medium">
                      {result.case_id || 'N/A'}
                    </Typography>
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block mb-1">
                      Pages:
                    </Typography>
                    <Typography variant="body2" className="text-secondary-900 dark:text-white font-medium">
                      {result.page_count || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block mb-1">
                      Language:
                    </Typography>
                    <Typography variant="body2" className="text-secondary-900 dark:text-white font-medium">
                      {result.language || 'English'}
                    </Typography>
                  </Grid>
                  <Grid xs={6} sm={3}>
                    <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400 block mb-1">
                      Relevance:
                    </Typography>
                    <div className="flex items-center space-x-2">
                      <Typography variant="body2" className="text-secondary-900 dark:text-white font-medium">
                        {result.score ? `${(result.score * 100).toFixed(1)}%` : 'N/A'}
                      </Typography>
                      {result.score && (
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <StarRounded
                              key={i}
                              className={`text-sm ${
                                i < Math.floor(result.score * 5)
                                  ? 'text-warning-500'
                                  : 'text-secondary-300 dark:text-secondary-600'
                              }`}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </Grid>
                </Grid>
              </motion.div>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Search = () => {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [resultsPerPage] = useState(10);
  const [searchResults, setSearchResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['search', query, filters, currentPage],
    queryFn: async () => {
      if (!query.trim()) return { results: [], total: 0 };
      
      if (filters.semanticSearch) {
        const response = await apiService.semanticSearch(query, resultsPerPage);
        return {
          results: response.data.results || [],
          total: response.data.total || 0,
        };
      } else {
        const response = await apiService.textSearch(query, {
          ...filters,
          page: currentPage,
          limit: resultsPerPage,
        });
        return {
          results: response.data.results || [],
          total: response.data.total || 0,
        };
      }
    },
    enabled: false,
    onSuccess: (data) => {
      setSearchResults(data.results);
      setTotalResults(data.total);
    },
  });

  const handleSearch = () => {
    if (query.trim()) {
      setCurrentPage(1);
      refetch();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleResultSelect = (result) => {
    console.log('Selected result:', result);
  };

  const clearSearch = () => {
    setQuery('');
    setSearchResults([]);
    setTotalResults(0);
    setFilters({});
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalResults / resultsPerPage);

  // Mock suggestions for empty state
  const suggestions = [
    'contract dispute resolution',
    'intellectual property law',
    'employment agreement terms',
    'merger and acquisition documents',
    'privacy policy compliance'
  ];

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
            Legal Document Search
          </motion.h1>
          <Typography variant="h6" className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Find relevant documents using advanced search and AI-powered semantic analysis
          </Typography>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search legal documents, cases, contracts, precedents..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="rounded-2xl"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchRounded className="text-secondary-400" />
                      </InputAdornment>
                    ),
                    endAdornment: query && (
                      <InputAdornment position="end">
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <IconButton onClick={clearSearch} size="small" className="text-secondary-400">
                            <ClearRounded />
                          </IconButton>
                        </motion.div>
                      </InputAdornment>
                    ),
                    className: "rounded-2xl bg-secondary-50/50 dark:bg-secondary-800/50",
                  }}
                />
              </div>
              
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  onClick={handleSearch}
                  disabled={!query.trim() || isLoading}
                  startIcon={isLoading ? <AutoAwesomeRounded className="animate-spin" /> : <SearchRounded />}
                  className="rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-medium px-8 py-3"
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </motion.div>
            </div>

            {/* Quick suggestions */}
            {!query && !searchResults.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6"
              >
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400 mb-3">
                  Popular searches:
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={suggestion}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Chip
                        label={suggestion}
                        onClick={() => setQuery(suggestion)}
                        className="bg-secondary-100 dark:bg-secondary-800 text-secondary-700 dark:text-secondary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30 cursor-pointer"
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <SearchFilters 
        filters={filters} 
        onFiltersChange={setFilters} 
        isOpen={filtersOpen}
        onToggle={() => setFiltersOpen(!filtersOpen)}
      />

      {/* Results */}
      {searchResults.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-success-500 to-primary-500 shadow-medium">
                <FolderRounded className="text-white text-xl" />
              </div>
              <div>
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                  Search Results ({totalResults.toLocaleString()})
                </Typography>
                <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                  Page {currentPage} of {totalPages}
                </Typography>
              </div>
            </div>
            
            {filters.semanticSearch && (
              <Chip
                icon={<AutoAwesomeRounded />}
                label="AI Semantic Search Active"
                className="bg-accent-100 text-accent-800 dark:bg-accent-800/30 dark:text-accent-300"
              />
            )}
          </div>

          <AnimatePresence>
            {searchResults.map((result, index) => (
              <SearchResult
                key={result.case_id || index}
                result={result}
                onSelect={handleResultSelect}
                index={index}
              />
            ))}
          </AnimatePresence>

          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center mt-8"
            >
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => {
                  setCurrentPage(page);
                  refetch();
                }}
                color="primary"
                size="large"
                className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl rounded-2xl p-4 shadow-medium"
              />
            </motion.div>
          )}
        </motion.div>
      )}

      {/* No Results */}
      {query && searchResults.length === 0 && !isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
            <CardContent className="p-12 text-center">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-secondary-300 to-secondary-400 dark:from-secondary-600 dark:to-secondary-700 flex items-center justify-center"
              >
                <SearchRounded className="text-white text-4xl" />
              </motion.div>
              
              <Typography variant="h6" className="text-secondary-900 dark:text-white mb-2 font-bold">
                No results found
              </Typography>
              <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400 mb-6">
                Try adjusting your search terms or enabling AI semantic search for broader results
              </Typography>
              
              <div className="flex justify-center space-x-3">
                <Button variant="outlined" onClick={clearSearch} className="rounded-2xl">
                  Clear Search
                </Button>
                <Button 
                  variant="contained" 
                  onClick={() => setFilters({...filters, semanticSearch: true})}
                  className="rounded-2xl bg-gradient-to-r from-accent-500 to-primary-500"
                  startIcon={<AutoAwesomeRounded />}
                >
                  Try AI Search
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Search Tips */}
      {!query && !searchResults.length && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-primary-500/10 to-accent-500/10 dark:from-primary-400/10 dark:to-accent-400/10 border border-primary-200 dark:border-primary-800 shadow-large">
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium flex-shrink-0">
                  <TrendingUpRounded className="text-white text-xl" />
                </div>
                <div className="space-y-4">
                  <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                    Search Tips & Advanced Features
                  </Typography>
                  <Grid container spacing={4}>
                    <Grid xs={12} sm={6}>
                      <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 mb-2 font-medium">
                        <VisibilityRounded className="mr-2 text-sm" />
                        Basic Search:
                      </Typography>
                      <ul className="text-secondary-600 dark:text-secondary-400 text-sm space-y-1 ml-6">
                        <li>• Use keywords: "contract dispute"</li>
                        <li>• Exact phrases: "breach of contract"</li>
                        <li>• Case numbers: "2024-CV-001"</li>
                        <li>• Boolean operators: AND, OR, NOT</li>
                      </ul>
                    </Grid>
                    <Grid xs={12} sm={6}>
                      <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400 mb-2 font-medium">
                        <AutoAwesomeRounded className="mr-2 text-sm" />
                        AI Semantic Search:
                      </Typography>
                      <ul className="text-secondary-600 dark:text-secondary-400 text-sm space-y-1 ml-6">
                        <li>• Natural language queries</li>
                        <li>• Find conceptually similar content</li>
                        <li>• Context-aware understanding</li>
                        <li>• Intelligent result ranking</li>
                      </ul>
                    </Grid>
                  </Grid>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Error State */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="bg-error-50/50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 shadow-large">
            <CardContent className="p-8 text-center">
              <Typography variant="h6" className="text-error-900 dark:text-error-100 mb-2 font-bold">
                Search Error
              </Typography>
              <Typography variant="body2" className="text-error-700 dark:text-error-300 mb-6">
                {error.message || 'An error occurred while searching. Please try again.'}
              </Typography>
              <Button 
                variant="contained" 
                onClick={handleSearch} 
                className="rounded-2xl bg-error-600 hover:bg-error-700"
              >
                Try Again
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Search;
