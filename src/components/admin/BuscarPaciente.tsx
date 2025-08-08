import { ArrowCircleRightRounded, Search } from "@mui/icons-material";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { filterPacientes, type FilterPaciente, type Paciente } from "../../api/pacienteService";
import type { Column, TableAction } from "../common/GenericTable";
import GenericTable from "../common/GenericTable";
import { useForm } from "react-hook-form";
import Swal from "sweetalert2";

interface BuscarPacienteProps{
    open: boolean;
    onClose: () => void;
    onSelectPaciente: (paciente: Paciente) => void;
}

export default function BuscarPaciente({
    onClose,
    open,
    onSelectPaciente
}: BuscarPacienteProps){
    const [pacientes, setPacientes] = useState<Paciente[]>([]);
    const {register, handleSubmit, reset, formState: {errors}} = useForm({
        defaultValues: {
            ci: '',
            nombre: '',
            apellido: ''
        }
    })
    const obtenerFilteredPacientes = async (filter: FilterPaciente) => {
        try{
            const pacientes = await filterPacientes(filter);
            console.log('pacientes', pacientes)
            setPacientes(pacientes);
        }catch(err: any){
            Swal.fire(
                'Error',
                `${err}`,
                'error'
            )
        }
    }

    useEffect(() => {
        reset({
            ci: '',
            nombre: '',
            apellido: ''
        });
    }, [ reset, open]);
    const columns: Column<Paciente>[] = [
        {field: 'ci', headerName: 'CI', align: 'center'},
        {field: 'nombre', headerName: 'Nombre', align: 'center'},
        {field: 'apellido', headerName: 'Apellido', align: 'center'},
        {field: 'fecha_nacimiento', headerName: 'Fecha de Nacimiento', align: 'center'},
        {field: 'telefono', headerName: 'Telefono', align: 'center'},
    ];

    const actions: TableAction<Paciente>[] = [
        {
            icon: <ArrowCircleRightRounded />,
            label: 'Seleccionar',
            onClick: (pacienteRow) => onSelectPaciente(pacienteRow)
        }
    ]

    return(
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth='lg'
            fullWidth
        >
            <DialogTitle>
                Buscar Paciente
            </DialogTitle>
            <form onSubmit={handleSubmit(v => obtenerFilteredPacientes(v))}>
                <DialogContent sx={{
                    height: '70vh'
                }}>
                    <Stack 
                        direction={'row'} 
                        justifyContent={'space-between'}
                        gap={2}
                        my={2}
                    >
                        <TextField
                            label='CI'
                            fullWidth
                            {...register('ci')}    
                        />
                        <TextField
                            label='Nombre'
                            fullWidth
                            {...register("nombre")}    
                        />
                        <TextField
                            label='Apellido'
                            fullWidth
                            {...register("apellido")}   
                        />
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={
                                <Search />
                            }
                            sx={{
                                width: '42%'
                            }}
                            type="submit"
                        >
                            Buscar
                        </Button>
                    </Stack>
                    <Box sx={{
                        opacity: pacientes.length > 0 ? 1 : 0.8,
                        mt: 4
                    }}>

                        <GenericTable
                            columns={columns}
                            actions={actions}
                            data={pacientes}
                        />

                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={onClose}
                    >Cancelar</Button>
                </DialogActions>
            </form>
        </Dialog>
    )
}