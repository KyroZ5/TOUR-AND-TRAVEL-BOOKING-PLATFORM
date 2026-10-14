import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InboxIcon from '@mui/icons-material/Inbox';

/** Friendly empty-state placeholder for lists and tables. */
export default function EmptyState({
  icon = <InboxIcon sx={{ fontSize: 48, color: 'text.disabled' }} />,
  title = 'Nothing here yet',
  description = '',
  action = null,
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: 1,
        py: 6,
        px: 2,
      }}
    >
      {icon}
      <Typography variant="subtitle1" fontWeight={600}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action}
    </Box>
  );
}
