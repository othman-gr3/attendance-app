package com.attendance.user;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    @Id
    private String id;
    private String nom;
    private String email;
    private String password;
    private String role; // "ROLE_ADMIN" or "ROLE_EMPLOYE"
    private String createdAt; // ISO date string, e.g. "2026-06-01"
    private String profilePic; // Base64 profile picture string
}