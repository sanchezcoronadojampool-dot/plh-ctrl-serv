import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { of } from "rxjs";
import { AuthService } from "../../core/services/auth.service";
import { OwnerApiService, OwnerPortalData } from "../../core/services/owner-api.service";
import { OwnerPortalComponent } from "./owner-portal.component";

describe("OwnerPortalComponent", () => {
  const data: OwnerPortalData = {
    propiedades: [{
      id: "property-1",
      codigo: "CASA-001",
      casa: "1",
      manzana: "A",
      sector: null,
      medidores: [
        { id: "meter-water", servicio: "agua", numeroSerie: "WATER-100", casa: "1" },
        { id: "meter-power", servicio: "luz", numeroSerie: "POWER-200", casa: "1" }
      ]
    }],
    lecturas: [],
    facturas: []
  };

  let auth: jasmine.SpyObj<AuthService>;
  let ownerApi: jasmine.SpyObj<OwnerApiService>;

  beforeEach(async () => {
    auth = jasmine.createSpyObj<AuthService>("AuthService", ["clearSession"], { name: "Carlos Acasiete" });
    ownerApi = jasmine.createSpyObj<OwnerApiService>("OwnerApiService", ["getOverview"]);
    ownerApi.getOverview.and.returnValue(of(data));
    await TestBed.configureTestingModule({
      imports: [OwnerPortalComponent, RouterTestingModule],
      providers: [
        { provide: AuthService, useValue: auth },
        { provide: OwnerApiService, useValue: ownerApi }
      ]
    }).compileComponents();
  });

  it("shows responsive section navigation and service-specific meter identifiers", () => {
    const fixture = TestBed.createComponent(OwnerPortalComponent);
    fixture.detectChanges();

    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('a[href="#properties"]')).not.toBeNull();
    expect(element.querySelector('a[href="#readings"]')).not.toBeNull();
    expect(element.querySelector('a[href="#invoices"]')).not.toBeNull();
    expect(element.querySelectorAll(".service-badge").length).toBe(2);
    expect(element.textContent).toContain("WATER-100");
    expect(element.textContent).toContain("POWER-200");
    expect(element.querySelector(".owner-heading")?.textContent).toContain("Hola, Carlos.");
  });

  it("renders a useful empty state when the owner has no readings", () => {
    const fixture = TestBed.createComponent(OwnerPortalComponent);
    fixture.detectChanges();

    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      "Si esperabas ver datos, contacta al administrador."
    );
  });

  it("clears the session when logout is selected", () => {
    const fixture = TestBed.createComponent(OwnerPortalComponent);
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(".logout-button")!.click();

    expect(auth.clearSession).toHaveBeenCalled();
  });
});
