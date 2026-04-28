import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env';
import { logger } from '../config/logger';

interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface StageAdvancedPayload {
  proposalName: string;
  proposalCode: string;
  fromStage: string;
  toStage: string;
  advancedBy: string;
  recipients: string[];
}

interface CommentAddedPayload {
  proposalName: string;
  proposalCode: string;
  sectionTitle: string;
  commenterName: string;
  commentPreview: string;
  recipients: string[];
}

interface ReviewRequestPayload {
  proposalName: string;
  proposalCode: string;
  reviewType: 'pm' | 'management';
  requestedBy: string;
  recipients: string[];
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

class EmailService {
  private transporter: Transporter | null = null;

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    switch (env.EMAIL_TRANSPORT) {
      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          secure: env.SMTP_PORT === 465,
          auth: env.SMTP_USER
            ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
            : undefined,
        });
        break;

      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: { user: 'apikey', pass: env.SENDGRID_API_KEY },
        });
        break;

      case 'ses':
        // Use AWS SES SMTP endpoint — configure per-region
        this.transporter = nodemailer.createTransport({
          host: `email-smtp.${env.AWS_REGION}.amazonaws.com`,
          port: 587,
          auth: { user: env.AWS_ACCESS_KEY_ID, pass: env.AWS_SECRET_ACCESS_KEY },
        });
        break;

      case 'console':
      default:
        // No actual transport — log to console only
        this.transporter = nodemailer.createTransport({ jsonTransport: true });
        break;
    }

    return this.transporter;
  }

  private baseTemplate(title: string, bodyHtml: string): string {
    return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: Arial, sans-serif; font-size: 14px; color: #333; background: #f5f7fa; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 32px auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
  .header { background: #1e3a5f; color: white; padding: 24px 32px; }
  .header h1 { margin: 0; font-size: 20px; }
  .header p { margin: 4px 0 0; font-size: 13px; opacity: 0.8; }
  .body { padding: 32px; }
  .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: #e8f0fe; color: #1a56db; }
  .action-box { background: #f0f4ff; border-left: 4px solid #1a56db; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
  .footer { background: #f8f9fb; padding: 16px 32px; font-size: 12px; color: #888; border-top: 1px solid #eee; }
  a.button { display: inline-block; background: #1e3a5f; color: white; text-decoration: none; padding: 10px 24px; border-radius: 6px; font-size: 14px; margin-top: 16px; }
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>${title}</h1>
    <p>BioPropose — Biologics Proposal Management</p>
  </div>
  <div class="body">${bodyHtml}</div>
  <div class="footer">This is an automated notification from BioPropose. Do not reply to this email.</div>
</div>
</body>
</html>`;
  }

  async send(payload: EmailPayload): Promise<void> {
    const transport = this.getTransporter();
    const recipients = Array.isArray(payload.to) ? payload.to.join(',') : payload.to;

    if (env.EMAIL_TRANSPORT === 'console') {
      logger.info({ to: recipients, subject: payload.subject }, '[Email] [console transport] Would send email');
      return;
    }

    try {
      await transport.sendMail({
        from: env.EMAIL_FROM,
        to: recipients,
        subject: payload.subject,
        html: payload.html,
        text: payload.text ?? payload.html.replace(/<[^>]+>/g, ''),
      });
      logger.info(`[Email] Sent "${payload.subject}" to ${recipients}`);
    } catch (err) {
      // Email failures are non-fatal — log and continue
      logger.error({ err }, '[Email] Failed to send email');
    }
  }

  async notifyStageAdvanced(payload: StageAdvancedPayload): Promise<void> {
    if (!payload.recipients.length) return;

    const html = this.baseTemplate(
      'Proposal Stage Advanced',
      `<p>The following proposal has been advanced to a new stage.</p>
      <div class="action-box">
        <p><strong>Proposal:</strong> ${escapeHtml(payload.proposalName)} <span class="badge">${escapeHtml(payload.proposalCode)}</span></p>
        <p><strong>From Stage:</strong> ${escapeHtml(payload.fromStage)}</p>
        <p><strong>To Stage:</strong> <strong>${escapeHtml(payload.toStage)}</strong></p>
        <p><strong>Advanced by:</strong> ${escapeHtml(payload.advancedBy)}</p>
      </div>
      <p>Please log in to BioPropose to review and take any required action.</p>`,
    );

    await this.send({
      to: payload.recipients,
      subject: `[BioPropose] Stage Advanced: ${payload.proposalCode} → ${payload.toStage}`,
      html,
    });
  }

  async notifyCommentAdded(payload: CommentAddedPayload): Promise<void> {
    if (!payload.recipients.length) return;

    const html = this.baseTemplate(
      'New Comment on Proposal',
      `<p><strong>${escapeHtml(payload.commenterName)}</strong> added a comment on the <strong>${escapeHtml(payload.sectionTitle)}</strong> section.</p>
      <div class="action-box">
        <p><strong>Proposal:</strong> ${escapeHtml(payload.proposalName)} <span class="badge">${escapeHtml(payload.proposalCode)}</span></p>
        <p><em>"${escapeHtml(payload.commentPreview)}${payload.commentPreview.length >= 200 ? '...' : ''}"</em></p>
      </div>`,
    );

    await this.send({
      to: payload.recipients,
      subject: `[BioPropose] New comment on ${payload.proposalCode}`,
      html,
    });
  }

  async notifyReviewRequested(payload: ReviewRequestPayload): Promise<void> {
    if (!payload.recipients.length) return;

    const reviewLabel = payload.reviewType === 'pm' ? 'PM Review' : 'Management Review';

    const html = this.baseTemplate(
      `Action Required: ${reviewLabel}`,
      `<p>Your review is required for the following proposal.</p>
      <div class="action-box">
        <p><strong>Proposal:</strong> ${escapeHtml(payload.proposalName)} <span class="badge">${escapeHtml(payload.proposalCode)}</span></p>
        <p><strong>Review Type:</strong> ${escapeHtml(reviewLabel)}</p>
        <p><strong>Requested by:</strong> ${escapeHtml(payload.requestedBy)}</p>
      </div>
      <p>Please log in to BioPropose to complete your review.</p>`,
    );

    await this.send({
      to: payload.recipients,
      subject: `[BioPropose] Action Required: ${reviewLabel} for ${payload.proposalCode}`,
      html,
    });
  }
}

export const emailService = new EmailService();
