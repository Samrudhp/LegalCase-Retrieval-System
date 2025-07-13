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
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList,
  Clear,
  Description,
  DateRange,
  ExpandMore,
  Bookmark,
  Share,
  Download,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

const SearchFilters = ({ filters, onFiltersChange }) => {
  const handleFilterChange = (key, value) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <Card className="bg-white dark:bg-gray-800 mb-6">
      <CardContent className="p-6">
        <Box className="flex items-center justify-between mb-4">
          <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100 flex items-center">
            <FilterList className="mr-2" />
            Filters
          </Typography>
          <Button
            size="small"
            onClick={() => onFiltersChange({})}
            className="text-gray-500 dark:text-gray-400"
          >
            Clear All
          </Button>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select
                value={filters.documentType || ''}
                label="Document Type"
                onChange={(e) => handleFilterChange('documentType', e.target.value)}
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="contract">Contract</MenuItem>
                <MenuItem value="lawsuit">Lawsuit</MenuItem>
                <MenuItem value="agreement">Agreement</MenuItem>
                <MenuItem value="patent">Patent</MenuItem>
                <MenuItem value="trademark">Trademark</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Date Range</InputLabel>
              <Select
                value={filters.dateRange || ''}
                label="Date Range"
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              >
                <MenuItem value="">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">This Week</MenuItem>
                <MenuItem value="month">This Month</MenuItem>
                <MenuItem value="year">This Year</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>File Size</InputLabel>
              <Select
                value={filters.fileSize || ''}
                label="File Size"
                onChange={(e) => handleFilterChange('fileSize', e.target.value)}
              >
                <MenuItem value="">Any Size</MenuItem>
                <MenuItem value="small">Small (&lt; 1MB)</MenuItem>
                <MenuItem value="medium">Medium (1-10MB)</MenuItem>
                <MenuItem value="large">Large (&gt; 10MB)</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={filters.semanticSearch || false}
                  onChange={(e) => handleFilterChange('semanticSearch', e.target.checked)}
                />
              }
              label="Semantic Search"
              className="text-gray-700 dark:text-gray-300"
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

