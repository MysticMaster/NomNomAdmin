import Category from "../models/categoryModel.js";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import sharp from "sharp";
import crypto from "crypto";
import dotenv from "dotenv";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

const randomImageName = (bytes = 32) =>
    crypto.randomBytes(bytes).toString("hex");

const getHomePage = (req, res) => {
    res.render('homePage', {title: 'Express'});
}

const getCategoryPage = async (req, res) => {
    const perPage = 5; // số lượng categories trên mỗi trang
    const currentPage = +req.query.page || 1; // trang hiện tại, mặc định là 1 || 1; // trang hiện tại, mặc định là 1

    try {
        const totalCategories = await Category.countDocuments(); // tổng số categories
        const totalPages = Math.ceil(totalCategories / perPage); // tổng số trang

        const categories = await Category.find()
            .sort({createAt: -1})
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        for (const category of categories) {
            if (category.imageName) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: category.imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
            }
        }

        res.render('categoryPage', {
            categories: categories,
            currentPage: currentPage,
            totalPages: totalPages,
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "category",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const postCreateCategory = async (req, res) => {
    try {
        if (!req.body) {
            return res.render('detailPage', {
                code: 400,
                route: "category",
                title: "Lỗi gửi dữ liệu",
                message: "Đã có lỗi phát sinh trong dữ liệu biểu mẫu. Vui lòng thử lại"
            });
        }

        const {name, status} = req.body;
        let imageName = "";

        if (req.file) {
            try {
                const buffer = await sharp(req.file.buffer)
                    .resize({height: 500, width: 500, fit: "cover"})
                    .toBuffer();

                imageName = randomImageName();

                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                    Body: buffer,
                    ContentType: req.file.mimetype,
                };

                const command = new PutObjectCommand(params);
                await s3.send(command);
            } catch (error) {
                console.log("ERROR upload file: ", error);
            }
        }

        await Category.create({
            name: name,
            imageName: imageName,
            status: JSON.parse(status)
        });

        res.render('detailPage', {
            code: 201,
            route: "category",
            title: "Thêm mới danh mục thành công",
            message: `Danh mục ${name} đã được thêm vào trong hệ thống`
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "category",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const deleteCategory = async (req, res) => {
    try {
        const id = req.params.id;

        const checkBeforeDelete = await Product.findOne({idCategory: id})
        if (checkBeforeDelete) {
            return res.render('detailPage', {
                code: 400,
                route: "category",
                title: "Không thể xoá danh mục này!",
                message: "Hiện tại danh mục đang có sản phẩm tồn tại trong hệ thống"
            });
        }

        const deleteCategory = await Category.findOneAndDelete({_id: id})

        if (!deleteCategory) {
            return res.render('detailPage', {
                code: 404,
                route: "category",
                title: "Lỗi xoá danh mục",
                message: "Danh mục này không tồn tại trong hệ thống"
            });
        }

        if (deleteCategory.imageName) {
            const params = {
                Bucket: bucketName,
                Key: deleteCategory.imageName,
            };

            const command = new DeleteObjectCommand(params);
            await s3.send(command);
        }

        res.render('detailPage', {
            code: 200,
            route: "category",
            title: "Xoá thành công",
            message: `Đã xoá danh mục ${deleteCategory.name} khỏi hệ thống`
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "category",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const updateCategory = async (req, res) => {
    try {
        if (!req.body) {
            return res.render('detailPage', {
                code: 400,
                route: "category",
                title: "Lỗi gửi dữ liệu",
                message: "Đã có lỗi phát sinh trong dữ liệu biểu mẫu. Vui lòng thử lại"
            });
        }

        const searchCategory = await Category.findOne({_id: req.params.id});

        if (!searchCategory) {
            return res.render('detailPage', {
                code: 404,
                route: "category",
                title: "Lỗi cập nhật danh mục",
                message: "Danh mục này không tồn tại trong hệ thống"
            });
        }

        let {name, imageName, status} = req.body;

        if (req.file) {
            try {
                if (imageName) {
                    const deleteParams = {
                        Bucket: bucketName,
                        Key: imageName,
                    };

                    const deleteCommand = new DeleteObjectCommand(deleteParams);
                    await s3.send(deleteCommand);
                }
                const buffer = await sharp(req.file.buffer)
                    .resize({height: 500, width: 500, fit: "cover"})
                    .toBuffer();

                imageName = randomImageName();

                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                    Body: buffer,
                    ContentType: req.file.mimetype,
                };

                const command = new PutObjectCommand(params);
                await s3.send(command);
            } catch (error) {
                console.log("ERROR upload file: ", error);
            }
        }

        await Category.findByIdAndUpdate(
            {_id: req.params.id},
            {
                name: name,
                imageName: imageName,
                status: JSON.parse(status)
            },
            {new: true});

        res.render('detailPage', {
            code: 200,
            route: "category",
            title: "Cập nhật thành công",
            message: `Danh mục ${name} đã được cập nhật`
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "category",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const getProductPage = async (req, res) => {
    const perPage = 5; // số lượng products trên mỗi trang
    const currentPage = +req.query.page || 1; // trang hiện tại, mặc định là 1
    const categoryId = req.query.category; // lấy _id của category từ query
    const searchName = req.query['search']; // lấy search-name từ query

    try {
        let conditions = {};
        let categoryFilterName = "Tất cả";
        let categoryFilterId = null;
        let search = null;

        if (categoryId) {
            const category = await Category.findOne({_id: categoryId});
            if (category) {
                categoryFilterName = category.name;
                categoryFilterId = category._id;
                conditions.idCategory = categoryId;
            }
        }

        if (searchName) {
            conditions.name = {$regex: searchName, $options: 'i'};
            search = searchName;
        }

        const totalProducts = await Product.countDocuments(conditions); // tổng số products
        const totalPages = Math.ceil(totalProducts / perPage); // tổng số trang

        const products = await Product.find(conditions)
            .sort({createAt: -1})
            .skip((currentPage - 1) * perPage)
            .limit(perPage);

        const categories = await Category.find().sort({createAt: +1});

        for (const product of products) {
            if ((await product).imageName) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: product.imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                product.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
            }
        }

        for (const category of categories) {
            if (category.imageName) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: category.imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
            }
        }

        res.render('productPage', {
            products: products,
            categories: categories,
            currentPage: currentPage,
            totalPages: totalPages,
            categoryFilterName: categoryFilterName,
            categoryFilterId: categoryFilterId,
            search: search
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "product",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const postCreateProduct = async (req, res) => {
    try {
        if (!req.body) {
            return res.render('detailPage', {
                code: 400,
                route: "product",
                title: "Lỗi gửi dữ liệu",
                message: "Đã có lỗi phát sinh trong dữ liệu biểu mẫu. Vui lòng thử lại"
            });
        }

        const {idCategory, name, price, description, status} = req.body;
        let imageName = "";

        if (req.file) {
            try {
                const buffer = await sharp(req.file.buffer)
                    .resize({height: 500, width: 500, fit: "cover"})
                    .toBuffer();

                imageName = randomImageName();

                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                    Body: buffer,
                    ContentType: req.file.mimetype,
                };

                const command = new PutObjectCommand(params);
                await s3.send(command);
            } catch (error) {
                console.log("ERROR upload file: ", error);
            }
        }

        await Product.create({
            idCategory: idCategory,
            name: name,
            price: price,
            imageName: imageName,
            description: description,
            status: JSON.parse(status)
        });

        res.render('detailPage', {
            code: 201,
            route: "product",
            title: "Thêm mới sản phẩm thành công",
            message: `Sản phẩm ${name} đã được thêm vào trong hệ thống`
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "product",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;

        const checkBeforeDelete = await Order.findOne({
            orderItems: {$elemMatch: {idProduct: id}}
        });
        if (checkBeforeDelete) {
            return res.render('detailPage', {
                code: 400,
                route: "product",
                title: "Không thể xoá sản phẩm này!",
                message: "Hiện tại sản phẩm này tồn tại đơn đặt hàng trong hệ thống"
            });
        }

        const deleteProduct = await Product.findOneAndDelete({_id: id})

        if (!deleteProduct) {
            return res.render('detailPage', {
                code: 404,
                route: "product",
                title: "Lỗi xoá sản phẩm",
                message: "Sản phẩm này không tồn tại trong hệ thống"
            });
        }

        if (deleteProduct.imageName) {
            const params = {
                Bucket: bucketName,
                Key: deleteProduct.imageName,
            };

            const command = new DeleteObjectCommand(params);
            await s3.send(command);
        }

        res.render('detailPage', {
            code: 200,
            route: "product",
            title: "Xoá thành công",
            message: `Đã xoá danh mục ${deleteProduct.name} khỏi hệ thống`
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "product",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

const updateProduct = async (req, res) => {
    try {
        if (!req.body) {
            return res.render('detailPage', {
                code: 400,
                route: "product",
                title: "Lỗi gửi dữ liệu",
                message: "Đã có lỗi phát sinh trong dữ liệu biểu mẫu. Vui lòng thử lại"
            });
        }

        const searchProduct = await Product.findOne({_id: req.params.id});

        if (!searchProduct) {
            return res.render('detailPage', {
                code: 404,
                route: "product",
                title: "Lỗi cập nhật sản sản phẩm",
                message: "Sản phẩm này không tồn tại trong hệ thống"
            });
        }

        let {idCategory, name, price, imageName, description, status} = req.body;

        if (req.file) {
            try {
                if (imageName) {
                    const deleteParams = {
                        Bucket: bucketName,
                        Key: imageName,
                    };

                    const deleteCommand = new DeleteObjectCommand(deleteParams);
                    await s3.send(deleteCommand);
                }
                const buffer = await sharp(req.file.buffer)
                    .resize({height: 500, width: 500, fit: "cover"})
                    .toBuffer();

                imageName = randomImageName();

                const params = {
                    Bucket: bucketName,
                    Key: imageName,
                    Body: buffer,
                    ContentType: req.file.mimetype,
                };

                const command = new PutObjectCommand(params);
                await s3.send(command);
            } catch (error) {
                console.log("ERROR upload file: ", error);
            }
        }

        await Product.findByIdAndUpdate(
            {_id: req.params.id},
            {
                idCategory: idCategory,
                name: name,
                price: price,
                imageName: imageName,
                description: description,
                status: JSON.parse(status)
            },
            {new: true});

        res.render('detailPage', {
            code: 200,
            route: "product",
            title: "Cập nhật thành công",
            message: `Sản phẩm ${name} đã được cập nhật`
        });
    } catch (error) {
        res.render('detailPage', {
            code: 500,
            route: "product",
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

export default {
    getHomePage,
    getCategoryPage,
    postCreateCategory,
    deleteCategory,
    updateCategory,
    getProductPage,
    postCreateProduct,
    deleteProduct,
    updateProduct
}