# Admin Dashboard API Requirements

The admin dashboard is now fully functional and connected to real APIs. For complete functionality, ensure these backend endpoints exist and return real database data:

## Required API Endpoints

### 1. Dashboard Statistics (Priority: HIGH)
```
GET /api/v1/admin/dashboard-stats/
Returns: Consolidated statistics for all dashboard cards
```

OR individual endpoints:
```
GET /api/v1/users/admin/users/stats/
GET /api/v1/users/admin/verification-requests/stats/
GET /api/v1/listings/admin/stats/
GET /api/v1/payments/admin/refund-requests/stats/
GET /api/v1/disputes/admin/stats/
```

Expected response format:
```json
{
  "users": {
    "total_users": 127,
    "verified_users": 89,
    "recent_signups": 12
  },
  "verifications": {
    "pending_requests": 3,
    "total_requests": 45
  },
  "listings": {
    "pending_listings": 5,
    "total_listings": 78,
    "approved_listings": 73
  },
  "refunds": {
    "pending_requests": 2,
    "total_requests": 18,
    "total_requested_amount": 450.75
  },
  "disputes": {
    "open_disputes": 1,
    "total_disputes": 7,
    "unassigned_disputes": 0
  }
}
```

### 2. Identity Verification Management
```
GET /api/v1/users/admin/verification-requests/
POST /api/v1/users/admin/verification-requests/{id}/approve/
POST /api/v1/users/admin/verification-requests/{id}/reject/
```

### 3. Refund Management
```
GET /api/v1/payments/admin/refund-requests/
POST /api/v1/payments/admin/refund-requests/{id}/approve/
POST /api/v1/payments/admin/refund-requests/{id}/reject/
```

### 4. Listing Management
```
GET /api/v1/listings/admin/
POST /api/v1/listings/admin/{id}/approve/
POST /api/v1/listings/admin/{id}/reject/
POST /api/v1/listings/admin/{id}/request_revision/
PATCH /api/v1/listings/admin/{id}/
```

### 5. User Management
```
POST /api/v1/users/admin/{userId}/suspend/
POST /api/v1/users/admin/{userId}/activate/
```

### 6. Dispute Management
```
GET /api/v1/disputes/admin/
POST /api/v1/disputes/admin/{id}/add_admin_message/
POST /api/v1/disputes/admin/{id}/update_status/
```

### 7. Booking Search
```
GET /api/v1/bookings/admin/search-api/?q={query}
```

## Database Queries Needed

### Users Table
```sql
-- Total users
SELECT COUNT(*) as total_users FROM users;

-- Verified users
SELECT COUNT(*) as verified_users FROM users WHERE is_verified = true;

-- Recent signups (last 7 days)
SELECT COUNT(*) as recent_signups FROM users 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY);
```

### Verification Requests
```sql
-- Pending verifications
SELECT COUNT(*) as pending_requests FROM user_verifications 
WHERE status = 'PENDING';

-- Total verification requests
SELECT COUNT(*) as total_requests FROM user_verifications;
```

### Listings
```sql
-- Pending listings
SELECT COUNT(*) as pending_listings FROM listings 
WHERE approval_status = 'PENDING';

-- Total listings
SELECT COUNT(*) as total_listings FROM listings;

-- Approved listings
SELECT COUNT(*) as approved_listings FROM listings 
WHERE approval_status = 'APPROVED';
```

### Refunds
```sql
-- Pending refunds
SELECT COUNT(*) as pending_requests FROM refund_requests 
WHERE status = 'pending';

-- Total refund amount
SELECT SUM(requested_amount) as total_requested_amount 
FROM refund_requests WHERE status = 'pending';
```

### Disputes
```sql
-- Open disputes
SELECT COUNT(*) as open_disputes FROM disputes 
WHERE status = 'OPEN';

-- Total disputes
SELECT COUNT(*) as total_disputes FROM disputes;
```

## Current Status

✅ **Frontend**: Fully functional, connected to real APIs
✅ **Demo Data**: Completely removed
✅ **Action Buttons**: All working with real API calls
✅ **Tab Navigation**: Functional with data fetching
✅ **Booking Search**: Real-time search implemented
✅ **User Management**: Suspend/activate functionality
✅ **Error Handling**: Graceful handling of API failures

❗ **Backend**: Ensure above API endpoints exist and return real database data

## Testing

1. Check that all API endpoints return 200 status
2. Verify data comes from actual database tables
3. Test action buttons (approve/reject) with real records
4. Confirm search returns actual booking results
5. Validate user management actions work on real users

When all APIs are implemented, the dashboard will show the true state of your parking business with real data from your database.