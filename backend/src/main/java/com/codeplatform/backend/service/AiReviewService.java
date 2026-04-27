package com.codeplatform.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Async;
import com.fasterxml.jackson.databind.JsonNode;

import java.util.List;
import java.util.Map;

@Service
public class AiReviewService {

    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    public AiReviewService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.restTemplate = new RestTemplate();
    }

    @Async
    public void generateReview(Long snippetId, String code, String language) {
        String destination = "/topic/snippets/" + snippetId;

        try {
            // 1. Instantly notify the WebSocket that the AI is typing...
            messagingTemplate.convertAndSend(destination,
                    Map.of("sender", "🤖 CodeBot", "content", "✨ Analyzing your code...", "isAi", true));

            // 2. Build the prompt for the AI
            String prompt = "Act as a Senior Software Engineer. Review the following " + language +
                    " code. Point out any bugs, security issues, and suggest architectural improvements. " +
                    "Keep your response concise and formatted in Markdown.\n\n" + code;

            // 3. Prepare the HTTP request to Gemini
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=" + apiKey;
            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    )
            );

            // 4. Make the API Call
            JsonNode response = restTemplate.postForObject(url, requestBody, JsonNode.class);

            // 5. Extract the AI's text from the nested JSON response
            String aiResponseText = extractTextFromGeminiResponse(response);

            // 6. Push the final review back to the WebSocket!
            messagingTemplate.convertAndSend(destination,
                    Map.of("sender", "🤖 CodeBot", "content", aiResponseText, "isAi", true));

        } catch (Exception e) {
            System.err.println("AI Review Failed: " + e.getMessage());
            messagingTemplate.convertAndSend(destination,
                    Map.of("sender", "🤖 CodeBot", "content", "⚠️ Sorry, my AI circuits encountered an error while reviewing.", "isAi", true));
        }
    }

    // New, much cleaner helper method using Jackson's JsonNode
    private String extractTextFromGeminiResponse(JsonNode response) {
        try {
            // .path() safely navigates the JSON tree.
            // If a node is missing, it won't crash; it just safely returns empty!
            return response.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            System.err.println("JSON Parsing error: " + e.getMessage());
            return "Could not parse AI response.";
        }
    }
}
