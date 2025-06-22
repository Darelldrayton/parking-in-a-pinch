import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  useTheme,
  alpha,
  Tabs,
  Tab,
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
} from '@mui/material';
import {
  Search,
  Payment,
  DirectionsCar,
  Star,
  LocationOn,
  Schedule,
  Security,
  AttachMoney,
  CheckCircle,
  Phone,
  CameraAlt,
} from '@mui/icons-material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`how-it-works-tabpanel-${index}`}
      aria-labelledby={`how-it-works-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const renterSteps = [
  {
    icon: <Search sx={{ fontSize: 40 }} />,
    title: 'Search for Parking',
    description: 'Enter your destination and desired time to find available parking spaces near you.',
    details: [
      'Use our map view to see all available spaces',
      'Filter by price, distance, and amenities',
      'Read reviews from other users',
      'View photos and detailed descriptions',
    ],
  },
  {
    icon: <Payment sx={{ fontSize: 40 }} />,
    title: 'Book & Pay Securely',
    description: 'Reserve your spot instantly with our secure payment system.',
    details: [
      'Book instantly or request approval from host',
      'Secure payment processing with Stripe',
      'Get confirmation and host contact details',
      'Add the booking to your calendar',
    ],
  },
  {
    icon: <DirectionsCar sx={{ fontSize: 40 }} />,
    title: 'Park with Confidence',
    description: 'Arrive at your reserved spot and park with peace of mind.',
    details: [
      'GPS directions to your exact parking spot',
      'QR code check-in for contactless experience',
      'Direct messaging with your host if needed',
      'Photo documentation for security',
    ],
  },
  {
    icon: <Star sx={{ fontSize: 40 }} />,
    title: 'Rate Your Experience',
    description: 'Help our community by rating your parking experience.',
    details: [
      'Rate the parking space and host',
      'Leave helpful reviews for future users',
      'Report any issues for quick resolution',
      'Build your reputation as a trusted renter',
    ],
  },
];

const hostSteps = [
  {
    icon: <CameraAlt sx={{ fontSize: 40 }} />,
    title: 'List Your Space',
    description: 'Create a listing for your parking space with photos and details.',
    details: [
      'Upload clear photos of your parking space',
      'Set your hourly, daily, or weekly rates',
      'Define availability schedule and rules',
      'Add special instructions or amenities',
    ],
  },
  {
    icon: <Schedule sx={{ fontSize: 40 }} />,
    title: 'Manage Bookings',
    description: 'Review booking requests and manage your calendar.',
    details: [
      'Approve or decline booking requests',
      'Set auto-approval for trusted renters',
      'Block dates when space is unavailable',
      'Communicate with renters through our platform',
    ],
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Host Safely',
    description: 'All renters are verified and transactions are secure.',
    details: [
      'All users undergo identity verification',
      'Insurance coverage for qualifying bookings',
      'Secure payment processing with automatic deposits',
      '24/7 customer support for any issues',
    ],
  },
  {
    icon: <AttachMoney sx={{ fontSize: 40 }} />,
    title: 'Earn Money',
    description: 'Get paid automatically and track your earnings.',
    details: [
      'Automatic payment processing after each booking',
      'Detailed earnings reports and analytics',
      'Flexible payout schedule (daily, weekly, or monthly)',
      'Tax documents provided for easy filing',
    ],
  },
];

const features = [
  {
    icon: <Security sx={{ fontSize: 32 }} />,
    title: 'Verified Users',
    description: 'All users undergo identity verification for safety and trust.',
  },
  {
    icon: <Phone sx={{ fontSize: 32 }} />,
    title: '24/7 Support',
    description: 'Our customer support team is available around the clock.',
  },
  {
    icon: <CheckCircle sx={{ fontSize: 32 }} />,
    title: 'Insurance Coverage',
    description: 'Qualifying bookings include liability insurance protection.',
  },
  {
    icon: <Payment sx={{ fontSize: 32 }} />,
    title: 'Secure Payments',
    description: 'All payments are processed securely through Stripe.',
  },
];

export default function HowItWorks() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

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
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              How It Works
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4, maxWidth: 800, mx: 'auto' }}>
              Parking in a Pinch makes it easy to find parking or earn money from your unused space
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Our platform connects drivers who need parking with property owners who have spaces to share. 
              It's simple, secure, and beneficial for everyone.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Tab Navigation */}
        <Box sx={{ mb: 6 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered
            sx={{
              '& .MuiTab-root': {
                fontSize: '1.1rem',
                fontWeight: 600,
                py: 2,
                px: 4,
              },
            }}
          >
            <Tab label="For Renters" />
            <Tab label="For Hosts" />
          </Tabs>
        </Box>

        {/* Renter Flow */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 6 }}>
            <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
              Finding Parking Made Simple
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
              Four easy steps to secure your perfect parking spot
            </Typography>

            <Stepper orientation="vertical" sx={{ maxWidth: 800, mx: 'auto' }}>
              {renterSteps.map((step, index) => (
                <Step key={index} active={true}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: 'primary.main',
                          color: 'white',
                          width: 60,
                          height: 60,
                          mr: 2,
                        }}
                      >
                        {step.icon}
                      </Avatar>
                    )}
                  >
                    <Typography variant="h5" fontWeight={600}>
                      {step.title}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ pl: 8, pb: 4 }}>
                      <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                        {step.description}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {step.details.map((detail, idx) => (
                          <Typography component="li" variant="body2" key={idx} sx={{ mb: 1 }}>
                            {detail}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        </TabPanel>

        {/* Host Flow */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 6 }}>
            <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
              Start Earning from Your Space
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
              Four simple steps to turn your unused parking into income
            </Typography>

            <Stepper orientation="vertical" sx={{ maxWidth: 800, mx: 'auto' }}>
              {hostSteps.map((step, index) => (
                <Step key={index} active={true}>
                  <StepLabel
                    StepIconComponent={() => (
                      <Avatar
                        sx={{
                          bgcolor: 'secondary.main',
                          color: 'white',
                          width: 60,
                          height: 60,
                          mr: 2,
                        }}
                      >
                        {step.icon}
                      </Avatar>
                    )}
                  >
                    <Typography variant="h5" fontWeight={600}>
                      {step.title}
                    </Typography>
                  </StepLabel>
                  <StepContent>
                    <Box sx={{ pl: 8, pb: 4 }}>
                      <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                        {step.description}
                      </Typography>
                      <Box component="ul" sx={{ pl: 2 }}>
                        {step.details.map((detail, idx) => (
                          <Typography component="li" variant="body2" key={idx} sx={{ mb: 1 }}>
                            {detail}
                          </Typography>
                        ))}
                      </Box>
                    </Box>
                  </StepContent>
                </Step>
              ))}
            </Stepper>
          </Box>
        </TabPanel>

        {/* Features Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Why Choose Parking in a Pinch?
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            We've built our platform with safety, security, and simplicity in mind
          </Typography>
          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
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

        {/* FAQ Section */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Frequently Asked Questions
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                How do I know my car is safe?
              </Typography>
              <Typography variant="body1" paragraph>
                All hosts are verified, and many listings include security features like cameras, 
                lighting, and gated access. We also provide insurance coverage for qualifying bookings.
              </Typography>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                What if I need to cancel my booking?
              </Typography>
              <Typography variant="body1" paragraph>
                You can cancel most bookings for free up to 24 hours before your start time. 
                Check each listing's specific cancellation policy for details.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                How much can I earn as a host?
              </Typography>
              <Typography variant="body1" paragraph>
                Earnings vary by location and demand, but many hosts earn $100-500+ per month. 
                Urban areas with high parking demand typically generate more income.
              </Typography>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                What if there's a problem during my stay?
              </Typography>
              <Typography variant="body1" paragraph>
                Our 24/7 customer support team is always available to help resolve any issues. 
                You can contact us through the app or website anytime.
              </Typography>
            </Grid>
          </Grid>
        </Paper>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Get Started?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of users who have made parking stress-free
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              Find Parking Now
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              List Your Space
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}