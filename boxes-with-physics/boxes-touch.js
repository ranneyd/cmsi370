// Period, in millis, between two animations post-flick
var TIME_STEP = 100;
// Coefficient of friction we'll use to slow down sliding
var FRICTION_COEF = 0.3;

var BoxesTouch = {
    /**
     * Sets up the given jQuery collection as the drawing area(s).
     */
    setDrawingArea: function (jQueryElements) {
        // Set up any pre-existing box elements for touch behavior.
        jQueryElements
            .addClass("drawing-area")
            
            // Event handler setup must be low-level because jQuery
            // doesn't relay touch-specific event properties.
            .each(function (index, element) {
                element.addEventListener("touchmove", BoxesTouch.trackDrag, false);
                element.addEventListener("touchend", BoxesTouch.endDrag, false);
            })

            .find("div.box").each(function (index, element) {
                element.addEventListener("touchstart", BoxesTouch.startMove, false);
                element.addEventListener("touchend", BoxesTouch.unhighlight, false);
            });
    },

    /**
     * Tracks a box as it is rubberbanded or moved across the drawing area.
     */
    trackDrag: function (event) {
        $.each(event.changedTouches, function (index, touch) {
            // Don't bother if we aren't tracking anything.
            if (touch.target.movingBox) {
                // Reposition the object.
                touch.target.movingBox.offset({
                    left: touch.pageX - touch.target.deltaX,
                    top: touch.pageY - touch.target.deltaY
                });
                // The current ones from last time are now the previous ones
                touch.target.prevX = touch.target.currentX;
            	touch.target.prevY = touch.target.currentY;
            	// The current ones now are what the position actually is.
            	touch.target.currentX = touch.target.movingBox.offset().left;
            	touch.target.currentY = touch.target.movingBox.offset().top;
            }
        });
        
        // Don't do any touch scrolling.
        event.preventDefault();
    },

    /**
     * Concludes a drawing or moving sequence.
     */
    endDrag: function (event) {
        $.each(event.changedTouches, function (index, touch) {
            if (touch.target.movingBox) {
            	var deltaX = touch.target.currentX - touch.target.prevX;
            	var deltaY = touch.target.currentY - touch.target.prevY;

            	BoxesTouch.slide($(touch.target), deltaX, deltaY);

                touch.target.movingBox = null;
            }
        });
    },

    /**
     * Indicates that an element is unhighlighted.
     */
    unhighlight: function () {
        $(this).removeClass("box-highlight");
    },

    /**
     * Begins a box move sequence.
     */
    startMove: function (event) {
        $.each(event.changedTouches, function (index, touch) {
            // Highlight the element.
            $(touch.target).addClass("box-highlight");

            // Take note of the box's current (global) location.
            var jThis = $(touch.target),
                startOffset = jThis.offset();

            // Set the drawing area's state to indicate that it is
            // in the middle of a move.
            touch.target.movingBox = jThis;
            

            touch.target.deltaX = touch.pageX - startOffset.left;
            touch.target.deltaY = touch.pageY - startOffset.top;


            // These will represent coordinates at the previous step
            // versus the coordinates now. They will be used for
            // computing velocity.
            touch.target.prevX = startOffset.left;
        	touch.target.prevY = startOffset.top;
        	touch.target.currentX = startOffset.left;
        	touch.target.currentY = startOffset.top;
        });

        // Eat up the event so that the drawing area does not
        // deal with it.
        event.stopPropagation();
    }

	/**
     * Recursively animate the box moving on its own post-flick
     */
    slide: function(box, deltaX, deltaY) {
    	// This will only trigger if either of them is non-zero
    	if(deltaX || deltaY){
    		var pos = box.position();
    		var newDeltaX = deltaX*FRICTION_COEF;
    		var newDeltaY = deltaY*FRICTION_COEF;
    		box.css({
    			"left": pos.left + newDeltaX,
    			"top": pos.top + newDeltaY,
    		});

    		setTimeout(function(){
    			BoxesTouch.slide(box, newDeltaX, newDeltaY);
    		}, TIME_STEP);
    	}
    }

};
