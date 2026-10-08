import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { DashboardPage } from './pages/dashboard.page';
import { PropertyManagementPage } from './pages/property_management.page';
import { BillingPage } from './pages/billing.page';
import { StaffPage } from './pages/staff.page';
import { AdminLayoutComponent } from './pages/admin-layout.component';
import { MetersTariffsPage } from './pages/meters-tariffs.page';
import { ReadingHistoryPage } from './pages/reading-history.page';
import { PropertyQrPage } from './pages/property-qr.page';

const routes: Routes = [
  { 
    path: '', 
    component: AdminLayoutComponent, 
    children: [
      { path: '', component: DashboardPage },
      { path: 'properties', component: PropertyManagementPage },
      { path: 'billing', component: BillingPage },
      { path: 'staff', component: StaffPage },
      { path: 'services', component: MetersTariffsPage },
      { path: 'readings', component: ReadingHistoryPage },
      { path: 'property-qrs', component: PropertyQrPage },
    ]
  }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule, 
    RouterModule.forChild(routes),
    AdminLayoutComponent,
    DashboardPage, 
    PropertyManagementPage,
    BillingPage,
    StaffPage,
    MetersTariffsPage,
    ReadingHistoryPage,
    PropertyQrPage
  ],
})
export class AdminModule { }
