# Secure Data Sharing System - Project Summary

Date: February 26, 2026

## Overview
This project is a consent-first personal data sharing platform. It includes a full backend (Node.js/Express + MongoDB) and a demo frontend (React + Vite). The backend enforces role-based access, consent lifecycle, and secure data access. The frontend demonstrates the end-to-end flows for data owners, service users, and admins.

## 1) Backend - What Is Implemented

### Core Architecture
- Express app with CORS, JSON parsing, error handling, and a health check route.
- Swagger API docs at /api-docs with OpenAPI YAML files.
- MongoDB via Mongoose with structured models for User, Data, Consent, Report, and AuditLog.

### Authentication and Accounts
- Register and login with JWT-based authentication.
- Profile update (name, phone, reference description).
- Forgot password with OTP (demo OTP in server console) and reset password flow.
- Account deletion scheduling (7 days) and cancel-deletion flow.
- Phone normalization and 10-digit validation.

### Roles and Security
- Roles: data_owner, service_user, admin.
- Middleware enforces JWT and role-based access control.
- Protected routes require Authorization: Bearer <token>.

### Data Management
- Data upload supports text or file; files are uploaded to Cloudinary when configured.
- File access supports view (inline) and download, including signed URL fallback for Cloudinary.
- allowDownload flag controls download permission for service users.
- Soft delete for data records.

### Advanced Discovery and Identification
- Advanced discover endpoint supports search by title, category, tags, and full-text search.
- Owner reference search supports userId, uuid, email, phone, or name to avoid ambiguity.
- Each data record stores owner reference details (userId, uuid, name, email, phone, referenceDescription).
- User identification lookup endpoint returns user reference details for precise matching.

### Consent Workflow
- Consent request with purpose.
- Status lifecycle: pending, approved, rejected, revoked.
- Owner approvals with automatic expiry date (3 days after approval).
- Access enforcement: service users must have active, non-expired consent.
- Consent history per data item for owners.
- Email notifications for request, approve, reject, revoke (when EMAIL_* env vars are configured).

### Reports and Moderation
- Users can submit reports about other users.
- Admin can review reports and optionally suspend users.

### Audit and Monitoring
- Audit log tracks actions (login, data upload, consent approve/revoke, etc.).
- Admin endpoints for audit logs and system statistics.

### Scheduled Jobs
- Daily cleanup of users whose deletion schedule has passed.
- Hourly auto-revoke of expired consents.

### Backend Usage (Quick Reference)
Base URL: http://localhost:5000/api
Swagger UI: http://localhost:5000/api-docs
Health check: http://localhost:5000/health

Key endpoints:
- Auth: /auth/register, /auth/login, /auth/me, /auth/forgot-password, /auth/reset-password
- Data: /data/upload, /data/my-data, /data/discover, /data/:id, /data/:id/view, /data/:id/download
- Consent: /consent/request, /consent/my-requests, /consent/approvals, /consent/:id/approve, /consent/:id/reject, /consent/:id/revoke
- Reports: /reports (create), /reports/my
- Admin: /admin/users, /admin/data, /admin/consents, /admin/audit-logs, /admin/statistics, /admin/reports

Typical flow:
1. Register or login -> receive JWT.
2. Data owner uploads data (text/file), optionally sets allowDownload.
3. Service user discovers data and requests consent with purpose.
4. Data owner approves or rejects; backend enforces expiry and revocation.
5. Service user views or downloads only when consent is approved and active.

## 2) Frontend - How It Is Built and Accessed

### Tech Stack
- React 18 + Vite.
- React Router for client-side routing.
- Axios with request/response interceptors for auth token and 401 handling.

### Auth Handling
- JWT token stored in localStorage.
- App reads user from localStorage on load.
- Unauthorized API responses redirect to /login.

### Pages (16 total)
Public pages:
- / (Landing)
- /login (Login)
- /register (Register)
- /forgot-password (ForgotPassword)

Protected pages (RequireAuth):
- /dashboard (Dashboard)
- /profile (Profile)
- /reports (Reports)
- /upload (UploadData) - data owners only
- /my-data (MyData) - data owners only
- /approvals (Approvals) - data owners only
- /consent-history (ConsentHistory) - data owners only
- /discover (DiscoverData) - service users only
- /requests (MyRequests) - service users only
- /approved-data (ApprovedData) - service users only
- /view/:id (ViewData)
- /admin (AdminPanel) - admins only

### Role-Based Navigation
- data_owner: Upload, My Data, Reports, Approvals, Consent History, Profile, Dashboard.
- service_user: Discover, My Requests, Approved Data, Reports, Profile, Dashboard.
- admin: Admin, Profile, Dashboard.

### How to Access Frontend Pages
1. Start backend and frontend locally.
2. Register or login and get assigned a role.
3. The sidebar navigation updates based on the role in localStorage.
4. Protected routes are enforced by RequireAuth; unauthenticated access redirects to /login.

---
End of report.
