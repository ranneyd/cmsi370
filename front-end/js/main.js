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


$("#chat-div").resizable({
	handles: 'n, e, s, w, ne, nw, se, sw',
	resize: function(event, ui){
		changeChatValue("width", ui.size.width);
		changeChatValue("height", ui.size.height);
	}
}).draggable({
	drag: function(event, ui){
		changeChatValue("top", ui.position.top);
		changeChatValue("left", ui.position.left);
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
	var width = cookieValue.replace(new RegExp("^.*"+channel+"width\s*=\s*([^;]*);.*$", "i"), "$1");
	var height = cookieValue.replace(new RegExp("^.*"+channel+"height\s*=\s*([^;]*);.*$", "i"), "$1");
	var top = cookieValue.replace(new RegExp("^.*"+channel+"top\s*=\s*([^;]*);.*$", "i"), "$1");
	var left = cookieValue.replace(new RegExp("^.*"+channel+"left\s*=\s*([^;]*);.*$", "i"), "$1");
	var opacity = cookieValue.replace(new RegExp("^.*"+channel+"opacity\s*=\s*([^;]*);.*$", "i"), "$1");
	if(width)
		changeChatValue("width", width);
	if(height)
		changeChatValue("height", height);
	if(top)
		changeChatValue("top", top);
	if(left)
		changeChatValue("left", left);
	if(opacity)
		changeChatValue("opacity", opacity);
}