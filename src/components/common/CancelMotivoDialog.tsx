import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from "@mui/material";
import { memo, useEffect, useState } from "react";

// Nuevo: componente dialog independiente y memoizable
const CancelMotivoDialog = memo(function CancelMotivoDialog({
  open, onClose, onConfirm, initial = ""
}: { open: boolean; onClose: () => void; onConfirm: (motivo: string)=>void; initial?: string }) {
  const [value, setValue] = useState(initial);
  useEffect(() => { setValue(initial); }, [initial, open]); // reset al abrir

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Agregar motivo de cancelación</DialogTitle>
      <DialogContent>
        <TextField
          fullWidth multiline minRows={2}
          label="Ingrese el motivo de cancelación"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          sx={{ mt: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button color="warning" variant="contained" onClick={() => onConfirm(value)}>
          Confirmar Cancelación
        </Button>
        <Button color="error" variant="contained" onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
});

export default CancelMotivoDialog;