import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Link,
  Grid,
  Stack,
  Divider,
  IconButton,
  useTheme,
  alpha,
} from '@mui/material';
import {
  LocalParking,
  Email,
  LocationOn,
  Facebook,
  Twitter,
  Instagram,
  LinkedIn,
} from '@mui/icons-material';

export default function Footer() {
  const theme = useTheme();
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    company: [
      { label: 'About Us', path: '/about' },
      { label: 'How It Works', path: '/how-it-works' },
      { label: 'Careers', path: '/careers' },
      { label: 'Press', path: '/press' },
    ],
    support: [
      { label: 'Help Center', path: '/help' },
      { label: 'Contact Us', path: '/contact' },
      { label: 'Safety', path: '/safety' },
      { label: 'Community Guidelines', path: '/guidelines' },
    ],
    legal: [
      { label: 'Terms and Conditions', path: '/terms' },
      { label: 'Privacy Policy', path: '/privacy' },
      { label: 'Cookie Policy', path: '/cookies' },
      { label: 'Accessibility', path: '/accessibility' },
    ],
    host: [
      { label: 'Become a Host', path: '/signup?type=host' },
      { label: 'Host Guidelines', path: '/host-guidelines' },
      { label: 'Host Insurance', path: '/host-insurance' },
      { label: 'Host Resources', path: '/host-resources' },
    ],
  };

  const socialLinks = [
    { icon: <Facebook />, url: 'https://facebook.com', label: 'Facebook' },
    { icon: <Twitter />, url: 'https://twitter.com', label: 'Twitter' },
    { icon: <Instagram />, url: 'https://instagram.com', label: 'Instagram' },
    { icon: <LinkedIn />, url: 'https://linkedin.com', label: 'LinkedIn' },
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: `1px solid ${theme.palette.divider}`,
        pt: 6,
        pb: 3,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        {/* Main Footer Content */}
        <Grid container spacing={4}>
          {/* Brand and Contact */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={3}>
              {/* Logo and Brand */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: 'primary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <LocalParking sx={{ color: 'white', fontSize: 24 }} />
                </Box>
                <Typography variant="h6" fontWeight={700}>
                  Parking in a Pinch
                </Typography>
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300 }}>
                The easiest way to find and book parking spaces. Connect with hosts, 
                discover convenient locations, and park with confidence.
              </Typography>

              {/* Contact Info */}
              <Stack spacing={1}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Email sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    support@parkinginapinch.com
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="body2" color="text.secondary">
                    New York, NY
                  </Typography>
                </Box>
              </Stack>

              {/* Social Links */}
              <Stack direction="row" spacing={1}>
                {socialLinks.map((social, index) => (
                  <IconButton
                    key={index}
                    component="a"
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      '&:hover': {
                        bgcolor: 'primary.main',
                        color: 'white',
                        borderColor: 'primary.main',
                      },
                    }}
                    size="small"
                  >
                    {social.icon}
                  </IconButton>
                ))}
              </Stack>
            </Stack>
          </Grid>

          {/* Footer Links */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={3}>
              {/* Company Links */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Company
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.company.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Support Links */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Support
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.support.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Legal Links */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Legal
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.legal.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>

              {/* Host Links */}
              <Grid size={{ xs: 6, sm: 3 }}>
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  For Hosts
                </Typography>
                <Stack spacing={1}>
                  {footerLinks.host.map((link, index) => (
                    <Link
                      key={index}
                      component={RouterLink}
                      to={link.path}
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        textDecoration: 'none',
                        '&:hover': {
                          textDecoration: 'underline',
                        },
                      }}
                    >
                      {link.label}
                    </Link>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Bottom Footer */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'center', sm: 'center' },
            gap: 2,
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Parking in a Pinch. All rights reserved.
          </Typography>
          
          <Stack direction="row" spacing={3}>
            <Link
              component={RouterLink}
              to="/terms"
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Terms
            </Link>
            <Link
              component={RouterLink}
              to="/privacy"
              variant="body2"
              color="text.secondary"
              sx={{
                textDecoration: 'none',
                '&:hover': {
                  textDecoration: 'underline',
                },
              }}
            >
              Privacy
            </Link>
            <Typography variant="body2" color="text.secondary">
              🚗 Made with ♥ in NYC
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}