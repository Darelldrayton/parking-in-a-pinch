import React, { useState } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  LinearProgress,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  CameraAlt,
  Security,
  CheckCircle,
  Warning,
  Upload,
  Person,
  Badge,
  CreditCard,
  Phone,
  Email,
  Verified,
  Cancel,
} from '@mui/icons-material';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  icon: React.ReactNode;
}

interface IdentityVerificationProps {
  onComplete?: (verificationData: any) => void;
  onCancel?: () => void;
  currentStep?: number;
}

const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  onComplete,
  onCancel,
  currentStep = 0,
}) => {
  const theme = useTheme();
  const [activeStep, setActiveStep] = useState(currentStep);
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      ssn: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
    },
    documents: {
      idType: '',
      idFront: null as File | null,
      idBack: null as File | null,
      selfie: null as File | null,
    },
    phoneVerification: {
      phoneNumber: '',
      verificationCode: '',
      verified: false,
    },
    emailVerification: {
      verified: false,
    },
  });
  
  const [verificationSteps, setVerificationSteps] = useState<VerificationStep[]>([
    {
      id: 'personal_info',
      title: 'Personal Information',
      description: 'Provide your basic personal details',
      status: 'pending',
      icon: <Person />,
    },
    {
      id: 'document_upload',
      title: 'Document Upload',
      description: 'Upload government-issued ID and selfie',
      status: 'pending',
      icon: <Badge />,
    },
    {
      id: 'phone_verification',
      title: 'Phone Verification',
      description: 'Verify your phone number with SMS',
      status: 'pending',
      icon: <Phone />,
    },
    {
      id: 'review',
      title: 'Review & Submit',
      description: 'Review your information and submit for verification',
      status: 'pending',
      icon: <Security />,
    },
  ]);

  const updateStepStatus = (stepId: string, status: VerificationStep['status']) => {
    setVerificationSteps(prev => 
      prev.map(step => 
        step.id === stepId ? { ...step, status } : step
      )
    );
  };

  const handleNext = () => {
    if (activeStep < verificationSteps.length - 1) {
      updateStepStatus(verificationSteps[activeStep].id, 'completed');
      setActiveStep(prev => prev + 1);
      updateStepStatus(verificationSteps[activeStep + 1].id, 'in_progress');
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      updateStepStatus(verificationSteps[activeStep].id, 'pending');
      setActiveStep(prev => prev - 1);
      updateStepStatus(verificationSteps[activeStep - 1].id, 'in_progress');
    }
  };

  const handleFileUpload = (fileType: 'idFront' | 'idBack' | 'selfie') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVerificationData(prev => ({
        ...prev,
        documents: {
          ...prev.documents,
          [fileType]: file,
        },
      }));
    }
  };

  const handlePhoneNumberChange = (phoneNumber: string) => {
    setVerificationData(prev => ({
      ...prev,
      phoneVerification: {
        phoneNumber: phoneNumber,
        verified: phoneNumber.length >= 10, // Simple validation - mark as verified if at least 10 digits
      },
    }));
  };

  const handleSubmitVerification = async () => {
    setLoading(true);
    try {
      // Create FormData for file uploads
      const formData = new FormData();
      
      // Add verification type
      formData.append('verification_type', 'IDENTITY');
      
      // Add document files
      if (verificationData.documents.idFront) {
        formData.append('id_document_front', verificationData.documents.idFront);
      }
      if (verificationData.documents.idBack) {
        formData.append('id_document_back', verificationData.documents.idBack);
      }
      if (verificationData.documents.selfie) {
        formData.append('selfie_with_id', verificationData.documents.selfie);
      }
      
      // Add document information
      formData.append('document_type', verificationData.documents.idType);
      
      // Add verification data as JSON
      const additionalData = {
        personal_info: verificationData.personalInfo,
        phone_verification: verificationData.phoneVerification,
      };
      formData.append('verification_data', JSON.stringify(additionalData));
      
      // Submit verification request
      const response = await api.post('/users/verification-requests/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      console.log('Verification request submitted:', response.data);
      
      updateStepStatus('review', 'completed');
      toast.success('🎉 ID Verification Submitted Successfully! Your documents are now under review. You\'ll receive a notification once the review is complete (typically within 24-48 hours).');
      
      if (onComplete) {
        onComplete(response.data);
      }
    } catch (error: any) {
      console.error('Verification submission failed:', error);
      updateStepStatus('review', 'failed');
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to submit verification request. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (step: VerificationStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'failed':
        return <Cancel sx={{ color: 'error.main' }} />;
      case 'in_progress':
        return <CircularProgress size={24} />;
      default:
        return step.icon;
    }
  };

  const renderPersonalInfoStep = () => (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight={600}>
        Personal Information
      </Typography>
      <Typography variant="body2" color="text.secondary">
        This information must match your government-issued ID exactly.
      </Typography>
      
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="First Name"
          value={verificationData.personalInfo.firstName}
          onChange={(e) => setVerificationData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, firstName: e.target.value }
          }))}
          required
        />
        <TextField
          fullWidth
          label="Last Name"
          value={verificationData.personalInfo.lastName}
          onChange={(e) => setVerificationData(prev => ({
            ...prev,
            personalInfo: { ...prev.personalInfo, lastName: e.target.value }
          }))}
          required
        />
      </Stack>
      
      <TextField
        fullWidth
        label="Date of Birth"
        type="date"
        value={verificationData.personalInfo.dateOfBirth}
        onChange={(e) => setVerificationData(prev => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, dateOfBirth: e.target.value }
        }))}
        InputLabelProps={{ shrink: true }}
        required
      />
      
      <TextField
        fullWidth
        label="Street Address"
        value={verificationData.personalInfo.address.street}
        onChange={(e) => setVerificationData(prev => ({
          ...prev,
          personalInfo: { 
            ...prev.personalInfo, 
            address: { ...prev.personalInfo.address, street: e.target.value }
          }
        }))}
        required
      />
      
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="City"
          value={verificationData.personalInfo.address.city}
          onChange={(e) => setVerificationData(prev => ({
            ...prev,
            personalInfo: { 
              ...prev.personalInfo, 
              address: { ...prev.personalInfo.address, city: e.target.value }
            }
          }))}
          required
        />
        <FormControl fullWidth required>
          <InputLabel>State</InputLabel>
          <Select
            value={verificationData.personalInfo.address.state}
            onChange={(e) => setVerificationData(prev => ({
              ...prev,
              personalInfo: { 
                ...prev.personalInfo, 
                address: { ...prev.personalInfo.address, state: e.target.value }
              }
            }))}
            label="State"
          >
            <MenuItem value="NY">New York</MenuItem>
            <MenuItem value="NJ">New Jersey</MenuItem>
            <MenuItem value="CT">Connecticut</MenuItem>
            <MenuItem value="CA">California</MenuItem>
            <MenuItem value="FL">Florida</MenuItem>
            <MenuItem value="TX">Texas</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="ZIP Code"
          value={verificationData.personalInfo.address.zipCode}
          onChange={(e) => setVerificationData(prev => ({
            ...prev,
            personalInfo: { 
              ...prev.personalInfo, 
              address: { ...prev.personalInfo.address, zipCode: e.target.value }
            }
          }))}
          required
          sx={{ minWidth: 120 }}
        />
      </Stack>
    </Stack>
  );

  const renderDocumentUploadStep = () => (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight={600}>
        Document Upload
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Upload clear photos of your government-issued ID and a selfie for verification.
      </Typography>
      
      <FormControl fullWidth required>
        <InputLabel>ID Type</InputLabel>
        <Select
          value={verificationData.documents.idType}
          onChange={(e) => setVerificationData(prev => ({
            ...prev,
            documents: { ...prev.documents, idType: e.target.value }
          }))}
          label="ID Type"
        >
          <MenuItem value="drivers_license">Driver's License</MenuItem>
          <MenuItem value="passport">Passport</MenuItem>
          <MenuItem value="state_id">State ID</MenuItem>
          <MenuItem value="military_id">Military ID</MenuItem>
        </Select>
      </FormControl>
      
      <Stack spacing={2}>
        {/* ID Front */}
        <Paper
          sx={{
            p: 3,
            border: `2px dashed ${theme.palette.primary.main}`,
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
          component="label"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload('idFront')}
            style={{ display: 'none' }}
          />
          <Stack alignItems="center" spacing={1}>
            <Upload sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Upload ID Front
            </Typography>
            {verificationData.documents.idFront && (
              <Chip
                label={verificationData.documents.idFront.name}
                color="success"
                size="small"
              />
            )}
          </Stack>
        </Paper>
        
        {/* ID Back */}
        <Paper
          sx={{
            p: 3,
            border: `2px dashed ${theme.palette.primary.main}`,
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
          component="label"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload('idBack')}
            style={{ display: 'none' }}
          />
          <Stack alignItems="center" spacing={1}>
            <Upload sx={{ fontSize: 40, color: 'primary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Upload ID Back
            </Typography>
            {verificationData.documents.idBack && (
              <Chip
                label={verificationData.documents.idBack.name}
                color="success"
                size="small"
              />
            )}
          </Stack>
        </Paper>
        
        {/* Selfie */}
        <Paper
          sx={{
            p: 3,
            border: `2px dashed ${theme.palette.secondary.main}`,
            borderRadius: 2,
            textAlign: 'center',
            cursor: 'pointer',
            '&:hover': {
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
            },
          }}
          component="label"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload('selfie')}
            style={{ display: 'none' }}
          />
          <Stack alignItems="center" spacing={1}>
            <CameraAlt sx={{ fontSize: 40, color: 'secondary.main' }} />
            <Typography variant="subtitle1" fontWeight={600}>
              Upload Selfie
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Hold your ID next to your face
            </Typography>
            {verificationData.documents.selfie && (
              <Chip
                label={verificationData.documents.selfie.name}
                color="success"
                size="small"
              />
            )}
          </Stack>
        </Paper>
      </Stack>
      
      <Alert severity="info">
        Make sure all photos are clear, well-lit, and show all corners of your ID. Your selfie should clearly show your face and the ID you're holding.
      </Alert>
    </Stack>
  );

  const renderPhoneVerificationStep = () => (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight={600}>
        Phone Number
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please provide your phone number. This will be used for booking notifications and host communication.
      </Typography>
      
      <TextField
        fullWidth
        label="Phone Number"
        placeholder="+1 (555) 123-4567"
        value={verificationData.phoneVerification.phoneNumber}
        onChange={(e) => handlePhoneNumberChange(e.target.value)}
        required
        helperText="Format: +1 (555) 123-4567 or 5551234567"
      />
      
      {verificationData.phoneVerification.verified && (
        <Alert severity="success" icon={<CheckCircle />}>
          Phone number added successfully!
        </Alert>
      )}
    </Stack>
  );

  const renderReviewStep = () => (
    <Stack spacing={3}>
      <Typography variant="h6" fontWeight={600}>
        Review & Submit
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Please review your information before submitting for verification.
      </Typography>
      
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Personal Information
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>Name:</strong> {verificationData.personalInfo.firstName} {verificationData.personalInfo.lastName}
          </Typography>
          <Typography variant="body2">
            <strong>Date of Birth:</strong> {verificationData.personalInfo.dateOfBirth}
          </Typography>
          <Typography variant="body2">
            <strong>Address:</strong> {verificationData.personalInfo.address.street}, {verificationData.personalInfo.address.city}, {verificationData.personalInfo.address.state} {verificationData.personalInfo.address.zipCode}
          </Typography>
          <Typography variant="body2">
            <strong>Phone Number:</strong> {verificationData.phoneVerification.phoneNumber || 'Not provided'}
          </Typography>
        </Stack>
      </Paper>
      
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Documents
        </Typography>
        <Stack spacing={1}>
          <Typography variant="body2">
            <strong>ID Type:</strong> {verificationData.documents.idType}
          </Typography>
          <Stack direction="row" spacing={1}>
            <Chip
              label="ID Front"
              color={verificationData.documents.idFront ? 'success' : 'default'}
              size="small"
            />
            <Chip
              label="ID Back"
              color={verificationData.documents.idBack ? 'success' : 'default'}
              size="small"
            />
            <Chip
              label="Selfie"
              color={verificationData.documents.selfie ? 'success' : 'default'}
              size="small"
            />
          </Stack>
        </Stack>
      </Paper>
      
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          Verification Status
        </Typography>
        <Stack spacing={1}>
          <Chip
            label="Phone Number Added"
            color={verificationData.phoneVerification.verified ? 'success' : 'default'}
            size="small"
            icon={verificationData.phoneVerification.verified ? <CheckCircle /> : <Phone />}
          />
        </Stack>
      </Paper>
      
      <Alert severity="warning">
        By submitting this verification, you confirm that all information provided is accurate and belongs to you. False information may result in account suspension.
      </Alert>
      
      <Button
        variant="contained"
        size="large"
        onClick={handleSubmitVerification}
        disabled={loading}
        startIcon={loading ? <CircularProgress size={20} /> : <Verified />}
        sx={{ mt: 2 }}
      >
        {loading ? 'Submitting...' : 'Submit for Verification'}
      </Button>
    </Stack>
  );

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return renderPersonalInfoStep();
      case 1:
        return renderDocumentUploadStep();
      case 2:
        return renderPhoneVerificationStep();
      case 3:
        return renderReviewStep();
      default:
        return null;
    }
  };

  return (
    <Card sx={{ maxWidth: 800, mx: 'auto', borderRadius: 3 }}>
      <CardContent sx={{ p: 4 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Security sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>
              Identity Verification
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Secure your account and build trust with other users
            </Typography>
          </Box>
        </Stack>

        {/* Progress Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {verificationSteps.map((step, index) => (
            <Step key={step.id}>
              <StepLabel
                StepIconComponent={() => (
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: step.status === 'completed' ? 'success.main' :
                               step.status === 'in_progress' ? 'primary.main' :
                               step.status === 'failed' ? 'error.main' : 'grey.300',
                      color: 'white',
                    }}
                  >
                    {getStepIcon(step)}
                  </Box>
                )}
              >
                <Typography variant="body2" fontWeight={500}>
                  {step.title}
                </Typography>
              </StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Step Content */}
        <Box sx={{ mb: 4 }}>
          {getStepContent(activeStep)}
        </Box>

        {/* Navigation Buttons */}
        <Divider sx={{ mb: 3 }} />
        <Stack direction="row" justifyContent="space-between">
          <Button
            onClick={onCancel || handleBack}
            disabled={loading}
          >
            {activeStep === 0 ? 'Cancel' : 'Back'}
          </Button>
          
          {activeStep < verificationSteps.length - 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

export default IdentityVerification;