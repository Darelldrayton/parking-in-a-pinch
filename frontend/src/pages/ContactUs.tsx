import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ContactUs() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string) => (event: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Create a dispute with the contact form data
      const disputeData = {
        dispute_type: 'other',
        subject: formData.subject,
        description: `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`,
        priority: 'medium',
        refund_requested: false
      };

      const response = await api.post('/disputes/', disputeData);
      
      toast.success('Your message has been sent successfully!');
      setSubmitted(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        setFormData({
          name: '',
          email: '',
          subject: '',
          category: '',
          message: '',
        });
        setSubmitted(false);
      }, 3000);
      
    } catch (error: any) {
      console.error('Error submitting contact form:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
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
        {/* Contact Form that creates disputes */}
        <Box sx={{ mb: 6 }}>
          <Grid container spacing={6} justifyContent="center">
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
                      <Grid item xs={12}>
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
                          disabled={loading}
                        >
                          {loading ? 'Sending...' : 'Send Message'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}