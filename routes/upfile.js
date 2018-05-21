/**
 * Created by master on 2016-03-02.
 */

var moment = require('moment');
var fs = require('fs');
var mkdirp = require('mkdirp');
var cwebp = require('cwebp');
var request = require('request');
var async = require('async');
var path = require('path');
var objname = path.basename(__filename, '.js');

var express = require('express');
var router = express.Router();

var cmd = process.cwd();
var db = require(cmd + "/common/db");
var ERROR = require(cmd + "/config").ERROR;

router.post('/api/save', function(req, res, next) {
    //find saved :
    console.log(req.body);
    console.log(req.file);

    var upFile = req.file;
    if (upFile) {
        // 변수 선언
        var name = upFile.originalname;
        console.log("파일 네임 =>" + name);

        var path = upFile.path;

        var type = upFile.mimetype;
        var buffer = upFile.buffer;
        // 이미지 파일 확인
        if (type.indexOf('octet-stream') >= 0 || type.indexOf('multipart/form-data') >= 0) {
            var ext = "PNG";
            var params = name.split(".");

            if(params.length >= 2)
                ext = params[params.length-1].toUpperCase();

            var values = {ext:ext};
            var query = "INSERT INTO upfile SET ? ";
            db.executeTransaction(query, values, function(err,result){
                if(err)
                {
                    var error = {file: __filename, code: -1001, description: err.toString()};
                    //res.send({err:-1,"error":err.toString()});
                    res.send({result:-1,error:err.toString(),data:[]});
                }
                else
                {
                    if(result.insertId)
                    {
                        var item = {};
                        item["idx"] = result.insertId;
                        item["ext"] = ext;
                        item["regdate"] = Date.now();

                        var c1 = moment(item.regdate).format('YYYY/MM/DD');
                        var outputDir = "/home/favinet/www_httpd/html/upload/" + c1;
                        var outputPath = outputDir + "/" + item.idx + "." + item.ext;
                        var webpPath =  outputDir + "/" + item.idx + ".webp";

                        var valuePath = "/upload/" + c1 + "/"  + item.idx + "." + item.ext;

                        mkdirp(outputDir, function (err) {
                            if(err)
                            {
                                //res.jsonp({err:-1,"error":err.toString()});
                                res.jsonp({result:-1,error:err.toString(),data:[]});
                            }
                            else
                            {
                                var stream = fs.createWriteStream(outputPath);
                                stream.write(buffer);
                                stream.on('error', function(err) {
                                    //res.send({err:-1,"error":err.toString()});
                                    res.send({result:-1,error:err.toString(),data:[]});
                                });
                                stream.on('finish', function() {

                                    console.log("파일 path =>" + valuePath);
                                    var CWebp = cwebp.CWebp;
                                    var encoder = new CWebp(outputPath);
                                    encoder.write(webpPath, function(err) {
                                        console.log('converted ' + err);
                                    });

                                    //res.jsonp({path:valuePath});
                                    res.jsonp({result:1,error:"",data:[{path:valuePath}]});
                                });
                                stream.end();
                            }
                        });
                    }
                    else
                    {
                        var error = {file: __filename, code:-1019, description:ERROR["-1019"]};
                        //res.send({err:-1,"error":error.description});
                        res.send({result:-1,error:error.description,data:[]});
                    }

                }
            });

        } else {
            console.log("octet-stream not found");
            // 이미지 파일이 아닌 경우 : 파일 이름 제거
            fs.unlink(path, function(err) {
                //res.jsonp({err:-1,"error":err.toString()});
                res.jsonp({result:-1,error:err.toString(),data:[]});
            });
        }
    } else {
        //res.send({err:-1,"error":"upload file is nothing"});
        res.send({result:-1,"error":"upload file is nothing",data:[]});
    }
});


