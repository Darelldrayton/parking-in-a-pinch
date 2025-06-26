import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Paper,
  Avatar,
  Rating,
  IconButton,
  useTheme,
  alpha,
  Fade,
  Stack,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  LinearProgress,
  Chip,
  Pagination,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ThumbUp as ThumbUpIcon,
  ThumbUpOutlined as ThumbUpOutlinedIcon,
  Reply as ReplyIcon,
  ArrowBack,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  RateReview as ReviewIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_distribution: {
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    '5': number;
  };
  recent_reviews: any[];
}

interface Review {
  id: number;
  review_id: string;
  reviewer: number;
  reviewer_name: string;
  reviewer_avatar?: string;
  review_type: string;
  booking: number | null;
  overall_rating: number;
  cleanliness_rating?: number;
  location_rating?: number;
  value_rating?: number;
  communication_rating?: number;
  security_rating?: number;
  reliability_rating?: number;
  title: string;
  comment: string;
  is_anonymous: boolean;
  status: string;
  is_verified: boolean;
  helpful_votes: number;
  unhelpful_votes: number;
  helpful_score: number;
  total_votes: number;
  helpful_percentage: number;
  response_text: string;
  response_date: string | null;
  created_at: string;
  updated_at: string;
  published_at: string;
  images: any[];
  can_edit: boolean;
  can_respond: boolean;
  can_vote: boolean;
  user_vote: string | null;
  reviewed_object_details: {
    id: number;
    title: string;
    address: string;
    type: string;
  };
}

