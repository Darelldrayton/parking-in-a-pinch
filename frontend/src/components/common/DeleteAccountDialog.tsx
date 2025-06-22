import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  InputAdornment,
  Stack,
  Alert,
  AlertTitle,
  Divider,
} from '@mui/material'
import {
  Close as CloseIcon,
  Visibility,
  VisibilityOff,
  Warning,
  Delete,
} from '@mui/icons-material'
import authService from '../../services/auth'
import { useAuth } from '../../context/AuthContext'

const schema = yup.object({
  password: yup.string().required('Password is required to delete your account'),
  confirmation: yup
    .string()
    .equals(['DELETE'], 'You must type "DELETE" to confirm')
    .required('Confirmation is required'),
})

type FormData = yup.InferType<typeof schema>

interface DeleteAccountDialogProps {
  open: boolean
  onClose: () => void
}

export default function DeleteAccountDialog({ open, onClose }: DeleteAccountDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { logout } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: yupResolver(schema),
  })

  const confirmationValue = watch('confirmation')

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)
    try {
      await authService.deleteAccount(data)
      toast.success('Account deleted successfully')
      
      // Logout and redirect to home
      logout()
      navigate('/')
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to delete account'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3 }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Warning color="error" />
          <Typography variant="h6" component="span" fontWeight="bold" color="error">
            Delete Account
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Warning: This action cannot be undone</AlertTitle>
          Deleting your account will:
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li>Permanently remove all your account data</li>
            <li>Cancel any pending bookings</li>
            <li>Remove all your listings</li>
            <li>Delete your reviews and ratings</li>
          </ul>
        </Alert>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Please enter your password and type "DELETE" to confirm account deletion.
        </Typography>

        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            <TextField
              {...register('password')}
              fullWidth
              label="Current Password"
              type={showPassword ? 'text' : 'password'}
              error={!!errors.password}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box>
              <TextField
                {...register('confirmation')}
                fullWidth
                label="Type DELETE to confirm"
                placeholder="DELETE"
                error={!!errors.confirmation}
                helperText={errors.confirmation?.message || 'Type "DELETE" in all caps to confirm'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: confirmationValue === 'DELETE' ? 'success.main' : 'error.main',
                    },
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
          <strong>Note:</strong> You cannot delete your account if you have active bookings or listings with upcoming reservations. 
          Please cancel or complete them first.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit(onSubmit)}
          variant="contained"
          color="error"
          startIcon={<Delete />}
          disabled={isLoading || confirmationValue !== 'DELETE'}
        >
          {isLoading ? 'Deleting Account...' : 'Delete Account'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}