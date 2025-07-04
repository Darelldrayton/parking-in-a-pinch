# CRITICAL MOBILE LOGIN FIX - Add these to your production.py

# CORS Settings - Very permissive for mobile compatibility
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com",
    "https://www.parkinginapinch.com",
    "http://localhost:3000",
    "http://localhost:5173",
]

# Allow all common headers
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
    'cache-control',
    'x-forwarded-for',
    'x-forwarded-proto',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Expose headers for mobile apps
CORS_EXPOSE_HEADERS = [
    'content-type',
    'x-csrftoken',
]

# CSRF Settings - More permissive for mobile
CSRF_TRUSTED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com",
    "https://www.parkinginapinch.com",
]

# Disable CSRF for API endpoints (use token auth instead)
CSRF_COOKIE_SECURE = False
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = None

# Session settings for mobile
SESSION_COOKIE_SECURE = False
SESSION_COOKIE_HTTPONLY = False  
SESSION_COOKIE_SAMESITE = None
SESSION_SAVE_EVERY_REQUEST = True

# Security settings - Less restrictive for HTTP
SECURE_SSL_REDIRECT = False
SECURE_PROXY_SSL_HEADER = None

# Allow hosts
ALLOWED_HOSTS = [
    '165.227.111.160',
    'parkinginapinch.com',
    'www.parkinginapinch.com',
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '*',  # Very permissive for testing
]

# DRF Settings for mobile compatibility - AUTHENTICATION DISABLED FOR ADMIN DASHBOARD
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        # TEMPORARILY DISABLED FOR ADMIN DASHBOARD ACCESS
        # 'rest_framework.authentication.TokenAuthentication',
        # 'rest_framework_simplejwt.authentication.JWTAuthentication',
        # 'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # CHANGED: Allow access to all endpoints
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'EXCEPTION_HANDLER': 'rest_framework.views.exception_handler',
}

# JWT Settings
from datetime import timedelta
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=24),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# Disable some middleware that can cause mobile issues
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
    # 'django.middleware.csrf.CsrfViewMiddleware',  # Disabled for API
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    # 'django.middleware.clickjacking.XFrameOptionsMiddleware',  # Disabled for mobile
]