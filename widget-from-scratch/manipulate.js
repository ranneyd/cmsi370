/* This allows us to not only have a closure but if they have $ aliased as
something not jQuery it still works*/ 

(function ( $ ) {
    /* */
    $.fn.manipulate = function ( callback ) {
        this.css( {
            "cursor":"move",
            "position":"absolute",
            //don't want object to be highlightable. Browser support a little spotty
            "-webkit-touch-callout": "none",
            "-webkit-user-select": "none",
            "khtml-user-select": "none",
            "-moz-user-select": "none",
            "-ms-user-select": "none",
            "user-select": "none"
        } );




        this.mousedown( function( event ) {
            var eThis = event.target,
                jThis = $(eThis),
                startOffset = jThis.offset();
            
            eThis.
            // Save the mouse offset in the event target
            eThis.offsetX = event.pageX - startOffset.left;
            eThis.offsetY = event.pageY - startOffset.top;

            jThis.parent().mousemove( function( event ) {
                var eThis = event.target,
                    jThis = $(eThis),
                    startOffset = jThis.offset();

                var newX = event.pageX - eThis.offsetX,
                    newY = event.pageY - eThis.offsetY,
                    parentWidth = jThis.parent().width(),
                    parentHeight = jThis.parent().height();

                // left side
                if ( newX <= parentWidth / 2 ) {
                    if( newX <= 0 ){
                        newX = 0;

                        eThis.offsetX = event.pageX - startOffset.left;
                    }

                    jThis.css( {
                        left: newX,
                        right:""
                    } );
                }

                // right side
                else {
                    // Distance from the right should be the full parent width
                    // minus the distance of box from the left and the width of
                    // the box

                    newRight = parentWidth - (event.pageX - eThis.offsetX) - jThis.width();

                    if ( newRight <= 0 ) {
                        newRight = 0;

                        eThis.offsetX = event.pageX - startOffset.left;
                    }

                    jThis.css( {
                        right: newRight,
                        left: ""
                    } );
                }

                // top
                if ( newY <= parentHeight / 2 ) {
                    if( newY <= 0 ){
                        newY = 0;

                        eThis.offsetY = event.pageY - startOffset.top;
                    }

                    jThis.css( {
                        top: newY,
                        bottom:""
                    } );
                }

                // bottom
                else {
                    // Distance from the right should be the full parent width
                    // minus the distance of box from the left and the width of
                    // the box

                    newBottom = parentHeight - (event.pageY - eThis.offsetY) - jThis.height();

                    if ( newBottom <= 0 ) {
                        newBottom = 0;

                        eThis.offsetY = event.pageY - startOffset.top;
                    }

                    jThis.css( {
                        bottom: newBottom,
                        right: ""
                    } );
                }
            });
        });
        

        this.mouseup( function ( event ) {
            $(event.target.parent).unbind("mousemove");
            $(event.target.parent).unbind("mouseup");
        });
        return this;
    };
 
} ( jQuery ));
