import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  ListItemAvatar,
  Avatar,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Paper,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  EmojiEvents,
  LocalOffer,
  Card as CardIcon,
  Star,
  TrendingUp,
  Redeem,
  AttachMoney,
  DirectionsCar,
  Schedule,
  LocationOn,
  RestaurantMenu,
  LocalGasStation,
  ShoppingCart,
  Movie,
  Coffee,
  FitnessCenter,
  Info,
  CheckCircle,
  Lock,
  Timer,
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

interface LoyaltyTier {
  id: string;
  name: string;
  min_points: number;
  max_points?: number;
  color: string;
  benefits: string[];
  multiplier: number;
  description: string;
  icon: React.ReactNode;
}

interface LoyaltyPoints {
  current_points: number;
  lifetime_points: number;
  tier: LoyaltyTier;
  next_tier?: LoyaltyTier;
  points_to_next_tier?: number;
  tier_progress_percentage: number;
}

interface Reward {
  id: string;
  title: string;
  description: string;
  cost: number;
  type: 'discount' | 'credit' | 'gift_card' | 'upgrade' | 'partner_offer';
  value: number;
  category: 'parking' | 'partner' | 'premium' | 'special';
  expires_at?: string;
  terms_conditions: string[];
  partner_logo?: string;
  partner_name?: string;
  available: boolean;
  limited_quantity?: number;
  remaining_quantity?: number;
  icon: React.ReactNode;
}

interface UserReward {
  id: string;
  reward: Reward;
  redeemed_at: string;
  expires_at?: string;
  status: 'active' | 'used' | 'expired';
  code?: string;
  usage_instructions: string;
}

interface PointTransaction {
  id: string;
  type: 'earned' | 'redeemed' | 'expired';
  points: number;
  description: string;
  created_at: string;
  booking_id?: string;
  reward_id?: string;
  multiplier?: number;
}

const loyaltyTiers: LoyaltyTier[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    min_points: 0,
    max_points: 999,
    color: '#cd7f32',
    benefits: ['1x points on bookings', 'Basic customer support', 'Mobile app access'],
    multiplier: 1,
    description: 'Welcome to the community!',
    icon: <EmojiEvents />,
  },
  {
    id: 'silver',
    name: 'Silver',
    min_points: 1000,
    max_points: 2999,
    color: '#c0c0c0',
    benefits: ['1.2x points on bookings', 'Priority customer support', 'Extended booking history'],
    multiplier: 1.2,
    description: 'You\'re getting the hang of it!',
    icon: <Star />,
  },
  {
    id: 'gold',
    name: 'Gold',
    min_points: 3000,
    max_points: 7499,
    color: '#ffd700',
    benefits: ['1.5x points on bookings', 'Free booking modifications', 'VIP support line'],
    multiplier: 1.5,
    description: 'A valued member of our community',
    icon: <TrendingUp />,
  },
  {
    id: 'platinum',
    name: 'Platinum',
    min_points: 7500,
    color: '#e5e4e2',
    benefits: ['2x points on bookings', 'Concierge service', 'Exclusive partner offers'],
    multiplier: 2,
    description: 'Elite status with premium perks',
    icon: <EmojiEvents />,
  },
];

