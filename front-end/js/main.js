var channels = [];
var cookieValue = document.cookie;
var channelString = cookieValue.replace(/^.*channels\s*=\s*([^;]*)(;.*$|$)/,"$1");
if(channelString !== cookieValue){
	channels = channelString.split("-");
}
for(var i in channels){
	addChannel(channels[i]);
}

$("#channels").modal('show');


$("#chat-options input").change(function(){
	if($(this).val())
		changeChatValue($(this).attr("id"), $(this).val());
});

$("#click-block-toggle").click(function(){
	//Turn screen off
	if($(this).hasClass("btn-primary")){
		$(this).removeClass("btn-primary")
			.addClass("btn-default")
			.html("Block me from accidentally clicking on the stream");
		$(".block-click").hide();
	}
	else{
		$(this).removeClass("btn-default")
			.addClass("btn-primary")
			.html("Let me click inside the stream");
		$(".block-click").show();
	}
});
$("#minimize").click(function(){
	var button_label = $($(this).find("span")[0]);
	if(button_label.hasClass("glyphicon-minus")){
		$(this).attr("data-og-height", $("#chat-div").css("height"));
		$("#chat-div").resizable("disable");
		$("#chat").slideUp();
		$("#chat-div").animate({"height":"50px"});
		button_label.removeClass("glyphicon-minus").addClass("glyphicon-plus");
	}
	else{
		$("#chat-div").resizable("enable");
		$("#chat").slideDown();
		$("#chat-div").animate({"height":$(this).attr("data-og-height")});
		button_label.removeClass("glyphicon-plus").addClass("glyphicon-minus");
	}
});

$("#chat-div").resizable({
	handles: 'n, e, s, w, ne, nw, se, sw',
	resize: function(event, ui){
		changeChatValue("width", ui.size.width + "px");
		changeChatValue("height", ui.size.height + "px");
	}
}).draggable({
	drag: function(event, ui){
		changeChatValue("top", ui.position.top + "px");
		changeChatValue("left", ui.position.left + "px");
	}
});
function changeChatValue(type, val){
	switch(type){
		case "width":
			$("#chat-div").css("width", val);
			break;
		case "height":
			$("#chat-div").css("height", val);
			break;
		case "top":
			$("#chat-div").css("top", val);
			break;
		case "left":
			$("#chat-div").css("left", val);
			break;
		default:
			$("#chat-div").css("opacity", val);
			break;
	}
	document.cookie = channel+type+"="+val;
}
function setFromCookie(channel){
	var cookieValue = document.cookie;
	var matchCookie = function(prop){
		return new RegExp("^.*"+channel+prop+"\s*=\s*([^;]*)(;.*$|$)", "i");
	}
	var width = cookieValue.replace(matchCookie("width"), "$1");
	var height = cookieValue.replace(matchCookie("height"), "$1");
	var top = cookieValue.replace(matchCookie("top"), "$1");
	var left = cookieValue.replace(matchCookie("left"), "$1");
	var opacity = cookieValue.replace(matchCookie("opacity"), "$1");
	if(width)
		$("#chat-div").css("width", width);
	if(height)
		$("#chat-div").css("height", height);
	if(top)
		$("#chat-div").css("top", top);
	if(left)
		$("#chat-div").css("left", left);
	if(opacity)
		$("#chat-div").css("opacity", opacity);
}

function updateInfo(channel){
	$.get("https://api.twitch.tv/kraken/streams/"+channel, function( data ){
		if(data.stream){
			$("#viewers > span").html(data.stream.viewers);
		}
		else{
			$("#viewers > span").html("<strong>OFFLINE</strong>");
		}
	});
	$.get("https://api.twitch.tv/kraken/channels/"+channel, function( data ){
		$("img.logo").attr("src", data.logo);
		$("#info-title > span").html(channel);
		$("#stream-title > span").html(data.status);
		$("#total-views > span").html(data.views);
		$("#followers > span").html(data.followers);
	});
	$("#info-modal-body > a").attr("href", "http://www.twitch.tv/"+channel);
}

$("#add-new button").click(function(){
	var channel = $($("#add-new input")[0]).val();
	channels.push(channel);
	document.cookie = "channels=" + channels.join("-");
	addChannel(channel);
});

function addChannel(channel){
$.get("https://api.twitch.tv/kraken/streams/"+channel, function( data ){
	var makeThumb = function(image, caption){
		$('<div>')
			.attr("class","panel panel-default channel-thumb")
			.attr("data-channel", channel)
			.css("cursor","pointer")
			.append(
				$("<div>").attr("class", "panel-body")
				.html("<img class='img-thumbnail' src='"+image+"'>")
			).append(
				$("<div>")
					.attr("class", "panel-footer")
					.html("<h4>"+caption+ "</h4>")
			).click(function(){
				var channel = $(this).attr("data-channel");
				channel = channel.toLowerCase();
				$(".channel-name").html(channel);
				$("#stream").attr("src", "http://www.twitch.tv/"+channel+"/embed");
				$("#chat").attr("src", "http://www.twitch.tv/"+channel+"/chat");

				updateInfo(channel);
				setFromCookie(channel);
				$("#channels").modal('hide');
			})
			.appendTo("#channels-modal-body");
	}
	if(data.stream){
		makeThumb(data.stream.preview.medium, channel + " playing " + data.stream.game);
	}
	else{
		$.get("https://api.twitch.tv/kraken/channels/"+channel, function( data ){
			makeThumb(data.logo, caption = channel + " (OFFLINE)")
		});
	}
});
}