const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 5000;
//json Web token 
const jwt = require('jsonwebtoken');

// middleware
app.use(cors());
app.use(express.json());

// verifyJWT this token in server site cause if unknown user want to see other data
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization;
    console.log('authorization token', authorization);
    if (!authorization) { // not match
        return res.status(401).send({ error: true, message: 'Unauthorized access' })
    }

    // this token is give as {barer (token)}
    const token = authorization.split(' ')[1]; // if user has a token but is expire of 

    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'Unauthorized access' })
        }
        req.decoded = decoded;
        console.log('Decoded values :', decoded);
        next();
    })

}



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
        //jwt token 
        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '48h' })
            res.send({ token })
        })

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
        // now verifying this token here cause this the place where all user info is there 
        app.get('/carts', verifyJWT, async (req, res) => {
            const email = req.query.email;
            console.log(email);
            if (!email) {
                res.send([]);
            }
            // in req.decoded there is an email is this email is === to user email is same give him data otherwise no  
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: true, message: 'Porbiden access' })
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

        // checking is this user admin or not  1st verifyJWT
        app.get('/user/admin/:email', verifyJWT, async (req, res) => {

            const email = req.params.email;
            // 2nd step verification
            //3rd step is in client site by create useAdmin
            if (req.decoded.email !== email) {
                res.send({ admin: false })
            }

            const query = { email: email };
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.role === 'admin' }
            res.send(result);
        })
        //making someone admin 
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };

            // by using updateDoc make his role as admin
            const updateDoc = {
                $set: {
                    role: 'admin',
                }
            }
            const result = await usersCollection.updateOne(query, updateDoc);
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