export default function Reviews() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  
  // State
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedReviewId, setSelectedReviewId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const reviewsPerPage = 10;

  useEffect(() => {
    loadReviews();
  }, [filterRating, sortBy, page]);

  useEffect(() => {
    loadReviewStats();
  }, []);

  const loadReviewStats = async () => {
    try {
      // Get stats for the current user as a host
      const response = await api.get(`/api/v1/reviews/reviews/summary/?type=host&id=${user?.id}`);
      setReviewStats(response.data);
    } catch (error) {
      console.error('Error loading review stats:', error);
      // Set default stats if none found
      setReviewStats({
        total_reviews: 0,
        average_rating: 0,
        rating_distribution: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0 },
        recent_reviews: []
      });
    }
  };

  const loadReviews = async () => {
    setLoading(true);
    try {
      let url = `/api/v1/reviews/reviews/user_reviews/?user_id=${user?.id}&review_type=host&page=${page}`;
      
      // Add filtering and sorting
      const params = new URLSearchParams();
      if (filterRating !== 'all') {
        params.append('rating', filterRating);
      }
      if (sortBy === 'oldest') {
        params.append('ordering', 'created_at');
      } else if (sortBy === 'highest') {
        params.append('ordering', '-overall_rating');
      } else if (sortBy === 'lowest') {
        params.append('ordering', 'overall_rating');
      } else {
        params.append('ordering', '-created_at');
      }
      
      if (params.toString()) {
        url += `&${params.toString()}`;
      }

      const response = await api.get(url);
      setReviews(response.data.results || response.data);
      
      if (response.data.count) {
        setTotalPages(Math.ceil(response.data.count / reviewsPerPage));
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (reviewId: number) => {
    try {
      await api.post(`/api/v1/reviews/reviews/${reviewId}/vote/`, {
        vote_type: 'helpful'
      });
      
      // Update the review in the local state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === reviewId
            ? { ...review, helpful_votes: review.helpful_votes + 1, user_vote: 'helpful' }
            : review
        )
      );
      
      showSnackbar('Marked as helpful!', 'success');
    } catch (error: any) {
      console.error('Error marking as helpful:', error);
      const message = error.response?.data?.detail || 'Failed to mark as helpful';
      showSnackbar(message, 'error');
    }
  };

  const handleReplyToReview = (reviewId: number) => {
    setSelectedReviewId(reviewId);
    setReplyDialogOpen(true);
    setReplyText('');
  };

  const submitReply = async () => {
    if (!selectedReviewId || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      await api.post(`/api/v1/reviews/reviews/${selectedReviewId}/add_response/`, {
        response_text: replyText.trim()
      });

      // Update the review in the local state
      setReviews(prevReviews =>
        prevReviews.map(review =>
          review.id === selectedReviewId
            ? { ...review, response_text: replyText.trim(), response_date: new Date().toISOString() }
            : review
        )
      );

      setReplyDialogOpen(false);
      setReplyText('');
      setSelectedReviewId(null);
      showSnackbar('Reply posted successfully!', 'success');
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      const message = error.response?.data?.detail || 'Failed to post reply';
      showSnackbar(message, 'error');
    } finally {
      setSubmittingReply(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  const getRatingPercentage = (count: number) => {
    return reviewStats && reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading && !reviewStats) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 4,
    }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.warning.dark} 0%, ${theme.palette.warning.main} 100%)`,
        color: 'white',
        py: 6,
        mb: 4,
        position: 'relative',
        overflow: 'hidden',
      }}>
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Fade in timeout={800}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <IconButton 
                  onClick={() => navigate('/dashboard')} 
                  sx={{ color: 'white', bgcolor: alpha(theme.palette.common.white, 0.1) }}
                >
                  <ArrowBack />
                </IconButton>
                <Typography variant="h3" component="h1" fontWeight={700}>
                  Reviews & Ratings
                </Typography>
              </Stack>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
                See what guests are saying about your parking spaces
              </Typography>
            </Box>
          </Fade>
        </Container>
      </Box>

      <Container maxWidth="lg">
        {/* Overall Stats */}
        {reviewStats && (
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, height: '100%', textAlign: 'center' }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography variant="h2" fontWeight={700} sx={{ color: 'warning.main', mb: 1 }}>
                    {reviewStats.average_rating ? reviewStats.average_rating.toFixed(1) : '0.0'}
                  </Typography>
                  <Rating
                    value={reviewStats.average_rating || 0}
                    precision={0.1}
                    readOnly
                    size="large"
                    sx={{ mb: 2 }}
                  />
                  <Typography variant="h6" fontWeight={600}>
                    Overall Rating
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Based on {reviewStats.total_reviews} reviews
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ borderRadius: 3, height: '100%' }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
                    Rating Breakdown
                  </Typography>
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const count = reviewStats.rating_distribution[stars.toString() as keyof typeof reviewStats.rating_distribution] || 0;
                    const percentage = getRatingPercentage(count);
                    
                    return (
                      <Stack key={stars} direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ minWidth: 20 }}>
                          {stars}
                        </Typography>
                        <StarIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ flex: 1, height: 8, borderRadius: 4 }}
                        />
                        <Typography variant="body2" sx={{ minWidth: 30 }}>
                          {count}
                        </Typography>
                      </Stack>
                    );
                  })}
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Grid container spacing={2} sx={{ height: '100%' }}>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight={700} sx={{ color: 'info.main' }}>
                        {reviewStats.total_reviews > 0 ? '100%' : '0%'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Response Rate
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3, textAlign: 'center' }}>
                      <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                      <Typography variant="h4" fontWeight={700} sx={{ color: 'success.main' }}>
                        &lt;1h
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg. Response Time
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        )}

        {/* Filters */}
        <Paper elevation={2} sx={{ p: 3, mb: 4, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
            <Typography variant="h6" fontWeight={600}>
              All Reviews ({reviews.length})
            </Typography>
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Rating</InputLabel>
                <Select
                  value={filterRating}
                  label="Rating"
                  onChange={(e) => setFilterRating(e.target.value)}
                >
                  <MenuItem value="all">All Ratings</MenuItem>
                  <MenuItem value="5">5 Stars</MenuItem>
                  <MenuItem value="4">4 Stars</MenuItem>
                  <MenuItem value="3">3 Stars</MenuItem>
                  <MenuItem value="2">2 Stars</MenuItem>
                  <MenuItem value="1">1 Star</MenuItem>
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 120 }}>
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={sortBy}
                  label="Sort By"
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <MenuItem value="newest">Newest First</MenuItem>
                  <MenuItem value="oldest">Oldest First</MenuItem>
                  <MenuItem value="highest">Highest Rating</MenuItem>
                  <MenuItem value="lowest">Lowest Rating</MenuItem>
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </Paper>

        {/* Reviews List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : reviews.length === 0 ? (
          <Card sx={{ borderRadius: 3, textAlign: 'center', py: 8 }}>
            <CardContent>
              <ReviewIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No reviews yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Reviews from your guests will appear here
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={3}>
            {reviews.map((review) => (
              <Card key={review.id} sx={{ borderRadius: 3, boxShadow: theme.shadows[2] }}>
                <CardContent sx={{ p: 4 }}>
                  <Stack direction="row" spacing={3}>
                    <Avatar 
                      src={review.reviewer_avatar} 
                      sx={{ width: 56, height: 56 }}
                    >
                      {review.reviewer_name.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                        <Box>
                          <Typography variant="h6" fontWeight={600}>
                            {review.reviewer_name}
                            {review.is_verified && (
                              <Chip label="Verified" size="small" color="success" sx={{ ml: 1 }} />
                            )}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatDate(review.created_at)}
                          </Typography>
                        </Box>
                        <Rating value={review.overall_rating} readOnly size="small" />
                      </Stack>
                      
                      <Chip
                        label={review.reviewed_object_details.title}
                        size="small"
                        variant="outlined"
                        sx={{ mb: 2 }}
                        onClick={() => navigate(`/listings/${review.reviewed_object_details.id}`)}
                        clickable
                      />
                      
                      {review.title && (
                        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1 }}>
                          {review.title}
                        </Typography>
                      )}
                      
                      <Typography variant="body1" sx={{ mb: 2, lineHeight: 1.6 }}>
                        {review.comment}
                      </Typography>
                      
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Button
                          size="small"
                          startIcon={review.user_vote === 'helpful' ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                          variant={review.user_vote === 'helpful' ? 'contained' : 'text'}
                          onClick={() => handleMarkHelpful(review.id)}
                          disabled={!review.can_vote}
                        >
                          Helpful ({review.helpful_votes})
                        </Button>
                        {review.can_respond && !review.response_text && (
                          <Button
                            size="small"
                            startIcon={<ReplyIcon />}
                            variant="outlined"
                            onClick={() => handleReplyToReview(review.id)}
                            sx={{ borderRadius: 2 }}
                          >
                            Reply
                          </Button>
                        )}
                      </Stack>
                      
                      {review.response_text && (
                        <Box sx={{ mt: 3, p: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), borderRadius: 2 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
                            Host Response
                            {review.response_date && ` - ${formatDate(review.response_date)}`}
                          </Typography>
                          <Typography variant="body2">
                            {review.response_text}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, value) => setPage(value)}
              size="large"
            />
          </Box>
        )}
      </Container>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onClose={() => setReplyDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            Reply to Review
            <IconButton onClick={() => setReplyDialogOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Your reply"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Thank you for your review..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReplyDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={submitReply}
            variant="contained"
            disabled={!replyText.trim() || submittingReply}
            startIcon={submittingReply && <CircularProgress size={16} />}
          >
            {submittingReply ? 'Posting...' : 'Post Reply'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}