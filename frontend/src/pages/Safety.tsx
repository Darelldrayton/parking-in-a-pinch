import React from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  Security,
  Verified,
  Shield,
  Camera,
  Phone,
  LocationOn,
  CheckCircle,
  Report,
  Support,
  LocalPolice,
} from '@mui/icons-material';

const safetyFeatures = [
  {
    icon: <Verified sx={{ fontSize: 40 }} />,
    title: 'Identity Verification',
    description: 'All users undergo thorough identity verification before joining our platform.',
  },
  {
    icon: <Shield sx={{ fontSize: 40 }} />,
    title: 'Insurance Coverage',
    description: 'Qualifying bookings include liability insurance protection for both hosts and renters.',
  },
  {
    icon: <Camera sx={{ fontSize: 40 }} />,
    title: 'Photo Documentation',
    description: 'Secure check-in/out process with photo verification for added security.',
  },
  {
    icon: <Phone sx={{ fontSize: 40 }} />,
    title: '24/7 Emergency Support',
    description: 'Round-the-clock emergency support for urgent safety issues.',
  },
  {
    icon: <LocationOn sx={{ fontSize: 40 }} />,
    title: 'GPS Tracking',
    description: 'Real-time location sharing and GPS tracking for enhanced safety.',
  },
  {
    icon: <Report sx={{ fontSize: 40 }} />,
    title: 'Incident Reporting',
    description: 'Easy-to-use reporting system for any safety concerns or incidents.',
  },
];

const safetyTips = {
  renters: [
    'Always verify the parking location before arrival',
    'Take photos of your vehicle and the parking space',
    'Follow all posted parking rules and restrictions',
    'Report any unsafe conditions immediately',
    'Keep your booking confirmation accessible',
    'Contact the host for any access issues',
    'Use well-lit areas when possible',
    'Trust your instincts - if something feels wrong, leave',
  ],
  hosts: [
    'Ensure your parking area is well-lit and secure',
    'Provide clear and accurate access instructions',
    'Maintain your parking space in good condition',
    'Respond promptly to renter communications',
    'Report suspicious activity to authorities',
    'Keep emergency contact information updated',
    'Consider security cameras for high-value areas',
    'Review and approve renters carefully',
  ],
};

export default function Safety() {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.error.dark} 0%, ${theme.palette.warning.main} 100%)`,
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Safety & Security
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Your safety is our top priority
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              We've built comprehensive safety measures and guidelines to ensure a secure experience for all users.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Safety Features */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Our Safety Features
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Multiple layers of protection for your peace of mind
          </Typography>
          
          <Grid container spacing={4}>
            {safetyFeatures.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Safety Guidelines */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Safety Guidelines
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                <Typography variant="h4" fontWeight={600} gutterBottom>
                  For Renters
                </Typography>
                <List>
                  {safetyTips.renters.map((tip, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                <Typography variant="h4" fontWeight={600} gutterBottom color="secondary.main">
                  For Hosts
                </Typography>
                <List>
                  {safetyTips.hosts.map((tip, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={tip} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Emergency Procedures */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            bgcolor: alpha(theme.palette.error.main, 0.05),
          }}
        >
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Emergency Procedures
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
                <CardContent sx={{ p: 4 }}>
                  <LocalPolice sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Life-Threatening Emergency
                  </Typography>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    Call 911
                  </Typography>
                  <Typography variant="body2">
                    For immediate danger, medical emergencies, or criminal activity
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                <CardContent sx={{ p: 4 }}>
                  <Support sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Safety Support
                  </Typography>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    Email Us
                  </Typography>
                  <Typography variant="body2">
                    safety@parkinginapinch.com - For urgent safety issues
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, bgcolor: 'info.light', color: 'info.contrastText' }}>
                <CardContent sx={{ p: 4 }}>
                  <Report sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Report Incident
                  </Typography>
                  <Typography variant="h4" fontWeight={700} gutterBottom>
                    In-App Report
                  </Typography>
                  <Typography variant="body2">
                    For non-emergency issues and incident documentation
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* Insurance Information */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Insurance Coverage
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Protection for qualifying bookings
          </Typography>
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom>
                    What's Covered
                  </Typography>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Third-party liability coverage" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Property damage protection" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Host protection insurance" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Guest accident coverage" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom color="secondary.main">
                    Coverage Limits
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Liability Coverage: $1,000,000
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Per incident coverage limit
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Property Damage: $100,000
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Maximum coverage per claim
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>
                        Deductible: $1,000
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Per claim deductible amount
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Report Safety Issues */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Report Safety Concerns
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Help us maintain a safe community for everyone
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Report />}
              color="error"
              sx={{ px: 4, py: 1.5 }}
            >
              Report Incident
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Support />}
              sx={{ px: 4, py: 1.5 }}
            >
              Contact Support
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}