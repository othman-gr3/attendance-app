package com.attendance.pointage;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PointageService {

    private final PointageRepository pointageRepository;
    private final QRCodeService qrCodeService;

    // Zone autorisée : Casablanca (exemple)
    private static final double OFFICE_LAT = 33.5731;
    private static final double OFFICE_LNG = -7.5898;
    private static final double MAX_DISTANCE_KM = 0.2; // 200 mètres

    public PointageResult enregistrerPointage(String userId, String type,
                                              Double latitude, Double longitude,
                                              String qrCode) {
        // Vérification QR code
        boolean qrValide = qrCodeService.validateCode(qrCode);

        // Vérification GPS
        boolean gpsValide = verifierZone(latitude, longitude);

        boolean valide = qrValide && gpsValide;

        Pointage p = new Pointage();
        p.setUserId(userId);
        p.setDate(LocalDate.now().toString());
        p.setHeure(LocalTime.now().format(DateTimeFormatter.ofPattern("HH:mm")));
        p.setType(type);
        p.setLatitude(latitude);
        p.setLongitude(longitude);
        p.setValide(valide);

        pointageRepository.save(p);

        return new PointageResult("Pointage enregistré", valide, qrValide, gpsValide);
    }

    public List<Pointage> getPointages(String userId, String date) {
        if (date != null && !date.isBlank()) {
            return pointageRepository.findByUserIdAndDate(userId, date);
        }
        return pointageRepository.findByUserId(userId);
    }

    private boolean verifierZone(Double lat, Double lng) {
        if (lat == null || lng == null) return false;

        // Formule Haversine
        final int R = 6371;
        double dLat = Math.toRadians(lat - OFFICE_LAT);
        double dLng = Math.toRadians(lng - OFFICE_LNG);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(OFFICE_LAT)) * Math.cos(Math.toRadians(lat))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return distance <= MAX_DISTANCE_KM;
    }

    // Classe interne pour la réponse
    public record PointageResult(String message, boolean valide,
                                 boolean qrValide, boolean gpsValide) {}
}