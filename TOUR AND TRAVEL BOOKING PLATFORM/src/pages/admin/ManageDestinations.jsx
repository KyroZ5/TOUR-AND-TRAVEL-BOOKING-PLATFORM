import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
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
import DestinationForm from '../../components/forms/DestinationForm.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  allDestinationsQuery,
  setDestinationPublished,
  setDestinationFeatured,
  archiveDestination,
  deleteDestination,
  isDestinationReferenced,
} from '../../services/destinationService.js';
import { logActivity } from '../../services/activityLogService.js';
import useAuth from '../../hooks/useAuth.js';
import useDebounce from '../../hooks/useDebounce.js';

export default function ManageDestinations() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: destinations, loading } = useCollection(useMemo(() => allDestinationsQuery(), []));
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    if (!term) return destinations;
    return destinations.filter(
      (d) =>
        d.name.toLowerCase().includes(term) ||
        (d.country || '').toLowerCase().includes(term) ||
        (d.location || '').toLowerCase().includes(term)
    );
  }, [destinations, debounced]);

  const toggle = async (destination, field, checked) => {
    try {
      if (field === 'isPublished') {
        await setDestinationPublished(destination.id, checked);
      } else {
        await setDestinationFeatured(destination.id, checked);
      }
      await logActivity({
        actorUid: user.uid,
        action: `${field === 'isPublished' ? 'publish' : 'feature'}_destination`,
        targetType: 'destination',
        targetId: destination.id,
        metadata: { name: destination.name, value: checked },
      });
    } catch (error) {
      showError('Could not update the destination.');
    }
  };

  const handleArchive = async (destination) => {
    try {
      await archiveDestination(destination.id);
      await logActivity({
        actorUid: user.uid,
        action: 'archive_destination',
        targetType: 'destination',
        targetId: destination.id,
        metadata: { name: destination.name },
      });
      showSuccess('Destination archived.');
    } catch (error) {
      showError('Could not archive the destination.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const referenced = await isDestinationReferenced(deleteTarget.id);
      if (referenced) {
        showError('This destination is used by tour packages. Archive it instead.');
        setDeleteTarget(null);
        return;
      }
      await deleteDestination(deleteTarget.id);
      await logActivity({
        actorUid: user.uid,
        action: 'delete_destination',
        targetType: 'destination',
        targetId: deleteTarget.id,
        metadata: { name: deleteTarget.name },
      });
      showSuccess('Destination deleted.');
      setDeleteTarget(null);
    } catch (error) {
      showError('Could not delete the destination.');
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
        <Avatar
          variant="rounded"
          src={row.imageUrls && row.imageUrls[0]}
          sx={{ width: 44, height: 44 }}
        />
      ),
    },
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {[row.location, row.country].filter(Boolean).join(', ')}
          </Typography>
        </Box>
      ),
    },
    { key: 'category', label: 'Category', render: (row) => <Chip label={row.category} size="small" variant="outlined" /> },
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
            Destinations
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {destinations.length} destination(s)
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
          New destination
        </Button>
      </Stack>

      <TextField
        label="Search destinations"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: 400 }}
      />

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No destinations"
        emptyDescription="Create your first destination to get started."
      />

      <DestinationForm
        open={formOpen}
        initial={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete destination"
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
