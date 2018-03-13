// XMPP服务器BOSH地址
// var defaultIp = localStorage.url;
// var defaultPort = ':7070';
// var path = '/http-bind/';

var net = localStorage.getItem("net");
net = JSON.parse(net);

// var curIp = net.IM.ip;
// var curPort = net.IM.port;

var connectTime = 0;

// if(curIp == ''){
// 	curIp = localStorage.url;
// }
// if(net.IM.ip != ''){
// 	IM_IP = net.IM.ip;
// }else{
// 	IM_IP = localStorage.url;
// }

// if(net.IM.port != ''){
// 	IM_PORT = net.IM.port;
// }else{
// 	IM_PORT = ":7070";
// }
if(net.IM.ip != '' && net.IM.port !=''){
	// IM_IP = net.IM.ip;
	var nohttp = removeHttp(net.IM.ip);
	if(nohttp.indexOf(":") !== -1){//OA有端口号
		if(net.IM.check == true){//开启https加密
			IM_IP = "https://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
			IM_PORT = "7443";
		}else{
			IM_IP = "http://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
			IM_PORT = "7070";
		}
	}else{
		if(net.IM.check == true){//开启https加密
			IM_IP = "https://" + net.IM.ip;
			IM_PORT = ":7443";
		}else{
			IM_IP = "http://" + net.IM.ip;
			IM_PORT = ":7070";
		}
	}
}else{
	// if(net.IM.ip != '' && net.IM.port ==''){
	// 	IM_IP = net.IM.ip;
	// 	IM_PORT = "7070";
	// }
	// if(net.IM.ip == '' && net.IM.port !=''){
	// 	IM_IP = localStorage.url;
	// 	IM_PORT = net.IM.port;
	// }
	// if(net.IM.ip == '' && net.IM.port ==''){
	// 	IM_IP = localStorage.url;
	// 	IM_PORT = ":7070";
	// }

	if(net.IM.ip != '' && net.IM.port == ''){
		var nohttp = removeHttp(net.IM.ip);
		if(nohttp.indexOf(":") !== -1){//OA有端口号
			if(net.IM.check == true){//开启https加密
				IM_IP = "https://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
				IM_PORT = "7443";
			}else{
				IM_IP = "http://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
				IM_PORT = "7070";
			}
		}else{
			if(net.IM.check == true){//开启https加密
				IM_IP = "https://" + net.IM.ip;
				IM_PORT = ":7443";
			}else{
				IM_IP = "http://" + net.IM.ip;
				IM_PORT = ":7070";
			}
		}
	}
	if(net.IM.ip == '' && net.IM.port != ''){
		var nohttp = removeHttp(localStorage.url);
		if(nohttp.indexOf(":") != -1){//有端口号
			if(net.IM.check == true){//开启https加密
				IM_IP = "https://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
				IM_PORT = "7443";
			}else{
				IM_IP = "http://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
				IM_PORT = "7070";
			}
		}else{
			IM_IP = localStorage.url;
			if(net.IM.check == true){//开启https加密
				IM_PORT = ":7443";
			}else{
				IM_PORT = ":7070";
			}
		}

	}
	if(net.IM.ip == '' && net.IM.port == ''){
		var nohttp = removeHttp(localStorage.url);
		if(nohttp.indexOf(":") != -1){//OA有端口号
			if(net.IM.check == true){//开启https加密
				IM_IP = "https://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
				IM_PORT = "7443";
			}else{
				IM_IP = "http://" + nohttp.substring(0,nohttp.indexOf(":") + 1);
				IM_PORT = "7070";
			}
		}else{
			IM_IP = localStorage.url;
			if(net.IM.check == true){//开启https加密
				IM_PORT = ":7443";
			}else{
				IM_PORT = ":7070";
			}
		}

	}

}
var BOSH_SERVICE = IM_IP + IM_PORT + '/http-bind/';
// alert(BOSH_SERVICE);

// XMPP连接
var connection = null;

// 当前状态是否连接
var connected = false;

// 当前登录的JID
var jid = "";

// 连接状态改变的事件
function onConnect(status) {
    if (status == Strophe.Status.CONNFAIL) {
        console.log("IM连接失败！");
    } else if (status == Strophe.Status.CONNECTING) {
        console.log("正在连接...");
        $(".IM_Status").show();
        $(".connecting").text("正在连接...");
    } else if (status == Strophe.Status.AUTHFAIL) {
        console.log("IM登录失败！");
    } else if (status == Strophe.Status.CONNTIMEOUT) {
        console.log("连接超时！");
        $(".IM_Status").show();
        $(".connecting").text("连接超时");
    } else if (status == Strophe.Status.DISCONNECTED) {
		console.log("连接断开！");
        $(".IM_Status").show();
        $(".connecting").text("连接断开");
		connected = false;
    } else if (status == Strophe.Status.CONNECTED) {
        console.log("连接成功，可以开始聊天了！");
        $(".IM_Status").hide();
		connected = true;

		// 当接收到<message>节，调用onMessage回调函数
		connection.addHandler(onMessage, null, 'message', null, null, null);

		// 首先要发送一个<presence>给服务器（initial presence）
		connection.send($pres().tree());
    }
}

// 接收到<message>
function onMessage(msg) {
	// 解析出<message>的from、type属性，以及body子元素
    var from = msg.getAttribute('from');
    var type = msg.getAttribute('type');
    var elems = msg.getElementsByTagName('body');

    if (type == "chat" && elems.length > 0) {
		var body = elems[0];

		var text = $(body).html();
        var json = JSON.parse(text);

		popChat(json);
    }
    return true;
}
connecting();
function connecting(){
	var time = new Date().getTime();
	if(!connected) {
		connection = new Strophe.Connection(BOSH_SERVICE);
		connection.connect(localStorage.userId+"@zatp/PC_"+time,"trsadmin", onConnect);
	}
}
setInterval(connecting,5000);

function removeHttp(value){
	if(value.indexOf("https://") != -1){
		var removed  =  value.replace("https://","");
		return removed;
	}else{
		var removed  =  value.replace("http://","");
		return removed;
	}
}