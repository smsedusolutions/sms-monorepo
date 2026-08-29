import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Chip,
    Divider,
    Button,
    Avatar,
    Card,
    CircularProgress,
    Alert,
    Stack,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    School as SchoolIcon,
    Email as EmailIcon,
    Phone as PhoneIcon,
    Work as WorkIcon,
    Edit as EditIcon,
    MenuBook as MenuBookIcon,
    Class as ClassIcon,
    EventNote as AttendanceIcon,
    CalendarMonth as TimetableIcon,
    Assignment as HomeworkIcon,
    VerifiedUser as VerifiedIcon,
    ArrowForward as ArrowForwardIcon,
    Wc as GenderIcon,
    Cake as CakeIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import RequestChangeDialog from '../../components/Dialogs/RequestChangeDialog';
import { useUserStore } from '../../stores/userStore';
import TokenService from '../../queries/token/tokenService';

const TeacherProfile: React.FC = () => {
    const navigate = useNavigate();
    const [requestDialogOpen, setRequestDialogOpen] = useState(false);
    const [requestFieldType, setRequestFieldType] = useState<"email_change" | "phone_change" | "general">("general");
    const [currentFieldValue, setCurrentFieldValue] = useState("");

    // Get user and school data from Zustand store
    const { user: teacher, school, isLoading: teacherLoading, error: teacherError } = useUserStore();

    const schoolId = school?.schoolId || TokenService.getSchoolId() || "";
    const teacherId = teacher?.userId || teacher?.teacherId || TokenService.getTeacherId() || TokenService.getUserId() || "";
    const schoolName = teacher?.schoolName || school?.schoolName || schoolId;

    const subjectNames = teacher?.subjectNames || teacher?.subjects || [];
    const classNames = teacher?.classNames || [];
    const department = teacher?.department || "Academic Faculty";
    const classTeacherLabel = teacher?.classTeacherLabel || "";

    const userName = teacher?.firstName
        ? `${teacher.firstName} ${teacher.lastName || ""}`.trim()
        : teacher?.email?.split("@")[0] || "Faculty Member";

    const userEmail = teacher?.email || "";
    const userPhone = teacher?.phone || "";
    const userGender = teacher?.gender ? String(teacher.gender).toUpperCase() : "Not Specified";
    const userDob = teacher?.dateOfBirth ? new Date(teacher.dateOfBirth).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Not Specified";
    const userStatus = teacher?.status || "active";

    const openRequestDialog = (type: "email_change" | "phone_change" | "general", currentValue: string = "") => {
        setRequestFieldType(type);
        setCurrentFieldValue(currentValue);
        setRequestDialogOpen(true);
    };

    const getInitials = () => {
        if (teacher?.firstName && teacher?.lastName) {
            return `${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase();
        }
        return teacher?.firstName ? teacher.firstName[0].toUpperCase() : "T";
    };

    if (teacherLoading) {
        return (
            <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
                <CircularProgress />
            </Box>
        );
    }

    if (teacherError) {
        return (
            <Box sx={{ p: 3 }}>
                <Alert severity="error">Failed to load teacher profile. Please refresh the page.</Alert>
            </Box>
        );
    }

    return (
        <Box sx={{ p: { xs: 1.5, sm: 2.5, md: 3 }, maxWidth: 1200, mx: "auto" }}>
            {/* Hero Profile Banner */}
            <Card
                sx={{
                    mb: 3,
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
                    overflow: "hidden",
                }}
            >
                <Box
                    sx={{
                        background: "linear-gradient(135deg, #0f766e 0%, #0d9488 50%, #14b8a6 100%)",
                        px: { xs: 2.5, sm: 4 },
                        py: { xs: 3, sm: 3.5 },
                        color: "#ffffff",
                        position: "relative",
                    }}
                >
                    <Box
                        sx={{
                            display: "flex",
                            alignItems: { xs: "flex-start", sm: "center" },
                            flexDirection: { xs: "column", sm: "row" },
                            gap: 3,
                        }}
                    >
                        <Avatar
                            src={teacher?.profileImage}
                            sx={{
                                width: { xs: 76, sm: 92 },
                                height: { xs: 76, sm: 92 },
                                fontSize: { xs: "1.75rem", sm: "2.2rem" },
                                fontWeight: 800,
                                bgcolor: "#0f766e",
                                color: "#ffffff",
                                border: "3px solid rgba(255, 255, 255, 0.9)",
                                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                            }}
                        >
                            {getInitials()}
                        </Avatar>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                                <Typography variant="h5" fontWeight={800} sx={{ color: "#ffffff", fontSize: { xs: "1.3rem", sm: "1.65rem" } }}>
                                    {userName}
                                </Typography>
                                <Chip
                                    icon={<VerifiedIcon sx={{ fontSize: "14px !important", color: "#fff !important" }} />}
                                    label="Teaching Faculty"
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(255, 255, 255, 0.15)",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "0.7rem",
                                        backdropFilter: "blur(4px)",
                                    }}
                                />
                                {classTeacherLabel && (
                                    <Chip
                                        label={`Class Teacher: ${classTeacherLabel}`}
                                        size="small"
                                        sx={{
                                            bgcolor: "#fef08a",
                                            color: "#854d0e",
                                            fontWeight: 800,
                                            fontSize: "0.7rem",
                                        }}
                                    />
                                )}
                            </Box>

                            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)", mb: 1.5, fontSize: { xs: "0.825rem", sm: "0.9rem" } }}>
                                Teacher ID: <strong style={{ color: "#ffffff" }}>{teacherId}</strong> • {department} • {schoolName}
                            </Typography>

                            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                                <Chip
                                    label={userStatus === "active" ? "Active Faculty" : "Inactive"}
                                    size="small"
                                    sx={{
                                        bgcolor: userStatus === "active" ? "#2dd4bf" : "#ef4444",
                                        color: "#042f2e",
                                        fontWeight: 700,
                                        fontSize: "0.725rem",
                                    }}
                                />
                                <Chip
                                    label={`${subjectNames.length} Assigned ${subjectNames.length === 1 ? 'Subject' : 'Subjects'}`}
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(255, 255, 255, 0.2)",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "0.725rem",
                                    }}
                                />
                                <Chip
                                    label={`${classNames.length} Assigned ${classNames.length === 1 ? 'Class' : 'Classes'}`}
                                    size="small"
                                    sx={{
                                        bgcolor: "rgba(255, 255, 255, 0.2)",
                                        color: "#ffffff",
                                        fontWeight: 700,
                                        fontSize: "0.725rem",
                                    }}
                                />
                            </Stack>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={<EditIcon />}
                            onClick={() => openRequestDialog("general", "")}
                            sx={{
                                bgcolor: "#ffffff",
                                color: "#0f766e",
                                fontWeight: 700,
                                borderRadius: 2,
                                textTransform: "none",
                                px: 2.5,
                                py: 1,
                                fontSize: "0.85rem",
                                boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                                "&:hover": { bgcolor: "#f0fdfa" },
                                alignSelf: { xs: "flex-start", sm: "center" },
                            }}
                        >
                            Request Update
                        </Button>
                    </Box>
                </Box>

                {/* KPI Metrics Strip */}
                <Grid container sx={{ bgcolor: "#f8fafc", borderTop: "1px solid", borderColor: "divider" }}>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center", borderRight: { xs: "1px solid #e2e8f0", sm: "1px solid #e2e8f0" }, borderBottom: { xs: "1px solid #e2e8f0", sm: "none" } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>DEPARTMENT</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: "#0f766e", fontSize: "0.95rem" }} noWrap>{department}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center", borderRight: { sm: "1px solid #e2e8f0" }, borderBottom: { xs: "1px solid #e2e8f0", sm: "none" } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ASSIGNED SUBJECTS</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: "#1e293b" }}>{subjectNames.length}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center", borderRight: { xs: "1px solid #e2e8f0", sm: "1px solid #e2e8f0" } }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>ASSIGNED CLASSES</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: "#1e293b" }}>{classNames.length}</Typography>
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center" }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={600}>STATUS</Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: userStatus === "active" ? "#10b981" : "#ef4444" }}>
                            {userStatus.toUpperCase()}
                        </Typography>
                    </Grid>
                </Grid>
            </Card>

            <Grid container spacing={3}>
                {/* Left Column: Personal Contact Information */}
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: { xs: 2, sm: 2.5 },
                            borderRadius: 3,
                            border: "1px solid",
                            borderColor: "divider",
                            bgcolor: "#ffffff",
                        }}
                    >
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                            Contact & Professional Details
                        </Typography>

                        <Stack spacing={2}>
                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#ccfbf1", color: "#0f766e" }}>
                                    <EmailIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Email Address</Typography>
                                    <Typography variant="body2" fontWeight={600} noWrap>{userEmail || "Not Provided"}</Typography>
                                </Box>
                                <Tooltip title="Request email change">
                                    <IconButton size="small" onClick={() => openRequestDialog("email_change", userEmail)}>
                                        <EditIcon fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider />

                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#eff6ff", color: "#2563eb" }}>
                                    <PhoneIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Contact Phone</Typography>
                                    <Typography variant="body2" fontWeight={600}>{userPhone || "Not Provided"}</Typography>
                                </Box>
                                <Tooltip title="Request phone change">
                                    <IconButton size="small" onClick={() => openRequestDialog("phone_change", userPhone)}>
                                        <EditIcon fontSize="small" sx={{ color: "text.secondary", fontSize: 16 }} />
                                    </IconButton>
                                </Tooltip>
                            </Box>

                            <Divider />

                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#fdf2f8", color: "#db2777" }}>
                                    <GenderIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Gender</Typography>
                                    <Typography variant="body2" fontWeight={600}>{userGender}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#fef3c7", color: "#d97706" }}>
                                    <CakeIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Date of Birth</Typography>
                                    <Typography variant="body2" fontWeight={600}>{userDob}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#fffbeb", color: "#d97706" }}>
                                    <WorkIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Academic Department</Typography>
                                    <Typography variant="body2" fontWeight={600}>{department}</Typography>
                                </Box>
                            </Box>

                            <Divider />

                            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                                <Avatar sx={{ width: 36, height: 36, bgcolor: "#f5f3ff", color: "#8b5cf6" }}>
                                    <SchoolIcon sx={{ fontSize: 18 }} />
                                </Avatar>
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Registered School</Typography>
                                    <Typography variant="body2" fontWeight={600}>{schoolName}</Typography>
                                    <Typography variant="caption" color="text.secondary">School ID: {schoolId}</Typography>
                                </Box>
                            </Box>
                        </Stack>

                        <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => openRequestDialog("general", "")}
                            sx={{ mt: 3, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                        >
                            Request Information Change
                        </Button>
                    </Paper>
                </Grid>

                {/* Right Column: Teaching Portfolio & Quick Gateways */}
                <Grid size={{ xs: 12, md: 7 }}>
                    <Stack spacing={3}>
                        {/* Teaching Allocations Card */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "#ffffff",
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                                Teaching Portfolio & Allocations
                            </Typography>

                            <Box sx={{ mb: 2.5 }}>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <MenuBookIcon sx={{ fontSize: 18, color: "primary.main" }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        ASSIGNED SUBJECTS ({subjectNames.length})
                                    </Typography>
                                </Box>
                                {subjectNames.length > 0 ? (
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                        {subjectNames.map((name: string, idx: number) => (
                                            <Chip
                                                key={idx}
                                                label={name}
                                                size="small"
                                                sx={{ bgcolor: "#f0fdfa", color: "#0f766e", fontWeight: 600, border: "1px solid #99f6e4" }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">No subjects assigned yet.</Typography>
                                )}
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box>
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                                    <ClassIcon sx={{ fontSize: 18, color: "secondary.main" }} />
                                    <Typography variant="caption" color="text.secondary" fontWeight={700}>
                                        ASSIGNED CLASSES & SECTIONS ({classNames.length})
                                    </Typography>
                                </Box>
                                {classNames.length > 0 ? (
                                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                                        {classNames.map((name: string, idx: number) => (
                                            <Chip
                                                key={idx}
                                                label={name}
                                                size="small"
                                                sx={{ bgcolor: "#f5f3ff", color: "#7c3aed", fontWeight: 600, border: "1px solid #ddd6fe" }}
                                            />
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">No classes assigned yet.</Typography>
                                )}
                            </Box>
                        </Paper>

                        {/* Quick Teaching Hub Gateways */}
                        <Paper
                            elevation={0}
                            sx={{
                                p: { xs: 2, sm: 2.5 },
                                borderRadius: 3,
                                border: "1px solid",
                                borderColor: "divider",
                                bgcolor: "#ffffff",
                            }}
                        >
                            <Typography variant="subtitle1" fontWeight={700} color="#1e293b" sx={{ mb: 2 }}>
                                Faculty Gateways
                            </Typography>

                            <Grid container spacing={1.5}>
                                {[
                                    { label: "My Classes & Students", desc: "View enrolled rosters", icon: <ClassIcon />, path: "/teacher/classes", color: "#0f766e" },
                                    { label: "Attendance Register", desc: "Mark & submit daily records", icon: <AttendanceIcon />, path: "/teacher/attendance", color: "#10b981" },
                                    { label: "Weekly Timetable", desc: "Teaching periods & schedules", icon: <TimetableIcon />, path: "/teacher/timetable", color: "#3b82f6" },
                                    { label: "Homework & Assignments", desc: "Create & review submissions", icon: <HomeworkIcon />, path: "/teacher/homework", color: "#f59e0b" },
                                ].map((item) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={item.label}>
                                        <Paper
                                            elevation={0}
                                            onClick={() => navigate(item.path)}
                                            sx={{
                                                p: 2,
                                                borderRadius: 2.5,
                                                border: "1px solid #e2e8f0",
                                                bgcolor: "#f8fafc",
                                                cursor: "pointer",
                                                transition: "all 0.18s ease-in-out",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                "&:hover": {
                                                    borderColor: item.color,
                                                    boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
                                                    bgcolor: "#ffffff",
                                                    transform: "translateY(-1.5px)",
                                                },
                                            }}
                                        >
                                            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                                                <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 42, height: 42, borderRadius: 2 }}>
                                                    {React.cloneElement(item.icon as any, { sx: { fontSize: 22 } })}
                                                </Avatar>
                                                <Box>
                                                    <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.875rem" }}>{item.label}</Typography>
                                                    <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                                                </Box>
                                            </Box>
                                            <ArrowForwardIcon sx={{ fontSize: 18, color: "text.secondary" }} />
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        </Paper>
                    </Stack>
                </Grid>
            </Grid>

            {/* Request Change Dialog */}
            <RequestChangeDialog
                open={requestDialogOpen}
                onClose={() => setRequestDialogOpen(false)}
                schoolId={schoolId}
                userId={teacherId}
                userName={userName}
                userType="teacher"
                fieldType={requestFieldType}
                currentValue={currentFieldValue}
            />
        </Box>
    );
};

export default TeacherProfile;
