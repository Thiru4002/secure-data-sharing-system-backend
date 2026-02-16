# Secure Data Sharing System

Backend-focused documentation for students and study purpose.

## Scope
- Primary focus: `backend` implementation, APIs, data models, consent workflow, security checks.
- Frontend status: demo UI only (`frontend` is for basic flow demonstration, not production UX).

## Project Purpose
This project demonstrates a consent-first personal data sharing platform.

1. Data owner uploads data.
2. Service user requests access with purpose.
3. Owner approves/rejects/revokes consent.
4. Backend enforces access rules in real time.
5. Admin monitors users, requests, and reports.

## Tech Stack (Backend)
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication (`jsonwebtoken`)
- File handling: `multer` + Cloudinary
- API docs: Swagger (`/api-docs`)

## Backend Structure
- `backend/server.js`: startup, DB connect, Cloudinary config, scheduled jobs
- `backend/src/app.js`: middleware, routes, swagger, error handlers
- `backend/src/routes/*.js`: route definitions
- `backend/src/controllers/*.js`: business logic
- `backend/src/models/*.js`: Mongoose schemas
- `backend/src/middlewares/auth.js`: token and role checks
- `backend/src/middlewares/audit.js`: action logging middleware
- `backend/docs/openapi/*.yaml`: Swagger route docs

## Roles and Access
- `data_owner`
- `service_user`
- `admin`

Role restrictions are enforced in backend middleware and controller checks.

## Core Backend Flows

### 1) Authentication
- Register/login
- JWT token issued on login
- Protected routes require `Authorization: Bearer <token>`

### 2) Data Management
- Data owner can upload text/files and manage own data
- Service user can discover metadata
- Full data access requires approved and active consent

### 3) Consent Lifecycle
- Statuses: `pending`, `approved`, `rejected`, `revoked`
- Owner decides approval/rejection/revocation
- Expiry is enforced by backend checks

### 4) Admin Controls
- User management
- Consent visibility
- System monitoring and moderation actions

## API Base
- Base URL: `http://localhost:5000/api`
- Swagger UI: `http://localhost:5000/api-docs`
- Health: `http://localhost:5000/health`

## Key Endpoints (High Level)

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

### Data
- `POST /data/upload`
- `GET /data/my-data`
- `GET /data/discover`
- `GET /data/:id`
- `GET /data/:id/view`
- `GET /data/:id/download`
- `PATCH /data/:id`
- `DELETE /data/:id`

### Consent
- `POST /consent/request`
- `GET /consent/my-requests`
- `GET /consent/approvals`
- `PATCH /consent/:id/approve`
- `PATCH /consent/:id/reject`
- `PATCH /consent/:id/revoke`

### Admin
- `GET /admin/users`
- `GET /admin/consents`
- `GET /admin/audit-logs`

## Environment Setup
Use `backend/.env`.

Minimum required values:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/secure-data-sharing
JWT_SECRET=replace_with_secure_secret
FRONTEND_URL=http://localhost:3000
CLOUDINARY_URL=cloudinary://<key>:<secret>@<cloud_name>
```

## Run (Backend First)

```bash
cd backend
npm install
npm run dev
```

Expected:
- MongoDB connected
- Server running on `http://localhost:5000`

## Run Frontend Demo

```bash
cd frontend
npm install
npm run dev
```

Frontend is intentionally treated as demo UI for project presentation.

## Study Checklist (Recommended Order)
1. Read models: `User`, `Data`, `Consent`
2. Read auth middleware and JWT flow
3. Read `dataController.js` and `consentController.js`
4. Test endpoints in Swagger/Postman
5. Map API responses to frontend screens

## What Makes This Good for Students
- Clear role-based backend design
- Practical consent-state workflow
- Real API security checks (JWT + role + ownership + consent)
- Easy to extend with OTP providers, audit analytics, and stricter validation

## Notes
- This repository is optimized for learning and semester review demo.
- Keep backend as primary evaluation artifact; frontend demonstrates usage flows.
