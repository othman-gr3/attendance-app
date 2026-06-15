package com.attendance.stats.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatsResponse {
    private double heuresTravaillees;
    private int retards;
    private int absences;
    private int congesRestants;
    private double tauxPresence; // percentage, 1 decimal place
}