const SearchResult = ({ result, onSelect }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 hover:shadow-md transition-shadow duration-300 bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <Box className="flex items-start justify-between mb-3">
            <Box className="flex-1">
              <Typography
                variant="h6"
                className="font-semibold text-primary-600 dark:text-primary-400 mb-2 cursor-pointer hover:underline"
                onClick={() => onSelect(result)}
              >
                {result.title || result.filename}
              </Typography>
              
              <Box className="flex items-center space-x-4 mb-2">
                <Chip
                  size="small"
                  label={result.type || 'Document'}
                  className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
                />
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400 flex items-center">
                  <DateRange className="mr-1 text-sm" />
                  {result.created_at ? format(new Date(result.created_at), 'MMM dd, yyyy') : 'Unknown date'}
                </Typography>
                <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                  {result.size ? `${(result.size / 1024 / 1024).toFixed(2)} MB` : ''}
                </Typography>
              </Box>

              <Typography
                variant="body2"
                className="text-gray-700 dark:text-gray-300 line-clamp-3"
              >
                {result.summary || result.content?.substring(0, 200) + '...'}
              </Typography>
            </Box>

            <Box className="flex items-center space-x-1 ml-4">
              <IconButton size="small" className="text-gray-500 dark:text-gray-400">
                <Bookmark />
              </IconButton>
              <IconButton size="small" className="text-gray-500 dark:text-gray-400">
                <Share />
              </IconButton>
              <IconButton size="small" className="text-gray-500 dark:text-gray-400">
                <Download />
              </IconButton>
            </Box>
          </Box>

          {result.highlights && result.highlights.length > 0 && (
            <Box className="mb-3">
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400 block mb-2">
                Relevant excerpts:
              </Typography>
              {result.highlights.slice(0, 2).map((highlight, index) => (
                <Box
                  key={index}
                  className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-2 mb-2 rounded-r"
                >
                  <Typography
                    variant="caption"
                    className="text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: highlight }}
                  />
                </Box>
              ))}
            </Box>
          )}

          <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                Document Details
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                    Case ID:
                  </Typography>
                  <Typography variant="body2" className="text-gray-900 dark:text-gray-100">
                    {result.case_id || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                    Pages:
                  </Typography>
                  <Typography variant="body2" className="text-gray-900 dark:text-gray-100">
                    {result.page_count || 'Unknown'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                    Language:
                  </Typography>
                  <Typography variant="body2" className="text-gray-900 dark:text-gray-100">
                    {result.language || 'English'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                    Confidence:
                  </Typography>
                  <Typography variant="body2" className="text-gray-900 dark:text-gray-100">
                    {result.score ? `${(result.score * 100).toFixed(1)}%` : 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
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
    enabled: false, // Don't auto-fetch
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
    // Navigate to document viewer or open in modal
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

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
          Search Documents
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
          Search through your legal document collection
        </Typography>
      </Box>

      {/* Search Bar */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <Box className="flex items-center space-x-2">
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search legal documents, cases, contracts..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              InputProps={{
                startAdornment: <SearchIcon className="text-gray-400 mr-2" />,
                endAdornment: query && (
                  <IconButton onClick={clearSearch} size="small">
                    <Clear />
                  </IconButton>
                ),
              }}
              className="bg-gray-50 dark:bg-gray-700"
            />
            <Button
              variant="contained"
              onClick={handleSearch}
              disabled={!query.trim() || isLoading}
              className="bg-primary-600 hover:bg-primary-700 px-8"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Filters */}
      <SearchFilters filters={filters} onFiltersChange={setFilters} />

      {/* Results */}
      {searchResults.length > 0 && (
        <Box>
          <Box className="flex items-center justify-between mb-4">
            <Typography variant="h6" className="text-gray-900 dark:text-gray-100">
              Search Results ({totalResults.toLocaleString()})
            </Typography>
            <Box className="flex items-center space-x-2">
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </Typography>
            </Box>
          </Box>

          <AnimatePresence>
            {searchResults.map((result, index) => (
              <SearchResult
                key={result.case_id || index}
                result={result}
                onSelect={handleResultSelect}
              />
            ))}
          </AnimatePresence>

          {totalPages > 1 && (
            <Box className="flex justify-center mt-6">
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(e, page) => {
                  setCurrentPage(page);
                  refetch();
                }}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </Box>
      )}

      {/* No Results */}
      {query && searchResults.length === 0 && !isLoading && (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-12 text-center">
            <SearchIcon className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
            <Typography variant="h6" className="text-gray-500 dark:text-gray-400 mb-2">
              No results found
            </Typography>
            <Typography variant="body2" className="text-gray-400 dark:text-gray-500 mb-4">
              Try adjusting your search terms or filters
            </Typography>
            <Button variant="outlined" onClick={clearSearch}>
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search Tips */}
      {!query && (
        <Card className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <Typography variant="h6" className="text-blue-900 dark:text-blue-100 mb-3">
              Search Tips
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" className="text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Basic Search:</strong>
                </Typography>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 ml-4">
                  <li>• Use keywords: "contract dispute"</li>
                  <li>• Exact phrases: "breach of contract"</li>
                  <li>• Case numbers: "2024-CV-001"</li>
                </ul>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" className="text-blue-800 dark:text-blue-200 mb-2">
                  <strong>Semantic Search:</strong>
                </Typography>
                <ul className="text-blue-700 dark:text-blue-300 text-sm space-y-1 ml-4">
                  <li>• Natural language queries</li>
                  <li>• Find similar concepts</li>
                  <li>• Context-aware results</li>
                </ul>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <CardContent className="p-6 text-center">
            <Typography variant="h6" className="text-red-900 dark:text-red-100 mb-2">
              Search Error
            </Typography>
            <Typography variant="body2" className="text-red-700 dark:text-red-300 mb-4">
              {error.message || 'An error occurred while searching'}
            </Typography>
            <Button variant="outlined" onClick={handleSearch} className="text-red-600 border-red-600">
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default Search;
