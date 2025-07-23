import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stack,
  useTheme,
  alpha,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Cookie,
  ExpandMore,
  Info,
  Security,
  Analytics,
  Campaign,
  Settings,
  CheckCircle,
  Block,
  Email,
  Save,
} from '@mui/icons-material';
import toast from 'react-hot-toast';

const cookieTypes = [
  {
    type: 'Essential Cookies',
    icon: <Security sx={{ fontSize: 24 }} />,
    description: 'Required for the website to function properly. Cannot be disabled.',
    examples: ['Authentication', 'Security', 'User preferences'],
    canDisable: false,
  },
  {
    type: 'Performance Cookies',
    icon: <Analytics sx={{ fontSize: 24 }} />,
    description: 'Help us understand how visitors interact with our website.',
    examples: ['Page load times', 'Error rates', 'Usage patterns'],
    canDisable: true,
  },
  {
    type: 'Functional Cookies',
    icon: <Settings sx={{ fontSize: 24 }} />,
    description: 'Enable enhanced functionality and personalization.',
    examples: ['Language preferences', 'Location settings', 'Display preferences'],
    canDisable: true,
  },
  {
    type: 'Marketing Cookies',
    icon: <Campaign sx={{ fontSize: 24 }} />,
    description: 'Used to deliver relevant advertisements and track campaign effectiveness.',
    examples: ['Ad targeting', 'Campaign performance', 'Social media integration'],
    canDisable: true,
  },
];

const cookieDetails = [
  {
    name: '_auth_token',
    type: 'Essential',
    purpose: 'User authentication and session management',
    duration: 'Session',
    provider: 'Parking in a Pinch',
  },
  {
    name: '_csrf_token',
    type: 'Essential',
    purpose: 'Security token to prevent cross-site request forgery',
    duration: 'Session',
    provider: 'Parking in a Pinch',
  },
  {
    name: '_user_prefs',
    type: 'Functional',
    purpose: 'Stores user preferences like language and theme',
    duration: '1 year',
    provider: 'Parking in a Pinch',
  },
  {
    name: '_ga',
    type: 'Performance',
    purpose: 'Google Analytics tracking',
    duration: '2 years',
    provider: 'Google',
  },
  {
    name: '_fbp',
    type: 'Marketing',
    purpose: 'Facebook pixel tracking',
    duration: '3 months',
    provider: 'Facebook',
  },
];

