package com.codeplatform.backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stores a past AI-generated review alongside an embedding of the code it
 * reviewed. Used by {@link com.codeplatform.backend.service.RagRetrievalService}
 * to retrieve similar past reviews as context for new ones (RAG).
 *
 * The embedding is stored as a comma-separated TEXT string rather than a
 * native `vector` column, so this works on any Postgres instance without
 * requiring the pgvector extension. At larger scale, swapping this for
 * pgvector + an ANN index (ivfflat/hnsw) would be the natural next step.
 */
@Entity
@Table(name = "review_knowledge")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewKnowledge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String language;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String codeExcerpt;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String reviewContent;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String embedding;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
