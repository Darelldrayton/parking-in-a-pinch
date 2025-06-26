import React, { useState, useEffect, useCallback, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  TextField,
  InputAdornment,
  Autocomplete,
  Paper,
  Chip,
  Stack,
  IconButton,
  Skeleton,
  Alert,
  useTheme,
  useMediaQuery,
  Fade,
  Zoom,
  alpha,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  AccessTime,
  LocalParking,
  Star,
  ArrowForward,
  DirectionsCar,
  Security,
  AttachMoney,
  EmojiTransportation,
  HourglassEmpty,
  Place,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { getListings } from '../services/listings';
import InteractiveMap from '../components/maps/InteractiveMap';
import { useAuth } from '../context/AuthContext';
import { useBookings } from '../context/BookingsContext';
import { PrivateImage } from '../components/common/PrivateImage';

interface Listing {
  id: number;
  title: string;
  description: string;
  price_per_hour: string;
  address: string;
  latitude: number;
  longitude: number;
  is_available: boolean;
  created_at: string;
  images?: { image: string }[];
  rating?: number;
  reviews_count?: number;
}

const popularLocations = [
  'Downtown',
  'Airport',
  'Stadium',
  'University',
  'Shopping Mall',
  'Hospital',
  'Train Station',
];

// Memoized ListingCard component to prevent unnecessary re-renders
const ListingCard = memo(({ listing, theme, navigate }: { 
  listing: Listing, 
  theme: any, 
  navigate: any 
}) => (
  <Fade in timeout={300}>
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: theme.shadows[8],
        },
      }}
    >
      <CardActionArea onClick={() => navigate(`/listings/${listing.id}`)}>
        <PrivateImage
          listing={listing}
          height="200"
          alt={listing.title}
          showPrivacyIndicator={true}
        />
        <CardContent sx={{ flexGrow: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={1}>
            <Typography gutterBottom variant="h6" component="h3" sx={{ flex: 1 }}>
              {listing.title}
            </Typography>
            {listing.is_available && (
              <Chip label="Available" color="success" size="small" />
            )}
          </Stack>
          
          <Stack direction="row" spacing={0.5} alignItems="center" mb={2}>
            <LocationOn fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {listing.address}
            </Typography>
          </Stack>

          {listing.rating && (
            <Stack direction="row" spacing={0.5} alignItems="center" mb={2}>
              <Star fontSize="small" />
              <Typography variant="body2">
                {listing.rating} ({listing.reviews_count} reviews)
              </Typography>
            </Stack>
          )}

          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5"  fontWeight="bold">
              ${listing.price_per_hour}/hr
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDistanceToNow(new Date(listing.created_at), { addSuffix: true })}
            </Typography>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  </Fade>
));

