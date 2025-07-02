import type { Theme } from "@emotion/react";
import { FormControl, Input, InputAdornment, InputLabel, type SxProps } from "@mui/material"

interface CustomInputProps{
    value: unknown;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    id: string;
    type: string;
    placeholder?: string;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
    label?: string;
    sx?: SxProps<Theme> | undefined;
    fullWidth?: boolean;
    required?: boolean;
    disabled?: boolean;
}

const CustomInput: React.FC<CustomInputProps> = ({value, id, type,required, placeholder,handleChange,label,sx, startIcon, endIcon,fullWidth, disabled}) => {
    
    return (
        <FormControl variant="standard">
            {label && <InputLabel htmlFor={id} >{label}</InputLabel>}
            <Input
                sx={theme => ({
                    ...(typeof sx === "function"
                        ? sx(theme)
                        : Array.isArray(sx)
                            ? Object.assign({}, ...sx)
                            : (sx || {})),
                    '& input:-webkit-autofill': {
                        WebkitBoxShadow: `0 0 0 1000px ${theme.palette.primary} inset`,
                        WebkitTextFillColor: theme.palette.text.primary,
                        caretColor: theme.palette.text.primary,
                        transition: 'background-color 5000s ease-in-out 0s',
                    }
                })}
                id={id}
                value={value}
                fullWidth={fullWidth}
                type={type}
                required={required}
                placeholder={placeholder}
                onChange={handleChange}
                startAdornment={
                    startIcon && <InputAdornment position='start'>
                        {startIcon}
                    </InputAdornment>
                }
                endAdornment={
                    endIcon && <InputAdornment position='end'>
                        {endIcon}
                    </InputAdornment>
                }
                disabled={disabled}
            />
        </FormControl>
    )
}

export default CustomInput;