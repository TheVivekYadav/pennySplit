// utils/mail/mailService.js

import Mailgen from "mailgen";
import nodemailer from "nodemailer";

export const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: "default",
        product: {
            name: "PennySplit",
            link: "https://live.thevivekyadav.me",
        },
    });

    const emailHtml = mailGenerator.generate(options.mailGenContent);
    const emailText = mailGenerator.generatePlaintext(options.mailGenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAILTRAP_SMTP_HOST,
        port: process.env.MAILTRAP_SMTP_PORT,
        secure: false,
        auth: {
            user: process.env.MAILTRAP_SMTP_USER,
            pass: process.env.MAILTRAP_SMTP_PASS,
        },
    });

    const mail = {
        from: `"PennySplit" <${process.env.MAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: emailText,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(mail);
    } catch (err) {
        console.error("Email sending failed:", err.message);
        throw new Error("Could not send email.");
    }
};
