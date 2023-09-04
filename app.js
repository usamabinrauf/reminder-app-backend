const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const sgMail = require('@sendgrid/mail');
const dotenv = require('dotenv');
const schedule = require('node-schedule');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firebase Admin SDK
const serviceAccount = {
    type: process.env.FIREBASE_TYPE,
    project_id: process.env.FIREBASE_PROJECT_ID,
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
    private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'), // Replace escape characters
    client_email: process.env.FIREBASE_CLIENT_EMAIL,
    client_id: process.env.FIREBASE_CLIENT_ID,
    auth_uri: process.env.FIREBASE_AUTH_URI,
    token_uri: process.env.FIREBASE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
    universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

app.use(cors());
app.use(express.json());

app.post('/add-reminder', async (req, res) => {
    const { to, subject, text, dueTime } = req.body;

    try {
        // Add a new document to the 'reminders' collection
        await db.collection('reminders').add({
            to,
            subject,
            text,
            dueTime: new Date(dueTime).toISOString(), // Parse dueTime and convert to ISO format
        });

        res.status(200).json({ message: 'Reminder added successfully.' });
    } catch (error) {
        console.error('Error adding reminder:', error);
        res.status(500).json({ error: 'An error occurred while adding the reminder.' });
    }
});

// Schedule a recurring job to send reminders
schedule.scheduleJob('0 * * * *', async () => {
    try {
        // Get due reminders from Firestore
        const now = new Date();
        const querySnapshot = await db
            .collection('reminders')
            .where('dueTime', '<=', now.toISOString()) // Compare in ISO format
            .get();

        const dueReminders = [];
        querySnapshot.forEach((doc) => {
            const reminder = doc.data();
            reminder.id = doc.id; // Include the document ID for future reference
            dueReminders.push(reminder);
        });

        // Send emails and delete reminders
        for (const reminder of dueReminders) {
            const { to, subject, text, id } = reminder;

            const emailData = {
                to,
                from: process.env.VERIFIED_EMAIL,
                subject,
                text,
            };

            // Use the promise returned by sgMail.send to handle success and error
            await sgMail.send(emailData);

            // Remove the sent reminder from Firestore
            await db.collection('reminders').doc(id).delete();
        }

        console.log('Sent', dueReminders.length, 'reminders');
    } catch (error) {
        console.error('Error sending reminders:', error);
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
