import React, { useState, useMemo } from 'react';
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
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  Divider,
  Avatar,
  Link,
} from '@mui/material';
import {
  Dashboard,
  LocalParking,
  People,
  BookOnline,
  Work,
  Analytics,
  Settings,
  GetApp,
  Add,
  Visibility,
  GetAppOutlined,
  Email,
  Search,
  FilterList,
  Close,
  Phone,
  LinkedIn,
  Web,
  CalendarToday,
  LocationOn,
  Star,
  StarBorder,
} from '@mui/icons-material';

// Sample data
const sampleApplications = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 (555) 123-4567',
    position: 'Founding Full-Stack Engineer',
    department: 'Engineering',
    appliedDate: '2024-01-15',
    status: 'interview',
    rating: 4,
    experience: 'Senior',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/sarahchen',
    portfolio: 'https://sarahchen.dev',
    coverLetter: 'I am excited about the opportunity to join Parking in a Pinch as a founding engineer. With 6 years of full-stack development experience, I have built scalable web applications using React, Node.js, and Python. I am particularly drawn to your mission of solving urban mobility challenges...',
    resumeUrl: '/resumes/sarah-chen-resume.pdf'
  },
  {
    id: 2,
    name: 'Marcus Johnson',
    email: 'marcus.j@email.com',
    phone: '+1 (555) 234-5678',
    position: 'Mobile Developer',
    department: 'Engineering',
    appliedDate: '2024-01-12',
    status: 'reviewing',
    rating: 5,
    experience: 'Mid',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/marcusjohnson',
    portfolio: 'https://marcusapps.com',
    coverLetter: 'As a mobile developer with 4 years of experience building React Native apps, I am thrilled about the opportunity to help create the next generation of parking solutions...',
    resumeUrl: '/resumes/marcus-johnson-resume.pdf'
  },
  {
    id: 3,
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@email.com',
    phone: '+1 (555) 345-6789',
    position: 'Head of Marketing',
    department: 'Marketing',
    appliedDate: '2024-01-10',
    status: 'offered',
    rating: 5,
    experience: 'Senior',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/emilyrodriguez',
    portfolio: '',
    coverLetter: 'With 8 years of marketing leadership experience in B2C startups, I am excited to help build the Parking in a Pinch brand from the ground up...',
    resumeUrl: '/resumes/emily-rodriguez-resume.pdf'
  },
  {
    id: 4,
    name: 'David Kim',
    email: 'david.kim@email.com',
    phone: '+1 (555) 456-7890',
    position: 'UX/UI Designer',
    department: 'Design',
    appliedDate: '2024-01-08',
    status: 'new',
    rating: 0,
    experience: 'Mid',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/davidkim',
    portfolio: 'https://davidkim.design',
    coverLetter: 'I am passionate about creating intuitive user experiences that solve real-world problems. Your parking platform has the potential to transform how people interact with urban spaces...',
    resumeUrl: '/resumes/david-kim-resume.pdf'
  },
  {
    id: 5,
    name: 'Lisa Wang',
    email: 'lisa.wang@email.com',
    phone: '+1 (555) 567-8901',
    position: 'Customer Success Manager',
    department: 'Customer Success',
    appliedDate: '2024-01-05',
    status: 'rejected',
    rating: 2,
    experience: 'Entry',
    location: 'New York, NY',
    linkedin: 'https://linkedin.com/in/lisawang',
    portfolio: '',
    coverLetter: 'I am excited about the opportunity to help ensure your users have amazing experiences with your platform...',
    resumeUrl: '/resumes/lisa-wang-resume.pdf'
  }
];

const navigationItems = [
  { name: 'Dashboard', icon: <Dashboard />, active: false },
  { name: 'Parking Lots', icon: <LocalParking />, active: false },
  { name: 'Users', icon: <People />, active: false },
  { name: 'Bookings', icon: <BookOnline />, active: false },
  { name: 'Job Applications', icon: <Work />, active: true },
  { name: 'Analytics', icon: <Analytics />, active: false },
  { name: 'Settings', icon: <Settings />, active: false },
];

const statusColors = {
  new: 'info',
  reviewing: 'warning',
  interview: 'secondary',
  offered: 'success',
  rejected: 'error',
} as const;

