# Frontend API Integration Guide

This document is designed for frontend coding agents to quickly understand and implement the `WebUIFixer` API. It covers the base URL, authentication flow, error handling, rate limits, and a complete list of endpoints including request bodies and response formats.

## 1. Base Configuration
- **Base URL:** `https://webuifixer.onrender.com` (Production) or `http://localhost:3000` (Development). Most API endpoints are prefixed with `/api`.
- **Format:** All requests and responses use JSON `application/json` (except for file uploads).
- **Response Structure (General):**
  ```json
  {
    "message": "Optional success message",
    "error": "Optional error string"
  }
  ```
  Validation errors from express-validator may return a 400 status with an `errors` array:
  ```json
  {
    "errors": [ { "msg": "Field error", "param": "fieldName" } ]
  }
  ```

## 2. Authentication (`/api/auth`)
- **Method:** JWT Token via `Authorization: Bearer <token>` header.
- **Persistence:** Tokens last 24 hours. The frontend should store `token` and `refreshToken` and use `/api/auth/refresh` when the main token expires.

### Endpoints
- **`POST /api/auth/register`**
  - **Body:** `{ "name", "email", "password" }`
  - **201:** `{ "message": "User registered", "user": { ... } }`
  - **400:** `{ "error": "User already exists" }` or Validation Errors
  - **500:** `{ "error": "Registration failed" }`
- **`POST /api/auth/login`**
  - **Body:** `{ "email", "password" }`
  - **200:** `{ "message": "Login successful", "token": "...", "refreshToken": "..." }`
  - **401:** `{ "error": "Invalid credentials" }`
  - **403:** `{ "error": "Account is suspended. Contact support." }`
- **`POST /api/auth/logout`** *(Requires Auth)*
  - **200:** `{ "message": "Logged out successfully" }`
- **`POST /api/auth/forgot-password`**
  - **Body:** `{ "email" }`
  - **200:** `{ "message": "If email exists, password reset OTP has been sent" }`
- **`POST /api/auth/reset-password`**
  - **Body:** `{ "email", "otp", "newPassword" }`
  - **200:** `{ "message": "Password reset successfully" }`
  - **400:** `{ "error": "Invalid or expired OTP" }`
- **`POST /api/auth/verify-email`**
  - **Body:** `{ "email", "code" }`
  - **200:** `{ "message": "Email verified successfully" }`
  - **400:** `{ "error": "Invalid or expired verification code" }`
- **`POST /api/auth/refresh`**
  - **Body:** `{ "refreshToken" }`
  - **200:** `{ "token": "..." }`
  - **401:** `{ "error": "Invalid or expired refresh token" }`

## 3. Core Audit Endpoints
- **`GET /audit?url=<url>&ai=<true|false>`** *(Requires Auth)* - **NOTE: NOT PREFIXED WITH /api**
  - **200:** `{ "id": "...", "url": "...", "summary": { ... }, "issues": [ ... ], "fixedHtml": "...", "styleOverlay": "...", "duration": 123 }`
  - **400:** `{ "error": "Invalid URL" }`
  - **502/504:** AI engine errors
- **`GET /api/audit/:id/report/pdf`** *(Requires Auth)*
  - **200:** Downloads a PDF file `application/pdf`
  - **403/404:** `{ "error": "Forbidden" }` or `{ "error": "Audit not found" }`
- **`GET /api/audit/:id/report/html`** *(Requires Auth)*
  - **200:** Returns raw HTML text `text/html`
  - **403/404:** Error payload
- **`DELETE /api/audit/:id`** *(Requires Auth)*
  - **200:** `{ "message": "Audit deleted" }`
- **`PATCH /api/audit/:id/suggestions/:ruleId/accept`** *(Requires Auth)*
  - **200:** Updated audit object or `{ "error": "Suggestion not found" }`
- **`PATCH /api/audit/:id/suggestions/:ruleId/reject`** *(Requires Auth)*
  - **200:** Updated audit object or `{ "error": "Suggestion not found" }`

## 4. User Management (`/api/user`)
- **`GET /api/user/profile`** *(Requires Auth)*
  - **200:** `{ "_id", "name", "email", "role", "profile", "isActive", ... }`
