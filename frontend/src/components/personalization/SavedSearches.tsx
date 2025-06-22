import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import {
  Add,
  Search,
  Delete,
  Edit,
  NotificationsActive,
  LocationOn,
  Schedule,
  AttachMoney,
  Star,
  Bookmark,
  TrendingUp,
  AccessTime,
  DirectionsCar,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface SavedSearch {
  id: string;
  name: string;
  description?: string;
  criteria: SearchCriteria;
  alerts_enabled: boolean;
  last_used: string;
  created_at: string;
  results_count?: number;
  price_alerts?: PriceAlert;
}

interface SearchCriteria {
  location: {
    address: string;
    lat: number;
    lng: number;
    radius: number; // km
  };
  dates: {
    start_date?: string;
    end_date?: string;
    flexible: boolean;
  };
  price_range: {
    min: number;
    max: number;
  };
  space_types: string[];
  amenities: string[];
  duration: {
    min_hours: number;
    max_hours: number;
  };
  instant_book: boolean;
  accessibility: boolean;
  rating_min: number;
}

interface PriceAlert {
  enabled: boolean;
  threshold: number;
  frequency: 'immediately' | 'daily' | 'weekly';
  last_sent?: string;
}

interface SearchAlert {
  id: string;
  saved_search_id: string;
  type: 'new_listing' | 'price_drop' | 'availability';
  message: string;
  created_at: string;
  read: boolean;
  listing_id?: number;
}

const searchSchema = yup.object({
  name: yup.string().required('Search name is required'),
  description: yup.string(),
  location_address: yup.string().required('Location is required'),
  radius: yup.number().min(1).max(50).required(),
  price_min: yup.number().min(0),
  price_max: yup.number().min(0),
  space_types: yup.array().of(yup.string()),
  amenities: yup.array().of(yup.string()),
  min_hours: yup.number().min(1),
  max_hours: yup.number().max(168), // 1 week
  instant_book: yup.boolean(),
  accessibility: yup.boolean(),
  rating_min: yup.number().min(0).max(5),
  alerts_enabled: yup.boolean(),
  price_alert_threshold: yup.number().min(0),
  price_alert_frequency: yup.string(),
});

type SearchFormData = yup.InferType<typeof searchSchema>;

const SavedSearches: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [searches, setSearches] = useState<SavedSearch[]>([]);
  const [alerts, setAlerts] = useState<SearchAlert[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editingSearch, setEditingSearch] = useState<SavedSearch | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SearchFormData>({
    resolver: yupResolver(searchSchema),
    defaultValues: {
      name: '',
      description: '',
      location_address: '',
      radius: 5,
      price_min: 0,
      price_max: 50,
      space_types: [],
      amenities: [],
      min_hours: 1,
      max_hours: 8,
      instant_book: false,
      accessibility: false,
      rating_min: 0,
      alerts_enabled: true,
      price_alert_threshold: 0,
      price_alert_frequency: 'daily',
    },
  });

  useEffect(() => {
    loadSavedSearches();
    loadSearchAlerts();
  }, []);

  const loadSavedSearches = async () => {
    try {
      const response = await fetch('/api/v1/saved-searches/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSearches(data);
      }
    } catch (error) {
      console.error('Error loading saved searches:', error);
    }
  };

  const loadSearchAlerts = async () => {
    try {
      const response = await fetch('/api/v1/search-alerts/?unread=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data);
      }
    } catch (error) {
      console.error('Error loading search alerts:', error);
    }
  };

  const handleSaveSearch = async (data: SearchFormData) => {
    setLoading(true);
    try {
      const searchData = {
        name: data.name,
        description: data.description,
        criteria: {
          location: {
            address: data.location_address,
            lat: 40.7128, // Would be geocoded in real app
            lng: -74.0060,
            radius: data.radius,
          },
          dates: {
            flexible: true,
          },
          price_range: {
            min: data.price_min || 0,
            max: data.price_max || 100,
          },
          space_types: data.space_types || [],
          amenities: data.amenities || [],
          duration: {
            min_hours: data.min_hours || 1,
            max_hours: data.max_hours || 8,
          },
          instant_book: data.instant_book || false,
          accessibility: data.accessibility || false,
          rating_min: data.rating_min || 0,
        },
        alerts_enabled: data.alerts_enabled,
        price_alerts: data.alerts_enabled ? {
          enabled: data.price_alert_threshold > 0,
          threshold: data.price_alert_threshold,
          frequency: data.price_alert_frequency,
        } : undefined,
      };

      const url = editingSearch 
        ? `/api/v1/saved-searches/${editingSearch.id}/`
        : '/api/v1/saved-searches/';
      
      const method = editingSearch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify(searchData),
      });

      if (response.ok) {
        toast.success(editingSearch ? 'Search updated' : 'Search saved');
        setShowDialog(false);
        setEditingSearch(null);
        reset();
        loadSavedSearches();
      } else {
        toast.error('Failed to save search');
      }
    } catch (error) {
      console.error('Error saving search:', error);
      toast.error('Failed to save search');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSearch = async (searchId: string) => {
    try {
      const response = await fetch(`/api/v1/saved-searches/${searchId}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        toast.success('Search deleted');
        loadSavedSearches();
      } else {
        toast.error('Failed to delete search');
      }
    } catch (error) {
      console.error('Error deleting search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleRunSearch = (search: SavedSearch) => {
    // Update last_used timestamp
    updateLastUsed(search.id);
    
    // Navigate to listings with search criteria
    const params = new URLSearchParams({
      location: search.criteria.location.address,
      radius: search.criteria.location.radius.toString(),
      price_min: search.criteria.price_range.min.toString(),
      price_max: search.criteria.price_range.max.toString(),
      space_types: search.criteria.space_types.join(','),
      amenities: search.criteria.amenities.join(','),
      rating_min: search.criteria.rating_min.toString(),
      instant_book: search.criteria.instant_book.toString(),
      accessibility: search.criteria.accessibility.toString(),
    });

    window.location.href = `/listings?${params}`;
  };

  const updateLastUsed = async (searchId: string) => {
    try {
      await fetch(`/api/v1/saved-searches/${searchId}/use/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
    } catch (error) {
      console.error('Error updating last used:', error);
    }
  };

  const toggleAlerts = async (searchId: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/v1/saved-searches/${searchId}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          alerts_enabled: enabled,
        }),
      });

      if (response.ok) {
        toast.success(`Alerts ${enabled ? 'enabled' : 'disabled'}`);
        loadSavedSearches();
      }
    } catch (error) {
      console.error('Error toggling alerts:', error);
      toast.error('Failed to update alerts');
    }
  };

  const spaceTypes = [
    'Driveway',
    'Garage',
    'Street',
    'Parking Lot',
    'Private Lot',
    'Covered',
    'Underground',
  ];

  const amenities = [
    'EV Charging',
    'Security Camera',
    'Covered',
    'Well Lit',
    'Wheelchair Accessible',
    '24/7 Access',
    'Gated',
    'Valet',
  ];

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Bookmark sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Saved Searches
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Save your favorite search criteria and get alerts for new listings
            </Typography>
          </Box>
        </Stack>
        
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setShowDialog(true)}
        >
          Save New Search
        </Button>
      </Stack>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card sx={{ mb: 4, borderRadius: 3 }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
              Recent Alerts
            </Typography>
            
            <Stack spacing={2}>
              {alerts.slice(0, 3).map((alert) => (
                <Alert
                  key={alert.id}
                  severity="info"
                  action={
                    <Button size="small" onClick={() => {
                      // Mark as read and navigate to listing
                      if (alert.listing_id) {
                        window.location.href = `/listings/${alert.listing_id}`;
                      }
                    }}>
                      View
                    </Button>
                  }
                >
                  <Typography variant="body2">
                    {alert.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(alert.created_at).toLocaleString()}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Saved Searches */}
      {searches.length === 0 ? (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              No saved searches yet
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Save your search criteria to quickly find parking spots that match your preferences
            </Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => setShowDialog(true)}
            >
              Create Your First Search
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {searches.map((search) => (
            <Card
              key={search.id}
              sx={{
                borderRadius: 3,
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={600}>
                      {search.name}
                    </Typography>
                    {search.description && (
                      <Typography variant="body2" color="text.secondary">
                        {search.description}
                      </Typography>
                    )}
                  </Box>
                  
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingSearch(search);
                        reset({
                          name: search.name,
                          description: search.description,
                          location_address: search.criteria.location.address,
                          radius: search.criteria.location.radius,
                          price_min: search.criteria.price_range.min,
                          price_max: search.criteria.price_range.max,
                          space_types: search.criteria.space_types,
                          amenities: search.criteria.amenities,
                          min_hours: search.criteria.duration.min_hours,
                          max_hours: search.criteria.duration.max_hours,
                          instant_book: search.criteria.instant_book,
                          accessibility: search.criteria.accessibility,
                          rating_min: search.criteria.rating_min,
                          alerts_enabled: search.alerts_enabled,
                          price_alert_threshold: search.price_alerts?.threshold || 0,
                          price_alert_frequency: search.price_alerts?.frequency || 'daily',
                        });
                        setShowDialog(true);
                      }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteSearch(search.id)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </Stack>
                </Stack>

                {/* Search Criteria */}
                <Stack spacing={2} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {search.criteria.location.address} ({search.criteria.location.radius}km radius)
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AttachMoney sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      ${search.criteria.price_range.min} - ${search.criteria.price_range.max} per hour
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTime sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2">
                      {search.criteria.duration.min_hours} - {search.criteria.duration.max_hours} hours
                    </Typography>
                  </Stack>

                  {search.criteria.rating_min > 0 && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Star sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2">
                        {search.criteria.rating_min}+ stars
                      </Typography>
                    </Stack>
                  )}
                </Stack>

                {/* Tags */}
                <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                  {search.criteria.space_types.map((type) => (
                    <Chip key={type} label={type} size="small" variant="outlined" />
                  ))}
                  {search.criteria.amenities.map((amenity) => (
                    <Chip key={amenity} label={amenity} size="small" variant="outlined" />
                  ))}
                  {search.criteria.instant_book && (
                    <Chip label="Instant Book" size="small" color="primary" />
                  )}
                  {search.criteria.accessibility && (
                    <Chip label="Accessible" size="small" color="secondary" />
                  )}
                </Stack>

                {/* Stats */}
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Stack direction="row" spacing={2}>
                    {search.results_count !== undefined && (
                      <Typography variant="caption" color="text.secondary">
                        {search.results_count} results
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Used {new Date(search.last_used).toLocaleDateString()}
                    </Typography>
                  </Stack>
                  
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Badge
                      color="secondary"
                      variant="dot"
                      invisible={!search.alerts_enabled}
                    >
                      <NotificationsActive
                        sx={{
                          fontSize: 16,
                          color: search.alerts_enabled ? 'primary.main' : 'text.secondary',
                        }}
                      />
                    </Badge>
                    <Switch
                      size="small"
                      checked={search.alerts_enabled}
                      onChange={(e) => toggleAlerts(search.id, e.target.checked)}
                    />
                  </Stack>
                </Stack>

                {/* Actions */}
                <Stack direction="row" spacing={2}>
                  <Button
                    variant="contained"
                    startIcon={<Search />}
                    onClick={() => handleRunSearch(search)}
                    fullWidth
                  >
                    Search Now
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Save Search Dialog */}
      <Dialog open={showDialog} onClose={() => {
        setShowDialog(false);
        setEditingSearch(null);
        reset();
      }} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingSearch ? 'Edit Saved Search' : 'Save New Search'}
        </DialogTitle>
        
        <form onSubmit={handleSubmit(handleSaveSearch)}>
          <DialogContent>
            <Stack spacing={3} sx={{ mt: 1 }}>
              {/* Basic Info */}
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Search Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />
                )}
              />

              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description (Optional)"
                    fullWidth
                    multiline
                    rows={2}
                  />
                )}
              />

              {/* Location */}
              <Typography variant="h6" fontWeight={600}>
                Location
              </Typography>

              <Stack direction="row" spacing={2}>
                <Controller
                  name="location_address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Address or Area"
                      fullWidth
                      error={!!errors.location_address}
                      helperText={errors.location_address?.message}
                    />
                  )}
                />

                <Controller
                  name="radius"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Radius (km)"
                      type="number"
                      sx={{ minWidth: 120 }}
                      error={!!errors.radius}
                      helperText={errors.radius?.message}
                    />
                  )}
                />
              </Stack>

              {/* Price Range */}
              <Typography variant="h6" fontWeight={600}>
                Price Range
              </Typography>

              <Stack direction="row" spacing={2}>
                <Controller
                  name="price_min"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Min Price ($/hour)"
                      type="number"
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="price_max"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Max Price ($/hour)"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Stack>

              {/* Duration */}
              <Typography variant="h6" fontWeight={600}>
                Duration
              </Typography>

              <Stack direction="row" spacing={2}>
                <Controller
                  name="min_hours"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Min Hours"
                      type="number"
                      fullWidth
                    />
                  )}
                />

                <Controller
                  name="max_hours"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Max Hours"
                      type="number"
                      fullWidth
                    />
                  )}
                />
              </Stack>

              {/* Space Types */}
              <Controller
                name="space_types"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Space Types</InputLabel>
                    <Select
                      {...field}
                      multiple
                      label="Space Types"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {spaceTypes.map((type) => (
                        <MenuItem key={type} value={type}>
                          {type}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {/* Amenities */}
              <Controller
                name="amenities"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Amenities</InputLabel>
                    <Select
                      {...field}
                      multiple
                      label="Amenities"
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {amenities.map((amenity) => (
                        <MenuItem key={amenity} value={amenity}>
                          {amenity}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              {/* Other Preferences */}
              <Typography variant="h6" fontWeight={600}>
                Preferences
              </Typography>

              <Stack spacing={2}>
                <Controller
                  name="rating_min"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Minimum Rating"
                      type="number"
                      inputProps={{ min: 0, max: 5, step: 0.5 }}
                      helperText="0 = Any rating"
                    />
                  )}
                />

                <Controller
                  name="instant_book"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} />}
                      label="Instant Book Only"
                    />
                  )}
                />

                <Controller
                  name="accessibility"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={<Switch {...field} />}
                      label="Wheelchair Accessible"
                    />
                  )}
                />
              </Stack>

              {/* Alert Settings */}
              <Typography variant="h6" fontWeight={600}>
                Alert Settings
              </Typography>

              <Controller
                name="alerts_enabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch {...field} />}
                    label="Enable alerts for new listings"
                  />
                )}
              />

              <Controller
                name="price_alert_threshold"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Price Alert Threshold ($/hour)"
                    type="number"
                    helperText="Get notified when listings below this price are found (0 = disabled)"
                  />
                )}
              />

              <Controller
                name="price_alert_frequency"
                control={control}
                render={({ field }) => (
                  <FormControl>
                    <InputLabel>Alert Frequency</InputLabel>
                    <Select {...field} label="Alert Frequency">
                      <MenuItem value="immediately">Immediately</MenuItem>
                      <MenuItem value="daily">Daily Digest</MenuItem>
                      <MenuItem value="weekly">Weekly Summary</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />
            </Stack>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={() => {
              setShowDialog(false);
              setEditingSearch(null);
              reset();
            }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Search'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default SavedSearches;