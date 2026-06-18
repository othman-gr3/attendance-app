package com.attendance.stats;

import com.attendance.conge.Conge;
import com.attendance.conge.CongeRepository;
import com.attendance.pointage.Pointage;
import com.attendance.pointage.PointageRepository;
import com.attendance.stats.dto.AllStatsResponse;
import com.attendance.stats.dto.AnomalyDto;
import com.attendance.stats.dto.StatsResponse;
import com.attendance.user.User;
import com.attendance.user.UserRepository;
import com.attendance.notification.Notification;
import com.attendance.notification.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StatsService {
    @Autowired
    private PointageRepository pointageRepository;

    @Autowired
    private CongeRepository congeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private static final int DAILY_WORK_HOURS = 8;
    private static final String START_HOUR = "09:00";
    private static final String END_HOUR = "17:00";
    private static final int ANNUAL_LEAVE_ALLOWANCE = 20;

    public StatsResponse computeStats(String userId, int month, int year) {
        // Get user to verify existence
        List<User> users = userRepository.findAll();
        User user = users.stream()
                .filter(u -> u.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        // Fetch all pointages for this user in the month (only valid ones)
        List<Pointage> pointages = pointageRepository.findByUserId(userId).stream()
                .filter(p -> {
                    LocalDate date = LocalDate.parse(p.getDate());
                    return !date.isBefore(startDate) && !date.isAfter(endDate) && Boolean.TRUE.equals(p.getValide());
                })
                .collect(Collectors.toList());

        // Group by date
        Map<String, List<Pointage>> pointagesByDate = pointages.stream()
                .collect(Collectors.groupingBy(Pointage::getDate));

        // Calculate heuresTravaillees and retards
        double heuresTravaillees = 0;
        int retards = 0;

        for (Map.Entry<String, List<Pointage>> entry : pointagesByDate.entrySet()) {
            List<Pointage> dayPointages = entry.getValue();
            String dateStr = entry.getKey();

            Pointage entree = dayPointages.stream()
                    .filter(p -> "entree".equals(p.getType()))
                    .findFirst()
                    .orElse(null);

            Pointage sortie = dayPointages.stream()
                    .filter(p -> "sortie".equals(p.getType()))
                    .findFirst()
                    .orElse(null);

            if (entree != null && sortie != null) {
                double hours = calculateHoursDifference(entree.getHeure(), sortie.getHeure());
                heuresTravaillees += hours;
            }

            if (entree != null && isAfter(entree.getHeure(), START_HOUR)) {
                if (!hasApprovedJustificationOnDate(userId, dateStr)) {
                    retards++;
                }
            }
        }

        // Calculate absences (working days with no pointage and no approved conge)
        int absences = 0;
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (isWorkingDay(date)) {
                String dateStr = date.toString();
                boolean hasPointage = pointagesByDate.containsKey(dateStr);
                boolean hasApprovedConge = hasApprovedCongeOnDate(userId, dateStr);
                boolean hasApprovedJustification = hasApprovedJustificationOnDate(userId, dateStr);

                if (!hasPointage && !hasApprovedConge && !hasApprovedJustification) {
                    absences++;
                }
            }
        }

        // Calculate congesRestants (20 - approved annuel conges used this year)
        int congesUsedThisYear = countApprovedAnnuelCongesThisYear(userId, year);
        int congesRestants = ANNUAL_LEAVE_ALLOWANCE - congesUsedThisYear;

        // Calculate tauxPresence
        int totalWorkingDays = countWorkingDaysInMonth(startDate, endDate);
        int presentDays = totalWorkingDays - absences;
        double tauxPresence = totalWorkingDays > 0 ? Math.round(((double) presentDays / totalWorkingDays) * 1000.0) / 10.0 : 0;

        return new StatsResponse(heuresTravaillees, retards, absences, congesRestants, tauxPresence);
    }

    public List<AnomalyDto> detectAnomalies(String userId, int month, int year) {
        List<AnomalyDto> anomalies = new ArrayList<>();

        YearMonth yearMonth = YearMonth.of(year, month);
        LocalDate startDate = yearMonth.atDay(1);
        LocalDate endDate = yearMonth.atEndOfMonth();

        List<Pointage> pointages = pointageRepository.findByUserId(userId).stream()
                .filter(p -> {
                    LocalDate date = LocalDate.parse(p.getDate());
                    return !date.isBefore(startDate) && !date.isAfter(endDate) && Boolean.TRUE.equals(p.getValide());
                })
                .collect(Collectors.toList());

        Map<String, List<Pointage>> pointagesByDate = pointages.stream()
                .collect(Collectors.groupingBy(Pointage::getDate));

        // Check each working day
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (isWorkingDay(date)) {
                String dateStr = date.toString();
                List<Pointage> dayPointages = pointagesByDate.getOrDefault(dateStr, new ArrayList<>());

                Pointage entree = dayPointages.stream()
                        .filter(p -> "entree".equals(p.getType()))
                        .findFirst()
                        .orElse(null);

                Pointage sortie = dayPointages.stream()
                        .filter(p -> "sortie".equals(p.getType()))
                        .findFirst()
                        .orElse(null);

                // Check for absence
                if (entree == null && sortie == null) {
                    if (!hasApprovedCongeOnDate(userId, dateStr)) {
                        anomalies.add(new AnomalyDto(dateStr, "absence", "No check-in recorded for this day"));
                    }
                }

                // Check for retard
                if (entree != null && isAfter(entree.getHeure(), START_HOUR)) {
                    anomalies.add(new AnomalyDto(
                            dateStr,
                            "retard",
                            "Arrival at " + entree.getHeure() + " (limit " + START_HOUR + ")"
                    ));
                }

                // Check for sortie anticipée
                if (sortie != null && isBefore(sortie.getHeure(), END_HOUR)) {
                    anomalies.add(new AnomalyDto(
                            dateStr,
                            "sortie_anticipee",
                            "Departure at " + sortie.getHeure() + " (limit " + END_HOUR + ")"
                    ));
                }

                // Check for insuffisance (less than 8 hours worked)
                if (entree != null && sortie != null) {
                    double hours = calculateHoursDifference(entree.getHeure(), sortie.getHeure());
                    if (hours < DAILY_WORK_HOURS) {
                        anomalies.add(new AnomalyDto(
                                dateStr,
                                "insuffisance",
                                "Hours worked: " + String.format("%.1f", hours) + "h (minimum " + DAILY_WORK_HOURS + "h)"
                        ));
                    }
                }
            }
        }

        return anomalies;
    }

    public List<AllStatsResponse> getAllStats(int month, int year) {
        List<AllStatsResponse> allStats = new ArrayList<>();

        List<User> users = userRepository.findAll().stream()
                .filter(u -> "ROLE_EMPLOYE".equals(u.getRole()))
                .collect(Collectors.toList());

        for (User user : users) {
            StatsResponse stats = computeStats(user.getId(), month, year);
            AllStatsResponse response = new AllStatsResponse(
                    user.getId(),
                    user.getNom(),
                    user.getEmail(),
                    stats.getHeuresTravaillees(),
                    stats.getRetards(),
                    stats.getAbsences(),
                    stats.getCongesRestants(),
                    stats.getTauxPresence()
            );
            allStats.add(response);
        }

        return allStats;
    }

    // Helper methods

    private double calculateHoursDifference(String startTime, String endTime) {
        try {
            String[] startParts = startTime.split(":");
            String[] endParts = endTime.split(":");

            int startHours = Integer.parseInt(startParts[0]);
            int startMinutes = Integer.parseInt(startParts[1]);
            int endHours = Integer.parseInt(endParts[0]);
            int endMinutes = Integer.parseInt(endParts[1]);

            int startTotalMinutes = startHours * 60 + startMinutes;
            int endTotalMinutes = endHours * 60 + endMinutes;

            int diffMinutes = endTotalMinutes - startTotalMinutes;
            return diffMinutes / 60.0;
        } catch (Exception e) {
            return 0;
        }
    }

    private boolean isAfter(String time, String compareTime) {
        try {
            String[] timeParts = time.split(":");
            String[] compareParts = compareTime.split(":");

            int hours = Integer.parseInt(timeParts[0]);
            int minutes = Integer.parseInt(timeParts[1]);
            int compareHours = Integer.parseInt(compareParts[0]);
            int compareMinutes = Integer.parseInt(compareParts[1]);

            int totalMinutes = hours * 60 + minutes;
            int compareTotalMinutes = compareHours * 60 + compareMinutes;

            return totalMinutes > compareTotalMinutes;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isBefore(String time, String compareTime) {
        try {
            String[] timeParts = time.split(":");
            String[] compareParts = compareTime.split(":");

            int hours = Integer.parseInt(timeParts[0]);
            int minutes = Integer.parseInt(timeParts[1]);
            int compareHours = Integer.parseInt(compareParts[0]);
            int compareMinutes = Integer.parseInt(compareParts[1]);

            int totalMinutes = hours * 60 + minutes;
            int compareTotalMinutes = compareHours * 60 + compareMinutes;

            return totalMinutes < compareTotalMinutes;
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isWorkingDay(LocalDate date) {
        DayOfWeek day = date.getDayOfWeek();
        return day != DayOfWeek.SATURDAY && day != DayOfWeek.SUNDAY;
    }

    private int countWorkingDaysInMonth(LocalDate startDate, LocalDate endDate) {
        int count = 0;
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            if (isWorkingDay(date)) {
                count++;
            }
        }
        return count;
    }

    private boolean hasApprovedCongeOnDate(String userId, String dateStr) {
        List<Conge> conges = congeRepository.findByUserId(userId);

        for (Conge conge : conges) {
            if ("valide".equals(conge.getStatut())) {
                LocalDate date = LocalDate.parse(dateStr);
                LocalDate debut = LocalDate.parse(conge.getDateDebut());
                LocalDate fin = LocalDate.parse(conge.getDateFin());

                if (!date.isBefore(debut) && !date.isAfter(fin)) {
                    return true;
                }
            }
        }

        return false;
    }

    private int countApprovedAnnuelCongesThisYear(String userId, int year) {
        List<Conge> conges = congeRepository.findByUserId(userId);

        int count = 0;
        for (Conge conge : conges) {
            if ("valide".equals(conge.getStatut()) && "annuel".equals(conge.getType())) {
                LocalDate debut = LocalDate.parse(conge.getDateDebut());
                LocalDate fin = LocalDate.parse(conge.getDateFin());

                if (debut.getYear() == year || fin.getYear() == year) {
                    long days = ChronoUnit.DAYS.between(debut, fin) + 1;
                    count += days;
                }
            }
        }

        return count;
    }

    private boolean hasApprovedJustificationOnDate(String userId, String dateStr) {
        List<Notification> notifications = notificationRepository.findByUserId(userId);
        if (notifications == null) return false;
        for (Notification notif : notifications) {
            if (dateStr.equals(notif.getAnomalyDate()) && "APPROVED".equals(notif.getJustificationStatus())) {
                return true;
            }
        }
        return false;
    }
}

