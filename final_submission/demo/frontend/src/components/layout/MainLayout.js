import React from 'react';
import { Box, CssBaseline, Drawer, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import CustomAppBar from './CustomAppBar';
import Navigation from './Navigation';
import { useToggle } from '../../hooks';

const DRAWER_WIDTH = 240;

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, { toggle: toggleMobileOpen, setFalse: closeMobileDrawer }] = useToggle(false);

  const drawer = <Navigation onMobileClose={closeMobileDrawer} />;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* App Bar */}
      <CustomAppBar
        onMobileNavOpen={toggleMobileOpen}
        drawerWidth={DRAWER_WIDTH}
      />

      {/* Navigation Drawer */}
      <Box
        component="nav"
        sx={{ 
          width: { md: DRAWER_WIDTH }, 
          flexShrink: { md: 0 } 
        }}
      >
        {isMobile ? (
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={closeMobileDrawer}
            ModalProps={{
              keepMounted: true, // Better open performance on mobile.
            }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH 
              },
            }}
          >
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: DRAWER_WIDTH 
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: '64px', // AppBar height
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;