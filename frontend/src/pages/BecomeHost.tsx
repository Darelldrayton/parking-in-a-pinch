import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Paper,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Avatar,
  TextField,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AttachMoney,
  Schedule,
  Camera,
  Verified,
  TrendingUp,
  Security,
  Support,
  Star,
  LocationOn,
  DirectionsCar,
  Calculate as Calculator,
  CheckCircle,
  EmojiEmotions,
  Groups,
  Visibility,
} from '@mui/icons-material';

const benefits = [
  {
    icon: <AttachMoney sx={{ fontSize: 40 }} />,
    title: 'Earn Extra Income',
    description: 'Turn your unused parking space into a steady income stream. Most hosts earn $100-500+ per month.',
    color: 'success',
    highlight: 'Average $300/month',
  },
  {
    icon: <Schedule sx={{ fontSize: 40 }} />,
    title: 'Flexible Schedule',
    description: 'You control when your space is available. Block dates when you need it for yourself.',
    color: 'primary',
    highlight: '100% Your Schedule',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Secure Platform',
    description: 'All users are verified. Secure payment processing and platform protection for every booking.',
    color: 'warning',
    highlight: 'Verified Users',
  },
  {
    icon: <Support sx={{ fontSize: 40 }} />,
    title: '24/7 Support',
    description: 'Our customer support team is always available to help you and your guests.',
    color: 'info',
    highlight: 'Always Available',
  },
];

const steps = [
  {
    title: 'Create Your Listing',
    description: 'Upload photos and describe your parking space',
    details: [
      'Take clear photos from multiple angles',
      'Describe your space type and amenities',
      'Set clear instructions for access',
      'Define any special rules or restrictions',
    ],
  },
  {
    title: 'Set Your Pricing',
    description: 'Choose competitive rates for your area',
    details: [
      'Research similar listings in your area',
      'Set hourly, daily, and weekly rates',
      'Offer discounts for longer bookings',
      'Adjust pricing based on demand',
    ],
  },
  {
    title: 'Define Availability',
    description: 'Control when your space is bookable',
    details: [
      'Set your general availability schedule',
      'Block specific dates when unavailable',
      'Choose instant booking or approval required',
      'Set advance booking limits',
    ],
  },
  {
    title: 'Complete Verification',
    description: 'Verify your identity for safety and trust',
    details: [
      'Upload a government-issued ID',
      'Verify your phone number',
      'Confirm your payment information',
      'Review and accept host guidelines',
    ],
  },
];

const testimonials = [
  {
    name: 'Sarah M.',
    location: 'San Francisco, CA',
    earnings: '$450/month',
    quote: 'I love earning extra income from my driveway while helping my neighbors find convenient parking.',
    rating: 5,
  },
  {
    name: 'Mike R.',
    location: 'Austin, TX',
    earnings: '$320/month',
    quote: 'The platform is so easy to use, and the support team is incredibly helpful.',
    rating: 5,
  },
  {
    name: 'Emily L.',
    location: 'New York, NY',
    earnings: '$680/month',
    quote: 'My parking space in Manhattan is in high demand. Great way to monetize unused space!',
    rating: 5,
  },
];

const earningsCalculator = {
  hourlyRate: 5,
  hoursPerDay: 8,
  daysPerMonth: 20,
  get monthlyEarnings() {
    return this.hourlyRate * this.hoursPerDay * this.daysPerMonth;
  },
};

