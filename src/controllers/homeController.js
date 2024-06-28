const getHomePage = (req, res) => {
    res.render('index', {title: 'Trang chủ', active: 'home'});
}

export default {
    getHomePage
}