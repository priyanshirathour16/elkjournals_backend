/**
 * Email Helper - Utilities for sending emails with email_trigger checks
 */

const emailService = require("./emailService");

/**
 * Send email with email_trigger check
 * @param {Object} emailData - Email data with to, subject, html, etc.
 * @param {boolean} emailTrigger - Whether email_trigger is enabled (from token)
 * @param {boolean} skipTriggerCheck - Skip email_trigger check (for welcome emails on creation)
 */
async function sendEmailWithTrigger(
  emailData,
  emailTrigger = true,
  skipTriggerCheck = false,
) {
  try {
    await emailService.sendEmail({
      ...emailData,
      checkEmailTrigger: !skipTriggerCheck,
      emailTrigger: emailTrigger,
    });
    console.log(`✓ Email sent to ${emailData.to}`);
  } catch (emailError) {
    console.error(
      `Email sending failed to ${emailData.to}:`,
      emailError.message,
    );
    // Don't throw - let the operation continue even if email fails
  }
}

module.exports = {
  sendEmailWithTrigger,
};
