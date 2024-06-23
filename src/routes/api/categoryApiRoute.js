import express from "express";
import multer from "multer";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand,} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import crypto from "crypto";
import sharp from "sharp";
import s3 from "../../configs/s3Config.js";
import Category from "../../models/categoryModel.js";
import Product from "../../models/productModel.js";

dotenv.config();

const randomImageName = (bytes = 32) =>
    crypto.randomBytes(bytes).toString("hex");

const bucketName = process.env.BUCKET_NAME;

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.get("/category", async (req, res) => {
    try {
        const categories = await Category.find().sort({name: -1});

        for (const category of categories) {
            const getObjectParams = {
                Bucket: bucketName,
                Key: category.imageName,
            };

            const command = new GetObjectCommand(getObjectParams);
            category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
        }

        res.status(200).send({status: 200, data: categories, message: "Select Successful"});
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

router.get("/category/page", async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const startIndex = (page - 1) * pageSize;

        const categories = await Category.find().skip(startIndex).limit(pageSize).sort({name: -1});
        const totalCategory = await Category.countDocuments({});
        const totalPages = Math.ceil(totalCategory / pageSize);

        for (const category of categories) {
            const getObjectParams = {
                Bucket: bucketName,
                Key: category.imageName,
            };

            const command = new GetObjectCommand(getObjectParams);
            category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
        }

        res.status(200).send({
            status: 200,
            data: categories,
            message: "Select successful",
            page: page,
            pageSize: pageSize,
            totalPages: totalPages,
            totalCategory: totalCategory
        });
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

router.get('/category/id/:id', async (req, res) => {
    try {
        const category = await Category.findOne({_id: req.params.id});
        if (!category) {
            return res.status(404).send({status: 404, data: null, message: "Category not found"});
        }

        const getObjectParams = {
            Bucket: bucketName,
            Key: category.imageName,
        };

        const command = new GetObjectCommand(getObjectParams);
        category.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});

        res.status(200).send({status: 200, data: category, message: "Select Successful"});
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

router.post("/category", upload.single("image"), async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({status: 400, data: null, message: "Null Request"});
        }

        const {name} = req.body;
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

        const newCategory = await Category.create({
            name: name,
            imageName: imageName,
        });

        res.status(201).send({status: 201, data: newCategory, message: "Insert Successful"});
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

router.put("/category/:id", upload.single("image"), async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({status: 400, data: null, message: "Null Request"});
        }

        const searchCategory = await Category.findOne({_id: req.params.id});

        if (!searchCategory) {
            return res.status(404).send({status: 404, data: null, message: "Category not found"});
        }

        let {name, imageName, status} = req.body;

        if (req.file) {
            try {
                const deleteParams = {
                    Bucket: bucketName,
                    Key: imageName,
                };

                const delelteCommand = new DeleteObjectCommand(deleteParams);
                await s3.send(delelteCommand);

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

        const updateCategory = await Category.findByIdAndUpdate(
            {_id: req.params.id},
            {
                name: name,
                imageName: imageName,
                status: true
            },
            {new: true});

        res.status(200).send({status: 201, data: updateCategory, message: "Update Successful"});
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

router.delete("/category/:id", async (req, res) => {
    // try {
    //     const id = req.params.id;
    //
    //     const checkBeforeDelete = await Product.findOne({idCategory: id})
    //     if (checkBeforeDelete) {
    //         return res.status(400).send({
    //             status: 400,
    //             data: null,
    //             message: "There are dishes related to this category"
    //         });
    //     }
    //
    //     const deleteCategory = await Category.findOneAndDelete({_id: id})
    //
    //     if (!deleteCategory) {
    //         return res.status(404).send({status: 404, data: null, message: "Category not found"});
    //     }
    //
    //     const params = {
    //         Bucket: bucketName,
    //         Key: deleteCategory.imageName,
    //     };
    //
    //     const command = new DeleteObjectCommand(params);
    //     await s3.send(command);
    //     res.status(200).send({status: 200, data: deleteCategory, message: "Delete Successful"});
    // } catch (error) {
    //     res.status(500).send({status: 500, data: null, message: error.message});
    // }
});

export default router;
