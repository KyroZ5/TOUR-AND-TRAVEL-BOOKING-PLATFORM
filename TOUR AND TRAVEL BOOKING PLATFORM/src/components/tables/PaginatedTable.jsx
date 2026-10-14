import { useMemo, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import EmptyState from '../common/EmptyState.jsx';

/**
 * Generic paginated, horizontally scrollable Material UI table.
 *
 * columns: [{ key, label, align?, width?, render?(row) }]
 */
export default function PaginatedTable({
  columns,
  rows = [],
  getRowId = (row) => row.id,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = '',
  rowsPerPageOptions = [5, 10, 25, 50],
  defaultRowsPerPage = 10,
  onRowClick,
  dense = false,
}) {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);

  const pageRows = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  if (loading) {
    return (
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          {[0, 1, 2, 3, 4].map((key) => (
            <Skeleton key={key} height={44} />
          ))}
        </Box>
      </Paper>
    );
  }

  if (rows.length === 0) {
    return (
      <Paper variant="outlined">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </Paper>
    );
  }

  return (
    <Paper variant="outlined">
      <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
        <Table size={dense ? 'small' : 'medium'} stickyHeader={false}>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  align={column.align || 'left'}
                  sx={{ fontWeight: 700, whiteSpace: 'nowrap', width: column.width }}
                >
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {pageRows.map((row) => (
              <TableRow
                key={getRowId(row)}
                hover={Boolean(onRowClick)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                sx={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align || 'left'}>
                    {column.render ? column.render(row) : row[column.key]}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={rows.length}
        page={page}
        onPageChange={(event, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(event) => {
          setRowsPerPage(parseInt(event.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={rowsPerPageOptions}
      />
    </Paper>
  );
}
