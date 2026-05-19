package com.codeplatform.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${spring.rabbitmq.host:localhost}")
    private String relayHost;

    @Value("${spring.rabbitmq.port:61613}")
    private int relayPort;

    // Replaced your real username with a generic placeholder
    @Value("${RABBITMQ_USER:local_dev_user}")
    private String relayUser;

    // Replaced your real password with a generic placeholder
    @Value("${RABBITMQ_PASS:local_dev_pass}")
    private String relayPass;

    @Value("${spring.rabbitmq.virtual-host:/}")
    private String relayVhost;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableStompBrokerRelay("/topic", "/queue")
                .setRelayHost(relayHost)
                .setRelayPort(relayPort)
                .setClientLogin(relayUser)
                .setClientPasscode(relayPass)
                .setSystemLogin(relayUser)
                .setSystemPasscode(relayPass)
                .setVirtualHost(relayVhost);

        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("https://code-review-platform-brown.vercel.app", "http://localhost:5173")
                .withSockJS();
    }
}