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
            JsonNode response = restTemplate.postForObject(url, requestBody, JsonNode.class);
            log.info("✅ Received response from Gemini API");
            // 5. Extract text
            String aiResponseText = extractTextFromGeminiResponse(response);

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

    private String buildPrompt(String code, String language) {
        return "Act as a Senior Software Engineer. Review the following " + language +
                " code. Point out any bugs, security issues, and suggest architectural improvements. " +
                "Keep your response concise and formatted in Markdown.\n\n" + code;
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
}