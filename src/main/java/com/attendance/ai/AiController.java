package com.attendance.ai;

import com.attendance.conge.CongeController;
import com.attendance.pointage.PointageController;
import com.attendance.stats.StatsController;
import com.attendance.user.User;
import com.attendance.user.UserRepository;
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
    private final UserRepository userRepository;

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
            if ("ROLE_ADMIN".equals(role)) {
                // For Admin, always fetch the general list of stats and leave requests for the team
                ResponseEntity<?> allStatsRes = statsController.getAllStats(currentMonth, currentYear, authentication);
                contextData.append("\nAll employees stats for the current month: ")
                        .append(allStatsRes.getBody());

                ResponseEntity<?> allCongesRes = congeController.getAllConges();
                contextData.append("\nAll leave requests: ")
                        .append(allCongesRes.getBody());

                // Scan if they ask about a specific user by name or email
                List<User> users = userRepository.findAll();
                String queryLower = lastMessage.toLowerCase();
                for (User u : users) {
                    String name = u.getNom() != null ? u.getNom().toLowerCase() : "";
                    String email = u.getEmail() != null ? u.getEmail().toLowerCase() : "";

                    if ((!name.isEmpty() && queryLower.contains(name)) || (!email.isEmpty() && queryLower.contains(email))) {
                        ResponseEntity<?> userStats = statsController.getStats(u.getId(), currentMonth, currentYear);
                        ResponseEntity<?> userAnomalies = statsController.getAnomalies(u.getId(), currentMonth, currentYear);
                        ResponseEntity<?> userPointages = pointageController.getPointages(u.getId(), today);

                        contextData.append("\nDetailed Stats for ").append(u.getNom()).append(": ").append(userStats.getBody());
                        contextData.append("\nAnomalies for ").append(u.getNom()).append(": ").append(userAnomalies.getBody());
                        contextData.append("\nToday's Attendance for ").append(u.getNom()).append(": ").append(userPointages.getBody());
                    }
                }
            } else {
                // For standard Employee, always load their complete personal data context
                ResponseEntity<?> myStats = statsController.getStats(userId, currentMonth, currentYear);
                ResponseEntity<?> myAnomalies = statsController.getAnomalies(userId, currentMonth, currentYear);
                ResponseEntity<?> myConges = congeController.getMyConges(authentication);
                ResponseEntity<?> myPointages = pointageController.getPointages(userId, today);

                contextData.append("\nMy stats this month: ").append(myStats.getBody());
                contextData.append("\nMy anomalies this month: ").append(myAnomalies.getBody());
                contextData.append("\nMy leave requests: ").append(myConges.getBody());
                contextData.append("\nMy attendance today: ").append(myPointages.getBody());
            }

        } catch (Exception e) {
            System.out.println("Chatbot Data fetch error: " + e.getMessage());
        }

        // Build full prompt with real data
        String fullSystemPrompt = systemPrompt
                + (contextData.length() == 0 ? "" :
                "\n\nREAL DATA FROM DATABASE (use this to answer):\n"
                + contextData);

        String response = aiService.chat(messages, fullSystemPrompt);
        return ResponseEntity.ok(Map.of("message", response));
    }
}