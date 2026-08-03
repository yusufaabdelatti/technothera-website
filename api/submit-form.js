const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');

const MAX_LOGO_BYTES = 4 * 1024 * 1024;
const RECIPIENT = 'technothera@gmail.com';

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
      <td style="padding:10px 0;border-bottom:1px solid #EEF1F6;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#6B7585;width:180px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid #EEF1F6;font-family:'DM Sans',Arial,sans-serif;font-size:14px;color:#0B1320;vertical-align:top;white-space:pre-wrap;">${value}</td>
    </tr>`;
}

function sectionHeader(title) {
  return `
    <tr>
      <td colspan="2" style="padding:24px 0 10px;font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:800;color:#6366F1;letter-spacing:.04em;text-transform:uppercase;border-bottom:2px solid #6366F1;">${title}</td>
    </tr>`;
}

function buildEmailHtml(d) {
  const servicesHtml = (d.services || []).length
    ? d.services.map((s, i) => `${i + 1}. ${escapeHtml(s.name)}${s.description ? ' — ' + escapeHtml(s.description) : ''}`).join('<br>')
    : '';

  const testimonialsHtml = (d.testimonials || []).length
    ? d.testimonials.map((t, i) => `${i + 1}. &ldquo;${escapeHtml(t.quote)}&rdquo;${t.name ? ' — ' + escapeHtml(t.name) : ''}`).join('<br>')
    : '';

  const socialsList = [
    d.socials.facebook ? 'Facebook: ' + escapeHtml(d.socials.facebook) : '',
    d.socials.instagram ? 'Instagram: ' + escapeHtml(d.socials.instagram) : '',
    d.socials.linkedin ? 'LinkedIn: ' + escapeHtml(d.socials.linkedin) : '',
    d.socials.other ? 'Other: ' + escapeHtml(d.socials.other) : '',
  ].filter(Boolean).join('<br>');

  const pages = [d.pagesNeeded.join(', '), d.pagesOther ? 'Other: ' + d.pagesOther : '']
    .filter(Boolean).join(' — ');

  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#EEF1F6;font-family:'DM Sans',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEF1F6;padding:32px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(11,19,32,.08);">
            <tr>
              <td style="background:linear-gradient(135deg,#6366F1 0%,#4FB8A8 100%);padding:28px 32px;">
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:20px;font-weight:800;color:#ffffff;">Technothera</div>
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:13px;font-weight:600;color:rgba(255,255,255,.85);margin-top:4px;text-transform:uppercase;letter-spacing:.06em;">New Website Request</div>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 28px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${sectionHeader('Organization Basics')}
                  ${row('Organization Name', escapeHtml(d.orgName))}
                  ${row('Industry / Field', escapeHtml(d.industry))}
                  ${row('Tagline', escapeHtml(d.tagline))}
                  ${row('Mission Statement', escapeHtml(d.mission))}
                  ${row('Full Description', escapeHtml(d.description))}

                  ${sectionHeader('Content')}
                  ${row('Services / Programs', servicesHtml)}
                  ${row('Target Audience', escapeHtml(d.targetAudience))}
                  ${row('Key Achievements / Stats', escapeHtml(d.achievements))}
                  ${row('Team / Founders Bio', escapeHtml(d.teamBio))}
                  ${row('Testimonials', testimonialsHtml)}

                  ${sectionHeader('Contact & Brand')}
                  ${row('Phone', escapeHtml(d.phone))}
                  ${row('Email', `<a href="mailto:${escapeHtml(d.email)}" style="color:#6366F1;text-decoration:none;">${escapeHtml(d.email)}</a>`)}
                  ${row('Address', escapeHtml(d.address))}
                  ${row('Social Links', socialsList)}
                  ${row('Logo', d.logo ? 'Attached — ' + escapeHtml(d.logo.filename) : 'Not provided')}
                  ${row('Brand Colors', escapeHtml(d.brandColors))}
                  ${row('Style Preference', escapeHtml(d.stylePreference))}
                  ${row('Reference Websites', escapeHtml(d.referenceWebsites))}

                  ${sectionHeader('Structure & Extras')}
                  ${row('Pages Needed', escapeHtml(pages))}
                  ${row('Language(s)', escapeHtml(d.languages.join(', ')))}
                  ${row('Existing Copy to Reuse', escapeHtml(d.existingCopy))}
                  ${row('Submitted By', escapeHtml(d.submitterName))}
                  ${row('Submitter Role', escapeHtml(d.submitterRole))}
                  ${row('Submitter Phone', escapeHtml(d.submitterPhone))}
                  ${row('Submitted At', escapeHtml(d.timestamp))}
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px;background:#0B1320;">
                <div style="font-family:'Plus Jakarta Sans',Arial,sans-serif;font-size:11px;color:rgba(255,255,255,.4);">Sent automatically from the Technothera website request form.</div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function deriveText(d) {
  const servicesText = (d.services || []).length
    ? d.services.map((s, i) => `${i + 1}. ${s.name}${s.description ? ' — ' + s.description : ''}`).join('\n')
    : '';
  const testimonialsText = (d.testimonials || []).length
    ? d.testimonials.map((t, i) => `${i + 1}. "${t.quote}"${t.name ? ' — ' + t.name : ''}`).join('\n')
    : '';
  const socialsText = [
    d.socials.facebook ? 'Facebook: ' + d.socials.facebook : '',
    d.socials.instagram ? 'Instagram: ' + d.socials.instagram : '',
    d.socials.linkedin ? 'LinkedIn: ' + d.socials.linkedin : '',
    d.socials.other ? 'Other: ' + d.socials.other : '',
  ].filter(Boolean).join('\n');
  const pagesText = [d.pagesNeeded.join(', '), d.pagesOther ? 'Other: ' + d.pagesOther : '']
    .filter(Boolean).join(' — ');
  return { servicesText, testimonialsText, socialsText, pagesText };
}

function buildPdfBuffer(d, derived) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const INDIGO = '#6366F1';
    const NAVY = '#0B1320';
    const MUTED = '#6B7585';

    doc.rect(0, 0, doc.page.width, 80).fill(NAVY);
    doc.fillColor('#FFFFFF').font('Helvetica-Bold').fontSize(20).text('Technothera', 50, 26);
    doc.fillColor('#B9C2CE').font('Helvetica').fontSize(11).text('Website Request Form Submission', 50, 50);

    doc.y = 105;
    doc.x = 50;

    function heading(text) {
      doc.moveDown(0.6);
      doc.fillColor(INDIGO).font('Helvetica-Bold').fontSize(13).text(text.toUpperCase(), { characterSpacing: 0.5 });
      const lineY = doc.y + 2;
      doc.moveTo(50, lineY).lineTo(doc.page.width - 50, lineY).strokeColor(INDIGO).lineWidth(1).stroke();
      doc.moveDown(0.6);
    }

    function field(label, value) {
      if (!value) return;
      doc.fillColor(MUTED).font('Helvetica-Bold').fontSize(9).text(label.toUpperCase(), { characterSpacing: 0.3 });
      doc.fillColor(NAVY).font('Helvetica').fontSize(11).text(String(value), { paragraphGap: 8 });
      doc.moveDown(0.3);
    }

    heading('Organization Basics');
    field('Organization Name', d.orgName);
    field('Industry / Field', d.industry);
    field('Tagline', d.tagline);
    field('Mission Statement', d.mission);
    field('Full Description', d.description);

    heading('Content');
    field('Services / Programs', derived.servicesText);
    field('Target Audience', d.targetAudience);
    field('Key Achievements / Stats', d.achievements);
    field('Team / Founders Bio', d.teamBio);
    field('Testimonials', derived.testimonialsText);

    heading('Contact & Brand');
    field('Phone', d.phone);
    field('Email', d.email);
    field('Address', d.address);
    field('Social Links', derived.socialsText);
    field('Logo', d.logo ? 'Attached separately — ' + d.logo.filename : 'Not provided');
    field('Brand Colors', d.brandColors);
    field('Style Preference', d.stylePreference);
    field('Reference Websites', d.referenceWebsites);

    heading('Structure & Extras');
    field('Pages Needed', derived.pagesText);
    field('Language(s)', d.languages.join(', '));
    field('Existing Copy to Reuse', d.existingCopy);
    field('Submitted By', d.submitterName);
    field('Submitter Role', d.submitterRole);
    field('Submitter Phone', d.submitterPhone);
    field('Submitted At', d.timestamp);

    doc.end();
  });
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
  const orgName = String(body.orgName || '').trim();
  const submitterName = String(body.submitterName || '').trim();
  const phone = String(body.phone || '').trim();
  const email = String(body.email || '').trim();

  if (!orgName || !submitterName || !phone || !email) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }

  const logo = body.logo && body.logo.base64 ? body.logo : null;
  if (logo) {
    const approxBytes = Math.ceil((logo.base64.length * 3) / 4);
    if (approxBytes > MAX_LOGO_BYTES) {
      res.status(400).json({ error: 'Logo file too large' });
      return;
    }
  }

  const data = {
    orgName,
    industry: body.industry || '',
    tagline: body.tagline || '',
    mission: body.mission || '',
    description: body.description || '',
    services: Array.isArray(body.services) ? body.services : [],
    targetAudience: body.targetAudience || '',
    achievements: body.achievements || '',
    teamBio: body.teamBio || '',
    testimonials: Array.isArray(body.testimonials) ? body.testimonials : [],
    phone,
    email,
    address: body.address || '',
    socials: body.socials || {},
    logo,
    brandColors: body.brandColors || '',
    stylePreference: body.stylePreference || '',
    referenceWebsites: body.referenceWebsites || '',
    pagesNeeded: Array.isArray(body.pagesNeeded) ? body.pagesNeeded : [],
    pagesOther: body.pagesOther || '',
    languages: Array.isArray(body.languages) ? body.languages : [],
    existingCopy: body.existingCopy || '',
    submitterName,
    submitterRole: body.submitterRole || '',
    submitterPhone: body.submitterPhone || '',
    timestamp: new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' }),
  };

  const attachments = [];
  if (logo) {
    attachments.push({
      filename: logo.filename || 'logo',
      content: Buffer.from(logo.base64, 'base64'),
      contentType: logo.mimeType || 'application/octet-stream',
    });
  }

  const derived = deriveText(data);
  const safeOrgName = orgName.replace(/[/\\:*?"<>|]/g, '').trim().substring(0, 60) || 'Website-Request';

  try {
    const pdfBuffer = await buildPdfBuffer(data, derived);
    attachments.push({
      filename: `Technothera-Website-Request-${safeOrgName}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf',
    });

    await transporter.sendMail({
      from: `"Technothera Website Request" <${process.env.GMAIL_USER}>`,
      to: RECIPIENT,
      replyTo: email,
      subject: `New Website Request — ${orgName}`,
      html: buildEmailHtml(data),
      attachments,
    });
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('[submit-form] failed to send', err);
    res.status(500).json({ error: 'Failed to send submission' });
  }
};
