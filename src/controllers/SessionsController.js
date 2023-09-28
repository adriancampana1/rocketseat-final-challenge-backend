const AppError = require('../utils/AppError');
const knex = require('../database/knex');
const { compare } = require('bcryptjs');
const authConfig = require('../configs/auth');
const { sign } = require('jsonwebtoken');
const auth = require('../configs/auth');

class SessionsController {
    async create(request, response) {
        const { email, password } = request.body;

        const user = await knex('users').where({ email }).first();
        const user_role = user.role;

        if (!user) {
            throw new AppError('E-mail e/ou senha incorreta.', 401);
        }

        const passwordMatched = await compare(password, user.password);

        if (!passwordMatched) {
            throw new AppError('E-mail e/ou senha incorreta.', 401);
        }

        const { secret, expiresIn } = authConfig.jwt;
        const token = sign({}, secret, {
            subject: String(user.id),
            expiresIn,
        });

        return response.json({ user, token, user_role });
    }
    p;
}

module.exports = SessionsController;
