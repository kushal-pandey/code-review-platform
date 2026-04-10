package com.codeplatform.backend.repository;

import com.codeplatform.backend.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findBySnippetIdOrderByCreatedAtAsc(Long snippetId);
}