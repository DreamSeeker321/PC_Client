/*
 * 添加选人到已选
 */
$("body").on("change", ".labelForCheck", function (e) {
    var isCheked = $(this).prop("checked");
    var id = $(this).attr("checkId");
    var name = $(this).siblings('.avatarItem').find(".orgname").text();
    if (isCheked) {
        renderSelect("add", name, id);
    } else {
        renderSelect("del", name, id);
    }
});

function renderSelect(type, name, id, icon) {
    switch (type) {
        case "add" : {
            var str = [];
            str.push('<div class="selectedMember avatarList">');
            str.push('<div class="avatar">');
            str.push('<img src="dist/imgs/index/app/person.png" alt="">');
            str.push('</div>');
            if (name.length === 0) {
                str.push('<p checkId="' + id + '" class="selectedName" style="color:#f20000" title="无名称">无名称</p>');
            } else {
                str.push('<p checkId="' + id + '" class="selectedName" title="' + name + '">' + name + '</p>');
            }
            str.push('</div>');
            $(".creatGpChat .gpMember").append(str.join(""));
            break;
        }
        case "del" : {
            var $selected = $(".creatGpChat .gpMember .avatarList");
            for (var i = 0, l = $selected.length; i < l; i++) {
                if ($($selected[i]).find(".selectedName").attr("checkId") == id) {
                    $($selected[i]).remove();
                    break;
                }
            }
            break;
        }
    }
}

//显示创建群组框
$(".addGpChat").click(function () {
    $(".creatGpChat").show();
    getGpOrg("create","","create");
});
$("body").on("click", ".gpdep .orgName", function () {
    var $orgName = $(this);
    var $childList = $orgName.parent().siblings(".orgList");
    var $caret = $orgName.parent().find(".caret-set1");
    var renderTarget = $orgName.closest(".choosePerson").length ? "create" : "addGpMember";
    var id = $childList.attr("orgId");
    getGpOrg(Number(id), function () {
        if ($childList.find("li").length !== 0) {
            if ($orgName.parent().hasClass("open")) {
                $caret.css({"transform": "rotate(0deg)"});
                $childList.slideUp();
                $orgName.parent().removeClass("open");
            } else {
                $caret.css({"transform": "rotate(45deg)", "border-left-color": "#555"});
                $childList.slideDown();
                $orgName.parent().addClass("open");
            }
        }
    },renderTarget);
});

/*
 *获取添加群组讨论的组织架构
 */
