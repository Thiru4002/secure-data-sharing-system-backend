const fs = require('fs');
const path = require('path');
const PDFDocument = require(path.join(process.cwd(), 'backend/node_modules/pdfkit'));

const reportsDir = path.join(process.cwd(), 'backend/reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

const outputPath = path.join(reportsDir, 'project-end-to-end-overview.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 48 });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const generatedAt = new Date().toLocaleString('en-IN', { hour12: true });

function section(title) {
  doc.moveDown(0.8);
  doc.font('Helvetica-Bold').fontSize(14).fillColor('#111111').text(title);
  doc.moveDown(0.4);
  doc.font('Helvetica').fontSize(11).fillColor('#111111');
}

function bullet(text) {
  doc.text('- ' + text, { align: 'left' });
  doc.moveDown(0.2);
}

doc.font('Helvetica-Bold').fontSize(20).text('Secure Data Sharing System');
doc.font('Helvetica-Bold').fontSize(16).text('End-to-End Project Report');
doc.moveDown(0.4);
doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text('Generated on: ' + generatedAt);
doc.fillColor('#111111');

section('1. Project Purpose');
bullet('Build a consent-first platform to share personal data securely between data owners and service users.');
bullet('Prevent unauthorized access with role-based permissions and explicit consent approval.');
bullet('Provide traceable actions through audit logs and request lifecycle tracking.');

section('2. Problem Statement');
bullet('Traditional sharing methods expose personal data without strong owner control.');
bullet('There is often no clear record of who accessed data, why, and for how long.');
bullet('Revocation and expiry are missing in many basic systems, causing overexposure risk.');

section('3. Roles and Responsibility');
bullet('Data Owner: uploads data, sets download permission, reviews and decides consent requests.');
bullet('Service User: discovers owner data using user reference, sends request with purpose, accesses approved data.');
bullet('Admin: monitors users, reviews reports, applies moderation like suspension when needed.');

section('4. End-to-End Workflow');
bullet('Step 1: User registers and logs in with JWT-based authentication.');
bullet('Step 2: Data owner uploads text/file data with metadata and owner reference information.');
bullet('Step 3: Service user discovers data and submits consent request with purpose and duration.');
bullet('Step 4: Data owner approves/rejects/revokes request from review interface.');
bullet('Step 5: If approved and not expired, service user can view data; download depends on owner setting.');
bullet('Step 6: System tracks status changes (pending, approved, rejected, revoked, expired).');

if (doc.y > 700) doc.addPage();

section('5. Backend Implementation');
bullet('Node.js + Express REST APIs with route-level middleware and role checks.');
bullet('MongoDB + Mongoose models: User, Data, Consent, AuditLog, Report.');
bullet('Security checks on every protected route using Bearer token verification.');
bullet('Data deletion uses soft-delete behavior where required for consistency.');
bullet('Consent expiry and scheduled cleanup are handled by timed backend jobs.');

section('6. Frontend Implementation');
bullet('React + Vite single-page application with role-based dashboards.');
bullet('Data owner pages: upload data, my data, consent approvals, account/profile actions.');
bullet('Service user pages: discover, request tracking, approved data, view/download.');
bullet('Admin pages: user management, reports review, and moderation controls.');
bullet('UI designed for readability with consistent actions, states, and feedback messages.');

section('7. File and Access Security');
bullet('Files are stored through Cloudinary integration with backend-controlled access path.');
bullet('View and download endpoints enforce consent and owner permissions before delivery.');
bullet('For blocked direct delivery scenarios, backend uses signed private download fallback.');

section('8. Key Features Delivered');
bullet('Consent lifecycle with approve/reject/revoke and expiry timeline.');
bullet('Owner-centric control: allow or disable file download per data item.');
bullet('Live status tracking for service user requests and approved access list.');
bullet('Audit-oriented flow suitable for academic demonstration of secure sharing.');

if (doc.y > 680) doc.addPage();

section('9. Testing Summary');
bullet('Health endpoint and authenticated route checks validated.');
bullet('Role-guarded APIs return expected unauthorized responses without token.');
bullet('Frontend production build completed successfully.');
bullet('Owner file view/download flow verified with successful 200 responses.');

section('10. Demo Accounts and Data');
bullet('Demo users seeded with realistic names and roles for semester presentation.');
bullet('Owner records include text and one-page PDF examples for live walkthrough.');
bullet('Additional live record seeded to show real-time insert behavior in dashboard.');

section('11. Limitations and Future Scope');
bullet('SMS OTP provider integration can be added for production-grade phone verification.');
bullet('Advanced analytics dashboard and exportable admin reports can be extended.');
bullet('Automated integration tests can be expanded for full regression coverage.');

section('12. Conclusion');
bullet('The project demonstrates a practical, secure, and role-driven consent-based data sharing platform.');
bullet('It is suitable for final-year semester evaluation with end-to-end implementation evidence.');
bullet('Architecture supports future expansion to production-ready controls and integrations.');

doc.moveDown(1.2);
doc.font('Helvetica-Oblique').fontSize(10).fillColor('#4b5563').text('Prepared for semester review presentation.');

doc.end();

stream.on('finish', () => {
  console.log(outputPath);
});
