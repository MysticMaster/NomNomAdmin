import express from "express";
import multer from "multer";
import {DeleteObjectCommand, GetObjectCommand, PutObjectCommand,} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
import dotenv from "dotenv";
import crypto from "crypto";
import sharp from "sharp";
import s3 from "../../configs/s3Config.js";
import Member from "../../models/memberModel.js";
import generateImageName from "../../servieces/generateImageName.js";

dotenv.config();

const randomImageName = (bytes = 32) =>
    crypto.randomBytes(bytes).toString("hex");

const bucketName = process.env.BUCKET_NAME;

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({storage: storage});

router.get('/member/id/:id', async (req, res) => {
    try {
        const member = await Member.findOne({_id: req.params.id});
        if (!member) {
            return res.status(404).send({status: 404, data: null, message: "Category not found"});
        }

        if (member.imageName) {
            const getObjectParams = {
                Bucket: bucketName,
                Key: member.imageName,
            };

            const command = new GetObjectCommand(getObjectParams);
            member.imageUrl = await getSignedUrl(s3, command, {expiresIn: 60});
        }

        res.status(200).send({status: 200, data: member, message: "Select Successful"});
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

router.post("/member", upload.single("image"), async (req, res) => {
    try {
        if (!req.body) {
            return res.status(400).send({status: 400, data: null, message: "Null Request"});
        }

        const {firstName, lastName, email, address, username, password} = req.body;
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

        const newMember = await Member.create({
            firstName: firstName,
            lastName: lastName,
            email: email,
            address: address,
            username: username,
            password: password,
            imageName: imageName
        });

        res.status(201).send({status: 201, data: newMember, message: "Insert Successful"});
    } catch (error) {
        res.status(500).send({status: 500, data: null, message: error.message});
    }
});

export default router;