import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Chip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  alpha,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  DirectionsCar,
  AttachMoney,
  Schedule,
  LocationOn,
  CalendarToday,
  Insights,
  PieChart,
  BarChart,
  Star,
  Eco,
  LocalGasStation,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';

interface BookingAnalytics {
  total_bookings: number;
  total_spent: number;
  total_hours_parked: number;
  average_booking_duration: number;
  average_hourly_rate: number;
  favorite_locations: LocationStats[];
  monthly_spending: MonthlyData[];
  space_type_distribution: SpaceTypeData[];
  time_of_day_distribution: TimeOfDayData[];
  parking_patterns: ParkingPattern[];
  cost_savings: CostSavings;
  environmental_impact: EnvironmentalImpact;
  recommendations: Recommendation[];
}

interface LocationStats {
  address: string;
  bookings_count: number;
  total_spent: number;
  average_rating: number;
  last_booking: string;
}

interface MonthlyData {
  month: string;
  spending: number;
  bookings: number;
  hours: number;
}

interface SpaceTypeData {
  name: string;
  value: number;
  color: string;
}

interface TimeOfDayData {
  hour: number;
  bookings: number;
}

interface ParkingPattern {
  pattern: string;
  frequency: number;
  description: string;
  savings_potential: number;
}

interface CostSavings {
  vs_street_parking: number;
  vs_parking_meters: number;
  vs_parking_garages: number;
  total_saved: number;
}

interface EnvironmentalImpact {
  reduced_driving_time: number; // minutes
  co2_saved: number; // kg
  fuel_saved: number; // gallons
  walking_distance: number; // km
}

interface Recommendation {
  type: 'cost_saving' | 'time_saving' | 'convenience' | 'environmental';
  title: string;
  description: string;
  potential_savings: number;
  icon: React.ReactNode;
}

