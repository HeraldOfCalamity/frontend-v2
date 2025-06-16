import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";

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
        <Dialog open={open} onClose={onClose} sx={{p:2}}>
            {title && <DialogTitle>
                {title}
            </DialogTitle>}
            <DialogContent>
                {content && content}
                {text && <DialogContentText>
                    {text}
                </DialogContentText>}
            </DialogContent>
            {actions && <DialogActions>
                {actions}
            </DialogActions>}
        </Dialog>
    )
}

export default Modal;