import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  LinearProgress,
  Menu,
  MenuList,
  ListItemText,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  AccountBalanceWallet as WalletIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import HostAnalytics from '../components/analytics/HostAnalytics';
import toast from 'react-hot-toast';

interface EarningsData {
  total_earnings: number;
  this_month: number;
  last_month: number;
  this_year: number;
  average_per_booking: number;
  total_bookings: number;
  pending_amount: number;
  available_balance: number;
}

interface Transaction {
  id: number;
  type: 'booking' | 'payout' | 'refund';
  amount: number;
  date: string;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  listing_title?: string;
  booking_id?: number;
}

interface Payout {
  id: number;
  amount: number;
  currency: string;
  status: 'scheduled' | 'processing' | 'completed' | 'failed';
  payout_method: string;
  stripe_payout_id?: string;
  scheduled_date: string;
  processed_at?: string;
  created_at: string;
  description?: string;
}

interface Booking {
  id: number;
  booking_id?: string;
  status?: string;
  start_time?: string;
  end_time?: string;
  total_amount?: number;
  platform_fee?: number;
  created_at?: string;
  parking_space?: {
    id: number;
    title: string;
  };
  user?: {
    id: number;
    first_name: string;
    last_name: string;
  };
}

interface MonthlyStatement {
  month: string;
  year: number;
  total_bookings: number;
  completed_bookings: number;
  cancelled_bookings: number;
  total_earnings: number;
  platform_fees: number;
  net_earnings: number;
  bookings: Booking[];
}

const mockEarningsData: EarningsData = {
  total_earnings: 2847.50,
  this_month: 485.75,
  last_month: 392.25,
  this_year: 2847.50,
  average_per_booking: 47.85,
  total_bookings: 59,
  pending_amount: 125.00,
  available_balance: 360.75,
};

const mockTransactions: Transaction[] = [
  {
    id: 1,
    type: 'booking',
    amount: 45.00,
    date: '2024-12-20',
    description: 'Booking payment received',
    status: 'completed',
    listing_title: 'Secure Garage Space in Manhattan',
    booking_id: 101,
  },
  {
    id: 2,
    type: 'payout',
    amount: -180.00,
    date: '2024-12-18',
    description: 'Weekly payout to bank account',
    status: 'completed',
  },
  {
    id: 3,
    type: 'booking',
    amount: 32.50,
    date: '2024-12-17',
    description: 'Booking payment received',
    status: 'completed',
    listing_title: 'Covered Parking Near Brooklyn Bridge',
    booking_id: 102,
  },
  {
    id: 4,
    type: 'booking',
    amount: 28.00,
    date: '2024-12-15',
    description: 'Booking payment received',
    status: 'pending',
    listing_title: 'Secure Garage Space in Manhattan',
    booking_id: 103,
  },
  {
    id: 5,
    type: 'refund',
    amount: -15.00,
    date: '2024-12-14',
    description: 'Refund processed for cancelled booking',
    status: 'completed',
    booking_id: 98,
  },
];

