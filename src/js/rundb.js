var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chatlog.db');

//获取要存入的数据
var USERID = localStorage.userId;

//创建表格
db.serialize(function () {
    // 创建表格
    var dbstr = 'CREATE TABLE IF NOT EXISTS im_message_' + USERID + ' ( '
        + 'id        INTEGER  default null,'
        + 'type      INT( 11 ),'
        + 'fromId   VARCHAR( 32 ),'
        + 'fromName VARCHAR( 100 ),'
        + 'toId     VARCHAR( 32 ),'
        + 'toName   VARCHAR( 100 ),'
        + 'content   TEXT,'
        + 'time      DATETIME,'
        + 'flag      INT( 11 ),'
        + 'userId   VARCHAR( 255 ),'
        + 'sessionId   VARCHAR( 255 ),'
        + 'session_name   VARCHAR( 255 ),'
        + 'timestamp integer,'
        + 'sendFlag integer,'
        + 'guid VARCHAR( 32 ),'
        + 'ico INT(11),'
        + 'filePath   VARCHAR( 255 )'
        + ')';
    db.run(dbstr);

    var str = "CREATE UNIQUE INDEX IF NOT EXISTS im_message_index_" + USERID + " ON im_message_" + USERID + " (id COLLATE BINARY ASC)";
    db.run(str);

    //创建会话列表表
    var listDatabase = 'create table if not exists session_' + USERID + ' ( '
        + 'sessionId  varchar(255) primary key,'
        + 'type  int(11),'
        + 'name  varchar(255),'
        + 'content  varchar(255),'
        + 'unread  int(11),'
        + 'top  varchar(255),'
        + 'timestamp  int(15),'
        + 'ico  varchar(255)'
        + ')';
    db.run(listDatabase, function (e) {
        console.log(e);
    });
});

/**
 * 会话列表-未读信息数量自动增加1
 */
function autoAdd(msgModel, callback) {
    db.run("update session_" + USERID + " set unread = unread + 1,content = '" + msgModel.content + "',ico = '" + msgModel.ico + "', timestamp = " + msgModel.timestamp + " where sessionId = '" + msgModel.sessionId + "'", function (err) {
        if (err) {
            console.log("未读信息数量自动增加1 err:" + err);
        } else {
            callback && callback();
        }
    });
}

/**
 * 发送消息写入数据库后更新session表
 * @param msgModel 消息模板
 * @param callback
 */
function updateSession(msgModel, callback) {
    var str;
    if (msgModel.fromId == USERID) {
        str = "update session_" + USERID + " set content = '" + msgModel.content + "', timestamp = " + msgModel.timestamp + " where sessionId = '" + msgModel.sessionId + "'";
    } else {
        str = "update session_" + USERID + " set content = '" + msgModel.content + "',ico = '" + msgModel.ico + "', timestamp = " + msgModel.timestamp + " where sessionId = '" + msgModel.sessionId + "'";
    }
    db.run(str, function (err) {
        if (err) {
            console.log("发送消息更新session表 err:");
            console.log(err);
        } else {
            callback && callback();
        }
    });
}

/**
 * 设置消息列表置顶
 * @param sessionId
 * @param status 0-不置顶 1-置顶
 */
function setTopSession(sessionId, status, calllback) {
    db.run("update session_" + USERID + " set top = " + status + " where sessionId = '" + sessionId + "'", function (err) {
        if (err) {
            console.log("置顶消息错误:");
            console.log(err);
        } else {
            calllback && calllback();
        }
    });
}

/**
 * 会话列表-重置未读消息为0
 */
function resetUnread(sessionId, callback) {
    db.run("update session_" + USERID + " set unread = 0 where sessionId = '" + sessionId + "'", function (err) {
        if (err) {
            console.log("重置未读消息出错");
        } else {
            callback && callback();
        }
    });
}

