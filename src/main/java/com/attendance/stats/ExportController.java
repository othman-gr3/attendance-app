package com.attendance.stats;

import com.attendance.stats.dto.AllStatsResponse;
import com.attendance.stats.dto.AnomalyDto;
import com.attendance.user.User;
import com.attendance.user.UserRepository;
import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/export")
public class ExportController {

    @Autowired
    private StatsService statsService;

    @Autowired
    private UserRepository userRepository;

    // ─── EXCEL: All Employees Stats ──────────────────────────────────────────

    @GetMapping("/excel/stats")
    public ResponseEntity<?> exportStatsExcel(
            @RequestParam int month,
            @RequestParam int year,
            Authentication authentication) {
        try {
            if (!isAdmin(authentication)) {
                return forbidden();
            }

            List<AllStatsResponse> allStats = statsService.getAllStats(month, year);

            try (XSSFWorkbook workbook = new XSSFWorkbook();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                Sheet sheet = workbook.createSheet("Attendance Stats");

                // Header style
                CellStyle headerStyle = workbook.createCellStyle();
                headerStyle.setFillForegroundColor(IndexedColors.DARK_BLUE.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                Font headerFont = workbook.createFont();
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerFont.setBold(true);
                headerFont.setFontHeightInPoints((short) 11);
                headerStyle.setFont(headerFont);
                headerStyle.setBorderBottom(BorderStyle.THIN);

                // Number style
                CellStyle numStyle = workbook.createCellStyle();
                numStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00"));

                // Title row
                Row titleRow = sheet.createRow(0);
                Cell titleCell = titleRow.createCell(0);
                titleCell.setCellValue("Attendance Report — " + month + "/" + year);
                CellStyle titleStyle = workbook.createCellStyle();
                Font titleFont = workbook.createFont();
                titleFont.setBold(true);
                titleFont.setFontHeightInPoints((short) 14);
                titleStyle.setFont(titleFont);
                titleCell.setCellStyle(titleStyle);

                // Header row
                String[] headers = {"Employee Name", "Email", "Hours Worked", "Late Arrivals", "Absences", "Leave Days Left", "Presence Rate (%)"};
                Row headerRow = sheet.createRow(2);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                // Data rows
                int rowNum = 3;
                for (AllStatsResponse s : allStats) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(s.getNom());
                    row.createCell(1).setCellValue(s.getEmail());
                    Cell hoursCell = row.createCell(2);
                    hoursCell.setCellValue(s.getHeuresTravaillees());
                    hoursCell.setCellStyle(numStyle);
                    row.createCell(3).setCellValue(s.getRetards());
                    row.createCell(4).setCellValue(s.getAbsences());
                    row.createCell(5).setCellValue(s.getCongesRestants());
                    Cell rateCell = row.createCell(6);
                    rateCell.setCellValue(s.getTauxPresence());
                    rateCell.setCellStyle(numStyle);
                }

                // Auto-size columns
                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(out);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_stats_" + year + "_" + month + ".xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(out.toByteArray());
            }
        } catch (Exception e) {
            return serverError(e.getMessage());
        }
    }

    // ─── EXCEL: Anomalies for one user ───────────────────────────────────────

    @GetMapping("/excel/anomalies")
    public ResponseEntity<?> exportAnomaliesExcel(
            @RequestParam String userId,
            @RequestParam int month,
            @RequestParam int year,
            Authentication authentication) {
        try {
            if (!isAdmin(authentication)) {
                return forbidden();
            }

            List<AnomalyDto> anomalies = statsService.detectAnomalies(userId, month, year);
            User user = userRepository.findById(userId).orElse(null);
            String userName = user != null ? user.getNom() : userId;

            try (XSSFWorkbook workbook = new XSSFWorkbook();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                Sheet sheet = workbook.createSheet("Anomalies");

                CellStyle headerStyle = workbook.createCellStyle();
                headerStyle.setFillForegroundColor(IndexedColors.DARK_RED.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                Font headerFont = workbook.createFont();
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerFont.setBold(true);
                headerStyle.setFont(headerFont);

                // Title
                Row titleRow = sheet.createRow(0);
                titleRow.createCell(0).setCellValue("Anomaly Report — " + userName + " — " + month + "/" + year);

                // Headers
                String[] headers = {"Date", "Type", "Details"};
                Row headerRow = sheet.createRow(2);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                // Data
                int rowNum = 3;
                for (AnomalyDto a : anomalies) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(a.getDate());
                    row.createCell(1).setCellValue(a.getType());
                    row.createCell(2).setCellValue(a.getDetail());
                }

                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(out);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=anomalies_" + userId + "_" + year + "_" + month + ".xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(out.toByteArray());
            }
        } catch (Exception e) {
            return serverError(e.getMessage());
        }
    }

