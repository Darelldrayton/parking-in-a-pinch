import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  useTheme,
  alpha,
} from '@mui/material';

export default function TermsAndConditions() {
  const theme = useTheme();

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
      py: 6,
    }}>
      {/* Header */}
      <Box sx={{
        background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
        color: 'white',
        py: 6,
        mb: 6,
      }}>
        <Container maxWidth="lg">
          <Typography variant="h2" component="h1" fontWeight={700} gutterBottom>
            Terms and Conditions
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
            Please read these terms carefully before using our service
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Paper
          elevation={0}
          sx={{
            p: 6,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
            backgroundColor: 'white',
          }}
        >
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              1. Acceptance of Terms
            </Typography>
            <Typography variant="body1" paragraph>
              By accessing and using Parking in a Pinch ("the Service"), you accept and agree to be bound by the terms 
              and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              2. Service Description
            </Typography>
            <Typography variant="body1" paragraph>
              Parking in a Pinch is a digital marketplace that connects parking space owners ("Hosts") with individuals 
              seeking parking spaces ("Renters"). We facilitate transactions but do not own or control the parking spaces 
              listed on our platform.
            </Typography>
            <Typography variant="body1" paragraph>
              Our services include:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Listing parking spaces for rent</li>
              <li>Booking and payment processing</li>
              <li>Communication between Hosts and Renters</li>
              <li>Customer support services</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              3. User Accounts and Registration
            </Typography>
            <Typography variant="body1" paragraph>
              To use certain features of the Service, you must create an account. You agree to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and update your information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              4. Host Responsibilities
            </Typography>
            <Typography variant="body1" paragraph>
              As a Host, you agree to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Provide accurate descriptions of your parking space</li>
              <li>Ensure the space is available during listed times</li>
              <li>Maintain the safety and accessibility of your space</li>
              <li>Comply with all local laws and regulations</li>
              <li>Respond promptly to booking requests and communications</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              5. Renter Responsibilities
            </Typography>
            <Typography variant="body1" paragraph>
              As a Renter, you agree to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Use the parking space only for its intended purpose</li>
              <li>Park only the vehicle type specified in the booking</li>
              <li>Leave the space in the same condition as found</li>
              <li>Comply with any specific rules set by the Host</li>
              <li>Pay all fees and charges as agreed</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              6. Payment and Fees
            </Typography>
            <Typography variant="body1" paragraph>
              Parking in a Pinch charges service fees for facilitating transactions between Hosts and Renters. 
              Payment processing is handled through secure third-party providers.
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom color="primary" sx={{ mt: 3 }}>
              6.1 Service Fee Structure
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>Renter Service Fee:</strong> 5% of the total booking amount is charged to Renters as a service fee for using our platform, facilitating secure payments, and providing customer support.</li>
              <li><strong>Host Service Fee:</strong> 10% of the total booking amount is deducted from Host payouts as a service fee for listing management, payment processing, marketing, and platform maintenance.</li>
            </Box>
            
            <Typography variant="body1" paragraph>
              All fees are clearly disclosed before completing a booking. The Host receives 90% of the booking amount, 
              while the platform retains 10% to cover operational costs, payment processing, customer support, and platform development.
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom color="primary" sx={{ mt: 3 }}>
              6.2 Payment Terms
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Renters pay the full booking amount plus a 5% service fee at the time of booking</li>
              <li>Hosts receive payouts within 7 business days after successful booking completion</li>
              <li>All payments are processed in USD through secure payment providers</li>
              <li>Payment disputes will be handled according to our dispute resolution process</li>
            </Box>
            
            <Typography variant="h5" fontWeight={600} gutterBottom color="primary" sx={{ mt: 3 }}>
              6.3 Cancellation and Refunds
            </Typography>
            <Typography variant="body1" paragraph>
              Cancellation and refund policies vary by listing and are specified at the time of booking. 
              Service fees may be non-refundable depending on the timing and circumstances of cancellation.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              7. Prohibited Uses
            </Typography>
            <Typography variant="body1" paragraph>
              You may not use the Service for:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Any unlawful purpose or to solicit unlawful acts</li>
              <li>Violating any international, federal, provincial, or state regulations or laws</li>
              <li>Transmitting harmful or invasive computer code</li>
              <li>Interfering with or disrupting the Service</li>
              <li>Creating false or misleading listings</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              8. Limitation of Liability
            </Typography>
            <Typography variant="body1" paragraph>
              Parking in a Pinch acts as an intermediary platform. We are not responsible for:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Damage to vehicles or property</li>
              <li>Theft or criminal activities</li>
              <li>Disputes between Hosts and Renters</li>
              <li>The condition or safety of parking spaces</li>
            </Box>
            <Typography variant="body1" paragraph>
              Users participate at their own risk and are encouraged to obtain appropriate insurance coverage.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              9. Privacy and Data Protection
            </Typography>
            <Typography variant="body1" paragraph>
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the Service, 
              to understand our practices regarding the collection and use of your personal information.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              10. Termination
            </Typography>
            <Typography variant="body1" paragraph>
              We may terminate or suspend your account and bar access to the Service immediately, without prior notice 
              or liability, under our sole discretion, for any reason whatsoever, including but not limited to a breach 
              of the Terms.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              11. Changes to Terms
            </Typography>
            <Typography variant="body1" paragraph>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision 
              is material, we will provide at least 30 days notice prior to any new terms taking effect.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              12. Contact Information
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions about these Terms and Conditions, please contact us at:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1">Email: legal@parkinginapinch.com</Typography>
              <Typography variant="body1">Address: 123 Legal Street, New York, NY 10001</Typography>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}