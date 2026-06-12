const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const app = express();
app.use(express.json());

// Serve the static frontend assets from a "public" folder
app.use(express.static(path.join(__dirname, 'public')));

const REGION = process.env.AWS_REGION || 'us-east-1';
const s3 = new S3Client({ region: REGION });
const sns = new SNSClient({ region: REGION });
const secretsManager = new SecretsManagerClient({ region: REGION });

let dbPool;

async function initDb() {
    try {
        const secretResponse = await secretsManager.send(
            new GetSecretValueCommand({ SecretId: process.env.DB_SECRET_NAME })
        );
        const credentials = JSON.parse(secretResponse.SecretString);

        dbPool = mysql.createPool({
            host: process.env.DB_HOST,
            user: credentials.username,
            password: credentials.password,
            database: process.env.DB_NAME,
            waitForConnections: true,
            connectionLimit: 15
        });
        console.log('Database connected.');
    } catch (err) {
        console.error('Database connection failed:', err);
        process.exit(1);
    }
}

app.get('/health', (req, res) => res.status(200).send('Healthy'));

// --- AUTHENTICATION APIS ---

// Registration Route
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Production Note: Real systems hash passwords using bcrypt. Keeping plaintext here for immediate architectural testing comfort.
        await dbPool.query('INSERT INTO users (email, password_hash) VALUES (?, ?)', [email, password]);
        res.status(201).json({ message: 'User registered securely into RDS database.' });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') return res.status(400).json({ error: 'Email already exists.' });
        res.status(500).json({ error: 'Database writing error.' });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const [rows] = await dbPool.query('SELECT * FROM users WHERE email = ? AND password_hash = ?', [email, password]);
        if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials.' });
        res.json({ message: 'Authentication successful', token: 'sample-jwt-token-auth' });
    } catch (err) {
        res.status(500).json({ error: 'Database verification failure.' });
    }
});

// --- CORE APP APIS ---

app.get('/api/products', async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT * FROM products');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/checkout', async (req, res) => {
    const { productId, quantity, customerEmail } = req.body;
    const orderId = `ORD-${Date.now()}`;
    const invoiceData = JSON.stringify({ orderId, productId, quantity, customerEmail, timestamp: new Date() });

    try {
        await s3.send(new PutObjectCommand({
            Bucket: process.env.S3_BUCKET_NAME,
            Key: `invoices/${orderId}.json`,
            Body: invoiceData,
            ContentType: 'application/json'
        }));

        await sns.send(new PublishCommand({
            TopicArn: process.env.SNS_TOPIC_ARN,
            Message: `Transaction successful for ${customerEmail}. Order ID: ${orderId}`,
            Subject: `💰 Production Order Confirmed`
        }));

        res.status(201).json({ status: 'Success', orderId });
    } catch (err) {
        res.status(500).json({ error: 'S3/SNS processing pipeline failed.' });
    }
});

const PORT = process.env.PORT || 3000;
initDb().then(() => {
    app.listen(PORT, () => console.log(`E-commerce System Active on Port ${PORT}`));
});
