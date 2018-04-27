
var express = require('express');
var router = express.Router();
var path = require('path');
var async = require("async");
var moment = require('moment');
var objname = path.basename(__filename, '.js');
var cmd = process.cwd();
var util = require(cmd + "/common/util");
var db = require(cmd + "/common/db");
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;
var ewinston = require(cmd + "/common/ewinston");
var _ = require("underscore");
var seller = require('../routes/seller');
var buymsglog = require('../routes/buymsglog');
var RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: CONFIG.RSMQ.HOST, port: CONFIG.RSMQ.PORT, ns: CONFIG.RSMQ.NAMESPACE} );


/* GET home page. */
/**
 * 주문내역 리스트
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    var user = util.getCookieMobile(req);

    async.waterfall([
        async.apply(buymsglog.selectFunction,user)

    ], function (err, buyers) {
        console.log('BuyerSelect buyers : ' + JSON.stringify(buyers));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            res.render(objname+'/list_mobile', {objname:objname, data:buyers, user:user, url:util.fullUrl(req)});
        }
    });
});

/**
 * 주문 등록
 */
router.get(/^(?!api)\/mobile\/insert/, function(req, res, next) {

    console.log(req.url);
    var urls = req.url.split('/');
    var phonenb;
    var idx;

    if(urls.length > 0)
    {
        idx = urls[urls.length-1];          //seller 인덱스
        phonenb = urls[urls.length-2];      //주문자 전화번호
    }

    var json = {};
    json.idx = idx;
    console.log('phonenb : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(seller.SellerSelect,json),
        function (seller, callback)
        {
            seller.phonenb = phonenb;
            callback(null, seller);
        },
        BuyerSelectPhonenb
    ], function (err, seller, buyer) {
        console.log('seller : ' + JSON.stringify(seller));
        console.log('buyer : ' + JSON.stringify(buyer));
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            var data = {};
            data.title = seller.title;
            data.phonenb = phonenb;
            data.sobjid = seller.idx;
            data.address = (buyer.address) ? buyer.address : "";
            console.log('data : ' + JSON.stringify(data));
            res.render(objname+'/insert_mobile', {objname : objname, data : data, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
        }
    });

});


router.post('/api/select', function(req, res, next) {

    var json = req.body;
    //json.snsid : snsid
    //json.sns : sns
    //json.auth

    async.waterfall([
        async.apply(BuyerSelectPhonenb,json),
        function (seller, buyer, callback)
        {
            if(buyer == null)
            {
                var data = {};
                data.phonenb = json.phonenb;
                callback(null, data);
            }
            else
            {
                delete buyer.phonenb;
                callback(null, buyer);
            }
        },
        BuyerInsert
    ], function (err, buyer) {
        console.log('Buyer select json : ' + JSON.stringify(json));
        console.log('Buyer select buyer : ' + JSON.stringify(buyer));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("info",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {
            var ret = {result:1,error:"",data:[buyer]};
            res.send(ret);
        }
    });
});


router.post('/api/insert', function(req, res, next) {

    var json = req.body;
    console.log('buyer json : ' + JSON.stringify(json));

    async.waterfall([
        async.apply(BuyerInsert,json),
        buymsglog.insertFunction,
        function(buyer, callback)
        {
          json.idx =   buyer.sobjid;        //주문 페이지에서 들어오는 seller index로 교체
          callback(null, json);
        },
        seller.SellerSelect,
        function(seller, callback)
        {
            seller.content =  json.content;        //푸시 전송시 주문자 내용으로 content 교체
            callback(null, seller);
        },
        seller.sendSellerPush
    ], function (err, buyer) {

        console.log('buyer err : ' + JSON.stringify(err));
        console.log('buyer buyer : ' + JSON.stringify(buyer));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("info",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {
           var  ret = {result:1,error:"",data:[]};
            res.send(ret);
        }
    });
});


function BuyerInsert (json, callback){


    console.log('BuyerInsert====>' + JSON.stringify(json));

    if(json.phonenb)
    {
        if(json.title)
            delete json.title;

        var address = (json.address) ? json.address : "";
        var into = [json.phonenb, address, address];
        var query = "INSERT INTO "+objname+" (phonenb, address) VALUES (?, ?) ON DUPLICATE KEY UPDATE address = ? ";
        db.executeTransaction(query,into,function(err,result){
            if(err)
            {
                var error = {file: __filename, code: -1001, description: err.toString()};
                callback(error);
            }
            else
            {
                if(result.insertId)
                {
                    var ret = JSON.parse(JSON.stringify(json));
                    ret.idx = result.insertId;
                    callback(null,ret);
                }
                else
                {
                    var error = {file: __filename, code: -1019, description:ERROR["-1019"]};
                    callback(error);
                }
            }
        });
    }
    else
    {
        callback(null, json);
    }
}

function BuyerSelectPhonenb(json, callback){

    console.log('BuyerSelectPhonenb json: ' + JSON.stringify(json));
    if(json.phonenb)
    {
        var whereto = [json.phonenb];
        var query = "SELECT * FROM "+objname+" WHERE phonenb = ? order by idx desc limit 1";
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
                    console.log('BuyerSelectPhonenb result : ' + JSON.stringify(result.rows[0]));
                    callback(null, json, result.rows[0]);
                }
                else
                {
                    callback(null, json, null);
                }
            }
        });
    }
    else
    {
        var error = {file: __filename, code: -1009, description:ERROR["-1009"]};
        callback(error);
    }

}



module.exports = router;

