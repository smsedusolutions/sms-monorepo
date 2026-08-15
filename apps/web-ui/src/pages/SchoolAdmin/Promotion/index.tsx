import { lazy, Suspense } from "react";
import { Box, Tab, Tabs, Typography, CircularProgress } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ReplayIcon from "@mui/icons-material/Replay";
import ArchiveIcon from "@mui/icons-material/Archive";
import HistoryIcon from "@mui/icons-material/History";

import { useUrlTab } from "../../../hooks/useUrlTab";
import { useIsMobile } from "../../../hooks/useIsMobile";

// Lazy Loaded Child Components with explicit TSX extensions enabled by compiler options
const ClassPromotion = lazy(() => import("./ClassPromotion.tsx"));
const BulkPromotion = lazy(() => import("./BulkPromotion.tsx"));
const RepeatStudents = lazy(() => import("./RepeatStudents.tsx"));
const GraduateBatch = lazy(() => import("./GraduateBatch.tsx"));
const ArchiveYear = lazy(() => import("./ArchiveYear.tsx"));
const PromotionLogs = lazy(() => import("./PromotionLogs.tsx"));

const PromotionDashboard = () => {
    const isMobile = useIsMobile();
    const [activeTab, setActiveTab] = useUrlTab(0, ['class-promotion', 'bulk-promotion', 'repeaters', 'graduation', 'archive', 'logs']);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Box sx={{ p: isMobile ? 1.5 : 3 }}>
            {/* Desktop Page Title */}
            {!isMobile && (
                <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                    <SchoolIcon sx={{ fontSize: 36, mr: 1.5, color: "primary.main" }} />
                    <Box>
                        <Typography variant="h4" fontWeight={700}>
                            Student Promotion & Year-End Process
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Manage student lifecycles, class promotions, repeaters, graduation, and academic year archiving.
                        </Typography>
                    </Box>
                </Box>
            )}

            {/* Clean Underline Scrollable Tabs */}
            <Tabs
                value={activeTab}
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                    minHeight: 40,
                    borderBottom: '1px solid #e2e8f0',
                    mb: 2.5,
                    '& .MuiTab-root': {
                        minHeight: 40,
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        px: isMobile ? 1.5 : 2.5,
                        color: '#64748b',
                        '&.Mui-selected': {
                            color: 'primary.main',
                            fontWeight: 700,
                        },
                    },
                }}
            >
                <Tab
                    icon={<SwapHorizIcon fontSize="small" />}
                    iconPosition="start"
                    label="Class Promotion"
                />
                <Tab
                    icon={<ViewModuleIcon fontSize="small" />}
                    iconPosition="start"
                    label="Bulk Promotion"
                />
                <Tab
                    icon={<ReplayIcon fontSize="small" />}
                    iconPosition="start"
                    label="Repeat Students"
                />
                <Tab
                    icon={<SchoolIcon fontSize="small" />}
                    iconPosition="start"
                    label="Graduate Batch"
                />
                <Tab
                    icon={<ArchiveIcon fontSize="small" />}
                    iconPosition="start"
                    label="Archive Year"
                />
                <Tab
                    icon={<HistoryIcon fontSize="small" />}
                    iconPosition="start"
                    label="Promotion Logs"
                />
            </Tabs>

            <Suspense
                fallback={
                    <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                        <CircularProgress size={32} />
                    </Box>
                }
            >
                {activeTab === 0 && <ClassPromotion />}
                {activeTab === 1 && <BulkPromotion />}
                {activeTab === 2 && <RepeatStudents />}
                {activeTab === 3 && <GraduateBatch />}
                {activeTab === 4 && <ArchiveYear />}
                {activeTab === 5 && <PromotionLogs />}
            </Suspense>
        </Box>
    );
};

export default PromotionDashboard;
