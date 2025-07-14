import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Stack,
  useTheme,
  alpha,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  InputAdornment,
  Paper,
  Tabs,
  Tab,
  IconButton,
} from '@mui/material';
import {
  Search,
  ExpandMore,
  Email,
  Close,
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
      id={`help-tabpanel-${index}`}
      aria-labelledby={`help-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}


const generalFAQs = [
  {
    question: 'How do I create an account?',
    answer: 'Click "Sign Up" in the top right corner, enter your email and password, and verify your email address. You can also sign up using your Google or Facebook account.',
    category: 'Getting Started',
  },
  {
    question: 'How do I find parking near me?',
    answer: 'Enter your destination in the search bar on our homepage. You can filter results by price, distance, amenities, and availability. Use the map view to see exact locations.',
    category: 'Booking & Parking',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards (Visa, Mastercard, American Express), debit cards, and PayPal. All payments are processed securely through Stripe.',
    category: 'Payments & Billing',
  },
  {
    question: 'How do I cancel a booking?',
    answer: 'Go to "My Bookings" in your account, find the booking you want to cancel, and click "Cancel". Cancellation fees may apply depending on timing and the host\'s policy.',
    category: 'Booking & Parking',
  },
  {
    question: 'Is my car safe when parked?',
    answer: 'All hosts are verified, and many spaces include security features. We provide insurance coverage for qualifying bookings. Always follow parking guidelines and secure your vehicle.',
    category: 'Safety & Security',
  },
  {
    question: 'How do I become a host?',
    answer: 'Click "Become a Host" to list your parking space. You\'ll need to provide photos, set pricing, define availability, and complete identity verification.',
    category: 'Host Resources',
  },
];

const renterFAQs = [
  {
    question: 'How far in advance can I book?',
    answer: 'You can book up to 30 days in advance. Some hosts allow instant booking, while others require approval.',
  },
  {
    question: 'What if I arrive and the space is occupied?',
    answer: 'Contact the host immediately through our app. If unresolved, contact our 24/7 support for a full refund and help finding alternative parking.',
  },
  {
    question: 'Can I extend my parking session?',
    answer: 'Yes, if the space is available. You can extend through the app and pay the additional time automatically.',
  },
  {
    question: 'What if I\'m running late?',
    answer: 'Most hosts offer a 15-30 minute grace period. Contact your host to let them know. Late fees may apply after the grace period.',
  },
  {
    question: 'How do I get directions to my parking space?',
    answer: 'Once booked, you\'ll receive GPS coordinates and detailed directions. Many hosts provide additional landmarks and instructions.',
  },
];

const hostFAQs = [
  {
    question: 'How much can I earn?',
    answer: 'Earnings vary by location and demand. Urban areas typically generate $100-500+ monthly. Use our earnings calculator to estimate your potential income.',
  },
  {
    question: 'When do I get paid?',
    answer: 'Payments are processed automatically after each booking completion. You can choose daily, weekly, or monthly payouts to your bank account.',
  },
  {
    question: 'What if a renter damages my property?',
    answer: 'Report damage immediately through our app. We provide insurance coverage for qualifying bookings and will help resolve damage claims.',
  },
  {
    question: 'Can I block certain dates?',
    answer: 'Yes, you can block dates when your space isn\'t available. Go to your calendar and mark dates as unavailable.',
  },
  {
    question: 'How do I set my pricing?',
    answer: 'Set hourly, daily, or weekly rates. Consider local parking costs and demand. You can adjust pricing anytime and offer discounts for longer bookings.',
  },
];

export default function HelpCenter() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [expandedFAQ, setExpandedFAQ] = useState<string | false>(false);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleFAQChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedFAQ(isExpanded ? panel : false);
  };

  // Combine all FAQs for search
  const allFAQs = [
    ...generalFAQs.map(faq => ({ ...faq, tab: 'general' })),
    ...renterFAQs.map(faq => ({ ...faq, tab: 'renter', category: 'For Renters' })),
    ...hostFAQs.map(faq => ({ ...faq, tab: 'host', category: 'For Hosts' })),
  ];

  const filteredFAQs = searchTerm.trim()
    ? allFAQs.filter(
        faq => {
          const searchTermLower = searchTerm.toLowerCase().trim();
          const matches = faq.question.toLowerCase().includes(searchTermLower) ||
                         faq.answer.toLowerCase().includes(searchTermLower) ||
                         (faq.category && faq.category.toLowerCase().includes(searchTermLower));
          return matches;
        }
      )
    : [];

  // Debug logging
  React.useEffect(() => {
    if (searchTerm.trim()) {
      console.log('Search term:', searchTerm);
      console.log('Total FAQs:', allFAQs.length);
      console.log('Filtered FAQs:', filteredFAQs.length);
      console.log('First few filtered FAQs:', filteredFAQs.slice(0, 3));
    }
  }, [searchTerm, filteredFAQs]);

  const filteredRenterFAQs = renterFAQs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredHostFAQs = hostFAQs.filter(
    faq =>
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
              Help Center
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Find answers to your questions and get the help you need
            </Typography>
            
            {/* Search Bar */}
            <Box sx={{ maxWidth: 600, mx: 'auto' }}>
              <TextField
                fullWidth
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: 'white' }} />
                    </InputAdornment>
                  ),
                  endAdornment: searchTerm && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setSearchTerm('')}
                        size="small"
                        sx={{ color: 'white' }}
                      >
                        <Close />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: {
                    bgcolor: alpha(theme.palette.common.white, 0.1),
                    color: 'white',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.common.white, 0.3),
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.common.white, 0.5),
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'white',
                    },
                  },
                }}
                sx={{
                  '& .MuiInputBase-input::placeholder': {
                    color: alpha(theme.palette.common.white, 0.7),
                  },
                }}
              />
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">

        {/* FAQ Sections */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Frequently Asked Questions
          </Typography>
          
          {searchTerm.trim() ? (
            // Show search results
            <Box sx={{ maxWidth: 800, mx: 'auto' }}>
              <Typography variant="h6" sx={{ mb: 3, textAlign: 'center' }}>
                {filteredFAQs.length} result{filteredFAQs.length !== 1 ? 's' : ''} for "{searchTerm.trim()}"
              </Typography>
              {filteredFAQs.length === 0 ? (
                <Paper sx={{ p: 4, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    No results found for "{searchTerm.trim()}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Try different keywords or browse our categories below.
                  </Typography>
                </Paper>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <Accordion
                    key={`search-${index}`}
                    expanded={expandedFAQ === `search-${index}`}
                    onChange={handleFAQChange(`search-${index}`)}
                    sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
                  >
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                        <Typography variant="h6" fontWeight={600}>
                          {faq.question}
                        </Typography>
                        {faq.category && (
                          <Chip label={faq.category} size="small" />
                        )}
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))
              )}
            </Box>
          ) : (
            // Show normal tabs
            <>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                centered
                sx={{
                  mb: 4,
                  '& .MuiTab-root': {
                    fontSize: '1rem',
                    fontWeight: 600,
                    py: 2,
                    px: 3,
                  },
                }}
              >
                <Tab label="General" />
                <Tab label="For Renters" />
                <Tab label="For Hosts" />
              </Tabs>

              {/* General FAQs */}
              <TabPanel value={tabValue} index={0}>
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                  {generalFAQs.map((faq, index) => (
                    <Accordion
                      key={index}
                      expanded={expandedFAQ === `general-${index}`}
                      onChange={handleFAQChange(`general-${index}`)}
                      sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ width: '100%' }}>
                          <Typography variant="h6" fontWeight={600}>
                            {faq.question}
                          </Typography>
                          {faq.category && (
                            <Chip label={faq.category} size="small" />
                          )}
                        </Stack>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </TabPanel>

              {/* Renter FAQs */}
              <TabPanel value={tabValue} index={1}>
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                  {renterFAQs.map((faq, index) => (
                    <Accordion
                      key={index}
                      expanded={expandedFAQ === `renter-${index}`}
                      onChange={handleFAQChange(`renter-${index}`)}
                      sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6" fontWeight={600}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </TabPanel>

              {/* Host FAQs */}
              <TabPanel value={tabValue} index={2}>
                <Box sx={{ maxWidth: 800, mx: 'auto' }}>
                  {hostFAQs.map((faq, index) => (
                    <Accordion
                      key={index}
                      expanded={expandedFAQ === `host-${index}`}
                      onChange={handleFAQChange(`host-${index}`)}
                      sx={{ mb: 1, borderRadius: 2, '&:before': { display: 'none' } }}
                    >
                      <AccordionSummary expandIcon={<ExpandMore />}>
                        <Typography variant="h6" fontWeight={600}>
                          {faq.question}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Typography variant="body1" sx={{ fontSize: '1.1rem' }}>
                          {faq.answer}
                        </Typography>
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </TabPanel>
            </>
          )}
        </Box>

        {/* Contact Support */}
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
            Still Need Help?
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Our support team is here to help you
          </Typography>
          
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Card sx={{ textAlign: 'center', borderRadius: 3, maxWidth: 400 }}>
              <CardContent sx={{ p: 4 }}>
                <Email sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Email Support
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Send us a detailed message and we'll get back to you as soon as possible
                </Typography>
                <Button 
                  variant="contained" 
                  color="secondary"
                  component="a"
                  href="mailto:support@parkinginapinch.com"
                  sx={{ mt: 2 }}
                >
                  Contact Support
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}