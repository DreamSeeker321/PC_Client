var localVersion = "2017112701";

$(function () {
    makeCenter("loginContent");
    makeCenter("netSetBlock");
    makeCenter("processbar_out");
    makeCenter("upgrade");
    loadLogoImg();
    bindkey();
    remPassword();
    $("#versionDiv").html("ver_" + localVersion);

    // localStorage.removeItem('url');

    // setConfirm.click();//点击ip输入面板的确定 现有的ip
    $(window).resize(function (event) {
        makeCenter('loginContent');
        makeCenter('netSetBlock');
        makeCenter('processbar_out');
        makeCenter('upgrade');
    });

    loadNet();

    //checkVersion();
    autoLogin();
    $("#refreshImg").click();
    setInterval(loginByImg, 3000);
});

var newImg, newCode;

var net = {};
var lastLogin = {};
//设置居中 传入的参数是class,暂时不支持ID
function makeCenter(cls, parent) {
    if (parent === undefined) {
        parent = window;
    }
    var width = $("." + cls).width();
    var height = $("." + cls).height();
    var windowWidth = $(parent).width();
    var windowHeight = $(parent).height();
    // var timestamp = Date.parse(new Date());
    // var zIndex = timestamp/1000;
    $("." + cls).css({top: ((windowHeight - height) / 2 - 20 ) + "px", left: ((windowWidth - width) / 2 ) + "px"});
}

var gui, win, index_win = null;
if (typeof(require) != 'undefined') {
    gui = require('nw.gui');
    win = gui.Window.get();
}
// win.iframe = false;
var tray = new gui.Tray({title: '系统托盘', icon: 'appIcon.png'});
tray.tooltip = '协同办公精灵';
//添加一个菜单
var menu = new gui.Menu();
menu.append(new gui.MenuItem({
    label: '关闭程序',
    click: function () {
        tray.remove();
        tray = null;
        menu = null;
        process.exit(1);
    }
}));
tray.menu = menu;

