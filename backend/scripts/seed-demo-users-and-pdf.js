require('dotenv').config({ path: 'backend/.env' });
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const PDFDocument = require(path.join(process.cwd(), 'backend/node_modules/pdfkit'));
const { cloudinary, configureCloudinary } = require(path.join(process.cwd(), 'backend/src/config/cloudinary'));
const User = require(path.join(process.cwd(), 'backend/src/models/User'));
const Data = require(path.join(process.cwd(), 'backend/src/models/Data'));

const DEMO_PASSWORD = 'Demo@123';

const demoUsers = [
  {
    name: 'Akilan',
    email: 'akilan@gmail.com',
    role: 'data_owner',
    phone: '9876543210',
    referenceDescription: 'Owner account for personal health and finance data',
  },
  {
    name: 'Kabilan',
    email: 'kabilan@gmail.com',
    role: 'data_owner',
    phone: '9123456780',
    referenceDescription: 'Owner account for education and work documents',
  },
  {
    name: 'Nanmadhi',
    email: 'nanmadhi@gmail.com',
    role: 'service_user',
    phone: '9012345678',
    referenceDescription: 'Service user for project and verification requests',
  },
  {
    name: 'Vedha',
    email: 'vedha@gmail.com',
    role: 'service_user',
    phone: '9098765432',
    referenceDescription: 'Service user for analytics and study access requests',
  },
  {
    name: 'Jack',
    email: 'jack@gmail.com',
    role: 'admin',
    phone: '9988776655',
    referenceDescription: 'Admin account for review, moderation, and controls',
  },
];

const demoDataByOwner = {
  'akilan@gmail.com': [
    {
      title: 'Health Checkup Summary 2025',
      description: 'Annual health report summary for semester demo.',
      category: 'Health',
      tags: ['health', 'checkup', 'report'],
      content: 'Blood pressure normal. Sugar level normal. Follow-up in 6 months.',
      ownerReferenceHint: 'Akilan health records for demo review',
      ownerIdentifier: 'AKI-HLT-001',
      allowDownload: true,
    },
    {
      title: 'Personal Budget Plan',
      description: 'Monthly expense and savings plan.',
      category: 'Finance',
      tags: ['finance', 'budget'],
      content: 'Income: 50000, Savings target: 15000, Rent: 12000, Utilities: 3000.',
      ownerReferenceHint: 'Akilan finance planning sheet',
      ownerIdentifier: 'AKI-FIN-002',
      allowDownload: false,
    },
    {
      title: 'Insurance Policy Notes',
      description: 'Quick policy coverage notes for verification.',
      category: 'Insurance',
      tags: ['insurance', 'policy'],
      content: 'Policy active till 2027. Coverage includes hospitalization and accident.',
      ownerReferenceHint: 'Akilan insurance reference',
      ownerIdentifier: 'AKI-INS-003',
      allowDownload: true,
    },
  ],
  'kabilan@gmail.com': [
    {
      title: 'Degree Certificate Details',
      description: 'Education verification summary.',
      category: 'Education',
      tags: ['education', 'degree', 'verification'],
      content: 'B.E. Computer Science completed in 2024 with first class.',
      ownerReferenceHint: 'Kabilan degree data for validation',
      ownerIdentifier: 'KAB-EDU-001',
      allowDownload: false,
    },
    {
      title: 'Employment History',
      description: 'Previous work experience details.',
      category: 'Career',
      tags: ['career', 'employment'],
      content: 'Software Intern (2023), Associate Developer (2024-2025).',
      ownerReferenceHint: 'Kabilan career records',
      ownerIdentifier: 'KAB-CAR-002',
      allowDownload: true,
    },
    {
      title: 'Skill Certification Notes',
      description: 'Certification information for project review.',
      category: 'Certification',
      tags: ['skills', 'certification'],
      content: 'Certified in Java, Node.js, and cloud fundamentals.',
      ownerReferenceHint: 'Kabilan skill certificates summary',
      ownerIdentifier: 'KAB-SKL-003',
      allowDownload: true,
    },
  ],
};

