import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import ConfirmDialog from '../../components/common/ConfirmDialog.jsx';
import PromotionForm from '../../components/forms/PromotionForm.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  allPromotionsQuery,
  setPromotionActive,
  deletePromotion,
  isPromotionActive,
} from '../../services/promotionService.js';
import { allPackagesQuery } from '../../services/packageService.js';
import { logActivity } from '../../services/activityLogService.js';
import { formatDate } from '../../utils/date.js';
import { formatPHP } from '../../utils/currency.js';
import useAuth from '../../hooks/useAuth.js';

export default function Promotions() {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const { data: promotions, loading } = useCollection(useMemo(() => allPromotionsQuery(), []));
  const { data: packages } = useCollection(useMemo(() => allPackagesQuery(), []));
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const toggleActive = async (promotion, checked) => {
    try {
      await setPromotionActive(promotion.id, checked);
      await logActivity({
        actorUid: user.uid,
        action: `${checked ? 'activate' : 'deactivate'}_promotion`,
        targetType: 'promotion',
        targetId: promotion.id,
        metadata: { title: promotion.title },
      });
    } catch (error) {
      showError('Could not update the promotion.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deletePromotion(deleteTarget.id);
      await logActivity({
        actorUid: user.uid,
        action: 'delete_promotion',
        targetType: 'promotion',
        targetId: deleteTarget.id,
        metadata: { title: deleteTarget.title },
      });
      showSuccess('Promotion deleted.');
      setDeleteTarget(null);
    } catch (error) {
      showError('Could not delete the promotion.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      key: 'image',
      label: '',
      width: 64,
      render: (row) => <Avatar variant="rounded" src={row.imageUrl} sx={{ width: 44, height: 44 }} />,
    },
    {
      key: 'title',
      label: 'Promotion',
      render: (row) => (
        <Box>
          <Typography variant="body2" fontWeight={700}>
            {row.title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.discountType === 'percent'
              ? `${row.discountValue}% off`
              : `${formatPHP(row.discountValue)} off`}
          </Typography>
        </Box>
      ),
    },
    {
      key: 'applicable',
      label: 'Packages',
      align: 'center',
      render: (row) => (
        <Chip
          label={
            row.applicablePackageIds && row.applicablePackageIds.length > 0
              ? `${row.applicablePackageIds.length} package(s)`
              : 'All packages'
          }
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      key: 'window',
      label: 'Active window',
      render: (row) => (
        <Typography variant="caption">
          {formatDate(row.startDate)} – {formatDate(row.endDate)}
        </Typography>
      ),
    },
    {
      key: 'isActive',
      label: 'Active',
      align: 'center',
      render: (row) => (
        <Stack alignItems="center" spacing={0.5}>
          <Switch
            checked={Boolean(row.isActive)}
            onChange={(event) => toggleActive(row, event.target.checked)}
            size="small"
          />
          {isPromotionActive(row) ? <Chip label="Running" color="success" size="small" /> : null}
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
            Promotions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {promotions.length} promotion(s)
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
          New promotion
        </Button>
      </Stack>

      <PaginatedTable
        columns={columns}
        rows={promotions}
        loading={loading}
        emptyTitle="No promotions"
        emptyDescription="Create a promotion to highlight special offers."
      />

      <PromotionForm
        open={formOpen}
        initial={editing}
        packages={packages}
        onClose={() => setFormOpen(false)}
        onSaved={() => setFormOpen(false)}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete promotion"
        message={`Delete "${deleteTarget?.title || ''}"? This cannot be undone.`}
        confirmLabel="Delete"
        confirmColor="error"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </Box>
  );
}