function bindkey() {

//登录方式点击切换
//   section1 : 用户名密码登陆 section2 : 扫码登陆
    $(".switch").click(function () {
        $("#refreshImg").click();
        if ($(".section1").hasClass("open")) {//用户名密码登录
            $(".section1").removeClass("open").hide();
            $(".section2").addClass("open").show();
            $(".situPassword").show();
            $(".situCode").hide();
        } else {
            $(".section2").removeClass("open").hide();
            $(".section1").addClass("open").show();
            $(".situCode").show();
            $(".situPassword").hide();
        }
    });
//窗口操作
    $("._").click(function () {
        win.minimize();
    });
    $(".maxWin").click(function () {
        win.maximize();
    });
    $(".x").click(function () {
        win.close();
    });

    /*升级提示提醒显示隐藏*/
    $(".upgradeClose").click(function () {
        $(".upgrade").hide();
    });
    $(".upgradeFooter .btnCancel").click(function () {
        $(".upgrade").hide();
        new_win = gui.Window.get(
            nw.Window.open("./index.html", {
                "min_width": 960,
                "min_height": 600,
                "frame": false
            }, function (new_win) {
                tray.remove();
                tray = null;
                menu = null;
                win.close();
            })
        );
    });
    $(".upgrade .btnConfirm").click(function () {
        $("#updatingAppBack").show();
        $("#processbar_out").show();
        downloadAPP();
    });

//点击确定提交数据
    $("#login").click(function () {
        toLogin(1);
    });
    $("body").on("keyup", "#username,#password", function (e) {
        if (e.keyCode == 13) {
            toLogin(1);
        }
    });
//网络选择
    //下拉
    $(".selectMenu").click(function (e) {
        $(".selectNet").hide();
        $(".netContent").show();
        $(".netGroup").show();
        e.stopPropagation();
    });
    //收起
    $(".netContent").click(function (e) {
        $(".netContent").hide();
        $(".netGroup").hide();
    });
    //点击其他位置收起 （错误）
    $("body").click(function (e) {
        $(".selectNet").show();
        $(".netContent").hide();
        $(".netGroup").hide();
    });
    //点击选择网络

    $('.netGroup li').click(function (event) {
        if ($(this).text() != "空") {
            var name = $(this).text();
            var netNumber = $(this).index() + 1;

            $(".selectNet .selectMenu").text(name.substr(0, 5) + "...");
            $(".selectNet .selectMenu").attr("selectedIp", "net" + netNumber);

            var net = localStorage.getItem('net');
            var netId = $(".selectNet .selectMenu").attr("selectedIp");
            // if(netNumber == undefined){
            // 	console.log("请选择网址！");
            // 	return;
            // }
            net = JSON.parse(net);

            var curNet = net[netId];

            var imUrl, _imip, _import, nohttp;
            if (net.IM.ip !== '') {//如果im的ip地址不为空
                // _imip = net.IM.ip;
                nohttp = removeHttp(net.IM.ip);
                if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
                    _imip = "https://" + nohttp;
                    _import = ":9091";
                } else {
                    _imip = "http://" + nohttp;
                    _import = ":9090";
                }
            } else {//如果im的ip地址为空，则使用的是oa的地址
                var oaIp = removeHttp(curNet.ip);
                if (oaIp.indexOf(":") !== -1) {//OA有端口号
                    if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
                        _imip = "https://" + oaIp.substring(0, oaIp.indexOf(":"));
                        _import = ":9091";
                    } else {
                        _imip = "http://" + oaIp.substring(0, oaIp.indexOf(":"));
                        _import = ":9090";
                    }

                } else {
                    if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
                        _imip = "https://" + oaIp;
                        _import = ":9091";
                    } else {
                        _imip = "http://" + oaIp;
                        _import = ":9090";
                    }
                }
            }
            imUrl = _imip + _import;
            localStorage.setItem("imUrl", imUrl);
            lastLogin = {
                netId: netId,
                name: net[netId].name,
                ip: net[netId].ip
            };
            /*存入到上次登录选择里 方便下次登录直接调用*/
            lastLogin = JSON.stringify(lastLogin);
            localStorage.setItem("lastLogin", lastLogin);

            var localUrl = net[netId].ip;
            // localStorage.url = localStorage.getItem(name);
            localStorage.url = localUrl;
            $("#refreshImg").click();

        } else {
            alert("请选择有效的地址或在输入设置界面填入新地址!");
        }
    });


//点击自动登录勾选记住密码
    if (localStorage.autoLogin == 'true') {
        $("#autoLogin").prop("checked", true);
        $("#remPassword").prop("checked", true);
    } else {
        $("#autoLogin").prop("checked", false);
    }
    $("#autoLogin").click(function (event) {
        var isAutoLogin = $(this).prop("checked");
        localStorage.autoLogin = isAutoLogin;
        if (isAutoLogin) {
            $("#remPassword").prop("checked", "true");
        }
    });

    /*记住密码和自动登录*/
    var remPwd = localStorage.isRemenber;
    var autoLog = localStorage.isRemenber;
    if (remPwd == 'true') {
        $("#remPassword").prop("checked", true);
    } else {
        $("#remPassword").removeAttr('checked');
    }
    // if(autoLog=='true'){
    // 	$("#autoLogin").prop("checked",true);
    // }else{
    // 	$("#autoLogin").removeAttr('checked');
    // }

//设置界面的显示和隐藏
    $(".netSet").click(function () {//显示
        $(".netSetBlock").slideDown();
    });

    $(".closeSet").click(function () {//隐藏
        $(".netSetBlock").slideUp();
    });

//返回密码登录
    $(".loginByPsd").click(function (event) {
        $(".section2").removeClass("open").hide();
        $(".section1").addClass("open").show();
        $(".situCode").show();
        $(".situPassword").hide();
    });
}

$("#refreshImg").click(function (event) {
    newImg = new GUID();
    newCode = newImg.newGUID();

    var net = localStorage.getItem('net');
    var netNumber = $(".selectNet .selectMenu").attr("selectedIp");

    net = JSON.parse(net);

    lastLogin = {
        netId: netNumber,
        name: net[netNumber].name,
        ip: net[netNumber].ip
    };
    /*存入到上次登录选择里 方便下次登录直接调用*/
    lastLogin = JSON.stringify(lastLogin);
    localStorage.setItem("lastLogin", lastLogin);

    var localUrl = net[netNumber].ip;
    localStorage.url = localUrl;

    $("#codeImg").attr("src", localStorage.url + "/systemAction/qrCodeLoginImage.action?guid=" + newCode);

});


//设置网络点击确定
$(".setConfirm input").click(function () {
    //过滤输入的中文冒号和设置网络的名称
    var net1_name = $(".netSelect1 .net").find("input").val();
    var net1_ip = $(".netSelect1 .IpAddr").find("input").val();
    if (net1_name != '' && net1_ip != '') {
        var reged_ip1 = regIp(net1_ip);
        var removedIp1 = removeHttp(reged_ip1);
        $(".netSelect1 .IpAddr").find("input").val(removedIp1);
        $('.ip1').text(net1_name);
    } else {
        $('.ip1').text("空");
    }


    var net2_name = $(".netSelect2 .net").find("input").val();
    var net2_ip = $(".netSelect2 .IpAddr").find("input").val();
    if (net2_name != '' && net2_ip != '') {
        var reged_ip2 = regIp(net2_ip);
        var removedIp2 = removeHttp(reged_ip2);
        $(".netSelect2 .IpAddr").find("input").val(removedIp2);
        $('.ip2').text(net2_name);
    } else {
        $('.ip2').text("空");
    }

    var net3_name = $(".netSelect3 .net").find("input").val();
    var net3_ip = $(".netSelect3 .IpAddr").find("input").val();
    if (net3_name != '' && net3_ip != '') {
        var reged_ip3 = regIp(net3_ip);
        var removedIp3 = removeHttp(reged_ip3);
        $(".netSelect3 .IpAddr").find("input").val(removedIp3);
        $('.ip3').text(net3_name);
    } else {
        $('.ip3').text("空");
    }


    var net4_name = $(".netSelect4 .net").find("input").val();
    var net4_ip = $(".netSelect4 .IpAddr").find("input").val();
    if (net4_name != '' && net4_ip != '') {
        var reged_ip4 = regIp(net4_ip);
        var removedIp4 = removeHttp(reged_ip4);
        $(".netSelect4 .IpAddr").find("input").val(removedIp4);
        $('.ip4').text(net4_name);
    } else {
        $('.ip4').text("空");
    }

    var im_Ip = $(".port .im1 .left2").find("input").val();
    var im_port = $(".port .im2 .left2").find("input").val();
    var im_check = $(".checkboxDiv .ssl_checkbox .left2").find("input").prop("checked");

    // for(var k=1,l=5;k<l;k++){
    // 	if( $(".netSelect"+k+" .net").find("input").val() == undefined && $(".netSelect2 .IpAddr").find("input").val() !== undefined){
    // 		$(".netSelect"+k+" .net").find("input").parent().append('<span style="color:red">必填</span>')
    // 	}
    // 	if( $(".netSelect"+k+" .net").find("input").val() == undefined && $(".netSelect2 .IpAddr").find("input").val() != undefined){
    // 		$(".netSelect"+k+" .net").find("input").parent().append('<span style="color:red">必填</span>')
    // 	}
    // }
    net = {
        net1: {name: net1_name, ip: reged_ip1},
        net2: {name: net2_name, ip: reged_ip2},
        net3: {name: net3_name, ip: reged_ip3},
        net4: {name: net4_name, ip: reged_ip4},
        IM: {ip: im_Ip, port: im_port, check: im_check}
    };

    var net1 = JSON.stringify(net);
    localStorage.setItem("net", net1);
    $(".netSetBlock").slideUp();
    // var net_temp = localStorage.getItem("net");
    // net_temp = JSON.parse(net_temp);
    var netId = $(".selectMenu").attr("selectedip");
    if (netId == undefined) {
        return;
    }
    var curNet = net[netId];
    // var _netIp = net_temp[netSelected].ip;
    // if(im_Ip == "" || im_port == ""){
    // 	im_Ip = _netIp;
    var imUrl, _imip, _import, nohttp;
    if (net.IM.ip !== '') {//如果im的ip地址不为空
        // _imip = net.IM.ip;
        nohttp = removeHttp(net.IM.ip);
        if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
            _imip = "https://" + nohttp;
            _import = ":9091";
        } else {
            _imip = "http://" + nohttp;
            _import = ":9090";
        }
    } else {//如果im的ip地址为空，则使用的是oa的地址
        var oaIp = removeHttp(curNet.ip);
        if (oaIp.indexOf(":") !== -1) {//OA有端口号
            if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
                _imip = "https://" + oaIp.substring(0, oaIp.indexOf(":"));
                _import = ":9091";
            } else {
                _imip = "http://" + oaIp.substring(0, oaIp.indexOf(":"));
                _import = ":9090";
            }

        } else {
            if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
                _imip = "https://" + oaIp;
                _import = ":9091";
            } else {
                _imip = "http://" + oaIp;
                _import = ":9090";
            }
        }
    }

    imUrl = _imip + _import;
    localStorage.setItem("imUrl", imUrl);
    // 	im_port = net_temp.IM.port;

    // }


});

