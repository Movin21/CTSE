package com.ctse.identity.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String username;
    private String email;
    private String role;
    private String userId;
    private long expiresIn;
}
