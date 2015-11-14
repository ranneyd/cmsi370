// Period, in millis, between two animations post-flick
var TIME_STEP = 1;
// Coefficient of friction we'll use to slow down sliding
var FRICTION_COEF = .98;

// Random boxes will have dimensions between MINIMUM_BOX_SIZE
// and MAXIMUM_BOX_SIZE
var MAXIMUM_BOX_SIZE = 100;
var MINIMUM_BOX_SIZE = 20;

var BoxesTouch = {
    /**
     * Sets up the given jQuery collection as the drawing area(s).
     */
    setDrawingArea: function (box) {
    	for(var i = 0; i < 3; ++i){
			var randomHeight = Math.round(Math.random()*(MAXIMUM_BOX_SIZE - MINIMUM_BOX_SIZE)) + MINIMUM_BOX_SIZE;
			var randomWidth = Math.round(Math.random()*(MAXIMUM_BOX_SIZE - MINIMUM_BOX_SIZE)) + MINIMUM_BOX_SIZE;
			box.append(
				$("<div>").css({
					"height" : Math.round(Math.random()*100),
					"width" : Math.round(Math.random()*100),
					"top": Math.round(Math.random()*(box.height()-randomHeight)),
					"left": Math.round(Math.random()*(box.width()-randomWidth)),
				})
			);
    	}

        // Set up any pre-existing box elements for touch behavior.
        box
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


            	var newX = touch.pageX - touch.target.deltaX;
            	var newY = touch.pageY - touch.target.deltaY;

            	// If they are moving it within the bounds of the parent
            	if(BoxesTouch.checkBounds($(touch.target), newX, newY)){
            		// Reposition the object.
	                touch.target.movingBox.offset({
	                    left: touch.pageX - touch.target.deltaX,
	                    top: touch.pageY - touch.target.deltaY
	                });
            	}
            	else{
            		// Presumably, the finger has moved, but the box has not,
            		// so we need new deltaX and deltaYs.
            		touch.target.deltaX = touch.pageX - touch.target.movingBox.offset().left;
            		touch.target.deltaY = touch.pageY - touch.target.movingBox.offset().top;
            	}

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
    },

	/**
     * Recursively animate the box moving on its own post-flick
     */
    slide: function(box, deltaX, deltaY) {
    	// This will only trigger if either of them is less than one pixel
    	if(Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1 ){
    		var pos = box.position();
    		var newDeltaX = deltaX*FRICTION_COEF;
    		var newDeltaY = deltaY*FRICTION_COEF;

    		var newPosX = pos.left + newDeltaX;
    		var newPosY = pos.top + newDeltaY;
    		// If it's going to move outside the container
    		if(!BoxesTouch.checkBounds(box, newPosX, newPosY)){
    			console.log("WALL");
    			// assume perfectly elastic walls
    			if(newPosX <= 0 || newPosX + box.width() > box.parent().width()){
    				newDeltaX = -newDeltaX;
    				newPosX = pos.left + newDeltaX;
    			}
    			// If it's out of bounds, and it isn't out of bounds for x, it is
    			// for y
    			else{
    				newDeltaY = -newDeltaY;
    				newPosY = pos.top + newDeltaY;
    			}
    		}
    		box.css({
    			"left": newPosX,
    			"top": newPosY,
    		});

    		setTimeout(function(){
    			BoxesTouch.slide(box, newDeltaX, newDeltaY);
    		}, TIME_STEP);
    	}
    },
    /**
     * Returns true if the box is entirely inside the parent container
     */
    checkBounds: function(box, newX, newY){
    	// We benefit from the boxes being positioned relative to the parent.
    	// 0 is the top/left and height/width is the position of the top/right
    	return newX > 0 			// left side. 
			&& newY > 0 			// top
			&& newX + box.width() 
					< box.parent().width() 		// right side.
			&& newY + box.height() 
					< box.parent().height(); 	// bottom.
    }

};
