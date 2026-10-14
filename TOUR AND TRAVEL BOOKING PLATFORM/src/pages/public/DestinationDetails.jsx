import { useMemo, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Skeleton from '@mui/material/Skeleton';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DestinationMap from '../../components/common/DestinationMap.jsx';
import WeatherCard from '../../components/common/WeatherCard.jsx';
import PackageCard from '../../components/cards/PackageCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection, useDocument } from '../../hooks/useFirestore.js';
import { destinationDocRef } from '../../services/destinationService.js';
import { packagesByDestinationQuery } from '../../services/packageService.js';

const PLACEHOLDER =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=60';

export default function DestinationDetails() {
  const { destinationId } = useParams();
  const { data: destination, loading, error } = useDocument(
    useMemo(() => destinationDocRef(destinationId), [destinationId])
  );
  const { data: packages } = useCollection(
    useMemo(() => packagesByDestinationQuery(destinationId), [destinationId])
  );
  const [activeImage, setActiveImage] = useState(0);

  const images = useMemo(() => {
    if (!destination || !Array.isArray(destination.imageUrls) || destination.imageUrls.length === 0) {
      return [PLACEHOLDER];
    }
    return destination.imageUrls;
  }, [destination]);

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 3, mb: 3 }} />
        <Skeleton width="40%" height={48} />
        <Skeleton width="80%" height={24} />
      </Container>
    );
  }

  if (error || !destination) {
    return (
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <EmptyState
          title="Destination not found"
          description="This destination may have been removed or is not published."
          action={
            <Button component={RouterLink} to="/destinations" variant="contained">
              Back to destinations
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 5 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <CardMedia
            component="img"
            image={images[activeImage]}
            alt={destination.name}
            sx={{ borderRadius: 3, height: 380, objectFit: 'cover' }}
            onError={(event) => {
              event.currentTarget.src = PLACEHOLDER;
            }}
          />
          {images.length > 1 ? (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto', pb: 1 }}>
              {images.map((image, index) => (
                <Box
                  key={image}
                  component="img"
                  src={image}
                  alt={`${destination.name} ${index + 1}`}
                  onClick={() => setActiveImage(index)}
                  sx={{
                    width: 88,
                    height: 62,
                    objectFit: 'cover',
                    borderRadius: 1.5,
                    cursor: 'pointer',
                    border: index === activeImage ? '2px solid' : '2px solid transparent',
                    borderColor: 'secondary.main',
                  }}
                />
              ))}
            </Stack>
          ) : null}
        </Grid>

        <Grid item xs={12} md={5}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            {destination.category ? (
              <Chip label={destination.category} color="secondary" size="small" />
            ) : null}
            {destination.region ? <Chip label={destination.region} size="small" variant="outlined" /> : null}
          </Stack>
          <Typography variant="h3" fontWeight={800}>
            {destination.name}
          </Typography>
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 1 }}>
            <LocationOnIcon color="action" fontSize="small" />
            <Typography variant="body1" color="text.secondary">
              {[destination.location, destination.country].filter(Boolean).join(', ')}
            </Typography>
          </Stack>
          <Typography variant="body1" sx={{ mt: 2 }}>
            {destination.description}
          </Typography>

          <Box sx={{ mt: 2 }}>
            <WeatherCard
              latitude={destination.latitude}
              longitude={destination.longitude}
              destinationName={destination.name}
              country={destination.country}
            />
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Location
        </Typography>
        <DestinationMap
          latitude={destination.latitude}
          longitude={destination.longitude}
          name={destination.name}
          location={destination.location}
          height={360}
        />
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h5" fontWeight={700} gutterBottom>
        Tour Packages in {destination.name}
      </Typography>
      {packages.length === 0 ? (
        <EmptyState
          title="No packages yet"
          description="There are no published tour packages for this destination at the moment."
        />
      ) : (
        <Grid container spacing={3}>
          {packages.map((pkg) => (
            <Grid item xs={12} sm={6} md={4} key={pkg.id}>
              <PackageCard package={pkg} destinationName={destination.name} />
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
}