function getGpOrg(parentId, callback,renderTarget) {
    var url,len;
    var callbackfun = callback || function () {
        };
    //首次加载 创建群组聊天或添加群成员
    if (parentId == 'create' || parentId == "addGpMember") {
        url = URL + "/mobileOrgController/getSelectUserTree.action";
    } else {
        url = URL + "/mobileOrgController/getSelectUserTree.action?id=" + parentId;
    }
    if(renderTarget == "create"){
        len = $(".choosePerson .orgList-" + parentId).find("li").length;
    }else{
        len = $(".addOrDelMemberWrap .orgList-" + parentId).find("li").length;
    }
    if (len === 0) {
        $.ajax({
            type: 'post',
            url: url,
            beforeSend: function (XMLHttpRequest) {
                // $(".orgList-"+parentId).append('<div style="padding:10px 25px;" class="orgLoading">加载中...</div>');
            },
            success: function (data, textStatus) {
                // $(".orgLoading").remove();
                var json = JSON.parse(data);
                renderGpOrg(json, parentId,renderTarget);
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

/*
 **渲染获取添加群组讨论的组织架构
 */
function renderGpOrg(data, parentId,renderTarget) {
    var $wrap;
    if(renderTarget == "create"){
        $wrap =  $(".choosePerson .orgList-" + parentId);
    }else{
        $wrap =  $(".addOrDelMemberWrap .orgList-" + parentId);
    }
    var len = $wrap.find("li").length;
    var parLength = $wrap.parents(".orgList").length;
    if (data.rtData.length === 0) {
        var str1 = ["<li style='padding:10px 0;text-align:center;'>暂无人员！</li>"];
        $wrap.append(str1.join(""));
        return;
    }
    if (len === 0) {//判断是否加载过
        for (var i = 0, l = data.rtData.length; i < l; i++) {
            var str = [];
            var padLeft = 10 * parLength;
            if (data.rtData[i].type === 'dept') {//部门列表
                str.push('<li class="orgItem orgItem-' + parLength + '" style="padding-left:' + padLeft + 'px;box-sizing:border-box;">');
                str.push('<p class="orgTitle gpdep" parentId=' + data.rtData[i].id + '>');

                // str.push('<input  class="labelForCheck chk_1" type="checkbox" id="'+data.rtData[i].type+data.rtData[i].id +'" />');
                // str.push('<label for="'+data.rtData[i].type+data.rtData[i].id+'"></label>');

                str.push('<span class="caret-right caret-set1"></span>');
                str.push('<span class=\'orgName\'>' + data.rtData[i].name + '</span>');
                str.push('</p>');
                str.push('<ul orgId="' + data.rtData[i].id + '" class="orgList orgList-' + data.rtData[i].id + '">');
                str.push('</ul>');
                str.push('</li>');
                $wrap.append(str.join(""));
            } else {//人员列表
                str.push('<li class="person" style="padding-left:' + padLeft + 'px;box-sizing:border-box;">');
                str.push('<input type="checkbox" checkId="' + data.rtData[i].userId + '" class="labelForCheck chk_1 ' + data.rtData[i].type + data.rtData[i].id + '" />');
                str.push('<label class="checkLabel" checkId="' + data.rtData[i].userId + '" for="' + data.rtData[i].type + data.rtData[i].id + '"></label>');
                str.push('<div class=\'avatarItem\'>');
                str.push('<div class="avatar">');
                str.push('<img src="dist/imgs/index/contact/person.png" alt="">');
                str.push('</div>');
                str.push('<div class="orgname" class="per-' + data.rtData[i].id + '">' + data.rtData[i].name + '</div>');
                str.push('</li>');
                $wrap.append(str.join(""));
            }
        }

    }
}
/*创建群组的时候添加的人员*/
$("body").on("click", ".choosePerson .checkLabel", function () {
    var forName = $(this).attr("for");
    var b = $(this).parent().find("." + forName).prop("checked");
    $(this).parent().find("." + forName).prop("checked", !b);

    var id = $(this).attr("checkId");
    var name = $(this).siblings('.avatarItem').find(".orgname").text();
    if (!b) {
        renderSelect("add", name, id);
    } else {
        renderSelect("del", name, id);
    }
});

/*关闭 添加讨论组*/
$(".closeGpChat").click(function () {
    $(".creatGpChat").hide();
    $(".creatGpChat").find(".gpMember").empty();
    $(".creatGpChat").find(".orgList").empty();
    $(".creatGpChat").find(".gpInput").val("");
});
$("body").on("click", ".labelForCheck", function (e) {
    e.stopPropagation();
});

/*
 *	创建群组点击确认
 */
$("#addGpChat").click(function (event) {
    var gpName = $(".newGpName").next(".gpInput").val();
    var gpAnnouncement = $(".newGpNotice").next(".gpInput").val();
    if (!gpName) {
        gpName = localStorage.userName + "的群组";
    }
    var selectedMember = $(".selectedMember").length;
    var userId = '';
    for (var i = 0; i < selectedMember; i++) {
        userId += $(".selectedMember").eq(i).find(".selectedName").attr("checkId") + ",";
    }
    userId = userId.substring(0, userId.length - 1);
    IM_ajax("/plugins/zatp?cmd=createroom", {
        crUser: USERID,
        name: gpName,
        subject: '',
        description: gpAnnouncement,
        members: userId
    }, function (data) {
        if (data.status) {
            $(".creatGpChat").hide();
            $(".creatGpChat").find(".gpMember").empty();
            $(".creatGpChat").find(".orgList").empty();
            $(".creatGpChat").find(".gpInput").val("");
        }
    });
});