import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Checkbox,
  Stack,
  TextField,
  Divider,
} from '@mui/material';
import { Delete, CheckCircle } from '@mui/icons-material';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

interface Listing {
  id: number;
  title: string;
  address: string;
  borough: string;
  created_at: string;
  host_name?: string;
}

const CleanupListings: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (!user?.is_staff && !user?.is_superuser) {
      toast.error('Admin access required');
      navigate('/');
    }
  }, [user, navigate]);

  // Load all listings
  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/listings/', {
        params: { page_size: 100 }
      });
      const allListings = response.data.results || [];
      
      // Pre-select listings for deletion (all except test2 and tesing)
      const toDelete = new Set<number>();
      allListings.forEach((listing: Listing) => {
        const titleLower = listing.title?.toLowerCase() || '';
        if (!titleLower.includes('test2') && !titleLower.includes('tesing')) {
          toDelete.add(listing.id);
        }
      });
      
      setListings(allListings);
      setSelectedIds(toDelete);
    } catch (error) {
      toast.error('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) {
      toast.error('No listings selected for deletion');
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} listings? This cannot be undone!`)) {
      return;
    }

    setDeleting(true);
    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        await api.delete(`/listings/${id}/`);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to delete listing ${id}:`, error);
      }
    }

    toast.success(`Deleted ${successCount} listings${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setDeleting(false);
    loadListings(); // Reload
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  const keepCount = listings.length - selectedIds.size;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        🧹 Cleanup Listings Tool
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        This tool helps you delete old test listings. By default, it keeps only "test2" and "tesing" listings.
      </Alert>

      <Stack direction="row" spacing={2} sx={{ mb: 3 }}>
        <Typography variant="h6">
          Total: {listings.length} | Keep: {keepCount} | Delete: {selectedIds.size}
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<Delete />}
          onClick={deleteSelected}
          disabled={deleting || selectedIds.size === 0}
        >
          {deleting ? 'Deleting...' : `Delete ${selectedIds.size} Listings`}
        </Button>
      </Stack>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={2}>
        {listings.map((listing) => {
          const shouldKeep = ['test2', 'tesing'].some(keep => 
            listing.title?.toLowerCase().includes(keep.toLowerCase())
          );
          const isSelected = selectedIds.has(listing.id);
          
          return (
            <Grid item xs={12} sm={6} md={4} key={listing.id}>
              <Card 
                sx={{ 
                  border: isSelected ? '2px solid red' : shouldKeep ? '2px solid green' : '1px solid #ddd',
                  backgroundColor: isSelected ? '#ffebee' : shouldKeep ? '#f1f8e9' : 'white'
                }}
              >
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => toggleSelection(listing.id)}
                      color={isSelected ? "error" : "default"}
                    />
                    <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                      {listing.title || 'Untitled'}
                    </Typography>
                    {shouldKeep && <CheckCircle color="success" />}
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary">
                    ID: {listing.id}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {listing.address}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {listing.borough} • {new Date(listing.created_at).toLocaleDateString()}
                  </Typography>
                  
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: isSelected ? 'error.main' : shouldKeep ? 'success.main' : 'text.secondary',
                      fontWeight: 'bold',
                      mt: 1,
                      display: 'block'
                    }}
                  >
                    {isSelected ? '❌ WILL DELETE' : shouldKeep ? '✅ WILL KEEP' : 'Not selected'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Container>
  );
};

export default CleanupListings;