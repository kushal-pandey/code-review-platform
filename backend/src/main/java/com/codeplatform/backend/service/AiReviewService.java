package com.codeplatform.backend.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.client.RestTemplate;
import org.springframework.scheduling.annotation.Async;
import com.fasterxml.jackson.databind.JsonNode;
import com.codeplatform.backend.model.Comment;
import com.codeplatform.backend.model.CodeSnippet;

import java.util.List;
import java.util.Map;

@Service
public class AiReviewService {

    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate;
    private final com.codeplatform.backend.repository.SnippetRepository snippetRepository;
    private final com.codeplatform.backend.repository.CommentRepository commentRepository;

    @Value("${gemini.api.key}")
    private String apiKey;

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
        // LOUD LOG: If you don't see this in your terminal, the method isn't being called!
        System.out.println("🚀 AI REVIEW THREAD STARTED: " + Thread.currentThread().getName() + " for snippet " + snippetId);

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
            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + apiKey;

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    )
            );

            // 4. Make the API Call
            JsonNode response = restTemplate.postForObject(url, requestBody, JsonNode.class);
            System.out.println("✅ Received response from Gemini API");

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
            System.out.println("💾 AI Review saved to DB with ID: " + savedComment.getId());


            // 💾 AI Review saved to DB with ID: savedComment.getId()
            // 6. Push the ACTUAL database entity to the WebSocket
            messagingTemplate.convertAndSend(destination, savedComment);

        } catch (Exception e) {
            System.err.println("🔥 AI Review Failed on Thread: " + e.getMessage());
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