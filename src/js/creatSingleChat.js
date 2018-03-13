function creatSingleChat(toId,toName){
	var allChat=[];
	var date = new Date();

	//判断是否已经打开了该窗口和会话
	// if(打开了){
	// 	hide、show

	// 	//判断当前会话的localstore里面的maxMsgId和minMsgId是否存在
	// 	if(不存在){
	// 		初始化maxMsgId=0和minMsgId=999999999
	// 	}
	// }else{
	// 	创建一个，并hide、show

	// 	//执行本地SQL，获取对话得数据并渲染到会话窗体中
	// }

	if($(".diaItem-" + toId).length === 0){//聊天不存在
		var chat = ".diaItem-" + toId;

		$('.main > ul').hide();
		$(".dialogList").show();
		/*显示右侧*/
		$("#mainContent > div").hide();
		$(".dialogContent" + toId).show();


		saveOrSetToLocal("maxMsgId","0",chat);
		saveOrSetToLocal("minMsgId","999999",chat);

	}else{//聊天已存在
		/*显示左侧*/
		$('.main > ul').hide();
		$(".dialogList").show();
		/*显示右侧*/
		$("#mainContent > div").hide();
		$(".dialogContent" + toId).show();
		if(!(getLocal("minMsgId",chat) && getLocal("maxMsgId",chat))){
			saveOrSetToLocal("maxMsgId","0",chat);
			saveOrSetToLocal("minMsgId","999999",chat);
		}


		return;
	}
	/*localStorage添加值*/
	function saveOrSetToLocal (key,value,item){
		var s_localJson = localStorage.item || "{}";
		var j_localJson = JSON.parse(s_localJson);
		j_localJson.key = value;
		s_localJson = JSON.stringify(j_localJson);
		localStorage.item = s_localJson;
	}

	function getLocal(key,item){
		var s_localJson = localStorage.item || "{}";
		var j_localJson = JSON.parse(s_localJson);
		if(j_localJson.key){

			return j_localJson.key;
		}else{
			return false;
		}
	}

	var currentChat = {};
	currentChat.toId = toId;
	currentChat.toName = toName;

	/*加载聊天框架右侧*/
	var $template = $(".dialogContent").clone();
	$template.addClass("dialogContent" + toId);
	$("#mainContent").prepend($template);
	// console.log($template);
	/*修改数据*/
	$('.dialogName').text(toName);
	/*隐藏右侧其他显示会话*/
	$("#mainContent > div").hide();
	$(".dialogContent" + toId).show();

	/*加载聊天框架左侧*/
	var chatHead = [];
	chatHead.push('<li class="diaItem diaItem-'+ toId +' active">');
		chatHead.push('<div class="avatar">');
			chatHead.push('<img src="dist/imgs/index/avatar.png" alt="">');
		chatHead.push('</div>');
		chatHead.push('<div class="diaContent">');
			chatHead.push('<div class="diaTop clearfix">');
				chatHead.push('<span class="diaName">'+toName+'</span>');
				chatHead.push('<span class="diaTime">'+date.toTimeString().substr(0,5)+'</span>');
			chatHead.push('</div>');
			chatHead.push('<div class="diaDown clearfix">');
				chatHead.push('<p class=\'fl\' ">这里是上一条消息记录</p>');
				chatHead.push('<span class=\'indicator fr\'>99</span>');
			chatHead.push('</div>');
		chatHead.push('</div>');
	chatHead.push('</li>');


	$(".diaItem").removeClass('active');
	$('.dialogList').append(chatHead.join(''));

	/*隐藏左侧其他显示的当前的会话*/
	$('.main > ul').hide();
	$(".dialogList").show();
	// renderchat();
}






function renderchat(data,type,parent){//添加 发送或者接收信息
	if(type == 'send'){
		sendMsg(data);
	}else{
		receivedMsg(data);
	}

	function sendMsg(data){/*渲染发送消息*/

		var sendMsg = '';
		sendMsg += '<div class="sendMsg clearfix">'
					+ '<div class="avatar">'
						+ '<img src="dist/imgs/index/avatar.png">'
					+ '</div>'
					+ '<span class=\'caret-right\'></span>'
					+ '<div class="sendMsgCont">'
						+ data
					+ '</div>'
				+ '</div>';
		localStorage.msgTime = new Date(data.time).getTime();
		addTime(data);
		$(".dialogContent").find(".dgbody").append(sendMsg);
	}

	function addTime(data){//添加 时间
		/*
		*  完整时间串 2017-01-05 13:48:05
		*/
		var dateStr;
		var timeStamp = data.time;
		var curTime = new Date().getTime();
		var interval = localStorage.msgTime - curTime;//和上一条消息的间隔时间
		if($(".dgbody").html() == '' || interval >= 300000 ){//若消息原来内容为空或者时间间隔超过5分钟，添加时间戳
			if(interval > 86400000 ){//超过一天
				timeStamp = timeStamp.substr(-14);
				return ;
			}else if(interval > 31536000000){//超过一年
				return ;
			}
			timeStamp = timeStamp.substr(-8);
		}
		dateStr += '<div class="timestamp">'
				  		+ '<p>'+timeStamp+'</p>'
				   + '</div>';

		$(".dialogContent").find(".dgbody").append(dateStr);
	}


	function receivedMsg(data){
		var receivedMsg = '';
		receivedMsg += '<div class="receivedMsg clearfix">'
							 + '<div class="avatar">'
							 + '<img src="dist/imgs/index/avatar_demo.png">'
							 + '</div>'
							 + '<span class=\'caret-left\'></span>'
							 + '<div class="receivedMsgCont">'
							 + data.c
							 + '</div>'
						 + '</div>';
		addTime(data);
		$(".dialogContent").find(".dgbody").append(receivedMsg);

	}

	// function specialMsg (data){
	// 	if(data.c){}
	// }




}
