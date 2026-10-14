import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';

/** Editable list of free-text values (inclusions, image URLs, etc.). */
export default function StringListField({
  label,
  values = [],
  onChange,
  error,
  helperText,
  placeholder = '',
  addLabel = 'Add item',
}) {
  const list = Array.isArray(values) ? values : [];

  const updateAt = (index, value) => {
    const next = list.slice();
    next[index] = value;
    onChange(next);
  };

  const removeAt = (index) => onChange(list.filter((_, i) => i !== index));

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
        {label}
      </Typography>
      <Stack spacing={1}>
        {list.map((value, index) => (
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <TextField
              value={value}
              onChange={(event) => updateAt(index, event.target.value)}
              placeholder={placeholder}
              size="small"
              fullWidth
              error={Boolean(error)}
            />
            <IconButton onClick={() => removeAt(index)} aria-label="Remove item">
              <DeleteOutlineIcon />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Button startIcon={<AddIcon />} onClick={() => onChange([...list, ''])} size="small" sx={{ mt: 1 }}>
        {addLabel}
      </Button>
      {error || helperText ? (
        <FormHelperText error={Boolean(error)}>{error || helperText}</FormHelperText>
      ) : null}
    </Box>
  );
}
