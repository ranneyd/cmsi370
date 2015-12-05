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
            y: event.pageY
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
                mouse = $.fn.manipulate.mouse;
            
            jThis.offset( {
                left: mouse.x - target.deltaX,
                top: mouse.y - target.deltaY
            });


            if ( target.move ) {
                window.requestAnimationFrame( function () {
                    trackMouse( target );
                });
            }
        }

        // Here is where the tracking magic begins
        this.mousedown( function ( event ) {

            var target = event.target,
                startOffset = $(target).offset(),
                // I could use event.pageX and event.pageY but this is more
                // consistent
                mouse = $.fn.manipulate.mouse;


            target.move = true;

            // We need to know the distance between the place they click and the
            // upper left-hand corner. This stores what that is when they start
            // off
            target.deltaX = mouse.x - startOffset.left;
            target.deltaY = mouse.y - startOffset.top;

            
            trackMouse(target);

            event.stopPropagation();
        });

        // When we mouse up we want to end the magic
        this.mouseup( function ( event ) {
            event.target.move = false;
        });

        return this;
    };
 
} ( jQuery ));
