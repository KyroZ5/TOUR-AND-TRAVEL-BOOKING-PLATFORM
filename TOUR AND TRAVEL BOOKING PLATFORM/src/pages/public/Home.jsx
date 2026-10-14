import { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Skeleton from '@mui/material/Skeleton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EventIcon from '@mui/icons-material/Event';
import PeopleIcon from '@mui/icons-material/People';
import SearchIcon from '@mui/icons-material/Search';
import ExploreIcon from '@mui/icons-material/Explore';
import VerifiedIcon from '@mui/icons-material/Verified';
import PaymentsOutlinedIcon from '@mui/icons-material/PaymentsOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import MapOutlinedIcon from '@mui/icons-material/MapOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import SearchBar from '../../components/common/SearchBar.jsx';
import DestinationCard from '../../components/cards/DestinationCard.jsx';
import PackageCard from '../../components/cards/PackageCard.jsx';
import PromotionCard from '../../components/cards/PromotionCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useCollection } from '../../hooks/useFirestore.js';
import { publishedDestinationsQuery } from '../../services/destinationService.js';
import { publishedPackagesQuery } from '../../services/packageService.js';
import { allPromotionsQuery, isPromotionActive } from '../../services/promotionService.js';
import { getSiteSettings, DEFAULT_SETTINGS } from '../../services/settingsService.js';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=1920&q=70';

const WHY_CHOOSE_US = [
  { icon: <EventAvailableOutlinedIcon fontSize="large" color="secondary" />, title: 'Easy booking', text: 'Book a tour in a few clicks with instant confirmation references.' },
  { icon: <MapOutlinedIcon fontSize="large" color="secondary" />, title: 'Curated destinations', text: 'Every destination is handpicked and vetted by our travel specialists.' },
  { icon: <PaymentsOutlinedIcon fontSize="large" color="secondary" />, title: 'Transparent pricing', text: 'Clear per-person pricing with no hidden fees or surprise charges.' },
  { icon: <SupportAgentIcon fontSize="large" color="secondary" />, title: 'Customer support', text: 'Our team is ready to help before, during, and after your trip.' },
  { icon: <VerifiedIcon fontSize="large" color="secondary" />, title: 'Trusted operators', text: 'We work only with reliable, licensed local tour operators.' },
];

const HOW_IT_WORKS = [
  { step: '1', title: 'Explore destinations', text: 'Browse curated destinations and travel inspiration.' },
  { step: '2', title: 'Select a package', text: 'Pick the tour that fits your dates and budget.' },
  { step: '3', title: 'Choose a departure', text: 'Select an available schedule and number of travelers.' },
  { step: '4', title: 'Submit a booking', text: 'Fill in your details and submit your booking.' },
  { step: '5', title: 'Get confirmed', text: 'Receive confirmation and your travel details.' },
];

const TESTIMONIALS = [
  { name: 'Maria Santos', location: 'Cebu City', text: 'Booking was so easy and the El Nido trip exceeded our expectations. Highly recommended!', sample: true },
  { name: 'John Reyes', location: 'Quezon City', text: 'Transparent pricing and great support. The itinerary was exactly as described.', sample: true },
  { name: 'Aisha Cruz', location: 'Davao', text: 'Our guide was fantastic and everything was well organized from start to finish.', sample: true },
];

export default function Home() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [searchText, setSearchText] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [travelers, setTravelers] = useState(2);

  const { data: destinations, loading: loadingDestinations } = useCollection(
    useMemo(() => publishedDestinationsQuery(), [])
  );
  const { data: packages, loading: loadingPackages } = useCollection(
    useMemo(() => publishedPackagesQuery(), [])
  );
  const { data: promotions } = useCollection(useMemo(() => allPromotionsQuery(), []));

  useEffect(() => {
    let active = true;
    getSiteSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        if (active) setSettings(DEFAULT_SETTINGS);
      });
    return () => {
      active = false;
    };
  }, []);

  const destinationNameById = useMemo(() => {
    const map = new Map();
    destinations.forEach((d) => map.set(d.id, d.name));
    return map;
  }, [destinations]);

  const featuredDestinations = useMemo(() => {
    const featured = destinations.filter((d) => d.isFeatured);
    return (featured.length > 0 ? featured : destinations).slice(0, 6);
  }, [destinations]);

  const popularPackages = useMemo(() => {
    const featured = packages.filter((p) => p.isFeatured);
    return (featured.length > 0 ? featured : packages).slice(0, 6);
  }, [packages]);

  const activePromotions = useMemo(
    () => promotions.filter((p) => isPromotionActive(p)).slice(0, 3),
    [promotions]
  );

  const goSearch = () => {
    const params = new URLSearchParams();
    if (searchText.trim()) params.set('search', searchText.trim());
    navigate(`/destinations${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const handleSelectPlace = (place) => {
    navigate(`/destinations?search=${encodeURIComponent(place.name || place.location || '')}`);
  };

  return (
    <Box>
      {/* Hero */}
      <Box
        sx={{
          position: 'relative',
          minHeight: { xs: 520, md: 620 },
          display: 'flex',
          alignItems: 'center',
          backgroundImage: `linear-gradient(rgba(16,42,67,0.72), rgba(16,42,67,0.72)), url(${HERO_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: '#fff',
        }}
      >
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, fontSize: { xs: '2rem', md: '3.2rem' }, maxWidth: 720 }}>
            {settings.heroTitle}
          </Typography>
          <Typography variant="h6" sx={{ mt: 2, maxWidth: 620, fontWeight: 400, color: 'grey.100' }}>
            {settings.heroSubtitle}
          </Typography>

          <Card sx={{ mt: 4, p: { xs: 2, md: 2.5 }, maxWidth: 960 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <SearchBar
                  value={searchText}
                  onInputChange={setSearchText}
                  onSelect={handleSelectPlace}
                  onSubmit={goSearch}
                  label="Destination"
                  placeholder="Where to?"
                />
              </Grid>
              <Grid item xs={6} md={3}>
                <TextField
                  label="Departure date"
                  type="date"
                  value={travelDate}
                  onChange={(event) => setTravelDate(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EventIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={6} md={2}>
                <TextField
                  label="Travelers"
                  type="number"
                  value={travelers}
                  onChange={(event) => setTravelers(event.target.value)}
                  inputProps={{ min: 1, max: 30 }}
                  fullWidth
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PeopleIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} md={2}>
                <Button
                  variant="contained"
                  color="secondary"
                  size="large"
                  fullWidth
                  startIcon={<SearchIcon />}
                  onClick={goSearch}
                  sx={{ height: 48 }}
                >
                  Search
                </Button>
              </Grid>
            </Grid>
            <Box sx={{ mt: 1 }}>
              <Button
                component={RouterLink}
                to="/destinations"
                startIcon={<ExploreIcon />}
                color="primary"
              >
                Explore Destinations
              </Button>
            </Box>
          </Card>
        </Container>
      </Box>

      {/* Featured destinations */}
      <Container maxWidth="lg" sx={{ py: 7 }}>
        <SectionHeading title="Featured Destinations" subtitle="Popular places our travelers love." />
        {loadingDestinations ? (
          <Grid container spacing={3}>
            {[0, 1, 2].map((key) => (
              <Grid item xs={12} sm={6} md={4} key={key}>
                <Skeleton variant="rectangular" height={320} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : featuredDestinations.length === 0 ? (
          <EmptyState title="No destinations yet" description="Destinations will appear here once published." />
        ) : (
          <>
            <Grid container spacing={3}>
              {featuredDestinations.map((destination) => (
                <Grid item xs={12} sm={6} md={4} key={destination.id}>
                  <DestinationCard destination={destination} />
                </Grid>
              ))}
            </Grid>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button component={RouterLink} to="/destinations" variant="outlined">
                View all destinations
              </Button>
            </Box>
          </>
        )}
      </Container>

      {/* Popular packages */}
      <Box sx={{ bgcolor: 'grey.50', py: 7 }}>
        <Container maxWidth="lg">
          <SectionHeading title="Popular Tour Packages" subtitle="Ready-to-book trips with available departures." />
          {loadingPackages ? (
            <Grid container spacing={3}>
              {[0, 1, 2].map((key) => (
                <Grid item xs={12} sm={6} md={4} key={key}>
                  <Skeleton variant="rectangular" height={380} sx={{ borderRadius: 3 }} />
                </Grid>
              ))}
            </Grid>
          ) : popularPackages.length === 0 ? (
            <EmptyState title="No packages yet" description="Tour packages will appear here once published." />
          ) : (
            <>
              <Grid container spacing={3}>
                {popularPackages.map((pkg) => (
                  <Grid item xs={12} sm={6} md={4} key={pkg.id}>
                    <PackageCard package={pkg} destinationName={destinationNameById.get(pkg.destinationId)} />
                  </Grid>
                ))}
              </Grid>
              <Box sx={{ textAlign: 'center', mt: 4 }}>
                <Button component={RouterLink} to="/packages" variant="outlined">
                  Browse all tour packages
                </Button>
              </Box>
            </>
          )}
        </Container>
      </Box>

      {/* Why choose us */}
      <Container maxWidth="lg" sx={{ py: 7 }}>
        <SectionHeading title="Why Choose Us" subtitle="We make travel planning simple and reliable." />
        <Grid container spacing={3}>
          {WHY_CHOOSE_US.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.title}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  {item.icon}
                  <Typography variant="h6" fontWeight={700} sx={{ mt: 1.5 }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Special offers */}
      {activePromotions.length > 0 ? (
        <Box sx={{ bgcolor: 'grey.50', py: 7 }}>
          <Container maxWidth="lg">
            <SectionHeading title="Special Offers" subtitle="Limited-time promotions on selected trips." />
            <Grid container spacing={3}>
              {activePromotions.map((promotion) => (
                <Grid item xs={12} sm={6} md={4} key={promotion.id}>
                  <PromotionCard promotion={promotion} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      ) : null}

      {/* How it works */}
      <Container maxWidth="lg" sx={{ py: 7 }}>
        <SectionHeading title="How It Works" subtitle="Your journey in five simple steps." />
        <Grid container spacing={3}>
          {HOW_IT_WORKS.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.step}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Avatar sx={{ bgcolor: 'secondary.main', mb: 1.5 }}>{item.step}</Avatar>
                  <Typography variant="h6" fontWeight={700}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    {item.text}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Testimonials */}
      <Box sx={{ bgcolor: 'primary.main', py: 7 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ color: '#fff', fontWeight: 700 }}>
            What Our Travelers Say
          </Typography>
          <Typography variant="body2" align="center" sx={{ color: 'grey.300', mt: 1 }}>
            Sample reviews shown for demonstration.
          </Typography>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            {TESTIMONIALS.map((item) => (
              <Grid item xs={12} md={4} key={item.name}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <FormatQuoteIcon color="secondary" />
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {item.text}
                    </Typography>
                    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>{item.name.charAt(0)}</Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {item.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.location}
                        </Typography>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Container maxWidth="md" sx={{ py: 7 }}>
        <SectionHeading title="Frequently Asked Questions" subtitle="Answers to common questions about booking and travel." />
        {(settings.faqs || []).map((faq, index) => (
          <Accordion key={faq.q} defaultExpanded={index === 0}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography fontWeight={600}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Container>
    </Box>
  );
}

function SectionHeading({ title, subtitle }) {
  return (
    <Box sx={{ textAlign: 'center', mb: 4 }}>
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>
      {subtitle ? (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          {subtitle}
        </Typography>
      ) : null}
    </Box>
  );
}