const statusLabels = {
  new: 'New',
  reviewing: 'Reviewing',
  interview: 'Interview',
  offered: 'Offered',
  rejected: 'Rejected',
} as const;

export default function AdminJobApplications() {
  const theme = useTheme();
  const [applications] = useState(sampleApplications);
  const [selectedApplications, setSelectedApplications] = useState<number[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Filter applications
  const filteredApplications = useMemo(() => {
    return applications.filter(app => {
      const matchesSearch = !searchTerm || 
        app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesPosition = !positionFilter || app.position === positionFilter;
      const matchesStatus = !statusFilter || app.status === statusFilter;
      
      let matchesDate = true;
      if (dateFilter) {
        const appDate = new Date(app.appliedDate);
        const now = new Date();
        switch (dateFilter) {
          case 'today':
            matchesDate = appDate.toDateString() === now.toDateString();
            break;
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            matchesDate = appDate >= weekAgo;
            break;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            matchesDate = appDate >= monthAgo;
            break;
        }
      }
      
      return matchesSearch && matchesPosition && matchesStatus && matchesDate;
    });
  }, [applications, searchTerm, positionFilter, statusFilter, dateFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = applications.length;
    const newThisWeek = applications.filter(app => {
      const appDate = new Date(app.appliedDate);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return appDate >= weekAgo;
    }).length;
    const inInterview = applications.filter(app => app.status === 'interview').length;
    const offered = applications.filter(app => app.status === 'offered').length;
    
    return { total, newThisWeek, inInterview, offered };
  }, [applications]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedApplications(filteredApplications.map(app => app.id));
    } else {
      setSelectedApplications([]);
    }
  };

  const handleSelectApplication = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedApplications([...selectedApplications, id]);
    } else {
      setSelectedApplications(selectedApplications.filter(appId => appId !== id));
    }
  };

  const handleViewApplication = (application: any) => {
    setSelectedApplication(application);
    setModalOpen(true);
  };

  const handleDownloadResume = (resumeUrl: string, applicantName: string) => {
    // In a real app, this would trigger a download
    console.log(`Downloading resume for ${applicantName}: ${resumeUrl}`);
    alert(`Would download resume for ${applicantName}`);
  };

  const handleEmailApplicant = (email: string, name: string) => {
    // In a real app, this would open an email compose window
    console.log(`Emailing ${name} at ${email}`);
    alert(`Would open email to ${name} (${email})`);
  };

  const uniquePositions = [...new Set(applications.map(app => app.position))];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f5f5' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: 250,
          bgcolor: '#1f2937',
          color: 'white',
          p: 2,
          display: { xs: 'none', md: 'block' },
        }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" fontWeight={700}>
            Admin Dashboard
          </Typography>
        </Box>
        
        <Stack spacing={1}>
          {navigationItems.map((item) => (
            <Button
              key={item.name}
              startIcon={item.icon}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                color: item.active ? theme.palette.primary.main : 'rgba(255,255,255,0.7)',
                bgcolor: item.active ? 'rgba(124, 58, 237, 0.1)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {item.name}
            </Button>
          ))}
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Paper
          elevation={1}
          sx={{
            p: 3,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: 0,
          }}
        >
          <Typography variant="h4" fontWeight={700}>
            Job Applications
          </Typography>
          <Stack direction="row" spacing={2}>
            <Button variant="outlined" startIcon={<GetApp />}>
              Export CSV
            </Button>
            <Button variant="contained" startIcon={<Add />}>
              Post New Job
            </Button>
          </Stack>
        </Paper>

        <Container maxWidth={false} sx={{ py: 3, px: 3 }}>
          {/* Statistics */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      <Work />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total Applications
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                      <Add />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.newThisWeek}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        New This Week
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: theme.palette.secondary.main }}>
                      <People />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.inInterview}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        In Interview
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Card>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                      <Star />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" fontWeight={700}>
                        {stats.offered}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Offers Extended
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Filters */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  placeholder="Search name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Position</InputLabel>
                  <Select
                    value={positionFilter}
                    label="Position"
                    onChange={(e) => setPositionFilter(e.target.value)}
                  >
                    <MenuItem value="">All Positions</MenuItem>
                    {uniquePositions.map((position) => (
                      <MenuItem key={position} value={position}>
                        {position}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    <MenuItem value="new">New</MenuItem>
                    <MenuItem value="reviewing">Reviewing</MenuItem>
                    <MenuItem value="interview">Interview</MenuItem>
                    <MenuItem value="offered">Offered</MenuItem>
                    <MenuItem value="rejected">Rejected</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Date Range</InputLabel>
                  <Select
                    value={dateFilter}
                    label="Date Range"
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <MenuItem value="">All Time</MenuItem>
                    <MenuItem value="today">Today</MenuItem>
                    <MenuItem value="week">This Week</MenuItem>
                    <MenuItem value="month">This Month</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>

          {/* Applications Table */}
          <Paper>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selectedApplications.length === filteredApplications.length}
                        indeterminate={
                          selectedApplications.length > 0 &&
                          selectedApplications.length < filteredApplications.length
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>Applicant</TableCell>
                    <TableCell>Position</TableCell>
                    <TableCell>Applied Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApplications.map((application) => (
                    <TableRow key={application.id} hover>
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={selectedApplications.includes(application.id)}
                          onChange={(e) =>
                            handleSelectApplication(application.id, e.target.checked)
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600}>
                            {application.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {application.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{application.position}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(application.appliedDate).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={statusLabels[application.status as keyof typeof statusLabels]}
                          color={statusColors[application.status as keyof typeof statusColors]}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {application.rating > 0 ? (
                          <Rating value={application.rating} readOnly size="small" />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            Not rated
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleViewApplication(application)}
                          >
                            <Visibility />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() =>
                              handleDownloadResume(application.resumeUrl, application.name)
                            }
                          >
                            <GetAppOutlined />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleEmailApplicant(application.email, application.name)}
                          >
                            <Email />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Container>
      </Box>

      {/* Application Details Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedApplication && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5" fontWeight={600}>
                  {selectedApplication.name}
                </Typography>
                <IconButton onClick={() => setModalOpen(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Contact Information
                  </Typography>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Email fontSize="small" />
                      <Link href={`mailto:${selectedApplication.email}`}>
                        {selectedApplication.email}
                      </Link>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Phone fontSize="small" />
                      <Typography>{selectedApplication.phone}</Typography>
                    </Box>
                    {selectedApplication.linkedin && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinkedIn fontSize="small" />
                        <Link href={selectedApplication.linkedin} target="_blank">
                          LinkedIn Profile
                        </Link>
                      </Box>
                    )}
                    {selectedApplication.portfolio && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Web fontSize="small" />
                        <Link href={selectedApplication.portfolio} target="_blank">
                          Portfolio
                        </Link>
                      </Box>
                    )}
                  </Stack>
                </Grid>

                {/* Application Details */}
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Application Details
                  </Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Position
                      </Typography>
                      <Typography fontWeight={500}>{selectedApplication.position}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Applied Date
                      </Typography>
                      <Typography>
                        {new Date(selectedApplication.appliedDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Experience Level
                      </Typography>
                      <Typography>{selectedApplication.experience}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Location
                      </Typography>
                      <Typography>{selectedApplication.location}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Status & Rating */}
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Status & Rating
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <FormControl fullWidth>
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={selectedApplication.status}
                          label="Status"
                          // onChange handler would update application status
                        >
                          <MenuItem value="new">New</MenuItem>
                          <MenuItem value="reviewing">Reviewing</MenuItem>
                          <MenuItem value="interview">Interview</MenuItem>
                          <MenuItem value="offered">Offered</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Rating
                      </Typography>
                      <Rating
                        value={selectedApplication.rating}
                        // onChange handler would update rating
                      />
                    </Grid>
                  </Grid>
                </Grid>

                {/* Cover Letter */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Cover Letter
                  </Typography>
                  <Paper
                    sx={{
                      p: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="body2">
                      {selectedApplication.coverLetter}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 3 }}>
              <Button
                variant="outlined"
                startIcon={<GetAppOutlined />}
                onClick={() =>
                  handleDownloadResume(selectedApplication.resumeUrl, selectedApplication.name)
                }
              >
                Download Resume
              </Button>
              <Button
                variant="outlined"
                startIcon={<Email />}
                onClick={() =>
                  handleEmailApplicant(selectedApplication.email, selectedApplication.name)
                }
              >
                Send Email
              </Button>
              <Button variant="contained" startIcon={<CalendarToday />}>
                Schedule Interview
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}