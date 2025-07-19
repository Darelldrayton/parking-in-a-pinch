# Media Files Fix - Profile Images Not Displaying

## Problem Identified

Profile images are not displaying because nginx is not properly serving `/media/` files. Instead of returning image files, the server returns HTML (the frontend app).

## Root Cause

The nginx configuration has the frontend location (`/`) catching all requests before the media location (`/media/`) can be processed. This is a **location precedence issue**.

## Solution

### 1. Apply Updated Nginx Configuration

The new configuration file `nginx-media-fix.conf` addresses this issue by:

1. **Reordering locations** - Media files are processed BEFORE the frontend catch-all
2. **Adding proper file type handling** - Specific handling for image files
3. **Adding debugging capabilities** - Temporary directory listing for troubleshooting
4. **Adding caching headers** - Better performance for media files
5. **Adding CORS headers** - Ensures images can be loaded from frontend

### 2. Server Deployment Steps

Run these commands on the production server:

```bash
# 1. Backup current nginx config
sudo cp /etc/nginx/sites-available/parkinginapinch /etc/nginx/sites-available/parkinginapinch.backup

# 2. Copy new configuration
sudo cp /var/www/parkinginapinch/nginx-media-fix.conf /etc/nginx/sites-available/parkinginapinch

# 3. Test nginx configuration
sudo nginx -t

# 4. If test passes, reload nginx
sudo systemctl reload nginx

# 5. Check if media directory exists and has correct permissions
sudo ls -la /var/www/parkinginapinch/backend/media/
sudo chown -R www-data:www-data /var/www/parkinginapinch/backend/media/
sudo chmod -R 755 /var/www/parkinginapinch/backend/media/

# 6. Test media file serving
curl -I https://www.parkinginapinch.com/media/profiles/profile_15_4d232ccc.jpg
```

### 3. Django Settings Verification

The Django settings are already correct:

```python
# In config/settings/base.py
MEDIA_URL = '/media/'  ✅
MEDIA_ROOT = BASE_DIR / 'media'  ✅
```

### 4. Troubleshooting

If images still don't load:

1. **Check file permissions:**
   ```bash
   sudo ls -la /var/www/parkinginapinch/backend/media/profiles/
   ```

2. **Check nginx error logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   ```

3. **Test direct file access:**
   ```bash
   # Should return image file, not HTML
   curl -v https://www.parkinginapinch.com/media/profiles/profile_15_4d232ccc.jpg
   ```

4. **Verify media directory structure:**
   ```
   /var/www/parkinginapinch/backend/media/
   └── profiles/
       ├── profile_15_4d232ccc.jpg
       └── profile_15_993c3f97.jpg
   ```

### 5. Frontend Error Handling

The frontend has been updated with error handling to gracefully fallback to user initials when images fail to load. This provides a better user experience while the server issue is being resolved.

## Files Modified

1. `nginx-media-fix.conf` - New nginx configuration with proper media handling
2. `src/components/layout/Navigation.tsx` - Added image error handling
3. `src/pages/Profile.tsx` - Added image error handling for all Avatar components
4. `src/types/auth.ts` - Added `profile_image` field to User interface

## Testing

After applying the nginx fix, test with:

```bash
# Should return image headers, not HTML
curl -I https://www.parkinginapinch.com/media/profiles/profile_15_4d232ccc.jpg

# Should show "Content-Type: image/jpeg"
# Should NOT show "Content-Type: text/html"
```

## Security Notes

The new configuration includes:
- Proper CORS headers for images
- Cache settings for better performance
- File type restrictions for security
- Directory listing (remove `autoindex on;` for production)

Once confirmed working, remove the `autoindex` directives from the configuration for security.