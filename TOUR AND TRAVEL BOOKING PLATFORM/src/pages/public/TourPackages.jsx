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
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import SearchIcon from '@mui/icons-material/Search';
import PackageCard from '../../components/cards/PackageCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { publishedPackagesQuery } from '../../services/packageService.js';
import { publishedDestinationsQuery } from '../../services/destinationService.js';
import { fromCentavos } from '../../utils/currency.js';

const ALL = 'all';

export default function TourPackages() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [destinationId, setDestinationId] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [maxDuration, setMaxDuration] = useState('');
  const [sort, setSort] = useState('newest');

  const { data: packages, loading, error } = useCollection(
    useMemo(() => publishedPackagesQuery(), [])
  );
  const { data: destinations } = useCollection(
    useMemo(() => publishedDestinationsQuery(), [])
  );

  const destinationNameById = useMemo(() => {
    const map = new Map();
    destinations.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [destinations]);

  const categories = useMemo(() => {
    const set = new Set(packages.map((p) => p.category).filter(Boolean));
    return Array.from(set).sort();
  }, [packages]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const min = minPrice === '' ? null : Number(minPrice) * 100;
    const max = maxPrice === '' ? null : Number(maxPrice) * 100;
    const duration = maxDuration === '' ? null : Number(maxDuration);

    let list = packages.filter((pkg) => {
      const destName = destinationNameById.get(pkg.destinationId) || '';
      const matchesTerm =
        !term ||
        [pkg.name, pkg.description, pkg.category, destName]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(term));
      const matchesDestination = destinationId === ALL || pkg.destinationId === destinationId;
      const matchesCategory = category === ALL || pkg.category === category;
      const matchesMin = min === null || pkg.pricePerPerson >= min;
      const matchesMax = max === null || pkg.pricePerPerson <= max;
      const matchesDuration = duration === null || pkg.durationDays <= duration;
      return (
        matchesTerm &&
        matchesDestination &&
        matchesCategory &&
        matchesMin &&
        matchesMax &&
        matchesDuration
      );
    });

    list = list.slice().sort((a, b) => {
      if (sort === 'price-asc') return a.pricePerPerson - b.pricePerPerson;
      if (sort === 'price-desc') return b.pricePerPerson - a.pricePerPerson;
      if (sort === 'duration-asc') return a.durationDays - b.durationDays;
      if (sort === 'duration-desc') return b.durationDays - a.durationDays;
      if (sort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      const aCreated = a.createdAt && a.createdAt.seconds ? a.createdAt.seconds : 0;
      const bCreated = b.createdAt && b.createdAt.seconds ? b.createdAt.seconds : 0;
      return bCreated - aCreated;
    });
    return list;
  }, [packages, destinationNameById, search, destinationId, category, minPrice, maxPrice, maxDuration, sort]);

  const resetFilters = () => {
    setSearch('');
    setDestinationId(ALL);
    setCategory(ALL);
    setMinPrice('');
    setMaxPrice('');
    setMaxDuration('');
    setSort('newest');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Typography variant="h3" fontWeight={800} gutterBottom>
        Tour Packages
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Find the perfect trip. Filter by destination, price, duration, and more.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              label="Search packages"
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
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              select
              label="Destination"
              value={destinationId}
              onChange={(event) => setDestinationId(event.target.value)}
            >
              <MenuItem value={ALL}>All destinations</MenuItem>
              {destinations.map((destination) => (
                <MenuItem key={destination.id} value={destination.id}>
                  {destination.name}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              select
              label="Category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <MenuItem value={ALL}>All</MenuItem>
              {categories.map((item) => (
                <MenuItem key={item} value={item}>
                  {item}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="Min price (₱)"
              type="number"
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="Max price (₱)"
              type="number"
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
            />
          </Grid>
          <Grid item xs={6} sm={3} md={2}>
            <TextField
              label="Max duration (days)"
              type="number"
              value={maxDuration}
              onChange={(event) => setMaxDuration(event.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TextField select label="Sort by" value={sort} onChange={(event) => setSort(event.target.value)}>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="price-asc">Price (low to high)</MenuItem>
              <MenuItem value="price-desc">Price (high to low)</MenuItem>
              <MenuItem value="duration-asc">Duration (short to long)</MenuItem>
              <MenuItem value="duration-desc">Duration (long to short)</MenuItem>
              <MenuItem value="name-asc">Name (A–Z)</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button variant="text" onClick={resetFilters} sx={{ mt: { md: 0.5 } }}>
              Reset filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {filtered.length} package(s) found
        </Typography>
      </Stack>

      {error ? (
        <EmptyState title="Could not load packages" description="Please refresh the page and try again." />
      ) : loading ? (
        <Grid container spacing={3}>
          {[0, 1, 2, 3].map((key) => (
            <Grid item xs={12} sm={6} md={4} key={key}>
              <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No packages match your filters"
          description="Try widening your search or resetting the filters."
          action={
            <Button variant="outlined" onClick={resetFilters}>
              Reset filters
            </Button>
          }
        />
      ) : (
        <Grid container spacing={3}>
          {filtered.map((pkg) => (
            <Grid item xs={12} sm={6} md={4} key={pkg.id}>
              <PackageCard package={pkg} destinationName={destinationNameById.get(pkg.destinationId)} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
