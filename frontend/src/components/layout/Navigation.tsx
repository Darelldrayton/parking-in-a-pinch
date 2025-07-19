import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSecureImageUrl } from '../../utils/imageProxy';
import { VerifiedAvatar } from '../common/VerifiedBadge';
import {
  AppBar,
  Box,
  Toolbar,
  IconButton,
  Typography,
  Menu,
  Container,
  Avatar,
  Button,
  Tooltip,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  useMediaQuery,
  Badge,
  Stack,
  Chip,
  Paper,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  LocalParking,
  Dashboard,
  Search,
  Add,
  Person,
  Logout,
  Login,
  Brightness4,
  Brightness7,
  NotificationsOutlined,
  MessageOutlined,
  FavoriteOutlined,
  CalendarMonth,
  AttachMoney,
  BookmarkBorder,
  Circle,
  WifiOff,
  Wifi,
  Refresh,
} from '@mui/icons-material';
import { useThemeMode } from '../../hooks/useThemeMode';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, NotificationType } from '../../context/NotificationContext';
import messagingService from '../../services/messaging';
import webSocketService from '../../services/websocket';

interface NavigationProps {
  isHost?: boolean;
}

const Navigation: React.FC<NavigationProps> = ({ isHost = false }) => {
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [anchorElNotifications, setAnchorElNotifications] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { toggleTheme, mode } = useThemeMode();
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, connectionStatus } = useNotifications();


  // Refresh user data to ensure profile picture is loaded - DEBUG VERSION  
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔄 Navigation: Checking if profile refresh needed');
      console.log('Current user data:', user);
      
      // Always refresh for debugging (will revert this)
      refreshUser().then(() => {
        console.log('✅ Navigation: User data refreshed successfully');
      }).catch(error => {
        console.warn('Failed to refresh user data in Navigation:', error);
      });
    }
  }, [isAuthenticated, refreshUser]); // Removed user dependency to avoid loops

  // Debug user profile photo data
  useEffect(() => {
    if (user) {
      console.log('🖼️ Profile photo debug:', {
        profile_picture: user.profile_picture,
        profile_picture_url: user.profile_picture_url,
        profile_image: user.profile_image,
        first_name: user.first_name,
        full_user: user
      });
    }
  }, [user]);

  // Debug function to clear cached state - can be called from browser console
  useEffect(() => {
    (window as any).debugMessageCount = () => {
      console.log('=== MESSAGE COUNT DEBUG ===');
      console.log('Current unread message count state:', unreadMessageCount);
      console.log('User:', user);
      console.log('Is authenticated:', isAuthenticated);
      console.log('localStorage access_token:', !!localStorage.getItem('access_token'));
      console.log('localStorage token:', !!localStorage.getItem('token'));
      console.log('localStorage user:', localStorage.getItem('user'));
      
      // Force refresh unread count
      console.log('Forcing unread count refresh...');
      messagingService.getUnreadCount().then(response => {
        console.log('Fresh API response:', response);
        setUnreadMessageCount(response.unread_count);
      }).catch(error => {
        console.log('API error:', error);
        setUnreadMessageCount(0);
      });
    };

    (window as any).clearMessageCache = () => {
      console.log('Clearing message count cache...');
      setUnreadMessageCount(0);
      localStorage.removeItem('cachedUnreadCount'); // In case any other code caches this
    };

  }, [unreadMessageCount, user, isAuthenticated]);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadMessageCount = async () => {
      if (isAuthenticated) {
        try {
          console.log('Navigation: Fetching unread message count for user:', user?.id);
          const response = await messagingService.getUnreadCount();
          console.log('Navigation: Unread count response:', response);
          setUnreadMessageCount(response.unread_count);
        } catch (error) {
          // Don't spam console for expected API errors in development
          if (error.response?.status !== 404) {
            console.error('Failed to fetch unread message count:', error);
          }
          console.log('Navigation: Setting unread count to 0 due to error');
          // Set to 0 if endpoint doesn't exist
          setUnreadMessageCount(0);
        }
      } else {
        console.log('Navigation: User not authenticated, setting unread count to 0');
        setUnreadMessageCount(0);
      }
    };

    fetchUnreadMessageCount();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadMessageCount, 30000);
    
    return () => clearInterval(interval);
  }, [isAuthenticated, user?.id]);

  // Listen for real-time message notifications to update unread count
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleNotification = (notification: any) => {
      // If it's a message notification, refresh unread message count
      if (notification.type === 'new_message') {
        setUnreadMessageCount(prev => prev + 1);
      }
    };

    // Listen for notifications through the context's websocket connection
    webSocketService.onNotification(handleNotification);

    return () => {
      // Clean up listener if method exists
      if (webSocketService.removeNotificationListener) {
        webSocketService.removeNotificationListener(handleNotification);
      }
    };
  }, [isAuthenticated]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElNotifications(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorElNotifications(null);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
    handleCloseUserMenu();
  };

  const hostMenuItems = [
    { text: 'My Listings', icon: <LocalParking />, path: '/my-listings' },
    { text: 'Add Listing', icon: <Add />, path: '/create-listing' },
    { text: 'Bookings', icon: <CalendarMonth />, path: '/bookings' },
    { 
      text: 'Messages', 
      icon: unreadMessageCount > 0 ? 
        <Badge badgeContent={unreadMessageCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}>
          <MessageOutlined />
        </Badge> : 
        <MessageOutlined />, 
      path: '/messages' 
    },
  ];

  const renterMenuItems = [
    { text: 'Search Parking', icon: <Search />, path: '/listings' },
    { text: 'My Bookings', icon: <CalendarMonth />, path: '/my-bookings' },
    { text: 'Favorites', icon: <FavoriteOutlined />, path: '/favorites' },
    { 
      text: 'Messages', 
      icon: unreadMessageCount > 0 ? 
        <Badge badgeContent={unreadMessageCount} color="error" sx={{ '& .MuiBadge-badge': { fontSize: '0.75rem' } }}>
          <MessageOutlined />
        </Badge> : 
        <MessageOutlined />, 
      path: '/messages' 
    },
  ];

  const menuItems = isHost ? hostMenuItems : renterMenuItems;

  const handleNotificationClick = async (notificationId: number, actionUrl?: string) => {
    try {
      await markAsRead(notificationId);
      handleCloseNotifications();
      
      // User requested no redirects - just mark as read
      // if (actionUrl) {
      //   navigate(actionUrl);
      // }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.BOOKING_CONFIRMED:
      case NotificationType.BOOKING_CANCELLED:
      case NotificationType.BOOKING_REMINDER:
        return <CalendarMonth sx={{ fontSize: 20 }} />;
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_FAILED:
        return <AttachMoney sx={{ fontSize: 20, color: 'success.main' }} />;
      case NotificationType.NEW_MESSAGE:
        return <MessageOutlined sx={{ fontSize: 20, color: 'info.main' }} />;
      case NotificationType.LISTING_APPROVED:
      case NotificationType.LISTING_REJECTED:
        return <LocalParking sx={{ fontSize: 20, color: 'warning.main' }} />;
      case NotificationType.REVIEW_RECEIVED:
        return <BookmarkBorder sx={{ fontSize: 20, color: 'secondary.main' }} />;
      case NotificationType.SECURITY_ALERT:
        return <Circle sx={{ fontSize: 20, color: 'error.main' }} />;
      default:
        return <NotificationsOutlined sx={{ fontSize: 20, color: 'grey.500' }} />;
    }
  };

  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi sx={{ fontSize: 16, color: 'success.main' }} />;
      case 'reconnecting':
        return <Refresh sx={{ fontSize: 16, color: 'warning.main', animation: 'spin 1s linear infinite' }} />;
      case 'disconnected':
        return <WifiOff sx={{ fontSize: 16, color: 'error.main' }} />;
      default:
        return <WifiOff sx={{ fontSize: 16, color: 'grey.500' }} />;
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)} days ago`;
    return date.toLocaleDateString();
  };

  const drawer = (
    <Box sx={{ width: 250 }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" fontWeight="bold">
          Parking in a Pinch
        </Typography>
      </Box>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
                // Reset unread message count when navigating to messages
                if (item.path === '/messages') {
                  setUnreadMessageCount(0);
                }
              }}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  borderRight: `3px solid ${theme.palette.primary.main}`,
                },
              }}
            >
              <ListItemIcon sx={{ color: location.pathname === item.path ? 'inherit' : 'inherit' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={toggleTheme}>
            <ListItemIcon>
              {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </ListItemIcon>
            <ListItemText primary={mode === 'dark' ? 'Light Mode' : 'Dark Mode'} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <>
      <AppBar position="sticky" elevation={0} sx={{ backgroundColor: 'background.paper', color: 'text.primary' }}>
        <Container maxWidth="xl">
          <Toolbar disableGutters>
            {isMobile && (
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2, display: { md: 'none' } }}
              >
                <MenuIcon />
              </IconButton>
            )}

            <LocalParking sx={{ display: { xs: 'none', md: 'flex' }, mr: 1, color: 'primary.main' }} />
            <Typography
              variant="h6"
              noWrap
              component="a"
              href="/dashboard"
              sx={{
                mr: 2,
                display: { xs: 'none', md: 'flex' },
                fontWeight: 700,
                textDecoration: 'none',
                color: 'primary.main',
              }}
            >
              Parking in a Pinch
            </Typography>

            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, ml: 4 }}>
              {menuItems.map((item) => (
                <Button
                  key={item.text}
                  onClick={() => {
                    navigate(item.path);
                    // Reset unread message count when navigating to messages
                    if (item.path === '/messages') {
                      setUnreadMessageCount(0);
                    }
                  }}
                  startIcon={item.icon}
                  sx={{
                    my: 2,
                    color: location.pathname === item.path ? 'inherit' : 'text.primary',
                    display: 'flex',
                    fontWeight: location.pathname === item.path ? 600 : 400,
                    '&:hover': {
                      backgroundColor: 'primary.main',
                      color: 'white',
                    },
                  }}
                >
                  {item.text}
                </Button>
              ))}
            </Box>

            <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
              <Typography
                variant="h6"
                fontWeight="bold"
                component="a"
                href="/dashboard"
                sx={{
                  textDecoration: 'none',
                  cursor: 'pointer',
                  color: 'primary.main',
                  '&:hover': {
                    opacity: 0.8,
                  },
                }}
              >
                Parking in a Pinch
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              {isAuthenticated && (
                <>
                  <Tooltip title="Notifications">
                    <IconButton 
                      color="inherit" 
                      onClick={handleOpenNotifications}
                      sx={{ display: { xs: 'none', sm: 'flex' } }}
                    >
                      <Badge badgeContent={unreadCount} color="error">
                        <NotificationsOutlined 
                          className={
                            connectionStatus === 'connected' ? 'notification-icon-connected' :
                            connectionStatus === 'reconnecting' ? 'notification-icon-reconnecting' : ''
                          }
                          sx={{
                            color: connectionStatus === 'connected' ? 'success.main' : 
                                   connectionStatus === 'reconnecting' ? 'warning.main' :
                                   connectionStatus === 'disconnected' ? 'error.main' : 'inherit'
                          }}
                        />
                      </Badge>
                    </IconButton>
                  </Tooltip>
                  {isHost && (
                    <Chip
                      label="Host"
                      size="small"
                            sx={{ display: { xs: 'none', sm: 'flex' } }}
                    />
                  )}
                </>
              )}

              <IconButton onClick={toggleTheme} color="inherit" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                {mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
              </IconButton>

              {isAuthenticated ? (
                <Box sx={{ flexGrow: 0 }}>
                  <Tooltip title="Open settings">
                    <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                      <VerifiedAvatar 
                        src={getSecureImageUrl(user?.profile_picture_url || user?.profile_picture)}
                        alt={user?.first_name}
                        isVerified={user?.is_verified || false}
                        size={40}
                      >
                        {user?.first_name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                      </VerifiedAvatar>
                    </IconButton>
                  </Tooltip>
                  <Menu
                    sx={{ mt: '45px' }}
                    id="menu-appbar"
                    anchorEl={anchorElUser}
                    anchorOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    keepMounted
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'right',
                    }}
                    open={Boolean(anchorElUser)}
                    onClose={handleCloseUserMenu}
                  >
                    <MenuItem onClick={() => { navigate('/dashboard'); handleCloseUserMenu(); }}>
                      <ListItemIcon>
                        <Dashboard fontSize="small" />
                      </ListItemIcon>
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
                      <ListItemIcon>
                        <Person fontSize="small" />
                      </ListItemIcon>
                      Profile
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <ListItemIcon>
                        <Logout fontSize="small" />
                      </ListItemIcon>
                      Logout
                    </MenuItem>
                  </Menu>
                </Box>
              ) : (
                <Button
                  variant="contained"
                  startIcon={<Login />}
                  onClick={() => navigate('/login')}
                  sx={{ ml: 2 }}
                >
                  Login
                </Button>
              )}
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Notifications Menu */}
      <Menu
        anchorEl={anchorElNotifications}
        id="notifications-menu"
        open={Boolean(anchorElNotifications)}
        onClose={handleCloseNotifications}
        sx={{ mt: '45px' }}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 360,
            maxWidth: 400,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
      >
        <Box sx={{ p: 2, pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" fontWeight={600} color="primary.main">
              Notifications
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Tooltip title={`Real-time connection: ${getConnectionStatusText()}`}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getConnectionStatusIcon()}
                </Box>
              </Tooltip>
            </Box>
          </Box>
          {unreadCount > 0 && (
            <Typography variant="caption" color="text.secondary">
              You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>
        <Divider />
        <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <NotificationsOutlined sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.action_url)}
                sx={{
                  p: 2,
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                  backgroundColor: !notification.is_read ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                  '&:hover': {
                    backgroundColor: !notification.is_read 
                      ? alpha(theme.palette.primary.main, 0.08)
                      : alpha(theme.palette.action.hover, 0.5),
                  },
                  alignItems: 'flex-start',
                  minHeight: 'auto',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <ListItemIcon sx={{ mt: 0.5, minWidth: 36 }}>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                <Box sx={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Typography 
                      variant="subtitle2" 
                      fontWeight={600} 
                      color="primary.main"
                      sx={{ 
                        mr: 1,
                        flex: 1,
                        wordWrap: 'break-word',
                        whiteSpace: 'normal',
                        overflow: 'hidden',
                      }}
                    >
                      {notification.title}
                    </Typography>
                    {!notification.is_read && (
                      <Circle sx={{ fontSize: 8, mt: 0.5, flexShrink: 0 }} />
                    )}
                  </Box>
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ 
                      mt: 0.5, 
                      mb: 1,
                      wordWrap: 'break-word',
                      whiteSpace: 'normal',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.disabled">
                    {formatTimeAgo(notification.created_at)}
                  </Typography>
                </Box>
              </MenuItem>
            ))
          )}
        </Box>
        {notifications.length > 0 && [
          <Divider key="divider" />,
          <Box key="mark-all-read" sx={{ p: 1 }}>
            <Button
              fullWidth
              size="small"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
              sx={{ textTransform: 'none' }}
            >
              Mark all as read
            </Button>
          </Box>
        ]}
      </Menu>

      <Drawer
        variant="temporary"
        anchor="left"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 250 },
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navigation;
