package com.codeplatform.backend.service;

import com.codeplatform.backend.model.CodeSnippet;
import com.codeplatform.backend.model.User;
import com.codeplatform.backend.repository.SnippetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class SnippetService {

    private final SnippetRepository snippetRepository;

    public List<CodeSnippet> getAllSnippets() {
        return snippetRepository.findAllByOrderByCreatedAtDesc();
    }

    public CodeSnippet getSnippetById(Long id) {
        return snippetRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Snippet not found: " + id));
    }

    public CodeSnippet createSnippet(String title, String code, String language, User author) {
        CodeSnippet snippet = CodeSnippet.builder()
                .title(title)
                .code(code)
                .language(language)
                .author(author)
                .build();
        return snippetRepository.save(snippet);
    }
}