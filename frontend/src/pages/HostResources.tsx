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
  Link,
  Chip,
} from '@mui/material';
import {
  School,
  TrendingUp,
  Support,
  Download,
  VideoLibrary,
  Article,
  Group,
  Star,
  AttachMoney,
  Camera,
  Schedule,
  Security,
  CheckCircle,
  Phone,
  Email,
  Forum,
  Assignment,
  Lightbulb,
  BarChart,
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
      id={`resources-tabpanel-${index}`}
      aria-labelledby={`resources-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const resourceCategories = [
  {
    icon: <School sx={{ fontSize: 40 }} />,
    title: 'Getting Started',
    description: 'Essential resources for new hosts',
    count: 12,
    color: 'primary',
  },
  {
    icon: <TrendingUp sx={{ fontSize: 40 }} />,
    title: 'Optimization Tips',
    description: 'Maximize your earnings and bookings',
    count: 8,
    color: 'success',
  },
  {
    icon: <Security sx={{ fontSize: 40 }} />,
    title: 'Safety & Legal',
    description: 'Important safety and legal information',
    count: 6,
    color: 'warning',
  },
  {
    icon: <Support sx={{ fontSize: 40 }} />,
    title: 'Support Tools',
    description: 'Tools and templates to help you succeed',
    count: 15,
    color: 'info',
  },
];

const gettingStartedResources = [
  {
    title: 'Host Onboarding Guide',
    type: 'PDF Guide',
    description: 'Complete step-by-step guide to setting up your first listing',
    downloadUrl: '#',
    featured: true,
  },
  {
    title: 'Photography Best Practices',
    type: 'Video Tutorial',
    description: 'Learn how to take professional photos that attract more bookings',
    downloadUrl: '#',
    featured: true,
  },
  {
    title: 'Pricing Strategy Worksheet',
    type: 'Excel Template',
    description: 'Calculate optimal pricing for your market and space type',
    downloadUrl: '#',
    featured: false,
  },
  {
    title: 'Host Welcome Kit',
    type: 'PDF Package',
    description: 'Everything you need to know in your first 30 days',
    downloadUrl: '#',
    featured: false,
  },
];

const optimizationResources = [
  {
    title: 'Maximizing Your Listing Visibility',
    type: 'Article',
    description: 'SEO tips and tricks to improve your search ranking',
    downloadUrl: '#',
  },
  {
    title: 'Seasonal Pricing Strategies',
    type: 'Video',
    description: 'Adjust your pricing for maximum profitability year-round',
    downloadUrl: '#',
  },
  {
    title: 'Guest Communication Templates',
    type: 'Template Pack',
    description: 'Pre-written messages for common hosting scenarios',
    downloadUrl: '#',
  },
  {
    title: 'Analytics Dashboard Guide',
    type: 'Tutorial',
    description: 'Understanding your performance metrics and insights',
    downloadUrl: '#',
  },
];

const safetyResources = [
  {
    title: 'Host Safety Guidelines',
    type: 'Guide',
    description: 'Essential safety practices for hosting',
    downloadUrl: '#',
  },
  {
    title: 'Legal Compliance Checklist',
    type: 'Checklist',
    description: 'Ensure you meet all local legal requirements',
    downloadUrl: '#',
  },
  {
    title: 'Insurance Overview',
    type: 'Information Sheet',
    description: 'Understanding your coverage and additional protection options',
    downloadUrl: '#',
  },
  {
    title: 'Emergency Procedures',
    type: 'Quick Reference',
    description: 'What to do in case of incidents or emergencies',
    downloadUrl: '#',
  },
];

const supportTools = [
  {
    title: 'Host Mobile App',
    type: 'Mobile App',
    description: 'Manage your listings and bookings on the go',
    downloadUrl: '#',
    platforms: ['iOS', 'Android'],
  },
  {
    title: 'Listing Optimization Tool',
    type: 'Web Tool',
    description: 'AI-powered suggestions to improve your listing',
    downloadUrl: '#',
  },
  {
    title: 'Revenue Calculator',
    type: 'Calculator',
    description: 'Estimate your potential monthly earnings',
    downloadUrl: '#',
  },
  {
    title: 'Market Analysis Reports',
    type: 'Reports',
    description: 'Monthly insights about your local parking market',
    downloadUrl: '#',
  },
];

const communityFeatures = [
  {
    title: 'Host Community Forum',
    description: 'Connect with other hosts, share tips, and get advice',
    icon: <Forum sx={{ fontSize: 32 }} />,
    action: 'Join Forum',
  },
  {
    title: 'Monthly Host Webinars',
    description: 'Live training sessions with hosting experts and platform updates',
    icon: <VideoLibrary sx={{ fontSize: 32 }} />,
    action: 'View Schedule',
  },
  {
    title: 'Local Host Meetups',
    description: 'In-person networking events in major cities',
    icon: <Group sx={{ fontSize: 32 }} />,
    action: 'Find Events',
  },
  {
    title: 'Success Stories Blog',
    description: 'Learn from successful hosts and their strategies',
    icon: <Star sx={{ fontSize: 32, color: 'warning.main' }} />,
    action: 'Read Stories',
  },
];

const quickTips = [
  'Update your calendar regularly to avoid cancellations',
  'Respond to booking requests within 2 hours',
  'Take high-quality photos in good lighting',
  'Set competitive pricing based on local market rates',
  'Provide clear and detailed access instructions',
  'Maintain excellent communication with guests',
  'Keep your parking space clean and well-maintained',
  'Offer additional amenities when possible',
];

export default function HostResources() {
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
          background: `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`,
          color: 'white',
          py: 8,
          mb: 6,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center' }}>
            <Assignment sx={{ fontSize: 60, mb: 2, opacity: 0.9 }} />
            <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
              Host Resources
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Everything you need to succeed as a host
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Access guides, tools, templates, and community support to maximize your hosting success. 
              From getting started to advanced optimization strategies.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Resource Categories */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Resource Categories
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Find the resources you need to grow your hosting business
          </Typography>
          
          <Grid container spacing={4}>
            {resourceCategories.map((category, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card 
                  sx={{ 
                    textAlign: 'center', 
                    borderRadius: 3, 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: `${category.color}.main`, mb: 2 }}>
                      {category.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {category.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {category.description}
                    </Typography>
                    <Chip 
                      label={`${category.count} Resources`}
                      color={category.color as any}
                      size="small"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

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
            <Tab label="Getting Started" />
            <Tab label="Optimization" />
            <Tab label="Safety & Legal" />
            <Tab label="Tools & Apps" />
          </Tabs>
        </Box>

        {/* Getting Started Tab */}
        <TabPanel value={tabValue} index={0}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Getting Started Resources
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Essential guides and tutorials for new hosts
          </Typography>
          
          <Grid container spacing={4}>
            {gettingStartedResources.map((resource, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                      <Typography variant="h6" fontWeight={600}>
                        {resource.title}
                      </Typography>
                      {resource.featured && (
                        <Chip label="Featured" size="small" />
                      )}
                    </Stack>
                    <Typography variant="caption" gutterBottom>
                      {resource.type}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {resource.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      startIcon={<Download />}
                      fullWidth
                      href={resource.downloadUrl}
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Optimization Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Optimization Resources
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Advanced strategies to maximize your success
          </Typography>
          
          <Grid container spacing={3}>
            {optimizationResources.map((resource, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {resource.title}
                        </Typography>
                        <Typography variant="caption" color="success.main" gutterBottom>
                          {resource.type}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {resource.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<TrendingUp />}
                          fullWidth
                          href={resource.downloadUrl}
                        >
                          Access Resource
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Safety & Legal Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Safety & Legal Resources
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Important information to keep you and your guests safe
          </Typography>
          
          <Grid container spacing={3}>
            {safetyResources.map((resource, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <Security sx={{ color: 'warning.main', fontSize: 32 }} />
                      <Typography variant="h6" fontWeight={600}>
                        {resource.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="warning.main" gutterBottom>
                      {resource.type}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {resource.description}
                    </Typography>
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<Download />}
                      fullWidth
                      href={resource.downloadUrl}
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Tools & Apps Tab */}
        <TabPanel value={tabValue} index={3}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Tools & Applications
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Digital tools to streamline your hosting experience
          </Typography>
          
          <Grid container spacing={4}>
            {supportTools.map((tool, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                      <BarChart sx={{ color: 'info.main', fontSize: 32 }} />
                      <Typography variant="h6" fontWeight={600}>
                        {tool.title}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="info.main" gutterBottom>
                      {tool.type}
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {tool.description}
                    </Typography>
                    {tool.platforms && (
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        {tool.platforms.map((platform, idx) => (
                          <Chip key={idx} label={platform} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    )}
                    <Button
                      variant="contained"
                      color="info"
                      startIcon={<Download />}
                      fullWidth
                      href={tool.downloadUrl}
                    >
                      Access Tool
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* Community Features */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Community & Support
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Connect with other hosts and get expert support
          </Typography>
          
          <Grid container spacing={4}>
            {communityFeatures.map((feature, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                      <Box sx={{ color: 'secondary.main' }}>
                        {feature.icon}
                      </Box>
                      <Typography variant="h6" fontWeight={600}>
                        {feature.title}
                      </Typography>
                    </Stack>
                    <Typography variant="body2" paragraph>
                      {feature.description}
                    </Typography>
                    <Button variant="outlined" color="secondary" fullWidth>
                      {feature.action}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Quick Tips */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            Quick Success Tips
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
            Essential tips every successful host follows
          </Typography>
          
          <Grid container spacing={2}>
            {quickTips.map((tip, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Lightbulb sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography variant="body2">
                    {tip}
                  </Typography>
                </Stack>
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Contact Support */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Need Additional Support?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Our host success team is here to help you thrive
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              startIcon={<Phone />}
              sx={{ px: 4, py: 1.5 }}
            >
              Call Host Support
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Email />}
              sx={{ px: 4, py: 1.5 }}
            >
              Email Host Team
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<Schedule />}
              sx={{ px: 4, py: 1.5 }}
            >
              Schedule Consultation
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}