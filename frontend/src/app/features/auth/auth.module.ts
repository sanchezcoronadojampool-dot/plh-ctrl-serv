import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { RouterModule, Routes } from "@angular/router";
import { LoginComponent } from "./login.component";
import { OwnerRegistrationComponent } from "./owner-registration.component";
import { RecoveryHelpComponent } from "./recovery-help.component";

const routes: Routes = [
  { path: "", component: LoginComponent },
  { path: "registro-propietario", component: OwnerRegistrationComponent },
  { path: "recuperar", component: RecoveryHelpComponent },
  { path: "restablecer", component: RecoveryHelpComponent }
];

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule.forChild(routes),
    LoginComponent,
    OwnerRegistrationComponent,
    RecoveryHelpComponent
  ]
})
export class AuthModule { }
