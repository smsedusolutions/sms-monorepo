import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Avatar,
  Card,
  CircularProgress,
  Alert,
  Stack,
  Divider,
} from "@mui/material";
import {
  Email as EmailIcon,
  Phone as PhoneIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  School as SchoolIcon,
  People as StudentsIcon,
  Badge as TeachersIcon,
  Class as ClassesIcon,
  ReceiptLong as FeesIcon,
  CalendarMonth as TimetableIcon,
  VerifiedUser as VerifiedIcon,
  ArrowForward as ArrowForwardIcon,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../stores/userStore";
import { useNotification } from "../../hooks/useNotification";
import { PhoneInput } from "../../components/shared/PhoneInput";
import TokenService from "../../queries/token/tokenService";
import { useUpdateSchoolAdmin } from "../../queries/SchoolAdmin";

const SchoolAdminProfile: React.FC = () => {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const notify = useNotification();
  const updateSchoolAdmin = useUpdateSchoolAdmin();

  // Get user and school data from Zustand store
  const {
    user: admin,
    school,
    isLoading: adminLoading,
    error: adminError,
    fetchProfile,
  } = useUserStore();

  const userId = admin?.userId || TokenService.getUserId() || "";
  const schoolId = school?.schoolId || TokenService.getSchoolId() || "";
  const role = admin?.role || TokenService.getRole() || "sch_admin";
  const schoolName = admin?.schoolName || school?.schoolName || schoolId;

  const userName = admin?.firstName
    ? `${admin.firstName} ${admin.lastName || ""}`.trim()
    : admin?.username || admin?.email?.split("@")[0] || "Administrator";

  const userEmail = admin?.email || "";
  const userPhone = admin?.contactNumber || admin?.phone || admin?.phoneNumber || "";
  const userStatus = admin?.status || "active";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    if (admin) {
      setFormData({
        firstName: admin.firstName || "",
        lastName: admin.lastName || "",
        email: admin.email || "",
        phone: admin.contactNumber || admin.phone || admin.phoneNumber || "",
      });
    }
  }, [admin]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!userId) {
      notify.error("User ID is missing");
      return;
    }

    try {
      const res = await updateSchoolAdmin.mutateAsync({
        userId,
        data: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          contactNumber: formData.phone,
          phone: formData.phone,
        },
      });

      if (res && res.success !== false) {
        await fetchProfile(true);
        setIsEditing(false);
        notify.success("Profile updated successfully!");
      } else {
        notify.error(res?.message || "Failed to update profile");
      }
    } catch (err: any) {
      notify.error(err?.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: admin?.firstName || "",
      lastName: admin?.lastName || "",
      email: admin?.email || "",
      phone: admin?.contactNumber || admin?.phone || admin?.phoneNumber || "",
    });
    setIsEditing(false);
  };

  const getInitials = () => {
    if (admin?.firstName && admin?.lastName) {
      return `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();
    }
    return admin?.firstName ? admin.firstName[0].toUpperCase() : "A";
  };

  if (adminLoading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (adminError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Failed to load administrator profile. Please try again.</Alert>
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
            background: "linear-gradient(135deg, #881337 0%, #9f1239 50%, #e11d48 100%)",
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
              src={admin?.profileImage}
              sx={{
                width: { xs: 76, sm: 92 },
                height: { xs: 76, sm: 92 },
                fontSize: { xs: "1.75rem", sm: "2.2rem" },
                fontWeight: 800,
                bgcolor: "#be123c",
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
                  label="School Administrator"
                  size="small"
                  sx={{
                    bgcolor: "rgba(255, 255, 255, 0.15)",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: "0.7rem",
                    backdropFilter: "blur(4px)",
                  }}
                />
              </Box>

              <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)", mb: 1.5, fontSize: { xs: "0.825rem", sm: "0.9rem" } }}>
                Admin ID: <strong style={{ color: "#ffffff" }}>{userId}</strong> • {schoolName}
              </Typography>

              <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
                <Chip
                  label={userStatus === "active" ? "Active Administrator" : "Inactive"}
                  size="small"
                  sx={{
                    bgcolor: userStatus === "active" ? "#fb7185" : "#ef4444",
                    color: "#881337",
                    fontWeight: 700,
                    fontSize: "0.725rem",
                  }}
                />
                <Chip
                  label="Full School Access"
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

            {!isEditing && (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setIsEditing(true)}
                sx={{
                  bgcolor: "#ffffff",
                  color: "#881337",
                  fontWeight: 700,
                  borderRadius: 2,
                  textTransform: "none",
                  px: 2.5,
                  py: 1,
                  fontSize: "0.85rem",
                  boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
                  "&:hover": { bgcolor: "#fff1f2" },
                  alignSelf: { xs: "flex-start", sm: "center" },
                }}
              >
                Edit Profile
              </Button>
            )}
          </Box>
        </Box>

        {/* KPI Metrics Strip */}
        <Grid container sx={{ bgcolor: "#f8fafc", borderTop: "1px solid", borderColor: "divider" }}>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center", borderRight: { xs: "1px solid #e2e8f0", sm: "1px solid #e2e8f0" }, borderBottom: { xs: "1px solid #e2e8f0", sm: "none" } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>ROLE</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: "#9f1239" }}>School Admin</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center", borderRight: { sm: "1px solid #e2e8f0" }, borderBottom: { xs: "1px solid #e2e8f0", sm: "none" } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>CAMPUS</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: "#1e293b", fontSize: "0.95rem" }} noWrap>{schoolName}</Typography>
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }} sx={{ p: 2, textAlign: "center", borderRight: { xs: "1px solid #e2e8f0", sm: "1px solid #e2e8f0" } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>SCHOOL CODE</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ mt: 0.25, color: "#1e293b" }}>{schoolId}</Typography>
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
        {/* Left Column: Editable Profile Information */}
        <Grid size={{ xs: 12, md: 5.5 }}>
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
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#1e293b">
                Administrator Details
              </Typography>
              {isEditing && (
                <Chip label="Editing Mode" size="small" color="primary" sx={{ fontWeight: 600 }} />
              )}
            </Box>

            {isEditing ? (
              <Stack spacing={2.5} sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  size="small"
                />
                <TextField
                  fullWidth
                  label="Email Address"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  size="small"
                  type="email"
                />
                <PhoneInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  label="Contact Phone"
                  fullWidth
                />

                <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={updateSchoolAdmin.isPending}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
                  >
                    {updateSchoolAdmin.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<CancelIcon />}
                    onClick={handleCancel}
                    disabled={updateSchoolAdmin.isPending}
                    sx={{ borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                  >
                    Cancel
                  </Button>
                </Stack>
              </Stack>
            ) : (
              <Stack spacing={2}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "#ffe4e6", color: "#e11d48" }}>
                    <EmailIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Email Address</Typography>
                    <Typography variant="body2" fontWeight={600} noWrap>{userEmail || "Not Provided"}</Typography>
                  </Box>
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
                </Box>

                <Divider />

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "#f5f3ff", color: "#8b5cf6" }}>
                    <SchoolIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Assigned School</Typography>
                    <Typography variant="body2" fontWeight={600}>{schoolName}</Typography>
                    <Typography variant="caption" color="text.secondary">School ID: {schoolId}</Typography>
                  </Box>
                </Box>

                <Divider />

                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: "#f1f5f9", color: "#475569" }}>
                    <AdminIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>Privilege Role</Typography>
                    <Typography variant="body2" fontWeight={600}>{role === "super_admin" ? "Super Administrator" : "School Administrator"}</Typography>
                  </Box>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setIsEditing(true)}
                  sx={{ mt: 2, borderRadius: 2, textTransform: "none", fontWeight: 600 }}
                >
                  Edit Profile Information
                </Button>
              </Stack>
            )}
          </Paper>
        </Grid>

        {/* Right Column: Administrative Gateways */}
        <Grid size={{ xs: 12, md: 6.5 }}>
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
              Administrative Command Gateways
            </Typography>

            <Grid container spacing={1.5}>
              {[
                { label: "Students Registry", desc: "Admissions, rosters & profiles", icon: <StudentsIcon />, path: "/school-admin/students", color: "#0284c7" },
                { label: "Faculty Directory", desc: "Teacher assignments & profiles", icon: <TeachersIcon />, path: "/school-admin/teachers", color: "#059669" },
                { label: "Classes & Sections", desc: "Academic structural hierarchy", icon: <ClassesIcon />, path: "/school-admin/classes", color: "#7c3aed" },
                { label: "Fee Management", desc: "Structures, ledgers & collection", icon: <FeesIcon />, path: "/school-admin/fees/dashboard", color: "#d97706" },
                { label: "Timetable Master", desc: "Schedules, drafts & conflicts", icon: <TimetableIcon />, path: "/school-admin/timetable/config", color: "#e11d48" },
                { label: "Campus Profile", desc: "Branch settings & infrastructure", icon: <SchoolIcon />, path: "/school-admin/school", color: "#4f46e5" },
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
                      <Avatar sx={{ bgcolor: `${item.color}15`, color: item.color, width: 40, height: 40, borderRadius: 2 }}>
                        {React.cloneElement(item.icon as any, { sx: { fontSize: 20 } })}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: "0.85rem" }}>{item.label}</Typography>
                        <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                      </Box>
                    </Box>
                    <ArrowForwardIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SchoolAdminProfile;