export default function CookiePolicy() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [cookiePreferences, setCookiePreferences] = useState({
    performance: true,
    functional: true,
    marketing: true,
  });

  const handleManagePreferences = () => {
    setPreferencesOpen(true);
  };

  const handleOptOutNonEssential = () => {
    setCookiePreferences({
      performance: false,
      functional: false,
      marketing: false,
    });
    // Save preferences to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      performance: false,
      functional: false,
      marketing: false,
    }));
    toast.success('Non-essential cookies have been disabled');
  };

  const handleSavePreferences = () => {
    // Save preferences to localStorage
    localStorage.setItem('cookiePreferences', JSON.stringify({
      essential: true,
      ...cookiePreferences,
    }));
    setPreferencesOpen(false);
    toast.success('Cookie preferences saved successfully');
  };

  const handleContactPrivacyTeam = () => {
    navigate('/contact');
  };

  const handleViewPrivacyPolicy = () => {
    navigate('/privacy');
  };

  // Load cookie preferences from localStorage on component mount
  useEffect(() => {
    const savedPreferences = localStorage.getItem('cookiePreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        setCookiePreferences({
          performance: preferences.performance || false,
          functional: preferences.functional || false,
          marketing: preferences.marketing || false,
        });
      } catch (error) {
        console.error('Error loading cookie preferences:', error);
      }
    }
  }, []);

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
            <Cookie sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Cookie Policy
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 2 }}>
              How we use cookies and similar technologies
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.7 }}>
              Last updated: March 1, 2024
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Introduction */}
        <Paper elevation={3} sx={{ p: 6, borderRadius: 3, mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            What are cookies?
          </Typography>
          <Typography variant="body1" paragraph>
            Cookies are small text files that are placed on your device when you visit our website. 
            They help us provide you with a better experience by remembering your preferences, 
            analyzing how you use our site, and enabling certain features.
          </Typography>
          <Typography variant="body1">
            This policy explains what cookies we use, why we use them, and how you can manage your cookie preferences.
          </Typography>
        </Paper>

        {/* Types of Cookies */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Types of Cookies We Use
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            We use different types of cookies for various purposes
          </Typography>
          
          <Stack spacing={3}>
            {cookieTypes.map((cookie, index) => (
              <Card key={index} sx={{ borderRadius: 3 }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <Box sx={{}}>
                      {cookie.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600}>
                      {cookie.type}
                    </Typography>
                    {cookie.canDisable ? (
                      <Chip label="Optional" size="small" color="success" />
                    ) : (
                      <Chip label="Required" size="small" color="warning" />
                    )}
                  </Stack>
                  <Typography variant="body1" paragraph>
                    {cookie.description}
                  </Typography>
                  <Typography variant="subtitle2" gutterBottom>
                    Examples:
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    {cookie.examples.map((example, idx) => (
                      <Chip key={idx} label={example} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Cookie Details Table */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Specific Cookies We Use
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Detailed information about individual cookies
          </Typography>
          
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Cookie Name</strong></TableCell>
                  <TableCell><strong>Type</strong></TableCell>
                  <TableCell><strong>Purpose</strong></TableCell>
                  <TableCell><strong>Duration</strong></TableCell>
                  <TableCell><strong>Provider</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cookieDetails.map((cookie, index) => (
                  <TableRow key={index}>
                    <TableCell>{cookie.name}</TableCell>
                    <TableCell>
                      <Chip label={cookie.type} size="small" />
                    </TableCell>
                    <TableCell>{cookie.purpose}</TableCell>
                    <TableCell>{cookie.duration}</TableCell>
                    <TableCell>{cookie.provider}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Managing Cookies */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Managing Your Cookie Preferences
          </Typography>
          
          <Grid container spacing={4} sx={{ mt: 2 }}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Browser Settings
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Most browsers allow you to control cookies through settings"
                    secondary="Check your browser's help section for instructions"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Info color="info" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="You can set your browser to block or delete cookies"
                    secondary="Note: This may affect website functionality"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Block color="warning" />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Blocking essential cookies may prevent site features from working"
                    secondary="Consider allowing essential cookies for best experience"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Cookie Preference Center
              </Typography>
              <Typography variant="body1" paragraph>
                Use our Cookie Preference Center to manage your cookie settings:
              </Typography>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<Settings />}
                  fullWidth
                  onClick={handleManagePreferences}
                >
                  Manage Cookie Preferences
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  startIcon={<Block />}
                  fullWidth
                  onClick={handleOptOutNonEssential}
                >
                  Opt Out of Non-Essential Cookies
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* FAQ Section */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Frequently Asked Questions
          </Typography>
          
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Do I have to accept cookies?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Essential cookies are required for the website to function properly. 
                  You can choose to disable non-essential cookies, but this may limit certain features and personalization options.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  How do cookies affect my privacy?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  We use cookies in accordance with our Privacy Policy. We do not use cookies to collect personally 
                  identifiable information unless you provide it to us directly. For more information, please read our Privacy Policy.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What happens if I delete cookies?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  If you delete cookies, you may need to log in again and reset your preferences. 
                  Some features may not work as expected until new cookies are set.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Do you use third-party cookies?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Yes, we use third-party cookies from trusted partners like Google Analytics and social media platforms. 
                  These help us understand how users interact with our site and enable social media features.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* Contact Section */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            textAlign: 'center',
            bgcolor: alpha(theme.palette.info.main, 0.05),
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Questions About Our Cookie Policy?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            We're here to help clarify any concerns
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Email />}
              sx={{ px: 4, py: 1.5 }}
              onClick={handleContactPrivacyTeam}
            >
              Contact Privacy Team
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Info />}
              sx={{ px: 4, py: 1.5 }}
              onClick={handleViewPrivacyPolicy}
            >
              View Privacy Policy
            </Button>
          </Stack>
        </Paper>
      </Container>

      {/* Cookie Preferences Dialog */}
      <Dialog 
        open={preferencesOpen} 
        onClose={() => setPreferencesOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h5" fontWeight={600}>
            Cookie Preferences
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose which types of cookies you want to allow
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Box>
              <FormControlLabel
                control={<Switch checked={true} disabled />}
                label="Essential Cookies"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Required for the website to function properly. Cannot be disabled.
              </Typography>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={cookiePreferences.performance} 
                    onChange={(e) => setCookiePreferences(prev => ({...prev, performance: e.target.checked}))}
                  />
                }
                label="Performance Cookies"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Help us understand how visitors interact with our website.
              </Typography>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={cookiePreferences.functional} 
                    onChange={(e) => setCookiePreferences(prev => ({...prev, functional: e.target.checked}))}
                  />
                }
                label="Functional Cookies"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Enable enhanced functionality and personalization.
              </Typography>
            </Box>
            <Box>
              <FormControlLabel
                control={
                  <Switch 
                    checked={cookiePreferences.marketing} 
                    onChange={(e) => setCookiePreferences(prev => ({...prev, marketing: e.target.checked}))}
                  />
                }
                label="Marketing Cookies"
              />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 4 }}>
                Used to deliver relevant advertisements and track campaign effectiveness.
              </Typography>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setPreferencesOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSavePreferences} variant="contained" startIcon={<Save />}>
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}