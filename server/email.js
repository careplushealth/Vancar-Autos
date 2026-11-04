const nodemailer = require('nodemailer');

// Free webmail domains that have strict DMARC policies preventing third-party relay (e.g. SendGrid)
const STRICT_DMARC_DOMAINS = ['@gmail.com', '@googlemail.com', '@yahoo.', '@hotmail.', '@outlook.', '@icloud.'];

/**
 * Direct Brevo (formerly Sendinblue) API v3 Email Dispatch
 * Free tier: 300 emails/day (9,000/month)
 * Deliverability: Sends from Brevo's authenticated mail network with DKIM signing
 */
const sendViaBrevo = async ({ to, subject, html, text }) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) return false;

    const fromEmail = (process.env.BREVO_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'hellovancarautos@gmail.com').trim();
    const fromName = process.env.BREVO_FROM_NAME || process.env.SENDGRID_FROM_NAME || 'Vancar Autos';
    const replyToEmail = (process.env.REPLY_TO_EMAIL || 'hellovancarautos@gmail.com').trim();

    const payload = {
        sender: { name: fromName, email: fromEmail },
        to: [{ email: to.trim() }],
        replyTo: { name: fromName, email: replyToEmail },
        subject: subject,
        htmlContent: html,
        textContent: text || subject
    };

    try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'api-key': apiKey.trim(),
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 201 || response.ok) {
            console.log(`[Brevo] Successfully dispatched email to: ${to}`);
            return true;
        } else {
            const errBody = await response.text();
            console.error(`[Brevo Error] Status ${response.status} sending to ${to}:`, errBody);
            return false;
        }
    } catch (err) {
        console.error(`[Brevo Connection Error] Failed sending to ${to}:`, err.message);
        return false;
    }
};

/**
 * Direct SendGrid API v3 Email Dispatch
 * Uses SendGrid's native REST API with deliverability optimizations
 */
const sendViaSendGrid = async ({ to, subject, html, text }) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return false;

    const fromEmail = (process.env.SENDGRID_FROM_EMAIL || 'hellovancarautos@gmail.com').trim();
    const fromName = process.env.SENDGRID_FROM_NAME || 'Vancar Autos';
    const replyToEmail = (process.env.REPLY_TO_EMAIL || 'hellovancarautos@gmail.com').trim();

    // Check for DMARC violation risk (e.g. sending @gmail.com from SendGrid)
    const isFreeWebmail = STRICT_DMARC_DOMAINS.some(domain => fromEmail.toLowerCase().includes(domain));
    if (isFreeWebmail) {
        console.warn(
            `[Email Deliverability Warning] Sending from '${fromEmail}' via SendGrid triggers strict DMARC / SPF failures on Gmail, Yahoo, and Outlook. ` +
            `This is the primary reason emails get rejected or land in Junk/Spam. ` +
            `To guarantee 100% Inbox delivery: set SENDGRID_FROM_EMAIL to a domain address (e.g. 'noreply@vancarautos.co.uk') with SendGrid DNS authentication, or configure SMTP_PASS in .env to use Gmail's direct SMTP.`
        );
    }

    // RFC 2046 multipart/alternative order: text/plain first, then text/html
    const content = [];
    if (text) {
        content.push({ type: 'text/plain', value: text });
    }
    if (html) {
        content.push({ type: 'text/html', value: html });
    }
    if (content.length === 0) {
        content.push({ type: 'text/plain', value: subject });
    }

    const payload = {
        personalizations: [{ to: [{ email: to.trim() }] }],
        from: { email: fromEmail, name: fromName },
        reply_to: { email: replyToEmail, name: fromName },
        subject: subject,
        content: content,
        // Disable click & open tracking redirects: prevents SendGrid from rewriting links
        // into ct.sendgrid.net URLs, which anti-phishing filters frequently flag as spam/phishing.
        tracking_settings: {
            click_tracking: { enable: false, enable_text: false },
            open_tracking: { enable: false }
        }
    };

    try {
        const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.status === 202 || response.ok) {
            console.log(`[SendGrid] Successfully dispatched email to: ${to}`);
            return true;
        } else {
            const errBody = await response.text();
            console.error(`[SendGrid Error] Status ${response.status} sending to ${to}:`, errBody);
            return false;
        }
    } catch (err) {
        console.error(`[SendGrid Connection Error] Failed sending to ${to}:`, err.message);
        return false;
    }
};

// Initialize fallback/primary SMTP transporter if credentials are provided
const createTransporter = () => {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        return null;
    }

    const port = parseInt(process.env.SMTP_PORT || '587', 10);
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    return nodemailer.createTransport({
        host: host,
        port: port,
        secure: secure,
        auth: {
            user: user,
            pass: pass
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000
    });
};

/**
 * Standard Customer Inquiry Email (via SendGrid, SMTP, or Formspree)
 */
