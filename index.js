const express = require('express');
require('dotenv').config();

const app = express();
const port = +process.env.APP_PORT || 3000;

const userRoutes = require('./routes/user');

app.use(express.json());

app.use('/user', userRoutes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
}); 