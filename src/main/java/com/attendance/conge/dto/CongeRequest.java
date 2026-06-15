package com.attendance.conge.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CongeRequest {
    private String dateDebut;
    private String dateFin;
    private String type; // "annuel", "maladie", "exceptionnel"
}
