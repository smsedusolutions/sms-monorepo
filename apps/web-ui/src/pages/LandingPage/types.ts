export interface ServiceFeature {
  id: string;
  title: string;
  tagline: string;
  iconName: string;
  category: 'core' | 'academic' | 'operations' | 'engagement';
  description: string;
  highlights: string[];
  gradient: string;
  accentColor: string;
}

export interface TrustBadgeItem {
  id: string;
  title: string;
  subtitle: string;
  iconName: string;
  color: string;
}

export interface MetricItem {
  value: string;
  label: string;
  sublabel: string;
  prefix?: string;
  suffix?: string;
}

export interface DemoFormData {
  schoolName: string;
  contactPerson: string;
  phoneNumber: string;
  email: string;
  studentStrength: string;
  message?: string;
}
