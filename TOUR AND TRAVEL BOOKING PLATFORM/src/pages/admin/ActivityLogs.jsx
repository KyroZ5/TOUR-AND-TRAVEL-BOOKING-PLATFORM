import { useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import PaginatedTable from '../../components/tables/PaginatedTable.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { activityLogsQuery } from '../../services/activityLogService.js';
import { formatDateTime } from '../../utils/date.js';
import useDebounce from '../../hooks/useDebounce.js';

export default function ActivityLogs() {
  const { data: logs, loading } = useCollection(useMemo(() => activityLogsQuery(300), []));
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    const term = debounced.trim().toLowerCase();
    if (!term) return logs;
    return logs.filter(
      (log) =>
        (log.action || '').toLowerCase().includes(term) ||
        (log.targetType || '').toLowerCase().includes(term) ||
        (log.actorUid || '').toLowerCase().includes(term)
    );
  }, [logs, debounced]);

  const columns = [
    {
      key: 'createdAt',
      label: 'When',
      render: (row) => <Typography variant="body2">{formatDateTime(row.createdAt)}</Typography>,
    },
    {
      key: 'action',
      label: 'Action',
      render: (row) => (
        <Chip
          label={(row.action || 'action').replace(/_/g, ' ')}
          size="small"
          variant="outlined"
        />
      ),
    },
    { key: 'targetType', label: 'Target', render: (row) => row.targetType || '—' },
    {
      key: 'targetId',
      label: 'Target ID',
      render: (row) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {row.targetId || '—'}
        </Typography>
      ),
    },
    {
      key: 'actorUid',
      label: 'Actor',
      render: (row) => (
        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
          {row.actorUid || '—'}
        </Typography>
      ),
    },
    {
      key: 'metadata',
      label: 'Details',
      render: (row) =>
        row.metadata && Object.keys(row.metadata).length > 0 ? (
          <Typography variant="caption" color="text.secondary">
            {Object.entries(row.metadata)
              .map(([key, value]) => `${key}: ${value}`)
              .join(', ')}
          </Typography>
        ) : (
          '—'
        ),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Activity Logs
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        An immutable record of administrative actions, most recent first.
      </Typography>

      <TextField
        label="Search actions, targets, or actors"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        size="small"
        fullWidth
        sx={{ mb: 2, maxWidth: 420 }}
      />

      <PaginatedTable
        columns={columns}
        rows={filtered}
        loading={loading}
        emptyTitle="No activity yet"
        emptyDescription="Administrative actions will be recorded here."
        defaultRowsPerPage={25}
      />
    </Box>
  );
}
