/**
 * useExport – a lightweight hook that exposes exportToExcel and exportToPDF
 * helpers. Both functions work entirely on the client side using the data
 * already loaded in React state, so no extra API round-trip is needed.
 *
 * Usage:
 *   const { exportToExcel, exportToPDF, exporting } = useExport();
 *   exportToExcel({ filename, headers, rows, sheetName });
 *   exportToPDF({ filename, title, headers, rows, orientation });
 */

import { useState } from 'react';

export function useExport() {
    const [exporting, setExporting] = useState(false);

    // ── Excel export ──────────────────────────────────────────────────────────
    const exportToExcel = async ({ filename, headers, rows, sheetName = 'Sheet1' }) => {
        setExporting(true);
        try {
            // xlsx is a CommonJS module – .default may be undefined in some bundlers
            const xlsxModule = await import('xlsx');
            const XLSX = xlsxModule.default ?? xlsxModule;

            // Build worksheet data: header row + data rows
            const wsData = [headers, ...rows];
            const ws = XLSX.utils.aoa_to_sheet(wsData);

            // Column widths – auto based on longest content
            ws['!cols'] = headers.map((h, colIdx) => {
                const maxLen = Math.max(
                    h.length,
                    ...rows.map(r => String(r[colIdx] ?? '').length)
                );
                return { wch: Math.min(maxLen + 4, 40) };
            });

            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
            XLSX.writeFile(wb, `${filename}.xlsx`);
        } catch (err) {
            console.error('Excel export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    // ── PDF export ────────────────────────────────────────────────────────────
    const exportToPDF = async ({ filename, title, headers, rows, orientation = 'portrait', subtitle = '' }) => {
        setExporting(true);
        try {
            // jspdf and jspdf-autotable may also be CommonJS
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default ?? jsPDFModule.jsPDF ?? jsPDFModule;
            const autoTableModule = await import('jspdf-autotable');
            const autoTable = autoTableModule.default ?? autoTableModule;

            const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
            const pageW = doc.internal.pageSize.getWidth();

            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(16);
            doc.setTextColor(15, 41, 66);
            doc.text(title, pageW / 2, 18, { align: 'center' });

            if (subtitle) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);
                doc.setTextColor(100, 100, 100);
                doc.text(subtitle, pageW / 2, 25, { align: 'center' });
            }

            // Generated date
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageW - 14, 12, { align: 'right' });

            autoTable(doc, {
                head: [headers],
                body: rows,
                startY: subtitle ? 32 : 26,
                styles: {
                    font: 'helvetica',
                    fontSize: 9,
                    cellPadding: 4,
                    textColor: [50, 50, 50],
                },
                headStyles: {
                    fillColor: [15, 41, 66],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center',
                },
                alternateRowStyles: {
                    fillColor: [240, 244, 248],
                },
                tableLineColor: [200, 210, 220],
                tableLineWidth: 0.1,
                margin: { left: 14, right: 14 },
            });

            doc.save(`${filename}.pdf`);
        } catch (err) {
            console.error('PDF export failed:', err);
        } finally {
            setExporting(false);
        }
    };

    return { exportToExcel, exportToPDF, exporting };
}