var isLoginBtnTab = false;
/*
 * 登录
 */
function toLogin(type, idAndPwd) {

    if (isLoginBtnTab) {
        return;
    }

    isLoginBtnTab = true;

    var username = $("#username").val();
    var password = $("#password").val();
    var isRemenber = $('#remPassword').prop("checked");
    var autoLogin = $('#autoLogin').prop("checked");

    var net = localStorage.getItem('net');
    var netNumber = $(".selectNet .selectMenu").attr("selectedIp");
    if (netNumber == undefined) {
        alert("请选择网址！");
        isLoginBtnTab = false;
        return;
    }
    net = JSON.parse(net);

    lastLogin = {
        netId: netNumber,
        name: net[netNumber].name,
        ip: net[netNumber].ip
    };
    /*存入到上次登录选择里 方便下次登录直接调用*/
    lastLogin = JSON.stringify(lastLogin);
    localStorage.setItem("lastLogin", lastLogin);

    var localUrl = net[netNumber].ip;
    // localStorage.url = localStorage.getItem(name);
    localStorage.url = localUrl;

    var url = localStorage.url;
    if (type == 1) {
        var para = {
            userName: username, pwd: password
        };
    } else {
        var para = {
            userName: idAndPwd.id, pwdCrypt: idAndPwd.pwd
        }
    }
    if (url != null) {
        $.post(url + '/mobileSystemAction/doLoginIn.action?qDevice=PC',
            para,
            function (data, textStatus, xhr) {
                var responseData = JSON.parse(data);
                if (responseData.rtState) {
                    localStorage.userId = responseData.rtData.userId;
                    localStorage.userName = responseData.rtData.userName;
                    localStorage.JSESSIONID = responseData.rtData.JSESSIONID;
                    // localStorage.lastestVersion = responseData.rtData.currVersion4PC ;
                    if (isRemenber) {//判断是否勾选记住密码
                        localStorage.password = password;
                        localStorage.isRemenber = isRemenber;
                    } else {
                        localStorage.removeItem("password");
                        localStorage.isRemenber = false;
                    }
                    if (autoLogin) {
                        localStorage.autoLogin = true;
                    } else {
                        localStorage.autoLogin = false;
                    }
                    localStorage.title = responseData.rtData.appTitle;
                    localStorage.imPic = responseData.rtData.imPic;

                    var notLastest = checkVersion(responseData.rtData.currVersion4PC);
                    if (notLastest) {
                        isLoginBtnTab = false;
                        return;
                    }

                    isLoginBtnTab = false;
                    new_win = gui.Window.get(
                        nw.Window.open("./index.html", {
                            "min_width": 960,
                            "min_height": 600,
                            "frame": false
                        }, function (new_win) {
                            tray.remove();
                            tray = null;
                            menu = null;
                            win.close();
                        })
                    );

                } else {
                    alert("您输入的用户名或密码错误!");
                    isLoginBtnTab = false;
                }
            });
    } else {
        alert('请选择登录地址');
        isLoginBtnTab = false;
    }
}
//设置记住密码
function remPassword() {
    var isRemenber = $('#remPassword').prop("checked");
    if (localStorage.isRemenber) {
        $("#username").val(localStorage.userId);
        $("#password").val(localStorage.password);
    }
    $("#username").val(localStorage.userId);
}

