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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Accessibility as AccessibilityIcon,
  Visibility,
  VolumeUp,
  TouchApp,
  Keyboard,
  Phone,
  Email,
  CheckCircle,
  ExpandMore,
  Feedback,
  Support,
  Build,
  DirectionsCar,
  Accessible,
  Settings,
} from '@mui/icons-material';

const accessibilityFeatures = [
  {
    icon: <Visibility sx={{ fontSize: 40 }} />,
    title: 'Visual Accessibility',
    description: 'Features for users with visual impairments',
    features: [
      'High contrast mode support',
      'Screen reader compatibility',
      'Keyboard navigation',
      'Alt text for all images',
      'Scalable text and UI elements',
    ],
  },
  {
    icon: <VolumeUp sx={{ fontSize: 40 }} />,
    title: 'Audio & Hearing',
    description: 'Support for users with hearing impairments',
    features: [
      'Visual alerts and notifications',
      'Closed captions for videos',
      'Text-based communication options',
      'Vibration alerts on mobile',
      'Visual feedback for audio cues',
    ],
  },
  {
    icon: <TouchApp sx={{ fontSize: 40 }} />,
    title: 'Motor & Mobility',
    description: 'Accommodations for motor impairments',
    features: [
      'Large touch targets',
      'Voice control support',
      'Switch navigation compatibility',
      'Gesture alternatives',
      'Adjustable interaction timing',
    ],
  },
  {
    icon: <Keyboard sx={{ fontSize: 40 }} />,
    title: 'Cognitive Support',
    description: 'Features for cognitive accessibility',
    features: [
      'Clear, simple language',
      'Consistent navigation patterns',
      'Error prevention and correction',
      'Progress indicators',
      'Customizable interface options',
    ],
  },
];

const wcagCompliance = [
  {
    level: 'WCAG 2.1 AA',
    status: 'Compliant',
    description: 'We meet Web Content Accessibility Guidelines 2.1 Level AA standards',
    areas: ['Perceivable', 'Operable', 'Understandable', 'Robust'],
  },
  {
    level: 'Section 508',
    status: 'Compliant',
    description: 'Compliant with U.S. federal accessibility requirements',
    areas: ['Electronic accessibility', 'Software applications', 'Web-based intranet'],
  },
  {
    level: 'ADA',
    status: 'Compliant',
    description: 'Follows Americans with Disabilities Act digital accessibility guidelines',
    areas: ['Equal access', 'Reasonable accommodations', 'Digital inclusion'],
  },
];

const assistiveTechnologies = [
  'JAWS (Job Access With Speech)',
  'NVDA (NonVisual Desktop Access)',
  'VoiceOver (macOS/iOS)',
  'TalkBack (Android)',
  'Dragon NaturallySpeaking',
  'Switch navigation devices',
  'Eye-tracking software',
  'Voice control systems',
];