export default function Earnings() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EarningsData>({
    total_earnings: 0,
    this_month: 0,
    last_month: 0,
    this_year: 0,
    average_per_booking: 0,
    total_bookings: 0,
    pending_amount: 0,
    available_balance: 0,
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [hostBookings, setHostBookings] = useState<Booking[]>([]);
  const [userListings, setUserListings] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(false);
  const [timeFilter, setTimeFilter] = useState('all');
  const [isGeneratingStatement, setIsGeneratingStatement] = useState(false);
  const [statementMenuAnchor, setStatementMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    if (user?.id) {
      loadEarningsData();
    }
  }, [timeFilter, user?.id]);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      console.log('Loading earnings data for user:', user?.id);
      
      // First, get user's listings to identify which bookings they host
      const listingsResponse = await api.get('/listings/', {
        params: {
          host: user?.id
        }
      });
      
      const userListings = listingsResponse.data.results || listingsResponse.data || [];
      console.log('User listings:', userListings);
      setUserListings(userListings);
      
      // Get all bookings
      const bookingsResponse = await api.get('/bookings/bookings/');
      const allBookings = bookingsResponse.data.results || bookingsResponse.data || [];
      console.log('All bookings:', allBookings);
      
      // Filter bookings where current user is the host (bookings for their listings)
      const hostBookings = allBookings.filter(booking => {
        return userListings.some(listing => listing.id === booking.parking_space?.id);
      });
      
      console.log('Host bookings:', hostBookings);
      setHostBookings(hostBookings);
      
      // Get host payouts
      try {
        const payoutsResponse = await api.get('/payments/v2/host-payouts/');
        const hostPayouts = payoutsResponse.data || [];
        console.log('Host payouts:', hostPayouts);
        setPayouts(hostPayouts);
        
        // Calculate earnings from bookings and payouts
        if (Array.isArray(hostBookings)) {
          const calculatedEarnings = calculateEarningsFromBookings(hostBookings, hostPayouts);
          setEarnings(calculatedEarnings);

          // Generate transactions from bookings and payouts
          const calculatedTransactions = generateTransactionsFromBookingsAndPayouts(hostBookings, hostPayouts);
          setTransactions(calculatedTransactions);
        } else {
          console.warn('hostBookings is not an array:', hostBookings);
          // Set all earnings to zero if no bookings data
          setEarnings({
            total_earnings: 0,
            this_month: 0,
            last_month: 0,
            this_year: 0,
            average_per_booking: 0,
            total_bookings: 0,
            pending_amount: 0,
            available_balance: 0,
          });
          setTransactions([]);
        }
      } catch (payoutError) {
        console.error('Error loading payouts:', payoutError);
        // If payouts fail, continue with just bookings data
        if (Array.isArray(hostBookings)) {
          const calculatedEarnings = calculateEarningsFromBookings(hostBookings);
          setEarnings(calculatedEarnings);

          // Generate transactions from bookings only
          const calculatedTransactions = generateTransactionsFromBookings(hostBookings);
          setTransactions(calculatedTransactions);
        }
      }
      
    } catch (error) {
      console.error('Error loading earnings:', error);
      // Set all earnings to zero if API fails
      setEarnings({
        total_earnings: 0,
        this_month: 0,
        last_month: 0,
        this_year: 0,
        average_per_booking: 0,
        total_bookings: 0,
        pending_amount: 0,
        available_balance: 0,
      });
      setTransactions([]);
      setHostBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateEarningsFromBookings = (bookings: Booking[], payouts?: Payout[]): EarningsData => {
    if (!Array.isArray(bookings) || bookings.length === 0) {
      return {
        total_earnings: 0,
        this_month: 0,
        last_month: 0,
        this_year: 0,
        average_per_booking: 0,
        total_bookings: 0,
        pending_amount: 0,
        available_balance: 0,
      };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const thisMonthBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.created_at || new Date());
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    const lastMonthBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.created_at || new Date());
      return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear;
    });
    const thisYearBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.created_at || new Date());
      return bookingDate.getFullYear() === currentYear;
    });

    const pendingBookings = bookings.filter(b => ['PENDING', 'CONFIRMED'].includes(b.status || ''));

    const totalEarnings = completedBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const lastMonthEarnings = lastMonthBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const thisYearEarnings = thisYearBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const pendingAmount = pendingBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);

    // Calculate available balance: total earnings minus completed payouts
    let availableBalance = totalEarnings;
    if (payouts && Array.isArray(payouts)) {
      const completedPayouts = payouts.filter(p => p.status === 'completed');
      const totalPayouts = completedPayouts.reduce((sum, p) => sum + p.amount, 0);
      availableBalance = Math.max(0, totalEarnings - totalPayouts);
    }

    return {
      total_earnings: totalEarnings,
      this_month: thisMonthEarnings,
      last_month: lastMonthEarnings,
      this_year: thisYearEarnings,
      average_per_booking: completedBookings.length > 0 ? totalEarnings / completedBookings.length : 0,
      total_bookings: completedBookings.length,
      pending_amount: pendingAmount,
      available_balance: availableBalance,
    };
  };

  const generateTransactionsFromBookings = (bookings: Booking[]): Transaction[] => {
    if (!Array.isArray(bookings)) {
      return [];
    }
    
    return bookings
      .filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status || ''))
      .slice(0, 20) // Show last 20 transactions
      .map(booking => ({
        id: booking.id || 0,
        type: booking.status === 'COMPLETED' ? 'booking' as const : 'refund' as const,
        amount: booking.status === 'COMPLETED' 
          ? (booking.total_amount || 0) - (booking.platform_fee || 0)
          : -((booking.total_amount || 0) - (booking.platform_fee || 0)),
        date: booking.created_at || new Date().toISOString(),
        description: booking.status === 'COMPLETED' 
          ? 'Booking payment received' 
          : 'Refund processed for cancelled booking',
        status: 'completed' as const,
        listing_title: booking.parking_space?.title || 'Unknown Space',
        booking_id: booking.id || 0,
      }));
  };

  const generateTransactionsFromBookingsAndPayouts = (bookings: Booking[], payouts: Payout[]): Transaction[] => {
    const bookingTransactions = bookings
      .filter(b => ['COMPLETED', 'CANCELLED'].includes(b.status || ''))
      .map(booking => ({
        id: booking.id || 0,
        type: booking.status === 'COMPLETED' ? 'booking' as const : 'refund' as const,
        amount: booking.status === 'COMPLETED' 
          ? (booking.total_amount || 0) - (booking.platform_fee || 0)
          : -((booking.total_amount || 0) - (booking.platform_fee || 0)),
        date: booking.created_at || new Date().toISOString(),
        description: booking.status === 'COMPLETED' 
          ? 'Booking payment received' 
          : 'Refund processed for cancelled booking',
        status: 'completed' as const,
        listing_title: booking.parking_space?.title || 'Unknown Space',
        booking_id: booking.id || 0,
      }));

    const payoutTransactions = payouts.map(payout => ({
      id: payout.id + 100000, // Offset to avoid ID conflicts
      type: 'payout' as const,
      amount: -payout.amount, // Negative because it's money going out
      date: payout.processed_at || payout.scheduled_date || payout.created_at,
      description: payout.description || `Payout to ${payout.payout_method}`,
      status: payout.status === 'completed' ? 'completed' as const : 
              payout.status === 'failed' ? 'failed' as const : 'pending' as const,
    }));

    // Combine and sort by date
    const allTransactions = [...bookingTransactions, ...payoutTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20); // Show last 20 transactions

    return allTransactions;
  };

  const handleRequestPayout = () => {
    console.log('Request Payout clicked! Available balance:', earnings.available_balance);
    
    // Navigate to the payout page regardless of balance
    console.log('Navigating to /payout');
    navigate('/payout');
  };

  const generateMonthlyStatement = (month: number, year: number): MonthlyStatement => {
    // Ensure hostBookings is an array
    const bookingsArray = Array.isArray(hostBookings) ? hostBookings : [];
    
    const monthBookings = bookingsArray.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return bookingDate.getMonth() === month && bookingDate.getFullYear() === year;
    });

    const completedBookings = monthBookings.filter(b => b.status === 'COMPLETED');
    const cancelledBookings = monthBookings.filter(b => b.status === 'CANCELLED');
    
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const platformFees = completedBookings.reduce((sum, b) => sum + (b.platform_fee || 0), 0);

    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    return {
      month: monthNames[month],
      year,
      total_bookings: monthBookings.length,
      completed_bookings: completedBookings.length,
      cancelled_bookings: cancelledBookings.length,
      total_earnings: totalEarnings,
      platform_fees: platformFees,
      net_earnings: totalEarnings - platformFees,
      bookings: monthBookings,
    };
  };

  const downloadMonthlyStatement = async (month?: number, year?: number) => {
    setIsGeneratingStatement(true);
    try {
      const now = new Date();
      const statementMonth = month ?? now.getMonth();
      const statementYear = year ?? now.getFullYear();
      
      const statement = generateMonthlyStatement(statementMonth, statementYear);
      
      // Generate CSV content
      const csvContent = generateStatementCSV(statement);
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `earnings-statement-${statement.month}-${statement.year}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${statement.month} ${statement.year} statement downloaded!`);
    } catch (error) {
      console.error('Error generating statement:', error);
      toast.error('Failed to generate statement');
    } finally {
      setIsGeneratingStatement(false);
    }
  };

  const generateStatementCSV = (statement: MonthlyStatement): string => {
    const headers = [
      'Date',
      'Booking ID',
      'Guest Name',
      'Parking Space',
      'Status',
      'Start Time',
      'End Time',
      'Total Amount',
      'Platform Fee',
      'Net Earnings'
    ];

    const rows = statement.bookings.map(booking => [
      new Date(booking.created_at || new Date()).toLocaleDateString(),
      booking.booking_id || booking.id?.toString() || 'N/A',
      `${booking.user?.first_name || 'Unknown'} ${booking.user?.last_name || 'Guest'}`,
      booking.parking_space?.title || 'Unknown Space',
      booking.status || 'Unknown',
      new Date(booking.start_time || new Date()).toLocaleString(),
      new Date(booking.end_time || new Date()).toLocaleString(),
      (booking.total_amount || 0).toFixed(2),
      (booking.platform_fee || 0).toFixed(2),
      ((booking.total_amount || 0) - (booking.platform_fee || 0)).toFixed(2)
    ]);

    const summaryRows = [
      [],
      ['SUMMARY'],
      ['Total Bookings', statement.total_bookings.toString()],
      ['Completed Bookings', statement.completed_bookings.toString()],
      ['Cancelled Bookings', statement.cancelled_bookings.toString()],
      ['Total Earnings', statement.total_earnings.toFixed(2)],
      ['Platform Fees', statement.platform_fees.toFixed(2)],
      ['Net Earnings', statement.net_earnings.toFixed(2)]
    ];

    const allRows = [headers, ...rows, ...summaryRows];
    return allRows.map(row => row.join(',')).join('\n');
  };

  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    
    // Get last 12 months
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      });
    }
    
    return months;
  };

  const calculateAnalyticsData = (bookings: Booking[], listings: any[]) => {
    if (!Array.isArray(bookings) || !Array.isArray(listings)) {
      return {
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
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const completedBookings = bookings.filter(b => b.status === 'COMPLETED');
    const thisMonthBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.created_at || new Date());
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });
    const lastMonthBookings = completedBookings.filter(b => {
      const bookingDate = new Date(b.created_at || new Date());
      return bookingDate.getMonth() === lastMonth && bookingDate.getFullYear() === lastMonthYear;
    });

    const totalEarnings = completedBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const thisMonthEarnings = thisMonthBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
    const lastMonthEarnings = lastMonthBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);

    // Calculate average rating across all listings
    const listingsWithRatings = listings.filter(l => l.rating_average && Number(l.rating_average) > 0);
    const averageRating = listingsWithRatings.length > 0 
      ? listingsWithRatings.reduce((sum, l) => sum + (Number(l.rating_average) || 0), 0) / listingsWithRatings.length 
      : 0;

    // Calculate occupancy rate (simplified - could be more sophisticated)
    const occupancyRate = listings.length > 0 ? Math.min(95, Math.max(0, (completedBookings.length / listings.length) * 10)) : 0;

    // Calculate trends
    const earningsChange = lastMonthEarnings > 0 ? ((thisMonthEarnings - lastMonthEarnings) / lastMonthEarnings) * 100 : 0;
    const bookingsChange = lastMonthBookings.length > 0 ? ((thisMonthBookings.length - lastMonthBookings.length) / lastMonthBookings.length) * 100 : 0;

    return {
      totalEarnings,
      monthlyEarnings: thisMonthEarnings,
      totalBookings: completedBookings.length,
      monthlyBookings: thisMonthBookings.length,
      averageRating,
      occupancyRate,
      topPerformingListing: listings.length > 0 ? listings[0].title : 'No listings yet',
      recentTrends: {
        earnings: { value: thisMonthEarnings, change: Math.abs(earningsChange), trend: earningsChange >= 0 ? 'up' as const : 'down' as const },
        bookings: { value: thisMonthBookings.length, change: Math.abs(bookingsChange), trend: bookingsChange >= 0 ? 'up' as const : 'down' as const },
        rating: { value: averageRating, change: 0, trend: 'up' as const },
      },
    };
  };

  const calculateTopListings = (bookings: Booking[], listings: any[]) => {
    if (!Array.isArray(bookings) || !Array.isArray(listings) || listings.length === 0) {
      return [];
    }

    const listingStats = listings.map(listing => {
      const listingBookings = bookings.filter(b => 
        b.status === 'COMPLETED' && b.parking_space?.id === listing.id
      );
      
      const earnings = listingBookings.reduce((sum, b) => sum + ((b.total_amount || 0) - (b.platform_fee || 0)), 0);
      
      return {
        name: listing.title,
        earnings,
        bookings: listingBookings.length,
        rating: listing.rating_average || 0,
      };
    });

    return listingStats
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 3);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'booking':
        return <ReceiptIcon />;
      case 'payout':
        return <WalletIcon />;
      case 'refund':
        return <TrendingDownIcon />;
      default:
        return <MoneyIcon />;
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'refund' || amount < 0) return 'error';
    if (type === 'booking') return 'success';
    return 'info';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const monthlyGrowth = earnings.this_month > earnings.last_month;
  const growthPercentage = earnings.last_month > 0 
    ? Math.abs(((earnings.this_month - earnings.last_month) / earnings.last_month) * 100)
    : 0;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 4,
    }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
        color: 'white',
        py: 6,
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <IconButton 
                  onClick={() => navigate('/dashboard')} 
                  sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h3" component="h1" fontWeight={700} color="white">
                  Your Earnings
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }} color="white">
                Track your parking space income and manage payouts
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Analytics Dashboard */}
        <Box sx={{ mb: 4 }}>
          <HostAnalytics 
            timeRange="30d"
            onTimeRangeChange={(range) => {
              console.log('Analytics time range changed:', range);
              // You could sync this with the earnings time filter
            }}
            analyticsData={calculateAnalyticsData(hostBookings, userListings)}
            topListings={calculateTopListings(hostBookings, userListings)}
            recentBookings={hostBookings.slice(0, 10)}
          />
        </Box>

        {/* Earnings Summary Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Total Earnings
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }} color="text.primary">
                      ${earnings.total_earnings.toLocaleString()}
                    </Typography>
                  </Box>
                  <MoneyIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      This Month
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }} color="text.primary">
                      ${earnings.this_month.toLocaleString()}
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
                      {monthlyGrowth ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />}
                      <Typography variant="body2" color={monthlyGrowth ? 'success.main' : 'error.main'}>
                        {growthPercentage.toFixed(1)}% vs last month
                      </Typography>
                    </Stack>
                  </Box>
                  <CalendarIcon sx={{ fontSize: 40, opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Available Balance
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }} color="text.primary">
                      ${earnings.available_balance.toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Ready for payout
                    </Typography>
                  </Box>
                  <WalletIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Avg. per Booking
                    </Typography>
                    <Typography variant="h4" fontWeight={700} sx={{ mt: 1 }} color="text.primary">
                      ${earnings.average_per_booking.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      From {earnings.total_bookings} bookings
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.8 }} />
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Actions Bar */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Earnings Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Request payouts and download statements
              </Typography>
            </Box>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<WalletIcon />}
                onClick={handleRequestPayout}
                sx={{ borderRadius: 2 }}
              >
                Request Payout ({earnings.available_balance > 0 ? `$${earnings.available_balance.toFixed(2)}` : '$0.00'})
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                disabled={isGeneratingStatement}
                onClick={(e) => setStatementMenuAnchor(e.currentTarget)}
                sx={{ borderRadius: 2 }}
              >
                {isGeneratingStatement ? 'Generating...' : 'Download Statement'}
              </Button>
              <Menu
                anchorEl={statementMenuAnchor}
                open={Boolean(statementMenuAnchor)}
                onClose={() => setStatementMenuAnchor(null)}
                PaperProps={{
                  sx: { minWidth: 200 }
                }}
              >
                <MenuList>
                  {getAvailableMonths().map((monthData) => (
                    <MenuItem
                      key={`${monthData.year}-${monthData.month}`}
                      onClick={() => {
                        downloadMonthlyStatement(monthData.month, monthData.year);
                        setStatementMenuAnchor(null);
                      }}
                    >
                      <ListItemText primary={monthData.label} />
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            </Stack>
          </Stack>
        </Paper>

        {/* Transaction History */}
        <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" fontWeight={600} color="text.primary">
                    Transaction History
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Recent earnings and payouts
                  </Typography>
                </Box>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Period</InputLabel>
                  <Select
                    value={timeFilter}
                    label="Period"
                    onChange={(e) => setTimeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Time</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                    <MenuItem value="quarter">This Quarter</MenuItem>
                    <MenuItem value="year">This Year</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow 
                      key={transaction.id} 
                      sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                    >
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Box sx={{ color: `${getTransactionColor(transaction.type, transaction.amount)}.main` }}>
                            {getTransactionIcon(transaction.type)}
                          </Box>
                          <Typography variant="body2" fontWeight={500} sx={{ textTransform: 'capitalize' }}>
                            {transaction.type}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {transaction.description}
                        </Typography>
                        {transaction.listing_title && (
                          <Typography variant="caption" color="text.secondary">
                            {transaction.listing_title}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(transaction.date).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          fontWeight={600}
                          color={transaction.amount >= 0 ? 'success.main' : 'error.main'}
                        >
                          {transaction.amount >= 0 ? '+' : ''}${Math.abs(transaction.amount).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={transaction.status}
                          size="small"
                          color={getStatusColor(transaction.status) as any}
                          sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <IconButton size="small">
                          <ViewIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Recent Payouts Section */}
        <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4], mt: 4 }}>
          <CardContent sx={{ p: 0 }}>
            <Box sx={{ p: 3, pb: 2 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                Recent Payouts
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your payout history and scheduled payments
              </Typography>
            </Box>
            <Divider />
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Reference</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.length > 0 ? (
                    payouts.slice(0, 10).map((payout) => (
                      <TableRow 
                        key={payout.id} 
                        sx={{ '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) } }}
                      >
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(payout.processed_at || payout.scheduled_date || payout.created_at).toLocaleDateString()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(payout.processed_at || payout.scheduled_date || payout.created_at).toLocaleTimeString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600} color="success.main">
                            ${payout.amount.toFixed(2)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                            {payout.payout_method}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={payout.status}
                            size="small"
                            color={
                              payout.status === 'completed' ? 'success' :
                              payout.status === 'processing' ? 'info' :
                              payout.status === 'scheduled' ? 'warning' : 'error'
                            }
                            sx={{ fontWeight: 500, textTransform: 'capitalize' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                            {payout.stripe_payout_id || `PAY-${payout.id}`}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No payouts yet. Your earnings will be paid out according to your payout schedule.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}