# Admin API Endpoints Analysis

## Summary of Findings

After searching through the Django backend codebase, here's the status of the admin API endpoints that the frontend is trying to access:

### 1. `/api/v1/users/admin/stats/` ✅ EXISTS

**Location**: `/backend/apps/users/urls.py` (line 234)
**Function**: `admin_users_stats`
**Path Pattern**: `path('admin/users/stats/', admin_users_stats, name='admin-users-stats')`
**Full URL**: `/api/v1/users/admin/users/stats/`

**Note**: The frontend is calling `/api/v1/users/admin/stats/` but the actual endpoint is `/api/v1/users/admin/users/stats/`

**Returns**:
```json
{
  "total_users": number,
  "active_users": number,
  "verified_users": number,
  "recent_signups": number,
  "monthly_signups": number
}
```

### 2. `/api/v1/payments/admin/payout-requests/stats/` ✅ EXISTS

**Location**: `/backend/apps/payments/urls.py` (line 89)
**Function**: `admin_payout_stats`
**Path Pattern**: `path('admin/payout-requests/stats/', admin_payout_stats, name='admin-payout-stats')`
**Full URL**: `/api/v1/payments/admin/payout-requests/stats/`

**Returns**:
```json
{
  "pending_requests": number,
  "total_requests": number,
  "approved_requests": number,
  "rejected_requests": number,
  "completed_requests": number,
  "total_requested_amount": number,
  "total_pending_amount": number
}
```

### 3. `/api/v1/careers/applications/stats/` ✅ EXISTS

**Location**: `/backend/apps/careers/views.py` (line 74-89)
**ViewSet Action**: `JobApplicationViewSet.stats`
**Path Pattern**: Through DRF router as `@action(detail=False, methods=['get'])`
**Full URL**: `/api/v1/careers/applications/stats/`

**Returns**:
```json
{
  "total": number,
  "new": number,
  "reviewing": number,
  "interview": number,
  "hired": number,
  "rejected": number
}
```

## Additional Admin Endpoints Found

### Users App
- `/api/v1/users/admin/verification-requests/stats/` - Verification request statistics
- `/api/v1/users/dashboard-stats-bypass/` - Alternative dashboard stats endpoint
- `/api/v1/users/dashboard-test-data/` - Test endpoint (no auth required)

### Payments App
- `/api/v1/payments/admin/refund-requests/stats/` - Refund request statistics
- `/api/v1/payments/admin/dashboard/` - Refund dashboard

### Admin Dashboard App
- `/api/v1/admin/dashboard-stats/` - Main dashboard statistics
- `/api/v1/admin/disputes/` - Disputes administration
- `/api/v1/admin/auth-debug/` - Authentication debugging

## Frontend Issues to Fix

1. **User Stats Endpoint**: The frontend is calling `/api/v1/users/admin/stats/` but should call `/api/v1/users/admin/users/stats/`

2. **Authentication**: All admin endpoints are protected and require authentication. The frontend needs to ensure:
   - Proper authentication tokens are sent with requests
   - User has admin privileges (is_staff or is_superuser)

3. **Error Handling**: The endpoints return 403 for unauthorized access and 500 for server errors. Frontend should handle these appropriately.

## Recommendations

1. Update the frontend to use the correct user stats endpoint URL
2. Ensure all admin API calls include proper authentication headers
3. Consider using the `/api/v1/admin/dashboard-stats/` endpoint for consolidated dashboard data
4. Test authentication flow using `/api/v1/admin/auth-debug/` endpoint for troubleshooting