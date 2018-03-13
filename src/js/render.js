(function(){
	var page = 1,rows,waitajax;
	$("body").on("click",".allNews",function(){
		$.ajax({
			type:'get',
			url:localStorage.url+"/sms/getUnreadSmsGroup.action",
			beforeSend: function(XMLHttpRequest){
			},
			success: function(data, textStatus){
				var json = JSON.parse(data);
				$(".smsBlock").remove();
                //显示消息事务待办页面
                renderSms(json);
                $(".diaItem").removeClass("active");
                $(".transaction").addClass("active");
				console.log('获取菜单列表成功！');
				getSmsNumber();
			},
			complete: function(XMLHttpRequest, textStatus){
			},
			error: function(data){
                console.log('获取数据失败！请检查网络后刷新');
			}
		});
	});

	function renderSms(data){
		var sms = [];
		sms.push('<div class="smsBlock">');
			sms.push('<div class="smsTitle">');
				sms.push('<p class=\' fl\'>消息事务</p>');
				sms.push('<p class=\'fr readAll\'>全部已阅</p>');
			sms.push('</div>');
		sms.push('<div class="smsBody">');
		sms.push('<ul class="smsTab clearfix">');

		if(data.length>6){
			for(var i=0,l=5;i<5;i++){
				sms.push('<li id="'+data[i].id+'" class=\'smsTabBlock\'>');
					sms.push('<p class="smsName">'+data[i].name+'</p>');
				sms.push('</li>');
			}
			sms.push('<li class=\'smsTabBlock\'>');
				sms.push('<p class="smsName moreSmsClass">更多</p>');
				sms.push('<ul class="moreSms">');

				for(i=5,le=data.length;i<le;i++){
					sms.push('<li id="'+data[i].id+'" class="moreSmsItem">'+data[i].name+'</li>');
				}
				sms.push('</ul>');
				sms.push('</li>');
		}else{
			for(var i in data){
				sms.push('<li id="'+data[i].id+'" class=\'smsTabBlock\'>');
					sms.push('<p class="smsName">'+data[i].name+'</p>');
				sms.push('</li>');
			}
		}

		sms.push('</ul>');
		sms.push('<div class="smsContent">');

			sms.push('<ul class="smsContentList">');

				for(var j in data){
					if(data[j].name!='' && data[j].id != ''){
						sms.push(smsItem(data[j].id));
						break;
					}
				}

			sms.push('</ul>');
		sms.push('</div>');


		sms.push('<p class="getMore">查看更多>></p>');


		$("#mainContent > div").hide();
		$("#mainContent").prepend(sms.join(""));
	}
	function smsItem(id,rows,page,callback){
		var curPage = page || 1;
		var curRows = curRows || 5;
		var callbackfun = callback || function(content){
			$(".smsContentList").append(content.join(""));
		};
		$.ajax({
			type:'post',
			data:{
				rows:curRows,
				page:curPage,
				moduleNo:id
			},
			url:localStorage.url+"/sms/getSmsBoxDatas.action",
			beforeSend: function(XMLHttpRequest){
				$(".getMore").text("正在加载...");
			},
			success: function(data, textStatus){
				var json = JSON.parse(data);
				var result = renderSmsContent(json,id,rows);
				callbackfun(result);
				console.log('获取消息内容成功！');
			},
			complete: function(XMLHttpRequest, textStatus){
				$(".getMore").text("加载更多>>");
			},
			error: function(data){
                console.log('获取数据失败！请检查网络后刷新');
			}
		});

		function renderSmsContent(data,id,rows){
			var content = [];
			if(data.rows.length === 0){
				$(".getMore").hide();
				$(".noMore").show();
				var returnData = ['<div class =\'noMore\' style="text-align:center;line-height:30px;">暂无数据！</div>'];
				return returnData;
			}else{
				$(".getMore").show();
				$(".noMore").hide();
			}
			for(var i =0,l=data.rows.length;i<l;i++){
				content.push('<li  url="'+data.rows[i].remindUrl+'" smsSid="'+data.rows[i].smsSid+'" class="smsContentItem">');
					content.push('<div>');
						content.push('<p>'+data.rows[i].content+'</p>');
						content.push('<div class="smsInfo clearfix">');
							content.push('<p class="fl">'+data.rows[i].fromUser+'</p>');
							content.push('<p class="fr">'+data.rows[i].remindTimeDesc+'</p>');
						content.push('</div>');
					content.push('</div>');
				content.push('</li>');
			}
			return content;
		}

	}

	$("body").on('click', '.smsTabBlock,.moreSmsItem', function(event) {
		if($(this).find("ul").length === 0){//点击更多的时候不触发
			var id = $(this).attr("id");
			if(!$(this).hasClass("open")){
				page = 1;
				smsItem(id,rows,page,function(content){
					$(".smsContentList").empty();
					$(".smsContentList").append(content.join(""));
				});
				$(".smsTabBlock,.moreSmsItem").removeClass('open');
				$(this).addClass('open');
			}

		}
	});

	$("body").on("click",".getMore",function(){
		var id = $(".open").attr("id");
		smsItem(id,rows,++page,function(content){
			$(".smsContentList").append(content.join(""));
		});
	});

	$("body").on("click",".smsContentItem",function(){
		var smssid = $(this).attr("smssid");
		var netUrl = localStorage.url;
		var winUrl = $(this).attr('url');
		$.post(localStorage.url+'/sms/updateReadFlag.action', {ids: smssid}, function(data, textStatus, xhr) {

		});

		if(winUrl && winUrl!=null && winUrl!="null")
		{
			OpenUrlFromExternal(winUrl);
		}
		$.ajax({
			type:'post',
			data:{
				ids:smssid
			},
			url:localStorage.url+"/sms/updateReadFlag.action",
			beforeSend: function(XMLHttpRequest){
			},
			success: function(data, textStatus){
				var json = JSON.parse(data);
			},
			complete: function(XMLHttpRequest, textStatus){
			},
			error: function(data){
                console.log('获取数据失败！请检查网络后刷新');
			}
		});
		$(this).remove();
	});


	//全部已阅
	$("body").on("click",".readAll",function(){
		if(!window.confirm("确认将所有未读消息设置为已读？")){
			return;
		}
		$.post(localStorage.url+'/sms/viewAll.action', function(data, textStatus, xhr) {
			if(data.rtState){
				$.ajax({
					type:'get',
					url:localStorage.url+"/sms/getUnreadSmsGroup.action",
					beforeSend: function(XMLHttpRequest){
					},
					success: function(data, textStatus){
						var json = JSON.parse(data);
						if($(".smsBlock").length == 0){
							$(".smsBlock").remove();
							renderSms(json);
						}else{
							$("#mainContent > div").hide();
							$(".smsBlock").show();
						}
						console.log('获取菜单列表成功！');
						$(".allNews").trigger("click");
					},
					complete: function(XMLHttpRequest, textStatus){
					},
					error: function(data){
                        console.log('获取数据失败！请检查网络后刷新');
					}
				});
			}
		});
	});


	/*
	*渲染通讯录
	*/
	function renderContact(){
		var str = '';
		str += '<ul class="personList">'
				+ '<span class="personOrder">B</span>'

			+ '</ul>';

		strContent = '<li class="personItem">'
					+ '<div class="avatar">'
					+ '<img  draggable="false" src="dist/imgs/index/app/person.png">'
					+ '</div>'
					+ '<span class="personItemName">杨波</span>'
					+ '</li>';
		$.ajax({
			type:'post',
			data:{
				ids:smssid
			},
			url:localStorage.url+"/teeAddressController/getAddressFullNamListByMobile.action",
			success: function(data, textStatus){
				var json = JSON.parse(data);
				console.log(json);
			},
			error: function(data){
                console.log('获取数据失败！请检查网络后刷新');
			}
		});



	}







})();