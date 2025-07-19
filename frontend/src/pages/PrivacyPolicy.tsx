import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  useTheme,
  alpha,
  Alert,
  Link,
  Stack,
  Chip,
} from '@mui/material';
import {
  Security as SecurityIcon,
  Gavel as GavelIcon,
  Shield as ShieldIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

export default function PrivacyPolicy() {
  const theme = useTheme();
  const effectiveDate = "January 15, 2025";
  const lastUpdated = "January 15, 2025";

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
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 2 }}>
            <strong>Effective Date:</strong> {effectiveDate} | <strong>Last Updated:</strong> {lastUpdated}
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
          {/* Important Notice */}
          <Alert severity="info" icon={<SecurityIcon />} sx={{ mb: 4 }}>
            <Typography variant="body1" fontWeight={600}>
              <strong>PRIVACY COMMITMENT:</strong> By using our Platform, you consent to the data practices described in this Privacy Policy. If you do not agree with any part of this Privacy Policy, you must not use our Platform.
            </Typography>
          </Alert>

          {/* Section 1 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              1. INTRODUCTION
            </Typography>
            <Typography variant="body1" paragraph>
              Parking in a Pinch, LLC ("**Parking in a Pinch**," "**we**," "**us**," or "**our**") respects your privacy and is committed to protecting your personal information. This Privacy Policy describes how we collect, use, share, and safeguard information when you use our website, mobile applications, and services (collectively, the "**Platform**").
            </Typography>
            <Alert severity="warning" sx={{ my: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                BY USING OUR PLATFORM, YOU CONSENT TO THE DATA PRACTICES DESCRIBED IN THIS PRIVACY POLICY. IF YOU DO NOT AGREE WITH ANY PART OF THIS PRIVACY POLICY, YOU MUST NOT USE OUR PLATFORM.
              </Typography>
            </Alert>
            <Typography variant="body1" paragraph>
              This Privacy Policy is incorporated into and subject to our Terms and Conditions. Capitalized terms not defined here have the meanings given in our Terms and Conditions.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 2 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              2. INFORMATION WE COLLECT
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              2.1 Information You Provide Directly
            </Typography>
            
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Account Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Full name and username</li>
              <li>Email address and phone number</li>
              <li>Password (encrypted)</li>
              <li>Date of birth (for age verification)</li>
              <li>Profile photograph</li>
              <li>Government-issued ID (for verification purposes)</li>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Host-Specific Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Property address and parking space details</li>
              <li>Bank account or payment processor information</li>
              <li>Tax identification numbers (where required)</li>
              <li>Proof of ownership or right to rent</li>
              <li>Insurance information</li>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Renter-Specific Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Vehicle information (make, model, license plate, color)</li>
              <li>Driver's license information</li>
              <li>Vehicle insurance details</li>
              <li>Preferred parking locations</li>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Transaction Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Booking history and details</li>
              <li>Payment card information (tokenized by payment processor)</li>
              <li>Communications between Hosts and Renters</li>
              <li>Reviews and ratings</li>
              <li>Dispute and complaint information</li>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              2.2 Information Collected Automatically
            </Typography>
            
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Device and Technical Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>IP address and approximate location</li>
              <li>Device type, ID, and operating system</li>
              <li>Browser type and version</li>
              <li>App version and SDK information</li>
              <li>Screen resolution and device settings</li>
              <li>Language preferences and time zone settings</li>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Usage Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Pages viewed and features used</li>
              <li>Search queries and filters applied</li>
              <li>Click-through rates and navigation paths</li>
              <li>Session duration and frequency</li>
              <li>Crash reports and error logs</li>
              <li>Performance metrics</li>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              Location Information
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Precise GPS location (when permission granted)</li>
              <li>IP-based approximate location</li>
              <li>Parking space coordinates</li>
              <li>Check-in/check-out locations</li>
              <li>Navigation and routing data</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 3 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              3. HOW WE USE YOUR INFORMATION
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              3.1 Service Provision
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Create and manage user accounts</li>
              <li>Facilitate bookings between Hosts and Renters</li>
              <li>Process payments and payouts</li>
              <li>Enable communication between users</li>
              <li>Provide customer support</li>
              <li>Send transactional notifications</li>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              3.2 Safety and Security
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Verify user identities</li>
              <li>Detect and prevent fraud</li>
              <li>Investigate suspicious activities</li>
              <li>Enforce our Terms and Conditions</li>
              <li>Protect against security threats</li>
              <li>Comply with legal obligations</li>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              3.3 Platform Improvement
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Analyze usage patterns and trends</li>
              <li>Develop new features and services</li>
              <li>Optimize user experience</li>
              <li>Conduct A/B testing</li>
              <li>Fix bugs and technical issues</li>
              <li>Personalize content and recommendations</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 4 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              4. INFORMATION SHARING AND DISCLOSURE
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              4.1 Sharing Between Users
            </Typography>
            <Typography variant="body1" paragraph>
              When you make or accept a booking, we share limited information:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>With Hosts:</strong> Renter name, vehicle details, contact information</li>
              <li><strong>With Renters:</strong> Host name, parking location, contact information, space details</li>
              <li><strong>Public Profile:</strong> Username, profile photo, ratings, join date, verification status</li>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              4.2 Service Providers
            </Typography>
            <Typography variant="body1" paragraph>
              We share information with carefully selected third-party service providers:
            </Typography>
            
            <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
              <Chip label="Payment Processing" size="small" color="primary" />
              <Chip label="Communications" size="small" color="secondary" />
              <Chip label="Infrastructure" size="small" color="info" />
              <Chip label="Analytics" size="small" color="warning" />
            </Stack>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              4.3 Legal Disclosures
            </Typography>
            <Typography variant="body1" paragraph>
              We may disclose information when required by:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Court orders or subpoenas</li>
              <li>Law enforcement requests</li>
              <li>Government investigations</li>
              <li>National security requirements</li>
              <li>Protection of our legal rights</li>
              <li>Prevention of illegal activities</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 5 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              5. DATA SECURITY
            </Typography>
            
            <Alert severity="success" icon={<ShieldIcon />} sx={{ my: 2 }}>
              <Typography variant="body2" fontWeight={600}>
                ENTERPRISE-GRADE SECURITY: We implement industry-leading security measures to protect your data.
              </Typography>
            </Alert>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              5.1 Security Measures
            </Typography>
            <Typography variant="body1" paragraph>
              We implement industry-standard security measures including:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>Encryption:</strong> TLS/SSL for data in transit, AES-256 for data at rest</li>
              <li><strong>Access Controls:</strong> Role-based permissions, multi-factor authentication</li>
              <li><strong>Infrastructure:</strong> Secure data centers, firewall protection, intrusion detection</li>
              <li><strong>Monitoring:</strong> 24/7 security monitoring, regular vulnerability scans</li>
              <li><strong>Compliance:</strong> PCI-DSS compliance for payment data</li>
              <li><strong>Incident Response:</strong> Established breach notification procedures</li>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              5.2 Breach Notification
            </Typography>
            <Typography variant="body1" paragraph>
              In the event of a data breach that may impact your personal information, we will notify you within 72 hours via email and provide information about the incident and recommended actions.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 6 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              6. YOUR PRIVACY RIGHTS AND CHOICES
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              6.1 Access and Portability
            </Typography>
            <Typography variant="body1" paragraph>
              You have the right to:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Access your personal information</li>
              <li>Receive a copy in a portable format</li>
              <li>Know what information we collect</li>
              <li>Understand how we use it</li>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              6.2 Regional Privacy Rights
            </Typography>
            
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              California Residents (CCPA)
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Right to know categories of data collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of data sales (we do not sell data)</li>
              <li>Right to non-discrimination</li>
            </Box>

            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ mt: 2, color: 'primary.main' }}>
              European Residents (GDPR)
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Right to data portability</li>
              <li>Right to restriction of processing</li>
              <li>Right to object to processing</li>
              <li>Right to withdraw consent</li>
              <li>Right to lodge complaints with supervisory authorities</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 7 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              7. DATA RETENTION
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              7.1 Retention Periods
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>Active Accounts:</strong> Duration of account plus 90 days</li>
              <li><strong>Transaction Records:</strong> 7 years for tax/legal compliance</li>
              <li><strong>Communications:</strong> 2 years or as required by law</li>
              <li><strong>Marketing Data:</strong> Until opt-out or 3 years of inactivity</li>
              <li><strong>Security Logs:</strong> 1 year</li>
              <li><strong>Deleted Accounts:</strong> Anonymized after 30 days</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 8 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              8. CHILDREN'S PRIVACY
            </Typography>
            <Typography variant="body1" paragraph>
              Our Platform is not intended for children under 18. We do not knowingly collect information from minors. If you believe a child has provided us information, contact us immediately for deletion.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 9 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              9. COOKIES AND TRACKING TECHNOLOGIES
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              9.1 Types of Cookies We Use
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>Essential:</strong> Required for Platform functionality</li>
              <li><strong>Performance:</strong> Analyze usage and improve services</li>
              <li><strong>Functional:</strong> Remember preferences and settings</li>
              <li><strong>Targeting:</strong> Deliver relevant advertisements</li>
            </Box>

            <Typography variant="body1" paragraph sx={{ mt: 2 }}>
              For detailed information about our cookies, please see our{' '}
              <Link href="/cookies" color="primary">
                Cookie Policy
              </Link>
              .
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 10 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              10. AUTOMATED DECISION-MAKING
            </Typography>
            <Typography variant="body1" paragraph>
              We may use automated systems for:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Fraud detection and prevention</li>
              <li>Risk assessment for bookings</li>
              <li>Personalized recommendations</li>
              <li>Dynamic pricing suggestions</li>
            </Box>
            <Typography variant="body1" paragraph>
              You have the right to request human review of automated decisions that significantly affect you.
            </Typography>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Section 11 */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              11. CHANGES TO THIS PRIVACY POLICY
            </Typography>
            <Typography variant="body1" paragraph>
              We may update this Privacy Policy to reflect changes in legal requirements, business practices, Platform features, or security measures.
            </Typography>
            <Typography variant="body1" paragraph>
              Material changes will be notified via:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>Email notification</li>
              <li>Platform announcement</li>
              <li>App push notification</li>
              <li>30-day advance notice</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Contact Information */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              12. CONTACT INFORMATION
            </Typography>
            
            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              Data Protection Officer
            </Typography>
            <Typography variant="body1" paragraph>
              For privacy-related inquiries, contact our Data Protection Officer:
            </Typography>
            <Box sx={{ pl: 2, bgcolor: alpha(theme.palette.primary.main, 0.05), p: 3, borderRadius: 2 }}>
              <Typography variant="h6" fontWeight={600}>Parking in a Pinch, LLC</Typography>
              <Typography variant="body1">Attn: Data Protection Officer</Typography>
              <Typography variant="body1">Email: privacy@parkinginapinch.com</Typography>
              <Typography variant="body1">Address: 123 Privacy Lane, New York, NY 10001</Typography>
              <Typography variant="body1" sx={{ mt: 1 }}>
                <strong>Response Time:</strong> Within 30 days
              </Typography>
            </Box>

            <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mt: 3 }}>
              Supervisory Authorities
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li>EU residents may lodge complaints with their local data protection authority</li>
              <li>California residents may contact the California Attorney General</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Legal Basis */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              13. LEGAL BASIS FOR PROCESSING (GDPR)
            </Typography>
            <Typography variant="body1" paragraph>
              We process personal data based on:
            </Typography>
            <Box component="ul" sx={{ pl: 3, mb: 2 }}>
              <li><strong>Contract:</strong> Necessary for service provision</li>
              <li><strong>Legal Obligation:</strong> Required by law</li>
              <li><strong>Legitimate Interests:</strong> Platform security, improvement</li>
              <li><strong>Consent:</strong> Marketing communications</li>
              <li><strong>Vital Interests:</strong> Emergency situations</li>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {/* Final Agreement */}
          <Alert severity="info" icon={<GavelIcon />} sx={{ mt: 4 }}>
            <Typography variant="body2" fontWeight={600}>
              By using Parking in a Pinch, you acknowledge that you have read and understood this Privacy Policy and agree to the collection, use, and sharing of your information as described herein.
            </Typography>
          </Alert>

        </Paper>
      </Container>
    </Box>
  );
}