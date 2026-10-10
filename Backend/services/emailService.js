
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY is not configured');
        }

        if (!process.env.EMAIL_FROM) {
            throw new Error('EMAIL_FROM is not configured');
        }

        const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM,
            to: [options.email],
            subject: options.subject,
            html: options.html
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log(`Email sent to ${options.email}`);
        return data;
    } catch (error) {
        console.error('Error sending email:', error.message);
        throw error;
    }
};

module.exports = { sendEmail };


