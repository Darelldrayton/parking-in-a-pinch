"""
Emergency Mobile Fix Settings
Apply these settings to fix mobile login issues
"""

from .base import *
import os

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = False

# Production allowed hosts
ALLOWED_HOSTS = [
    '165.227.111.160',
    'parkinginapinch.com',
    'www.parkinginapinch.com',
    'pinchparking.com',
    'www.pinchparking.com',
    'localhost',
    '127.0.0.1',
]

# CORS settings for mobile fix
CORS_ALLOWED_ORIGINS = [
    "http://165.227.111.160",
    "https://parkinginapinch.com",
    "https://www.parkinginapinch.com",
    "https://pinchparking.com",
    "https://www.pinchparking.com",
]

CORS_ALLOW_ALL_ORIGINS = True  # Emergency setting for mobile compatibility

# Additional mobile-specific settings
SECURE_CROSS_ORIGIN_OPENER_POLICY = None
SECURE_REFERRER_POLICY = "no-referrer-when-downgrade"

# Session settings for mobile
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SAMESITE = 'Lax'
