const nodemailer = require('nodemailer');

const RECIPIENT = 'technothera@gmail.com';

const INTEREST_LABELS = {
  psysights: 'PsySights',
  cognitive: 'Cognitive Suite',
  cue: 'ARCA',
  sds: 'Smart Dismissal System',
  multiple: 'Multiple Products',
  custom: 'Custom System',
  general: 'General Inquiry',
};

const INST_TYPE_LABELS = {
  'psychiatric-clinic': 'Psychiatric / Psychology Clinic',
  'aba-clinic': 'ABA Therapy Clinic',
  'private-school': 'Private School',
  'international-school': 'International School',
  nursery: 'Nursery / Kindergarten',
  'rehabilitation-center': 'Rehabilitation Center',
  other: 'Other',
};

const REFERRAL_LABELS = {
  google: 'Google Search',
  social: 'Social Media',
  referral: 'Referral / Word of Mouth',
  event: 'Event or Conference',
  other: 'Other',
};

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c]));
}

function row(label, value) {
  if (!value) return '';
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #EEF1F6;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#6B7585;width:170px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEF1F6;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#0B1320;vertical-align:top;">${value}</td>
    </tr>`;
}

function buildEmailHtml(fields) {
  const {
    fullName, institution, email, phone, contactMethod,
    instType, interest, topics, referral, message,
  } = fields;

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#EEF1F6;font-family:'DM Sans',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,19,32,.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#6366F1 0%,#4FB8A8 100%);padding:28px 32px;">
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;">Technothera</div>
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:rgba(255,255,255,.85);margin-top:4px;text-transform:uppercase;letter-spacing:.06em;">New Contact Form Submission</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 32px 8px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${row('Full Name', escapeHtml(fullName))}
                  ${row('Institution', escapeHtml(institution))}
                  ${row('Email', `<a href="mailto:${escapeHtml(email)}" style="color:#6366F1;text-decoration:none;">${escapeHtml(email)}</a>`)}
                  ${row('Phone', escapeHtml(phone))}
                  ${row('Preferred Contact', contactMethod === 'whatsapp' ? 'WhatsApp' : 'Email')}
                  ${row('Institution Type', escapeHtml(instType))}
                  ${row('Area of Interest', escapeHtml(interest))}
                  ${row('Topics of Interest', escapeHtml(topics))}
                  ${row('Heard About Us Via', escapeHtml(referral))}
                </table>
              </td>
            </tr>
            ${message ? `
            <tr>
              <td style="padding:8px 32px 28px;">
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#6B7585;margin-bottom:8px;">Message</div>
                <div style="background:#F7F8FA;border-left:3px solid #4FB8A8;border-radius:0 8px 8px 0;padding:14px 16px;font-family:'DM Sans',Arial,sans-serif;font-size:14px;line-height:1.6;color:#0B1320;white-space:pre-wrap;">${escapeHtml(message)}</div>
              </td>
            </tr>` : ''}
            <tr>
              <td style="padding:18px 32px;background:#0B1320;">
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,.4);">Sent automatically from the Technothera website contact form.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const body = req.body || {};
  const fullName = String(body['full-name'] || '').trim();
  const institution = String(body.institution || '').trim();
  const email = String(body.email || '').trim();
  const phone = String(body.phone || '').trim();
  const instTypeRaw = body['inst-type'] || '';
  const interestRaw = body.interest || '';
  const instType = INST_TYPE_LABELS[instTypeRaw] || instTypeRaw;
  const interest = INTEREST_LABELS[interestRaw] || interestRaw;
  const contactMethod = body['contact-method'] === 'whatsapp' ? 'whatsapp' : 'email';
  const referral = REFERRAL_LABELS[body.referral] || '';
  const message = String(body.message || '').trim();
  const topicsRaw = body.topics;
  const topics = Array.isArray(topicsRaw) ? topicsRaw.join(', ') : String(topicsRaw || '');

  if (!fullName || !institution || !email || !phone || !instTypeRaw || !interestRaw) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const subject = `Technothera Inquiry: ${interest} — ${fullName}`;

  try {
    await transporter.sendMail({
      from: `"Technothera Website" <${process.env.GMAIL_USER}>`,
      to: RECIPIENT,
      replyTo: email,
      subject,
      html: buildEmailHtml({
        fullName, institution, email, phone, contactMethod,
        instType, interest, topics, referral, message,
      }),
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[contact] failed to send', err);
    res.status(500).json({ error: 'Failed to send submission' });
  }
};
