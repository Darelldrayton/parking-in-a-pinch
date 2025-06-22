import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  TextField,
  Stack,
  Avatar,
  Chip,
  Divider,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  Alert,
  useTheme,
  alpha,
  Fab,
  Slide,
  CircularProgress,
} from '@mui/material';
import {
  Chat,
  Send,
  AttachFile,
  EmojiEmotions,
  Close,
  Minimize,
  MoreVert,
  SupportAgent,
  Phone,
  VideoCall,
  Star,
  Feedback,
  QuestionAnswer,
  Priority,
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: MessageAttachment[];
  type: 'text' | 'image' | 'file' | 'system' | 'quick_reply';
  quick_replies?: QuickReply[];
}

interface MessageAttachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  size: number;
}

interface QuickReply {
  id: string;
  text: string;
  payload: string;
}

interface ChatSession {
  id: string;
  status: 'waiting' | 'active' | 'ended';
  agent?: {
    id: string;
    name: string;
    avatar?: string;
    title: string;
  };
  queue_position?: number;
  estimated_wait_time?: number;
  started_at?: Date;
  ended_at?: Date;
  satisfaction_rating?: number;
}

interface SupportTopic {
  id: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'booking' | 'payment' | 'technical' | 'safety' | 'general';
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const LiveChat: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<SupportTopic | null>(null);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [showTopics, setShowTopics] = useState(true);
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);

  const supportTopics: SupportTopic[] = [
    {
      id: 'booking_issue',
      title: 'Booking Issues',
      description: 'Problems with making or managing bookings',
      priority: 'high',
      category: 'booking',
    },
    {
      id: 'payment_problem',
      title: 'Payment Problems',
      description: 'Payment failures, refunds, or billing questions',
      priority: 'high',
      category: 'payment',
    },
    {
      id: 'safety_concern',
      title: 'Safety Concern',
      description: 'Safety issues or emergency situations',
      priority: 'urgent',
      category: 'safety',
    },
    {
      id: 'technical_support',
      title: 'Technical Support',
      description: 'App issues, bugs, or technical problems',
      priority: 'medium',
      category: 'technical',
    },
    {
      id: 'account_help',
      title: 'Account Help',
      description: 'Profile, settings, or account-related questions',
      priority: 'medium',
      category: 'general',
    },
    {
      id: 'general_question',
      title: 'General Question',
      description: 'Other questions or feedback',
      priority: 'low',
      category: 'general',
    },
  ];

  const quickReplies: QuickReply[] = [
    { id: 'yes', text: 'Yes', payload: 'yes' },
    { id: 'no', text: 'No', payload: 'no' },
    { id: 'help', text: 'I need help', payload: 'help' },
    { id: 'thanks', text: 'Thank you', payload: 'thanks' },
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (session?.status === 'active') {
      // Simulate agent typing
      const typingTimer = setTimeout(() => {
        setTyping(false);
      }, 2000);

      return () => clearTimeout(typingTimer);
    }
  }, [session]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const startChatSession = useCallback(async (topic: SupportTopic) => {
    setLoading(true);
    setSelectedTopic(topic);
    setShowTopics(false);

    try {
      // Simulate API call to start chat session
      await new Promise(resolve => setTimeout(resolve, 1000));

      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        status: topic.priority === 'urgent' ? 'active' : 'waiting',
        queue_position: topic.priority === 'urgent' ? undefined : Math.floor(Math.random() * 5) + 1,
        estimated_wait_time: topic.priority === 'urgent' ? undefined : Math.floor(Math.random() * 10) + 2,
      };

      setSession(newSession);

      // Add welcome message
      const welcomeMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: topic.priority === 'urgent' 
          ? 'Connecting you to an agent immediately for this urgent matter...'
          : `You're in the queue for ${topic.title}. Estimated wait time: ${newSession.estimated_wait_time} minutes.`,
        sender: 'system',
        timestamp: new Date(),
        status: 'delivered',
        type: 'text',
      };

      setMessages([welcomeMessage]);

      // Simulate agent connection for urgent issues
      if (topic.priority === 'urgent') {
        setTimeout(() => {
          connectToAgent();
        }, 3000);
      } else {
        // Simulate queue progression
        setTimeout(() => {
          connectToAgent();
        }, 8000);
      }
    } catch (error) {
      toast.error('Failed to start chat session');
    } finally {
      setLoading(false);
    }
  }, []);

  const connectToAgent = useCallback(() => {
    const agent = {
      id: 'agent-1',
      name: 'Sarah Wilson',
      avatar: '/api/placeholder/32/32',
      title: 'Customer Support Specialist',
    };

    setSession(prev => prev ? {
      ...prev,
      status: 'active',
      agent,
      started_at: new Date(),
    } : null);

    const agentMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: `Hi ${user?.first_name || 'there'}! I'm Sarah and I'll be helping you today. How can I assist you with your ${selectedTopic?.title.toLowerCase()}?`,
      sender: 'agent',
      timestamp: new Date(),
      status: 'delivered',
      type: 'text',
      quick_replies: quickReplies,
    };

    setMessages(prev => [...prev, agentMessage]);
    setTyping(false);
  }, [user, selectedTopic]);

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !session) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: newMessage,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      type: 'text',
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setTyping(true);

    // Simulate sending
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === userMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 1000);

    // Simulate agent response
    setTimeout(() => {
      const responses = [
        "I understand your concern. Let me help you with that.",
        "That's a great question! Let me check that for you.",
        "I can definitely help you resolve this issue.",
        "Let me look into this for you right away.",
        "I see what you mean. Here's what we can do...",
      ];

      const agentResponse: ChatMessage = {
        id: `msg-${Date.now()}`,
        text: responses[Math.floor(Math.random() * responses.length)],
        sender: 'agent',
        timestamp: new Date(),
        status: 'delivered',
        type: 'text',
      };

      setMessages(prev => [...prev, agentResponse]);
      setTyping(false);
    }, 3000);
  }, [newMessage, session]);

  const sendQuickReply = useCallback((reply: QuickReply) => {
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: reply.text,
      sender: 'user',
      timestamp: new Date(),
      status: 'delivered',
      type: 'quick_reply',
    };

    setMessages(prev => [...prev, userMessage]);
  }, []);

  const endChat = useCallback(() => {
    if (session?.agent) {
      setShowRating(true);
    } else {
      setIsOpen(false);
      setSession(null);
      setMessages([]);
      setShowTopics(true);
    }
  }, [session]);

  const submitRating = useCallback(async () => {
    try {
      // Submit rating to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success('Thank you for your feedback!');
      setShowRating(false);
      setIsOpen(false);
      setSession(null);
      setMessages([]);
      setShowTopics(true);
      setRating(0);
    } catch (error) {
      toast.error('Failed to submit rating');
    }
  }, [rating]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    const attachment: MessageAttachment = {
      id: `file-${Date.now()}`,
      name: file.name,
      url: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: file.size,
    };

    const fileMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: `Shared ${file.name}`,
      sender: 'user',
      timestamp: new Date(),
      status: 'sending',
      type: file.type.startsWith('image/') ? 'image' : 'file',
      attachments: [attachment],
    };

    setMessages(prev => [...prev, fileMessage]);

    // Simulate upload
    setTimeout(() => {
      setMessages(prev => 
        prev.map(msg => 
          msg.id === fileMessage.id 
            ? { ...msg, status: 'delivered' as const }
            : msg
        )
      );
    }, 2000);
  }, []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#f44336';
      case 'high': return '#ff9800';
      case 'medium': return '#2196f3';
      case 'low': return '#4caf50';
      default: return '#666';
    }
  };

  if (!isOpen) {
    return (
      <Fab
        color="primary"
        onClick={() => setIsOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <Chat />
      </Fab>
    );
  }

  return (
    <>
      <Card
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 400,
          height: isMinimized ? 60 : 600,
          zIndex: 1000,
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'height 0.3s ease',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'white',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: isMinimized ? 'pointer' : 'default',
          }}
          onClick={isMinimized ? () => setIsMinimized(false) : undefined}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <SupportAgent />
            <Box>
              <Typography variant="subtitle1" fontWeight={600}>
                {session?.agent ? session.agent.name : 'Customer Support'}
              </Typography>
              {session?.agent && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  {session.agent.title}
                </Typography>
              )}
              {session?.status === 'waiting' && (
                <Typography variant="caption" sx={{ opacity: 0.8 }}>
                  Position in queue: {session.queue_position}
                </Typography>
              )}
            </Box>
          </Stack>

          <Stack direction="row">
            <IconButton
              size="small"
              onClick={() => setIsMinimized(!isMinimized)}
              sx={{ color: 'white' }}
            >
              <Minimize />
            </IconButton>
            <IconButton
              size="small"
              onClick={(e) => setMenuAnchor(e.currentTarget)}
              sx={{ color: 'white' }}
            >
              <MoreVert />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{ color: 'white' }}
            >
              <Close />
            </IconButton>
          </Stack>
        </Box>

        {!isMinimized && (
          <CardContent sx={{ p: 0, height: 'calc(100% - 64px)', display: 'flex', flexDirection: 'column' }}>
            {/* Support Topics */}
            {showTopics && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  How can we help you?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Choose a topic to get started
                </Typography>

                <Stack spacing={2}>
                  {supportTopics.map((topic) => (
                    <Card
                      key={topic.id}
                      sx={{
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: theme.shadows[4],
                        },
                      }}
                      onClick={() => startChatSession(topic)}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Box>
                            <Typography variant="subtitle2" fontWeight={500}>
                              {topic.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {topic.description}
                            </Typography>
                          </Box>
                          <Chip
                            label={topic.priority}
                            size="small"
                            sx={{
                              bgcolor: alpha(getPriorityColor(topic.priority), 0.1),
                              color: getPriorityColor(topic.priority),
                              fontWeight: 500,
                            }}
                          />
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Chat Messages */}
            {!showTopics && (
              <>
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  <Stack spacing={2}>
                    {messages.map((message) => (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                          alignItems: 'flex-end',
                          gap: 1,
                        }}
                      >
                        {message.sender === 'agent' && (
                          <Avatar
                            src={session?.agent?.avatar}
                            sx={{ width: 24, height: 24 }}
                          >
                            <SupportAgent />
                          </Avatar>
                        )}

                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: message.sender === 'user' 
                              ? 'primary.main' 
                              : message.sender === 'system'
                              ? alpha(theme.palette.info.main, 0.1)
                              : alpha(theme.palette.grey[500], 0.1),
                            color: message.sender === 'user' ? 'white' : 'text.primary',
                          }}
                        >
                          <Typography variant="body2">
                            {message.text}
                          </Typography>

                          {message.attachments && (
                            <Box sx={{ mt: 1 }}>
                              {message.attachments.map((attachment) => (
                                <Box key={attachment.id}>
                                  {attachment.type === 'image' ? (
                                    <img
                                      src={attachment.url}
                                      alt={attachment.name}
                                      style={{
                                        maxWidth: '100%',
                                        height: 'auto',
                                        borderRadius: 4,
                                      }}
                                    />
                                  ) : (
                                    <Chip
                                      icon={<AttachFile />}
                                      label={attachment.name}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                </Box>
                              ))}
                            </Box>
                          )}

                          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </Box>
                      </Box>
                    ))}

                    {typing && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar
                          src={session?.agent?.avatar}
                          sx={{ width: 24, height: 24 }}
                        >
                          <SupportAgent />
                        </Avatar>
                        <Box
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.grey[500], 0.1),
                          }}
                        >
                          <Stack direction="row" spacing={0.5}>
                            <CircularProgress size={4} />
                            <CircularProgress size={4} />
                            <CircularProgress size={4} />
                          </Stack>
                        </Box>
                      </Box>
                    )}

                    <div ref={messagesEndRef} />
                  </Stack>
                </Box>

                {/* Quick Replies */}
                {messages.length > 0 && messages[messages.length - 1]?.quick_replies && (
                  <Box sx={{ p: 2, pt: 0 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {messages[messages.length - 1].quick_replies!.map((reply) => (
                        <Chip
                          key={reply.id}
                          label={reply.text}
                          variant="outlined"
                          size="small"
                          onClick={() => sendQuickReply(reply)}
                          sx={{ cursor: 'pointer' }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Message Input */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      multiline
                      maxRows={3}
                    />
                    <IconButton
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <AttachFile />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      color="primary"
                    >
                      <Send />
                    </IconButton>
                  </Stack>
                </Box>
              </>
            )}

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}
          </CardContent>
        )}
      </Card>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          endChat();
        }}>
          End Chat
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          // Request call back
          toast.info('Callback request sent');
        }}>
          <Phone sx={{ mr: 1 }} />
          Request Callback
        </MenuItem>
        <MenuItem onClick={() => {
          setMenuAnchor(null);
          // Start video call
          toast.info('Video call feature coming soon');
        }}>
          <VideoCall sx={{ mr: 1 }} />
          Video Call
        </MenuItem>
      </Menu>

      {/* Rating Dialog */}
      <Dialog
        open={showRating}
        onClose={() => setShowRating(false)}
        TransitionComponent={Transition}
      >
        <DialogTitle>Rate Your Experience</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            How was your chat with {session?.agent?.name}?
          </Typography>

          <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <IconButton
                key={star}
                onClick={() => setRating(star)}
                color={star <= rating ? 'primary' : 'default'}
              >
                <Star />
              </IconButton>
            ))}
          </Stack>

          <Button
            fullWidth
            variant="contained"
            onClick={submitRating}
            disabled={rating === 0}
          >
            Submit Feedback
          </Button>
        </DialogContent>
      </Dialog>

      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        onChange={handleFileUpload}
        accept="image/*,.pdf,.doc,.docx,.txt"
      />
    </>
  );
};

export default LiveChat;