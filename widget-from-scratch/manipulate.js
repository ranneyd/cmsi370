/* This allows us to not only have a closure but if they have $ aliased as
something not jQuery it still works*/ 

(function ( $ ) {
    /* */
    $.fn.manipulate = function ( callback ) {
        this.css( {
            "cursor":"move",
            "position":"absolute",
        } );




        this.mousedown( function( event ) {
            var eThis = event.target,
                jThis = $(eThis),
                startOffset = jThis.offset();
            
            // Save the mouse offset in the event target
            eThis.offsetX = event.pageX - startOffset.left;
            eThis.offsetY = event.pageY - startOffset.top;

            jThis.mousemove( function( event ) {
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
            });

            jThis.mouseleave( function ( event ) {
                event.target.unbind("mousemove");
            });
        });
        
        return this;
    };
 
} ( jQuery ));
