# Copilot Instructions for Legal Case Analysis System Frontend

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is a modern React frontend for a Legal Case Analysis System that integrates with a FastAPI backend. The application provides a professional interface for legal document analysis, search, summarization, and AI-powered chat.

## Technology Stack
- **Framework**: React 18+ with Vite
- **Styling**: Tailwind CSS + Material-UI components
- **Routing**: React Router DOM
- **State Management**: React Query (@tanstack/react-query) for server state
- **API Communication**: Axios for HTTP requests
- **File Handling**: React Dropzone for uploads, React PDF for viewing
- **Animations**: Framer Motion
- **Icons**: Heroicons and Material-UI icons

## Backend Integration
The frontend integrates with a FastAPI backend running on `http://localhost:8000` with the following endpoints:
- `/api/ingestion/upload` - File upload
- `/api/ingestion/process` - Document processing
- `/api/retrieval/search` - Text search
- `/api/retrieval/semantic-search` - Semantic search
- `/api/summarization/case` - Document summarization
- `/api/question-generation/qa-*` - Question generation
- `/api/chat/message` - Chat bot interactions

## Code Style Guidelines
- Use functional components with hooks
- Implement responsive design with Tailwind CSS
- Use Material-UI components for complex UI elements
- Follow modern React patterns (custom hooks, context where appropriate)
- Implement proper error handling and loading states
- Use React Query for all API operations
- Implement proper TypeScript-like prop validation with PropTypes

## UI/UX Requirements
- Professional legal industry appearance
- Dark/light theme support
- Responsive design for desktop and mobile
- Accessibility compliance (ARIA labels, keyboard navigation)
- Loading states and error boundaries
- Toast notifications for user feedback
- Progressive disclosure for complex features

## File Structure
- `/src/components/` - Reusable UI components
- `/src/pages/` - Main application pages
- `/src/services/` - API service functions
- `/src/hooks/` - Custom React hooks
- `/src/utils/` - Utility functions
- `/src/contexts/` - React contexts for global state
- `/src/constants/` - Application constants

## Key Features to Implement
1. **Dashboard** - Overview of cases and system statistics
2. **Document Upload** - Drag-and-drop file upload with progress
3. **Search Interface** - Advanced search with filters
4. **Document Viewer** - PDF viewer with highlighting
5. **Chat Interface** - AI-powered legal assistant
6. **Summarization** - Document and batch summarization
7. **Question Generation** - Generate questions from documents
8. **Settings** - Theme, preferences, and configuration

When generating code, prioritize:
- Performance optimization
- User experience
- Code maintainability
- Security best practices
- Accessibility compliance
