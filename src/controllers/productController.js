import Product from "../models/productModel.js";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import sharp from "sharp";
import dotenv from "dotenv";
import Category from "../models/categoryModel.js";
import Order from "../models/orderModel.js";
import generateImageName from "../services/generateImageName.js";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

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
                product.imageUrl = await getSignedUrl(s3, command, {expiresIn: 360});
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

        res.render('index', {
            title: 'Quản lý sản phẩm',
            active: 'product',
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

                imageName = generateImageName();

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

                imageName = generateImageName();

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
    getProductPage,
    postCreateProduct,
    deleteProduct,
    updateProduct
}
