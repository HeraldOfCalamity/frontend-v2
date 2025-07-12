import { Close } from "@mui/icons-material";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from "@mui/material";

interface ModalProps{
    open: boolean;
    onClose: () => void;
    title?: string;
    content?: React.ReactNode;
    text?: string;
    actions?: React.ReactNode;
}
const Modal: React.FC<ModalProps> = ({open, onClose, title, content, actions, text}) => {
    return(
        <Dialog open={open} onClose={onClose} sx={{p:2}} maxWidth="xs" fullWidth>
            {title && <DialogTitle variant="h4" color="primary" sx={{fontWeight: 700, fontSize: '2rem', pb: 0}}>
                {title}
                <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 12, color: "grey.400" }}>
                    <Close />
                </IconButton>
            </DialogTitle>}
            <DialogContent sx={{px:5, pb: 2, pt:1}}>
                {content && content}
                {text && <DialogContentText>
                    {text}
                </DialogContentText>}
            </DialogContent>
            {actions && <DialogActions sx={{px:5, pb:3}}>
                {actions}
            </DialogActions>}
        </Dialog>
    )
}

export default Modal;