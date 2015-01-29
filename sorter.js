/**
 * Sorter v0.1
 * Date:   ‎2015-01-07 20:15‎
 * Author: ‎Sanonz <sanonz@126.com>‎
 */


(function(){
	var Sorter = function(container, options){
		if( !(this instanceof arguments.callee) ) return new arguments.callee(container, options);

		this.settings = extend({
			vertical: true,//是否开启上下移动
			horizontal: true,//是否开启左右移动
			indentation: 30,//缩进距离(px)
			// maxDepth: 3,//向右移动的最大深度
			borderWidth: 2,//边框宽度
			dataDepth: 'data-sorter-depth',
			rowClassName: 'sorter-row',
			depthClassName: 'sorter-depth-',
			heplerClassName: 'sorter-helper',
			sublistClassName: 'sorter-sublist',
			placeholderClassName: 'sorter-placeholder',
			onStart: null,//监听开始
			onMove: null,//监听移动
			onEnd: null//监听结束
		}, options);

		this.dragdrop = {
			list: [],
			timeout: 0,
			move: false,
			subitem: [],
			target: null,
			sublist: null,
			isTouch: false,
			parentDepth: 0,
			tbody: container,
			placeholder: null,
			depth: {s: 0, e: 0},
			start: {x: 0, y: 0},
			changed: {x: 0, y: 0},
			position: {x: 0, y: 0},
			indentation: {x: 0, y: 0},
			onStart: [],
			onMove: [],
			onEnd: []
		};

		isFn(this.settings.onStart) && this.dragdrop.onStart.push(this.settings.onStart);
		isFn(this.settings.onMove) && this.dragdrop.onStart.push(this.settings.onMove);
		isFn(this.settings.onEnd) && this.dragdrop.onStart.push(this.settings.onEnd);
		
		this.init();
	}, data = {events: {}};

	Sorter.prototype = {
		init: function(){
			onListen('mousedown touchstart', this.dragdrop.tbody, '.' + this.settings.rowClassName, this.dragdropHandle, false, this);
			addListen('mousemove touchmove mouseup touchend', document, this.dragdropHandle, false, this);
			addListen('wheel', document, this.dragdropHandle, false, this);
			this.dragdrop.placeholder = document.createElement('div');
			addClass(this.dragdrop.placeholder, this.settings.rowClassName + ' ' + this.settings.placeholderClassName);
		},
		dragdropHandle: function(e){
			switch(true)
			{
				case e.type == 'touchstart' || e.type == 'mousedown':
					this.dragdropStart(e);
					break;
				case e.type == 'touchmove' || e.type == 'mousemove':
					this.dragdrop.move && this.dragdropMove(e);
					break;
				case e.type == 'touchend' || e.type == 'mouseup':
					this.dragdropEnd(e);
					break;
				case e.type == 'wheel':
					this.dragdrop.move && this.dragdropWheel(e);
			}
		},
		dragdropStart: function(e){
			var touches, self = this, dragdrop = self.dragdrop, settings = self.settings;
			if( dragdrop.move ) return;
			clearTimeout(dragdrop.timeout);
			dragdrop.isTouch = e.type == 'touchstart';
			computePage(e);
			touches = e.touches || [];
			dragdrop.start.x = dragdrop.changed.x = touches[0] ? touches[0].pageX : e.pageX;
			dragdrop.start.y = dragdrop.changed.y = touches[0] ? touches[0].pageY : e.pageY;

			dragdrop.timeout = setTimeout(function(){
				var list, pos,  width, height, style, subitem, sublist;
				cleanSelection();
				dragdrop.move = true;
				dragdrop.target = e._currentTarget;
				pos = getOffset(dragdrop.target);
				dragdrop.depth.e = 0;
				dragdrop.depth.s = self.depth(dragdrop.target) || 0;

				dragdrop.sublist = getChildrenByClassName(dragdrop.target, settings.sublistClassName)[0];
				if( dragdrop.sublist ){
					subitem = dragdrop.subitem = self.findSubitem(dragdrop.depth.s);
					for(var i = 0, len = subitem.length; i < len; i++){
						dragdrop.sublist.appendChild(subitem[i]);
					}
				}

				style = getStyle(dragdrop.target);
				dragdrop.position.y = pos.top - (parseFloat(style.marginTop) || 0);
				dragdrop.position.x = pos.left - (parseFloat(style.marginLeft) || 0);
				width = dragdrop.target.offsetWidth;
				height = dragdrop.target.offsetHeight - (parseFloat(style.borderTopWidth) || 0) - (parseFloat(style.borderBottomWidth) || 0) - settings.borderWidth;
				addClass(dragdrop.target, settings.heplerClassName);
				setStyle(dragdrop.target, {
					top: dragdrop.position.y + 'px',
					left: dragdrop.position.x + 'px',
					width: width + 'px'
				});
				list = getChildrenByClassName(dragdrop.tbody, settings.rowClassName);
				for(var i in list){
					list.hasOwnProperty(i) && !hasClass(list[i], settings.heplerClassName) && dragdrop.list.push(list[i]);
				}
				setStyle(dragdrop.placeholder, {height: height + 'px'});
				self.depth(dragdrop.placeholder, dragdrop.depth.s);
				insertAfter(dragdrop.target, dragdrop.placeholder);
				self.setParentDepth();
				for(var i = 0, len = dragdrop.onStart.length; i < len; i++){
					dragdrop.onStart[i](e, dragdrop.target);
				}
			}, dragdrop.isTouch ? 1000 : 0);
		},
		dragdropMove: function(e){
			var dragdrop = this.dragdrop, target = dragdrop.target, th = target.offsetHeight, offsetT = {top: target.offsetTop, left: target.offsetLeft}, depth, x = 0, y = 0, tx = 0, ty = 0, flag = 0, tt = offsetT.top + th;
			dragdrop.isTouch && e.touches.length == 1 && e.preventDefault();
			cleanSelection();
			computePage(e);
			tx = dragdrop.isTouch ? e.touches[0].pageX : e.pageX;
			ty = dragdrop.isTouch ? e.touches[0].pageY : e.pageY;
			x = tx - dragdrop.changed.x;
			y = ty - dragdrop.changed.y;
			dragdrop.position.x += x;
			dragdrop.position.y += y;
			dragdrop.indentation.x += x;
			dragdrop.indentation.y += y;
			setStyle(target, {
				top: dragdrop.position.y + 'px',
				left: dragdrop.position.x + 'px'
			});

			if( this.settings.horizontal ){
				dragdrop.depth.e = Math.floor(dragdrop.indentation.x / this.settings.indentation);
				depth = this.limitDepth(dragdrop.depth.s + dragdrop.depth.e);
				this.depth(dragdrop.placeholder, depth);
			}

			dragdrop.changed.x  = tx;
			dragdrop.changed.y  = ty;

			if( this.settings.vertical ){
				for(var i = 0, len = dragdrop.list.length; i < len; i++){
					var elem = dragdrop.list[i], next, offsetC, offsetN, ch = 0, nh, tc;
					if( elem === target[0] ) continue;
					ch = elem.offsetHeight / 2;
					offsetC = {top: elem.offsetTop, left: elem.offsetLeft};
					tc = offsetC.top + ch;

					next = dragdrop.list[i + 1];
					if( next ){
						offsetN = {top: next.offsetTop, left: next.offsetLeft};
						nh = next.offsetHeight / 2;
						if( y > 0 ){
							if( tt > tc && tt < offsetN.top + nh ){
								flag = 2;
							}
						} else {
							if( offsetT.top > tc && offsetT.top < offsetN.top + nh ){
								flag = 2;
							} else if( tc > offsetT.top ){
								flag = 1;
							}
						}
					} else if( tt > tc ){
						flag = 2;
					}

					if( flag == 1 ){
						insertBefore(elem, dragdrop.placeholder);
						this.setParentDepth();
						break;
					} else if( flag == 2 ){
						insertAfter(elem, dragdrop.placeholder);
						this.setParentDepth();
						break;
					}
				}
			}
			for(var i = 0, len = dragdrop.onMove.length; i < len; i++){
				dragdrop.onMove[i](e, target);
			}
		},
		dragdropEnd: function(e){
			var dragdrop = this.dragdrop, depth, subitem, move;
			if( e.touches && e.touches.length > 0 ) return;
			clearTimeout(dragdrop.timeout);
			if( !dragdrop.move ) return;
			dragdrop.move = false;
			dragdrop.list.length  = 0;
			dragdrop.start.x = dragdrop.changed.x = dragdrop.indentation.x = 0;
			dragdrop.start.y = dragdrop.changed.y = dragdrop.indentation.y = 0;
			replaceWith(dragdrop.placeholder, dragdrop.target);
			depth = this.limitDepth(dragdrop.depth.s + dragdrop.depth.e);
			move = depth - dragdrop.depth.s;
			subitem = this.getSubitem();
			for(var i = subitem.length; i >= 0; i--){
				if( !subitem.item(i) ) continue;
				this.depth(subitem[i], this.depth(subitem[i]) + move);
				insertAfter(this.dragdrop.target, subitem[i]);
			}
			removeClass(dragdrop.target, this.settings.heplerClassName);
			setStyle(dragdrop.target, {
				top: '',
				left: '',
				width: ''
			});
			this.depth(dragdrop.target, depth);

			for(var i = 0, len = dragdrop.onEnd.length; i < len; i++){
				dragdrop.onEnd[i](e, dragdrop.target);
			}
		},
		dragdropWheel: function(e){
			this.dragdropMove(e);
		},
		depth: function(element, depth){
			var reg = new RegExp('\\b' + this.settings.depthClassName + '(\\d+)\\b'), rs;
			element = isElement(element) ? element : this.dragdrop.target;
			if( depth !== 0 && !depth ){
				rs = reg.exec(element.className);
				return rs ? +rs[1] : 0;
			}
			depth = parseInt(depth) || 0;
			depth = depth < 0 ? 0 : depth;
			if( reg.test(element.className) ){
				element.className = element.className.replace(reg, this.settings.depthClassName + depth);
			} else {
				element.className += ' ' + this.settings.depthClassName + depth;
			}
		},
		removeDepth: function(depth, element){
			element = isElement(element) ? element : this.dragdrop.target;
			element.className = element.className.replace(new RegExp('\\b' + this.settings.depthClassName + '\\d+\\b'), '').replace(/(^\s+|\s+$)/, '').replace(/\s{2,}/, ' ');
		},
		limitDepth: function(depth){
			var pd = this.dragdrop.parentDepth, md = this.settings.maxDepth;
			if( depth >= pd + 1 ){
				depth = pd + 1;
			} else if( depth >= pd / 2 ){
				depth = pd;
			} else {
				depth = 0;
			}
			return depth;
		},
		setParentDepth: function(){
			var depth;
			depth = this.nearDetph(true);
			return this.dragdrop.parentDepth = depth;
		},
		nearDetph: function(type){
			var t = this.dragdrop.placeholder;
			while(t = [getPrev, getNext][type ? 0 : 1](t, '.' + this.settings.rowClassName)){
				if( !hasClass(t, this.settings.heplerClassName) ){
					return this.depth(t);
				}
			}
			return -1;
		},
		getSubitem: function(){
			return this.dragdrop.sublist.children;
		},
		findSubitem: function(depth){
			var t, s, result = [];
			t = this.dragdrop.target;
			while(t = getNext(t, '.' + this.settings.rowClassName)){
				s = this.depth(t);
				if( s && s > depth ){
					result.push(t);
				} else {
					break;
				}
			}
			return result;
		},
		on: function(type, fn){
			var dragdrop = this.dragdrop;
			type = String(type);
			type = 'on' + type.charAt(0).toUpperCase() + type.substring(1)
			dragdrop[type] || (dragdrop[type] = []);
			isFn(fn) && dragdrop[type].push(fn);
			return this;
		}
	};


	function extend(target, source){
		if( typeof target !== 'object' || typeof source !== 'object' ) throw new TypeError('Arguments type failed!');
		for(var i in source){
			source.hasOwnProperty(i) && (target[i] = source[i]);
		}
		return target;
	}

	function isFn(fn){
		return typeof fn === 'function';
	}

	function cleanSelection(){
		document.getSelection ? document.getSelection().removeAllRanges() : document.selection.empty();
	}

	function insertBefore(element, node){
		if( !isElement(element) ) return false;
		element.parentNode.insertBefore(node, element);
	}

	function insertAfter(element, node){
		var next, pn;
		if( !isElement(element) ) return false;
		pn = element.parentNode;
		next = element.nextSibling;
		next ? pn.insertBefore(node, next) : pn.appendChild(node);
	}

	function replaceWith(element, node){
		if( !isElement(element) ) return false;
		element.parentNode.replaceChild(node, element);
	}

	function getElementByClassName(context, className){
		var elements, children, i = 0, result = [];
		isElement(context) || (context = document.body);
		if( context.querySelectorAll ){
			return context.querySelectorAll('.' + className);
		}

		children = context.getElementsByTagName('*');
		for(var i = 0, len = children.length; i < len; i++){
			hasClass(children[i], className) && result.push(children[i]);
		}

		return result;
	}

	function getChildrenByClassName(element, className){
		var children, i = 0, result = [];
		if( !isElement(element) ) return result;
		children = element.children;
		while( children.item(i) ){
			hasClass(children[i], className) && result.push(children[i]);
			++i;
		}
		return result;
	}

	function getPrev(element, selector, type){
		var t = element, s = null;
		while(t = t[type ? 'nextSibling' : 'previousSibling']){
			if( t.nodeType == 1 ){
				s = selector ? selectorCompare(t, selector) && (s = t) : (s = t);
				if( s ) return s;
			}
		}
		return s;
	}

	function getNext(element, selector){
		return getPrev(element, selector, true);
	}

	function getOffset(element){
		var op, offset = {top: 0, left: 0};
		if( !isElement(element) ) return offset;
		op = element;
		while( op ){
			offset.top += op.offsetTop;
			offset.left += op.offsetLeft;
			op = op.offsetParent;
		}
		return offset;
	}

	function setStyle(element, style){
		if( isElement(element) && typeof style === 'object' ){
			for(var i in style){
				element.style[i] = style[i];
			}
		}
		return element;
	}

	function computePage(e){
		var doc = document.documentElement, body = document.body;
		e.pageX || (e.pageX = e.clientX + (doc && doc.scrollLeft || body && body.scrollLeft || 0) - (doc && doc.clientLeft || body && body.clientLeft || 0));
		e.pageY || (e.pageY = e.clientY + (doc && doc.scrollTop || body && body.scrollTop || 0) - (doc && doc.clientTop || body && body.clientTop || 0));
	}

	function getStyle(element, property){
		var style;
		if( !isElement(element) ) return '';
		style = document.defaultView ? document.defaultView.getComputedStyle(element, null) : element.currentStyle;
		return property ? style[property] : style;
	}

	function hasClass(element, className){
		if( !isElement(element) || !className || !element.className ) return false;
		return new RegExp('\\b' + className + '\\b').test(element.className);
	}

	function addClass(element, className){
		if( !hasClass(element, className) ){
			element.className && (className = ' ' + className);
			element.className += className;
		}
		return element;
	}

	function removeClass(element, className){
		if( hasClass(element, className) ){
			element.className = element.className.replace(new RegExp('\\b' + className + '\\b'), '').replace(/(^\s+|\s+$)/, '').replace(/\s{2,}/, ' ');
		}
		return element;
	}

	function isElement(element){
		return typeof element === 'object' && (element.nodeType === 1 || element.nodeType === 9);
	}

	function selectorCompare(element, selector){
		selector = String(selector);
		switch( selector.charAt(0) )
		{
			case '.': return hasClass(element, selector.substr(1));
			case '#': return '#' + element.id == selector;
		}
		return false;
	}

	function addListen(type, element, listener, useCapture, call){
		var evt;
		if( typeof element !== 'object' || typeof listener !== 'function' ) return false;
		evt = data.events;
		type = String(type);
		types = type.replace(/(^\s+|\s$)/, '').split(/\s+/);
		element.listenEventId = evt[type] ? evt[type].length : (evt[type] = [], 0);
		evt[type].push(function(){
			listener.apply(call || element, arguments);
		});
		for(var i = 0, len = types.length; i < len; i++){
			element.addEventListener ? element.addEventListener(types[i], evt[type][element.listenEventId], useCapture) : element.attachEvent('on' + types[i], evt[type][element.listenEventId]);
		}
		return element;
	}

	function onListen(type, element, selector, listener, useCapture, call){
		if( !isElement(element) || typeof listener !== 'function' ) return false;
		addListen(type, element, function(e){
			var pn, target = e.target || e.srcElement;
			pn = target;
			while( pn ){
				if( selectorCompare(pn, selector) ){
					e._currentTarget = pn;
					listener.call(call || element, e);
					break;
				}
				pn = pn.parentNode;
			}
		}, useCapture, call);
	}

	function factory(body, options){
		var instance = [];
		body = String(body);
		switch( body.charAt(0) )
		{
			case '.':
				body = getElementByClassName(document.body, body.substr(1));
				for(var i = 0, len = body.length; i < len; i++){
					instance.push(new Sorter(body[i], options));
				}
				break;
			case '#':
				body = document.getElementById(body.substr(1));
				body && instance.push(new Sorter(body, options));
				break;
		}
		return instance;
	}


	if( typeof window.define === 'function' && define.amd ){
		define('Sorter', function(){
			return factory;
		});
	} else {
		window.Sorter = factory;
	}


})();