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
 * 발신 내역
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    var user = util.getCookieMobile(req);

    async.waterfall([
        async.apply(selectFunction,user)

    ], function (err, sellers) {
        console.log('Seller sellers : ' + JSON.stringify(sellers));
        // result now equals 'done'
        if (err)
        {
            ewinston.log("error",JSON.stringify(err));
            res.render('common/error_mobile', {objname : objname, error:err, backurl:'', user:{}, url:util.fullUrl(req)});
        }
        else
        {

            res.render(objname+'/list_mobile', {objname:objname, data:sellers, user:user, url:util.fullUrl(req), moment : moment});
        }
    });

});


/**
 * 발신 상세
 */
router.get(/^(?!api)\/mobile\/select\/(.*)/, function(req, res, next) {
///^(?!api)\/(select|select_popup)\/(.*)/
    var idx = req.params[0];
    console.log('sellermsglog : ' + JSON.stringify(idx));
    console.log('sellermsglog : ' + JSON.stringify(req.params));

    var query = "SELECT a.content, a.regdate FROM "+objname+" a join buyer b on a.bobjid = b.idx where a.idx = ? order by a.idx desc ";
    console.log('query : ' + query);
    db.executeQuery(query,[idx],function(err, result) {
        console.log('sellermsglog : ' + JSON.stringify(result));
        console.log('sellermsglog : ' + JSON.stringify(err));
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

router.post('/api/insert', function(req, res, next) {

    var json = req.body;
    console.log('sellmsglog json : ' + JSON.stringify(json));

    async.waterfall([
        async.apply(insertFunction,json)

    ], function (err, sellermsglog) {

        console.log('sellermsglog err : ' + JSON.stringify(err));
        console.log('sellermsglog : ' + JSON.stringify(sellermsglog));
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

function insertFunction (json, callback){


    console.log('insertFunction====>' + JSON.stringify(json));
    var into = [json.content, json.bobjid, json.sobjid];
    var query = "insert into "+objname+" (content, bobjid, sobjid) value (?, ?, ?) ";
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

function selectFunction(json, callback)
{
    if(json.uobjid)
    {
        var whereto = [json.uobjid];
        var query = "SELECT a.idx as idx, a.regdate as regdate, b.phonenb as phonenb FROM "+objname+" a join buyer b on a.bobjid = b.idx \
            where a.sobjid = ? order by a.idx desc ";
        db.executeQuery(query,whereto,function(err, result) {
            if(err)
            {
                var error = {file: __filename, code: -1001, description: err.toString()};
                callback(error);
            }
            else
            {
                console.log('selectFunction result : ' + JSON.stringify(result.rows));
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