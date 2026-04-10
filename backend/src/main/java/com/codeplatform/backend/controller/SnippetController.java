package com.codeplatform.backend.controller;

import com.codeplatform.backend.model.CodeSnippet;
import com.codeplatform.backend.model.User;
import com.codeplatform.backend.service.SnippetService;
import com.codeplatform.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/snippets")
@RequiredArgsConstructor
public class SnippetController {

    private final SnippetService snippetService;
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<CodeSnippet>> getAllSnippets() {
        return ResponseEntity.ok(snippetService.getAllSnippets());
    }

    @GetMapping("/{id}")
    public ResponseEntity<CodeSnippet> getSnippet(@PathVariable Long id) {
        return ResponseEntity.ok(snippetService.getSnippetById(id));
    }

    @PostMapping
    public ResponseEntity<CodeSnippet> createSnippet(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userService.getUserById(Long.parseLong(userDetails.getUsername()));
        CodeSnippet snippet = snippetService.createSnippet(
                body.get("title"),
                body.get("code"),
                body.get("language"),
                user
        );
        return ResponseEntity.ok(snippet);
    }
}