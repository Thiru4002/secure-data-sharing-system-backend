const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');

const outDir = path.join(__dirname);
const outFile = path.join(outDir, 'project-end-to-end-summary.pdf');

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 50, bottom: 50, left: 50, right: 50 },
});

doc.pipe(fs.createWriteStream(outFile));

const title = 'Secure Data Sharing System - End-to-End Project Summary';
const date = new Date().toLocaleString();

function sectionHeading(text) {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text(text);
  doc.moveDown(0.3);
}

function para(text) {
  doc.font('Helvetica').fontSize(11).fillColor('#222222').text(text, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.45);
}

function bullet(text) {
  doc.font('Helvetica').fontSize(11).fillColor('#222222').text(`- ${text}`, { lineGap: 2 });
}

// Page 1
doc.font('Helvetica-Bold').fontSize(19).fillColor('#0f172a').text(title);
doc.moveDown(0.3);
doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(`Generated: ${date}`);
doc.moveDown(1);

sectionHeading('1. Project Objective');
para('This project implements a consent-first secure data sharing platform for three roles: Data Owner, Service User, and Admin. The system is designed to allow controlled data discovery, explicit access approval, and audit-focused governance while keeping implementation practical for an academic final-year project.');

sectionHeading('2. System Architecture');
bullet('Frontend: React (Vite), role-based navigation and protected views.');
bullet('Backend: Node.js + Express, JWT authentication, role authorization middleware.');
bullet('Database: MongoDB (Users, Data, Consents, Reports, Audit Logs).');
bullet('Cloud Storage: Cloudinary for file assets with controlled view/download behavior.');
bullet('API Docs: Swagger/OpenAPI split into modular YAML files.');
doc.moveDown(0.5);

sectionHeading('3. Core Backend Modules');
bullet('Auth: register, login, profile read/update, forgot/reset password with demo OTP flow.');
bullet('Data: upload text/file, discover with filters, owner CRUD, secure view/download endpoints.');
bullet('Consent: request, approve, reject, revoke, owner/service-user tracking pages.');
bullet('Admin: statistics, user management (suspend/reactivate), consent/audit monitoring.');
bullet('Reports: user-generated reports and admin review workflow with optional suspension.');
doc.moveDown(0.6);

sectionHeading('4. Security and Access Model');
para('All private APIs require JWT. Role checks enforce separation of responsibilities: Data Owners cannot use service-user discovery actions; Service Users cannot access owner/admin controls; Admin endpoints are isolated. Data access by service users is blocked unless consent exists, is approved, and not expired/revoked. Suspended users are blocked at login with explicit messaging.');

// Page 2
doc.addPage();
sectionHeading('5. End-to-End User Flows');

bullet('A. Data Owner flow');
para('Register -> Login -> Upload text/file with metadata and download permission -> Review incoming consent requests -> Approve/Reject -> Track consent history -> Revoke when needed -> Manage profile and account settings.');

bullet('B. Service User flow');
para('Register -> Login -> Discover owner data using owner references (user ID, name, email, etc.) -> Submit consent request with purpose -> Track request status -> View approved data -> Download only when owner allows -> Submit report if misuse is suspected.');

bullet('C. Admin flow');
para('Login as admin -> Inspect system statistics -> Filter/search users -> Suspend/reactivate users -> Monitor consent traffic -> Review user reports -> Validate and suspend reported user when report is confirmed.');

sectionHeading('6. Major Functional Enhancements Implemented');
bullet('Swagger docs modularization and endpoint alignment with controllers.');
bullet('Email verification removal for simplified reliable project operation.');
bullet('Scheduled account deletion and cancel-deletion flow.');
bullet('OTP-based password reset in demo mode (OTP logged in server console).');
bullet('Download permission model (`allowDownload`) for owner-controlled data export.');
bullet('Cloudinary handling for both image and non-image files.');
bullet('Improved consent re-request logic after revoke/reject/expiry.');
bullet('UI consistency fixes (readability, card layout, status clarity).');
bullet('Admin panel section minimization with localStorage persistence.');
bullet('Report + admin review pipeline for governance and moderation.');

doc.moveDown(0.7);
sectionHeading('7. API Coverage and Frontend Mapping');
para('Frontend pages are mapped to backend endpoints by role and use case, including discovery, request lifecycle, owner approvals, approved-data view/download, profile controls, and admin management/review pages. This ensures the project demonstrates complete functional integration rather than isolated API demos.');

// Page 3
doc.addPage();
sectionHeading('8. Data Model Snapshot');
bullet('User: identity, role, phone, generated userId/uuid, suspension/deletion fields, reset OTP fields.');
bullet('Data: owner references, content/file metadata, tags/category, soft-delete flag, allowDownload flag.');
bullet('Consent: owner, service user, data reference, status, expiry, approval/revoke timestamps, purpose.');
bullet('Report: reporter, reported user, category, reason, review status, review metadata, suspension applied flag.');
bullet('AuditLog: action, actor, resource context, metadata for monitoring.');

doc.moveDown(0.6);
sectionHeading('9. Testing and Demonstration Readiness');
para('The project supports live demonstration scenarios with real role transitions, status changes, and enforcement points. Key demos include consent approval and revocation impact, suspended login rejection, report validation with suspension, and owner-controlled file download behavior. Frontend build verification has been consistently run after major changes.');

sectionHeading('10. Current Scope vs Future Improvements');
bullet('Current scope is suitable for final-year evaluation with complete end-to-end workflows.');
bullet('Future production upgrades: real SMS provider, stronger rate limits, centralized observability, and automated integration tests.');
bullet('Potential extension: granular data policies and organization-level tenancy controls.');

doc.moveDown(0.8);
sectionHeading('11. Conclusion');
para('This implementation is a complete, role-aware secure data sharing system with governance controls, practical security enforcement, and an admin moderation pipeline. It demonstrates architecture, API design, workflow integrity, and frontend-backend cohesion expected in a competitive college final project.');

doc.end();
console.log(`Generated: ${outFile}`);
