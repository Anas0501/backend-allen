const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const colors = require('colors');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db.js');
const morgan = require('morgan');

const PORT = process.env.PORT || 5000;

// WE WILL CONNECT TO MONGODB HERE
connectDB();

const app = express();

// MIDDLEWARE
app.use(express.json());
app.use(cookieParser());
app.use(cors());
app.use(morgan('dev'));

// MAIN ROUTE TO KNOW THAT THE API IS RUNNING OR NOT
app.get('/', (req, res) => {
	res.send('API IS RUNNING....');
});

// OTHER ROUTES
// app.use('/api/user', require('./routes/userRoutes'));
// app.use('/api/form', require('./routes/formRoutes'));

// RUN THE SERVER
app.listen(PORT, () => {
	try {
		console.log(`Server is running on PORT:${PORT} without any problem`.green.bold);
	} catch (error) {
		console.error(error);
	}
});
