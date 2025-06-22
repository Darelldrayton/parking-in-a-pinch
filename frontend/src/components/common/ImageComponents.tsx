import { useState, useRef, useEffect, ReactNode } from 'react'
import { PhotoIcon, EyeIcon, ArrowLeftIcon, ArrowRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ImagePlaceholderProps {
  width?: string | number
  height?: string | number
  className?: string
  icon?: ReactNode
  text?: string
  variant?: 'default' | 'parking' | 'profile' | 'gallery'
  showOverlay?: boolean
}

export function ImagePlaceholder({
  width = '100%',
  height = 200,
  className = '',
  icon,
  text,
  variant = 'default',
  showOverlay = true
}: ImagePlaceholderProps) {
  const variantStyles = {
    default: 'bg-white/5 border-white/20',
    parking: 'bg-gradient-to-br from-primary-500/20 to-accent-500/20 border-primary-300/30',
    profile: 'bg-gradient-to-br from-secondary-500/20 to-primary-500/20 border-secondary-300/30',
    gallery: 'bg-gradient-to-br from-accent-500/20 to-secondary-500/20 border-accent-300/30'
  }

  const placeholderText = {
    default: 'Image',
    parking: 'Parking Spot Image',
    profile: 'Profile Picture',
    gallery: 'Gallery Image'
  }

  return (
    <div
      className={`
        relative flex items-center justify-center rounded-2xl border-2 border-dashed
        transition-all duration-300 hover:scale-[1.02] group overflow-hidden
        ${variantStyles[variant]} ${className}
      `}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height
      }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-4 gap-2 p-4 h-full">
          {[...Array(16)].map((_, i) => (
            <div key={i} className="bg-white/20 rounded animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center space-y-3 text-white/70 group-hover:text-white/90 transition-colors">
        {icon || <PhotoIcon className="h-8 w-8" />}
        <span className="text-sm font-medium">{text || placeholderText[variant]}</span>
      </div>

      {/* Hover overlay */}
      {showOverlay && (
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  )
}

interface OptimizedImageProps {
  src: string
  alt: string
  width?: string | number
  height?: string | number
  className?: string
  placeholderVariant?: 'default' | 'parking' | 'profile' | 'gallery'
  objectFit?: 'cover' | 'contain' | 'fill'
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width = '100%',
  height = 200,
  className = '',
  placeholderVariant = 'default',
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleLoad = () => {
    setIsLoading(false)
    setImageLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  if (hasError) {
    return (
      <ImagePlaceholder
        width={width}
        height={height}
        className={className}
        variant={placeholderVariant}
        text="Failed to load"
        icon={<PhotoIcon className="h-8 w-8 text-red-400" />}
      />
    )
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {isLoading && (
        <ImagePlaceholder
          width={width}
          height={height}
          variant={placeholderVariant}
          showOverlay={false}
        />
      )}
      <img
        src={src}
        alt={alt}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          transition-all duration-500 ease-out
          ${imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}
          ${isLoading ? 'absolute inset-0' : ''}
        `}
        style={{
          width: typeof width === 'number' ? `${width}px` : width,
          height: typeof height === 'number' ? `${height}px` : height,
          objectFit
        }}
      />
    </div>
  )
}

interface ImageGalleryProps {
  images: Array<{
    src: string
    alt: string
    caption?: string
  }>
  columns?: 2 | 3 | 4
  spacing?: 'tight' | 'normal' | 'loose'
  aspectRatio?: 'square' | 'wide' | 'tall' | 'auto'
  className?: string
}

export function ImageGallery({
  images,
  columns = 3,
  spacing = 'normal',
  aspectRatio = 'square',
  className = ''
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const spacingClasses = {
    tight: 'gap-2',
    normal: 'gap-4',
    loose: 'gap-6'
  }

  const aspectClasses = {
    square: 'aspect-square',
    wide: 'aspect-video',
    tall: 'aspect-[3/4]',
    auto: ''
  }

  const openModal = (index: number) => {
    setSelectedImage(index)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedImage(null)
  }

  const nextImage = () => {
    if (selectedImage !== null) {
      setSelectedImage((selectedImage + 1) % images.length)
    }
  }

  const prevImage = () => {
    if (selectedImage !== null) {
      setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)
    }
  }

  return (
    <>
      <div className={`grid grid-cols-${columns} ${spacingClasses[spacing]} ${className}`}>
        {images.map((image, index) => (
          <div
            key={index}
            className={`
              relative group cursor-pointer overflow-hidden rounded-2xl
              ${aspectClasses[aspectRatio]} hover:scale-105 transition-transform duration-300
            `}
            onClick={() => openModal(index)}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width="100%"
              height="100%"
              className="w-full h-full"
              placeholderVariant="gallery"
            />
            
            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <EyeIcon className="h-8 w-8 text-white" />
            </div>

            {/* Caption */}
            {image.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <p className="text-white text-sm font-medium">{image.caption}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && selectedImage !== null && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>

            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 p-3 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ArrowRightIcon className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image */}
            <div className="relative">
              <img
                src={images[selectedImage].src}
                alt={images[selectedImage].alt}
                className="max-w-full max-h-[80vh] object-contain rounded-xl"
              />
              
              {/* Image info */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-xl">
                <h3 className="text-white text-lg font-semibold mb-1">
                  {images[selectedImage].alt}
                </h3>
                {images[selectedImage].caption && (
                  <p className="text-white/80 text-sm">
                    {images[selectedImage].caption}
                  </p>
                )}
                <p className="text-white/60 text-xs mt-2">
                  {selectedImage + 1} of {images.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface ParkingImageCardProps {
  images: string[]
  title: string
  location: string
  price: string
  rating: number
  className?: string
}

export function ParkingImageCard({
  images,
  title,
  location,
  price,
  rating,
  className = ''
}: ParkingImageCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => prev === 0 ? images.length - 1 : prev - 1)
  }

  return (
    <div className={`glass-card overflow-hidden group hover:scale-[1.02] transition-all duration-300 ${className}`}>
      {/* Image carousel */}
      <div className="relative aspect-video overflow-hidden">
        {images.length > 0 ? (
          <>
            <OptimizedImage
              src={images[currentImageIndex]}
              alt={title}
              width="100%"
              height="100%"
              placeholderVariant="parking"
              className="w-full h-full"
            />
            
            {/* Navigation */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-black/70"
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </>
            )}

            {/* Image indicators */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <ImagePlaceholder
            width="100%"
            height="100%"
            variant="parking"
          />
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
            <p className="text-white/70 text-sm">{location}</p>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">{price}</div>
            <div className="text-xs text-white/60">per hour</div>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center space-x-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-white/30'}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-white/70 text-sm ml-2">({rating}.0)</span>
        </div>

        {/* Book button */}
        <button className="w-full btn-primary">
          Book Now
        </button>
      </div>
    </div>
  )
}