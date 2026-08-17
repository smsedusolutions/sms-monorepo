import React from 'react';
import { InputAdornment, Box, Typography } from '@mui/material';
import { AppInput, type AppInputProps } from './AppInput';

/**
 * Normalizes any phone number input/value string:
 * - Strips non-digits
 * - Removes leading +91 / 91 country code if digits length > 10
 * - Removes leading 0 if digits length > 10
 * - Caps result to 10 digits
 */
export const cleanPhoneNumber = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null) return '';
  const str = String(val).trim();
  if (str === '+91' || str === '+91-' || str === '+91 ') return '';
  
  let digits = str.replace(/\D/g, '');

  if (digits === '91' && (str.startsWith('+91') || str.startsWith('91'))) {
    return '';
  }
  
  if (digits.startsWith('91') && digits.length > 10) {
    digits = digits.slice(2);
  } else if (digits.startsWith('0') && digits.length > 10) {
    digits = digits.slice(1);
  }
  
  return digits.slice(0, 10);
};

export const formatPhoneNumber = (val: string | number | undefined | null): string => {
  const cleaned = cleanPhoneNumber(val);
  if (!cleaned) return '';
  return `+91 ${cleaned}`;
};

/**
 * A standardized Phone Input component for the SMS system.
 * Features:
 * - Enforced numeric-only input.
 * - 10-digit limit.
 * - Fixed Indian (+91) country code prefix.
 * - Premium look with visual adornment.
 */
export const PhoneInput: React.FC<AppInputProps> = ({ onChange, value, ...props }) => {
  const displayValue = cleanPhoneNumber(value as string);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = cleanPhoneNumber(e.target.value);

    if (onChange) {
      // Create a modified event to pass back up
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          name: props.name || '',
          value: val,
        },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(syntheticEvent);
    }
  };

  return (
    <AppInput
      {...props}
      value={displayValue}
      onChange={handleChange}
      type="text"
      placeholder="00000 00000"
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                pr: 1.5,
                mr: 0.5,
                borderRight: '1.5px solid',
                borderColor: 'divider',
                height: '1.5rem',
                userSelect: 'none'
              }}
            >
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  color: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  lineHeight: '1'
                }}
              >
                +91
              </Typography>
            </Box>
          </InputAdornment>
        ),
        ...props.InputProps,
      }}
      inputProps={{
        maxLength: 10,
        inputMode: 'numeric',
        pattern: '[0-9]*',
        autoComplete: 'tel-national',
        ...props.inputProps,
      }}
    />
  );
};
