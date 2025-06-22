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

export default function PrivacyPolicy() {
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
            Privacy Policy
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 300 }}>
            Your privacy is important to us. Learn how we protect your information.
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
              1. Introduction
            </Typography>
            <Typography variant="body1" paragraph>
              Parking in a Pinch ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy 
              explains how we collect, use, disclose, and safeguard your information when you use our parking marketplace 
              platform and services.
            </Typography>
            <Typography variant="body1" paragraph>
              Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, 
              please do not access the application.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              2. Information We Collect
            </Typography>
            
            <Typography variant="h5" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
              Personal Information
            </Typography>
            <Typography variant="body1" paragraph>
              We may collect personal information that you voluntarily provide when you:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Register for an account</li>
              <li>Create a parking space listing</li>
              <li>Make a booking</li>
              <li>Contact customer support</li>
              <li>Subscribe to our newsletter</li>
            </Box>
            <Typography variant="body1" paragraph>
              This information may include: name, email address, phone number, payment information, vehicle details, 
              and location data.
            </Typography>

            <Typography variant="h5" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
              Automatically Collected Information
            </Typography>
            <Typography variant="body1" paragraph>
              When you use our platform, we may automatically collect certain information:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Device information (IP address, browser type, operating system)</li>
              <li>Usage data (pages visited, time spent, features used)</li>
              <li>Location information (when you grant permission)</li>
              <li>Cookies and similar tracking technologies</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              3. How We Use Your Information
            </Typography>
            <Typography variant="body1" paragraph>
              We use the information we collect for various purposes, including:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Providing and maintaining our services</li>
              <li>Processing transactions and payments</li>
              <li>Communicating with you about bookings and updates</li>
              <li>Improving our platform and user experience</li>
              <li>Preventing fraud and ensuring security</li>
              <li>Complying with legal obligations</li>
              <li>Marketing and promotional communications (with your consent)</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              4. Information Sharing and Disclosure
            </Typography>
            <Typography variant="body1" paragraph>
              We may share your information in the following circumstances:
            </Typography>
            
            <Typography variant="h5" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
              With Other Users
            </Typography>
            <Typography variant="body1" paragraph>
              When you book a parking space or list one for rent, we share necessary information (name, contact details, 
              vehicle information) with the other party to facilitate the transaction.
            </Typography>

            <Typography variant="h5" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
              With Service Providers
            </Typography>
            <Typography variant="body1" paragraph>
              We work with third-party companies to provide services such as payment processing, customer support, 
              and analytics. These providers are bound by confidentiality agreements.
            </Typography>

            <Typography variant="h5" fontWeight={500} gutterBottom sx={{ mt: 3 }}>
              For Legal Compliance
            </Typography>
            <Typography variant="body1" paragraph>
              We may disclose your information if required by law, to protect our rights, or to prevent illegal activities.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              5. Data Security
            </Typography>
            <Typography variant="body1" paragraph>
              We implement appropriate technical and organizational measures to protect your personal information against 
              unauthorized access, alteration, disclosure, or destruction. These measures include:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Encryption of sensitive data in transit and at rest</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls and authentication procedures</li>
              <li>Secure payment processing through certified providers</li>
            </Box>
            <Typography variant="body1" paragraph>
              However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security 
              of your information.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              6. Your Privacy Rights
            </Typography>
            <Typography variant="body1" paragraph>
              Depending on your location, you may have certain rights regarding your personal information:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
            </Box>
            <Typography variant="body1" paragraph>
              To exercise these rights, please contact us using the information provided at the end of this policy.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              7. Cookies and Tracking Technologies
            </Typography>
            <Typography variant="body1" paragraph>
              We use cookies and similar technologies to enhance your experience on our platform. Cookies help us:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Remember your preferences and settings</li>
              <li>Analyze usage patterns and improve our services</li>
              <li>Provide personalized content and recommendations</li>
              <li>Ensure security and prevent fraud</li>
            </Box>
            <Typography variant="body1" paragraph>
              You can control cookie preferences through your browser settings, but disabling cookies may affect 
              the functionality of our platform.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              8. Data Retention
            </Typography>
            <Typography variant="body1" paragraph>
              We retain your personal information only for as long as necessary to fulfill the purposes for which it was 
              collected, comply with legal obligations, resolve disputes, and enforce our agreements. When information is 
              no longer needed, we securely delete or anonymize it.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              9. Children's Privacy
            </Typography>
            <Typography variant="body1" paragraph>
              Our services are not intended for children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If you are a parent or guardian and believe your child has provided 
              us with personal information, please contact us immediately.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              10. International Data Transfers
            </Typography>
            <Typography variant="body1" paragraph>
              Your information may be transferred to and processed in countries other than your own. We ensure that such 
              transfers comply with applicable data protection laws and implement appropriate safeguards to protect your 
              information.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              11. Changes to This Privacy Policy
            </Typography>
            <Typography variant="body1" paragraph>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by posting 
              the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review this 
              Privacy Policy periodically.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom color="primary">
              12. Contact Us
            </Typography>
            <Typography variant="body1" paragraph>
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us:
            </Typography>
            <Box sx={{ pl: 2 }}>
              <Typography variant="body1">Email: privacy@parkinginapinch.com</Typography>
              <Typography variant="body1">Address: 123 Privacy Lane, New York, NY 10001</Typography>
            </Box>
            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              We will respond to your inquiry within 30 days.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}