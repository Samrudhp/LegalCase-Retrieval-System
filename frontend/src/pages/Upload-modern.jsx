import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Paper,
} from '@mui/material';
import {
  CloudUploadRounded,
  DescriptionRounded,
  CheckCircleRounded,
  ErrorRounded,
  DeleteRounded,
  UploadFileRounded,
  FolderRounded,
  InsertDriveFileRounded,
  SpeedRounded,
  AutoAwesomeRounded,
  TrendingUpRounded,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const FileStatusChip = ({ status }) => {
  const statusConfig = {
    waiting: { label: 'Waiting', color: 'bg-secondary-100 text-secondary-800 dark:bg-secondary-800 dark:text-secondary-200', icon: <SpeedRounded className="text-sm" /> },
    uploading: { label: 'Uploading', color: 'bg-primary-100 text-primary-800 dark:bg-primary-800 dark:text-primary-200', icon: <UploadFileRounded className="text-sm" /> },
    processing: { label: 'Processing', color: 'bg-accent-100 text-accent-800 dark:bg-accent-800 dark:text-accent-200', icon: <AutoAwesomeRounded className="text-sm" /> },
    completed: { label: 'Complete', color: 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-200', icon: <CheckCircleRounded className="text-sm" /> },
    error: { label: 'Error', color: 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-200', icon: <ErrorRounded className="text-sm" /> },
  };

  const config = statusConfig[status] || statusConfig.waiting;

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      <Chip
        icon={config.icon}
        label={config.label}
        size="small"
        className={`font-medium ${config.color}`}
      />
    </motion.div>
  );
};

const FilePreview = ({ file, onRemove, uploadProgress, uploadStatus }) => {
  const getFileIcon = (file) => {
    const type = file.type || '';
    if (type.includes('pdf')) return <DescriptionRounded className="text-red-500" />;
    if (type.includes('word') || type.includes('doc')) return <DescriptionRounded className="text-blue-500" />;
    if (type.includes('text')) return <InsertDriveFileRounded className="text-green-500" />;
    return <InsertDriveFileRounded className="text-secondary-500" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3, type: "spring" }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <Card className="mb-3 bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-medium hover:shadow-large transition-all duration-300">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-medium"
            >
              {getFileIcon(file)}
            </motion.div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <Typography 
                  variant="body1" 
                  className="font-semibold text-secondary-900 dark:text-white truncate mr-4"
                  title={file.name}
                >
                  {file.name}
                </Typography>
                <FileStatusChip status={uploadStatus} />
              </div>
              
              <div className="flex items-center justify-between text-sm text-secondary-600 dark:text-secondary-400">
                <span>{formatFileSize(file.size)}</span>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <span className="font-medium">{uploadProgress.toFixed(1)}%</span>
                )}
              </div>
              
              {uploadProgress > 0 && uploadProgress < 100 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  className="mt-2"
                >
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    className="h-1.5 rounded-full bg-secondary-200 dark:bg-secondary-700"
                    sx={{
                      '& .MuiLinearProgress-bar': {
                        background: 'linear-gradient(to right, #0ea5e9, #d946ef)',
                        borderRadius: '4px',
                      }
                    }}
                  />
                </motion.div>
              )}
            </div>
            
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
              <IconButton
                onClick={() => onRemove(file)}
                size="small"
                className="text-secondary-400 hover:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20"
                disabled={uploadStatus === 'uploading' || uploadStatus === 'processing'}
              >
                <DeleteRounded />
              </IconButton>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
  
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: apiService.uploadFile,
    onSuccess: (data, variables) => {
      const fileId = variables.get('file').name;
      setUploadStatus(prev => ({ ...prev, [fileId]: 'completed' }));
      setNotification({
        open: true,
        message: 'File uploaded successfully!',
        severity: 'success'
      });
      queryClient.invalidateQueries(['documents']);
    },
    onError: (error, variables) => {
      const fileId = variables.get('file').name;
      setUploadStatus(prev => ({ ...prev, [fileId]: 'error' }));
      setNotification({
        open: true,
        message: 'Upload failed. Please try again.',
        severity: 'error'
      });
    },
  });

  const processMutation = useMutation({
    mutationFn: apiService.processDocument,
    onSuccess: (data, variables) => {
      setUploadStatus(prev => ({ ...prev, [variables.filename]: 'completed' }));
      setNotification({
        open: true,
        message: 'Document processed successfully!',
        severity: 'success'
      });
    },
    onError: (error, variables) => {
      setUploadStatus(prev => ({ ...prev, [variables.filename]: 'error' }));
      setNotification({
        open: true,
        message: 'Processing failed. Please try again.',
        severity: 'error'
      });
    },
  });

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = acceptedFiles.filter(file => {
      const isDuplicate = files.some(existingFile => 
        existingFile.name === file.name && existingFile.size === file.size
      );
      if (isDuplicate) {
        setNotification({
          open: true,
          message: `File "${file.name}" is already added.`,
          severity: 'warning'
        });
      }
      return !isDuplicate;
    });

    setFiles(prev => [...prev, ...newFiles]);
    
    // Initialize status for new files
    newFiles.forEach(file => {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'waiting' }));
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
    });
  }, [files]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const removeFile = (fileToRemove) => {
    setFiles(prev => prev.filter(file => file !== fileToRemove));
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileToRemove.name];
      return newProgress;
    });
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileToRemove.name];
      return newStatus;
    });
  };

  const uploadFiles = async () => {
    const pendingFiles = files.filter(file => 
      uploadStatus[file.name] === 'waiting' || uploadStatus[file.name] === 'error'
    );

    for (const file of pendingFiles) {
      setUploadStatus(prev => ({ ...prev, [file.name]: 'uploading' }));
      
      const formData = new FormData();
      formData.append('file', file);

      try {
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => {
            const currentProgress = prev[file.name] || 0;
            const newProgress = Math.min(currentProgress + Math.random() * 20, 90);
            return { ...prev, [file.name]: newProgress };
          });
        }, 200);

        await uploadMutation.mutateAsync(formData);
        
        clearInterval(progressInterval);
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        // Start processing
        setUploadStatus(prev => ({ ...prev, [file.name]: 'processing' }));
        await processMutation.mutateAsync({ filename: file.name });
        
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  const clearCompleted = () => {
    const completedFileNames = Object.keys(uploadStatus).filter(
      fileName => uploadStatus[fileName] === 'completed'
    );
    
    setFiles(prev => prev.filter(file => !completedFileNames.includes(file.name)));
    
    completedFileNames.forEach(fileName => {
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
      setUploadStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[fileName];
        return newStatus;
      });
    });
  };

  const getDropzoneClass = () => {
    if (isDragReject) return 'border-error-400 bg-error-50/50 dark:bg-error-900/20';
    if (isDragActive) return 'border-primary-400 bg-primary-50/50 dark:bg-primary-900/20';
    return 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400 hover:bg-primary-50/30 dark:hover:bg-primary-900/10';
  };

  const pendingCount = Object.values(uploadStatus).filter(status => 
    status === 'waiting' || status === 'error'
  ).length;

  const completedCount = Object.values(uploadStatus).filter(status => 
    status === 'completed'
  ).length;

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
            Document Upload Center
          </motion.h1>
          <Typography variant="h6" className="text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto">
            Upload legal documents for AI-powered analysis, search, and insights
          </Typography>
        </div>
      </motion.div>

      {/* Upload Area */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
          <CardContent className="p-8">
            <motion.div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-3xl p-12 text-center cursor-pointer
                transition-all duration-300 ${getDropzoneClass()}
              `}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <input {...getInputProps()} />
              
              <motion.div
                animate={{ 
                  y: isDragActive ? -10 : 0,
                  scale: isDragActive ? 1.1 : 1 
                }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-primary-500 to-accent-500 shadow-glow flex items-center justify-center">
                  <CloudUploadRounded className="text-white text-4xl" />
                </div>
                
                {isDragActive ? (
                  <Typography variant="h6" className="text-primary-600 dark:text-primary-400 font-semibold">
                    Drop files here to upload
                  </Typography>
                ) : (
                  <div className="space-y-2">
                    <Typography variant="h6" className="text-secondary-900 dark:text-white font-semibold">
                      Drag & drop your legal documents
                    </Typography>
                    <Typography variant="body1" className="text-secondary-600 dark:text-secondary-400">
                      or <span className="text-primary-600 dark:text-primary-400 font-medium">browse files</span>
                    </Typography>
                  </div>
                )}
                
                <div className="flex flex-wrap justify-center gap-2 text-sm text-secondary-500 dark:text-secondary-400">
                  <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full">PDF</span>
                  <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full">DOC</span>
                  <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full">DOCX</span>
                  <span className="px-3 py-1 bg-secondary-100 dark:bg-secondary-800 rounded-full">TXT</span>
                </div>
                
                <Typography variant="caption" className="text-secondary-500 dark:text-secondary-400">
                  Maximum file size: 10MB
                </Typography>
              </motion.div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>

      {/* File List */}
      {files.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <Card className="bg-white/60 dark:bg-secondary-900/60 backdrop-blur-xl border-0 shadow-large">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-medium">
                    <FolderRounded className="text-white text-xl" />
                  </div>
                  <div>
                    <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                      Upload Queue
                    </Typography>
                    <Typography variant="body2" className="text-secondary-500 dark:text-secondary-400">
                      {files.length} file{files.length !== 1 ? 's' : ''} selected
                    </Typography>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {completedCount > 0 && (
                    <Button
                      variant="outlined"
                      onClick={clearCompleted}
                      className="rounded-2xl border-secondary-300 text-secondary-600 hover:bg-secondary-50 dark:border-secondary-600"
                    >
                      Clear Completed ({completedCount})
                    </Button>
                  )}
                  
                  {pendingCount > 0 && (
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="contained"
                        onClick={uploadFiles}
                        disabled={uploadMutation.isLoading || processMutation.isLoading}
                        startIcon={<TrendingUpRounded />}
                        className="rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 hover:from-primary-600 hover:to-accent-600 shadow-medium"
                      >
                        Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
                      </Button>
                    </motion.div>
                  )}
                </div>
              </div>
              
              <div className="space-y-3">
                <AnimatePresence>
                  {files.map((file, index) => (
                    <FilePreview
                      key={`${file.name}-${index}`}
                      file={file}
                      onRemove={removeFile}
                      uploadProgress={uploadProgress[file.name] || 0}
                      uploadStatus={uploadStatus[file.name] || 'waiting'}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Help & Tips */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-accent-500/10 to-primary-500/10 dark:from-accent-400/10 dark:to-primary-400/10 border border-accent-200 dark:border-accent-800 shadow-large">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-accent-500 to-primary-500 shadow-medium flex-shrink-0">
                <AutoAwesomeRounded className="text-white text-xl" />
              </div>
              <div className="space-y-3">
                <Typography variant="h6" className="font-bold text-secondary-900 dark:text-white">
                  Upload Tips for Best Results
                </Typography>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400">
                      • <span className="font-medium">High-quality PDFs</span> work best for text extraction
                    </Typography>
                    <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400">
                      • <span className="font-medium">Structured documents</span> provide better analysis
                    </Typography>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400">
                      • <span className="font-medium">Clear text</span> improves AI understanding
                    </Typography>
                    <Typography variant="body2" className="text-secondary-600 dark:text-secondary-400">
                      • <span className="font-medium">Legal formatting</span> enhances categorization
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          className="rounded-2xl shadow-large"
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
};

export default Upload;
