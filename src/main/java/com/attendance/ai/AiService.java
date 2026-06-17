package com.attendance.ai;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

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
    public String chat(List<Map<String, String>> messages, String systemPrompt) {
        List<Map<String, Object>> formattedMessages = new ArrayList<>();

        formattedMessages.add(Map.of(
                "role", "user",
                "content", "System instructions: " + systemPrompt
        ));
        formattedMessages.add(Map.of(
                "role", "assistant",
                "content", "Understood. I will follow these instructions."
        ));

        for (int i = 1; i < messages.size(); i++) {
            Map<String, String> msg = messages.get(i);
            formattedMessages.add(Map.of(
                    "role", msg.get("role"),
                    "content", msg.get("content")
            ));
        }

        Map<String, Object> requestBody = Map.of(
                "model", "nex-agi/nex-n2-pro:free",
                "max_tokens", 500,
                "messages", formattedMessages
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
            String errorBody = "";
            if (e instanceof org.springframework.web.reactive.function.client.WebClientResponseException) {
                errorBody = ((org.springframework.web.reactive.function.client.WebClientResponseException) e).getResponseBodyAsString();
            }
            System.out.println("Chat AI error FULL: " + e.getMessage());
            System.out.println("Error body: " + errorBody);
            return "Sorry, I'm having trouble connecting. Please try again.";
        }
    }
}