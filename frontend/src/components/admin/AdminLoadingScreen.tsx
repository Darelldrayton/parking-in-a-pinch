import React from 'react';
import {
  Box,
  Container,
  Typography,
  CircularProgress,
  LinearProgress,
  Stack,
  Paper,
  useTheme,
  alpha
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Security as SecurityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';

interface AdminLoadingScreenProps {
  message?: string;
  progress?: number; // 0-100
  showProgress?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
}

const AdminLoadingScreen: React.FC<AdminLoadingScreenProps> = ({
  message = 'Loading admin dashboard...',
  progress,
  showProgress = false,
  variant = 'full'
}) => {
  const theme = useTheme();

  if (variant === 'minimal') {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Box>
    );
  }

  if (variant === 'compact') {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" p={4}>
        <CircularProgress size={40} sx={{ mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {message}
        </Typography>
        {showProgress && progress !== undefined && (
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{ width: '100%', maxWidth: 300, mt: 2 }}
          />
        )}
      </Box>
    );
  }

  // Full variant
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Pattern */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={16}
          sx={{
            p: 6,
            borderRadius: 4,
            textAlign: 'center',
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
          }}
        >
          <Stack spacing={3} alignItems="center">
            {/* Animated Icon */}
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CircularProgress
                size={100}
                thickness={2}
                sx={{
                  color: 'primary.main',
                  animationDuration: '2s'
                }}
              />
              <DashboardIcon
                sx={{
                  position: 'absolute',
                  fontSize: 48,
                  color: 'primary.main',
                  animation: 'pulse 2s infinite'
                }}
              />
            </Box>

            <Typography variant="h4" fontWeight={700} color="primary.main">
              Admin Dashboard
            </Typography>

            <Typography variant="h6" color="text.secondary">
              {message}
            </Typography>

            {showProgress && progress !== undefined && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: alpha(theme.palette.primary.main, 0.2),
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 4,
                      background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {Math.round(progress)}% complete
                </Typography>
              </Box>
            )}

            {/* Loading Features */}
            <Stack direction="row" spacing={3} sx={{ mt: 3 }}>
              {[
                { icon: SecurityIcon, label: 'Security' },
                { icon: AssessmentIcon, label: 'Analytics' },
                { icon: DashboardIcon, label: 'Dashboard' }
              ].map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    opacity: 0.7,
                    animation: `fadeIn 0.5s ease-in-out ${index * 0.2}s both`
                  }}
                >
                  <item.icon sx={{ fontSize: 24, color: 'primary.main', mb: 0.5 }} />
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Paper>
      </Container>

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 0.7; transform: translateY(0); }
          }
        `}
      </style>
    </Box>
  );
};

export default AdminLoadingScreen;