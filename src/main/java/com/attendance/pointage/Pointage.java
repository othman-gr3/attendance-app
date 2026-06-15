package com.attendance.pointage;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Document(collection = "pointages")
public class Pointage {

    @Id
    private String id;

    private String userId;
    private String date;       // "2026-06-13"
    private String heure;      // "08:30"
    private String type;       // "entree" | "sortie"
    private Double latitude;
    private Double longitude;
    private Boolean valide;
}