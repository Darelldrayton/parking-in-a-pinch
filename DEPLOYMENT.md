# 🚀 Digital Ocean App Platform Deployment Guide

This guide walks you through deploying Parking in a Pinch to production using Digital Ocean App Platform (the easiest option).

## 📋 Prerequisites

1. **GitHub Account** and repository
2. **Digital Ocean Account** 
3. **Stripe account** with production keys
4. **Google Maps API** key
5. **Email service** (Gmail SMTP or similar)

## 🛠️ Quick Deployment Steps

### Step 1: Push Code to GitHub
```bash
# Make sure all changes are committed
git add .
git commit -m "Ready for production deployment"

# Push to GitHub
git push origin main
```

### Step 2: Create Digital Ocean App
1. Go to [Digital Ocean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Choose "GitHub" as source
4. Select your repository: `parking-in-a-pinch`
5. Choose branch: `main`
6. Enable "Autodeploy"

### Step 3: Use App Spec File
Upload the provided `.do/app.yaml` file or configure manually:
- **Backend**: Python service in `/backend` directory
- **Frontend**: Node.js service in `/frontend` directory  
- **Database**: PostgreSQL managed database
- **Redis**: Redis managed service

### Step 4: Configure Environment Variables
```bash
# Edit backend environment file
nano backend/.env

# Update these critical values:
SECRET_KEY=your-super-secret-key-here-change-this
DB_PASSWORD=your-secure-database-password
STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Step 5: Configure Frontend Environment
```bash
# Edit frontend environment file
nano frontend/.env.production.local

# Update these values:
VITE_API_BASE_URL=https://yourdomain.com/api
VITE_GOOGLE_MAPS_API_KEY=your_production_google_maps_api_key
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_publishable_key
```

### Step 6: Setup SSL Certificate
```bash
# Edit the SSL setup script with your domain
nano deploy/setup-ssl.sh

# Update DOMAIN and EMAIL variables, then run:
./deploy/setup-ssl.sh
```

### Step 7: Final Steps
```bash
# Restart services to apply new configurations
sudo systemctl restart parking-app
sudo systemctl restart nginx

# Check service status
sudo systemctl status parking-app
sudo systemctl status nginx
```

## 🔧 Manual Configuration Steps

### Database Setup
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Run the database setup
\i /var/www/parking-app/deploy/setup-database.sql

# Exit PostgreSQL
\q
```

### Domain Configuration
1. **Point your domain to server IP** in your DNS provider
2. **Update Nginx config** with your actual domain:
   ```bash
   sudo nano /etc/nginx/sites-available/parking-app
   # Replace all instances of "yourdomain.com" with your domain
   ```

### SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## 📁 Directory Structure in Production
```
/var/www/parking-app/
├── backend/
│   ├── venv/              # Python virtual environment
│   ├── .env               # Environment variables
│   ├── staticfiles/       # Collected static files
│   ├── media/             # User uploads
│   └── manage.py
├── frontend/
│   ├── dist/              # Built React app
│   └── node_modules/
└── deploy/
    ├── nginx.conf
    ├── gunicorn.conf.py
    └── *.service files
```

## 🚦 Service Management

### Check Service Status
```bash
# Check all services
sudo systemctl status parking-app
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis-server

# View logs
sudo journalctl -u parking-app -f
sudo tail -f /var/log/parking-app/gunicorn-error.log
```

### Restart Services
```bash
# Restart application
sudo systemctl restart parking-app

# Restart web server
sudo systemctl restart nginx

# Reload configuration without stopping
sudo systemctl reload nginx
```

## 🔄 Updating the Application

### Deploy New Version
```bash
cd /var/www/parking-app

# Pull latest changes
git pull origin main

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements-production.txt
python manage.py migrate --settings=config.settings.production
python manage.py collectstatic --noinput --settings=config.settings.production
deactivate

# Update frontend
cd ../frontend
npm install
npm run build

# Restart services
sudo systemctl restart parking-app
sudo systemctl reload nginx
```

## 🛡️ Security Checklist

- [ ] **Change default passwords** (database, admin user)
- [ ] **Configure firewall** (UFW)
- [ ] **Setup fail2ban** for SSH protection
- [ ] **Regular backups** configured
- [ ] **SSL certificate** installed and auto-renewing
- [ ] **Security headers** enabled in Nginx
- [ ] **Environment variables** secured
- [ ] **Database access** restricted

## 📊 Monitoring

### Log Locations
- **Application logs**: `/var/log/parking-app/`
- **Nginx logs**: `/var/log/nginx/`
- **System logs**: `journalctl -u parking-app`

### Health Checks
```bash
# Check if application is responding
curl -I https://yourdomain.com

# Check API health
curl https://yourdomain.com/api/v1/health/

# Check database connection
sudo -u postgres psql -d parking_production -c "SELECT 1;"
```

## 🔥 Troubleshooting

### Common Issues

**503 Service Unavailable**
```bash
# Check if Gunicorn is running
sudo systemctl status parking-app

# Check Gunicorn logs
sudo journalctl -u parking-app -f
```

**Static files not loading**
```bash
# Recollect static files
cd /var/www/parking-app/backend
source venv/bin/activate
python manage.py collectstatic --noinput --settings=config.settings.production

# Check Nginx configuration
sudo nginx -t
```

**Database connection errors**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d parking_production
```

## 🎯 Performance Optimization

### Enable Gzip Compression
Already configured in Nginx config for:
- HTML, CSS, JavaScript
- JSON API responses
- Font files

### Database Optimization
```sql
-- Run these queries to optimize PostgreSQL
VACUUM ANALYZE;
REINDEX DATABASE parking_production;
```

### Monitoring Setup
Consider adding:
- **Sentry** for error tracking
- **Google Analytics** for user analytics
- **Uptime monitoring** service

## 💰 Cost Optimization

**DigitalOcean Droplet Sizing:**
- **$12/month (2GB RAM)**: Good for testing/small traffic
- **$24/month (4GB RAM)**: Recommended for production
- **$48/month (8GB RAM)**: High traffic applications

**Additional Services:**
- **Managed Database**: +$15/month (optional)
- **Backups**: +20% of droplet cost
- **Load Balancer**: +$20/month (for high availability)

## 🎉 Go Live Checklist

- [ ] Domain points to server
- [ ] SSL certificate installed
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Static files collected
- [ ] Services running and enabled
- [ ] Firewall configured
- [ ] Backups scheduled
- [ ] Monitoring configured
- [ ] Admin user created
- [ ] Stripe webhooks configured
- [ ] Email sending tested

Your Parking in a Pinch application should now be live at `https://yourdomain.com`! 🎊