//设置自动登录
function autoLogin() {
    var isAutoLogin = localStorage.autoLogin;
    if (isAutoLogin == "true") {
        $("#username").val(localStorage.userId);
        $("#password").val(localStorage.password);
        toLogin(1);
    }
}

function loadSet() {
    var ip1 = localStorage.net1_name;
    var ip2 = localStorage.net2_name;
    var ip3 = localStorage.net3_name;
    var ip4 = localStorage.net4_name;

    if (ip1 != '' && ip1 != undefined) {
        $("ip1").text(ip1);
    }
    if (ip2 != '' && ip2 != undefined) {
        $("ip2").text(ip2);
    }
    if (ip3 != '' && ip3 != undefined) {
        $("ip3").text(ip3);
    }
    if (ip4 != '' && ip4 != undefined) {
        $("ip4").text(ip4);
    }

}

/*
 *   验证ip是否符合要求
 *   针对是否是加密方式验证

 */
function regIp(ip) {
    var regFilter = /:/;
    var newIp = '';
    var filtered = ip.replace(/：/g, ":");
    if ($(".checkboxDiv .left2").find("input").prop('checked')) {//开启https加密
        if (filtered.indexOf("http://") == -1 && filtered.indexOf("https://") == -1) {//不含有含有http://或https
            newIp = "https://" + filtered;
        } else if (filtered.indexOf("http://") != -1) {//含有http
            newIp = filtered.replace(/http/, "https");
        } else {
            newIp = ip;
        }

    } else {//关闭https加密  如果地址栏写https，过滤
        if (filtered.indexOf("http://") == -1 && filtered.indexOf("https://") == -1) {//不含有含有http://或https://   存在无视
            newIp = "http://" + filtered;
        } else {//有http 可能http可能https
            if (filtered.indexOf("https://") != -1) {
                newIp = filtered.replace(/https/, "http");
            } else {
                newIp = filtered;
            }
        }
    }

    return newIp;
}


function removeHttp(value) {
    if (value.indexOf("https://") != -1) {
        var removed = value.replace("https://", "");
        return removed;
    } else {
        var removed = value.replace("http://", "");
        return removed;
    }
}

function loadNet() {

    var net = localStorage.getItem('net');
    if (net != null) {
        net = JSON.parse(net);
        for (var i = 1; i < 4; i++) {
            if (net["net" + i].name != null && net["net" + i].ip != null) {
                $(".netSelect" + i).find('.net').find('input').val(net["net" + i].name);//填入名称
                $(".netSelect" + i).find('.IpAddr').find('input').val(net["net" + i].ip);//填入IP
            }
        }
        $(".port .im1 .left2").find("input").val(net["IM"].ip);
        $(".port .im2 .left2").find("input").val(net["IM"].port);
        $(".checkboxDiv .left2").find("input").prop("checked", net["IM"].check);
    }

    $(".setConfirm input").click();
    if (localStorage.lastLogin != null) {
        var lastLogin = localStorage.getItem('lastLogin');
        lastLogin = JSON.parse(lastLogin);

        var netName = lastLogin.name;

        $('.selectMenu').text(netName);
        $('.selectMenu').attr("selectedIp", lastLogin.netId);
    }
}


