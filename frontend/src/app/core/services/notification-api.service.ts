import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from "../../../environments/environment";

export interface AdminNotification {
  id: string;
  type: "OWNER_REGISTRATION" | "READING_REGISTERED" | "INVOICES_GENERATED" | string;
  title: string;
  message: string;
  targetPath: string;
  createdAt: string;
  read: boolean;
}

export interface NotificationFeed {
  notifications: AdminNotification[];
  unreadCount: number;
}

@Injectable({ providedIn: "root" })
export class NotificationApiService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  listRecent(): Observable<NotificationFeed> {
    return this.http.get<NotificationFeed>(this.apiUrl);
  }

  markRead(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/read`, {});
  }

  markAllRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }
}
