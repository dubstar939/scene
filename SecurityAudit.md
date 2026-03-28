# Security Audit Report - Car Scene v2

**Date:** March 28, 2026
**Auditor:** Cybersecurity Expert Agent

## 1. Executive Summary
The application provides a real-time social mapping platform for car enthusiasts. While the core functionality is robust, several security vulnerabilities were identified, particularly concerning data persistence, authorization, and deployment environment configuration.

## 2. Identified Vulnerabilities

### 2.1. Broken Object Level Authorization (BOLA)
*   **Risk:** Critical
*   **Details:** The `/api/profile/update` endpoint (and potentially others) accepts a user `id` in the request body and performs updates without verifying if the authenticated user owns that ID.
*   **Exploit Scenario:** An attacker could send a POST request with another user's ID to change their name, avatar, or car details.
*   **Recommendation:** Implement session-based authentication (e.g., JWT or Supabase Auth) and verify the user's identity on the server side before performing any updates.

### 2.2. Insecure Data Persistence on Vercel
*   **Risk:** High
*   **Details:** The application uses `users.json` as a fallback for data storage. Vercel's serverless environment is ephemeral; any changes to local files are lost when the function instance restarts.
*   **Exploit Scenario:** Users may find their accounts or profile updates missing after a short period of inactivity.
*   **Recommendation:** Ensure Supabase (or another persistent database) is correctly configured and used as the primary storage in production.

### 2.3. Exposure of Sensitive Environment Variables
*   **Risk:** Medium
*   **Details:** Supabase keys are exposed in the client-side code. While this is standard for Supabase, it relies heavily on Row Level Security (RLS) being enabled on the database.
*   **Exploit Scenario:** If RLS is not enabled, anyone with the `anon` key can read/write to any table.
*   **Recommendation:** Enable RLS on all Supabase tables and define strict policies (e.g., `auth.uid() = id`).

### 2.4. Lack of Input Sanitization
*   **Risk:** Medium
*   **Details:** User-provided strings (names, car models, chat messages) are rendered directly in the UI.
*   **Exploit Scenario:** Cross-Site Scripting (XSS) attacks could be performed by injecting `<script>` tags into profile names or chat messages.
*   **Recommendation:** Use a library like `dompurify` to sanitize user input before rendering, or ensure the UI framework (React) is correctly escaping all output.

## 3. Deployment Issues (Vercel 404)
The 404 error on Vercel is likely due to the lack of a `vercel.json` configuration to route all requests to the Express server. This has been addressed by adding `vercel.json` and exporting the Express app correctly in `server.ts`.

## 4. Performance Bottlenecks
*   **Large Component Rendering:** `App.tsx` was over 4000 lines, causing slow reconciliation and high memory usage.
*   **Map Re-renders:** Leaflet markers were re-rendering unnecessarily on every state change.
*   **Optimization:** Extracted `MapComponent` and `AuthComponent` into separate files and wrapped them in `React.memo`.

## 5. Conclusion
The application requires immediate attention to its authorization logic and production database configuration. Implementing the recommended fixes will significantly harden the application against common attacks.