    // ─── EXCEL: Employee list ─────────────────────────────────────────────────

    @GetMapping("/excel/employees")
    public ResponseEntity<?> exportEmployeesExcel(Authentication authentication) {
        try {
            if (!isAdmin(authentication)) {
                return forbidden();
            }

            List<User> employees = userRepository.findAll();

            try (XSSFWorkbook workbook = new XSSFWorkbook();
                 ByteArrayOutputStream out = new ByteArrayOutputStream()) {

                Sheet sheet = workbook.createSheet("Employees");

                CellStyle headerStyle = workbook.createCellStyle();
                headerStyle.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex());
                headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
                Font headerFont = workbook.createFont();
                headerFont.setColor(IndexedColors.WHITE.getIndex());
                headerFont.setBold(true);
                headerStyle.setFont(headerFont);

                String[] headers = {"Name", "Email", "Role"};
                Row headerRow = sheet.createRow(0);
                for (int i = 0; i < headers.length; i++) {
                    Cell cell = headerRow.createCell(i);
                    cell.setCellValue(headers[i]);
                    cell.setCellStyle(headerStyle);
                }

                int rowNum = 1;
                for (User emp : employees) {
                    Row row = sheet.createRow(rowNum++);
                    row.createCell(0).setCellValue(emp.getNom());
                    row.createCell(1).setCellValue(emp.getEmail());
                    row.createCell(2).setCellValue(emp.getRole());
                }

                for (int i = 0; i < headers.length; i++) {
                    sheet.autoSizeColumn(i);
                }

                workbook.write(out);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees.xlsx")
                        .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                        .body(out.toByteArray());
            }
        } catch (Exception e) {
            return serverError(e.getMessage());
        }
    }

    // ─── PDF: All Employees Stats ─────────────────────────────────────────────

    @GetMapping("/pdf/stats")
    public ResponseEntity<?> exportStatsPdf(
            @RequestParam int month,
            @RequestParam int year,
            Authentication authentication) {
        try {
            if (!isAdmin(authentication)) {
                return forbidden();
            }

            List<AllStatsResponse> allStats = statsService.getAllStats(month, year);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4.rotate());
            PdfWriter.getInstance(document, out);
            document.open();

            // Title
            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY);
            Paragraph title = new Paragraph("Attendance Report — " + month + "/" + year, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            // Table
            PdfPTable table = new PdfPTable(7);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 3f, 1.5f, 1.5f, 1.5f, 1.5f, 1.8f});

            String[] headers = {"Employee", "Email", "Hours", "Lates", "Absences", "Leave Left", "Presence %"};
            BaseColor headerColor = new BaseColor(15, 41, 66);
            com.itextpdf.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BaseColor.WHITE);
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(headerColor);
                cell.setPadding(8);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                table.addCell(cell);
            }

            com.itextpdf.text.Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.DARK_GRAY);
            boolean alt = false;
            for (AllStatsResponse s : allStats) {
                BaseColor rowColor = alt ? new BaseColor(240, 244, 248) : BaseColor.WHITE;
                String[] values = {
                    s.getNom(),
                    s.getEmail(),
                    String.format("%.1f h", s.getHeuresTravaillees()),
                    String.valueOf(s.getRetards()),
                    String.valueOf(s.getAbsences()),
                    String.valueOf(s.getCongesRestants()),
                    String.format("%.1f %%", s.getTauxPresence())
                };
                for (String v : values) {
                    PdfPCell cell = new PdfPCell(new Phrase(v, dataFont));
                    cell.setBackgroundColor(rowColor);
                    cell.setPadding(6);
                    table.addCell(cell);
                }
                alt = !alt;
            }

            document.add(table);
            document.close();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=attendance_stats_" + year + "_" + month + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(out.toByteArray());
        } catch (Exception e) {
            return serverError(e.getMessage());
        }
    }

    // ─── PDF: Anomalies for one user ─────────────────────────────────────────

    @GetMapping("/pdf/anomalies")
    public ResponseEntity<?> exportAnomaliesPdf(
            @RequestParam String userId,
            @RequestParam int month,
            @RequestParam int year,
            Authentication authentication) {
        try {
            if (!isAdmin(authentication)) {
                return forbidden();
            }

            List<AnomalyDto> anomalies = statsService.detectAnomalies(userId, month, year);
            User user = userRepository.findById(userId).orElse(null);
            String userName = user != null ? user.getNom() : userId;

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY);
            Paragraph title = new Paragraph("Anomaly Report — " + userName + " — " + month + "/" + year, titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            if (anomalies.isEmpty()) {
                com.itextpdf.text.Font okFont = FontFactory.getFont(FontFactory.HELVETICA, 12, new BaseColor(46, 125, 50));
                document.add(new Paragraph("✓ No anomalies detected for this period.", okFont));
            } else {
                PdfPTable table = new PdfPTable(3);
                table.setWidthPercentage(100);
                table.setWidths(new float[]{2f, 2f, 5f});

                String[] headers = {"Date", "Type", "Details"};
                BaseColor headerColor = new BaseColor(180, 0, 0);
                com.itextpdf.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
                for (String h : headers) {
                    PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                    cell.setBackgroundColor(headerColor);
                    cell.setPadding(8);
                    table.addCell(cell);
                }

                com.itextpdf.text.Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.DARK_GRAY);
                boolean alt = false;
                for (AnomalyDto a : anomalies) {
                    BaseColor rowColor = alt ? new BaseColor(255, 245, 245) : BaseColor.WHITE;
                    String[] values = {a.getDate(), a.getType(), a.getDetail()};
                    for (String v : values) {
                        PdfPCell cell = new PdfPCell(new Phrase(v, dataFont));
                        cell.setBackgroundColor(rowColor);
                        cell.setPadding(6);
                        table.addCell(cell);
                    }
                    alt = !alt;
                }

                document.add(table);
            }

            document.close();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=anomalies_" + userId + "_" + year + "_" + month + ".pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(out.toByteArray());
        } catch (Exception e) {
            return serverError(e.getMessage());
        }
    }

    // ─── PDF: Employee list ───────────────────────────────────────────────────

    @GetMapping("/pdf/employees")
    public ResponseEntity<?> exportEmployeesPdf(Authentication authentication) {
        try {
            if (!isAdmin(authentication)) {
                return forbidden();
            }

            List<User> employees = userRepository.findAll();

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            Document document = new Document(PageSize.A4);
            PdfWriter.getInstance(document, out);
            document.open();

            com.itextpdf.text.Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16, BaseColor.DARK_GRAY);
            Paragraph title = new Paragraph("Employee Directory", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(20);
            document.add(title);

            PdfPTable table = new PdfPTable(3);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{3f, 4f, 2f});

            String[] headers = {"Name", "Email", "Role"};
            BaseColor headerColor = new BaseColor(15, 41, 66);
            com.itextpdf.text.Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, BaseColor.WHITE);
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, headerFont));
                cell.setBackgroundColor(headerColor);
                cell.setPadding(8);
                table.addCell(cell);
            }

            com.itextpdf.text.Font dataFont = FontFactory.getFont(FontFactory.HELVETICA, 9, BaseColor.DARK_GRAY);
            boolean alt = false;
            for (User emp : employees) {
                BaseColor rowColor = alt ? new BaseColor(240, 244, 248) : BaseColor.WHITE;
                String[] values = {emp.getNom(), emp.getEmail(), emp.getRole()};
                for (String v : values) {
                    PdfPCell cell = new PdfPCell(new Phrase(v, dataFont));
                    cell.setBackgroundColor(rowColor);
                    cell.setPadding(6);
                    table.addCell(cell);
                }
                alt = !alt;
            }

            document.add(table);
            document.close();

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=employees.pdf")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(out.toByteArray());
        } catch (Exception e) {
            return serverError(e.getMessage());
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private boolean isAdmin(Authentication authentication) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
    }

    private ResponseEntity<Map<String, String>> forbidden() {
        Map<String, String> err = new HashMap<>();
        err.put("error", "Access denied");
        return ResponseEntity.status(403).body(err);
    }

    private ResponseEntity<Map<String, String>> serverError(String msg) {
        Map<String, String> err = new HashMap<>();
        err.put("error", msg != null ? msg : "Export failed");
        return ResponseEntity.status(500).body(err);
    }
}
