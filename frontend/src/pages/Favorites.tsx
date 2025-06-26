import React, { useState, useEffect } from 'react';
import {
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  IconButton,
  Chip,
  Stack,
  Box,
  Paper,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocationOn,
  Star,
  Favorite,
  FavoriteBorder,
  AttachMoney,
  DirectionsCar,
  Security,
  ElectricBolt,
  LocalParking,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

interface FavoriteListing {
  id: number;
  title: string;
  description: string;
  address: string;
  hourly_rate: number;
  daily_rate: number;
  space_type: string;
  amenities: string[];
  rating_average: number;
  total_reviews: number;
  images: any[];
  is_active: boolean;
}

const Favorites: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [favorites, setFavorites] = useState<number[]>([]);
  const [favoriteListings, setFavoriteListings] = useState<FavoriteListing[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user]);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      // Check if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping favorites load');
        setFavorites([]);
        setFavoriteListings([]);
        return;
      }

      // Load favorites from localStorage
      const storedFavorites = localStorage.getItem(`favorites_${user?.id}`);
      if (storedFavorites) {
        const favoriteIds = JSON.parse(storedFavorites);
        setFavorites(favoriteIds);
        
        if (favoriteIds.length > 0) {
          // Fetch actual listing data for favorites
          const listingsResponse = await api.get('/listings/');
          const allListings = listingsResponse.data.results || listingsResponse.data || [];
          
          // Filter to only include favorited listings
          const favListings = allListings.filter((listing: any) => favoriteIds.includes(listing.id));
          setFavoriteListings(favListings);
        } else {
          setFavoriteListings([]);
        }
      }
    } catch (error: any) {
      console.error('Error loading favorites:', error);
      if (error.response?.status === 401) {
        console.log('Authentication error - user needs to log in');
        setFavorites([]);
        setFavoriteListings([]);
        return;
      }
      toast.error('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = (id: number) => {
    const updatedFavorites = favorites.filter(fav => fav !== id);
    setFavorites(updatedFavorites);
    setFavoriteListings(prev => prev.filter(listing => listing.id !== id));
    
    // Update localStorage
    localStorage.setItem(`favorites_${user?.id}`, JSON.stringify(updatedFavorites));
    toast.success('Removed from favorites');
  };

  const handleCardClick = (listingId: number) => {
    navigate(`/listings/${listingId}`);
  };

  const getAmenityIcon = (listing: FavoriteListing) => {
    if (listing.amenities?.includes('ev_charging')) return <ElectricBolt sx={{ fontSize: 16 }} />;
    if (listing.amenities?.includes('security')) return <Security sx={{ fontSize: 16 }} />;
    if (listing.amenities?.includes('covered')) return <DirectionsCar sx={{ fontSize: 16 }} />;
    return <LocalParking sx={{ fontSize: 16 }} />;
  };

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Favorite Parking Spots
        </Typography>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            Please log in to view your favorites
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to save and manage your favorite parking spots.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Favorite Parking Spots
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Your saved parking spots for quick access
      </Typography>

      {loading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            Loading your favorites...
          </Typography>
        </Paper>
      ) : favoriteListings.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No favorites yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the heart icon on any parking spot to add it to your favorites.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {favoriteListings.map((listing) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={listing.id}>
              <Card
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[8],
                  },
                }}
              >
                <Box sx={{ position: 'relative' }}>
                  <CardActionArea onClick={() => handleCardClick(listing.id)}>
                    {listing.images?.length > 0 ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={listing.images[0].image_url}
                        alt={listing.title}
                        sx={{
                          transition: 'transform 0.3s ease',
                          '&:hover': {
                            transform: 'scale(1.02)',
                          },
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        }}
                      >
                        <LocalParking sx={{ fontSize: 64 }} />
                      </Box>
                    )}
                  </CardActionArea>
                  <IconButton
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFavorite(listing.id);
                    }}
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: alpha(theme.palette.background.paper, 0.9),
                      '&:hover': {
                        bgcolor: theme.palette.background.paper,
                        transform: 'scale(1.1)',
                      },
                    }}
                    size="small"
                  >
                    <Favorite sx={{ color: 'error.main', fontSize: 20 }} />
                  </IconButton>
                  <Chip
                    label={listing.is_active ? "Available" : "Unavailable"}
                    color={listing.is_active ? "success" : "default"}
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      fontWeight: 600,
                    }}
                  />
                </Box>
                  
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    {listing.title}
                  </Typography>
                  
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {listing.address}
                    </Typography>
                  </Stack>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <AttachMoney sx={{ fontSize: 16 }} />
                      <Typography variant="h6" fontWeight={700} >
                        ${listing.hourly_rate}/hr
                      </Typography>
                    </Stack>
                    
                    {Number(listing.rating_average) > 0 && (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                        <Typography variant="body2" fontWeight={600}>
                          {Number(listing.rating_average).toFixed(1)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({listing.total_reviews})
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                  
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      icon={getAmenityIcon(listing)}
                      label={listing.space_type}
                      size="small"
                      variant="outlined"
                    />
                    {listing.amenities?.includes('covered') && (
                      <Chip label="Covered" size="small" variant="outlined" />
                    )}
                    {listing.amenities?.includes('security') && (
                      <Chip label="Secure" size="small" variant="outlined" />
                    )}
                    {listing.amenities?.includes('ev_charging') && (
                      <Chip label="EV Charging" size="small" variant="outlined" />
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default Favorites;