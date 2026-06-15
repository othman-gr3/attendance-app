package com.attendance.stats;

import com.attendance.stats.dto.AllStatsResponse;
import com.attendance.stats.dto.AnomalyDto;
import com.attendance.stats.dto.StatsResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/stats")
public class StatsController {
    @Autowired
    private StatsService statsService;

    @GetMapping
    public ResponseEntity<?> getStats(
            @RequestParam String userId,
            @RequestParam int month,
            @RequestParam int year) {
        try {
            StatsResponse stats = statsService.computeStats(userId, month, year);
            return ResponseEntity.ok(stats);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/anomalies")
    public ResponseEntity<?> getAnomalies(
            @RequestParam String userId,
            @RequestParam int month,
            @RequestParam int year) {
        try {
            List<AnomalyDto> anomalies = statsService.detectAnomalies(userId, month, year);

            Map<String, Object> response = new HashMap<>();
            response.put("data", anomalies);

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllStats(
            @RequestParam int month,
            @RequestParam int year,
            Authentication authentication) {
        try {
            // Check if user is admin
            boolean isAdmin = authentication.getAuthorities().stream()
                    .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()));

            if (!isAdmin) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Access denied");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
            }

            List<AllStatsResponse> allStats = statsService.getAllStats(month, year);

            Map<String, Object> response = new HashMap<>();
            response.put("data", allStats);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}

