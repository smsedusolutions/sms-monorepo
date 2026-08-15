import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';
import MobileAppHeader from './MobileAppHeader';
import MobileBottomNav from './MobileBottomNav';
import MobileMoreDrawer from './MobileMoreDrawer';
import { useUserStore } from '../../../stores/userStore';
import { useBreadcrumbs } from '../../../hooks/useBreadcrumbs';

interface MobileAppLayoutProps {
  children: React.ReactNode;
  headerTitle?: string;
  headerRightAction?: React.ReactNode;
  hideBottomNav?: boolean;
  hideHeader?: boolean;
}

export const MobileAppLayout: React.FC<MobileAppLayoutProps> = ({
  children,
  headerTitle,
  headerRightAction,
  hideBottomNav = false,
  hideHeader = false,
}) => {
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const location = useLocation();
  const { user: userProfile, school } = useUserStore();
  const { items: breadcrumbs } = useBreadcrumbs();

  const currentPageTitle =
    headerTitle ||
    (breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : '');

  // Dynamically update document title based on current page title & school name (same as desktop)
  useEffect(() => {
    const schoolName =
      school?.schoolName || userProfile?.schoolName || 'SMS Edu Solution';
    if (currentPageTitle) {
      document.title = `${currentPageTitle} — ${schoolName}`;
    } else {
      document.title = schoolName;
    }
  }, [currentPageTitle, school?.schoolName, userProfile?.schoolName, location.pathname]);

  return (
    <div className="mobile-app-container">
      {/* Mobile Top Header */}
      {!hideHeader && (
        <MobileAppHeader
          titleOverride={headerTitle}
          rightAction={headerRightAction}
          onOpenMore={() => setMoreDrawerOpen(true)}
        />
      )}

      {/* Main Scrollable Viewport */}
      <main className="mobile-content-scroll">
        <Box sx={{ width: '100%', maxWidth: '100%', mx: 'auto' }}>
          {children}
        </Box>
      </main>

      {/* Mobile Bottom Navigation */}
      {!hideBottomNav && (
        <MobileBottomNav
          onOpenMore={() => setMoreDrawerOpen(true)}
          isMoreOpen={moreDrawerOpen}
        />
      )}

      {/* Full Navigation / Settings Drawer */}
      <MobileMoreDrawer
        open={moreDrawerOpen}
        onClose={() => setMoreDrawerOpen(false)}
      />
    </div>
  );
};

export default MobileAppLayout;
