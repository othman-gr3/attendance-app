package com.attendance.stats.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnomalyDto {
    private String date; // "yyyy-MM-dd"
    private String type; // "absence", "retard", "sortie_anticipee", "insuffisance"
    private String detail; // description of the anomaly
}

