import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "./auth.service";

export const staffGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated) {
    return router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } });
  }
  return auth.role === "OWNER" ? router.createUrlTree(["/owner"]) : true;
};

export const ownerGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated) {
    return router.createUrlTree(["/login"], { queryParams: { returnUrl: state.url } });
  }
  return auth.role === "OWNER" ? true
    : router.createUrlTree([auth.role === "ADMIN" ? "/admin" : "/staff"]);
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (!auth.isAuthenticated) return router.createUrlTree(["/login"]);
  return auth.role === "ADMIN" ? true
    : router.createUrlTree([auth.role === "OWNER" ? "/owner" : "/staff"]);
};
