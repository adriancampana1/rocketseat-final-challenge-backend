const knex = require('../database/knex');
const AppError = require('../utils/AppError');
const DiskStorage = require('../providers/DiskStorage');

class ProductImageController {
    async update(request, response) {
        const { productId } = request.params;
        const imageFilename = request.file.filename;

        const diskStorage = new DiskStorage();

        const product = await knex('products').where({ id: productId }).first();

        if (!product) {
            throw new AppError('Produto indisponível!', 401);
        }

        if (product.image) {
            await diskStorage.deleteFile(product.image);
        }

        const filename = await diskStorage.saveFile(imageFilename);
        product.image = filename;

        await knex('products').update(product).where({ id: productId });

        return response.json(product);
    }
}

module.exports = ProductImageController;
