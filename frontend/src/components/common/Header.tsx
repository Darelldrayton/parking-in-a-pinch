import { Link, useNavigate } from 'react-router-dom'
import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, MapPinIcon, PlusIcon, MagnifyingGlassIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const navigation = [
    { name: 'Find Parking', href: '/listings' },
    { name: 'List Your Space', href: '/create-listing' },
  ]

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <MapPinIcon className="h-8 w-8 text-red-500" />
              <span className="text-xl font-bold text-gray-900">ParkEasy</span>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className="text-gray-700 hover:text-gray-900 font-medium text-sm transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/dashboard"
                  className="text-gray-700 hover:text-gray-900 font-medium text-sm"
                >
                  Dashboard
                </Link>
                <div className="flex items-center space-x-2 border border-gray-300 rounded-full py-1 px-3 hover:shadow-md transition-shadow cursor-pointer">
                  <Bars3Icon className="h-4 w-4 text-gray-600" />
                  <UserCircleIcon className="h-8 w-8 text-gray-600" />
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-gray-900 font-medium text-sm"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="bg-gray-900 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-800 transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

    </header>
  )
}