export const emailVerificationMailGenContent = (username, verificationUrl) => ({
    body: {
        name: username,
        intro: "Welcome to PennySplit! Please verify your email to get started.",
        action: {
            instructions: "Click the button below to verify your account:",
            button: {
                color: "#22BC66",
                text: "Verify Email",
                link: verificationUrl,
            },
        },
        outro: "Need help? Just reply to this email.",
    },
});

export const forgotPasswordMailGenContent = (username, resetUrl) => ({
    body: {
        name: username,
        intro: "You requested to reset your password.",
        action: {
            instructions: "Click below to reset your password:",
            button: {
                color: "#FF5733",
                text: "Reset Password",
                link: resetUrl,
            },
        },
        outro: "If you didn’t request this, you can safely ignore it.",
    },
});

export const emailConfirmationMailGenContent = (username, detailUrl) => ({
    body: {
        name: username,
        intro: "Thank you for booking with PennySplit!",
        action: {
            instructions: "Click below to view your booking details:",
            button: {
                color: "#3366FF",
                text: "View Booking",
                link: detailUrl,
            },
        },
        outro: "Enjoy your event! Reach out if you need help.",
    },
});
