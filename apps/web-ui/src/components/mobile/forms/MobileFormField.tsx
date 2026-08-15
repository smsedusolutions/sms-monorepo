import React from 'react';
import { Box, Typography, TextField, InputAdornment, IconButton } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import ClearRoundedIcon from '@mui/icons-material/ClearRounded';

export interface MobileFormFieldProps extends Omit<TextFieldProps, 'label'> {
  label?: React.ReactNode;
  hint?: string;
  onClear?: () => void;
  showClear?: boolean;
}

export const MobileFormField: React.FC<MobileFormFieldProps> = ({
  label,
  hint,
  value,
  onChange,
  onClear,
  showClear = false,
  error,
  helperText,
  InputProps,
  ...props
}) => {
  const canClear = showClear && value && Boolean(onClear);

  return (
    <Box sx={{ mb: 2, width: '100%' }}>
      {label && (
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '0.84rem',
            color: '#1e293b',
            mb: 0.8,
            fontFamily: '"Outfit", sans-serif',
          }}
        >
          {label}
        </Typography>
      )}

      <TextField
        fullWidth
        value={value}
        onChange={onChange}
        error={error}
        helperText={helperText || hint}
        FormHelperTextProps={{
          sx: {
            fontSize: '0.72rem',
            mt: 0.5,
            mx: 0.5,
            color: error ? '#ef4444' : '#64748b',
          },
        }}
        InputProps={{
          ...InputProps,
          endAdornment: canClear ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={onClear} edge="end">
                <ClearRoundedIcon sx={{ fontSize: 18, color: '#94a3b8' }} />
              </IconButton>
            </InputAdornment>
          ) : (
            InputProps?.endAdornment
          ),
          sx: {
            borderRadius: '14px',
            bgcolor: '#ffffff',
            fontSize: '1rem',
            '& fieldset': {
              borderColor: error ? '#ef4444' : '#e2e8f0',
              borderWidth: '1.5px',
            },
            '&:hover fieldset': {
              borderColor: error ? '#ef4444' : '#cbd5e1',
            },
            '&.Mui-focused fieldset': {
              borderColor: error ? '#ef4444' : '#4f46e5',
              borderWidth: '2px',
            },
            ...InputProps?.sx,
          },
        }}
        {...props}
      />
    </Box>
  );
};

export default MobileFormField;
