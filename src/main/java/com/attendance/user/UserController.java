package com.attendance.user;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email)
                .map(user -> ResponseEntity.ok(Map.of(
                        "id", user.getId(),
                        "nom", user.getNom(),
                        "email", user.getEmail(),
                        "role", user.getRole(),
                        "createdAt", user.getCreatedAt() != null ? user.getCreatedAt() : "",
                        "profilePic", user.getProfilePic() != null ? user.getProfilePic() : ""
                )))
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/me/profile-pic")
    public ResponseEntity<?> updateProfilePic(@RequestBody Map<String, String> body,
                                              Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        String profilePic = body.get("profilePic");
        user.setProfilePic(profilePic);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile picture updated", "profilePic", profilePic != null ? profilePic : ""));
    }

    @DeleteMapping("/me/profile-pic")
    public ResponseEntity<?> deleteProfilePic(Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        user.setProfilePic(null);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Profile picture deleted"));
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                            Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElse(null);
        if (user == null) return ResponseEntity.status(404).body(Map.of("error", "User not found"));

        String oldPassword = body.get("oldPassword");
        String newPassword = body.get("newPassword");

        if (oldPassword == null || newPassword == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Missing fields"));
        }
        if (!passwordEncoder.matches(oldPassword, user.getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Current password incorrect"));
        }
        if (newPassword.length() < 6) {
            return ResponseEntity.badRequest().body(Map.of("error", "The new password must be at least 6 characters"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id,
                                        @RequestBody Map<String, String> body) {
        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(404).body(Map.of("error", "User not found"));
        }

        String nom = body.get("nom");
        String email = body.get("email");
        String role = body.get("role");
        String password = body.get("password");
        String profilePic = body.get("profilePic");

        if (nom != null) user.setNom(nom);
        if (email != null) {
            if (!email.equals(user.getEmail()) && userRepository.existsByEmail(email)) {
                return ResponseEntity.badRequest().body(Map.of("error", "Email already in use"));
            }
            user.setEmail(email);
        }
        if (role != null) user.setRole(role);
        if (password != null && !password.trim().isEmpty()) {
            if (password.length() < 6) {
                return ResponseEntity.badRequest().body(Map.of("error", "Password must be at least 6 characters"));
            }
            user.setPassword(passwordEncoder.encode(password));
        }
        if (profilePic != null) {
            user.setProfilePic(profilePic.trim().isEmpty() ? null : profilePic);
        }

        userRepository.save(user);
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable String id) {
        return userRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable String id,
                                        Authentication authentication) {
        if (!userRepository.existsById(id)) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "User not found"));
        }
        userRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "User deleted"));
    }
}