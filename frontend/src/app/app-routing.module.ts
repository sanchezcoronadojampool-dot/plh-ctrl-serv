import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { adminGuard, ownerGuard, staffGuard } from './core/services/auth.guard';

const routes: Routes = [
  { path: 'login', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  { path: 'staff', canActivate: [staffGuard], loadChildren: () => import('./features/staff/staff.module').then(m => m.StaffModule) },
  { path: 'owner', canActivate: [ownerGuard], loadComponent: () => import('./features/owner/owner-portal.component').then(m => m.OwnerPortalComponent) },
  { path: 'admin', canActivate: [adminGuard], loadChildren: () => import('./features/admin/admin.module').then(m => m.AdminModule) },
  { path: '', redirectTo: '/login', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
