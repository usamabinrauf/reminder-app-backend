const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const axios = require('axios');
const dotenv = require('dotenv');
const schedule = require('node-schedule');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/add-reminder', async (req, res) => {
    const { to, subject, text, dueTime } = req.body;

    try {
        // Schedule the reminder and simulate adding it to a database
        await scheduleReminder(to, subject, text, dueTime);

        res.status(200).json({ message: 'Reminder added successfully.' });
    } catch (error) {
        console.error('Error adding reminder:', error);
        res.status(500).json({ error: 'An error occurred while adding the reminder.' });
    }
});

// Function to schedule a reminder
async function scheduleReminder(to, subject, text, dueTime) {
    const now = new Date();
    const deadline = new Date(dueTime);

    if (deadline <= now) {
        console.log('The deadline has already passed.');
        return;
    }

    // Calculate the delay for sending the reminder
    const delay = deadline - now;

    // Schedule a job to send the reminder email
    schedule.scheduleJob(deadline, async () => {
        const emailData = {
            to,
            from: process.env.VERIFIED_EMAIL,
            subject,
            text,
        };

        try {
            // Simulate sending the email
            await sendEmail(emailData);
        } catch (error) {
            console.error('Error sending email:', error);
        }
    });
}

// Function to simulate sending an email
async function sendEmail(emailData) {
    try {
        // Simulate sending the email via a mock API
        await axios.post('https://64d8e4865f9bf5b879cea997.mockapi.io/reminders', emailData);
        console.log('Email sent successfully.');
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
