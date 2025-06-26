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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Divider,
} from '@mui/material';
import {
  Group,
  Security,
  Handshake,
  Report,
  CheckCircle,
  Cancel,
  Warning,
  Shield,
  Gavel,
  Support,
  ExpandMore,
  DirectionsCar,
  Home,
  Star,
  Payment,
} from '@mui/icons-material';

const coreValues = [
  {
    icon: <Handshake sx={{ fontSize: 40 }} />,
    title: 'Respect & Trust',
    description: 'Treat all community members with respect, kindness, and professionalism.',
    color: 'primary',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Safety First',
    description: 'Prioritize the safety and security of all users, their vehicles, and property.',
    color: 'success',
  },
  {
    icon: <Shield sx={{ fontSize: 40 }} />,
    title: 'Honesty & Transparency',
    description: 'Provide accurate information and communicate honestly in all interactions.',
    color: 'info',
  },
  {
    icon: <Group sx={{ fontSize: 40 }} />,
    title: 'Community Support',
    description: 'Help build a positive, supportive community that benefits everyone.',
    color: 'secondary',
  },
];

const renterGuidelines = [
  {
    title: 'Booking & Communication',
    items: [
      'Provide accurate vehicle information when booking',
      'Communicate clearly about arrival times and any changes',
      'Respect the host\'s property and follow all posted rules',
      'Contact the host if you encounter any issues or delays',
    ],
  },
  {
    title: 'Parking Behavior',
    items: [
      'Park only in the designated space you\'ve booked',
      'Do not block driveways, walkways, or other vehicles',
      'Keep the parking area clean and free of debris',
      'Report any damage or safety concerns immediately',
    ],
  },
  {
    title: 'Vehicle Standards',
    items: [
      'Ensure your vehicle is roadworthy and properly insured',
      'Do not park vehicles that leak fluids excessively',
      'Respect noise ordinances, especially in residential areas',
      'Remove your vehicle promptly at the end of your booking',
    ],
  },
];

const hostGuidelines = [
  {
    title: 'Space Requirements',
    items: [
      'Provide accurate descriptions and current photos of your space',
      'Ensure your parking space is safe and accessible',
      'Clearly mark boundaries and any restrictions',
      'Maintain adequate lighting for nighttime parking',
    ],
  },
  {
    title: 'Communication & Service',
    items: [
      'Respond to booking requests and messages promptly',
      'Provide clear, detailed access instructions',
      'Be available to assist renters with any issues',
      'Update your calendar to reflect actual availability',
    ],
  },
  {
    title: 'Property Standards',
    items: [
      'Keep your parking area clean and well-maintained',
      'Remove obstacles that could damage vehicles',
      'Ensure compliance with local parking regulations',
      'Respect renters\' privacy and belongings',
    ],
  },
];

const prohibitedActivities = [
  {
    category: 'Discrimination & Harassment',
    description: 'Zero tolerance for discrimination based on race, religion, gender, sexual orientation, disability, or other protected characteristics.',
    examples: ['Refusing bookings based on protected characteristics', 'Harassment or inappropriate behavior', 'Hate speech or offensive language'],
  },
  {
    category: 'Fraudulent Activity',
    description: 'Any form of fraud, scams, or misrepresentation is strictly prohibited.',
    examples: ['Fake listings or false information', 'Payment fraud or chargebacks abuse', 'Identity theft or impersonation'],
  },
  {
    category: 'Unsafe Practices',
    description: 'Activities that compromise the safety of users, vehicles, or property.',
    examples: ['Blocking emergency access routes', 'Storing hazardous materials', 'Inadequate security or lighting'],
  },
  {
    category: 'Policy Violations',
    description: 'Violations of platform policies, local laws, or community standards.',
    examples: ['Multiple account creation', 'Review manipulation', 'Circumventing platform fees'],
  },
];

const reportingReasons = [
  'Safety concerns or unsafe conditions',
  'Discrimination or harassment',
  'Fraudulent activity or scams',
  'Property damage or disputes',
  'Inappropriate behavior or communication',
  'Violation of community guidelines',
  'Technical issues or bugs',
  'Other concerns',
];

