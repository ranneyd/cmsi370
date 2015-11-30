/* This allows us to not only have a closure but if they have $ aliased as
something not jQuery it still works*/ 

(function ( $ ) {
    /* */
    $.fn.manipulate = function ( callback ) {
        var startMove = function ( event ) {
            var eThis = event.target,
                jThis = $(eThis),
                startOffset = jThis.offset();
            
            // Save the mouse offset in the event target
            eThis.offsetX = event.pageX - startOffset.left;
            eThis.offsetY = event.pageY - startOffset.top;

            eThis.moving = true;
        };
        var trackMove = function ( event ) {
            var eThis = event.target,
                jThis = $(eThis);

            if ( eThis.moving ) {
                var newX = event.pageX - eThis.offsetX,
                    newY = event.pageY - eThis.offsetY;

                if( !checkBounds( jThis, newX, newY) ) {
                    
                } 


                jThis.css( {
                    left: event.pageX - eThis.offsetX,
                    top: event.pageY - eThis.offsetY
                } );
            }
        };

        var endMove = function ( event ) {
            var eThis = event.target;
            
            eThis.moving = false;
        };


        /**
         * Returns true if the box is entirely inside the parent container
         */
        checkBounds: function(box, newX, newY){
            // We benefit from the boxes being positioned relative to the parent.
            // 0 is the top/left and height/width is the position of the top/right
            return newX > 0             // left side. 
                && newY > 0             // top
                && newX + box.width() 
                        < box.parent().width()      // right side.
                && newY + box.height() 
                        < box.parent().height();    // bottom.
        }


        this.css( {
            "cursor":"move",
            "position":"absolute",
        } );
        
        this.mousedown(startMove);
        this.mousemove(trackMove);
        this.mouseup(endMove);

        return this;
    };
 
} ( jQuery ));
