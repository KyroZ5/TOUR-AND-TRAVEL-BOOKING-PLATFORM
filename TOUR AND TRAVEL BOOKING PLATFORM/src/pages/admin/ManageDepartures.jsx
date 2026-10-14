import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import StatusChip from '../../components/common/StatusChip.jsx';
import DepartureForm from '../../components/forms/DepartureForm.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  allDeparturesQuery,
  setDepartureStatus,
  deleteDeparture,
  remainingSlots,
} from '../../services/departureService.js';
import { allPackagesQuery } from '../../services/packageService.js';
import { logActivity } from '../../services/activityLogService.js';
import { formatDate } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';

const STATUS_OPTIONS = ['open', 'closed', 'cancelled', 'completed'];

export default function ManageDepartures() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: departures, loading } = useCollection(useMemo(() => allDeparturesQuery(), []));
  const { data: packages } = useCollection(useMemo(() => allPackagesQuery(), []));
  const [packageFilter, setPackageFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const packageMap = useMemo(() => new Map(packages.map((p) => [p.id, p])), [packages]);

  const filtered = useMemo(
    () =>
      packageFilter === 'all'
        ? departures
        : departures.filter((d) => d.packageId === packageFilter),
    [departures, packageFilter]
  );

  const changeStatus = async (departure, status) => {
    try {
      await setDepartureStatus(departure.id, status);
      await logActivity({
        actorUid: user.uid,
        action: 'update_departure_status',
        targetType: 'departure',
        targetId: departure.id,
        metadata: { status },
      });
    } catch (error) {
      showError('Could not update the departure status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      if (Number(deleteTarget.bookedCount) > 0) {
        showError('This departure has bookings. Mark it cancelled instead.');
        setDeleteTarget(null);
        return;
      }
      await deleteDeparture(deleteTarget.id);
      await logActivity({
        actorUid: user.uid,
        action: 'delete_departure',
        targetType: 'departure',
        targetId: deleteTarget.id,
        metadata: { packageId: deleteTarget.packageId },
      });
      showSuccess('Departure deleted.');
      setDeleteTarget(null);
    } catch (error) {
      showError('Could not delete the departure.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'package',
      label: 'Package',
      render: (row) => (
        <Typography variant="body2" fontWeight={700}>
          {packageMap.get(row.packageId)?.name || 'Unknown package'}
        </Typography>
      ),
    },
    { key: 'departureDate', label: 'Departure', render: (row) => formatDate(row.departureDate) },
    { key: 'returnDate', label: 'Return', render: (row) => formatDate(row.returnDate) },
    {
      key: 'seats',
      label: 'Seats',
      render: (row) => {
        const capacity = Number(row.capacity) || 0;
        const booked = Number(row.bookedCount) || 0;
        const percent = capacity > 0 ? (booked / capacity) * 100 : 0;
        return (
          <Box sx={{ minWidth: 140 }}>
            <Stack direction="row" justifyContent="space-between">
              <Typography variant="caption">
                {booked}/{capacity} booked
              </Typography>
              <Typography variant="caption" fontWeight={700}>
                {remainingSlots(row)} left
              </Typography>
            </Stack>
            <LinearProgress
              variant="determinate"
              value={Math.min(100, percent)}
              sx={{ height: 6, borderRadius: 1, mt: 0.5 }}
              color={percent >= 100 ? 'error' : 'primary'}
            />
          </Box>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Stack direction="row" spacing={1} alignItems="center">
          <StatusChip type="departure" value={row.status} />
          <TextField
            select
            value={row.status || 'open'}
            onChange={(event) => changeStatus(row, event.target.value)}
            size="small"
            variant="standard"
            sx={{ minWidth: 96 }}
          >
            {STATUS_OPTIONS.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setEditing(row);
                setFormOpen(true);
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Departures
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {departures.length} scheduled departure(s)
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          Schedule departure
        </Button>
      </Stack>

      <TextField
        select
        label="Filter by package"
        value={packageFilter}
        onChange={(event) => setPackageFilter(event.target.value)}
        size="small"
        sx={{ mb: 2, minWidth: 260 }}
      >
        <MenuItem value="all">All packages</MenuItem>
        {packages.map((pkg) => (
          <MenuItem key={pkg.id} value={pkg.id}>
            {pkg.name}
          </MenuItem>
        ))}
      </TextField>

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No departures"
        emptyDescription="Schedule a departure to open a package for booking."
      />

      <DepartureForm
        open={formOpen}
        initial={editing}
        packages={packages}
        onClose={() => setFormOpen(false)}
        onSaved={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete departure"
        message="Delete this departure? This cannot be undone."
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
