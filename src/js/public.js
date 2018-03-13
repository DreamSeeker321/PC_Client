/**
 * 公共常量
 */
var URL = localStorage.url;
var USERID = localStorage.userId;
var AUTOLOGOIN = localStorage.autoLogin;
var USERNAME = localStorage.userName;
var TITLE = localStorage.title;
var NET = localStorage.net;
var ISAUTOLOGIN = localStorage.isAutoLogin;

var MES_SENDING = 0;
var MES_SENT = 1;
var MES_UNSENT = 2;
var DEFAULT_ICO = 0;


var fs = require("fs");
var request = require("request");
/*
*	即时通讯的ajax请求简写
*	@url 请求的路径
*	@para 请求的参数
*	@callback 请求成功后执行的函数
*/
function IM_ajax(url, para, callback, error) {
	$.ajax({
		type:"post",
		url:localStorage.imUrl+url,
		data:para,
		dataType:"json",
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        timeout: 1000 * 10,
		beforeSend: function(XMLHttpRequest){
            //$(".getMoreLog").text("正在加载...");
		},
		success:function(data){
			callback(data);
		},
        error: function (xhr, status, err) {
            error && error(xhr, status, err);
            console.log(err);
		},
		complete:function(){

		}
	});

}
/*localStorage 添加值*/
function saveOrSetToLocal (key,value,item){
	var s_localJson = localStorage.getItem(item) || "{}";
	var j_localJson = JSON.parse(s_localJson);
	j_localJson[key] = value;
	s_localJson = JSON.stringify(j_localJson);
	localStorage[item] = s_localJson;
}

/*查询值*/
function getLocal(key,item){
	var s_localJson = localStorage.getItem(item) || "{}";
	var j_localJson = JSON.parse(s_localJson);
	if(j_localJson[key] != null){
		var s_str = JSON.stringify(j_localJson[key]);
		return s_str;
	}else{
		return false;
	}
}
//设置居中 传入的参数是class,暂时不支持ID
function makeCenter(cls,parent){
	if(parent === undefined){
		parent = window;
	}
	var width = $("." + cls).width();
	var height = $("." + cls).height();
	var windowWidth = $(parent).width();
	var windowHeight = $(parent).height();
	// var timestamp = Date.parse(new Date());
	// var zIndex = timestamp/1000;
	$("." + cls).css({ top: ((windowHeight - height) / 2 - 20 ) +"px", left: ((windowWidth - width) / 2 ) +"px"});
}


function OpenUrlFromExternal(url){
	var cp = require('child_process'); //子进程
	cp.exec(process.cwd()+"/browser/Browser.exe \""+localStorage.url+"\" \""+url+"\" \""+"OAOP_JSESSIONID="+localStorage.JSESSIONID+";userName="+localStorage.userId+";path=/"+"\"");
}

function CloseBrowsers(){
	var cp = require('child_process'); //子进程
	cp.exec('taskkill /f /t /im Browser.exe');
}

/**
 * 返回消息模型
 */
function msgModelFun(obj) {
    var sessionId;
    if (obj.type == 1) {//单聊
        if (obj.fromId == USERID) {
            sessionId = obj.toId;
            sessionName = obj.toName
        } else {
            sessionId = obj.fromId;
            sessionName = obj.fromName
        }
    } else {//组聊
        sessionId = obj.toId;
        sessionName = obj.toName
    }
    var model = {
        id: obj.id,
        toId: obj.toId,
        toName: obj.toName,
        fromId: obj.fromId,
        fromName: obj.fromName,
        type: obj.type,
        content: obj.content,
        time: obj.time,
        userId: USERID,
        flag: 0,
        sessionId: sessionId,
        sessionName: sessionName,
        timestamp: obj.timestamp,
        ico: obj.ico ? obj.ico : 0,
        guid: obj.guid ? obj.guid : guid(),
        sendFlag: MES_SENT
    };
    return model;
}

/**
 * 生成 guid
 * @returns {*}
 */
function guid() {
    function _p8(s) {
        var p = (Math.random().toString(16) + "000000000").substr(2, 8);
        return s ? "-" + p.substr(0, 4) + "-" + p.substr(4, 4) : p;
    }

    return _p8() + _p8(true) + _p8(true) + _p8();
}
/**
 * 浅复制
 * @param src
 * @returns {{}}
 */
function shallowCopy(src) {
    var dst = {};
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            dst[prop] = src[prop];
        }
    }
    return dst;
}

function downloadAvatar(uri, filename, callback) {
    if (!fs.existsSync(process.cwd() + "\\avatar")) { //
        fs.mkdirSync(process.cwd() + "\\avatar");
    }
    // console.log(process.cwd()+"\\avatar\\"+filename);
    // var stream = fs.createWriteStream(process.cwd()+"\\avatar\\"+filename);
    // request(uri).pipe(fs.createWriteStream(process.cwd()+"\\avatar\\"+filename)).on('close', callback);

    request.head(uri, function (err, res, body) {
        console.log('content-type:', res.headers['content-type']);
        console.log('content-length:', res.headers['content-length']);

        request(uri).pipe(fs.createWriteStream((process.cwd() + "\\avatar\\" + filename))).on('close', callback);
        request("http://115.28.240.106/attachmentController/downFile.action?id=771").pipe(fs.createWriteStream((process.cwd() + "\\avatar\\" + "aa.png"))).on('close', function () {
            console.log(1)
        });
    });
}