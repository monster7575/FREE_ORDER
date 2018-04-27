/**
 * Created by master on 2016-09-01.
 */
var _ = require("underscore");
var gcm = require('node-gcm');
var async = require('async');
var moment = require("moment");
var cmd = process.cwd();
var db = require(cmd + "/common/db");


function GCM(){

    var serverKey = "AIzaSyDEXoZQXqXlgUPq4BjaSJ_RV5ArvK478Gc";

    this.start = function(msg, sendQueueCallback) {

        console.log('msg : ' + JSON.stringify(msg));
        var json = JSON.parse(msg);
        var sender = new gcm.Sender(serverKey);

        var message = new gcm.Message({
            priority: 'high',
            timeToLive: 0,
            content_available: true,
            data: {
                message: json.content,
                title: json.title,
                data: json
            }
        });

        sender.send(message, {registrationTokens: [json.gcmtoken]}, function (err, response) {
            if (err) {
                var error = {file: __filename, code: -1001, description: err.toString()};
                console.log('error : ' + JSON.stringify(error));
                var ret = {result:-1,error:JSON.stringify(error), data:[]};
                console.log(ret);
            }
            else {
                var info = {file: __filename, code: 0, description: response};
                console.log('info : ' + JSON.stringify(info));
                var ret = {result:1,error:JSON.stringify(info),data:[]};
                console.log(ret);
            }
        });
    };
};

exports.RunObject = GCM;