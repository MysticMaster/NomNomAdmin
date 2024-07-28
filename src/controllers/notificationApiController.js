import Notification from "../models/notificationModel.js";

const getAllNotificationByIdCustomer = async (req, res) => {
    try {
        const notifications = await Notification.find({ idCustomer: req.params.id }).sort({createAt: -1});
    
        res.json({ status: 200, data: notifications, message: "Thành công" });
      } catch (error) {
        res.json({ status: 500, data: null, message: "Sự cố máy chủ" });
      }
};

export default {
    getAllNotificationByIdCustomer
}