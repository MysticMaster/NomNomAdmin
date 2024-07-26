import Cart from "../models/cartModel.js";

const getCartsByIdCustomer = async (req, res) => {
    try {
        const carts = await Cart.find({idCustomer: req.params.id});

        res.json({status: 200, data: carts, message: 'Thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

const postAddToCart = async (req, res) => {
    try {
        const {idCustomer, idProduct} = req.body;

        const cart = await Cart.create({
            idCustomer: idCustomer,
            idProduct: idProduct
        })

        res.json({status: 201, data: cart, message: 'Thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

const putUpdateQuantity = async (req, res) => {
    try {
        const {quantity} = req.body;

        const cart = await Cart.findOneAndUpdate(
            {_id: req.params.id},
            {quantity: quantity},
            {new: true});

        res.json({status: 200, data: cart, message: 'Thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

const putUpdateNote = async (req, res) => {
    try {
        const {note} = req.body;

        const cart = await Cart.findOneAndUpdate(
            {_id: req.params.id},
            {note: note},
            {new: true});

        res.json({status: 200, data: cart, message: ''});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

const deleteCart = async (req, res) => {
    try {
        const cart = await Cart.findOneAndDelete({_id: req.params.id});

        res.json({status: 200, data: cart, message: 'Thành công'});
    } catch (error) {
        res.json({status: 500, data: null, message: 'Sự cố máy chủ'});
    }
}

const deleteAllCart = async(req,res) =>{
    try {
        await Cart.deleteMany({
          idCustomer: req.params.id,
        });
    
        res.json({ status: 200, data: [], message: "Thành công" });
      } catch (error) {
        res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
      }
}

export default {
    getCartsByIdCustomer,
    postAddToCart,
    putUpdateQuantity,
    putUpdateNote,
    deleteCart,
    deleteAllCart
}