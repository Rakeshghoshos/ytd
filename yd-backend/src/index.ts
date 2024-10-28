import express from 'express';
import cors from 'cors';
import router from './routes.js';

const app = express();

const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

app.use('/', router);

app.listen(port, () => {
    console.log('Server started on port ' + port);
});