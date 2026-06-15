package com.attendance.conge;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "conges")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Conge {
    @Id
    private String id;
    private String userId;
    private String dateDebut;
    private String dateFin;
    private String type; // "annuel", "maladie", "exceptionnel"
    private String statut; // "en_attente", "valide", "refuse"
}
