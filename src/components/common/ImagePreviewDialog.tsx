import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";

interface ImagePreviewDialog{
    open: boolean;
    onClose: () => void;
    image?: string;
    alt?: string;
}

export default function ImagePreviewDialog({
    open,
    onClose,
    image,
    alt
}: ImagePreviewDialog){
    return (
        <Dialog
            open={open}
            onClose={onClose}
        >
            <DialogTitle>
                Imagen Cargada
            </DialogTitle>
            <DialogContent>
                { image ? (
                        <img 
                            height={210} 
                            src={image} 
                            alt={alt} 
                            style={{ 
                                objectFit: 'cover', 
                                borderRadius: 8 
                            }}
                        />
                    ) : (
                        "No se tiene una imagen guardada."
                    )
                }
            </DialogContent>
            <DialogActions>
                <Button color="error" variant="contained" onClick={onClose}>Cerrar</Button>
            </DialogActions>
        </Dialog>
    )
}