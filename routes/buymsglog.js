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


/**
 * 수신 내역
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    var user = util.getCookieMobile(req);

    async.waterfall([
        async.apply(selectFunction,user)

    ], function (err, buyer) {

        // result now equals 'done'
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {

            res.render(objname+'/list_mobile', {objname:objname, data:buyer, user:user, url:util.fullUrl(req), moment : moment});
        }
    });

});

/**
 * 수신 상세
 */
router.get(/^(?!api)\/mobile\/select\/(.*)/, function(req, res, next) {

    var idx = req.params[0];

    var query = "SELECT a.*, b.phonenb as phonenb FROM "+objname+" a join buyer b on a.bobjid = b.idx WHERE a.idx = ? order by a.idx desc";

    db.executeQuery(query,[idx],function(err, result) {
        if(err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {
            res.render(objname+'/update_mobile', {objname:objname, data:result.rows[0], user:{}, url:util.fullUrl(req), moment : moment});
        }

    });

});

/**
 * 주문 정보 수정
 */
router.post('/api/update', function(req, res, next) {
    var json = req.body;

    console.log('update  : ' + JSON.stringify(json));
    async.waterfall([
        async.apply(updateFunction, json)
    ], function (err, data) {
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            var ret = {result:-1,error:err.description,data:[]};
            res.send(ret);
        }
        else
        {

            var ret = {result:1,error:"",data:data};
            console.log('ret : ' + JSON.stringify(ret));
            res.send(ret);
        }
    });

});

/* test use */
router.get('/api/update', function(req, res, next) {

   // var query = "update seller set attaches = '/upload/2018/05/03/3.PNG,/upload/2018/05/03/4.PNG,/upload/2018/05/03/5.PNG,/upload/2018/05/03/6.PNG' where idx = 4 ";
    var query = "delete from seller where idx = 4 ";
    console.log('quert : ' + query);
    db.executeTransaction(query,[],function(err,result){
        if(err)
        {
            res.send(JSON.stringify(err));
        }
        else
        {
            res.send(JSON.stringify(result));
        }
    });
});

/**
 * 주문 리스트 페이징 처리
 */
router.post('/api/list', function(req, res, next) {

    var json = req.body;
    var user = util.getCookieMobile(req);
    console.log('list paaging  : ' + JSON.stringify(json));

    console.log('list paaging  user : ' + JSON.stringify(user));

    var page = (json.page)? parseInt(json.page) : 1;
    var cnt = (json.cnt)? parseInt(json.cnt) : 10;
    var limit = cnt;
    var offset = (page - 1) * cnt;
    json.uobjid = user.uobjid;

    if(json.uobjid)
    {
        var whereto = [json.uobjid, limit, offset];
        var query = "SELECT a.*, b.phonenb as phonenb FROM "+objname+" a join buyer b on a.bobjid = b.idx WHERE a.sobjid = ? order by a.idx desc limit ? offset ? ";
        db.executeQuery(query,whereto,function(err, result) {
            if (err)
            {
                ewinston.log("error",JSON.stringify(err));
                res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
            }
            else
            {
                res.render(objname+'/paging_mobile', {objname : objname, data : result.rows, error:{}, backurl:'', user:{}, url:util.fullUrl(req), moment : moment});
            }
        });
    }
    else
    {
        res.render('common/error_mobile', {objname : objname, error:{}, backurl:'', user:{}, url:util.fullUrl(req)});
    }
});

/**
 * 이전 주문 처리
 */
router.post('/api/list/previous', function(req, res, next) {

    var json = req.body;

    console.log('list previous paaging  : ' + JSON.stringify(json));

    var page = (json.page)? parseInt(json.page) : 1;
    var cnt = (json.cnt)? parseInt(json.cnt) : 1;
    var limit = cnt;
    var offset = (page - 1) * cnt;


    if(json.bobjid)
    {
        var whereto = [json.bobjid, limit, offset];
        var query = "select * from buymsglog where bobjid = ? order by idx desc limit ? offset ? ; ";
        db.executeQuery(query,whereto,function(err, result) {
            if (err)
            {
                ewinston.log("error",JSON.stringify(err));
                var ret = {result:-1,error:err.description,data:[]};
                res.send(ret);
            }
            else
            {
                if(result.rows.length > 0)
                var ret = (result.rows.length > 0) ? {result:1,error:"",data:result.rows[0]} : {result:-1,error:"",data:[]};
                console.log('ret : ' + JSON.stringify(ret));
                res.send(ret);
            }
        });
    }
    else
    {
        var ret = {result:-1,error:''.description,data:[]};
        res.send(ret);
    }
});

function insertFunction (json, callback){

    var into = [json.content, json.address, json.bobjid, json.sobjid, json.price, json.address2];
    var query = "insert into "+objname+" (content, address, bobjid, sobjid, price, address2) value (?, ?, ?, ?, ?, ?) ";
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

function updateFunction(json, callback){


    console.log('updateFunction====>' + JSON.stringify(json));

    if(json)
    {

        var idx = json.idx;
        var whereas = '';

        if(json.startdate)
            whereas += " startdate = '"+ json.startdate +"', ";

        if(json.duedate)
            whereas += " duedate = '"+ json.duedate +"', ";

        if(json.enddate)
            whereas += " enddate = '"+ json.enddate +"', ";

        if(json.state)
            whereas += " state = '"+ json.state +"', ";

        whereas = whereas.substr(0, whereas.length-2);

        var query = "UPDATE "+objname+" SET "+ whereas +" WHERE idx = " + idx;
        console.log('updateFunction query====>' + query);

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
                    var ret = JSON.parse(JSON.stringify(json));
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
        var error = {file: __filename, code: -1005, description:ERROR["-1005"]};
        callback(error);
    }

}

function selectFunction(json, callback){

    console.log('selectFunction json: ' + JSON.stringify(json));
    if(json.uobjid)
    {
        var whereto = [json.uobjid];
        var query = "SELECT a.*, b.phonenb as phonenb FROM "+objname+" a join buyer b on a.bobjid = b.idx WHERE a.sobjid = ? order by a.state asc, a.idx desc";
        db.executeQuery(query,whereto,function(err, result) {
            if(err)
            {
                var error = {file: __filename, code: -1001, description: err.toString()};
                callback(error);
            }
            else
            {
                callback(null, result.rows);
            }
        });
    }
    else
    {
        var error = {file: __filename, code: -1005, description:ERROR["-1005"]};
        callback(error);
    }

}

module.exports = router;
module.exports.insertFunction = insertFunction;
module.exports.selectFunction = selectFunction;