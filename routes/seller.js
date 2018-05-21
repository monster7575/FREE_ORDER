var express = require('express');
var router = express.Router();

var path = require('path');
var Random = require("random-js");
var async = require("async");
var moment = require('moment');
var objname = path.basename(__filename, '.js');
var cmd = process.cwd();
var util = require(cmd + "/common/util");
var db = require(cmd + "/common/db");
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;
var ewinston = require(cmd + "/common/ewinston");
var sendmail = require(cmd + "/common/sendmail");
var _ = require("underscore");
var request = require("request");
var RedisSMQ = require("rsmq");
rsmq = new RedisSMQ( {host: CONFIG.RSMQ.HOST, port: CONFIG.RSMQ.PORT, ns: CONFIG.RSMQ.NAMESPACE} );
var shorUrlKEY = "AIzaSyB2Di7GVIBLJhURbklprv1B7pcLoRXMChU";

/**
 * 매장 이메일 회원 가입
 */
router.get(/^(?!api)\/mobile\/regist/, function(req, res, next) {

    res.render(objname+'/regist_mobile', {objname : objname, error:'', backurl:'', user:{}, url:util.fullUrl(req)});

});

/**
 * 매장 비밀번호 찾기
 */
router.get(/^(?!api)\/mobile\/find/, function(req, res, next) {

    res.render(objname+'/find_mobile', {objname : objname, error:'', backurl:'', user:{}, url:util.fullUrl(req)});

});

/**
 * 매장 기본 정보 수정
 */
router.get(/^(?!api)\/mobile\/update/, function(req, res, next) {

    var user = util.getCookieMobile(req);

    var json = {};
    json.idx = user.uobjid;

    async.waterfall([
        async.apply(SellerSelect, json)
    ], function (err, data) {
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {

            res.render(objname+'/update_mobile', {objname:objname, data:data, user:user, url:util.fullUrl(req), moment : moment});
        }
    });
});


/**
 * 매장 정보 업데이트 후 앱 데이터 갱신 deeplink
 */
router.post(/^(?!api)\/mobile\/update/, function(req, res, next) {

    var user = util.getCookieMobile(req);
    var json = req.body;

    console.log('update  : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(SellerSelectJoinData, json),
        SellerUpdate,
        SellerSelectByeDate,
        SellerSelect
    ], function (err, seller) {
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            //res.render(objname+'/setting_mobile', {objname:objname, data:seller, user:user, url:util.fullUrl(req), moment : moment});
            res.redirect('freeorder://action?name=update&uobjid='+seller.idx);
        }
    });
});

/**
 * 설정 메인
 */
router.get(/^(?!api)\/mobile\/main\/setting/, function(req, res, next) {


    var user = util.getCookieMobile(req);

    var json = {};
    json.idx = user.uobjid;

    async.waterfall([
        async.apply(SellerSelect, json)
    ], function (err, data) {
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {

            res.render(objname+'/setting_mobile', {objname:objname, data:data, user:user, url:util.fullUrl(req), moment : moment});
        }
    });
});


/**
 * 매장 등록 화면
 */
