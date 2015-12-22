/*************************Setup*****************************/

// this is the current channel we're watching
var global_channel;
// This is the list of channels to pick from
var channels = [];
// This gets all the data about our channels and loads it up
resetChannels();

// We need to select a channel first-thing, so show this modal
$("#channels").modal('show');


$("#chat-div").manipulate( function (box, props) { // JD 1211: 8
	$.each(["top", "left", "bottom", "right", "height", "width"], function (key, elem) {
		document.cookie = global_channel+elem+"="+props[elem];
	});
})
.hover(function(){
	$("#chat-div").attr("data-opacity", $("#chat-div").css("opacity"));
	changeChatValue("opacity", 1);
},function(){ 
	changeChatValue("opacity", 	$("#chat-div").attr("data-opacity"));
});

$('#opacity').slider({
	formatter: function(value) {
		return 'Opacity: ' + parseInt(value*100) + "%";
	}
});


/*************************events*****************************/

// I want the info about the channel (viewers, name, followers etc) to always be
// accurate. So it updates when you click to open the modal.
$("#channel-info").click(function(){
	updateInfo(global_channel);
});
// I want the previews and information about which channels are online to always
// be accurate, so I update it when the user clicks the channel selector.
$("#channel-select").click(function(){
	resetChannels();
});

// I want the chat window values to update immediately as the user types them
// If not, they have to hit enter and stuff and there are issues
$("#chat-options input").keyup(function(){
	changeChatValue($(this).attr("id"), $(this).val());
});

$('#opacity').slider()
	.on('slide', function(){
		changeChatValue("opacity", $("#opacity").slider("getValue"));
	});

// Big blue button in the options menu
$("#click-block-toggle").click(function(){
	// Turn off blocker
	if($(this).hasClass("btn-primary")){ // JD: 15, 16
		$(this).removeClass("btn-primary")
			.addClass("btn-default")
			.html("Block me from accidentally clicking on the stream");
		$(".block-click").hide();
	}
	else{ // JD: 17
		$(this).removeClass("btn-default")
			.addClass("btn-primary")
			.html("Let me click inside the stream");
		$(".block-click").show();
	}
});
// roll up the chat window
$("#minimize").click(function(){
	var icon = $($(this).find("span")[0]);
	// Roll up
	if(icon.hasClass("glyphicon-minus")){ // JD: 15, 16
		// Save as an html attribute the height we're returning to
		$(this).attr("data-og-height", $("#chat-div").css("height"));
		// Yay animations!
		$("#chat-div").animate({"height":"50px"});
		icon.removeClass("glyphicon-minus").addClass("glyphicon-plus");
	}
	else{ // JD: 17
		$("#chat-div").animate({"height":$(this).attr("data-og-height")});
		icon.removeClass("glyphicon-plus").addClass("glyphicon-minus");
	}
});
// Add a new channel
// PRO HACKS: We don't have to bind a click event to the add button!
// If you type in the name and hit the button, hitting the button
// de-focuses the input which triggers a change event in it. So that's
// the same as hitting enter. The change on the input, thus, also covers
// the press! ZOMG
$("#add-new input").change(function(){
	var channel = $($("#add-new input")[0]).val();
	$($("#add-new input")[0]).val("");
	if(channel && channels.indexOf(channel) == -1){ // JD: 15, 16, 18
		// We don't want to add it if the channel doesn't exist
		$.ajax({
			url: "https://api.twitch.tv/kraken/channels/"+channel, // JD: 9
			type:"get", // JD: 9
			success: function(data){
				channels.push(channel);
				document.cookie = "channels=" + channels.join("-");
				addChannel(channel);
			}
		});
	}
});

/*************************functions*****************************/

// JD: 19

