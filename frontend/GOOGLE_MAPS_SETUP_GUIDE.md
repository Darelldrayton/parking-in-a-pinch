# Google Maps API Setup Guide

## Step 1: Get Google Maps API Key

### 1.1 Go to Google Cloud Console
- Visit [Google Cloud Console](https://console.cloud.google.com/)
- Sign in with your Google account

### 1.2 Create or Select Project
- Click "Select a project" dropdown
- Either create a new project or select an existing one
- Give it a name like "Parking-in-a-Pinch"

### 1.3 Enable Required APIs
Navigate to "APIs & Services" > "Library" and enable:
- **Maps JavaScript API** (required)
- **Places API** (for location search)
- **Geocoding API** (for address conversion)

### 1.4 Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key

### 1.5 Secure Your API Key (Important!)
1. Click on your API key to edit it
2. Under "Application restrictions":
   - Select "HTTP referrers (web sites)"
   - Add your domains:
     - `localhost:3002/*` (for development)
     - `yourdomain.com/*` (for production)
3. Under "API restrictions":
   - Select "Restrict key"
   - Choose: Maps JavaScript API, Places API, Geocoding API

## Step 2: Add API Key to Your Project

### 2.1 Update HTML File
In `/frontend/index.html`, replace `YOUR_API_KEY`:

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_API_KEY_HERE&libraries=places,marker&loading=async" defer></script>
```

### 2.2 Environment Variable (Recommended)
Create `/frontend/.env.local`:
```env
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

Then update `index.html`:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=%VITE_GOOGLE_MAPS_API_KEY%&libraries=places,marker&loading=async" defer></script>
```

## Step 3: Billing Setup (Required for Production)

1. Go to "Billing" in Google Cloud Console
2. Link a payment method
3. Google Maps offers $200/month free credit
4. For typical usage, this covers most small to medium applications

## Step 4: Testing

1. Replace the API key in your code
2. Refresh your application
3. The map should now load properly
4. Check browser console for any remaining errors

## Troubleshooting

### Common Issues:

**"This page can't load Google Maps correctly"**
- API key is invalid or not set
- Billing not enabled
- Wrong APIs enabled

**"RefererNotAllowedMapError"**
- Add your domain to HTTP referrers in API key restrictions

**Map shows but markers don't appear**
- Check if Places API is enabled
- Verify marker library is loaded

**"For development purposes only" watermark**
- Billing not set up (map still works for testing)

### Rate Limits:
- Maps JavaScript API: 25,000 map loads per day (free)
- Places API: $17 per 1000 requests after free tier
- Geocoding API: $5 per 1000 requests after free tier

## Security Best Practices

1. **Always restrict your API key** to specific domains
2. **Enable only required APIs** to minimize attack surface
3. **Monitor usage** in Google Cloud Console
4. **Use environment variables** for API keys, never commit them to Git
5. **Set up alerts** for unusual usage spikes

## Integration with Backend

Consider implementing server-side geocoding for better security:

```python
# Django backend example
import googlemaps

def get_parking_locations():
    gmaps = googlemaps.Client(key=settings.GOOGLE_MAPS_API_KEY)
    # Process locations server-side
    return processed_locations
```

This keeps your API key secure on the server side.