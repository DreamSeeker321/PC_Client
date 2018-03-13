/*
 *	type  1:单聊   2： 群组聊天
 *	chatType  0:发送   1: 接收
 */
function creatChat(msgmodule) {
    var curChat = {};
    // saveOrSetToLocal('','',msgmodule.fromId);
    var minMsgId = getLocal(minMsgId, msgmodule.fromId);
    var maxMsgId = getLocal(maxMsgId, msgmodule.fromId);

    if (minMsgId && minMsgId) {//已经初始化

    } else {//未初始化
        saveOrSetToLocal("minMsgId", 999999, msgmodule.fromId);
        saveOrSetToLocal("maxMsgId", 0, msgmodule.fromId);
    }

    if (maxMsgId == 0) {

    }

    if (msgmodule.type == 1) {//单聊
        creatSingleChat(msgmodule);
    } else {//组聊
        creatGpChat(msgmodule);
    }
    //this.creatSingleChat = creatSingleChat();
    //this.creatGpChat = creatGpChat();

    function isExist1(chatId) {/*判断该对话是否存在*/
        var status = $("#chat-" + chatId).length;
        if (status === 0) {
            return false;
        } else {
            return true;
        }
    }

    function creatSingleChat(msgmodule) {//单聊
        var isExist = isExist1(msgmodule.fromId);
        if (!isExist) {
            renderChat(msgmodule);
            showChat();
        } else {
            showChat();
        }
    }

    function creatGpChat(msgmodule) {//群组
        var isExist = isExist1(msgmodule.toId);
        if (!isExist) {
            renderChat(msgmodule);
            showChat(msgmodule.toId);
        } else {
            showChat(msgmodule.toId);
        }
    }

    function renderChat(msgmodule) {//加载渲染
        var toId, toName;
        if (msgmodule.type == 1) {//单聊
            toId = msgmodule.fromId;
            toName = msgmodule.fromName;
        } else {//群组
            toId = msgmodule.toId;
            toName = msgmodule.toName;
        }

        /*加载聊天框架右侧*/
        var $template = $(".dialogContent").clone();
        $template.addClass("dialogContent" + toId);
        $("#mainContent").prepend($template);
        /*修改发送或接收人*/
        $('.dialogName').text(toName);

        /*加载聊天框架左侧*/
        var chatHead = [];
        chatHead.push('<li id="' + toId + '" class="diaItem diaItem-' + toId + ' active">');
        chatHead.push('<div class="avatar">');
        chatHead.push('<img src="dist/imgs/index/avatar.png" alt="">');
        chatHead.push('</div>');
        chatHead.push('<div class="diaContent">');
        chatHead.push('<div class="diaTop clearfix">');
        chatHead.push('<span class="diaName">' + toName + '</span>');
        chatHead.push('<span class="diaTime">' + msgmodule.time + '</span>');
        chatHead.push('</div>');
        chatHead.push('<div class="diaDown clearfix">');
        chatHead.push('<p class=\'fl\' style="width:300px;height:20px;overflow:hidden;">' + msgmodule.content.substr(0, 6) + '...' + '</p>');
        chatHead.push('<span class=\'indicator fr\'>99</span>');
        chatHead.push('</div>');
        chatHead.push('</div>');
        chatHead.push('</li>');

        $('.dialogList .chats').append(chatHead.join(''));
    }


    /*localStorage添加值*/
    function saveOrSetToLocal(key, value, item) {
        var s_localJson = localStorage.item || "{}";
        var j_localJson = JSON.parse(s_localJson);
        j_localJson.key = value;
        s_localJson = JSON.stringify(j_localJson);
        localStorage.item = s_localJson;
    }

    /*查询值*/
    function getLocal(key, item) {
        var s_localJson = localStorage.item || "{}";
        var j_localJson = JSON.parse(s_localJson);
        if (j_localJson.key) {

            return j_localJson.key;
        } else {
            return false;
        }
    }

    /*显示特殊文件*/
    function showSpecialFile() {
        /*表情部分  如果表情出现在内容中的处理方式？？？*/
        // var fileType = msgmodule.content.substr(1,msgmodule.content.indexOf("^"));
        var con;
        switch (msgmodule.content) {
            // case "EMO" : con =
            // case "EMO" : con =
            // case "EMO" : con =
            // case "EMO" : con =


        }
    }

    /*获取云端单聊记录*/
    function getSingleLog(msgId, rows, from, to) {
        var url = localStorage.url + ':9090/plugins/zatp?cmd=singlehistory';
        var msgId = msgId ||

            $.ajax({
                type: 'post',
                url: url,
                data: {
                    msgId: id,
                    rows: 5,
                    from: localStorage.id,
                    to: msgmodule.toId
                },
                datatype: 'json',
                success: function (data) {

                },
                error: function (err) {
                    console.log("获取云端单聊记录错误：" + err);
                }
            });
    }

    /*获取群聊云端记录*/
    function getGpLog(sgId, rows, gid) {
        var url = localStorage.url + ':9090/plugins/zatp?cmd=grouphistory';
        $.ajax({
            type: 'post',
            url: url,
            data: {
                msgId: id,
                rows: 5,
                gid: msgmodule.toId,
            },
            datatype: 'json',
            success: function (data) {

            },
            error: function (err) {
                console.log("获取群聊云端记录错误：" + err);
            }
        });
    }
}


