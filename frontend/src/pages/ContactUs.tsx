import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  useTheme,
  alpha,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Email,
  LocationOn,
  Schedule,
  Send,
  Chat,
  Support,
} from '@mui/icons-material';

export default function ContactUs() {
  const theme = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
  };

  const contactMethods = [
    {
      icon: <Email sx={{ fontSize: 40 }} />,
      title: 'Email Support',
      description: 'Send us a detailed message',
      details: 'support@parkinginapinch.com',
      availability: 'Response within 2-4 hours',
      color: 'secondary',
    },
    {
      icon: <Chat sx={{ fontSize: 40 }} />,
      title: 'Live Chat',
      description: 'Chat with our support team',
      details: 'Available on our website and app',
      availability: 'Available 24/7',
      color: 'success',
    },
  ];

  const officeLocations = [
    {
      city: 'San Francisco',
      address: '123 Market Street, Suite 500',
      zipCode: 'San Francisco, CA 94103',
      phone: '(415) 555-0123',
    },
    {
      city: 'New York',
      address: '456 Broadway, Floor 12',
      zipCode: 'New York, NY 10013',
      phone: '(212) 555-0456',
    },
    {
      city: 'Austin',
      address: '789 Congress Avenue, Suite 200',
      zipCode: 'Austin, TX 78701',
      phone: '(512) 555-0789',
    },
  ];

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
              Contact Us
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              We're here to help! Get in touch with our support team
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Whether you have questions, need assistance, or want to provide feedback, 
              we'd love to hear from you.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Contact Methods */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Get in Touch
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Choose the best way to reach us
          </Typography>
          
          <Grid container spacing={4}>
            {contactMethods.map((method, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: `${method.color}.main`, mb: 2 }}>
                      {method.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {method.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {method.description}
                    </Typography>
                    <Typography variant="h6" color={`${method.color}.main`} gutterBottom>
                      {method.details}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {method.availability}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Contact Form */}
        <Grid container spacing={6} sx={{ mb: 6 }}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Send Us a Message
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                Fill out the form below and we'll get back to you as soon as possible.
              </Typography>

              {submitted ? (
                <Alert severity="success" sx={{ mb: 3 }}>
                  Thank you for your message! We'll get back to you within 2-4 hours.
                </Alert>
              ) : (
                <Box component="form" onSubmit={handleSubmit}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Full Name"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required>
                        <InputLabel>Category</InputLabel>
                        <Select
                          value={formData.category}
                          label="Category"
                          onChange={handleInputChange('category')}
                        >
                          <MenuItem value="general">General Question</MenuItem>
                          <MenuItem value="booking">Booking Issue</MenuItem>
                          <MenuItem value="payment">Payment Problem</MenuItem>
                          <MenuItem value="technical">Technical Support</MenuItem>
                          <MenuItem value="hosting">Hosting Question</MenuItem>
                          <MenuItem value="safety">Safety Concern</MenuItem>
                          <MenuItem value="feedback">Feedback</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Subject"
                        value={formData.subject}
                        onChange={handleInputChange('subject')}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Message"
                        multiline
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange('message')}
                        placeholder="Please describe your question or issue in detail..."
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<Send />}
                        sx={{ px: 4, py: 1.5 }}
                      >
                        Send Message
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              )}
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack spacing={3}>
              {/* Quick Help */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Need Quick Help?
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Check out our Help Center for instant answers to common questions.
                  </Typography>
                  <Button variant="outlined" fullWidth startIcon={<Support />}>
                    Visit Help Center
                  </Button>
                </CardContent>
              </Card>

              {/* Business Hours */}
              <Card sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Schedule color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                      Business Hours
                    </Typography>
                  </Stack>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Live Chat:</Typography>
                      <Typography variant="body2" fontWeight={500}>24/7</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2">Email Response:</Typography>
                      <Typography variant="body2" fontWeight={500}>2-4 hours</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

            </Stack>
          </Grid>
        </Grid>

        {/* Office Locations */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Our Offices
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Visit us at one of our locations
          </Typography>
          
          <Grid container spacing={4}>
            {officeLocations.map((office, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <LocationOn color="primary" />
                      <Typography variant="h6" fontWeight={600}>
                        {office.city}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" gutterBottom>
                      {office.address}
                    </Typography>
                    <Typography variant="body1" color="text.secondary" gutterBottom>
                      {office.zipCode}
                    </Typography>
                    <Typography variant="body1" color="primary.main">
                      {office.phone}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}