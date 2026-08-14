import { useState, lazy, Suspense } from "react";
import { Box, Container, Paper, Tab, Tabs, Typography, CircularProgress } from "@mui/material";
import SchoolIcon from "@mui/icons-material/School";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import ViewModuleIcon from "@mui/icons-material/ViewModule";
import ReplayIcon from "@mui/icons-material/Replay";
import ArchiveIcon from "@mui/icons-material/Archive";
import HistoryIcon from "@mui/icons-material/History";

import { useUrlTab } from "../../../hooks/useUrlTab";

// Lazy Loaded Child Components with explicit TSX extensions enabled by compiler options
const ClassPromotion = lazy(() => import("./ClassPromotion.tsx"));
const BulkPromotion = lazy(() => import("./BulkPromotion.tsx"));
const RepeatStudents = lazy(() => import("./RepeatStudents.tsx"));
const GraduateBatch = lazy(() => import("./GraduateBatch.tsx"));
const ArchiveYear = lazy(() => import("./ArchiveYear.tsx"));
const PromotionLogs = lazy(() => import("./PromotionLogs.tsx"));

const PromotionDashboard = () => {
    const [activeTab, setActiveTab] = useUrlTab(0, ['class-promotion', 'bulk-promotion', 'repeaters', 'graduation', 'archive', 'logs']);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
    };

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                <SchoolIcon sx={{ fontSize: 40, mr: 2, color: "primary.main" }} />
                <Box>
                    <Typography variant="h4" fontWeight="bold">
                        Student Promotion & Year-End Process
                    </Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        Manage student lifecycles, class promotions, repeaters, graduation, and academic year archiving.
                    </Typography>
                </Box>
            </Box>

            <Paper sx={{ mb: 4 }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    variant="scrollable"
                    scrollButtons="auto"
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ borderBottom: 1, borderColor: "divider" }}
                >
                    <Tab
                        icon={<SwapHorizIcon />}
                        iconPosition="start"
                        label="Class Promotion"
                    />
                    <Tab
                        icon={<ViewModuleIcon />}
                        iconPosition="start"
                        label="Bulk Promotion"
                    />
                    <Tab
                        icon={<ReplayIcon />}
                        iconPosition="start"
                        label="Repeat Students"
                    />
                    <Tab
                        icon={<SchoolIcon />}
                        iconPosition="start"
                        label="Graduate Batch"
                    />
                    <Tab
                        icon={<ArchiveIcon />}
                        iconPosition="start"
                        label="Archive Year"
                    />
                    <Tab
                        icon={<HistoryIcon />}
                        iconPosition="start"
                        label="Promotion Logs"
                    />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    <Suspense
                        fallback={
                            <Box sx={{ display: "flex", justifyContent: "center", py: 5 }}>
                                <CircularProgress />
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
            </Paper>
        </Container>
    );
};

export default PromotionDashboard;
