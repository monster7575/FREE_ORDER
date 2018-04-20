/**
 * Created by master on 2016-08-12.
 */
var cmd = process.cwd();
var CONFIG = require(cmd + "/config").CONFIG;
var logger = require("winston");

/*
require('winston-mysql-transport').Mysql;

options = {
    host     : CONFIG.MYSQLS[0].HOST,
    port     : CONFIG.MYSQLS[0].PORT,
    user     : CONFIG.MYSQLS[0].USER,
    password : CONFIG.MYSQLS[0].PASSWORD,
    database : CONFIG.MYSQLS[0].DATABASE,
    table : "systemlog"
}

logger.add(logger.transports.Mysql, options);
*/
module.exports=logger;