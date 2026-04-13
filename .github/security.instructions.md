---
applyTo: "**/*.cs"
description: This file describes the security best practices for C# code in the project.
---

# C# Security Best Practices

## Input Validation
- Always validate and sanitize all user inputs before processing.
- Use allowlists instead of denylists when validating input.
- Avoid trusting data from external sources (HTTP requests, files, databases) without validation.

## SQL Injection Prevention
- Use parameterized queries or prepared statements instead of string concatenation for SQL queries.
- Use an ORM (e.g., Entity Framework) to interact with databases safely.
- Never pass raw user input directly into SQL statements.

## Authentication and Authorization
- Use ASP.NET Core Identity or a proven authentication library instead of implementing custom authentication.
- Enforce the principle of least privilege: grant only the permissions required for each operation.
- Always authenticate and authorize users before granting access to sensitive resources.
- Use `[Authorize]` attributes on controllers/actions that require authentication.

## Sensitive Data Protection
- Never hardcode secrets, passwords, connection strings, or API keys in source code.
- Store sensitive configuration in environment variables or a secrets manager (e.g., Azure Key Vault).
- Use HTTPS/TLS for all network communication.
- Hash passwords using a strong algorithm (e.g., `Rfc2898DeriveBytes` (PBKDF2) or ASP.NET Core Identity's `PasswordHasher`) — never store plaintext passwords.

## Cryptography
- Use well-established cryptographic libraries; do not implement custom cryptographic algorithms.
- Prefer AES-256 for symmetric encryption and RSA-2048 or ECC for asymmetric encryption.
- Always use a cryptographically secure random number generator (`RandomNumberGenerator`) for security-sensitive values.

## Exception Handling
- Do not expose internal error details, stack traces, or sensitive data in error messages returned to users.
- Log exceptions securely on the server side without leaking sensitive information.
- Use global exception handlers to ensure consistent error responses.

## Dependency Management
- Keep all NuGet packages up to date and regularly audit them for known vulnerabilities.
- Remove unused dependencies to reduce the attack surface.

## Logging and Monitoring
- Log security-relevant events (e.g., login attempts, authorization failures, data access).
- Never log sensitive information such as passwords, tokens, or PII.
- Ensure log storage is protected from unauthorized access or tampering.

## Cross-Site Scripting (XSS) Prevention (Web Applications)
- Use Razor's automatic HTML encoding to prevent XSS in ASP.NET Core views.
- Avoid using `Html.Raw()` unless the content is explicitly sanitized.

## Deserialization
- Avoid deserializing data from untrusted sources.
- If deserialization is required, use safe serializers (e.g., `System.Text.Json`) and validate the deserialized object.
- Never use `BinaryFormatter` for untrusted data.