- **`PUT /api/user/profile`** *(Requires Auth)*
  - **Body:** `{ "name", "profile": { "bio", "website" } }`
  - **200:** `{ "message": "Profile updated", "user": { ... } }`
- **`PUT /api/user/change-password`** *(Requires Auth)*
  - **Body:** `{ "oldPassword", "newPassword" }`
  - **200:** `{ "message": "Password changed successfully" }`
  - **401:** `{ "error": "Current password is incorrect" }`
- **`GET /api/user/audits?page=1&limit=10`** *(Requires Auth)*
  - **200:** Returns audit data payload (e.g. `{ "audits": [ ... ], "total": X, "page": 1, "totalPages": Y }`)
- **`DELETE /api/user/account`** *(Requires Auth)*
  - **Body:** `{ "password" }`
  - **200:** `{ "message": "Account deleted permanently" }`
  - **401:** `{ "error": "Password is incorrect" }`
- **`GET /api/user/admin/users`** *(Requires Auth, Admin only)*
  - **200:** `[ { ...user data... } ]`

## 5. Recommendations (`/api/recommendations`)
- **`GET /api/recommendations/:auditId`** *(Requires Auth)*
  - **200:** `{ "auditId": "...", "recommendations": [ ... ] }`
  - **403/404:** `{ "error": "Forbidden" }` or `{ "error": "Audit not found" }`

## 6. Marketplace (`/api/marketplace`)
- **`POST /api/marketplace/upload`** *(Requires Auth)*
  - **Headers:** `Content-Type: multipart/form-data`
  - **Fields:** `title`, `url`, `price`, `category`, `description`
  - **Files:** `file` (ZIP, max 10MB), `image` (PNG/JPEG/WebP)
  - **201:** `{ "message": "Template approved and listed!", "template": { ... } }` (If score >= 80)
  - **200:** `{ "message": "Template rejected due to low score. See issues for details.", "template": { ... } }` (If score < 80)
  - **400:** `{ "error": "Missing title, url, or price" }` or validation errors.
- **`GET /api/marketplace/templates?search=<query>`** *(Public)*
  - **200:** `[ { "_id", "title", "price", "imagePath", "score", ... } ]`
- **`GET /api/marketplace/templates/:id/download`** *(Requires Auth)*
  - **200:** Downloads a ZIP file.
  - **404:** `{ "error": "Template not found" }`
- **`POST /api/marketplace/templates/:id/purchase`** *(Requires Auth)*
  - **501:** `{ "message": "Payment processing not yet implemented. Record created." }`
- **`GET /api/marketplace/uploads/:filename`** *(Public)*
  - **200:** Returns the uploaded static file (images, zip). Served with `Content-Disposition: attachment`.

## 7. Admin Features (`/api/admin`)
*Note: All endpoints require a JWT token for a user with `role: 'admin'`.*
- **`GET /api/admin/analytics`**
  - **200:** `{ "totalUsers": X, "totalAudits": X, "totalTemplates": X, "totalDownloads": X, "totalRevenue": X }`
- **`DELETE /api/admin/users/:id`**
  - **200:** `{ "message": "User deleted successfully" }`
- **`PATCH /api/admin/users/:id/block`**
  - **200:** `{ "message": "User status updated", "user": { ... } }`
- **`GET /api/admin/logs?page=1`**
  - **200:** `[ { "userId", "action", "metadata", "timestamp" } ]`

## 8. Global Endpoints
- **`GET /health`** *(Public)*
  - **200:** `{ "status": "ok", "aiEngine": { ... }, "uptime": 123.45 }`
- **`GET /`** *(Public)*
  - **200:** `{ "name": "...", "version": "...", "endpoints": { ... } }`

## 9. Global Error Handling
The frontend axios/fetch interceptor should handle:
- **400 Bad Request:** Show form validation errors (read `.error` string or `.errors` array).
- **401 Unauthorized:** Clear local state and redirect to login. Attempt token refresh `/api/auth/refresh` first if applicable.
- **403 Forbidden:** Display "Access Denied" (likely non-admin accessing admin endpoints).
- **404 Not Found:** Show missing resource page.
- **429 Too Many Requests:** Show rate limit message. Implement exponential backoff if necessary.
- **500/502/504 Server Errors:** Display global "Service Unavailable" alert.