/* CAUTION: Requires jQuery 1.8 or later */

/* CAUTION: If the parent element is the body tag, this will not work unless you set
/* "height:100%". CSS is pretty dumb and if this isn't set explicitly the body could have a
/* height of 0px or something equally silly and the object will not be able to move properly. */

/* Known issue: If the parent element is sized using percents, then some of the calculations will
/* produce non-integer results that have undefined behavior */

/* NOTE: if position of object isn't set before-hand, they will automatically be set to left: 0 and
/* top: 0*/


/* TODO: ghost div in case of iframe inside. */

/* This allows us to not only have a closure but if they have $ aliased as something not jQuery it
still works */
(function ( $ ) {

    const HANDLE_WIDTH = 10;
    /* Track the position of the mouse and save it in the jQuery object for reference. */

    /* - Why do we need this?*/
    /* Neither javascript nor jquery has a really good way to just get the mouse position on the
    /* page. Since our mouse tracking is going to use requestAnimationFrame and not a mouse event
    /* (more on why this is further down) we need a way of getting the mouse position on the page
    /* independent of the information from mouse events.*/

    /* - Why out here? */ 

    /* We only want to bind this event once, and not for each manipulatable object since these
    /* values will be global. Thus, we put it outside the function definition so once the user loads
    /* this plug in the mouse position detection will automatically begin */

    $("body").mousemove( function ( event ) {
        $.fn.manipulate.mouse = {
            x: event.pageX,
            y: event.pageY,
        };
    });


    /* Make an object draggable and resizable. The callback will be invoked every time an object is
    /* moved or resized. The object will not be able to be positioned or sized in such a way that
    /* any part of it is outside the parent element.

    /* TODO: explain left vs right and what we pass to the callback */

    /* TODO: Explain what debug means */ 
    $.fn.manipulate = function ( callback, debug ) {

        var boxWrapper = this.wrap("<div></div>").parent(),
            z_index = parseInt(this.css("z-index") || 1),
            blockerDiv = $("<div>").css({
                "position":"absolute",
                "width": "100%",
                "height": "100%",
                "left":"0px",
                "top":"0px",
                "background-color": debug ? "yellow" : "",
                "z-index":z_index+1
            }).appendTo(boxWrapper).hide();

        /* DRAGGING */

        boxWrapper.css( {
            // Give the movable object that nice moving crosshair to signify that it is movable
            "cursor":"move",
            // The manipulation requires the object to be absolutely positioned
            "position":"absolute",
            // don't want object to be highlightable. Browser support a little spotty so we need a
            // few styles to cover all of them
            "-webkit-user-select": "none",
            "khtml-user-select": "none",
            "-moz-user-select": "none",
            "-ms-user-select": "none",
            "user-select": "none",
            "width": this.outerWidth(),
            "height": this.outerHeight(),
            "left": this.css("left") === "auto" ? "0px" : this.css("left"),
            "right": this.css("right") === "auto" ? "" : this.css("right"),
            "top": this.css("top") === "auto" ? "0px" : this.css("top"),
            "bottom": this.css("bottom") === "auto" ? "" : this.css("bottom"),
            "padding":"0px",
            "margin":"0px",
            "z-index":z_index
        } );

        this.css({
                "position":"absolute",
                "left": "0px",
                "right": "",
                "top": "0px",
                "bottom": "",
            })
            .addClass("manipulable");


        // Returns relevant positioning and sizing information about the parent element
        var parentStats = function( jParent ) {
            var parent = {
                "left": jParent.offset().left,
                "top": jParent.offset().top,
                "width": jParent.outerWidth(),
                "height": jParent.outerHeight(),
                "innerWidth": jParent.innerWidth(),
                "innerHeight": jParent.innerHeight(),
                "right": jParent.offset().left + jParent.outerWidth(),
                "bottom": jParent.offset().top + jParent.outerHeight(),
                "edge": {
                    // 10 means we're parsing an int in base 10. parseInt ignores "px"
                    "left": parseInt(jParent.css("margin-left"),10) 
                            + parseInt(jParent.css("padding-left"),10)
                            +  parseInt(jParent.css("border-left-width"),10),
                    "right": parseInt(jParent.css("margin-right"),10) 
                            + parseInt(jParent.css("padding-right"),10)
                            +  parseInt(jParent.css("border-right-width"),10),
                    "top": parseInt(jParent.css("margin-top"),10) 
                            + parseInt(jParent.css("padding-top"),10)
                            +  parseInt(jParent.css("border-top-width"),10),
                    "bottom": parseInt(jParent.css("margin-bottom"),10) 
                            + parseInt(jParent.css("padding-bottom"),10)
                            +  parseInt(jParent.css("border-bottom-width"),10),
                }
            };

            parent.innerLeft = parent.left + parent.edge.left;
            parent.innerRight = parent.right - parent.edge.right;
            parent.innerTop = parent.top + parent.edge.top;
            parent.innerBottom = parent.bottom - parent.edge.bottom;

            return parent;
        };

        // Returns information to be sent to the callback
        var callbackProps = function (newBoxPos) {
            return {
                "left": newBoxPos.left,
                "right": newBoxPos.right,
                "top": newBoxPos.top,
                "bottom": newBoxPos.bottom,
                "height": newBoxPos.height,
                "width": newBoxPos.width,
                "leftSide": newBoxPos.left < newBoxPos.right,
                "topSide": newBoxPos.top < newBoxPos.bottom
            }
        };

        // Takes in left/right top/bottom values and sets the lesser of each pair to ""
        var oneSidify = function ( newBoxPos ){
            if( newBoxPos.left < newBoxPos.right){
                newBoxPos.right = ""
            }
            else {
                newBoxPos.left = ""
            }

            if( newBoxPos.top < newBoxPos.bottom){
                newBoxPos.bottom = ""
            }
            else {
                newBoxPos.top = ""
            }
        }

        /* Why not mousemove? */

        /* This method is better for a few reasons. Event listening is a little cumbersome because
        /* the events have to be bound and unbound. */

        var trackMouse = function ( target ) {

            var jThis = $(target),
                jParent = jThis.parent(),
                parent = parentStats( jParent ),

                mouse = $.fn.manipulate.mouse,

                box = {
                    "width": jThis.outerWidth(),
                    "height": jThis.outerHeight(),
                },

                newBoxPos = {
                    "left": mouse.x - target.deltaX - parent.innerLeft,
                    "top":  mouse.y - target.deltaY - parent.innerTop,
                    "right": parent.innerRight - mouse.x - (box.width - target.deltaX),
                    "bottom": parent.innerBottom - mouse.y - (box.height - target.deltaY),
                    "width": box.width,
                    "height":box.height
                };

            // check left side. Remember it cannot leave the parent.
            if ( newBoxPos.left <= 0) {
                
                // We assume at this point that the left side of our object is the left side of the
                // parent. So the global mouse position with respect to the parent tells us the new
                // offset from the object

                target.deltaX = mouse.x - parent.innerLeft;

                // Set the new value. Remember that the new position is the left side of the parent
                newBoxPos.left = 0;
            }

            // check right side. 
            if ( newBoxPos.right <= 0) {
                
                /* We want to create a deltaX assuming the box is up against the right side like we
                /* do when we check the left side. The problem is we don't have a good way to get
                /* the deltaX with that assumption. One way is to look at it like this 
                /*  ________________
                /* |    _______     |
                /* |-a-|--b--[]|    |
                /* |   |_______|    |
                /* |________________|
                /* 
                /* If this outer box is the window, and the box within it is the parent, and the []
                /* inside is the manipulatable object, then the deltaX will be the mouse.x minus (a
                /* + left border width + b). To get b, however, we need to take the width of the
                /* parent minus the width of the child (since the child will be all the way up
                /* against the right side). Then we get the following */

                target.deltaX = mouse.x - parent.innerLeft - (parent.innerWidth - box.width);

                // Set the new value. Remember that the new position is the left side of the parent
                newBoxPos.right = 0;
            }


            // check top side. This is basically the same as the check for the left side but in
            // y instead of x
            if ( newBoxPos.top <= 0) {
                target.deltaY = mouse.y - parent.innerTop;

                newBoxPos.top = 0;
            }

            // check bottom side. This is basically the same as the check for the right side but in
            // y instead of x
            if ( newBoxPos.bottom <= 0) {
                target.deltaY = mouse.y - parent.innerTop - (parent.innerHeight - box.height);

                newBoxPos.bottom = 0;
            }



            if ( callback ) {
                callback(target, callbackProps( newBoxPos ) );
            }

            oneSidify(newBoxPos);
            jThis.css( newBoxPos );

            if ( target.move ) {
                window.requestAnimationFrame( function () {
                    trackMouse( target );
                });
            }
        }

        // Here is where the tracking magic begins
        boxWrapper.mousedown( function ( event ) {

            // In a jQuery mouse event, 'this' is the element that has the event bound to it. It's a
            // little less expressive to use this than event.target, but event.target could have
            // implications if the user drags over another manipulable object that has a higher
            // z-index.

            var startOffset = $(this).offset(),
                // I could use event.pageX and event.pageY but this is more consistent
                mouse = $.fn.manipulate.mouse;


            // This is what will keep the trackMouse loop going
            this.move = true;

            // We need to know the distance between the place they click and the upper left-hand
            // corner. This stores what that is when they start off
            this.deltaX = mouse.x - startOffset.left;
            this.deltaY = mouse.y - startOffset.top;

            
            trackMouse(this);

            blockerDiv.show();

            // When we mouse up we want to end the magic. There are also implications with the
            // bounds checking where the mouse can end up outside the object. No matter where you
            // mouse up, you should stop dragging. But since we're calling mouseup on the body it
            // uses body as the target and loses all references to this object, so we need to do
            // this ugly little hack where we add a reference to this to the namespace and call it
            // in the function

            var thisBox = this;

            var mouseUpFunction = function ( event ) {
                thisBox.move = false;
                blockerDiv.hide();
                $("body").unbind("mouseup", mouseUpFunction);
            };

            $("body").mouseup( mouseUpFunction );

            event.stopPropagation();
        });


        /* Resizing */

        var trackResize = function ( target, handle){

            // Takes in parameter direction and returns true if that handle faces that direction.
            // I know, it's a simple helper function but it's useful.
            var touches = function ( direction ){
                return handle.indexOf(direction) !== -1;
            }


            /* Note that this function's target is the HANDLE not the actual box */
            var jHandle = $(target),
                jBox = jHandle.parent(),
                jParent = jBox.parent(),
                parent = parentStats( jParent ),

                mouse = $.fn.manipulate.mouse,

                /* I was using jBox.offset() but it turns out this gets very buggy when I switch
                /* from left to right coordinates. I went with this, a little more convoluted but
                /* bug-free alternative. Since we take the starting position of the element when we
                /* start the plugin and set defaults if there are none set, we can assume there will
                /* be values in at least left or right and top or bottom. So we take whichever one
                /* is there and extrapolate the other one from that */
                
                box = {
                    "left" : parseInt(jBox.css("left")),
                    "right" : parseInt(jBox.css("right")),
                    "top" : parseInt(jBox.css("top")),
                    "bottom" : parseInt(jBox.css("bottom")),
                    "width" : jBox.width(),
                    "height" : jBox.height()
                },

                /* If any of the above were not set, we'll get NaN. However, we can assume that one
                /* of left or right and one of top and bottom will be set. So we use the one that's
                /* set and for the other we extrapolate using the width of the parent, the width of
                /* the box, and the other given position */

                newBoxPos = {
                    "left": isNaN(box.left) 
                                ? parent.innerWidth - box.right - box.width 
                                : box.left,
                    "right": isNaN(box.right) 
                                ? parent.innerWidth - box.left - box.width 
                                : box.right,
                    "top": isNaN(box.top) 
                                ? parent.innerHeight - box.bottom - box.height 
                                : box.top,
                    "bottom": isNaN(box.bottom) 
                                ? parent.innerHeight - box.top - box.height 
                                : box.bottom,
                    "width": box.width,
                    "height": box.height
                };

            var fixVerticalHandles = function () {
                jBox.find(".w-handle").outerHeight(newBoxPos.height - HANDLE_WIDTH * 2);
                jBox.find(".e-handle").outerHeight(newBoxPos.height - HANDLE_WIDTH * 2);
            },
            fixHorizontalHandles = function () {
                jBox.find(".n-handle").outerWidth(newBoxPos.width - HANDLE_WIDTH * 2);
                jBox.find(".s-handle").outerWidth(newBoxPos.width - HANDLE_WIDTH * 2);
            };

            var setLeft = function(){
                // Note that this is relative to page, not parent
                var newLeftOffest = mouse.x - target.deltaX;
                
                /* This ends up being a little tricky. To find the new width, we have to find the
                /* difference between where the new left position and old left position are based on
                /* the mouse. The new width will be that difference plus the width of the box*/

                box.width = newBoxPos.left + parent.innerLeft - newLeftOffest + box.width;
                newBoxPos.width = box.width;
                newBoxPos.left = newLeftOffest - parent.innerLeft;

                fixHorizontalHandles();
            },
            setRight = function(){
                // Note that this is relative to the left side of the page, not the right side
                var newRightOffset = mouse.x +(HANDLE_WIDTH - target.deltaX);

                /* This ends up being more straightforward than the left. Here we just take the new
                /* right offset and subtract the old left and parent left */

                box.width = newRightOffset - (newBoxPos.left + parent.innerLeft);
                newBoxPos.width = box.width;
                newBoxPos.right = parent.innerRight - newRightOffset;

                fixHorizontalHandles();
            },
            setTop = function(){
                var newTopOffset = mouse.y - target.deltaY;
                box.height = newBoxPos.top + parent.innerTop - newTopOffset + box.height;
                newBoxPos.height = box.height;
                newBoxPos.top = newTopOffset - parent.innerTop;

                fixVerticalHandles();
            },
            setBottom = function(){
                var newBottomOffset = mouse.y +(HANDLE_WIDTH - target.deltaY);
                box.height = newBottomOffset - jBox.offset().top;
                newBoxPos.height = box.height;
                newBoxPos.bottom = parent.innerBottom - newBottomOffset;

                fixVerticalHandles();
            };

            /* If our handle is one of each of those cases, change the appropriate side. I
            /* deliberately did it this way so resizing via the corners would work automatically */

            if(touches("w")){
                setLeft();
            }
            if(touches("e")){
                setRight();
            }
            if(touches("n")){
                setTop();
            }
            if(touches("s")){
                setBottom();
            }

            // TODO: minimum width

            /* This checks for walls to make sure we don't resize out of the parent. The &&
            /* touches("_") is there because there were issues where the box was up against a wall
            /* and being resized from the opposite side. Since these affect the deltaX it was
            /* messing with the resizing. The && touches("_") insures that we are only checking for
            /* walls when you are resizing in that same direction, since that's the only way you're
            /* going to go over anyway*/

            if ( newBoxPos.left <= 0 && touches ("w") ) {
                target.deltaX = mouse.x - parent.innerLeft;

                setLeft();
            }
            if ( newBoxPos.right <= 0 && touches ("e")) {
                target.deltaX = HANDLE_WIDTH - (parent.innerRight - mouse.x);

                setRight();
            }
            if ( newBoxPos.top <= 0 && touches ("n")) {
                target.deltaY = mouse.y - parent.innerTop;

                setTop();
            }
            if ( newBoxPos.bottom <= 0 && touches ("s")) {
                target.deltaY = HANDLE_WIDTH - (parent.innerBottom - mouse.y);

                setBottom();
            }

            if ( callback ) {
                callback(jBox, callbackProps( newBoxPos ) );
            }


            oneSidify(newBoxPos);

            jBox.css( newBoxPos );
            var innerBox = jParent.find(".manipulable");
            innerBox.outerWidth(box.width);
            innerBox.outerHeight(box.height);

            if ( target.resize ) {
                window.requestAnimationFrame( function () {
                    trackResize( target, handle );
                });
            }
        };

        var handleClick = function ( event, target, direction ) {
            var startOffset = $(target).offset(),

            mouse = $.fn.manipulate.mouse;

            target.resize = true;


            target.deltaX = mouse.x - startOffset.left;
            target.deltaY = mouse.y - startOffset.top;

            
            trackResize( target, direction );
            
            blockerDiv.show();

            var mouseUpFunction = function ( event ) {
                target.resize = false;
                blockerDiv.hide();
                $("body").unbind("mouseup", mouseUpFunction);
            };

            $("body").mouseup( mouseUpFunction );

            event.stopPropagation();
        };

        var handleNames = ["n", "e", "w", "s", "ne", "nw", "se", "sw"],
            handleColors = {
                "n": "blue",
                "e": "red",
                "w": "green",
                "s" : "magenta",
                "ne" : "cyan",
                "nw" : "cyan",
                "se" : "cyan",
                "sw" : "cyan"
            }
            handleStyles = {};

        $.each(handleNames, function(index, direction) {
            handleStyles[direction] = {
                "-webkit-user-select": "none",
                "khtml-user-select": "none",
                "-moz-user-select": "none",
                "-ms-user-select": "none",
                "user-select": "none",

                "position":"absolute",
                "background-color": debug ? handleColors[direction] : "",
                "margin":"0px",
                "padding":"0px",
                "height": direction === 'e' || direction === 'w'
                            ? boxWrapper.outerHeight()- 2*HANDLE_WIDTH + "px"
                            : HANDLE_WIDTH + "px",
                "width": direction === 'n' || direction === 's'
                            ? boxWrapper.outerWidth()- 2*HANDLE_WIDTH + "px"
                            : HANDLE_WIDTH + "px",
                "cursor": direction + "-resize",
                "z-index":z_index+2
            };

            // top/bottom positioning 
            // west/east need top HANDLE_WIDTH+"px"
            if (direction === "e" || direction === "w") {
                handleStyles[direction]["top"] = HANDLE_WIDTH + "px";
            }
            // North ones need to have a top of 0. This includes corners
            else if(direction.indexOf("n") !== -1) {
                handleStyles[direction]["top"] = "0px";
            }
            // South ones need to have a bottom of 0. This includes corners
            else {
                handleStyles[direction]["bottom"] = "0px";
            }

            // left-right positioning 
            // north/south need left HANDLE_WIDTH+"px"
            if (direction === "n" || direction === "s") {
                handleStyles[direction]["left"] = HANDLE_WIDTH + "px";
            }
            // west ones need to have a left of 0. This includes corners
            else if(direction.indexOf("w") !== -1) {
                handleStyles[direction]["left"] = "0px";
            }
            // east ones need to have a right of 0. This includes corners
            else {
                handleStyles[direction]["right"] = "0px";
            }

        });

        $.each(handleStyles, function (direction, styles) {
            boxWrapper.append(
                $("<div>")
                    .css(styles)
                    .addClass(direction + "-handle")
                    .mousedown( function ( event ) { 
                        handleClick( event, this, direction);
                    })
            );
        });

        return this;
    };
 
} ( jQuery ));
