import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
    idCustomer:{
        type: String,
        require: true
    },
    content:{
        type: String,
        require:true
    },
    createAt: {
        type: Date,
        default: Date.now,
    }
});

export default mongoose.model('SearchHistory', searchHistorySchema);