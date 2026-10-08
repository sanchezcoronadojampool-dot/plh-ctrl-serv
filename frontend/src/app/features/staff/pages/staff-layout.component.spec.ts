import { CommonModule } from "@angular/common";
import { TestBed } from "@angular/core/testing";
import { Router, RouterOutlet } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";
import { AuthService } from "../../../core/services/auth.service";
import { StaffLayoutComponent } from "./staff-layout.component";

describe("StaffLayoutComponent", () => {
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>("AuthService", ["clearSession"], {
      name: "Operador de prueba"
    });
    await TestBed.configureTestingModule({
      declarations: [StaffLayoutComponent],
      imports: [CommonModule, RouterOutlet, RouterTestingModule],
      providers: [{ provide: AuthService, useValue: auth }]
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it("provides an accessible logout action and clears the operator session", () => {
    const fixture = TestBed.createComponent(StaffLayoutComponent);
    fixture.detectChanges();
    spyOn(router, "navigate").and.returnValue(Promise.resolve(true));

    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('button[aria-label="Cerrar sesión"]')!
      .click();

    expect(auth.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(["/login"]);
  });
});
