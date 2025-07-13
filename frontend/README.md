# Legal Case Analysis System - Frontend

A modern, professional React frontend for the Legal Case Analysis System, providing an intuitive interface for legal document management, AI-powered analysis, and comprehensive search capabilities.

## 🚀 Features

### Core Functionality
- **Document Upload & Processing** - Drag-and-drop PDF upload with real-time processing status
- **Advanced Search** - Text and semantic search with intelligent filtering
- **AI Chat Assistant** - Legal expert AI with context-aware responses
- **Document Summarization** - Extractive, abstractive, and hybrid summaries
- **Q&A Generation** - Common, rare, and unexpected questions from documents
- **Professional Dashboard** - Real-time statistics and activity monitoring

### UI/UX Features
- **Modern Design** - Clean, professional interface optimized for legal workflows
- **Dark/Light Theme** - Automatic theme switching with user preference persistence
- **Responsive Layout** - Fully responsive design for desktop, tablet, and mobile
- **Real-time Updates** - Live status updates and notifications
- **Accessibility** - WCAG compliant with keyboard navigation and screen reader support
- **Smooth Animations** - Framer Motion powered transitions and micro-interactions

## 🛠️ Technology Stack

### Core Framework
- **React 19** - Latest React with modern hooks and concurrent features
- **Vite** - Ultra-fast build tool and development server
- **React Router DOM** - Client-side routing and navigation

### UI & Styling
- **Material-UI (MUI)** - Professional React components library
- **Tailwind CSS** - Utility-first CSS framework for custom styling
- **Framer Motion** - Production-ready motion library for animations
- **React Hot Toast** - Beautiful toast notifications

### State Management & API
- **TanStack React Query** - Powerful data synchronization and caching
- **Axios** - Promise-based HTTP client for API communication
- **React Context** - Global state management for theme and app state

### File Handling & Utilities
- **React Dropzone** - File upload with drag-and-drop support
- **React PDF** - PDF viewing and interaction
- **React Markdown** - Markdown rendering with syntax highlighting
- **Date-fns** - Modern date utility library

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.jsx      # Main application layout
│   └── Navigation.jsx  # Sidebar navigation component
├── pages/              # Main application pages
│   ├── Dashboard.jsx   # Overview and statistics
│   ├── Upload.jsx      # Document upload interface
│   ├── Search.jsx      # Search and filtering
│   ├── Chat.jsx        # AI assistant chat
│   ├── Summarization.jsx # Document summarization
│   └── QuestionGeneration.jsx # Q&A generation
├── services/           # API integration
│   └── api.js         # Axios configuration and API methods
├── contexts/           # React contexts for global state
│   └── ThemeContext.jsx # Dark/light theme management
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── constants/          # Application constants
└── App.jsx            # Main application component
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd legal-case/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your backend API URL:
   ```env
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Backend Integration

Ensure the FastAPI backend is running on `http://localhost:8000`. The frontend is configured to connect to the following endpoints:

- `/health` - Health check
- `/api/ingestion/*` - Document upload and processing
- `/api/retrieval/*` - Search and document retrieval
- `/api/summarization/*` - Document summarization
- `/api/question-generation/*` - Q&A generation
- `/api/chat/*` - AI chat assistant

## 📱 Application Features

### Dashboard
- Real-time system statistics
- Recent activity feed
- System health monitoring
- Quick action buttons

### Document Upload
- Drag-and-drop interface
- Multiple file support
- Real-time upload progress
- Automatic processing status

### Search Interface
- Text and semantic search modes
- Advanced filtering options
- Result highlighting
- Pagination and sorting

### AI Chat Assistant
- Context-aware conversations
- Multiple chat sessions
- Message history
- Copy and export functionality

### Summarization
- Multiple summary types (extractive, abstractive, hybrid)
- Batch processing support
- Customizable length settings
- Export capabilities

### Q&A Generation
- Common, rare, and unexpected question types
- Difficulty levels
- Context-aware answers
- Export functionality

## 🎨 Design System

### Color Palette
- **Primary**: Blue (#0ea5e9) - Professional and trustworthy
- **Secondary**: Gray (#64748b) - Clean and neutral
- **Success**: Green (#10b981) - Positive actions
- **Warning**: Orange (#f59e0b) - Caution and alerts
- **Error**: Red (#ef4444) - Errors and destructive actions

### Typography
- **Font**: Inter - Modern, readable, and professional
- **Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)

### Component Standards
- **Border Radius**: 8px for cards, 6px for buttons
- **Shadows**: Subtle depth with dark mode variants
- **Spacing**: 8px grid system using Tailwind utilities

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Dependency Management
npm install <package> # Add new dependency
npm audit            # Check for vulnerabilities
npm audit fix        # Fix vulnerabilities
```

### Development Guidelines

1. **Component Structure**
   - Use functional components with hooks
   - Implement proper PropTypes for type checking
   - Follow React best practices and patterns

2. **Styling**
   - Use Tailwind CSS for utility styling
   - Material-UI components for complex UI elements
   - Consistent spacing and color usage

3. **State Management**
   - React Query for server state
   - React Context for global UI state
   - Local useState for component state

4. **API Integration**
   - Centralized API service functions
   - Proper error handling and loading states
   - Request/response interceptors for logging

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 📈 Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Bundle Analysis**: Vite bundle analyzer integration
- **Caching**: React Query for intelligent data caching
- **Compression**: Automatic asset compression in production
- **Tree Shaking**: Automatic dead code elimination

## 🔒 Security Features

- **Environment Variables**: Secure configuration management
- **XSS Protection**: Built-in React XSS protection
- **CSRF Prevention**: Axios CSRF token handling
- **Content Security Policy**: CSP headers for additional security

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Environment Variables
Set production environment variables:
```env
VITE_API_BASE_URL=https://your-api-domain.com
VITE_ENABLE_DEVTOOLS=false
VITE_ENABLE_ANALYTICS=true
```

### Docker Deployment
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is part of the Legal Case Analysis System and follows the same licensing terms as the main project.

## 🆘 Support

For support and questions:
- Check the [API Documentation](../app/README.md)
- Review the [Backend Setup Guide](../README.md)
- Open an issue for bug reports or feature requests+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