function Home() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [featuredListings, setFeaturedListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchLocation, setSearchLocation] = useState<string | null>('');
  const [searchDate, setSearchDate] = useState('');

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadFeaturedListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      const response = await getListings({ limit: 6 });
      setFeaturedListings(response.results || []);
    } catch (err) {
      console.error('Error loading featured listings:', err);
      setError('Failed to load featured listings');
      setFeaturedListings([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Only load once on mount
    loadFeaturedListings();
  }, []); // Empty dependency array

  const handleSearch = useCallback(() => {
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (searchDate) params.append('date', searchDate);
    navigate(`/listings?${params.toString()}`);
  }, [searchLocation, searchDate, navigate]);

  return (
    <Box suppressHydrationWarning>
      {/* Combined Hero Section with Quick Access at top */}
      <Box
        sx={{
          position: 'relative',
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          overflow: 'hidden',
          py: 12,
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.1,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Quick Access Section - At the very top */}
          <Fade in timeout={300}>
            <Box sx={{ mb: 6 }}>
              <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 'md', mx: 'auto' }}>
                {/* Quick Login Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={8}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.95)
                        : 'rgba(255, 255, 255, 0.95)',
                      textAlign: 'center',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[16],
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                      }}
                    >
                      <EmojiTransportation sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      Find Parking
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Already have an account? Sign in to start searching for parking spots near you.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/login')}
                      sx={{
                        mb: 2,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                      }}
                    >
                      Sign In
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Don't have an account?{' '}
                      <Button
                        variant="text"
                        size="small"
                        onClick={() => navigate('/signup')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Sign up as Renter
                      </Button>
                    </Typography>
                  </Paper>
                </Grid>

                {/* Host Signup Card */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={8}
                    sx={{
                      p: 4,
                      borderRadius: 3,
                      background: theme.palette.mode === 'dark' 
                        ? alpha(theme.palette.background.paper, 0.95)
                        : 'rgba(255, 255, 255, 0.95)',
                      textAlign: 'center',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[16],
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: 'secondary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                      }}
                    >
                      <AttachMoney sx={{ fontSize: 40 }} />
                    </Box>
                    <Typography variant="h5" fontWeight={700} gutterBottom>
                      Earn Money
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                      Have a parking space? Start earning money by renting it out to drivers in need.
                    </Typography>
                    <Button
                      variant="contained"
                      size="large"
                      fullWidth
                      onClick={() => navigate('/signup?type=host')}
                      color="secondary"
                      sx={{
                        mb: 2,
                        py: 1.5,
                        background: `linear-gradient(135deg, ${theme.palette.secondary.main} 0%, ${theme.palette.secondary.dark} 100%)`,
                      }}
                    >
                      Become a Host
                    </Button>
                    <Typography variant="body2" color="text.secondary">
                      Already hosting?{' '}
                      <Button
                        variant="text"
                        size="small"
                        color="secondary"
                        onClick={() => navigate('/login')}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Sign in here
                      </Button>
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Fade>

          {/* Main Hero Content */}
          <Box sx={{ textAlign: 'center', maxWidth: 800, mx: 'auto' }}>
            <Fade in timeout={500}>
              <Box>
                <Typography
                  variant="h1"
                  component="h1"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    mb: 3,
                  }}
                >
                  Find Parking in a Pinch
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    mb: 4,
                    opacity: 0.9,
                    fontWeight: 300,
                  }}
                >
                  Discover convenient parking spots near you or monetize your unused space
                </Typography>

                {/* Search Box */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 3,
                    borderRadius: 2,
                    backgroundColor: theme.palette.background.paper,
                    mb: 4,
                    border: theme.palette.mode === 'dark' ? `1px solid ${alpha(theme.palette.divider, 0.2)}` : 'none',
                  }}
                >
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Autocomplete
                        freeSolo
                        options={popularLocations}
                        value={searchLocation}
                        onChange={(_, value) => setSearchLocation(value)}
                        PaperComponent={({ children, ...props }) => (
                          <Paper 
                            {...props} 
                            sx={{ 
                              borderRadius: 2, 
                              mt: 1,
                              boxShadow: theme.shadows[8],
                              border: `1px solid ${theme.palette.divider}`,
                              backgroundColor: theme.palette.background.paper,
                              backgroundImage: theme.palette.mode === 'dark' 
                                ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' 
                                : 'none',
                            }}
                          >
                            {children}
                          </Paper>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            placeholder="Where do you need parking?"
                            InputProps={{
                              ...params.InputProps,
                              startAdornment: (
                                <InputAdornment position="start">
                                  <LocationOn  />
                                </InputAdornment>
                              ),
                              sx: {
                                backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.6) : 'transparent',
                                '& .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : undefined,
                                },
                                '&:hover .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                  borderColor: theme.palette.primary.main,
                                },
                              },
                            }}
                          />
                        )}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }}>
                      <TextField
                        type="datetime-local"
                        value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)}
                        placeholder="When?"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <AccessTime  />
                            </InputAdornment>
                          ),
                          sx: {
                            backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.default, 0.6) : 'transparent',
                            '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.mode === 'dark' ? alpha(theme.palette.divider, 0.3) : undefined,
                            },
                            '&:hover .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                            },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                              borderColor: theme.palette.primary.main,
                            },
                          },
                        }}
                        fullWidth
                      />
                    </Grid>
                    <Grid size={{ xs: 12, md: 2 }}>
                      <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        onClick={handleSearch}
                        startIcon={<SearchIcon />}
                        sx={{ height: '56px' }}
                      >
                        Search
                      </Button>
                    </Grid>
                  </Grid>
                </Paper>

                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    size="large"
                    onClick={() => navigate('/create-listing')}
                    sx={{
                      bgcolor: theme.palette.mode === 'dark' ? alpha(theme.palette.background.paper, 0.9) : 'white',
                      color: 'primary.main',
                      '&:hover': {
                        bgcolor: theme.palette.mode === 'dark' ? theme.palette.background.paper : 'grey.100',
                      },
                    }}
                  >
                    List Your Space
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={() => navigate('/listings')}
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                      },
                    }}
                  >
                    Browse All
                  </Button>
                </Stack>
              </Box>
            </Fade>
          </Box>
        </Container>

        {/* Wave SVG to transition to next section */}
        <Box
          sx={{
            position: 'absolute',
            bottom: -1,
            left: 0,
            right: 0,
            lineHeight: 0,
          }}
        >
          <svg
            viewBox="0 0 1440 120"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ width: '100%', height: 'auto' }}
          >
            <path
              d="M0 0L60 10C120 20 240 40 360 46.7C480 53.3 600 46.7 720 43.3C840 40 960 40 1080 46.7C1200 53.3 1320 66.7 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill={theme.palette.background.default}
            />
          </svg>
        </Box>
      </Box>

      {/* Features Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
          Why Choose Parking in a Pinch?
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          We make parking simple, secure, and affordable
        </Typography>
        
        <Grid container spacing={4}>
          {[
            {
              icon: <DirectionsCar fontSize="large" />,
              title: 'Easy Booking',
              description: 'Book your parking spot in seconds with our intuitive platform',
              color: 'primary',
            },
            {
              icon: <Security fontSize="large" />,
              title: 'Secure & Safe',
              description: 'All parking spots are verified and monitored for your safety',
              color: 'success',
            },
            {
              icon: <AttachMoney fontSize="large" />,
              title: 'Best Prices',
              description: 'Compare prices and find the most affordable parking options',
              color: 'success',
            },
            {
              icon: <EmojiTransportation fontSize="large" />,
              title: 'Prime Locations',
              description: 'Parking spots available near all major attractions and venues',
              color: 'primary',
            },
          ].map((feature, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <Zoom in timeout={500 + index * 200}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: 2,
                    border: `1px solid ${theme.palette.divider}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: theme.shadows[8],
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: `${feature.color}.light`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: `${feature.color}.main`,
                    }}
                  >
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" gutterBottom fontWeight="bold">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </Paper>
              </Zoom>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* How It Works Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
            How It Works
          </Typography>
          <Grid container spacing={4} sx={{ mt: 4 }}>
            {[
              {
                step: '1',
                title: 'Search',
                description: 'Find available parking spots in your desired location',
                color: 'primary',
                icon: <SearchIcon sx={{ fontSize: 40 }} />,
              },
              {
                step: '2',
                title: 'Book',
                description: 'Reserve your spot with instant confirmation',
                color: 'secondary',
                icon: <ArrowForward sx={{ fontSize: 40 }} />,
              },
              {
                step: '3',
                title: 'Park',
                description: 'Navigate to your spot and park worry-free',
                color: 'primary',
                icon: <Place sx={{ fontSize: 40 }} />,
              },
            ].map((item, index) => (
              <Grid size={{ xs: 12, md: 4 }} key={index}>
                <Box textAlign="center">
                  <Box
                    sx={{
                      width: 100,
                      height: 100,
                      borderRadius: '50%',
                      bgcolor: `${item.color}.light`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                      fontSize: '2.5rem',
                      fontWeight: 'bold',
                      color: `${item.color}.main`,
                    }}
                  >
                    {item.step}
                  </Box>
                  <Typography variant="h5" gutterBottom fontWeight="bold">
                    {item.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    {item.description}
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Box sx={{}}>
                      {item.icon}
                    </Box>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>


      {/* Interactive Map Section */}
      <Box sx={{ bgcolor: 'background.paper', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" gutterBottom fontWeight="bold">
            Explore Parking Locations
          </Typography>
          <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
            Interactive map showing available parking spots in real-time
          </Typography>
          
          <Box sx={{ opacity: 1 }}>
            <InteractiveMap />
          </Box>
        </Container>
      </Box>


      {/* CTA Section */}
      <Box
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 8,
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography variant="h3" gutterBottom fontWeight="bold">
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" sx={{ mb: 4 }}>
            Join thousands of users finding and sharing parking spaces
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
          >
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
              }}
            >
              Sign Up as Renter
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/signup?type=host')}
              sx={{
                borderColor: 'white',
                color: 'white',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                },
              }}
            >
              Become a Host
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;