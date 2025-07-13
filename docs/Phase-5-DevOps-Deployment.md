# Phase 5: DevOps & Deployment Architecture

## 🚀 Overview

This phase covers comprehensive DevOps practices, containerization strategies, cloud deployment, CI/CD pipelines, monitoring, and production-ready infrastructure for the Legal Case Retrieval System.

## 🐳 Docker Containerization Strategy

### Multi-Stage Backend Dockerfile
```dockerfile
# backend/Dockerfile
"""
Production-optimized multi-stage Docker build for FastAPI backend
"""

# Stage 1: Base Python environment
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Stage 2: Dependencies installation
FROM base as dependencies

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# Set working directory
WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Application
FROM dependencies as application

# Copy application code
COPY --chown=appuser:appuser . .

# Create necessary directories
RUN mkdir -p /app/data /app/logs /app/models && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### Optimized Frontend Dockerfile
```dockerfile
# frontend/Dockerfile
"""
Multi-stage React build with Nginx serving
"""

# Stage 1: Build environment
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with production optimizations
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build application
RUN npm run build

# Stage 2: Production server
FROM nginx:alpine as production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache curl

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy environment script
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Create non-root user
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Set ownership
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /etc/nginx

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Start Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
```

### Production Nginx Configuration
```nginx
# frontend/nginx.conf
"""
High-performance Nginx configuration for React SPA
"""

worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance optimizations
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        application/atom+xml
        application/geo+json
        application/javascript
        application/x-javascript
        application/json
        application/ld+json
        application/manifest+json
        application/rdf+xml
        application/rss+xml
        application/xhtml+xml
        application/xml
        font/eot
        font/otf
        font/ttf
        image/svg+xml
        text/css
        text/javascript
        text/plain
        text/xml;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Handle React Router
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API proxy
        location /api {
            proxy_pass http://backend:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # Static assets caching
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Security
        location ~ /\. {
            deny all;
            access_log off;
            log_not_found off;
        }

        # Error pages
        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

## 🔄 Advanced Docker Compose Configurations

### Production Docker Compose
```yaml
# docker-compose.prod.yml
"""
Production-ready Docker Compose with advanced features
"""

version: '3.8'

services:
  # Reverse Proxy
  nginx-proxy:
    image: nginx:alpine
    container_name: legal-case-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    networks:
      - legal-case-network

  # MongoDB with replica set
  mongodb-primary:
    image: mongo:7.0
    container_name: legal-case-mongodb-primary
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb-primary-data:/data/db
      - ./mongodb/mongod.conf:/etc/mongod.conf:ro
      - ./mongodb/keyfile:/etc/mongodb-keyfile:ro
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
      MONGO_INITDB_DATABASE: legal_case_analysis
    command: ["mongod", "--config", "/etc/mongod.conf"]
    networks:
      - legal-case-network
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 30s
      timeout: 10s
      retries: 3

  # MongoDB secondary (for read scaling)
  mongodb-secondary:
    image: mongo:7.0
    container_name: legal-case-mongodb-secondary
    restart: unless-stopped
    volumes:
      - mongodb-secondary-data:/data/db
      - ./mongodb/mongod.conf:/etc/mongod.conf:ro
      - ./mongodb/keyfile:/etc/mongodb-keyfile:ro
    environment:
      MONGO_INITDB_ROOT_USERNAME: ${MONGO_ROOT_USERNAME}
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_ROOT_PASSWORD}
    command: ["mongod", "--config", "/etc/mongod.conf"]
    depends_on:
      - mongodb-primary
    networks:
      - legal-case-network

  # Redis for caching and sessions
  redis:
    image: redis:7-alpine
    container_name: legal-case-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis/redis.conf:/etc/redis/redis.conf:ro
    command: ["redis-server", "/etc/redis/redis.conf"]
    networks:
      - legal-case-network
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend API with scaling
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
      args:
        BUILD_ENV: production
    container_name: legal-case-backend
    restart: unless-stopped
    ports:
      - "8000:8000"
    volumes:
      - ./backend/data:/app/data
      - backend-logs:/app/logs
      - ./backend/models:/app/models:ro
    environment:
      - ENVIRONMENT=production
      - MONGODB_URI=mongodb://${MONGO_ROOT_USERNAME}:${MONGO_ROOT_PASSWORD}@mongodb-primary:27017,mongodb-secondary:27017/legal_case_analysis?authSource=admin&replicaSet=rs0
      - REDIS_URL=redis://redis:6379/0
      - GROQ_API_KEY=${GROQ_API_KEY}
      - SECRET_KEY=${SECRET_KEY}
      - API_WORKERS=4
      - LOG_LEVEL=INFO
    depends_on:
      mongodb-primary:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - legal-case-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 2G

  # Frontend with CDN optimization
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
      args:
        BUILD_ENV: production
        VITE_API_BASE_URL: ${FRONTEND_API_URL}
    container_name: legal-case-frontend
    restart: unless-stopped
    ports:
      - "3000:80"
    volumes:
      - frontend-logs:/var/log/nginx
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - legal-case-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:80/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      replicas: 1
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  # Monitoring and observability
  prometheus:
    image: prom/prometheus:latest
    container_name: legal-case-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - legal-case-network

  grafana:
    image: grafana/grafana:latest
    container_name: legal-case-grafana
    restart: unless-stopped
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus
    networks:
      - legal-case-network

  # Log aggregation
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: legal-case-elasticsearch
    restart: unless-stopped
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch-data:/usr/share/elasticsearch/data
    environment:
      - discovery.type=single-node
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
      - xpack.security.enabled=false
    networks:
      - legal-case-network

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    container_name: legal-case-logstash
    restart: unless-stopped
    volumes:
      - ./logging/logstash.conf:/usr/share/logstash/pipeline/logstash.conf:ro
      - backend-logs:/var/log/backend:ro
      - frontend-logs:/var/log/frontend:ro
    depends_on:
      - elasticsearch
    networks:
      - legal-case-network

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: legal-case-kibana
    restart: unless-stopped
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch
    networks:
      - legal-case-network

volumes:
  mongodb-primary-data:
    driver: local
  mongodb-secondary-data:
    driver: local
  redis-data:
    driver: local
  backend-logs:
    driver: local
  frontend-logs:
    driver: local
  nginx-logs:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  elasticsearch-data:
    driver: local

networks:
  legal-case-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
```

## ☁️ Azure Cloud Deployment

### Azure Container Apps Configuration
```yaml
# azure/container-app.yml
"""
Azure Container Apps deployment configuration
"""

apiVersion: apps/v1
kind: Deployment
metadata:
  name: legal-case-backend
  labels:
    app: legal-case-backend
spec:
  replicas: 3
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
        image: legalcaseregistry.azurecr.io/legal-case-backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: legal-case-secrets
              key: mongodb-uri
        - name: GROQ_API_KEY
          valueFrom:
            secretKeyRef:
              name: legal-case-secrets
              key: groq-api-key
        - name: REDIS_URL
          value: "redis://legal-case-redis:6379/0"
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        livenessProbe:
          httpGet:
            path: /health/live
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: legal-case-backend-service
spec:
  selector:
    app: legal-case-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: ClusterIP
```

### Terraform Infrastructure as Code
```hcl
# azure/main.tf
"""
Complete Azure infrastructure using Terraform
"""

terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~>3.0"
    }
  }
  
  backend "azurerm" {
    resource_group_name  = "legal-case-terraform"
    storage_account_name = "legalcaseterraform"
    container_name       = "tfstate"
    key                  = "legal-case.terraform.tfstate"
  }
}

provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = var.environment
    Project     = "legal-case-analysis"
  }
}

# Container Registry
resource "azurerm_container_registry" "main" {
  name                = var.acr_name
  resource_group_name = azurerm_resource_group.main.name
  location           = azurerm_resource_group.main.location
  sku                = "Premium"
  admin_enabled      = true

  georeplications {
    location                = "East US 2"
    zone_redundancy_enabled = true
  }

  tags = {
    Environment = var.environment
  }
}

# Azure Container Apps Environment
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.project_name}-environment"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id

  tags = {
    Environment = var.environment
  }
}

# Log Analytics Workspace
resource "azurerm_log_analytics_workspace" "main" {
  name                = "${var.project_name}-logs"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = var.environment
  }
}

# MongoDB Cosmos DB
resource "azurerm_cosmosdb_account" "main" {
  name                = "${var.project_name}-cosmos"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  offer_type          = "Standard"
  kind                = "MongoDB"

  consistency_policy {
    consistency_level = "Session"
  }

  geo_location {
    location          = azurerm_resource_group.main.location
    failover_priority = 0
  }

  capabilities {
    name = "EnableServerless"
  }

  capabilities {
    name = "EnableMongo"
  }

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_cosmosdb_mongo_database" "main" {
  name                = "legal_case_analysis"
  resource_group_name = azurerm_resource_group.main.name
  account_name        = azurerm_cosmosdb_account.main.name
}

# Redis Cache
resource "azurerm_redis_cache" "main" {
  name                = "${var.project_name}-redis"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  capacity            = 1
  family              = "C"
  sku_name            = "Standard"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"

  redis_configuration {
    enable_authentication = true
  }

  tags = {
    Environment = var.environment
  }
}

# Storage Account for files
resource "azurerm_storage_account" "main" {
  name                     = "${replace(var.project_name, "-", "")}storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = "GRS"
  account_kind             = "StorageV2"

  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "HEAD", "POST", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }

  tags = {
    Environment = var.environment
  }
}

resource "azurerm_storage_container" "documents" {
  name                  = "documents"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

# Key Vault for secrets
resource "azurerm_key_vault" "main" {
  name                = "${var.project_name}-keyvault"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name            = "standard"

  access_policy {
    tenant_id = data.azurerm_client_config.current.tenant_id
    object_id = data.azurerm_client_config.current.object_id

    secret_permissions = [
      "Get",
      "List",
      "Set",
      "Delete",
      "Recover",
      "Backup",
      "Restore"
    ]
  }

  tags = {
    Environment = var.environment
  }
}

# Container App - Backend
resource "azurerm_container_app" "backend" {
  name                         = "${var.project_name}-backend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "backend"
      image  = "${azurerm_container_registry.main.login_server}/legal-case-backend:latest"
      cpu    = 2.0
      memory = "4Gi"

      env {
        name  = "MONGODB_URI"
        value = azurerm_cosmosdb_account.main.connection_strings[0]
      }

      env {
        name        = "GROQ_API_KEY"
        secret_name = "groq-api-key"
      }

      env {
        name  = "REDIS_URL"
        value = "rediss://:${azurerm_redis_cache.main.primary_access_key}@${azurerm_redis_cache.main.hostname}:6380/0"
      }
    }

    min_replicas = 1
    max_replicas = 10
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 8000

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name  = "groq-api-key"
    value = var.groq_api_key
  }

  tags = {
    Environment = var.environment
  }
}

# Container App - Frontend
resource "azurerm_container_app" "frontend" {
  name                         = "${var.project_name}-frontend"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    container {
      name   = "frontend"
      image  = "${azurerm_container_registry.main.login_server}/legal-case-frontend:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "VITE_API_BASE_URL"
        value = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
      }
    }

    min_replicas = 1
    max_replicas = 3
  }

  ingress {
    allow_insecure_connections = false
    external_enabled           = true
    target_port                = 80

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  tags = {
    Environment = var.environment
  }
}

# Application Insights
resource "azurerm_application_insights" "main" {
  name                = "${var.project_name}-insights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.main.id
  application_type    = "web"

  tags = {
    Environment = var.environment
  }
}

# Data sources
data "azurerm_client_config" "current" {}

# Variables
variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
  default     = "legal-case-analysis"
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "legal-case"
}

variable "acr_name" {
  description = "Container registry name"
  type        = string
  default     = "legalcaseregistry"
}

variable "groq_api_key" {
  description = "Groq API key"
  type        = string
  sensitive   = true
}

# Outputs
output "backend_url" {
  value = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}

output "frontend_url" {
  value = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
}

output "container_registry_login_server" {
  value = azurerm_container_registry.main.login_server
}
```

## 🔄 CI/CD Pipeline with GitHub Actions

### Comprehensive GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
"""
Production-grade CI/CD pipeline with security and quality gates
"""

name: Deploy Legal Case Analysis System

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  release:
    types: [published]

env:
  REGISTRY: legalcaseregistry.azurecr.io
  BACKEND_IMAGE: legal-case-backend
  FRONTEND_IMAGE: legal-case-frontend

jobs:
  # Security scanning
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
      
      - name: Upload Trivy scan results to GitHub Security tab
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

  # Backend testing and building
  backend-ci:
    runs-on: ubuntu-latest
    needs: security-scan
    
    services:
      mongodb:
        image: mongo:7.0
        env:
          MONGO_INITDB_ROOT_USERNAME: admin
          MONGO_INITDB_ROOT_PASSWORD: password
        options: >-
          --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
          
      - name: Cache pip dependencies
        uses: actions/cache@v3
        with:
          path: ~/.cache/pip
          key: ${{ runner.os }}-pip-${{ hashFiles('backend/requirements.txt') }}
          
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio
          
      - name: Run linting
        run: |
          cd backend
          pip install flake8 black isort
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          black --check .
          isort --check-only .
          
      - name: Run tests
        env:
          MONGODB_URI: mongodb://admin:password@localhost:27017/test_db?authSource=admin
          SECRET_KEY: test-secret-key
        run: |
          cd backend
          pytest tests/ -v --cov=app --cov-report=xml
          
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./backend/coverage.xml
          
      - name: Build backend image
        run: |
          cd backend
          docker build -t ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }} .
          
      - name: Login to Azure Container Registry
        if: github.event_name != 'pull_request'
        uses: azure/docker-login@v1
        with:
          login-server: ${{ env.REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
          
      - name: Push backend image
        if: github.event_name != 'pull_request'
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }}
          docker tag ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }} ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:latest
          docker push ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:latest

  # Frontend testing and building
  frontend-ci:
    runs-on: ubuntu-latest
    needs: security-scan
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
          
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
          
      - name: Run linting
        run: |
          cd frontend
          npm run lint
          
      - name: Run tests
        run: |
          cd frontend
          npm run test:coverage
          
      - name: Build application
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
        run: |
          cd frontend
          npm run build
          
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          configPath: './frontend/lighthouserc.json'
          uploadArtifacts: true
          temporaryPublicStorage: true
          
      - name: Build frontend image
        run: |
          cd frontend
          docker build -t ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }} .
          
      - name: Login to Azure Container Registry
        if: github.event_name != 'pull_request'
        uses: azure/docker-login@v1
        with:
          login-server: ${{ env.REGISTRY }}
          username: ${{ secrets.ACR_USERNAME }}
          password: ${{ secrets.ACR_PASSWORD }}
          
      - name: Push frontend image
        if: github.event_name != 'pull_request'
        run: |
          docker push ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }}
          docker tag ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }} ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:latest
          docker push ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:latest

  # Infrastructure deployment
  infrastructure-deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [backend-ci, frontend-ci]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Terraform
        uses: hashicorp/setup-terraform@v3
        with:
          terraform_version: 1.6.0
          
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          
      - name: Terraform Init
        run: |
          cd azure
          terraform init
          
      - name: Terraform Plan
        env:
          TF_VAR_groq_api_key: ${{ secrets.GROQ_API_KEY }}
        run: |
          cd azure
          terraform plan -out=tfplan
          
      - name: Terraform Apply
        env:
          TF_VAR_groq_api_key: ${{ secrets.GROQ_API_KEY }}
        run: |
          cd azure
          terraform apply -auto-approve tfplan

  # Application deployment
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: [infrastructure-deploy]
    environment: production
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
          
      - name: Update backend container app
        run: |
          az containerapp update \
            --name legal-case-backend \
            --resource-group legal-case-analysis \
            --image ${{ env.REGISTRY }}/${{ env.BACKEND_IMAGE }}:${{ github.sha }}
            
      - name: Update frontend container app
        run: |
          az containerapp update \
            --name legal-case-frontend \
            --resource-group legal-case-analysis \
            --image ${{ env.REGISTRY }}/${{ env.FRONTEND_IMAGE }}:${{ github.sha }}
            
      - name: Health check
        run: |
          # Wait for deployment
          sleep 60
          
          # Get app URLs
          BACKEND_URL=$(az containerapp show --name legal-case-backend --resource-group legal-case-analysis --query properties.configuration.ingress.fqdn -o tsv)
          FRONTEND_URL=$(az containerapp show --name legal-case-frontend --resource-group legal-case-analysis --query properties.configuration.ingress.fqdn -o tsv)
          
          # Health checks
          curl -f "https://$BACKEND_URL/health" || exit 1
          curl -f "https://$FRONTEND_URL/health" || exit 1
          
          echo "Deployment successful!"
          echo "Backend: https://$BACKEND_URL"
          echo "Frontend: https://$FRONTEND_URL"

  # Performance testing
  performance-test:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    needs: deploy
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run performance tests
        run: |
          # Install k6
          sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
          
          # Run load tests
          k6 run tests/performance/load-test.js
```

## 📊 Monitoring and Observability

### Prometheus Configuration
```yaml
# monitoring/prometheus.yml
"""
Production Prometheus configuration with comprehensive metrics
"""

global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  # Backend API metrics
  - job_name: 'legal-case-backend'
    static_configs:
      - targets: ['backend:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  # Frontend metrics
  - job_name: 'legal-case-frontend'
    static_configs:
      - targets: ['frontend:80']
    metrics_path: '/metrics'

  # MongoDB metrics
  - job_name: 'mongodb'
    static_configs:
      - targets: ['mongodb-exporter:9216']

  # Redis metrics
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  # Node exporter for system metrics
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # Container metrics
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

---

## 🔗 Next Steps

This phase covered comprehensive DevOps and deployment strategies. Continue to:

- **[Phase 6: Complete Workflows](./Phase-6-Complete-Workflows.md)** - See end-to-end system operation and real-world usage scenarios

---

*This documentation provides complete production-ready deployment strategies, infrastructure as code, and monitoring solutions for the Legal Case Retrieval System.*
