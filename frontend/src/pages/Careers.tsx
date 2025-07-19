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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material';
import {
  Work,
  LocationOn,
  Schedule,
  Business,
  Code,
  DesignServices,
  Campaign,
  Support,
  Engineering,
  CheckCircle,
  TrendingUp,
  Group,
  EmojiEvents,
  School,
  FitnessCenter,
  LocalHospital,
  Savings,
  Close,
  AttachFile,
  Search,
  FilterList,
} from '@mui/icons-material';
import { careersService } from '../services/careers';

const departments = [
  {
    icon: <Engineering sx={{ fontSize: 40 }} />,
    title: 'Engineering',
    description: 'Build the future of parking technology',
    openings: 3,
    color: 'primary',
  },
  {
    icon: <DesignServices sx={{ fontSize: 40 }} />,
    title: 'Design',
    description: 'Create beautiful and intuitive user experiences',
    openings: 2,
    color: 'secondary',
  },
  {
    icon: <Campaign sx={{ fontSize: 40 }} />,
    title: 'Marketing',
    description: 'Grow our brand and reach new customers',
    openings: 2,
    color: 'success',
  },
  {
    icon: <Support sx={{ fontSize: 40 }} />,
    title: 'Customer Success',
    description: 'Help our users have amazing experiences',
    openings: 1,
    color: 'info',
  },
  {
    icon: <Business sx={{ fontSize: 40 }} />,
    title: 'Business Operations',
    description: 'Scale our operations and partnerships',
    openings: 1,
    color: 'warning',
  },
  {
    icon: <Work sx={{ fontSize: 40 }} />,
    title: 'Sales',
    description: 'Drive growth and expand our market reach',
    openings: 1,
    color: 'error',
  },
];

const jobListings = [
  {
    id: 1,
    title: 'Founding Full-Stack Engineer',
    department: 'Engineering',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Senior',
    description: 'Lead development of our core platform using React, Node.js, and Python. Shape the technical foundation of our startup.',
    requirements: ['5+ years full-stack experience', 'React/Node.js expertise', 'Startup experience preferred'],
  },
  {
    id: 2,
    title: 'Mobile Developer (iOS/Android)',
    department: 'Engineering',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Mid-Senior',
    description: 'Build native mobile apps for iOS and Android platforms.',
    requirements: ['3+ years mobile development', 'React Native or native development', 'App Store experience'],
  },
  {
    id: 3,
    title: 'Head of Product',
    department: 'Design',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Senior',
    description: 'Lead product strategy and vision for our parking marketplace platform.',
    requirements: ['5+ years product management', 'Marketplace experience', 'Leadership experience'],
  },
  {
    id: 4,
    title: 'UX/UI Designer',
    department: 'Design',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Mid-Senior',
    description: 'Design user-centered experiences for our mobile and web applications.',
    requirements: ['3+ years product design', 'Figma proficiency', 'Mobile-first design'],
  },
  {
    id: 5,
    title: 'Head of Marketing',
    department: 'Marketing',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Senior',
    description: 'Build and lead our marketing strategy for user acquisition and brand growth.',
    requirements: ['5+ years marketing leadership', 'Growth marketing expertise', 'B2C experience'],
  },
  {
    id: 6,
    title: 'Growth Marketing Specialist',
    department: 'Marketing',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Mid-level',
    description: 'Drive user acquisition and retention through data-driven marketing campaigns.',
    requirements: ['3+ years growth marketing', 'Analytics expertise', 'A/B testing experience'],
  },
  {
    id: 7,
    title: 'Operations Manager',
    department: 'Business Operations',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Mid-level',
    description: 'Scale our operations and build efficient processes as we grow.',
    requirements: ['3+ years operations experience', 'Process optimization', 'Startup experience preferred'],
  },
  {
    id: 8,
    title: 'Head of Sales',
    department: 'Sales',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Senior',
    description: 'Build and lead our sales organization for B2B partnerships and enterprise clients.',
    requirements: ['5+ years sales leadership', 'B2B sales experience', 'Team building experience'],
  },
  {
    id: 9,
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Mid-level',
    description: 'Support our host and renter communities to ensure exceptional experiences.',
    requirements: ['3+ years customer success', 'Excellent communication', 'Marketplace experience preferred'],
  },
  {
    id: 10,
    title: 'DevOps Engineer',
    department: 'Engineering',
    location: 'NYC, NY',
    type: 'Full-time',
    experience: 'Mid-Senior',
    description: 'Build and maintain our cloud infrastructure and deployment pipelines.',
    requirements: ['3+ years DevOps experience', 'AWS/GCP expertise', 'CI/CD pipeline experience'],
  },
];

