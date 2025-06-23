commit 52cfdd204642b52f5f631365252f5d56e3aed2d5
Author: rellizuraddixion <rellizuraddixion@example.com>
Date:   Mon Jun 23 13:14:01 2025 -0400

    Fix mobile navigation accessibility
    
    - Make mobile logo text clickable and link to dashboard
    - Add Dashboard menu item as first option in mobile sidebar
    - Add Dashboard option to profile dropdown menu
    
    🤖 Generated with [Claude Code](https://claude.ai/code)
    
    Co-Authored-By: Claude <noreply@anthropic.com>

diff --git a/frontend/src/components/layout/Navigation.tsx b/frontend/src/components/layout/Navigation.tsx
index efac3fd..d60af71 100644
--- a/frontend/src/components/layout/Navigation.tsx
+++ b/frontend/src/components/layout/Navigation.tsx
@@ -163,6 +163,7 @@ const Navigation: React.FC<NavigationProps> = ({ isHost = false }) => {
   ];
 
   const renterMenuItems = [
+    { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
     { text: 'Search Parking', icon: <Search />, path: '/listings' },
     { text: 'My Bookings', icon: <CalendarMonth />, path: '/my-bookings' },
     { text: 'Favorites', icon: <FavoriteOutlined />, path: '/favorites' },
@@ -375,7 +376,20 @@ const Navigation: React.FC<NavigationProps> = ({ isHost = false }) => {
             </Box>
 
             <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' }, justifyContent: 'center' }}>
-              <Typography variant="h6" color="primary" fontWeight="bold">
+              <Typography 
+                variant="h6" 
+                color="primary" 
+                fontWeight="bold"
+                component="a"
+                href="/dashboard"
+                sx={{
+                  textDecoration: 'none',
+                  cursor: 'pointer',
+                  '&:hover': {
+                    opacity: 0.8,
+                  },
+                }}
+              >
                 Parking in a Pinch
               </Typography>
             </Box>
@@ -444,7 +458,13 @@ const Navigation: React.FC<NavigationProps> = ({ isHost = false }) => {
                     open={Boolean(anchorElUser)}
                     onClose={handleCloseUserMenu}
                   >
-                    <MenuItem onClick={() => navigate('/profile')}>
+                    <MenuItem onClick={() => { navigate('/dashboard'); handleCloseUserMenu(); }}>
+                      <ListItemIcon>
+                        <Dashboard fontSize="small" />
+                      </ListItemIcon>
+                      Dashboard
+                    </MenuItem>
+                    <MenuItem onClick={() => { navigate('/profile'); handleCloseUserMenu(); }}>
                       <ListItemIcon>
                         <Person fontSize="small" />
                       </ListItemIcon>
