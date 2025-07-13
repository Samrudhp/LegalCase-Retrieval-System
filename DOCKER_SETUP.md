# Docker Setup Guide - Legal Case Retrieval System

## 📋 Overview

This guide explains how Docker is configured and used in the Legal Case Retrieval System. The project uses Docker to containerize both the backend API and frontend application, along with MongoDB database orchestration.

## 🏗️ Architecture

The Docker setup consists of three main services:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │    MongoDB      │
│   (React/Vite)  │────│   (FastAPI)     │────│   (Database)    │
│   Port: 3000    │    │   Port: 8000    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 Docker Files Structure

```
Legal-Case-Retrieval-System/
├── docker-compose.yml          # Orchestrates all services
├── .env.example               # Environment variables template
├── backend/
│   └── Dockerfile            # Backend container configuration
└── frontend/
    └── Dockerfile            # Frontend container configuration
```

## 🐳 Service Details

### Backend Service (FastAPI)

**Base Image:** `python:3.10-slim`

**System Dependencies:**
- `tesseract-ocr` - OCR for PDF text extraction
- `poppler-utils` - PDF processing utilities
- `build-essential` - Compilation tools

**Python Dependencies:**
- FastAPI, Uvicorn - Web framework and server
- LangChain - AI/LLM integration
- FAISS - Vector similarity search
- PyPDF2, pdfplumber - PDF processing
- MongoDB drivers - Database connectivity
- Sentence Transformers - Text embeddings

**Features:**
- Multi-worker production server (4 workers)
- Health check monitoring
- Automatic directory creation for data storage
- Pre-installed spaCy language model

### Frontend Service (React/Vite)

**Base Image:** `node:18-alpine` (build) → `nginx:alpine` (production)

**Build Process:**
- Multi-stage build for optimized production image
- NPM dependency installation
- Vite build process
- Nginx static file serving

### Database Service (MongoDB)

**Base Image:** `mongo:7.0`

**Features:**
- Persistent data storage
- Authentication configured
- Initialization scripts support

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Docker Compose available
- Git repository cloned

### 1. Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your actual values
# Required: GROQ_API_KEY
# Optional: Modify database passwords and other settings
```

### 2. Start All Services

```bash
# Start all services in detached mode
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### 3. Verify Services

```bash
# Check service status
docker-compose ps

# Test backend health
curl http://localhost:8000/health

# Access frontend
# Open http://localhost:3000 in your browser
```

## 🔧 Development Workflow

### Building Individual Services

```bash
# Build backend only
docker-compose build backend

# Build frontend only
docker-compose build frontend

# Rebuild all services
docker-compose build
```

### Service Management

```bash
# Start specific service
docker-compose up backend

# Stop all services
docker-compose down

# Stop and remove volumes (caution: deletes data)
docker-compose down -v

# Restart a service
docker-compose restart backend
```

### Logs and Debugging

```bash
# View logs for all services
docker-compose logs

# View logs for specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb

# Follow logs in real-time
docker-compose logs -f backend
```

## 📊 Data Persistence

### Volume Mounts

- **Backend Data:** `./backend/data` → `/app/data` (FAISS indexes, uploaded cases)
- **Backend Logs:** `./backend/logs` → `/app/logs` (Application logs)
- **MongoDB Data:** Docker volume `mongodb_data` (Database persistence)

### Backup and Restore

```bash
# Backup MongoDB data
docker-compose exec mongodb mongodump --out /data/backup

# Restore MongoDB data
docker-compose exec mongodb mongorestore /data/backup
```

## 🌐 Network Configuration

### Internal Communication
- Services communicate via Docker network `legal-case-network`
- Backend connects to MongoDB using internal hostname `mongodb`
- Frontend connects to backend using configured API URL

### Port Mapping
- Frontend: `3000:80` (Host:Container)
- Backend: `8000:8000`
- MongoDB: `27017:27017`

## ⚙️ Environment Variables

### Required Variables

```bash
GROQ_API_KEY=your_groq_api_key_here  # Essential for AI features
```

### Optional Variables

```bash
# Database Configuration
MONGO_INITDB_ROOT_USERNAME=admin
MONGO_INITDB_ROOT_PASSWORD=your_secure_password
MONGO_INITDB_DATABASE=legal_case_analysis

# Backend Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_WORKERS=4

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_DEVTOOLS=true
```

## 🔍 Health Monitoring

### Health Checks

The backend service includes automatic health monitoring:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
```

### Monitoring Commands

```bash
# Check container health status
docker-compose ps

# View health check logs
docker inspect legal-case-backend --format='{{.State.Health}}'
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   netstat -tulpn | grep :8000
   
   # Stop conflicting services or change ports in docker-compose.yml
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Verify MongoDB is running
   docker-compose exec mongodb mongo --eval "db.runCommand('ping')"
   ```

3. **API Key Not Set**
   ```bash
   # Verify environment variables
   docker-compose exec backend env | grep GROQ
   ```

4. **Build Failures**
   ```bash
   # Clean build cache
   docker-compose build --no-cache
   
   # Remove old images
   docker system prune -a
   ```

### Performance Issues

```bash
# Monitor resource usage
docker stats

