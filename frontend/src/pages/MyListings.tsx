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
  Button,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Stack,
  Chip,
  Avatar,
  LinearProgress,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  MoreVert as MoreVertIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
  AttachMoney as MoneyIcon,
  Schedule as ScheduleIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  ArrowBack,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface Listing {
  id: number;
  title: string;
  description: string;
  address: string;
  space_type: string;
  hourly_rate: number;
  daily_rate: number;
  weekly_rate: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rating_average: number;
  total_reviews: number;
  images: any[];
}

export default function MyListings() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedListing, setSelectedListing] = useState<number | null>(null);

  useEffect(() => {
    // Clear any cached listing data that might have stale listing IDs
    localStorage.removeItem('listings_cache');
    loadMyListings();
  }, []);

  const loadMyListings = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping listings load');
        setListings([]);
        return;
      }
      
      // Clear any cached listing data
      localStorage.removeItem('listings_cache');
      
      // Use the dedicated my-listings endpoint for better user filtering
      const response = await api.get('/listings/my-listings/');
      const listingsData = response.data.results || response.data || [];
      
      setListings(listingsData);
    } catch (error: any) {
      console.error('Error loading my listings:', error);
      if (error.response?.status === 401) {
        console.log('Authentication error - token may be expired');
        // Clear invalid auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token'); 
        localStorage.removeItem('user');
        setListings([]);
        return;
      }
      
      // If the my-listings endpoint fails, try the fallback
      try {
        const response = await api.get('/listings/');
        const allListings = response.data.results || response.data || [];
        const userListings = allListings.filter((listing: any) => {
          return listing.host && (listing.host.id === user?.id || listing.host.email === user?.email);
        });
        setListings(userListings);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        setListings([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, listingId: number) => {
    setAnchorEl(event.currentTarget);
    setSelectedListing(listingId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedListing(null);
  };

  const handleToggleStatus = async (listingId: number) => {
    try {
      // Ensure the listing exists in our current data
      const listing = listings.find(l => l.id === listingId);
      if (!listing) {
        toast.error('Listing not found. Please refresh the page.');
        loadMyListings(); // Reload data
        return;
      }
      
      await api.post(`/listings/${listingId}/toggle_status/`);
      loadMyListings(); // Reload to get updated status
      handleMenuClose();
      toast.success('Listing status updated successfully!');
    } catch (error: any) {
      console.error('Error toggling listing status:', error);
      if (error.response?.status === 404) {
        toast.error('Toggle status endpoint not found. Please check if the backend is running.');
      } else if (error.response?.status === 401) {
        toast.error('Authentication required. Please log in again.');
      } else {
        toast.error('Failed to update listing status');
      }
    }
  };

  const handleEditListing = (listingId: number) => {
    // Navigate to create listing page with edit mode
    navigate(`/create-listing?edit=${listingId}`);
    handleMenuClose();
  };

  const handleViewListing = (listingId: number) => {
    // Navigate to listing detail page
    navigate(`/listings/${listingId}`);
    handleMenuClose();
  };

  const handleCardClick = (listingId: number) => {
    // Navigate to listing detail page when card is clicked
    navigate(`/listings/${listingId}`);
  };

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
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        py: 6,
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Box>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <IconButton 
                      onClick={() => navigate('/dashboard')} 
                      sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
                    >
                      <ArrowBack />
                    </IconButton>
                    <Typography variant="h3" component="h1" fontWeight={700} color="white">
                      My Listings
                    </Typography>
                  </Stack>
                  <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }} color="white">
                    Manage your parking spaces and track their performance
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<AddIcon />}
                  onClick={() => navigate('/create-listing')}
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 600,
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.9),
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[8],
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Add New Listing
                </Button>
              </Stack>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Summary Stats */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <LocationIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'primary.main' }}>
                  {listings.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Listings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <ToggleOnIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'success.main' }}>
                  {listings.filter(l => l.is_active).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Listings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <MoneyIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'warning.main' }}>
                  ${listings.length > 0 ? (listings.reduce((sum, l) => sum + l.hourly_rate, 0) / listings.length).toFixed(0) : '0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg. Hourly Rate
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <StarIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                <Typography variant="h4" fontWeight={700} sx={{ color: 'info.main' }}>
                  {listings.length > 0 ? (listings.reduce((sum, l) => sum + Number(l.rating_average), 0) / listings.length).toFixed(1) : '0.0'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Avg. Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Listings Grid */}
        {listings.length === 0 ? (
          <Paper elevation={2} sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
            <LocationIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h5" fontWeight={600} sx={{ mb: 2 }}>
              No Listings Yet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Create your first parking listing to start earning money from your space.
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => navigate('/create-listing')}
              sx={{ borderRadius: 2, px: 4 }}
            >
              Create Your First Listing
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {listings.map((listing, index) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={listing.id}>
                <Fade in timeout={500 + index * 100}>
                  <Card 
                    onClick={() => handleCardClick(listing.id)}
                    sx={{
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[12],
                      },
                    }}>
                    <Box sx={{
                      height: 180,
                      background: listing.images?.length > 0 
                        ? `url(${listing.images[0].image_url})` 
                        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.8)} 0%, ${alpha(theme.palette.primary.dark, 0.9)} 100%)`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: listing.images?.length > 0 ? 'flex-end' : 'center',
                      color: 'white',
                      position: 'relative',
                    }}>
                      {!listing.images?.length && (
                        <LocationIcon sx={{ fontSize: 48 }} />
                      )}
                      <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent card click when menu is clicked
                            handleMenuClick(e, listing.id);
                          }}
                          sx={{ 
                            bgcolor: alpha(theme.palette.common.white, 0.2),
                            color: 'white',
                            '&:hover': { bgcolor: alpha(theme.palette.common.white, 0.3) }
                          }}
                        >
                          <MoreVertIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Chip
                          label={listing.is_active ? 'Active' : 'Inactive'}
                          size="small"
                          color={listing.is_active ? 'success' : 'default'}
                          sx={{ fontWeight: 500 }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                          {listing.space_type}
                        </Typography>
                      </Stack>
                      
                      <Typography variant="h6" fontWeight={600} noWrap sx={{ mb: 1 }} color="text.primary">
                        {listing.title}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {listing.address}
                      </Typography>

                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          ${listing.hourly_rate}/hour
                        </Typography>
                        {listing.daily_rate > 0 && (
                          <Typography variant="body2" fontWeight={600} color="secondary.main">
                            ${listing.daily_rate}/day
                          </Typography>
                        )}
                      </Stack>

                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="body2" fontWeight={600}>
                            {Number(listing.rating_average) > 0 ? Number(listing.rating_average).toFixed(1) : 'New'}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ({listing.total_reviews} reviews)
                          </Typography>
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Created {new Date(listing.created_at).toLocaleDateString()}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                </Fade>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem onClick={() => selectedListing && handleViewListing(selectedListing)}>
            <ListItemIcon>
              <ViewIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>View Details</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedListing && handleEditListing(selectedListing)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Listing</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => selectedListing && handleToggleStatus(selectedListing)}>
            <ListItemIcon>
              {listings.find(l => l.id === selectedListing)?.is_active ? 
                <ToggleOffIcon fontSize="small" /> : 
                <ToggleOnIcon fontSize="small" />
              }
            </ListItemIcon>
            <ListItemText>
              {listings.find(l => l.id === selectedListing)?.is_active ? 'Deactivate' : 'Activate'}
            </ListItemText>
          </MenuItem>
        </Menu>
      </Container>
    </Box>
  );
}