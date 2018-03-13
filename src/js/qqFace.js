// QQ表情插件
(function($){
	$.fn.qqFace = function(options){
		var defaults = {
			id : 'facebox',//存放表情的盒子
			path : './dist/imgs/index/emoji/',//存放表情的路径
			assign : 'content',
			tip : 'EMO_'
		};
		var option = $.extend(defaults, options);
		var assign = $('.'+option.assign);//输入框
		var id = option.id;
		var path = option.path;
		var tip = option.tip;//表情前缀
		var pid = $(this).closest('.dialogContent').attr("id");
		if(assign.length<=0){
            console.log('缺少表情赋值对象。');
			return false;
		}
		/*点击展开表情界面*/
		// $(this).click(function(e){
			// var strFace, labFace;
			// if($('#'+id).length<=0){
			// 	strFace = '<div id="'+id+'" style="position:absolute;display:none;z-index:1000;" class="qqFace">' +
			// 				  '<table border="0" cellspacing="0" cellpadding="0"><tr>';
			// 	for(var i=1; i<=75; i++){
			// 		labFace = '['+tip+i+']';
			// 		strFace += '<td><img src="'+path+i+'.gif" onclick="$(\'#'+option.assign+'\').setCaret();$(\'#'+option.assign+'\').insertAtCaret(\'' + labFace + '\');" /></td>';
			// 		if( i % 15 == 0 ) strFace += '</tr><tr>';
			// 	}
			// 	strFace += '</tr></table></div>';
			// }
			// $(this).parent().append(strFace);
			// var offset = $(this).position();
			// var top = offset.top + $(this).outerHeight();
			// $('#'+id).css('top',top);
			// $('#'+id).css('left',offset.left);
			// $('#'+id).show();
			// e.stopPropagation();
			if($(".dialogContent"+pid).find("."+id).length <= 0){
				strFace = '<div style="width:310px;height:140px;padding:10px;position:absolute;border-radius:5px;bottom:145px;left:0;overflow: auto;clear:both;background-color:#fff;box-shadow: 0px 0px 10px #aaa;" class="'+id+'">';
				strFace += '<ul style="width:100%;height:100%;">';
				for(var i =1;i<=33;i++){
					if(i<10){
						strFace += '<img draggable="false" style="float:left;margin:2px;padding:0px;border:1px solid #fff;" onclick="addEmoji(this,\''+pid+'\')" src="' + path + tip + '00'+ i +'.png" alt="" />';
					}else if(i<100){
						strFace += '<img draggable="false" style="float:left;margin:2px;padding:0px;border:1px solid #fff;" onclick="addEmoji(this,\''+pid+'\')" src="' + path + tip + '0'+ i +'.png" alt="" />';
					}
				}
				strFace += '</ul>';
				strFace += '</div>';

				$(this).css("position","reletive").append(strFace);
			}
			$(".dialogContent"+pid).find("."+id).show();
			// stopPropagation();
		// });

		// $(document).click(function(){
		// 	$("#"+pid).find("."+id).hide();
		// 	$("#"+pid).find("."+id).remove();
		// });
	};

})(jQuery);

function addEmoji(dom,parent){
	var _dom = $(dom).clone();
	_dom.attr("style","");
	_dom.attr("onclick","");
	var img = _dom[0].outerHTML;
	// $(".dialogContent"+parent).find(".textInput").append(_dom[0]);
	// pasteHtmlAtCaret(img,false);
	Manager.insertImg(img,parent);
	$(".dialogContent"+parent).find(".facebox").hide();
	$(".dialogContent"+parent).find(".facebox").remove();
}

/*光标处添加表情*/
var Manager = {
            insertHtml:function(html,type,parent){

            var lastMemo=document.getElementById("memo"),
            // lastEditor=document.getElementById("reditor");
            lastEditor=$(".dialogContent"+parent).find(".textInput")[0];


            type=type||'memo';

            var control=type=='memo'?lastMemo:lastEditor;

            if(!control)return;

            control.focus();

            var selection=window.getSelection?window.getSelection():document.selection,

                range=selection.createRange?selection.createRange():selection.getRangeAt(0);


            //判断浏览器是ie，但不是ie9以上
            var browser = checkBrowser().split(":");
            var IEbrowser = checkBrowser().split(":")[0];
            var IEverson =  Number(checkBrowser().split(":")[1]);

            if(IEbrowser=="IE"&&IEverson<9){

                range.pasteHTML(html);

            }else{

                var node=document.createElement('span');

                node.innerHTML=html;

                range.insertNode(node.childNodes[0]);
                range.collapse(false);
                selection.removeAllRanges();
                selection.addRange(range);

            }

        },

        insertImg:function(img,parent){
                // var img="<img style=\"width:20px;\" src='http://www.baidu.com/img/bdlogo.gif'/>";
                this.insertHtml(img,'editor',parent);
        }

};

function checkBrowser()
{
 var browserName=navigator.userAgent.toLowerCase();
 //var ua = navigator.userAgent.toLowerCase();
 var Sys = {};
 var rtn = false;

    if(/msie/i.test(browserName) && !/opera/.test(browserName)){
        strBrowser = "IE: "+browserName.match(/msie ([\d.]+)/)[1];
  rtn = true;
        //return true;
    }else if(/firefox/i.test(browserName)){
        strBrowser = "Firefox: " + browserName.match(/firefox\/([\d.]+)/)[1];
        //return false;
    }else if(/chrome/i.test(browserName) && /webkit/i.test(browserName) && /mozilla/i.test(browserName)){
        strBrowser = "Chrome: " + browserName.match(/chrome\/([\d.]+)/)[1];
        //return false;
    }else if(/opera/i.test(browserName)){
        strBrowser = "Opera: " + browserName.match(/opera.([\d.]+)/)[1];
        //return false;
    }else if(/webkit/i.test(browserName) &&!(/chrome/i.test(browserName) && /webkit/i.test(browserName) && /mozilla/i.test(browserName))){
        strBrowser = "Safari: ";
        //return false;
    }else{
        strBrowser = "unKnow,未知浏览器 ";
  //return false;
    }
 strBrowser = strBrowser ;
 //alert(strBrowser)
 return strBrowser;
}
