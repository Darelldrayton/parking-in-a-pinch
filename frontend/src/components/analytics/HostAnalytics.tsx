import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  alpha,
  Stack,
  Chip,
  LinearProgress,
  Avatar,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  Schedule,
  Star,
  LocationOn,
  CalendarToday,
  People,
  BarChart,
  PieChart,
} from '@mui/icons-material';

interface AnalyticsData {
  totalEarnings: number;
  monthlyEarnings: number;
  totalBookings: number;
  monthlyBookings: number;
  averageRating: number;
  occupancyRate: number;
  topPerformingListing: string;
  recentTrends: {
    earnings: { value: number; change: number; trend: 'up' | 'down' };
    bookings: { value: number; change: number; trend: 'up' | 'down' };
    rating: { value: number; change: number; trend: 'up' | 'down' };
  };
}

interface HostAnalyticsProps {
  timeRange?: '7d' | '30d' | '90d' | '1y';
  onTimeRangeChange?: (range: '7d' | '30d' | '90d' | '1y') => void;
  analyticsData?: AnalyticsData;
  topListings?: any[];
  recentBookings?: any[];
}

const HostAnalytics: React.FC<HostAnalyticsProps> = ({
  timeRange = '30d',
  onTimeRangeChange,
  analyticsData: propAnalyticsData,
  topListings: propTopListings = [],
  recentBookings: propRecentBookings = [],
}) => {
  const theme = useTheme();
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  
  // Use provided data or fallback to empty/zero values
  const analyticsData = propAnalyticsData || {
    totalEarnings: 0,
    monthlyEarnings: 0,
    totalBookings: 0,
    monthlyBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
    topPerformingListing: 'No listings yet',
    recentTrends: {
      earnings: { value: 0, change: 0, trend: 'up' as const },
      bookings: { value: 0, change: 0, trend: 'up' as const },
      rating: { value: 0, change: 0, trend: 'up' as const },
    },
  };

  const handleTimeRangeChange = (newRange: '7d' | '30d' | '90d' | '1y') => {
    setSelectedTimeRange(newRange);
    if (onTimeRangeChange) {
      onTimeRangeChange(newRange);
    }
    // Here you would typically fetch new data based on the selected range
    console.log('Fetching analytics for range:', newRange);
  };

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days';
      case '30d': return 'Last 30 Days';
      case '90d': return 'Last 3 Months';
      case '1y': return 'Last Year';
      default: return 'Last 30 Days';
    }
  };

  const metrics = [
    {
      title: 'Total Earnings',
      value: `$${analyticsData.totalEarnings}`,
      change: analyticsData.recentTrends.earnings.change,
      trend: analyticsData.recentTrends.earnings.trend,
      icon: AttachMoney,
      color: 'success',
      subtitle: `$${analyticsData.monthlyEarnings} this period`,
    },
    {
      title: 'Total Bookings',
      value: analyticsData.totalBookings.toString(),
      change: analyticsData.recentTrends.bookings.change,
      trend: analyticsData.recentTrends.bookings.trend,
      icon: Schedule,
      color: 'primary',
      subtitle: `${analyticsData.monthlyBookings} this period`,
    },
    {
      title: 'Average Rating',
      value: analyticsData.averageRating.toFixed(1),
      change: analyticsData.recentTrends.rating.change,
      trend: analyticsData.recentTrends.rating.trend,
      icon: Star,
      color: 'warning',
      subtitle: 'Based on all reviews',
    },
    {
      title: 'Occupancy Rate',
      value: `${analyticsData.occupancyRate}%`,
      change: 8,
      trend: 'up' as const,
      icon: BarChart,
      color: 'info',
      subtitle: 'Time booked vs available',
    },
  ];

  const topListings = propTopListings.length > 0 ? propTopListings : [
    { name: 'No listings created yet', earnings: 0, bookings: 0, rating: 0 }
  ];

  const recentBookings = propRecentBookings.length > 0 ? propRecentBookings : [];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom color="text.primary">
            Analytics Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Track your parking space performance and earnings
          </Typography>
        </Box>
        
        <FormControl sx={{ minWidth: 160 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={selectedTimeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value as any)}
            label="Time Range"
            size="small"
          >
            <MenuItem value="7d">Last 7 Days</MenuItem>
            <MenuItem value="30d">Last 30 Days</MenuItem>
            <MenuItem value="90d">Last 3 Months</MenuItem>
            <MenuItem value="1y">Last Year</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metrics.map((metric, index) => (
          <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={metric.title}>
            <Card
              sx={{
                borderRadius: 3,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      {metric.title}
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ my: 1 }} color="text.primary">
                      {metric.value}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {metric.trend === 'up' ? (
                        <TrendingUp sx={{ fontSize: 16, color: 'success.main' }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: 'error.main' }} />
                      )}
                      <Typography
                        variant="caption"
                        color={metric.trend === 'up' ? 'success.main' : 'error.main'}
                        fontWeight={600}
                      >
                        {metric.change}%
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      {metric.subtitle}
                    </Typography>
                  </Box>
                  
                  <Avatar
                    sx={{
                      bgcolor: alpha(theme.palette[metric.color as keyof typeof theme.palette].main, 0.1),
                      color: `${metric.color}.main`,
                      width: 48,
                      height: 48,
                    }}
                  >
                    <metric.icon />
                  </Avatar>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, lg: 12 }}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom color="text.primary">
                Quick Insights
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {getTimeRangeLabel(selectedTimeRange)}
              </Typography>
              
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <People sx={{ fontSize: 20, color: 'primary.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Unique Renters
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                      {analyticsData.totalBookings > 0 ? Math.max(1, Math.floor(analyticsData.totalBookings * 0.8)) : 0}
                    </Typography>
                    <Typography variant="caption" color={analyticsData.totalBookings > 0 ? "success.main" : "text.secondary"}>
                      {analyticsData.totalBookings > 0 ? "Growing customer base" : "Start hosting to see stats"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <CalendarToday sx={{ fontSize: 20, color: 'warning.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        Active Listings
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                      {topListings.filter(l => l.earnings > 0).length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {topListings.length > 0 && topListings[0].earnings > 0 ? "Earning spaces" : "Create your first listing"}
                    </Typography>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <PieChart sx={{ fontSize: 20, color: 'info.main' }} />
                      <Typography variant="subtitle2" fontWeight={600} color="text.primary">
                        This Month
                      </Typography>
                    </Stack>
                    <Typography variant="h5" fontWeight={700} color="text.primary">
                      {analyticsData.monthlyBookings}
                    </Typography>
                    <Typography variant="caption" color={analyticsData.monthlyBookings > 0 ? "success.main" : "text.secondary"}>
                      {analyticsData.monthlyBookings > 0 ? "Bookings completed" : "No bookings yet"}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Bookings */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pb: 2 }}>
            <Typography variant="h6" fontWeight={600} color="text.primary">
              Recent Bookings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest completed reservations
            </Typography>
          </Box>
          <Divider />
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Renter</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Listing</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {(booking.user?.first_name || booking.renter || 'U').charAt(0)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={500}>
                            {booking.user ? `${booking.user.first_name} ${booking.user.last_name}` : booking.renter || 'Unknown User'}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.parking_space?.title || booking.listing || 'Unknown Listing'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {booking.created_at ? new Date(booking.created_at).toLocaleDateString() : booking.date}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          ${(booking.total_amount || booking.amount || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={booking.status?.toLowerCase() || 'completed'}
                          size="small"
                          color={booking.status === 'COMPLETED' ? 'success' : 'default'}
                          sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        {analyticsData.totalBookings === 0 ? 'No bookings yet. Create a listing to start earning!' : 'No recent bookings to display.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
};

export default HostAnalytics;