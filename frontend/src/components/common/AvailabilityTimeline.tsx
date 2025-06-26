import React from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  CheckCircle,
  Cancel,
  AccessTime,
} from '@mui/icons-material';

interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  label: string;
  type?: 'conflict' | 'suggested' | 'available' | 'unavailable';
}

interface AvailabilityTimelineProps {
  selectedDate: Date;
  selectedStart?: Date;
  selectedEnd?: Date;
  conflicts?: Array<{
    start_time: string;
    end_time: string;
    status: string;
  }>;
  suggestions?: Array<{
    start: Date;
    end: Date;
    label: string;
  }>;
  operatingHours?: {
    start: string;
    end: string;
  };
  onTimeSlotClick?: (start: Date, end: Date) => void;
}

const AvailabilityTimeline: React.FC<AvailabilityTimelineProps> = ({
  selectedDate,
  selectedStart,
  selectedEnd,
  conflicts = [],
  suggestions = [],
  operatingHours,
  onTimeSlotClick,
}) => {
  const theme = useTheme();

  // Generate hourly time slots for the selected date
  const generateTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Operating hours bounds
    const opStart = operatingHours?.start ? parseInt(operatingHours.start.split(':')[0]) : 0;
    const opEnd = operatingHours?.end ? parseInt(operatingHours.end.split(':')[0]) : 24;

    for (let hour = 0; hour < 24; hour++) {
      const slotStart = new Date(startOfDay);
      slotStart.setHours(hour);
      const slotEnd = new Date(slotStart);
      slotEnd.setHours(hour + 1);

      // Check if this slot is within operating hours
      const withinOperatingHours = hour >= opStart && hour < opEnd;

      // Check if this slot conflicts with existing bookings
      const hasConflict = conflicts.some(conflict => {
        const conflictStart = new Date(conflict.start_time);
        const conflictEnd = new Date(conflict.end_time);
        return (
          (slotStart >= conflictStart && slotStart < conflictEnd) ||
          (slotEnd > conflictStart && slotEnd <= conflictEnd) ||
          (slotStart <= conflictStart && slotEnd >= conflictEnd)
        );
      });

      // Check if this slot is suggested
      const isSuggested = suggestions.some(suggestion => {
        return slotStart.getTime() === suggestion.start.getTime();
      });

      // Check if this is the currently selected slot
      const isSelected = selectedStart && selectedEnd && 
        slotStart.getTime() === selectedStart.getTime();

      let type: TimeSlot['type'] = 'available';
      if (!withinOperatingHours) {
        type = 'unavailable';
      } else if (hasConflict) {
        type = 'conflict';
      } else if (isSuggested) {
        type = 'suggested';
      }

      slots.push({
        start: slotStart,
        end: slotEnd,
        available: withinOperatingHours && !hasConflict,
        label: slotStart.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          hour12: true 
        }),
        type
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot.type) {
      case 'conflict':
        return {
          bgcolor: alpha(theme.palette.error.main, 0.1),
          borderColor: theme.palette.error.main,
          color: theme.palette.error.main,
          icon: <Cancel sx={{ fontSize: 16 }} />
        };
      case 'suggested':
        return {
          bgcolor: alpha(theme.palette.success.main, 0.1),
          borderColor: theme.palette.success.main,
          color: theme.palette.success.main,
          icon: <CheckCircle sx={{ fontSize: 16 }} />
        };
      case 'available':
        return {
          bgcolor: alpha(theme.palette.primary.main, 0.05),
          borderColor: alpha(theme.palette.primary.main, 0.3),
          icon: <CheckCircle sx={{ fontSize: 16 }} />
        };
      case 'unavailable':
      default:
        return {
          bgcolor: alpha(theme.palette.grey[400], 0.1),
          borderColor: alpha(theme.palette.grey[400], 0.3),
          color: theme.palette.grey[600],
          icon: <AccessTime sx={{ fontSize: 16 }} />
        };
    }
  };

  const formatSelectedRange = () => {
    if (selectedStart && selectedEnd) {
      const startTime = selectedStart.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      const endTime = selectedEnd.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      return `${startTime} - ${endTime}`;
    }
    return null;
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Stack spacing={3}>
        {/* Header */}
        <Box>
          <Typography variant="h6" fontWeight={600} gutterBottom>
            Availability Timeline
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Typography>
          {formatSelectedRange() && (
            <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
              Selected: {formatSelectedRange()}
            </Typography>
          )}
        </Box>

        {/* Legend */}
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Chip 
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label="Available" 
            size="small" 
            variant="outlined"
            sx={{ 
              borderColor: theme.palette.success.main,
              color: theme.palette.success.main 
            }}
          />
          <Chip 
            icon={<Cancel sx={{ fontSize: 16 }} />}
            label="Booked" 
            size="small" 
            variant="outlined"
            sx={{ 
              borderColor: theme.palette.error.main,
              color: theme.palette.error.main 
            }}
          />
          <Chip 
            icon={<CheckCircle sx={{ fontSize: 16 }} />}
            label="Suggested" 
            size="small" 
            variant="outlined"
            sx={{ 
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main 
            }}
          />
          <Chip 
            icon={<AccessTime sx={{ fontSize: 16 }} />}
            label="Closed" 
            size="small" 
            variant="outlined"
            sx={{ 
              borderColor: theme.palette.grey[400],
              color: theme.palette.grey[600] 
            }}
          />
        </Stack>

        {/* Timeline Grid */}
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
            gap: 1,
            maxHeight: 400,
            overflowY: 'auto'
          }}
        >
          {timeSlots.map((slot) => {
            const colors = getSlotColor(slot);
            const isSelected = selectedStart && 
              slot.start.getTime() === selectedStart.getTime();

            return (
              <Box
                key={slot.start.getTime()}
                onClick={() => onTimeSlotClick && slot.available && onTimeSlotClick(slot.start, slot.end)}
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  border: `2px solid ${colors.borderColor}`,
                  bgcolor: isSelected ? colors.borderColor : colors.bgcolor,
                  color: isSelected ? 'white' : colors.color,
                  cursor: slot.available && onTimeSlotClick ? 'pointer' : 'default',
                  textAlign: 'center',
                  transition: 'all 0.2s ease',
                  minHeight: 60,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  '&:hover': slot.available && onTimeSlotClick ? {
                    bgcolor: alpha(colors.borderColor, 0.2),
                    transform: 'scale(1.02)',
                  } : {},
                }}
              >
                {React.cloneElement(colors.icon, { 
                  sx: { 
                    fontSize: 16, 
                    mb: 0.5,
                    color: isSelected ? 'white' : colors.color
                  } 
                })}
                <Typography 
                  variant="caption" 
                  fontWeight={600}
                  sx={{ 
                    color: isSelected ? 'white' : colors.color,
                    fontSize: '0.7rem'
                  }}
                >
                  {slot.label}
                </Typography>
              </Box>
            );
          })}
        </Box>

        {/* Operating Hours Info */}
        {operatingHours && (
          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
            Operating Hours: {operatingHours.start} - {operatingHours.end}
          </Typography>
        )}
      </Stack>
    </Paper>
  );
};

export default AvailabilityTimeline;