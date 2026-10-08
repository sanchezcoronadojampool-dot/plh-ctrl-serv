import { HttpErrorResponse } from "@angular/common/http";

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) return fallback;
  if (typeof error.error === "string" && error.error.trim()) return error.error;
  if (typeof error.error?.message === "string" && error.error.message.trim()) return error.error.message;
  if (typeof error.error?.detail === "string" && error.error.detail.trim()) return error.error.detail;
  if (error.status === 401) return "La sesión venció. Inicia sesión nuevamente.";
  if (error.status === 403) return "Tu cuenta no tiene permisos para realizar esta operación.";
  if (error.status === 404) return "El recurso solicitado no existe.";
  return fallback;
}
