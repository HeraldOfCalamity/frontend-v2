import { IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow } from "@mui/material";
import { useMemo, useState } from "react";

export interface Column<T> {
    field: keyof T | string;
    headerName: string;
    render?: (value: any, row: T) => React.ReactNode;
    width?: number | string;
    align?: 'left' | 'center' | 'right';
}

export interface TableAction<T>{
    icon: React.ReactNode;
    label: string;
    onClick: (row: T) => void;
    color?: 'primary' | 'secondary' | 'error' | 'info';
}

interface GenericTableProps<T> {
    columns: Column<T>[];
    data: T[];
    actions?: TableAction<T>[];
    rowsPerPageOptions?: number[];
    defaultRowsPerPage?: number;
}

export default function GenericTable<T extends {id: string | number}>({
    columns,
    data,
    actions = [],
    rowsPerPageOptions = [5, 10, 20],
    defaultRowsPerPage = 5
}: GenericTableProps<T>) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const paginatedData = useMemo(
        () => data.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [data, page, rowsPerPage]
    );

    return (
        <TableContainer component={Paper} sx={{borderRadius: 1}}>
            <Table stickyHeader>
                <TableHead>
                    <TableRow
                        sx={{
                            backgroundColor: (theme) => theme.palette.primary.main,
                            '& th': {
                                backgroundColor: (theme) => theme.palette.primary.main,
                                color: (theme) => theme.palette.primary.contrastText,
                                fontWeight: 800,
                                fontSize: '1.12rem',
                                letterSpacing: 0.5,
                                borderBottom: 3,
                                borderColor: 'primary.dark',
                                boxShadow: 2,
                                zIndex: 1
                            }
                        }}
                    >
                        {columns.map(col => (
                            <TableCell 
                                key={String(col.field)} 
                                align={col.align || 'left'} 
                                style={{ width: col.width }}
                            >
                                {col.headerName}
                            </TableCell>
                        ))}
                        {actions.length > 0 && (
                            <TableCell 
                                align="center"
                            >
                                Acciones
                            </TableCell>
                        )}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paginatedData.map(row => (
                        <TableRow key={row.id}>
                            {columns.map(col => (
                                <TableCell key={String(col.field)} align={col.align || 'left'}>
                                    {col.render
                                        ? col.render((row as any)[col.field], row)
                                        : (row as any)[col.field]}
                                </TableCell>
                            ))}
                            {actions.length > 0 && (
                                <TableCell align="center">
                                    {actions.map(action => (
                                        <IconButton
                                            key={action.label}
                                            title={action.label}
                                            color={action.color || 'primary'}
                                            onClick={() => action.onClick(row)}
                                        >
                                            {action.icon}
                                        </IconButton>
                                    ))}
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                    {paginatedData.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0)} align="center">
                                No hay datos disponibles.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            <TablePagination
                component='div'
                count={data.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={rowsPerPageOptions}
                labelRowsPerPage='Filas por página'
            />
        </TableContainer>
    )
}