# Add these to your production.py settings file

# Allow both IP and domain
ALLOWED_HOSTS = [
    '165.227.111.160',
    'parkinginapinch.com',
    'www.parkinginapinch.com',
    'localhost',
]

# CORS settings for both
CORS_ALLOWED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com",
    "https://www.parkinginapinch.com",
]

# Also add to trusted origins for CSRF
CSRF_TRUSTED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com", 
    "https://www.parkinginapinch.com",
]

# Session cookie settings
SESSION_COOKIE_SECURE = False  # Set to True when using HTTPS only
CSRF_COOKIE_SECURE = False     # Set to True when using HTTPS only