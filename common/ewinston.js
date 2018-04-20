/**
 * Created by master on 2017-10-17.
 */


var cmd = process.cwd();
var winston = require(cmd + "/logger");
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;

function log(mode, msg, mailmsg)
{
    if(mode == undefined || msg == undefined)
    {
        var error = {file: __filename, code: -1003, description:ERROR["-1003"]};
        winston.log("error",JSON.stringify(error));
        return;
    }
    else
    {
        if(mailmsg)
        {
            var data = {};
            if(CONFIG.MODE == "REAL")
            {
                data.to = "kwon7575@favinet.co.kr";
                data.content = mailmsg;
                if(mode == "error")
                    winston.log("error",JSON.stringify(data));
                else
                    winston.log("error",JSON.stringify(data));
            }
            else
            {
                data.to = "kwon7575@favinet.co.kr";
                data.content = mailmsg;

                if(mode == "error")
                    winston.log("error",JSON.stringify(data));
                else
                    winston.log("error",JSON.stringify(data));
            }
        }

        winston.log(mode, msg);
    }
}

exports.log = log;