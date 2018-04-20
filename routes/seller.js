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
var RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: CONFIG.RSMQ.HOST, port: CONFIG.RSMQ.PORT, ns: CONFIG.RSMQ.NAMESPACE} );
var shorUrlKEY = "AIzaSyB2Di7GVIBLJhURbklprv1B7pcLoRXMChU";


router.post('/api/login', function(req, res, next) {

    var json = req.body;
    console.log('seller login : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(SellerSelectJoinData, json),
        SellerUpdate,
        SellerSelectByeDate,
        SellerInsert,
        SellerSelect
    ], function (err, seller) {
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {
            //set cookie
            res.cookie('uobjid',seller.idx,{ expires: new Date(253402300000000), httpOnly: true });
            var ret = {result:1,error:"",data:[seller]};
            console.log('ret : ' + JSON.stringify(ret));
            res.send(ret);
        }
    });

});

/**
 * 매장 정보 수정
 */
router.post('/api/update', function(req, res, next) {
    var json = req.body;

    var whereto = [];
    whereto.push(json.worker);
    whereto.push(json.tel);
    var query = "select UID_ as \"uid\" from admin where worker = :worker and tel = :tel";

    db.executeQuery(query,whereto,function(err, result) {

        if(err)
        {
            var error = {file: __filename, code: -1001, description: err.toString()};
            ewinston.log("error",JSON.stringify(error));
            var ret = {result:-1,error:err.toString(),data:[]};
            res.send(ret);
        }
        else
        {
            if(result.rows.length > 0)
            {
                var user = result.rows[0];
                var ret = {result:1,error:"",data:[user]};
                res.send(ret);
            }
            else
            {
                var ret = {result:-1,error:"cms id is not exist.",data:[]};
                res.send(ret);
            }
        }
    });

});

router.post('/api/shorturl', function(req, res, next) {

    var json = req.body;
    var options = {url:CONFIG.API.PROTOCOL + "://" + CONFIG.API.HOST +  '/urlshortener/v1/url?key='+shorUrlKEY, headers : {'Content-Type' : 'application/json'}, json: {
        'longUrl': json.longUrl
    }};

    request.post(options, function(err,response,body){
        if(response.statusCode == 200)
        {
            res.send(body);
        }
        else
        {
            var error = {file: __filename, code: -1002, description:ERROR["-1002"]};
            res.send(error);
        }
    });
});

router.post('/api/send', function(req, res, next) {

    var json = req.body;
    var moduleName = "gcm";

    rsmq.sendMessage({qname: moduleName, message: JSON.stringify(json)}, function (err, resp) {

        if (err) {
            var error = {file: __filename, code: -1001, description: err.toString()};
            res.send(error);
        }
        else {
            if (resp) {
                res.send(resp);
            }
            else {
                var error = {file: __filename, code: -1010, description: ERROR["-1010"]};
                res.send(error);
            }
        }
    });
});

