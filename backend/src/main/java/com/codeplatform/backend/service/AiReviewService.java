package com.codeplatform.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Async;
import com.fasterxml.jackson.databind.JsonNode;
import com.codeplatform.backend.model.Comment;
import com.codeplatform.backend.model.CodeSnippet;
import lombok.extern.slf4j.Slf4j;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiReviewService {

    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate;
    private final com.codeplatform.backend.repository.SnippetRepository snippetRepository;
    private final com.codeplatform.backend.repository.CommentRepository commentRepository;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${groq.api.key}")
    private String groqApiKey;

    @Value("${gemini.api.url}") // Add this field
    private String apiUrl;

    public AiReviewService(SimpMessagingTemplate messagingTemplate,
                           com.codeplatform.backend.repository.SnippetRepository snippetRepository,
                           com.codeplatform.backend.repository.CommentRepository commentRepository) {
        this.messagingTemplate = messagingTemplate;
        this.snippetRepository = snippetRepository;
        this.commentRepository = commentRepository;
        this.restTemplate = new RestTemplate();
    }

    @Async("taskExecutor") // Explicitly link to the executor we named in AsyncConfig
    public void generateReview(Long snippetId, String code, String language) {

        log.info("🚀 AI REVIEW THREAD STARTED: {} for snippet {}", Thread.currentThread().getName(), snippetId);

        String destination = "/topic/snippets/" + snippetId;

        try {

            Thread.sleep(500);
            // 1. Instantly notify the WebSocket that the AI is typing...
            messagingTemplate.convertAndSend(destination,
                    Map.of("sender", "🤖 CodeBot", "content", "✨ Analyzing your code...", "isAi", true));

            // 2. Build the prompt
            String prompt = "Act as a Senior Software Engineer. Review the following " + language +
                    " code. Point out any bugs, security issues, and suggest architectural improvements. " +
                    "Keep your response concise and formatted in Markdown.\n\n" + code;

            // 3. Prepare the HTTP request (Using the April 2026 confirmed model)
            String url = apiUrl + "?key=" + apiKey;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    )
            );

            // 4. Make the API Call
            // 4 & 5. Make the API Call with a Circuit Breaker (Fallback)
            String aiResponseText;
            try {
                JsonNode response = restTemplate.postForObject(url, requestBody, JsonNode.class);
                log.info("✅ Received response from Gemini API");
                aiResponseText = extractTextFromGeminiResponse(response);
            } catch (org.springframework.web.client.HttpStatusCodeException e) {
                // If Gemini is overloaded (503) or rate-limited (429), trigger Groq
                if (e.getStatusCode().value() == 503 || e.getStatusCode().value() == 429) {
                    log.warn("⚠️ Gemini overloaded (Status: {}). Firing fallback to Groq...", e.getStatusCode().value());
                    aiResponseText = callGroqFallback(prompt);
                } else {
                    // If it's a different HTTP error (like a 401 Unauthorized), let it fail normally
                    throw e;
                }
            }

            CodeSnippet snippet = snippetRepository.findById(snippetId)
                    .orElseThrow(() -> new RuntimeException("Snippet not found"));

            Comment aiComment = new Comment();
            aiComment.setContent(aiResponseText);
            aiComment.setSnippet(snippet);
            aiComment.setIsAi(true);
            aiComment.setSender("🤖 CodeBot");

            com.codeplatform.backend.model.Comment savedComment = commentRepository.save(aiComment);
            log.info("💾 AI Review saved to DB with ID: {}", savedComment.getId());

            // 💾 AI Review saved to DB with ID: savedComment.getId()
            // 6. Push the ACTUAL database entity to the WebSocket
            messagingTemplate.convertAndSend(destination, savedComment);

        } catch (Exception e) {
            log.error("🔥 AI Review Failed on Thread: {}", e.getMessage(), e);
            messagingTemplate.convertAndSend(destination,
                    Map.of("sender", "🤖 CodeBot", "content", "⚠️ Sorry, my AI circuits encountered an error. Status: " + e.getMessage(), "isAi", true));
        }


    }

    private String extractTextFromGeminiResponse(JsonNode response) {
        try {
            if (response == null || response.path("candidates").isEmpty()) {
                return "AI returned an empty response. Check API quota/status.";
            }
            return response.path("candidates")
                    .get(0)
                    .path("content")
                    .path("parts")
                    .get(0)
                    .path("text")
                    .asText();
        } catch (Exception e) {
            return "JSON Parsing error: " + e.getMessage();
        }
    }

    private String callGroqFallback(String prompt) {
        String groqUrl = "https://api.groq.com/openai/v1/chat/completions";

        // 1. Get the pre-built entity from our new helper method
        org.springframework.http.HttpEntity<String> entity = buildGroqRequestEntity(prompt);

        // 2. Make the POST request to Groq
        JsonNode response = restTemplate.postForObject(groqUrl, entity, JsonNode.class);
        log.info("✅ Received response from Groq API Fallback");

        return extractTextFromGroqResponse(response);
    }

    private org.springframework.http.HttpEntity<String> buildGroqRequestEntity(String prompt) {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
        headers.setBearerAuth(groqApiKey);

        // Safely escape the prompt for JSON injection
        String safePrompt = prompt.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n");

        // Groq expects the standard OpenAI payload structure
        String requestBody = """
            {
              "model": "llama3-8b-8192",
              "messages": [
                {
                  "role": "system",
                  "content": "You are a senior software engineer conducting a code review. Return your suggestions formatted in Markdown with triple backtick code blocks so the user can easily apply them."
                },
                {
                  "role": "user",
                  "content": "%s"
                }
              ]
            }
            """.formatted(safePrompt);

        return new org.springframework.http.HttpEntity<>(requestBody, headers);
    }

    private String extractTextFromGroqResponse(JsonNode response) {
        try {
            if (response == null || response.path("choices").isEmpty()) {
                return "Groq Fallback returned an empty response.";
            }
            // Groq uses OpenAI's JSON format: choices[0].message.content
            return response.path("choices")
                    .get(0)
                    .path("message")
                    .path("content")
                    .asText();
        } catch (Exception e) {
            return "Groq JSON Parsing error: " + e.getMessage();
        }
    }
}