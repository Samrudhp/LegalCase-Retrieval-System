import axios from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Response Error:', error);
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API Services
export const apiService = {
  // Health check
  health: () => api.get('/health'),

  // Document Ingestion
  uploadFile: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    
    return api.post('/api/ingestion/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  },

  processDocument: (filename) => {
    return api.post('/api/ingestion/process', { filename });
  },

  // Search and Retrieval
  textSearch: (query, filters = {}) => {
    return api.get('/api/retrieval/search', {
      params: {
        query,
        ...filters,
      },
    });
  },

  semanticSearch: (query, topK = 10, threshold = 0.7) => {
    return api.post('/api/retrieval/semantic-search', {
      query,
      top_k: topK,
      threshold,
    });
  },

  // Summarization
  summarizeCase: (caseId, summaryType = 'extractive', maxLength = 500) => {
    return api.post('/api/summarization/case', {
      case_id: caseId,
      summary_type: summaryType,
      max_length: maxLength,
    });
  },

  batchSummarize: (caseIds, summaryType = 'extractive') => {
    return api.post('/api/summarization/batch', {
      case_ids: caseIds,
      summary_type: summaryType,
    });
  },

  // Question Generation
  generateCommonQuestions: (caseId, numQuestions = 5) => {
    return api.post('/api/question-generation/qa-common', {
      case_id: caseId,
      num_questions: numQuestions,
    });
  },

  generateRareQuestions: (caseId, numQuestions = 3) => {
    return api.post('/api/question-generation/qa-rare', {
      case_id: caseId,
      num_questions: numQuestions,
    });
  },

  generateUnexpectedQuestions: (caseId, numQuestions = 2) => {
    return api.post('/api/question-generation/qa-unexpected', {
      case_id: caseId,
      num_questions: numQuestions,
    });
  },

  // Chat
  sendMessage: (sessionId, message, caseId = null) => {
    return api.post('/api/chat/message', {
      session_id: sessionId,
      message,
      case_id: caseId,
    });
  },

  getChatHistory: (sessionId) => {
    return api.get(`/api/chat/history/${sessionId}`);
  },

  // Cases Management (additional endpoints that might be useful)
  getCases: (page = 1, limit = 20, search = '') => {
    return api.get('/api/cases', {
      params: {
        page,
        limit,
        search,
      },
    });
  },

  getCase: (caseId) => {
    return api.get(`/api/cases/${caseId}`);
  },

  deleteCase: (caseId) => {
    return api.delete(`/api/cases/${caseId}`);
  },

  // Statistics and Analytics
  getStats: () => {
    return api.get('/api/stats');
  },
};

export default api;