export default function BecomeHost() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [calculatorData, setCalculatorData] = useState({
    hourlyRate: 5,
    hoursPerDay: 8,
    daysPerMonth: 20,
  });

  const calculateEarnings = () => {
    return calculatorData.hourlyRate * calculatorData.hoursPerDay * calculatorData.daysPerMonth;
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
                Become a Host
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
                Turn your parking space into a steady income stream
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', mb: 4 }}>
                Join thousands of hosts who are earning extra income by sharing their unused parking spaces. 
                It's easy, flexible, and profitable.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={() => navigate('/signup?type=host')}
                  sx={{
                    bgcolor: 'white',
                    color: 'success.main',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.9),
                    },
                  }}
                >
                  Start Hosting Today
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => {
                    document.getElementById('how-to-get-started')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  sx={{
                    borderColor: 'white',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      borderColor: 'white',
                      bgcolor: alpha(theme.palette.common.white, 0.1),
                    },
                  }}
                >
                  Learn More
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.1)}, ${alpha(theme.palette.success.light, 0.1)})`,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <DirectionsCar sx={{ fontSize: 60, opacity: 0.7 }} />
                  <AttachMoney sx={{ fontSize: 80, opacity: 0.9 }} />
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Quick Stats */}
        <Grid container spacing={4} sx={{ mb: 8 }}>
          <Grid item xs={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" fontWeight={700} color="success.main">
                  5,000+
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Active Hosts
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" fontWeight={700} color="primary.main">
                  $300
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Average Monthly Earnings
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" fontWeight={700} color="warning.main">
                  4.8★
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Average Host Rating
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6} md={3}>
            <Card sx={{ textAlign: 'center', borderRadius: 3, background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)` }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h3" fontWeight={700} color="info.main">
                  95%
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Host Satisfaction
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Benefits Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Why Host with Us?
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Join a trusted platform that puts hosts first
          </Typography>
          
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: `${benefit.color}.main`, mb: 2 }}>
                      {benefit.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {benefit.description}
                    </Typography>
                    <Chip 
                      label={benefit.highlight}
                      size="small"
                      color={benefit.color as any}
                      sx={{ fontWeight: 600 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Earnings Calculator */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 8,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Earnings Calculator
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Estimate your potential monthly earnings
          </Typography>
          
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <TextField
                  label="Hourly Rate ($)"
                  type="number"
                  value={calculatorData.hourlyRate}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, hourlyRate: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 50 }}
                />
                <TextField
                  label="Hours per Day"
                  type="number"
                  value={calculatorData.hoursPerDay}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, hoursPerDay: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 24 }}
                />
                <TextField
                  label="Days per Month"
                  type="number"
                  value={calculatorData.daysPerMonth}
                  onChange={(e) => setCalculatorData(prev => ({ ...prev, daysPerMonth: Number(e.target.value) }))}
                  inputProps={{ min: 1, max: 31 }}
                />
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, bgcolor: 'success.main', color: 'white' }}>
                <CardContent sx={{ p: 4 }}>
                  <Calculator sx={{ fontSize: 40, mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Estimated Monthly Earnings
                  </Typography>
                  <Typography variant="h2" fontWeight={700}>
                    ${calculateEarnings().toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 2, opacity: 0.9 }}>
                    Based on ${calculatorData.hourlyRate}/hour, {calculatorData.hoursPerDay} hours/day, {calculatorData.daysPerMonth} days/month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>

        {/* How to Get Started */}
        <Box id="how-to-get-started" sx={{ mb: 8, scrollMarginTop: 80 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            How to Get Started
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Four simple steps to start earning
          </Typography>

          <Stepper orientation="vertical" sx={{ maxWidth: 800, mx: 'auto' }}>
            {steps.map((step, index) => (
              <Step key={index} active={true}>
                <StepLabel
                  StepIconComponent={() => (
                    <Avatar
                      sx={{
                        bgcolor: 'success.main',
                        color: 'white',
                        width: 50,
                        height: 50,
                        mr: 2,
                        fontWeight: 'bold',
                      }}
                    >
                      {index + 1}
                    </Avatar>
                  )}
                >
                  <Typography variant="h5" fontWeight={600}>
                    {step.title}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Box sx={{ pl: 6, pb: 4 }}>
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

        {/* Testimonials */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            What Our Hosts Say
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Real stories from successful hosts
          </Typography>
          
          <Grid container spacing={4}>
            {testimonials.map((testimonial, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} sx={{ color: 'warning.main', fontSize: 20 }} />
                      ))}
                    </Stack>
                    <Typography variant="body1" paragraph sx={{ fontStyle: 'italic' }}>
                      "{testimonial.quote}"
                    </Typography>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {testimonial.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {testimonial.location}
                        </Typography>
                      </Box>
                      <Chip 
                        label={testimonial.earnings}
                        color="success"
                        variant="outlined"
                      />
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* What Makes Us Different */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            What Makes Us Different
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Features designed with hosts in mind
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%', border: `2px solid ${theme.palette.success.main}` }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'success.main', width: 56, height: 56 }}>
                      <Visibility />
                    </Avatar>
                    <Typography variant="h5" fontWeight={600}>
                      Full Control
                    </Typography>
                  </Stack>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Set your own prices and availability" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Approve or decline bookings instantly" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary="Block dates whenever you need" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%', border: `2px solid ${theme.palette.primary.main}` }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
                      <Groups />
                    </Avatar>
                    <Typography variant="h5" fontWeight={600}>
                      Great Community
                    </Typography>
                  </Stack>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="All users are verified for safety" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Build relationships with regular renters" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircle color="primary" />
                      </ListItemIcon>
                      <ListItemText primary="Join a network of successful hosts" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Requirements */}
        <Paper
          elevation={1}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            bgcolor: alpha(theme.palette.info.main, 0.05),
          }}
        >
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Host Requirements
          </Typography>
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Basic Requirements
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Must be 18+ years old
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Valid government-issued ID
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Verified phone number and email
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Legal right to rent the parking space
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Space Requirements
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Safe and accessible parking space
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Clear access instructions
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Accurate photos and description
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  Compliance with local parking regulations
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Start Earning?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Join thousands of hosts earning extra income with their parking spaces
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              color="success"
              onClick={() => navigate('/signup?type=host')}
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              List Your Space Today
            </Button>
            <Button
              variant="outlined"
              size="large"
              color="success"
              onClick={() => navigate('/create-listing')}
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              View Sample Listing
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}