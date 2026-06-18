package com.attendance.pointage;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.UUID;

@Service
public class QRCodeService {

    // Le code QR du jour (tourne toutes les heures)
    private String currentCode = generateNewCode();
    private LocalDateTime codeGeneratedAt = LocalDateTime.now();

    public String getCurrentCode() {
        // Rotation automatique toutes les 30 secondes
        if (LocalDateTime.now().isAfter(codeGeneratedAt.plusSeconds(30))) {
            currentCode = generateNewCode();
            codeGeneratedAt = LocalDateTime.now();
        }
        return currentCode;
    }

    public boolean validateCode(String code) {
        return currentCode.equals(code);
    }

    private String generateNewCode() {
        return UUID.randomUUID().toString();
    }

    public String generateQRImage(String text) throws WriterException, IOException {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, 300, 300);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(matrix, "PNG", out);

        return Base64.getEncoder().encodeToString(out.toByteArray());
    }
}