import express from "express";
import path from "path";

const staticFile = (app) =>{
    app.use(express.static(path.join('./src', 'public')));
}

export default staticFile;