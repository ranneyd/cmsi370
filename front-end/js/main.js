
function updateInfo(){
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

var channel = "playhearthstone";
channel = channel.toLowerCase();
$(".channel-name").html(channel);
$("#stream").attr("src", "http://www.twitch.tv/"+channel+"/embed");
$("#chat").attr("src", "http://www.twitch.tv/"+channel+"/chat");

updateInfo();
setFromCookie();

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
function setFromCookie(){
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