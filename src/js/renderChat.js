var gui = require('nw.gui');
var fs = require('fs');
/*渲染消息内容
 *
 * 传来的data是一个数组
 * 数组里有与当前会话人的消息
 *
 */
// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符，
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
// 例子：
// (new Date()).format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423
// (new Date()).format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18
Date.prototype.format = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1,                 //月份
        "d+": this.getDate(),                    //日
        "h+": this.getHours(),                   //小时
        "m+": this.getMinutes(),                 //分
        "s+": this.getSeconds(),                 //秒
        "S+": this.getTime().toString().substr(-3),
    };
    if (/(y+)/.test(fmt))
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt))
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
};

if (!Array.prototype.forEach) {
    Array.prototype.forEach = function (fun /*, thisp*/) {
        var len = this.length;
        if (typeof fun != "function")
            throw new TypeError();

        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in this)
                fun.call(thisp, this[i], i, this);
        }
    };
}

/*
 *	开始渲染
 *	data : 一条消息体
 *	renderType ： 1-正常渲染  2-渲染点击加载更多后的历史消息  需要倒序插入
 */
function renderchat(data, renderType) {//添加 发送或者接收信息
    if (localStorage.userId == data.fromId) {//发送消息
        sendMsgfun(data, renderType);
    } else {//接收消息
        receivedMsgfun(data, renderType);
    }
    //含有远程消息 且 第一次添加
    if (getLocal("hasMoreMsgFromRemote", "chat-" + data.sessionId) && $(".dialogContent" + data.sessionId).find(".getMoreLog").length === 0) {
        var gm = $(".dialogContent" + data.sessionId).find(".dgbody div:first-child").find("span").text();
        if (gm.substr(-6) == "创建了群组!") {
            return;
        }
        $(".dialogContent" + data.sessionId).find(".dgbody").prepend('<div  style="text-align:center;padding:6px;color:#1CA5FF;cursor: pointer;"><span class="getMoreLog">加载更多</span></div>');
    }
}
/*
 *	渲染发送消息
 *	renderType  1-正常渲染  2-渲染历史记录
 */
function  sendMsgfun(data, renderType) {
    var sendMsg = '';
    var isSysInfo = sysInfo(data);
    if (isSysInfo) {//系统消息 不渲染
        return;
    }
    var msgModule = shallowCopy(data);
    msgModule.content = imgDecode(msgModule.content);
    msgModule.content = emojiDecode(msgModule.content);
    var file_temp = fileDecode(msgModule.content);
    msgModule.content = file_temp.str;
    var fileDone = file_temp.done;//已经解析为dom
    msgModule.content = voiceDecode(msgModule.content, "send");
    msgModule.content = posDecode(msgModule.content);
    var sessionId = msgModule.sessionId;
    var myAvatar = localStorage.getItem("avatarSrc");
    var avatarUrl = myAvatar ? myAvatar : "dist/imgs/index/app/person.png";
    sendMsg += '<div id="msgId' + msgModule.guid + '" msgId="'+ msgModule.id +'" guid="' + msgModule.guid + '" class="sendMsg clearfix">' +
        '<div class="avatar">' +
        '<img onerror="this.src=\'dist/imgs/index/app/person.png\'" draggable="false" src="' + avatarUrl + '">' +
        '</div>' +
        '<span class=\'caret-right\'></span>' +
        '<div class="sendMsgCont">' +
        msgModule.content +
        '</div>' +
        '</div>';
    if (renderType == 1) {//正常渲染
        addTime(msgModule, renderType);
        $(".dialogContent" + sessionId).find(".dgbody").append(sendMsg).scrollTop(9999999);

        var copyLoading = $("#loadingCircle").clone().addClass("loading" + msgModule.guid);
        $("#msgId" + msgModule.guid).append(copyLoading);
        $(".loading" + msgModule.guid).show();
    } else {//渲染历史记录
        $(".dialogContent" + sessionId).find(".dgbody").prepend(sendMsg);
        addTime(msgModule, renderType);
    }

    if (renderType == 1) {

    }
    if (msgModule.sendFlag == 0) {//发送中

    } else if (msgModule.sendFlag == 1) {//发送成功
        $(".loading" + msgModule.guid).remove();
    } else if (msgModule.sendFlag == 2) {//发送失败
        $("#msgId" + msgModel.guid).append("<img class='sendAgin' title='点击重新发送' src='./dist/imgs/index/sendFail.png'>");
    }
    if (fileDone) {//判断是文件
        $("#msgId" + msgModule.guid).addClass("fileMsg");
        getFilePath(msgModule.guid, function (path) {
            if (path !== null) {
                //if (!isNaN(msgModule.guid)) {
                    $("#msgId" + msgModule.guid).find(".downloadBtn").hide();
                    $("#msgId" + msgModule.guid).find(".openFile").show();
                //}
            }
        });
    }
}

function addTime(data, renderType) {//添加 时间
    /*
     *  完整时间串 2017-01-05 13:48:05
     */
    var dateStr = '';
    var timeStamp = data.time;
    var sessionId = data.sessionId;
    var lastTime = new Date(timeStamp).getTime();
    var curTime = new Date().getTime();
    var interval = curTime - lastTime;//和上一条消息的间隔时间


    if ($(".dialogContent" + sessionId).find(".dgbody").html() == '' || (interval - 300000) >= 0) {//若消息原来内容为空或者时间间隔超过5分钟，添加时间戳
        if ((interval - 86400000) > 0 && (interval - 86400000) < 31536000000) {//超过一天 小于一年 显示到月日时分秒
            timeStamp = timeStamp.substr(-14);
        } else if (interval > 31536000000) {//超过一年 全部显示

        } else {
            timeStamp = timeStamp.substr(-8);//小于一天 显示时分秒
        }
        dateStr += '<div id="time' + lastTime + '" class="timestamp">'
            + '<p>' + timeStamp + '</p>'
            + '</div>';

    }
    if (renderType == 1) {//正常渲染
        $(".dialogContent" + sessionId).find(".dgbody").append(dateStr);
    } else {
        $(".dialogContent" + sessionId).find(".getMoreLog").parent().remove();
        $(".dialogContent" + sessionId).find(".dgbody").prepend(dateStr);
        var timeHeight = $("#time" + lastTime).outerHeight();
        var dgbody = $(".dialogContent" + sessionId).find(".dgbody").scrollTop();
        $(".dialogContent" + sessionId).find(".dgbody").scrollTop(timeHeight + dgbody);
    }
}


function receivedMsgfun(data, renderType) {
    var isSysInfo = sysInfo(data);
    if (isSysInfo) {//系统消息 不渲染
        delSingleLog(data.guid,function(){
             var arr_temp = data.content.split("^");
            $("#msgId" + arr_temp[1]).remove();
        });
        return;
    }
    var receivedMsg = '';
    var sessionId = data.sessionId;
    data.content = imgDecode(data.content);
    data.content = emojiDecode(data.content);
    var file_temp = fileDecode(data.content);
    data.content = file_temp.str;
    var fileDone = file_temp.done;

    data.content = posDecode(data.content);
    data.content = voiceDecode(data.content, "rec");
    var avatarUrl = data.ico ? URL + "/attachmentController/downFile.action?id=" + data.ico : "dist/imgs/index/app/person.png";
    receivedMsg += '<div id="msgId' + data.id + '" class="receivedMsg clearfix">'
        + '<div class="avatar">'
        + '<img onerror="this.src=\'dist/imgs/index/app/person.png\'" draggable="false" src="' + avatarUrl + '">'
        + '</div>';
    if (data.type == 2) {
        receivedMsg += '<span style="position:absolute;top:0px;left:70px;">' + data.fromName + '</span>';
    }
    receivedMsg += '<span class=\'caret-left\'></span>'
        + '<div class="receivedMsgCont">'
        + data.content
        + '</div>'
        + '</div>';
    if (renderType == 1) {//正常渲染
        addTime(data, renderType);
        $(".dialogContent" + sessionId).find(".dgbody").append(receivedMsg).scrollTop(999999999999);
    } else {
        $(".dialogContent" + sessionId).find(".dgbody").prepend(receivedMsg);
        var msgHeight = $("#msgId" + data.id).outerHeight();
        var dgbody = $(".dialogContent" + sessionId).find(".dgbody").scrollTop();
        $(".dialogContent" + sessionId).find(".dgbody").scrollTop(msgHeight + dgbody);
        addTime(data, renderType);
    }
    if (fileDone) {//通过返回的值知道是否已经下载，已经下载则显示打开文件否则显示接收和发送
        getFilePath(data.id, function (path) {
            if (path !== null) {
                $("#msgId" + data.id).find(".downloadBtn").hide();
                $("#msgId" + data.id).find(".openFile").show();
            }
        });
    }
}
/*切换*/
function showChat(chatId) {
    //显示隐藏右侧
    $("#mainContent > div").hide();
    $(".dialogContent" + chatId).show();
    /*隐藏左侧其他显示当前的会话*/
    $('.main > ul').hide();
    $(".dialogList").show();
    $(".diaItem").removeClass('active');
    $(".diaItem-" + chatId).addClass("active");
}