// Change style "type" to val of the chat window
function changeChatValue(type, val){
    // JD: 20
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
	document.cookie = global_channel+type+"="+val; // JD: 9
}
// Set chat window styles from cookies for "channel"
function setFromCookie(channel){
	var cookieValue = document.cookie;
	var matchCookie = function(prop){
		// Cookies are of the form "channeltype=value". This matches that
		// The cookies are in one giant string so we match previous cookies
		// with "^.*". Then we get channel+prop=, while checking for spaces on
		// either side of the = just in case. Then we get every character that
		// isn't a semicolon; this is the value of the cookie. After that we 
		// match either a ; followed by more cookies (.*) or the end of the 
		// string "$"
		return new RegExp("^.*"+channel+prop+"\s*=\s*([^;]*)(;.*$|$)", "i");
	}
	var width = cookieValue.replace(matchCookie("width"), "$1");
	var height = cookieValue.replace(matchCookie("height"), "$1");
	var top = cookieValue.replace(matchCookie("top"), "$1");
	var left = cookieValue.replace(matchCookie("left"), "$1");
	var opacity = cookieValue.replace(matchCookie("opacity"), "$1");

    // JD: 21
	if(width)
		$("#chat-div").parent().css("width", width + "px" );
	if(height)
		$("#chat-div").parent().css("height", height + "px");
	if(top)
		$("#chat-div").parent().css("top", top + "px");
	if(left)
		$("#chat-div").parent().css("left", left + "px");
	if(opacity)
		$("#chat-div").css("opacity", opacity);
}

// Update the channel info modal
function updateInfo(){
	// Get info about the stream
	$.get("https://api.twitch.tv/kraken/streams/"+global_channel, function( data ){
		// If the stream is offline, data.stream will be null
		if(data.stream){
			$("#viewers > span").html(data.stream.viewers);
		}
		else{ // JD: 17
			$("#viewers > span").html("<strong>OFFLINE</strong>");
		}
	});
	// Even if a stream is offline, this info is still available
	$.get("https://api.twitch.tv/kraken/channels/"+global_channel, function( data ){
		$("img.logo").attr("src", data.logo);
		$("#info-title > span").html(global_channel);
		$("#stream-title > span").html(data.status);
		$("#total-views > span").html(data.views);
		$("#followers > span").html(data.followers);
	});
	// Link to the stream on twitch
	$("#info-modal-body > a").attr("href", "http://www.twitch.tv/"+global_channel);
}

// Add a channel to the channel list
function addChannel(channel){
	if(channel){
		// Get info about the stream
		$.get("https://api.twitch.tv/kraken/streams/"+channel, function( data ){
			// Make a channel thumbnail
			var makeThumb = function(image, caption){
				// Make it the first one in the list after the new button
				$("#add-new").after(
					// Outer div
					$('<div>')
						// Some css class stuff
						.attr("class","panel panel-default channel-thumb actual-channel-thumb")
						// Info about the channel as an attribute
						.attr("data-channel", channel)
						// It's a button, so let the user know it
						.css("cursor","pointer")
						// Inside we need body/preview
						.append(
							$("<div>")
								.attr("class", "panel-body")
								.html("<img class='img-thumbnail' src='"+image+"'>")
						// We also need a footer/channel title
						).append(
							$("<div>")
								.attr("class", "panel-footer")
								.html("<h4 title='"+caption+"'>"+caption+ "</h4>")
						// Load this channel
						).click(function(){
							var channel = $(this).attr("data-channel");
							channel = channel.toLowerCase();
							// Set the channel name in all things that have this class
							$(".channel-name").html(channel);
							// set both iframes
							$("#stream").attr("src", "http://www.twitch.tv/"+channel+"/embed");
							$("#chat").attr("src", "http://www.twitch.tv/"+channel+"/chat");
							// Set the global channel variable
							global_channel = channel;

							// Set the channel dimensions for this channel
							setFromCookie(channel);
							// Dismiss the modal
							$("#channels").modal('hide');
						})
				);
			}
			if(data.stream){
				makeThumb(data.stream.preview.medium, channel + " playing " + data.stream.game);
			}
			else{ // JD: 17
				$.get("https://api.twitch.tv/kraken/channels/"+channel, function( data ){
					makeThumb(data.logo, caption = channel + " (OFFLINE)") // JD: 22
				});
			}
		});
	}
}
function resetChannels(){
	// Remove all the channel thumbnails, because they're probably all wrong
	$(".actual-channel-thumb").remove();
	var cookieValue = document.cookie;
	// The channel cookie is of the form channels=channel1-channel2-channel3; 
	// The comment about the other regex above gives some info about this
	var channelString = cookieValue.replace(/^.*channels\s*=\s*([^;]*)(;.*$|$)/,"$1");
	// If we have a channel cookie set,
	if(channelString !== cookieValue){
		// This gives us an array of channels from the cookie
		channels = channelString.split("-");
		// Call our helper function for each one
		for(var i in channels){ // JD: 23
			addChannel(channels[i]);
		}
	}
}