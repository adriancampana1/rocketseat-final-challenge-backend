const knex = require('../database/knex');
const sqliteConnection = require('../database/sqlite');
const DiskStorage = require('../providers/DiskStorage');

class ProductController {
    async create(request, response) {
        const { title, description, price, category, ingredients } =
            request.body;
        const user_id = request.user.id;
        const imageFilename = request.file.filename;
        const diskStorage = new DiskStorage();

        const filename = await diskStorage.saveFile(imageFilename);

        const [product_id] = await knex('products').insert({
            title,
            description,
            price,
            category,
            image: filename,
            user_id,
        });

        const ingredientsSplit = ingredients.split(',');

        const ingredientsInsert = ingredientsSplit.map((ingredient) => {
            return {
                product_id,
                user_id,
                title: ingredient,
            };
        });

        await knex('ingredients').insert(ingredientsInsert);

        return response.json();
    }

    async update(request, response) {
        const { title, description, price, ingredients } = request.body;
        const { productId } = request.params;
        const user_id = request.user.id;

        const database = await sqliteConnection();

        const product = await database.get(
            'SELECT * FROM products WHERE id = (?)',
            [productId]
        );

        product.title = title ?? product.title;
        product.description = description ?? product.description;
        product.price = price ?? product.price;

        await database.run(
            `UPDATE products SET 
            title = ?,
            description = ?,
            price = ?,
            user_id = ?
            WHERE id = ?
            `,
            [
                product.title,
                product.description,
                product.price,
                user_id,
                productId,
            ]
        );

        const ingredient = await database.all(
            'SELECT * FROM ingredients WHERE product_id = ?',
            [productId]
        );

        const ingredientTitle = ingredient.map((item) => item.title);
        const shouldInsertIngredient = ingredients.some(
            (item) =>
                !ingredientTitle.includes(item) ||
                ingredientTitle.some((item) => !ingredients.includes(item))
        );

        if (shouldInsertIngredient) {
            await database.run('DELETE FROM ingredients WHERE product_id = ?', [
                productId,
            ]);

            for (const item of ingredients) {
                await database.run(
                    'INSERT INTO ingredients (product_id, title) VALUES (?, ?)',
                    [productId, item]
                );
            }
        }

        return response.json();
    }

    async delete(request, response) {
        const { id } = request.params;

        await knex('products').where({ id }).delete();
        await knex('ingredients').where({ product_id: id }).delete();

        return response.json();
    }

    async show(request, response) {
        const { id } = request.params;

        const product = await knex('products').where({ id }).first();
        const ingredients = await knex('ingredients')
            .where({ product_id: id })
            .orderBy('title');

        return response.json({
            ...product,
            ingredients,
        });
    }

    async index(request, response) {
        const { title, ingredients } = request.query;
        const user_id = request.user.id;
        let products;

        if (ingredients) {
            const filterIngredients = ingredients
                .split(',')
                .map((ingredient) => ingredient.trim());

            products = await knex('products')
                .select(['products.id', 'products.title', 'products.user_id'])
                .whereIn('products.id', function () {
                    this.select('ingredients.product_id')
                        .from('ingredients')
                        .whereIn('ingredients.title', filterIngredients);
                })
                .andWhere('products.title', 'like', `%${title}%`)
                .groupBy('products.id')
                .orderBy('products.title');
        } else {
            products = await knex('products')
                .where({ user_id })
                .where('title', 'like', `%${title}%`)
                .orderBy('title');
        }

        const userIngredients = await knex('ingredients').where({ user_id });

        const productsWithIngredients = products.map((product) => {
            const productIngredients = userIngredients.filter(
                (ingredient) => ingredient.product_id === product.id
            );

            return {
                ...product,
                ingredients: productIngredients,
            };
        });

        return response.json(productsWithIngredients);
    }
}

module.exports = ProductController;
