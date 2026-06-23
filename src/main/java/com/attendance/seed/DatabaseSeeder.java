package com.attendance.seed;

import com.attendance.conge.Conge;
import com.attendance.conge.CongeRepository;
import com.attendance.pointage.Pointage;
import com.attendance.pointage.PointageRepository;
import com.attendance.user.User;
import com.attendance.user.UserRepository;
import com.attendance.notification.Notification;
import com.attendance.notification.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.DayOfWeek;
import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PointageRepository pointageRepository;
    private final CongeRepository congeRepository;
    private final NotificationRepository notificationRepository;
    private final PasswordEncoder passwordEncoder;

    private static final double OFFICE_LAT = 33.59277446026941;
    private static final double OFFICE_LNG = -7.627531335827666;

    @Override
    public void run(String... args) throws Exception {
        log.info("Checking database seeding status for 30 fake employees...");

        for (int i = 1; i <= 30; i++) {
            seedEmployee(i);
        }

        log.info("Database seeding check complete.");
    }

    private void seedEmployee(int index) {
        String email = "employee" + index + "@test.com";
        String name = "Employee " + index;

        if (userRepository.existsByEmail(email)) {
            log.info("User {} already exists. Skipping seeding.", email);
            return;
        }

        log.info("Seeding {}...", name);
        User user = new User();
        user.setNom(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("secret123"));
        user.setRole("ROLE_EMPLOYE");
        user.setCreatedAt("2026-05-15");
        userRepository.save(user);

        LocalDate start = LocalDate.of(2026, 6, 1);
        LocalDate end = LocalDate.of(2026, 6, 23);

        // Assign profile based on index modulo 5
        if (index % 5 == 0) {
            // Profile A: Absence & Leave Profile (20% of users)
            seedAbsenceLeaveProfile(user.getId(), start, end);
        } else if (index % 5 == 1 || index % 5 == 2) {
            // Profile B: Anomaly & Justification Profile (40% of users)
            seedAnomalyJustificationProfile(user.getId(), start, end);
        } else {
            // Profile C: Perfect Attendance Profile (40% of users)
            seedPerfectAttendanceProfile(user.getId(), start, end);
        }
        log.info("{} seeded successfully.", name);
    }

    private void seedPerfectAttendanceProfile(String userId, LocalDate start, LocalDate end) {
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (isWeekend(date)) continue;

            String dateStr = date.toString();
            // Entry
            createPointage(userId, dateStr, "08:30", "entree", true);
            // Exit
            createPointage(userId, dateStr, "17:15", "sortie", true);
        }
    }

    private void seedAnomalyJustificationProfile(String userId, LocalDate start, LocalDate end) {
        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (isWeekend(date)) continue;

            String dateStr = date.toString();

            if (date.getDayOfMonth() == 15) {
                // Late arrival, pending justification
                createPointage(userId, dateStr, "09:45", "entree", true);
                createPointage(userId, dateStr, "17:00", "sortie", true);
                createNotification(userId, dateStr, "Absence/Late Arrival Notification",
                        "Arrival at 09:45 (limit 09:00)", "PENDING", null, null, null, null);
            } else if (date.getDayOfMonth() == 16) {
                // Late arrival, justified by employee
                createPointage(userId, dateStr, "09:30", "entree", true);
                createPointage(userId, dateStr, "17:00", "sortie", true);
                createNotification(userId, dateStr, "Absence/Late Arrival Notification",
                        "Arrival at 09:30 (limit 09:00)", "JUSTIFIED", "Train delay due to maintenance",
                        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
                        "justification.png", "image/png");
            } else if (date.getDayOfMonth() == 17) {
                // Late arrival, approved by admin
                createPointage(userId, dateStr, "10:15", "entree", true);
                createPointage(userId, dateStr, "17:00", "sortie", true);
                createNotification(userId, dateStr, "Absence/Late Arrival Notification",
                        "Arrival at 10:15 (limit 09:00)", "APPROVED", "Medical appointment", null, null, null);
            } else if (date.getDayOfMonth() == 18) {
                // Late arrival, rejected by admin
                createPointage(userId, dateStr, "09:20", "entree", true);
                createPointage(userId, dateStr, "17:00", "sortie", true);
                createNotification(userId, dateStr, "Absence/Late Arrival Notification",
                        "Arrival at 09:20 (limit 09:00)", "REJECTED", "Woke up late", null, null, null);
            } else if (date.getDayOfMonth() == 19) {
                // Early exit
                createPointage(userId, dateStr, "08:45", "entree", true);
                createPointage(userId, dateStr, "15:30", "sortie", true);
            } else if (date.getDayOfMonth() == 22) {
                // Insuffisance (Hours shortage)
                createPointage(userId, dateStr, "09:00", "entree", true);
                createPointage(userId, dateStr, "15:30", "sortie", true);
            } else {
                // Normal day
                createPointage(userId, dateStr, "08:45", "entree", true);
                createPointage(userId, dateStr, "17:00", "sortie", true);
            }
        }
    }

    private void seedAbsenceLeaveProfile(String userId, LocalDate start, LocalDate end) {
        // Seed leave requests (conges)
        // 1. Approved leave from June 8 to June 12
        Conge approvedConge = new Conge();
        approvedConge.setUserId(userId);
        approvedConge.setDateDebut("2026-06-08");
        approvedConge.setDateFin("2026-06-12");
        approvedConge.setType("annuel");
        approvedConge.setStatut("valide");
        congeRepository.save(approvedConge);

        // 2. Pending leave from June 24 to June 26
        Conge pendingConge = new Conge();
        pendingConge.setUserId(userId);
        pendingConge.setDateDebut("2026-06-24");
        pendingConge.setDateFin("2026-06-26");
        pendingConge.setType("annuel");
        pendingConge.setStatut("en_attente");
        congeRepository.save(pendingConge);

        for (LocalDate date = start; !date.isAfter(end); date = date.plusDays(1)) {
            if (isWeekend(date)) continue;

            String dateStr = date.toString();

            // Check if user is on approved leave
            if (date.getDayOfMonth() >= 8 && date.getDayOfMonth() <= 12) {
                // On leave, no pointages and no anomalies
                continue;
            }

            if (date.getDayOfMonth() == 15) {
                // Absent, pending justification
                createNotification(userId, dateStr, "Absence Notification",
                        "No check-in recorded for this day", "PENDING", null, null, null, null);
            } else if (date.getDayOfMonth() == 16) {
                // Absent, justified by employee
                createNotification(userId, dateStr, "Absence Notification",
                        "No check-in recorded for this day", "JUSTIFIED", "Sickness without certificate",
                        null, null, null);
            } else {
                // Normal day
                createPointage(userId, dateStr, "08:40", "entree", true);
                createPointage(userId, dateStr, "17:10", "sortie", true);
            }
        }
    }

    private void createPointage(String userId, String date, String heure, String type, boolean valide) {
        Pointage p = new Pointage();
        p.setUserId(userId);
        p.setDate(date);
        p.setHeure(heure);
        p.setType(type);
        p.setLatitude(OFFICE_LAT);
        p.setLongitude(OFFICE_LNG);
        p.setValide(valide);
        pointageRepository.save(p);
    }

    private void createNotification(String userId, String anomalyDate, String title, String message,
                                    String justificationStatus, String responseMessage, String responseAttachment,
                                    String responseAttachmentName, String responseAttachmentType) {
        Notification notif = new Notification();
        notif.setUserId(userId);
        notif.setTitle(title);
        notif.setMessage(message);
        notif.setDate(LocalDate.now().toString());
        notif.setRead("APPROVED".equals(justificationStatus) || "REJECTED".equals(justificationStatus));
        notif.setAnomalyDate(anomalyDate);
        notif.setJustificationStatus(justificationStatus);
        notif.setResponseMessage(responseMessage);
        notif.setResponseAttachment(responseAttachment);
        notif.setResponseAttachmentName(responseAttachmentName);
        notif.setResponseAttachmentType(responseAttachmentType);
        notificationRepository.save(notif);
    }

    private boolean isWeekend(LocalDate date) {
        DayOfWeek dow = date.getDayOfWeek();
        return dow == DayOfWeek.SATURDAY || dow == DayOfWeek.SUNDAY;
    }
}
