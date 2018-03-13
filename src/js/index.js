$(function () {
    document.title = localStorage.title;
    keybind();
    // getMenu();
    menuColor();//菜单栏  消息工具栏 鼠标移入变色

    makeCenter("setBlock");//设置模块和注销模块的居中
    makeCenter("logout");
    makeCenter("quit");
    makeCenter("upgrade");
    makeCenter("contactBlock", ".contactDetail");
    makeCenter("creatGpChat");
    makeCenter("shortCutSending");
    makeCenter("alertBox");
    makeCenter("hotKeyOccupied");

    $(window).resize(function (event) {//桌面大小调整时重新居中
        makeCenter("setBlock");
        makeCenter("logout");
        makeCenter("quit");
        makeCenter("upgrade");
        makeCenter("shortCutSending");
        makeCenter("alertBox");
        makeCenter("HDImgBox");//聊天高清图
        makeCenter("contactBlock", ".contactDetail");
        makeCenter("hotKeyOccupied");

        adaptWin();

        var windowHeight = $(window).height();
        var height = windowHeight - 236;
        $(".group").find(".body").css({"height": height + "px", "overflow-x": "hidden", "overflow-y": "auto"});
    });

    $(".logoBlock .name").text(localStorage.title);
    //获取离线消息并渲染
    getOfflineMessages(function () {
        //重新刷新左侧会话
        refreshSessionList();
    });
    refreshSessionList(function () {
        /*默认点击消息列表*/
        $(".allNews").click();
        $(".transaction").addClass('active');
    });
    $(".allNews").click();
    //获取左侧消息数量
    setTimeout(getSmsNumber, 5 * 1000);
    setTimeout(refreshOnlineNum, 2 * 1000);

    $(".menuBar .avatar").trigger("click");
    $(".myInfo").hide();
    $('body').on("click", '.sendMessage', function () {
        var chatid = $(this).parent().siblings('.left').find('.orgname').attr('userId');
        var id = $(this).parent().siblings('.left').find('.orgname').attr('id');
        var chatname = $(this).parent().siblings('.left').find('.orgname').text();
        chatInit(chatid, chatname, "single", id);
    });
});

var gui, win, index_win = null;

if (typeof(require) != 'undefined') {
    gui = require('nw.gui');
    index_win = gui.Window.get();
}
var tray1 = new gui.Tray({title: '系统托盘', icon: 'appIcon.png'});
tray1.tooltip = '协同办公精灵';
//添加一个菜单
var menu1 = new gui.Menu();
var menu_item = new gui.MenuItem({
    label: '关闭程序',
    click: function () {
        tray1 = null;
        menu1 = null;

        //关闭所有browser进程
        var cp = require('child_process'); //子进程
        cp.exec('taskkill /f /t /im Browser.exe', function () {
            process.exit(1);
            tray1.remove();
        });
    }
});

tray1.on("click", function () {
    clearTimeout(tempSetTimeout);
    tray1.icon = 'appIcon.png';
    $(notification).trigger("click");
});

$("body").on("click", function () {
    clearTimeout(tempSetTimeout);
    tray1.icon = 'appIcon.png';
});

menu1.append(menu_item);
tray1.menu = menu1;

tray1.on('click', function () {
    index_win.show();
})

var shortcutOption = {
    key: "Ctrl+Shift+A",
    active: function () {
        // console.log("全局快捷键" + this.key + "按下");
        // return;
        try {
            gui.Shell.openItem(process.cwd() + "/shortCutTool/ScreenCapture.exe");
        } catch (err) {
            console.log(err);
        }
    },
    failed: function (msg) {
        //创建快捷键失败
        console.log(msg);

    }
};

// 创建快捷键
var shortcut1 = new gui.Shortcut(shortcutOption);

// 注册全局快捷键
gui.App.registerGlobalHotKey(shortcut1);

// 解除注册，在应用结束的时候执行
window.onunload = function () {
    gui.App.unregisterGlobalHotKey(shortcut1);
};

// $("#screenshot").keydown(function(e){
//     var key = ""
//     if(e.ctrlKey){
//         key = "Ctrl + "
//     }
//     if(e.altKey){
//         key = "Alt + "
//     }
//     if(e.ctrlKey && e.altKey){
//         key = "Ctrl + Alt + "
//     }
//     key = key + e.key;
//     return false;
// });


/**
 * 获取在线人数
 */
function refreshOnlineNum() {
    $.ajax({
        url: localStorage.url + "/personManager/queryOnlineUserCount.action",
        type: "post",
        dataType: "json",
        success: function (data) {
            if (data.rtState) {
                var onlineUserCount = data.rtData.onlineUserCount;
                $(".onlineNumber").text(onlineUserCount);
                setTimeout(refreshOnlineNum, 2 * 1000);
            }
        },
        error: function (err) {
            console.log("获取人员信息 :" + err);
        }
    });
}

//适应屏幕
function adaptWin() {//通讯录部分适应电脑屏幕
    var winHeight = $(window).height();
    var offset = $(".ctBlock").offset();
    var newHeight = winHeight - offset.top - 60;
    $(".ctList_fixed>div").css("height", newHeight + "px");
}


