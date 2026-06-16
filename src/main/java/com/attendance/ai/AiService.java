package com.attendance.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;

@Service
public class AiService {

    @Value("${openrouter.api.key}")
    private String apiKey;

    private final WebClient webClient = WebClient.builder()
            .baseUrl("https://openrouter.ai/api/v1")
            .build();

    public String generateReminderMessage(String nom, String email, int absenceDays) {
        String prompt = String.format(
                "You are an HR assistant. Write a professional, warm and friendly " +
                        "absence reminder message for an employee named %s (email: %s) " +
                        "who has been absent for %d day(s). " +
                        "Keep it under 5 sentences. Do not use placeholders. " +
                        "Write in English. Start directly with 'Hi %s,'.",
                nom, email, absenceDays, nom
        );

        Map<String, Object> requestBody = Map.of(
                "model", "nvidia/llama-nemotron-rerank-vl-1b-v2:free",
                "max_tokens", 300,
                "messages", List.of(
                        Map.of("role", "user", "content", prompt)
                )
        );

        try {
            Map response = webClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("HTTP-Referer", "http://localhost:3000")
                    .header("X-Title", "Attendance App")
                    .bodyValue(requestBody)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            List<Map<String, Object>> choices =
                    (List<Map<String, Object>>) response.get("choices");
            Map<String, Object> message =
                    (Map<String, Object>) choices.get(0).get("message");
            return (String) message.get("content");

        } catch (Exception e) {
            System.out.println("AI error: " + e.getMessage());
            return "Hi " + nom + ", we noticed you were absent. " +
                    "Please let us know if everything is okay. Thank you.";
        }
    }
}