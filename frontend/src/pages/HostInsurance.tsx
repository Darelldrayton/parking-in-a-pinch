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
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Security,
  Shield,
  CheckCircle,
  AttachMoney,
  Gavel,
  Email,
  Warning,
  Info,
  ExpandMore,
  Home,
  DirectionsCar,
  Person,
  Business,
  Assignment,
} from '@mui/icons-material';

const coverageTypes = [
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'General Liability',
    coverage: 'Up to $1,000,000',
    description: 'Protection against third-party injury or property damage claims',
    includes: [
      'Bodily injury to guests or visitors',
      'Property damage to third-party vehicles',
      'Legal defense costs',
      'Medical payments coverage',
    ],
  },
  {
    icon: <Home sx={{ fontSize: 40 }} />,
    title: 'Property Protection',
    coverage: 'Up to $100,000',
    description: 'Coverage for damage to your parking space or property',
    includes: [
      'Damage to parking surface or structures',
      'Vandalism or malicious damage',
      'Theft of property fixtures',
      'Environmental cleanup costs',
    ],
  },
  {
    icon: <DirectionsCar sx={{ fontSize: 40 }} />,
    title: 'Vehicle Incident Coverage',
    coverage: 'Up to $50,000',
    description: 'Protection for vehicle-related incidents on your property',
    includes: [
      'Guest vehicle damage from property hazards',
      'Collision with property structures',
      'Fire or weather-related vehicle damage',
      'Comprehensive investigation costs',
    ],
  },
  {
    icon: <Gavel sx={{ fontSize: 40 }} />,
    title: 'Legal Protection',
    coverage: 'Up to $25,000',
    description: 'Legal defense and representation coverage',
    includes: [
      'Attorney fees and legal costs',
      'Court costs and filing fees',
      'Expert witness expenses',
      'Settlement negotiations',
    ],
  },
];

const claimsProcess = [
  {
    step: 1,
    title: 'Report Incident',
    description: 'Report any incident through the app or website within 24 hours',
    actions: ['Take photos of any damage', 'Get contact information from all parties', 'File initial incident report'],
  },
  {
    step: 2,
    title: 'Claims Review',
    description: 'Our claims team reviews your submission and begins investigation',
    actions: ['Claims specialist assigned', 'Evidence collection begins', 'Initial coverage determination'],
  },
  {
    step: 3,
    title: 'Investigation',
    description: 'Thorough investigation of the incident and circumstances',
    actions: ['Interview all parties involved', 'Review evidence and documentation', 'Consult with experts if needed'],
  },
  {
    step: 4,
    title: 'Resolution',
    description: 'Claims decision and payout processing',
    actions: ['Coverage decision communicated', 'Settlement negotiations if applicable', 'Payment processing'],
  },
];

const eligibilityRequirements = [
  {
    category: 'Host Requirements',
    items: [
      'Active host with verified identity',
      'Minimum 4.0-star average rating',
      'No serious policy violations in past 12 months',
      'Complete host profile with accurate information',
    ],
  },
  {
    category: 'Property Requirements',
    items: [
      'Property meets all safety standards',
      'Current photos and accurate descriptions',
      'Compliance with local zoning laws',
      'No known structural or safety issues',
    ],
  },
  {
    category: 'Booking Requirements',
    items: [
      'Bookings made through official platform',
      'Guest identity verified',
      'Payment processed through our system',
      'All platform terms and conditions accepted',
    ],
  },
];

const exclusions = [
  {
    category: 'Pre-existing Conditions',
    items: [
      'Damage existing before the booking',
      'Known property defects or hazards',
      'Pre-existing legal disputes',
      'Prior unreported incidents',
    ],
  },
  {
    category: 'Intentional Acts',
    items: [
      'Deliberate damage or vandalism by host',
      'Fraudulent claims or misrepresentation',
      'Violations of platform terms',
      'Criminal activity',
    ],
  },
  {
    category: 'Excluded Activities',
    items: [
      'Commercial vehicle storage',
      'Vehicle repairs or maintenance',
      'Long-term storage (over 30 days)',
      'Non-vehicular use of space',
    ],
  },
];

const coverageDetails = [
  {
    type: 'General Liability',
    perIncident: '$1,000,000',
    aggregate: '$2,000,000',
    deductible: '$500',
    examples: 'Slip and fall, property damage claims',
  },
  {
    type: 'Property Protection',
    perIncident: '$100,000',
    aggregate: '$200,000',
    deductible: '$1,000',
    examples: 'Surface damage, gate/barrier damage',
  },
  {
    type: 'Vehicle Coverage',
    perIncident: '$50,000',
    aggregate: '$100,000',
    deductible: '$1,000',
    examples: 'Vehicle damage from property hazards',
  },
  {
    type: 'Legal Defense',
    perIncident: '$25,000',
    aggregate: '$50,000',
    deductible: '$0',
    examples: 'Attorney fees, court costs',
  },
];

