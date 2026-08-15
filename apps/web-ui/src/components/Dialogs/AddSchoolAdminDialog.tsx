import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Alert,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { useNotification } from '../../hooks/useNotification';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useCreateSchoolAdmin, useUpdateSchoolAdmin } from '../../queries/SchoolAdmin';
import { useGetSchools } from '../../queries/School';
import type { CreateSchoolAdminPayload, SchoolAdmin } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppButton } from '../shared/AppButton';
import { PhoneInput } from '../shared/PhoneInput';

interface SchoolAdminDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  editData?: SchoolAdmin | null;
}

const SchoolAdminDialog: React.FC<SchoolAdminDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editData,
}) => {
  const isEditMode = !!editData;
  const notification = useNotification();

  const [formData, setFormData] = useState<
    CreateSchoolAdminPayload & { profileImage?: string }
  >({
    username: "",
    email: "",
    password: "",
    schoolId: "",
    contactNumber: "",
    profileImage: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateSchoolAdmin();
  const updateMutation = useUpdateSchoolAdmin();
  const { data: schoolsData, isLoading: schoolsLoading } = useGetSchools();

  const schools = schoolsData?.data || [];

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        username: editData.username || "",
        email: editData.email || "",
        password: "",
        schoolId: editData.schoolId || "",
        contactNumber: editData.contactNumber || "",
        profileImage: editData.profileImage || "",
      });
    } else {
      setFormData({
        username: "",
        email: "",
        password: "",
        schoolId: "",
        contactNumber: "",
        profileImage: "",
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!isEditMode && !formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (!formData.schoolId) {
      newErrors.schoolId = "Please select a school";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditMode && editData) {
        const updatePayload: Record<string, string | undefined> = {
          username: formData.username,
          email: formData.email,
          contactNumber: formData.contactNumber,
          profileImage: formData.profileImage,
        };
        if (formData.password) {
          updatePayload.password = formData.password;
        }
        const res = await updateMutation.mutateAsync({
          userId: editData.userId,
          data: updatePayload,
        });
        notification.success("Administrator profile updated successfully");
        onSuccess?.(res.message);
      } else {
        const res = await createMutation.mutateAsync(formData);
        notification.success("New school administrator account registered");
        onSuccess?.(res.message);
      }
      handleClose();
    } catch {
      notification.error("Operation failed. Please verify administrator credentials.");
    }
  };

  const handleClose = () => {
    setFormData({
      username: "",
      email: "",
      password: "",
      schoolId: "",
      contactNumber: "",
      profileImage: "",
    });
    setErrors({});
    createMutation.reset();
    updateMutation.reset();
    onClose();
  };

    const isMobile = useIsMobile();
    const isPending = createMutation.isPending || updateMutation.isPending;
    const isError = createMutation.isError || updateMutation.isError;
    const errorMessage =
      (createMutation.error as { message?: string })?.message ||
      (updateMutation.error as { message?: string })?.message ||
      "Operation failed";

    return (
      <Dialog 
        open={open} 
        onClose={handleClose} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 3,
            maxHeight: isMobile ? '100dvh' : '90vh',
          }
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: '1px solid',
            borderColor: 'divider',
            py: { xs: 1.5, sm: 2 },
            px: { xs: 2, sm: 3 },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {isEditMode ? "Modify Administrator Profile" : "Register School Administrator"}
          </Typography>
          <IconButton onClick={handleClose} size="small" edge="end">
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <DialogContent sx={{ p: { xs: 2, sm: 3 }, overflowY: 'auto' }}>
            {isError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                Account Information
              </Typography>

              <AppSelect
                label="Select School"
                value={formData.schoolId}
                onChange={(e) => handleSelectChange("schoolId", e.target.value as string)}
                disabled={schoolsLoading || isEditMode}
                options={schools.map(school => ({
                  value: school.schoolId,
                  label: `${school.schoolName} (${school.schoolId})`
                }))}
                error={!!errors.schoolId}
                helperText={errors.schoolId}
                required
              />

              <AppInput
                name="username"
                label="Username"
                value={formData.username}
                onChange={handleChange}
                error={!!errors.username}
                helperText={errors.username}
                required
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <AppInput
                  name="email"
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                />

                <PhoneInput
                  name="contactNumber"
                  label="Contact Number"
                  value={formData.contactNumber}
                  onChange={handleChange}
                />
              </Box>

              {!isEditMode && (
                <AppInput
                  name="password"
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                />
              )}

              <Divider sx={{ my: 0.5 }} />

              <Typography variant="overline" color="primary" sx={{ fontWeight: 800, letterSpacing: 1.2, fontSize: '0.75rem' }}>
                Profile Branding
              </Typography>

              <ImageUpload
                folder={IMAGEKIT_FOLDERS.PROFILE_IMAGES}
                fileName={
                  isEditMode && editData
                    ? `${editData.userId}_profile`
                    : `new_admin_profile_${Date.now()}`
                }
                currentImage={formData.profileImage}
                label="Profile Image"
                authEndpoint="admin"
                variant="avatar"
                size="medium"
                onUploadSuccess={(result) => {
                  setFormData((prev) => ({ ...prev, profileImage: result.url }));
                }}
                onRemove={() => {
                  setFormData((prev) => ({ ...prev, profileImage: "" }));
                }}
              />
            </Box>
          </DialogContent>

          <DialogActions sx={{ 
            px: { xs: 2, sm: 3 }, 
            py: 2, 
            borderTop: '1px solid', 
            borderColor: 'divider',
            bgcolor: 'background.paper',
            gap: 1.5,
            flexDirection: { xs: 'column-reverse', sm: 'row' },
            '& > button': {
              width: { xs: '100%', sm: 'auto' },
              height: 44,
            }
          }}>
            <AppButton onClick={handleClose} variant="text" color="inherit">
              Cancel
            </AppButton>
            <AppButton
              type="submit"
              variant="contained"
              loading={isPending}
            >
              {isEditMode ? "Update Profile" : "Create Account"}
            </AppButton>
          </DialogActions>
        </form>
      </Dialog>
    );
};

export default SchoolAdminDialog;
