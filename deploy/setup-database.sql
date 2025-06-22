-- PostgreSQL database setup for production
-- Run this as the postgres user: sudo -u postgres psql

-- Create database user
CREATE USER parking_user WITH PASSWORD 'your-secure-password-here';

-- Create database
CREATE DATABASE parking_production OWNER parking_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE parking_production TO parking_user;

-- Connect to the database
\c parking_production;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO parking_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO parking_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO parking_user;

-- Alter default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO parking_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO parking_user;

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis" SCHEMA public;

-- Show database info
\l
\du