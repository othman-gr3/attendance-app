package com.attendance.conge;

import com.attendance.conge.dto.CongeRequest;
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
@RequestMapping("/api/conge")
public class CongeController {
    @Autowired
    private CongeService congeService;

    @PostMapping
    public ResponseEntity<?> createConge(@RequestBody CongeRequest request, Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Conge conge = congeService.createConge(request, userEmail);

            Map<String, Object> response = new HashMap<>();
            response.put("message", "Demande envoyee");
            response.put("congeId", conge.getId());

            return ResponseEntity.status(HttpStatus.CREATED).body(response);
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

    @PutMapping("/{id}")
    public ResponseEntity<?> updateCongeStatut(@PathVariable String id, @RequestBody Map<String, String> body) {
        try {
            String newStatut = body.get("statut");
            if (newStatut == null || newStatut.trim().isEmpty()) {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Statut is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
            }

            congeService.updateCongeStatut(id, newStatut);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Statut mis a jour");

            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyConges(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            List<Conge> conges = congeService.getCongesForUser(userEmail);

            Map<String, Object> response = new HashMap<>();
            response.put("data", conges);

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

    @GetMapping
    public ResponseEntity<?> getAllConges() {
        try {
            List<Conge> conges = congeService.getAllConges();

            Map<String, Object> response = new HashMap<>();
            response.put("data", conges);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "An error occurred");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
        }
    }
}


