import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Paper,
  Divider,
  useTheme,
  alpha,
  IconButton,
  Tabs,
  Tab,
  LinearProgress,
} from '@mui/material';
import {
  Schedule,
  Repeat,
  Add,
  Edit,
  Delete,
  Pause,
  PlayArrow,
  CalendarToday,
  AttachMoney,
  LocationOn,
  DirectionsCar,
  Info,
  Warning,
  CheckCircle,
  Cancel,
} from '@mui/icons-material';
import { format, addDays, addWeeks, addMonths, startOfWeek, endOfWeek } from 'date-fns';

interface RecurringBooking {
  id: number;
  title: string;
  parkingSpaceId: number;
  parkingSpaceTitle: string;
  address: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  days?: string[]; // For weekly: ['monday', 'tuesday', etc.]
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  price: number;
  status: 'active' | 'paused' | 'cancelled' | 'expired';
  nextOccurrence: string;
  totalBookings: number;
  successfulBookings: number;
  failedBookings: number;
  createdAt: string;
}

interface RecurringBookingsProps {
  userType: 'host' | 'renter';
  onBookingCreate?: (booking: Partial<RecurringBooking>) => void;
  onBookingUpdate?: (id: number, updates: Partial<RecurringBooking>) => void;
  onBookingCancel?: (id: number) => void;
}

