package com.attendance.notification;

import com.attendance.user.User;
import com.attendance.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping
    public ResponseEntity<?> getAllNotifications(@RequestParam(required = false) String status) {
        try {
            List<Notification> list;
            if (status != null && !status.isBlank()) {
                list = notificationRepository.findByJustificationStatus(status);
            } else {
                list = notificationRepository.findAll();
            }
            return ResponseEntity.ok(Map.of("data", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMyNotifications(Authentication authentication) {
        try {
            String userEmail = authentication.getName();
            Optional<User> userOpt = userRepository.findByEmail(userEmail);
            if (userOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
            }
            List<Notification> list = notificationRepository.findByUserId(userOpt.get().getId());
            return ResponseEntity.ok(Map.of("data", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/by-user/{userId}")
    public ResponseEntity<?> getNotificationsByUser(@PathVariable String userId) {
        try {
            List<Notification> list = notificationRepository.findByUserId(userId);
            return ResponseEntity.ok(Map.of("data", list));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            String title = body.get("title");
            String message = body.get("message");
            String anomalyDate = body.get("anomalyDate");

            Notification notification = new Notification();
            notification.setUserId(userId);
            notification.setTitle(title != null ? title : "Absence Reminder");
            notification.setMessage(message);
            notification.setDate(LocalDate.now().toString());
            notification.setRead(false);

            if (anomalyDate != null && !anomalyDate.isBlank()) {
                notification.setAnomalyDate(anomalyDate);
                notification.setJustificationStatus("PENDING");
            }

            Notification saved = notificationRepository.save(notification);
            return ResponseEntity.status(HttpStatus.CREATED).body(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/respond")
    public ResponseEntity<?> respondToNotification(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        try {
            Optional<Notification> notifOpt = notificationRepository.findById(id);
            if (notifOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Notification not found"));
            }

            Notification notification = notifOpt.get();
            
            // 1. Check 72h / 3 days limit
            if (notification.getDate() != null) {
                try {
                    LocalDate creationDate = LocalDate.parse(notification.getDate());
                    if (LocalDate.now().isAfter(creationDate.plusDays(3))) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "The 72-hour justification window for this absence has expired."));
                    }
                } catch (Exception dateEx) {
                    // Ignore date parsing exception if date format is invalid
                }
            }

            String message = body.get("responseMessage");
            String attachment = body.get("responseAttachment"); // Base64 data
            String attachmentName = body.get("responseAttachmentName");
            String attachmentType = body.get("responseAttachmentType");

            // 2. Validate attachment if present
            if (attachment != null && !attachment.isBlank()) {
                String base64Data = attachment;
                if (attachment.contains(",")) {
                    base64Data = attachment.substring(attachment.indexOf(",") + 1);
                }
                long sizeInBytes = (base64Data.length() * 3) / 4;
                if (sizeInBytes > 2 * 1024 * 1024) {
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body(Map.of("error", "The justification file size must not exceed 2 MB."));
                }

                if (attachmentType != null) {
                    String mime = attachmentType.toLowerCase();
                    if (!mime.startsWith("image/") && !mime.equals("application/pdf")) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                                .body(Map.of("error", "Unsupported file format. Only images (JPEG, PNG, WEBP) and PDFs are allowed."));
                    }
                }
            }

            notification.setResponseMessage(message);
            notification.setResponseAttachment(attachment);
            notification.setResponseAttachmentName(attachmentName);
            notification.setResponseAttachmentType(attachmentType);
            notification.setJustificationStatus("JUSTIFIED");

            Notification saved = notificationRepository.save(notification);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<?> approveJustification(@PathVariable String id) {
        try {
            Optional<Notification> notifOpt = notificationRepository.findById(id);
            if (notifOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Notification not found"));
            }

            Notification notification = notifOpt.get();
            notification.setJustificationStatus("APPROVED");

            Notification saved = notificationRepository.save(notification);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<?> rejectJustification(@PathVariable String id) {
        try {
            Optional<Notification> notifOpt = notificationRepository.findById(id);
            if (notifOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Notification not found"));
            }

            Notification notification = notifOpt.get();
            notification.setJustificationStatus("REJECTED");

            Notification saved = notificationRepository.save(notification);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/direct-approve")
    public ResponseEntity<?> directApprove(@RequestBody Map<String, String> body) {
        try {
            String userId = body.get("userId");
            String anomalyDate = body.get("anomalyDate");

            if (userId == null || userId.isBlank() || anomalyDate == null || anomalyDate.isBlank()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "userId and anomalyDate are required"));
            }

            // Look if notification already exists for this date and user
            List<Notification> existing = notificationRepository.findByUserId(userId);
            Notification notification = existing.stream()
                    .filter(n -> anomalyDate.equals(n.getAnomalyDate()))
                    .findFirst()
                    .orElse(null);

            if (notification == null) {
                notification = new Notification();
                notification.setUserId(userId);
                notification.setTitle("Absence Justified (Admin)");
                notification.setMessage("Justified directly by the administrator");
                notification.setDate(LocalDate.now().toString());
                notification.setRead(true);
                notification.setAnomalyDate(anomalyDate);
            }

            notification.setJustificationStatus("APPROVED");
            notification.setResponseMessage("Justified directly by the administrator");

            Notification saved = notificationRepository.save(notification);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        try {
            Optional<Notification> notifOpt = notificationRepository.findById(id);
            if (notifOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Notification not found"));
            }
            Notification notification = notifOpt.get();
            notification.setRead(true);
            notificationRepository.save(notification);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