const LoyaltyProgram: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loyaltyData, setLoyaltyData] = useState<LoyaltyPoints | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [pointHistory, setPointHistory] = useState<PointTransaction[]>([]);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadLoyaltyData();
    loadRewards();
    loadUserRewards();
    loadPointHistory();
  }, []);

  const loadLoyaltyData = async () => {
    try {
      const response = await fetch('/api/v1/loyalty/points/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoyaltyData(data);
      } else {
        // Mock data for demonstration
        setLoyaltyData(generateMockLoyaltyData());
      }
    } catch (error) {
      console.error('Error loading loyalty data:', error);
      setLoyaltyData(generateMockLoyaltyData());
    }
  };

  const loadRewards = async () => {
    try {
      const response = await fetch('/api/v1/loyalty/rewards/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      } else {
        setRewards(generateMockRewards());
      }
    } catch (error) {
      console.error('Error loading rewards:', error);
      setRewards(generateMockRewards());
    }
  };

  const loadUserRewards = async () => {
    try {
      const response = await fetch('/api/v1/loyalty/my-rewards/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUserRewards(data);
      }
    } catch (error) {
      console.error('Error loading user rewards:', error);
    }
  };

  const loadPointHistory = async () => {
    try {
      const response = await fetch('/api/v1/loyalty/history/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPointHistory(data);
      } else {
        setPointHistory(generateMockPointHistory());
      }
    } catch (error) {
      console.error('Error loading point history:', error);
      setPointHistory(generateMockPointHistory());
    }
  };

  const handleRedeemReward = async () => {
    if (!selectedReward || !loyaltyData) return;

    if (loyaltyData.current_points < selectedReward.cost) {
      toast.error('Insufficient points for this reward');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/loyalty/redeem/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({
          reward_id: selectedReward.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Reward redeemed! Code: ${result.code}`);
        setShowRedeemDialog(false);
        setSelectedReward(null);
        loadLoyaltyData();
        loadUserRewards();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Error redeeming reward:', error);
      toast.error('Failed to redeem reward');
    } finally {
      setLoading(false);
    }
  };

  const generateMockLoyaltyData = (): LoyaltyPoints => {
    const currentPoints = 2450;
    const currentTier = loyaltyTiers.find(tier => 
      currentPoints >= tier.min_points && 
      (tier.max_points === undefined || currentPoints <= tier.max_points)
    ) || loyaltyTiers[0];
    
    const nextTier = loyaltyTiers.find(tier => tier.min_points > currentPoints);
    const pointsToNext = nextTier ? nextTier.min_points - currentPoints : 0;
    const progress = nextTier ? 
      ((currentPoints - currentTier.min_points) / (nextTier.min_points - currentTier.min_points)) * 100 : 100;

    return {
      current_points: currentPoints,
      lifetime_points: 4820,
      tier: currentTier,
      next_tier: nextTier,
      points_to_next_tier: pointsToNext,
      tier_progress_percentage: Math.min(progress, 100),
    };
  };

  const generateMockRewards = (): Reward[] => {
    return [
      {
        id: 'parking_credit_500',
        title: '$5 Parking Credit',
        description: 'Get $5 off your next parking booking',
        cost: 500,
        type: 'credit',
        value: 5,
        category: 'parking',
        terms_conditions: ['Valid for 30 days', 'Cannot be combined with other offers'],
        available: true,
        icon: <AttachMoney />,
      },
      {
        id: 'parking_credit_1000',
        title: '$10 Parking Credit',
        description: 'Get $10 off your next parking booking',
        cost: 1000,
        type: 'credit',
        value: 10,
        category: 'parking',
        terms_conditions: ['Valid for 30 days', 'Cannot be combined with other offers'],
        available: true,
        icon: <AttachMoney />,
      },
      {
        id: 'free_booking_mod',
        title: 'Free Booking Modification',
        description: 'Modify any booking without fees',
        cost: 300,
        type: 'upgrade',
        value: 0,
        category: 'premium',
        terms_conditions: ['Valid for one booking modification', 'Expires in 60 days'],
        available: true,
        icon: <Schedule />,
      },
      {
        id: 'coffee_giftcard',
        title: '$10 Coffee Gift Card',
        description: 'Starbucks gift card',
        cost: 1200,
        type: 'gift_card',
        value: 10,
        category: 'partner',
        partner_name: 'Starbucks',
        terms_conditions: ['Valid at participating locations', 'No cash value'],
        available: true,
        limited_quantity: 50,
        remaining_quantity: 23,
        icon: <Coffee />,
      },
      {
        id: 'gas_discount',
        title: '10% Off Gas',
        description: 'Get 10% off at Shell stations',
        cost: 800,
        type: 'discount',
        value: 10,
        category: 'partner',
        partner_name: 'Shell',
        expires_at: '2025-01-31',
        terms_conditions: ['Valid at participating Shell stations', 'Maximum discount $5'],
        available: true,
        icon: <LocalGasStation />,
      },
      {
        id: 'movie_tickets',
        title: '2 Movie Tickets',
        description: 'Free movie tickets at AMC Theaters',
        cost: 2000,
        type: 'gift_card',
        value: 30,
        category: 'partner',
        partner_name: 'AMC Theaters',
        terms_conditions: ['Valid at participating AMC locations', 'Excludes premium formats'],
        available: true,
        limited_quantity: 20,
        remaining_quantity: 8,
        icon: <Movie />,
      },
      {
        id: 'priority_support',
        title: 'VIP Support (1 Month)',
        description: 'Get priority customer support for 30 days',
        cost: 750,
        type: 'upgrade',
        value: 0,
        category: 'premium',
        terms_conditions: ['Valid for 30 days from redemption', 'Includes phone support'],
        available: true,
        icon: <Star />,
      },
      {
        id: 'gym_pass',
        title: '1-Day Gym Pass',
        description: 'Free day pass to participating gyms',
        cost: 600,
        type: 'partner_offer',
        value: 25,
        category: 'partner',
        partner_name: 'Fitness Network',
        terms_conditions: ['Valid at participating gyms', 'Must be used within 30 days'],
        available: false,
        icon: <FitnessCenter />,
      },
    ];
  };

  const generateMockPointHistory = (): PointTransaction[] => {
    return [
      {
        id: 'txn1',
        type: 'earned',
        points: 150,
        description: 'Booking at Downtown Garage #B123456',
        created_at: '2024-12-10T14:30:00Z',
        booking_id: 'B123456',
        multiplier: 1.2,
      },
      {
        id: 'txn2',
        type: 'redeemed',
        points: -500,
        description: 'Redeemed $5 Parking Credit',
        created_at: '2024-12-08T10:15:00Z',
        reward_id: 'parking_credit_500',
      },
      {
        id: 'txn3',
        type: 'earned',
        points: 90,
        description: 'Booking at University District #B123455',
        created_at: '2024-12-05T16:45:00Z',
        booking_id: 'B123455',
        multiplier: 1.2,
      },
      {
        id: 'txn4',
        type: 'earned',
        points: 200,
        description: 'Bonus: First review submitted',
        created_at: '2024-12-01T09:20:00Z',
      },
      {
        id: 'txn5',
        type: 'earned',
        points: 120,
        description: 'Booking at Shopping Center #B123454',
        created_at: '2024-11-28T11:30:00Z',
        booking_id: 'B123454',
        multiplier: 1.2,
      },
    ];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getRewardStatusColor = (reward: Reward) => {
    if (!reward.available) return 'default';
    if (loyaltyData && loyaltyData.current_points < reward.cost) return 'default';
    return 'primary';
  };

  const getRewardStatusText = (reward: Reward) => {
    if (!reward.available) return 'Unavailable';
    if (loyaltyData && loyaltyData.current_points < reward.cost) return 'Insufficient Points';
    return 'Available';
  };

  if (!loyaltyData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <Typography>Loading loyalty program...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <EmojiEvents sx={{ fontSize: 32, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Loyalty Program
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Earn points and unlock exclusive rewards
            </Typography>
          </Box>
        </Stack>
      </Stack>

      {/* Current Status Card */}
      <Card sx={{ mb: 4, borderRadius: 3, background: `linear-gradient(135deg, ${loyaltyData.tier.color}20, ${loyaltyData.tier.color}05)` }}>
        <CardContent sx={{ p: 4 }}>
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar
                  sx={{
                    bgcolor: loyaltyData.tier.color,
                    width: 56,
                    height: 56,
                  }}
                >
                  {loyaltyData.tier.icon}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>
                    {loyaltyData.tier.name} Member
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {loyaltyData.tier.description}
                  </Typography>
                </Box>
              </Stack>

              <Stack spacing={2}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="body2" fontWeight={500}>
                      Current Points: {loyaltyData.current_points.toLocaleString()}
                    </Typography>
                    {loyaltyData.next_tier && (
                      <Typography variant="body2" color="text.secondary">
                        {loyaltyData.points_to_next_tier} points to {loyaltyData.next_tier.name}
                      </Typography>
                    )}
                  </Stack>
                  {loyaltyData.next_tier && (
                    <LinearProgress
                      variant="determinate"
                      value={loyaltyData.tier_progress_percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: alpha(loyaltyData.tier.color, 0.2),
                        '& .MuiLinearProgress-bar': {
                          bgcolor: loyaltyData.tier.color,
                        },
                      }}
                    />
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary">
                  Lifetime Points: {loyaltyData.lifetime_points.toLocaleString()}
                </Typography>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 2, bgcolor: alpha(loyaltyData.tier.color, 0.1) }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Your Benefits
                </Typography>
                <Stack spacing={1}>
                  {loyaltyData.tier.benefits.map((benefit, index) => (
                    <Stack key={index} direction="row" alignItems="center" spacing={1}>
                      <CheckCircle sx={{ fontSize: 16, color: loyaltyData.tier.color }} />
                      <Typography variant="body2">{benefit}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, value) => setActiveTab(value)}>
          <Tab label="Rewards Catalog" />
          <Tab label="My Rewards" />
          <Tab label="Point History" />
          <Tab label="Tiers & Benefits" />
        </Tabs>
      </Box>

      {/* Rewards Catalog Tab */}
      {activeTab === 0 && (
        <Box>
          <Grid container spacing={3}>
            {rewards.map((reward) => (
              <Grid key={reward.id} item xs={12} md={6} lg={4}>
                <Card
                  sx={{
                    borderRadius: 3,
                    height: '100%',
                    opacity: reward.available && loyaltyData.current_points >= reward.cost ? 1 : 0.7,
                    border: reward.category === 'premium' ? `2px solid ${theme.palette.primary.main}` : 'none',
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Stack spacing={2}>
                      {/* Header */}
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 2,
                                bgcolor: alpha(theme.palette.primary.main, 0.1),
                              }}
                            >
                              {reward.icon}
                            </Box>
                            {reward.partner_name && (
                              <Chip label={reward.partner_name} size="small" variant="outlined" />
                            )}
                          </Stack>
                          
                          <Typography variant="h6" fontWeight={600}>
                            {reward.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {reward.description}
                          </Typography>
                        </Box>
                      </Stack>

                      {/* Value & Cost */}
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Box>
                          {reward.value > 0 && (
                            <Typography variant="subtitle1" fontWeight={600} color="success.main">
                              {reward.type === 'discount' ? `${reward.value}% Off` : formatCurrency(reward.value)}
                            </Typography>
                          )}
                          <Typography variant="body2" color="text.secondary">
                            {reward.cost} points
                          </Typography>
                        </Box>
                        
                        <Chip
                          label={getRewardStatusText(reward)}
                          color={getRewardStatusColor(reward)}
                          size="small"
                        />
                      </Stack>

                      {/* Limited Quantity */}
                      {reward.limited_quantity && (
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            {reward.remaining_quantity} of {reward.limited_quantity} remaining
                          </Typography>
                          <LinearProgress
                            variant="determinate"
                            value={((reward.remaining_quantity || 0) / reward.limited_quantity) * 100}
                            sx={{ height: 4, borderRadius: 2 }}
                          />
                        </Box>
                      )}

                      {/* Expiry */}
                      {reward.expires_at && (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Timer sx={{ fontSize: 16, color: 'warning.main' }} />
                          <Typography variant="caption" color="warning.main">
                            Expires {new Date(reward.expires_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      )}

                      {/* Action */}
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!reward.available || loyaltyData.current_points < reward.cost}
                        onClick={() => {
                          setSelectedReward(reward);
                          setShowRedeemDialog(true);
                        }}
                        startIcon={reward.available && loyaltyData.current_points >= reward.cost ? <Redeem /> : <Lock />}
                      >
                        {!reward.available ? 'Unavailable' :
                         loyaltyData.current_points < reward.cost ? 'Need More Points' : 'Redeem'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      {/* My Rewards Tab */}
      {activeTab === 1 && (
        <Box>
          {userRewards.length === 0 ? (
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 6, textAlign: 'center' }}>
                <LocalOffer sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No rewards yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start earning points and redeem your first reward
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab(0)}>
                  Browse Rewards
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Grid container spacing={3}>
              {userRewards.map((userReward) => (
                <Grid key={userReward.id} item xs={12} md={6}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent sx={{ p: 3 }}>
                      <Stack spacing={2}>
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                          <Box>
                            <Typography variant="h6" fontWeight={600}>
                              {userReward.reward.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {userReward.reward.description}
                            </Typography>
                          </Box>
                          <Chip
                            label={userReward.status}
                            color={userReward.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        </Stack>

                        {userReward.code && (
                          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="body2" fontWeight={600}>
                              Code: {userReward.code}
                            </Typography>
                          </Paper>
                        )}

                        <Typography variant="body2" color="text.secondary">
                          {userReward.usage_instructions}
                        </Typography>

                        {userReward.expires_at && (
                          <Typography variant="caption" color="warning.main">
                            Expires: {new Date(userReward.expires_at).toLocaleDateString()}
                          </Typography>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}

      {/* Point History Tab */}
      {activeTab === 2 && (
        <Card sx={{ borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            <List>
              {pointHistory.map((transaction, index) => (
                <React.Fragment key={transaction.id}>
                  <ListItem sx={{ px: 3, py: 2 }}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: transaction.type === 'earned' ? 'success.main' : 
                                   transaction.type === 'redeemed' ? 'warning.main' : 'error.main',
                        }}
                      >
                        {transaction.type === 'earned' ? <TrendingUp /> : 
                         transaction.type === 'redeemed' ? <Redeem /> : <Timer />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={transaction.description}
                      secondary={
                        <Stack direction="row" spacing={2}>
                          <Typography variant="caption">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </Typography>
                          {transaction.multiplier && transaction.multiplier > 1 && (
                            <Chip
                              label={`${transaction.multiplier}x multiplier`}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          )}
                        </Stack>
                      }
                    />
                    <ListItemSecondaryAction>
                      <Typography
                        variant="subtitle1"
                        fontWeight={600}
                        color={transaction.type === 'earned' ? 'success.main' : 'error.main'}
                      >
                        {transaction.type === 'earned' ? '+' : ''}{transaction.points}
                      </Typography>
                    </ListItemSecondaryAction>
                  </ListItem>
                  {index < pointHistory.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </CardContent>
        </Card>
      )}

      {/* Tiers & Benefits Tab */}
      {activeTab === 3 && (
        <Grid container spacing={3}>
          {loyaltyTiers.map((tier) => (
            <Grid key={tier.id} item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: 3,
                  border: loyaltyData.tier.id === tier.id ? `2px solid ${tier.color}` : 'none',
                  bgcolor: loyaltyData.tier.id === tier.id ? alpha(tier.color, 0.05) : 'background.paper',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Avatar sx={{ bgcolor: tier.color }}>
                        {tier.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight={600}>
                          {tier.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {tier.min_points.toLocaleString()}{tier.max_points ? ` - ${tier.max_points.toLocaleString()}` : '+'} points
                        </Typography>
                      </Box>
                      {loyaltyData.tier.id === tier.id && (
                        <Chip label="Current" color="primary" size="small" />
                      )}
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                      {tier.description}
                    </Typography>

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Benefits
                      </Typography>
                      <Stack spacing={1}>
                        {tier.benefits.map((benefit, index) => (
                          <Stack key={index} direction="row" alignItems="center" spacing={1}>
                            <CheckCircle sx={{ fontSize: 16, color: tier.color }} />
                            <Typography variant="body2">{benefit}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Redeem Reward Dialog */}
      <Dialog open={showRedeemDialog} onClose={() => setShowRedeemDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm Redemption</DialogTitle>
        <DialogContent>
          {selectedReward && (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h6" fontWeight={600}>
                  {selectedReward.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedReward.description}
                </Typography>
              </Box>

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="body1">
                  Cost: <strong>{selectedReward.cost} points</strong>
                </Typography>
                <Typography variant="body1">
                  Remaining: <strong>{loyaltyData.current_points - selectedReward.cost} points</strong>
                </Typography>
              </Stack>

              {selectedReward.terms_conditions.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                    Terms & Conditions
                  </Typography>
                  <List dense>
                    {selectedReward.terms_conditions.map((term, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemText
                          primary={`• ${term}`}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRedeemDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRedeemReward}
            disabled={loading}
          >
            {loading ? 'Redeeming...' : 'Confirm Redemption'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LoyaltyProgram;