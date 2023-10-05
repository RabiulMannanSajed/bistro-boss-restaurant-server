const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());



const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z68se.mongodb.net/?retryWrites=true&w=majority`;
console.log(uri);
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        // making connection to mDb
        const menuCollection = client.db("bistroDb").collection('menu'); // this created in DB already
        const usersCollection = client.db("bistroDb").collection('users'); // this created in DB already
        const reviewsCollection = client.db("bistroDb").collection('reviews');
        const cartCollection = client.db("bistroDb").collection('carts');



        //menu related api
        app.get('/menu', async (req, res) => {
            const result = await menuCollection.find().toArray();
            res.send(result);
        })
        // reviews related api
        app.get('/reviews', async (req, res) => {
            const result = await reviewsCollection.find().toArray();
            res.send(result);
        })
        // this is for count one user how many products added to cart
        app.get('/carts', async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (!email) {
                res.send([]);
            }
            const query = { email: email }
            const result = await cartCollection.find(query).toArray();
            res.send(result)
        })

        //users releted apis
        /// to get all users for client 

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result)
        })

        /// to add users

        app.post('/users', async (req, res) => {
            const user = req.body;
            // here this is for google user cause there is no system to keep track is this user is login for 1st time or not 
            // so is this user is exist then give him this message otherwise  login  
            const query = { email: user.email };
            const existingUser = await usersCollection.findOne(query);
            console.log(existingUser);
            if (existingUser) {
                return res.send({ message: " User already exists" })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })
        // cart collection

        // to add something in booking collection 
        app.post('/carts', async (req, res) => {
            const item = req.body;
            console.log(item);
            const result = await cartCollection.insertOne(item);
            res.send(result);
        })
        //delete 
        app.delete('/carts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await cartCollection.deleteOne(query);
            res.send(result);
        })

        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB! this running ");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Boss is sitting")
})

app.listen(port, () => {
    console.log(`Bistro boss is running from port ${port}`);
})

/* 
naming convention


* users: userCollection
app.get('/users') // to get all users
app.get('/users/:id') // to get specific user
app.post('/users') // to create a new user
app.patch('/users/:id') // to update specific user
app.put('/users/:id') //to update specific user
app.delete('users/:id') to delete specific user

*/