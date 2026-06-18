package com.attendance.notification;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    private String id;
    private String userId;
    private String title;
    private String message;
    private String date; // "yyyy-MM-dd"
    private boolean read;

    // Justification details
    private String anomalyDate; // Date of the specific absence (yyyy-MM-dd)
    private String justificationStatus; // "PENDING", "JUSTIFIED", "APPROVED", "REJECTED"
    private String responseMessage; // Text written by employee
    private String responseAttachment; // Base64 data string
    private String responseAttachmentName; // Filename
    private String responseAttachmentType; // Mime type (e.g. image/png)
}
