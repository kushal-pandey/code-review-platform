package com.codeplatform.backend.repository;

import com.codeplatform.backend.model.CodeSnippet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SnippetRepository extends JpaRepository<CodeSnippet, Long> {
    List<CodeSnippet> findAllByOrderByCreatedAtDesc();
}