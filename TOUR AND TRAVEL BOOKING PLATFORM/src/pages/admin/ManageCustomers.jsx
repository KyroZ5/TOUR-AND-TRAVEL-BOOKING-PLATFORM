import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import { customersQuery, setAccountStatus } from '../../services/userService.js';
import { logActivity } from '../../services/activityLogService.js';
import { formatDate } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';
import useDebounce from '../../hooks/useDebounce.js';

export default function ManageCustomers() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: customers, loading } = useCollection(useMemo(() => customersQuery(), []));
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);
  const [statusFilter, setStatusFilter] = useState('all');
  const [target, setTarget] = useState(null);
  const [working, setWorking] = useState(false);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return customers.filter((customer) => {
      const matchesStatus = statusFilter === 'all' || customer.accountStatus === statusFilter;
      const matchesTerm =
        !term ||
        (customer.fullName || '').toLowerCase().includes(term) ||
        (customer.email || '').toLowerCase().includes(term) ||
        (customer.phone || '').toLowerCase().includes(term);
      return matchesStatus && matchesTerm;
    });
  }, [customers, debounced, statusFilter]);

  const toggleStatus = async () => {
    if (!target) return;
    const nextStatus = target.accountStatus === 'active' ? 'disabled' : 'active';
    setWorking(true);
    try {
      await setAccountStatus(target.id, nextStatus);
      await logActivity({
        actorUid: user.uid,
        action: `${nextStatus === 'active' ? 'enable' : 'disable'}_customer`,
        targetType: 'user',
        targetId: target.id,
        metadata: { email: target.email },
      });
      showSuccess(`Customer ${nextStatus === 'active' ? 'enabled' : 'disabled'}.`);
      setTarget(null);
    } catch (error) {
      showError('Could not update the customer account.');
    } finally {
      setWorking(false);
    }
  };

  const initials = (name) =>
    (name || '?')
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  const columns = [
    {
      key: 'name',
      label: 'Customer',
      render: (row) => (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 36, height: 36 }}>{initials(row.fullName)}</Avatar>
          <Box>
            <Typography variant="body2" fontWeight={700}>
              {row.fullName || 'Unnamed'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {row.email}
            </Typography>
          </Box>
        </Stack>
      ),
    },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    {
      key: 'accountStatus',
      label: 'Status',
      render: (row) => <StatusChip type="account" value={row.accountStatus || 'active'} />,
    },
    { key: 'createdAt', label: 'Joined', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          size="small"
          variant="outlined"
          color={row.accountStatus === 'active' ? 'error' : 'success'}
          onClick={() => setTarget(row)}
        >
          {row.accountStatus === 'active' ? 'Disable' : 'Enable'}
        </Button>
      ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Customers
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {customers.length} registered customer(s)
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search name, email, or phone"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          sx={{ maxWidth: 360 }}
        />
        <TextField
          select
          label="Account status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          size="small"
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="all">All</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="disabled">Disabled</MenuItem>
        </TextField>
      </Stack>

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No customers"
        emptyDescription="Registered customers will appear here."
      />

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.accountStatus === 'active' ? 'Disable account' : 'Enable account'}
        message={
          target?.accountStatus === 'active'
            ? `Disable ${target?.email || 'this customer'}? They will not be able to sign in.`
            : `Re-enable ${target?.email || 'this customer'}?`
        }
        confirmLabel={target?.accountStatus === 'active' ? 'Disable' : 'Enable'}
        confirmColor={target?.accountStatus === 'active' ? 'error' : 'primary'}
        loading={working}
        onConfirm={toggleStatus}
        onClose={() => setTarget(null)}
      />
    </Box>
  );
}
