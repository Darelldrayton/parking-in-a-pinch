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
        {/* Content removed as requested */}
      </Container>
    </Box>
  );
}