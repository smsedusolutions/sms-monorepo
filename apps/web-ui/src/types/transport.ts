// apps/web-ui/src/types/transport.ts

export interface TransportStopStudent {
  studentId: string;
  firstName?: string;
  lastName?: string;
  class?: string;
  className?: string;
  section?: string;
  sectionName?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  profileImage?: string;
}

export interface TransportStop {
  stopId: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  pickupTime?: string;
  dropTime?: string;
  students?: TransportStopStudent[];
  coordinates?: [number, number]; // [lng, lat] — UI compat
}

export interface TransportDriver {
  name: string;
  phone: string;
  licenseNumber: string;
  gender?: "male" | "female" | "other";
  dateOfBirth?: string;
  profileImage?: string;
}

export interface TransportRoute {
  _id: string;
  schoolId: string;
  routeId: string;
  routeName: string;
  routeNumber?: string;
  color?: string;
  busNumber?: string;
  vehicleNumber?: string;
  vehicleId?: string;
  driverId?: string;
  driver?: TransportDriver;
  driverName?: string;
  driverPhone?: string;
  licenseNumber?: string;
  vehicle?: { plateNumber: string };
  stops: TransportStop[];
  routeCoordinates?: number[][];
  currentLocation?: {
    latitude?: number;
    longitude?: number;
    lastUpdated?: string;
    speed?: number;
    heading?: number;
  };
  status?: 'active' | 'inactive';
  totalStudents?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TransportSummary {
  totalRoutes: number;
  activeRoutes: number;
  inactiveRoutes: number;
  totalStops: number;
  totalStudents: number;
  totalDrivers: number;
}

export type TransportNotificationType =
  | 'bus_departed'
  | 'child_picked'
  | 'child_dropped'
  | 'bus_reached_school'
  | 'bus_delayed'
  | 'transport_update';

export interface TransportNotification {
  _id: string;
  notificationId: string;
  schoolId: string;
  userId: string;
  userRole: string;
  type: TransportNotificationType;
  title: string;
  message: string;
  referenceId?: string;
  referenceType: 'transport';
  isRead: boolean;
  readAt?: string;
  metadata?: {
    routeId?: string;
    routeName?: string;
    busNumber?: string;
    stopName?: string;
    studentId?: string;
    studentName?: string;
  };
  createdAt: string;
}

export interface SendNotificationPayload {
  routeId: string;
  type: TransportNotificationType;
  stopId?: string;
  customMessage?: string;
  sendEmail?: boolean;
}

export interface BusStatusPayload {
  routeId: string;
  status: 'departed' | 'arrived' | 'delayed';
  customMessage?: string;
}

export interface CreateTransportRoutePayload {
  routeId: string;
  routeName: string;
  routeNumber?: string;
  busNumber?: string;
  vehicleNumber?: string;
  vehicleId?: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  licenseNumber?: string;
  driver?: Partial<TransportDriver>;
  stops: Partial<TransportStop>[];
  status?: 'active' | 'inactive';
}

export interface StudentRouteResult {
  route: TransportRoute;
  stop: TransportStop;
}
