import Category from "../models/categoryModel.js";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import sharp from "sharp";
import crypto from "crypto";
import dotenv from "dotenv";
import Product from "../models/productModel.js";
import router from "../routes/api/categoryApiRoute.js";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

const randomImageName = (bytes = 32) =>
    crypto.randomBytes(bytes).toString("hex");

const getHomePage = (req, res) => {
    res.render('homePage', {title: 'Express'});
}

const getCategoryPage = async (req, res) => {

    try {
        const categories = await Category.find().sort({createAt: -1});

        for (const category of categories) {
            if ((await category).imageName) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: category.imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
            }
        }

        res.render('categoryPage', {categories: categories});
    } catch (error) {
        res.render('categoryPage', null);
    }
}

const postCreateCategory = async (req, res) => {
    try {
        if (!req.body) {
            return res.render('categoryDetail', {
                code: 400,
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

        res.render('categoryDetail', {
            code: 201,
            title: "Thêm mới danh mục thành công",
            message: `Danh mục ${name} đã được thêm vào trong hệ thống`
        });
    } catch (error) {
        res.render('categoryDetail', {
            code: 500,
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
            return res.render('categoryDetail', {
                code: 400,
                title: "Không thể xoá danh mục này!",
                message: "Hiện tại danh mục đang có sản phẩm tồn tại trong hệ thống"
            });
        }

        const deleteCategory = await Category.findOneAndDelete({_id: id})

        if (!deleteCategory) {
            return res.render('categoryDetail', {
                code: 404,
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

        res.render('categoryDetail', {
            code: 200,
            title: "Xoá thành công",
            message: `Đã xoá danh mục ${deleteCategory.name} khỏi hệ thống`
        });
    } catch (error) {
        res.render('categoryDetail', {
            code: 500,
            title: "Lỗi kết nối máy chủ",
            message: "Đã có lỗi phát sinh từ phía máy chủ. Vui lòng thử lại"
        });
    }
}

export default {
    getHomePage,
    getCategoryPage,
    postCreateCategory,
    deleteCategory
}