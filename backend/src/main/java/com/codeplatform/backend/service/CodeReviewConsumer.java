package com.codeplatform.backend.service;

import com.codeplatform.backend.config.RabbitMQConfig;
import com.codeplatform.backend.model.CodeReviewMessage;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodeReviewConsumer {

    private final AiReviewService aiReviewService;

    @RabbitListener(queues = RabbitMQConfig.QUEUE_NAME)
    public void consumeReviewRequest(CodeReviewMessage message) {
        log.info("📥 RabbitMQ: Received review request for user: {}", message.getSnippetId());

        try {


            aiReviewService.generateReview(
                    message.getSnippetId(),
                    message.getCodeSnippet(),
                    message.getLanguage()
            );


        }  catch (Exception e) {
            log.error("❌ Error processing code review queue: {}", e.getMessage());
        }
    }
}