import { HTMLAttributes } from 'react'

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number
  height?: string | number
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  variant?: 'light' | 'dark'
}

const roundedClasses = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full'
}

export default function Skeleton({ 
  width, 
  height, 
  rounded = 'md',
  variant = 'light',
  className = '',
  style,
  ...props 
}: SkeletonProps) {
  const baseClass = variant === 'light' 
    ? 'bg-white/10 animate-shimmer'
    : 'bg-gray-200 animate-pulse'

  return (
    <div
      className={`${baseClass} ${roundedClasses[rounded]} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
      {...props}
    />
  )
}

// Specialized skeleton components
export function SkeletonCard() {
  return (
    <div className="glass-card p-6 animate-scale-in">
      <div className="flex items-center space-x-4 mb-4">
        <Skeleton width={60} height={60} rounded="full" />
        <div className="flex-1 space-y-2">
          <Skeleton height={20} width="70%" />
          <Skeleton height={16} width="50%" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton height={16} width="100%" />
        <Skeleton height={16} width="85%" />
        <Skeleton height={16} width="60%" />
      </div>
      <div className="mt-6 flex space-x-3">
        <Skeleton height={40} width={120} rounded="lg" />
        <Skeleton height={40} width={80} rounded="lg" />
      </div>
    </div>
  )
}

export function SkeletonParkingCard() {
  return (
    <div className="glass-card overflow-hidden animate-fade-in">
      {/* Image skeleton */}
      <Skeleton height={200} width="100%" rounded="none" />
      
      <div className="p-6">
        {/* Title and location */}
        <div className="mb-4">
          <Skeleton height={24} width="80%" className="mb-2" />
          <Skeleton height={16} width="60%" />
        </div>
        
        {/* Rating and distance */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="flex space-x-1">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} width={16} height={16} rounded="sm" />
            ))}
          </div>
          <Skeleton height={16} width={60} />
        </div>
        
        {/* Amenities */}
        <div className="flex space-x-2 mb-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height={24} width={60} rounded="full" />
          ))}
        </div>
        
        {/* Price and status */}
        <div className="flex items-center justify-between mb-4">
          <Skeleton height={32} width={80} />
          <Skeleton height={24} width={70} rounded="full" />
        </div>
        
        {/* Book button */}
        <Skeleton height={44} width="100%" rounded="lg" />
      </div>
    </div>
  )
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-6">
      {[...Array(count)].map((_, i) => (
        <SkeletonParkingCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="glass-card p-8 space-y-6">
      <div className="text-center">
        <Skeleton height={32} width="60%" className="mx-auto mb-2" />
        <Skeleton height={20} width="80%" className="mx-auto" />
      </div>
      
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i}>
            <Skeleton height={16} width={100} className="mb-2" />
            <Skeleton height={48} width="100%" rounded="lg" />
          </div>
        ))}
      </div>
      
      <div className="flex space-x-4">
        <Skeleton height={48} width="50%" rounded="lg" />
        <Skeleton height={48} width="50%" rounded="lg" />
      </div>
    </div>
  )
}

export function SkeletonProfile() {
  return (
    <div className="glass-card p-8">
      <div className="flex items-center space-x-6 mb-8">
        <Skeleton width={120} height={120} rounded="full" />
        <div className="flex-1 space-y-3">
          <Skeleton height={28} width="40%" />
          <Skeleton height={20} width="30%" />
          <Skeleton height={16} width="60%" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i}>
            <Skeleton height={16} width={80} className="mb-2" />
            <Skeleton height={40} width="100%" rounded="lg" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function SkeletonStats() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="glass-card p-6 text-center">
          <Skeleton width={48} height={48} rounded="lg" className="mx-auto mb-4" />
          <Skeleton height={32} width="80%" className="mx-auto mb-2" />
          <Skeleton height={16} width="60%" className="mx-auto" />
        </div>
      ))}
    </div>
  )
}