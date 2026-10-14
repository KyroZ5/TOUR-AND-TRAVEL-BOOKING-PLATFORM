import { useEffect, useState } from 'react';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import useDebounce from '../../hooks/useDebounce.js';
import { searchDestinations, hasLocationApiKey } from '../../services/api/locationApi.js';

/**
 * Destination search field used in the homepage hero.
 *
 * - Uses Geoapify autocomplete when an API key is configured.
 * - Always allows free-text submission so the curated Firestore destinations
 *   can be searched even when the external API is unavailable.
 */
export default function SearchBar({
  value,
  onInputChange,
  onSelect,
  onSubmit,
  placeholder = 'Where would you like to go?',
  label = 'Search destinations',
  autoFocus = false,
  countryCode = '',
}) {
  const [inputValue, setInputValue] = useState(value || '');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debouncedInput = useDebounce(inputValue, 450);

  useEffect(() => {
    if (value !== undefined) {
      setInputValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (!hasLocationApiKey()) {
      return undefined;
    }
    const text = (debouncedInput || '').trim();
    if (text.length < 2) {
      setOptions([]);
      setError('');
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError('');

    searchDestinations(text, { signal: controller.signal, countryCode })
      .then((results) => {
        if (active) {
          setOptions(results);
        }
      })
      .catch((err) => {
        if (active && err.code !== 'ABORTED') {
          setOptions([]);
          setError('Search suggestions are unavailable right now.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [debouncedInput, countryCode]);

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    if (onInputChange) {
      onInputChange(newInputValue);
    }
  };

  const handleChange = (event, selected) => {
    if (selected && typeof selected === 'object') {
      setInputValue(selected.location || selected.name);
      if (onSelect) {
        onSelect(selected);
      }
    }
  };

  return (
    <Autocomplete
      freeSolo
      options={options}
      value={inputValue}
      inputValue={inputValue}
      filterOptions={(items) => items}
      getOptionLabel={(option) =>
        typeof option === 'string' ? option : option.location || option.name || ''
      }
      onInputChange={handleInputChange}
      onChange={handleChange}
      loading={loading}
      autoHighlight
      fullWidth
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          autoFocus={autoFocus}
          error={Boolean(error)}
          helperText={error}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && onSubmit) {
              onSubmit(inputValue);
            }
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={18} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
        />
      )}
    />
  );
}
