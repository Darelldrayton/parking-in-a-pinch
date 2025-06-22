import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Monitor,
  Speed,
  Storage,
  Download,
  Upload,
  Refresh,
  Delete,
  Warning,
  CheckCircle,
  Error as ErrorIcon,
  Memory,
  NetworkCheck,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import performanceMonitor from '../services/performance';
import backupService from '../services/backup';
import toast from 'react-hot-toast';

export default function SystemMonitoring() {
  const { user } = useAuth();
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [backupStats, setBackupStats] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<number | null>(null);

  // Only allow admin users to access this page
  if (!user || user.is_staff !== true) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary">
          This page is only accessible to system administrators.
        </Typography>
      </Container>
    );
  }

  useEffect(() => {
    loadData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    const perfData = performanceMonitor.getPerformanceSummary();
    const bkpStats = backupService.getBackupStats();
    const availableBackups = backupService.getAvailableBackups();
    
    setPerformanceData(perfData);
    setBackupStats(bkpStats);
    setBackups(availableBackups);
  };

  const handleCreateBackup = () => {
    backupService.saveBackup();
    toast.success('Backup created successfully');
    loadData();
  };

  const handleRestoreBackup = (index: number) => {
    if (backupService.restoreFromBackup(index)) {
      toast.success('Backup restored successfully');
    } else {
      toast.error('Failed to restore backup');
    }
  };

  const handleExportBackup = (index: number) => {
    backupService.exportBackup(index);
    toast.success('Backup exported successfully');
  };

  const handleDeleteBackup = (index: number) => {
    backupService.deleteBackup(index);
    toast.success('Backup deleted');
    loadData();
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      backupService.importBackup(file).then((success) => {
        if (success) {
          toast.success('Backup imported successfully');
          loadData();
        } else {
          toast.error('Failed to import backup');
        }
      });
    }
  };

  const toggleAutoBackup = () => {
    if (backupStats?.autoBackupEnabled) {
      backupService.stopAutoBackup();
      toast.info('Auto-backup disabled');
    } else {
      // Auto-backup is automatically started in the constructor
      toast.info('Auto-backup is always enabled');
    }
    loadData();
  };

  const getPerformanceColor = (metric: string, value: number) => {
    switch (metric) {
      case 'lcp':
        return value < 2500 ? 'success' : value < 4000 ? 'warning' : 'error';
      case 'fid':
        return value < 100 ? 'success' : value < 300 ? 'warning' : 'error';
      case 'cls':
        return value < 0.1 ? 'success' : value < 0.25 ? 'warning' : 'error';
      case 'page_load':
        return value < 3000 ? 'success' : value < 5000 ? 'warning' : 'error';
      default:
        return 'info';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            System Monitoring & Backup
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor application performance and manage data backups
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Performance Overview */}
          <Grid item xs={12} lg={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed color="primary" />
                  Performance Metrics
                  <IconButton size="small" onClick={loadData}>
                    <Refresh />
                  </IconButton>
                </Typography>

                {performanceData ? (
                  <Grid container spacing={2}>
                    {/* Core Web Vitals */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Core Web Vitals
                      </Typography>
                      {performanceData.metrics.averages && Object.entries(performanceData.metrics.averages)
                        .filter(([key]) => ['lcp', 'fid', 'cls'].includes(key))
                        .map(([key, value]: [string, any]) => (
                          <Box key={key} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">
                                {key.toUpperCase()}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={`${value.toFixed(2)}${key === 'cls' ? '' : 'ms'}`}
                                color={getPerformanceColor(key, value)}
                              />
                            </Box>
                          </Box>
                      ))}
                    </Grid>

                    {/* Page Load Metrics */}
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2" gutterBottom>
                        Page Load Times
                      </Typography>
                      {performanceData.metrics.averages && Object.entries(performanceData.metrics.averages)
                        .filter(([key]) => ['page_load', 'ttfb', 'dom_load'].includes(key))
                        .map(([key, value]: [string, any]) => (
                          <Box key={key} sx={{ mb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                              <Typography variant="body2">
                                {key.replace('_', ' ').toUpperCase()}
                              </Typography>
                              <Chip 
                                size="small" 
                                label={`${value.toFixed(2)}ms`}
                                color={getPerformanceColor(key, value)}
                              />
                            </Box>
                          </Box>
                      ))}
                    </Grid>

                    {/* Error Summary */}
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" gutterBottom>
                        Error Summary (Last 5 minutes)
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Chip 
                          icon={performanceData.errors.total > 0 ? <ErrorIcon /> : <CheckCircle />}
                          label={`${performanceData.errors.total} Errors`}
                          color={performanceData.errors.total > 0 ? 'error' : 'success'}
                        />
                        <Chip 
                          icon={<Monitor />}
                          label={`${performanceData.metrics.total} Metrics Collected`}
                          color="info"
                        />
                      </Box>
                    </Grid>
                  </Grid>
                ) : (
                  <LinearProgress />
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Backup System */}
          <Grid item xs={12} lg={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Storage color="primary" />
                  Backup System
                </Typography>

                {backupStats && (
                  <Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Backups: {backupStats.totalBackups}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Storage Used: {backupStats.totalSize} MB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Auto-backup: {backupStats.autoBackupEnabled ? '✅ Enabled' : '❌ Disabled'}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Button
                        variant="contained"
                        startIcon={<Storage />}
                        onClick={handleCreateBackup}
                        fullWidth
                      >
                        Create Backup
                      </Button>
                      
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<Upload />}
                        fullWidth
                      >
                        Import Backup
                        <input
                          type="file"
                          accept=".json"
                          hidden
                          onChange={handleImportBackup}
                        />
                      </Button>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Backup History */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Backup History
                </Typography>
                
                {backups.length > 0 ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Timestamp</TableCell>
                          <TableCell>Version</TableCell>
                          <TableCell>Size</TableCell>
                          <TableCell>Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {backups.map((backup, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              {new Date(backup.timestamp).toLocaleString()}
                            </TableCell>
                            <TableCell>{backup.version}</TableCell>
                            <TableCell>
                              {(new Blob([JSON.stringify(backup)]).size / 1024).toFixed(1)} KB
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleRestoreBackup(index)}
                                  title="Restore"
                                >
                                  <Refresh />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleExportBackup(index)}
                                  title="Export"
                                >
                                  <Download />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteBackup(index)}
                                  title="Delete"
                                  color="error"
                                >
                                  <Delete />
                                </IconButton>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Alert severity="info">
                    No backups available. Create your first backup to get started.
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}