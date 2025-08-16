import { CloudUpload } from "@mui/icons-material";
import { Button, styled } from "@mui/material";
import type { ChangeEvent } from "react";

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});
interface InputFileUploadProps {
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void
    label: string;
    accept?: string;
    variant?: 'text' | 'contained' | 'outlined';
    disabled?: boolean;
}
export default function InputFileUpload({
    handleChange,
    label,
    accept,
    variant,
    disabled
}: InputFileUploadProps) {
  return (
    <Button
      component="label"
      role={undefined}
      variant={variant}
      tabIndex={-1}
      disabled={disabled}
      startIcon={<CloudUpload />}
    >
      {label}
      <VisuallyHiddenInput
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={handleChange}
        multiple
      />
    </Button>
  );
}