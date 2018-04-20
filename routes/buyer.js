
var express = require('express');
var router = express.Router();
var path = require('path');
var async = require("async");
var objname = path.basename(__filename, '.js');
var cmd = process.cwd();
var util = require(cmd + "/common/util");
var db = require(cmd + "/common/db");
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;
var ewinston = require(cmd + "/common/ewinston");
var _ = require("underscore");
var request = require("request");
var seller = require('../routes/seller');
var RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: CONFIG.RSMQ.HOST, port: CONFIG.RSMQ.PORT, ns: CONFIG.RSMQ.NAMESPACE} );
var shorUrlKEY = "AIzaSyB2Di7GVIBLJhURbklprv1B7pcLoRXMChU";

/* GET home page. */
/**
 * 주문내역 리스트
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    res.render(objname+'/list_mobile');

});

/**
 * 주문 등록
 */
router.get(/^(?!api)\/mobile\/insert/, function(req, res, next) {

    console.log(req.url);

    var phonenbs = req.url.split('/');
    var phonenb;
    if(phonenbs.length > 0)
    {
        phonenb = phonenbs[phonenbs.length-1];
    }

    var json = {};
    json.phonenb = phonenb;
    console.log('phonenb : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(seller.SellerSelectPhonenb,json)
    ], function (err, seller) {
        // result now equals 'done'
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            res.render(objname+'/insert_mobile', {objname : objname, data : seller, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
        }
    });

});

function BuyerSelect (json, callback){

    var phonenb = (json.phonenb)? json.phonenb : "-1";

    var whereto =  [phonenb];

    var query = (auth == 'E') ? "SELECT * FROM "+objname+" WHERE email = ? " : "SELECT * FROM "+objname+" WHERE snsid = ? and sns = ?";

    db.executeQuery(query,whereto,function(err, result) {
        if(err)
        {
            var error = {file: __filename, code: -1001, description: err.toString()};
            callback(error);
        }
        else
        {
            if(result.rows.length > 0)
            {
                callback(null, json, result.rows[0]);
            }
            else
            {
                callback(null, json, null);
            }
        }
    });

}

module.exports = router;