export default function Accessibility() {
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
          <Box sx={{ textAlign: 'center' }}>
            <AccessibilityIcon sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Accessibility
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Parking for everyone, designed with accessibility in mind
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              We're committed to making our platform accessible to all users, regardless of ability. 
              Our goal is to provide an inclusive parking experience for everyone.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Accessibility Commitment */}
        <Paper elevation={3} sx={{ p: 6, borderRadius: 3, mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Our Commitment to Accessibility
          </Typography>
          <Typography variant="body1" paragraph>
            At Parking in a Pinch, we believe that technology should be accessible to everyone. 
            We are committed to ensuring that our platform provides equal access and opportunity to all users, 
            including those with disabilities.
          </Typography>
          <Typography variant="body1" paragraph>
            We continuously work to improve the accessibility of our website and mobile applications, 
            following established guidelines and best practices. Our development team regularly tests 
            our platform with assistive technologies and incorporates feedback from users with disabilities.
          </Typography>
          <Typography variant="body1">
            We strive to meet or exceed Web Content Accessibility Guidelines (WCAG) 2.1 Level AA standards 
            and comply with applicable laws including the Americans with Disabilities Act (ADA) and Section 508.
          </Typography>
        </Paper>

        {/* Accessibility Features */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Accessibility Features
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Built-in features to support users with diverse needs
          </Typography>
          
          <Grid container spacing={4}>
            {accessibilityFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Box sx={{ color: 'primary.main' }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h5" fontWeight={600}>
                        {feature.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" paragraph>
                      {feature.description}
                    </Typography>
                    <List dense>
                      {feature.features.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Compliance Standards */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Compliance & Standards
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            We adhere to recognized accessibility standards and guidelines
          </Typography>
          
          <Grid container spacing={4}>
            {wcagCompliance.map((standard, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <CheckCircle sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {standard.level}
                    </Typography>
                    <Typography variant="body2" color="success.main" gutterBottom>
                      {standard.status}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {standard.description}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" spacing={1} justifyContent="center">
                      {standard.areas.map((area, idx) => (
                        <Typography key={idx} variant="caption" sx={{ 
                          bgcolor: 'primary.light', 
                          color: 'primary.contrastText', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          mb: 1,
                        }}>
                          {area}
                        </Typography>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Assistive Technology Support */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Assistive Technology Support
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Our platform works with popular assistive technologies
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Supported Technologies
              </Typography>
              <List>
                {assistiveTechnologies.map((tech, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText primary={tech} />
                  </ListItem>
                ))}
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Testing & Validation
              </Typography>
              <Typography variant="body1" paragraph>
                We regularly test our platform with various assistive technologies to ensure compatibility and usability.
              </Typography>
              <Typography variant="body1" paragraph>
                Our team includes accessibility experts who conduct regular audits and work with users with disabilities 
                to gather feedback and improve our services.
              </Typography>
              <Button variant="outlined" startIcon={<Settings />}>
                Configure Accessibility Settings
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Physical Accessibility */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Physical Accessibility Features
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Find and book accessible parking spaces
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <Accessible sx={{ fontSize: 32, color: 'primary.main' }} />
                    <Typography variant="h5" fontWeight={600}>
                      Accessible Parking Spaces
                    </Typography>
                  </Stack>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="ADA-compliant spaces with proper dimensions" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Van-accessible spaces for larger vehicles" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Level surfaces with accessible pathways" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Close proximity to building entrances" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                    <DirectionsCar sx={{ fontSize: 32, color: 'secondary.main' }} />
                    <Typography variant="h5" fontWeight={600}>
                      Search & Filter Options
                    </Typography>
                  </Stack>
                  <List>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Filter by accessibility features" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="View detailed accessibility information" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Photos showing accessible features" />
                    </ListItem>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon><CheckCircle color="success" /></ListItemIcon>
                      <ListItemText primary="Host-verified accessibility compliance" />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Accessibility FAQ
          </Typography>
          
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  How do I find accessible parking spaces?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Use the accessibility filter in our search to find spaces that meet ADA requirements. 
                  Look for the wheelchair icon and detailed accessibility descriptions in each listing.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Can I use screen readers with your platform?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Yes, our platform is compatible with popular screen readers like JAWS, NVDA, and VoiceOver. 
                  We provide proper headings, alt text, and keyboard navigation support.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What if I encounter accessibility barriers?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Please contact our accessibility team immediately. We take accessibility seriously 
                  and will work to resolve any barriers you encounter. Use our feedback form or contact support directly.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Do you provide customer support for accessibility issues?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Yes, our customer support team is trained to assist with accessibility-related questions and issues. 
                  You can contact us via phone, email, or our accessible contact form for immediate assistance.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* Contact & Feedback */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.1)} 100%)`,
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Accessibility Feedback & Support
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Help us improve accessibility - your feedback matters
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={6}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Email sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Email Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    accessibility@parkinginapinch.com
                  </Typography>
                  <Button variant="outlined" size="small">
                    Send Email
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Feedback sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Feedback Form
                  </Typography>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Report issues or suggest improvements
                  </Typography>
                  <Button variant="outlined" size="small">
                    Submit Feedback
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          <Typography variant="body1" sx={{ mt: 4, fontStyle: 'italic' }}>
            We are committed to responding to accessibility inquiries within 24 hours.
          </Typography>
        </Paper>
      </Container>
    </Box>
  );
}