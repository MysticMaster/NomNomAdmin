import SearchHistory from "../models/searchHistoryModel.js";

const getSeacrhHistoriesByIdCustomer = async (req, res) => {
  try {
    const histories = await SearchHistory.find({ idCustomer: req.params.id }).sort({createAt: -1});

    res.json({ status: 200, data: histories, message: "Thành công" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

const postAddSearchHistory = async (req, res) => {
  try {
    const { idCustomer, content } = req.body;

    const history = await SearchHistory.create({
      idCustomer: idCustomer,
      content: content,
    });

    res.json({ status: 201, data: history, message: "Thành công" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

const deleteSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.findOneAndDelete({
      _id: req.params.id,
    });

    res.json({ status: 200, data: history, message: "Thành công" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

const deleteAllSearchHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({
      idCustomer: req.params.id,
    });

    res.json({ status: 200, data: [], message: "Thành công" });
  } catch (error) {
    res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
  }
};

export default{
    getSeacrhHistoriesByIdCustomer,
    postAddSearchHistory,
    deleteSearchHistory,
    deleteAllSearchHistory
}
