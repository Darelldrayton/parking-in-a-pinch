import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Alert,
  Stack,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Container,
  useTheme
} from '@mui/material';
import {
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Home as HomeIcon
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class AdminErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Dashboard Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/ruler';
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper 
            elevation={8} 
            sx={{ 
              p: 4, 
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'error.main',
              bgcolor: 'background.paper'
            }}
          >
            <Stack spacing={3} alignItems="center" textAlign="center">
              <ErrorIcon sx={{ fontSize: 64, color: 'error.main' }} />
              
              <Typography variant="h4" fontWeight={700} color="error.main">
                Admin Dashboard Error
              </Typography>
              
              <Typography variant="h6" color="text.secondary">
                Something went wrong in the admin dashboard
              </Typography>

              <Alert severity="error" sx={{ width: '100%' }}>
                <Typography variant="body2">
                  The admin dashboard encountered an unexpected error. This could be due to:
                </Typography>
                <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                  <li>Network connectivity issues</li>
                  <li>Backend service unavailability</li>
                  <li>Browser compatibility issues</li>
                  <li>Temporary system malfunction</li>
                </ul>
              </Alert>

              {this.state.error && (
                <Accordion sx={{ width: '100%' }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      Technical Details
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box 
                      component="pre" 
                      sx={{ 
                        fontSize: 12, 
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        bgcolor: 'grey.100',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        maxHeight: 200
                      }}
                    >
                      <Typography variant="body2" fontWeight={600} color="error.main">
                        Error: {this.state.error.message}
                      </Typography>
                      {this.state.error.stack && (
                        <>
                          <br />
                          <Typography variant="caption" color="text.secondary">
                            Stack Trace:
                          </Typography>
                          <br />
                          {this.state.error.stack}
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: '100%' }}>
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleRetry}
                  color="primary"
                  fullWidth
                >
                  Try Again
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={this.handleReload}
                  color="primary"
                  fullWidth
                >
                  Reload Page
                </Button>
                
                <Button
                  variant="outlined"
                  startIcon={<HomeIcon />}
                  onClick={this.handleGoHome}
                  color="secondary"
                  fullWidth
                >
                  Go to Dashboard
                </Button>
              </Stack>

              <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
                If this error persists, please contact your system administrator or check the browser console for more details.
              </Typography>
            </Stack>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default AdminErrorBoundary;