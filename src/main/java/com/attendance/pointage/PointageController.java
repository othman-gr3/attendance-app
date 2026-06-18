package com.attendance.pointage;

import com.attendance.user.User;
import com.attendance.user.UserRepository;
import com.google.zxing.WriterException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
    private final UserRepository userRepository;
    private final PointageRepository pointageRepository;

    @PostMapping
    public ResponseEntity<?> pointer(@RequestBody Map<String, Object> body) {
        String userId = (String) body.get("userId");
        String type = (String) body.get("type");
        Double latitude = body.get("latitude") != null
                ? Double.parseDouble(body.get("latitude").toString()) : null;
        Double longitude = body.get("longitude") != null
                ? Double.parseDouble(body.get("longitude").toString()) : null;
        String qrCode = (String) body.get("qrCode");

        var result = pointageService.enregistrerPointage(userId, type, latitude, longitude, qrCode);

        // Récupérer le nom de l'employé
        User user = userRepository.findById(userId).orElse(null);
        String nom = user != null ? user.getNom() : "Employé";

        return ResponseEntity.ok(Map.of(
                "message", "Pointage enregistré",
                "valide", result.valide(),
                "qrValide", result.qrValide(),
                "gpsValide", result.gpsValide(),
                "nom", nom,
                "heure", result.heure()
        ));
    }

    @GetMapping
    public ResponseEntity<List<Pointage>> getPointages(
            @RequestParam String userId,
            @RequestParam(required = false) String date) {
        return ResponseEntity.ok(pointageService.getPointages(userId, date));
    }

    @GetMapping("/qr")
    public ResponseEntity<?> getQRCode() throws WriterException, IOException {
        String code = qrCodeService.getCurrentCode();
        String imageBase64 = qrCodeService.generateQRImage(code);
        return ResponseEntity.ok(Map.of(
                "code", code,
                "image", "data:image/png;base64," + imageBase64
        ));
    }

    @PostMapping("/debug-create")
    public ResponseEntity<?> debugCreate(@RequestBody Pointage pointage) {
        if (pointage.getValide() == null) {
            pointage.setValide(true);
        }
        Pointage saved = pointageRepository.save(pointage);
        return ResponseEntity.ok(saved);
    }
}