# Check container logs for errors
docker-compose logs --tail=50 backend
```

## 🚀 Production Deployment

### Security Considerations

1. **Change Default Passwords**
   ```bash
   # Generate secure passwords for MongoDB
   MONGO_INITDB_ROOT_PASSWORD=$(openssl rand -base64 32)
   ```

2. **API Key Management**
   ```bash
   # Use secure secret management
   # Never commit .env file to version control
   ```

3. **Network Security**
   ```bash
   # Remove port mappings for internal services
   # Use reverse proxy for production
   ```

### Scaling

```bash
# Scale backend workers
docker-compose up --scale backend=3

# Use external load balancer for production
```

## 📝 File Processing Workflow

### PDF Ingestion Process

1. **Upload** → Frontend sends PDF to backend
2. **Processing** → Backend extracts text using Tesseract OCR
3. **Embedding** → Text converted to vectors using BERT model
4. **Storage** → Vectors stored in FAISS index, metadata in MongoDB
5. **Retrieval** → Vector similarity search for case matching

### Data Flow

```
PDF Upload → OCR Processing → Text Extraction → 
Vector Embedding → FAISS Storage → MongoDB Metadata → 
Search & Retrieval → AI Analysis → Response
```

## 🔗 API Endpoints

### Backend Services Available

- **Health Check:** `GET /health`
- **PDF Ingestion:** `POST /api/ingestion/upload`
- **Case Retrieval:** `POST /api/retrieval/search`
- **Summarization:** `POST /api/summarization/summarize`
- **Question Generation:** `POST /api/questions/generate`
- **Chat Interface:** `POST /api/chat/message`

## 🎯 Next Steps

1. **Set up your .env file** with actual API keys
2. **Run `docker-compose up -d`** to start all services
3. **Access the application** at http://localhost:3000
4. **Upload legal documents** and test the system
5. **Monitor logs** and performance as needed

## ☁️ Azure Deployment

Azure offers several container deployment options for your Legal Case Retrieval System:

1. **Azure Container Instances (ACI)** - Simple, serverless containers
2. **Azure Container Apps** - Microservices with auto-scaling
3. **Azure Kubernetes Service (AKS)** - Full Kubernetes orchestration
4. **Azure App Service** - Platform-as-a-Service with container support

### Option 1: Azure Container Apps (Recommended)

Azure Container Apps is ideal for microservices applications like your legal case system.

#### Prerequisites

```bash
# Install Azure CLI
# Download from: https://aka.ms/installazurecliwindows

# Login to Azure
az login

# Install Container Apps extension
az extension add --name containerapp
```

#### 1. Create Resource Group and Environment

```bash
# Set variables
$RESOURCE_GROUP="legal-case-system-rg"
$LOCATION="eastus"
$ENVIRONMENT="legal-case-env"
$ACR_NAME="legalcaseacr$(Get-Random)"

# Create resource group
az group create --name $RESOURCE_GROUP --location $LOCATION

# Create Container Apps environment
az containerapp env create `
  --name $ENVIRONMENT `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION
```

#### 2. Create Azure Container Registry

```bash
# Create ACR
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $ACR_NAME `
  --sku Basic `
  --admin-enabled true

# Get ACR login server
$ACR_SERVER = az acr show --name $ACR_NAME --resource-group $RESOURCE_GROUP --query "loginServer" -o tsv
```

#### 3. Build and Push Images

```bash
# Login to ACR
az acr login --name $ACR_NAME

# Build and push backend image
docker build -t ${ACR_SERVER}/legal-case-backend:latest ./backend
docker push ${ACR_SERVER}/legal-case-backend:latest

# Build and push frontend image
docker build -t ${ACR_SERVER}/legal-case-frontend:latest ./frontend
docker push ${ACR_SERVER}/legal-case-frontend:latest
```

#### 4. Create MongoDB (CosmosDB)

```bash
# Create CosmosDB MongoDB account
az cosmosdb create `
  --name "legal-case-cosmos" `
  --resource-group $RESOURCE_GROUP `
  --kind MongoDB `
  --locations regionName=$LOCATION

# Get connection string
$COSMOS_CONNECTION = az cosmosdb keys list `
  --name "legal-case-cosmos" `
  --resource-group $RESOURCE_GROUP `
  --type connection-strings `
  --query "connectionStrings[0].connectionString" -o tsv
```

#### 5. Deploy Backend Container App

```bash
# Get ACR credentials
$ACR_USERNAME = az acr credential show --name $ACR_NAME --query "username" -o tsv
$ACR_PASSWORD = az acr credential show --name $ACR_NAME --query "passwords[0].value" -o tsv