const benefits = [
  {
    icon: <LocalHospital sx={{ fontSize: 32 }} />,
    title: 'Health & Wellness',
    description: 'Comprehensive health, dental, and vision insurance plus wellness stipend',
  },
  {
    icon: <Savings sx={{ fontSize: 32 }} />,
    title: 'Financial Benefits',
    description: 'Competitive salary, equity participation, and 401(k) with company matching',
  },
  {
    icon: <Schedule sx={{ fontSize: 32 }} />,
    title: 'Work-Life Balance',
    description: 'Flexible hours, unlimited PTO, and remote work options',
  },
  {
    icon: <School sx={{ fontSize: 32 }} />,
    title: 'Learning & Development',
    description: 'Annual learning budget, conference attendance, and internal mentorship',
  },
  {
    icon: <FitnessCenter sx={{ fontSize: 32 }} />,
    title: 'Office Perks',
    description: 'Free meals, gym membership, commuter benefits, and modern offices',
  },
  {
    icon: <EmojiEvents sx={{ fontSize: 32 }} />,
    title: 'Recognition',
    description: 'Performance bonuses, stock options, and career advancement opportunities',
  },
];

const values = [
  {
    title: 'Innovation First',
    description: 'We constantly push boundaries to solve real-world parking challenges with cutting-edge technology.',
  },
  {
    title: 'Customer Obsession',
    description: 'Every decision we make starts with our users - both hosts and renters are at the center of everything.',
  },
  {
    title: 'Transparency',
    description: 'We believe in open communication, honest feedback, and building trust through transparency.',
  },
  {
    title: 'Sustainable Growth',
    description: 'We build for the long term, creating sustainable solutions that benefit communities and the environment.',
  },
];

