const { Router } = require('express');

const ProductController = require('../controllers/ProductController');
const productController = new ProductController();
const productsRoutes = Router();

const ProductImageController = require('../controllers/ProductImageController');
const productImageController = new ProductImageController();

const multer = require('multer');
const uploadConfig = require('../configs/upload');

const upload = multer(uploadConfig.MULTER);

const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

productsRoutes.use(ensureAuthenticated);

productsRoutes.post('/', upload.single('image'), productController.create);
productsRoutes.put('/:productId', productController.update);
productsRoutes.get('/:id', productController.show);
productsRoutes.get('/', productController.index);
productsRoutes.delete('/:id', productController.delete);
productsRoutes.patch(
    '/image/:productId',
    upload.single('image'),
    productImageController.update
);

module.exports = productsRoutes;
