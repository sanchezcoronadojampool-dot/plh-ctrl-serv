import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface LoginResponse {
  token: string;
  username: string;
  role: "ADMIN" | "STAFF" | "OWNER";
  name: string;
}

export interface OwnerRegistration {
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno?: string;
  documentoIdentidad: string;
  telefono: string;
  correoElectronico?: string;
  username: string;
  password: string;
  inmueble: string;
}

@Injectable({ providedIn: "root" })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly tokenKey = "plh.accessToken";
  private readonly roleKey = "plh.userRole";
  private readonly nameKey = "plh.userName";

  constructor(private http: HttpClient) {}

  login(credentials: { username: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials);
  }

  registerOwner(registration: OwnerRegistration): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/register-owner`, registration);
  }

  requestPasswordReset(email: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/password-reset/request`, { email });
  }

  completePasswordReset(token: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/password-reset/complete`, { token, password });
  }

  /**
   * Cambia la contraseña de la cuenta que está en sesión.
   */
  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<void>(
      `${environment.apiUrl}/staff/me/password`,
      { currentPassword, newPassword }
    );
  }

  saveSession(response: LoginResponse) {
    sessionStorage.setItem(this.tokenKey, response.token);
    sessionStorage.setItem(this.roleKey, response.role);
    sessionStorage.setItem(this.nameKey, response.name);
  }

  get token(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  get role(): string | null {
    return sessionStorage.getItem(this.roleKey);
  }

  get name(): string | null {
    return sessionStorage.getItem(this.nameKey);
  }

  get isAuthenticated(): boolean {
    return this.token !== null;
  }

  clearSession() {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.roleKey);
    sessionStorage.removeItem(this.nameKey);
  }
}
