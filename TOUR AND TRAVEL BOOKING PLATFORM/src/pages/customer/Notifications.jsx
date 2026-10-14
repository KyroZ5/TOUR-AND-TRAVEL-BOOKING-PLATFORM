import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Badge from '@mui/material/Badge';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { useSnackbar } from '../../contexts/SnackbarContext.jsx';
import {
  notificationsByUserQuery,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from '../../services/notificationService.js';
import { formatDateTime } from '../../utils/date.js';
import useAuth from '../../hooks/useAuth.js';

export default function Notifications() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();

  const { data: notifications, loading } = useCollection(
    useMemo(() => (user ? notificationsByUserQuery(user.uid) : null), [user])
  );

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleOpen = async (notification) => {
    try {
      if (!notification.isRead) {
        await markNotificationRead(notification.id, true);
      }
    } catch (error) {
      // Marking read is best-effort.
    }
    if (notification.relatedBookingId) {
      navigate(`/account/bookings/${notification.relatedBookingId}`);
    }
  };

  const handleMarkAll = async () => {
    try {
      await markAllNotificationsRead(notifications);
      showSuccess('All notifications marked as read.');
    } catch (error) {
      showError('Could not mark notifications as read.');
    }
  };

  const handleDelete = async (event, notification) => {
    event.stopPropagation();
    try {
      await deleteNotification(notification.id);
    } catch (error) {
      showError('Could not delete this notification.');
    }
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography variant="h4" fontWeight={800}>
            Notifications
          </Typography>
          {unreadCount > 0 ? <Chip label={`${unreadCount} new`} color="secondary" size="small" /> : null}
        </Stack>
        {notifications.length > 0 ? (
          <Button startIcon={<DoneAllIcon />} onClick={handleMarkAll} disabled={unreadCount === 0}>
            Mark all read
          </Button>
        ) : null}
      </Stack>

      {loading ? (
        <Typography variant="body2" color="text.secondary">
          Loading notifications…
        </Typography>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent>
            <EmptyState
              icon={<NotificationsNoneIcon sx={{ fontSize: 48 }} color="disabled" />}
              title="No notifications"
              description="Updates about your bookings will appear here."
            />
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={1.5}>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              onClick={() => handleOpen(notification)}
              sx={{
                cursor: 'pointer',
                borderLeft: '4px solid',
                borderLeftColor: notification.isRead ? 'divider' : 'secondary.main',
                bgcolor: notification.isRead ? 'background.paper' : 'action.hover',
              }}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                  <Box sx={{ flexGrow: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Badge color="secondary" variant="dot" invisible={notification.isRead}>
                        <Typography fontWeight={notification.isRead ? 600 : 800}>
                          {notification.title}
                        </Typography>
                      </Badge>
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {notification.message}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDateTime(notification.createdAt)}
                    </Typography>
                  </Box>
                  <Tooltip title="Delete">
                    <IconButton size="small" onClick={(event) => handleDelete(event, notification)}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
}
