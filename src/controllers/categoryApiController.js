import Category from "../models/categoryModel.js";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import dotenv from "dotenv";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({status: true}).sort({createAt: 1})

        for (const category of categories) {
            if (category.imageName) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: category.imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 7200});
            }
        }

        res.json({status: 200, data: categories, message: 'Lấy danh sách danh mục thành công'});

    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

export default {
    getCategories
}