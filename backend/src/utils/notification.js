const { sendEmail } = require('../services/email.service');

const notifyConsentRequested = async ({ dataOwner, serviceUser, data, purpose }) => {
  try {
    if (!dataOwner?.email) return false;
    const title = data?.title ? ` for "${data.title}"` : '';
    const purposeLine = purpose ? `<p><strong>Purpose:</strong> ${purpose}</p>` : '';
    await sendEmail({
      to: dataOwner.email,
      subject: 'New Consent Request',
      html: `
        <p>Hello ${dataOwner.name || 'there'},</p>
        <p>${serviceUser?.name || 'A service user'} has requested access${title}.</p>
        ${purposeLine}
        <p>Please review the request in your dashboard.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error(`[notify] Consent request email failed: ${err.message}`);
    return false;
  }
};

const notifyConsentApproved = async ({ serviceUser, data, expiryDate }) => {
  try {
    if (!serviceUser?.email) return false;
    const title = data?.title ? ` for "${data.title}"` : '';
    const expiry = expiryDate ? new Date(expiryDate).toLocaleDateString() : null;
    await sendEmail({
      to: serviceUser.email,
      subject: 'Consent Approved',
      html: `
        <p>Hello ${serviceUser.name || 'there'},</p>
        <p>Your consent request${title} has been approved.</p>
        ${expiry ? `<p>Access expires on <strong>${expiry}</strong>.</p>` : ''}
      `,
    });
    return true;
  } catch (err) {
    console.error(`[notify] Consent approval email failed: ${err.message}`);
    return false;
  }
};

const notifyConsentRejected = async ({ serviceUser, data }) => {
  try {
    if (!serviceUser?.email) return false;
    const title = data?.title ? ` for "${data.title}"` : '';
    await sendEmail({
      to: serviceUser.email,
      subject: 'Consent Rejected',
      html: `
        <p>Hello ${serviceUser.name || 'there'},</p>
        <p>Your consent request${title} has been rejected.</p>
        <p>You may contact the data owner for more details.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error(`[notify] Consent rejection email failed: ${err.message}`);
    return false;
  }
};

const notifyConsentRevoked = async ({ serviceUser, data }) => {
  try {
    if (!serviceUser?.email) return false;
    const title = data?.title ? ` for "${data.title}"` : '';
    await sendEmail({
      to: serviceUser.email,
      subject: 'Consent Revoked',
      html: `
        <p>Hello ${serviceUser.name || 'there'},</p>
        <p>The consent you had${title} has been revoked.</p>
        <p>Your access is now disabled.</p>
      `,
    });
    return true;
  } catch (err) {
    console.error(`[notify] Consent revoke email failed: ${err.message}`);
    return false;
  }
};

module.exports = {
  notifyConsentRequested,
  notifyConsentApproved,
  notifyConsentRejected,
  notifyConsentRevoked,
};
