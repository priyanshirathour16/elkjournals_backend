const { SendMailClient } = require("zeptomail");

const url = "https://api.zeptomail.in/v1.1/email";
const token = "Zoho-enczapikey PHtE6r0LQuzsgm4np0BVt/O+QpWsZ9kv/u1ufQgUtt4RDaVQHU1cq9h6kjG+o00uUaFFHP/OyYM+57rJu+zXIz65PWlEDmqyqK3sx/VYSPOZsbq6x00YuVwdfk3YXIHmddRj0iHUuNzYNA==";

class EmailService {
    constructor() {
        this.client = new SendMailClient({ url, token });
    }

    /**
     * Send email
     * @param {Object} options - Email options
     * @param {string} options.to - Recipient email
     * @param {string} options.subject - Email subject
     * @param {string} options.html - HTML content
     * @param {string} options.text - Plain text content (optional)
     */
    async sendEmail({ to, subject, html, text }) {
        try {
            const mailOptions = {
                "from": {
                    "address": "noreply@irissecuritysolutions.in",
                    "name": "noreply"
                },
                "to": [
                    {
                        "email_address": {
                            "address": to,
                            "name": "Recipient"
                        }
                    }
                ],
                "subject": subject,
                "htmlbody": html,
            };

            const info = await this.client.sendMail(mailOptions);
            console.log('Email sent successfully');
            return {
                success: true,
                messageId: info?.data?.messageId // ZeptoMail response structure might vary, preserving safety
            };
        } catch (error) {
            console.error('Email sending failed:', error);
            throw new Error(`Failed to send email: ${error.message}`);
        }
    }

    /**
     * Verify email configuration
     * Deprecated for ZeptoMail as it uses API.
     */
    async verifyConnection() {
        // ZeptoMail client is initialized synchronously with token/url.
        // There isn't a direct "verify" method like SMTP.
        console.log('Email service is using ZeptoMail API');
        return true;
    }
}

module.exports = new EmailService();