export default function HostInsurance() {
  const theme = useTheme();

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
          <Box sx={{ textAlign: 'center' }}>
            <Shield sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Host Insurance
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Comprehensive protection for your peace of mind
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Every qualifying booking includes comprehensive insurance coverage to protect you, 
              your property, and your guests. Host with confidence knowing you're covered.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Coverage Overview */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Coverage Types
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Comprehensive protection across multiple areas
          </Typography>
          
          <Grid container spacing={4}>
            {coverageTypes.map((coverage, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Box sx={{ color: 'success.main' }}>
                        {coverage.icon}
                      </Box>
                      <Box>
                        <Typography variant="h5" fontWeight={600}>
                          {coverage.title}
                        </Typography>
                        <Chip label={coverage.coverage} color="success" size="small" />
                      </Box>
                    </Stack>
                    <Typography variant="body1" paragraph>
                      {coverage.description}
                    </Typography>
                    <Typography variant="subtitle2" gutterBottom>
                      Includes:
                    </Typography>
                    <List dense>
                      {coverage.includes.map((item, idx) => (
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

        {/* Coverage Details Table */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Coverage Limits & Details
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Specific coverage amounts and deductibles
          </Typography>
          
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Coverage Type</strong></TableCell>
                  <TableCell><strong>Per Incident</strong></TableCell>
                  <TableCell><strong>Annual Aggregate</strong></TableCell>
                  <TableCell><strong>Deductible</strong></TableCell>
                  <TableCell><strong>Examples</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {coverageDetails.map((detail, index) => (
                  <TableRow key={index}>
                    <TableCell>{detail.type}</TableCell>
                    <TableCell>{detail.perIncident}</TableCell>
                    <TableCell>{detail.aggregate}</TableCell>
                    <TableCell>{detail.deductible}</TableCell>
                    <TableCell>{detail.examples}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        {/* Claims Process */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Claims Process
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Simple, straightforward claims handling
          </Typography>
          
          <Grid container spacing={4}>
            {claimsProcess.map((step, index) => (
              <Grid item xs={12} md={6} lg={3} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 2,
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                      }}
                    >
                      {step.step}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {step.description}
                    </Typography>
                    <List dense>
                      {step.actions.map((action, idx) => (
                        <ListItem key={idx} sx={{ px: 0, justifyContent: 'center' }}>
                          <ListItemText 
                            primary={action} 
                            primaryTypographyProps={{ variant: 'caption', textAlign: 'center' }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Eligibility Requirements */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Eligibility Requirements
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Requirements to qualify for insurance coverage
          </Typography>
          
          <Grid container spacing={4}>
            {eligibilityRequirements.map((requirement, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Typography variant="h5" fontWeight={600} gutterBottom color="primary.main">
                  {requirement.category}
                </Typography>
                <List>
                  {requirement.items.map((item, idx) => (
                    <ListItem key={idx} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <CheckCircle color="success" />
                      </ListItemIcon>
                      <ListItemText primary={item} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Exclusions */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Policy Exclusions
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            What is not covered under the insurance policy
          </Typography>
          
          <Grid container spacing={4}>
            {exclusions.map((exclusion, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom color="warning.main">
                      {exclusion.category}
                    </Typography>
                    <List dense>
                      {exclusion.items.map((item, idx) => (
                        <ListItem key={idx} sx={{ px: 0 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <Warning color="warning" fontSize="small" />
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

        {/* FAQ Section */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Insurance FAQ
          </Typography>
          
          <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4 }}>
            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Is insurance coverage automatic?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Yes, insurance coverage is automatically included for all qualifying bookings made through our platform. 
                  No additional fees or enrollment required.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  How quickly are claims processed?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Most claims are processed within 7-14 business days. Complex cases may take longer, 
                  but we'll keep you informed throughout the process.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  Do I need my own insurance as well?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  Our coverage is designed to complement, not replace, your existing property insurance. 
                  We recommend reviewing your personal insurance policies and consulting with your agent.
                </Typography>
              </AccordionDetails>
            </Accordion>

            <Accordion sx={{ mb: 2, borderRadius: 2, '&:before': { display: 'none' } }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography variant="h6" fontWeight={600}>
                  What if the guest's insurance covers the damage?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography>
                  If the guest's insurance covers the damage, we'll coordinate with their provider. 
                  Our coverage serves as backup protection if their insurance is insufficient or unavailable.
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
            Insurance Questions or Claims?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Our insurance team is here to help
          </Typography>
          
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Assignment sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Online Claims
                  </Typography>
                  <Typography variant="body1" color="primary.main">
                    File Claims Online
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Submit claims through our portal 24/7
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Email sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Insurance Support
                  </Typography>
                  <Typography variant="body1" color="secondary.main">
                    insurance@parkinginapinch.com
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Response within 4 hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Assignment sx={{ fontSize: 40, color: 'success.main', mb: 2 }} />
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    File a Claim
                  </Typography>
                  <Button variant="contained" color="success">
                    Start Claim Process
                  </Button>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Online claims portal
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}