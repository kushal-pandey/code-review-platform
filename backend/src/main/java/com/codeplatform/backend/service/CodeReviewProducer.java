package com.codeplatform.backend.service;

import com.codeplatform.backend.config.RabbitMQConfig;
import com.codeplatform.backend.model.CodeReviewMessage;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

@Service
public class CodeReviewProducer {

    private final RabbitTemplate rabbitTemplate;

    // Constructor Injection
    public CodeReviewProducer(RabbitTemplate rabbitTemplate) {
        this.rabbitTemplate = rabbitTemplate;
    }

    public void sendForReview(CodeReviewMessage message) {
        // Drop the payload into the message broker
        rabbitTemplate.convertAndSend(
                RabbitMQConfig.EXCHANGE_NAME,
                RabbitMQConfig.ROUTING_KEY,
                message
        );

        System.out.println("Successfully queued code review for user: " + message.getSnippetId());
    }
}