function GUID() {
    this.date = new Date();
    /* 判断是否初始化过，如果初始化过以下代码，则以下代码将不再执行，实际中只执行一次 */
    if (typeof this.newGUID != 'function') {   /* 生成GUID码 */
        GUID.prototype.newGUID = function () {
            this.date = new Date();
            var guidStr = '';
            sexadecimalDate = this.hexadecimal(this.getGUIDDate(), 16);
            sexadecimalTime = this.hexadecimal(this.getGUIDTime(), 16);
            for (var i = 0; i < 9; i++) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            guidStr += sexadecimalDate;
            guidStr += sexadecimalTime;
            while (guidStr.length < 32) {
                guidStr += Math.floor(Math.random() * 16).toString(16);
            }
            return this.formatGUID(guidStr);
        }
        /* * 功能：获取当前日期的GUID格式，即8位数的日期：19700101 * 返回值：返回GUID日期格式的字条串 */
        GUID.prototype.getGUIDDate = function () {
            return this.date.getFullYear() + this.addZero(this.date.getMonth() + 1) + this.addZero(this.date.getDay());
        }
        /* * 功能：获取当前时间的GUID格式，即8位数的时间，包括毫秒，毫秒为2位数：12300933 * 返回值：返回GUID日期格式的字条串 */
        GUID.prototype.getGUIDTime = function () {
            return this.addZero(this.date.getHours()) + this.addZero(this.date.getMinutes()) + this.addZero(this.date.getSeconds()) + this.addZero(parseInt(this.date.getMilliseconds() / 10));
        }
        /* * 功能: 为一位数的正整数前面添加0，如果是可以转成非NaN数字的字符串也可以实现 * 参数: 参数表示准备再前面添加0的数字或可以转换成数字的字符串 * 返回值: 如果符合条件，返回添加0后的字条串类型，否则返回自身的字符串 */
        GUID.prototype.addZero = function (num) {
            if (Number(num).toString() != 'NaN' && num >= 0 && num < 10) {
                return '0' + Math.floor(num);
            } else {
                return num.toString();
            }
        }
        /*  * 功能：将y进制的数值，转换为x进制的数值 * 参数：第1个参数表示欲转换的数值；第2个参数表示欲转换的进制；第3个参数可选，表示当前的进制数，如不写则为10 * 返回值：返回转换后的字符串 */
        GUID.prototype.hexadecimal = function (num, x, y) {
            if (y != undefined) {
                return parseInt(num.toString(), y).toString(x);
            }
            else {
                return parseInt(num.toString()).toString(x);
            }
        }
        /* * 功能：格式化32位的字符串为GUID模式的字符串 * 参数：第1个参数表示32位的字符串 * 返回值：标准GUID格式的字符串 */
        GUID.prototype.formatGUID = function (guidStr) {
            var str1 = guidStr.slice(0, 8) + '-', str2 = guidStr.slice(8, 12) + '-', str3 = guidStr.slice(12, 16) + '-', str4 = guidStr.slice(16, 20) + '-', str5 = guidStr.slice(20);
            return str1 + str2 + str3 + str4 + str5;
        }
    }
}

newImg = new GUID();
newCode = newImg.newGUID();
/**
 * 获取二维码登录图片
 */
function loginByImg() {
    if (localStorage.url != '') {
        $.ajax({
            type: "post",
            url: localStorage.url + "/systemAction/qrCodeLoginCheck.action",
            data: {
                guid: newCode
            },
            dataType: "json",
            success: function (data) {
                if (data.rtState) {
                    var id = data.rtData.userId;
                    var pwd = data.rtData.pwdCrypt;
                    var idAndPwd = {
                        id: id,
                        pwd: pwd
                    };
                    toLogin(2, idAndPwd);
                }
            },
            error: function (err) {
                console.log("获取二维码登录图片失败：" + err);
            }
        });

    }
}

