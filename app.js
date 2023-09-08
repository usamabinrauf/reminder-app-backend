const express = require('express');
const cors = require('cors');
const sgMail = require('@sendgrid/mail');
const cron = require('node-cron');
const admin = require('firebase-admin'); // Firebase Admin SDK
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

// Initialize Firebase Admin SDK (make sure to initialize it with your Firebase Admin credentials)
admin.initializeApp({
    credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

// Schedule email reminders using node-cron
cron.schedule('* * * * *', async () => {
    try {
        const now = Date.now();
        const deadlineTimeFrame = 60000; // 1 minute (adjust as needed)

        // Query reminders where the deadline is within the specified time frame
        const querySnapshot = await admin.firestore()
            .collection('reminders')
            .where('deadline', '>=', now)
            .where('deadline', '<=', now + deadlineTimeFrame)
            .get();

        // Iterate through the query results and send email reminders
        querySnapshot.forEach(async (doc) => {
            const reminder = doc.data();

            // Send email reminder using SendGrid
            await sgMail.send({
                to: reminder.email,
                subject: `Reminder: ${reminder.title} Deadline`,
                text: reminder.description,
            });
        });
    } catch (error) {
        console.error('Error sending scheduled email reminders:', error);
    }
});

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
    console.log(Date.now());
    console.log(`Server is running on port ${PORT}`);
});
