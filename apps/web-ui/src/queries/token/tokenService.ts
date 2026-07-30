import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  // Common fields
  email?: string;
  role: string;
  exp?: number;

  // Super Admin specific
  adminId?: string;
  username?: string;

  // School user specific
  userId?: string;
  schoolId?: string;
  schoolDbName?: string;
  schoolName?: string;

  // Teacher specific
  teacherId?: string;
  classes?: string[];
  subjects?: string[];
  subjectNames?: string[];
  department?: string;

  // Student specific
  studentId?: string;
  class?: string;
  section?: string;
  className?: string;
  sectionName?: string;
  rollNumber?: string;

  // Parent specific
  parentId?: string;

  // Name fields
  firstName?: string;
  lastName?: string;
}

class TokenService {
  static setToken(token: string): void {
    localStorage.setItem("token", token);
  }

  static getToken(): string | null {
    return localStorage.getItem("token");
  }

  static getUser(): DecodedToken | null {
    return this.decodeToken();
  }

  static decodeToken(): DecodedToken | null {
    const token = this.getToken();
    if (!token) return null;

    try {
      return jwtDecode<DecodedToken>(token);
    } catch (error) {
      console.error("Invalid token", error);
      return null;
    }
  }

  static getRole(): string | null {
    return this.decodeToken()?.role ?? null;
  }

  static getAdminId(): string | null {
    return this.decodeToken()?.adminId ?? null;
  }

  static getUserId(): string | null {
    const decoded = this.decodeToken();
    return decoded?.userId ?? decoded?.adminId ?? null;
  }

  static getUserName(): string | null {
    const decoded = this.decodeToken();
    return decoded?.username ?? decoded?.email ?? null;
  }

  static getEmail(): string | null {
    return this.decodeToken()?.email ?? null;
  }

  static getSchoolId(): string | null {
    return this.decodeToken()?.schoolId ?? null;
  }

  static getSchoolDbName(): string | null {
    return this.decodeToken()?.schoolDbName ?? null;
  }

  static getTeacherId(): string | null {
    return this.decodeToken()?.teacherId ?? null;
  }

  static getStudentId(): string | null {
    return this.decodeToken()?.studentId ?? null;
  }

  static isTokenExpired(): boolean {
    const decoded = this.decodeToken();
    if (!decoded?.exp) return true;

    return decoded.exp * 1000 < Date.now();
  }

  static removeToken(): void {
    localStorage.removeItem("token");
  }
}

export default TokenService;
