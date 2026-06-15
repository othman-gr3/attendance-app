package com.attendance.pointage;

import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pointage")
@RequiredArgsConstructor
public class PointageController {

    private final PointageService pointageService;
    private final QRCodeService qrCodeService;

    // POST /api/pointage — Enregistrer un pointage
    @PostMapping
    public ResponseEntity<?> pointer(@RequestBody Map<String, Object> body,
                                     Authentication auth) {
        String userId = (String) body.get("userId"); // ou extrait du JWT
        String type = (String) body.get("type");
        Double latitude = body.get("latitude") != null
                ? Double.parseDouble(body.get("latitude").toString()) : null;
        Double longitude = body.get("longitude") != null
                ? Double.parseDouble(body.get("longitude").toString()) : null;
        String qrCode = (String) body.get("qrCode");

        var result = pointageService.enregistrerPointage(userId, type, latitude, longitude, qrCode);

        return ResponseEntity.ok(Map.of(
                "message", result.message(),
                "valide", result.valide(),
                "qrValide", result.qrValide(),
                "gpsValide", result.gpsValide()
        ));
    }

    // GET /api/pointage?userId=...&date=2026-06-13
    @GetMapping
    public ResponseEntity<List<Pointage>> getPointages(
            @RequestParam String userId,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(pointageService.getPointages(userId, date));
    }

    // GET /api/pointage/qr — Générer le QR code du moment (admin)
    @GetMapping("/qr")
    public ResponseEntity<?> getQRCode() throws WriterException, IOException {
        String code = qrCodeService.getCurrentCode();
        String imageBase64 = qrCodeService.generateQRImage(code);
        return ResponseEntity.ok(Map.of(
                "code", code,
                "image", "data:image/png;base64," + imageBase64
        ));
    }
}