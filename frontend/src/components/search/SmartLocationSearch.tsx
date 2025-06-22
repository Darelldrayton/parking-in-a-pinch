import React, { useState, useRef, useEffect } from 'react';
import {
  TextField,
  InputAdornment,
  Autocomplete,
  Box,
  Typography,
  Paper,
  Stack,
  Chip,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  LocationOn,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { BOROUGH_OPTIONS } from '../../types/parking';
import { NYC_NEIGHBORHOODS } from '../../utils/locationUtils';

interface LocationOption {
  type: 'borough' | 'neighborhood';
  borough?: string;
  neighborhood?: string;
  label: string;
  fullLabel: string;
}

interface SmartLocationSearchProps {
  value?: string;
  onChange: (value: string, selectedLocation?: LocationOption) => void;
  placeholder?: string;
  onBoroughSelect?: (borough: string) => void;
  onNeighborhoodSelect?: (borough: string, neighborhood: string) => void;
}

export default function SmartLocationSearch({
  value = '',
  onChange,
  placeholder = "Search by borough or neighborhood...",
  onBoroughSelect,
  onNeighborhoodSelect,
}: SmartLocationSearchProps) {
  const theme = useTheme();
  const [inputValue, setInputValue] = useState(value);
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  // Generate location options
  const generateLocationOptions = (): LocationOption[] => {
    const options: LocationOption[] = [];

    // Add boroughs
    BOROUGH_OPTIONS.forEach(borough => {
      options.push({
        type: 'borough',
        borough: borough.value,
        label: borough.label,
        fullLabel: borough.label,
      });
    });

    // Add neighborhoods
    Object.entries(NYC_NEIGHBORHOODS).forEach(([borough, neighborhoods]) => {
      neighborhoods.forEach(neighborhood => {
        options.push({
          type: 'neighborhood',
          borough,
          neighborhood,
          label: neighborhood,
          fullLabel: `${neighborhood}, ${borough}`,
        });
      });
    });

    return options;
  };

  const [allOptions] = useState<LocationOption[]>(generateLocationOptions());

  // Filter options based on input
  const getFilteredOptions = (searchTerm: string): LocationOption[] => {
    if (!searchTerm.trim()) {
      // If no search term, show popular boroughs first
      return allOptions.filter(option => option.type === 'borough').slice(0, 5);
    }

    const searchLower = searchTerm.toLowerCase();
    return allOptions.filter(option =>
      option.label.toLowerCase().includes(searchLower) ||
      option.fullLabel.toLowerCase().includes(searchLower) ||
      (option.borough && option.borough.toLowerCase().includes(searchLower))
    ).slice(0, 20); // Limit to 20 results for performance
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // Check if the typed value matches a borough name exactly
    const matchingBorough = allOptions.find(option => 
      option.type === 'borough' && 
      option.label.toLowerCase() === newValue.toLowerCase()
    );
    
    if (matchingBorough) {
      // Automatically select the borough
      setSelectedLocation(matchingBorough);
      onChange(newValue, matchingBorough);
      if (onBoroughSelect) {
        onBoroughSelect(matchingBorough.borough!);
      }
    } else {
      onChange(newValue);
      // Clear selected location if input changes and doesn't match
      if (selectedLocation && newValue !== selectedLocation.label && newValue !== selectedLocation.fullLabel) {
        setSelectedLocation(null);
      }
    }
  };

  const handleOptionSelect = (option: LocationOption | null) => {
    if (option) {
      setSelectedLocation(option);
      // For boroughs, just show the borough name without "(Borough)" suffix
      const displayValue = option.type === 'borough' ? option.label : option.fullLabel;
      setInputValue(displayValue);
      onChange(displayValue, option);
      
      // Call appropriate callback
      if (option.type === 'borough' && onBoroughSelect) {
        onBoroughSelect(option.borough!);
      } else if (option.type === 'neighborhood' && onNeighborhoodSelect) {
        onNeighborhoodSelect(option.borough!, option.neighborhood!);
      }
    } else {
      setSelectedLocation(null);
      setInputValue('');
      onChange('');
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setInputValue('');
    setSelectedLocation(null);
    onChange('');
    setIsOpen(false);
  };

  const filteredOptions = getFilteredOptions(inputValue);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <Autocomplete
        freeSolo
        open={isOpen}
        onOpen={() => setIsOpen(true)}
        onClose={() => setIsOpen(false)}
        options={filteredOptions}
        value={selectedLocation}
        inputValue={inputValue}
        onInputChange={(_, newValue) => {
          setInputValue(newValue);
          
          // Check if the typed value matches a borough name exactly
          const matchingBorough = allOptions.find(option => 
            option.type === 'borough' && 
            option.label.toLowerCase() === newValue.toLowerCase()
          );
          
          if (matchingBorough && !selectedLocation) {
            // Automatically select the borough
            setSelectedLocation(matchingBorough);
            onChange(newValue, matchingBorough);
            if (onBoroughSelect) {
              onBoroughSelect(matchingBorough.borough!);
            }
          } else {
            onChange(newValue);
          }
        }}
        onChange={(_, newValue) => handleOptionSelect(newValue as LocationOption | null)}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          return option.fullLabel;
        }}
        filterOptions={(options) => options} // We handle filtering manually
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            placeholder={placeholder}
            InputProps={{
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
              endAdornment: inputValue ? (
                <InputAdornment position="end">
                  <ClearIcon 
                    sx={{ cursor: 'pointer', color: 'action.main' }}
                    onClick={handleClear}
                  />
                </InputAdornment>
              ) : params.InputProps.endAdornment,
              sx: {
                borderRadius: 2,
                backgroundColor: theme.palette.mode === 'dark' ? theme.palette.action.hover : 'transparent',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.mode === 'dark' ? theme.palette.divider : undefined,
                },
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused fieldset': {
                  borderColor: theme.palette.primary.main,
                },
                '& input::placeholder': {
                  color: theme.palette.mode === 'dark' ? theme.palette.text.secondary : undefined,
                  opacity: theme.palette.mode === 'dark' ? 0.7 : undefined,
                },
              },
            }}
          />
        )}
        renderOption={(props, option) => (
          <Box
            component="li"
            {...props}
            sx={{
              p: 2,
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ width: '100%' }}>
              <LocationOn 
                sx={{ 
                  fontSize: 20,
                  color: option.type === 'borough' ? 'primary.main' : 'text.secondary'
                }} 
              />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" fontWeight={option.type === 'borough' ? 600 : 400}>
                  {option.label}
                </Typography>
                {option.type === 'neighborhood' && (
                  <Typography variant="caption" color="text.secondary">
                    {option.borough}
                  </Typography>
                )}
              </Box>
              <Chip
                label={option.type === 'borough' ? 'Borough' : 'Neighborhood'}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  color: option.type === 'borough' ? 'primary.main' : 'text.secondary',
                  borderColor: option.type === 'borough' ? 'primary.main' : 'divider',
                }}
              />
            </Stack>
          </Box>
        )}
        PaperComponent={({ children, ...props }) => (
          <Paper 
            {...props} 
            sx={{ 
              borderRadius: 2, 
              mt: 1,
              boxShadow: theme.shadows[8],
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.paper,
              backgroundImage: theme.palette.mode === 'dark' 
                ? 'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))' 
                : 'none',
            }}
          >
            {children}
          </Paper>
        )}
        ListboxProps={{
          sx: {
            maxHeight: 400,
            '& .MuiAutocomplete-option': {
              paddingLeft: 0,
              paddingRight: 0,
            },
          },
        }}
      />
      
      {/* Show selected location info */}
      {selectedLocation && (
        <Box sx={{ mt: 1 }}>
          <Chip
            icon={<LocationOn sx={{ fontSize: 16 }} />}
            label={`${selectedLocation.type === 'borough' ? 'Borough' : 'Neighborhood'}: ${selectedLocation.type === 'borough' ? selectedLocation.label : selectedLocation.fullLabel}`}
            onDelete={handleClear}
            color="primary"
            variant="outlined"
            size="small"
          />
        </Box>
      )}
    </Box>
  );
}