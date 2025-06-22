import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  useTheme,
  alpha,
  Button,
  Paper,
} from '@mui/material';
import {
  LocationOn,
  DirectionsCar,
  People,
  NaturePeople as Eco,
  Security,
  TrendingUp,
} from '@mui/icons-material';

const teamMembers = [
  {
    name: 'Sarah Johnson',
    role: 'CEO & Co-Founder',
    bio: 'Former urban planning expert with 10+ years experience in smart city solutions.',
    avatar: 'SJ',
  },
  {
    name: 'Mike Chen',
    role: 'CTO & Co-Founder',
    bio: 'Tech veteran specializing in location-based services and mobile platforms.',
    avatar: 'MC',
  },
  {
    name: 'Emily Rodriguez',
    role: 'VP of Operations',
    bio: 'Operations specialist focused on seamless user experiences and community building.',
    avatar: 'ER',
  },
  {
    name: 'David Park',
    role: 'Lead Designer',
    bio: 'UX/UI designer passionate about creating intuitive and accessible digital experiences.',
    avatar: 'DP',
  },
];

const values = [
  {
    icon: <People sx={{ fontSize: 40 }} />,
    title: 'Community First',
    description: 'We believe in building strong communities where neighbors help neighbors find convenient parking solutions.',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Trust & Safety',
    description: 'Every user is verified, and all transactions are secure. Your safety and peace of mind are our top priorities.',
  },
  {
    icon: <Eco sx={{ fontSize: 40 }} />,
    title: 'Sustainability',
    description: 'By maximizing existing parking spaces, we reduce the need for new construction and help cities become more sustainable.',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 40 }} />,
    title: 'Innovation',
    description: 'We continuously innovate to make parking easier, more efficient, and more accessible for everyone.',
  },
];

const stats = [
  { number: '50,000+', label: 'Happy Users' },
  { number: '15,000+', label: 'Parking Spaces' },
  { number: '500,000+', label: 'Bookings Completed' },
  { number: '25+', label: 'Cities Served' },
];

export default function AboutUs() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
                About Parking in a Pinch
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
                Revolutionizing urban parking through community-driven solutions
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem' }}>
                We're on a mission to solve urban parking challenges by connecting people who need parking 
                with those who have spaces to share. Founded in 2023, we believe that the best solutions 
                come from empowering communities to help each other.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack direction="row" spacing={2}>
                  <LocationOn sx={{ fontSize: 60, opacity: 0.7 }} />
                  <DirectionsCar sx={{ fontSize: 60, opacity: 0.5 }} />
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Stats Section */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          {stats.map((stat, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h3" fontWeight={700} color="primary.main" gutterBottom>
                    {stat.number}
                  </Typography>
                  <Typography variant="h6" color="text.secondary">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Our Story Section */}
        <Grid container spacing={6} sx={{ mb: 8 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="h3" fontWeight={700} gutterBottom>
              Our Story
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
              Parking in a Pinch was born out of frustration with urban parking challenges. Our founders, 
              Sarah and Mike, were tired of circling blocks for 20 minutes looking for parking, only to 
              see empty driveways and unused parking spaces everywhere.
            </Typography>
            <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
              We realized that the solution wasn't building more parking structures, but better utilizing 
              the parking that already exists. By creating a platform where property owners can share their 
              unused spaces, we're making cities more efficient and communities stronger.
            </Typography>
            <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
              Today, we're proud to serve thousands of users across multiple cities, facilitating millions 
              of dollars in earnings for hosts while providing convenient, affordable parking for drivers.
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              }}
            >
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Our Mission
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem', mb: 3 }}>
                To transform urban mobility by making parking accessible, affordable, and sustainable 
                through community-powered solutions.
              </Typography>
              <Typography variant="h4" fontWeight={600} gutterBottom>
                Our Vision
              </Typography>
              <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                A world where finding parking is never a hassle, where communities thrive through 
                mutual support, and where cities are more livable for everyone.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Values Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Our Values
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            The principles that guide everything we do
          </Typography>
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ height: '100%', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={3} alignItems="flex-start">
                      <Box sx={{ color: 'primary.main', flexShrink: 0 }}>
                        {value.icon}
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight={600} gutterBottom>
                          {value.title}
                        </Typography>
                        <Typography variant="body1" color="text.secondary">
                          {value.description}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Team Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Meet Our Team
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            The passionate people building the future of urban parking
          </Typography>
          <Grid container spacing={4}>
            {teamMembers.map((member, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                        fontSize: '2rem',
                        fontWeight: 600,
                        mx: 'auto',
                        mb: 2,
                      }}
                    >
                      {member.avatar}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {member.name}
                    </Typography>
                    <Typography variant="subtitle1" color="primary.main" gutterBottom>
                      {member.role}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {member.bio}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            textAlign: 'center',
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Join Our Community
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Whether you're looking for parking or have a space to share, we'd love to have you!
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Find Parking
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Become a Host
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}