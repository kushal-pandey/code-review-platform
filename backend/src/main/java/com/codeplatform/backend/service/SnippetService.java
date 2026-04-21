package com.codeplatform.backend.service;

import com.codeplatform.backend.model.CodeSnippet;
import com.codeplatform.backend.model.User;
import com.codeplatform.backend.repository.SnippetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    public void deleteSnippet(Long id) {
        snippetRepository.deleteById(id);
    }

    @Transactional
    public void deleteSnippetsBulk(List<Long> ids, Long currentUserId){
        List<CodeSnippet> snippets = snippetRepository.findAllById(ids);
        for(CodeSnippet snippet : snippets){
            if(!snippet.getAuthor().getId().equals(currentUserId)){
                throw new RuntimeException("Unauthorized: You can only delete your own snippets");
            }
        }
        snippetRepository.deleteAll();
    }

}