import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import SearchIcon from '@mui/icons-material/Search';
import DestinationCard from '../../components/cards/DestinationCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { publishedDestinationsQuery } from '../../services/destinationService.js';

export default function Destinations() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('name-asc');

  const { data: destinations, loading, error } = useCollection(
    useMemo(() => publishedDestinationsQuery(), [])
  );

  const categories = useMemo(() => {
    const set = new Set(destinations.map((d) => d.category).filter(Boolean));
    return Array.from(set).sort();
  }, [destinations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = destinations.filter((destination) => {
      const matchesTerm =
        !term ||
        [destination.name, destination.country, destination.region, destination.location]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));
      const matchesCategory = category === 'all' || destination.category === category;
      return matchesTerm && matchesCategory;
    });

    list = list.slice().sort((a, b) => {
      if (sort === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sort === 'country') return (a.country || '').localeCompare(b.country || '');
      return (a.name || '').localeCompare(b.name || '');
    });
    return list;
  }, [destinations, search, category, sort]);

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Destinations
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Explore our curated travel destinations.
      </Typography>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Search destinations"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField select label="Category" value={category} onChange={(event) => setCategory(event.target.value)}>
            <MenuItem value="all">All categories</MenuItem>
            {categories.map((item) => (
              <MenuItem key={item} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>
        </Grid>
        <Grid item xs={6} md={3}>
          <TextField select label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}>
            <MenuItem value="name-asc">Name (A–Z)</MenuItem>
            <MenuItem value="name-desc">Name (Z–A)</MenuItem>
            <MenuItem value="country">Country</MenuItem>
          </TextField>
        </Grid>
      </Grid>

      {error ? (
        <EmptyState title="Could not load destinations" description="Please refresh the page and try again." />
      ) : loading ? (
        <Grid container spacing={3}>
          {[0, 1, 2, 3].map((key) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No destinations found"
          description="Try adjusting your search or filters to see more results."
        />
      ) : (
        <Grid container spacing={3}>
          {filtered.map((destination) => (
            <Grid item xs={12} sm={6} md={4} key={destination.id}>
              <DestinationCard destination={destination} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
