import { useState, useEffect } from "react";
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
  CardContent,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  AdminPanelSettings as AdminIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  School as SchoolIcon,
} from "@mui/icons-material";

import { useUserStore } from "../../stores/userStore";
import { useNotification } from "../../hooks/useNotification";
import { PhoneInput, formatPhoneNumber } from "../../components/shared/PhoneInput";
import TokenService from "../../queries/token/tokenService";
import { useUpdateSchoolAdmin } from "../../queries/SchoolAdmin";

const SchoolAdminProfile = () => {
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

  // Derivations for legacy compatibility and clear naming
  const userId = admin?.userId || TokenService.getUserId() || "";
  const schoolId = school?.schoolId || TokenService.getSchoolId() || "";
  const role = admin?.role || TokenService.getRole() || "sch_admin";

  // Use aggregated data from store
  const schoolName = admin?.schoolName || school?.schoolName || schoolId;

  // User details from store
  const userName = admin?.firstName
    ? `${admin.firstName} ${admin.lastName || ""}`.trim()
    : admin?.username || admin?.email?.split("@")[0] || "Admin";
  const userEmail = admin?.email || "";
  const userPhone = admin?.contactNumber || admin?.phone || admin?.phoneNumber || "";

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // Update form data when admin data loads
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

  // Get initials for avatar
  const getInitials = () => {
    if (admin?.firstName && admin?.lastName) {
      return `${admin.firstName[0]}${admin.lastName[0]}`.toUpperCase();
    }
    return admin?.firstName ? admin.firstName[0].toUpperCase() : "A";
  };

  const getRoleLabel = (r: string) => {
    switch (r) {
      case "sch_admin":
        return "School Administrator";
      case "super_admin":
        return "Super Admin";
      default:
        return r;
    }
  };

  if (adminLoading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (adminError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Failed to load profile. Please try again later.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: "auto" }}>
      {/* Header Card with Avatar */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
          color: "white",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -50,
            right: -50,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: -30,
            left: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
          }}
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1,
          }}
        >
          <Avatar
            src={admin?.profileImage}
            sx={{
              width: 100,
              height: 100,
              fontSize: "2.5rem",
              bgcolor: "rgba(255,255,255,0.2)",
              border: "3px solid rgba(255,255,255,0.5)",
            }}
          >
            {!admin?.profileImage && getInitials()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
              {userName}
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Chip
                icon={<AdminIcon sx={{ color: "white !important" }} />}
                label={getRoleLabel(role)}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                  "& .MuiChip-icon": { color: "white" },
                }}
              />
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ID: {admin?.userId || userId}
              </Typography>
            </Box>
          </Box>
          {!isEditing ? (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => setIsEditing(true)}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              Edit Profile
            </Button>
          ) : (
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                sx={{
                  borderColor: "rgba(255,255,255,0.5)",
                  color: "white",
                  "&:hover": {
                    borderColor: "white",
                    bgcolor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={updateSchoolAdmin.isPending}
                startIcon={
                  updateSchoolAdmin.isPending ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <SaveIcon />
                  )
                }
                onClick={handleSave}
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                }}
              >
                {updateSchoolAdmin.isPending ? "Saving..." : "Save"}
              </Button>
            </Box>
          )}
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Account Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Account Information
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {isEditing ? (
                  <>
                    <TextField
                      name="firstName"
                      label="First Name"
                      value={formData.firstName}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                    <TextField
                      name="lastName"
                      label="Last Name"
                      value={formData.lastName}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                  </>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: "primary.50",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PersonIcon color="primary" fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Full Name
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {userName}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "success.50",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <BadgeIcon color="success" fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Admin ID
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {admin?.userId || userId}
                    </Typography>
                  </Box>
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: "warning.50",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <SchoolIcon color="warning" fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      School
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {schoolName}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Contact Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <EmailIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Contact Information
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                {isEditing ? (
                  <>
                    <TextField
                      name="email"
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      fullWidth
                      size="small"
                    />
                    <PhoneInput
                      name="phone"
                      label="Phone"
                      value={formData.phone}
                      onChange={handleChange}
                      textFieldSx={{ mb: 0 }}
                      size="small"
                    />
                  </>
                ) : (
                  <>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: "info.50",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <EmailIcon color="info" fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Email
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {userEmail || "-"}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: "error.50",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PhoneIcon color="error" fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Phone
                        </Typography>
                        <Typography variant="body1" fontWeight={500}>
                          {userPhone ? formatPhoneNumber(userPhone) : "Not provided"}
                        </Typography>
                      </Box>
                    </Box>
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Role & Permissions Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}
              >
                <AdminIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Role & Access
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Your administrative privileges and access level.
              </Typography>
              <Chip
                icon={<AdminIcon />}
                label={getRoleLabel(role)}
                color="primary"
                sx={{ fontWeight: 600 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SchoolAdminProfile;
