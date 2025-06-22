import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Typography,
  Button,
  Stack,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Slider,
  Select,
  MenuItem,
  InputLabel,
  TextField,
  Chip,
  Divider,
  IconButton,
  Paper,
  Grid,
  useTheme,
} from '@mui/material';
import {
  Close as CloseIcon,
  ElectricBolt,
  Security,
  Roofing as CoveredIcon,
  Accessible,
  DirectionsCar,
  LocalParking,
  Videocam,
  WbSunny as LightingIcon,
  Schedule,
  Lock,
  PersonPin,
  LocalCarWash,
} from '@mui/icons-material';

export interface FilterOptions {
  priceRange: [number, number];
  spaceTypes: string[];
  amenities: string[];
  vehicleTypes: string[];
  availability: string;
  distance: number;
  rating: number;
  accessibleParking: boolean;
}

interface AdvancedFiltersProps {
  open: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
}

const defaultFilters: FilterOptions = {
  priceRange: [0, 50],
  spaceTypes: [],
  amenities: [],
  vehicleTypes: [],
  availability: 'any',
  distance: 10,
  rating: 0,
  accessibleParking: false,
};

const spaceTypeOptions = [
  { value: 'garage', label: 'Garage', icon: <CoveredIcon /> },
  { value: 'street', label: 'Street parking', icon: <DirectionsCar /> },
  { value: 'lot', label: 'Parking lot', icon: <LocalParking /> },
  { value: 'covered', label: 'Covered space', icon: <CoveredIcon /> },
  { value: 'driveway', label: 'Driveway', icon: <LocalParking /> },
];

const amenityOptions = [
  { value: 'covered', label: 'Covered/Indoor', icon: <CoveredIcon /> },
  { value: 'security', label: 'Security', icon: <Security /> },
  { value: 'electric_charging', label: 'EV Charging', icon: <ElectricBolt /> },
  { value: 'lighting', label: 'Well Lit', icon: <LightingIcon /> },
  { value: 'cctv', label: 'CCTV Monitoring', icon: <Videocam /> },
  { value: 'gated', label: 'Gated Access', icon: <Lock /> },
  { value: 'handicap_accessible', label: 'Wheelchair Accessible', icon: <Accessible /> },
  { value: 'valet', label: 'Valet Service', icon: <PersonPin /> },
  { value: 'car_wash', label: 'Car Wash', icon: <LocalCarWash /> },
];

const vehicleTypeOptions = [
  { value: 'car', label: 'Car', icon: '🚗' },
  { value: 'suv', label: 'SUV', icon: '🚙' },
  { value: 'truck', label: 'Truck', icon: '🚛' },
  { value: 'van', label: 'Van', icon: '🚐' },
  { value: 'motorcycle', label: 'Motorcycle', icon: '🏍️' },
];

