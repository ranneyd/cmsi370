/* This allows us to not only have a closure but if they have $ aliased as
something not jQuery it still works*/ 

(function ( $ ) {
    /* */
    $.fn.manipulate = function ( callback ) {
        var startMove = function ( event ) {
            var jThis = $(event.target),
                startOffset = jThis.offset();
            
            // Save the mouse offset in the event target
            jThis.offsetX = event.pageX - startOffset.left;
            jThis.offsetY = event.pageY - startOffset.top;

            jThis.moving = true;
            console.log("clickeroo");
        };
        var trackMove = function ( event ) {
            console.log("mewve");
            var jThis = $(event.target);
            if ( jThis.moving ) {
                var offset = jThis.offset();
                // Save the mouse offset in the event target
                offset.left = event.pageX + jThis.offsetX;
                offset.top = event.pageY + jThis.offsetY;
            }
        };

        this.css( {
            "cursor":"move",
            "position":"absolute",
        } );


        
        this.mousedown(startMove);
        this.mousemove(trackMove);
        // this.mouseup(endMove);

        return this;
    };
 
} ( jQuery ));
