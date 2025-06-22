import { ReactNode, useState, useRef, useEffect } from 'react'
import { EyeIcon, EyeSlashIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'

interface FormFieldProps {
  label: string
  name: string
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number'
  placeholder?: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void
  error?: string
  success?: string
  required?: boolean
  disabled?: boolean
  icon?: ReactNode
  suffix?: ReactNode
  className?: string
}

export function FormField({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  success,
  required,
  disabled,
  icon,
  suffix,
  className = ''
}: FormFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true)
    onFocus?.(e)
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false)
    onBlur?.(e)
  }

  const inputType = type === 'password' && showPassword ? 'text' : type
  const hasValue = value && value.length > 0

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <label 
        htmlFor={name}
        className={`
          absolute left-4 transition-all duration-200 pointer-events-none
          ${isFocused || hasValue 
            ? 'top-2 text-xs text-white/80 transform scale-90' 
            : 'top-4 text-base text-white/60'
          }
          ${error ? 'text-red-400' : success ? 'text-green-400' : ''}
        `}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {icon && (
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/60">
            {icon}
          </div>
        )}

        {/* Input */}
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          disabled={disabled}
          className={`
            w-full pt-6 pb-2 px-4 rounded-2xl transition-all duration-300
            bg-white/10 backdrop-blur-sm border-2 text-white placeholder-white/40
            focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed
            ${icon ? 'pl-12' : 'pl-4'}
            ${type === 'password' ? 'pr-12' : suffix ? 'pr-12' : 'pr-4'}
            ${error 
              ? 'border-red-400/50 focus:border-red-400 bg-red-500/10' 
              : success 
              ? 'border-green-400/50 focus:border-green-400 bg-green-500/10'
              : 'border-white/20 focus:border-primary-400 hover:border-white/30'
            }
            ${isFocused ? 'scale-[1.02] shadow-glow' : ''}
          `}
        />

        {/* Password Toggle / Right Icon */}
        {type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Suffix */}
        {suffix && type !== 'password' && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60">
            {suffix}
          </div>
        )}

        {/* Status Icon */}
        {(error || success) && (
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
            {error ? (
              <XCircleIcon className="h-5 w-5 text-red-400" />
            ) : (
              <CheckCircleIcon className="h-5 w-5 text-green-400" />
            )}
          </div>
        )}
      </div>

      {/* Error/Success Message */}
      {(error || success) && (
        <div className={`mt-2 text-sm flex items-center space-x-2 animate-fade-in ${
          error ? 'text-red-400' : 'text-green-400'
        }`}>
          {error ? (
            <XCircleIcon className="h-4 w-4 flex-shrink-0" />
          ) : (
            <CheckCircleIcon className="h-4 w-4 flex-shrink-0" />
          )}
          <span>{error || success}</span>
        </div>
      )}
    </div>
  )
}

interface FormSelectProps {
  label: string
  name: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void
  options: { value: string; label: string }[]
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormSelect({
  label,
  name,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required,
  disabled,
  className = ''
}: FormSelectProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <label 
        htmlFor={name}
        className={`
          absolute left-4 transition-all duration-200 pointer-events-none z-10
          ${isFocused || hasValue 
            ? 'top-2 text-xs text-white/80 transform scale-90' 
            : 'top-4 text-base text-white/60'
          }
          ${error ? 'text-red-400' : ''}
        `}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Select */}
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        disabled={disabled}
        className={`
          w-full pt-6 pb-2 px-4 rounded-2xl transition-all duration-300 appearance-none
          bg-white/10 backdrop-blur-sm border-2 text-white
          focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-400/50 focus:border-red-400 bg-red-500/10' 
            : 'border-white/20 focus:border-primary-400 hover:border-white/30'
          }
          ${isFocused ? 'scale-[1.02] shadow-glow' : ''}
        `}
      >
        <option value="" disabled className="bg-gray-800 text-gray-300">
          {placeholder}
        </option>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-gray-800 text-white">
            {option.label}
          </option>
        ))}
      </select>

      {/* Dropdown Arrow */}
      <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
        <svg className="h-5 w-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm flex items-center space-x-2 text-red-400 animate-fade-in">
          <XCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormTextareaProps {
  label: string
  name: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  placeholder?: string
  rows?: number
  error?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function FormTextarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  required,
  disabled,
  className = ''
}: FormTextareaProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value && value.length > 0

  return (
    <div className={`relative ${className}`}>
      {/* Label */}
      <label 
        htmlFor={name}
        className={`
          absolute left-4 transition-all duration-200 pointer-events-none z-10
          ${isFocused || hasValue 
            ? 'top-2 text-xs text-white/80 transform scale-90' 
            : 'top-4 text-base text-white/60'
          }
          ${error ? 'text-red-400' : ''}
        `}
      >
        {label} {required && <span className="text-red-400">*</span>}
      </label>

      {/* Textarea */}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={isFocused ? placeholder : ''}
        rows={rows}
        disabled={disabled}
        className={`
          w-full pt-6 pb-2 px-4 rounded-2xl transition-all duration-300 resize-none
          bg-white/10 backdrop-blur-sm border-2 text-white placeholder-white/40
          focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed
          ${error 
            ? 'border-red-400/50 focus:border-red-400 bg-red-500/10' 
            : 'border-white/20 focus:border-primary-400 hover:border-white/30'
          }
          ${isFocused ? 'scale-[1.02] shadow-glow' : ''}
        `}
      />

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm flex items-center space-x-2 text-red-400 animate-fade-in">
          <XCircleIcon className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

interface FormButtonProps {
  children: ReactNode
  type?: 'button' | 'submit' | 'reset'
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  className?: string
}

export function FormButton({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  onClick,
  className = ''
}: FormButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const baseClasses = 'relative font-semibold rounded-2xl transition-all duration-300 focus:outline-none focus:ring-4 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95 overflow-hidden'
  
  const variantClasses = {
    primary: 'bg-gradient-primary text-white hover:shadow-glow focus:ring-primary-500/30',
    secondary: 'bg-white/10 text-white border-2 border-white/20 hover:bg-white/20 focus:ring-white/30',
    accent: 'bg-gradient-accent text-white hover:shadow-glow-accent focus:ring-accent-500/30',
    ghost: 'text-white hover:bg-white/10 focus:ring-white/30'
  }
  
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        ${baseClasses} 
        ${variantClasses[variant]} 
        ${sizeClasses[size]}
        ${isPressed ? 'scale-95' : 'hover:scale-105'}
        ${className}
      `}
    >
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] hover:translate-x-[100%] transition-transform duration-700" />
      
      {/* Content */}
      <div className="relative flex items-center justify-center space-x-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        <span>{children}</span>
      </div>
    </button>
  )
}