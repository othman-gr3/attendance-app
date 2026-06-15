package com.attendance.stats.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AllStatsResponse {
    private String userId;
    private String nom;
    private String email;
    private double heuresTravaillees;
    private int retards;
    private int absences;
    private int congesRestants;
    private double tauxPresence;
}

