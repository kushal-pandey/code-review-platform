package com.codeplatform.backend.service;

import com.codeplatform.backend.model.ReviewKnowledge;
import com.codeplatform.backend.repository.ReviewKnowledgeRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * The RAG layer for AiReviewService:
 *  1. retrieveSimilarReviewContext() — embeds the incoming code, finds the
 *     most similar past reviews, and returns them formatted as prompt context.
 *  2. storeReviewKnowledge() — saves a freshly generated review so future
 *     lookups can retrieve it. This is what makes the knowledge base grow.

 * Both methods swallow their own exceptions and log a warning instead of
 * throwing. RAG is an enhancement, not a hard dependency — if Gemini's
 * embedding endpoint is down or slow, a review should still generate,
 * just without extra context.
 */
@Slf4j
@Service
public class RagRetrievalService {

    private static final int TOP_K = 3;
    private static final double MIN_SIMILARITY = 0.75; // tune based on observed score distribution
    private static final int MAX_EXCERPT_CHARS = 500;   // keeps injected context (and token cost) small

    private final ReviewKnowledgeRepository reviewKnowledgeRepository;
    private final EmbeddingService embeddingService;

    public RagRetrievalService(ReviewKnowledgeRepository reviewKnowledgeRepository,
                               EmbeddingService embeddingService) {
        this.reviewKnowledgeRepository = reviewKnowledgeRepository;
        this.embeddingService = embeddingService;
    }

    /**
     * Embeds the given code and returns formatted context from the most
     * similar past reviews, or an empty string if nothing relevant is found
     * (including on the very first review ever, when the table is empty).
     */
    public String retrieveSimilarReviewContext(String code) {
        try {
            float[] queryVector = embeddingService.embed(code);
            List<ReviewKnowledge> candidates = reviewKnowledgeRepository.findAll();

            if (candidates.isEmpty()) {
                return "";
            }

            List<ReviewKnowledge> topMatches = candidates.stream()
                    .map(k -> new ScoredMatch(k, embeddingService.cosineSimilarity(
                            queryVector, embeddingService.deserialize(k.getEmbedding()))))
                    .filter(match -> match.score() >= MIN_SIMILARITY)
                    .sorted(Comparator.comparingDouble(ScoredMatch::score).reversed())
                    .limit(TOP_K)
                    .map(ScoredMatch::knowledge)
                    .toList();

            if (topMatches.isEmpty()) {
                return "";
            }

            StringBuilder context = new StringBuilder();
            context.append("For consistency, here is feedback given on similar code reviewed previously:\n\n");
            for (ReviewKnowledge match : topMatches) {
                context.append("- ").append(truncate(match.getReviewContent())).append("\n");
            }
            return context.toString();

        } catch (Exception e) {
            log.warn("⚠️ RAG retrieval failed, continuing without extra context: {}", e.getMessage());
            return "";
        }
    }

    /**
     * Stores a newly generated review as future retrieval context. Called
     * after the review has already been sent to the user, so a slow or
     * failed embedding call never delays the response they're waiting on.
     */
    public void storeReviewKnowledge(String language, String code, String reviewContent) {
        try {
            float[] vector = embeddingService.embed(code);

            ReviewKnowledge knowledge = ReviewKnowledge.builder()
                    .language(language)
                    .codeExcerpt(truncate(code))
                    .reviewContent(reviewContent)
                    .embedding(embeddingService.serialize(vector))
                    .build();

            ReviewKnowledge saved = reviewKnowledgeRepository.save(knowledge);
            log.info("📚 Stored new review knowledge entry with ID: {}", saved.getId());

        } catch (Exception e) {
            log.warn("⚠️ Failed to store review knowledge, skipping: {}", e.getMessage());
        }
    }

    private String truncate(String text) {
        if (text == null) return "";
        return text.length() <= MAX_EXCERPT_CHARS ? text : text.substring(0, MAX_EXCERPT_CHARS) + "...";
    }

    private record ScoredMatch(ReviewKnowledge knowledge, double score) {}
}