const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  open,
  onClose,
  filters,
  onFiltersChange,
  onApplyFilters,
  onClearFilters,
}) => {
  const theme = useTheme();
  const [localFilters, setLocalFilters] = useState<FilterOptions>(filters);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    onApplyFilters();
    onClose();
  };

  const handleClear = () => {
    setLocalFilters(defaultFilters);
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < 50) count++;
    if (localFilters.spaceTypes.length > 0) count++;
    if (localFilters.amenities.length > 0) count++;
    if (localFilters.vehicleTypes.length > 0) count++;
    if (localFilters.availability !== 'any') count++;
    if (localFilters.distance < 10) count++;
    if (localFilters.rating > 0) count++;
    if (localFilters.accessibleParking) count++;
    return count;
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Paper sx={{ 
        width: 400, 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
        backgroundImage: theme.palette.mode === 'dark' 
          ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' 
          : 'none',
      }}>
        {/* Header */}
        <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              Advanced Filters
            </Typography>
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Stack>
          {getActiveFilterCount() > 0 && (
            <Chip 
              label={`${getActiveFilterCount()} active`} 
              color="primary" 
              size="small" 
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        {/* Filters Content */}
        <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Stack spacing={4}>
            {/* Price Range */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Hourly Rate Range
              </FormLabel>
              <Box sx={{ px: 2 }}>
                <Slider
                  value={localFilters.priceRange}
                  onChange={(_, value) => handleFilterChange('priceRange', value)}
                  valueLabelDisplay="on"
                  min={0}
                  max={50}
                  step={1}
                  marks={[
                    { value: 0, label: '$0' },
                    { value: 25, label: '$25' },
                    { value: 50, label: '$50+' },
                  ]}
                  valueLabelFormat={(value) => `$${value}`}
                />
              </Box>
            </Box>

            <Divider />

            {/* Space Types */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Space Type
              </FormLabel>
              <FormGroup>
                {spaceTypeOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={localFilters.spaceTypes.includes(option.value)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...localFilters.spaceTypes, option.value]
                            : localFilters.spaceTypes.filter(t => t !== option.value);
                          handleFilterChange('spaceTypes', newTypes);
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {option.icon}
                        <Typography>{option.label}</Typography>
                      </Stack>
                    }
                  />
                ))}
              </FormGroup>
            </Box>

            <Divider />

            {/* Amenities */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Amenities & Features
              </FormLabel>
              <FormGroup>
                {amenityOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={localFilters.amenities.includes(option.value)}
                        onChange={(e) => {
                          const newAmenities = e.target.checked
                            ? [...localFilters.amenities, option.value]
                            : localFilters.amenities.filter(a => a !== option.value);
                          handleFilterChange('amenities', newAmenities);
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        {option.icon}
                        <Typography>{option.label}</Typography>
                      </Stack>
                    }
                  />
                ))}
              </FormGroup>
            </Box>

            <Divider />

            {/* Vehicle Types */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Vehicle Type
              </FormLabel>
              <FormGroup>
                {vehicleTypeOptions.map((option) => (
                  <FormControlLabel
                    key={option.value}
                    control={
                      <Checkbox
                        checked={localFilters.vehicleTypes.includes(option.value)}
                        onChange={(e) => {
                          const newTypes = e.target.checked
                            ? [...localFilters.vehicleTypes, option.value]
                            : localFilters.vehicleTypes.filter(t => t !== option.value);
                          handleFilterChange('vehicleTypes', newTypes);
                        }}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography sx={{ fontSize: '1.2rem' }}>{option.icon}</Typography>
                        <Typography>{option.label}</Typography>
                      </Stack>
                    }
                  />
                ))}
              </FormGroup>
            </Box>

            <Divider />

            {/* Availability */}
            <Box>
              <FormControl fullWidth>
                <InputLabel>Availability</InputLabel>
                <Select
                  value={localFilters.availability}
                  label="Availability"
                  onChange={(e) => handleFilterChange('availability', e.target.value)}
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : 'transparent',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value="any">Any Time</MenuItem>
                  <MenuItem value="now">Available Now</MenuItem>
                  <MenuItem value="today">Available Today</MenuItem>
                  <MenuItem value="this_week">This Week</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {/* Distance */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Maximum Distance: {localFilters.distance} miles
              </FormLabel>
              <Slider
                value={localFilters.distance}
                onChange={(_, value) => handleFilterChange('distance', value)}
                min={1}
                max={25}
                step={1}
                marks={[
                  { value: 1, label: '1mi' },
                  { value: 5, label: '5mi' },
                  { value: 10, label: '10mi' },
                  { value: 25, label: '25mi' },
                ]}
              />
            </Box>

            <Divider />

            {/* Rating */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Minimum Rating
              </FormLabel>
              <FormControl fullWidth>
                <Select
                  value={localFilters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'transparent' : 'transparent',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined,
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <MenuItem value={0}>Any Rating</MenuItem>
                  <MenuItem value={3}>3+ Stars</MenuItem>
                  <MenuItem value={4}>4+ Stars</MenuItem>
                  <MenuItem value={4.5}>4.5+ Stars</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <Divider />

            {/* Quick Filters */}
            <Box>
              <FormLabel component="legend" sx={{ fontWeight: 600, mb: 2 }}>
                Accessibility
              </FormLabel>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={localFilters.accessibleParking}
                      onChange={(e) => handleFilterChange('accessibleParking', e.target.checked)}
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Accessible />
                      <Typography>Wheelchair Accessible</Typography>
                    </Stack>
                  }
                />
              </FormGroup>
            </Box>
          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ p: 3, borderTop: 1, borderColor: 'divider' }}>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              onClick={handleClear}
              fullWidth
            >
              Clear All
            </Button>
            <Button
              variant="contained"
              onClick={handleApply}
              fullWidth
            >
              Apply Filters
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Drawer>
  );
};

export default AdvancedFilters;