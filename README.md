# Parking in a Pinch 🅿️

NYC's Premier Parking Marketplace - A full-stack web application connecting drivers with available parking spaces.

## 🌟 Overview

Parking in a Pinch is a peer-to-peer parking marketplace designed specifically for New York City. It connects drivers looking for parking with property owners who have unused parking spaces, creating a win-win solution for NYC's notorious parking challenges.

## 🚀 Features

### For Drivers 🚗
- **Real-time availability** - See open spots instantly on an interactive map
- **Quick booking** - Reserve and pay for spots in under 30 seconds
- **Guaranteed parking** - No more circling blocks or feeding meters
- **Fair pricing** - Save 50-70% compared to traditional garages
- **User reviews** - Read reviews from other drivers
- **Secure payments** - Integrated Stripe payment processing

### For Space Owners 🏠
- **Easy listing** - List your driveway, garage, or lot in minutes
- **Set your schedule** - Choose when your space is available
- **Automatic payments** - Get paid instantly when someone books
- **Secure messaging** - Chat with renters through our platform
- **Income tracking** - Monitor your earnings with detailed analytics
- **Review system** - Build trust through user ratings

## 🛠️ Technology Stack

### Backend
- **Django 4.2.8** - Python web framework
- **Django REST Framework** - API development
- **PostgreSQL/SQLite** - Database (SQLite for development)
- **Redis** - Caching and session storage
- **Celery** - Background task processing
- **JWT Authentication** - Secure user authentication
- **Stripe** - Payment processing
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 18** - Modern JavaScript framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **React Query** - Server state management
- **React Router** - Client-side routing

### Development Tools
- **Docker** - Containerization
- **Pre-commit hooks** - Code quality
- **Black** - Python code formatting
- **ESLint/Prettier** - JavaScript/TypeScript linting

## 📁 Project Structure

```
Parking-in-a-Pinch/
├── backend/                 # Django backend application
│   ├── apps/               # Django apps
│   │   ├── users/         # User management
│   │   ├── listings/      # Parking spot listings
│   │   ├── bookings/      # Booking system
│   │   ├── payments/      # Payment processing
│   │   ├── reviews/       # Review system
│   │   ├── messaging/     # User messaging
│   │   └── notifications/ # Notification system
│   ├── config/            # Django settings
│   ├── requirements.txt   # Python dependencies
│   └── manage.py         # Django management script
├── frontend/              # React frontend application
│   ├── src/              # Source code
│   ├── public/           # Static assets
│   ├── package.json      # Node dependencies
│   └── vite.config.ts    # Vite configuration
├── docs/                 # Project documentation
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (for production)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/parking-in-a-pinch.git
   cd Parking-in-a-Pinch
   ```

2. **Set up Python virtual environment**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run database migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create a superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Start the backend server**
   ```bash
   python manage.py runserver 0.0.0.0:8000
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start the frontend development server**
   ```bash
   npm run dev
   ```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **API Documentation**: http://localhost:8000/api/docs/
- **Django Admin**: http://localhost:8000/admin/

## 📱 API Endpoints

### Authentication
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/registration/` - User registration
- `POST /api/v1/auth/logout/` - User logout

### Users
- `GET /api/v1/users/me/` - Get current user profile
- `PUT /api/v1/users/me/` - Update user profile
- `POST /api/v1/users/verify-email/` - Verify email address

### Listings
- `GET /api/v1/listings/` - List parking spots
- `POST /api/v1/listings/` - Create new listing
- `GET /api/v1/listings/{id}/` - Get listing details
- `PUT /api/v1/listings/{id}/` - Update listing

### Bookings
- `GET /api/v1/bookings/` - List user bookings
- `POST /api/v1/bookings/` - Create new booking
- `GET /api/v1/bookings/{id}/` - Get booking details

## 🔧 Development

### Running Tests
```bash
# Backend tests
cd backend
python manage.py test

# Frontend tests
cd frontend
npm test
```

### Code Formatting
```bash
# Backend (Python)
cd backend
black .
flake8 .

# Frontend (TypeScript/JavaScript)
cd frontend
npm run lint
npm run format
```

### Database Migrations
```bash
cd backend
python manage.py makemigrations
python manage.py migrate
```

## 🏙️ NYC Coverage

Available across all five boroughs:
- 🌆 Manhattan
- 🌉 Brooklyn
- ✈️ Queens
- ⚾ The Bronx
- 🏝️ Staten Island

## 🔒 Security Features

- JWT-based authentication
- Password hashing with Django's built-in system
- CORS protection
- SQL injection prevention
- XSS protection
- CSRF protection
- Input validation and sanitization

## 🚀 Deployment

### Environment Variables

Create a `.env` file in the backend directory:

```env
DEBUG=False
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://user:password@localhost:5432/parking_pinch
REDIS_URL=redis://localhost:6379/0
STRIPE_PUBLIC_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

### Production Deployment

1. Set up PostgreSQL database
2. Configure Redis for caching
3. Set up static file serving (AWS S3/CloudFront)
4. Configure email backend
5. Set up SSL certificates
6. Configure reverse proxy (Nginx)
7. Set up monitoring and logging

## 📊 The NYC Parking Problem

- 1.2M daily parking searches in NYC
- Average parking cost: $45/day
- Average time wasted finding parking: 52 minutes
- **Our solution**: Connect drivers with affordable, convenient parking instantly

## 🔮 Planned Features

- [ ] Mobile app (iOS & Android)
- [ ] Real-time GPS tracking
- [ ] Monthly parking subscriptions
- [ ] EV charging station listings
- [ ] Valet service integration
- [ ] Corporate parking programs
- [ ] Push notifications
- [ ] Advanced filtering and search
- [ ] Integration with mapping services

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

Made with 🗽 in NYC

## 📞 Support

For questions and support:
- Email: support@parkinginapinch.com
- Documentation: [API Docs](http://localhost:8000/api/docs/)
- Issues: [GitHub Issues](https://github.com/yourusername/parking-in-a-pinch/issues)

---

*Ready to solve NYC's parking problem, one spot at a time!* 🚗💨