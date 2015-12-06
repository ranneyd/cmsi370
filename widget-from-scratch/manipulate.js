/* This allows us to not only have a closure but if they have $ aliased as something not jQuery it
still works */

(function ( $ ) {

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

        this.css( {
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
            "user-select": "none"
        } );

        /* Why not mousemove? */

        /* This method is better for a few reasons. Event listening is a little cumbersome because
        /* the events have to be bound and unbound. */

        var trackMouse = function ( target ) {

            var jThis = $(target),
                jParent = jThis.parent(),
                box = {
                    width: jThis.outerWidth(),
                    height: jThis.outerHeight(),
                }
                parent = {
                    left: jParent.offset().left,
                    top: jParent.offset().top,
                    width: jParent.outerWidth(),
                    height: jParent.outerHeight(),
                    right: jParent.offset().left + jParent.outerWidth(),
                    bottom: jParent.offset().top + jParent.outerHeight()
                },

                mouse = $.fn.manipulate.mouse,

                newBoxPos = {
                    left: mouse.x - target.deltaX - parent.left,
                    top:  mouse.y - target.deltaY - parent.top,
                    right: parent.right - mouse.x - (box.width - target.deltaX),
                    bottom: parent.bottom - mouse.y - (box.height - target.deltaY),
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

                target.deltaX = mouse.x - (parent.left + parent.width - box.width);

                // Set the new value. Remember that the new position is the left side of the parent
                newBoxPos.right = 0;
            }


            // check top side. This is basically the same as the check for the left side but in
            // y instead of x
            if ( newBoxPos.top <= 0) {
                target.deltaY = mouse.y - parent.top;

                newBoxPos.top = 0;
            }

            var callbackProps = {
                left: newBoxPos.left,
                right: newBoxPos.right,
                top: newBoxPos.top,
                bottom: newBoxPos.bottom,
                leftSide: newBoxPos.left < newBoxPos.right,
                topSide: newBoxPos.top < newBoxPos.bottom
            };

            // check bottom side. This is basically the same as the check for the right side but in
            // y instead of x
            if ( newBoxPos.bottom <= 0) {
                target.deltaY = mouse.y - (parent.top + parent.height - box.height);

                newBoxPos.bottom = 0;
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
        this.mousedown( function ( event ) {

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

        return this;
    };
 
} ( jQuery ));