router.post('/api/insert', function(req, res, next) {

    var user = util.getCookieMobile(req);
    var json = req.body;
    console.log('seller insert : ' + JSON.stringify(user));
    console.log('seller json : ' + JSON.stringify(json));


    var data = json;


    res.render(objname+'/insert_mobile', {objname : objname, data : data, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
});

router.post('/api/select/snsid', function(req, res, next) {

    var json = req.body;
    //json.snsid : snsid
    //json.sns : sns

    async.waterfall([
        async.apply(SellerSelectSnsid,json)
    ], function (err, user) {
        // result now equals 'done'
        if (err)
        {
            ewinston.log("info",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {
            var ret = {result:1,error:"",data:[user]};
            res.send(ret);
        }
    });
});


/**
 * 매장 회원가입 & 로그인
 */
router.get(/^(?!api)\/mobile\/login/, function(req, res, next) {

    res.render(objname+'/login_mobile', {objname : objname, data : {}, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});


});


/**
 * 매장 이메일 로그인
 */
router.post(/^(?!api)\/regist/, function(req, res, next) {

    var user = util.getCookieMobile(req);
    var json = req.body;
    console.log('seller user : ' + JSON.stringify(user));
    console.log('seller json : ' + JSON.stringify(json));

    async.waterfall([
        async.apply(SellerSelect,json)
    ], function (err, user) {
        // result now equals 'done'
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            if(user)
            {
                //set cookie
                res.cookie('uobjid',seller.idx,{ expires: new Date(253402300000000), httpOnly: true });
                res.render('buyer/list_mobile', {objname : objname, data : seller, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
            }
            else
            {
                res.render(objname+'/insert_mobile', {objname : objname, data : json, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
            }

        }
    });


});

/**
 * 매장 기본 정보 등록 (삭제???)
 */
router.post(/^(?!api)\/insert/, function(req, res, next) {

    var user = util.getCookieMobile(req);
    var json = req.body;
    console.log('seller insert : ' + JSON.stringify(user));
    console.log('seller json : ' + JSON.stringify(json));

    async.waterfall([
        async.apply(SellerSelectJoinData, json),
        SellerUpdate,
        SellerSelectByeDate,
        SellerInsert,
        SellerSelect
    ], function (err, seller) {
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            //set cookie
            res.cookie('uobjid',seller.idx,{ expires: new Date(253402300000000), httpOnly: true });
            res.render('buyer/list_mobile', {objname : objname, data : seller, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
        }
    });

});


/**
 * 매장 이메일 회원 가입
 */
router.get(/^(?!api)\/mobile\/regist/, function(req, res, next) {

    res.render(objname+'/regist_mobile', {objname : objname, error:'', backurl:'', user:{}, url:util.fullUrl(req)});

});


/**
 * 매장 기본 정보 수정
 */
router.get(/^(?!api)\/mobile\/update/, function(req, res, next) {

    res.render(objname+'/update_mobile');

});

/**
 * 설정 메인
 */
router.get(/^(?!api)\/mobile\/main\/setting/, function(req, res, next) {

    res.render(objname+'/setting_mobile');

});

function SellerSelectJoinData (json, callback){

    var snsid = (json.snsid)? json.snsid : "-1";
    var sns = (json.sns)? json.sns : "Z";
    var auth = (json.auth)? json.auth : "Z";
    var email = (json.email)? json.email : "";

    var whereto = (auth == 'E') ? [email] : [snsid, sns];

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

function SellerUpdate(json, data, callback){

    if(data)
    {
        var idx = data.idx;
        var whereas = '';

        if(json.title)
            whereas += " title = '"+ json.title +"', ";

        if(json.content)
            whereas += " content = '"+ json.content +"', ";

        if(json.cat)
            whereas += " cat = '"+ json.cat +"', ";

        if(json.phonenb)
            whereas += " phonenb = '"+ json.phonenb +"', ";

        if(json.gcmtoken)
            whereas += " gcmtoken = '"+ json.gcmtoken +"', ";

        whereas = whereas.substr(0, whereas.length-2);

        if(whereas == '')
            callback(null, json, data);
        else
        {
            var query = "UPDATE "+objname+" SET "+ whereas +" WHERE idx = " + idx;

            db.executeTransaction(query,[],function(err,result){

                if(err)
                {
                    var error = {file: __filename, code: -1001, description: err.toString()};
                    callback(error);
                }
                else
                {
                    if(result.affectedRows)
                    {
                        callback(null, json, data);
                    }
                    else
                    {
                        var error = {file: __filename, code: -1019, description:ERROR["-1019"]};
                        callback(error);
                    }
                }
            });
        }
    }
    else
    {
        callback(null, json, data);
    }
}

function SellerSelectByeDate(item, json, callback)
{
    //API : 1 가입진행 (>5), -1 가입불가 (<5)
    //		  가입진행 byeyn == N , byeyn == Y
    if(json === null || json.byeyn === undefined || json.byedate === undefined)
    {
        callback(null, item);
    }
    else
    {
        if(json.byeyn == "Y" && json.byedate)
        {
            var startDate = moment();
            var endDate = moment(json.byedate.toISOString(), "YYYY-MM-DD'T'HH:mm:ss:SSSZ"); //timestamp
            var diff = parseInt(moment.duration(startDate - endDate).asDays());
            if(diff < 6)
            {
                var error = {file: __filename, code:-1028, description:ERROR["-1028"]};
                callback(error);
            }
            else
            {
                var whereto = [json.idx];
                var query = "DELETE FROM "+objname+" WHERE idx = ?";
                db.executeTransaction(query,whereto,function(err,result){
                    if(err)
                    {
                        var error = {file: __filename, code: -1001, description: err.toString()};
                        callback(error);
                    }
                    else
                    {
                        callback(null,item);
                    }
                });
            }
        }
        else
        {
            callback(null, json);
        }
    }
}

function SellerInsert (json, callback){

    if(json.idx)
    {
        callback(null, json);
    }
    else
    {

        if(json.passwd_chk)
            delete json.passwd_chk;

        if(!json.title)
            json.title = " ";
        if(!json.content)
            json.content = " ";

        console.log('SellerInsert====>' + JSON.stringify(json));

        var query = "insert into "+objname+" set ?";
        db.executeTransaction(query,json,function(err,result){
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
}

function SellerSelect(json, callback){

    if(json.idx)
    {
        var whereto = [json.idx];
        var query = "SELECT * FROM "+objname+" WHERE idx = ?";
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
                    console.log('seller orw: ' + JSON.stringify(result.rows[0]));
                    callback(null, result.rows[0]);
                }
                else
                {
                    var error = {file: __filename, code: -1009, description:ERROR["-1009"]};
                    callback(error);
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


function SellerSelectPhonenb(json, callback){

    if(json.phonenb)
    {
        var whereto = [json.phonenb];
        var query = "SELECT * FROM "+objname+" WHERE phonenb = ? and useyn = 'Y' ";
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
                    console.log('seller orw: ' + JSON.stringify(result.rows[0]));
                    callback(null, result.rows[0]);
                }
                else
                {
                    var error = {file: __filename, code: -1009, description:ERROR["-1009"]};
                    callback(error);
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


function SellerSelectSnsid (json, callback){

    var snsid = (json.snsid)? json.snsid : "-1";
    var sns = (json.sns)? json.sns : "Z";

    var whereto = [snsid, sns];

    var query =  "SELECT * FROM "+objname+" WHERE snsid = ? AND sns = ?  ORDER BY idx DESC " ;

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
                callback(null, result.rows[0]);
            }
            else
            {
                var error = {file: __filename, code: -1009, description:ERROR["-1009"]};
                callback(error);
            }
        }
    });
}

module.exports = router;
module.exports.SellerSelectPhonenb = SellerSelectPhonenb;

