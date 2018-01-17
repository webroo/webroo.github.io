// requestAnimationFrame polyfill by Erik Möller, fixes from Paul Irish and Tino Zijdel
(function() {
	"use strict";
	var lastTime = 0;
	var vendors = ['ms', 'moz', 'webkit', 'o'];
	for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
		window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
		window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
	}

	if (!window.requestAnimationFrame) {
		window.requestAnimationFrame = function(callback, element) {
			var currTime = new Date().getTime();
			var timeToCall = Math.max(0, 16 - (currTime - lastTime));
			var id = window.setTimeout(function() { callback(currTime + timeToCall); }, timeToCall);
			lastTime = currTime + timeToCall;
			return id;
		};
	}

	if (!window.cancelAnimationFrame) {
		window.cancelAnimationFrame = function(id) {
			clearTimeout(id);
		};
	}
})();

// CSS Helix
$(function() {
	"use strict";

	// Prevent vertical bounce on iPad
	$(document).on('touchmove', function(event) {
		if (!event.originalEvent.elementIsScrollable) {
			event.preventDefault();
		}
	});

	function HelixNode() {
		// Create node element
		this.$el = $('<div class="node"></div>');

		// Create image element and append to node
		this.image = $('<img draggable="false">').hide().appendTo(this.$el);

		// Firefox fix: prevents mousemove events being eaten by image dragging
		this.image.on('mousedown', function(event) {
			event.preventDefault();
		});

		// Fade in image after it's loaded
		this.image.load(function() {
			$(this).fadeIn();
		});
	}

	HelixNode.prototype.setImage = function(url) {
		this.image.attr('src', url);
	};

	var main = $('#main');

	// Firefox fix: -moz-perspective-origin doesn't like the default browser value of 50% 50%
	// so we set it explicitly in pixels
	main.css({'-moz-perspective-origin': main.width() / 2 + 'px ' + main.height() / 2 + 'px'});

	// The number of nodes and waves is dependent on the width of the browser window
	var WIDTH = main.width(),
		HEIGHT = main.height(),
		ARMS = 2,
		NODES_PER_ARM = Math.floor(WIDTH / 55),
		HELIX_Y = HEIGHT / 2,
		HELIX_SIZE = 110,
		CAMERA_ZOOM = 145,
		HELIX_WAVES = Math.round(WIDTH / 350),
		X_STEP = WIDTH / NODES_PER_ARM;

	var nodes = [],
		prevMouseX = NaN,
		momentumX = 0,
		isMouseDown = false;

	// Create and attach node elements for each arm
	// The nodes for both arms are stored sequentially in the same array
	// We use modulo to find the node's index for each arm
	for (var i = 0; i < NODES_PER_ARM * ARMS; i++) {
		var node = new HelixNode();
		node.x = (i % NODES_PER_ARM) * X_STEP;
		nodes.push(node);
		main.append(node.$el);
	}

	// Handle mousedown and touchdown for flinging the helix left/right
	main.on('mousedown touchstart', function(event) {
		isMouseDown = true;
		// Check for touches in the case of mobile safari
		if (event.originalEvent.touches) {
			prevMouseX = event.originalEvent.touches[0].pageX;
		} else {
			prevMouseX = event.clientX;
		}
	});

	main.on('mousemove touchmove', function(event) {
		if (isMouseDown) {
			// Add momentum based on how far the mouse was dragged since the last frame
			var diffX;
			if (event.originalEvent.touches) {
				diffX = event.originalEvent.touches[0].pageX - prevMouseX;
				prevMouseX = event.originalEvent.touches[0].pageX;
			} else {
				diffX = event.clientX - prevMouseX;
				prevMouseX = event.clientX;
			}
			momentumX += diffX * 0.01;
		}
	});

	// Handle mouseup both inside and outside the browser by using window
	$(window).on('mouseup touchend', function(event) {
		isMouseDown = false;
	});

	function renderFrame() {
		// Apply friction
		momentumX *= 0.97;

		for (var i = 0; i < nodes.length; i++) {
			var arm = Math.floor(i / NODES_PER_ARM);

			// Rotate the second arm opposite the first in 3D space
			var offset = arm * Math.PI;

			var node = nodes[i];
			node.x += momentumX + 0.5;

			// Recycle nodes
			if (node.x > WIDTH) {
				node.x = 0 + (node.x % WIDTH);
			} else if (node.x < 0) {
				node.x = WIDTH + (node.x % WIDTH);
			}

			// Calculate node position
			var x = node.x;
			var pos = x / WIDTH * Math.PI * HELIX_WAVES; // Position along the wave
			var y = Math.sin(pos + offset) * HELIX_SIZE + HELIX_Y;
			var z = Math.cos(pos - offset) * HELIX_SIZE + CAMERA_ZOOM;
			var rx = -pos;
			var rz = (arm === 0) ? -45 : -135; // Rotate nodes correctly for each arm
			var opacity = Math.cos(pos - offset) + 1.3; // Fade nodes further away

			node.$el.css({
				transform: 'translate3d('+x+'px,'+y+'px,'+z+'px) ' + 'rotateX('+rx+'rad) ' + 'rotateZ('+rz+'deg)',
				opacity: opacity
			});
		}

		window.requestAnimationFrame(renderFrame);
	}

	// Start helix
	window.requestAnimationFrame(renderFrame);

	// Load list of Instagram images
	$.ajax({
		url: 'https://api.instagram.com/v1/media/popular?client_id=8639987a855746bd851bac3613887866',
		dataType: 'jsonp',
		success: function(data) {
			// Prepare flat array of image urls
			var images = [];
			for (var i = 0; i < data.data.length; i++) {
				// Occasionally the url is returned on the thumbnail property
				images.push(data.data[i].images.thumbnail.url || data.data[i].images.thumbnail);
			}

			// Set image on each helix node, wrap if necessary
			for (i = 0; i < nodes.length; i++) {
				nodes[i].setImage(images[i % images.length]);
			}
		}
	});
});
