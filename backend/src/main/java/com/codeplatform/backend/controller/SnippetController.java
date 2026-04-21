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

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSnippet(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {

        Long currentUserId = Long.parseLong(userDetails.getUsername());

        // 1. Fetch the snippet first to check ownership
        CodeSnippet snippet = snippetService.getSnippetById(id);

        // 2. Security Check: Does the logged-in user own this snippet?
        if (!snippet.getAuthor().getId().equals(currentUserId)) {
            return ResponseEntity.status(403).body("You can only delete your own snippets.");
        }

        // 3. If they own it, delete it
        snippetService.deleteSnippet(id);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/batch")
    public ResponseEntity<?> deleteBulkSnippets(
            @RequestParam List<Long> ids,
            @AuthenticationPrincipal UserDetails userDetails){

        Long currentUserId = Long.parseLong(userDetails.getUsername());

        try{
            snippetService.deleteSnippetsBulk(ids, currentUserId);
            return ResponseEntity.ok().build();
        } catch (Exception e){
            return ResponseEntity.status(403).body(e.getMessage());
        }
    }

}