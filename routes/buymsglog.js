var express = require('express');
var router = express.Router();
var path = require('path');
var objname = path.basename(__filename, '.js');
var cmd = process.cwd();
var db = require(cmd + "/common/db");
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;
var _ = require("underscore");


/**
 * 수신 내역
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    res.render(objname+'/list_mobile');

});

/**
 * 수신 상세
 */
router.get(/^(?!api)\/mobile\/update/, function(req, res, next) {

    res.render(objname+'/update_mobile');

});


module.exports = router;