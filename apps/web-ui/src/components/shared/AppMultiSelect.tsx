import React from 'react';
import {
    Autocomplete,
    Checkbox,
    Chip,
    TextField,
    Box,
    Typography,
    alpha,
    type TextFieldProps,
} from '@mui/material';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import IndeterminateCheckBoxIcon from '@mui/icons-material/IndeterminateCheckBox';

export interface AppMultiSelectOption {
    id: string;
    label: string;
}

interface AppMultiSelectProps {
    /** Label displayed above the input */
    label?: string;
    /** Placeholder shown inside the text field */
    placeholder?: string;
    /** Helper text below the field */
    helperText?: string;
    /** Available options */
    options: AppMultiSelectOption[];
    /** Currently selected option ids */
    value: string[];
    /** Called with the new array of selected ids */
    onChange: (ids: string[]) => void;
    /** Chip color for selected tags */
    chipColor?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'default';
    /** Whether the field should take full width */
    fullWidth?: boolean;
    /** Error state */
    error?: boolean;
    /** Additional sx styles forwarded to the wrapping Box */
    sx?: object;
    /** Text field variant forwarded to the TextField */
    textFieldProps?: Partial<TextFieldProps>;
}

const SELECT_ALL_ID = '__SELECT_ALL__';
const SELECT_ALL_OPTION: AppMultiSelectOption = { id: SELECT_ALL_ID, label: 'Select All' };

export const AppMultiSelect: React.FC<AppMultiSelectProps> = ({
    label,
    placeholder,
    helperText,
    options,
    value,
    onChange,
    chipColor = 'primary',
    fullWidth = true,
    error = false,
    sx = {},
    textFieldProps = {},
}) => {
    const allSelected = options.length > 0 && value.length === options.length;
    const someSelected = value.length > 0 && value.length < options.length;

    // Prepend the "Select All" pseudo-option
    const allOptions = [SELECT_ALL_OPTION, ...options];

    // Map ids → option objects for the Autocomplete value
    const selectedObjects = options.filter((o) => value.includes(o.id));

    const handleChange = (_: React.SyntheticEvent, newValue: AppMultiSelectOption[]) => {
        const clickedSelectAll = newValue.some((o) => o.id === SELECT_ALL_ID);
        if (clickedSelectAll) {
            // Toggle all
            if (allSelected) {
                onChange([]);
            } else {
                onChange(options.map((o) => o.id));
            }
        } else {
            onChange(newValue.filter((o) => o.id !== SELECT_ALL_ID).map((o) => o.id));
        }
    };

    return (
        <Box sx={{ mb: 2, width: fullWidth ? '100%' : undefined, ...sx }}>
            {label && (
                <Typography
                    variant="subtitle2"
                    component="label"
                    sx={{ fontWeight: 600, color: 'text.primary', display: 'block', mb: 0.5 }}
                >
                    {label}
                </Typography>
            )}
            <Autocomplete
                multiple
                disableCloseOnSelect
                options={allOptions}
                value={selectedObjects}
                onChange={handleChange}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, val) => option.id === val.id}
                renderOption={(props, option) => {
                    const { key, ...rest } = props as any;

                    if (option.id === SELECT_ALL_ID) {
                        return (
                            <li key={key} {...rest} style={{ borderBottom: '1px solid rgba(0,0,0,0.08)', fontWeight: 600 }}>
                                <Checkbox
                                    icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                    checkedIcon={<CheckBoxIcon fontSize="small" />}
                                    indeterminateIcon={<IndeterminateCheckBoxIcon fontSize="small" />}
                                    checked={allSelected}
                                    indeterminate={someSelected}
                                    style={{ marginRight: 8 }}
                                    color="primary"
                                />
                                {option.label}
                            </li>
                        );
                    }

                    const isChecked = value.includes(option.id);
                    return (
                        <li key={key} {...rest}>
                            <Checkbox
                                icon={<CheckBoxOutlineBlankIcon fontSize="small" />}
                                checkedIcon={<CheckBoxIcon fontSize="small" />}
                                checked={isChecked}
                                style={{ marginRight: 8 }}
                                color="primary"
                            />
                            {option.label}
                        </li>
                    );
                }}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                            <Chip
                                key={key}
                                label={option.label}
                                {...tagProps}
                                size="small"
                                color={chipColor}
                                variant="outlined"
                            />
                        );
                    })
                }
                renderInput={(params) => (
                    <TextField
                        {...params}
                        hiddenLabel
                        error={error}
                        helperText={helperText}
                        placeholder={selectedObjects.length === 0 ? placeholder : undefined}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: 'background.paper',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                    backgroundColor: (theme) => alpha(theme.palette.action.hover, 0.04),
                                },
                                '&.Mui-focused': {
                                    backgroundColor: 'background.paper',
                                    boxShadow: (theme) =>
                                        `0 0 0 2px ${alpha(theme.palette.primary.main, 0.1)}`,
                                },
                            },
                        }}
                        {...textFieldProps}
                    />
                )}
            />
        </Box>
    );
};

export default AppMultiSelect;
