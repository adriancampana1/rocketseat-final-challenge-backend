const { Router } = require('express');

const routes = Router();

const userRoutes = require('./users.routes');
const productsRoutes = require('./products.routes');
const sessionsRoutes = require('./sessions.routes');

routes.use('/users', userRoutes);
routes.use('/products', productsRoutes);
routes.use('/sessions', sessionsRoutes);

module.exports = routes;
