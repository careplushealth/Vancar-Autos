const nodemailer = require('nodemailer');

/**
 * Direct SendGrid API v3 Email Dispatch
 * Uses SendGrid's native high-deliverability REST API
 */
const sendViaSendGrid = async ({ to, subject, html, text }) => {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (!apiKey) return false;

    const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'hellovancarautos@gmail.com';
    const fromName = process.env.SENDGRID_FROM_NAME || 'Vancar Autos';

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
        personalizations: [{ to: [{ email: to }] }],
        from: { email: fromEmail, name: fromName },
        subject: subject,
        content: content
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
            console.log(`[SendGrid] Successfully delivered email to: ${to}`);
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

// Initialize fallback SMTP transporter if credentials are provided
const createTransporter = () => {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host: host,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: user,
            pass: pass
        }
    });
};

/**
 * Standard Customer Inquiry Email (via SendGrid, SMTP, or Formspree)
 */
const sendInquiryEmail = async (inquiry) => {
    const recipient = process.env.CONTACT_EMAIL_RECIPIENT || 'hellovancarautos@gmail.com';

    // 1. Try SendGrid first
    if (process.env.SENDGRID_API_KEY) {
        let detailsHtml = '';
        if (inquiry.type === 'vehicle_inquiry' && inquiry.vehicle_details) {
            const v = inquiry.vehicle_details;
            detailsHtml = `
                <div style="background:#f8fafc; padding:12px; border-radius:6px; margin:15px 0;">
                    <h4 style="margin:0 0 8px 0; color:#0f172a;">Vehicle of Interest:</h4>
                    <p style="margin:2px 0;"><strong>${v.title || ''}</strong></p>
                    <p style="margin:2px 0; font-family:monospace; color:#ca8a04;">Registration: ${v.registration || 'N/A'}</p>
                    <p style="margin:2px 0;">Price: £${Number(v.price || 0).toLocaleString('en-GB')} | Mileage: ${Number(v.mileage || 0).toLocaleString('en-GB')} miles</p>
                </div>
            `;
        }

        const emailHtml = `
            <div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
                <h2 style="color:#0f172a; margin-top:0;">New Website Inquiry: ${inquiry.subject || 'General'}</h2>
                <p><strong>Name:</strong> ${inquiry.name}</p>
                <p><strong>Email:</strong> ${inquiry.email}</p>
                <p><strong>Phone:</strong> ${inquiry.phone || 'Not provided'}</p>
                <p><strong>Message:</strong></p>
                <blockquote style="background:#f1f5f9; padding:12px; border-left:4px solid #55A01F; margin:10px 0;">
                    ${(inquiry.message || '').replace(/\n/g, '<br>')}
                </blockquote>
                ${detailsHtml}
            </div>
        `;

        const sent = await sendViaSendGrid({
            to: recipient,
            subject: `Website Inquiry: ${inquiry.name} - ${inquiry.subject || 'General'}`,
            html: emailHtml,
            text: `Name: ${inquiry.name}\nEmail: ${inquiry.email}\nPhone: ${inquiry.phone}\nMessage: ${inquiry.message}`
        });

        if (sent) return true;
    }

    // 2. Fallback to Formspree
    const formspreeEndpoint = 'https://formspree.io/f/xlgyelej';
    const payload = {
        _subject: `Website Inquiry: ${inquiry.name} - ${inquiry.subject || 'General'}`,
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

    // Business Email HTML Template
    const businessEmailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>New Finance Application</title>
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
                        <h2 style="color:#0f172a; font-size:22px; font-weight:800; margin:0 0 6px 0;">Application Submitted Successfully!</h2>
                        <p style="color:#64748b; font-size:15px; margin:0;">Thank you, ${customerFirstName}. Your finance application and information have been safely submitted. Our specialist team is reviewing your application and you will hear back from us soon.</p>
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
                            <td style="padding:10px 14px; color:#64748b; font-size:14px;">Illustrative APR:</td>
                            <td style="padding:10px 14px; color:#0f172a; font-size:14px; text-align:right;">${app.estimated_apr}% Representative</td>
                        </tr>
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

    // 1. Dispatch via SendGrid API if SENDGRID_API_KEY is available
    if (process.env.SENDGRID_API_KEY) {
        console.log('[Finance Email] Using SendGrid API for transactional email delivery...');

        // Email 1: First Business Email
        const b1 = await sendViaSendGrid({
            to: businessRecipient1,
            subject: `New Finance Application [${app.reference_number}] - ${app.full_name} (£${Number(app.borrow_amount || 0).toLocaleString('en-GB')})`,
            html: businessEmailHtml
        });
        results.business1 = b1;

        // Email 2: Second Business Email
        const b2 = await sendViaSendGrid({
            to: businessRecipient2,
            subject: `New Finance Application [${app.reference_number}] - ${app.full_name} (£${Number(app.borrow_amount || 0).toLocaleString('en-GB')})`,
            html: businessEmailHtml
        });
        results.business2 = b2;

        // Email 3: Customer Confirmation Email
        if (app.email) {
            const cust = await sendViaSendGrid({
                to: app.email,
                subject: `Your Vancar Autos Finance Application Confirmation [${app.reference_number}]`,
                html: customerEmailHtml
            });
            results.customer = cust;
        }

        console.log(`[Finance Email] SendGrid delivery summary: Business1=${results.business1}, Business2=${results.business2}, Customer=${results.customer}`);
    }

    // 2. Fallback to Nodemailer SMTP if SendGrid wasn't used or failed
    const transporter = createTransporter();
    if (transporter) {
        const fromAddress = process.env.SMTP_FROM || `"Vancar Autos" <${process.env.SMTP_USER}>`;

        // Send Email 1
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: businessRecipient1,
                subject: `New Finance Application [${app.reference_number}] - ${app.full_name} (£${Number(app.borrow_amount || 0).toLocaleString('en-GB')})`,
                html: businessEmailHtml
            });
            results.business1 = true;
        } catch (err) {
            console.error(`[SMTP Error] Business Email 1:`, err.message);
        }

        // Send Email 2
        try {
            await transporter.sendMail({
                from: fromAddress,
                to: businessRecipient2,
                subject: `New Finance Application [${app.reference_number}] - ${app.full_name} (£${Number(app.borrow_amount || 0).toLocaleString('en-GB')})`,
                html: businessEmailHtml
            });
            results.business2 = true;
        } catch (err) {
            console.error(`[SMTP Error] Business Email 2:`, err.message);
        }

        // Send Email 3
        if (app.email) {
            try {
                await transporter.sendMail({
                    from: fromAddress,
                    to: app.email,
                    subject: `Your Vancar Autos Finance Application Confirmation [${app.reference_number}]`,
                    html: customerEmailHtml
                });
                results.customer = true;
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
                Bank_Sort_Code: app.bank_sort_code || 'N/A',
                Bank_Account_Number: app.bank_account_number || 'N/A',
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
