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
import { useCreateSchool, useUpdateSchool } from '../../queries/School';
import type { CreateSchoolPayload, School } from '../../types';
import { ImageUpload } from '../ImageUpload';
import { IMAGEKIT_FOLDERS } from '../../utils/imagekit';
import { AppInput } from '../shared/AppInput';
import { AppSelect } from '../shared/AppSelect';
import { AppButton } from '../shared/AppButton';
import { PhoneInput } from '../shared/PhoneInput';

interface SchoolDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (message: string) => void;
  editData?: School | null;
}

const SchoolDialog: React.FC<SchoolDialogProps> = ({
  open,
  onClose,
  onSuccess,
  editData,
}) => {
  const isEditMode = !!editData;

  const [formData, setFormData] = useState<CreateSchoolPayload>({
    schoolName: "",
    dbName: "",
    schoolLogo: "",
    schoolAddress: "",
    schoolEmail: "",
    schoolContact: "",
    schoolWebsite: "",
    schoolTagline: "",
    subdomain: "",
    loginTheme: {
      primaryColor: "",
      backgroundColor: "",
      textColor: "",
      accentColor: "",
      fontFamily: "",
      customLoginHtml: "",
    },
    attendanceSettings: {
      mode: 'simple',
      workingHours: { start: '08:00', end: '16:00' },
      lateThresholdMinutes: 15,
      halfDayThresholdMinutes: 240,
      periodsPerDay: 8,
    },
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useCreateSchool();
  const updateMutation = useUpdateSchool();

  /**
   * PhoneInput stores only the 10-digit number (no country code).
   * Stored values in the DB may be in formats like:
   *   "+919876543210", "09876543210", "9876543210"
   * This helper strips down to the last 10 digits.
   */
  const stripPhonePrefix = (phone?: string): string => {
    if (!phone) return '';
    const digitsOnly = phone.replace(/\D/g, '');
    // Return last 10 digits
    return digitsOnly.slice(-10);
  };

  // Populate form when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        schoolName: editData.schoolName || '',
        dbName: editData.schoolDbName || '',
        schoolLogo: editData.schoolLogo || '',
        schoolAddress: editData.schoolAddress || '',
        schoolEmail: editData.schoolEmail || '',
        schoolContact: stripPhonePrefix(editData.schoolContact),
        schoolWebsite: editData.schoolWebsite || '',
        schoolTagline: editData.schoolTagline || '',
        subdomain: editData.subdomain || '',
        loginTheme: {
          primaryColor: editData.loginTheme?.primaryColor || '',
          backgroundColor: editData.loginTheme?.backgroundColor || '',
          textColor: editData.loginTheme?.textColor || '',
          accentColor: editData.loginTheme?.accentColor || '',
          fontFamily: editData.loginTheme?.fontFamily || '',
          customLoginHtml: editData.loginTheme?.customLoginHtml || '',
        },
        attendanceSettings: editData.attendanceSettings || {
          mode: 'simple',
          workingHours: { start: '08:00', end: '16:00' },
          lateThresholdMinutes: 15,
          halfDayThresholdMinutes: 240,
          periodsPerDay: 8,
        },
      });
    } else {
      setFormData({
        schoolName: '',
        dbName: '',
        schoolLogo: '',
        schoolAddress: '',
        schoolEmail: '',
        schoolContact: '',
        schoolWebsite: '',
        schoolTagline: '',
        subdomain: '',
        loginTheme: {
          primaryColor: '',
          backgroundColor: '',
          textColor: '',
          accentColor: '',
          fontFamily: '',
          customLoginHtml: '',
        },
        attendanceSettings: {
          mode: 'simple',
          workingHours: { start: '08:00', end: '16:00' },
          lateThresholdMinutes: 15,
          halfDayThresholdMinutes: 240,
          periodsPerDay: 8,
        },
      });
    }
  }, [editData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.schoolName.trim()) {
      newErrors.schoolName = 'School name is required';
    }
    if (!isEditMode && !formData.dbName.trim()) {
      newErrors.dbName = 'Database name is required';
    } else if (!isEditMode && !/^[a-z0-9-]+$/.test(formData.dbName)) {
      newErrors.dbName = 'Only lowercase letters, numbers, and hyphens allowed';
    }
    if (
      formData.schoolEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.schoolEmail)
    ) {
      newErrors.schoolEmail = "Invalid email format";
    }
    if (
      formData.subdomain &&
      !/^[a-z0-9-]+$/.test(formData.subdomain)
    ) {
      newErrors.subdomain = 'Subdomain: only lowercase letters, numbers, and hyphens (e.g., greenvalley)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    try {
      if (isEditMode && editData) {
        const res = await updateMutation.mutateAsync({
          schoolId: editData.schoolId,
          data: {
            schoolName: formData.schoolName,
            schoolLogo: formData.schoolLogo,
            schoolAddress: formData.schoolAddress,
            schoolEmail: formData.schoolEmail,
            // Re-add +91 prefix if the field has a 10-digit value
            schoolContact: formData.schoolContact
              ? formData.schoolContact.startsWith('+')
                ? formData.schoolContact
                : `+91${formData.schoolContact}`
              : '',
            schoolWebsite: formData.schoolWebsite,
            schoolTagline: formData.schoolTagline,
            subdomain: formData.subdomain || undefined,
            loginTheme: formData.loginTheme,
            attendanceSettings: formData.attendanceSettings,
          },
        });
        onSuccess?.(res.message);
      } else {
        const res = await createMutation.mutateAsync(formData);
        onSuccess?.(res.message);
      }
      handleClose();
    } catch {
      // Error is handled by mutation
    }
  };

  const handleClose = () => {
    setFormData({
      schoolName: '',
      dbName: '',
      schoolLogo: '',
      schoolAddress: '',
      schoolEmail: '',
      schoolContact: '',
      schoolWebsite: '',
      schoolTagline: '',
      subdomain: '',
      loginTheme: {
        primaryColor: '',
        backgroundColor: '',
        textColor: '',
        accentColor: '',
        fontFamily: '',
        customLoginHtml: '',
      },
      attendanceSettings: {
        mode: 'simple',
        workingHours: { start: '08:00', end: '16:00' },
        lateThresholdMinutes: 15,
        halfDayThresholdMinutes: 240,
        periodsPerDay: 8,
      },
    });
    setErrors({});
    createMutation.reset();
    updateMutation.reset();
    onClose();
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isError = createMutation.isError || updateMutation.isError;
  const errorMessage =
    (createMutation.error as { message?: string })?.message ||
    (updateMutation.error as { message?: string })?.message ||
    "Operation failed";

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{isEditMode ? "Modify Institutional Profile" : "Establish New School Account"}</Typography>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent>
          {isError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              General Information
            </Typography>

            <AppInput
              name="schoolName"
              label="School Name"
              value={formData.schoolName}
              onChange={handleChange}
              error={!!errors.schoolName}
              helperText={errors.schoolName}
              required
            />

            <AppInput
              name="dbName"
              label="Database Name"
              labelHint="Internal system identifier"
              value={formData.dbName}
              onChange={handleChange}
              error={!!errors.dbName}
              helperText={errors.dbName || 'Lowercase letters, numbers, and hyphens only (e.g., lincoln-high)'}
              required={!isEditMode}
              disabled={isEditMode}
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Visual Branding
            </Typography>

            <ImageUpload
              folder={IMAGEKIT_FOLDERS.SCHOOL_LOGOS}
              fileName={isEditMode && editData ? `${editData.schoolId}_logo` : `new_school_logo_${Date.now()}`}
              currentImage={formData.schoolLogo}
              label="School Logo"
              authEndpoint="admin"
              size="medium"
              onUploadSuccess={(result) => {
                setFormData(prev => ({ ...prev, schoolLogo: result.url }));
              }}
              onRemove={() => {
                setFormData(prev => ({ ...prev, schoolLogo: '' }));
              }}
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Contact Details
            </Typography>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <AppInput
                name="schoolEmail"
                label="School Email"
                type="email"
                value={formData.schoolEmail}
                onChange={handleChange}
                error={!!errors.schoolEmail}
                helperText={errors.schoolEmail}
              />

              <PhoneInput
                name="schoolContact"
                label="Contact Number"
                value={formData.schoolContact}
                onChange={handleChange}
              />
            </Box>

            <AppInput
              name="schoolAddress"
              label="Address"
              value={formData.schoolAddress}
              onChange={handleChange}
              multiline
              rows={2}
            />

            <AppInput
              name="schoolWebsite"
              label="Website"
              value={formData.schoolWebsite}
              onChange={handleChange}
            />

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Subdomain &amp; Login Branding
            </Typography>

            <AppInput
              name="subdomain"
              label="Subdomain Slug"
              labelHint="Used for school-specific login page"
              value={(formData as any).subdomain || ''}
              onChange={handleChange}
              error={!!errors.subdomain}
              helperText={errors.subdomain || 'e.g. "greenvalley" → greenvalley.spexzee.me'}
              placeholder="greenvalley"
            />

            <AppInput
              name="schoolTagline"
              label="School Tagline"
              labelHint="Shown on the login page left panel"
              value={(formData as any).schoolTagline || ''}
              onChange={handleChange}
              placeholder="Excellence in Education since 1992"
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', mb: 0.5, display: 'block' }}>
                  Primary Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={(formData as any).loginTheme?.primaryColor || '#6366F1'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      loginTheme: { ...(prev as any).loginTheme, primaryColor: e.target.value },
                    }))}
                    style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <AppInput
                    size="small"
                    value={(formData as any).loginTheme?.primaryColor || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      loginTheme: { ...(prev as any).loginTheme, primaryColor: e.target.value },
                    }))}
                    placeholder="#6366F1"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', mb: 0.5, display: 'block' }}>
                  Background Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={(formData as any).loginTheme?.backgroundColor || '#EEF2FF'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      loginTheme: { ...(prev as any).loginTheme, backgroundColor: e.target.value },
                    }))}
                    style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <AppInput
                    size="small"
                    value={(formData as any).loginTheme?.backgroundColor || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      loginTheme: { ...(prev as any).loginTheme, backgroundColor: e.target.value },
                    }))}
                    placeholder="#EEF2FF"
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="caption" sx={{ color: '#64748B', mb: 0.5, display: 'block' }}>
                  Accent Color
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input
                    type="color"
                    value={(formData as any).loginTheme?.accentColor || '#6366F1'}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      loginTheme: { ...(prev as any).loginTheme, accentColor: e.target.value },
                    }))}
                    style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 4 }}
                  />
                  <AppInput
                    size="small"
                    value={(formData as any).loginTheme?.accentColor || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      loginTheme: { ...(prev as any).loginTheme, accentColor: e.target.value },
                    }))}
                    placeholder="#818CF8"
                  />
                </Box>
              </Box>

              <AppInput
                name="fontFamily"
                label="Font Family"
                value={(formData as any).loginTheme?.fontFamily || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  loginTheme: { ...(prev as any).loginTheme, fontFamily: e.target.value },
                }))}
                placeholder="Inter"
                size="small"
              />
            </Box>

            {/* <AppInput
              label="Custom Login HTML (optional)"
              labelHint="When set, replaces the ENTIRE login page with this HTML"
              value={(formData as any).loginTheme?.customLoginHtml || ''}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                loginTheme: { ...(prev as any).loginTheme, customLoginHtml: e.target.value },
              }))}
              multiline
              rows={5}
              placeholder={`<!DOCTYPE html><html>...</html>\n\nUse window.parent.postMessage({ type: 'SMS_LOGIN', email, password }) to submit login.`}
            /> */}

            <Divider sx={{ my: 1 }} />

            <Typography variant="overline" color="primary" sx={{ fontWeight: 700, letterSpacing: 1.2 }}>
              Attendance Settings
            </Typography>

            <AppSelect
              label="Attendance Mode"
              value={formData.attendanceSettings?.mode || 'simple'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                attendanceSettings: {
                  ...prev.attendanceSettings,
                  mode: e.target.value as 'simple' | 'period_wise' | 'check_in_out',
                }
              }))}
              options={[
                { value: 'simple', label: 'Simple Daily Attendance' },
                { value: 'period_wise', label: 'Period-wise Attendance' },
                { value: 'check_in_out', label: 'Check-In / Check-Out' }
              ]}
            />

            {formData.attendanceSettings?.mode === 'period_wise' && (
              <AppInput
                type="number"
                label="Periods Per Day"
                value={formData.attendanceSettings?.periodsPerDay || 8}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  attendanceSettings: {
                    ...prev.attendanceSettings,
                    mode: prev.attendanceSettings?.mode || 'simple',
                    periodsPerDay: parseInt(e.target.value) || 8,
                  },
                }))
                }
                slotProps={{ htmlInput: { min: 1, max: 12 } }}
              />
            )}

            {formData.attendanceSettings?.mode === 'check_in_out' && (
              <Box sx={{ display: 'flex', gap: 2 }}>
                <AppInput
                  type="time"
                  label="Working Hours Start"
                  value={formData.attendanceSettings?.workingHours?.start || '08:00'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    attendanceSettings: {
                      ...prev.attendanceSettings,
                      mode: prev.attendanceSettings?.mode || 'simple',
                      workingHours: {
                        start: e.target.value,
                        end:
                          prev.attendanceSettings?.workingHours?.end ||
                          "16:00",
                      },
                    },
                  }))
                  }
                />
                <AppInput
                  type="time"
                  label="Working Hours End"
                  value={
                    formData.attendanceSettings?.workingHours?.end || "16:00"
                  }
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      attendanceSettings: {
                        ...prev.attendanceSettings,
                        mode: prev.attendanceSettings?.mode || "simple",
                        workingHours: {
                          start:
                            prev.attendanceSettings?.workingHours?.start ||
                            "08:00",
                          end: e.target.value,
                        },
                      },
                    }))
                  }
                />
              </Box>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <AppButton onClick={handleClose} variant="text" color="inherit">
            Cancel
          </AppButton>
          <AppButton
            type="submit"
            variant="contained"
            loading={isPending}
          >
            {isEditMode ? "Save Changes" : "Establish Institution"}
          </AppButton>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default SchoolDialog;
