const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.gox9lmj.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const serviceCollection = client.db('dental_care').collection('services');
        const bookingCollection = client.db('dental_care').collection('bookings');

        app.get('/service', async (req, res) => {
            const query = {};
            const cursor = serviceCollection.find(query);
            const services = await cursor.toArray();
            res.send(services)
        });

        app.get('/available', async (req, res) => {
            const date = req.query?.formattedDate;
            //step 1: get all service
            const services = await serviceCollection.find().toArray();
            //step 2: get the booking of that day
            const query = { formattedDate: date };
            const bookings = await bookingCollection.find(query).toArray();

            //step 3: for each services, find booking for that service

            services.forEach(service => {
                const serviceBookings = bookings.filter(book => book.treatment === service.name);
                const bkd = service.booked = serviceBookings.map(s => s.slot);
                const available = service.slots.filter(s => !bkd.includes(s));
                service.available = available;
            });

            // services.forEach(service => {
            //     const serviceBookings = bookings.filter(book => book.treatment === service.name);
            //     service.booked = serviceBookings.map(s => s.slot);
            //     // const available = service.slots.filter(s => !booked.includes(s));
            //     // service.available = available;
            // });

            res.send(services);
            console.log("bookings", services);
        });

        app.post('/booking', async (req, res) => {
            const booking = req.body;
            const query = { treatment: booking.treatment, date: booking.date, patient: booking.patient }
            const exists = await bookingCollection.findOne(query);
            if (exists) {
                return res.send({ success: false, booking: exists })
            }
            const result = await bookingCollection.insertOne(booking);
            console.log("booking", result);
            res.send({ success: true, result });
        });
    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello Doctor');
})

app.listen(port, () => {
    console.log(`Doctor app listening on port ${port}`);
})