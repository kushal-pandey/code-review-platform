package com.codeplatform.backend.controller;

import com.codeplatform.backend.model.Comment;
import com.codeplatform.backend.model.User;
import com.codeplatform.backend.service.CommentService;
import com.codeplatform.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserService userService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/comment/{snippetId}")
    public void handleComment(@DestinationVariable Long snippetId,
                              @Payload Map<String, Object> payload) {
        Long userId = Long.parseLong(payload.get("userId").toString());
        String content = payload.get("content").toString();
        Integer lineNumber = payload.containsKey("lineNumber") && payload.get("lineNumber") != null
                ? Integer.parseInt(payload.get("lineNumber").toString()) : null;

        User user = userService.getUserById(userId);
        Comment comment = commentService.addComment(snippetId, content, lineNumber, user);
        messagingTemplate.convertAndSend("/topic/snippet/" + snippetId, comment);
    }
}