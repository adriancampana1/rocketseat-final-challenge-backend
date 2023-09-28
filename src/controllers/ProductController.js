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
        const { title, description, price, category, ingredients } =
            request.body;
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
        product.category = category ?? product.category;

        await database.run(
            `UPDATE products SET 
            title = ?,
            description = ?,
            price = ?,
            category = ?,
            user_id = ?
            WHERE id = ?
            `,
            [
                product.title,
                product.description,
                product.price,
                product.category,
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
        const { search } = request.query;

        let query = knex('products').groupBy('products.id');

        if (search) {
            query = query
                .select([
                    'products.id',
                    'products.title',
                    'products.description',
                    'products.price',
                    'products.category',
                    'products.image',
                ])
                .leftJoin(
                    'ingredients',
                    'products.id',
                    'ingredients.product_id'
                )
                .where(function () {
                    this.where('products.title', 'like', `%${search}%`).orWhere(
                        'ingredients.title',
                        'like',
                        `%${search}%`
                    );
                });
        } else {
            query = query.select([
                'products.id',
                'products.title',
                'products.description',
                'products.price',
                'products.category',
                'products.image',
            ]);
        }

        const products = await query;

        const userIngredients = await knex('ingredients');

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
