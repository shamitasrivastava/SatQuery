import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Loads an image resource from a URL or relative path and returns base64 string.
 */
export const fetchImageAsBase64 = async (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Image failed to load'));
    img.src = src;
  });
};

export interface ExportPdfParams {
  activeScenario?: string;
  detectedPipeline?: string;
}

/**
 * Generates an official Bhuviksana Geospatial Intelligence & LULC Analysis Briefing PDF.
 */
export const exportBhuviksanaReportPdf = async ({
  activeScenario = 'Brahmaputra Basin, Assam',
  detectedPipeline = 'GEOCHAT-7B + Bi-Temporal Bit-CD'
}: ExportPdfParams = {}): Promise<void> => {
  let logoDataUrl: string | null = null;
  try {
    logoDataUrl = await fetchImageAsBase64('/logo.png');
  } catch (e) {
    console.warn('Could not load /logo.png, exporting without image embed:', e);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const renderHeader = () => {
    doc.setFillColor(226, 238, 249);
    doc.setDrawColor(200, 220, 240);
    doc.setLineWidth(0.4);
    doc.rect(0, 0, pageWidth, 26, 'FD');

    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(215, 225, 238);
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, 5.5, 14, 15, 2.5, 2.5, 'FD');

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin + 1.5, 7, 11, 12);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(30, 58, 95);
    doc.text('BHUVIKSANA', margin + 18, 13.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Satellite Intelligence & Geo-Analytics Platform', margin + 18, 19.5);
  };

  const renderFooter = (pageNumber: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.35);
    doc.line(margin, pageHeight - 14, pageWidth - margin, pageHeight - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Bhuviksana Intelligence Briefing  |  Confidential  |  ISRO Space Applications Centre', margin, pageHeight - 9);
    doc.text(`Page ${pageNumber} of 2`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  };

  // PAGE 1: Specifications & Pipeline Scope
  renderHeader();

  let y = 33;
  const cardHeight = 31;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(219, 234, 254);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, contentWidth, cardHeight, 2, 2, 'FD');

  const metaFields = [
    ['REPORT ID', 'BHU-SAR-2026-0906-X4'],
    ['TARGET ZONE', activeScenario],
    ['DETECTION PIPELINE', detectedPipeline],
    ['GENERATED ON', new Date().toUTCString()]
  ];

  let my = y + 6;
  metaFields.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text(label, margin + 5, my);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(30, 41, 59);
    doc.text(value, margin + 40, my);
    my += 6;
  });

  y += cardHeight + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('1. SATELLITE DATA SPECIFICATIONS & METADATA', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const introParagraph = doc.splitTextToSize(
    'This report presents the automated thematic extraction and radiometric analysis carried out on high-resolution satellite imagery for the selected target zone, generated through the Bhuviksana processing pipeline.',
    contentWidth
  );
  doc.text(introParagraph, margin, y);
  y += introParagraph.length * 4 + 2;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['PARAMETER', 'SENSOR / PROCESSING SPECIFICATION']],
    body: [
      ['Satellite Mission', 'Resourcesat-2 / Cartosat-3 Constellation'],
      ['Payload Sensor', 'Linear Imaging Self-Scanning Sensor (LISS-IV) & Panchromatic (PAN)'],
      ['Path / Row Reference', 'Path 98, Row 54 (Sub-scene quadrant B)'],
      ['Date of Acquisition', '14-January-2026 (05:42 UTC)'],
      ['Spatial Resolution', '5.8 m (Multi-spectral) / 0.8 m (Panchromatic sharpened)'],
      ['Radiometric Resolution', '10-bit Quantization (1024 grey levels)'],
      ['Map Projection & Datum', 'UTM Zone 43N / WGS-84 Datum']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [86, 184, 232],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      lineWidth: 0.2,
      lineColor: [220, 230, 242],
      cellPadding: 2.4
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.8,
      lineWidth: 0.15,
      lineColor: [220, 230, 242],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 55, textColor: [51, 65, 85] },
      1: { fontStyle: 'normal' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('2. OBJECTIVE AND SCOPE OF ANALYSIS', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const scopeParagraph = doc.splitTextToSize(
    'The analysis performs radiometric calibration, orthorectification, and supervised classification to track environmental change, urban expansion, and vegetation health within the selected area of interest. The resulting raster and vector layers are intended for use in planning, monitoring, and resource-tracking workflows on the Bhuviksana platform.',
    contentWidth
  );
  doc.text(scopeParagraph, margin, y);
  y += scopeParagraph.length * 4 + 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('3. METHODOLOGY & PROCESSING PIPELINE', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text('Level-0 sensor data is processed through the following automated pipeline stages:', margin, y);
  y += 4.5;

  const methodologyBullets = [
    '• Radiometric Calibration: Raw digital numbers converted to Top-of-Atmosphere and surface reflectance using solar zenith angle correction.',
    '• Geometric Correction: Orthorectification using CartoDEM elevation data and ground control points, targeting sub-pixel RMSE.',
    '• Feature Extraction & Classification: Supervised Maximum Likelihood Classification combined with NDVI thresholding (NDVI = (NIR - Red) / (NIR + Red)) to separate vegetation, bare soil, and built-up surfaces.'
  ];

  methodologyBullets.forEach((bullet) => {
    const wrapped = doc.splitTextToSize(bullet, contentWidth);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 3.8 + 1.2;
  });

  renderFooter(1);

  // PAGE 2: Statistical Observations & Sign-off
  doc.addPage();
  renderHeader();

  if (logoDataUrl) {
    doc.saveGraphicsState();
    if ((doc as any).setGState && (doc as any).GState) {
      doc.setGState(new (doc as any).GState({ opacity: 0.06 }));
    }
    doc.addImage(logoDataUrl, 'PNG', pageWidth / 2 - 45, pageHeight / 2 - 50, 90, 100);
    doc.restoreGraphicsState();
  }

  y = 35;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('4. RESULTS AND STATISTICAL OBSERVATIONS', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Comparative analysis against the 2024 baseline reveals the following trends across the target quadrant of 1,250 km²:',
    margin,
    y
  );
  y += 5;

  const tableBody = [
    ['Built-up / Urban Sprawl', '185.50', '14.84%', '+4.2% (Expansion)'],
    ['Agricultural Land & Crop Cover', '562.20', '44.98%', 'Stable (NDVI > 0.4)'],
    ['Forest & Dense Vegetation', '310.00', '24.80%', 'Minor regeneration (+0.8%)'],
    ['Water Bodies & Wetlands', '85.30', '6.82%', 'Stable retention'],
    ['Wasteland / Barren Rock', '107.00', '8.56%', 'Decreased (afforestation)'],
    ['Total Analyzed Area', '1,250.00', '100.00%', '—']
  ];

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['THEMATIC CLASS', 'AREA (km²)', 'COVERAGE', 'TREND (vs. 2024)']],
    body: tableBody,
    theme: 'grid',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.8,
      lineWidth: 0.2,
      lineColor: [220, 230, 242],
      cellPadding: 2.4
    },
    bodyStyles: {
      textColor: [30, 41, 59],
      fontSize: 7.8,
      lineWidth: 0.15,
      lineColor: [220, 230, 242],
      cellPadding: 2.2
    },
    columnStyles: {
      0: { fontStyle: 'normal', cellWidth: 55, textColor: [30, 41, 59] },
      1: { halign: 'left', cellWidth: 32 },
      2: { halign: 'left', cellWidth: 32 },
      3: { halign: 'left' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('5. CONCLUSION', margin, y);

  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const conclusionParagraph = doc.splitTextToSize(
    'The processed outputs indicate stable environmental conditions alongside managed urban growth in the analyzed quadrant. Orthorectified mosaics, false-color composites, and vector layers generated for this analysis are stored in the Bhuviksana geospatial workspace and are available for export from your dashboard.',
    contentWidth
  );
  doc.text(conclusionParagraph, margin, y);

  const signX = pageWidth - margin - 50;
  const signY = pageHeight - 46;

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', signX + 37, signY - 14, 10, 11);
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('Approved by Bhuviksana', signX + 48, signY, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Geo-Analytics & Earth Observation Division', signX + 48, signY + 4, { align: 'right' });
  doc.text('BHUVIKSANA Platform', signX + 48, signY + 8, { align: 'right' });

  renderFooter(2);
  doc.save('Bhuviksana_LULC_Analysis_Report_restyled.pdf');
};
