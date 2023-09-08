const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

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

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});