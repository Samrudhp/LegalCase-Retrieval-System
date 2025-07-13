import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Alert,
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  Description,
  CheckCircle,
  Error,
  Refresh,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const FileUploadZone = ({ onDrop, isDragActive, disabled }) => (
  <Box
    className={`
      relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
      ${isDragActive
        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
        : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      bg-gray-50 dark:bg-gray-800/50
    `}
  >
    <CloudUpload
      className={`mx-auto mb-4 text-6xl ${
        isDragActive ? 'text-primary-500' : 'text-gray-400 dark:text-gray-500'
      }`}
    />
    <Typography variant="h6" className="mb-2 text-gray-700 dark:text-gray-300">
      {isDragActive ? 'Drop files here' : 'Drag and drop PDF files'}
    </Typography>
    <Typography variant="body2" className="text-gray-500 dark:text-gray-400 mb-4">
      or click to browse files
    </Typography>
    <Button
      variant="outlined"
      disabled={disabled}
      className="text-primary-600 border-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400"
    >
      Select Files
    </Button>
    <Typography variant="caption" className="block mt-4 text-gray-400 dark:text-gray-500">
      Supported formats: PDF (max 50MB per file)
    </Typography>
  </Box>
);

const FileItem = ({ file, onRemove, onProcess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState(file.status || 'pending');

  const processMutation = useMutation({
    mutationFn: (filename) => apiService.processDocument(filename),
    onSuccess: () => {
      setProcessingStatus('completed');
      toast.success(`${file.name} processed successfully`);
    },
    onError: (error) => {
      setProcessingStatus('error');
      toast.error(`Failed to process ${file.name}: ${error.message}`);
    },
    onSettled: () => {
      setIsProcessing(false);
    },
  });

  const handleProcess = () => {
    setIsProcessing(true);
    setProcessingStatus('processing');
    processMutation.mutate(file.name);
  };

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'completed':
        return <CheckCircle className="text-green-500" />;
      case 'error':
        return <Error className="text-red-500" />;
      case 'processing':
        return <div className="spinner" />;
      default:
        return <Description className="text-gray-400" />;
    }
  };

  const getStatusChip = () => {
    switch (processingStatus) {
      case 'completed':
        return <Chip label="Completed" size="small" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" />;
      case 'error':
        return <Chip label="Error" size="small" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400" />;
      case 'processing':
        return <Chip label="Processing" size="small" className="bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400" />;
      default:
        return <Chip label="Pending" size="small" className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <ListItem className="bg-white dark:bg-gray-800 rounded-lg mb-2 shadow-sm">
        <div className="flex items-center mr-3">
          {getStatusIcon()}
        </div>
        <ListItemText
          primary={
            <Box className="flex items-center space-x-2">
              <Typography variant="body2" className="font-medium text-gray-900 dark:text-gray-100">
                {file.name}
              </Typography>
              {getStatusChip()}
            </Box>
          }
          secondary={
            <Box className="flex items-center space-x-4 mt-1">
              <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              {file.uploadProgress !== undefined && (
                <Box className="flex-1 max-w-32">
                  <LinearProgress
                    variant="determinate"
                    value={file.uploadProgress}
                    className="h-1"
                  />
                  <Typography variant="caption" className="text-gray-500 dark:text-gray-400">
                    {file.uploadProgress}%
                  </Typography>
                </Box>
              )}
            </Box>
          }
        />
        <ListItemSecondaryAction>
          <Box className="flex items-center space-x-1">
            {processingStatus === 'uploaded' && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleProcess}
                disabled={isProcessing}
                className="text-primary-600 border-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:border-primary-400"
              >
                Process
              </Button>
            )}
            {processingStatus === 'error' && (
              <IconButton size="small" onClick={handleProcess} disabled={isProcessing}>
                <Refresh className="text-gray-500" />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => onRemove(file.id)}
              disabled={isProcessing}
              className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Delete />
            </IconButton>
          </Box>
        </ListItemSecondaryAction>
      </ListItem>
    </motion.div>
  );
};

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(new Set());
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: ({ file, onUploadProgress }) => apiService.uploadFile(file, onUploadProgress),
    onSuccess: (data, { file }) => {
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === file.id
            ? { ...f, status: 'uploaded', uploadProgress: 100 }
            : f
        )
      );
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      toast.success(`${file.name} uploaded successfully`);
      queryClient.invalidateQueries(['stats']);
    },
    onError: (error, { file }) => {
      setFiles(prevFiles =>
        prevFiles.map(f =>
          f.id === file.id
            ? { ...f, status: 'error', uploadProgress: 0 }
            : f
        )
      );
      setUploadingFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(file.id);
        return newSet;
      });
      toast.error(`Failed to upload ${file.name}: ${error.message}`);
    },
  });

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Handle rejected files
    rejectedFiles.forEach(({ file, errors }) => {
      errors.forEach(error => {
        if (error.code === 'file-too-large') {
          toast.error(`${file.name} is too large. Maximum size is 50MB.`);
        } else if (error.code === 'file-invalid-type') {
          toast.error(`${file.name} is not a PDF file.`);
        } else {
          toast.error(`Error with ${file.name}: ${error.message}`);
        }
      });
    });

    // Handle accepted files
    const newFiles = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'uploading',
      uploadProgress: 0,
      file,
    }));

    setFiles(prevFiles => [...prevFiles, ...newFiles]);

    // Start uploading each file
    newFiles.forEach(fileObj => {
      setUploadingFiles(prev => new Set(prev).add(fileObj.id));
      
      uploadMutation.mutate({
        file: fileObj.file,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setFiles(prevFiles =>
            prevFiles.map(f =>
              f.id === fileObj.id
                ? { ...f, uploadProgress: progress }
                : f
            )
          );
        },
      });
    });
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true,
  });

  const removeFile = (fileId) => {
    setFiles(prevFiles => prevFiles.filter(f => f.id !== fileId));
  };

  const clearAllFiles = () => {
    setFiles([]);
    setUploadingFiles(new Set());
  };

  const isUploading = uploadingFiles.size > 0;
  const completedFiles = files.filter(f => f.status === 'completed').length;
  const errorFiles = files.filter(f => f.status === 'error').length;

  return (
    <Box className="space-y-6">
      {/* Header */}
      <Box>
        <Typography variant="h4" className="font-bold text-gray-900 dark:text-gray-100 mb-2">
          Document Upload
        </Typography>
        <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
          Upload PDF documents for legal case analysis
        </Typography>
      </Box>

      {/* Upload Zone */}
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <FileUploadZone
              onDrop={onDrop}
              isDragActive={isDragActive}
              disabled={isUploading}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload Statistics */}
      {files.length > 0 && (
        <Box className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-4 text-center">
              <Typography variant="h5" className="font-bold text-blue-600 dark:text-blue-400">
                {files.length}
              </Typography>
              <Typography variant="body2" className="text-blue-600 dark:text-blue-400">
                Total Files
              </Typography>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-900/20">
            <CardContent className="p-4 text-center">
              <Typography variant="h5" className="font-bold text-orange-600 dark:text-orange-400">
                {uploadingFiles.size}
              </Typography>
              <Typography variant="body2" className="text-orange-600 dark:text-orange-400">
                Uploading
              </Typography>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-900/20">
            <CardContent className="p-4 text-center">
              <Typography variant="h5" className="font-bold text-green-600 dark:text-green-400">
                {completedFiles}
              </Typography>
              <Typography variant="body2" className="text-green-600 dark:text-green-400">
                Completed
              </Typography>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-900/20">
            <CardContent className="p-4 text-center">
              <Typography variant="h5" className="font-bold text-red-600 dark:text-red-400">
                {errorFiles}
              </Typography>
              <Typography variant="body2" className="text-red-600 dark:text-red-400">
                Errors
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Files List */}
      {files.length > 0 && (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <Box className="flex items-center justify-between mb-4">
              <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
                Upload Queue ({files.length})
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={clearAllFiles}
                disabled={isUploading}
                className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400"
              >
                Clear All
              </Button>
            </Box>

            <List className="space-y-2">
              <AnimatePresence>
                {files.map((file) => (
                  <FileItem
                    key={file.id}
                    file={file}
                    onRemove={removeFile}
                  />
                ))}
              </AnimatePresence>
            </List>
          </CardContent>
        </Card>
      )}

      {/* Help Section */}
      <Alert
        severity="info"
        className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
      >
        <Typography variant="body2">
          <strong>Upload Tips:</strong>
          <br />
          • Upload PDF files up to 50MB in size
          <br />
          • Multiple files can be uploaded simultaneously
          <br />
          • Files are automatically processed after upload
          <br />
          • Processing includes text extraction, metadata analysis, and indexing
        </Typography>
      </Alert>
    </Box>
  );
};

export default Upload;
