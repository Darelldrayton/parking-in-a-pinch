# Mobile-friendly Django settings - Add these to your production.py

# Updated ALLOWED_HOSTS to include your IP
ALLOWED_HOSTS = [
    '165.227.111.160',
    'parkinginapinch.com',
    'www.parkinginapinch.com',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',  # For mobile testing
]

# Mobile-friendly CORS settings
CORS_ALLOWED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com",
    "https://www.parkinginapinch.com",
]

# Allow all origins for mobile development (remove in production)
CORS_ALLOW_ALL_ORIGINS = True

# CORS headers for mobile
CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_CREDENTIALS = True

# Trusted origins for CSRF
CSRF_TRUSTED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com",
    "https://www.parkinginapinch.com",
]

# Mobile-friendly security settings (less restrictive for HTTP)
SECURE_SSL_REDIRECT = False  # Allow HTTP for IP access
SESSION_COOKIE_SECURE = False  # Allow cookies over HTTP
CSRF_COOKIE_SECURE = False  # Allow CSRF cookies over HTTP
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

# Session settings for mobile
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'  # Less restrictive than 'Strict'
CSRF_COOKIE_SAMESITE = 'Lax'

# Additional settings for mobile compatibility
SECURE_REFERRER_POLICY = "strict-origin-when-cross-origin"

# Allow frames for mobile apps (if needed)
X_FRAME_OPTIONS = 'SAMEORIGIN'