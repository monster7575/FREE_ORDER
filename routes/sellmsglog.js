var express = require('express');
var router = express.Router();

var path = require('path');
var async = require("async");

var objname = path.basename(__filename, '.js');
var cmd = process.cwd();
var db = require(cmd + "/common/db");
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;
var ewinston = require(cmd + "/common/ewinston");
var _ = require("underscore");


/**
 * 발신 내역
 */
router.get(/^(?!api)\/mobile\/list/, function(req, res, next) {

    res.render(objname+'/list_mobile');

});

/**
 * 발신 상세
 */
router.get(/^(?!api)\/mobile\/update/, function(req, res, next) {

    res.render(objname+'/update_mobile');

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



module.exports = router;