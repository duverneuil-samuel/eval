import express from 'express';
import bodyParser from 'body-parser';
import connectDB from './config/db.js';
import routes from './routes/index.js';

const app = express();
connectDB();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

app.use('/', routes);

app.listen(1235, () => console.log("Server running on http://localhost:1235"));
