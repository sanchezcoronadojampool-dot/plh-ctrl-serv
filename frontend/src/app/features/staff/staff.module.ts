import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { ScanPage } from "./pages/scan.page";
import { ReadingPage } from "./pages/reading.page";
import { StaffLayoutComponent } from "./pages/staff-layout.component";
import { QrScannerComponent } from "./components/qr-scanner.component";
import { PropertyMetersPage } from "./pages/property-meters.page";
import { ZXingScannerModule } from "@zxing/ngx-scanner";

const routes: Routes = [
  {
    path: "",
    component: StaffLayoutComponent,
    children: [
      { path: "", component: ScanPage },
      { path: "property/:idPropiedad", component: PropertyMetersPage },
      { path: "read/:idMedidor", component: ReadingPage }
    ]
  }
];

@NgModule({
  declarations: [ScanPage, PropertyMetersPage, ReadingPage, QrScannerComponent, StaffLayoutComponent],
  imports: [
    CommonModule, 
    FormsModule, 
    RouterModule.forChild(routes),
    ZXingScannerModule
  ],
})
export class StaffModule { }