async function upsertDemoUser(spec) {
  let user = await User.findOne({ email: spec.email }).select('+password');

  if (!user) {
    user = new User({
      name: spec.name,
      email: spec.email,
      password: DEMO_PASSWORD,
      role: spec.role,
      phone: spec.phone,
      phoneNormalized: String(spec.phone).replace(/\D/g, ''),
      referenceDescription: spec.referenceDescription,
      isEmailVerified: true,
      isDeleted: false,
      deletionRequestedAt: null,
      deletionScheduledFor: null,
    });
  } else {
    user.name = spec.name;
    user.password = DEMO_PASSWORD;
    user.role = spec.role;
    user.phone = spec.phone;
    user.phoneNormalized = String(spec.phone).replace(/\D/g, '');
    user.referenceDescription = spec.referenceDescription;
    user.isEmailVerified = true;
    user.isDeleted = false;
    user.deletionRequestedAt = null;
    user.deletionScheduledFor = null;
  }

  await user.save();
  return user;
}

function buildPdfBuffer(lines, title) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.font('Helvetica-Bold').fontSize(16).text(title);
    doc.moveDown();
    doc.font('Helvetica').fontSize(11);
    lines.forEach((line) => {
      doc.text(line);
      doc.moveDown(0.3);
    });
    doc.end();
  });
}

async function uploadPdfToCloudinary(buffer, baseName) {
  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'upload',
        folder: 'secure-data-sharing/demo-seed',
        public_id: `${baseName}-${Date.now()}`,
        format: 'pdf',
      },
      (err, result) => {
        if (err || !result) {
          resolve(null);
          return;
        }
        resolve(result);
      }
    );

    stream.end(buffer);
  });
}

async function seedOwnerData(users) {
  const owners = users.filter((u) => u.role === 'data_owner');
  if (owners.length === 0) return { textCount: 0, fileCount: 0 };

  await Data.deleteMany({ owner: { $in: owners.map((u) => u._id) } });

  let textCount = 0;
  let fileCount = 0;

  for (const owner of owners) {
    const dataRows = demoDataByOwner[owner.email] || [];
    for (const row of dataRows) {
      const doc = new Data({
        owner: owner._id,
        ownerReference: {
          userId: owner.userId,
          uuid: owner.uuid,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          referenceDescription: owner.referenceDescription,
        },
        title: row.title,
        description: row.description,
        category: row.category,
        tags: row.tags,
        dataType: 'text',
        content: row.content,
        ownerReferenceHint: row.ownerReferenceHint,
        ownerIdentifier: row.ownerIdentifier,
        allowDownload: row.allowDownload,
        isDeleted: false,
      });
      await doc.save();
      textCount += 1;
    }

    // Add one file-type PDF record per owner.
    const pdfBuffer = await buildPdfBuffer(
      [
        `Owner: ${owner.name}`,
        `User ID: ${owner.userId}`,
        'This is a one-page PDF seeded for semester demo.',
        'Service users can view this file after consent approval.',
      ],
      `${owner.name} Demo PDF`
    );

    const upload = await uploadPdfToCloudinary(pdfBuffer, owner.name.toLowerCase().replace(/\s+/g, '-'));

    if (upload) {
      const fileDoc = new Data({
        owner: owner._id,
        ownerReference: {
          userId: owner.userId,
          uuid: owner.uuid,
          name: owner.name,
          email: owner.email,
          phone: owner.phone,
          referenceDescription: owner.referenceDescription,
        },
        title: `${owner.name} - Review PDF`,
        description: 'One-page seeded PDF for live demo.',
        category: 'Documents',
        tags: ['demo', 'pdf', 'review'],
        dataType: 'file',
        content: 'Attached PDF for consent-based view/download testing.',
        fileUrl: upload.secure_url,
        fileName: `${owner.name.toLowerCase()}-review.pdf`,
        fileSize: upload.bytes || pdfBuffer.length,
        fileMimeType: 'application/pdf',
        cloudinaryResourceType: 'raw',
        ownerReferenceHint: `${owner.name} demo PDF document`,
        ownerIdentifier: `${owner.name.substring(0, 3).toUpperCase()}-PDF-001`,
        allowDownload: true,
        isDeleted: false,
      });
      await fileDoc.save();
      fileCount += 1;
    }
  }

  return { textCount, fileCount };
}

