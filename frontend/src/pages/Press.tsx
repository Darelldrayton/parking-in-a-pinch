import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Stack,
  useTheme,
  alpha,
  Paper,
  Chip,
  Avatar,
  Tabs,
  Tab,
  Link,
  Divider,
} from '@mui/material';
import {
  Article,
  Download,
  Image,
  VideoLibrary,
  Person,
  DateRange,
  TrendingUp,
  Business,
  Public,
  Email,
  Assignment,
  Language,
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
      id={`press-tabpanel-${index}`}
      aria-labelledby={`press-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const pressReleases = [
  {
    title: 'Parking in a Pinch Raises $150M Series C to Accelerate Global Expansion',
    date: 'March 15, 2024',
    category: 'Funding',
    excerpt: 'Leading parking marketplace platform announces major funding round led by Sequoia Capital to expand operations to 50 new cities worldwide.',
    readTime: '3 min read',
    featured: true,
  },
  {
    title: 'Partnership with Major Urban Cities to Reduce Parking Congestion',
    date: 'February 28, 2024',
    category: 'Partnership',
    excerpt: 'Strategic partnerships with San Francisco, New York, and Chicago aim to reduce urban parking congestion by 25% through innovative technology solutions.',
    readTime: '4 min read',
    featured: true,
  },
  {
    title: 'Parking in a Pinch Launches AI-Powered Dynamic Pricing',
    date: 'January 20, 2024',
    category: 'Product',
    excerpt: 'New machine learning algorithms optimize parking prices in real-time based on demand, location, and events, increasing host earnings by 30% on average.',
    readTime: '2 min read',
    featured: false,
  },
  {
    title: 'Company Reaches 5 Million Active Users Milestone',
    date: 'December 10, 2023',
    category: 'Milestone',
    excerpt: 'Platform growth accelerates with 5 million active users across 200+ cities, facilitating over 50 million parking sessions to date.',
    readTime: '3 min read',
    featured: false,
  },
  {
    title: 'Sustainability Initiative: Carbon-Neutral Parking by 2025',
    date: 'November 15, 2023',
    category: 'Sustainability',
    excerpt: 'Comprehensive environmental program includes EV charging partnerships and carbon offset programs for all platform transactions.',
    readTime: '5 min read',
    featured: false,
  },
  {
    title: 'Acquisition of Smart Parking Analytics Startup',
    date: 'October 8, 2023',
    category: 'Acquisition',
    excerpt: 'Strategic acquisition of ParkSense Technologies enhances predictive analytics capabilities and real-time space availability features.',
    readTime: '3 min read',
    featured: false,
  },
];

const mediaKit = [
  {
    title: 'Company Logos',
    description: 'High-resolution logos in various formats and color variations',
    type: 'ZIP',
    size: '12.5 MB',
    icon: <Image sx={{ fontSize: 32 }} />,
  },
  {
    title: 'Product Screenshots',
    description: 'Latest app and web platform screenshots for editorial use',
    type: 'ZIP',
    size: '8.3 MB',
    icon: <Image sx={{ fontSize: 32 }} />,
  },
  {
    title: 'Executive Photos',
    description: 'Professional headshots of leadership team members',
    type: 'ZIP',
    size: '15.7 MB',
    icon: <Person sx={{ fontSize: 32 }} />,
  },
  {
    title: 'Company Videos',
    description: 'Platform demonstration and company culture videos',
    type: 'ZIP',
    size: '45.2 MB',
    icon: <VideoLibrary sx={{ fontSize: 32 }} />,
  },
  {
    title: 'Brand Guidelines',
    description: 'Complete brand style guide and usage instructions',
    type: 'PDF',
    size: '3.1 MB',
    icon: <Article sx={{ fontSize: 32 }} />,
  },
  {
    title: 'Company Fact Sheet',
    description: 'Key statistics, timeline, and company information',
    type: 'PDF',
    size: '1.8 MB',
    icon: <Article sx={{ fontSize: 32 }} />,
  },
];

const newsHighlights = [
  {
    outlet: 'TechCrunch',
    headline: 'Parking in a Pinch is Solving Urban Mobility One Space at a Time',
    date: 'March 20, 2024',
    type: 'Feature Article',
    link: '#',
  },
  {
    outlet: 'The Wall Street Journal',
    headline: 'The Sharing Economy Comes for Your Driveway',
    date: 'March 18, 2024',
    type: 'News Article',
    link: '#',
  },
  {
    outlet: 'Forbes',
    headline: 'How Parking Apps Are Reshaping City Infrastructure',
    date: 'March 12, 2024',
    type: 'Analysis',
    link: '#',
  },
  {
    outlet: 'CNN Business',
    headline: 'Startup Aims to End Parking Nightmares in Major Cities',
    date: 'February 25, 2024',
    type: 'Interview',
    link: '#',
  },
  {
    outlet: 'Wired',
    headline: 'The Future of Urban Parking is Already Here',
    date: 'February 15, 2024',
    type: 'Technology Review',
    link: '#',
  },
];

const companyStats = [
  { label: 'Active Users', value: '5M+', icon: <Person /> },
  { label: 'Cities Served', value: '200+', icon: <Public /> },
  { label: 'Parking Sessions', value: '50M+', icon: <Business /> },
  { label: 'Host Earnings', value: '$500M+', icon: <TrendingUp /> },
];

export default function Press() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const featuredReleases = pressReleases.filter(release => release.featured);
  const recentReleases = pressReleases.filter(release => !release.featured);

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
              Press & Media
            </Typography>
            <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
              Latest news, announcements, and media resources
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', maxWidth: 600, mx: 'auto' }}>
              Stay up to date with the latest developments, partnerships, and milestones 
              as we continue to transform urban parking.
            </Typography>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Company Stats */}
        <Box sx={{ mb: 8 }}>
          <Grid container spacing={4}>
            {companyStats.map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ color: 'primary.main', mb: 1 }}>
                      {stat.icon}
                    </Box>
                    <Typography variant="h3" fontWeight={700} color="primary.main">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {stat.label}
                    </Typography>
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
                fontSize: '1.1rem',
                fontWeight: 600,
                py: 2,
                px: 4,
              },
            }}
          >
            <Tab label="Press Releases" />
            <Tab label="Media Coverage" />
            <Tab label="Media Kit" />
          </Tabs>
        </Box>

        {/* Press Releases Tab */}
        <TabPanel value={tabValue} index={0}>
          {/* Featured Press Releases */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Featured News
            </Typography>
            <Grid container spacing={4}>
              {featuredReleases.map((release, index) => (
                <Grid item xs={12} md={6} key={index}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent sx={{ p: 4 }}>
                      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                        <Chip label={release.category} color="primary" size="small" />
                        <Typography variant="caption" color="text.secondary">
                          {release.date}
                        </Typography>
                      </Stack>
                      <Typography variant="h5" fontWeight={600} gutterBottom>
                        {release.title}
                      </Typography>
                      <Typography variant="body1" color="text.secondary" paragraph>
                        {release.excerpt}
                      </Typography>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          {release.readTime}
                        </Typography>
                        <Button variant="outlined" size="small">
                          Read More
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>

          {/* Recent Press Releases */}
          <Box sx={{ mb: 6 }}>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Recent Announcements
            </Typography>
            <Grid container spacing={3}>
              {recentReleases.map((release, index) => (
                <Grid item xs={12} key={index}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={8}>
                          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
                            <Chip label={release.category} variant="outlined" size="small" />
                            <Typography variant="caption" color="text.secondary">
                              {release.date}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {release.readTime}
                            </Typography>
                          </Stack>
                          <Typography variant="h6" fontWeight={600} gutterBottom>
                            {release.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {release.excerpt}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                          <Button variant="outlined" fullWidth>
                            Read Full Release
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        </TabPanel>

        {/* Media Coverage Tab */}
        <TabPanel value={tabValue} index={1}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Recent Media Coverage
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            See what the press is saying about us
          </Typography>
          
          <Grid container spacing={3}>
            {newsHighlights.map((news, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Typography variant="subtitle1" fontWeight={600} color="primary.main">
                            {news.outlet}
                          </Typography>
                          <Chip label={news.type} size="small" variant="outlined" />
                          <Typography variant="caption" color="text.secondary">
                            {news.date}
                          </Typography>
                        </Stack>
                        <Typography variant="h6" fontWeight={600} gutterBottom>
                          {news.headline}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Button 
                          variant="outlined" 
                          fullWidth 
                          startIcon={<Language />}
                          href={news.link}
                          target="_blank"
                        >
                          Read Article
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Press Inquiry Section */}
          <Paper
            elevation={3}
            sx={{
              p: 6,
              borderRadius: 3,
              mt: 6,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
            }}
          >
            <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
              Media Inquiries
            </Typography>
            <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 4 }}>
              For press inquiries, interviews, and media requests
            </Typography>
            
            <Grid container spacing={4} justifyContent="center">
              <Grid item xs={12} md={6}>
                <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Email sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Press Contact
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Sarah Johnson
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Director of Communications
                    </Typography>
                    <Typography variant="body1" color="primary.main">
                      press@parkinginapinch.com
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Assignment sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }} />
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Media Request Form
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      Submit Online
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      For urgent media requests
                    </Typography>
                    <Typography variant="body1" color="secondary.main">
                      Online Form Available
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </TabPanel>

        {/* Media Kit Tab */}
        <TabPanel value={tabValue} index={2}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Media Kit & Resources
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Download logos, photos, and other media assets for editorial use
          </Typography>
          
          <Grid container spacing={4}>
            {mediaKit.map((item, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4, textAlign: 'center' }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {item.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {item.description}
                    </Typography>
                    <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 3 }}>
                      <Chip label={item.type} size="small" />
                      <Chip label={item.size} size="small" variant="outlined" />
                    </Stack>
                    <Button
                      variant="contained"
                      startIcon={<Download />}
                      fullWidth
                    >
                      Download
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Usage Guidelines */}
          <Paper
            elevation={1}
            sx={{
              p: 4,
              borderRadius: 3,
              mt: 6,
              bgcolor: alpha(theme.palette.info.main, 0.05),
            }}
          >
            <Typography variant="h5" fontWeight={600} gutterBottom>
              Usage Guidelines
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" paragraph>
              <strong>Editorial Use:</strong> All media assets are provided for editorial and news coverage purposes only. 
              Commercial use requires prior written permission.
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Attribution:</strong> Please include proper attribution when using our assets. 
              Credit should read "Parking in a Pinch" or "Courtesy of Parking in a Pinch."
            </Typography>
            <Typography variant="body1" paragraph>
              <strong>Modifications:</strong> Please do not modify our logos or brand assets. 
              Use them as provided in the original colors and proportions.
            </Typography>
            <Typography variant="body1">
              <strong>Questions:</strong> For questions about asset usage or to request additional materials, 
              contact our press team at press@parkinginapinch.com.
            </Typography>
          </Paper>
        </TabPanel>

        {/* Newsletter Signup */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 6,
            textAlign: 'center',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            color: 'white',
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Stay Updated
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
            Subscribe to our press newsletter for the latest company news and announcements
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                px: 4,
                py: 1.5,
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.9),
                },
              }}
            >
              Subscribe to Press Updates
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha(theme.palette.common.white, 0.1),
                },
              }}
            >
              Download Media Kit
            </Button>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}