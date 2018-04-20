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
 * 매장 메뉴 등록
 */
router.get(/^(?!api)\/mobile\/insert/, function(req, res, next) {

    res.render(objname+'/insert_mobile');

});


/**
 * 매장 메뉴 수정
 */
router.get(/^(?!api)\/mobile\/update/, function(req, res, next) {

    res.render(objname+'/update_mobile');

});


/**
 * 매장 메뉴 리스트
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    res.render(objname+'/list_mobile');

});

module.exports = router;