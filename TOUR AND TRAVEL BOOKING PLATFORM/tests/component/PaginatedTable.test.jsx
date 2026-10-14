import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginatedTable from '../../src/components/tables/PaginatedTable.jsx';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'count', label: 'Count', align: 'right' },
];

function makeRows(n) {
  return Array.from({ length: n }, (_, i) => ({ id: `r${i + 1}`, name: `Row ${i + 1}`, count: i + 1 }));
}

describe('PaginatedTable', () => {
  it('shows the empty state when there are no rows', () => {
    render(
      <PaginatedTable columns={columns} rows={[]} emptyTitle="No bookings yet" emptyDescription="Try again" />
    );
    expect(screen.getByText('No bookings yet')).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a loading skeleton instead of a table', () => {
    render(<PaginatedTable columns={columns} rows={makeRows(3)} loading />);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.queryByText('Row 1')).not.toBeInTheDocument();
  });

  it('renders headers and the first page of rows', () => {
    render(<PaginatedTable columns={columns} rows={makeRows(12)} defaultRowsPerPage={10} />);
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Row 1')).toBeInTheDocument();
    expect(screen.getByText('Row 10')).toBeInTheDocument();
    expect(screen.queryByText('Row 11')).not.toBeInTheDocument();
  });

  it('paginates to the next page', async () => {
    const user = userEvent.setup();
    render(<PaginatedTable columns={columns} rows={makeRows(12)} defaultRowsPerPage={10} />);
    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(screen.getByText('Row 11')).toBeInTheDocument();
    expect(screen.getByText('Row 12')).toBeInTheDocument();
    expect(screen.queryByText('Row 1')).not.toBeInTheDocument();
  });

  it('calls onRowClick with the clicked row', async () => {
    const user = userEvent.setup();
    const onRowClick = vi.fn();
    render(<PaginatedTable columns={columns} rows={makeRows(3)} onRowClick={onRowClick} />);
    await user.click(screen.getByText('Row 2'));
    expect(onRowClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'r2', name: 'Row 2' }));
  });

  it('uses a custom column render function', () => {
    const customColumns = [
      { key: 'name', label: 'Name', render: (row) => <strong>{row.name.toUpperCase()}</strong> },
    ];
    render(<PaginatedTable columns={customColumns} rows={makeRows(2)} />);
    expect(screen.getByText('ROW 1')).toBeInTheDocument();
  });
});
