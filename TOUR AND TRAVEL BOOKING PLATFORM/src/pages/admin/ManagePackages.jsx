import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import ArchiveIcon from '@mui/icons-material/Archive';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import PackageForm from '../../components/forms/PackageForm.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  allPackagesQuery,
  setPackagePublished,
  setPackageFeatured,
  archivePackage,
  deletePackage,
  isPackageReferenced,
} from '../../services/packageService.js';
import { allDestinationsQuery } from '../../services/destinationService.js';
import { allPromotionsQuery } from '../../services/promotionService.js';
import { logActivity } from '../../services/activityLogService.js';
import { formatPHP } from '../../utils/currency.js';
import useAuth from '../../hooks/useAuth.js';
import useDebounce from '../../hooks/useDebounce.js';

export default function ManagePackages() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: packages, loading } = useCollection(useMemo(() => allPackagesQuery(), []));
  const { data: destinations } = useCollection(useMemo(() => allDestinationsQuery(), []));
  const { data: promotions } = useCollection(useMemo(() => allPromotionsQuery(), []));

  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);
  const [destinationFilter, setDestinationFilter] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const destinationMap = useMemo(() => new Map(destinations.map((d) => [d.id, d])), [destinations]);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    return packages.filter((pkg) => {
      const matchesSearch = !term || pkg.name.toLowerCase().includes(term);
      const matchesDestination =
        destinationFilter === 'all' || pkg.destinationId === destinationFilter;
      return matchesSearch && matchesDestination;
    });
  }, [packages, debounced, destinationFilter]);

  const toggle = async (pkg, field, checked) => {
    try {
      if (field === 'isPublished') {
        await setPackagePublished(pkg.id, checked);
      } else {
        await setPackageFeatured(pkg.id, checked);
      }
      await logActivity({
        actorUid: user.uid,
        action: `${field === 'isPublished' ? 'publish' : 'feature'}_package`,
        targetType: 'tourPackage',
        targetId: pkg.id,
        metadata: { name: pkg.name, value: checked },
      });
    } catch (error) {
      showError('Could not update the package.');
    }
  };

  const handleArchive = async (pkg) => {
    try {
      await archivePackage(pkg.id);
      await logActivity({
        actorUid: user.uid,
        action: 'archive_package',
        targetType: 'tourPackage',
        targetId: pkg.id,
        metadata: { name: pkg.name },
      });
      showSuccess('Package archived.');
    } catch (error) {
      showError('Could not archive the package.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const referenced = await isPackageReferenced(deleteTarget.id);
      if (referenced) {
        showError('This package has bookings. Archive it instead of deleting.');
        setDeleteTarget(null);
        return;
      }
      await deletePackage(deleteTarget.id);
      await logActivity({
        actorUid: user.uid,
        action: 'delete_package',
        targetType: 'tourPackage',
        targetId: deleteTarget.id,
        metadata: { name: deleteTarget.name },
      });
      showSuccess('Package deleted.');
      setDeleteTarget(null);
    } catch (error) {
      showError('Could not delete the package.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: '',
      width: 64,
      render: (row) => (
        <Avatar variant="rounded" src={row.imageUrls && row.imageUrls[0]} sx={{ width: 44, height: 44 }} />
      ),
    },
    {
      key: 'name',
      label: 'Package',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {destinationMap.get(row.destinationId)?.name || 'No destination'}
          </Typography>
        </Box>
      ),
    },
    { key: 'price', label: 'Price', align: 'right', render: (row) => formatPHP(row.pricePerPerson) },
    {
      key: 'duration',
      label: 'Duration',
      align: 'center',
      render: (row) => `${row.durationDays}D/${row.durationNights}N`,
    },
    {
      key: 'isPublished',
      label: 'Published',
      align: 'center',
      render: (row) => (
        <Switch
          checked={Boolean(row.isPublished)}
          onChange={(event) => toggle(row, 'isPublished', event.target.checked)}
          size="small"
        />
      ),
    },
    {
      key: 'isFeatured',
      label: 'Featured',
      align: 'center',
      render: (row) => (
        <Switch
          checked={Boolean(row.isFeatured)}
          onChange={(event) => toggle(row, 'isFeatured', event.target.checked)}
          size="small"
          color="secondary"
        />
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
          <Tooltip title="Archive">
            <IconButton size="small" onClick={() => handleArchive(row)}>
              <ArchiveIcon fontSize="small" />
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
            Tour Packages
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {packages.length} package(s)
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
          New package
        </Button>
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField
          label="Search packages"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          sx={{ maxWidth: 320 }}
        />
        <TextField
          select
          label="Destination"
          value={destinationFilter}
          onChange={(event) => setDestinationFilter(event.target.value)}
          size="small"
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="all">All destinations</MenuItem>
          {destinations.map((destination) => (
            <MenuItem key={destination.id} value={destination.id}>
              {destination.name}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No tour packages"
        emptyDescription="Create a package to start selling tours."
      />

      <PackageForm
        open={formOpen}
        initial={editing}
        destinations={destinations}
        promotions={promotions}
        onClose={() => setFormOpen(false)}
        onSaved={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete package"
        message={`Delete "${deleteTarget?.name || ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
