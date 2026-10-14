import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

/** Editable day-by-day itinerary builder for a tour package. */
export default function ItineraryField({ value = [], onChange }) {
  const days = Array.isArray(value) ? value : [];

  const updateAt = (index, patch) => {
    const next = days.slice();
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const removeAt = (index) => onChange(days.filter((_, i) => i !== index));

  const addDay = () => onChange([...days, { day: days.length + 1, title: '', details: '' }]);

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        Itinerary
      </Typography>
      <Stack spacing={1.5}>
        {days.map((item, index) => (
          <Stack
            key={index}
            direction="row"
            spacing={1}
            alignItems="flex-start"
            sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}
          >
            <Chip label={`Day ${item.day ?? index + 1}`} size="small" color="primary" sx={{ mt: 0.5 }} />
            <Stack spacing={1} sx={{ flexGrow: 1 }}>
              <TextField
                label="Title"
                value={item.title || ''}
                onChange={(event) => updateAt(index, { title: event.target.value })}
                size="small"
                fullWidth
              />
              <TextField
                label="Details"
                value={item.details || ''}
                onChange={(event) => updateAt(index, { details: event.target.value })}
                size="small"
                fullWidth
                multiline
                minRows={2}
              />
            </Stack>
            <IconButton onClick={() => removeAt(index)} aria-label="Remove day">
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button startIcon={<AddIcon />} onClick={addDay} size="small" sx={{ mt: 1 }}>
        Add day
      </Button>
    </Box>
  );
}
