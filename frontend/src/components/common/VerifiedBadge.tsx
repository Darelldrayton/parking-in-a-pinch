import React from 'react';
import {
  Chip,
  Box,
  Tooltip,
  Avatar,
  Badge,
} from '@mui/material';
import {
  Verified as VerifiedIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

interface VerifiedBadgeProps {
  isVerified: boolean;
  variant?: 'badge' | 'checkmark' | 'both';
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

interface VerifiedAvatarProps {
  src?: string;
  alt?: string;
  children?: React.ReactNode;
  isVerified: boolean;
  size?: number;
  sx?: any;
}

// Main verified badge component (green "✓ Verified" chip)
export const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({
  isVerified,
  variant = 'badge',
  size = 'medium',
  className,
}) => {
  if (!isVerified) {
    return null;
  }

  const getSizeProps = () => {
    switch (size) {
      case 'small':
        return {
          fontSize: '0.7rem',
          padding: '2px 8px',
          height: '20px',
        };
      case 'large':
        return {
          fontSize: '0.9rem',
          padding: '6px 16px',
          height: '32px',
        };
      default: // medium
        return {
          fontSize: '0.75rem',
          padding: '4px 12px',
          height: '24px',
        };
    }
  };

  const sizeProps = getSizeProps();

  return (
    <Chip
      icon={<VerifiedIcon sx={{ fontSize: '1em !important' }} />}
      label="Verified"
      size={size === 'large' ? 'medium' : 'small'}
      sx={{
        bgcolor: '#10B981',
        color: 'white',
        fontWeight: 600,
        fontSize: sizeProps.fontSize,
        height: sizeProps.height,
        '& .MuiChip-label': {
          padding: '0 8px',
        },
        '& .MuiChip-icon': {
          color: 'white',
          marginLeft: '8px',
        },
        ...sizeProps,
      }}
      className={className}
    />
  );
};

// Verified checkmark overlay for avatars
export const VerifiedCheckmark: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 18, className }) => (
  <Box
    sx={{
      position: 'absolute',
      bottom: -2,
      right: -2,
      width: size,
      height: size,
      bgcolor: '#10B981',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '2px solid white',
      zIndex: 1,
    }}
    className={className}
  >
    <CheckCircleIcon
      sx={{
        color: 'white',
        fontSize: size * 0.7,
      }}
    />
  </Box>
);

// Avatar with verification checkmark overlay
export const VerifiedAvatar: React.FC<VerifiedAvatarProps> = ({
  src,
  alt,
  children,
  isVerified,
  size = 40,
  sx,
  ...avatarProps
}) => {
  return (
    <Box sx={{ position: 'relative', display: 'inline-block' }}>
      <Avatar
        src={src}
        alt={alt}
        sx={{
          width: size,
          height: size,
          ...sx,
        }}
        {...avatarProps}
      >
        {children}
      </Avatar>
      {isVerified && (
        <Tooltip title="Verified User" arrow>
          <Box>
            <VerifiedCheckmark size={Math.max(16, size * 0.3)} />
          </Box>
        </Tooltip>
      )}
    </Box>
  );
};

// Combined component that shows both badge and checkmark
export const VerifiedIndicator: React.FC<{
  isVerified: boolean;
  showBadge?: boolean;
  showCheckmark?: boolean;
  badgeSize?: 'small' | 'medium' | 'large';
  children?: React.ReactNode;
}> = ({
  isVerified,
  showBadge = true,
  showCheckmark = false,
  badgeSize = 'medium',
  children,
}) => {
  if (!isVerified) {
    return <>{children}</>;
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {children}
      {showBadge && (
        <VerifiedBadge isVerified={isVerified} size={badgeSize} />
      )}
      {showCheckmark && !showBadge && (
        <Tooltip title="Verified User" arrow>
          <VerifiedIcon
            sx={{
              color: '#10B981',
              fontSize: badgeSize === 'small' ? 16 : badgeSize === 'large' ? 24 : 20,
            }}
          />
        </Tooltip>
      )}
    </Box>
  );
};

export default VerifiedBadge;