const consequences = [
  {
    level: 'Warning',
    description: 'First-time minor violations result in a formal warning and educational resources.',
    icon: <Warning color="warning" />,
  },
  {
    level: 'Temporary Suspension',
    description: 'Repeated or moderate violations may result in temporary account suspension.',
    icon: <Cancel color="error" />,
  },
  {
    level: 'Permanent Ban',
    description: 'Serious violations or repeated offenses result in permanent account termination.',
    icon: <Gavel color="error" />,
  },
];

export default function CommunityGuidelines() {
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
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Community Guidelines
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Building a safe, respectful, and thriving parking community
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              These guidelines help ensure a positive experience for all users. 
              By using our platform, you agree to follow these community standards.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Core Values */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Our Community Values
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            The principles that guide our community
          </Typography>
          
          <Grid container spacing={4}>
            {coreValues.map((value, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: `${value.color}.main`, mb: 2 }}>
                      {value.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {value.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {value.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Guidelines for Users */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Guidelines by User Type
          </Typography>
          <Grid container spacing={6}>
            {/* Renter Guidelines */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <DirectionsCar sx={{ fontSize: 32 }} />
                  <Typography variant="h4" fontWeight={600}>
                    For Renters
                  </Typography>
                </Stack>
                {renterGuidelines.map((section, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {section.title}
                    </Typography>
                    <List dense>
                      {section.items.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </Paper>
            </Grid>

            {/* Host Guidelines */}
            <Grid item xs={12} md={6}>
              <Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                  <Home sx={{ fontSize: 32, color: 'secondary.main' }} />
                  <Typography variant="h4" fontWeight={600} color="secondary.main">
                    For Hosts
                  </Typography>
                </Stack>
                {hostGuidelines.map((section, index) => (
                  <Box key={index} sx={{ mb: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {section.title}
                    </Typography>
                    <List dense>
                      {section.items.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                ))}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        {/* Prohibited Activities */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Prohibited Activities
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            These activities are not allowed on our platform
          </Typography>
          
          <Grid container spacing={3}>
            {prohibitedActivities.map((activity, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="error.main">
                      {activity.category}
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {activity.description}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Examples include:
                    </Typography>
                    <List dense>
                      {activity.examples.map((example, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Cancel color="error" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={example} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Reporting System */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Reporting Violations
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Help us maintain a safe community by reporting inappropriate behavior
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                How to Report
              </Typography>
              <List>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Report  />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Use the Report button in the app or website"
                    secondary="Available on user profiles, listings, and conversations"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Support  />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Contact our support team directly"
                    secondary="Email support@parkinginapinch.com"
                  />
                </ListItem>
                <ListItem sx={{ px: 0 }}>
                  <ListItemIcon>
                    <Security  />
                  </ListItemIcon>
                  <ListItemText 
                    primary="For emergencies, call 911 first"
                    secondary="Then report the incident to us for follow-up"
                  />
                </ListItem>
              </List>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="h5" fontWeight={600} gutterBottom>
                What to Report
              </Typography>
              <List dense>
                {reportingReasons.map((reason, index) => (
                  <ListItem key={index} sx={{ px: 0 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <CheckCircle color="success" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={reason} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </Paper>

        {/* Enforcement & Consequences */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Enforcement & Consequences
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            How we handle violations of community guidelines
          </Typography>
          
          <Grid container spacing={4}>
            {consequences.map((consequence, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ mb: 2 }}>
                      {consequence.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {consequence.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {consequence.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Frequently Asked Questions
          </Typography>
          
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What happens if I report someone?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  We review all reports carefully and take appropriate action based on our community guidelines. 
                  Reports are kept confidential, and we'll update you on the outcome when possible.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Can I dispute a suspension or ban?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Yes, you can appeal any enforcement action by contacting our support team. 
                  We'll review your case and provide a response within 5-7 business days.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  How do you protect user privacy in reports?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  We take privacy seriously. Reporter identities are kept confidential, and we only share 
                  information as necessary to investigate and resolve issues.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What if I disagree with another user?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Try to resolve minor disagreements through respectful communication. 
                  For serious issues or if you feel unsafe, contact our support team for assistance.
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
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Questions About Guidelines?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Our community team is here to help clarify any questions
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Support />}
              sx={{ px: 4, py: 1.5 }}
            >
              Contact Community Team
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Report />}
              sx={{ px: 4, py: 1.5 }}
            >
              Report a Violation
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}