/**
 刷新会话列表
 **/
//新建一个空的聊天对话的时候如何向数据库写数据并刷新列表的时候让其显示
function refreshSessionList(callback) {
    var oldSelected = $(".chats").find("li.diaItem.active").attr("id");
    getChatList(function (rows) {
        $(".chats").empty();
        rows.forEach(function (row) {
            var toId, toName, chatType, topItem;
            toId = row.sessionId;
            toName = row.name;
            topItem = row.top;
            if (row.type == 1) {//单聊
                chatType = "single";
            } else {
                chatType = "group";
            }
            /*加载聊天框架左侧*/
            var chatHead = [];
            var lastTime = new Date(row.timestamp).getTime();
            var nowTime = new Date().getTime();
            var interval = nowTime - lastTime;
            var contentStr = '';
            var recordTime = new Date(row.timestamp).format("yyyy-MM-dd hh:mm:ss");

            if (interval > 60000 && interval < 86400000) {//大于1分钟 小于一天
                recordTime = recordTime.substr(-8, 5);
            } else if (interval > 86400000 && interval < 31536000000) {//超过一天
                recordTime = recordTime.substr(5, 5);
            } else if (interval > 31536000000) {//超过1年
                recordTime = recordTime.substr(0, 7);
            } else {
                recordTime = "刚刚";
            }
            contentStr = row.content.replace(/<br>/mg, " ");
            if (contentStr.indexOf("[IMG^") === 0) {
                contentStr = "[图片]";
            }
            if (contentStr.indexOf("[FILE^") === 0) {
                contentStr = "[文件]";
            }
            if (contentStr.indexOf("[VOICE^") === 0) {
                contentStr = "[语音]";
            }
            if (contentStr.indexOf("[POS^") === 0) {
                contentStr = "[位置]";
            }
            if(contentStr.indexOf("[REVOKE^") == 0){//过滤撤回
                var arr_temp = contentStr.split("^");
                contentStr = arr_temp[2].substring(0,arr_temp[2].length - 1);
            }
            chatHead.push('<li chatType="' + chatType + '" id="' + row.sessionId + '" id="' + row.sessionId + '" topItem="' + topItem + '" class="diaItem diaItem-' + toId + '">');
            chatHead.push('<div class="avatar">');
            var avatarUrl;
            if (chatType == "single") {
                avatarUrl = Number(row.ico) ? URL + "/attachmentController/downFile.action?id=" + row.ico : "dist/imgs/index/apps/single_chat.png";
                chatHead.push('<img src="' + avatarUrl + '" alt="">');
            } else {
                //avatarUrl = Number(row.ico) ? URL + "/attachmentController/downFile.action?id=" + row.ico : "dist/imgs/index/apps/group_chat.png";
                avatarUrl = "dist/imgs/index/apps/group_chat.png";
                chatHead.push('<img src="' + avatarUrl + '" alt="">');
            }
            chatHead.push('</div>');
            chatHead.push('<div class="diaContent">');
            chatHead.push('<div class="diaTop clearfix">');
            chatHead.push('<span class="diaName" title="' + toName + '">' + toName + '</span>');
            chatHead.push('<span class="diaTime">' + recordTime + '</span>');
            chatHead.push('</div>');
            chatHead.push('<div class="diaDown clearfix">');
            if (row.unread !== 0) {
                chatHead.push('<span class=\'indicator fr\'>' + row.unread + '</span>');
            }
            chatHead.push('<p class=\'fl\' style="width:130px;height:20px;overflow:hidden;white-space:nowrap;white-space:nowrap;">' + contentStr + '</p>');
            chatHead.push('</div>');
            chatHead.push('</div>');
            chatHead.push('</li>');
            $('.dialogList .chats').append(chatHead.join(''));
            $('.dialogList .chats').scrollTop(0);
        });
        $(".diaItem").removeClass("active");
        $(".chats").find("#" + oldSelected).addClass("active");
        if (callback) {
            callback();
        }
    });
}


/**
 获取离线消息并渲染
 **/
function getOfflineMessages(success) {
    //获取数据库中最大的msgId
    getGlobalMaxMsgId(function (maxId) {
        //从网络获取离线消息
        var url = "/plugins/zatp?cmd=offlinemsg";
        var data = {
            maxId: maxId,
            userId: localStorage.userId
        };
        IM_ajax(url, data,
            function (json) {
                for (var i = 0; i < json.length; i++) {
                    addChatLog(msgModelFun(json[i]), success);//向数据库插入数据
                }
            }, function (err) {
                console.log("获取离线消息错误：" + err);
            });
    });
}