router.post('/api/download', function(req, res, next) {
    //find saved :
    console.log(req.body);
    //console.log(req.file);
    async.waterfall([
        function (callback) {
            if (req.body.url) {
                callback(null, req.body.url);
            } else {
                var error = {file: __filename, code: -1007, description: ERROR["-1007"]};
                callback(error);
            }
        },
        function (url, callback) {
            // arg1 now equals 'one' and arg2 now equals 'two'
            request(
                { method: 'GET'
                    , uri: url
                    , gzip: true
                    , encoding: null // body content binary buffer option
                }
                , function (err, response, body) {
                    // body is the decompressed response body
                    //console.log('server encoded the data as: ' + (response.headers['content-encoding'] || 'identity'))
                    //console.log('the decoded data is: ' + body.length)
                    if(err)
                    {
                        var error = {file: __filename, code: -1001, description: err.toString()};
                        callback(error);
                    }
                    else
                    {
                        if (response.statusCode == 200) {
                            var content = response.headers['content-type'];
                            if (content.indexOf("image") >= 0) {
                                var ext = "PNG";
                                var params = url.split(".");
                                if (params.length >= 2)
                                {
                                    var tmp = params[params.length - 1].toUpperCase();
                                    if(tmp.length <= 4 && tmp.indexOf("?") < 0)
                                        ext = tmp;
                                }

                                callback(null, ext, body);

                            } else {
                                var error = {file: __filename, code: -1003, description:ERROR["-1003"]};
                                callback(error);
                            }
                        } else {
                            var error = {
                                file: __filename,
                                code: -1002,
                                description: "http error " + response.statusCode
                            };
                            callback(error);
                        }
                    }
                }
            );
        },
        function (ext, data, callback) {

            var values = {ext:ext};
            var query = "INSERT INTO upfile SET ?";
            db.executeTransaction(query, values, function(err,result){

                if (err) {
                    var error = {file: __filename, code: -1001, description: err.toString()};
                    callback(error);
                }
                else {
                    if(result.insertId)
                    {
                        var item = {};
                        item["idx"] = result.insertId;
                        item["ext"] = ext;
                        item["regdate"] = Date.now();
                        callback(null, item, data);
                    }
                    else
                    {
                        var error = {file: __filename, code: -1019, description:ERROR["-1019"]};
                        callback(error);
                    }
                }

            });

        },
        function (item, data, callback) {

            var c1 = moment(item.regdate).format('YYYY/MM/DD');
            var outputDir = "/home/favinet/www_httpd/html/upload/" + c1;
            var outputPath = outputDir + "/" + item.idx + "." + item.ext;
            var webpPath = outputDir + "/" + item.idx + ".webp";
            var valuePath = "/upload/" + c1 + "/" + item.idx + "." + item.ext;

            mkdirp(outputDir, function (err) {
                if (err) {
                    var error = {file: __filename, code: -1001, description: err.toString()};
                    callback(error);
                }
                else {
                    var stream = fs.createWriteStream(outputPath);
                    stream.write(data);
                    stream.on('error', function (err) {
                        var error = {file: __filename, code: -1001, description: err.toString()};
                        callback(error);
                    });
                    stream.on('finish', function () {
                        callback(null, outputPath, webpPath, valuePath);
                    });
                    stream.end();
                }
            });
        },
        function (outputPath, webpPath, valuePath, callback) {

            //console.log("파일 path =>" + valuePath);
            var CWebp = cwebp.CWebp;
            var encoder = new CWebp(outputPath);
            encoder.write(webpPath, function (err) {
                console.log('converted ' + err);
                if (err) {
                    var error = {file: __filename, code: -1001, description: err.toString()};
                    callback(error);
                }
                else {
                    callback(null, {path: valuePath});
                }
            });
            //res.jsonp({path:valuePath});
        }
    ], function (err, result) {
        if (err) {
            var ret = {result:-1,error:err.description,data:[]};
            res.jsonp(ret);
        }
        else {
            var ret = {result:1,error:"",data:[result]};
            res.jsonp(ret);
        }
        // result now equals 'done'
    });

});

router.get('/api/delete', function(req, res, next) {
    var path = req.query.path;
    if(typeof(path) == "undefined")
        res.jsonp({err:-1,"error":"query empty"});
    // /upload/2016/03/03/56d7d0d4a62f77db129ba147.JPG
    var deletePath = "/home/favinet/www_httpd/html" + path; //전역변수화.

    fs.unlink(deletePath, function(err) {
        if(err)
        {
            //res.jsonp({err:-1,"error":err.toString()});
            res.jsonp({result:-1,error:err.toString(),data:[]});
        }
        else
        {
            var infos = path.split("/");
            var finfos = infos[infos.length-1].split(".");

            var delto = [finfos[0]];
            var query = "DELETE FROM upfile WHERE idx = ? ";
            db.executeTransaction(query, delto, function(err,result){
                if(err){
                    //res.jsonp({err:-1,"error":err.toString()});
                    res.jsonp({result:-1,error:err.toString(),data:[]});
                }else{
                    //res.jsonp({err:0});
                    res.jsonp({result:1,error:"",data:[]});
                }
            });
        }
    });
});

module.exports = router;