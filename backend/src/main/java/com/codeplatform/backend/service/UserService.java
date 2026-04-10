package com.codeplatform.backend.service;

import com.codeplatform.backend.model.User;
import com.codeplatform.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public User findOrCreateUser(String githubId, String username, String email, String avatarUrl) {
        return userRepository.findByGithubId(githubId).orElseGet(() -> {
            User newUser = User.builder()
                    .githubId(githubId)
                    .username(username)
                    .email(email)
                    .avatarUrl(avatarUrl)
                    .build();
            return userRepository.save(newUser);
        });
    }

    public UserDetails loadUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + id));
        return new org.springframework.security.core.userdetails.User(
                String.valueOf(user.getId()), "", new ArrayList<>());
    }

    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }
}