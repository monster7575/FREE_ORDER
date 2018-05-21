var nodemailer = require('nodemailer');

var cmd = process.cwd();
var CONFIG = require(cmd + "/config").CONFIG;
var ERROR = require(cmd + "/config").ERROR;
var ewinston = require(cmd + "/common/ewinston");

var SMTP_TRANSPORT = CONFIG.SMTP.PROTOCOL + "://" + CONFIG.SMTP.HOST;


function mailFunction(json,callback)
{
    //add json.html
    //add json.subject
    //add json.from
    if(json.to && json.from && json.subject && json.html)
    {
        // create reusable transporter object using the default SMTP transport
        var transporter = nodemailer.createTransport(SMTP_TRANSPORT);

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: json.from, // sender address
            to: json.to, // list of receivers
            subject: json.subject, // Subject line
            html: json.html
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                var error = {file: __filename, code: -1001, description:err.toString()};
                ewinston.log("error",JSON.stringify(error));
                if(callback)
                {
                    var ret = {result:-1,error:JSON.stringify(error),data:[]};
                    callback(ret);
                }
            }
            else
            {
                if(callback) {
                    var ret = {result: 1, error: "", data: []};
                    callback(ret);
                }
            }
        });
    }
    else
    {
        var error = {file: __filename, code: -1003, description:ERROR["-1003"]};
        ewinston.log("error",JSON.stringify(error));
        if(callback)
        {
            var ret = {result:-1,error:JSON.stringify(error),data:[]};
            callback(ret);
        }
    }
}

function newPassword(json,callback)
{
    console.log('newPassword : ' + JSON.stringify(json));
    json.html = "<table><tr><td><div style='margin-top:20px; padding:2em; border-bottom-right-radius: 3px;border-bottom-left-radius: 3px;border-top-right-radius: 3px;border-top-left-radius: 3px;border: 1px solid #dad55e;background:#fffa90; color:#000000;'><p>새로운 비밀번호는 <b>"+ json.newpassword +"</b> 입니다.<br/> 대, 소문자 구분하여 정확하게 입력하여주세요.</p></div></td></tr></table>";
    json.from = '"관리자" <kwon7575@favinet.co.kr>';
    json.subject = '임시 비밀번호입니다.';

    mailFunction(json,callback);

}

exports.newPassword = newPassword;
