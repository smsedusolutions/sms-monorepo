import React from 'react';
import { 
  FormControl, 
  Select, 
  type SelectProps, 
  MenuItem, 
  FormHelperText,
  Typography,
  Box,
  alpha
} from '@mui/material';

interface AppSelectOption {
  value: string | number;
  label: string;
}

export interface AppSelectProps extends Omit<SelectProps, 'label'> {
  label?: string;
  options: AppSelectOption[];
  helperText?: string;
  labelHint?: string;
  containerSx?: any;
}

export const AppSelect: React.FC<AppSelectProps> = ({ 
  label, 
  options, 
  helperText, 
  error, 
  fullWidth = true,
  labelHint,
  containerSx,
  size = 'small',
  ...props 
}) => {
  return (
    <Box sx={{ mb: 2, width: fullWidth ? '100%' : 'auto', ...containerSx }}>
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
        </Box>
      )}
      <FormControl fullWidth={fullWidth} error={error} size={size}>
        <Select
          displayEmpty
          MenuProps={{
            PaperProps: {
              sx: {
                maxHeight: 280,
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              },
            },
            ...props.MenuProps,
          }}
          {...props}
          sx={{
            backgroundColor: 'background.paper',
            transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              backgroundColor: alpha('#f1f5f9', 0.5),
            },
            '&.Mui-focused': {
              backgroundColor: 'background.paper',
            },
            ...props.sx
          }}
        >
          {options.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
        {helperText && <FormHelperText>{helperText}</FormHelperText>}
      </FormControl>
    </Box>
  );
};