router.post(/^(?!api)\/mobile\/insert/, function(req, res, next) {

    var user = util.getCookieMobile(req);
    var json = req.body;
    console.log('seller insert : ' + JSON.stringify(user));
    console.log('seller json : ' + JSON.stringify(json));
    var data = json;
    res.render(objname+'/insert_mobile', {objname : objname, data : data, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
});

/**
* 매장 회원가입 & 로그인
*/
router.get(/^(?!api)\/mobile\/login/, function(req, res, next) {

    var user = util.getCookieMobile(req);
    console.log('seller user : ' + JSON.stringify(user));

    var json = {};
    json.idx = user.uobjid;

    async.waterfall([
        async.apply(SellerSelect,json)
    ], function (err, seller) {
        console.log('seller : ' + JSON.stringify(seller));
        // result now equals 'done'
        if (err)
        {
            res.render(objname+'/login_mobile', {objname : objname, data : {}, error:{}, backurl:'', user:user, url:util.fullUrl(req)});
        }
        else
        {
            if(seller.idx)
            {
                res.cookie('uobjid',seller.idx,{ expires: new Date(253402300000000), httpOnly: true });
                res.redirect('freeorder://action?name=go_main&uobjid='+seller.idx);
            }
            else
            {
                res.clearCookie('uobjid');
                res.render(objname+'/login_mobile', {objname : objname, data : {}, error:{}, backurl:'', user:user, url:util.fullUrl(req)});
            }
        }
    });
});

/**
* 매장 등록
*/
router.post(/^(?!api)\/regist/, function(req, res, next) {

    var user = util.getCookieMobile(req);
    var json = req.body;

    async.waterfall([
        async.apply(SellerSelectJoinData,json)], function (err, json, seller) {
        // result now equals 'done'
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            if(seller)
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
 * 앱실행시 첫 진입 페이지
 */
router.post(/^(?!api)\/login/, function(req, res, next) {

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
            //res.cookie('uobjid',seller.idx,{ expires: new Date(253402300000000), httpOnly: true });
            //var ret = {result:1,error:"",data:[seller]};
            //console.log('ret : ' + JSON.stringify(ret));
            //res.send(ret);
            var ret;
            if(seller)
            {
                res.cookie('uobjid',seller.idx,{ expires: new Date(253402300000000), httpOnly: true });
                ret = {result:1,error:"",data:[seller]};
            }
            else
                ret = {result:-1,error:"",data:[]};
            res.send(ret);
        }
    });

});

/**
 * 매장 정보 수정
 */
router.post('/api/update', function(req, res, next) {
    var json = req.body;


  //  json.idx = (json.idx) ? json.idx : (user.idx) ? user.idx : -1;
    console.log('updateupdateupdateupdateupdate  : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(SellerSelectJoinData, json),
        SellerUpdate,
        SellerSelectByeDate,
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

router.post('/api/select', function(req, res, next) {

    var json = req.body;
    //json.snsid : snsid
    //json.sns : sns
    //json.auth

    async.waterfall([
        async.apply(SellerSelectJoinData,json)
    ], function (err, json, seller) {
        console.log('seller select json : ' + JSON.stringify(json));
        console.log('seller select seller : ' + JSON.stringify(seller));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("info",JSON.stringify(err));
            var ret = {result:err.code,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {
            var ret;
            if(seller)
            {
                ret = {result:1,error:"",data:[seller]};
            }
            else
                ret = {result:-1,error:"",data:[]};
            res.send(ret);
        }
    });
});

router.post('/api/select/idx', function(req, res, next) {

    var json = req.body;
    var user = util.getCookieMobile(req);

    if(json.uobjid)
        json.idx = json.uobjid;
    else
        json.idx = user.uobjid;

    console.log('AAAAAAAAAA : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(SellerSelect,json),
        function (data, callback)
        {
          callback(null, json, data);
        },
        SellerUpdate], function (err, json, seller) {
        console.log('APP SELLER SELECLT : ' + JSON.stringify(json));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("info",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {

            var ret = {result:1,error:"",data:[seller]};
            res.send(ret);
        }
    });
});

router.post('/api/find', function(req, res, next) {

    var json = req.body;
    console.log('FIND : ' + JSON.stringify(json));
    json.auth = 'E';            //이메일 로그인 회원만 비번 찾기 가능
    async.waterfall([
        async.apply(SellerSelect,json),
        function(json, callback)
        {
              var data = {};
              data.to = json.email;
              var r = new Random();
              var rpasswd = r.string(6);
              data.newpassword = rpasswd;
              data.idx = json.idx;
              callback(null, data);
        },
        function(json, callback)
        {
            var query = "update "+objname+" set passwd = ? where idx = ?";
            var upto = [json.newpassword, json.idx];
            db.executeTransaction(query, upto, function(err,result){
                if(err)
                {
                    var error = {file: __filename, code: -1001, description: err.toString()};
                    callback(error);
                }
                else
                {
                    console.log('changed ' + result.changedRows + ' rows');
                    callback(null, json);
                }
            });
        },
        sendMail], function (err, result) {
        console.log('APP SELLER SELECLT : ' + JSON.stringify(result));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("info",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {
            var ret = result;
            res.send(ret);
        }
    });
});

router.post('/api/sendmail', function(req, res, next) {

    var json = req.body;
    sendmail.newPassword(json, function(result){
        res.send(result);
    });

});


function SellerSelectJoinData (json, callback){

    var snsid = (json.snsid)? json.snsid : "-1";
    var sns = (json.sns)? json.sns : "Z";
    var auth = (json.auth)? json.auth : "Z";
    var email = (json.email)? json.email : "";
    var passwd = (json.passwd)? json.passwd : "-1";

    var whereto = (auth == 'E') ? [email, passwd] : [snsid, sns];
    //이메일 주소만 체크한거는 로그인시 이메일 오류인지 비밀 번호 오류인지 체크하기 위함
    var query = (auth == 'E') ? "SELECT * FROM "+objname+" WHERE email = ? and auth = 'E'" : "SELECT * FROM "+objname+" WHERE snsid = ? and sns = ? and auth = 'S' ";

    db.executeQuery(query,whereto,function(err, result) {
        console.log('SellerSelectJoinData : ' + JSON.stringify(result));
        if(err)
        {
            var error = {file: __filename, code: -1001, description: err.toString()};
            callback(error);
        }
        else
        {
            if(result.rows.length > 0)
            {
                if(auth == 'E')
                {
                    if(result.rows[0].email != email)
                    {
                        var error = {file: __filename, code: -1011, description: ERROR["-1011"]};
                        callback(error);
                    }
                    else if(result.rows[0].passwd != passwd)
                    {
                        var error = {file: __filename, code: -1012, description: ERROR["-1012"]};
                        callback(error);
                    }
                    else
                        callback(null, json, result.rows[0]);
                }
                else
                {
                    callback(null, json, result.rows[0]);
                }
            }
            else
            {
                callback(null, json, null);
            }
        }
    });

}

function SellerUpdate(json, data, callback){

    console.log('SellerUpdate json: ' + JSON.stringify(json));
    console.log('SellerUpdate data: ' + JSON.stringify(data));

    var idx = (json) ? json.idx : (data) ? data.idx : -1;
    if(idx > 0)
    {

        var whereas = '';

        if(json.title)
            whereas += " title = '"+ json.title +"', ";

        if(json.attaches)
        {
            if(Array.isArray(json.attaches))
                whereas += " attaches = '"+ json.attaches.join() +"', ";
            else
                whereas += " attaches = '"+ json.attaches +"', ";
        }

        if(json.content)
            whereas += " content = '"+ json.content +"', ";

        if(json.cat)
            whereas += " cat = '"+ json.cat +"', ";

        if(json.sec)
            whereas += " sec = '"+ json.sec +"', ";

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
            console.log('SellerUpdate : ' + JSON.stringify(query));
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
        var auth = json.auth;

        if(json.passwd_chk)
            delete json.passwd_chk;

        if(auth == 'E')
        {
            if(json.sns)
                delete json.sns;
            if(json.snsid)
                delete json.snsid;
        }

        if(Array.isArray(json.attaches))
            json.attaches= json.attaches.join();

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

    console.log('SellerSelect json: ' + JSON.stringify(json));

    var whereto = [];
    var query = "";
    if(json.idx)
    {
        whereto = (json.idx) ? [json.idx] : (json.sobjid) ? [json.sobjid] : [-1];
        query = "SELECT * FROM "+objname+" WHERE idx = ?";
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
                    callback(null, result.rows[0]);                }
                else
                {
                    var error = {file: __filename, code: -1009, description:ERROR["-1009"]};
                    callback(error);
                }
            }
        });
    }
    else if(json.email && json.title)               //비밀번호 찾기 경우인데 따로 함수 생성 하는게 나은가?????
    {
        whereto = [json.email, json.title.trim().replace(' ', '')];
        query = "SELECT * FROM "+objname+" WHERE email = ? and REPLACE(TRIM(title), ' ', '') = ? and auth = 'E'";
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
        var query = "SELECT * FROM "+objname+" WHERE phonenb = ? and useyn = 'Y'  ";
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

function sendSellerPush (json, callback){

    var moduleName = "gcm";
    console.log('sendSellerPush : ' + JSON.stringify(json));
    rsmq.sendMessage({qname: moduleName, message: JSON.stringify(json)}, function (err, resp) {

        if (err) {
            var error = {file: __filename, code: -1001, description: err.toString()};
            ewinston.log("error",JSON.stringify(error));
            callback(error);
        }
        else {
            if (resp)
            {
                callback(null,json);
            }
            else
            {
                var error = {file: __filename, code: -1010, description: ERROR["-1010"] };
                console.log('sendSellerPush error: ' + JSON.stringify(error));
                ewinston.log("error",JSON.stringify(error));
                callback(error);
            }
        }
    });
}

function sendMail(json, callback)
{
    sendmail.newPassword(json, function(result){
        //res.send(result);
        callback(null, result);
    });
}

module.exports = router;
module.exports.SellerSelectPhonenb = SellerSelectPhonenb;
module.exports.sendSellerPush = sendSellerPush;
module.exports.SellerSelect = SellerSelect;
