import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";
import { AdminApiService, Factura } from "../../../core/services/admin-api.service";
import { BillingPage } from "./billing.page";

describe("BillingPage", () => {
  const invoice: Factura = {
    id: "invoice-1",
    numeroFactura: "FAC-2026-00000001",
    casa: "101",
    total: 50,
    fecha: "2026-10-07",
    estado: "Pendiente"
  };
  let adminApi: jasmine.SpyObj<AdminApiService>;

  beforeEach(async () => {
    adminApi = jasmine.createSpyObj<AdminApiService>("AdminApiService", [
      "getFacturas",
      "updateFacturaEstado"
    ]);
    adminApi.getFacturas.and.returnValue(of([invoice]));
    adminApi.updateFacturaEstado.and.returnValue(of({ ...invoice, estado: "Pagado" }));

    await TestBed.configureTestingModule({
      imports: [BillingPage],
      providers: [{ provide: AdminApiService, useValue: adminApi }]
    }).compileComponents();
  });

  it("refreshes the filtered table after changing an invoice status", () => {
    const fixture = TestBed.createComponent(BillingPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.filterStatus({ target: { value: "Pendiente" } } as unknown as Event);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("FAC-2026-00000001");

    component.toggleInvoiceStatus(invoice);
    fixture.detectChanges();

    expect(component.invoices[0].estado).toBe("Pagado");
    expect(component.filteredInvoices).toEqual([]);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("La factura FAC-2026-00000001 ahora figura como pagado.");
    expect((fixture.nativeElement as HTMLElement).textContent).toContain("Sin resultados");
  });
});
