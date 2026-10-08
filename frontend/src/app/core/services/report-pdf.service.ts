import { Injectable } from "@angular/core";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfReport {
  title: string;
  subtitle: string;
  filename: string;
  headers: string[];
  rows: string[][];
}

@Injectable({ providedIn: "root" })
export class ReportPdfService {
  async export(report: PdfReport): Promise<void> {
    if (report.rows.length === 0) {
      throw new Error("No hay registros para exportar.");
    }

    const logo = await this.loadLogo();
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 14;

    pdf.setProperties({
      title: report.title,
      subject: "Condominio Playa La Honda",
      author: "Condominio Playa La Honda",
      creator: "Portal de administración"
    });

    pdf.setFillColor(0, 59, 115);
    pdf.rect(0, 0, pageWidth, 3, "F");
    const logoRatio = logo.width / logo.height;
    const logoScale = Math.min(48 / logo.width, 18 / logo.height);
    const logoWidth = logo.width * logoScale;
    const logoHeight = logo.height * logoScale;
    pdf.addImage(logo.dataUrl, "PNG", margin, 10 + (18 - logoHeight) / 2, logoWidth, logoHeight);

    const headingX = margin + logoWidth + 8;
    pdf.setTextColor(0, 59, 115);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);
    pdf.text("Condominio Playa La Honda", headingX, 17);
    pdf.setTextColor(75, 85, 99);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text("MAR / NATURALEZA / BIENESTAR", headingX, 23);

    pdf.setDrawColor(229, 231, 235);
    pdf.line(margin, 33, pageWidth - margin, 33);
    pdf.setTextColor(17, 24, 39);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(16);
    pdf.text(report.title, margin, 42);
    pdf.setTextColor(75, 85, 99);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(9);
    pdf.text(report.subtitle, margin, 48);

    const date = new Intl.DateTimeFormat("es-PE", {
      dateStyle: "long",
      timeStyle: "short"
    }).format(new Date());
    pdf.setFontSize(8);
    pdf.text(`Generado: ${date}`, pageWidth - margin, 48, { align: "right" });

    autoTable(pdf, {
      startY: 56,
      head: [report.headers],
      body: report.rows,
      margin: { left: margin, right: margin, bottom: 18 },
      styles: {
        font: "helvetica",
        fontSize: 9,
        cellPadding: 3.2,
        textColor: [31, 41, 55],
        lineColor: [229, 231, 235],
        lineWidth: 0.15,
        overflow: "linebreak"
      },
      headStyles: {
        fillColor: [0, 59, 115],
        textColor: [255, 255, 255],
        fontStyle: "bold"
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      didDrawPage: () => {
        const pageHeight = pdf.internal.pageSize.getHeight();
        pdf.setDrawColor(229, 231, 235);
        pdf.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);
        pdf.setTextColor(107, 114, 128);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.text("Condominio Playa La Honda · Documento de uso administrativo", margin, pageHeight - 8);
      }
    });

    const pageCount = pdf.getNumberOfPages();
    for (let page = 1; page <= pageCount; page++) {
      pdf.setPage(page);
      const pageHeight = pdf.internal.pageSize.getHeight();
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.text(`Página ${page} de ${pageCount}`, pageWidth - margin, pageHeight - 8, { align: "right" });
    }

    pdf.save(this.normalizeFilename(report.filename));
  }

  private async loadLogo(): Promise<{ dataUrl: string; width: number; height: number }> {
    const response = await fetch(new URL("assets/logo-plh.png", document.baseURI));
    if (!response.ok) {
      throw new Error("No se pudo cargar el logo institucional para el PDF.");
    }

    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("No se pudo preparar el logo para el PDF."));
      reader.onerror = () => reject(new Error("No se pudo leer el logo institucional."));
      reader.readAsDataURL(blob);
    });
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error("El logo institucional no es una imagen válida."));
      image.src = dataUrl;
    });
    if (dimensions.width === 0 || dimensions.height === 0) {
      throw new Error("El logo institucional no tiene dimensiones válidas.");
    }

    return { dataUrl, ...dimensions };
  }

  private normalizeFilename(filename: string): string {
    const safeFilename = filename.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "-").trim();
    return safeFilename.toLowerCase().endsWith(".pdf") ? safeFilename : `${safeFilename}.pdf`;
  }
}
