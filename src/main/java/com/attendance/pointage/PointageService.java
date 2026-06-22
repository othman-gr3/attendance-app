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

    @org.springframework.beans.factory.annotation.Value("${app.dev-mode:false}")
    private boolean devMode;

    // Zone autorisée : Position de test temporaire (Casablanca)
    private static final double OFFICE_LAT = 33.5874216225617;
    private static final double OFFICE_LNG = -7.581843903182479;
    private static final double MAX_DISTANCE_KM = 0.2; // 200 mètres

    public PointageResult enregistrerPointage(String userId, String type,
                                              Double latitude, Double longitude,
                                              String qrCode) {
        LocalTime nowTime = LocalTime.now();
        String formatHeure = nowTime.format(DateTimeFormatter.ofPattern("HH:mm"));

        // 1. Hourly slots check
        if (!devMode) {
            if ("entree".equals(type)) {
                if (nowTime.isBefore(LocalTime.of(7, 0)) || nowTime.isAfter(LocalTime.of(11, 30))) {
                    return new PointageResult("Entry check-in is only allowed between 07:00 and 11:30.", false, false, false, formatHeure);
                }
            } else if ("sortie".equals(type)) {
                if (nowTime.isBefore(LocalTime.of(16, 0))) {
                    return new PointageResult("Exit check-out is only allowed after 16:00.", false, false, false, formatHeure);
                }
            }
        }

        // 2. Daily uniqueness check (only check valid pointages)
        if (!devMode) {
            List<Pointage> todayPointages = pointageRepository.findByUserIdAndDate(userId, LocalDate.now().toString());
            boolean alreadyExists = todayPointages.stream()
                    .anyMatch(p -> Boolean.TRUE.equals(p.getValide()) && type.equals(p.getType()));
            if (alreadyExists) {
                return new PointageResult("You have already registered a valid " + ("entree".equals(type) ? "entry" : "exit") + " check-in for today.", false, false, false, formatHeure);
            }
        }

        // Vérification QR code
        boolean qrValide = devMode || qrCodeService.validateCode(qrCode);

        // Vérification GPS
        boolean gpsValide = devMode || verifierZone(latitude, longitude);

        boolean valide = qrValide && gpsValide;

        Pointage p = new Pointage();
        p.setUserId(userId);
        p.setDate(LocalDate.now().toString());
        p.setHeure(formatHeure);
        p.setType(type);
        p.setLatitude(latitude != null ? latitude : OFFICE_LAT);
        p.setLongitude(longitude != null ? longitude : OFFICE_LNG);
        p.setValide(valide);

        pointageRepository.save(p);

        return new PointageResult(valide ? "Check-in registered successfully" : "Check-in denied (Invalid GPS or QR code)", valide, qrValide, gpsValide, formatHeure);
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
// Changer le record tout en bas :
    public record PointageResult(String message, boolean valide,
                                 boolean qrValide, boolean gpsValide,
                                 String heure) {}}