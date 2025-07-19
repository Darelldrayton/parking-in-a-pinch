import React, { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  IconButton,
  Link,
  Paper,
  Stack,
  Typography,
  useTheme,
  alpha,
  Slide,
} from '@mui/material';
import {
  Cookie as CookieIcon,
  Settings as SettingsIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';

interface CookiePreferences {
  essential: boolean; // Always true, cannot be disabled
  performance: boolean;
  functional: boolean;
  targeting: boolean;
}

interface CookieConsentBannerProps {
  onAccept?: (preferences: CookiePreferences) => void;
  onReject?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onAccept,
  onReject
}) => {
  const theme = useTheme();
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    performance: false,
    functional: false,
    targeting: false,
  });

  // Check if user has already made a choice
  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    const consentTimestamp = localStorage.getItem('cookie_consent_timestamp');
    
    // Show banner if no consent or consent is older than 1 year
    if (!consent || !consentTimestamp) {
      setShowBanner(true);
    } else {
      const consentDate = new Date(consentTimestamp);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      if (consentDate < oneYearAgo) {
        setShowBanner(true);
      } else {
        // Load existing preferences
        try {
          const existingPrefs = JSON.parse(consent);
          setPreferences(existingPrefs);
        } catch {
          setShowBanner(true);
        }
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      essential: true,
      performance: true,
      functional: true,
      targeting: true,
    };
    
    savePreferences(allAccepted);
    setShowBanner(false);
    onAccept?.(allAccepted);
  };

  const handleRejectAll = () => {
    const essentialOnly: CookiePreferences = {
      essential: true,
      performance: false,
      functional: false,
      targeting: false,
    };
    
    savePreferences(essentialOnly);
    setShowBanner(false);
    onReject?.();
  };

  const handleSaveSettings = () => {
    savePreferences(preferences);
    setShowBanner(false);
    setShowSettings(false);
    onAccept?.(preferences);
  };

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie_consent', JSON.stringify(prefs));
    localStorage.setItem('cookie_consent_timestamp', new Date().toISOString());
    
    // Record consent for legal compliance
    recordConsentForCompliance(prefs);
  };

  const recordConsentForCompliance = async (prefs: CookiePreferences) => {
    try {
      const consentRecord = {
        preferences: prefs,
        timestamp: new Date().toISOString(),
        ip_address: await getClientIP(),
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        consent_method: 'cookie_banner',
        gdpr_lawful_basis: 'consent'
      };
      
      // Store in local storage for immediate compliance
      const consentHistory = JSON.parse(
        localStorage.getItem('cookie_consent_history') || '[]'
      );
      consentHistory.push(consentRecord);
      localStorage.setItem('cookie_consent_history', JSON.stringify(consentHistory));
      
      // TODO: Send to backend for permanent storage
      // await api.post('/api/v1/privacy/cookie-consent/', consentRecord);
      
    } catch (error) {
      console.error('Error recording cookie consent:', error);
    }
  };

  const getClientIP = async (): Promise<string> => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  };

  const handlePreferenceChange = (key: keyof CookiePreferences) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (key === 'essential') return; // Cannot disable essential cookies
    
    setPreferences(prev => ({
      ...prev,
      [key]: event.target.checked
    }));
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Cookie Banner */}
      <Slide direction="up" in={showBanner} mountOnEnter unmountOnExit>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            p: 3,
            bgcolor: 'background.paper',
            borderTop: `4px solid ${theme.palette.primary.main}`,
            borderRadius: '16px 16px 0 0',
            boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
          }}
        >
          <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems={{ md: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, flex: 1 }}>
                <CookieIcon sx={{ color: 'primary.main', mt: 0.5, fontSize: 28 }} />
                <Box>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    We value your privacy
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. 
                    By clicking "Accept All", you consent to our use of cookies as described in our{' '}
                    <Link href="/privacy" color="primary" target="_blank">
                      Privacy Policy
                    </Link>
                    {' '}and{' '}
                    <Link href="/cookies" color="primary" target="_blank">
                      Cookie Policy
                    </Link>
                    .
                  </Typography>
                  
                  <Button
                    size="small"
                    startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    onClick={() => setShowDetails(!showDetails)}
                    sx={{ p: 0, minWidth: 'auto', textTransform: 'none' }}
                  >
                    {showDetails ? 'Hide' : 'Show'} Details
                  </Button>
                  
                  <Collapse in={showDetails}>
                    <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 1 }}>
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Essential Cookies:</strong> Required for basic site functionality (always active)
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Performance Cookies:</strong> Help us understand how visitors interact with our site
                      </Typography>
                      <Typography variant="caption" display="block" gutterBottom>
                        <strong>Functional Cookies:</strong> Remember your preferences and personalize your experience
                      </Typography>
                      <Typography variant="caption" display="block">
                        <strong>Targeting Cookies:</strong> Used to show you relevant advertisements
                      </Typography>
                    </Box>
                  </Collapse>
                </Box>
              </Box>
              
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                spacing={1} 
                sx={{ minWidth: { md: 'auto' } }}
              >
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleRejectAll}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Reject All
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<SettingsIcon />}
                  onClick={() => setShowSettings(true)}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Settings
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleAcceptAll}
                  sx={{ whiteSpace: 'nowrap' }}
                >
                  Accept All
                </Button>
              </Stack>
            </Stack>
          </Box>
          
          <IconButton
            size="small"
            onClick={() => setShowBanner(false)}
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              color: 'text.secondary'
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>
      </Slide>

      {/* Cookie Settings Dialog */}
      <Dialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <SettingsIcon color="primary" />
            <Typography variant="h5" fontWeight={600}>
              Cookie Settings
            </Typography>
          </Stack>
        </DialogTitle>
        
        <DialogContent>
          <Alert severity="info" icon={<SecurityIcon />} sx={{ mb: 3 }}>
            <Typography variant="body2">
              You can control which cookies we use. Essential cookies cannot be disabled as they are required for the platform to function properly.
            </Typography>
          </Alert>

          <FormGroup>
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.essential}
                    disabled
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Essential Cookies (Required)
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      These cookies are necessary for the platform to function. They enable basic functionality like security, network management, and accessibility.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.performance}
                    onChange={handlePreferenceChange('performance')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Performance Cookies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      These cookies help us understand how visitors interact with our platform by collecting and reporting information anonymously.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.functional}
                    onChange={handlePreferenceChange('functional')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Functional Cookies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      These cookies enable the platform to provide enhanced functionality and personalization, such as remembering your preferences.
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={preferences.targeting}
                    onChange={handlePreferenceChange('targeting')}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Targeting Cookies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      These cookies are used to show you relevant advertisements and measure the effectiveness of our marketing campaigns.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </FormGroup>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setShowSettings(false)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveSettings}
          >
            Save Preferences
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CookieConsentBanner;