function generateUsersPdf(users, counts) {
  const reportsDir = path.join(process.cwd(), 'backend/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const outputPath = path.join(reportsDir, 'demo-users-details.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(fs.createWriteStream(outputPath));

  doc.font('Helvetica-Bold').fontSize(18).text('Demo Users Details');
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(10).fillColor('#4b5563').text(`Generated on: ${new Date().toLocaleString()}`);
  doc.fillColor('#111111');
  doc.moveDown();

  doc.font('Helvetica').fontSize(11).text('Shared demo password for all users:');
  doc.font('Helvetica-Bold').fontSize(12).text(DEMO_PASSWORD);
  doc.moveDown();
  doc.font('Helvetica').fontSize(11).text(`Seeded text records: ${counts.textCount}`);
  doc.font('Helvetica').fontSize(11).text(`Seeded file (PDF) records: ${counts.fileCount}`);
  doc.moveDown();

  users.forEach((user, idx) => {
    if (idx > 0) doc.moveDown(0.7);
    doc.font('Helvetica-Bold').fontSize(13).text(`${idx + 1}. ${user.name}`);
    doc.font('Helvetica').fontSize(11);
    doc.text(`Role: ${user.role}`);
    doc.text(`Email: ${user.email}`);
    doc.text(`Phone: ${user.phone}`);
    doc.text(`User ID: ${user.userId}`);
    doc.text(`UUID: ${user.uuid}`);
    doc.text(`Reference: ${user.referenceDescription || 'N/A'}`);
  });

  doc.moveDown(1.2);
  doc.font('Helvetica-Oblique').fontSize(10).fillColor('#444444').text('Note: These are demo accounts and records for semester review only.');

  doc.end();
  return outputPath;
}

function generateServiceUserGuidePdf() {
  const reportsDir = path.join(process.cwd(), 'backend/reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const guidePath = path.join(reportsDir, 'service-user-web-flow.pdf');
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  doc.pipe(fs.createWriteStream(guidePath));

  doc.font('Helvetica-Bold').fontSize(18).text('Service User Web Application Flow');
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(11);
  doc.text('1. Login with your service user account.');
  doc.moveDown(0.3);
  doc.text('2. Open Discover page and search data owner by USER_ID.');
  doc.moveDown(0.3);
  doc.text('3. Select purpose and send consent request.');
  doc.moveDown(0.3);
  doc.text('4. Track request status in My Requests / Approved Data.');
  doc.moveDown(0.3);
  doc.text('5. After owner approval, open View Data page.');
  doc.moveDown(0.3);
  doc.text('6. Use View File for PDF/images and Download if owner allowed it.');
  doc.moveDown(0.3);
  doc.text('7. If misuse is suspected, submit report from Discover or Reports page.');

  doc.moveDown(1.0);
  doc.font('Helvetica-Oblique').fontSize(10).fillColor('#444444').text('Generated for semester review demo.');

  doc.end();
  return guidePath;
}

async function run() {
  try {
    configureCloudinary();
    await mongoose.connect(process.env.MONGODB_URI);

    const created = [];
    for (const spec of demoUsers) {
      const user = await upsertDemoUser(spec);
      created.push(user);
    }

    const counts = await seedOwnerData(created);
    const usersPdfPath = generateUsersPdf(created, counts);
    const guidePdfPath = generateServiceUserGuidePdf();

    console.log('Demo users are ready.');
    created.forEach((u) => {
      console.log(`${u.role} | ${u.name} | ${u.email} | ${u.userId}`);
    });
    console.log(`Seeded text records: ${counts.textCount}`);
    console.log(`Seeded file (PDF) records: ${counts.fileCount}`);
    console.log(`Users PDF generated: ${usersPdfPath}`);
    console.log(`Service user guide PDF generated: ${guidePdfPath}`);
  } catch (err) {
    console.error('Failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