# Deploy backend
az containerapp create `
  --name "legal-case-backend" `
  --resource-group $RESOURCE_GROUP `
  --environment $ENVIRONMENT `
  --image "${ACR_SERVER}/legal-case-backend:latest" `
  --registry-server $ACR_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 8000 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 1.0 `
  --memory 2.0Gi `
  --env-vars "MONGODB_URI=$COSMOS_CONNECTION" "GROQ_API_KEY=your_groq_api_key"
```

#### 6. Deploy Frontend Container App

```bash
# Get backend URL
$BACKEND_URL = az containerapp show `
  --name "legal-case-backend" `
  --resource-group $RESOURCE_GROUP `
  --query "properties.configuration.ingress.fqdn" -o tsv

# Deploy frontend
az containerapp create `
  --name "legal-case-frontend" `
  --resource-group $RESOURCE_GROUP `
  --environment $ENVIRONMENT `
  --image "${ACR_SERVER}/legal-case-frontend:latest" `
  --registry-server $ACR_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --target-port 80 `
  --ingress external `
  --min-replicas 1 `
  --max-replicas 2 `
  --cpu 0.5 `
  --memory 1.0Gi `
  --env-vars "VITE_API_BASE_URL=https://$BACKEND_URL"
```

### Option 2: Azure Kubernetes Service (AKS)

For production environments requiring advanced orchestration:

#### 1. Create AKS Cluster

```bash
# Create AKS cluster
az aks create `
  --resource-group $RESOURCE_GROUP `
  --name "legal-case-aks" `
  --node-count 2 `
  --node-vm-size Standard_D2s_v3 `
  --attach-acr $ACR_NAME `
  --generate-ssh-keys

# Get AKS credentials
az aks get-credentials --resource-group $RESOURCE_GROUP --name "legal-case-aks"
```

#### 2. Create Kubernetes Manifests

Create `k8s/namespace.yaml`:
```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: legal-case-system
```

Create `k8s/backend-deployment.yaml`:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: legal-case-backend
  namespace: legal-case-system
spec:
  replicas: 2
  selector:
    matchLabels:
      app: legal-case-backend
  template:
    metadata:
      labels:
        app: legal-case-backend
    spec:
      containers:
      - name: backend
        image: <ACR_SERVER>/legal-case-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGODB_URI
          value: "<COSMOS_CONNECTION_STRING>"
        - name: GROQ_API_KEY
          value: "<YOUR_GROQ_API_KEY>"
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: legal-case-backend-service
  namespace: legal-case-system
spec:
  selector:
    app: legal-case-backend
  ports:
  - port: 80
    targetPort: 8000
  type: LoadBalancer
```

#### 3. Deploy to AKS

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

# Check deployment status
kubectl get pods -n legal-case-system
kubectl get services -n legal-case-system
```

### Option 3: Azure Container Instances (Simple Deployment)

For quick testing and simple deployments:

```bash
# Create container group with both services
az container create `
  --resource-group $RESOURCE_GROUP `
  --name "legal-case-system" `
  --image "${ACR_SERVER}/legal-case-backend:latest" `
  --registry-login-server $ACR_SERVER `
  --registry-username $ACR_USERNAME `
  --registry-password $ACR_PASSWORD `
  --dns-name-label "legal-case-backend" `
  --ports 8000 `
  --environment-variables "MONGODB_URI=$COSMOS_CONNECTION" "GROQ_API_KEY=your_groq_api_key"
```

### Storage Solutions

#### Azure Blob Storage (for PDF files)

```bash
# Create storage account
az storage account create `
  --name "legalcasestorage$(Get-Random)" `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION `
  --sku Standard_LRS

# Create blob container
az storage container create `
  --name "legal-documents" `
  --account-name $STORAGE_ACCOUNT
```

#### Azure Files (for FAISS indexes)

```bash
# Create file share
az storage share create `
  --name "faiss-indexes" `
  --account-name $STORAGE_ACCOUNT
```

### Security Configuration

#### Azure Key Vault for Secrets

```bash
# Create Key Vault
az keyvault create `
  --name "legal-case-vault" `
  --resource-group $RESOURCE_GROUP `
  --location $LOCATION

# Store secrets
az keyvault secret set --vault-name "legal-case-vault" --name "groq-api-key" --value "your_groq_api_key"
az keyvault secret set --vault-name "legal-case-vault" --name "mongodb-uri" --value "$COSMOS_CONNECTION"
```

#### Managed Identity

```bash
# Create managed identity
az identity create `
  --name "legal-case-identity" `
  --resource-group $RESOURCE_GROUP

# Grant Key Vault access
az keyvault set-policy `
  --name "legal-case-vault" `
  --object-id $(az identity show --name "legal-case-identity" --resource-group $RESOURCE_GROUP --query principalId -o tsv) `
  --secret-permissions get list
```
