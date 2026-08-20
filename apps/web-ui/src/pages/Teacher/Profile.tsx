import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
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
  School as SchoolIcon,
  Work as WorkIcon,
  Edit as EditIcon,
  MenuBook as MenuBookIcon,
} from "@mui/icons-material";

import RequestChangeDialog from "../../components/Dialogs/RequestChangeDialog";
import { useUserStore } from "../../stores/userStore";

const TeacherProfile = () => {
  const [requestDialogOpen, setRequestDialogOpen] = useState(false);
  const [requestFieldType, setRequestFieldType] = useState<
    "email_change" | "phone_change" | "general"
  >("general");
  const [currentFieldValue, setCurrentFieldValue] = useState("");

  // Get user and school data from Zustand store
  const {
    user: teacher,
    school,
    isLoading: teacherLoading,
    error: teacherError,
  } = useUserStore();

  // Derivations for legacy compatibility and clear naming
  const schoolId = school?.schoolId || "";
  const teacherId = teacher?.userId || "";

  // Use aggregated data directly from store
  const schoolName = teacher?.schoolName || school?.schoolName || schoolId;
  const subjectNames = teacher?.subjectNames || teacher?.subjects || [];
  const classNames = teacher?.classNames || [];

  // User details from store
  const userName = teacher?.firstName
    ? `${teacher.firstName} ${teacher.lastName || ""}`.trim()
    : teacher?.email?.split("@")[0] || "User";
  const userEmail = teacher?.email || "";
  const userPhone = teacher?.phone || "";
  const department = teacher?.department || "";

  const openRequestDialog = (
    type: "email_change" | "phone_change" | "general",
    currentValue: string = "",
  ) => {
    setRequestFieldType(type);
    setCurrentFieldValue(currentValue);
    setRequestDialogOpen(true);
  };

  // Get initials for avatar
  const getInitials = () => {
    if (teacher?.firstName && teacher?.lastName) {
      return `${teacher.firstName[0]}${teacher.lastName[0]}`.toUpperCase();
    }
    return teacher?.firstName ? teacher.firstName[0].toUpperCase() : "T";
  };

  if (teacherLoading) {
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

  if (teacherError) {
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
          borderRadius: 2,
          background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
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
            src={teacher?.profileImage || undefined}
            sx={{
              width: 100,
              height: 100,
              fontSize: "2.5rem",
              bgcolor: "rgba(255,255,255,0.2)",
              border: "3px solid rgba(255,255,255,0.5)",
            }}
          >
            {!teacher?.profileImage && getInitials()}
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
                label="Teacher"
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
              {teacher?.classTeacherLabel && (
                <Chip
                  label={`Class Teacher: ${teacher.classTeacherLabel}`}
                  size="small"
                  sx={{
                    bgcolor: "rgba(255,255,255,0.3)",
                    color: "white",
                    fontWeight: 700,
                    border: "1px solid rgba(255,255,255,0.5)",
                  }}
                />
              )}
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                ID: {teacher?.teacherId || teacherId}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {/* Professional Information Card */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: "100%", borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}
              >
                <WorkIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Professional Information
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
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
                    <BadgeIcon color="primary" fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Teacher ID
                    </Typography>
                    <Typography variant="body1" fontWeight={500}>
                      {teacher?.teacherId || teacherId}
                    </Typography>
                  </Box>
                </Box>

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
                    <SchoolIcon color="success" fontSize="small" />
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

                {department && (
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
                      <WorkIcon color="warning" fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Department
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {department}
                      </Typography>
                    </Box>
                  </Box>
                )}

                {teacher?.classTeacherLabel && (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "secondary.50",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PersonIcon color="secondary" fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Class Teacher
                      </Typography>
                      <Typography variant="body1" fontWeight={500}>
                        {teacher.classTeacherLabel}
                      </Typography>
                    </Box>
                  </Box>
                )}

                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1,
                    }}
                  >
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
                      <MenuBookIcon color="info" fontSize="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Subjects Assigned
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 7 }}>
                    {subjectNames.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {subjectNames.map((name: string, idx: number) => (
                          <Chip
                            key={idx}
                            label={name}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No subjects assigned
                      </Typography>
                    )}
                  </Box>
                </Box>
                <Box>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: "secondary.50",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <SchoolIcon color="secondary" fontSize="small" />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Classes Assigned
                    </Typography>
                  </Box>
                  <Box sx={{ pl: 7 }}>
                    {classNames.length > 0 ? (
                      <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                        {classNames.map((name: string, idx: number) => (
                          <Chip
                            key={idx}
                            label={name}
                            size="small"
                            variant="outlined"
                            color="secondary"
                          />
                        ))}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No classes assigned
                      </Typography>
                    )}
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
                <PersonIcon color="primary" />
                <Typography variant="h6" fontWeight={600}>
                  Contact Information
                </Typography>
              </Box>

              <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
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
                      <EmailIcon color="warning" fontSize="small" />
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
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => openRequestDialog("email_change", userEmail)}
                  >
                    Change
                  </Button>
                </Box>

                <Divider />

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
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
                        {userPhone || "Not provided"}
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<EditIcon />}
                    onClick={() => openRequestDialog("phone_change", userPhone)}
                  >
                    {userPhone ? "Change" : "Add"}
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions Card */}
        <Grid size={{ xs: 12 }}>
          <Card sx={{ borderRadius: 2 }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Need to update your information? Submit a request to the school
                administration.
              </Typography>
              <Button
                variant="contained"
                onClick={() => openRequestDialog("general")}
              >
                Submit General Query
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
