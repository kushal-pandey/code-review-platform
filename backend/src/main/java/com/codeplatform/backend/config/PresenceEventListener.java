package com.codeplatform.backend.config;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class PresenceEventListener {

    private final SimpMessagingTemplate messagingTemplate;

    // Tracks the total count per topic (e.g., /topic/snippets/123 -> 5)
    private final ConcurrentHashMap<String, AtomicInteger> topicCounts = new ConcurrentHashMap<>();

    // Maps a user's unique WebSocket session to the topic they are viewing
    private final ConcurrentHashMap<String, String> sessionTopics = new ConcurrentHashMap<>();

    public PresenceEventListener(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        SimpMessageHeaderAccessor headers = SimpMessageHeaderAccessor.wrap(event.getMessage());
        String destination = headers.getDestination();
        String sessionId = headers.getSessionId();

        if (sessionId != null && destination != null && destination.startsWith("/topic/snippets/")) {
            sessionTopics.put(sessionId, destination);
            int count = topicCounts.computeIfAbsent(destination, k -> new AtomicInteger(0)).incrementAndGet();

            messagingTemplate.convertAndSend(destination + "/presence", count);
        }


    }

    @EventListener
    public void handleDisconnect(SessionDisconnectEvent event) {
        String sessionId = event.getSessionId();
        String destination = sessionTopics.remove(sessionId);




        // If they were viewing a snippet, decrement and broadcast
        if (destination != null) {
            AtomicInteger counter = topicCounts.get(destination);
            if (counter != null) {
                int count = counter.decrementAndGet();
                messagingTemplate.convertAndSend(destination + "/presence", count);
            }
        }
    }
}
