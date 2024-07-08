import Product from "../models/productModel.js";
import {GetObjectCommand} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import s3 from "../configs/s3Config.js";
import dotenv from "dotenv";

dotenv.config();
const bucketName = process.env.BUCKET_NAME;

const getProducts = async (req, res) => {
    try {
        const products = await Product.find({status: true})

        for (const product of products) {
            if (product.imageName) {
                const getObjectParams = {
                    Bucket: bucketName,
                    Key: product.imageName,
                };

                const command = new GetObjectCommand(getObjectParams);
                product.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
            }
        }

        res.json({status: 200, data: products, message: 'Lấy danh sách sản phẩm thành công'});

    } catch (error) {
        res.json({status: 500, data: null, message: error.message});
    }
}

export default {
    getProducts
}