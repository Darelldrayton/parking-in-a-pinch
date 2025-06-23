# 🧹 Clear Test Listings - Easy Method

## Option 1: Use Django Admin (Recommended)

1. **Go to Django Admin:**
   - Visit: `http://165.227.111.160/admin/`
   - Login: `admin@test.com` / `admin123`

2. **Delete Test Listings:**
   - Click "Parking listings" 
   - Select all listings (checkbox at top)
   - Choose "Delete selected parking listings" from dropdown
   - Click "Go"
   - Confirm deletion

3. **Delete Related Data:**
   - Go to "Bookings" → Select all → Delete
   - Go to "Payments" → Select all → Delete  
   - Go to "Reviews" → Select all → Delete

## Option 2: Use React Admin Dashboard

1. **Go to React Admin:**
   - Visit: `http://165.227.111.160/ruler/login`
   - Login: `admin@test.com` / `admin123`

2. **Navigate to listings management and delete test data**

## Option 3: Quick API Method (Advanced)

**Test this in your browser console (F12):**

```javascript
// Get all listings
fetch('http://165.227.111.160/api/v1/listings/')
  .then(r => r.json())
  .then(data => {
    console.log(`Found ${data.results.length} listings to delete:`);
    data.results.forEach(listing => {
      console.log(`- "${listing.title}" by ${listing.host_email}`);
    });
  });
```

**After reviewing, use the Django admin method - it's the safest!**

## ✅ Expected Result:
- All test listings removed
- All test bookings/payments cleared  
- Admin account preserved
- Fresh clean site ready for real users!