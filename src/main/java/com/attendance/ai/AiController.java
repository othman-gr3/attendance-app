package com.attendance.ai;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@CrossOrigin(originPatterns = "*")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    @PostMapping("/reminder")
    public ResponseEntity<?> generateReminder(@RequestBody Map<String, Object> body) {
        String nom = (String) body.get("nom");
        String email = (String) body.get("email");
        int absenceDays = body.get("absenceDays") != null
                ? Integer.parseInt(body.get("absenceDays").toString()) : 1;

        String message = aiService.generateReminderMessage(nom, email, absenceDays);
        return ResponseEntity.ok(Map.of("message", message));
    }
}