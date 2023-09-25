const AppError = require('../utils/AppError');
const { hash, compare } = require('bcryptjs');
const sqliteConnection = require('../database/sqlite');

class UserController {
    async create(request, response) {
        const { name, email, password } = request.body;

        // to create a new admin account, just change the role to '1'
        const commonRole = 0; // user account
        const adminRole = 1; // admin account

        const database = await sqliteConnection();

        const checkUserExists = await database.get(
            'SELECT * FROM users WHERE email = (?)',
            [email]
        );

        if (checkUserExists) {
            throw new AppError('Este e-mail já está cadastrado.');
        }

        if (!name) {
            throw new AppError('Nome é obrigatório!');
        }

        const hashedPassword = await hash(password, 8);

        await database.run(
            'INSERT INTO users (name, email, password, role) VALUES (?,?,?,?)',
            [name, email, hashedPassword, adminRole]
        );

        return response.status(201).json();
    }

    async update(request, response) {
        const { name, email, password, old_password } = request.body;
        const user_id = request.user.id;

        const database = await sqliteConnection();
        const user = await database.get('SELECT * FROM users WHERE id = (?)', [
            user_id,
        ]);

        if (!user) {
            throw new AppError('Usuário não encontrado!');
        }

        const userWithUpdatedEmail = await database.get(
            'SELECT * FROM users WHERE email = (?)',
            [email]
        );

        if (userWithUpdatedEmail && userWithUpdatedEmail.id !== user.id) {
            throw new AppError('Este e-mail já está em uso!');
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if (password && !old_password) {
            throw new AppError('Você precisa informar a senha antiga!');
        }

        if (password && old_password) {
            const checkOldPassword = await compare(old_password, user.password);

            if (!checkOldPassword) {
                throw new AppError('A senha antiga não confere!');
            }

            user.password = await hash(password, 8);
        }

        await database.run(
            `UPDATE users SET 
            name = ?,
            email = ?,
            password = ?
            WHERE id = ?
            `,
            [user.name, user.email, user.password, id]
        );

        return response.json();
    }
}

module.exports = UserController;