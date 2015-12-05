/* This allows us to not only have a closure but if they have $ aliased as
something not jQuery it still works */ 

(function ( $ ) {

    /* Track the position of the mouse and save it in the jQuery object for
    /* reference. 
    /*
    /* - Why do we need this?
    /* Neither javascript nor jquery has a really good way to just
    /* get the mouse position on the page. Since our mouse tracking is going to
    /* use requestAnimationFrame and not a mouse event (more on why this is
    /* further down) we need a way of getting the mouse position on the page
    /* independent of the information from mouse events. 
    /*
    /* - Why out here?
    /* We only want to bind this event once, and not for each manipulatable
    /* object since these values will be global. Thus, we put it outside the
    /* function definition so once the user loads this plug in the mouse
    /* position detection will automatically begin */

    $("body").mousemove( function ( event ) {
        $.fn.manipulate.mouse = {
            x: event.pageX,
            y: event.pageY,
        };
    });


    /* Make an object draggable and resizable. The callback will be invoked
    /* every time an object is moved or resized. The object will not be able to
    /* be positioned or sized in such a way that any part of it is outside the
    /* parent element.

    /* CAUTION: This function will set the  */

    /* CAUTION: If the parent element is the body tag, this will not work
    /* unless you set "height:100%". CSS is pretty dumb and if this isn't set
    /* explicitly the body could have a height of 0px or something equally
    /* silly and the object will not be able to move properly. */

    /* TODO: explain left vs right and what we pass to the callback */

    $.fn.manipulate = function ( callback ) {

        this.css( {
            // Give the movable object that nice moving crosshair to signify
            // that it is movable
            "cursor":"move",
            // The manipulation requires the object to be absolutely positioned
            "position":"absolute",
            // don't want object to be highlightable. Browser support a little
            // spotty so we need a few styles to cover all of them
            "-webkit-touch-callout": "none",
            "-webkit-user-select": "none",
            "khtml-user-select": "none",
            "-moz-user-select": "none",
            "-ms-user-select": "none",
            "user-select": "none"
        } );

        /* Why not mousemove? */

        /* This method is better for a few reasons. Event listening is a little
        /* cumbersome because the events have to be bound and unbound. */

        var trackMouse = function ( target ) {

            var jThis = $(target),
                parent = jThis.parent(),
                parentOffset = parent.offset(),
                mouse = $.fn.manipulate.mouse,
                boxOffset = jThis.offset();
                newBoxPos = {
                    left: mouse.x - target.deltaX,
                    top:  mouse.y - target.deltaY,
                };

            // check left side
            if ( newBoxPos.left <= parentOffset.left) {
                
                // Since this is up against the left side, offset is mouse
                // distance from left side. Also, boxOffset.left = 0 so 
                // mouse.x - bosOffset.left = mouse.x

                target.deltaX = mouse.x - parentOffset.left;

                // Set the new values. We may need to zero-out right value
                newBoxPos.left = parentOffset.left;
                newBoxPos.right = "";
            }


            // check top side
            if ( newBoxPos.top <= parentOffset.top) {
                
                // Since this is up against the top side, offset is mouse
                // distance from top side. Also, boxOffset.top = 0 so 
                // mouse.y - bosOffset.yop = mouse.y

                target.deltaY = mouse.y - parentOffset.top;

                // Set the new values. We may need to zero-out bottom value
                newBoxPos.top = parentOffset.top;
                newBoxPos.bottom = "";
            }

            jThis.offset( newBoxPos );


            if ( target.move ) {
                window.requestAnimationFrame( function () {
                    trackMouse( target );
                });
            }
        }

        // Here is where the tracking magic begins
        this.mousedown( function ( event ) {

            // In a jQuery mouse event, 'this' is the element that has the event
            // bound to it. It's a little less expressive to use this than
            // event.target, but event.target could have implications if the
            // user drags over another manipulable object that has a higher
            // z-index.

            var startOffset = $(this).offset(),
                // I could use event.pageX and event.pageY but this is more
                // consistent
                mouse = $.fn.manipulate.mouse;


            this.move = true;

            // We need to know the distance between the place they click and the
            // upper left-hand corner. This stores what that is when they start
            // off
            this.deltaX = mouse.x - startOffset.left;
            this.deltaY = mouse.y - startOffset.top;

            
            trackMouse(this);


            // When we mouse up we want to end the magic.

            $(this).mouseup( function ( event ) {
                this.move = false;
                $(this).unbind("mouseup");
            });

            event.stopPropagation();
        });

        return this;
    };
 
} ( jQuery ));
