const express = require('express');
const cors = require('cors');
const axios = require('axios');
const dotenv = require('dotenv');
const sgMail = require('@sendgrid/mail');
const schedule = require('node-schedule');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/add-reminder', async (req, res) => {
    const { to, subject, text, dueTime } = req.body;

    try {
        // Implement validation for the dueTime format (you can customize this)
        const parsedDueTime = new Date(dueTime);
        if (isNaN(parsedDueTime)) {
            return res.status(400).json({ error: 'Invalid dueTime format. Please use a valid date and time.' });
        }

        // Send a POST request to the Mock API to schedule the reminder
        await axios.post('https://64d8e4865f9bf5b879cea997.mockapi.io/reminders', {
            to,
            subject,
            text,
            dueTime: parsedDueTime.toISOString(), // Convert to ISO format
        });

        res.status(200).json({ message: 'Reminder scheduled successfully.' });
    } catch (error) {
        console.error('Error scheduling reminder:', error);
        res.status(500).json({ error: 'An error occurred while scheduling the reminder.' });
    }
});

// Schedule a recurring job to send reminders (if needed)
schedule.scheduleJob('0 * * * *', async () => {
    try {
        // Implement logic to check for due reminders in the Mock API
        // For example, send a GET request to the Mock API to fetch due reminders
        const response = await axios.get('https://64d8e4865f9bf5b879cea997.mockapi.io/reminders');

        const dueReminders = response.data.filter((reminder) => {
            // Implement logic to determine if a reminder is due
            const dueTime = new Date(reminder.dueTime).getTime();
            const now = Date.now();
            return dueTime <= now;
        });

        // Send emails using SendGrid
        for (const reminder of dueReminders) {
            const { to, subject, text } = reminder;

            const emailData = {
                to,
                from: process.env.SENDGRID_SENDER_EMAIL, // Replace with your SendGrid sender email
                subject,
                text,
                // Add other email properties as needed
            };

            // Send the email using SendGrid
            await sgMail.send(emailData);

            // After sending the email, you can optionally delete the reminder
            // Implement logic to delete the reminder from the Mock API
            await axios.delete(`https://64d8e4865f9bf5b879cea997.mockapi.io/reminders/${reminder.id}`);
        }

        console.log('Sent reminders (if any)');
    } catch (error) {
        console.error('Error sending reminders:', error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
