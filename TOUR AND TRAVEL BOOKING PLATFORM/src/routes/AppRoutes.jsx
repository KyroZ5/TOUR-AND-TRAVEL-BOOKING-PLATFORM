import { Routes, Route } from 'react-router-dom';

// Layouts
import PublicLayout from '../components/layout/PublicLayout.jsx';
import CustomerLayout from '../components/layout/CustomerLayout.jsx';
import AdminLayout from '../components/layout/AdminLayout.jsx';

// Route guards
import ProtectedRoute from './ProtectedRoute.jsx';
import AdminRoute from './AdminRoute.jsx';

// Public pages
import Home from '../pages/public/Home.jsx';
import Destinations from '../pages/public/Destinations.jsx';
import DestinationDetails from '../pages/public/DestinationDetails.jsx';
import TourPackages from '../pages/public/TourPackages.jsx';
import TourDetails from '../pages/public/TourDetails.jsx';
import About from '../pages/public/About.jsx';
import Contact from '../pages/public/Contact.jsx';

// Auth pages
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import ForgotPassword from '../pages/auth/ForgotPassword.jsx';

// Customer pages
import CustomerDashboard from '../pages/customer/CustomerDashboard.jsx';
import MyBookings from '../pages/customer/MyBookings.jsx';
import BookingDetails from '../pages/customer/BookingDetails.jsx';
import CustomerProfile from '../pages/customer/CustomerProfile.jsx';
import Notifications from '../pages/customer/Notifications.jsx';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import ManagePackages from '../pages/admin/ManagePackages.jsx';
import ManageDestinations from '../pages/admin/ManageDestinations.jsx';
import ManageBookings from '../pages/admin/ManageBookings.jsx';
import ManageCustomers from '../pages/admin/ManageCustomers.jsx';
import ManageDepartures from '../pages/admin/ManageDepartures.jsx';
import ManagePayments from '../pages/admin/ManagePayments.jsx';
import Promotions from '../pages/admin/Promotions.jsx';
import Reports from '../pages/admin/Reports.jsx';
import ActivityLogs from '../pages/admin/ActivityLogs.jsx';
import Settings from '../pages/admin/Settings.jsx';

// Misc
import NotFound from '../pages/NotFound.jsx';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Auth pages (centered, no public chrome) */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Customer area */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<CustomerLayout />}>
          <Route index element={<CustomerDashboard />} />
          <Route path="bookings" element={<MyBookings />} />
          <Route path="bookings/:bookingId" element={<BookingDetails />} />
          <Route path="profile" element={<CustomerProfile />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>
      </Route>

      {/* Admin area */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="packages" element={<ManagePackages />} />
          <Route path="destinations" element={<ManageDestinations />} />
          <Route path="bookings" element={<ManageBookings />} />
          <Route path="customers" element={<ManageCustomers />} />
          <Route path="departures" element={<ManageDepartures />} />
          <Route path="payments" element={<ManagePayments />} />
          <Route path="promotions" element={<Promotions />} />
          <Route path="reports" element={<Reports />} />
          <Route path="activity-logs" element={<ActivityLogs />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Public site */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:destinationId" element={<DestinationDetails />} />
        <Route path="packages" element={<TourPackages />} />
        <Route path="packages/:packageId" element={<TourDetails />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
