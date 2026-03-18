package com.ctse.identity.service;

import com.ctse.identity.dto.AuthResponse;
import com.ctse.identity.dto.LoginRequest;
import com.ctse.identity.dto.RegisterRequest;
import com.ctse.identity.entity.User;
import com.ctse.identity.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthResponse register(RegisterRequest request) {
        return registerWithRole(request, User.Role.USER);
    }

    public AuthResponse registerAdmin(RegisterRequest request) {
        return registerWithRole(request, User.Role.ADMIN);
    }

    private AuthResponse registerWithRole(RegisterRequest request, User.Role role) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already taken");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .build();

        userRepository.save(user);

        String token = generateTokenForUser(user);
        return buildAuthResponse(user, token);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String token = generateTokenForUser(user);
        return buildAuthResponse(user, token);
    }

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public User getUserById(UUID id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    public User updateUser(UUID id, String username, String email) {
        User user = getUserById(id);
        if (username != null && !username.isBlank()) {
            if (!user.getUsername().equals(username) && userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username already taken");
            }
            user.setUsername(username);
        }
        if (email != null && !email.isBlank()) {
            if (!user.getEmail().equals(email) && userRepository.existsByEmail(email)) {
                throw new IllegalArgumentException("Email already registered");
            }
            user.setEmail(email);
        }
        return userRepository.save(user);
    }

    private String generateTokenForUser(User user) {
        Map<String, Object> claims = Map.of(
                "role", user.getRole().name(),
                "email", user.getEmail(),
                "userId", user.getId().toString()
        );
        return jwtService.generateToken(user.getUsername(), claims);
    }

    private AuthResponse buildAuthResponse(User user, String token) {
        return AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole().name())
                .userId(user.getId().toString())
                .expiresIn(jwtService.getExpirationMs())
                .build();
    }
}
