import { HTMLAttributes } from 'react'

interface LoadingSpinnerProps extends HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'secondary' | 'accent' | 'white'
  text?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

const variantClasses = {
  primary: 'border-primary-600 border-t-transparent',
  secondary: 'border-secondary-600 border-t-transparent',
  accent: 'border-accent-600 border-t-transparent',
  white: 'border-white border-t-transparent'
}

export default function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  text,
  className = '',
  ...props 
}: LoadingSpinnerProps) {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`} {...props}>
      <div className={`
        ${sizeClasses[size]} 
        ${variantClasses[variant]}
        border-4 rounded-full animate-spin
      `} />
      {text && (
        <p className="mt-3 text-sm font-medium text-white/70 animate-pulse">
          {text}
        </p>
      )}
    </div>
  )
}

// Specialized loading spinners for different contexts
export function PulseLoader({ size = 'md', variant = 'primary' }: Omit<LoadingSpinnerProps, 'text'>) {
  return (
    <div className="flex space-x-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} 
            bg-gradient-to-r from-primary-400 to-primary-600 
            rounded-full animate-pulse
          `}
          style={{
            animationDelay: `${i * 0.2}s`,
            animationDuration: '1.4s'
          }}
        />
      ))}
    </div>
  )
}

export function BouncingDots({ size = 'md' }: Pick<LoadingSpinnerProps, 'size'>) {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`
            ${sizeClasses[size]} 
            bg-gradient-to-r from-accent-400 to-accent-600 
            rounded-full animate-bounce
          `}
          style={{
            animationDelay: `${i * 0.15}s`
          }}
        />
      ))}
    </div>
  )
}

export function WaveLoader() {
  return (
    <div className="flex items-end space-x-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-2 bg-gradient-to-t from-primary-600 to-primary-400 rounded-full animate-pulse"
          style={{
            height: `${16 + (i % 2) * 8}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

export function GlowPulse({ size = 'lg' }: Pick<LoadingSpinnerProps, 'size'>) {
  return (
    <div className="relative flex items-center justify-center">
      <div className={`
        ${sizeClasses[size]} 
        bg-gradient-to-r from-primary-400 to-accent-400 
        rounded-full animate-ping opacity-75
      `} />
      <div className={`
        absolute ${sizeClasses[size]} 
        bg-gradient-to-r from-primary-600 to-accent-600 
        rounded-full animate-pulse
      `} />
    </div>
  )
}