const BookingHistoryAnalytics: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('12_months');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/analytics/booking-history/?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Mock data for demonstration
        setAnalytics(generateMockAnalytics());
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(generateMockAnalytics());
    } finally {
      setLoading(false);
    }
  };

  const generateMockAnalytics = (): BookingAnalytics => {
    const monthlyData = [
      { month: 'Jan', spending: 85, bookings: 12, hours: 28 },
      { month: 'Feb', spending: 92, bookings: 14, hours: 32 },
      { month: 'Mar', spending: 78, bookings: 11, hours: 25 },
      { month: 'Apr', spending: 105, bookings: 16, hours: 38 },
      { month: 'May', spending: 118, bookings: 18, hours: 42 },
      { month: 'Jun', spending: 132, bookings: 21, hours: 48 },
      { month: 'Jul', spending: 145, bookings: 23, hours: 52 },
      { month: 'Aug', spending: 138, bookings: 22, hours: 49 },
      { month: 'Sep', spending: 126, bookings: 19, hours: 45 },
      { month: 'Oct', spending: 112, bookings: 17, hours: 39 },
      { month: 'Nov', spending: 95, bookings: 15, hours: 34 },
      { month: 'Dec', spending: 88, bookings: 13, hours: 31 },
    ];

    const spaceTypes = [
      { name: 'Driveway', value: 45, color: '#3f51b5' },
      { name: 'Garage', value: 25, color: '#4caf50' },
      { name: 'Street', value: 15, color: '#ff9800' },
      { name: 'Parking Lot', value: 15, color: '#f44336' },
    ];

    const timeOfDay = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      bookings: Math.floor(Math.random() * 10) + (i >= 8 && i <= 18 ? 15 : 5),
    }));

    return {
      total_bookings: 201,
      total_spent: 1248.50,
      total_hours_parked: 463,
      average_booking_duration: 2.3,
      average_hourly_rate: 6.20,
      favorite_locations: [
        {
          address: 'Downtown Financial District',
          bookings_count: 45,
          total_spent: 356.80,
          average_rating: 4.7,
          last_booking: '2024-12-10',
        },
        {
          address: 'University District',
          bookings_count: 32,
          total_spent: 198.40,
          average_rating: 4.5,
          last_booking: '2024-12-08',
        },
        {
          address: 'Shopping Center',
          bookings_count: 28,
          total_spent: 168.20,
          average_rating: 4.3,
          last_booking: '2024-12-05',
        },
      ],
      monthly_spending: monthlyData,
      space_type_distribution: spaceTypes,
      time_of_day_distribution: timeOfDay,
      parking_patterns: [
        {
          pattern: 'Weekday Commuter',
          frequency: 78,
          description: 'Regular weekday parking, typically 8-9 hours',
          savings_potential: 45,
        },
        {
          pattern: 'Weekend Shopper',
          frequency: 23,
          description: 'Weekend parking sessions, usually 2-4 hours',
          savings_potential: 15,
        },
        {
          pattern: 'Event Attendee',
          frequency: 12,
          description: 'Evening events, 3-6 hours',
          savings_potential: 25,
        },
      ],
      cost_savings: {
        vs_street_parking: 234.50,
        vs_parking_meters: 189.25,
        vs_parking_garages: 445.75,
        total_saved: 869.50,
      },
      environmental_impact: {
        reduced_driving_time: 347,
        co2_saved: 42.5,
        fuel_saved: 18.2,
        walking_distance: 67.3,
      },
      recommendations: [
        {
          type: 'cost_saving',
          title: 'Try Recurring Bookings',
          description: 'Save 15% on your regular commute parking with weekly subscriptions',
          potential_savings: 18.75,
          icon: <DirectionsCar />,
        },
        {
          type: 'time_saving',
          title: 'Book Earlier for Better Rates',
          description: 'Bookings made 24+ hours in advance are typically 20% cheaper',
          potential_savings: 24.97,
          icon: <Schedule />,
        },
        {
          type: 'environmental',
          title: 'Choose Closer Spots',
          description: 'Parking closer to your destination reduces walking and emissions',
          potential_savings: 0,
          icon: <Eco />,
        },
      ],
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatHours = (hours: number) => {
    if (hours < 1) {
      return `${Math.round(hours * 60)}m`;
    }
    return `${hours.toFixed(1)}h`;
  };

  const getSpendingTrend = () => {
    if (!analytics?.monthly_spending || analytics.monthly_spending.length < 2) return null;
    
    const current = analytics.monthly_spending[analytics.monthly_spending.length - 1].spending;
    const previous = analytics.monthly_spending[analytics.monthly_spending.length - 2].spending;
    const change = ((current - previous) / previous) * 100;
    
    return {
      value: change,
      isIncrease: change > 0,
      label: `${Math.abs(change).toFixed(1)}% ${change > 0 ? 'increase' : 'decrease'} from last month`,
    };
  };

  const spendingTrend = getSpendingTrend();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6">Unable to load analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Please try again later
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Insights sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Your Parking Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Insights into your parking habits and spending
            </Typography>
          </Box>
        </Stack>
        
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Time Range</InputLabel>
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            label="Time Range"
          >
            <MenuItem value="3_months">Last 3 Months</MenuItem>
            <MenuItem value="6_months">Last 6 Months</MenuItem>
            <MenuItem value="12_months">Last 12 Months</MenuItem>
            <MenuItem value="all_time">All Time</MenuItem>
          </Select>
        </FormControl>
      </Stack>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                >
                  <DirectionsCar color="primary" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {analytics.total_bookings}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Bookings
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                  }}
                >
                  <AttachMoney color="success" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(analytics.total_spent)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Spent
                  </Typography>
                  {spendingTrend && (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      {spendingTrend.isIncrease ? (
                        <TrendingUp sx={{ fontSize: 16, color: 'error.main' }} />
                      ) : (
                        <TrendingDown sx={{ fontSize: 16, color: 'success.main' }} />
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {spendingTrend.label}
                      </Typography>
                    </Stack>
                  )}
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.1),
                  }}
                >
                  <Schedule color="info" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {formatHours(analytics.total_hours_parked)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Hours Parked
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Avg: {formatHours(analytics.average_booking_duration)}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.warning.main, 0.1),
                  }}
                >
                  <TrendingUp color="warning" />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {formatCurrency(analytics.average_hourly_rate)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Avg Rate/Hour
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Spending Trend */}
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Monthly Spending Trend
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer>
                  <AreaChart data={analytics.monthly_spending}>
                    <defs>
                      <linearGradient id="spendingGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [formatCurrency(value as number), 'Spending']} />
                    <Area
                      type="monotone"
                      dataKey="spending"
                      stroke={theme.palette.primary.main}
                      fillOpacity={1}
                      fill="url(#spendingGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Space Type Distribution */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Space Type Usage
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer>
                  <RechartsPieChart>
                    <RechartsPieChart data={analytics.space_type_distribution}>
                      {analytics.space_type_distribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Box>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {analytics.space_type_distribution.map((item) => (
                  <Stack key={item.name} direction="row" alignItems="center" spacing={1}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        bgcolor: item.color,
                      }}
                    />
                    <Typography variant="body2" sx={{ flex: 1 }}>
                      {item.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {item.value}%
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Additional Analytics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Cost Savings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Cost Savings Comparison
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                How much you've saved vs traditional parking
              </Typography>

              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">vs Street Parking</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={600}>
                      +{formatCurrency(analytics.cost_savings.vs_street_parking)}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">vs Parking Meters</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={600}>
                      +{formatCurrency(analytics.cost_savings.vs_parking_meters)}
                    </Typography>
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2">vs Parking Garages</Typography>
                    <Typography variant="h6" color="success.main" fontWeight={600}>
                      +{formatCurrency(analytics.cost_savings.vs_parking_garages)}
                    </Typography>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>Total Saved</Typography>
                    <Typography variant="h5" color="success.main" fontWeight={700}>
                      {formatCurrency(analytics.cost_savings.total_saved)}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Environmental Impact */}
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Environmental Impact
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your positive impact on the environment
              </Typography>

              <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Eco color="success" />
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {analytics.environmental_impact.co2_saved.toFixed(1)} kg
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      CO₂ Emissions Saved
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <LocalGasStation color="warning" />
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {analytics.environmental_impact.fuel_saved.toFixed(1)} gal
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Fuel Saved
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <Schedule color="info" />
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {Math.round(analytics.environmental_impact.reduced_driving_time)} min
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Reduced Driving Time
                    </Typography>
                  </Box>
                </Stack>

                <Stack direction="row" alignItems="center" spacing={2}>
                  <DirectionsCar color="primary" />
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {analytics.environmental_impact.walking_distance.toFixed(1)} km
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Walking Distance
                    </Typography>
                  </Box>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recommendations */}
      <Card sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Personalized Recommendations
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Based on your parking habits, here are some ways to save more
          </Typography>

          <Grid container spacing={3}>
            {analytics.recommendations.map((rec, index) => (
              <Grid key={index} item xs={12} md={4}>
                <Paper
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    height: '100%',
                    border: 1,
                    borderColor: 'divider',
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        {rec.icon}
                      </Box>
                      <Chip
                        label={rec.type.replace('_', ' ')}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>

                    <Typography variant="subtitle1" fontWeight={600}>
                      {rec.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary">
                      {rec.description}
                    </Typography>

                    {rec.potential_savings > 0 && (
                      <Typography variant="h6" color="success.main" fontWeight={600}>
                        Save {formatCurrency(rec.potential_savings)}/month
                      </Typography>
                    )}
                  </Stack>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BookingHistoryAnalytics;