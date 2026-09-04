package com.codeplatform.backend.repository;

import com.codeplatform.backend.model.ReviewKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

/**
 * Small-dataset assumption: {@link #findAll()} loads every stored review
 * into memory so RagRetrievalService can rank them by similarity in Java.
 * Fine for a portfolio-scale table (hundreds/low thousands of rows). If
 * this table grows large, switch to a pgvector column + a native
 * `ORDER BY embedding <=> :queryVector LIMIT k` query instead.
 */
public interface ReviewKnowledgeRepository extends JpaRepository<ReviewKnowledge, Long> {
    List<ReviewKnowledge> findAll();
}