/*添加数据*/
function addChatLog(obj, callback) {
    //判断sessionId
    if (!setIdName(obj)) {
        return;
    }
    db.run("insert into im_message_" + USERID + " (id, type, fromId, fromName, toId, toName, content,time,flag,userId,sessionId,session_name,timestamp,sendFlag,guid,ico) values(?, ?, ?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?)",
        [obj.id, obj.type, obj.fromId, obj.fromName, obj.toId, obj.toName, obj.content, obj.time, obj.flag, obj.userId, obj.sessionId, obj.sessionName, obj.timestamp, obj.sendFlag, obj.guid, obj.ico],
        function (err) {
            if (err) {
                console.log('fail on add ' + err);
            } else {
                //如果是未发送的消息 不存储到会话表中
                if(obj.sendFlag == MES_UNSENT){
                    return;
                }
                //更新会话表
                saveOrUpdateSessionList(obj, function (err) {
                    if (err) {
                        console.log("更新数据错误！");
                        console.log(err);
                    } else {
                        callback && callback();
                    }
                });
            }
        });
}

/**
 * 新建或更新会话
 * @param msgModel
 * @param callback
 */
function saveOrUpdateSessionList(msgModel, callback) {
    var insertData = "'" + msgModel.sessionId + "'" + "," + msgModel.type + "," + "'" + msgModel.sessionName + "'" + "," + "'" + msgModel.content + "'" + ",1,0," + msgModel.timestamp + "," + msgModel.ico;
    var str = "insert into session_" + USERID + " (sessionId,type,name,content,unread,top,timestamp,ico) values (" + insertData + ")";
    db.run(str, function (err, row) {
        if (err) {//更新未读数和更新ico
            //接收的消息  自动刷新数据库的值
            if (msgModel.newMes == true) {
                autoAdd(msgModel, function () {
                    callback && callback();
                });
            } else {//不是接收的消息 发送的消息或者是历史消息
                updateSession(msgModel, function () {
                    callback && callback();
                });
            }
        } else {
            callback && callback();
        }
    })
}

//更新数据----
function updateChatLog(obj, callback) {
    if (!setIdName(obj)) {
        return;
    }
    var runStr = "update im_message_" + USERID + " set content = '" + obj.content + "', type = " + obj.type + ", sendFlag = " + obj.sendFlag + ", id = " + obj.id + ", ico = " + obj.ico + " where guid = '" + obj.guid + "'";
    db.run(runStr, function (err) {
            if (err) {
                console.log('fail on updating table ');
                console.log(err);
            } else {
                saveOrUpdateSessionList(obj, function (err) {
                    if (err) {
                        console.log("更新数据错误！");
                        console.log(err);
                    } else {
                        callback && callback();
                    }
                });
            }
        });
}

//获取本地会话列表
function getChatList(callback) {
    var sessionList = "select * from session_" + USERID + " order by top desc,timestamp desc";
    db.all(sessionList, function (err, rows) {
        if (err) {
            console.log(err);
        } else {
            if (rows.length) {
                callback(rows);
            }
        }
    });
}

/*
 *  获取本地存储的聊天记录---单聊
 *  一次只取10条
 *  渲染到聊天界面里面
 */
function getSingleChatLog(sessionId, msgId, callback) {
    var runStr = "select * from im_message_" + USERID + " where id <='" + msgId + "' AND sessionId = '" + sessionId + "' order by timestamp desc limit 0,15 ";
    db.all(runStr, function (err, rows) {
        var newRow = rows.reverse();
        try {
            callback(rows);
        } catch (e) {
            console.log("catch " + e);
        }
    });
}

/*
 *   获取单个会话的消息最大值
 */
function getSessionMaxId(sessionId, callback) {//debugger;
    var runStr = "select max(id) as maxid from im_message_" + USERID + " where sessionId=\"" + sessionId + "\"";
    db.all(runStr, function (err, rows) {
        if (rows[0].maxid != null) {
            callback(rows[0].maxid);
        } else {//数据库没有，直切返回最大值
            callback(999999);
        }
    });
}

/*
 *   获取单个会话的消息最小值
 */
function getSessionMinId(sessionId, callback) {
    var runStr = "select min(id) as minid from im_message_" + USERID + " where sessionId=\"" + sessionId + "\"";
    db.all(runStr, function (err, rows) {
        if (rows !== null) {
            callback(rows[0].minid);
        } else {//数据库没有，直切返回最小值
            callback(999999);
        }
    });
}

/**
 * 获取全局的最大消息ID
 **/
