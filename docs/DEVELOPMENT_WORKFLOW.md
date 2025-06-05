# Development Workflow & Implementation Guide

## Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Project Initialization](#project-initialization)
3. [Backend Development Workflow](#backend-development-workflow)
4. [Frontend Development Workflow](#frontend-development-workflow)
5. [Database Development](#database-development)
6. [API Development Process](#api-development-process)
7. [Testing Strategy](#testing-strategy)
8. [Code Quality and Standards](#code-quality-and-standards)
9. [Git Workflow](#git-workflow)
10. [Step-by-Step Implementation Plan](#step-by-step-implementation-plan)

## Development Environment Setup

### Prerequisites Installation
```bash
# System requirements
node --version    # >= 18.0.0
python --version  # >= 3.11.0
docker --version  # >= 20.0.0
git --version     # >= 2.30.0

# Install PostgreSQL with PostGIS
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib postgis postgresql-15-postgis-3

# macOS
brew install postgresql postgis

# Windows
# Download from https://www.postgresql.org/download/windows/
```

### Local Development Setup
```bash
# Clone repository
git clone https://github.com/yourusername/parking-in-a-pinch.git
cd parking-in-a-pinch

# Create development environment file
cp .env.example .env.development

# Start services with Docker Compose
docker-compose -f docker-compose.dev.yml up -d

# Verify services are running
docker-compose ps
```

### IDE and Tools Setup
```bash
# Recommended VS Code extensions
code --install-extension ms-python.python
code --install-extension bradlc.vscode-tailwindcss
code --install-extension esbenp.prettier-vscode
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension ms-python.black-formatter
code --install-extension ms-python.flake8

# Git hooks setup
pre-commit install
```

## Project Initialization

### Backend Project Setup
```bash
# Create Python virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Environment variables
cat > .env << EOF
DEBUG=True
SECRET_KEY=your-secret-key-for-development
DATABASE_URL=postgres://parking_app:password@localhost:5432/parking_pinch_dev
REDIS_URL=redis://localhost:6379/0
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EOF

# Create database
createdb parking_pinch_dev
psql parking_pinch_dev -c "CREATE EXTENSION postgis;"

# Run initial migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Load sample data
python manage.py loaddata fixtures/sample_data.json

# Start development server
python manage.py runserver
```

### Frontend Project Setup
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Environment variables
cat > .env.development << EOF
VITE_API_URL=http://localhost:8000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
VITE_SENTRY_DSN=your-sentry-dsn
EOF

# Start development server
npm run dev
```

### Docker Development Environment
```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: parking_pinch_dev
      POSTGRES_USER: parking_app
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog
    ports:
      - "1025:1025"  # SMTP
      - "8025:8025"  # Web UI

  minio:
    image: minio/minio
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

## Backend Development Workflow

### Django App Creation Process
```bash
# Create new Django app
python manage.py startapp app_name

# Add to INSTALLED_APPS in settings/base.py
INSTALLED_APPS = [
    # ... existing apps
    'apps.app_name',
]

# Create app structure
mkdir -p apps/app_name/{tests,migrations}
touch apps/app_name/{__init__.py,tests/__init__.py}
```

### Model Development Pattern
```python
# 1. Create models in apps/app_name/models.py
class ModelName(models.Model):
    """Detailed docstring explaining the model purpose"""
    
    # Fields with proper validation
    name = models.CharField(max_length=100, help_text="Model name")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'app_model_name'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name

# 2. Create and run migrations
python manage.py makemigrations app_name
python manage.py migrate

# 3. Register in admin.py
from django.contrib import admin
from .models import ModelName

@admin.register(ModelName)
class ModelNameAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)
    list_filter = ('created_at',)
```

### API Development Pattern
```python
# 1. Create serializers (apps/app_name/serializers.py)
from rest_framework import serializers
from .models import ModelName

class ModelNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelName
        fields = '__all__'
        read_only_fields = ('id', 'created_at', 'updated_at')

# 2. Create views (apps/app_name/views.py)
from rest_framework import viewsets, permissions
from .models import ModelName
from .serializers import ModelNameSerializer

class ModelNameViewSet(viewsets.ModelViewSet):
    queryset = ModelName.objects.all()
    serializer_class = ModelNameSerializer
    permission_classes = [permissions.IsAuthenticated]

# 3. Create URLs (apps/app_name/urls.py)
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ModelNameViewSet

router = DefaultRouter()
router.register(r'modelnames', ModelNameViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

# 4. Include in main URLs (config/urls.py)
urlpatterns = [
    path('api/v1/app/', include('apps.app_name.urls')),
]
```

### Testing Pattern
```python
# apps/app_name/tests/test_models.py
from django.test import TestCase
from apps.app_name.models import ModelName

class ModelNameTestCase(TestCase):
    def setUp(self):
        self.model = ModelName.objects.create(name="Test Model")
    
    def test_string_representation(self):
        self.assertEqual(str(self.model), "Test Model")
    
    def test_model_creation(self):
        self.assertTrue(isinstance(self.model, ModelName))
        self.assertEqual(self.model.name, "Test Model")

# apps/app_name/tests/test_views.py
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from apps.app_name.models import ModelName

User = get_user_model()

class ModelNameAPITestCase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        self.client.force_authenticate(user=self.user)
    
    def test_create_model(self):
        data = {'name': 'Test Model via API'}
        response = self.client.post('/api/v1/app/modelnames/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(ModelName.objects.count(), 1)
```

## Frontend Development Workflow

### Component Development Pattern
```typescript
// 1. Create component directory structure
// src/features/feature-name/components/ComponentName/
//   ├── ComponentName.tsx
//   ├── ComponentName.test.tsx
//   ├── ComponentName.stories.tsx
//   └── index.ts

// 2. Component implementation
// src/features/feature-name/components/ComponentName/ComponentName.tsx
import React from 'react'
import { cn } from '@/utils/cn'

interface ComponentNameProps {
  title: string
  description?: string
  variant?: 'primary' | 'secondary'
  className?: string
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  title,
  description,
  variant = 'primary',
  className
}) => {
  return (
    <div className={cn(
      'component-base-styles',
      variant === 'primary' && 'primary-styles',
      variant === 'secondary' && 'secondary-styles',
      className
    )}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}

// 3. Component tests
// src/features/feature-name/components/ComponentName/ComponentName.test.tsx
import { render, screen } from '@testing-library/react'
import { ComponentName } from './ComponentName'

describe('ComponentName', () => {
  it('renders with required props', () => {
    render(<ComponentName title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <ComponentName 
        title="Test Title" 
        description="Test Description" 
      />
    )
    expect(screen.getByText('Test Description')).toBeInTheDocument()
  })
})

// 4. Export from index
// src/features/feature-name/components/ComponentName/index.ts
export { ComponentName } from './ComponentName'
export type { ComponentNameProps } from './ComponentName'
```

### State Management Pattern
```typescript
// 1. Create Redux slice
// src/features/feature-name/store/featureSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { featureApi } from '../services/featureApi'

interface FeatureState {
  items: FeatureItem[]
  loading: boolean
  error: string | null
}

const initialState: FeatureState = {
  items: [],
  loading: false,
  error: null
}

export const fetchFeatureItems = createAsyncThunk(
  'feature/fetchItems',
  async (params: FetchParams) => {
    const response = await featureApi.getItems(params)
    return response.data
  }
)

const featureSlice = createSlice({
  name: 'feature',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeatureItems.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFeatureItems.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchFeatureItems.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch items'
      })
  }
})

export const { clearError } = featureSlice.actions
export default featureSlice.reducer

// 2. Create React Query hooks
// src/features/feature-name/hooks/useFeatureItems.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { featureApi } from '../services/featureApi'

export const useFeatureItems = (params?: FetchParams) => {
  return useQuery({
    queryKey: ['featureItems', params],
    queryFn: () => featureApi.getItems(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useCreateFeatureItem = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: featureApi.createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['featureItems'] })
    }
  })
}
```

### API Service Pattern
```typescript
// src/features/feature-name/services/featureApi.ts
import api from '@/services/api'
import { FeatureItem, CreateFeatureItemRequest } from '../types'

export const featureApi = {
  getItems: async (params?: FetchParams): Promise<FeatureItem[]> => {
    const { data } = await api.get<FeatureItem[]>('/feature-items/', { params })
    return data
  },

  getItem: async (id: string): Promise<FeatureItem> => {
    const { data } = await api.get<FeatureItem>(`/feature-items/${id}/`)
    return data
  },

  createItem: async (item: CreateFeatureItemRequest): Promise<FeatureItem> => {
    const { data } = await api.post<FeatureItem>('/feature-items/', item)
    return data
  },

  updateItem: async (id: string, updates: Partial<FeatureItem>): Promise<FeatureItem> => {
    const { data } = await api.patch<FeatureItem>(`/feature-items/${id}/`, updates)
    return data
  },

  deleteItem: async (id: string): Promise<void> => {
    await api.delete(`/feature-items/${id}/`)
  }
}
```

## Database Development

### Migration Workflow
```bash
# 1. Make model changes
# 2. Create migration
python manage.py makemigrations app_name --name descriptive_migration_name

# 3. Review migration file
cat backend/apps/app_name/migrations/XXXX_descriptive_migration_name.py

# 4. Test migration
python manage.py migrate --plan
python manage.py migrate

# 5. Reverse migration (if needed)
python manage.py migrate app_name 0001  # revert to migration 0001

# 6. Create empty migration for data
python manage.py makemigrations app_name --empty --name populate_initial_data
```

### Data Migration Example
```python
# apps/app_name/migrations/XXXX_populate_initial_data.py
from django.db import migrations

def create_initial_data(apps, schema_editor):
    """Create initial data for the application"""
    Model = apps.get_model('app_name', 'Model')
    
    initial_items = [
        {'name': 'Item 1', 'description': 'First item'},
        {'name': 'Item 2', 'description': 'Second item'},
    ]
    
    for item_data in initial_items:
        Model.objects.create(**item_data)

def reverse_initial_data(apps, schema_editor):
    """Remove initial data"""
    Model = apps.get_model('app_name', 'Model')
    Model.objects.filter(name__in=['Item 1', 'Item 2']).delete()

class Migration(migrations.Migration):
    dependencies = [
        ('app_name', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(create_initial_data, reverse_initial_data),
    ]
```

## API Development Process

### API Design First Approach
```yaml
# docs/api-spec.yml (OpenAPI 3.0)
openapi: 3.0.0
info:
  title: Parking in a Pinch API
  version: 1.0.0
  description: API for parking marketplace platform

paths:
  /api/v1/listings/:
    get:
      summary: List parking spots
      parameters:
        - name: location
          in: query
          schema:
            type: string
          description: Search location
        - name: price_max
          in: query
          schema:
            type: number
          description: Maximum price filter
      responses:
        '200':
          description: List of parking spots
          content:
            application/json:
              schema:
                type: object
                properties:
                  results:
                    type: array
                    items:
                      $ref: '#/components/schemas/Listing'
    post:
      summary: Create parking spot
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateListing'
      responses:
        '201':
          description: Created parking spot

components:
  schemas:
    Listing:
      type: object
      properties:
        id:
          type: integer
        title:
          type: string
        description:
          type: string
        price_per_hour:
          type: number
        created_at:
          type: string
          format: date-time
```

### API Testing with Postman/Bruno
```json
// api-tests/listings.json
{
  "name": "Parking Listings API",
  "requests": [
    {
      "name": "List Listings",
      "method": "GET",
      "url": "{{base_url}}/api/v1/listings/",
      "headers": {
        "Authorization": "Bearer {{auth_token}}"
      },
      "tests": [
        "expect(response.status).toBe(200)",
        "expect(response.data.results).toBeArray()"
      ]
    },
    {
      "name": "Create Listing",
      "method": "POST",
      "url": "{{base_url}}/api/v1/listings/",
      "headers": {
        "Authorization": "Bearer {{auth_token}}",
        "Content-Type": "application/json"
      },
      "body": {
        "title": "Test Parking Spot",
        "description": "A test parking spot",
        "price_per_hour": 5.00,
        "address": "123 Test St, New York, NY"
      },
      "tests": [
        "expect(response.status).toBe(201)",
        "expect(response.data.title).toBe('Test Parking Spot')"
      ]
    }
  ]
}
```

## Testing Strategy

### Backend Testing Setup
```python
# backend/conftest.py
import pytest
from django.contrib.auth import get_user_model
from apps.listings.models import Listing

User = get_user_model()

@pytest.fixture
def user():
    return User.objects.create_user(
        username='testuser',
        email='test@example.com',
        password='testpass123'
    )

@pytest.fixture
def host_user():
    return User.objects.create_user(
        username='hostuser',
        email='host@example.com',
        password='testpass123',
        user_type='HOST'
    )

@pytest.fixture
def listing(host_user):
    return Listing.objects.create(
        host=host_user,
        title='Test Parking Spot',
        description='A test parking spot',
        price_per_hour=5.00,
        address='123 Test St, New York, NY'
    )

# Run tests
pytest backend/apps/listings/tests/ -v
pytest backend/apps/listings/tests/test_models.py::ListingTestCase::test_create_listing -v
```

### Frontend Testing Setup
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers that may be added during tests
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// src/test/mocks/server.ts
import { setupServer } from 'msw/node'
import { rest } from 'msw'

export const handlers = [
  rest.get('/api/v1/listings/', (req, res, ctx) => {
    return res(
      ctx.json({
        results: [
          {
            id: 1,
            title: 'Test Parking Spot',
            price_per_hour: 5.00
          }
        ]
      })
    )
  }),
]

export const server = setupServer(...handlers)

// Run tests
npm test
npm run test:coverage
```

## Code Quality and Standards

### Pre-commit Configuration
```yaml
# .pre-commit-config.yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files

  - repo: https://github.com/psf/black
    rev: 23.1.0
    hooks:
      - id: black
        language_version: python3
        files: ^backend/

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8
        files: ^backend/

  - repo: https://github.com/pycqa/isort
    rev: 5.12.0
    hooks:
      - id: isort
        files: ^backend/

  - repo: https://github.com/pre-commit/mirrors-eslint
    rev: v8.56.0
    hooks:
      - id: eslint
        files: ^frontend/
        types: [file]
        types_or: [javascript, jsx, ts, tsx]

  - repo: https://github.com/pre-commit/mirrors-prettier
    rev: v3.0.3
    hooks:
      - id: prettier
        files: ^frontend/
```

### Code Review Checklist
```markdown
## Backend Code Review Checklist
- [ ] Model fields have appropriate validation
- [ ] Database migrations are safe and reversible
- [ ] API endpoints follow RESTful conventions
- [ ] Proper error handling and status codes
- [ ] Authentication and permissions are correct
- [ ] Tests cover happy path and edge cases
- [ ] No hardcoded values or secrets
- [ ] Performance considerations (N+1 queries, etc.)

## Frontend Code Review Checklist
- [ ] Components are properly typed with TypeScript
- [ ] Accessibility attributes are present
- [ ] Mobile responsive design
- [ ] Error states are handled
- [ ] Loading states are implemented
- [ ] Tests cover user interactions
- [ ] Performance optimizations (memoization, lazy loading)
- [ ] SEO considerations (meta tags, semantic HTML)
```

## Git Workflow

### Branch Naming Convention
```bash
# Feature branches
feature/user-authentication
feature/listing-search
feature/payment-integration

# Bug fix branches
bugfix/login-validation-error
bugfix/map-rendering-issue

# Hotfix branches
hotfix/security-vulnerability
hotfix/payment-gateway-error

# Release branches
release/v1.0.0
release/v1.1.0
```

### Commit Message Format
```
type(scope): subject

body

footer

# Types: feat, fix, docs, style, refactor, test, chore
# Examples:
feat(auth): add user registration with email verification
fix(listings): resolve map marker positioning issue
docs(api): update authentication endpoint documentation
test(bookings): add unit tests for booking creation
```

### Pull Request Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing (if frontend changes)

## Screenshots (if applicable)
Add screenshots to help explain your changes.

## Checklist
- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
```

## Step-by-Step Implementation Plan

### Phase 1: Foundation (Weeks 1-2)
```bash
# Week 1: Project Setup
Day 1-2: Environment setup and project initialization
Day 3-4: Basic Django project structure with user authentication
Day 5-7: React frontend setup with routing and basic UI

# Week 2: Core Models and API
Day 1-3: User, Listing, and Booking models with database schema
Day 4-5: Basic CRUD API endpoints for listings
Day 6-7: Frontend listing components and API integration
```

### Phase 2: Core Features (Weeks 3-6)
```bash
# Week 3: User Management
- User registration and login
- Profile management
- Email verification
- Password reset functionality

# Week 4: Listing Management
- Create/edit parking spot listings
- Photo upload functionality
- Location mapping with geocoding
- Availability calendar

# Week 5: Search and Discovery
- Location-based search
- Filtering and sorting
- Map view integration
- Search results pagination

# Week 6: Booking System
- Booking creation and management
- Calendar integration
- Booking confirmation workflow
- Basic notification system
```

### Phase 3: Advanced Features (Weeks 7-10)
```bash
# Week 7: Payment Integration
- Stripe payment setup
- Payment processing workflow
- Booking payment flow
- Host payout system

# Week 8: Messaging System
- User-to-user messaging
- Real-time chat with WebSockets
- Message history and notifications
- In-app notification system

# Week 9: Reviews and Ratings
- Two-way review system
- Rating aggregation
- Review moderation
- Trust score calculation

# Week 10: Mobile Optimization
- Progressive Web App features
- Mobile-responsive design refinements
- Touch optimization
- Offline functionality
```

### Phase 4: Production Ready (Weeks 11-12)
```bash
# Week 11: Testing and Quality Assurance
- Comprehensive test coverage
- End-to-end testing
- Performance optimization
- Security audit

# Week 12: Deployment and Launch
- Production environment setup
- CI/CD pipeline implementation
- Monitoring and logging setup
- Launch preparation and documentation
```

### Daily Development Routine
```bash
# Morning routine
git pull origin main
docker-compose -f docker-compose.dev.yml up -d
python manage.py runserver &
npm run dev &

# Development cycle
1. Create feature branch
2. Write failing tests
3. Implement feature
4. Make tests pass
5. Refactor code
6. Update documentation
7. Create pull request

# End of day routine
git add .
git commit -m "descriptive commit message"
git push origin feature-branch
docker-compose down
```

### Weekly Milestones
```markdown
## Week 1 Deliverables
- [x] Development environment fully configured
- [x] Basic Django project with user authentication
- [x] React frontend with routing and basic components
- [x] Database schema design documented

## Week 2 Deliverables
- [x] Core models implemented (User, Listing, Booking)
- [x] Basic CRUD API endpoints
- [x] Frontend components for listing management
- [x] API integration with error handling

## Week 3 Deliverables
- [x] User registration and authentication flow
- [x] Profile management functionality
- [x] Email verification system
- [x] Password reset functionality

# Continue for each week...
```

### Quality Gates
```bash
# Before each merge to main
1. All tests pass (backend and frontend)
2. Code coverage > 80%
3. No linting errors
4. Security scan passes
5. Performance benchmarks met
6. Documentation updated
7. Code review approved

# Before deployment
1. End-to-end tests pass
2. Load testing completed
3. Security audit passed
4. Backup procedures tested
5. Rollback plan documented
6. Monitoring alerts configured
```

This comprehensive workflow ensures systematic development with quality controls at every step. Each phase builds upon the previous one, allowing for iterative development and testing while maintaining code quality and project momentum.