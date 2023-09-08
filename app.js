const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const cron = require('node-cron'); // Import node-cron
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Function to send email
const sendEmailReminder = async () => {
    const { to, subject, text } = req.body;

    const emailData = {
        to,
        from: process.env.VERIFIED_EMAIL,
        subject,
        text,
    };

    try {
        // Use the promise returned by sgMail.send to handle success and error
        await sgMail.send(emailData);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

// Schedule the email sending task to run every day at 8:00 AM
cron.schedule('* * * * *', () => {
    sendEmailReminder();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