function getGlobalMaxMsgId(callback) {
    var runStr = "select max(id) as maxid from im_message_" + USERID + " where fromId !='" + USERID + "'";
    db.all(runStr, function (err, rows) {
        if (rows[0].maxid !== null) {
            callback(rows[0].maxid);
        } else {
            callback(0);
        }
    });
}


/**
 * 设置消息发送状态
 * @param guid
 * @param status 0-发送中 1-已发送 2-未发送
 */
function setMessageStatus(guid, status) {
    var str = "update  im_message_" + USERID + " set sendFlag = " + status + " where guid = " + guid;
    db.run(str, function (err, rows) {
        console.log(err);
    });
}

function getHDImgSrc(sessionId, callback) {
    var runStr = "UPDATE * from im_message_" + USERID + " where sessionId = '" + sessionId + "' and content like '[IMG%' order by id asc limit 0,15 ";
    db.all(runStr, function (err, rows) {
        if (err) {
            console.log(err);
        } else {
            return rows;
        }
    });
}

function closedb(callback) {
    db.close();
    if (callback) {
        callback();
    }
}

/*
 *   设置文件已经下载
 */
function setFileDownloaded(guid, path, callback) {
    db.run("UPDATE im_message_" + USERID + " SET filePath = '" + path + "' WHERE guid = $guid", {
        $guid: guid
    }, function (err) {
        if (err) {
            console.log("err:" + err);
        } else {
            callback && callback();
        }
    });
}

/*
 *   获取文件的路径
 */
function getFilePath(msgId, callback) {
    var runStr = "select filePath from im_message_" + USERID + " where guid ='" + msgId + "'";
    db.all(runStr, function (err, rows) {
        if (rows[0].filePath !== null) {
            callback(rows[0].filePath);
        } else {
            callback(null);
        }
    });
}

/*
 *   删除聊天记录
 */
function delLog(sessionId, callback) {
    db.run("delete from im_message_" + USERID + " where sessionId = '" + sessionId + "'",
        {}, function (err) {
            if (err) {
                console.log("删除聊天记录出错：");
                console.log(err);
            } else {
                callback && callback();
            }
        }
    );
}
/**
 * 删除会话
 * @param sessionId
 * @param callback
 */
function delSession(sessionId, callback) {
    db.run("delete from session_" + USERID + " where sessionId = '" + sessionId + "'",
        {}, function (err) {
            if (err) {
                console.log("删除会话出错:");
                console.log(err);
            } else {
                callback && callback();
            }
        }
    );
}
/**
 * 更新
 */
function updateSessionIco() {

}


/**
 * 判断谁是sessionID，谁是sessionName
 * @param obj
 * @obj {}  返回设置好sessionId和sessionName的值
 */
function setIdName(obj) {
    if (obj) {
        if (obj.type == 1) {//单聊
            if (obj.fromId == USERID) {
                obj.sessionId = obj.toId;
                obj.sessionName = obj.toName
            } else {
                obj.sessionId = obj.fromId;
                obj.sessionName = obj.fromName
            }
        } else {//组聊
            obj.sessionId = obj.toId;
            obj.sessionName = obj.toName;
        }
        obj.timestamp || (obj.timestamp = new Date().getTime());
        obj.guid || (obj.guid = guid());
        obj.ico || (obj.ico = 0);
        return obj;
    } else {
        return false;
    }

}

/**
 * 删除单条记录
 */
function delSingleLog(guid,callback){
    var delStr = "delete from im_message_" + USERID + " where guid = '" + guid + "'";
    db.run(delStr,function(err){
        if(err){
            console.log("删除单条消息出错");
            console.log(err);
        }else{
            callback && callback();
        }
    })
}

function updateGroupName(sessionId, groupName, callback) {
    var dbStr1 = "update im_message_" + USERID + " set toName = '" + groupName + "' , session_name = '" + groupName + "' where sessionId = '" + sessionId + "'";
    var dbStr2 = "update session_" + USERID + " set name = '" + groupName + "' where sessionId = '" + sessionId + "'";
    db.serialize(function () {
        db.run(dbStr1, function (err) {
            if (err) {
                console.log(err);
            }
        });
        db.run(dbStr2, function (err) {
            if (err) {
                console.log(err);
            } else {
                callback && callback();
            }
        })
    });


}