const RecurringBookings: React.FC<RecurringBookingsProps> = ({
  userType,
  onBookingCreate,
  onBookingUpdate,
  onBookingCancel,
}) => {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [bookings, setBookings] = useState<RecurringBooking[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<RecurringBooking | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [newBooking, setNewBooking] = useState({
    title: '',
    parkingSpaceId: 0,
    frequency: 'weekly' as const,
    days: ['monday'],
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    startTime: '09:00',
    endTime: '17:00',
    price: 0,
  });

  // Mock data
  const mockBookings: RecurringBooking[] = [
    {
      id: 1,
      title: 'Daily Commute Parking',
      parkingSpaceId: 101,
      parkingSpaceTitle: 'Downtown Garage Space',
      address: '456 Business Ave, Manhattan, NY',
      frequency: 'daily',
      startDate: '2024-12-01',
      endDate: '2025-03-01',
      startTime: '08:00',
      endTime: '18:00',
      price: 25,
      status: 'active',
      nextOccurrence: '2024-12-21',
      totalBookings: 45,
      successfulBookings: 43,
      failedBookings: 2,
      createdAt: '2024-12-01',
    },
    {
      id: 2,
      title: 'Weekend Storage',
      parkingSpaceId: 102,
      parkingSpaceTitle: 'Secure Garage in Brooklyn',
      address: '789 Residential St, Brooklyn, NY',
      frequency: 'weekly',
      days: ['saturday', 'sunday'],
      startDate: '2024-12-01',
      startTime: '10:00',
      endTime: '20:00',
      price: 15,
      status: 'active',
      nextOccurrence: '2024-12-21',
      totalBookings: 12,
      successfulBookings: 12,
      failedBookings: 0,
      createdAt: '2024-12-01',
    },
    {
      id: 3,
      title: 'Monthly Extended Stay',
      parkingSpaceId: 103,
      parkingSpaceTitle: 'Long-term Lot Space',
      address: '321 Storage Way, Queens, NY',
      frequency: 'monthly',
      startDate: '2024-12-01',
      endDate: '2025-06-01',
      startTime: '00:00',
      endTime: '23:59',
      price: 180,
      status: 'paused',
      nextOccurrence: '2025-01-01',
      totalBookings: 1,
      successfulBookings: 1,
      failedBookings: 0,
      createdAt: '2024-12-01',
    },
  ];

  useEffect(() => {
    setBookings(mockBookings);
  }, []);

  const getFrequencyLabel = (frequency: string, days?: string[]) => {
    switch (frequency) {
      case 'daily':
        return 'Every day';
      case 'weekly':
        return days && days.length > 0 
          ? `Every ${days.map(d => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}`
          : 'Weekly';
      case 'monthly':
        return 'Monthly';
      default:
        return frequency;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'paused':
        return 'warning';
      case 'cancelled':
      case 'expired':
        return 'error';
      default:
        return 'default';
    }
  };

  const calculateSavings = (frequency: string, price: number) => {
    // Calculate potential savings vs individual bookings
    const individualPrice = price * 1.2; // Assume 20% markup for individual bookings
    const savings = individualPrice - price;
    const savingsPercent = Math.round((savings / individualPrice) * 100);
    return { savings, savingsPercent };
  };

  const handleCreateBooking = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const booking: RecurringBooking = {
        id: Date.now(),
        ...newBooking,
        parkingSpaceTitle: 'Selected Parking Space', // Would come from API
        address: '123 Example St, City, NY', // Would come from API
        status: 'active',
        nextOccurrence: newBooking.startDate,
        totalBookings: 0,
        successfulBookings: 0,
        failedBookings: 0,
        createdAt: new Date().toISOString(),
      };
      
      setBookings(prev => [...prev, booking]);
      setCreateDialogOpen(false);
      setNewBooking({
        title: '',
        parkingSpaceId: 0,
        frequency: 'weekly',
        days: ['monday'],
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: '',
        startTime: '09:00',
        endTime: '17:00',
        price: 0,
      });
      
      if (onBookingCreate) {
        onBookingCreate(booking);
      }
      
      setLoading(false);
    }, 1000);
  };

  const handleToggleStatus = (booking: RecurringBooking) => {
    const newStatus = booking.status === 'active' ? 'paused' : 'active';
    setBookings(prev => 
      prev.map(b => 
        b.id === booking.id ? { ...b, status: newStatus } : b
      )
    );
    
    if (onBookingUpdate) {
      onBookingUpdate(booking.id, { status: newStatus });
    }
  };

  const handleCancelBooking = (booking: RecurringBooking) => {
    setBookings(prev => 
      prev.map(b => 
        b.id === booking.id ? { ...b, status: 'cancelled' } : b
      )
    );
    
    if (onBookingCancel) {
      onBookingCancel(booking.id);
    }
  };

  const renderBookingCard = (booking: RecurringBooking) => {
    const { savings, savingsPercent } = calculateSavings(booking.frequency, booking.price);
    const successRate = booking.totalBookings > 0 
      ? Math.round((booking.successfulBookings / booking.totalBookings) * 100)
      : 100;

    return (
      <Card
        key={booking.id}
        sx={{
          borderRadius: 3,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Stack spacing={2}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {booking.title}
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    {booking.parkingSpaceTitle}
                  </Typography>
                </Stack>
              </Box>
              
              <Stack direction="row" spacing={1}>
                <Chip
                  label={booking.status}
                  color={getStatusColor(booking.status) as any}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
                
                <IconButton
                  size="small"
                  onClick={() => handleToggleStatus(booking)}
                  disabled={booking.status === 'cancelled'}
                >
                  {booking.status === 'active' ? <Pause /> : <PlayArrow />}
                </IconButton>
                
                <IconButton
                  size="small"
                  onClick={() => setEditingBooking(booking)}
                  disabled={booking.status === 'cancelled'}
                >
                  <Edit />
                </IconButton>
                
                <IconButton
                  size="small"
                  onClick={() => handleCancelBooking(booking)}
                  disabled={booking.status === 'cancelled'}
                  color="error"
                >
                  <Cancel />
                </IconButton>
              </Stack>
            </Box>

            <Divider />

            {/* Details */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Frequency
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {getFrequencyLabel(booking.frequency, booking.days)}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Time Slot
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {booking.startTime} - {booking.endTime}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack spacing={1}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Price per Occurrence
                    </Typography>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" fontWeight={600} color="success.main">
                        ${booking.price}
                      </Typography>
                      {savingsPercent > 0 && (
                        <Chip
                          label={`${savingsPercent}% savings`}
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Next Occurrence
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {format(new Date(booking.nextOccurrence), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>
            </Grid>

            <Divider />

            {/* Statistics */}
            <Box>
              <Typography variant="caption" color="text.secondary" gutterBottom>
                Success Rate
              </Typography>
              <Stack direction="row" alignItems="center" spacing={2}>
                <LinearProgress
                  variant="determinate"
                  value={successRate}
                  sx={{
                    flex: 1,
                    height: 8,
                    borderRadius: 4,
                    bgcolor: alpha(theme.palette.success.main, 0.1),
                    '& .MuiLinearProgress-bar': {
                      bgcolor: 'success.main',
                    },
                  }}
                />
                <Typography variant="body2" fontWeight={600}>
                  {successRate}%
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                {booking.successfulBookings} of {booking.totalBookings} bookings successful
              </Typography>
            </Box>
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const renderCreateDialog = () => (
    <Dialog
      open={createDialogOpen}
      onClose={() => setCreateDialogOpen(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Repeat sx={{ color: 'primary.main' }} />
          <Typography variant="h6">Create Recurring Booking</Typography>
        </Stack>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Booking Title"
            value={newBooking.title}
            onChange={(e) => setNewBooking(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Daily Commute Parking"
          />
          
          <FormControl fullWidth>
            <InputLabel>Frequency</InputLabel>
            <Select
              value={newBooking.frequency}
              onChange={(e) => setNewBooking(prev => ({ 
                ...prev, 
                frequency: e.target.value as any,
                days: e.target.value === 'weekly' ? ['monday'] : []
              }))}
              label="Frequency"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
            </Select>
          </FormControl>
          
          {newBooking.frequency === 'weekly' && (
            <FormControl fullWidth>
              <InputLabel>Days of Week</InputLabel>
              <Select
                multiple
                value={newBooking.days}
                onChange={(e) => setNewBooking(prev => ({ 
                  ...prev, 
                  days: typeof e.target.value === 'string' ? [e.target.value] : e.target.value
                }))}
                label="Days of Week"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day) => (
                  <MenuItem key={day} value={day}>
                    {day.charAt(0).toUpperCase() + day.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={newBooking.startDate}
              onChange={(e) => setNewBooking(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Date (Optional)"
              type="date"
              value={newBooking.endDate}
              onChange={(e) => setNewBooking(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              label="Start Time"
              type="time"
              value={newBooking.startTime}
              onChange={(e) => setNewBooking(prev => ({ ...prev, startTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="End Time"
              type="time"
              value={newBooking.endTime}
              onChange={(e) => setNewBooking(prev => ({ ...prev, endTime: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
          
          <TextField
            fullWidth
            label="Price per Occurrence"
            type="number"
            value={newBooking.price}
            onChange={(e) => setNewBooking(prev => ({ ...prev, price: Number(e.target.value) }))}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
            }}
          />
          
          <Alert severity="info">
            Recurring bookings automatically attempt to book your selected time slots. 
            You'll be charged only for successful bookings.
          </Alert>
        </Stack>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={() => setCreateDialogOpen(false)}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleCreateBooking}
          disabled={loading || !newBooking.title || !newBooking.price}
          startIcon={loading && <LinearProgress />}
        >
          {loading ? 'Creating...' : 'Create Recurring Booking'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Repeat sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Recurring Bookings
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Set up automatic recurring parking reservations
            </Typography>
          </Box>
        </Stack>
        
        {userType === 'renter' && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{ borderRadius: 2 }}
          >
            Create Recurring Booking
          </Button>
        )}
      </Stack>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)}>
          <Tab icon={<CheckCircle />} label="Active" />
          <Tab icon={<Pause />} label="Paused" />
          <Tab icon={<Cancel />} label="Cancelled" />
        </Tabs>
      </Box>

      {/* Bookings List */}
      <Grid container spacing={3}>
        {bookings
          .filter(booking => {
            if (activeTab === 0) return booking.status === 'active';
            if (activeTab === 1) return booking.status === 'paused';
            if (activeTab === 2) return booking.status === 'cancelled' || booking.status === 'expired';
            return true;
          })
          .map(booking => (
            <Grid size={{ xs: 12, lg: 6 }} key={booking.id}>
              {renderBookingCard(booking)}
            </Grid>
          ))
        }
      </Grid>

      {/* Empty State */}
      {bookings.filter(booking => {
        if (activeTab === 0) return booking.status === 'active';
        if (activeTab === 1) return booking.status === 'paused';
        if (activeTab === 2) return booking.status === 'cancelled' || booking.status === 'expired';
        return true;
      }).length === 0 && (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: 'center',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Schedule sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" fontWeight={600} gutterBottom>
            No recurring bookings found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create your first recurring booking to save time and money on regular parking needs.
          </Typography>
          {userType === 'renter' && (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setCreateDialogOpen(true)}
            >
              Create Recurring Booking
            </Button>
          )}
        </Paper>
      )}

      {/* Benefits Info */}
      <Paper elevation={1} sx={{ p: 3, mt: 4, bgcolor: alpha(theme.palette.success.main, 0.05) }}>
        <Typography variant="h6" fontWeight={600} gutterBottom color="success.main">
          Benefits of Recurring Bookings
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AttachMoney sx={{ color: 'success.main' }} />
              <Typography variant="body2">
                Save up to 20% with recurring discounts
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Schedule sx={{ color: 'success.main' }} />
              <Typography variant="body2">
                Automatic booking - no need to remember
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <CheckCircle sx={{ color: 'success.main' }} />
              <Typography variant="body2">
                Priority access to popular spots
              </Typography>
            </Stack>
          </Grid>
        </Grid>
      </Paper>

      {renderCreateDialog()}
    </Box>
  );
};

export default RecurringBookings;