//绑定按键
function keybind() {

    //窗口操作
    $("._").click(function () {
        index_win.minimize();
    });
    $(".maxWin").click(function () {
        if ($(this).hasClass('maxed')) {
            index_win.unmaximize();
            $(this).removeClass('maxed');
        } else {
            index_win.maximize();
            $(this).addClass('maxed');
        }
    });
    $(".x").click(function () {
        //$(".quit").show();
        //$(".body_mask").show();
        index_win.hide();
    });

    /*
     *	搜索面板
     */
    var setTIme;
    $(".search").keyup(function (event) {
        if ($(".search").val() != '') {
            $('.searchBlock').show();
        } else {
            $('.searchBlock').hide();
            return;
        }
        var keyword, codedKey;
        clearTimeout(setTIme);
        setTIme = setTimeout(getword, 500);

        function getword() {
            keyword = $(".search").val();
            codedKey = encodeURI(keyword);
            var newSrc = localStorage.url + "/system/core/base/quicksearch/search_result_2.jsp?keyword=" + codedKey;
            $('.searchBlock').find("iframe").attr("src", newSrc);
        }
    });

    $("body").click(function (e) {//因为点击iframe的话是另一个body,只要不是输入框即可
        if (e.target != $(".search")[0]) {
            $('.searchBlock').hide();
        }
    });


    //消息界面的设置
    $("body").on("mouseover", ".smsTabBlock p,.moreSmsItem", function () {
        $(this).css("color", "#0296f8");
    });
    $("body").on("mouseout", ".smsTabBlock p,.moreSmsItem", function () {
        $(this).css("color", "#888");
    });

    $("body").on("click", ".moreSmsClass", function () {
        $(".moreSms").stop().slideToggle(200);
    });

    $("body").on("mouseleave", ".moreSms", function () {
        $(".moreSms").stop().slideUp(200);
    });


    //设置列表显示隐藏
    $('.set').click(function (event) {
        $(".setList").toggle();
        $(".addList").hide();
        event.stopPropagation();
    });
    $("body").click(function (event) {
        $(".setList").hide();//隐藏设置列表
        $(".personInfo").hide();
        $(".myInfo").hide();
    });

    //设置--添加聊天列表显示隐藏
    $('.add').click(function (event) {
        $(".addList").toggle();
        $(".setList").hide();
        event.stopPropagation();
    });
    $("body").click(function (event) {
        $(".addList").hide();
    });

    /*聊天群组设置相关按钮*/
    $("body").on("click", ".closeDgSet", function () {
        $(this).closest('.dialogContent').find(".dgSetContent").animate({
                "right": "-80%"
            },
            500, function () {
                /* stuff to do after animation is complete */
            });
    });
    $("body").on("click", ".groupSet", function () {
        $(this).closest('.dialogContent').find(".dgSetContent").animate({
                "right": "0"
            },
            500, function () {
            });
        var sessionId = $(this).closest('.dialogContent').attr("id");
        gpMember(sessionId);
    });
    $("body").on("click", ".singleClearHistory", function () {
        var id = $(this).closest('.dialogContent').attr("id");
        alertBox("确实要删除聊天记录吗？删除后不可恢复！", function () {
            IM_ajax("/plugins/zatp?cmd=clearsinglemsg", {
                sessionId: id,
                user: localStorage.userId
            }, function (data) {
                try {
                    delSession(id);
                    delLog(id);
                    $(".dialogContent" + id).find('.dgbody').empty();
                    console.log("单聊记录删除成功！");
                } catch (err) {
                    console.log("单聊记录删除失败：" + err);
                }
            });
        });
    });
    /*撤回消息按钮*/
    $("body").on("contextmenu",".sendMsgCont",function(e){
        var posY = $(this).position().top + 68;
        var msgId = $(this).parent(".sendMsg").attr("msgId");
        var guid = $(this).parent(".sendMsg").attr("guid");
        $(".dgMsgMenu").show().css({
            top:posY
        }).attr({"msgId" : msgId,"guid" : guid});
        if(msgId == "undefined"){
            $(".dgMsgMenu").find(".sendAginMenuItem").show();
            $(".dgMsgMenu").find(".revoke").hide();
        }else{
            $(".dgMsgMenu").find(".sendAginMenuItem").hide();
            $(".dgMsgMenu").find(".revoke").show();
        }
        $(".dgbody").css("overflow","hidden");
        e.stopPropagation();
        e.preventDefault();
    });
    $("body").click(function(event) {
        $(".dgMsgMenu").hide();
        $(".dgbody").css("overflow","auto");
    });
    /*点击按钮*/
    var infoWindowTimeout;
    $("body").on("click","ul.dgMsgMenu li.menuItem",function(e){
        var msgId = $(this).parent().attr("msgId");
        var guid = $(this).parent().attr("guid");
        if($(this).text() == "撤回"){
            IM_ajax("/plugins/zatp?cmd=revokemsg",{
                msgId : msgId,
                userId : USERID
            },function(data){
                //删除本地的数据
                if(data.status){
                    delSingleLog(guid,function(){
                        $("#msgId" + guid).remove();
                    });
                }else{
                    clearTimeout(infoWindowTimeout);
                    $(".infoWindow").find(".infoText").text(data.msg);
                    $(".infoWindow").show();
                    infoWindowTimeout = setTimeout("$('.infoWindow').fadeOut();",3000);
                }
            });
        }else{//重新发送
            $("#msgId" + guid).find(".sendAgin").trigger('click');
        }
    });


    /*
     *	群组成员设置
     *
     */
    function gpMember(sessionId) {
        var $thisDialogContent = $(".dialogContent" + sessionId);
        IM_ajax("/plugins/zatp?cmd=getroominfo", {
            gid: sessionId
        }, function (data) {
            $thisDialogContent.find(".memberList").find(".memberItem").remove();
            $thisDialogContent.find(".memberList").find(".editMember").remove();
            //先添加群主
            var members = data.info.members;
            var avatarSrc = data.info.admin.ico ? URL + "/attachmentController/downFile.action?id=" + data.info.admin.ico : "dist/imgs/index/contact/person.png";
            var master = '<li uid="' + data.info.admin.uid + '" class="memberItem adminMember">' +
                '<div class="avatar">' +
                '<img draggable="false"  src="' + avatarSrc + '" alt="">' +
                '</div>' +
                '<p class="name">' + data.info.admin.name + '</p>' +
                '</li>';
            $thisDialogContent.find(".memberList").append(master);
            //添加群成员
            members.forEach(function (member) {
                var id = member.uid;
                var name = member.name;
                var avatarSrc = member.ico ? URL + "/attachmentController/downFile.action?id=" + member.ico : "dist/imgs/index/contact/person.png";
                var li = '<li uid="' + id + '" class="memberItem ">' +
                    '<div class="avatar">' +
                    '<img draggable="false"  src="' + avatarSrc + '" alt="">' +
                    '</div>' +
                    '<p title="' + name + '" class="name">' + name + '</p>' +
                    '</li>';
                $thisDialogContent.find(".memberList").append(li);
            });
            var addMemberStr = '<span class=\'editMember addMember\'><span class="addIcon"></span></span>';
            var minusMember = '<span class=\'editMember delMember\'><span class="minusIcon"></span></span>';

            //添加增加删除人员
            if (data.info.admin.uid == USERID && $thisDialogContent.find(".memberList .editMember").length == 0) {
                $thisDialogContent.find(".memberList").append(addMemberStr);
                $thisDialogContent.find(".memberList").append(minusMember);
            }
            if (data.info.admin.uid == USERID) {
                $thisDialogContent.find(".delGroup").find("input").val("解散当前群");
                $thisDialogContent.find(".delGroup").attr("type", "dismiss");
            } else {
                $thisDialogContent.find(".delGroup").find("input").val("退出当前群");
                $thisDialogContent.find(".delGroup").attr("type", "quit");
            }
            $thisDialogContent.find(".groupNameContent").text(data.info.name).attr("title", data.info.name);
            $thisDialogContent.find(".groupNoticeContent").text(data.info.subject).attr("title", data.info.subject);
        });
    }

    //修改群名称
    $("body").on("click", ".groupNameContent", function () {
        var adminId = $(this).closest(".dgSetContent").find(".adminMember").attr("uid");
        if (adminId !== USERID) {//只有群主可以修改
            return;
        }
        var name = $(this).text();
        $(this).attr("contenteditable", true).focus();
        $(this).next().hide();
        // $(this).html("<input type='text' value='" + name + "' class='groupNameEdit' />");
        $(this).attr("oldText", name);
        $(this).css({"cursor": "text", "border": "1px dashed #aaa", "display": "block"});
    });
    //点击编辑图标
    $("body").on("click", ".groupName .toEdit", function () {
        $(this).prev(".groupNameContent").trigger("click");
    });
    //修改群公告
    $("body").on("click", ".groupNoticeContent", function () {
        var adminId = $(this).closest(".dgSetContent").find(".adminMember").attr("uid");
        if (adminId !== USERID) {
            return;
        }
        $(this).attr("contenteditable", true).focus();
        $(this).next().hide();
        var name = $(this).text();
        // $(this).html("<input type='text' value='" + name + "' class='groupNoticeEdit' />");
        $(this).attr("oldText", name);
        $(this).css({"cursor": "text", "border": "1px dashed #aaa", "display": "block"});
    });
    //点击图标修改群公告
    $("body").on("click", ".groupNotice .toEdit", function () {
        $(this).prev(".groupNoticeContent").trigger("click");
    });
    //失去焦点修改群名称
    $("body").on("blur", ".groupNameContent", function () {
        var $this = $(this);
        var gid = $(this).closest(".dialogContent").attr("id");
        var newText = $(this).text();
        var oldText = $(this).attr("oldText");
        $(this).css({"cursor": "pointer", "border": "none", "display": "inline-block"}).removeAttr("contenteditable");
        var url = "/plugins/zatp?cmd=updateroomname";
        if (newText == "") {
            $(this).text(oldText);
        } else {
            IM_ajax(url, {
                gid: gid,
                name: newText
            }, function (data) {
                if (data.status) {
                    //更新数据库
                    updateGroupName(gid, newText, function () {
                        $this.closest(".dialogContent").find(".dialogName").text(newText);
                        // $this.parent(".groupNameContent").html(newText);
                        $this.text(newText);
                        refreshSessionList();
                    })
                } else {
                    $this.text(oldText);
                    //显示更新失败错误
                }
            });
        }
        $(this).next().show();
    });
    //失去焦点修改群公告
    $("body").on("blur", ".groupNoticeContent", function () {
        var $this = $(this);
        var gid = $(this).closest(".dialogContent").attr("id");
        var newText = $(this).text();
        var oldText = $(this).attr("oldText");
        $(this).css({"cursor": "pointer", "border": "none", "display": "inline-block"}).removeAttr("contenteditable");
        if (newText == "") {//不可为空
            $(this).text(oldText);
        } else {
            IM_ajax("/plugins/zatp?cmd=updateroomsubject", {
                gid: gid,
                subject: newText
            }, function (data) {
                if (data.status) {
                    $this.parent(".groupNameContent").find(".groupNoticeContent").text(newText);
                }
            })
        }
        //显示编辑图片
        $(this).next().show();
    });
    /*关闭添加删除人员窗口*/
    $("body").on("click", ".closeEditGpMember", function () {
        $(".addOrDelMemberWrap").hide();
    });
    /*点击添加或者删除图标*/
    $("body").on("click", ".editMember", function () {
        var gid = $(this).closest(".dialogContent").attr("id");
        $(".addOrDelMemberWrap").show();
        //清空选择框和已选框
        $(".addGpMember").empty();
        $(".selectedMembers").empty();
        $(".addOrDelMemberWrap").attr("gid", gid);
        //添加群组人员
        if ($(this).hasClass("addMember")) {
            $(".addOrDelMemberWrap .addOrDelMemberTitle").text("添加群组人员");
            $(".addOrDelMemberWrap .btnConfirm").css("background-color", "#6fc3f5");
            $(".addOrDelMemberWrap").attr("type", "add");
            getGpOrg("addGpMember", "", "addGpMember");
        } else if ($(this).hasClass("delMember")) {//删除人员
            $(".addOrDelMemberWrap .addOrDelMemberTitle").text("删除群组人员");
            $(".addOrDelMemberWrap .btnConfirm").css("background-color", "#ff4948");
            $(".addOrDelMemberWrap").attr("type", "del");
            var $li = $(this).closest(".memberList").find("li");
            for (var i = 0; i < $li.length; i++) {
                var id = $li.eq(i).attr("uid");
                var name = $li.eq(i).find("p.name").text();
                var str = [];
                str.push('<li uid="' + id + '" class="selectItem">');
                str.push('<div class="leftAvatar">');
                str.push('<img src="dist/imgs/index/contact/person.png" alt="">');
                str.push('<div class="personName" title="' + name + '">' + name + '</div>');
                str.push('</div>');
                str.push('<div class="rightCheckbox">');
                str.push('<input type="checkbox" class="personCheckbox select_' + id + '"/>');
                str.push('<label checkId="' + id + '" class="checkLabel" for="select_' + id + '"></label>');
                str.push('</div>');
                str.push('</li>');
                $(".addOrDelMemberContent .personForSelect").append(str.join(""));
            }
        }
    });

    /*点击选择人员*/
    $("body").on("click", ".addOrDelMemberWrap .checkLabel", function () {
        var forName = $(this).attr("for");
        var b = $("." + forName).prop("checked");
        $(this).parent().find("." + forName).prop("checked", !b);
        var type = $(this).closest(".addOrDelMemberWrap").attr("type");
        var id = $(this).attr("checkId");
        if (type == "add") {
            var name = $(this).siblings('.avatarItem').find(".orgname").text();
        } else {
            var name = $(this).closest(".selectItem").find(".personName").text();
        }
        if (!b) {
            renderEditGpMember("add", name, id);
        } else {
            renderEditGpMember("del", name, id);
        }
    })

    /**
     * 渲染添加删除群组成员的页面
     * @param oper 添加或者删除操作
     * @param name
     * @param id
     */
    function renderEditGpMember(oper, name, id) {
        switch (oper) {
            case "add" : {
                var str = [];
                str.push('<li userId="' + id + '" class="selectItem">');
                str.push('<div class="leftAvatar">');
                str.push('<img src="dist/imgs/index/contact/person.png" alt="">');
                str.push('<div class="personName" title="' + name + '">' + name + '</div>');
                str.push('</div>');
                str.push('<div class="removePerson">x</div>');
                str.push('</li>');
                $(".addOrDelMemberContent .selectedMembers").append(str.join(""));
                break;
            }
            case "del" : {
                var $selected = $(".addOrDelMemberContent .selectedMembers li");
                for (var i = 0, l = $selected.length; i < l; i++) {
                    if ($($selected[i]).attr("userId") == id) {
                        $($selected[i]).remove();
                        break;
                    }
                }
                break;
            }
        }
    }

    $("body").on("click", ".removePerson", function () {
        var thisId = $(this).closest("li").attr("userId");
        $(".addOrDelMemberContent li label.checkLabel[checkid='" + thisId + "']").trigger("click");
        //removeSelect(thisId);
    });

    $("body").on("click", ".addOrDelMemberContent .btnConfirm", function () {
        var gid = $(this).closest(".addOrDelMemberWrap").attr("gid");
        var type = $(this).closest(".addOrDelMemberWrap").attr("type");
        if (type == "add") {
            ajaxToEditGpMember("add", gid);
        } else {
            ajaxToEditGpMember("del", gid);
        }
    });

    /**
     * 发送请求 添加群人员
     * @param oper
     * @param gid
     */
    function ajaxToEditGpMember(oper, gid) {
        var selectedMember = $(".addOrDelMemberWrap .selectedMembers .selectItem").length;
        var userId = '';
        for (var i = 0; i < selectedMember; i++) {
            userId += $(".addOrDelMemberWrap .selectedMembers .selectItem").eq(i).attr("userid") + ",";
        }
        userId = userId.substring(0, userId.length - 1);
        var url, para;
        if (oper == "add") {
            url = "/plugins/zatp?cmd=addroommem";
            para = {
                gid: gid,
                user: userId
            }
        } else {
            url = "/plugins/zatp?cmd=delroommems";
            para = {
                gid: gid,
                users: userId
            }
        }
        IM_ajax(url, para, function () {
            gpMember(gid);
            $(".addOrDelMemberWrap").hide();
        })
    }

    /**
     * 解散群组或者退出群组
     */
    $("body").on("click", ".dialogContent .delGroup input", function () {
        var type = $(this).parent().attr("type");
        var sessionId = $(this).closest('.dialogContent').attr("id");
        var name = $(this).closest('.dialogContent').find(".dialogName").text();
        if (type == "dismiss") {
            alertBox("您确定要解散 " + name + " 群吗？", function () {
                dismissGroup(sessionId);
            });
        } else {
            alertBox("您确定要退出 " + name + " 群吗？", function () {
                quitGroup(sessionId);
            });
        }
    });

    /*
     *	退出群
     */

    function quitGroup(gid) {
        IM_ajax("/plugins/zatp?cmd=leaveroom", {
            "gid": gid,
            "user": localStorage.userId
        }, function (data) {
            delSession(gid, function () {

            });
        });
        refreshSessionList();
        $(".dialogContent" + gid).remove();
        if ($(".chats").find(".diaItem").length) {
            var id = $(".chats").find(".diaItem").eq(0).attr("id");
            showChat(id);
        } else {
            $("#mainContent").find(".smsBlock").show();
        }
    }

    /*
     *	解散群
     */
    function dismissGroup(gid) {
        IM_ajax("/plugins/zatp?cmd=delroom", {
            "gid": gid,
        }, function (data) {
            delSession(gid, function () {

            });
        });
        refreshSessionList();
        $(".dialogContent" + gid).remove();

        if ($(".chats").find(".diaItem").length) {
            var id = $(".chats").find(".diaItem").eq(0).attr("id");
            showChat(id);
        } else {
            $("#mainContent").find(".smsBlock").show();
        }
    }

    //点击菜单折叠切换
    $("body").on("click", ".head", function () {
        if ($(this).siblings('.body').find("li").length !== 0) {
            if ($(this).hasClass("open")) {
                $(this).find(".caret-set").addClass("caret-right").removeClass('caret-down');
                $(this).siblings('.body').slideUp(200);
                $(this).removeClass("open");
            } else {

                if ($(this).parent().hasClass("contactItem")) {
                    $(this).parent().parent().find(".caret-set").removeClass('caret-down').addClass('caret-right');
                    $(this).parent().parent().find(".body").slideUp(200);

                    $(this).parent().parent().find(".head").removeClass("open");
                }

                $(this).find(".caret-set").removeClass('caret-right').addClass("caret-down");
                setTimeout('adaptWin()', 200);//打开通讯录时自适应高度
                //adaptWin();
                $(this).siblings('.body').slideDown(200);
                $(this).addClass("open");
            }
        }
    });


    //abc导航滚动设置
    $("body").on("click", ".abc li", function () {
        var abcText = $(this).text();
        var index, outerHeight, scrollHeight = 0;
        for (var i = 0, l = $(".personList").length; i < l; i++) {
            outerHeight = $($(".personList")[i]).outerHeight();
            if (abcText == $($(".personList")[i]).find(".personOrder").text()) {
                index = $($(".personList")[i]).index();
                $(".scrollContent").stop().animate({
                        scrollTop: scrollHeight
                    },
                    500, function () {
                    });
                break;
            }
            scrollHeight += Number(outerHeight);
        }
    });

    /*通信录点击请求数据*/

    $('body').on("click", ".ctBlock .head", function () {
        addContact();
    });
    /*应用菜单部分点击打开窗口*/
    $("body").on("click", ".appList li", function () {
        var menuCode = $(this).attr("menucode");
        var url;
        if (menuCode !== '' && menuCode !== null && menuCode !== "null" && menuCode !== undefined && menuCode !== "undefined") {
            $(".appItemList li").css("background-color", "#fff");
            $(this).css("background-color", "#eaf2ff");
            OpenUrlFromExternal(menuCode);
        }
    });
    /**
     * 获取人员信息详情
     */
    $("body").on("click", ".orgStructure .orgItem .avatar", function (event) {
        $this = $(this);
        var pos = $(this).position();
        var winHeight = $(window).height();
        var maxHei = winHeight - 58 - 50;
        var curHei = pos.top + 380;
        var minHei = pos.top - 380;
        if (curHei < maxHei) {
            $(".personInfo").css({"top": (pos.top + 62) + "px", "left": (pos.left + 28) + "px"});
        } else if (minHei > 0) {
            $(".personInfo").css({"top": (pos.top + 62 - 380) + "px", "left": (pos.left + 28) + "px"});
        } else {
            makeCenter("personInfo", ".dialogContent");
            $(".personInfo").css({"left": (pos.left + 28) + "px"});
        }

        $.ajax({
            url: localStorage.url + "/personManager/getPsersonInfoByUserId.action",
            type: "post",
            data: {
                userId: $this.siblings().attr("userid")
            },
            dataType: "json",
            success: function (data) {
                if (data.rtState) {
                    if (data.rtData.userName.length > 5) {
                        $(".personInfo").find(".personName").text(data.rtData.userName.substr(0, 5) + "...").attr("title", data.rtData.userName);
                    } else {
                        $(".personInfo").find(".personName").text(data.rtData.userName);
                    }
                    $(".personInfo").find(".personNameDetail").text(data.rtData.userName);
                    $(".personInfo").find(".personPos").text(data.rtData.deptIdName);
                    if (data.rtData.sex == '0') {
                        $(".personInfo").find(".personSex").text("男");
                    } else {
                        $(".personInfo").find(".personSex").text("女");
                    }
                    $(".personInfo").find(".posName").text(data.rtData.userRoleStrName);
                    $(".personInfo").find(".tele").text(data.rtData.mobilNo);
                    $(".personInfo").find(".personEmail").text(data.rtData.email);

                    var avatarSrc = data.rtData.avatar ? URL + "/attachmentController/downFile.action?id=" + data.rtData.avatar : "dist/imgs/index/contact/person.png";

                    $(".personInfo").find(".avatar img").attr("src", avatarSrc)
                }
            },
            error: function (err) {
                console.log("获取人员信息 :" + err);
            }
        });
        $(".personInfo").show();
        event.stopPropagation();
    });
    /**
     * 关闭人员信息详情
     */
    $("body").on("click", ".closePerInfo", function () {
        $(".personInfo").hide();
    });
    $("body").on("click", ".personInfo", function (event) {
        event.stopPropagation();
    });


    //设置点击
    $(".setting").click(function () {
        $(".body_mask").show();
        $(".setBlock").show();
    });

    //设置的页面点击切换
    $(".setContentList li").click(function () {
        $(".setContentList li").removeClass("setActive");
        $(this).addClass("setActive");
        var index = $(this).index();
        $(".setBlock .right .setContent").hide();
        $(".setBlock .right .setContent").eq(index).show();
    });
    $(".setClose").click(function () {
        $(".body_mask").hide();
        $(".setBlock").hide();
    });
    /*设置自动登录*/
    if (localStorage.autoLogin == "true") {
        $(".autoLoginBtn").prop("checked", true);
    } else {
        $(".autoLoginBtn").prop("checked", false);
    }
    $("body").on("click", ".multi-switch", function () {
        var isAutoLogin = $(".autoLoginBtn").prop("checked");
        localStorage.autoLogin = isAutoLogin;
    });
    /**
     * 显示当前登陆人详情
     */
    $("body").on("click", ".menuBar .avatar", function (event) {
        $.ajax({
            url: localStorage.url + "/personManager/getPsersonInfoByUserId.action",
            type: "post",
            data: {
                userId: localStorage.getItem("userId")
            },
            dataType: "json",
            success: function (data) {
                if (data.rtState) {
                    var avatarId = data.rtData.avatar;
                    if (avatarId) {
                        var url = URL + "/attachmentController/downFile.action?id=" + avatarId;
                        localStorage.avatarSrc = url;
                        $(".myAvatar").attr("src", url);
                        // downloadAvatar(url,avatarId+".jpg",function(){
                        //     console.log("头像下载成功！");
                        // });
                    }
                    if (data.rtData.userName.length > 5) {
                        $(".myInfo").find(".personName").text(data.rtData.userName.substr(0, 5) + "...").attr("title", data.rtData.userName);
                    } else {
                        $(".myInfo").find(".personName").text(data.rtData.userName);
                    }
                    $(".myInfo").find(".personNameDetail").text(data.rtData.userName);
                    $(".myInfo").find(".personPos").text(data.rtData.deptIdName);
                    if (data.rtData.sex == '0') {
                        $(".myInfo").find(".personSex").text("男");
                    } else {
                        $(".myInfo").find(".personSex").text("女");
                    }
                    $(".myInfo").find(".posName").text(data.rtData.userRoleStrName);
                    $(".myInfo").find(".tele").text(data.rtData.mobilNo);
                    $(".myInfo").find(".personEmail").text(data.rtData.email);
                }
            },
            error: function (err) {
                console.log("获取人员信息 :" + err);
            }
        });
        $(".myInfo").show();
        event.stopPropagation();
    });
    // 关闭本人信息
    $("body").on("click", ".closeMyInfo", function () {
        $(".myInfo").hide();
    });
    // 阻止冒泡防止触发点击头像
    $("body").on("click", ".myInfo", function (event) {
        event.stopPropagation();
    });
    // 显示消息列表
    $(".messageBtn").click(function () {
        $(".main>ul").hide();
        $(".dialogList").show();
    });
    //点击邮件按钮
    $(".emailBtn").click(function () {
        OpenUrlFromExternal("/system/core/email/index.jsp");
    });
    //点击新闻
    $(".newBtn").click(function (event) {
        OpenUrlFromExternal("/system/core/base/news/person/queryNotLookList.jsp");
    });
    //点击公告
    $(".noticeBtn").click(function (event) {
        OpenUrlFromExternal("/system/core/base/notify/person/index.jsp");
    });
    //待办项
    $(".todoBtn").click(function () {
        OpenUrlFromExternal("/system/core/workflow/flowrun/list/index.jsp");
    });
    //联系人
    $(".contactBtn").click(function () {
        $(".main>ul").hide();
        $(".contactList").show();
        showAllgroup();
    });
    //应用中心
    $(".appCenter").click(function () {
        if ($(".appList").text() == "") {
            getMenu();
        }
        $(".main>ul").hide();
        $(".appList").show();
    });
    //签到
    $("body").on("click", ".sign", function () {
        OpenUrlFromExternal("/system/core/base/attend/duty/index.jsp");
    });


    //组织架构点击发送  消息 电话 邮件
    $("body").on("click", ".orgList .sendEmail", function () {
        var id = $(this).parent().siblings(".left").find('.orgname').attr("id");
        OpenUrlFromExternal("/system/core/email/send.jsp?toUsers=" + id);
    });


    //录音
    $("body").on("mousedown", ".audio", function () {
        $(this).closest('.dialogContent').find(".toSendAudio").show();
    });
    $("body").on("mouseup", ".audio", function () {
        $(this).closest('.dialogContent').find(".toSendAudio").hide();
        $("body").mouseup(function () {
            $(".toSendAudio").hide();
        });
    });

    /*注销部分*/
    $(".toLogout").click(function () {
        $(".logout").show();
        $(".body_mask").show();
    });
    /*退出*/
    $(".quitApp").click(function (event) {
        $(".quit").show();
        $(".body_mask").show();
    });

    /*注销显示隐藏*/
    $(".logoutClose").click(function () {
        $(".logout").hide();
        $(".body_mask").hide();
    });
    $(".logoutFooter .btnCancel").click(function () {
        $(".logout").hide();
        $(".body_mask").hide();
    });
    $(".logout .btnConfirm").click(function () {
        // window.location.href = "login.html";
        tray1.remove();
        tray1 = null;
        menu1 = null;
        //关闭所有browser进程
        var cp = require('child_process'); //子进程
        cp.exec('taskkill /f /t /im Browser.exe', function () {
            var new_win = gui.Window.get(
                nw.Window.open("./login.html", {
                    "min_width": 960,
                    "min_height": 600,
                    "frame": false
                }, function (new_win) {
                    index_win.close();
                    closedb();
                })
            );

            localStorage.removeItem("cookie");
        });


    });
    /*退出显示隐藏*/
    $(".quit .btnConfirm").click(function () {
        var cp = require('child_process'); //子进程
        cp.exec('taskkill /f /t /im Browser.exe', function () {
            gui.App.closeAllWindows();
            closedb();
        });
    });
    $(".quitClose").click(function () {
        $(".quit").hide();
        $(".body_mask").hide();
    });
    $(".quitFooter .btnCancel").click(function () {
        $(".quit").hide();
        $(".body_mask").hide();
    });

    /*截图快捷键占用*/
    $(".hotKeyOccupied .btnConfirm").click(function () {
        $(".setting").trigger("click");
    });
    $(".hotKeyOccupiedtClose").click(function () {
        $(".hotKeyOccupied").hide();
        $(".body_mask").hide();
    });
    $(".hotKeyOccupiedtFooter .btnCancel").click(function () {
        $(".hotKeyOccupied").hide();
        $(".body_mask").hide();
    });

    /*创建聊天*/
    $('.createSingleChat').click(function (event) {
        $(".main>ul").hide();
        $('.contactList').show();
        $('.org').click();
    });

    $("body").on("click", ".toContact", function () {
        $(".contactBtn").click();
        $(".contactItem").find(".head").click();
    });

    /*发送图片,文件，语音*/
    $("body").on("click", ".sendItem", function () {
        if ($(this).hasClass("sendImg")) {
            $(this).closest('.dialogContent').find(".imgForm").find("input").click();
        } else if ($(this).hasClass("sendFile")) {
            $(this).closest('.dialogContent').find(".fileForm").find("input").click();
        } else if ($(this).hasClass("sendVoice")) {

        } else if ($(this).hasClass("shortCut")) {
            try {
                gui.Shell.openItem(process.cwd() + "/shortCutTool/ScreenCapture.exe");
            } catch (err) {
                console.log(err);
            }
        }
    });
    $("body").on("change", ".formData input", function () {
        var pid = $(this).closest('.dialogContent').attr("id");
        var nameLength = $(this).val().split('\\').pop().length - 4;
        var name = $(this).val().split('\\').pop().substring(0, nameLength);
        var fullName = $(this).val();
        if ($(this).parent().hasClass("imgForm")) {//图片类型
            upload(pid, "img", name);
        } else if ($(this).parent().hasClass("fileForm")) {//文件类型
            upload(pid, "file", name, undefined, fullName);
        } else if ($(this).parent().hasClass("voiceForm")) {//声音语音类型
            upload(pid, "voice", name);
        }
        $(this).val("");
    });
}

