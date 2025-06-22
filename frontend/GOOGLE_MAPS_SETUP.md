# Google Maps API Setup Guide

## Step 1: Get Your API Key

1. Visit: https://console.cloud.google.com/apis/credentials
2. Sign in with your Google account
3. Create a new project or select an existing one
4. Click "Create Credentials" → "API Key"

## Step 2: Enable Required APIs

In the Google Cloud Console, enable these APIs:
- **Maps JavaScript API**
- **Places API** 
- **Geocoding API**

Go to: https://console.cloud.google.com/apis/library

## Step 3: Update Your Environment

Edit the `.env` file in the frontend directory:

```bash
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## Step 4: Restart the Development Server

The server is already running. Once you update the .env file with your API key, the maps will automatically start working!

## Security Tips

- Restrict your API key to specific domains in production
- Never commit your actual API key to version control
- Use environment variables for different environments

## What You'll See

Once configured:
- **Listings Page**: Interactive map with parking locations
- **Create Listing**: Click-to-select location picker
- **Real-time geocoding**: Address to coordinates conversion