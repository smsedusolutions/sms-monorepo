import React from 'react';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker, type DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { Box, Typography, alpha, type Theme } from '@mui/material';

export interface AppDatePickerProps extends Omit<DatePickerProps<any>, 'renderInput' | 'slots' | 'slotProps'> {
  label?: string;
  labelHint?: string;
  helperText?: string;
  error?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  value?: Date | null;
  onChange: (value: Date | null) => void;
  containerSx?: any;
  disableMargin?: boolean;
  inputSx?: any;
  placeholder?: string;
  size?: 'small' | 'medium';
}

export const AppDatePicker: React.FC<AppDatePickerProps> = ({
  label,
  labelHint,
  helperText,
  error,
  required,
  fullWidth = true,
  containerSx,
  disableMargin = false,
  inputSx,
  placeholder,
  size = 'small',
  ...props
}) => {
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ mb: disableMargin ? 0 : 2, width: fullWidth ? '100%' : 'auto', ...containerSx }}>
        {label && (
          <Box sx={{ display: 'flex', alignItems: 'baseline', mb: 0.5 }}>
            <Typography variant="subtitle2" component="label" sx={{ fontWeight: 600, color: 'text.primary' }}>
              {label}
            </Typography>
            {labelHint && (
              <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary', fontStyle: 'italic' }}>
                ({labelHint})
              </Typography>
            )}
            {required && (
              <Typography variant="caption" color="error" sx={{ ml: 0.5 }}>
                *
              </Typography>
            )}
          </Box>
        )}
        <DatePicker
          {...props}
          format="dd-MM-yyyy"
          closeOnSelect
          slotProps={{
            textField: {
              fullWidth,
              error,
              helperText,
              size,
              placeholder,
              hiddenLabel: !label,
              sx: {
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1.5,
                  backgroundColor: 'background.paper',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    backgroundColor: alpha('#f1f5f9', 0.5),
                  },
                  '&.Mui-focused': {
                    backgroundColor: 'background.paper',
                    boxShadow: (theme: Theme) => `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                  },
                  ...inputSx,
                },
              },
            },
            actionBar: {
              actions: ['clear', 'today'],
            },
            popper: {
              sx: {
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 0.5,
                },
                '& .MuiDayCalendar-weekDayLabel': {
                  fontWeight: 700,
                  color: 'primary.main',
                  fontSize: '0.75rem',
                },
                '& .MuiPickersDay-root': {
                  borderRadius: 1.25,
                  fontSize: '0.875rem',
                  '&:hover': {
                    backgroundColor: alpha('#6366f1', 0.08),
                  },
                  '&.Mui-selected': {
                    backgroundColor: 'primary.main',
                    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
                    '&:hover': {
                      backgroundColor: 'primary.dark',
                    },
                  },
                  '&.MuiPickersDay-today': {
                    borderColor: 'primary.main',
                    borderWidth: 1.5,
                  },
                },
              },
            },
          }}
        />
      </Box>
    </LocalizationProvider>
  );
};
