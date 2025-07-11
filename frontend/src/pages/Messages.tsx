import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getSecureImageUrl } from '../utils/imageProxy';
import { VerifiedAvatar } from '../components/common/VerifiedBadge';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  TextField,
  IconButton,
  Stack,
  Chip,
  Badge,
  Divider,
  AppBar,
  Toolbar,
  useTheme,
  alpha,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  Grid,
  Card,
  CardContent,
  Fab,
  CircularProgress,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Send as SendIcon,
  Search as SearchIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  EmojiEmotions as EmojiIcon,
  ArrowBack as ArrowBackIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  VideoCall as VideoCallIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  profile_picture?: string;
  profile_picture_url?: string;
  is_verified?: boolean;
}

interface Message {
  id: number;
  message_id: string;
  conversation: number;
  sender: number;
  sender_display_name: string;
  sender_profile_picture?: string;
  content: string;
  message_type: string;
  status: string;
  is_own_message: boolean;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

interface Conversation {
  id: string | number;
  conversation_id: string;
  conversation_type: string;
  status: string;
  title?: string;
  is_group: boolean;
  booking_id?: number;
  booking?: any;
  other_participant?: User;
  last_message_preview?: {
    content: string;
    sender_display_name: string;
    created_at: string;
    message_type: string;
  };
  unread_count: number;
  last_activity_at: string;
  user_role?: 'host' | 'renter';
}

// Memoize styles outside component to prevent recreation
const messageInputStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 3,
  }
};

// COMPLETELY ISOLATED MessageInput with internal state to prevent parent re-renders
const MessageInput = React.memo(({ 
  initialValue,
  onSubmit, 
  disabled, 
  placeholder = "Type a message..." 
}: {
  initialValue: string;
  onSubmit: (value: string) => void;
  disabled: boolean;
  placeholder?: string;
}) => {
  // INTERNAL STATE - no parent updates until submit
  const [localValue, setLocalValue] = useState(initialValue);
  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log('🔄 MessageInput render #', renderCount.current, 'localValue:', localValue.slice(0, 10));

  // Update local state when initialValue changes (like when message is sent and cleared)
  useEffect(() => {
    setLocalValue(initialValue);
  }, [initialValue]);

  // FAST local change handler - no parent calls
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    console.log('📝 Typing locally:', newValue.slice(0, 10));
    setLocalValue(newValue); // Only update local state
  }, []);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (localValue.trim()) {
        onSubmit(localValue.trim());
        setLocalValue(''); // Clear immediately
      }
    }
  }, [localValue, onSubmit]);

  return (
    <TextField
      fullWidth
      multiline
      maxRows={4}
      placeholder={placeholder}
      value={localValue}
      onChange={handleChange}
      onFocus={() => console.log('🟢 Input GAINED focus')}
      onBlur={(e) => {
        console.log('🔴 Input LOST focus - relatedTarget:', e.relatedTarget);
      }}
      onKeyPress={handleKeyPress}
      disabled={disabled}
      variant="outlined"
      size="small"
      sx={messageInputStyles}
    />
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.initialValue === nextProps.initialValue &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.placeholder === nextProps.placeholder
  );
});

MessageInput.displayName = 'MessageInput';

const MessageItem = React.memo(({ message, formatMessageTime }: { 
  message: Message; 
  formatMessageTime: (timestamp: string) => string; 
}) => {
  // Get message status indicator
  const getStatusIndicator = (message: Message) => {
    if (!message.is_own_message) return '';
    
    switch (message.status) {
      case 'sent':
        return '✓';
      case 'delivered':
        return '✓✓';
      case 'read':
        return '✓✓';
      default:
        return '✓';
    }
  };

  const getStatusColor = (message: Message) => {
    if (!message.is_own_message) return 'inherit';
    return message.status === 'read' ? '#1976d2' : 'inherit';
  };

  return (
  <Box
    sx={{
      display: 'flex',
      justifyContent: message.is_own_message ? 'flex-end' : 'flex-start',
      mb: 1
    }}
  >
    <Paper
      elevation={1}
      sx={{
        p: 2,
        maxWidth: '70%',
        bgcolor: message.is_own_message 
          ? 'primary.main' 
          : 'background.default',
        color: message.is_own_message 
          ? 'primary.contrastText' 
          : 'text.primary',
        borderRadius: 3,
        borderTopLeftRadius: message.is_own_message ? 3 : 1,
        borderTopRightRadius: message.is_own_message ? 1 : 3,
      }}
    >
      <Typography variant="body2">
        {message.content}
      </Typography>
      <Stack 
        direction="row" 
        alignItems="center" 
        justifyContent={message.is_own_message ? 'flex-end' : 'flex-start'}
        spacing={0.5}
        sx={{ mt: 0.5 }}
      >
        <Typography 
          variant="caption" 
          sx={{ 
            opacity: 0.7
          }}
        >
          {formatMessageTime(message.created_at)}
          {message.is_edited && ' (edited)'}
        </Typography>
        {message.is_own_message && (
          <Typography
            variant="caption"
            sx={{
              color: getStatusColor(message),
              fontSize: '0.7rem',
              opacity: 0.8,
              fontWeight: 500
            }}
          >
            {getStatusIndicator(message)}
          </Typography>
        )}
      </Stack>
    </Paper>
  </Box>
  );
});


