import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Button,
  Stack,
  Chip,
  Paper,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  Today,
  Event,
  Schedule,
  Block,
  CheckCircle,
} from '@mui/icons-material';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, addMonths, subMonths, isSameMonth, isSameDay, isToday, isBefore, isAfter } from 'date-fns';

interface BookingConflict {
  id: number;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  renter_name: string;
}

interface AvailabilityCalendarProps {
  parkingSpaceId: number;
  existingBookings?: BookingConflict[];
  onDateSelect?: (date: Date) => void;
  onBookingClick?: (booking: BookingConflict) => void;
  showBookings?: boolean;
  selectable?: boolean;
  highlightToday?: boolean;
}

interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

const AvailabilityCalendar: React.FC<AvailabilityCalendarProps> = ({
  parkingSpaceId,
  existingBookings = [],
  onDateSelect,
  onBookingClick,
  showBookings = true,
  selectable = true,
  highlightToday = true,
}) => {
  const theme = useTheme();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [blockoutDialogOpen, setBlockoutDialogOpen] = useState(false);
  const [blockoutData, setBlockoutData] = useState({
    startDate: '',
    endDate: '',
    reason: '',
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
    setSelectedDate(new Date());
  };

  const getBookingsForDate = (date: Date): BookingConflict[] => {
    return existingBookings.filter(booking => {
      const bookingStart = new Date(booking.start_time);
      const bookingEnd = new Date(booking.end_time);
      return isSameDay(bookingStart, date) || 
             (isBefore(bookingStart, date) && isAfter(bookingEnd, date)) ||
             isSameDay(bookingEnd, date);
    });
  };

  const isDateAvailable = (date: Date): boolean => {
    // Check if date is in the past
    if (isBefore(date, new Date()) && !isToday(date)) {
      return false;
    }

    // Check for booking conflicts
    const dayBookings = getBookingsForDate(date);
    return dayBookings.every(booking => booking.status === 'cancelled');
  };

  const getDateStatus = (date: Date): 'available' | 'booked' | 'blocked' | 'past' => {
    if (isBefore(date, new Date()) && !isToday(date)) {
      return 'past';
    }

    const dayBookings = getBookingsForDate(date);
    if (dayBookings.some(booking => booking.status === 'confirmed')) {
      return 'booked';
    }
    if (dayBookings.some(booking => booking.status === 'pending')) {
      return 'blocked';
    }

    return 'available';
  };

  const handleDateClick = (date: Date) => {
    if (!selectable) return;
    
    const status = getDateStatus(date);
    if (status === 'past') return;

    setSelectedDate(date);
    if (onDateSelect) {
      onDateSelect(date);
    }

    // If there are bookings on this date, show them
    const dayBookings = getBookingsForDate(date);
    if (dayBookings.length > 0 && onBookingClick) {
      onBookingClick(dayBookings[0]);
    }
  };

  const handleBlockoutSubmit = () => {
    // Here you would typically send this to your backend
    console.log('Creating blockout:', blockoutData);
    setBlockoutDialogOpen(false);
    setBlockoutData({ startDate: '', endDate: '', reason: '' });
  };

  const renderCalendarDays = () => {
    const days = [];
    let day = startDate;

    while (day <= endDate) {
      const currentDay = new Date(day); // Capture the current date value
      const dayBookings = getBookingsForDate(currentDay);
      const status = getDateStatus(currentDay);
      const isCurrentMonth = isSameMonth(currentDay, monthStart);
      const isSelected = selectedDate && isSameDay(currentDay, selectedDate);
      const isTodayDate = isToday(currentDay);

      days.push(
        <Grid size={{ xs: 12/7 }} key={currentDay.toString()}>
          <Box
            onClick={() => handleDateClick(currentDay)}
            sx={{
              aspect: '1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: selectable && status !== 'past' ? 'pointer' : 'default',
              borderRadius: 1,
              position: 'relative',
              border: 2,
              borderColor: isSelected ? 'primary.main' : 'transparent',
              backgroundColor: (() => {
                if (!isCurrentMonth) return alpha(theme.palette.grey[500], 0.1);
                if (isTodayDate && highlightToday) return alpha(theme.palette.primary.main, 0.1);
                if (isSelected) return alpha(theme.palette.primary.main, 0.2);
                switch (status) {
                  case 'booked': return alpha(theme.palette.error.main, 0.1);
                  case 'blocked': return alpha(theme.palette.warning.main, 0.1);
                  case 'past': return alpha(theme.palette.grey[500], 0.05);
                  default: return 'transparent';
                }
              })(),
              '&:hover': selectable && status !== 'past' ? {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                transform: 'scale(1.05)',
              } : {},
              transition: 'all 0.2s ease',
            }}
          >
            <Typography
              variant="body2"
              fontWeight={isTodayDate ? 'bold' : 'normal'}
              color={(() => {
                if (!isCurrentMonth) return 'text.disabled';
                if (isTodayDate) return 'primary.main';
                if (status === 'past') return 'text.disabled';
                return 'text.primary';
              })()}
            >
              {format(currentDay, 'd')}
            </Typography>

            {/* Status indicators */}
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
              {status === 'booked' && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'error.main',
                  }}
                />
              )}
              {status === 'blocked' && (
                <Box
                  sx={{
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    backgroundColor: 'warning.main',
                  }}
                />
              )}
              {dayBookings.length > 1 && (
                <Typography variant="caption" fontSize="0.6rem">
                  +{dayBookings.length - 1}
                </Typography>
              )}
            </Stack>

            {/* Today indicator */}
            {isTodayDate && highlightToday && (
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 2,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                }}
              />
            )}
          </Box>
        </Grid>
      );

      day = addDays(day, 1);
    }

    return days;
  };

  const renderLegend = () => (
    <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mt: 2 }}>
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.success.main, 0.2),
            border: `1px solid ${theme.palette.success.main}`,
          }}
        />
        <Typography variant="caption">Available</Typography>
      </Stack>
      
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.error.main, 0.2),
            border: `1px solid ${theme.palette.error.main}`,
          }}
        />
        <Typography variant="caption">Booked</Typography>
      </Stack>
      
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.warning.main, 0.2),
            border: `1px solid ${theme.palette.warning.main}`,
          }}
        />
        <Typography variant="caption">Pending</Typography>
      </Stack>
      
      <Stack direction="row" alignItems="center" spacing={0.5}>
        <Box
          sx={{
            width: 12,
            height: 12,
            borderRadius: '50%',
            backgroundColor: alpha(theme.palette.grey[500], 0.2),
            border: `1px solid ${theme.palette.grey[500]}`,
          }}
        />
        <Typography variant="caption">Unavailable</Typography>
      </Stack>
    </Stack>
  );

  return (
    <Card sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Event color="primary" />
            <Typography variant="h6" fontWeight={600}>
              Availability Calendar
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Today />}
              onClick={goToToday}
            >
              Today
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Block />}
              onClick={() => setBlockoutDialogOpen(true)}
            >
              Block Dates
            </Button>
          </Stack>
        </Stack>

        {/* Month Navigation */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <IconButton onClick={goToPreviousMonth}>
            <ChevronLeft />
          </IconButton>
          
          <Typography variant="h5" fontWeight={600}>
            {format(currentMonth, 'MMMM yyyy')}
          </Typography>
          
          <IconButton onClick={goToNextMonth}>
            <ChevronRight />
          </IconButton>
        </Stack>

        {/* Week Headers */}
        <Grid container sx={{ mb: 1 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Grid size={{ xs: 12/7 }} key={day}>
              <Typography
                variant="caption"
                fontWeight={600}
                color="text.secondary"
                sx={{ display: 'block', textAlign: 'center', py: 1 }}
              >
                {day}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Calendar Grid */}
        <Grid container sx={{ minHeight: 240 }}>
          {renderCalendarDays()}
        </Grid>

        {/* Legend */}
        {renderLegend()}

        {/* Selected Date Info */}
        {selectedDate && showBookings && (
          <Paper elevation={1} sx={{ mt: 3, p: 2, backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </Typography>
            
            {(() => {
              const dayBookings = getBookingsForDate(selectedDate);
              const status = getDateStatus(selectedDate);
              
              if (dayBookings.length === 0) {
                return (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CheckCircle color="success" fontSize="small" />
                    <Typography variant="body2" color="success.main">
                      Available for booking
                    </Typography>
                  </Stack>
                );
              }
              
              return (
                <Stack spacing={1}>
                  {dayBookings.map((booking, index) => (
                    <Chip
                      key={index}
                      label={`${booking.renter_name} • ${format(new Date(booking.start_time), 'h:mm a')} - ${format(new Date(booking.end_time), 'h:mm a')}`}
                      color={booking.status === 'confirmed' ? 'error' : 'warning'}
                      size="small"
                      onClick={() => onBookingClick && onBookingClick(booking)}
                      sx={{ cursor: onBookingClick ? 'pointer' : 'default' }}
                    />
                  ))}
                </Stack>
              );
            })()}
          </Paper>
        )}
      </CardContent>

      {/* Block Dates Dialog */}
      <Dialog open={blockoutDialogOpen} onClose={() => setBlockoutDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Block Unavailable Dates</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              fullWidth
              type="date"
              label="Start Date"
              value={blockoutData.startDate}
              onChange={(e) => setBlockoutData(prev => ({ ...prev, startDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              type="date"
              label="End Date"
              value={blockoutData.endDate}
              onChange={(e) => setBlockoutData(prev => ({ ...prev, endDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Reason (Optional)"
              value={blockoutData.reason}
              onChange={(e) => setBlockoutData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="e.g., Personal use, maintenance, etc."
            />
            
            <Alert severity="info">
              Blocked dates will prevent new bookings but won't affect existing confirmed bookings.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockoutDialogOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleBlockoutSubmit}
            disabled={!blockoutData.startDate || !blockoutData.endDate}
          >
            Block Dates
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default AvailabilityCalendar;