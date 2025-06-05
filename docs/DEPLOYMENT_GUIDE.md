# Deployment Guide

## Table of Contents
1. [Deployment Overview](#deployment-overview)
2. [Environment Setup](#environment-setup)
3. [Docker Configuration](#docker-configuration)
4. [AWS Infrastructure](#aws-infrastructure)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Database Deployment](#database-deployment)
7. [Frontend Deployment](#frontend-deployment)
8. [Backend Deployment](#backend-deployment)
9. [Monitoring and Logging](#monitoring-and-logging)
10. [Security Configuration](#security-configuration)
11. [Backup and Recovery](#backup-and-recovery)
12. [Troubleshooting](#troubleshooting)

## Deployment Overview

### Architecture Summary
```
Internet → CloudFlare → AWS ALB → EC2 Instances → RDS PostgreSQL
                                     ↓
                               S3 (Static Assets)
                                     ↓
                               ElastiCache Redis
```

### Deployment Environments
1. **Development** - Local Docker Compose
2. **Staging** - AWS with test data
3. **Production** - AWS with full monitoring

## Environment Setup

### Prerequisites
```bash
# Required tools
aws-cli >= 2.0
docker >= 20.0
docker-compose >= 2.0
terraform >= 1.0 (optional)
node >= 18.0
python >= 3.11
```

### Environment Variables
```bash
# .env.production
DEBUG=False
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com

# Database
DB_HOST=your-rds-endpoint
DB_NAME=parking_pinch
DB_USER=parking_app
DB_PASSWORD=your-db-password
DB_PORT=5432

# Redis
REDIS_URL=redis://your-elasticache-endpoint:6379

# AWS
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_STORAGE_BUCKET_NAME=your-s3-bucket
AWS_S3_REGION_NAME=us-east-1

# Stripe
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email
EMAIL_HOST=smtp.mailgun.org
EMAIL_HOST_USER=your-email@yourdomain.com
EMAIL_HOST_PASSWORD=your-email-password

# Monitoring
SENTRY_DSN=https://your-sentry-dsn
```

## Docker Configuration

### Production Dockerfile (Backend)
```dockerfile
# backend/Dockerfile.prod
FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

# Install system dependencies
RUN apt-get update && apt-get install -y \
    postgresql-client \
    libpq-dev \
    gcc \
    gdal-bin \
    libgdal-dev \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN adduser --disabled-password --gecos '' appuser && \
    chown -R appuser:appuser /app
USER appuser

# Collect static files
RUN python manage.py collectstatic --noinput

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1

# Expose port
EXPOSE 8000

# Start Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "60", "config.wsgi:application"]
```

### Production Dockerfile (Frontend)
```dockerfile
# frontend/Dockerfile.prod
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose (Production)
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - web

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - redis
    networks:
      - web
      - backend
    volumes:
      - media_volume:/app/media

  worker:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: celery -A config worker -l info
    environment:
      - DEBUG=False
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
    networks:
      - backend
    volumes:
      - media_volume:/app/media

  scheduler:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    command: celery -A config beat -l info
    environment:
      - DEBUG=False
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - redis
    networks:
      - backend

  redis:
    image: redis:7-alpine
    networks:
      - backend
    volumes:
      - redis_data:/data

networks:
  web:
    driver: bridge
  backend:
    driver: bridge

volumes:
  media_volume:
  redis_data:
```

## AWS Infrastructure

### Infrastructure as Code (Terraform)
```hcl
# infrastructure/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "parking-pinch-vpc"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "parking-pinch-igw"
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count = 2

  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.${count.index + 1}.0/24"
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "parking-pinch-public-${count.index + 1}"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count = 2

  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "parking-pinch-private-${count.index + 1}"
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name = "parking-pinch-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "alb" {
  name_prefix = "parking-pinch-alb-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "parking-pinch-alb-sg"
  }
}

resource "aws_security_group" "ecs" {
  name_prefix = "parking-pinch-ecs-"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "parking-pinch-ecs-sg"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "parking-pinch-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = true

  tags = {
    Name = "parking-pinch-alb"
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "parking-pinch-db-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "parking-pinch-db-subnet-group"
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier = "parking-pinch-db"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true

  db_name  = "parking_pinch"
  username = "parking_app"
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "parking-pinch-final-snapshot"

  tags = {
    Name = "parking-pinch-db"
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "parking-pinch-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

# ElastiCache Redis Cluster
resource "aws_elasticache_replication_group" "main" {
  replication_group_id         = "parking-pinch-redis"
  description                  = "Redis cluster for Parking in a Pinch"
  
  node_type            = "cache.t3.micro"
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters = 2
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = false

  tags = {
    Name = "parking-pinch-redis"
  }
}

# S3 Bucket for media files
resource "aws_s3_bucket" "media" {
  bucket = "parking-pinch-media-${random_string.bucket_suffix.result}"

  tags = {
    Name = "parking-pinch-media"
  }
}

resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}
```

### Variables File
```hcl
# infrastructure/variables.tf
variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}
```

## CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  AWS_REGION: us-east-1
  ECR_REPOSITORY_BACKEND: parking-pinch-backend
  ECR_REPOSITORY_FRONTEND: parking-pinch-frontend

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgis/postgis:15-3.3
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_parking_pinch
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v4
    
    - name: Set up Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Set up Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: frontend/package-lock.json
    
    - name: Install backend dependencies
      run: |
        cd backend
        pip install -r requirements.txt
    
    - name: Install frontend dependencies
      run: |
        cd frontend
        npm ci
    
    - name: Run backend tests
      env:
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/test_parking_pinch
        REDIS_URL: redis://localhost:6379/0
        SECRET_KEY: test-secret-key
      run: |
        cd backend
        python manage.py test
    
    - name: Run frontend tests
      run: |
        cd frontend
        npm run test
    
    - name: Run frontend linting
      run: |
        cd frontend
        npm run lint
    
    - name: Build frontend
      run: |
        cd frontend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ${{ env.AWS_REGION }}

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd backend
        docker build -f Dockerfile.prod -t $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG
        echo "backend_image=$ECR_REGISTRY/$ECR_REPOSITORY_BACKEND:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        IMAGE_TAG: ${{ github.sha }}
      run: |
        cd frontend
        docker build -f Dockerfile.prod -t $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG .
        docker push $ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG
        echo "frontend_image=$ECR_REGISTRY/$ECR_REPOSITORY_FRONTEND:$IMAGE_TAG" >> $GITHUB_OUTPUT

    - name: Deploy to ECS
      env:
        BACKEND_IMAGE: ${{ steps.build-backend.outputs.backend_image }}
        FRONTEND_IMAGE: ${{ steps.build-frontend.outputs.frontend_image }}
      run: |
        # Update ECS service with new images
        aws ecs update-service \
          --cluster parking-pinch-cluster \
          --service backend-service \
          --force-new-deployment
        
        aws ecs update-service \
          --cluster parking-pinch-cluster \
          --service frontend-service \
          --force-new-deployment

    - name: Run database migrations
      env:
        CLUSTER_NAME: parking-pinch-cluster
        TASK_DEFINITION: backend-migrate-task
      run: |
        aws ecs run-task \
          --cluster $CLUSTER_NAME \
          --task-definition $TASK_DEFINITION \
          --launch-type FARGATE \
          --network-configuration 'awsvpcConfiguration={subnets=[subnet-xxx,subnet-yyy],securityGroups=[sg-xxx],assignPublicIp=ENABLED}' \
          --overrides '{"containerOverrides":[{"name":"backend","command":["python","manage.py","migrate"]}]}'

    - name: Notify deployment
      uses: 8398a7/action-slack@v3
      with:
        status: ${{ job.status }}
        channel: '#deployments'
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}
      if: always()
```

## Database Deployment

### Database Setup Script
```bash
#!/bin/bash
# scripts/setup_database.sh

set -e

echo "Setting up PostgreSQL database..."

# Install PostGIS extension
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis_topology;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;"
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "CREATE EXTENSION IF NOT EXISTS postgis_tiger_geocoder;"

echo "Running Django migrations..."
python manage.py migrate

echo "Creating superuser..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', '$ADMIN_PASSWORD')
    print('Superuser created')
else:
    print('Superuser already exists')
"

echo "Loading initial data..."
python manage.py loaddata fixtures/initial_data.json

echo "Database setup complete!"
```

### Migration Strategy
```python
# backend/deploy/migrations.py
import os
import subprocess
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Deploy database migrations with zero downtime'

    def add_arguments(self, parser):
        parser.add_argument('--check', action='store_true', help='Check for unapplied migrations')
        parser.add_argument('--fake', action='store_true', help='Mark migrations as applied without running')

    def handle(self, *args, **options):
        if options['check']:
            self.check_migrations()
        elif options['fake']:
            self.fake_migrations()
        else:
            self.run_migrations()

    def check_migrations(self):
        result = subprocess.run(['python', 'manage.py', 'showmigrations', '--plan'], 
                              capture_output=True, text=True)
        
        if '[ ]' in result.stdout:
            self.stdout.write(self.style.WARNING('Unapplied migrations found:'))
            self.stdout.write(result.stdout)
            return False
        else:
            self.stdout.write(self.style.SUCCESS('All migrations applied'))
            return True

    def run_migrations(self):
        # Run migrations with monitoring
        self.stdout.write('Starting migrations...')
        
        # Monitor long-running migrations
        subprocess.run(['python', 'manage.py', 'migrate', '--verbosity=2'])
        
        self.stdout.write(self.style.SUCCESS('Migrations completed successfully'))
```

## Frontend Deployment

### Build and Deploy Script
```bash
#!/bin/bash
# scripts/deploy_frontend.sh

set -e

echo "Building frontend..."

cd frontend

# Install dependencies
npm ci --production

# Build application
npm run build

# Upload to S3
aws s3 sync dist/ s3://$S3_BUCKET_NAME/ --delete --cache-control max-age=31536000

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id $CLOUDFRONT_DISTRIBUTION_ID --paths "/*"

echo "Frontend deployment complete!"
```

### Nginx Configuration
```nginx
# nginx.conf
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;

    upstream backend {
        least_conn;
        server backend:8000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security
        server_tokens off;

        # Static files with long cache
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # API proxy
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }

        # Login rate limiting
        location /api/auth/login/ {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # PWA files
        location ~* \.(manifest|sw\.js)$ {
            expires 0;
            add_header Cache-Control "no-cache, no-store, must-revalidate";
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
            
            # PWA headers
            add_header Cache-Control "no-cache, no-store, must-revalidate";
            add_header Pragma "no-cache";
            add_header Expires "0";
        }

        # Deny access to sensitive files
        location ~ /\. {
            deny all;
        }

        location ~ /(package\.json|package-lock\.json|yarn\.lock)$ {
            deny all;
        }
    }
}
```

## Backend Deployment

### Gunicorn Configuration
```python
# backend/gunicorn.conf.py
import multiprocessing
import os

# Server socket
bind = "0.0.0.0:8000"
backlog = 2048

# Worker processes
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "sync"
worker_connections = 1000
timeout = 60
keepalive = 2

# Restart workers after this many requests
max_requests = 1000
max_requests_jitter = 50

# Logging
loglevel = "info"
accesslog = "-"
errorlog = "-"
access_log_format = '%h %l %u %t "%r" %s %b "%{Referer}i" "%{User-Agent}i"'

# Process naming
proc_name = "parking_pinch_gunicorn"

# Server mechanics
preload_app = True
daemon = False
pidfile = "/tmp/gunicorn.pid"
user = None
group = None

# SSL (if needed)
# keyfile = "/path/to/keyfile"
# certfile = "/path/to/certfile"

# Hooks
def when_ready(server):
    server.log.info("Server is ready. Spawning workers")

def worker_int(worker):
    worker.log.info("worker received INT or QUIT signal")

def on_exit(server):
    server.log.info("Server is shutting down")
```

### Celery Configuration
```python
# backend/celery.conf.py
import os
from celery import Celery

# Set default Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.production')

app = Celery('parking_pinch')

# Configure Celery
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks
app.autodiscover_tasks()

# Monitoring
app.conf.update(
    task_track_started=True,
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_max_tasks_per_child=1000,
)

# Error handling
app.conf.task_routes = {
    'apps.notifications.tasks.send_email': {'queue': 'notifications'},
    'apps.payments.tasks.process_payment': {'queue': 'payments'},
    'apps.analytics.tasks.update_stats': {'queue': 'analytics'},
}
```

## Monitoring and Logging

### CloudWatch Configuration
```python
# backend/config/logging.py
import boto3
from pythonjsonlogger import jsonlogger

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            '()': jsonlogger.JsonFormatter,
            'format': '%(asctime)s %(name)s %(levelname)s %(message)s'
        },
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
        'cloudwatch': {
            'class': 'watchtower.CloudWatchLogsHandler',
            'boto3_session': boto3.Session(),
            'log_group': 'parking-pinch-app',
            'stream_name': 'django-app',
            'formatter': 'json',
        },
    },
    'root': {
        'level': 'INFO',
        'handlers': ['console', 'cloudwatch'],
    },
    'loggers': {
        'django': {
            'level': 'INFO',
            'handlers': ['console', 'cloudwatch'],
            'propagate': False,
        },
        'apps': {
            'level': 'INFO',
            'handlers': ['console', 'cloudwatch'],
            'propagate': False,
        },
    },
}
```

### Health Check Endpoints
```python
# backend/apps/core/views.py
from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
import redis

def health_check(request):
    """Comprehensive health check endpoint"""
    status = {
        'status': 'healthy',
        'timestamp': timezone.now().isoformat(),
        'version': settings.VERSION,
        'checks': {}
    }

    # Database check
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        status['checks']['database'] = 'healthy'
    except Exception as e:
        status['checks']['database'] = f'unhealthy: {str(e)}'
        status['status'] = 'unhealthy'

    # Redis check
    try:
        cache.set('health_check', 'ok', 30)
        cache.get('health_check')
        status['checks']['redis'] = 'healthy'
    except Exception as e:
        status['checks']['redis'] = f'unhealthy: {str(e)}'
        status['status'] = 'unhealthy'

    # Disk space check
    import shutil
    try:
        disk_usage = shutil.disk_usage('/')
        free_percentage = (disk_usage.free / disk_usage.total) * 100
        if free_percentage > 10:
            status['checks']['disk_space'] = 'healthy'
        else:
            status['checks']['disk_space'] = f'low: {free_percentage:.1f}% free'
            status['status'] = 'unhealthy'
    except Exception as e:
        status['checks']['disk_space'] = f'error: {str(e)}'

    return JsonResponse(status, status=200 if status['status'] == 'healthy' else 503)
```

## Security Configuration

### SSL/TLS Setup
```bash
#!/bin/bash
# scripts/setup_ssl.sh

# Install Certbot
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -l | { cat; echo "0 12 * * * /usr/bin/certbot renew --quiet"; } | sudo crontab -

# Verify renewal
sudo certbot renew --dry-run
```

### Security Headers
```python
# backend/config/settings/production.py

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'

# HTTPS settings
SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# Content Security Policy
CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'", "'unsafe-inline'", "https://js.stripe.com")
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'", "https://fonts.googleapis.com")
CSP_FONT_SRC = ("'self'", "https://fonts.gstatic.com")
CSP_IMG_SRC = ("'self'", "data:", "https:")
CSP_CONNECT_SRC = ("'self'", "https://api.stripe.com")

# Rate limiting
RATELIMIT_ENABLE = True
RATELIMIT_USE_CACHE = 'default'
```

## Backup and Recovery

### Automated Backup Script
```bash
#!/bin/bash
# scripts/backup.sh

set -e

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="/tmp/backups"
S3_BUCKET="parking-pinch-backups"

mkdir -p $BACKUP_DIR

echo "Starting backup process..."

# Database backup
echo "Backing up database..."
pg_dump \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --format=custom \
  --compress=9 \
  --verbose \
  --no-password \
  $DB_NAME > $BACKUP_DIR/database_$TIMESTAMP.dump

# Media files backup
echo "Backing up media files..."
aws s3 sync s3://$MEDIA_BUCKET/ $BACKUP_DIR/media_$TIMESTAMP/ --quiet

# Create archive
echo "Creating backup archive..."
tar -czf $BACKUP_DIR/backup_$TIMESTAMP.tar.gz -C $BACKUP_DIR database_$TIMESTAMP.dump media_$TIMESTAMP/

# Upload to S3
echo "Uploading backup to S3..."
aws s3 cp $BACKUP_DIR/backup_$TIMESTAMP.tar.gz s3://$S3_BUCKET/ \
  --sse AES256 \
  --storage-class STANDARD_IA

# Cleanup local files
rm -rf $BACKUP_DIR/database_$TIMESTAMP.dump
rm -rf $BACKUP_DIR/media_$TIMESTAMP/
rm -f $BACKUP_DIR/backup_$TIMESTAMP.tar.gz

# Cleanup old backups (keep 30 days)
aws s3 ls s3://$S3_BUCKET/ --recursive | \
  while read -r line; do
    createDate=$(echo $line | awk {'print $1" "$2'})
    createDate=$(date -d"$createDate" +%s)
    olderThan=$(date -d"-30 days" +%s)
    if [[ $createDate -lt $olderThan ]]; then
      fileName=$(echo $line | awk {'print $4'})
      if [[ $fileName != "" ]]; then
        aws s3 rm s3://$S3_BUCKET/$fileName
      fi
    fi
  done

echo "Backup completed successfully!"
```

### Disaster Recovery Plan
```bash
#!/bin/bash
# scripts/restore.sh

set -e

BACKUP_FILE=$1
RESTORE_DIR="/tmp/restore"

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

mkdir -p $RESTORE_DIR

echo "Starting restore process..."

# Download backup from S3
echo "Downloading backup..."
aws s3 cp s3://parking-pinch-backups/$BACKUP_FILE $RESTORE_DIR/

# Extract backup
echo "Extracting backup..."
tar -xzf $RESTORE_DIR/$BACKUP_FILE -C $RESTORE_DIR/

# Restore database
echo "Restoring database..."
pg_restore \
  --host=$DB_HOST \
  --port=$DB_PORT \
  --username=$DB_USER \
  --dbname=$DB_NAME \
  --clean \
  --if-exists \
  --verbose \
  --no-password \
  $RESTORE_DIR/database_*.dump

# Restore media files
echo "Restoring media files..."
aws s3 sync $RESTORE_DIR/media_*/ s3://$MEDIA_BUCKET/ --delete

# Run migrations (if needed)
echo "Running migrations..."
python manage.py migrate

# Cleanup
rm -rf $RESTORE_DIR

echo "Restore completed successfully!"
```

## Troubleshooting

### Common Issues and Solutions

#### 1. High Memory Usage
```bash
# Check memory usage
docker stats
free -h

# Optimize Gunicorn workers
# Reduce worker count in production
workers = min(multiprocessing.cpu_count(), 4)
```

#### 2. Database Connection Issues
```python
# Check database connections
from django.db import connections
db = connections['default']
print(f"Database queries: {len(db.queries)}")

# Reset connections
from django.db import close_old_connections
close_old_connections()
```

#### 3. Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Monitor Redis
redis-cli monitor

# Check memory usage
redis-cli info memory
```

#### 4. High CPU Usage
```bash
# Check process usage
top -p $(pgrep -f gunicorn)

# Profile Python application
pip install py-spy
py-spy top --pid <gunicorn-pid>
```

### Monitoring Commands
```bash
# Application logs
docker logs -f backend_container
docker logs -f worker_container

# System metrics
htop
iotop
nethogs

# Database monitoring
SELECT * FROM pg_stat_activity WHERE state = 'active';
SELECT schemaname,tablename,n_tup_ins,n_tup_upd,n_tup_del FROM pg_stat_user_tables;

# Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Emergency Procedures
```bash
# Scale down traffic (emergency)
aws elbv2 modify-target-group --target-group-arn arn:aws:elasticloadbalancing:... --health-check-enabled false

# Rollback deployment
docker pull previous_image_tag
docker service update --image previous_image_tag service_name

# Database emergency stop
sudo systemctl stop postgresql
sudo systemctl start postgresql

# Clear Redis cache
redis-cli flushall
```