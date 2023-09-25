const { Router } = require('express');

const UserController = require('../controllers/UserController');
const userController = new UserController();

const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

const userRoutes = Router();

userRoutes.post('/', userController.create);
userRoutes.put('/:id', ensureAuthenticated, userController.update);

module.exports = userRoutes;
