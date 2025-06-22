import React, { useState } from 'react';
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
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Home,
  Camera,
  Star,
  Security,
  Payment,
  Schedule,
  Message,
  CheckCircle,
  Cancel,
  Warning,
  ExpandMore,
  AttachMoney,
  LocationOn,
  DirectionsCar,
  Support,
  Settings,
  Gavel,
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
      id={`guidelines-tabpanel-${index}`}
      aria-labelledby={`guidelines-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const hostingStandards = [
  {
    icon: <Camera sx={{ fontSize: 40 }} />,
    title: 'High-Quality Listings',
    description: 'Create accurate, detailed listings with professional photos',
    requirements: [
      'Upload at least 3 clear, well-lit photos',
      'Show the entire parking space and access route',
      'Provide accurate dimensions and restrictions',
      'Update photos when conditions change',
    ],
  },
  {
    icon: <Message sx={{ fontSize: 40 }} />,
    title: 'Responsive Communication',
    description: 'Maintain prompt and professional communication',
    requirements: [
      'Respond to booking requests within 2 hours',
      'Answer messages within 4 hours during active bookings',
      'Provide clear, detailed access instructions',
      'Be available during check-in/check-out times',
    ],
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Safe & Secure Spaces',
    description: 'Ensure your parking space meets safety standards',
    requirements: [
      'Maintain adequate lighting for nighttime use',
      'Keep the area clear of obstacles and debris',
      'Ensure stable, level parking surfaces',
      'Provide secure access when applicable',
    ],
  },
  {
    icon: <Schedule sx={{ fontSize: 40 }} />,
    title: 'Accurate Availability',
    description: 'Keep your calendar updated and honor bookings',
    requirements: [
      'Update availability in real-time',
      'Block dates when space is unavailable',
      'Honor all confirmed bookings',
      'Provide 24-hour notice for cancellations',
    ],
  },
];

const pricingGuidelines = [
  {
    category: 'Market Research',
    description: 'Research comparable spaces in your area to set competitive rates',
    tips: [
      'Check nearby parking garages and lots',
      'Consider local events and peak demand times',
      'Factor in your location\'s convenience and amenities',
      'Review other host listings in your neighborhood',
    ],
  },
  {
    category: 'Rate Structure',
    description: 'Offer flexible pricing options to attract more bookings',
    tips: [
      'Set competitive hourly, daily, and weekly rates',
      'Offer discounts for longer bookings',
      'Consider dynamic pricing for high-demand periods',
      'Price accessibility features appropriately',
    ],
  },
  {
    category: 'Value Proposition',
    description: 'Highlight what makes your space worth the price',
    tips: [
      'Emphasize convenient location and proximity',
      'Highlight security features and amenities',
      'Mention any included services or perks',
      'Showcase positive reviews and ratings',
    ],
  },
];

const propertyStandards = [
  {
    title: 'Space Dimensions',
    items: [
      'Standard car space: minimum 8.5\' x 18\'',
      'Compact car space: minimum 7.5\' x 16\'',
      'SUV/truck space: minimum 9\' x 20\'',
      'Accessible space: minimum 11\' x 20\' with 5\' access aisle',
    ],
  },
  {
    title: 'Surface Conditions',
    items: [
      'Level, stable surface (concrete, asphalt, or well-maintained gravel)',
      'No potholes, cracks, or uneven surfaces that could damage vehicles',
      'Proper drainage to prevent flooding or standing water',
      'Clear markings or boundaries to define the space',
    ],
  },
  {
    title: 'Access Requirements',
    items: [
      'Clear access route to and from the space',
      'Minimum 10\' wide access lane for maneuvering',
      'No low-hanging branches or obstacles',
      'Adequate clearance height (minimum 7\' for covered spaces)',
    ],
  },
  {
    title: 'Safety & Security',
    items: [
      'Adequate lighting for nighttime parking',
      'Secure perimeter or controlled access where applicable',
      'Emergency contact information clearly posted',
      'Compliance with local fire and safety codes',
    ],
  },
];

const prohibitedPractices = [
  {
    category: 'Discriminatory Practices',
    description: 'Any form of discrimination is strictly prohibited',
    examples: [
      'Refusing bookings based on protected characteristics',
      'Different treatment based on race, gender, religion, etc.',
      'Discriminatory language in listings or communications',
    ],
  },
  {
    category: 'Misleading Information',
    description: 'Providing false or misleading information about your space',
    examples: [
      'Inaccurate photos or descriptions',
      'False claims about amenities or features',
      'Incorrect location or accessibility information',
    ],
  },
  {
    category: 'Unsafe Conditions',
    description: 'Maintaining spaces that pose safety risks',
    examples: [
      'Blocking emergency access routes',
      'Inadequate lighting or security',
      'Unstable or damaged parking surfaces',
    ],
  },
  {
    category: 'Policy Violations',
    description: 'Violating platform policies or terms of service',
    examples: [
      'Attempting to circumvent platform fees',
      'Soliciting direct bookings outside the platform',
      'Creating multiple accounts',
    ],
  },
];

const reviewStandards = [
  {
    rating: 5,
    title: 'Exceptional',
    description: 'Exceeds expectations in all areas',
    criteria: ['Perfect communication', 'Immaculate space condition', 'Outstanding amenities', 'Exceptional service'],
  },
  {
    rating: 4,
    title: 'Good',
    description: 'Meets all expectations consistently',
    criteria: ['Responsive communication', 'Clean, well-maintained space', 'Accurate listing description', 'Reliable service'],
  },
  {
    rating: 3,
    title: 'Acceptable',
    description: 'Meets basic requirements',
    criteria: ['Adequate communication', 'Space as described', 'Basic safety standards', 'Fulfills booking terms'],
  },
];

export default function HostGuidelines() {
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
          background: `linear-gradient(135deg, ${theme.palette.secondary.dark} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Home sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Host Guidelines
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Everything you need to know to be a successful host
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Follow these guidelines to provide excellent experiences for your guests, 
              maintain high ratings, and maximize your earnings.
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
                fontSize: '1rem',
                fontWeight: 600,
                py: 2,
                px: 3,
              },
            }}
          >
            <Tab label="Hosting Standards" />
            <Tab label="Property Requirements" />
            <Tab label="Pricing & Reviews" />
            <Tab label="Policies & Rules" />
          </Tabs>
        </Box>

        {/* Hosting Standards Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Hosting Standards
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Core requirements for all hosts on our platform
          </Typography>
          
          <Grid container spacing={4}>
            {hostingStandards.map((standard, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Box sx={{ color: 'secondary.main' }}>
                        {standard.icon}
                      </Box>
                      <Typography variant="h5" fontWeight={600}>
                        {standard.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body1" paragraph>
                      {standard.description}
                    </Typography>
                    <List dense>
                      {standard.requirements.map((req, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckCircle color="success" fontSize="small" />
                          </ListItemIcon>
                          <ListItemText primary={req} primaryTypographyProps={{ variant: 'body2' }} />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Property Requirements Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Property Requirements
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Physical standards your parking space must meet
          </Typography>
          
          <Grid container spacing={4}>
            {propertyStandards.map((standard, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3, height: '100%' }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom color="secondary.main">
                    {standard.title}
                  </Typography>
                  <List>
                    {standard.items.map((item, idx) => (
                      <ListItem key={idx} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32 }}>
                          <CheckCircle color="success" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary={item} primaryTypographyProps={{ variant: 'body2' }} />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Pricing & Reviews Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Pricing & Review Guidelines
          </Typography>
          
          {/* Pricing Section */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Pricing Guidelines
            </Typography>
            <Grid container spacing={4}>
              {pricingGuidelines.map((guideline, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="primary.main">
                        {guideline.category}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {guideline.description}
                      </Typography>
                      <List dense>
                        {guideline.tips.map((tip, idx) => (
                          <ListItem key={idx} sx={{ px: 0 }}>
                            <ListItemIcon sx={{ minWidth: 32 }}>
                              <AttachMoney color="success" fontSize="small" />
                            </ListItemIcon>
                            <ListItemText primary={tip} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Review Standards */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Review Standards
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              What guests expect at each rating level
            </Typography>
            <Grid container spacing={3}>
              {reviewStandards.map((standard, index) => (
                <Grid item xs={12} md={4} key={index}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent sx={{ p: 4, textAlign: 'center' }}>
                      <Stack direction="row" justifyContent="center" spacing={0.5} sx={{ mb: 2 }}>
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            sx={{
                              color: i < standard.rating ? 'warning.main' : 'grey.300',
                              fontSize: 24,
                            }}
                          />
                        ))}
                      </Stack>
                      <Typography variant="h6" fontWeight={600} gutterBottom>
                        {standard.title}
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {standard.description}
                      </Typography>
                      <Stack spacing={1}>
                        {standard.criteria.map((criterion, idx) => (
                          <Chip key={idx} label={criterion} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Policies & Rules Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Policies & Rules
          </Typography>
          
          {/* Prohibited Practices */}
          <Box sx={{ mb: 8 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Prohibited Practices
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
              These practices are not allowed and may result in account suspension
            </Typography>
            <Grid container spacing={3}>
              {prohibitedPractices.map((practice, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Typography variant="h6" fontWeight={600} gutterBottom color="error.main">
                        {practice.category}
                      </Typography>
                      <Typography variant="body1" paragraph>
                        {practice.description}
                      </Typography>
                      <Typography variant="subtitle2" gutterBottom>
                        Examples:
                      </Typography>
                      <List dense>
                        {practice.examples.map((example, idx) => (
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

          {/* Enforcement */}
          <Paper
            elevation={3}
            sx={{
              p: 6,
              borderRadius: 3,
              mb: 6,
              background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.05)} 0%, ${alpha(theme.palette.error.main, 0.05)} 100%)`,
            }}
          >
            <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
              Enforcement Actions
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
              How we handle policy violations
            </Typography>
            
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Warning sx={{ fontSize: 40, color: 'warning.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Warning
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      First-time minor violations result in a warning and educational resources
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Cancel sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Suspension
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Repeated or serious violations may result in temporary account suspension
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Gavel sx={{ fontSize: 40, color: 'error.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Permanent Ban
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Severe violations result in permanent removal from the platform
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* FAQ Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Frequently Asked Questions
          </Typography>
          
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What happens if I receive a poor review?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Poor reviews can be learning opportunities. Reach out to the guest to understand their concerns, 
                  address any issues, and use the feedback to improve. Consistently poor reviews may affect your listing visibility.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Can I change my pricing after someone books?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  No, once a booking is confirmed, the price cannot be changed. Make sure to set your prices carefully 
                  and update them regularly based on demand and market conditions.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What if I need to cancel a confirmed booking?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Host cancellations should be rare and only for emergencies. Frequent cancellations may result in penalties, 
                  reduced search ranking, or account suspension. Always try to honor confirmed bookings.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* Support Section */}
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
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Need Help with Hosting?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Our support team is here to help you succeed
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Support />}
              sx={{ px: 4, py: 1.5 }}
            >
              Contact Host Support
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Settings />}
              sx={{ px: 4, py: 1.5 }}
            >
              Manage Your Listing
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}