export default function Careers() {
  const theme = useTheme();
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [applicationModalOpen, setApplicationModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    linkedIn: '',
    portfolio: '',
    coverLetter: '',
    resume: null as File | null,
  });

  const filteredJobs = jobListings.filter(job => {
    const matchesDepartment = !selectedDepartment || job.department === selectedDepartment;
    const matchesSearch = !searchTerm || 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExperience = !experienceFilter || job.experience === experienceFilter;
    return matchesDepartment && matchesSearch && matchesExperience;
  });

  const handleApplyClick = (job: any) => {
    setSelectedJob(job);
    setApplicationModalOpen(true);
  };

  const handleSubmitApplication = async () => {
    if (!selectedJob) return;
    
    try {
      // Submit the application using direct import
      await careersService.submitApplication({
        name: applicationData.fullName,
        email: applicationData.email,
        phone: applicationData.phone,
        position: selectedJob.title,
        department: selectedJob.department,
        experience_level: selectedJob.experience,
        location: 'New York, NY', // Default location
        linkedin: applicationData.linkedIn,
        portfolio: applicationData.portfolio,
        cover_letter: applicationData.coverLetter,
        resume: applicationData.resume,
      });
      
      // Reset form and close modal
      setApplicationData({
        fullName: '',
        email: '',
        phone: '',
        linkedIn: '',
        portfolio: '',
        coverLetter: '',
        resume: null,
      });
      setApplicationModalOpen(false);
      
      // Show success message
      alert('Application submitted successfully! You will receive a confirmation email shortly.');
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Error submitting application. Please try again.');
    }
  };

  const handleResumeUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setApplicationData(prev => ({ ...prev, resume: file }));
    }
  };

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
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
                Join Our Team
              </Typography>
              <Typography variant="h5" sx={{ opacity: 0.9, mb: 4 }}>
                Help us revolutionize parking and build the future of urban mobility
              </Typography>
              <Typography variant="body1" sx={{ opacity: 0.8, fontSize: '1.1rem', mb: 4 }}>
                We're looking for passionate, talented individuals who want to make a real impact 
                on how people move through cities. Join our mission to make parking stress-free for everyone.
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    px: 4,
                    py: 1.5,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.common.white, 0.9),
                    },
                  }}
                >
                  View Open Positions
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
                  Learn About Our Culture
                </Button>
              </Stack>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  position: 'relative',
                  height: 400,
                  background: `linear-gradient(45deg, ${alpha(theme.palette.common.white, 0.1)}, ${alpha(theme.palette.primary.light, 0.1)})`,
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Group sx={{ fontSize: 60, opacity: 0.7 }} />
                  <TrendingUp sx={{ fontSize: 80, opacity: 0.9 }} />
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Company Stats */}
        <Box sx={{ mb: 8 }}>
          <Grid container spacing={4}>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h3" fontWeight={700}>
                    12
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Growing Team
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h3" fontWeight={700} color="secondary.main">
                    10
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Open Positions
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h3" fontWeight={700} color="success.main">
                    NYC
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Headquarters
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    Seed
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Stage Startup
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Departments */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Explore Departments
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            Find your perfect role across our growing teams
          </Typography>
          
          <Grid container spacing={4}>
            {departments.map((dept, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
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
                  onClick={() => setSelectedDepartment(dept.title)}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: `${dept.color}.main`, mb: 2 }}>
                      {dept.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {dept.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {dept.description}
                    </Typography>
                    <Chip 
                      label={`${dept.openings} Open Positions`}
                      color={dept.color as any}
                      variant="outlined"
                    />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Job Listings */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Open Positions
          </Typography>
          
          {/* Search and Filters */}
          <Box sx={{ mb: 4 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Experience Level</InputLabel>
                  <Select
                    value={experienceFilter}
                    label="Experience Level"
                    onChange={(e) => setExperienceFilter(e.target.value)}
                  >
                    <MenuItem value="">All Levels</MenuItem>
                    <MenuItem value="Entry-level">Entry Level</MenuItem>
                    <MenuItem value="Mid-level">Mid Level</MenuItem>
                    <MenuItem value="Mid-Senior">Mid-Senior</MenuItem>
                    <MenuItem value="Senior">Senior</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<FilterList />}
                  onClick={() => {
                    setSearchTerm('');
                    setExperienceFilter('');
                    setSelectedDepartment(null);
                  }}
                >
                  Clear Filters
                </Button>
              </Grid>
            </Grid>
          </Box>
          
          {selectedDepartment && (
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Chip 
                label={`Showing ${filteredJobs.length} positions in ${selectedDepartment}`}
                onDelete={() => setSelectedDepartment(null)}
                sx={{ mr: 2 }}
              />
              <Button 
                variant="text" 
                onClick={() => setSelectedDepartment(null)}
                size="small"
              >
                View All Positions
              </Button>
            </Box>
          )}
          
          <Grid container spacing={3}>
            {filteredJobs.map((job, index) => (
              <Grid item xs={12} key={index}>
                <Card sx={{ borderRadius: 3 }}>
                  <CardContent sx={{ p: 4 }}>
                    <Grid container spacing={3} alignItems="center">
                      <Grid item xs={12} md={8}>
                        <Typography variant="h5" fontWeight={600} gutterBottom>
                          {job.title}
                        </Typography>
                        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                          <Chip label={job.department} size="small"  />
                          <Chip label={job.type} size="small" variant="outlined" />
                          <Chip label={job.experience} size="small" variant="outlined" />
                        </Stack>
                        <Stack direction="row" spacing={3} sx={{ mb: 2 }}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <LocationOn fontSize="small" color="action" />
                            <Typography variant="body2" color="text.secondary">
                              {job.location}
                            </Typography>
                          </Stack>
                        </Stack>
                        <Typography variant="body1" paragraph>
                          {job.description}
                        </Typography>
                        <Box>
                          <Typography variant="subtitle2" gutterBottom>
                            Key Requirements:
                          </Typography>
                          <List dense>
                            {job.requirements.map((req, idx) => (
                              <ListItem key={idx} sx={{ py: 0 }}>
                                <ListItemIcon sx={{ minWidth: 32 }}>
                                  <CheckCircle color="success" fontSize="small" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={req} 
                                  primaryTypographyProps={{ variant: 'body2' }}
                                />
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      </Grid>
                      <Grid item xs={12} md={4}>
                        <Stack spacing={2}>
                          <Button
                            variant="contained"
                            size="large"
                            fullWidth
                            sx={{ py: 1.5 }}
                            onClick={() => handleApplyClick(job)}
                          >
                            Apply Now
                          </Button>
                          <Button
                            variant="outlined"
                            size="large"
                            fullWidth
                          >
                            Learn More
                          </Button>
                        </Stack>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Benefits */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Why You'll Love Working Here
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            We invest in our people with comprehensive benefits and a supportive culture
          </Typography>
          
          <Grid container spacing={4}>
            {benefits.map((benefit, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                  <CardContent sx={{ p: 4 }}>
                    <Box sx={{ color: 'primary.main', mb: 2 }}>
                      {benefit.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {benefit.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {benefit.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Company Values */}
        <Paper
          elevation={3}
          sx={{
            p: 6,
            borderRadius: 3,
            mb: 8,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
          }}
        >
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Our Values
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            The principles that guide everything we do
          </Typography>
          
          <Grid container spacing={4}>
            {values.map((value, index) => (
              <Grid item xs={12} md={6} key={index}>
                <Box sx={{ p: 3 }}>
                  <Typography variant="h5" fontWeight={600} gutterBottom color="primary.main">
                    {value.title}
                  </Typography>
                  <Typography variant="body1">
                    {value.description}
                  </Typography>
                </Box>
                {index < values.length - 1 && index % 2 === 1 && (
                  <Divider sx={{ my: 2 }} />
                )}
              </Grid>
            ))}
          </Grid>
        </Paper>

        {/* Application Process */}
        <Box sx={{ mb: 8 }}>
          <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
            Our Hiring Process
          </Typography>
          <Typography variant="h6" textAlign="center" color="text.secondary" sx={{ mb: 6 }}>
            What to expect when you apply
          </Typography>
          
          <Grid container spacing={4}>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                    1
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Application Review
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    We review your application and resume within 3-5 business days
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                    2
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Phone/Video Screen
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    30-minute conversation with our recruiting team about your background
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ bgcolor: 'success.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                    3
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Technical/Skills Interview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Role-specific assessment to evaluate your technical skills and experience
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ textAlign: 'center', borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 4 }}>
                  <Avatar sx={{ bgcolor: 'warning.main', width: 60, height: 60, mx: 'auto', mb: 2 }}>
                    4
                  </Avatar>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Final Interview
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Meet with team members and discuss culture fit and career goals
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h3" fontWeight={700} gutterBottom>
            Ready to Join Us?
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
            Be part of the team that's transforming urban mobility
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              variant="contained"
              size="large"
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              View All Open Positions
            </Button>
            <Button
              variant="outlined"
              size="large"
              sx={{ px: 6, py: 2, fontSize: '1.1rem' }}
            >
              Join Our Talent Network
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Application Modal */}
      <Dialog 
        open={applicationModalOpen} 
        onClose={() => setApplicationModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={600}>
              Apply for {selectedJob?.title}
            </Typography>
            <IconButton onClick={() => setApplicationModalOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={applicationData.fullName}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, fullName: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={applicationData.email}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={applicationData.phone}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="LinkedIn URL"
                  value={applicationData.linkedIn}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, linkedIn: e.target.value }))}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Portfolio URL"
                  value={applicationData.portfolio}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, portfolio: e.target.value }))}
                  helperText="Optional - relevant for design and engineering roles"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
                  <input
                    accept=".pdf,.doc,.docx"
                    style={{ display: 'none' }}
                    id="resume-upload"
                    type="file"
                    onChange={handleResumeUpload}
                  />
                  <label htmlFor="resume-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<AttachFile />}
                    >
                      Upload Resume
                    </Button>
                  </label>
                  {applicationData.resume && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      Selected: {applicationData.resume.name}
                    </Typography>
                  )}
                  <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                    PDF, DOC, or DOCX files only
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Cover Letter"
                  multiline
                  rows={4}
                  value={applicationData.coverLetter}
                  onChange={(e) => setApplicationData(prev => ({ ...prev, coverLetter: e.target.value }))}
                  helperText="Optional - Tell us why you're interested in this role"
                />
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setApplicationModalOpen(false)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmitApplication}
            variant="contained"
            disabled={!applicationData.fullName || !applicationData.email || !applicationData.phone}
          >
            Submit Application
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}