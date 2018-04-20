var CONFIG = {
    MODE : "DEV", //REAL
    WWW : {PROTOCOL:"HTTP", HOST : "localhost", PORT:3000 },
    API : {PROTOCOL:"HTTPS", HOST : "www.googleapis.com", PORT:443 },
    RSMQ : {HOST: "127.0.0.1", PORT: 6379, NAMESPACE:"rsmq"},
    MYSQLS : [
        {HOST:"211.39.147.216", PORT:3306, USER:"touchdown", PASSWORD:"dpswhs123!@#", DATABASE:"test", ROLE:"MASTER"},
        {HOST:"211.39.147.216", PORT:3306, USER:"touchdown", PASSWORD:"dpswhs123!@#", DATABASE:"test", ROLE:"SLAVE"}
    ],
    COOKIE : {SESSIONTIME:3600000}
};


var ERROR = {
    "-1001":"",
    "-1002":"HTTP 404, 500, 403 기타 에러입니다.",
    "-1003":"내용이 적절한 타입이 아닙니다.",
    "-1004":"",
    "-1005":"전달된 JSON 파라미터가 적절하지 않습니다.",
    "-1006":"카드저장이 실패했습니다.",
    "-1007":"GET,POST 파라미터가 정의되지 않았습니다.",
    "-1009":"데이터를 찾을수 없습니다."

};

exports.CONFIG = CONFIG;
exports.ERROR = ERROR;