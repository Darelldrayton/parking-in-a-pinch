import { ReactNode, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

interface PageTransitionProps {
  children: ReactNode
  className?: string
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('fadeIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('fadeOut')
    }
  }, [location, displayLocation])

  return (
    <div
      className={`${className} transition-opacity duration-300 ease-in-out ${
        transitionStage === 'fadeOut' ? 'opacity-0' : 'opacity-100'
      }`}
      onTransitionEnd={() => {
        if (transitionStage === 'fadeOut') {
          setDisplayLocation(location)
          setTransitionStage('fadeIn')
        }
      }}
    >
      {children}
    </div>
  )
}

// Enhanced transition with slide effects
export function SlideTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('slideIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('slideOut')
    }
  }, [location, displayLocation])

  return (
    <div
      className={`${className} transition-all duration-500 ease-in-out transform ${
        transitionStage === 'slideOut' 
          ? 'opacity-0 translate-x-full' 
          : 'opacity-100 translate-x-0'
      }`}
      onTransitionEnd={() => {
        if (transitionStage === 'slideOut') {
          setDisplayLocation(location)
          setTransitionStage('slideIn')
        }
      }}
    >
      {children}
    </div>
  )
}

// Scale transition effect
export function ScaleTransition({ children, className = '' }: PageTransitionProps) {
  const location = useLocation()
  const [displayLocation, setDisplayLocation] = useState(location)
  const [transitionStage, setTransitionStage] = useState('scaleIn')

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage('scaleOut')
    }
  }, [location, displayLocation])

  return (
    <div
      className={`${className} transition-all duration-400 ease-in-out transform ${
        transitionStage === 'scaleOut' 
          ? 'opacity-0 scale-95' 
          : 'opacity-100 scale-100'
      }`}
      onTransitionEnd={() => {
        if (transitionStage === 'scaleOut') {
          setDisplayLocation(location)
          setTransitionStage('scaleIn')
        }
      }}
    >
      {children}
    </div>
  )
}

// Component entrance animations
export function FadeInUp({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-700 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function FadeInLeft({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-700 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 -translate-x-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function FadeInRight({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-700 ease-out transform ${
        isVisible 
          ? 'opacity-100 translate-x-0' 
          : 'opacity-0 translate-x-8'
      } ${className}`}
    >
      {children}
    </div>
  )
}

export function ScaleIn({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: ReactNode
  delay?: number
  className?: string 
}) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  return (
    <div
      className={`transition-all duration-500 ease-out transform ${
        isVisible 
          ? 'opacity-100 scale-100' 
          : 'opacity-0 scale-95'
      } ${className}`}
    >
      {children}
    </div>
  )
}

// Staggered animation container
export function StaggerContainer({ 
  children, 
  staggerDelay = 100,
  className = '' 
}: { 
  children: ReactNode[]
  staggerDelay?: number
  className?: string 
}) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <FadeInUp key={index} delay={index * staggerDelay}>
          {child}
        </FadeInUp>
      ))}
    </div>
  )
}