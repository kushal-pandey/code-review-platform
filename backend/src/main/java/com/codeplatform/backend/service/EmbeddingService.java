package com.codeplatform.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Wraps Gemini's text-embedding-004 model and the vector math needed to
 * turn embeddings into a similarity search. Reuses the same GEMINI_API_KEY
 * already configured for AiReviewService — embeddings are a different
 * endpoint on the same API, not a new vendor integration.
 */
@Slf4j
@Service
public class EmbeddingService {

    private final RestTemplate restTemplate;

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.embedding.url}")
    private String embeddingUrl;

    public EmbeddingService() {
        this.restTemplate = new RestTemplate();
    }

    /** Calls Gemini's embedding model and returns a raw float vector for the given text. */
    public float[] embed(String text) {
        String url = embeddingUrl + "?key=" + apiKey;

        Map<String, Object> requestBody = Map.of(
                "content", Map.of("parts", List.of(Map.of("text", text)))
        );

        JsonNode response = restTemplate.postForObject(url, requestBody, JsonNode.class);
        if (response == null) {
            throw new IllegalStateException("Gemini embedding API returned an empty response body");
        }
        return parseEmbedding(response);
    }

    private float[] parseEmbedding(JsonNode response) {
        JsonNode values = response.path("embedding").path("values");
        float[] vector = new float[values.size()];
        for (int i = 0; i < values.size(); i++) {
            vector[i] = (float) values.get(i).asDouble();
        }
        return vector;
    }

    /** Serializes a vector to a comma-separated string for TEXT storage. */
    public String serialize(float[] vector) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < vector.length; i++) {
            if (i > 0) sb.append(',');
            sb.append(vector[i]);
        }
        return sb.toString();
    }

    /** Deserializes a stored embedding string back into a float vector. */
    public float[] deserialize(String stored) {
        String[] parts = stored.split(",");
        float[] vector = new float[parts.length];
        for (int i = 0; i < parts.length; i++) {
            vector[i] = Float.parseFloat(parts[i]);
        }
        return vector;
    }

    /** Standard cosine similarity between two equal-length vectors. Returns a value in [-1, 1]. */
    public double cosineSimilarity(float[] a, float[] b) {
        double dot = 0.0, normA = 0.0, normB = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }
        if (normA == 0 || normB == 0) return 0.0;
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
    }
}