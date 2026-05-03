package com.codeplatform.backend.model;

import java.io.Serializable;
import java.io.Serial;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data // Generates all Getters, Setters, toString, equals, and hashCode
@NoArgsConstructor // Generates the empty constructor
@AllArgsConstructor // Generates the constructor with all fields
public class CodeReviewMessage implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private Long snippetId;
    private String codeSnippet;
    private String language;
}