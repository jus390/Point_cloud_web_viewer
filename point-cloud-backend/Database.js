const arangojs = require("arangojs");

const db = new arangojs.Database();
db.useDatabase("PointCloud");
db.useBasicAuth("root", "root");

module.exports = {
    db,
};