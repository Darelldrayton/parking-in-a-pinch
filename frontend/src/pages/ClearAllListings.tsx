import React, { useState } from 'react';
import { Box, Button, Typography, CircularProgress, Alert, Paper } from '@mui/material';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const ClearAllListings: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [listingCount, setListingCount] = useState<number | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Check if user is admin
    if (!user?.is_staff && !user?.is_superuser && user?.email !== 'darelldrayton93@gmail.com') {
      navigate('/');
      return;
    }

    // Get current listing count
    fetchListingCount();
  }, [user, navigate]);

  const fetchListingCount = async () => {
    try {
      const response = await api.get('/listings/');
      setListingCount(response.data.count || response.data.length || 0);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListingCount(0);
    }
  };

  const handleClearListings = async () => {
    if (!window.confirm(`Are you sure you want to delete ALL ${listingCount} listings? This cannot be undone!`)) {
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      // First, get all listings
      const response = await api.get('/listings/?limit=1000');
      const listings = response.data.results || response.data;
      
      if (!listings || listings.length === 0) {
        setMessage({ type: 'info', text: 'No listings found to delete.' });
        setLoading(false);
        return;
      }

      // Delete each listing
      let deletedCount = 0;
      let failedCount = 0;

      for (const listing of listings) {
        try {
          await api.delete(`/listings/${listing.id}/`);
          deletedCount++;
          setMessage({ type: 'info', text: `Deleting listings... (${deletedCount}/${listings.length})` });
        } catch (error) {
          console.error(`Failed to delete listing ${listing.id}:`, error);
          failedCount++;
        }
      }

      // Final message
      if (failedCount === 0) {
        setMessage({ type: 'success', text: `Successfully deleted all ${deletedCount} listings!` });
      } else {
        setMessage({ 
          type: 'error', 
          text: `Deleted ${deletedCount} listings, but ${failedCount} failed to delete.` 
        });
      }

      // Refresh count
      await fetchListingCount();

    } catch (error) {
      console.error('Error clearing listings:', error);
      setMessage({ type: 'error', text: 'Failed to clear listings. Check console for details.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 600, mx: 'auto' }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Clear All Listings
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          This admin tool will permanently delete ALL listings from the database.
        </Typography>

        {listingCount !== null && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            There are currently <strong>{listingCount}</strong> listings in the database.
          </Alert>
        )}

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            color="error"
            onClick={handleClearListings}
            disabled={loading || listingCount === 0}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? 'Deleting...' : 'Delete All Listings'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate('/admin/dashboard')}
            disabled={loading}
          >
            Back to Admin
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ClearAllListings;