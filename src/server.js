require('dotenv/config');
require('express-async-errors');
const express = require('express');
const cors = require('cors');

const database = require('./database/sqlite');

const AppError = require('./utils/AppError');

const uploadConfig = require('./configs/upload');

const routes = require('./routes');
const app = express();
app.use(express.json());
app.use(cors());

app.use('/files', express.static(uploadConfig.UPLOADS_FOLDER));

app.use(routes);

database();

app.use((error, request, response, next) => {
    if (error instanceof AppError) {
        return response.status(error.statusCode).json({
            status: 'error',
            message: error.message,
        });
    }

    console.log(error);

    return response.status(500).json({
        status: 'error',
        message: 'Internal server error',
    });
});

const PORT = process.env.SERVER_PORT || 3333;
app.listen(PORT, () => console.log(`Server is running on Port: ${PORT}`));