const Messages: React.FC = React.memo(() => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  
  // State
  const [allConversations, setAllConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConversationDialog, setShowNewConversationDialog] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [newConversationMessage, setNewConversationMessage] = useState('');
  const [mobileView, setMobileView] = useState<'conversations' | 'chat'>('conversations');
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [conversationFilter, setConversationFilter] = useState<'all' | 'renter' | 'host' | 'support'>('all');
  const [conversationsLoaded, setConversationsLoaded] = useState(false);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isLoadingConversations = useRef(false);
  const sendMessageRef = useRef<(() => void) | null>(null);
  const isLoadingMessages = useRef(false);
  const lastSelectedConversationId = useRef<string | number | null>(null);
  const conversationsRef = useRef<Conversation[]>([]);
  
  // Debug render counter for main component
  const mainRenderCount = useRef(0);
  mainRenderCount.current += 1;
  if (mainRenderCount.current <= 5) {
    console.log('🔄 Messages component render #', mainRenderCount.current, {
      user: user?.id,
      allConversations: allConversations.length,
      selectedConversation: selectedConversation?.id,
      newMessage: newMessage.slice(0, 10) + '...',
      loading,
      sendingMessage
    });
  }
  
  const scrollToBottom = useCallback(() => {
    // Use requestAnimationFrame to avoid forced reflow
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);
  
  const loadConversations = useCallback(async () => {
    if (isLoadingConversations.current) {
      console.log('Already loading conversations, skipping...');
      return;
    }
    
    try {
      isLoadingConversations.current = true;
      
      // Check if user is authenticated
      if (!user) {
        console.log('User not authenticated, skipping conversations load');
        setAllConversations([]);
        return;
      }
      
      // Use the conversations API endpoint
      console.log('Messages: Loading conversations from API for user:', user.id, user.email);
      console.log('Messages: Auth tokens available:', {
        access_token: !!localStorage.getItem('access_token'),
        token: !!localStorage.getItem('token'),
        refresh_token: !!localStorage.getItem('refresh_token')
      });
      
      const response = await api.get('/messages/conversations/');
      console.log('Messages: Raw API response:', response.data);
      const apiConversations = response.data.results || response.data || [];
      
      console.log('Messages: Loaded conversations:', apiConversations.length, apiConversations);
      
      // If no conversations exist, let's try to create one for testing
      if (apiConversations.length === 0) {
        console.log('No conversations found, attempting to create test conversation...');
        try {
          // Try to get current user info and create a test conversation
          const userResponse = await api.get('/users/me/');
          console.log('Current user:', userResponse.data);
          
          // Try to create a test conversation if we can find another user
          const usersResponse = await api.get('/users/');
          const allUsers = usersResponse.data.results || usersResponse.data || [];
          console.log('Available users:', allUsers.map((u: any) => ({ id: u.id, email: u.email })));
          
          const otherUser = allUsers.find((u: any) => u.id !== userResponse.data.id);
          if (otherUser) {
            console.log('Found other user:', otherUser.email, 'attempting to create conversation...');
            
            const createResponse = await api.post('/messages/conversations/', {
              conversation_type: 'direct',
              title: `Test Conversation with ${otherUser.first_name || otherUser.email}`,
              participant_emails: [otherUser.email],
              initial_message: 'Hello! This is a test message to get the conversation started.'
            });
            
            console.log('Created test conversation:', createResponse.data);
            
            // Reload conversations
            const refreshResponse = await api.get('/messages/conversations/');
            const refreshedConversations = refreshResponse.data.results || refreshResponse.data || [];
            console.log('Refreshed conversations:', refreshedConversations);
            
            if (refreshedConversations.length > 0) {
              const transformedRefreshed = refreshedConversations.map((conv: any) => ({
                id: conv.id,
                conversation_id: conv.conversation_id,
                conversation_type: conv.conversation_type,
                status: conv.status,
                title: conv.title || `Conversation with ${conv.other_participant?.display_name || 'Unknown'}`,
                is_group: conv.is_group,
                booking_id: conv.booking_id,
                booking: conv.booking,
                other_participant: conv.other_participant,
                last_message_preview: conv.last_message_preview,
                unread_count: conv.unread_count || 0,
                last_activity_at: conv.last_activity_at,
                user_role: conv.user_role
              }));
              
              setAllConversations(transformedRefreshed);
              setConversationsLoaded(true);
              return; // Exit early since we created and loaded conversations
            }
          }
        } catch (userError) {
          console.error('Error creating test conversation:', userError);
        }
      }
      
      // Transform API conversations to match our frontend format
      const transformedConversations = apiConversations.map((conv: any) => ({
        id: conv.id,
        conversation_id: conv.conversation_id,
        conversation_type: conv.conversation_type,
        status: conv.status,
        title: conv.title || `Conversation with ${conv.other_participant?.display_name || 'Unknown'}`,
        is_group: conv.is_group,
        booking_id: conv.booking_id,
        booking: conv.booking,
        other_participant: conv.other_participant,
        last_message_preview: conv.last_message_preview,
        unread_count: conv.unread_count || 0,
        last_activity_at: conv.last_activity_at,
        user_role: conv.user_role
      }));
      
      setAllConversations(transformedConversations);
      setConversationsLoaded(true);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
      isLoadingConversations.current = false;
    }
  }, [user?.id]);

  const loadMessages = useCallback(async (conversationId: string | number, showLoading = true) => {
    if (isLoadingMessages.current) {
      console.log('Already loading messages, skipping...');
      return;
    }
    
    try {
      isLoadingMessages.current = true;
      if (showLoading) setLoading(true);
      
      console.log('Loading messages for conversation:', conversationId);
      
      // Load messages using the standard messages API
      const response = await api.get('/messages/', {
        params: {
          conversation: conversationId,
          ordering: 'created_at'  // Oldest first
        }
      });
      
      const backendMessages = response.data.results || response.data || [];
      console.log('Loaded messages:', backendMessages.length, backendMessages);
      
      // Transform backend messages to match our frontend format
      const transformedMessages = backendMessages.map(msg => ({
        id: msg.id,
        message_id: msg.message_id || `msg_${msg.id}`,
        conversation: conversationId,
        sender: msg.sender?.id || msg.sender,
        sender_display_name: msg.sender?.display_name || msg.sender_display_name || 'Unknown',
        sender_profile_picture: msg.sender?.profile_picture_url || msg.sender?.profile_picture || msg.sender_profile_picture,
        content: msg.content,
        message_type: msg.message_type || 'text',
        status: msg.status || 'delivered',
        is_own_message: msg.sender?.id === user?.id || msg.sender === user?.id,
        is_edited: msg.is_edited || false,
        created_at: msg.created_at,
        updated_at: msg.updated_at
      }));
      
      setMessages(transformedMessages);
      
      // Mark conversation as read when messages are loaded
      try {
        await api.post(`/messages/conversations/${conversationId}/mark_as_read/`);
        console.log('Marked conversation as read:', conversationId);
      } catch (readError) {
        console.log('Could not mark conversation as read:', readError);
      }
      
      // Update conversation unread count in local state
      setAllConversations(prev => prev.map(conv => 
        conv.id === conversationId 
          ? { ...conv, unread_count: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
      toast.error('Failed to load messages');
    } finally {
      if (showLoading) setLoading(false);
      isLoadingMessages.current = false;
    }
  }, [user]);

  const loadAvailableUsers = async () => {
    // For booking-centric messaging, we don't need to load available users
    // Users can only message through existing bookings
    setAvailableUsers([]);
  };
  
  // Load conversations on mount
  useEffect(() => {
    if (user && !conversationsLoaded && !isLoadingConversations.current) {
      loadConversations();
      loadAvailableUsers();
    }
  }, [user?.id, conversationsLoaded]);

  // Handle navigation from booking detail page
  useEffect(() => {
    const state = location.state as any;
    if (state?.bookingConversation) {
      // Add the booking conversation to the list if not already there
      setAllConversations(prev => {
        const exists = prev.find(conv => conv.id === state.bookingConversation.id);
        if (!exists) {
          return [state.bookingConversation, ...prev];
        }
        return prev;
      });
      
      // Select the conversation
      setSelectedConversation(state.bookingConversation);
      setMobileView('chat');
      
      // Clear the navigation state
      navigate('/messages', { replace: true });
    }
  }, [location.state, navigate]);
  
  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);
  
  // Scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Removed focus management since isolated MessageInput component handles this automatically
  
  // Auto-refresh conversations every 30 seconds - disabled for now to prevent focus issues
  // useEffect(() => {
  //   if (conversationsLoaded && !isLoadingConversations.current) {
  //     const interval = setInterval(() => {
  //       if (!isLoadingConversations.current) {
  //         loadConversations();
  //       }
  //     }, 30000);
  //     return () => clearInterval(interval);
  //   }
  // }, [conversationsLoaded]);
  
  // Auto-refresh messages every 30 seconds when conversation is active - DISABLED FOR DEBUGGING
  // useEffect(() => {
  //   if (selectedConversation) {
  //     const interval = setInterval(() => {
  //       loadMessages(selectedConversation.id, false);
  //     }, 30000);
  //     return () => clearInterval(interval);
  //   }
  // }, [selectedConversation]);
  
  // MEMOIZED filtering to prevent excessive re-renders
  const filteredConversationsByRole = useMemo(() => {
    console.log('🎯 Filtering conversations by role:', conversationFilter, 'from', allConversations.length);
    console.log('🔍 Sample conversation data:', allConversations[0]);
    
    if (conversationFilter === 'all') {
      // Show ALL conversations including support/dispute
      return allConversations;
    } else if (conversationFilter === 'renter') {
      // Show ONLY booking conversations (not support/dispute) - filter by conversation type, not user role
      return allConversations.filter(conv => {
        // Accept conversations that are booking-related or have booking_id (excluding support/dispute)
        const isBookingType = conv.conversation_type === 'booking' || 
                             conv.conversation_type === 'inquiry' ||
                             (conv.booking_id && conv.conversation_type !== 'support' && conv.conversation_type !== 'dispute') ||
                             (conv.conversation_type !== 'support' && conv.conversation_type !== 'dispute' && conv.user_role === 'renter');
        console.log('🔍 Renter filter - conv:', conv.id, 'type:', conv.conversation_type, 'booking_id:', conv.booking_id, 'user_role:', conv.user_role, 'isBookingType:', isBookingType);
        return isBookingType;
      });
    } else if (conversationFilter === 'host') {
      // Show ONLY listing conversations (not support/dispute) - filter by conversation type, not user role  
      return allConversations.filter(conv => {
        const isListingType = conv.conversation_type === 'listing' || 
                             (conv.conversation_type !== 'support' && conv.conversation_type !== 'dispute' && conv.conversation_type !== 'booking' && conv.conversation_type !== 'inquiry') ||
                             (conv.conversation_type !== 'support' && conv.conversation_type !== 'dispute' && conv.user_role === 'host');
        console.log('🔍 Host filter - conv:', conv.id, 'type:', conv.conversation_type, 'booking_id:', conv.booking_id, 'user_role:', conv.user_role, 'isListingType:', isListingType);
        return isListingType;
      });
    } else if (conversationFilter === 'support') {
      // Show ONLY support/dispute conversations
      return allConversations.filter(conv => {
        const isSupportType = conv.conversation_type === 'support' || conv.conversation_type === 'dispute';
        console.log('🔍 Support filter - conv:', conv.id, 'type:', conv.conversation_type, 'booking_id:', conv.booking_id, 'user_role:', conv.user_role, 'isSupportType:', isSupportType);
        return isSupportType;
      });
    }
    return allConversations;
  }, [conversationFilter, allConversations]);
  
  const sendMessage = useCallback(async (messageContent: string) => {
    console.log('📤 sendMessage called - message:', messageContent?.slice(0, 10) + '...', 'selected:', selectedConversation?.id, 'sending:', sendingMessage);
    if (!messageContent.trim() || !selectedConversation || sendingMessage) return;
    
    setSendingMessage(true);
    try {
      // Send message via API using conversation ID
      const messageData = {
        content: messageContent.trim(),
        conversation: selectedConversation.id,
        message_type: 'text'
      };
      
      console.log('Sending message via API:', messageData);
      const response = await api.post('/messages/', messageData);
      console.log('Message sent successfully:', response.data);
      
      // Create message object for UI
      const newMessageObj = {
        id: response.data.id || Date.now(),
        message_id: response.data.message_id || `msg_${Date.now()}`,
        conversation: selectedConversation.id,
        sender: user?.id,
        sender_display_name: user?.first_name + ' ' + user?.last_name || 'You',
        sender_profile_picture: user?.profile_picture_url || user?.profile_picture,
        content: messageContent.trim(),
        message_type: 'text',
        status: 'sent',
        is_own_message: true,
        is_edited: false,
        created_at: response.data.created_at || new Date().toISOString(),
        updated_at: response.data.updated_at || new Date().toISOString()
      };
      
      // Add to local state
      setMessages(prev => [...prev, newMessageObj]);
      
      setNewMessage(''); // Clear parent state
      
      // Update conversation's last activity
      setAllConversations(prev => prev.map(conv => 
        conv.id === selectedConversation.id
          ? { 
              ...conv, 
              last_activity_at: new Date().toISOString(),
              last_message_preview: {
                content: messageContent.trim(),
                sender_display_name: user?.first_name + ' ' + user?.last_name || 'You',
                created_at: new Date().toISOString(),
                message_type: 'text'
              }
            }
          : conv
      ));
      
      toast.success('Message sent successfully!');
      
      // Refresh messages after a short delay to get any updated data from backend
      setTimeout(() => {
        loadMessages(selectedConversation.id, false);
      }, 1000);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  }, [selectedConversation, sendingMessage, user]);

  // Keep refs updated
  sendMessageRef.current = sendMessage;
  conversationsRef.current = allConversations;
  
  const createNewConversation = async () => {
    // For booking-centric messaging, conversations are created automatically with bookings
    toast.info('Conversations are created automatically when you make a booking');
    setShowNewConversationDialog(false);
  };
  
  const handleConversationSelect = useCallback((conversation: Conversation) => {
    setSelectedConversation(conversation);
    setMobileView('chat');
  }, []);
  
  
  // Debug helpers - add to window for console testing
  React.useEffect(() => {
    // @ts-ignore
    window.setTestToken = (token: string) => {
      localStorage.setItem('token', token);
      console.log('Set DRF token:', token);
    };
    
    // @ts-ignore
    window.setTestUser = async () => {
      try {
        // Set testuser token
        localStorage.setItem('token', '68d006a0f436d37fab4f05918c55d8cbd95e81a1');
        console.log('Set testuser@example.com token');
        
        // Reload conversations
        await loadConversations();
      } catch (error) {
        console.error('Error setting test user:', error);
      }
    };
    
    // @ts-ignore
    window.checkAuth = async () => {
      try {
        const response = await api.get('/users/me/');
        console.log('Current authenticated user:', response.data);
      } catch (error) {
        console.error('Authentication error:', error);
      }
    };
  }, [loadConversations]);

  const filteredConversations = useMemo(() => {
    console.log('🔍 Filtering conversations by search:', filteredConversationsByRole.length, 'searchQuery:', searchQuery);
    return filteredConversationsByRole.filter(conv => {
      if (!searchQuery) return true;
      
      const query = searchQuery.toLowerCase();
      return (
        conv.title?.toLowerCase().includes(query) ||
        conv.other_participant?.display_name.toLowerCase().includes(query) ||
        conv.last_message_preview?.content.toLowerCase().includes(query)
      );
    });
  }, [filteredConversationsByRole, searchQuery]);
  
  const formatMessageTime = useCallback((timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  }, []);
  
  // MEMOIZED conversation title lookup to prevent recalculation
  const conversationTitles = useMemo(() => {
    console.log('🏗️ Building conversation titles cache for', filteredConversationsByRole.length, 'conversations');
    const titlesMap = new Map<string | number, string>();
    
    filteredConversationsByRole.forEach(conversation => {
      let title = 'Conversation';
      if (conversation.title) title = conversation.title;
      else if (conversation.other_participant?.display_name) {
        title = conversation.other_participant.display_name;
      } else if (conversation.other_participant?.first_name && conversation.other_participant?.last_name) {
        title = `${conversation.other_participant.first_name} ${conversation.other_participant.last_name}`;
      } else if (conversation.other_participant?.first_name) {
        title = conversation.other_participant.first_name;
      } else if (conversation.other_participant?.email) {
        title = conversation.other_participant.email;
      }
      titlesMap.set(conversation.id, title);
    });
    
    return titlesMap;
  }, [filteredConversationsByRole]);

  // MEMOIZED conversation avatar lookup to prevent recalculation
  const conversationAvatars = useMemo(() => {
    console.log('🏗️ Building conversation avatars cache for', filteredConversationsByRole.length, 'conversations');
    const avatarsMap = new Map<string | number, string>();
    
    filteredConversationsByRole.forEach(conversation => {
      let avatar = 'C';
      if (conversation.other_participant?.profile_picture_url || conversation.other_participant?.profile_picture) {
        avatar = conversation.other_participant.profile_picture_url || conversation.other_participant.profile_picture;
      } else if (conversation.other_participant?.display_name) {
        avatar = conversation.other_participant.display_name.charAt(0);
      } else if (conversation.other_participant?.first_name) {
        avatar = conversation.other_participant.first_name.charAt(0);
      } else if (conversation.other_participant?.email) {
        avatar = conversation.other_participant.email.charAt(0);
      } else if (conversation.title) {
        avatar = conversation.title.charAt(0);
      }
      avatarsMap.set(conversation.id, avatar);
    });
    
    return avatarsMap;
  }, [filteredConversationsByRole]);

  // Fast lookup functions (no recalculation)
  const getConversationTitle = useCallback((conversation: Conversation) => {
    return conversationTitles.get(conversation.id) || 'Conversation';
  }, [conversationTitles]);
  
  const getConversationAvatar = useCallback((conversation: Conversation) => {
    return conversationAvatars.get(conversation.id) || 'C';
  }, [conversationAvatars]);

  // Get conversation type information for display
  const getConversationTypeInfo = useCallback((conversation: Conversation) => {
    switch (conversation.conversation_type) {
      case 'booking':
        return { 
          label: 'Booking', 
          color: 'primary' as const, 
          icon: '🅿️',
          statusIcon: '🟢',
          bgColor: '#e3f2fd' 
        };
      case 'support':
        return { 
          label: 'Support', 
          color: 'secondary' as const, 
          icon: '🛡️',
          statusIcon: '🔵',
          bgColor: '#f3e5f5'
        };
      case 'inquiry':
      case 'listing_inquiry':
        return { 
          label: 'Inquiry', 
          color: 'info' as const, 
          icon: '❓',
          statusIcon: '🟡',
          bgColor: '#fff3e0'
        };
      case 'direct':
        return { 
          label: 'Direct', 
          color: 'default' as const, 
          icon: '💬',
          statusIcon: '🟢',
          bgColor: '#f5f5f5'
        };
      default:
        return { 
          label: 'Chat', 
          color: 'default' as const, 
          icon: '💬',
          statusIcon: '🟢',
          bgColor: '#f5f5f5'
        };
    }
  }, []);
  
  if (!user) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Messages
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please log in to access your messages.
        </Typography>
        <Button 
          variant="contained" 
          onClick={() => navigate('/login')}
          sx={{ mt: 3 }}
        >
          Log In
        </Button>
      </Container>
    );
  }
  
  // Mobile conversation list view
  const ConversationsList = () => (
    <Paper sx={{ 
      height: '100%', 
      maxHeight: '100vh',
      display: 'flex', 
      flexDirection: 'column',
      overflow: 'hidden' // Prevent the paper itself from scrolling
    }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight={600} color="text.primary">
            Messages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Booking Messages
          </Typography>
        </Stack>
        
        <TextField
          fullWidth
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          sx={{ mt: 2 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
        
        {/* Filter Buttons */}
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant={conversationFilter === 'all' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setConversationFilter('all')}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            All
          </Button>
          <Button
            variant={conversationFilter === 'renter' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setConversationFilter('renter')}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            Bookings
          </Button>
          <Button
            variant={conversationFilter === 'host' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setConversationFilter('host')}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            Listings
          </Button>
          <Button
            variant={conversationFilter === 'support' ? 'contained' : 'outlined'}
            size="small"
            onClick={() => setConversationFilter('support')}
            sx={{ minWidth: 'auto', px: 2 }}
          >
            Support
          </Button>
        </Stack>
      </Box>
      
      {/* Conversations List */}
      <Box 
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          minHeight: 0, // Critical: allows flex child to shrink below content size
          maxHeight: 'calc(100vh - 250px)', // Constrain maximum height
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.3)',
            },
          },
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : filteredConversations.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              {searchQuery ? 'No conversations found' : 'No booking conversations yet'}
            </Typography>
            {!searchQuery && (
              <React.Fragment>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Conversations are created automatically when you book a parking space
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2 }}>
                  Debug: {filteredConversations.length} filtered, {allConversations.length} total conversations
                </Typography>
                <Button 
                  variant="outlined" 
                  size="small"
                  onClick={() => {
                    console.log('Refreshing conversations...');
                    setConversationsLoaded(false);
                    loadConversations();
                  }}
                  sx={{ mt: 2 }}
                >
                  Refresh
                </Button>
              </React.Fragment>
            )}
          </Box>
        ) : (
          <List 
            sx={{ 
              py: 0,
              overflow: 'visible', // Allow List to expand naturally within scrollable container
              flex: '1 1 auto' // Allow List to grow and shrink
            }}
          >
            {filteredConversations.map((conversation) => (
              <ListItem key={conversation.id} disablePadding>
                <ListItemButton
                  onClick={() => handleConversationSelect(conversation)}
                  selected={selectedConversation?.id === conversation.id}
                  sx={{
                    py: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    backgroundColor: conversation.unread_count > 0 ? 
                      alpha(getConversationTypeInfo(conversation).bgColor, 0.3) : 
                      'transparent',
                    '&:hover': {
                      backgroundColor: conversation.unread_count > 0 ? 
                        alpha(getConversationTypeInfo(conversation).bgColor, 0.5) :
                        alpha(theme.palette.action.hover, 0.04),
                    },
                    '&.Mui-selected': {
                      bgcolor: alpha(theme.palette.primary.main, 0.08),
                      borderRight: `3px solid ${theme.palette.primary.main}`,
                    },
                    borderLeft: conversation.unread_count > 0 ? 
                      `4px solid ${theme.palette.primary.main}` : 
                      '4px solid transparent',
                  }}
                >
                  <ListItemAvatar>
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <Typography variant="h6" sx={{ fontSize: '1.2rem' }}>
                        {getConversationTypeInfo(conversation).statusIcon}
                      </Typography>
                      <Badge
                        badgeContent={conversation.unread_count}
                        color="error"
                        invisible={conversation.unread_count === 0}
                        sx={{
                          '& .MuiBadge-badge': {
                            fontSize: '0.75rem',
                            height: 20,
                            minWidth: 20,
                            fontWeight: 'bold'
                          }
                        }}
                      >
                        <VerifiedAvatar
                          src={getSecureImageUrl(conversation.other_participant?.profile_picture)}
                          isVerified={conversation.other_participant?.is_verified || false}
                          size={40}
                          sx={{
                            bgcolor: conversation.unread_count > 0 ? 'primary.main' : 'grey.400',
                            color: 'white',
                            fontWeight: 600
                          }}
                        >
                          {getConversationAvatar(conversation)}
                        </VerifiedAvatar>
                      </Badge>
                    </Stack>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography 
                          variant="subtitle2" 
                          fontWeight={conversation.unread_count > 0 ? 700 : 500}
                          noWrap
                          sx={{ 
                            flex: 1,
                            color: conversation.unread_count > 0 ? 'text.primary' : 'text.secondary'
                          }}
                        >
                          {getConversationTitle(conversation)}
                        </Typography>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                            {conversation.last_message_preview ? formatMessageTime(conversation.last_message_preview.created_at) : ''}
                          </Typography>
                          <Chip 
                            label={getConversationTypeInfo(conversation).label}
                            size="small"
                            color={getConversationTypeInfo(conversation).color}
                            variant={conversation.unread_count > 0 ? "filled" : "outlined"}
                            sx={{ 
                              height: 18, 
                              fontSize: '0.65rem',
                              '& .MuiChip-label': { px: 0.8 },
                              fontWeight: conversation.unread_count > 0 ? 600 : 400
                            }}
                          />
                        </Stack>
                      </Stack>
                    }
                    secondary={
                      <React.Fragment>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            noWrap
                            component="span"
                            sx={{ 
                              fontWeight: conversation.unread_count > 0 ? 600 : 400,
                              color: conversation.unread_count > 0 ? 'text.primary' : 'text.secondary',
                              flex: 1
                            }}
                          >
                            {conversation.last_message_preview?.content || 'No messages yet'}
                          </Typography>
                          {conversation.unread_count > 0 && (
                            <Chip
                              label={`${conversation.unread_count} new`}
                              size="small"
                              color="error"
                              variant="filled"
                              sx={{ 
                                height: 16,
                                fontSize: '0.6rem',
                                '& .MuiChip-label': { px: 0.5 },
                                fontWeight: 'bold'
                              }}
                            />
                          )}
                        </Stack>
                      </React.Fragment>
                    }
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Paper>
  );
  
  // Chat view
  const ChatView = () => {
    if (!selectedConversation) {
      return (
        <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              Select a conversation
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Choose a conversation from the list to start messaging
            </Typography>
          </Box>
        </Paper>
      );
    }
    
    return (
      <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Chat Header */}
        <AppBar position="static" elevation={0} sx={{ bgcolor: 'background.paper', color: 'text.primary' }}>
          <Toolbar>
            <IconButton
              edge="start"
              onClick={() => setMobileView('conversations')}
              sx={{ mr: 2, display: { md: 'none' } }}
            >
              <ArrowBackIcon />
            </IconButton>
            
            <VerifiedAvatar
              src={getSecureImageUrl(selectedConversation.other_participant?.profile_picture)}
              isVerified={selectedConversation.other_participant?.is_verified || false}
              size={40}
              sx={{ mr: 2 }}
            >
              {getConversationAvatar(selectedConversation)}
            </VerifiedAvatar>
            
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                {getConversationTitle(selectedConversation)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedConversation.other_participant?.email}
              </Typography>
            </Box>
            
            <IconButton 
              onClick={(e) => setMenuAnchor(e.currentTarget)}
            >
              <MoreVertIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Messages Area */}
        <Box 
          sx={{ 
            flex: 1, 
            overflowY: 'auto', 
            overflowX: 'hidden',
            p: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            minHeight: 0, // Important: allows flex child to shrink
            maxHeight: 'calc(100vh - 200px)' // Ensure it doesn't exceed viewport
          }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : messages.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                No messages yet. Send the first message!
              </Typography>
            </Box>
          ) : (
            messages.map((message) => (
              <MessageItem 
                key={message.id} 
                message={message} 
                formatMessageTime={formatMessageTime} 
              />
            ))
          )}
          <div ref={messagesEndRef} />
        </Box>
        
        {/* Message Input */}
        <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
          
          <MessageInput
            initialValue={newMessage}
            onSubmit={sendMessage}
            disabled={sendingMessage}
            placeholder="Type a message..."
          />
        </Box>
      </Paper>
    );
  };
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Desktop Layout */}
      <Box sx={{ 
        display: { xs: 'none', md: 'flex' }, 
        flex: 1, 
        gap: 1, 
        p: 1,
        minHeight: 0, // Allow flex children to shrink
        overflow: 'hidden' // Prevent parent from scrolling
      }}>
        {/* Conversations Panel */}
        <Box sx={{ 
          width: 400, 
          height: '100%',
          minHeight: 0, // Critical for proper flexbox behavior
          overflow: 'hidden' // Let child components handle their own scrolling
        }}>
          <ConversationsList />
        </Box>
        
        {/* Chat Panel */}
        <Box sx={{ flex: 1, height: '100%' }}>
          <ChatView />
        </Box>
      </Box>
      
      {/* Mobile Layout */}
      <Box sx={{ 
        display: { xs: 'flex', md: 'none' }, 
        flex: 1,
        minHeight: 0, // Allow flex child to shrink
        overflow: 'hidden' // Let child components handle scrolling
      }}>
        {mobileView === 'conversations' ? <ConversationsList /> : <ChatView />}
      </Box>
      
      {/* New Conversation Dialog */}
      <Dialog 
        open={showNewConversationDialog} 
        onClose={() => setShowNewConversationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Booking Messages</DialogTitle>
        <DialogContent>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" gutterBottom>
              Messages are created with bookings
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You can message hosts and renters automatically when you make or receive a booking. 
              This ensures all communication is related to your parking arrangements.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowNewConversationDialog(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Chat Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <InfoIcon sx={{ mr: 1 }} />
          Conversation Info
        </MenuItem>
        <MenuItem onClick={() => setMenuAnchor(null)}>
          <SearchIcon sx={{ mr: 1 }} />
          Search Messages
        </MenuItem>
      </Menu>
      
    </Box>
  );

});

export default Messages;