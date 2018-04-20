/**
 * Created by master on 2016-10-12.
 */
/**
 *
 * CMS 사용자쿠키 to JSON
 *
 * @param req
 * @returns {{}}
 */
var crypto = require("crypto");
var moment = require('moment');

function getCookieUser(req)
{
    var user = {};
    user.zobjid =  req.cookies.idx;
    user.zobjnm =  req.cookies.uid;
    user.level = req.cookies.level;
    user.companycode = req.cookies.companycode;
    user.menu = req.cookies.menu;
    return user;
}

function getCookieMobile(req)
{
    var user = {};
    user.uobjid =  req.cookies.uobjid;
    user.kbid =  req.cookies.kbid;
    return user;
}

function fullUrl(request){

    var url = request.protocol + '://' + request.get('host') + request.originalUrl;
    return url;

}

function timestamp(){
    return Math.floor(Date.now() / 1000);
}

function actionSuffix(request) {

    //20161102
    //routes[0] : protocol host
    //routes[1] : empty
    //routes[2] : host
    //routes[3] : node, apache unified
    //routes[4] : object
    //routes[5] : action kind

    var url = fullUrl(request);
    var routes = url.split("/");
    if (routes.length < 6)
        return "";
    else
    {
        var prefix = routes[5];
        var sep = prefix.indexOf("_");
        var len = prefix.length;
        if(sep >= 0)
            return prefix.substring(sep,len);
        else
            return "";
    }
}

// Luhn algorithm
// takes the form field value and returns true on valid number
function validCreditCard(value) {
    // accept only digits, dashes or spaces
    if (/[^0-9-\s]+/.test(value)) return false;

    // The Luhn Algorithm. It's so pretty.
    var nCheck = 0, nDigit = 0, bEven = false;
    value = value.replace(/\D/g, "");

    for (var n = value.length - 1; n >= 0; n--) {
        var cDigit = value.charAt(n),
            nDigit = parseInt(cDigit, 10);

        if (bEven) {
            if ((nDigit *= 2) > 9) nDigit -= 9;
        }

        nCheck += nDigit;
        bEven = !bEven;
    }

    return (nCheck % 10) == 0;
}

function pad(num, size, filler) {
    if(filler === undefined)
        filler = "0";
    var s = num+"";
    while (s.length < size) s = filler + s;
    return s;
}

function padRight(num, size, filler) {
    if(filler === undefined)
        filler = "0";
    var s = num+"";
    while (s.length < size) s = s + filler;
    return s;
}

function isOkhttp(req) {

    if(req.useragent.source)
    {
        if(req.useragent.source.toLowerCase().indexOf("okhttp") >= 0)
            return true;
        else
            return false;
    }
    else
        return false;
}

function encrypt(text,key){
    /* 알고리즘과 암호화 key 값으로 셋팅된 클래스를 뱉는다 */
    var cipher = crypto.createCipher('aes-256-cbc',key);

    /* 컨텐츠를 뱉고 */
    var encipheredContent = cipher.update(text,'utf8','hex');

    /* 최종 아웃풋을 hex 형태로 뱉게 한다*/
    encipheredContent += cipher.final('hex');

    return encipheredContent;
}

/*암호화나 복호화나 자세히 보면 비슷함*/
function decrypt(text,key){

    var decipher = crypto.createDecipher('aes-256-cbc',key);

    var decipheredPlaintext = decipher.update(text,'hex','utf8');

    decipheredPlaintext += decipher.final('utf8');

    return decipheredPlaintext;
}

//week days monday ~ sunday
function getWeekDate(now)
{
    var date = moment(now),
        begin = moment(date).startOf('week').isoWeekday(8);

    var weeks = {};
    weeks.stdate = begin.format('YYYY-MM-DD');
    weeks.eddate = begin.add(6, 'd').format('YYYY-MM-DD');
    console.log('weeks : ' + JSON.stringify(weeks));

    return weeks;
}

// get month days previous month 24 ~ now month 25
function getMonthDays(obj)
{

    var months = {};
    var check = moment(obj);

    var nyear  = check.format('YYYY');
    var pmonth = check.add(-1, 'M').format('MM');   //이전
    var month = check.add(1, 'M').format('MM');     //현재
    var nmonth = check.add(1, 'M').format('MM');    //다음
    var nday   = check.format('DD');

    var stdate;
    var eddate;
    if(nday < 25)
    {
        stdate = nyear+"-"+pmonth+"-25";
        eddate = nyear+"-"+month+"-24";
    }
    else
    {
        stdate = nyear+"-"+month+"-25";
        eddate = nyear+"-"+nmonth+"-24";
    }

    months.stdate = stdate;
    months.eddate = eddate;


    console.log('months : ' + JSON.stringify(months));
    return months;
}

exports.getCookieUser = getCookieUser;
exports.getCookieMobile = getCookieMobile;
exports.fullUrl = fullUrl;
exports.timestamp = timestamp;
exports.actionSuffix = actionSuffix;
exports.validCreditCard = validCreditCard;
exports.pad = pad;
exports.padRight = padRight;
exports.isOkhttp = isOkhttp;
exports.encrypt = encrypt;
exports.decrypt = decrypt;
exports.getWeekDate = getWeekDate;
exports.getMonthDays = getMonthDays;