const sendInquiryEmail = async (inquiry) => {
    const recipient = (process.env.CONTACT_EMAIL_RECIPIENT || 'hellovancarautos@gmail.com').trim();
    const replyTo = inquiry.email ? inquiry.email.trim() : (process.env.REPLY_TO_EMAIL || 'hellovancarautos@gmail.com');
    const subject = `Website Inquiry: ${inquiry.name} - ${inquiry.subject || 'General'}`;

    let detailsHtml = '';
    let detailsText = '';
    if (inquiry.type === 'vehicle_inquiry' && inquiry.vehicle_details) {
        const v = inquiry.vehicle_details;
        detailsHtml = `
            <div style="background:#f8fafc; padding:12px; border-radius:6px; margin:15px 0; border-left:3px solid #55A01F;">
                <h4 style="margin:0 0 8px 0; color:#0f172a;">Vehicle of Interest:</h4>
                <p style="margin:2px 0;"><strong>${v.title || ''}</strong></p>
                <p style="margin:2px 0; font-family:monospace; color:#ca8a04;">Registration: ${v.registration || 'N/A'}</p>
                <p style="margin:2px 0;">Price: £${Number(v.price || 0).toLocaleString('en-GB')} | Mileage: ${Number(v.mileage || 0).toLocaleString('en-GB')} miles</p>
            </div>
        `;
        detailsText = `\n\nVEHICLE OF INTEREST:\n- Title: ${v.title || ''}\n- Registration: ${v.registration || 'N/A'}\n- Price: £${Number(v.price || 0).toLocaleString('en-GB')}\n- Mileage: ${Number(v.mileage || 0).toLocaleString('en-GB')} miles`;
    }

    const emailHtml = `
        <div style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width:600px; margin:0 auto; padding:24px; border:1px solid #e2e8f0; border-radius:8px; background:#ffffff;">
            <h2 style="color:#0f172a; margin-top:0;">New Website Inquiry: ${inquiry.subject || 'General'}</h2>
            <p style="margin:6px 0;"><strong>Name:</strong> ${inquiry.name}</p>
            <p style="margin:6px 0;"><strong>Email:</strong> <a href="mailto:${inquiry.email}">${inquiry.email}</a></p>
            <p style="margin:6px 0;"><strong>Phone:</strong> ${inquiry.phone || 'Not provided'}</p>
            <p style="margin:16px 0 6px 0;"><strong>Message:</strong></p>
            <blockquote style="background:#f8fafc; padding:12px 16px; border-left:4px solid #55A01F; margin:10px 0; color:#334155;">
                ${(inquiry.message || '').replace(/\n/g, '<br>')}
            </blockquote>
            ${detailsHtml}
        </div>
    `;

    const emailText = `NEW WEBSITE INQUIRY: ${inquiry.subject || 'General'}\n\nName: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone || 'Not provided'}\n\nMessage:\n${inquiry.message || ''}${detailsText}`;

    // 1. Try Brevo first if configured
    if (process.env.BREVO_API_KEY) {
        const sent = await sendViaBrevo({
            to: recipient,
            subject: subject,
            html: emailHtml,
            text: emailText
        });
        if (sent) return true;
    }

    // 2. Try SendGrid next
    if (process.env.SENDGRID_API_KEY && process.env.EMAIL_PROVIDER !== 'smtp') {
        const sent = await sendViaSendGrid({
            to: recipient,
            subject: subject,
            html: emailHtml,
            text: emailText
        });
        if (sent) return true;
    }

    // 3. Try SMTP fallback
    const transporter = createTransporter();
    if (transporter) {
        try {
            const fromAddress = process.env.SMTP_FROM || `"Vancar Autos" <${process.env.SMTP_USER}>`;
            await transporter.sendMail({
                from: fromAddress,
                to: recipient,
                replyTo: replyTo,
                subject: subject,
                text: emailText,
                html: emailHtml
            });
            console.log(`[SMTP] Successfully delivered inquiry to: ${recipient}`);
            return true;
        } catch (err) {
            console.error('[SMTP Error] Inquiry email:', err.message);
        }
    }

    // 3. Fallback to Formspree
    const formspreeEndpoint = 'https://formspree.io/f/xlgyelej';
    const payload = {
        _subject: subject,
        _replyto: inquiry.email,
        Sender: 'Vancar Autos Website',
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || 'Not provided',
        subject: inquiry.subject || 'General Enquiry',
        message: inquiry.message,
        enquiry_type: inquiry.type
    };

    if (inquiry.type === 'vehicle_inquiry' && inquiry.vehicle_details) {
        const vehicle = inquiry.vehicle_details;
        payload.vehicle_registration = vehicle.registration || 'N/A';
        payload.vehicle_title = vehicle.title;
        payload.vehicle_price = `£${Number(vehicle.price || 0).toLocaleString('en-GB')}`;
        payload.vehicle_mileage = `${Number(vehicle.mileage || 0).toLocaleString('en-GB')} miles`;
        payload.vehicle_year = vehicle.year;
        payload.vehicle_id = vehicle.id;
    }

    try {
        const response = await fetch(formspreeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.ok;
    } catch (err) {
        console.error('[Inquiry Backup Error]:', err.message);
        return false;
    }
};

/**
 * Send the 3 automated finance application emails:
 * 1. Business Email 1 (hellovancarautos@gmail.com)
 * 2. Business Email 2 (tariq@carfinancego.co.uk)
 * 3. Customer Confirmation Email
 */
const sendFinanceApplicationEmails = async (app) => {
    const businessRecipient1 = process.env.FINANCE_EMAIL_RECIPIENT_1 || 'hellovancarautos@gmail.com';
    const businessRecipient2 = process.env.FINANCE_EMAIL_RECIPIENT_2 || 'tariq@carfinancego.co.uk';
    const adminPortalUrl = process.env.ADMIN_PORTAL_URL || 'https://vancarautos.co.uk/admin/finance-applications';

    const results = {
        business1: false,
        business2: false,
        customer: false
    };

    // Format address list for display
    const addressHistoryHtml = (app.addresses || []).map((addr, idx) => `
        <div style="background:#f8fafc; padding:12px; border-radius:6px; margin-bottom:8px; border-left:3px solid #55A01F;">
            <p style="margin:0 0 4px 0; font-weight:bold; font-size:13px; color:#0f172a;">${idx === 0 ? 'Current Address' : `Previous Address #${idx}`}</p>
            <p style="margin:0; font-size:13px; color:#475569;">${addr.doorNumber || ''} ${addr.street || ''}, ${addr.town || ''} ${addr.postcode || ''}</p>
            <p style="margin:4px 0 0 0; font-size:12px; color:#64748b;">Duration: ${addr.years || 0} yrs ${addr.months || 0} mos</p>
        </div>
    `).join('');

    // Vehicle row HTML helper if vehicle was selected
    const vehicleRowHtml = app.vehicle_details ? `
        <tr>
            <td style="padding:8px 0; color:#64748b; font-size:14px;">Vehicle of Interest:</td>
            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:bold;">
                ${app.vehicle_details.title || ''} ${app.vehicle_details.registration ? `(${app.vehicle_details.registration})` : ''} - £${Number(app.vehicle_details.price || 0).toLocaleString('en-GB')}
            </td>
        </tr>
    ` : '';

    const vehicleText = app.vehicle_details ? `\n- Vehicle: ${app.vehicle_details.title || ''} (${app.vehicle_details.registration || 'N/A'}) - £${Number(app.vehicle_details.price || 0).toLocaleString('en-GB')}` : '';

    // =========================================================================
    // 1. VANCAR AUTOS FULL EMAIL TEMPLATE (hellovancarautos@gmail.com)
    // Sends EVERYTHING: Requirements, Personal, Employment, Address, Bank details, Admin Portal link
    // =========================================================================
    const vancarFullEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Finance Application - Full Details</title>
    </head>
    <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f1f5f9; margin:0; padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
            <tr>
                <td style="background:#0f172a; padding:28px 32px; border-bottom:4px solid #55A01F;">
                    <table width="100%">
                        <tr>
                            <td>
                                <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px;">VANCAR AUTOS</h1>
                                <p style="color:#55A01F; margin:4px 0 0 0; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px;">New Finance Application (Full Details)</p>
                            </td>
                            <td align="right">
                                <span style="background:rgba(85,160,31,0.2); color:#7bc94a; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:bold; font-family:monospace;">${app.reference_number || 'REF'}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:32px;">
                    <h2 style="color:#0f172a; font-size:18px; margin:0 0 20px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Finance Requirements</h2>
                    <table width="100%" style="margin-bottom:24px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px; width:45%;">Borrow Amount:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:16px; font-weight:bold;">£${Number(app.borrow_amount || 0).toLocaleString('en-GB')}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Repayment Term:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.term_years} Years (${app.term_years * 12} Months)</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Credit Rating Tier:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.credit_score || 'Not specified'}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Est. Monthly Payment:</td>
                            <td style="padding:8px 0; color:#55A01F; font-size:16px; font-weight:bold;">£${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Representative APR:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.estimated_apr}%</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Est. Total Repayable:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">£${Number(app.total_repayable || 0).toLocaleString('en-GB')}</td>
                        </tr>
                        ${vehicleRowHtml}
                    </table>

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Applicant Personal Details</h2>
                    <table width="100%" style="margin-bottom:24px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px; width:45%;">Full Name:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:bold;">${app.full_name}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Date of Birth:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.date_of_birth}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Marital Status:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.marital_status || 'Not specified'}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Email:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px;"><a href="mailto:${app.email}" style="color:#55A01F; text-decoration:none; font-weight:bold;">${app.email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Phone:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px;"><a href="tel:${app.phone}" style="color:#0f172a; font-weight:bold;">${app.phone}</a></td>
                        </tr>
                    </table>

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Employment & Income</h2>
                    <table width="100%" style="margin-bottom:24px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px; width:45%;">Employment Status:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.employment_status || 'Employed'}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Job Title:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.job_title}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Employer / Company:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px;">${app.employer}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Net Monthly Income:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:15px; font-weight:bold;">£${Number(app.monthly_income || 0).toLocaleString('en-GB')}</td>
                        </tr>
                    </table>

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">3-Year Address History</h2>
                    ${addressHistoryHtml}

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Bank Account Details</h2>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px;">
                        <table width="100%" style="border-collapse:collapse;">
                            <tr>
                                <td style="padding:8px 0; color:#64748b; font-size:14px; width:45%;">Bank Sort Code:</td>
                                <td style="padding:8px 0; color:#0f172a; font-size:16px; font-weight:bold; font-family:monospace; letter-spacing:1.5px;">
                                    ${app.bank_sort_code || app.bank_sort_code_masked || 'N/A'}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0; color:#64748b; font-size:14px;">Account Number:</td>
                                <td style="padding:8px 0; color:#0f172a; font-size:16px; font-weight:bold; font-family:monospace; letter-spacing:1.5px;">
                                    ${app.bank_account_number || app.bank_account_number_masked || 'N/A'}
                                </td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align:center; margin-top:32px;">
                        <a href="${adminPortalUrl}" style="background:#55A01F; color:#ffffff; padding:14px 28px; font-size:15px; font-weight:bold; text-decoration:none; border-radius:8px; display:inline-block;">Open Application in Admin Portal ↗</a>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="background:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8;">
                    Vancar Autos Limited &bull; Yard 1, Midland Street, Manchester, M12 6LB &bull; 07707 700070
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // =========================================================================
    // 2. TARIQ @ CARFINANCEGO BROKER LEAD TEMPLATE
    // Sends Requirements, Applicant Contact, Employment, Address, and Bank details
    // NO Admin Portal Link
    // =========================================================================
    const tariqBrokerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Finance Application Lead</title>
    </head>
    <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f1f5f9; margin:0; padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:650px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
            <tr>
                <td style="background:#0f172a; padding:28px 32px; border-bottom:4px solid #55A01F;">
                    <table width="100%">
                        <tr>
                            <td>
                                <h1 style="color:#ffffff; margin:0; font-size:22px; font-weight:800; letter-spacing:-0.5px;">VANCAR AUTOS</h1>
                                <p style="color:#55A01F; margin:4px 0 0 0; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px;">New Finance Application Notification</p>
                            </td>
                            <td align="right">
                                <span style="background:rgba(85,160,31,0.2); color:#7bc94a; padding:6px 14px; border-radius:20px; font-size:12px; font-weight:bold; font-family:monospace;">${app.reference_number || 'REF'}</span>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr>
                <td style="padding:32px;">
                    <h2 style="color:#0f172a; font-size:18px; margin:0 0 20px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Finance Requirements</h2>
                    <table width="100%" style="margin-bottom:24px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px; width:45%;">Borrow Amount:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:16px; font-weight:bold;">£${Number(app.borrow_amount || 0).toLocaleString('en-GB')}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Repayment Term:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.term_years} Years (${app.term_years * 12} Months)</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Credit Rating Tier:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.credit_score || 'Not specified'}</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Est. Monthly Payment:</td>
                            <td style="padding:8px 0; color:#55A01F; font-size:16px; font-weight:bold;">£${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Representative APR:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.estimated_apr}%</td>
                        </tr>
                        <tr>
                            <td style="padding:8px 0; color:#64748b; font-size:14px;">Est. Total Repayable:</td>
                            <td style="padding:8px 0; color:#0f172a; font-size:14px; font-weight:600;">£${Number(app.total_repayable || 0).toLocaleString('en-GB')}</td>
                        </tr>
                        ${vehicleRowHtml}
                    </table>

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Applicant Personal Details</h2>
                    <table width="100%" style="margin-bottom:24px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px; width:45%;">Full Name:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:bold;">${app.full_name}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Date of Birth:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.date_of_birth}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Marital Status:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.marital_status || 'Not specified'}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Email:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px;"><a href="mailto:${app.email}" style="color:#55A01F; text-decoration:none; font-weight:bold;">${app.email}</a></td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Phone:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px;"><a href="tel:${app.phone}" style="color:#0f172a; font-weight:bold;">${app.phone}</a></td>
                        </tr>
                    </table>

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Employment & Income</h2>
                    <table width="100%" style="margin-bottom:24px; border-collapse:collapse;">
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px; width:45%;">Employment Status:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.employment_status || 'Employed'}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Job Title:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px; font-weight:600;">${app.job_title}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Employer / Company:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:14px;">${app.employer}</td>
                        </tr>
                        <tr>
                            <td style="padding:6px 0; color:#64748b; font-size:14px;">Net Monthly Income:</td>
                            <td style="padding:6px 0; color:#0f172a; font-size:15px; font-weight:bold;">£${Number(app.monthly_income || 0).toLocaleString('en-GB')}</td>
                        </tr>
                    </table>

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Address</h2>
                    ${addressHistoryHtml}

                    <h2 style="color:#0f172a; font-size:18px; margin:24px 0 16px 0; border-bottom:2px solid #e2e8f0; padding-bottom:10px;">Bank Account Details</h2>
                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px; margin-bottom:24px;">
                        <table width="100%" style="border-collapse:collapse;">
                            <tr>
                                <td style="padding:8px 0; color:#64748b; font-size:14px; width:45%;">Bank Sort Code:</td>
                                <td style="padding:8px 0; color:#0f172a; font-size:16px; font-weight:bold; font-family:monospace; letter-spacing:1.5px;">
                                    ${app.bank_sort_code || app.bank_sort_code_masked || 'N/A'}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:8px 0; color:#64748b; font-size:14px;">Account Number:</td>
                                <td style="padding:8px 0; color:#0f172a; font-size:16px; font-weight:bold; font-family:monospace; letter-spacing:1.5px;">
                                    ${app.bank_account_number || app.bank_account_number_masked || 'N/A'}
                                </td>
                            </tr>
                        </table>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="background:#f8fafc; padding:20px 32px; border-top:1px solid #e2e8f0; text-align:center; font-size:12px; color:#94a3b8;">
                    Vancar Autos Limited &bull; Yard 1, Midland Street, Manchester, M12 6LB &bull; 07707 700070
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // Customer Confirmation HTML Template
    const customerFirstName = (app.full_name || '').split(' ')[0] || 'Customer';
    const customerEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Vancar Autos - Finance Application Received</title>
    </head>
    <body style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color:#f1f5f9; margin:0; padding:24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.06);">
            <tr>
                <td style="background:#0f172a; padding:32px; text-align:center; border-bottom:4px solid #55A01F;">
                    <h1 style="color:#ffffff; margin:0; font-size:24px; font-weight:800; letter-spacing:-0.5px;">VANCAR AUTOS</h1>
                    <p style="color:#55A01F; margin:6px 0 0 0; font-size:13px; font-weight:700; text-transform:uppercase; letter-spacing:1.5px;">Vehicle Finance Application</p>
                </td>
            </tr>
            <tr>
                <td style="padding:36px 32px;">
                    <div style="text-align:center; margin-bottom:28px;">
                        <div style="display:inline-block; width:56px; height:56px; line-height:56px; border-radius:50%; background:rgba(85,160,31,0.15); color:#55A01F; font-size:28px; margin-bottom:12px;">✓</div>
                        <h2 style="color:#0f172a; font-size:22px; font-weight:800; margin:0 0 6px 0;">We've Got Your Application — In Process!</h2>
                        <p style="color:#64748b; font-size:15px; margin:0; line-height:1.5;">Thank you, ${customerFirstName}. We have received your finance application and it is now in process. Our specialist finance team is reviewing your profile and will be in touch with you shortly.</p>
                    </div>

                    <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px; padding:20px; margin-bottom:28px; text-align:center;">
                        <span style="font-size:12px; font-weight:bold; color:#64748b; text-transform:uppercase; letter-spacing:1px; display:block; margin-bottom:4px;">Application Reference Number</span>
                        <strong style="font-size:22px; color:#0f172a; font-family:monospace; letter-spacing:1px;">${app.reference_number}</strong>
                    </div>

                    <h3 style="color:#0f172a; font-size:16px; margin:0 0 12px 0;">Your Finance Summary</h3>
                    <table width="100%" style="margin-bottom:28px; border-collapse:collapse; background:#f8fafc; border-radius:8px; padding:12px;">
                        <tr>
                            <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:14px;">Requested Borrow Amount:</td>
                            <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#0f172a; font-size:15px; font-weight:bold; text-align:right;">£${Number(app.borrow_amount || 0).toLocaleString('en-GB')}</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:14px;">Repayment Term:</td>
                            <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#0f172a; font-size:14px; text-align:right;">${app.term_years} Years (${app.term_years * 12} Months)</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#64748b; font-size:14px;">Estimated Monthly Repayment:</td>
                            <td style="padding:10px 14px; border-bottom:1px solid #e2e8f0; color:#55A01F; font-size:16px; font-weight:bold; text-align:right;">£${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo</td>
                        </tr>
                        <tr>
                            <td style="padding:10px 14px; ${app.vehicle_details ? 'border-bottom:1px solid #e2e8f0;' : ''} color:#64748b; font-size:14px;">Illustrative APR:</td>
                            <td style="padding:10px 14px; ${app.vehicle_details ? 'border-bottom:1px solid #e2e8f0;' : ''} color:#0f172a; font-size:14px; text-align:right;">${app.estimated_apr}% Representative</td>
                        </tr>
                        ${app.vehicle_details ? `
                        <tr>
                            <td style="padding:10px 14px; color:#64748b; font-size:14px;">Vehicle of Interest:</td>
                            <td style="padding:10px 14px; color:#0f172a; font-size:14px; font-weight:bold; text-align:right;">${app.vehicle_details.title || ''} ${app.vehicle_details.registration ? `(${app.vehicle_details.registration})` : ''} - £${Number(app.vehicle_details.price || 0).toLocaleString('en-GB')}</td>
                        </tr>
                        ` : ''}
                    </table>

                    <h3 style="color:#0f172a; font-size:16px; margin:0 0 16px 0;">What Happens Next?</h3>
                    <div style="margin-bottom:28px;">
                        <div style="display:flex; margin-bottom:12px;">
                            <span style="background:#55A01F; color:#ffffff; width:24px; height:24px; border-radius:50%; display:inline-block; text-align:center; line-height:24px; font-size:12px; font-weight:bold; margin-right:12px; flex-shrink:0;">1</span>
                            <div>
                                <strong style="color:#0f172a; font-size:14px; display:block;">Application Review</strong>
                                <span style="color:#64748b; font-size:13px;">Our specialist finance team reviews your profile and vehicle preferences.</span>
                            </div>
                        </div>
                        <div style="display:flex; margin-bottom:12px;">
                            <span style="background:#55A01F; color:#ffffff; width:24px; height:24px; border-radius:50%; display:inline-block; text-align:center; line-height:24px; font-size:12px; font-weight:bold; margin-right:12px; flex-shrink:0;">2</span>
                            <div>
                                <strong style="color:#0f172a; font-size:14px; display:block;">Lender Matching (30+ UK Panel Lenders)</strong>
                                <span style="color:#64748b; font-size:13px;">We match your application against our extensive panel of prime and sub-prime lenders to secure the lowest possible APR.</span>
                            </div>
                        </div>
                        <div style="display:flex;">
                            <span style="background:#55A01F; color:#ffffff; width:24px; height:24px; border-radius:50%; display:inline-block; text-align:center; line-height:24px; font-size:12px; font-weight:bold; margin-right:12px; flex-shrink:0;">3</span>
                            <div>
                                <strong style="color:#0f172a; font-size:14px; display:block;">Personal Advisor Contact</strong>
                                <span style="color:#64748b; font-size:13px;">A dedicated advisor will call you within 2-4 business hours to discuss your tailored quote and next steps.</span>
                            </div>
                        </div>
                    </div>

                    <div style="background:#f8fafc; border-left:4px solid #f59e0b; padding:16px; border-radius:6px; margin-bottom:28px;">
                        <h4 style="margin:0 0 4px 0; color:#b45309; font-size:13px;">Important Information</h4>
                        <p style="margin:0; font-size:12px; color:#78350f; line-height:1.5;">
                            Submitting this application does not mean finance has been approved. All applications are subject to status, affordability checks and final lender underwriting. We are a credit broker, not a lender.
                        </p>
                    </div>

                    <div style="border-top:1px solid #e2e8f0; padding-top:20px; text-align:center;">
                        <p style="margin:0 0 8px 0; color:#64748b; font-size:14px;">Questions about your application?</p>
                        <p style="margin:0; font-size:14px; color:#0f172a;">
                            Call us on <strong style="color:#55A01F;">07707 700070</strong> or reply to <a href="mailto:hellovancarautos@gmail.com" style="color:#55A01F; text-decoration:none;">hellovancarautos@gmail.com</a>
                        </p>
                    </div>
                </td>
            </tr>
            <tr>
                <td style="background:#0f172a; padding:24px 32px; text-align:center; font-size:11px; color:#94a3b8; line-height:1.6;">
                    Vancar Autos Limited &bull; Registered in England and Wales (Company No: 16593644)<br>
                    Yard 1, Midland Street, Manchester, M12 6LB<br>
                    &copy; ${new Date().getFullYear()} Vancar Autos Limited. All rights reserved.
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    // Build readable 3-year address history for plain text
    const addressSummaryText = (app.addresses || []).map((addr, idx) => 
        `${idx === 0 ? 'Current Address' : `Previous Address #${idx}`}: ${[addr.doorNumber, addr.street, addr.town, addr.postcode].filter(Boolean).join(', ')} (${addr.years || 0} yrs ${addr.months || 0} mos)`
    ).join('\n');

    // 1. Full Email Plain-Text Alternative (for hellovancarautos@gmail.com)
    const vancarFullEmailText = `NEW VEHICLE FINANCE APPLICATION [${app.reference_number}] - FULL DETAILS
Applicant: ${app.full_name}

FINANCE REQUIREMENTS:
- Reference Number: ${app.reference_number}
- Requested Borrow Amount: £${Number(app.borrow_amount || 0).toLocaleString('en-GB')}
- Repayment Term: ${app.term_years} Years (${app.term_years * 12} Months)
- Credit Score Tier: ${app.credit_score || 'Not specified'}
- Est. Monthly Payment: £${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo
- Representative APR: ${app.estimated_apr}%
- Est. Total Repayable: £${Number(app.total_repayable || 0).toLocaleString('en-GB')}${vehicleText}

APPLICANT PERSONAL DETAILS:
- Full Name: ${app.full_name}
- Date of Birth: ${app.date_of_birth}
- Marital Status: ${app.marital_status || 'Not specified'}
- Email: ${app.email}
- Phone: ${app.phone}

EMPLOYMENT & INCOME:
- Employment Status: ${app.employment_status || 'Employed'}
- Job Title: ${app.job_title}
- Employer / Company: ${app.employer}
- Net Monthly Income: £${Number(app.monthly_income || 0).toLocaleString('en-GB')}

3-YEAR ADDRESS HISTORY:
${addressSummaryText}

BANK DETAILS:
- Bank Sort Code: ${app.bank_sort_code || app.bank_sort_code_masked || 'N/A'}
- Account Number: ${app.bank_account_number || app.bank_account_number_masked || 'N/A'}

Open Application in Admin Portal:
${adminPortalUrl}

Vancar Autos Limited • Yard 1, Midland Street, Manchester, M12 6LB • 07707 700070`;

    // 2. Broker Lead Plain-Text Alternative (for tariq@carfinancego.co.uk)
    const tariqBrokerEmailText = `NEW VEHICLE FINANCE APPLICATION [${app.reference_number}]
Applicant: ${app.full_name}

FINANCE REQUIREMENTS:
- Reference Number: ${app.reference_number}
- Requested Borrow Amount: £${Number(app.borrow_amount || 0).toLocaleString('en-GB')}
- Repayment Term: ${app.term_years} Years (${app.term_years * 12} Months)
- Credit Score Tier: ${app.credit_score || 'Not specified'}
- Est. Monthly Payment: £${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo
- Representative APR: ${app.estimated_apr}%
- Est. Total Repayable: £${Number(app.total_repayable || 0).toLocaleString('en-GB')}${vehicleText}

APPLICANT PERSONAL DETAILS:
- Full Name: ${app.full_name}
- Date of Birth: ${app.date_of_birth}
- Marital Status: ${app.marital_status || 'Not specified'}
- Email: ${app.email}
- Phone: ${app.phone}

EMPLOYMENT & INCOME:
- Employment Status: ${app.employment_status || 'Employed'}
- Job Title: ${app.job_title}
- Employer / Company: ${app.employer}
- Net Monthly Income: £${Number(app.monthly_income || 0).toLocaleString('en-GB')}

ADDRESS HISTORY:
${addressSummaryText}

BANK DETAILS:
- Bank Sort Code: ${app.bank_sort_code || app.bank_sort_code_masked || 'N/A'}
- Account Number: ${app.bank_account_number || app.bank_account_number_masked || 'N/A'}

Vancar Autos Limited • Yard 1, Midland Street, Manchester, M12 6LB • 07707 700070`;

    // 3. Customer Confirmation Plain-Text Alternative (for app.email)
    const customerEmailText = `VANCAR AUTOS - Vehicle Finance Application Confirmation
Reference: ${app.reference_number}

Dear ${customerFirstName},

Thank you for your finance application. We've got your application and it is now in process. Our specialist finance team is reviewing your profile and vehicle preferences.

YOUR FINANCE SUMMARY:
- Reference Number: ${app.reference_number}
- Requested Borrow Amount: £${Number(app.borrow_amount || 0).toLocaleString('en-GB')}
- Repayment Term: ${app.term_years} Years (${app.term_years * 12} Months)
- Estimated Monthly Payment: £${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo
- Illustrative APR: ${app.estimated_apr}% Representative${vehicleText}

WHAT HAPPENS NEXT:
1. Application Review: Our specialist team reviews your profile and vehicle preferences.
2. Lender Matching: We match your application across our panel of 30+ UK lenders to secure the lowest possible APR.
3. Personal Advisor Contact: A dedicated advisor will contact you within 2-4 business hours to discuss your tailored quote and next steps.

Important Notice:
Submitting this application does not mean finance has been approved. All applications are subject to status, affordability checks and final lender underwriting. We are a credit broker, not a lender.

Questions about your application?
Call us on 07707 700070 or reply to hellovancarautos@gmail.com

Vancar Autos Limited
Yard 1, Midland Street, Manchester, M12 6LB
Registered in England and Wales (Company No: 16593644)`;

    const vancarSubject = `New Finance Application [${app.reference_number}] - ${app.full_name}`;
    const tariqSubject = `New Finance Application [${app.reference_number}] - ${app.full_name} (£${Number(app.borrow_amount || 0).toLocaleString('en-GB')})`;
    const customerSubject = `We've received your finance application [${app.reference_number}] - In Process | Vancar Autos`;

    // 1. Dispatch via Brevo API if BREVO_API_KEY is available (Primary high-deliverability provider)
    if (process.env.BREVO_API_KEY) {
        console.log('[Finance Email] Using Brevo API for transactional email delivery...');

        // Email 1: Vancar Autos Gmail (Full Details)
        results.business1 = await sendViaBrevo({
            to: businessRecipient1,
            subject: vancarSubject,
            html: vancarFullEmailHtml,
            text: vancarFullEmailText
        });

        // Email 2: Tariq at CarFinanceGo (Requirements & Contact Only)
        results.business2 = await sendViaBrevo({
            to: businessRecipient2,
            subject: tariqSubject,
            html: tariqBrokerEmailHtml,
            text: tariqBrokerEmailText
        });

        // Email 3: Customer Confirmation Email (Receipt & Status)
        if (app.email) {
            results.customer = await sendViaBrevo({
                to: app.email,
                subject: customerSubject,
                html: customerEmailHtml,
                text: customerEmailText
            });
        }

        console.log(`[Finance Email] Brevo delivery summary: Business1=${results.business1}, Business2=${results.business2}, Customer=${results.customer}`);
    }

    // 2. Dispatch via SendGrid API if SendGrid is configured and emails weren't dispatched by Brevo
    if (process.env.SENDGRID_API_KEY && (!results.business1 || !results.business2 || (!results.customer && app.email)) && process.env.EMAIL_PROVIDER !== 'smtp') {
        console.log('[Finance Email] Using SendGrid API for transactional email delivery...');

        // Email 1: Vancar Autos Gmail (Full Details)
        if (!results.business1) {
            results.business1 = await sendViaSendGrid({
                to: businessRecipient1,
                subject: vancarSubject,
                html: vancarFullEmailHtml,
                text: vancarFullEmailText
            });
        }

        // Email 2: Tariq at CarFinanceGo (Requirements & Contact Only)
        if (!results.business2) {
            results.business2 = await sendViaSendGrid({
                to: businessRecipient2,
                subject: tariqSubject,
                html: tariqBrokerEmailHtml,
                text: tariqBrokerEmailText
            });
        }

        // Email 3: Customer Confirmation Email (Receipt & Status)
        if (!results.customer && app.email) {
            results.customer = await sendViaSendGrid({
                to: app.email,
                subject: customerSubject,
                html: customerEmailHtml,
                text: customerEmailText
            });
        }

        console.log(`[Finance Email] SendGrid delivery summary: Business1=${results.business1}, Business2=${results.business2}, Customer=${results.customer}`);
    }

    // 3. Fallback to Nodemailer SMTP for any unsent emails (or as primary if EMAIL_PROVIDER === 'smtp')
    const transporter = createTransporter();
    if (transporter && (!results.business1 || !results.business2 || (!results.customer && app.email))) {
        console.log('[Finance Email] Executing SMTP dispatch for pending emails...');
        const fromAddress = process.env.SMTP_FROM || `"Vancar Autos" <${process.env.SMTP_USER}>`;
        const replyTo = (process.env.REPLY_TO_EMAIL || 'hellovancarautos@gmail.com').trim();

        // Send Email 1: Vancar Full Details
        if (!results.business1) {
            try {
                await transporter.sendMail({
                    from: fromAddress,
                    to: businessRecipient1,
                    replyTo: replyTo,
                    subject: vancarSubject,
                    text: vancarFullEmailText,
                    html: vancarFullEmailHtml
                });
                results.business1 = true;
                console.log(`[SMTP] Successfully delivered business email 1 to: ${businessRecipient1}`);
            } catch (err) {
                console.error(`[SMTP Error] Business Email 1:`, err.message);
            }
        }

        // Send Email 2: Tariq Lead Only
        if (!results.business2) {
            try {
                await transporter.sendMail({
                    from: fromAddress,
                    to: businessRecipient2,
                    replyTo: replyTo,
                    subject: tariqSubject,
                    text: tariqBrokerEmailText,
                    html: tariqBrokerEmailHtml
                });
                results.business2 = true;
                console.log(`[SMTP] Successfully delivered business email 2 to: ${businessRecipient2}`);
            } catch (err) {
                console.error(`[SMTP Error] Business Email 2:`, err.message);
            }
        }

        // Send Email 3: Customer Receipt
        if (!results.customer && app.email) {
            try {
                await transporter.sendMail({
                    from: fromAddress,
                    to: app.email,
                    replyTo: replyTo,
                    subject: customerSubject,
                    text: customerEmailText,
                    html: customerEmailHtml
                });
                results.customer = true;
                console.log(`[SMTP] Successfully delivered customer email to: ${app.email}`);
            } catch (err) {
                console.error(`[SMTP Error] Customer Email:`, err.message);
            }
        }
    }

    // 3. Always dispatch backup lead alert to Formspree with ALL application details
    try {
        const formspreeEndpoint = 'https://formspree.io/f/xlgyelej';
        
        // Build readable 3-year address history string for Formspree
        const addressSummary = (app.addresses || []).map((a, idx) => 
            `[${idx === 0 ? 'Current' : `Prev #${idx}`}] ${[a.doorNumber, a.street, a.town, a.postcode].filter(Boolean).join(', ')} (${a.years || 0}y ${a.months || 0}m)`
        ).join(' | ');

        await fetch(formspreeEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
                _subject: `New Vehicle Finance Application [${app.reference_number}] - ${app.full_name} (£${Number(app.borrow_amount || 0).toLocaleString('en-GB')})`,
                _replyto: app.email,
                _from: 'Vancar Autos Finance System',
                Submission_Title: 'Vancar Autos - New Vehicle Finance Application',
                Reference_Number: app.reference_number,
                Full_Name: app.full_name,
                Date_of_Birth: app.date_of_birth,
                Marital_Status: app.marital_status || 'Not specified',
                Applicant_Email: app.email,
                Applicant_Phone: app.phone,
                Bank_Sort_Code: app.bank_sort_code || app.bank_sort_code_masked || 'N/A',
                Bank_Account_Number: app.bank_account_number || app.bank_account_number_masked || 'N/A',
                Address_History_3_Years: addressSummary,
                Employment_Status: app.employment_status || 'Employed',
                Job_Title: app.job_title,
                Employer_Company: app.employer,
                Net_Monthly_Income: `£${Number(app.monthly_income || 0).toLocaleString('en-GB')}`,
                Borrow_Amount: `£${Number(app.borrow_amount || 0).toLocaleString('en-GB')}`,
                Term: `${app.term_years} Years (${app.term_years * 12} Months)`,
                Credit_Score_Tier: app.credit_score || 'Not specified',
                Estimated_Monthly_Payment: `£${Number(app.estimated_monthly || 0).toLocaleString('en-GB')} / mo`,
                Representative_APR: `${app.estimated_apr}%`,
                Total_Repayable: `£${Number(app.total_repayable || 0).toLocaleString('en-GB')}`,
                Total_Interest: `£${Number(app.total_interest || 0).toLocaleString('en-GB')}`,
                Vehicle_Details: app.vehicle_details ? `${app.vehicle_details.title || ''} (${app.vehicle_details.registration || 'N/A'}) - £${Number(app.vehicle_details.price || 0).toLocaleString('en-GB')}` : 'None selected',
                Admin_Portal_Direct_Link: adminPortalUrl
            })
        });
        console.log('[Finance Email] Formspree backup notification dispatched successfully.');
    } catch (err) {
        console.error('[Formspree Backup Error]:', err.message);
    }

    return results;
};

module.exports = {
    sendInquiryEmail,
    sendFinanceApplicationEmails
};
