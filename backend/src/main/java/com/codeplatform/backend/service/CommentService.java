package com.codeplatform.backend.service;

import com.codeplatform.backend.model.Comment;
import com.codeplatform.backend.model.CodeSnippet;
import com.codeplatform.backend.model.User;
import com.codeplatform.backend.repository.CommentRepository;
import com.codeplatform.backend.repository.SnippetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final SnippetRepository snippetRepository;

    public Comment addComment(Long snippetId, String content, Integer lineNumber, User author) {
        CodeSnippet snippet = snippetRepository.findById(snippetId)
                .orElseThrow(() -> new RuntimeException("Snippet not found: " + snippetId));
        Comment comment = Comment.builder()
                .snippet(snippet)
                .content(content)
                .lineNumber(lineNumber)
                .author(author)
                .build();
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsBySnippetId(Long snippetId) {
        return commentRepository.findBySnippetIdOrderByCreatedAtAsc(snippetId);
    }
}