/*加载含数据框架*/
function renderIframe(data, chatType) {
    if ($(".dialogContent" + data.sessionId).length === 0) {
        var moudleNum = $(".dialogContent").length;
        var $template = $($(".dialogContent")[moudleNum - 1]).clone();
        $template.addClass("dialogContent" + data.sessionId).attr("id", data.sessionId);
        $template.attr("chatType", chatType);
        if (chatType == "single") {
            $template.find(".groupSet").hide();
            $template.find(".dgTitle").append('<input class="singleClearHistory" value="清除聊天记录" type="button" />');
            //添加单聊头像标记
            $.ajax({
                type: "post",
                url: URL + "/personManager/getPsersonInfoByUserId.action",
                data: {userId: data.sessionId},
                dataType: "json",
                success: function (data) {
                    if (data.rtData.avatar) {
                        $template.find(".dgTitle").attr("avatarId", data.rtData.avatar);
                        $template.find(".receivedMsg .avatar img,.dgTitle .avatar img").attr("src", URL + "/attachmentController/downFile.action?id=" + data.rtData.avatar);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {

                }
            });
        } else {
            /*添加群组头像标记*/
        }
        $("#mainContent").prepend($template);
        /*修改发送或接收人*/
        if (data.sessionId == data.toId) {
            $(".dialogContent" + data.sessionId).find('.dialogName').text(data.toName);
        } else {
            $(".dialogContent" + data.sessionId).find('.dialogName').text(data.fromName);
        }
        showChat(data.sessionId);
    } else {//该对话已经存在
        showChat(data.sessionId);
    }
}

/*加载空框架*/
function renderEmptyIframe(data, chatType) {
    if ($(".dialogContent" + data.sessionId).length === 0) {
        var moudleNum = $(".dialogContent").length;
        var $template = $($(".dialogContent")[moudleNum - 1]).clone();
        $template.addClass("dialogContent" + data.sessionId)
            .attr({
                "id": data.sessionId,
                "chatType": chatType
            });
        if (chatType == "single") {
            //隐藏群设置按钮
            $template.find(".groupSet").hide();
            //添加单聊头像标记
            $.ajax({
                type: "post",
                url: URL + "/personManager/getPsersonInfoByUserId.action",
                data: {userId: data.sessionId},
                dataType: "json",
                success: function (data) {
                    if (data.rtData.avatar) {
                        $template.find(".dgTitle").attr("avatarId", data.rtData.avatar);
                        $template.find(".receivedMsg .avatar img,.dgTitle .avatar img").attr("src", URL + "/attachmentController/downFile.action?id=" + data.rtData.avatar);
                    }
                },
                error: function (XMLHttpRequest, textStatus, errorThrown) {

                }
            });
        } else {
            /*添加群组聊天头像标记*/
        }
        $("#mainContent").prepend($template);
        /*修改发送或接收人*/
        $(".dialogContent" + data.sessionId).find('.dialogName').text(data.session_name);
        showChat(data.sessionId);

    } else {//该对话已经存在
        showChat(data.sessionId);
    }
}

/*
 *	判断是否还有更多消息
 *	类型 ： 布尔值
 */
function hasMoreMsgFromRemote(sessionId) {
    IM_ajax("/plugins/zatp?cmd=singlehistory", {
        msgId: 999999,
        rows: 20,
        from: localStorage.userId,
        to: sessionId
    }, function (data) {
        if (data.total) {
            return true;
        } else {
            return false;
        }
    })
}


function maxMsgId(sessionId) {
    var curChat = localStorage.getItem("chat-" + sessionId);
    // curChat = JSON.parse(curChat);
    if (curChat != null) {//含有该聊天
        curChat = JSON.parse(curChat);
        return curChat.maxMsgId;
    } else {//不含有该聊天则初始化
        var chatInfo = {
            hasMoreMsgFromRemote: true,
            maxMsgId: 0,
            minMsgId: 999999,
            historyMsgId: 999999
        };
        chatInfo = JSON.stringify(chatInfo);
        localStorage.setItem("chat-" + sessionId, chatInfo);
        return 0;
    }
}
/*
 *	最小id  无则初始化为999999

 */
function minMsgId(sessionId) {
    var curChat = localStorage.getItem("chat-" + sessionId);
    // curChat = JSON.parse(curChat);
    if (curChat != null) {//含有该聊天
        curChat = JSON.parse(curChat);
        return curChat.minMsgId;
    } else {//不含有该聊天则初始化
        var chatInfo = {
            hasMoreMsgFromRemote: true,
            maxMsgId: 0,
            minMsgId: 999999,
            historyMsgId: 999999
        };
        chatInfo = JSON.stringify(chatInfo);
        localStorage.setItem("chat-" + sessionId, chatInfo);
        return 999999;
    }
}



/*
 *	聊天的初始化
 *	请求初始的数据
 *	写入数据库
 *	渲染单条消息
 *	chatType : 单聊或群聊
 */
function chatInit(sessionId, session_name, chatType, isNoPop) {
    if ($(".dialogContent" + sessionId).length !== 0) {//聊天已经存在
        if (isNoPop == "pop") {//如果是新消息 不切换页面
            return;
        }else{
            showChat(sessionId);
            return;
        }
    }
    /*判断是否是新的*/
    var hasMoreMsgFromRemote = getLocal("hasMoreMsgFromRemote", "chat-" + sessionId) ? getLocal("hasMoreMsgFromRemote", "chat-" + sessionId) : "true";
    /*判断是否是max和min   这里由于hasmore已经判断过 其实合理不用判断为了书写方便 判断下*/
    var maxMsgId_number = maxMsgId(sessionId);

    //if (hasMoreMsgFromRemote == "true") {//如果有更多消息的话
    // 判断maxMsgId是否等于0，等于0说明数据库关于这个会话是空的 现在的指定会话是新的  请求是为了要看看是否是新设备登录  以防这个设备没有数据 云端有数据
    if (maxMsgId_number === 0) { //
        /*获取数据库的最大值然后http请求*/
        //因为是新的 所有数据库没有数据  直接请求最大值99999
        if (chatType == "single") {//单聊
            getSessionMaxId(sessionId, function (maxid) {//从数据库传来maxid
                IM_ajax("/plugins/zatp?cmd=singlehistory", {
                    msgId: 9999999,
                    rows: 15,
                    from: localStorage.userId,
                    to: sessionId
                }, function (data) {
                    if (data.rows.length !== 0) {
                        var sessionId_remote = "";
                        var json = data.rows;
                        for (var i = 0; i < json.length; i++) {
                            if (json[i].fromId == localStorage.userId) {
                                sessionId_remote = json[i].toId;
                            } else {
                                sessionId_remote = json[i].fromId;
                            }
                            /*存入数据库的数据*/
                            var msgModel = {
                                id: json[i].id,
                                toId: json[i].toId,
                                toName: json[i].toName,
                                fromId: json[i].fromId,
                                fromName: json[i].fromName,
                                type: 1,
                                content: json[i].content,
                                time: json[i].time,
                                flag: 0,
                                sendFlag: MES_SENT,
                                sessionId: sessionId_remote,
                                userId: localStorage.userId
                            };
                            addChatLog(msgModel, refreshSessionList);//向数据库插入数据
                        }
                        /*更新maxNsgId和minMsgId*/
                        saveOrSetToLocal("maxMsgId", data.rows[0].id, "chat-" + sessionId);

                        getSessionMinId(sessionId, function (minid) {
                            saveOrSetToLocal("minMsgId", minid, "chat-" + sessionId);
                        });
                        saveOrSetToLocal("historyMsgId", data.rows[data.rows.length - 1].id, "chat-" + sessionId);

                        /*取出数据并逐条加载消息  参数为fromId、toId和maxId   maxId选取的是刚刚从云端获取的数据的maxMsgId*/
                        var maxid = getLocal("maxMsgId", "chat-" + sessionId);
                        getSingleChatLog(sessionId, maxid, function (rows) {
                            rows.forEach(function (row) {
                                renderChatLog(row, chatType);
                            });
                        });
                    } else {
                        data.sessionId = sessionId;
                        data.session_name = session_name;
                        renderChatLog(data, chatType);
                    }
                }, function (err) {
                    console.log(err);
                });
            });
        } else {//群聊
            getSessionMaxId(sessionId, function (maxid) {//从数据库传来maxid
                IM_ajax("/plugins/zatp?cmd=grouphistory", {
                    msgId: 999999999,
                    rows: 15,
                    gid: sessionId,
                    userId: localStorage.userId
                }, function (data) {//把云端获取的数据加入数据库中
                    if (data.rows.length !== 0) {
                        var json = data.rows;
                        for (var i = 0; i < json.length; i++) {
                            /*存入数据库的数据*/
                            var msgModel = {
                                id: json[i].id,
                                toId: sessionId,
                                toName: json[i].toName,
                                fromId: json[i].fromId,
                                fromName: json[i].fromName,
                                type: 2,
                                content: json[i].content,
                                time: json[i].time,
                                flag: 0,
                                sendFlag: MES_SENT,
                                sessionId: sessionId,
                                userId: localStorage.userId
                            };
                            addChatLog(msgModel, refreshSessionList);//向数据库插入数据
                        }
                        /*更新maxNsgId和minMsgId*/
                        saveOrSetToLocal("maxMsgId", data.rows[0].id, "chat-" + sessionId);
                        getSessionMinId(sessionId, function (minid) {
                            saveOrSetToLocal("minMsgId", minid, "chat-" + sessionId);
                        });
                        saveOrSetToLocal("historyMsgId", data.rows[data.rows.length - 1].id, "chat-" + sessionId);

                        /*取出数据并逐条加载消息  参数为fromId、toId和maxId   maxId选取的是刚刚从云端获取的数据的maxMsgId*/
                        var maxid = getLocal("maxMsgId", "chat-" + sessionId);
                        getSingleChatLog(sessionId, maxid, function (rows) {
                            rows.forEach(function (row) {
                                renderChatLog(row, chatType);
                            });
                        });
                    } else {
                        data.sessionId = sessionId;
                        data.session_name = session_name;
                        renderChatLog(data, chatType);
                    }
                }, function (err) {
                    console.log(err);
                });
            });
        }
    } else {//数据库有对应聊天的数据  直接送数据库获取消息
        /*直接切换*/
        getSessionMaxId(sessionId, function (maxid) {
            maxMsgId_number = maxid;
            getSingleChatLog(sessionId, maxMsgId_number, function (rows) {
                if (rows.length == 0) {
                    rows.sessionId = sessionId;
                    rows.session_name = session_name;
                    rows.total = 0;
                    renderChatLog(rows, chatType);
                    return;
                } else {
                    rows.forEach(function (row) {
                        renderChatLog(row, chatType);
                        $("#msgId" + row.guid).find(".sk-fading-circle").remove();
                    });
                    saveOrSetToLocal("historyMsgId", rows[0].id, "chat-" + sessionId);
                }
                showChat(sessionId);
            });
        });
    }

}
/*
 *	渲染界面入口
 */
function renderChatLog(rowData, chatType) {
    if (rowData.hasOwnProperty("total")) {//如果云端没有数据,只渲染框架
        renderEmptyIframe(rowData, chatType);//渲染框架,根据 chatType 选择加载群设置
    } else {
        renderIframe(rowData, chatType);
        renderchat(rowData, 1);//渲染内部发送的消息 正常append消息
        $(".dialogContent" + rowData.sessionId).find('.dgbody').scrollTop(9999999);//滚动到最下面
    }
}
/*
 *	发送消息
 *  先显示消息 添加发送中的图标 向数据库添加id为空 sendFlag为MES_SENDING的数据 发送成功之后
 */
$("body").on("click", ".dialogContent .dgfooter .dgBtn", function () {
    var $this = $(this);
    var sessionId = $(this).closest('.dialogContent').attr("id");//获取聊天对象
    var session_name = $(this).closest('.dialogContent').find(".dialogName").text();
    var msg_send = $(this).closest('.dialogContent').find(".textInput")[0].innerHTML;
    if (msg_send == "") {
        return false;
    }
    var mesGuid = guid();
    $(this).closest('.dialogContent').find(".textInput")[0].innerHTML = "";
    var msg_send_ajax = HTMLDecode(emojiEncode(msg_send));
    var chatType = $(this).closest('.dialogContent').attr("chatType");
    //会话对方的头像id
    var avatarId = $(this).closest(".dialogContent").find(".dgTitle").attr("avatarId");

    var timeStamp_send = new Date().format("yyyy-MM-dd hh:mm:ss");
    var msgModel = {
        toId: sessionId,
        toName: session_name,
        fromId: localStorage.userId,
        fromName: localStorage.userName,
        content: msg_send,
        time: timeStamp_send,
        flag: 1,
        sessionId: sessionId,
        userId: localStorage.userId,
        sendFlag: MES_SENDING,
        guid: mesGuid,
        timestamp: new Date().getTime()
    };
    msgModel.content = emojiEncode(msgModel.content);
    msgModel.content = HTMLDecode(msgModel.content);
    msgModel.content = msgModel.content.replace(/\n/mg, "<br>");
    msgModel.type = chatType == "single" ? 1 : 2;
    sendMsgfun(msgModel, 1);
    addChatLog(msgModel, function () {
        var url = chatType == "single" ? "/plugins/zatp?cmd=sendsinglemsg" : "/plugins/zatp?cmd=sendgroupmsg";
        var param = chatType == "single" ? {
                "content": msg_send_ajax,
                "from": localStorage.userId,
                "to": sessionId,
                guid:mesGuid
        } : {
            "content": msg_send_ajax,
            "from": localStorage.userId,
            "gid": sessionId,
            guid:mesGuid
        };
        IM_ajax(url, param,
            function (data) {//发送成功
                if (data.status) {
                    msgModel.id = data.info;
                    msgModel.ico = data.ico;
                    msgModel.sendFlag = MES_SENT;
                    updateChatLog(msgModel, function () {
                        $("#msgId" + msgModel.guid).attr("msgId",msgModel.id).find(".sk-fading-circle").remove();

                        refreshSessionList();
                    });
                }
            }, function (XMLHttpRequest, status, err) {//发送失败
                if (status == "error") {
                    console.log("发送信息失败！");
                    console.log(err);
                    $("#msgId" + msgModel.guid).find(".sk-fading-circle").remove();
                    $("#msgId" + msgModel.guid).append("<img class='sendAgin' title='点击重新发送' src='./dist/imgs/index/sendFail.png'>");
                    $("#msgId" + msgModel.guid).attr("msgId","undefined");
                }
            });
    });

});

$("body").on("click", ".sendAgin", function () {
    var thisId = $(this).closest(".sendMsg").attr("guid");
    if ($("#msgId" + thisId).hasClass("fileMsg")) {//文件消息
        $(this).closest(".dialogContent").find(".fileForm input[type='file']").trigger("change");
    } else {
        var oldInputText = $(".textInput")[0].innerHTML;
        $(".textInput")[0].innerHTML = $(this).siblings(".sendMsgCont")[0].innerHTML;
        $(this).closest(".dialogContent").find(".dgBtn").trigger("click");
        $(".textInput")[0].innerHTML = oldInputText;
        $(this).closest(".sendMsg").remove();
    }
});

$("body").on("keydown", ".textInput", function (e) {
    if (e.keyCode == 13) {
        if ($(this)[0].innerHTML == '') {
            console.log("发送的消息不能为空！");
            $(this).closest('.dialogContent').find(".textInput")[0].innerHTML = "";
            e.preventDefault();
            return;
        }
        if (e.shiftKey) {//按shift键
            return;
        } else {
            e.preventDefault();
            e.cancelBubble = true;
            e.stopPropagation();
            var dialogId = $(this).closest('.dialogContent').attr("id");
            $(".dialogContent" + dialogId + " .dgfooter .dgBtn").click();
        }
        e.preventDefault();
    }
});

/*
 *	接收消息
 *	这里接收消息是监听的stroph.js  然后进行的处理
 *	json
 */
function recMsg(json) {
    var msgModel;
    json.c = emojiEncode(json.c);
    var textBeforeRevoke = json.c;
    var revokeFlag = false;
    // if(json.c.indexOf("[REVOKE^") == 0){//过滤撤回--存数据用
    //     var arr_temp = json.c.split("^");
    //     revokeFlag = !revokeFlag;
    //     json.c = arr_temp[2].substring(0,arr_temp[2].length - 1);
    // }
    json.c = json.c.replace(/\n/mg, "<br>");
    if (json.t == 1) {
        msgModel = {
            id: json.msgId,
            toId: localStorage.userId,
            toName: localStorage.userName,
            fromId: json.id,
            ico: json.ico,
            fromName: json.name,
            type: json.t,
            content: json.c,
            time: json.time,
            flag: 0,
            sendFlag: -1,
            sessionId: json.id,
            userId: localStorage.userId
        };
    } else {
        msgModel = {
            id: json.msgId,
            toId: json.gid,
            toName: json.gname,
            fromId: json.id,
            fromName: json.name,
            type: json.t,
            ico: json.ico,
            content: json.c,
            time: json.time,
            flag: 0,
            sendFlag: -1,
            sessionId: json.gid,
            userId: localStorage.userId
        };
    }
    if (msgModel.type == 2 && (msgModel.fromId == localStorage.userId )) {

    } else {
        msgModel.newMes = true;//是接收的数据 数据库加1
        addChatLog(msgModel, function (guid) {
            refreshSessionList();
            // if(revokeFlag){
                // msgModel.content = textBeforeRevoke;
            // }
            msgModel.guid = guid;
            receivedMsgfun(msgModel, 1);
        });
    }
}
/*
 *	切换对话窗口
 */
$("body").on("click", ".chats li.diaItem", function () {
    var liDataItem = $(this);
    var sessionId = $(this).attr("id");
    var session_name = $(this).find(".diaName").text();
    var chatType = $(this).attr("chatType");
    //切换的时候直接 给点击的元素添加选中背景
    $(".diaItem").removeClass("active");
    $(this).addClass("active");
    //如果是群组检测群组是否存在
    if (chatType == "group") {
        isExistGroup(sessionId);
    }
    resetUnread(sessionId, function () {
        chatInit(sessionId, session_name, chatType);
        liDataItem.find(".indicator").remove();
    });
});

/**
 * 会话列表 右键 置顶和删除
 */
$("body").on("contextmenu", ".chats li.diaItem", function (e) {
    var posLeft = e.pageX;
    var posTop = e.pageY;
    var isTop = $(this).attr("topItem");
    var id = $(this).attr("id");
    $(".chatsOption").show().css({
        top: posTop,
        left: posLeft
    }).attr("diaItemId", id);
    //判断是否已经置顶  1代表已经置顶 0代表未置顶
    if (isTop == "1") {
        $(".chatsOption").find(".cancelTop").show();
        $(".chatsOption").find(".setTop").hide();
    } else {
        $(".chatsOption").find(".setTop").show();
        $(".chatsOption").find(".cancelTop").hide();
    }
    return false;
});
//点击页面 右键栏消失
$("body").click(function () {
    $("ul.chatsOption").hide();
});
//会话栏  右键操作
$("body").on("click", ".chatOperation", function () {
    var id = $(".chatsOption").attr("diaItemId");
    if ($(this).hasClass("setTop")) {//置顶
        setTopSession(id, 1, refreshSessionList);
    } else if ($(this).hasClass("cancelTop")) {//取消置顶
        setTopSession(id, 0, refreshSessionList);
    } else if ($(this).hasClass("delSession")) {//删除会话
        delSession(id, refreshSessionList);
    }
});

/*
 *	加载更多消息记录
 */

$("body").on("click", ".getMoreLog", function () {
    var id = $(this).closest('.dialogContent').attr("id");
    getMoreLog(id);
});

function getMoreLog(sessionId) {
    var hasMsg = getLocal("hasMoreMsgFromRemote", "chat-" + sessionId);
    var maxid = getLocal("maxMsgId", "chat-" + sessionId);
    var minMsgId = getLocal("minMsgId", "chat-" + sessionId);
    var historyMsgId = getLocal("historyMsgId", "chat-" + sessionId) - 1;
    var chatType = $(".dialogContent" + sessionId).attr("chattype");
    var session_name = $(".dialogContent" + sessionId).find(".dialogName").text();
    var cmd, para;
    if (chatType == "single") {
        cmd = "/plugins/zatp?cmd=singlehistory";
        para = {
            "msgId": minMsgId,
            "rows": 15,
            "from": localStorage.userId,
            "to": sessionId,
        };
    } else {
        cmd = "/plugins/zatp?cmd=grouphistory";
        para = {
            "msgId": minMsgId,
            "rows": 15,
            "gid ": sessionId,
            "userId ": localStorage.userId,
        };
    }
    if (historyMsgId <= minMsgId) {
        $(".getMoreLog").text("正在加载...");
        IM_ajax(cmd, para, function (data) {
            $(".getMoreLog").text("加载更多");
            if (data.rows.length !== 0) {//有历史数据
                data.rows.forEach(function (msgObj) {
                    msgObj.sessionId = sessionId;
                    //没有设置群聊
                    var msgModel;
                    if (chatType == "single") {
                        msgModel = {
                            id: msgObj.id,
                            toId: msgObj.toId,
                            toName: msgObj.toName,
                            fromId: msgObj.fromId,
                            fromName: msgObj.fromName,
                            type: 1,
                            content: msgObj.content,
                            time: msgObj.time,
                            flag: 1,
                            sendFlag: MES_UNSENT,
                            sessionId: sessionId,
                            userId: localStorage.userId,
                            guid:msgObj.guid ? msgObj.guid : guid()
                        };
                    } else {
                        msgModel = {
                            id: msgObj.id,
                            toId: sessionId,
                            toName: session_name,
                            fromId: msgObj.fromId,
                            fromName: msgObj.fromName,
                            type: 2,
                            content: msgObj.content,
                            time: msgObj.time,
                            flag: 1,
                            sendFlag: MES_UNSENT,
                            sessionId: sessionId,
                            userId: localStorage.userId,
                            guid:msgObj.guid ? msgObj.guid : guid()
                        };
                    }
                    renderchat(msgModel, 2);
                    addChatLog(msgModel, refreshSessionList);

                    saveOrSetToLocal("minMsgId", data.rows[data.rows.length - 1].id, "chat-" + sessionId);
                    saveOrSetToLocal("historyMsgId", data.rows[data.rows.length - 1].id, "chat-" + sessionId);

                });
            } else {
                saveOrSetToLocal("hasMoreMsgFromRemote", false, "chat-" + sessionId);
                $(".dialogContent" + sessionId).find(".getMoreLog").parent().remove();
                $(".dialogContent" + sessionId).find(".dgbody").prepend("<div  style=\"text-align:center;padding:6px 0;\"><span>无更多消息!</span></div>");
            }

        });
    } else {
        getSingleChatLog(sessionId, historyMsgId, function (rows) {
            var reverseRow = rows.reverse();
            var hisId = 365;
            for (var i = 0, l = reverseRow.length; i < l; i++) {
                renderchat(reverseRow[i], 2);
                hisId = reverseRow[i].id;
            }
            saveOrSetToLocal("historyMsgId", hisId, "chat-" + sessionId);
        });
    }
}


/**
 * 闪烁图标
 */
var tempSetTimeout;
function flashIcon(){
    if(tray1.icon == "transparent.png"){
        tempSetTimeout = setTimeout("tray1.icon = 'appIcon.png';flashIcon()",500);
    }else{
        tempSetTimeout = setTimeout("tray1.icon = 'transparent.png';flashIcon()",500);
    }
}
// NW.JS Notification

var newChat = {}, newTodo = {} ,notification;

/**
 * 接受消息 弹出消息提示
 * @param json
 */
function popChat(json) {
    var content = HTMLDecode(json.c);
    if(content.indexOf("[REVOKE^") == 0){//过滤撤回
        var arr_temp = content.split("^");
        content = arr_temp[2].substring(0,arr_temp[2].length - 1);
    }
    var time = json.time;
    var type = json.t;
    var fromId, fromName;
    if (type == 1) {
        fromId = json.id || '';
        fromName = json.name || '';
    } else if (type == 2) {
        fromId = json.gid || '';
        fromName = json.gname || '';
    }
    var detail = json.no || '';
    var NW = require('nw.gui');

    var showNotification = function (icon, title, body, fromId, fromName, type) {
        if (icon && icon.match(/^\./)) {
            icon = icon.replace('.', 'file://' + process.cwd());
        }
        notification = new Notification(title, {icon: icon, body: body});
        notification.onclick = function () {
            //应用获取焦点
            NW.Window.get().focus();
            //取消图标闪烁并恢复默认的图标
            clearTimeout(tempSetTimeout);
            tray1.icon = 'appIcon.png';

            if (fromId !== undefined) {//聊天
                showChat(fromId);
                $(".dialogContent" + fromId).find(".dgbody").scrollTop(999999999999);
                notification.close();
            } else {//待办消息
                $.ajax({
                    type: 'get',
                    url: localStorage.url + "/sms/getUnreadSmsGroup.action",
                    beforeSend: function (XMLHttpRequest) {
                    },
                    success: function (data, textStatus) {
                        var json = JSON.parse(data);
                        if ($(".smsBlock").length === 0) {
                            $(".smsBlock").remove();
                            renderSms(json);
                        } else {
                            $("#mainContent > div").hide();
                            $(".smsBlock").show();
                        }
                        console.log('获取菜单列表成功！');
                    },
                    complete: function (XMLHttpRequest, textStatus) {
                    },
                    error: function (data) {
                        console.log('获取数据失败！请检查网络后刷新');
                    }
                });
                notification.close();
            }
        };

        notification.onclose = function () {
            // NW.Window.get().focus();
        };

        notification.onshow = function () {

        };

        return notification;
    };


    if (type == 50) {//待办消息提醒
        if (newChat.todo !== undefined) {
            newChat.todo.close();
        }
        newChat.todo = showNotification("./dist/imgs/index/news.png", content, detail, undefined, undefined, "chat");
        $("#news_audio")[0].play();
    } else {//聊天消息
        if (newChat.singChat !== undefined) {
            newChat.singChat.close();
        }

        if (type == 1) {//单聊
            chatInit(fromId, fromName, "single", "pop");
        } else {//群聊
            chatInit(fromId, fromName, "group", "pop");
        }
        $(".dialogContent" + fromId).find(".dgbody").scrollTop(999999999999);
        if (content.indexOf("[IMG^") === 0) {
            content = "[图片]";
        }
        if (content.indexOf("[FILE^") === 0) {
            content = "[文件]";
        }
        if (content.indexOf("[VOICE^") === 0) {
            content = "[语音]";
        }
        if (content.indexOf("[EMO^") === 0) {
            content = "[表情]";
        }
        if (content.indexOf("[POS^") === 0) {
            content = "[位置]";
        }
        if (type == 2 && json.id == USERID || json.c.indexOf("[REVOKE^") === 0) {

        } else {
            flashIcon();
            newChat.singChat = showNotification("./dist/imgs/index/msg.png", content, "来自:" + fromName, fromId, fromName, "news");
            $("#chat_audio")[0].play();
        }
        json.c = emojiDecode(HTMLDecode(json.c));
        json.c = json.c.replace(/\n/mg, "<br>");
        recMsg(json);
    }
}
/*发送表情*/
$("body").on("click", ".emoji", function (e) {
    $(this).qqFace({
        id: 'facebox',
        assign: 'textInput',
        path: './dist/imgs/index/emoji/'	//表情存放的路径
    });
    e.stopPropagation();
});
/*点击其他位置隐藏表情栏*/
$("body").click(function () {
    $(".facebox").hide();
});
/*	表情转义
 *	把表情转义为[EMO^000]
 */
function emojiEncode(msg) {
    // var reg = /<img(\s\S*)>/;
    while (msg.indexOf('<img draggable="false" style="" onclick=""') != -1) {
        var start = msg.indexOf("<img");
        var end = msg.indexOf(">");
        var img = msg.substring(start, end + 1);//获取到的img字符串
        var code = img.match(/EMO_(\S*)\.png/)[1];//获取表情名字
        msg = msg.replace(img, "[EMO^" + code + "]");//替换掉原来字符串中的img字符串
    }
    return msg;
}
/*
 *	表情反转义
 *	[EMO^000]转为表情
 */
function emojiDecode(msg) {
    while (msg.indexOf("[EMO^") != -1) {
        var start = msg.indexOf("[EMO^");
        var end = msg.indexOf("]");
        var code = msg.substring(start, end + 1);//获取到的img字符串
        var name = code.match(/\[EMO\^(\S*)]/)[1];//获取表情名字
        msg = msg.replace(code, '<img draggable="false" style=\"\" onclick=\"\" src="./dist/imgs/index/emoji/EMO_' + name + '.png"/>');//替换掉原来字符串中的img字符串
    }
    return msg;
}

/*
 *	HTML文本反转义
 *	&lt;&gt; 转换为 < >  等
 */
function HTMLDecode(text) {
    // if(text.indexOf("[REVOKE^") == 0){//过滤撤回消息
    //     var arr_temp = text.split("^");
    //     text = arr_temp[2].substring(0,arr_temp[2].length - 1);
    // }
    var output;
    var temp = $("<div/>");
    var temp_1 = temp.html(text);
    var temp_2 = temp_1.text();
    output = temp_2;
    temp = null;
    return output;
}
/*
 *	转义后的HTML文本
 *	< >  转义为 &lt;&gt；等
 */
function HTMLEncode(html) {
    var temp = document.createElement("div");
    (temp.textContent != null) ? (temp.textContent = html) : (temp.innerText = html);
    var output = temp.innerHTML;
    temp = null;
    return output;
}
/*
 *	图片存储代码转图片显示代码
 *	[IMG^[IMG^图片URL^缩略图URL^图片名称^文件大小]
 *	返回值  包含img信息的html
 */
function imgDecode(imgCode) {
    if (imgCode.indexOf("[IMG^") === 0) {
        var arr_temp = imgCode.split("^");
        var img = {
            url: arr_temp[1],
            thumbUrl: arr_temp[2],
            name: arr_temp[3],
            size: arr_temp[4].substring(0, arr_temp[4].length)
        };
        return '<img  draggable="false" onload="scrollToBottom($(this))" class="thumbImg" style="    vertical-align:middle;" HDUrl="' + img.url + '" title="双击查看原图" src="' + localStorage.imUrl + img.thumbUrl + '" alt="" />';
    } else {
        return imgCode;
    }
}
function scrollToBottom($this) {
    $this.closest('.dgbody').scrollTop(9999999999999999);
}

/*
 *	语音转换
 *	[VOICE^]转换为显示内容
 *	type 发送或接受消息
 */
function voiceDecode(voiceCode, type) {
    if (voiceCode.indexOf("[VOICE^") === 0) {
        var arr_temp = voiceCode.split("^");
        var voice = {
            url: arr_temp[1],
            name: arr_temp[2],
            size: arr_temp[3].substring(0, arr_temp[3].length - 1)
        };
        var result;
        if (type == "send") {
            result = '<div class="voice">' +
                '<img src="dist/imgs/index/voice_send.png" alt="">' +
                '<span class="voiceDuration">' + voice.size + '</span>' +
                '</div>' +
                '<audio hidden class="voicePlay" src="' + localStorage.imUrl + voice.url + '"></audio>';
        } else {
            result = '<div class="voice">' +
                '<span class="voiceDuration">' + voice.size + '</span>' +
                '<img src="dist/imgs/index/voice_rec.png" alt="">' +
                '</div>' +
                '<audio hidden class="voicePlay" src="' + localStorage.imUrl + voice.url + '"></audio>';
        }

        return result;
    } else {
        return voiceCode;
    }
}
$("body").on('click', ".voice", function () {
    $(this).next(".voicePlay")[0].play();
});
/*
 *	发送文件 代码转换为显示内容
 *	[FILE^文件URL^文件名称^文件大小]  =>  页面显示内容
 */
function fileDecode(fileCode) {
    var result;
    if (fileCode.indexOf("[FILE^") === 0) {
        var arr_temp = fileCode.split("^");
        var file = {
            url: arr_temp[1],
            name: arr_temp[2],
            size: arr_temp[3].substring(0, arr_temp[3].length - 1)
        };
        var fileType = ["apk","avi","bpm","gif","jpg","mp3","mp4","png","ppt","txt","doc","docx"];
        var name = /\.[^\.]+/.exec(file.name)[0].substr(1);
        for(var type in fileType){
            if(fileType[type] == name ){
                var filTypeStr = '<img  draggable="false" class="FileImgLogo" src="dist/imgs/index/fileType/icon_'+fileType[type]+'.png" alt="">';
                break;
            }else{
                var filTypeStr = '<img  draggable="false" class="FileImgLogo" src="dist/imgs/index/fileType/fileImg.png" alt="">';
            }

        }
        var fileStr = "<div class='fileInfo clearfix'>" +
            filTypeStr +
            '<div style="float:left;">' +
            "<div title=" + file.name + " class='fileName'>" + file.name + "</div>" +
            "<div class='fileSize'>" + file.size + "</div>" +
            "<div class='downloadFile' size='" + file.size + "' path='" + file.url + "' name='" + file.name + "'>";
        fileStr += "<span style='margin-right:5px;' class='receiveFile downloadBtn'>接收</span>" +
            "<span class='downloadBtn'>" +
            "<span  class='saveasFile '>另存为</span>" +
            "<input class='nwsaveas' hidden type='file' name='file' nwsaveas/>" +
            "</span>" +
            "<span style='cursor:pointer;display:none;' class='openFile'>打开文件</span>";
        fileStr += "</div>" +
            "</div>" +
            "</div>" +
            "<div hidden style='width:100%;height:3px;border:1px solid #aaa;border-radius:2px;text-align:left;' class='downloadProcess'><div style='display:block;background-color:#0f0;height:3px;' class='downloading'></div></div>";
        result = {
            str: fileStr,
            done: true
        };
    } else {
        result = {
            str: fileCode,
            done: false
        };
    }
    return result;
}
/*
 *	位置转换
 *	[POS^]转化为标签
 */
function posDecode(posCode) {
    if (posCode.indexOf("[POS^") === 0) {
        var arr_temp = posCode.split("^");
        var pos = {
            posInfo: arr_temp[1],
            position: arr_temp[2].substring(0, arr_temp[2].length - 1)
        };
        var posStr = '<div class="posHead">' +
            '<div class="posInfo">' + pos.posInfo + '</div>' +
            '</div>' +
            '<div class="posBody">' +
            '<img pos="' + pos.position + '" class="posImg" draggable="false" src="http://api.map.baidu.com/staticimage?width=300&height=300px&center=' + pos.position + '&markers=' + pos.position + '&zoom=15" alt="">' +
            '</div>';
        return posStr;
    } else {
        return posCode;
    }
}
//双击打开图片显示大图
$("body").on("dblclick", ".posImg", function () {
    var position = $(this).attr("pos");
    gui.Window.open("/openMap.html?position=" + position, {}, function (posWindow) {
        posWindow.maximize();
    });
});

/**
 * 拖动图片
 * @param e
 * @returns {boolean}
 */
window.ondragover = function (e) {
    e.preventDefault();
    return false;
};
window.ondrop = function (ev) {
    var ev = ev || window.event;
    ev.preventDefault();
    return false;
};
//  输入框拖动的时候发送文件 没有传输文件限制
$("body").on("drop", ".textInput", function (event) {
    var ev = ev || window.event;
    ev.preventDefault();
    ev.stopPropagation();

    var imgFile = ev.dataTransfer.files;
    var pid = $(this).closest(".dialogContent ").attr("id");
    for (var i = 0; i < imgFile.length; i++) {
        if (imgFile[i].type.indexOf("image") != -1) {
            var name = imgFile[i].name ? imgFile[i].name : "未命名文件";
            var imgRead = new FileReader();
            imgRead.readAsDataURL(imgFile[i]);
            imgRead.onload = function () {
                sumitImageFile(imgRead.result, pid, 'img', name);
            }
        } else {
            upload(pid, "dragFile", imgFile[i].name, imgFile[i], imgFile[i].path);
        }
    }
});
/*
 *	上传图片，文件，而后发送消息
 *	pid 上传文件所在的对话
 *	type 文件类型
 *	name上传文件的文件名
 *	fileData 上传的截图说的base64 或者 文件file
 *	fullName 上传的时候传来的文件全名（上传文件时）
 */
var uploadxhr;
function upload(pid, type, name, fileData, fullName) {
    var id, typeId, fileSize, form_data, tempGuid;
    switch (type) {
        case "img" :
            id = "dialogContent" + pid;
            typeId = "imgForm";
            break;
        case "file" :
            id = "dialogContent" + pid;
            typeId = "fileForm";
            break;
        case "audio" :
            id = "dialogContent" + pid;
            typeId = "audioForm";
            break;
        case "dragFile" :
            id = "dialogContent" + pid;
    }
    if (fileData) {
        if (type == "dragFile") {
            form_data = new FormData();
            form_data.append("file", fileData);
            fileSize = fileData.size;
            fileSize = fileSizeConvert(fileSize);
        } else {
            form_data = fileData;
            fileSize = form_data._size;
            fileSize = fileSizeConvert(fileSize);
        }
    } else {
        form_data = new FormData($('.' + id).find("." + typeId)[0]);
        fileSize = $('.' + id).find("." + typeId).find("input")[0].files[0].size;
        fileSize = fileSizeConvert(fileSize);
    }
    tempGuid = guid();
    var sendData = {
        id: name,
        sessionId: pid,
        guid: tempGuid,
        content: "<div class='uploadProcessBox' style='width:230px;height:20px;text-align:center;'><span class='uploadProcess' style='display:block;height:100%;width:1%;background-color:#1CA5FF;'></span><span class='processShow' style='display:block;margin-top:-20px;'></span>发送中...</div>"
    };
    sendMsgfun(sendData, 1);
    var timeStamp_send = new Date().format("yyyy-MM-dd hh:mm:ss");
    var $parentId = $(".dialogContent" + pid);
    var sessionId = pid;//获取聊天对象
    var session_name = $parentId.find(".dialogName").text();
    var msgModel = {
        toId: sessionId,
        toName: session_name,
        fromId: USERID,
        fromName: USERNAME,
        //content: msg_send,
        time: timeStamp_send,
        flag: 1,
        sendFlag: MES_SENDING,
        sessionId: sessionId,
        sessionName: session_name,
        userId: USERID,
        guid: tempGuid
    };
    addChatLog(msgModel, function () {
        uploadxhr = $.ajax({
            url: localStorage.imUrl + '/plugins/zatp?cmd=upload',
            type: 'POST',
            cache: false,
            dataType: "json",
            data: form_data,
            processData: false,
            contentType: false,
            xhr: function () {
                var xhr = $.ajaxSettings.xhr();
                if (onprogress && xhr.upload) {
                    xhr.upload.addEventListener("progress", function (e) {
                        onprogress(e, sendData.guid)
                    }, false);
                    return xhr;
                }
            }
        }).done(function (res) {
            /*显示消息*/
            var msg_send;
            var oName = res.oName || "";
            var url = res.url || "";
            var thumbUrl = res.thumbUrl || "";
            var length = Object.keys(res).length;//图片类型比其他类型多一个thumbUrl 属性  据此判断是哪种类型

            if (length == 3) {//语音或者文件
                if (type == "vocie") {//语音
                    msg_send = "[VOICE^" + url + "^" + oName + "^" + fileSize + "]";
                } else {//文件
                    msg_send = "[FILE^" + url + "^" + oName + "^" + fileSize + "]";
                }
            } else if (length == 4) {//图片
                msg_send = "[IMG^" + url + "^" + thumbUrl + "^" + oName + "^" + fileSize + "]";
            }

            var msg_send_ajax = msg_send;

            var chatType = $(".dialogContent" + pid).attr("chatType");
            var cmd, para;
            if (chatType == "single") {
                cmd = "/plugins/zatp?cmd=sendsinglemsg";
                para = {
                    "content": msg_send_ajax,
                    "from": localStorage.userId,
                    "to": sessionId
                };
                msgModel.type = 1;
            } else {
                cmd = "/plugins/zatp?cmd=sendgroupmsg";
                para = {
                    "content": msg_send_ajax,
                    "from": localStorage.userId,
                    "gid": sessionId
                };
                msgModel.type = 2;
            }
            //上传文件后发送消息 更新数据库数据
            IM_ajax(cmd, para,
                function (data) {
                    if (data.status) {
                        msgModel.id = data.info;
                        msgModel.sendFlag = MES_SENT;
                        msgModel.content = msg_send;
                        updateChatLog(msgModel, function () {
                            var sendData;
                            $("#msgId" + tempGuid).remove();
                            if (length == 3) {//语音或者文件
                                if (type == "vocie") {//语音
                                    // msg_send = "[VOICE^"+url+"^"+oName+"^"+fileSize+"]";
                                } else {//文件
                                    sendData = {
                                        id: data.info,
                                        sessionId: pid,
                                        content: msg_send,
                                        guid: tempGuid
                                    };
                                    setFileDownloaded(tempGuid, fullName, function () {
                                        setTimeout(send, 500);
                                        function send() {
                                            sendMsgfun(sendData, 1);
                                            $("#msgId" + tempGuid).find(".sk-fading-circle").remove();
                                        }
                                    });
                                }
                            } else if (length == 4) {//图片
                                var imgHtml = '<img  draggable="false" class="thumbImg" src="' + localStorage.imUrl + res.thumbUrl + '" alt="" />';
                                sendData = {
                                    id: data.info,
                                    sessionId: pid,
                                    content: imgHtml,
                                    guid: tempGuid
                                };
                                sendMsgfun(sendData, 1);
                                $("#msgId" + tempGuid).find(".sk-fading-circle").remove();
                                $("#msgId" + tempGuid).find(".thumbImg").attr("HDUrl", res.url);
                            }
                        });
                    }
                });
        }).fail(function (res, err, y) {//发送失败时
            console.log(res);
            console.log(err);
            console.log(y);
            console.log("文件或图片等消息发送失败!");
            var str = "<div style='text-align:center;margin-bottom:15px;'><span style='padding:2px 15px;border-radius:20px;background-color:rgba(0,0,0,0.2);color:#555;'>发送失败!</span></div>";
            $("#msgId" + tempGuid).remove();
            $(".dialogContent" + pid).find('.dgbody').append(str);
            // if (length == 3) {//语音或者文件
            //     if (type == "vocie") {//语音
            //         msg_send = "[VOICE^" + url + "^" + oName + "^" + fileSize + "]";
            //     } else {//文件
            //         msg_send = "[FILE^" + url + "^" + oName + "^" + fileSize + "]";
            //     }
            // } else if (length == 4) {//图片
            //     msg_send = "[IMG^" + url + "^" + thumbUrl + "^" + oName + "^" + fileSize + "]";
            // }

            //var tempContent = "[FILE^" + null + "^" + fullName + "^" + fileSize + "]";
            //var tempMsg = shallowCopy(msgModel);
            //tempMsg.content = tempContent;
            //tempMsg.guid = tempGuid;
            //sendMsgfun(tempMsg, 1);
            //$("#msgId" + tempGuid).find(".sk-fading-circle").remove();
            //$("#msgId" + tempGuid).append("<img class='sendAgin' title='点击重新发送' src='./dist/imgs/index/sendFail.png'>");

            delSingleLog(tempGuid);
        });
        /**
         * 侦查附件上传情况 ,这个方法大概0.05-0.1秒执行一次
         */
        function onprogress(evt, guid) {
            var loaded = evt.loaded;     //已经上传大小情况
            var tot = evt.total;      //附件总大小
            var per = Math.floor(100 * loaded / tot);  //已经上传的百分比
            $("#msgId" + guid).find(".sendMsgCont").find(".uploadProcess").css("width", per + "%");
        }
    });

}
function fileSizeConvert(bite_size) {
    if (bite_size < 1024) {//小于1k显示b
        return bite_size + "B";
    } else if (bite_size < (1024 * 1024)) {//小于1M显示KB
        var re = bite_size / 1024;
        return re.toFixed(2) + "KB";
    } else if (bite_size < (1024 * 1024 * 1024)) {//小于1G显示MB
        var re = bite_size / 1024 / 1024;
        return re.toFixed(2) + "MB";
    } else if (bite_size < (1024 * 1024 * 1024 * 1024)) {//小于1T显示G
        var re = bite_size / 1024 / 1024 / 1024;
        return re.toFixed(2) + "GB";
    }
}
/*
 *	文件大小转化成B
 */
function fileSizeToBite(size) {
    var result;
    var num = parseInt(size);
    if (size.indexOf("K") != -1) {
        result = num * 1024;
    }
    if (size.indexOf("M") != -1) {
        result = num * 1024 * 1024;
    }
    if (size.indexOf("G") != -1) {
        result = num * 1024 * 1024 * 1024;
    }
    return result;
}
//设置居中 传入的参数是class,暂时不支持ID
function makeCenter(cls, parent) {
    if (parent === undefined) {
        parent = window;
    }
    var width = $("." + cls).width();
    var height = $("." + cls).height();
    var windowWidth = $(parent).width();
    var windowHeight = $(parent).height();
    $("." + cls).css({top: ((windowHeight - height) / 2 - 20 ) + "px", left: ((windowWidth - width) / 2 ) + "px"});
}
$("body").on("dblclick", ".thumbImg", function () {
    var src = $(this).attr("HDUrl");
    var id = $(this).closest('.dialogContent').attr("id");
    // $(".HDImgBox").find(".HDImg").prop("src",localStorage.imUrl+src);
    // $(".HDImgBox").find(".HDImg").load(function(){
    // 	makeCenter("HDImgBox");
    // 	$(".HDImgBox").show();
    // });
    var new_win = gui.Window.get(
        window.open(localStorage.imUrl + src, {
            position: 'center',
            width: 960,
            height: 600,
            focus: true,
            frame: true
        })
    );
    new_win.maximize();
    // new_win.document.style.backgroundColor = "#0e0e0e";
});
$("body").on("click", ".closeHDImg", function () {
    $(".HDImgBox").hide();
});
$(".abort").click(function (event) {
    uploadxhr.abort();
});

$("body").on("click", ".abort", function () {
    uploadxhr.abort();
});

/*
 *	记录声音保存到本地--位置存放在根目录的audio文件夹下
 */

// function recordVoice(){
// 	var audio_context;
// 	var recorder;

// 	try {
// 	  // webkit shim
// 	  window.AudioContext = window.AudioContext || window.webkitAudioContext;
// 	  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
// 	  window.URL = window.URL || window.webkitURL;
// 	  audio_context = new AudioContext;
// 	} catch (e) {
// 	  console.log("当前环境不支持录音！");
// 	}

// 	navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
// 	  console.log('No live audio input: ' + e);
// 	});

// }

// function startUserMedia(stream) {
//   var input = audio_context.createMediaStreamSource(stream);
//   console.log('Media stream created.');

//   // Uncomment if you want the audio to feedback directly
//   //input.connect(audio_context.destination);
//   //console.log('Input connected to audio context destination.');

//   recorder = new Recorder(input);
//   console.log('Recorder initialised.');
// }

// function startRecording(button) {
//   recorder && recorder.record();
//   console.log('Recording...');
// }

// function stopRecording(button) {
//   recorder && recorder.stop();
//   console.log('Stopped recording.');

//   // create WAV download link using audio data blob
//   createDownloadLink();

//   recorder.clear();
// }

// function createDownloadLink() {
//   recorder && recorder.exportWAV(function(blob) {
//     var url = URL.createObjectURL(blob);
//     var li = document.createElement('li');
//     var au = document.createElement('audio');
//     var hf = document.createElement('a');

//     au.controls = true;
//     au.src = url;
//     hf.href = url;
//     hf.download = new Date().toISOString() + '.mp3';
//     hf.innerHTML = hf.download;
//     li.appendChild(au);
//     li.appendChild(hf);
//     recordingslist.appendChild(li);
//     // recordingslist.style.display = "none";
//   });
// }


/*
 *	目前无调用
 *	将剪切板中的base64转换为img
 *	返回值----转换之后存储的路径（相对于根目录）
 */
function convertBase64ToImg(data) {
    var date = new Date().format("yyyyMMddhhmmss");
    var path = "./shortCut/shortCut_" + date + ".jpeg";
    var dataBuffer = new Buffer(data, 'base64'); //把base64码转成buffer对象，
    fs.writeFile(path, dataBuffer, function (err) {//用fs写入文件
        if (err) {
            console.log(err);
        } else {
            console.log('写入成功！');
        }
    });
    return path;
}
// //删除文件（目前无调用）
function delFile(path) {
    fs.unlink(path, function (err) {
        if (err) {
            return console.error(err);
        }
        console.log("文件删除成功！");
    });
}
/*
 *	获取剪贴板的数据 图片为base64的格式
 */
var url_base64;
$("body").on("paste", ".textInput", function (e) {
    var text;
    var clipboard = nw.Clipboard.get();
    // if(clipboard){
    // 	clipboard = delHtmlTag(clipboard);
    // }
    // $(this).html(content);
    url_base64 = clipboard.get('jpeg');
    if (!url_base64) {
        text = clipboard.get('text');
        clipboard.set("");
        if (text) {
            $(this).append(text);
            return;
        }
        return;
    }
    clipboard.set("");
    var pid = $(this).closest('.dialogContent').attr("id");
    var type = "img";
    var date = new Date().format("yyyyMMddhhmmssS");
    var name = "shortCut_" + date + ".jpg";
    $(".shortCutSending").attr({
        "pid": pid,
        "date": date,
        "name": name
    });
    $(".shortCutSending").find(".shortCutImg").attr("src", url_base64);
    $(".body_mask").show();
    $(".shortCutSending").show();
});
/*
 *	截图绑定发送
 */
$(".shortCutSendingClose,.shortCutSending .btnCancel").click(function (event) {
    $(".shortCutSending").hide();
    $(".body_mask").hide();
});
$(".shortCutSending .btnConfirm").click(function (event) {
    var pid = $(".shortCutSending").attr("pid");
    var date = $(".shortCutSending").attr("date");
    var name = $(".shortCutSending").attr("name");
    sumitImageFile(url_base64, pid, 'img', name);
    $(".shortCutSending").hide();
    $(".body_mask").hide();
    var clipboard = nw.Clipboard.get();
    clipboard.clear();
});
/**
 * @param base64Codes
 *            图片的base64编码
 */
function sumitImageFile(base64Codes, pid, type, name) {
    var formData = new FormData();
    var fileSize = convertBase64UrlToBlob(base64Codes).size;
    //convertBase64UrlToBlob函数是将base64编码转换为Blob
    formData.append("imageName", convertBase64UrlToBlob(base64Codes), name);  //append函数的第一个参数是后台获取数据的参数名,和html标签的input的name属性功能相同
    formData._size = fileSize;
    try {
        upload(pid, type, name.substring(0, name.length - 4), formData);
    } catch (e) {
        console.log(e);
    }
}

/**
 * 将以base64的图片url数据转换为Blob
 * @param urlData
 *     用url方式表示的base64图片数据
 */
function convertBase64UrlToBlob(urlData) {
    var bytes = window.atob(urlData.split(',')[1]);        //去掉url的头，并转换为byte
    var ab = new ArrayBuffer(bytes.length);
    //处理异常,将ascii码小于0的转换为大于0
    var ia = new Uint8Array(ab);
    for (var i = 0; i < bytes.length; i++) {
        ia[i] = bytes.charCodeAt(i);
    }
    return new Blob([ab], {type: 'image/jpeg'});
}
//截图弹出层关闭
$("body").on("click", ".shortCutSendingClose,.shortCutSendingFooter btnCancel", function () {
    $(".shortCutSending").hide();
});


/*
 *	下载文件
 */
$("	body").on("click", ".saveasFile", function () {
    var name = $(this).closest('.downloadFile').attr("name");
    $(this).next("input").attr("nwsaveas", name).click();
});
$("body").on("click", ".receiveFile", function () {
    var downloadUrl = $(this).closest('.downloadFile').attr("path");
    var name = $(this).closest('.downloadFile').attr("name");
    var fileSize = $(this).closest('.downloadFile').attr("size");
    var msgId = $(this).closest('.receivedMsg ').attr("id") || $(this).closest('.sendMsg ').attr("id");
    var savePath = process.cwd() + "\\" + name;
    var $file = $(this);
    downloadFile(savePath, downloadUrl, name, $file, fileSize, msgId);
});
$("body").on("change", ".nwsaveas", function () {
    var saveasPath = $(this).val();
    var downloadUrl = $(this).closest('.downloadFile').attr("path");
    var name = $(this).closest('.downloadFile').attr("name");
    var fileSize = $(this).closest('.downloadFile').attr("size");
    var $file = $(this);
    downloadFile(saveasPath, downloadUrl, name, $file, fileSize);
});
$("body").on("click", ".openFile", function () {
    var guid = $(this).closest('.receivedMsg').attr("guid") || $(this).closest('.sendMsg').attr("guid");
    //var id = parseInt(msgId.replace(/[^0-9]/ig, ""));
    getFilePath(guid, function (path) {
        console.log(path);
        if (path) {
            try {
                gui.Shell.openItem(path);
            } catch (e) {
                console.log(e);
            }
        } else {
            console.log("打开文件失败！");
        }
    });
});
function downloadFile(savePath, downloadUrl, name, $file, fileSize) {
    var fs = require('fs');
    var request = require('request');
    var progress = require('request-progress');
    var msgId = $file.closest('.receivedMsg ').attr("guid") || $file.closest('.sendMsg ').attr("guid");
    isExistRename(savePath);
    var num = 1;

    function isExistRename(savePath) {
        fs.exists(savePath, function (exists) {
            if (exists) {
                var temp_name = name.split(".");
                var nameTitle = temp_name[0];
                var fileType = temp_name[1];

                var _newpath = process.cwd() + "\\downloadfile\\" + nameTitle + " (" + num + ")." + fileType;
                num++;
                return isExistRename(_newpath);
            } else {
                num = 1;
                progress(request(localStorage.imUrl + downloadUrl), {})
                    .on('progress', function (state) {
                        var filetotal = fileSizeToBite(fileSize);
                        var percent = state.size.transferred / filetotal * 1000;
                        percent = Math.floor(percent) / 10;
                        if (percent >= 100) {
                            percent = 100;
                        }
                        $("#msgId" + msgId).find(".downloadProcess").show()
                            .find(".downloading").css("width", percent + "%");
                    })
                    .on('error', function (err) {
                        console.log(err);
                    })
                    .on('end', function () {
                        $("#msgId" + msgId).find(".downloading").css("width", "100%");
                        $("#msgId" + msgId).find(".downloadProcess").hide();
                        $("#msgId" + msgId).find(".downloadBtn").hide();
                        $("#msgId" + msgId).find(".openFile").show();
                        //var id = parseInt(msgId.replace(/[^0-9]/ig, ""));
                        setFileDownloaded(msgId, savePath);

                    }).pipe(fs.createWriteStream(savePath));
            }
        });
    }
}
/*
 *	系统消息显示
 */
function sysInfo(json) {
    //判断是否是系统信息 单聊时撤回的系统信息不是IM_SYSTEM
    if (json.fromId == "IM_SYSTEM" || json.content.indexOf("[REVOKE") === 0) {
       if(json.content.indexOf("[REVOKE") === 0){//目前单聊只有撤回是系统消息  现在仅处理撤回时的情况
           var arr_temp = json.content.split("^");
           var msgId = arr_temp[1];
           var describe = arr_temp[2].substring(0, arr_temp[2].length - 1);
           var str = "<div class='systemInfo' style='text-align:center;margin-bottom:15px;'><span style='padding:2px 15px;border-radius:20px;background-color:rgba(0,0,0,0.2);color:#555;display:inline-block;line-height:20px;max-width:85%;'>" + describe + "!</span></div>";
           $(".dialogContent" + json.sessionId).find(".dgbody").append(str);
       }else{
            //群聊时的系统消息---包含添加删除人员  创建退出后群组  撤回等系统消息
           var str = "<div class='systemInfo' style='text-align:center;margin-bottom:15px;'><span style='padding:2px 15px;border-radius:20px;background-color:rgba(0,0,0,0.2);color:#555;display:inline-block;line-height:20px;max-width:85%;'>" + json.content + "!</span></div>";
           $(".dialogContent" + json.sessionId).find(".dgbody").append(str);
       }
        return true;
    } else {
        return false;
    }

}

/*
 *	检测群组是否存在
 */
function isExistGroup(gid) {
    IM_ajax("/plugins/zatp?cmd=roomexists", {
        gid: gid,
        user: localStorage.userId
    }, function (res) {
        if (res.status) {
            return true;
        } else {
            delSession(gid, refreshSessionList);
            $(".dialogContent" + gid).remove();
        }
    });
}

function delHtmlTag(str) {
    return str.replace(/<[^>]+>/g, "");//去掉所有的html标记
}