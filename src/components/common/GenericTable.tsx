import { Box, Button, IconButton, InputAdornment, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, TextField } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PictureAsPdf, Search, TextSnippet } from "@mui/icons-material";

declare module 'jspdf'{
    interface jsPDF{
        autoTable: typeof autoTable;
    }
}

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
    canExportPdf?: boolean;
    canExportExcel?: boolean;
}

export default function GenericTable<T extends {id: string | number}>({
    columns,
    data,
    actions = [],
    rowsPerPageOptions = [5, 10, 20],
    defaultRowsPerPage = 5,
    canExportExcel = false,
    canExportPdf = false,
}: GenericTableProps<T>) {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
    const [filterText, setFilterText] = useState('');

    const handleChangePage = (_: unknown, newPage: number) => setPage(newPage);
    const handleChangeRowsPerPage = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
    };

    const exportableColumns = columns.filter(col => col.field !== 'image' && col.field !== 'imagen');
    
    const filteredData = useMemo(() => {
        if (!filterText.trim()) return data;

        const lowerFilter = filterText.toLowerCase();

        return data.filter((row) =>
            exportableColumns.some(col => {
                const value = (row as any)[col.field];
                // Si hay una función de render que devuelve texto
                if (col.render) {
                    // console.log('col.reder value', value)
                    const rendered = col.render(value, row);
                    if (typeof rendered === 'string' || typeof rendered === 'number') {
                        return rendered.toString().toLowerCase().includes(lowerFilter);
                    }

                    if (Array.isArray(value)) {
                        if(col.field === 'disponibilidades') console.log('disponibilidades', value);
                        return value.some(item =>{
                            if(typeof item === 'object'){
                                return Object.values(item).join().toLowerCase().includes(lowerFilter);
                            }
                            return String(item).toLowerCase().includes(lowerFilter)
                        });
                    }
                    // return false;
                }
                
                // Arrays de strings
                if (Array.isArray(value)) {
                    // console.log('value',value)
                    return value.some(item =>
                        String(item).toLowerCase().includes(lowerFilter)
                    );
                }

                
                // Booleanos
                if (typeof value === 'boolean') {
                    return (value ? 'sí' : 'no').includes(lowerFilter);
                }
                
                // Null o undefined
                if (value == null) return false;
                
                // Strings, números, etc.
                return String(value).toLowerCase().includes(lowerFilter);
            })
        );
    }, [data, filterText, exportableColumns]);


    const paginatedData = useMemo(
        () => filteredData.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
        [filteredData, page, rowsPerPage]
    );

    

    const exportToExcel = () => {
        // const headers = exportableColumns.map(col => col.headerName);
        const exportData = data.map((row, idx) => {
            const rowData: any = {};
            rowData['#'] = data.length - idx;
            exportableColumns.forEach(col => {
                const value = (row as any)[col.field];

                if(typeof value === 'boolean'){
                    rowData[col.headerName] = value ? 'Sí' : 'No';
                }else if(col.render){
                    const rendered = col.render(value, row);
                    rowData[col.headerName] = typeof rendered === 'string' || typeof rendered === 'number'
                        ? rendered
                        : String(value);
                }else{
                    rowData[col.headerName] = value ?? '';
                }
            });
            return rowData;
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

        const excelBuffer = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
        const file = new Blob([excelBuffer], {type:'application/octet-stream'});
        saveAs(file, 'excelTable.xlsx');
    }

    const exportToPDF = () => {
        const doc = new jsPDF();

        const headers = [['#', ...exportableColumns.map(col => col.headerName)]];
        const body = data.map((row, idx) => [
                data.length - idx,
                ...exportableColumns.map(col => {
                const value = (row as any)[col.field];

                if(typeof value === 'boolean'){
                    return value ? 'Sí' : 'No';
                }

                if(col.render){
                    const rendered = col.render(value, row);

                    if(typeof rendered === 'string' || typeof rendered === 'number') return rendered;

                    return String(value)
                }

                return value ?? '';
            })
            ]
        );

        autoTable(doc, {
            head: headers,
            body: body,
            styles: {fontSize: 9},
            headStyles: {fillColor: [245, 169, 195]},
            startY: 14
        });

        doc.save('pdfTable.pdf');
    }

    useEffect(() => {
        console.log('filtered data', filteredData)
    }, [filteredData])
    return (
        <Box>
            <Stack direction={'row'} spacing={2} mb={1} justifyContent={'space-between'} alignItems={'center'}>
                <TextField
                    size="small"
                    variant="outlined"
                    label='Buscar...'
                    value={filterText}
                    onChange={e => setFilterText(e.target.value)}
                    slotProps={{input:{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Search color="primary"/>
                            </InputAdornment>
                        )
                    }}}
                    sx={{width: 200}}
                />
                <Stack direction="row" spacing={1} mb={1}>
                    {canExportExcel && (
                        <Button 
                            startIcon={<TextSnippet />} 
                            onClick={exportToExcel} 
                            variant="outlined" 
                            size="small" 
                            color="warning"
                        >
                            Exportar a Excel
                        </Button>
                    )}
                    {canExportPdf && (
                        <Button 
                            startIcon={<PictureAsPdf />} 
                            onClick={exportToPDF} 
                            variant="outlined" 
                            size="small" 
                            color="warning"
                        >
                            Exportar a PDF
                        </Button>
                    )}
                </Stack>
            </Stack>
            <TableContainer component={Paper} sx={{borderRadius: 1}}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow
                            sx={{
                                backgroundColor: (theme) => theme.palette.primary.main,
                                '& th': {
                                    backgroundColor: (theme) => theme.palette.primary.main,
                                    color: (theme) => theme.palette.primary.contrastText,
                                    fontWeight: 600,
                                    // fontSize: '1.12rem',
                                    // letterSpacing: 0.5,
                                    borderBottom: 3,
                                    borderColor: 'primary.dark',
                                    boxShadow: 2,
                                    zIndex: 1
                                }
                            }}
                        >
                            <TableCell align="center" sx={{ width: 20 }}>N°</TableCell>
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
                        {paginatedData.map((row, index) => (
                            <TableRow key={row.id}>
                                <TableCell align="center">
                                    {data.length - (page * rowsPerPage + index)}
                                </TableCell>
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
                                <TableCell colSpan={columns.length + (actions.length > 0 ? 1 : 0) + 1} align="center">
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
        </Box>
    )
}