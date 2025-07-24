import { useState, useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { getSecureImageUrl } from '../utils/imageProxy'
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Avatar,
  Grid,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  Divider,
  Paper,
  Chip,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  useTheme,
  alpha,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  Edit as EditIcon,
  PhotoCamera,
  Security,
  Verified,
  Phone,
  Email,
  Delete,
  Save,
  Cancel,
  Notifications,
  Lock,
  Person,
  Settings,
  DirectionsCar,
  Report,
  Gavel,
} from '@mui/icons-material'
import { useAuth } from '../context/AuthContext'
import authService from '../services/auth'
import IdentityVerification from '../components/verification/IdentityVerification'
import NotificationManager from '../components/notifications/NotificationManager'
import DisputeDialog from '../components/common/DisputeDialog'
import PasswordChangeDialog from '../components/common/PasswordChangeDialog'
import DeleteAccountDialog from '../components/common/DeleteAccountDialog'
import ErrorBoundary from '../components/common/ErrorBoundary'
import { VerifiedBadge, VerifiedAvatar } from '../components/common/VerifiedBadge'

const schema = yup.object({
  first_name: yup.string().required('First name is required'),
  last_name: yup.string().required('Last name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  phone_number: yup.string(),
  bio: yup.string().max(500, 'Bio must be less than 500 characters'),
  user_type: yup.string().oneOf(['HOST', 'SEEKER', 'BOTH', 'host', 'renter', 'both']).required(),
  profile: yup.object({
    primary_vehicle_make: yup.string(),
    primary_vehicle_model: yup.string(),
    primary_vehicle_year: yup.number().min(1900).max(new Date().getFullYear() + 1),
    primary_vehicle_color: yup.string(),
    primary_vehicle_license_plate: yup.string(),
    primary_vehicle_state: yup.string(),
  }),
})

type FormData = yup.InferType<typeof schema>

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Profile() {
  const { user, updateUser, setUserState } = useAuth()
  const theme = useTheme()
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState(0)
  const [disputeDialogOpen, setDisputeDialogOpen] = useState(false)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [photoUploading, setPhotoUploading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone_number: '',
      bio: '',
      user_type: 'SEEKER',
      profile: {
        primary_vehicle_make: '',
        primary_vehicle_model: '',
        primary_vehicle_year: undefined,
        primary_vehicle_color: '',
        primary_vehicle_license_plate: '',
        primary_vehicle_state: '',
      },
    },
  })

  // Load user profile data
  useEffect(() => {
    if (user) {
      setValue('first_name', user.first_name || '')
      setValue('last_name', user.last_name || '')
      setValue('email', user.email || '')
      setValue('phone_number', user.phone_number || '')
      setValue('bio', user.bio || '')
      setValue('user_type', user.user_type || 'SEEKER')
      setValue('profile.primary_vehicle_make', user.profile?.primary_vehicle_make || '')
      setValue('profile.primary_vehicle_model', user.profile?.primary_vehicle_model || '')
      setValue('profile.primary_vehicle_year', user.profile?.primary_vehicle_year || undefined)
      setValue('profile.primary_vehicle_color', user.profile?.primary_vehicle_color || '')
      setValue('profile.primary_vehicle_license_plate', user.profile?.primary_vehicle_license_plate || '')
      setValue('profile.primary_vehicle_state', user.profile?.primary_vehicle_state || '')
    }
  }, [user, setValue])

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      const updatedUser = await authService.updateProfile(data)
      updateUser(updatedUser)
      toast.success('Profile updated successfully!')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setValue('first_name', user.first_name || '')
      setValue('last_name', user.last_name || '')
      setValue('email', user.email || '')
      setValue('phone_number', user.phone_number || '')
      setValue('bio', user.bio || '')
      setValue('user_type', user.user_type || 'SEEKER')
      setValue('profile.primary_vehicle_make', user.profile?.primary_vehicle_make || '')
      setValue('profile.primary_vehicle_model', user.profile?.primary_vehicle_model || '')
      setValue('profile.primary_vehicle_year', user.profile?.primary_vehicle_year || undefined)
      setValue('profile.primary_vehicle_color', user.profile?.primary_vehicle_color || '')
      setValue('profile.primary_vehicle_license_plate', user.profile?.primary_vehicle_license_plate || '')
      setValue('profile.primary_vehicle_state', user.profile?.primary_vehicle_state || '')
    }
    setIsEditing(false)
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue)
  }

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024 // 2MB in bytes
    if (file.size > maxSize) {
      toast.error('Image file is too large. Maximum size is 2MB.')
      return
    }

    setPhotoUploading(true)
    try {
      const updatedUser = await authService.uploadProfilePhoto(file)
      console.log('🔍 Profile photo upload - got updated user:', JSON.stringify(updatedUser, null, 2))
      // CRITICAL FIX: Don't call updateUser() which triggers another API call
      // Instead, directly update the AuthContext user state  
      setUserState(updatedUser)
      toast.success('Profile photo updated successfully!')
    } catch (error: any) {
      console.error('Photo upload error:', error)
      toast.error(error?.response?.data?.error || 'Failed to upload profile photo')
    } finally {
      setPhotoUploading(false)
      // Clear the input to allow re-uploading the same file
      if (event.target) {
        event.target.value = ''
      }
    }
  }

  const handlePhotoDelete = async () => {
    setPhotoUploading(true)
    try {
      const updatedUser = await authService.deleteProfilePhoto()
      updateUser(updatedUser)
      toast.success('Profile photo deleted successfully!')
    } catch (error: any) {
      console.error('Photo delete error:', error)
      toast.error(error?.response?.data?.error || 'Failed to delete profile photo')
    } finally {
      setPhotoUploading(false)
    }
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 4,
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom color="text.primary">
            Profile Settings
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your account information and preferences
          </Typography>
        </Box>

        {/* Profile Header Card */}
        <Card sx={{ mb: 4, borderRadius: 3, boxShadow: theme.shadows[4] }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <VerifiedAvatar
                src={getSecureImageUrl(user?.profile_image)}
                alt="Profile"
                isVerified={user?.is_verified || false}
                size={80}
                sx={{
                  bgcolor: 'primary.main',
                  fontSize: '2rem',
                }}
              >
                {!user?.profile_image && (user?.first_name?.charAt(0) || 'U')}
              </VerifiedAvatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
                  {user?.first_name} {user?.last_name}
                </Typography>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user?.email}
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip 
                    label={user?.user_type?.charAt(0).toUpperCase() + user?.user_type?.slice(1).toLowerCase() || 'Seeker'} 
                    size="small" 
                  />
                  {user?.is_verified && (
                    <VerifiedBadge 
                      isVerified={true}
                      size="small"
                    />
                  )}
                </Stack>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Card sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
          <Box 
            sx={{ 
              borderBottom: 1, 
              borderColor: 'divider',
              position: 'relative',
              // Add gradient indicators on mobile
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 1,
                width: 20,
                background: `linear-gradient(90deg, ${theme.palette.background.paper} 0%, transparent 100%)`,
                zIndex: 1,
                pointerEvents: 'none',
                display: { xs: 'block', sm: 'none' },
              },
              '&::after': {
                content: '""',
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 1,
                width: 20,
                background: `linear-gradient(270deg, ${theme.palette.background.paper} 0%, transparent 100%)`,
                zIndex: 1,
                pointerEvents: 'none',
                display: { xs: 'block', sm: 'none' },
              },
            }}
          >
            <Tabs 
              value={activeTab} 
              onChange={handleTabChange} 
              aria-label="profile tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                // Ensure tabs are scrollable on mobile
                '& .MuiTabs-scrollContainer': {
                  scrollBehavior: 'smooth',
                },
                '& .MuiTabs-flexContainer': {
                  gap: { xs: 0, sm: 1 },
                },
                '& .MuiTab-root': {
                  minWidth: { xs: 'auto', sm: 160 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 2, sm: 3 },
                  // Show full text on all screens
                  whiteSpace: 'nowrap',
                },
                '& .MuiTab-iconWrapper': {
                  marginBottom: { xs: '2px !important', sm: '4px !important' },
                },
              }}
            >
              <Tab icon={<Person />} label="Profile" />
              <Tab icon={<DirectionsCar />} label="Vehicle Info" />
              <Tab icon={<Verified />} label="Verification" />
              <Tab icon={<Notifications />} label="Preferences" />
              <Tab icon={<Security />} label="Security" />
            </Tabs>
          </Box>

          {/* Profile Tab */}
          <TabPanel value={activeTab} index={0}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  Personal Information
                </Typography>
                {!isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Profile
                  </Button>
                )}
              </Box>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <VerifiedAvatar
                        src={getSecureImageUrl(user?.profile_image)}
                        alt="Profile"
                        isVerified={user?.is_verified || false}
                        size={100}
                        sx={{
                          bgcolor: 'primary.main',
                          fontSize: '2.5rem',
                        }}
                      >
                        {!user?.profile_image && (user?.first_name?.charAt(0) || 'U')}
                      </VerifiedAvatar>
                      {isEditing && (
                        <Box>
                          <input
                            accept="image/*"
                            style={{ display: 'none' }}
                            id="profile-photo-upload"
                            type="file"
                            onChange={handlePhotoUpload}
                          />
                          <label htmlFor="profile-photo-upload">
                            <Button
                              variant="outlined"
                              component="span"
                              startIcon={photoUploading ? <CircularProgress size={20} /> : <PhotoCamera />}
                              size="small"
                              disabled={photoUploading}
                            >
                              {photoUploading ? 'Uploading...' : 'Change Photo'}
                            </Button>
                          </label>
                          {(user?.profile_image || user?.profile_picture_url || user?.profile_picture) && (
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Delete />}
                              size="small"
                              onClick={handlePhotoDelete}
                              disabled={photoUploading}
                              sx={{ ml: 1 }}
                            >
                              Remove
                            </Button>
                          )}
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                            JPG, PNG up to 2MB
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('first_name')}
                      fullWidth
                      label="First Name"
                      disabled={!isEditing}
                      error={!!errors.first_name}
                      helperText={errors.first_name?.message}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('last_name')}
                      fullWidth
                      label="Last Name"
                      disabled={!isEditing}
                      error={!!errors.last_name}
                      helperText={errors.last_name?.message}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('email')}
                      fullWidth
                      label="Email Address"
                      type="email"
                      disabled={!isEditing}
                      error={!!errors.email}
                      helperText={errors.email?.message}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('phone_number')}
                      fullWidth
                      label="Phone Number"
                      type="tel"
                      disabled={!isEditing}
                      error={!!errors.phone_number}
                      helperText={errors.phone_number?.message}
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>User Type</InputLabel>
                      <Controller
                        name="user_type"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="User Type">
                            <MenuItem value="SEEKER">Seeker - I want to find parking</MenuItem>
                            <MenuItem value="HOST">Host - I want to list my space</MenuItem>
                            <MenuItem value="BOTH">Both - I want to find and list parking</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField
                      {...register('bio')}
                      fullWidth
                      label="Bio"
                      multiline
                      rows={4}
                      disabled={!isEditing}
                      placeholder="Tell us a bit about yourself..."
                      error={!!errors.bio}
                      helperText={errors.bio?.message || 'Share something about yourself with the community'}
                    />
                  </Grid>
                </Grid>

                {isEditing && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </TabPanel>

          {/* Vehicle Information Tab */}
          <TabPanel value={activeTab} index={1}>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight="bold" color="text.primary">
                  Vehicle Information
                </Typography>
                {!isEditing && (
                  <Button
                    variant="contained"
                    startIcon={<EditIcon />}
                    onClick={() => setIsEditing(true)}
                  >
                    Edit Vehicle Info
                  </Button>
                )}
              </Box>

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your primary vehicle information for easy booking
              </Typography>

              <Box component="form" onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('profile.primary_vehicle_make')}
                      fullWidth
                      label="Vehicle Make"
                      placeholder="e.g. Toyota, Honda, Ford"
                      disabled={!isEditing}
                      error={!!errors.profile?.primary_vehicle_make}
                      helperText={errors.profile?.primary_vehicle_make?.message}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('profile.primary_vehicle_model')}
                      fullWidth
                      label="Vehicle Model"
                      placeholder="e.g. Camry, Civic, Explorer"
                      disabled={!isEditing}
                      error={!!errors.profile?.primary_vehicle_model}
                      helperText={errors.profile?.primary_vehicle_model?.message}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('profile.primary_vehicle_year')}
                      fullWidth
                      label="Vehicle Year"
                      type="number"
                      placeholder="e.g. 2020"
                      disabled={!isEditing}
                      error={!!errors.profile?.primary_vehicle_year}
                      helperText={errors.profile?.primary_vehicle_year?.message}
                      InputProps={{
                        inputProps: {
                          min: 1900,
                          max: new Date().getFullYear() + 1
                        }
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('profile.primary_vehicle_color')}
                      fullWidth
                      label="Vehicle Color"
                      placeholder="e.g. Black, White, Red"
                      disabled={!isEditing}
                      error={!!errors.profile?.primary_vehicle_color}
                      helperText={errors.profile?.primary_vehicle_color?.message}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      {...register('profile.primary_vehicle_license_plate')}
                      fullWidth
                      label="License Plate"
                      placeholder="e.g. ABC-1234"
                      disabled={!isEditing}
                      error={!!errors.profile?.primary_vehicle_license_plate}
                      helperText={errors.profile?.primary_vehicle_license_plate?.message || 'This will be used to auto-fill booking forms'}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth disabled={!isEditing}>
                      <InputLabel>Vehicle Registration State</InputLabel>
                      <Controller
                        name="profile.primary_vehicle_state"
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="Vehicle Registration State">
                            <MenuItem value="AL">Alabama</MenuItem>
                            <MenuItem value="AK">Alaska</MenuItem>
                            <MenuItem value="AZ">Arizona</MenuItem>
                            <MenuItem value="AR">Arkansas</MenuItem>
                            <MenuItem value="CA">California</MenuItem>
                            <MenuItem value="CO">Colorado</MenuItem>
                            <MenuItem value="CT">Connecticut</MenuItem>
                            <MenuItem value="DE">Delaware</MenuItem>
                            <MenuItem value="FL">Florida</MenuItem>
                            <MenuItem value="GA">Georgia</MenuItem>
                            <MenuItem value="HI">Hawaii</MenuItem>
                            <MenuItem value="ID">Idaho</MenuItem>
                            <MenuItem value="IL">Illinois</MenuItem>
                            <MenuItem value="IN">Indiana</MenuItem>
                            <MenuItem value="IA">Iowa</MenuItem>
                            <MenuItem value="KS">Kansas</MenuItem>
                            <MenuItem value="KY">Kentucky</MenuItem>
                            <MenuItem value="LA">Louisiana</MenuItem>
                            <MenuItem value="ME">Maine</MenuItem>
                            <MenuItem value="MD">Maryland</MenuItem>
                            <MenuItem value="MA">Massachusetts</MenuItem>
                            <MenuItem value="MI">Michigan</MenuItem>
                            <MenuItem value="MN">Minnesota</MenuItem>
                            <MenuItem value="MS">Mississippi</MenuItem>
                            <MenuItem value="MO">Missouri</MenuItem>
                            <MenuItem value="MT">Montana</MenuItem>
                            <MenuItem value="NE">Nebraska</MenuItem>
                            <MenuItem value="NV">Nevada</MenuItem>
                            <MenuItem value="NH">New Hampshire</MenuItem>
                            <MenuItem value="NJ">New Jersey</MenuItem>
                            <MenuItem value="NM">New Mexico</MenuItem>
                            <MenuItem value="NY">New York</MenuItem>
                            <MenuItem value="NC">North Carolina</MenuItem>
                            <MenuItem value="ND">North Dakota</MenuItem>
                            <MenuItem value="OH">Ohio</MenuItem>
                            <MenuItem value="OK">Oklahoma</MenuItem>
                            <MenuItem value="OR">Oregon</MenuItem>
                            <MenuItem value="PA">Pennsylvania</MenuItem>
                            <MenuItem value="RI">Rhode Island</MenuItem>
                            <MenuItem value="SC">South Carolina</MenuItem>
                            <MenuItem value="SD">South Dakota</MenuItem>
                            <MenuItem value="TN">Tennessee</MenuItem>
                            <MenuItem value="TX">Texas</MenuItem>
                            <MenuItem value="UT">Utah</MenuItem>
                            <MenuItem value="VT">Vermont</MenuItem>
                            <MenuItem value="VA">Virginia</MenuItem>
                            <MenuItem value="WA">Washington</MenuItem>
                            <MenuItem value="WV">West Virginia</MenuItem>
                            <MenuItem value="WI">Wisconsin</MenuItem>
                            <MenuItem value="WY">Wyoming</MenuItem>
                            <MenuItem value="DC">District of Columbia</MenuItem>
                          </Select>
                        )}
                      />
                      {errors.profile?.primary_vehicle_state && (
                        <Typography variant="caption" color="error" sx={{ mt: 1, ml: 2 }}>
                          {errors.profile?.primary_vehicle_state?.message}
                        </Typography>
                      )}
                    </FormControl>
                  </Grid>
                </Grid>

                {isEditing && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save />}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                )}
              </Box>
            </CardContent>
          </TabPanel>

          {/* Verification Tab */}
          <TabPanel value={activeTab} index={2}>
            <CardContent sx={{ p: 4 }}>
              <IdentityVerification
                onComplete={(data) => {
                  console.log('Verification completed:', data);
                  // Success message is already handled in IdentityVerification component
                }}
                onCancel={() => {
                  console.log('Verification cancelled');
                }}
              />
            </CardContent>
          </TabPanel>

          {/* Preferences Tab */}
          <TabPanel value={activeTab} index={3}>
            <CardContent sx={{ p: 4 }}>
              <ErrorBoundary>
                <NotificationManager />
              </ErrorBoundary>
            </CardContent>
          </TabPanel>

          {/* Security Tab */}
          <TabPanel value={activeTab} index={4}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" fontWeight="bold" gutterBottom color="text.primary">
                Security Settings
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your account security and privacy
              </Typography>

              <Stack spacing={3}>
                <Paper elevation={1} sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" color="text.primary">
                        Change Password
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Update your account password
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small"
                      onClick={() => setPasswordDialogOpen(true)}
                    >
                      Update Password
                    </Button>
                  </Box>
                </Paper>

                <Paper elevation={1} sx={{ p: 3, borderRadius: 2, bgcolor: alpha(theme.palette.warning.main, 0.02) }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }} color="text.primary">
                        <Gavel sx={{ fontSize: 20, color: 'warning.main' }} />
                        File a Dispute
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Report issues with hosts/renters or request refunds
                      </Typography>
                    </Box>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      color="warning"
                      startIcon={<Report />}
                      onClick={() => setDisputeDialogOpen(true)}
                    >
                      File Dispute
                    </Button>
                  </Box>
                </Paper>

                <Divider sx={{ my: 3 }} />

                <Alert severity="error">
                  <AlertTitle>Danger Zone</AlertTitle>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Once you delete your account, there is no going back. Please be certain.
                  </Typography>
                  <Button
                    variant="contained"
                    color="error"
                    startIcon={<Delete />}
                    size="small"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    Delete Account
                  </Button>
                </Alert>
              </Stack>
            </CardContent>
          </TabPanel>
        </Card>
      </Container>

      {/* Dispute Dialog */}
      <DisputeDialog
        open={disputeDialogOpen}
        onClose={() => setDisputeDialogOpen(false)}
      />

      {/* Password Change Dialog */}
      <PasswordChangeDialog
        open={passwordDialogOpen}
        onClose={() => setPasswordDialogOpen(false)}
      />

      {/* Delete Account Dialog */}
      <DeleteAccountDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      />
    </Box>
  )
}