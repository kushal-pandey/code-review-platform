package com.codeplatform.backend.controller;

import com.codeplatform.backend.model.CodeReviewMessage;
import com.codeplatform.backend.service.CodeReviewProducer;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    private final CodeReviewProducer producer;

    public ReviewController(CodeReviewProducer producer){
        this.producer = producer;
    }

    @PostMapping("/submit")
    public ResponseEntity<String> submitCodeForReview(@RequestBody CodeReviewMessage request){
        producer.sendForReview(request);
        return ResponseEntity.accepted().body("Code submitted for AI review successfully.");
    }
}
