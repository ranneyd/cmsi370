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

        return this;
    };
 
} ( jQuery ));
