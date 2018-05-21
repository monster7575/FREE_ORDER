var express = require('express');
var router = express.Router();
var path = require('path');
var objname = path.basename(__filename, '.js');
var cmd = process.cwd();

var axios = require('axios');
var CryptoJS = require("crypto-js");

var consumerKey = 'IJB50xP3XdtgHGLV17G8';
var consumerSecret = "do6Ss3fpfYQLZz2Bh4ZIysUAGbGftoPMwmQeCBZa";
var requestMethod = "GET";
var requestUrl= 'https://api.ncloud.com/geolocation/';



router.post('/api/geo', function(req, res, next) {

    var json = req.body;

    var sortedSet = {};

    sortedSet["action"] = "getLocation";
    sortedSet["ip"] = json.ip;
    sortedSet["oauth_consumer_key"]= consumerKey;
    sortedSet["oauth_nonce"] = +new Date();
    sortedSet["oauth_signature_method" ] = "HMAC-SHA1";
    sortedSet["oauth_timestamp"]= Math.floor((+new Date)/1000);
    sortedSet["oauth_version"]="1.0";
    sortedSet["responseFormatType"] = "json";

    var queryString = Object.keys(sortedSet).reduce( (prev, curr)=>{
            return prev + curr + '=' + sortedSet[curr] + '&';
}, "");
    console.log('queryString : ' + +new Date);
    queryString = queryString.substr(0, queryString.length -1 );

    var baseString = requestMethod + "&" + encodeURIComponent( requestUrl ) + "&" + encodeURIComponent( queryString );
    console.log('baseString : ' + baseString);
    var signature = CryptoJS.HmacSHA1( baseString, consumerSecret +'&').toString(CryptoJS.enc.Base64);
    console.log('signature : ' + signature);

    queryString +=  '&oauth_signature=' + encodeURIComponent( signature );



    axios.get(

`https://api.ncloud.com/geolocation/?${queryString}`
        )
    .then( response=>{
        console.log( response.data );
    res.send(response.data);
})
    .catch( error =>{
        console.log( error.response.data );
    res.send(error.response.data);
})


});


module.exports = router;


