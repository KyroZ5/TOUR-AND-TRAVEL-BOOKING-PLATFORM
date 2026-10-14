import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { formatDate } from '../../utils/date.js';

function discountLabel(promotion) {
  if (promotion.discountType === 'percent') {
    return `${promotion.discountValue}% OFF`;
  }
  if (promotion.discountType === 'fixed') {
    return `${Number(promotion.discountValue) / 100} PHP OFF`;
  }
  return 'SPECIAL OFFER';
}

/** Homepage promotional banner card. Only active (non-expired) promos are shown. */
export default function PromotionCard({ promotion }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {promotion.imageUrl ? (
        <CardMedia
          component="img"
          image={promotion.imageUrl}
          alt={promotion.title}
          sx={{ height: 160, objectFit: 'cover' }}
        />
      ) : null}
      <CardContent sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
          <LocalOfferIcon color="warning" fontSize="small" />
          <Chip label={discountLabel(promotion)} color="warning" size="small" />
        </Stack>
        <Typography variant="h6" fontWeight={700} gutterBottom>
          {promotion.title}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {promotion.description}
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          <Typography variant="caption" color="text.secondary">
            Valid {formatDate(promotion.startDate)} – {formatDate(promotion.endDate)}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
