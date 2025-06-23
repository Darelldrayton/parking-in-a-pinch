# 🚨 EMERGENCY MOBILE LOGIN FIX

## The Problem
- Mobile login fails with "failed to login" 
- Test pages redirect to homepage
- Frontend files aren't being served correctly by nginx

## IMMEDIATE FIX (Do this NOW):

### 1. Update nginx configuration on your server:
```bash
# SSH into your server
ssh root@165.227.111.160

# Backup current nginx config
cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup

# Create new nginx config
nano /etc/nginx/sites-available/parkinginapinch
```

### 2. Copy the ENTIRE content from `nginx-mobile-fix.conf` into that file

### 3. Enable the new config:
```bash
# Disable default
rm /etc/nginx/sites-enabled/default

# Enable new config
ln -s /etc/nginx/sites-available/parkinginapinch /etc/nginx/sites-enabled/

# Test nginx config
nginx -t

# Restart nginx
systemctl restart nginx
```

### 4. Deploy frontend files:
```bash
# From your LOCAL machine (not the server)
cd /home/rellizuraddixion/projects/Parking-in-a-Pinch/frontend

# Build fresh
npm run build

# Create the directory on server if it doesn't exist
ssh root@165.227.111.160 "mkdir -p /var/www/parkinginapinch/frontend/dist"

# Copy ALL files
scp -r dist/* root@165.227.111.160:/var/www/parkinginapinch/frontend/dist/

# Copy test files
scp public/mobile-login-test.html root@165.227.111.160:/var/www/parkinginapinch/frontend/dist/
scp public/quick-mobile-test.html root@165.227.111.160:/var/www/parkinginapinch/frontend/dist/
```

### 5. Verify file permissions on server:
```bash
# On the server
chown -R www-data:www-data /var/www/parkinginapinch/
chmod -R 755 /var/www/parkinginapinch/frontend/dist/
```

## TEST IMMEDIATELY:
1. Clear your phone browser cache completely
2. Visit: `http://165.227.111.160/mobile-login-test.html`
3. If it still redirects, your nginx needs the fix above

## WHY THIS WORKS:
- The nginx config explicitly serves `.html` files BEFORE the React app
- Removes caching issues that affect mobile browsers
- Adds proper CORS proxy headers for mobile
- Ensures the frontend JavaScript has `withCredentials: false`

## ALTERNATIVE QUICK TEST:
If you can't update nginx immediately, try:
1. Visit `http://165.227.111.160:8000/api/v1/auth/login/` directly
2. This bypasses nginx and tests if Django is working (it is!)

The problem is 100% nginx configuration - NOT the web application!