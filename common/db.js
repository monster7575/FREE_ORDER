var SALT_WORK_FACTOR = 10;
var bcrypt = require('bcrypt');
var mySQL = require('mysql');
var cmd = process.cwd();
console.log('cmd : ' + cmd);
var CONFIG = require(cmd + "/config").CONFIG;

var poolCluster = mySQL.createPoolCluster();
poolCluster.add('MASTER', {
    host     : CONFIG.MYSQLS[0].HOST,
    port     : CONFIG.MYSQLS[0].PORT,
    user     : CONFIG.MYSQLS[0].USER,
    password : CONFIG.MYSQLS[0].PASSWORD,
    database : CONFIG.MYSQLS[0].DATABASE
});
poolCluster.add('SLAVE1', {
    host     : CONFIG.MYSQLS[1].HOST,
    port     : CONFIG.MYSQLS[1].PORT,
    user     : CONFIG.MYSQLS[1].USER,
    password : CONFIG.MYSQLS[1].PASSWORD,
    database : CONFIG.MYSQLS[1].DATABASE
});


function executeQuery(query, values, callback){
    poolCluster.getConnection("MASTER",function(err,connection){
        if (err) {
            connection.release();
            callback(err,null);
        }
        else
        {
            connection.query(query, values,function(err,rows){
                connection.release();
                if(!err) {
                    callback(null, {rows: rows});
                }
            });

        }
    });
}

function executeProcedure(query, values, callback){
    poolCluster.getConnection("MASTER",function(err,connection){
        if (err) {
            connection.release();
            callback(err,null);
        }
        else
        {
            connection.query(query, values,function(err,rows){
                connection.release();
                if(!err) {
                    callback(null, {rows: rows});
                }
            });

        }
    });
}

function executeTransaction(query, values, callback){
    poolCluster.getConnection("MASTER",function(err,connection){
        if (err) {
            connection.release();
            callback(err,null);
        }else{
            connection.beginTransaction(function(err) {
                if (err)
                {
                    connection.release();
                    callback(err,null);
                }
                else
                {
                    connection.query(query, values, function(err, result) {
                        if(err)
                        {
                            connection.rollback(function() {
                                connection.release();
                            });
                            callback(err,null);
                        }
                        else
                        {
                            connection.commit(function(err) {
                                if (err)
                                {
                                    connection.rollback(function(){
                                        connection.release();
                                    });
                                    callback(err,null);
                                }
                                else
                                {
                                    connection.release();
                                    //var log = 'Post ' + result.insertId + ' added';
                                    //console.log(log);
                                    callback(null,result);
                                }
                            });
                        }
                    });
                }
            });
        }
    });
}

function mysql_real_escape_string (str) {
    if (typeof str != 'string')
        return str;

    return str.replace(/[\0\x08\x09\x1a\n\r"'\\\%]/g, function (char) {
        switch (char) {
            case "\0":
                return "\\0";
            case "\x08":
                return "\\b";
            case "\x09":
                return "\\t";
            case "\x1a":
                return "\\z";
            case "\n":
                return "\\n";
            case "\r":
                return "\\r";
            case "\"":
            case "'":
            case "\\":
            case "%":
                return "\\"+char;
        }
    });
}

function mysql_reservation_keyword(str){
    if (typeof str != 'string')
        return str;
    switch (str) {
        case "using":
            return "`"+str+"`";
        default:
            return str;
    }
}


function end(){
    poolCluster.end();
}

function comparePassword(candidatePassword, originalPassword,  cb)
{
    bcrypt.compare(candidatePassword, originalPassword, function(err, isMatch){
        if(err) return cb(err);
        cb(null, isMatch);
    });
};


function createSaltPassword(candidatePassword, cb)
{
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
        if(err)
        {
            cb(err, null);
        }
        else
        {
            bcrypt.hash(candidatePassword, salt, function(err, hash){
                if(err)
                {
                    cb(err, null);
                }
                else
                {
                    cb(null, hash);
                }
            });
        }
    });
};


module.exports.executeQuery = executeQuery;
module.exports.executeProcedure = executeProcedure;
module.exports.executeTransaction = executeTransaction;
module.exports.mysql_real_escape_string = mysql_real_escape_string;
module.exports.mysql_reservation_keyword = mysql_reservation_keyword;
module.exports.end = end;
module.exports.comparePassword = comparePassword;
module.exports.createSaltPassword = createSaltPassword;

