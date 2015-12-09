/* This allows us to not only have a closure but if they have $ aliased as something not jQuery it
still works */

/* CAUTION: Requires jQuery 1.8 or later */

/* Known issue: If the parent element is sized using percents, then some of the calculations will
/* produce non-integer results that have undefined behavior */

/* NOTE: if position of object isn't set before-hand, they will automatically be set to left: 0 and
/* top: 0*/

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

    /* CAUTION: If the parent element is the body tag, this will not work unless you set
    /* "height:100%". CSS is pretty dumb and if this isn't set explicitly the body could have a
    /* height of 0px or something equally silly and the object will not be able to move properly. */

    /* TODO: explain left vs right and what we pass to the callback */

    $.fn.manipulate = function ( callback ) {

        var boxWrapper = this.wrap("<div></div>").parent();

        /* DRAGGING */

        boxWrapper.css( {
            // Give the movable object that nice moving crosshair to signify that it is movable
            "cursor":"move",
            // The manipulation requires the object to be absolutely positioned
            "position":"absolute",
            // don't want object to be highlightable. Browser support a little spotty so we need a
            // few styles to cover all of them
            "-webkit-touch-callout": "none",
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
            "margin":"0px"
        } );

        this.css({
                "position":"absolute",
                "left": "0px",
                "right": "",
                "top": "0px",
                "bottom": "",
            })
            .addClass("manipulable");


        // Returns 
        var parentStats = function( jParent ) {
            return {
                    "left": jParent.offset().left,
                    "top": jParent.offset().top,
                    "width": jParent.outerWidth(),
                    "height": jParent.outerHeight(),
                    "innerWidth": jParent.innerWidth(),
                    "innerHeight": jParent.innerHeight(),
                    "right": jParent.offset().left + jParent.outerWidth(),
                    "bottom": jParent.offset().top + jParent.outerHeight(),
                    "edge": {
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
        };

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
                    "left": mouse.x - target.deltaX - parent.left - parent.edge.left,
                    "top":  mouse.y - target.deltaY - parent.top - parent.edge.top,
                    "right": parent.right - parent.edge.right - mouse.x - (box.width - target.deltaX),
                    "bottom": parent.bottom - parent.edge.bottom - mouse.y - (box.height - target.deltaY),
                };

            // check left side. Remember it cannot leave the parent.
            if ( newBoxPos.left <= 0) {
                
                // We assume at this point that the left side of our object is the left side of the
                // parent. So the global mouse position with respect to the parent tells us the new
                // offset from the object

                target.deltaX = mouse.x - parent.left;

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
                /* + b). To get b, however, we need to take the width of the parent minus the width
                /* of the child (since the child will be all the way up against the right side).
                /* Then we get the following */

                target.deltaX = mouse.x - (parent.right - box.width);

                // Set the new value. Remember that the new position is the left side of the parent
                newBoxPos.right = 0;
            }


            // check top side. This is basically the same as the check for the left side but in
            // y instead of x
            if ( newBoxPos.top <= 0) {
                target.deltaY = mouse.y - parent.top;

                newBoxPos.top = 0;
            }

            // check bottom side. This is basically the same as the check for the right side but in
            // y instead of x
            if ( newBoxPos.bottom <= 0) {
                target.deltaY = mouse.y - (parent.bottom - box.height);

                newBoxPos.bottom = 0;
            }


            var callbackProps = {
                "left": newBoxPos.left,
                "right": newBoxPos.right,
                "top": newBoxPos.top,
                "bottom": newBoxPos.bottom,
                "leftSide": newBoxPos.left < newBoxPos.right,
                "topSide": newBoxPos.top < newBoxPos.bottom
            };

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

            jThis.css( newBoxPos );

            if ( callback ) {
                callback(target, callbackProps );
            }

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


            this.move = true;

            // We need to know the distance between the place they click and the upper left-hand
            // corner. This stores what that is when they start off
            this.deltaX = mouse.x - startOffset.left;
            this.deltaY = mouse.y - startOffset.top;

            
            trackMouse(this);

            // When we mouse up we want to end the magic. There are also implications with the
            // bounds checking where the mouse can end up outside the object. No matter where you
            // mouse up, you should stop dragging. But since we're calling mouseup on the body it
            // uses body as the target and loses all references to this object, so we need to do
            // this ugly little hack where we add a reference to this to the namespace and call it
            // in the function

            var thisBox = this;

            var mouseUpFunction = function ( event ) {
                thisBox.move = false;
                $("body").unbind("mouseup", mouseUpFunction);
            };

            $("body").mouseup( mouseUpFunction );

            event.stopPropagation();
        });


        /* Resizing */

        var trackResize = function ( target, handle){

            // Takes in parameter handle and direction and returns true if that handle touches that
            // direction. I know, it's a simple helper function but it's useful.
            var touches = function ( direction ){
                return handle.indexOf(direction) !== -1;
            }


            /* Note that this function's target is the HANDLE not the actual box */
            var jHandle = $(target),
                jBox = jHandle.parent(),
                jParent = jBox.parent(),
                parent = parentStats( jParent ),

                mouse = $.fn.manipulate.mouse,

                mouse = {
                    "x": mouse.x,
                    "y": mouse.y,
                },

                /* I was using jBox.offset() but it turns out this gets a little weird when you
                /* switch from left to right */
                
                box = {
                    "left" : parseInt(jBox.css("left")),
                    "right" : parseInt(jBox.css("right")),
                    "top" : parseInt(jBox.css("top")),
                    "bottom" : parseInt(jBox.css("bottom")),
                    "width" : jBox.width(),
                    "height" : jBox.height()
                },
                newBoxPos = {
                    "left": box.left ? box.left : parent.innerWidth - box.right - box.width,
                    "right": box.right ? box.right : parent.innerWidth - box.left - box.width,
                    "top": box.top ? box.top : parent.innerHeight - box.bottom - box.height,
                    "bottom": box.bottom ? box.bottom : parent.innerHeight - box.top - box.height,
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

            // It's possible that newBoxPos.left and .top get freaked out when box.left is 0px
            // because the if statement evaluates to false. Investigate further later
            var setLeft = function(){
                mouse.leftX = mouse.x - target.deltaX;
                box.width = newBoxPos.left + parent.left + parent.edge.left - mouse.leftX + box.width;
                newBoxPos.width = box.width;
                newBoxPos.left = mouse.leftX - parent.left - parent.edge.left;

                fixHorizontalHandles();
            },
            setRight = function(){
                mouse.rightX = mouse.x +(HANDLE_WIDTH - target.deltaX);
                box.width = mouse.rightX - (newBoxPos.left + parent.left + parent.edge.left);
                newBoxPos.width = box.width;
                newBoxPos.right = parent.right - mouse.rightX - parent.edge.left;

                fixHorizontalHandles();
            },
            setTop = function(){
                mouse.topY = mouse.y - target.deltaY;
                box.height = newBoxPos.top + parent.top + parent.edge.top0 - mouse.topY + box.height;
                newBoxPos.height = box.height;
                newBoxPos.top = mouse.topY - parent.top - parent.edge.top;

                fixVerticalHandles();
            },
            setBottom = function(){
                mouse.bottomY = mouse.y +(HANDLE_WIDTH - target.deltaY);
                box.height = mouse.bottomY - jBox.offset().top;
                newBoxPos.height = box.height;
                newBoxPos.bottom = parent.bottom - mouse.bottomY - parent.edge.top;

                fixVerticalHandles();
            };

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

            if ( newBoxPos.left <= 0) {
                target.deltaX = mouse.x - parent.edge.left - parent.left;

                setLeft();
            }
            if ( newBoxPos.right <= 0) {
                target.deltaX = HANDLE_WIDTH - (parent.right -parent.edge.right- mouse.x);

                setRight();
            }
            if ( newBoxPos.top <= 0) {
                target.deltaY = mouse.y - parent.edge.top - parent.top;

                setTop();
            }
            if ( newBoxPos.bottom <= 0) {
                target.deltaY = HANDLE_WIDTH - (parent.bottom -parent.edge.bottom- mouse.y);

                setBottom();
            }




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


            var mouseUpFunction = function ( event ) {
                target.resize = false;
                $("body").unbind("mouseup", mouseUpFunction);
            };

            $("body").mouseup( mouseUpFunction );

            event.stopPropagation();
        };

        var handleNames = ["e", "w", "n", "s", "ne", "nw", "se", "sw"],
            handleColors = {
                "e": "red",
                "w": "green",
                "n": "blue",
                "s" : "magenta",
                "ne" : "cyan",
                "nw" : "cyan",
                "se" : "cyan",
                "sw" : "cyan"
            }
            handleStyles = {};

        $.each(handleNames, function(index, direction) {
            handleStyles[direction] = {
                "position":"absolute",
                "background-color":handleColors[direction],
                "margin":"0px",
                "padding":"0px",
                "height": direction === 'e' || direction === 'w'
                            ? boxWrapper.outerHeight()- 2*HANDLE_WIDTH + "px"
                            : HANDLE_WIDTH + "px",
                "width": direction === 'n' || direction === 's'
                            ? boxWrapper.outerHeight()- 2*HANDLE_WIDTH + "px"
                            : HANDLE_WIDTH + "px",
                "cursor": direction + "-resize"
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
