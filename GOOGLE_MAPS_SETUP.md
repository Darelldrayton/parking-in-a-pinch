# Google Maps API Setup Guide

## Overview
This application uses Google Maps for displaying parking locations, address geocoding, and location picking functionality.

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Navigate to "APIs & Services" → "Library"
4. Enable these required APIs:
   - **Maps JavaScript API** (for map display)
   - **Places API** (for address autocomplete)
   - **Geocoding API** (for address to coordinates conversion)

5. Go to "APIs & Services" → "Credentials"
6. Click "Create Credentials" → "API Key"
7. Copy your API key

### 2. Secure Your API Key (Important!)

1. Click on your API key in the credentials page
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your allowed domains:
     ```
     http://localhost:*
     https://localhost:*
     http://127.0.0.1:*
     https://your-production-domain.com/*
     https://*.vercel.app/*
     ```

3. Under "API restrictions":
   - Select "Restrict key"
   - Select only the APIs you enabled:
     - Maps JavaScript API
     - Places API
     - Geocoding API

### 3. Add API Key to Your Project

1. Open `frontend/.env` (or create it if it doesn't exist)
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:
   ```
   VITE_GOOGLE_MAPS_API_KEY=your-actual-api-key-here
   ```

3. Restart your development server:
   ```bash
   cd frontend
   npm run dev
   ```

## Where Google Maps is Used

1. **Listing Creation** (`/create-listing`)
   - Address autocomplete
   - Location picker on map
   - Geocoding addresses to coordinates

2. **Listing Detail** (`/listings/:id`)
   - Display parking location on map
   - Show nearby landmarks

3. **Booking Detail** (`/booking/:id`)
   - Show exact location after check-in
   - Navigation button to get directions

4. **Search/Browse** (`/listings`)
   - Map view of all available parking spaces
   - Filter by location radius

## Troubleshooting

### "Google Maps JavaScript API error: InvalidKeyMapError"
- Your API key is invalid or not properly configured
- Check that the key is correctly copied in `.env`
- Ensure the Maps JavaScript API is enabled

### "Google Maps JavaScript API error: RefererNotAllowedMapError"
- Your domain is not in the allowed referrers list
- Add your domain to the API key restrictions

### Maps not loading
1. Check browser console for errors
2. Verify `.env` file is in the `frontend` directory
3. Restart the development server after adding the key
4. Clear browser cache

### Billing
- Google Maps offers $200 free credit monthly
- For most small applications, this is sufficient
- Enable billing but set up budget alerts to avoid surprises

## Security Notes

- **NEVER** commit your API key to git
- The `.env` file is already in `.gitignore`
- Use different API keys for development and production
- Always restrict your API keys by domain and API

## Need Help?

- [Google Maps Platform Documentation](https://developers.google.com/maps/documentation)
- [API Key Best Practices](https://developers.google.com/maps/api-security-best-practices)