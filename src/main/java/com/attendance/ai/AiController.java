package com.attendance.ai;

import com.attendance.conge.CongeController;
import com.attendance.pointage.PointageController;
import com.attendance.stats.StatsController;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(originPatterns = "*")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final PointageController pointageController;
    private final CongeController congeController;
    private final StatsController statsController;

    @PostMapping("/reminder")
    public ResponseEntity<?> generateReminder(@RequestBody Map<String, Object> body) {
        String nom = (String) body.get("nom");
        String email = (String) body.get("email");
        int absenceDays = body.get("absenceDays") != null
                ? Integer.parseInt(body.get("absenceDays").toString()) : 1;
        String message = aiService.generateReminderMessage(nom, email, absenceDays);
        return ResponseEntity.ok(Map.of("message", message));
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, Object> body,
                                  Authentication authentication) {
        List<Map<String, String>> messages =
                (List<Map<String, String>>) body.get("messages");
        String systemPrompt = (String) body.get("systemPrompt");
        String userId = (String) body.get("userId");
        String role = (String) body.get("role");
        String lastMessage = messages.get(messages.size() - 1).get("content");

        // Fetch real data based on what user is asking
        StringBuilder contextData = new StringBuilder();
        String today = LocalDate.now().toString();
        int currentMonth = LocalDate.now().getMonthValue();
        int currentYear = LocalDate.now().getYear();

        try {
            // Pointage / attendance data
            if (containsAny(lastMessage,
                    "check in", "pointer", "pointage", "late", "arrived",
                    "attendance", "history", "time", "aujourd'hui", "today",
                    "heure", "retard")) {
                ResponseEntity<?> res = pointageController
                        .getPointages(userId, today);
                contextData.append("\nToday's attendance: ")
                        .append(res.getBody());

                // Also get full history if they ask for it
                if (containsAny(lastMessage, "history", "historique", "all", "tout")) {
                    ResponseEntity<?> histRes = pointageController
                            .getPointages(userId, null);
                    contextData.append("\nFull attendance history: ")
                            .append(histRes.getBody());
                }
            }

            // Leave / congé data
            if (containsAny(lastMessage,
                    "leave", "congé", "conge", "days off", "vacation",
                    "absent", "approved", "status", "demande", "jour")) {
                ResponseEntity<?> res = congeController
                        .getMyConges(authentication);
                contextData.append("\nMy leave requests: ")
                        .append(res.getBody());
            }

            // Stats data
            if (containsAny(lastMessage,
                    "stats", "hours", "heures", "rate", "taux",
                    "summary", "resume", "report", "rapport", "month", "mois")) {
                ResponseEntity<?> res = statsController
                        .getStats(userId, currentMonth, currentYear);
                contextData.append("\nMy stats this month: ")
                        .append(res.getBody());
            }

            // Admin only — all employees data
            if ("ROLE_ADMIN".equals(role)) {
                if (containsAny(lastMessage,
                        "absent", "who", "qui", "team", "all", "everyone",
                        "tous", "equipe", "anomaly", "anomalie",
                        "prediction", "report", "rapport")) {
                    ResponseEntity<?> res = statsController
                            .getAllStats(currentMonth, currentYear, authentication);
                    contextData.append("\nAll employees stats: ")
                            .append(res.getBody());
                }

                if (containsAny(lastMessage,
                        "anomaly", "anomalie", "late", "retard",
                        "irregular", "problem", "probleme")) {
                    ResponseEntity<?> res = statsController
                            .getAnomalies(userId, currentMonth, currentYear);
                    contextData.append("\nAnomalies detected: ")
                            .append(res.getBody());
                }

                if (containsAny(lastMessage,
                        "all leaves", "all conges", "tous les conges",
                        "pending", "en attente", "approve")) {
                    ResponseEntity<?> res = congeController.getAllConges();
                    contextData.append("\nAll leave requests: ")
                            .append(res.getBody());
                }
            }

        } catch (Exception e) {
            System.out.println("Data fetch error: " + e.getMessage());
        }

        // Build full prompt with real data
        String fullSystemPrompt = systemPrompt
                + (contextData.length() == 0 ? "" :
                "\n\nREAL DATA FROM DATABASE (use this to answer):\n"
                + contextData);

        String response = aiService.chat(messages, fullSystemPrompt);
        return ResponseEntity.ok(Map.of("message", response));
    }

    private boolean containsAny(String text, String... keywords) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        for (String kw : keywords) {
            if (lower.contains(kw)) return true;
        }
        return false;
    }
}