//菜单栏  消息工具栏 鼠标移入操作
function menuColor() {
    var cookie = '';
    $(".menuItem img,.sendToolbar li>img").on('mouseenter', function (event) {
        var src = $(this).attr("src");
        cookie = src;
        var hoverSrc = src.replace(".png", "_sel.png");
        $(this).attr("src", hoverSrc);
    }).mouseout(function (event) {
        $(this).attr("src", cookie);
    });
}

//请求菜单数据
function getMenu() {
    $.ajax({
        type: 'get',
        url: localStorage.url + "/teeMenuGroup/getPrivSysMenu.action",
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (data, textStatus) {
            var json = JSON.parse(data);
            renderMenu(json);
            console.log('获取菜单列表成功！');
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function (data) {
            console.log('获取数据失败！请检查网络后刷新');
        }
    });
}

/*渲染菜单*/
function renderMenu(data) {
    var str1 = '';
    var str2 = '';
    var str3 = '';
    for (var i = 0, l = data.rtData.length; i < l; i++) {
        if (data.rtData[i].menuId.length == 3) {
            str1 = '<li class="appItem appItem-' + data.rtData[i].menuId + ' clearfix" menuCode=' + data.rtData[i].menuCode + '>';
            str1 += '<div class="head clearfix">' +
                '<div class="icon">' +
                '<img  draggable="false" src="' + localStorage.url + "/system/frame/3/icons/" + data.rtData[i].icon + '" alt="">' +
                '</div>' +
                '<p class="title">' + data.rtData[i].menuName + '</p>' +
                '<span class="caret-right caret-set"></span>' +
                '<span class="border"></span>' +
                '</div>' +
                '<div class="body">' +
                '<ul class="appItemList">' +
                '</ul>' +
                '</div>';
            str1 += '</li>';
            $("ul.appList").append(str1);

        } else if (data.rtData[i].menuId.length == 6) {
            var parent = data.rtData[i].menuId.substring(0, 3);
            str2 = '<li class="appItem-1 appItem-' + data.rtData[i].menuId + '" menuCode="' + data.rtData[i].menuCode + '" >' +
                '<span style="width:10px;height:10px;border-radius:50%;display:inline-block;background-color:#1CA5FF;margin-left:24px;margin-top:12px;"></span>' +
                '<p class="itemName">' + data.rtData[i].menuName + '</p>' +
                '</li>';
            $(".appItem-" + parent).find(".appItemList").append(str2);
        } else {
            var parent = data.rtData[i].menuId.substring(0, 6);

            str3 = '<li class="appItem-2" menuCode="' + data.rtData[i].menuCode + '" >' +
                // '<img src="dist/imgs/index/apps/'+data.rtData[i].icon+'" alt="">'+
                '<p class="itemName">' + data.rtData[i].menuName + '</p>' +
                '</li>';
            $(".appItem-" + parent).after(str3);
        }
    }
}


/*组织架构部分*/

$("body").on("mouseover", ".orgList>.clearfix", function () {
    $(this).css("background-color", "#e9f2ff");
    $(this).find(".right").show();
}).on("mouseleave", ".orgList>.clearfix", function () {
    $(this).css("background-color", "#fff");
    $(this).find(".right").hide();
});
$("body").on("click", ".orgStructure .orgTitle", function () {
    var thisSelecter = $(this);
    var classes = thisSelecter.siblings(".orgList").attr("class");
    var clsArr = classes.split(" ");
    var id = clsArr[1].substring(8);
    getOrg(Number(id), function () {
        if (thisSelecter.siblings('.orgList').find("li").length !== 0) {
            if (thisSelecter.hasClass("open")) {
                thisSelecter.find("span").addClass('caret-right').removeClass("caret-down");
                thisSelecter.siblings('.orgList').slideUp();
                thisSelecter.removeClass("open");
            } else {
                thisSelecter.find("span").addClass('caret-down').removeClass("caret-right");
                thisSelecter.siblings('.orgList').slideDown();
                thisSelecter.addClass("open");
            }
        }
    });
});


$("body").on("click", ".org", function () {
    getOrg();
    $(".orgStructure").siblings().hide();
    $(".orgStructure").show();
});

/*组织架构的添加*/
function getOrg(parentId, callback) {
    var callbackfun = callback || function () {
    };
    if (parentId == undefined) {
        parentId = 0;
        url = URL + "/mobileOrgController/getSelectUserTree.action";
    } else {
        url = URL + "/mobileOrgController/getSelectUserTree.action?id=" + parentId;
    }
    var len = $(".orgStructure .orgList-" + parentId).find("li").length;

    if (len === 0) {//判断是否第一次加载
        $.ajax({
            type: 'get',
            url: url,
            beforeSend: function (XMLHttpRequest) {

            },
            success: function (data, textStatus) {
                // $(".orgLoading").remove();
                var json = JSON.parse(data);
                console.log(json);
                renderOrg(json, parentId);
                callbackfun();
                console.log('获取组织结构文件成功！');
            },
            complete: function (XMLHttpRequest, textStatus) {
            },
            error: function (data) {
                console.log('获取数据失败！请检查网络后刷新');
            }
        });
    } else {
        callbackfun();
    }

}

$(".menuItem").click(function (event) {
    getSmsNumber();
});

/**
 * 渲染组织结构的具体节点
 * @param data
 * @param parentId
 */
function renderOrg(data, parentId) {
    var len = $(".orgStructure .orgList-" + parentId).find("li").length;
    var parLength = $(".orgStructure .orgList-" + parentId).parents(".orgList").length;
    if (data.rtData.length === 0) {
        var str = ["<li style='padding:10px 0;text-align:center;'>暂无人员！</li>"];
        $(".orgStructure .orgList-" + parentId).append(str.join(""));
        return;
    }
    if (len === 0) {//判断是否加载过
        for (var i = 0, l = data.rtData.length; i < l; i++) {
            var str = [];
            var onlineStatus = data.rtData[i].online ? "<span style='color:red'>(在线)</span>" : "";
            var avatarSrc = data.rtData[i].ico ? URL + "/attachmentController/downFile.action?id=" + data.rtData[i].ico : "dist/imgs/index/contact/person.png";
            var padLeft = 10 * parLength;
            padLeft = 10 * parLength;
            if (data.rtData[i].type === 'dept') {//是部门的话
                str.push('<li class="orgItem orgItem-' + parLength + '" style="padding-left:' + padLeft + 'px;box-sizing:border-box;">');
                str.push('<p class="orgTitle">');
                str.push('<span class="caret-right"></span>');
                str.push(data.rtData[i].name);
                str.push('</p>');
                str.push('<ul class="orgList orgList-' + data.rtData[i].id + '">');
                str.push('</ul>');
                str.push('</li>');
                $(".orgStructure .orgList-" + parentId).append(str.join(""));
            } else {//是具体的人员
                str.push('<li class="clearfix" style="padding-left:' + padLeft + 'px;box-sizing:border-box;">');
                str.push('<div class="left fl">');
                str.push('<div class="avatar">');
                str.push('<img  draggable="false" src="' + avatarSrc + '" alt="">');
                str.push('</div>');

                str.push('<div userId="' + data.rtData[i].userId + '" id="' + data.rtData[i].id + '" pid="' + data.rtData[i].pid + '" class="orgname">' + data.rtData[i].name + onlineStatus + '</div>');
                str.push('</div>');
                str.push('<div class="right fr">');
                str.push('<span class="oper sendMessage"><img  draggable="false" src="dist/imgs/index/contact/toMessage.png"></span>');
                // str.push('<span class="oper toCall"><img src="dist/imgs/index/contact/toCall.png"></span>');
                str.push('<span class="oper sendEmail"><img  draggable="false" src="dist/imgs/index/contact/toEmail.png"></span>');
                str.push('</div>');
                str.push('</li>');
                $(".orgStructure .orgList-" + parentId).append(str.join(""));
            }
        }

    } else {//加载过 重新设置在线状态
        for (var i = 0, l = data.rtData.length; i < l; i++) {
            var onlineStatus = data.rtData[i].online ? "<span style='color:red'>(在线)</span>" : "";
            $(".orgStructure .orgList-" + parentId).find("div[userid='']")
        }
    }


}


/**
 *获取下消息的数量
 */

function getSmsNumber() {
    $.ajax({
        type: 'post',
        dataType: "json",
        url: localStorage.url + "/mobileSystemAction/getNewPush.action",
        beforeSend: function (XMLHttpRequest) {
        },
        success: function (data, textStatus) {
            if (data.rtState) {
                renderSmsNumber(data);
                setTimeout(getSmsNumber, 5 * 1000);
            }
            console.log('获取消息数量成功！');
        },
        complete: function (XMLHttpRequest, textStatus) {
        },
        error: function (data) {
            console.log('获取数据失败！请检查网络后刷新');
        }
    });

    function renderSmsNumber(data) {
        for (var j in data.rtData) {
            $('.badge-' + j).text(data.rtData[j]);
            if (data.rtData[j] == 0) {
                $('.badge-' + j).hide();
            } else {
                $('.badge-' + j).show();
            }
            if (data.rtData[j].length >= 3) {
                $('.badge-' + j).css({"width": "30px", "border-radius": "50%", "right": "0px"});
                $('.badge-' + j).text("99+");
            }

            if (data.rtData.SMS_TOTAL.length >= 3) {
                $('.badge-SMS_TOTAL').css({
                    "width": "30px",
                    "border-radius": "50%",
                    "right": "0px",
                    "margin-right": "-8px"
                });
            }
        }
    }
}

/*加载通讯录*/
function addContact() {
    var url = localStorage.url + '/teeAddressController/getAddressFullNamListByMobile.action';
    $.ajax({
        type: "post",
        url: url,
        success: function (data) {
            var json = JSON.parse(data);
            if (json.rtState) {
                renderContact(json.rtData);
            } else {
                console.log('获取通讯录失败！请重试！');
            }

        }
    });

    /**
     * 渲染通讯录部分
     * @param rtdata
     */
    function renderContact(rtdata) {
        var str = [];//创建通讯录外部框架
        for (var i = 0, l = rtdata.length; i < l; i++) {
            str.push('<ul class="personList personList-' + rtdata[i].title + '">');
            str.push('<span class="personOrder">' + rtdata[i].title + '</span>');
            for (var j = 0, k = rtdata[i].datas.length; j < k; j++) {//添加内部的数据
                str.push('<li class="personItem ' + rtdata[i].datas[j].sid + '">');
                str.push('<div class="avatar">');
                str.push('<img  draggable="false" src="dist/imgs/index/app/person.png">');
                str.push('</div>');
                str.push('<span class="personItemName">' + rtdata[i].datas[j].name + '</span>');
                str.push('</li>');
            }
            str.push('</ul>');
        }
        $('.scrollContent').html("").append(str.join(''));
    }
}

//删除群组的历史消息
$("body").on("click", ".clearbtn", function () {
    var id = $(this).closest(".dialogContent").attr("id");
    alertBox("确定要清除历史消息吗？清除后不可恢复！", function () {
        IM_ajax("/plugins/zatp?cmd=cleargroupmsg", {
            sessionId: id,
            user: localStorage.userId
        }, function (res) {
            console.log("请求删除历史消息错误：" + res);
        });
        try {
            delLog(id);
            $(".dialogContent" + id).find(".dgbody").empty();
        } catch (err) {
            console.log("数据库删除历史消息错误：" + err);
        }
    });
});
//显示群组
$(".group").find(".head").click(function (event) {
    var windowHeight = $(window).height();
    var height = windowHeight - 236;
    $(".group").find(".body").css({"height": height + "px", "overflow-x": "hidden", "overflow-y": "auto"});
    showAllgroup();
});
//跳转到群组
$(".group").find(".body").on("click", "li", function () {
    var gid = $(this).attr("gid");
    var name = $(this).find(".groupName").text();
    chatInit(gid, name, "group");
});

/*
 *	显示当前登录人所有的群组
 *	(当系统加载和群组解散退出等时调用)
 */
function showAllgroup() {
    IM_ajax("/plugins/zatp?cmd=getrooms", {
        user: localStorage.userId
    }, function (data) {
        $(".group").find(".groupItem").remove();
        if (data.length == 0) {
            var str = '<p style="padding:10px 0;width:100%;text-align:center;">无群组</p>';
            $(".group").find(".body").append(str);
        } else {
            var group = [];
            data.forEach(function (item) {
                group.push('<li gid="' + item.gid + '" class="groupItem">');
                group.push('<div class="avatar">');
                group.push('<img draggable="false" src="dist/imgs/index/apps/group_msg.png">');
                group.push('</div>');
                group.push('<span class="groupName">' + item.name + '</span>');
                group.push('</li>');
            });
            var str = group.join("");
            $(".group").find(".body").append(str);
        }
    });
}

/*
 *	提示框
 */
function alertBox(alertMsg, btnOk, btnCancel) {
    $(".alertBox .alertBoxbody").find("p").text(alertMsg);
    $(".alertBox").find(".btnConfirm").one("click", function () {
        btnOk();
        $(".alertBox").hide();//隐藏遮罩
        $(".body_mask").hide();//隐藏遮罩
    });
    $(".alertBox").find(".btnCancel").one("click", function () {
        btnCancel = btnCancel || function () {
            $(".alertBox").hide();//隐藏遮罩
            $(".body_mask").hide();//隐藏遮罩
        };
        btnCancel();
    });
    $(".body_mask").show();//显示遮罩
    $(".alertBox").show();
    $(".alertBoxClose").one("click", function () {
        $(".body_mask").hide();//隐藏遮罩
        $(".alertBox").hide();
    });
}

$(".clearCacaheBtn").click(function (event) {
    alertBox("清除缓存后需要重新登录,是否继续？", function () {
        localStorage.clear();
        tray1.remove();
        tray1 = null;
        menu1 = null;

        //关闭所有browser进程
        var cp = require('child_process'); //子进程
        cp.exec('taskkill /f /t /im Browser.exe', function () {
            var new_win = gui.Window.get(
                nw.Window.open("./login.html", {
                    "min_width": 960,
                    "min_height": 600,
                    "frame": false
                }, function (new_win) {
                    index_win.close();
                    closedb(function () {
                        var fs = require("fs");
                        var dbFilePath = process.cwd() + "\\chatlog.db";
                        fs.unlink(dbFilePath, function (err) {
                            index_win.close();
                        });
                    });
                })
            );
        });


    });
});