import type { Theme } from "@emotion/react";
import { FormControl, Input, InputAdornment, InputLabel, type SxProps } from "@mui/material"
import { useState } from "react";

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
}

const CustomInput: React.FC<CustomInputProps> = ({value, id, type,required, placeholder,handleChange,label,sx, startIcon, endIcon,fullWidth}) => {
    
    return (
        <FormControl variant="standard">
            {label && <InputLabel htmlFor={id} >{label}</InputLabel>}
            <Input
                sx={sx}
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
            />
        </FormControl>
    )
}

export default CustomInput;