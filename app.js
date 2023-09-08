const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
const axios = require('axios');
const schedule = require('node-schedule');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const mockApiUrl = 'https://64d8e4865f9bf5b879cea997.mockapi.io/reminders'; // Replace with your Mock API URL

app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

app.post('/send-email', async (req, res) => {
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
        res.status(200).json({ message: 'Email sent successfully.' });
    } catch (error) {
        console.error('Error sending email:', error);

        // Handle the error by sending an error response to the client
        res.status(500).json({ error: 'An error occurred while sending the email.' });
    }
});

// Schedule a recurring job to check for pending emails and send them
schedule.scheduleJob('0 * * * *', async () => {
    try {
        // Retrieve pending emails from the Mock API
        const response = await axios.get(mockApiUrl);
        const pendingEmails = response.data.filter((email) => email.status === 'pending');

        for (const email of pendingEmails) {
            await sgMail.send(email);
            // Update the status of the email in the Mock API to 'sent'
            await axios.put(`${mockApiUrl}/${email.id}`, { status: 'sent' });
        }
    } catch (error) {
        console.error('Error sending pending emails:', error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