function IM_ajax(url, para, callback) {
    $.ajax({
        type: "post",
        url: localStorage.imUrl + url,
        data: para,
        dataType: "json",
        headers: {
            Accept: "application/json; charset=utf-8"
        },
        success: function (data) {

            callback && callback(data);
        },
        error: function (err) {
            console.log("IM_ajax请求错误：" + err);
        }
    });
}

/*扫码图片错误*/
function imgErr() {
    alert("扫码登录地址错误或不可用！");
    if ($("#codeImg").attr("src").indexOf("undefined") == -1) {
        //console.log("请检查网络地址是否可用!");
    }
}

/*
 *	检测自动升级
 */
function checkVersion(lastestVersion) {
    if (localVersion < lastestVersion) {//需要升级
        $(".upgrade").show();
        return true;
    }
}

/*切换登录页图标*/
function loadLogoImg() {
    var imPic = localStorage.getItem("imPic");
    if (imPic === undefined || imPic == "undefined" || imPic === "" || imPic === null) {
        return;
    } else {
        $(".logoImg").attr("src", imPic + '.png');
        downloadLogoImg(imPic);
    }
}

function fsExistsSync(path) {
    var fs = require('fs');
    try {
        fs.accessSync(path);
    } catch (e) {
        return false;
    }
    return true;
}

/*下载logo图片并设置logo图片*/
function downloadLogoImg(imPic) {
    var fs = require('fs');
    var request = require('request');
    var progress = require('request-progress');
    var isExist = fsExistsSync(process.cwd() + "/" + imPic + ".png");
    if (isExist) {
        $(".logoImg").attr("src", "./" + localStorage.imPic + '.png');
        return;
    }
    // The options argument is optional so you can omit it
    progress(request(localStorage.url + '/imAttachment/downFile.action?id=' + imPic + '&vt=' + new Date().getTime()), {
        // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
        // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
        // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
    })
        .on('progress', function (state) {
            // The state is an object that looks like this:
            // {
            //     percent: 0.5,               // Overall percent (between 0 to 1)
            //     speed: 554732,              // The download speed in bytes/sec
            //     size: {
            //         total: 90044871,        // The total payload size in bytes
            //         transferred: 27610959   // The transferred payload size in bytes
            //     },
            //     time: {
            //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
            //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
            //     }
            // }
            //console.log('progress', state);
        })
        .on('error', function (err) {
            // Do something with err
        })
        .on('end', function () {
            // Do something after request finishes
            $(".logoImg").attr("src", localStorage.imPic + '.png');
        })
        .pipe(fs.createWriteStream(localStorage.imPic + '.png'));
}
/*点击确定之后下载升级*/
function downloadAPP() {
    var fs = require('fs');
    var request = require('request');
    var progress = require('request-progress');

    // The options argument is optional so you can omit it
    progress(request(localStorage.url + '/appupdate/im/PC_Setup.exe'), {
        // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
        // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
        // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
    })
        .on('progress', function (state) {
            var percent = state.size.transferred / state.size.total * 1000;
            percent = Math.floor(percent) / 10;
            $("#currentProcess").text(percent + "%");
            $("#processbar_in").css("width", percent + "%");
        })
        .on('error', function (err) {
            // Do something with err
        })
        .on('end', function () {
            // Do something after request finishes
            // fs.open("./PC_Update.exe","r",function(err){
            // 	console.log(err);
            // });
            $("#currentProcess").text("100%");
            $("#processbar_in").css("width", "100%");
            $("#process_title").text("下载完成,正在解压...");
            gui.Shell.openItem(process.cwd() + "/PC_Setup.exe");
            gui.App.quit();
        })
        .pipe(fs.createWriteStream("PC_Setup.exe"));
}

/**
 * 重置本地数据 情况db文件
 */
function reset() {
    if (window.confirm("确定要重置本地数据吗？")) {
        var fs = require("fs");
        var dbFilePath = process.cwd() + "\\chatlog.db";
        fs.unlink(dbFilePath, function (err) {
            alert("已清空完毕");
        });
    }
}