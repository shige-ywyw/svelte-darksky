
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.30.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    class apikey {
        private_key = '';
        constructor(){
            this.private_key = "22383e0d5e0700370ed7629b7aad7b9f";
        }
    }

    /*
     * @namespace Util
     *
     * Various utility functions, used by Leaflet internally.
     */

    // @function extend(dest: Object, src?: Object): Object
    // Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.
    function extend(dest) {
    	var i, j, len, src;

    	for (j = 1, len = arguments.length; j < len; j++) {
    		src = arguments[j];
    		for (i in src) {
    			dest[i] = src[i];
    		}
    	}
    	return dest;
    }

    // @function create(proto: Object, properties?: Object): Object
    // Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
    var create = Object.create || (function () {
    	function F() {}
    	return function (proto) {
    		F.prototype = proto;
    		return new F();
    	};
    })();

    // @function bind(fn: Function, …): Function
    // Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
    // Has a `L.bind()` shortcut.
    function bind$1(fn, obj) {
    	var slice = Array.prototype.slice;

    	if (fn.bind) {
    		return fn.bind.apply(fn, slice.call(arguments, 1));
    	}

    	var args = slice.call(arguments, 2);

    	return function () {
    		return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    	};
    }

    // @property lastId: Number
    // Last unique ID used by [`stamp()`](#util-stamp)
    var lastId = 0;

    // @function stamp(obj: Object): Number
    // Returns the unique ID of an object, assigning it one if it doesn't have it.
    function stamp(obj) {
    	/*eslint-disable */
    	obj._leaflet_id = obj._leaflet_id || ++lastId;
    	return obj._leaflet_id;
    	/* eslint-enable */
    }

    // @function throttle(fn: Function, time: Number, context: Object): Function
    // Returns a function which executes function `fn` with the given scope `context`
    // (so that the `this` keyword refers to `context` inside `fn`'s code). The function
    // `fn` will be called no more than one time per given amount of `time`. The arguments
    // received by the bound function will be any arguments passed when binding the
    // function, followed by any arguments passed when invoking the bound function.
    // Has an `L.throttle` shortcut.
    function throttle(fn, time, context) {
    	var lock, args, wrapperFn, later;

    	later = function () {
    		// reset lock and call if queued
    		lock = false;
    		if (args) {
    			wrapperFn.apply(context, args);
    			args = false;
    		}
    	};

    	wrapperFn = function () {
    		if (lock) {
    			// called too soon, queue to call later
    			args = arguments;

    		} else {
    			// call and lock until later
    			fn.apply(context, arguments);
    			setTimeout(later, time);
    			lock = true;
    		}
    	};

    	return wrapperFn;
    }

    // @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
    // Returns the number `num` modulo `range` in such a way so it lies within
    // `range[0]` and `range[1]`. The returned value will be always smaller than
    // `range[1]` unless `includeMax` is set to `true`.
    function wrapNum(x, range, includeMax) {
    	var max = range[1],
    	    min = range[0],
    	    d = max - min;
    	return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
    }

    // @function falseFn(): Function
    // Returns a function which always returns `false`.
    function falseFn() { return false; }

    // @function formatNum(num: Number, digits?: Number): Number
    // Returns the number `num` rounded to `digits` decimals, or to 6 decimals by default.
    function formatNum(num, digits) {
    	var pow = Math.pow(10, (digits === undefined ? 6 : digits));
    	return Math.round(num * pow) / pow;
    }

    // @function trim(str: String): String
    // Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
    function trim(str) {
    	return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
    }

    // @function splitWords(str: String): String[]
    // Trims and splits the string on whitespace and returns the array of parts.
    function splitWords(str) {
    	return trim(str).split(/\s+/);
    }

    // @function setOptions(obj: Object, options: Object): Object
    // Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `L.setOptions` shortcut.
    function setOptions(obj, options) {
    	if (!Object.prototype.hasOwnProperty.call(obj, 'options')) {
    		obj.options = obj.options ? create(obj.options) : {};
    	}
    	for (var i in options) {
    		obj.options[i] = options[i];
    	}
    	return obj.options;
    }

    var templateRe = /\{ *([\w_-]+) *\}/g;

    // @function template(str: String, data: Object): String
    // Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
    // and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
    // `('Hello foo, bar')`. You can also specify functions instead of strings for
    // data values — they will be evaluated passing `data` as an argument.
    function template(str, data) {
    	return str.replace(templateRe, function (str, key) {
    		var value = data[key];

    		if (value === undefined) {
    			throw new Error('No value provided for variable ' + str);

    		} else if (typeof value === 'function') {
    			value = value(data);
    		}
    		return value;
    	});
    }

    // @function isArray(obj): Boolean
    // Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
    var isArray = Array.isArray || function (obj) {
    	return (Object.prototype.toString.call(obj) === '[object Array]');
    };

    // @function indexOf(array: Array, el: Object): Number
    // Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
    function indexOf(array, el) {
    	for (var i = 0; i < array.length; i++) {
    		if (array[i] === el) { return i; }
    	}
    	return -1;
    }

    // @property emptyImageUrl: String
    // Data URI string containing a base64-encoded empty GIF image.
    // Used as a hack to free memory from unused images on WebKit-powered
    // mobile devices (by setting image `src` to this string).
    var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    // inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

    function getPrefixed(name) {
    	return window['webkit' + name] || window['moz' + name] || window['ms' + name];
    }

    var lastTime = 0;

    // fallback for IE 7-8
    function timeoutDefer(fn) {
    	var time = +new Date(),
    	    timeToCall = Math.max(0, 16 - (time - lastTime));

    	lastTime = time + timeToCall;
    	return window.setTimeout(fn, timeToCall);
    }

    var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;
    var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') ||
    		getPrefixed('CancelRequestAnimationFrame') || function (id) { window.clearTimeout(id); };

    // @function requestAnimFrame(fn: Function, context?: Object, immediate?: Boolean): Number
    // Schedules `fn` to be executed when the browser repaints. `fn` is bound to
    // `context` if given. When `immediate` is set, `fn` is called immediately if
    // the browser doesn't have native support for
    // [`window.requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame),
    // otherwise it's delayed. Returns a request ID that can be used to cancel the request.
    function requestAnimFrame(fn, context, immediate) {
    	if (immediate && requestFn === timeoutDefer) {
    		fn.call(context);
    	} else {
    		return requestFn.call(window, bind$1(fn, context));
    	}
    }

    // @function cancelAnimFrame(id: Number): undefined
    // Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).
    function cancelAnimFrame(id) {
    	if (id) {
    		cancelFn.call(window, id);
    	}
    }

    /*
     * @class Point
     * @aka L.Point
     *
     * Represents a point with `x` and `y` coordinates in pixels.
     *
     * @example
     *
     * ```js
     * var point = L.point(200, 300);
     * ```
     *
     * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
     *
     * ```js
     * map.panBy([200, 300]);
     * map.panBy(L.point(200, 300));
     * ```
     *
     * Note that `Point` does not inherit from Leaflet's `Class` object,
     * which means new classes can't inherit from it, and new methods
     * can't be added to it with the `include` function.
     */

    function Point(x, y, round) {
    	// @property x: Number; The `x` coordinate of the point
    	this.x = (round ? Math.round(x) : x);
    	// @property y: Number; The `y` coordinate of the point
    	this.y = (round ? Math.round(y) : y);
    }

    var trunc = Math.trunc || function (v) {
    	return v > 0 ? Math.floor(v) : Math.ceil(v);
    };

    Point.prototype = {

    	// @method clone(): Point
    	// Returns a copy of the current point.
    	clone: function () {
    		return new Point(this.x, this.y);
    	},

    	// @method add(otherPoint: Point): Point
    	// Returns the result of addition of the current and the given points.
    	add: function (point) {
    		// non-destructive, returns a new point
    		return this.clone()._add(toPoint(point));
    	},

    	_add: function (point) {
    		// destructive, used directly for performance in situations where it's safe to modify existing point
    		this.x += point.x;
    		this.y += point.y;
    		return this;
    	},

    	// @method subtract(otherPoint: Point): Point
    	// Returns the result of subtraction of the given point from the current.
    	subtract: function (point) {
    		return this.clone()._subtract(toPoint(point));
    	},

    	_subtract: function (point) {
    		this.x -= point.x;
    		this.y -= point.y;
    		return this;
    	},

    	// @method divideBy(num: Number): Point
    	// Returns the result of division of the current point by the given number.
    	divideBy: function (num) {
    		return this.clone()._divideBy(num);
    	},

    	_divideBy: function (num) {
    		this.x /= num;
    		this.y /= num;
    		return this;
    	},

    	// @method multiplyBy(num: Number): Point
    	// Returns the result of multiplication of the current point by the given number.
    	multiplyBy: function (num) {
    		return this.clone()._multiplyBy(num);
    	},

    	_multiplyBy: function (num) {
    		this.x *= num;
    		this.y *= num;
    		return this;
    	},

    	// @method scaleBy(scale: Point): Point
    	// Multiply each coordinate of the current point by each coordinate of
    	// `scale`. In linear algebra terms, multiply the point by the
    	// [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
    	// defined by `scale`.
    	scaleBy: function (point) {
    		return new Point(this.x * point.x, this.y * point.y);
    	},

    	// @method unscaleBy(scale: Point): Point
    	// Inverse of `scaleBy`. Divide each coordinate of the current point by
    	// each coordinate of `scale`.
    	unscaleBy: function (point) {
    		return new Point(this.x / point.x, this.y / point.y);
    	},

    	// @method round(): Point
    	// Returns a copy of the current point with rounded coordinates.
    	round: function () {
    		return this.clone()._round();
    	},

    	_round: function () {
    		this.x = Math.round(this.x);
    		this.y = Math.round(this.y);
    		return this;
    	},

    	// @method floor(): Point
    	// Returns a copy of the current point with floored coordinates (rounded down).
    	floor: function () {
    		return this.clone()._floor();
    	},

    	_floor: function () {
    		this.x = Math.floor(this.x);
    		this.y = Math.floor(this.y);
    		return this;
    	},

    	// @method ceil(): Point
    	// Returns a copy of the current point with ceiled coordinates (rounded up).
    	ceil: function () {
    		return this.clone()._ceil();
    	},

    	_ceil: function () {
    		this.x = Math.ceil(this.x);
    		this.y = Math.ceil(this.y);
    		return this;
    	},

    	// @method trunc(): Point
    	// Returns a copy of the current point with truncated coordinates (rounded towards zero).
    	trunc: function () {
    		return this.clone()._trunc();
    	},

    	_trunc: function () {
    		this.x = trunc(this.x);
    		this.y = trunc(this.y);
    		return this;
    	},

    	// @method distanceTo(otherPoint: Point): Number
    	// Returns the cartesian distance between the current and the given points.
    	distanceTo: function (point) {
    		point = toPoint(point);

    		var x = point.x - this.x,
    		    y = point.y - this.y;

    		return Math.sqrt(x * x + y * y);
    	},

    	// @method equals(otherPoint: Point): Boolean
    	// Returns `true` if the given point has the same coordinates.
    	equals: function (point) {
    		point = toPoint(point);

    		return point.x === this.x &&
    		       point.y === this.y;
    	},

    	// @method contains(otherPoint: Point): Boolean
    	// Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
    	contains: function (point) {
    		point = toPoint(point);

    		return Math.abs(point.x) <= Math.abs(this.x) &&
    		       Math.abs(point.y) <= Math.abs(this.y);
    	},

    	// @method toString(): String
    	// Returns a string representation of the point for debugging purposes.
    	toString: function () {
    		return 'Point(' +
    		        formatNum(this.x) + ', ' +
    		        formatNum(this.y) + ')';
    	}
    };

    // @factory L.point(x: Number, y: Number, round?: Boolean)
    // Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.

    // @alternative
    // @factory L.point(coords: Number[])
    // Expects an array of the form `[x, y]` instead.

    // @alternative
    // @factory L.point(coords: Object)
    // Expects a plain object of the form `{x: Number, y: Number}` instead.
    function toPoint(x, y, round) {
    	if (x instanceof Point) {
    		return x;
    	}
    	if (isArray(x)) {
    		return new Point(x[0], x[1]);
    	}
    	if (x === undefined || x === null) {
    		return x;
    	}
    	if (typeof x === 'object' && 'x' in x && 'y' in x) {
    		return new Point(x.x, x.y);
    	}
    	return new Point(x, y, round);
    }

    // @namespace SVG; @section
    // There are several static functions which can be called without instantiating L.SVG:

    // @function create(name: String): SVGElement
    // Returns a instance of [SVGElement](https://developer.mozilla.org/docs/Web/API/SVGElement),
    // corresponding to the class name passed. For example, using 'line' will return
    // an instance of [SVGLineElement](https://developer.mozilla.org/docs/Web/API/SVGLineElement).
    function svgCreate(name) {
    	return document.createElementNS('http://www.w3.org/2000/svg', name);
    }

    /*
     * @namespace Browser
     * @aka L.Browser
     *
     * A namespace with static properties for browser/feature detection used by Leaflet internally.
     *
     * @example
     *
     * ```js
     * if (L.Browser.ielt9) {
     *   alert('Upgrade your browser, dude!');
     * }
     * ```
     */

    var style = document.documentElement.style;

    // @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).
    var ie = 'ActiveXObject' in window;

    // @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.
    var ielt9 = ie && !document.addEventListener;

    // @property edge: Boolean; `true` for the Edge web browser.
    var edge = 'msLaunchUri' in navigator && !('documentMode' in document);

    // @property webkit: Boolean;
    // `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
    var webkit = userAgentContains('webkit');

    // @property android: Boolean
    // `true` for any browser running on an Android platform.
    var android = userAgentContains('android');

    // @property android23: Boolean; `true` for browsers running on Android 2 or Android 3.
    var android23 = userAgentContains('android 2') || userAgentContains('android 3');

    /* See https://stackoverflow.com/a/17961266 for details on detecting stock Android */
    var webkitVer = parseInt(/WebKit\/([0-9]+)|$/.exec(navigator.userAgent)[1], 10); // also matches AppleWebKit
    // @property androidStock: Boolean; `true` for the Android stock browser (i.e. not Chrome)
    var androidStock = android && userAgentContains('Google') && webkitVer < 537 && !('AudioNode' in window);

    // @property opera: Boolean; `true` for the Opera browser
    var opera = !!window.opera;

    // @property chrome: Boolean; `true` for the Chrome browser.
    var chrome = !edge && userAgentContains('chrome');

    // @property gecko: Boolean; `true` for gecko-based browsers like Firefox.
    var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;

    // @property safari: Boolean; `true` for the Safari browser.
    var safari = !chrome && userAgentContains('safari');

    var phantom = userAgentContains('phantom');

    // @property opera12: Boolean
    // `true` for the Opera browser supporting CSS transforms (version 12 or later).
    var opera12 = 'OTransition' in style;

    // @property win: Boolean; `true` when the browser is running in a Windows platform
    var win = navigator.platform.indexOf('Win') === 0;

    // @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.
    var ie3d = ie && ('transition' in style);

    // @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.
    var webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23;

    // @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.
    var gecko3d = 'MozPerspective' in style;

    // @property any3d: Boolean
    // `true` for all browsers supporting CSS transforms.
    var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;

    // @property mobile: Boolean; `true` for all browsers running in a mobile device.
    var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');

    // @property msPointer: Boolean
    // `true` for browsers implementing the Microsoft touch events model (notably IE10).
    var msPointer = !window.PointerEvent && window.MSPointerEvent;

    // @property pointer: Boolean
    // `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
    var pointer = !!(window.PointerEvent || msPointer);

    // @property touch: Boolean
    // `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
    // This does not necessarily mean that the browser is running in a computer with
    // a touchscreen, it only means that the browser is capable of understanding
    // touch events.
    var touch = !window.L_NO_TOUCH && (pointer || 'ontouchstart' in window ||
    		(window.DocumentTouch && document instanceof window.DocumentTouch));

    // @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.
    var mobileOpera = mobile && opera;

    // @property retina: Boolean
    // `true` for browsers on a high-resolution "retina" screen or on any screen when browser's display zoom is more than 100%.
    var retina = (window.devicePixelRatio || (window.screen.deviceXDPI / window.screen.logicalXDPI)) > 1;

    // @property passiveEvents: Boolean
    // `true` for browsers that support passive events.
    var passiveEvents = (function () {
    	var supportsPassiveOption = false;
    	try {
    		var opts = Object.defineProperty({}, 'passive', {
    			get: function () { // eslint-disable-line getter-return
    				supportsPassiveOption = true;
    			}
    		});
    		window.addEventListener('testPassiveEventSupport', falseFn, opts);
    		window.removeEventListener('testPassiveEventSupport', falseFn, opts);
    	} catch (e) {
    		// Errors can safely be ignored since this is only a browser support test.
    	}
    	return supportsPassiveOption;
    }());

    // @property canvas: Boolean
    // `true` when the browser supports [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
    var canvas = (function () {
    	return !!document.createElement('canvas').getContext;
    }());

    // @property svg: Boolean
    // `true` when the browser supports [SVG](https://developer.mozilla.org/docs/Web/SVG).
    var svg = !!(document.createElementNS && svgCreate('svg').createSVGRect);

    // @property vml: Boolean
    // `true` if the browser supports [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language).
    var vml = !svg && (function () {
    	try {
    		var div = document.createElement('div');
    		div.innerHTML = '<v:shape adj="1"/>';

    		var shape = div.firstChild;
    		shape.style.behavior = 'url(#default#VML)';

    		return shape && (typeof shape.adj === 'object');

    	} catch (e) {
    		return false;
    	}
    }());


    function userAgentContains(str) {
    	return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
    }

    /*
     * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
     */


    var POINTER_DOWN =   msPointer ? 'MSPointerDown'   : 'pointerdown';
    var POINTER_MOVE =   msPointer ? 'MSPointerMove'   : 'pointermove';
    var POINTER_UP =     msPointer ? 'MSPointerUp'     : 'pointerup';
    var POINTER_CANCEL = msPointer ? 'MSPointerCancel' : 'pointercancel';

    var _pointers = {};
    var _pointerDocListener = false;

    // Provides a touch events wrapper for (ms)pointer events.
    // ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

    function addPointerListener(obj, type, handler, id) {
    	if (type === 'touchstart') {
    		_addPointerStart(obj, handler, id);

    	} else if (type === 'touchmove') {
    		_addPointerMove(obj, handler, id);

    	} else if (type === 'touchend') {
    		_addPointerEnd(obj, handler, id);
    	}

    	return this;
    }

    function removePointerListener(obj, type, id) {
    	var handler = obj['_leaflet_' + type + id];

    	if (type === 'touchstart') {
    		obj.removeEventListener(POINTER_DOWN, handler, false);

    	} else if (type === 'touchmove') {
    		obj.removeEventListener(POINTER_MOVE, handler, false);

    	} else if (type === 'touchend') {
    		obj.removeEventListener(POINTER_UP, handler, false);
    		obj.removeEventListener(POINTER_CANCEL, handler, false);
    	}

    	return this;
    }

    function _addPointerStart(obj, handler, id) {
    	var onDown = bind$1(function (e) {
    		// IE10 specific: MsTouch needs preventDefault. See #2000
    		if (e.MSPOINTER_TYPE_TOUCH && e.pointerType === e.MSPOINTER_TYPE_TOUCH) {
    			preventDefault(e);
    		}

    		_handlePointer(e, handler);
    	});

    	obj['_leaflet_touchstart' + id] = onDown;
    	obj.addEventListener(POINTER_DOWN, onDown, false);

    	// need to keep track of what pointers and how many are active to provide e.touches emulation
    	if (!_pointerDocListener) {
    		// we listen document as any drags that end by moving the touch off the screen get fired there
    		document.addEventListener(POINTER_DOWN, _globalPointerDown, true);
    		document.addEventListener(POINTER_MOVE, _globalPointerMove, true);
    		document.addEventListener(POINTER_UP, _globalPointerUp, true);
    		document.addEventListener(POINTER_CANCEL, _globalPointerUp, true);

    		_pointerDocListener = true;
    	}
    }

    function _globalPointerDown(e) {
    	_pointers[e.pointerId] = e;
    }

    function _globalPointerMove(e) {
    	if (_pointers[e.pointerId]) {
    		_pointers[e.pointerId] = e;
    	}
    }

    function _globalPointerUp(e) {
    	delete _pointers[e.pointerId];
    }

    function _handlePointer(e, handler) {
    	e.touches = [];
    	for (var i in _pointers) {
    		e.touches.push(_pointers[i]);
    	}
    	e.changedTouches = [e];

    	handler(e);
    }

    function _addPointerMove(obj, handler, id) {
    	var onMove = function (e) {
    		// don't fire touch moves when mouse isn't down
    		if ((e.pointerType === (e.MSPOINTER_TYPE_MOUSE || 'mouse')) && e.buttons === 0) {
    			return;
    		}

    		_handlePointer(e, handler);
    	};

    	obj['_leaflet_touchmove' + id] = onMove;
    	obj.addEventListener(POINTER_MOVE, onMove, false);
    }

    function _addPointerEnd(obj, handler, id) {
    	var onUp = function (e) {
    		_handlePointer(e, handler);
    	};

    	obj['_leaflet_touchend' + id] = onUp;
    	obj.addEventListener(POINTER_UP, onUp, false);
    	obj.addEventListener(POINTER_CANCEL, onUp, false);
    }

    /*
     * Extends the event handling code with double tap support for mobile browsers.
     */

    var _touchstart = msPointer ? 'MSPointerDown' : pointer ? 'pointerdown' : 'touchstart';
    var _touchend = msPointer ? 'MSPointerUp' : pointer ? 'pointerup' : 'touchend';
    var _pre = '_leaflet_';

    // inspired by Zepto touch code by Thomas Fuchs
    function addDoubleTapListener(obj, handler, id) {
    	var last, touch,
    	    doubleTap = false,
    	    delay = 250;

    	function onTouchStart(e) {

    		if (pointer) {
    			if (!e.isPrimary) { return; }
    			if (e.pointerType === 'mouse') { return; } // mouse fires native dblclick
    		} else if (e.touches.length > 1) {
    			return;
    		}

    		var now = Date.now(),
    		    delta = now - (last || now);

    		touch = e.touches ? e.touches[0] : e;
    		doubleTap = (delta > 0 && delta <= delay);
    		last = now;
    	}

    	function onTouchEnd(e) {
    		if (doubleTap && !touch.cancelBubble) {
    			if (pointer) {
    				if (e.pointerType === 'mouse') { return; }
    				// work around .type being readonly with MSPointer* events
    				var newTouch = {},
    				    prop, i;

    				for (i in touch) {
    					prop = touch[i];
    					newTouch[i] = prop && prop.bind ? prop.bind(touch) : prop;
    				}
    				touch = newTouch;
    			}
    			touch.type = 'dblclick';
    			touch.button = 0;
    			handler(touch);
    			last = null;
    		}
    	}

    	obj[_pre + _touchstart + id] = onTouchStart;
    	obj[_pre + _touchend + id] = onTouchEnd;
    	obj[_pre + 'dblclick' + id] = handler;

    	obj.addEventListener(_touchstart, onTouchStart, passiveEvents ? {passive: false} : false);
    	obj.addEventListener(_touchend, onTouchEnd, passiveEvents ? {passive: false} : false);

    	// On some platforms (notably, chrome<55 on win10 + touchscreen + mouse),
    	// the browser doesn't fire touchend/pointerup events but does fire
    	// native dblclicks. See #4127.
    	// Edge 14 also fires native dblclicks, but only for pointerType mouse, see #5180.
    	obj.addEventListener('dblclick', handler, false);

    	return this;
    }

    function removeDoubleTapListener(obj, id) {
    	var touchstart = obj[_pre + _touchstart + id],
    	    touchend = obj[_pre + _touchend + id],
    	    dblclick = obj[_pre + 'dblclick' + id];

    	obj.removeEventListener(_touchstart, touchstart, passiveEvents ? {passive: false} : false);
    	obj.removeEventListener(_touchend, touchend, passiveEvents ? {passive: false} : false);
    	obj.removeEventListener('dblclick', dblclick, false);

    	return this;
    }

    /*
     * @namespace DomEvent
     * Utility functions to work with the [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Leaflet internally.
     */

    // Inspired by John Resig, Dean Edwards and YUI addEvent implementations.

    // @function on(el: HTMLElement, types: String, fn: Function, context?: Object): this
    // Adds a listener function (`fn`) to a particular DOM event type of the
    // element `el`. You can optionally specify the context of the listener
    // (object the `this` keyword will point to). You can also pass several
    // space-separated types (e.g. `'click dblclick'`).

    // @alternative
    // @function on(el: HTMLElement, eventMap: Object, context?: Object): this
    // Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
    function on(obj, types, fn, context) {

    	if (typeof types === 'object') {
    		for (var type in types) {
    			addOne(obj, type, types[type], fn);
    		}
    	} else {
    		types = splitWords(types);

    		for (var i = 0, len = types.length; i < len; i++) {
    			addOne(obj, types[i], fn, context);
    		}
    	}

    	return this;
    }

    var eventsKey = '_leaflet_events';

    // @function off(el: HTMLElement, types: String, fn: Function, context?: Object): this
    // Removes a previously added listener function.
    // Note that if you passed a custom context to on, you must pass the same
    // context to `off` in order to remove the listener.

    // @alternative
    // @function off(el: HTMLElement, eventMap: Object, context?: Object): this
    // Removes a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
    function off(obj, types, fn, context) {

    	if (typeof types === 'object') {
    		for (var type in types) {
    			removeOne(obj, type, types[type], fn);
    		}
    	} else if (types) {
    		types = splitWords(types);

    		for (var i = 0, len = types.length; i < len; i++) {
    			removeOne(obj, types[i], fn, context);
    		}
    	} else {
    		for (var j in obj[eventsKey]) {
    			removeOne(obj, j, obj[eventsKey][j]);
    		}
    		delete obj[eventsKey];
    	}

    	return this;
    }

    function browserFiresNativeDblClick() {
    	// See https://github.com/w3c/pointerevents/issues/171
    	if (pointer) {
    		return !(edge || safari);
    	}
    }

    var mouseSubst = {
    	mouseenter: 'mouseover',
    	mouseleave: 'mouseout',
    	wheel: !('onwheel' in window) && 'mousewheel'
    };

    function addOne(obj, type, fn, context) {
    	var id = type + stamp(fn) + (context ? '_' + stamp(context) : '');

    	if (obj[eventsKey] && obj[eventsKey][id]) { return this; }

    	var handler = function (e) {
    		return fn.call(context || obj, e || window.event);
    	};

    	var originalHandler = handler;

    	if (pointer && type.indexOf('touch') === 0) {
    		// Needs DomEvent.Pointer.js
    		addPointerListener(obj, type, handler, id);

    	} else if (touch && (type === 'dblclick') && !browserFiresNativeDblClick()) {
    		addDoubleTapListener(obj, handler, id);

    	} else if ('addEventListener' in obj) {

    		if (type === 'touchstart' || type === 'touchmove' || type === 'wheel' ||  type === 'mousewheel') {
    			obj.addEventListener(mouseSubst[type] || type, handler, passiveEvents ? {passive: false} : false);

    		} else if (type === 'mouseenter' || type === 'mouseleave') {
    			handler = function (e) {
    				e = e || window.event;
    				if (isExternalTarget(obj, e)) {
    					originalHandler(e);
    				}
    			};
    			obj.addEventListener(mouseSubst[type], handler, false);

    		} else {
    			obj.addEventListener(type, originalHandler, false);
    		}

    	} else if ('attachEvent' in obj) {
    		obj.attachEvent('on' + type, handler);
    	}

    	obj[eventsKey] = obj[eventsKey] || {};
    	obj[eventsKey][id] = handler;
    }

    function removeOne(obj, type, fn, context) {

    	var id = type + stamp(fn) + (context ? '_' + stamp(context) : ''),
    	    handler = obj[eventsKey] && obj[eventsKey][id];

    	if (!handler) { return this; }

    	if (pointer && type.indexOf('touch') === 0) {
    		removePointerListener(obj, type, id);

    	} else if (touch && (type === 'dblclick') && !browserFiresNativeDblClick()) {
    		removeDoubleTapListener(obj, id);

    	} else if ('removeEventListener' in obj) {

    		obj.removeEventListener(mouseSubst[type] || type, handler, false);

    	} else if ('detachEvent' in obj) {
    		obj.detachEvent('on' + type, handler);
    	}

    	obj[eventsKey][id] = null;
    }

    // @function stopPropagation(ev: DOMEvent): this
    // Stop the given event from propagation to parent elements. Used inside the listener functions:
    // ```js
    // L.DomEvent.on(div, 'click', function (ev) {
    // 	L.DomEvent.stopPropagation(ev);
    // });
    // ```
    function stopPropagation(e) {

    	if (e.stopPropagation) {
    		e.stopPropagation();
    	} else if (e.originalEvent) {  // In case of Leaflet event.
    		e.originalEvent._stopped = true;
    	} else {
    		e.cancelBubble = true;
    	}
    	skipped(e);

    	return this;
    }

    // @function disableScrollPropagation(el: HTMLElement): this
    // Adds `stopPropagation` to the element's `'wheel'` events (plus browser variants).
    function disableScrollPropagation(el) {
    	addOne(el, 'wheel', stopPropagation);
    	return this;
    }

    // @function disableClickPropagation(el: HTMLElement): this
    // Adds `stopPropagation` to the element's `'click'`, `'doubleclick'`,
    // `'mousedown'` and `'touchstart'` events (plus browser variants).
    function disableClickPropagation(el) {
    	on(el, 'mousedown touchstart dblclick', stopPropagation);
    	addOne(el, 'click', fakeStop);
    	return this;
    }

    // @function preventDefault(ev: DOMEvent): this
    // Prevents the default action of the DOM Event `ev` from happening (such as
    // following a link in the href of the a element, or doing a POST request
    // with page reload when a `<form>` is submitted).
    // Use it inside listener functions.
    function preventDefault(e) {
    	if (e.preventDefault) {
    		e.preventDefault();
    	} else {
    		e.returnValue = false;
    	}
    	return this;
    }

    // @function stop(ev: DOMEvent): this
    // Does `stopPropagation` and `preventDefault` at the same time.
    function stop(e) {
    	preventDefault(e);
    	stopPropagation(e);
    	return this;
    }

    // @function getMousePosition(ev: DOMEvent, container?: HTMLElement): Point
    // Gets normalized mouse position from a DOM event relative to the
    // `container` (border excluded) or to the whole page if not specified.
    function getMousePosition(e, container) {
    	if (!container) {
    		return new Point(e.clientX, e.clientY);
    	}

    	var scale = getScale(container),
    	    offset = scale.boundingClientRect; // left and top  values are in page scale (like the event clientX/Y)

    	return new Point(
    		// offset.left/top values are in page scale (like clientX/Y),
    		// whereas clientLeft/Top (border width) values are the original values (before CSS scale applies).
    		(e.clientX - offset.left) / scale.x - container.clientLeft,
    		(e.clientY - offset.top) / scale.y - container.clientTop
    	);
    }

    // Chrome on Win scrolls double the pixels as in other platforms (see #4538),
    // and Firefox scrolls device pixels, not CSS pixels
    var wheelPxFactor =
    	(win && chrome) ? 2 * window.devicePixelRatio :
    	gecko ? window.devicePixelRatio : 1;

    // @function getWheelDelta(ev: DOMEvent): Number
    // Gets normalized wheel delta from a wheel DOM event, in vertical
    // pixels scrolled (negative if scrolling down).
    // Events from pointing devices without precise scrolling are mapped to
    // a best guess of 60 pixels.
    function getWheelDelta(e) {
    	return (edge) ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
    	       (e.deltaY && e.deltaMode === 0) ? -e.deltaY / wheelPxFactor : // Pixels
    	       (e.deltaY && e.deltaMode === 1) ? -e.deltaY * 20 : // Lines
    	       (e.deltaY && e.deltaMode === 2) ? -e.deltaY * 60 : // Pages
    	       (e.deltaX || e.deltaZ) ? 0 :	// Skip horizontal/depth wheel events
    	       e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
    	       (e.detail && Math.abs(e.detail) < 32765) ? -e.detail * 20 : // Legacy Moz lines
    	       e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
    	       0;
    }

    var skipEvents = {};

    function fakeStop(e) {
    	// fakes stopPropagation by setting a special event flag, checked/reset with skipped(e)
    	skipEvents[e.type] = true;
    }

    function skipped(e) {
    	var events = skipEvents[e.type];
    	// reset when checking, as it's only used in map container and propagates outside of the map
    	skipEvents[e.type] = false;
    	return events;
    }

    // check if element really left/entered the event target (for mouseenter/mouseleave)
    function isExternalTarget(el, e) {

    	var related = e.relatedTarget;

    	if (!related) { return true; }

    	try {
    		while (related && (related !== el)) {
    			related = related.parentNode;
    		}
    	} catch (err) {
    		return false;
    	}
    	return (related !== el);
    }

    /*
     * @namespace DomUtil
     *
     * Utility functions to work with the [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
     * tree, used by Leaflet internally.
     *
     * Most functions expecting or returning a `HTMLElement` also work for
     * SVG elements. The only difference is that classes refer to CSS classes
     * in HTML and SVG classes in SVG.
     */


    // @property TRANSFORM: String
    // Vendor-prefixed transform style name (e.g. `'webkitTransform'` for WebKit).
    var TRANSFORM = testProp(
    	['transform', 'webkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

    // webkitTransition comes first because some browser versions that drop vendor prefix don't do
    // the same for the transitionend event, in particular the Android 4.1 stock browser

    // @property TRANSITION: String
    // Vendor-prefixed transition style name.
    var TRANSITION = testProp(
    	['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

    // @property TRANSITION_END: String
    // Vendor-prefixed transitionend event name.
    var TRANSITION_END =
    	TRANSITION === 'webkitTransition' || TRANSITION === 'OTransition' ? TRANSITION + 'End' : 'transitionend';


    // @function get(id: String|HTMLElement): HTMLElement
    // Returns an element given its DOM id, or returns the element itself
    // if it was passed directly.
    function get(id) {
    	return typeof id === 'string' ? document.getElementById(id) : id;
    }

    // @function getStyle(el: HTMLElement, styleAttrib: String): String
    // Returns the value for a certain style attribute on an element,
    // including computed values or values set through CSS.
    function getStyle(el, style) {
    	var value = el.style[style] || (el.currentStyle && el.currentStyle[style]);

    	if ((!value || value === 'auto') && document.defaultView) {
    		var css = document.defaultView.getComputedStyle(el, null);
    		value = css ? css[style] : null;
    	}
    	return value === 'auto' ? null : value;
    }

    // @function create(tagName: String, className?: String, container?: HTMLElement): HTMLElement
    // Creates an HTML element with `tagName`, sets its class to `className`, and optionally appends it to `container` element.
    function create$1(tagName, className, container) {
    	var el = document.createElement(tagName);
    	el.className = className || '';

    	if (container) {
    		container.appendChild(el);
    	}
    	return el;
    }

    // @function remove(el: HTMLElement)
    // Removes `el` from its parent element
    function remove(el) {
    	var parent = el.parentNode;
    	if (parent) {
    		parent.removeChild(el);
    	}
    }

    // @function toFront(el: HTMLElement)
    // Makes `el` the last child of its parent, so it renders in front of the other children.
    function toFront(el) {
    	var parent = el.parentNode;
    	if (parent && parent.lastChild !== el) {
    		parent.appendChild(el);
    	}
    }

    // @function toBack(el: HTMLElement)
    // Makes `el` the first child of its parent, so it renders behind the other children.
    function toBack(el) {
    	var parent = el.parentNode;
    	if (parent && parent.firstChild !== el) {
    		parent.insertBefore(el, parent.firstChild);
    	}
    }

    // @function hasClass(el: HTMLElement, name: String): Boolean
    // Returns `true` if the element's class attribute contains `name`.
    function hasClass(el, name) {
    	if (el.classList !== undefined) {
    		return el.classList.contains(name);
    	}
    	var className = getClass(el);
    	return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
    }

    // @function addClass(el: HTMLElement, name: String)
    // Adds `name` to the element's class attribute.
    function addClass(el, name) {
    	if (el.classList !== undefined) {
    		var classes = splitWords(name);
    		for (var i = 0, len = classes.length; i < len; i++) {
    			el.classList.add(classes[i]);
    		}
    	} else if (!hasClass(el, name)) {
    		var className = getClass(el);
    		setClass(el, (className ? className + ' ' : '') + name);
    	}
    }

    // @function removeClass(el: HTMLElement, name: String)
    // Removes `name` from the element's class attribute.
    function removeClass(el, name) {
    	if (el.classList !== undefined) {
    		el.classList.remove(name);
    	} else {
    		setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
    	}
    }

    // @function setClass(el: HTMLElement, name: String)
    // Sets the element's class.
    function setClass(el, name) {
    	if (el.className.baseVal === undefined) {
    		el.className = name;
    	} else {
    		// in case of SVG element
    		el.className.baseVal = name;
    	}
    }

    // @function getClass(el: HTMLElement): String
    // Returns the element's class.
    function getClass(el) {
    	// Check if the element is an SVGElementInstance and use the correspondingElement instead
    	// (Required for linked SVG elements in IE11.)
    	if (el.correspondingElement) {
    		el = el.correspondingElement;
    	}
    	return el.className.baseVal === undefined ? el.className : el.className.baseVal;
    }

    // @function setOpacity(el: HTMLElement, opacity: Number)
    // Set the opacity of an element (including old IE support).
    // `opacity` must be a number from `0` to `1`.
    function setOpacity(el, value) {
    	if ('opacity' in el.style) {
    		el.style.opacity = value;
    	} else if ('filter' in el.style) {
    		_setOpacityIE(el, value);
    	}
    }

    function _setOpacityIE(el, value) {
    	var filter = false,
    	    filterName = 'DXImageTransform.Microsoft.Alpha';

    	// filters collection throws an error if we try to retrieve a filter that doesn't exist
    	try {
    		filter = el.filters.item(filterName);
    	} catch (e) {
    		// don't set opacity to 1 if we haven't already set an opacity,
    		// it isn't needed and breaks transparent pngs.
    		if (value === 1) { return; }
    	}

    	value = Math.round(value * 100);

    	if (filter) {
    		filter.Enabled = (value !== 100);
    		filter.Opacity = value;
    	} else {
    		el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
    	}
    }

    // @function testProp(props: String[]): String|false
    // Goes through the array of style names and returns the first name
    // that is a valid style name for an element. If no such name is found,
    // it returns false. Useful for vendor-prefixed styles like `transform`.
    function testProp(props) {
    	var style = document.documentElement.style;

    	for (var i = 0; i < props.length; i++) {
    		if (props[i] in style) {
    			return props[i];
    		}
    	}
    	return false;
    }

    // @function setTransform(el: HTMLElement, offset: Point, scale?: Number)
    // Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
    // and optionally scaled by `scale`. Does not have an effect if the
    // browser doesn't support 3D CSS transforms.
    function setTransform(el, offset, scale) {
    	var pos = offset || new Point(0, 0);

    	el.style[TRANSFORM] =
    		(ie3d ?
    			'translate(' + pos.x + 'px,' + pos.y + 'px)' :
    			'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') +
    		(scale ? ' scale(' + scale + ')' : '');
    }

    // @function setPosition(el: HTMLElement, position: Point)
    // Sets the position of `el` to coordinates specified by `position`,
    // using CSS translate or top/left positioning depending on the browser
    // (used by Leaflet internally to position its layers).
    function setPosition(el, point) {

    	/*eslint-disable */
    	el._leaflet_pos = point;
    	/* eslint-enable */

    	if (any3d) {
    		setTransform(el, point);
    	} else {
    		el.style.left = point.x + 'px';
    		el.style.top = point.y + 'px';
    	}
    }

    // @function getPosition(el: HTMLElement): Point
    // Returns the coordinates of an element previously positioned with setPosition.
    function getPosition(el) {
    	// this method is only used for elements previously positioned using setPosition,
    	// so it's safe to cache the position for performance

    	return el._leaflet_pos || new Point(0, 0);
    }

    // @function disableTextSelection()
    // Prevents the user from generating `selectstart` DOM events, usually generated
    // when the user drags the mouse through a page with text. Used internally
    // by Leaflet to override the behaviour of any click-and-drag interaction on
    // the map. Affects drag interactions on the whole document.

    // @function enableTextSelection()
    // Cancels the effects of a previous [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection).
    var disableTextSelection;
    var enableTextSelection;
    var _userSelect;
    if ('onselectstart' in document) {
    	disableTextSelection = function () {
    		on(window, 'selectstart', preventDefault);
    	};
    	enableTextSelection = function () {
    		off(window, 'selectstart', preventDefault);
    	};
    } else {
    	var userSelectProperty = testProp(
    		['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

    	disableTextSelection = function () {
    		if (userSelectProperty) {
    			var style = document.documentElement.style;
    			_userSelect = style[userSelectProperty];
    			style[userSelectProperty] = 'none';
    		}
    	};
    	enableTextSelection = function () {
    		if (userSelectProperty) {
    			document.documentElement.style[userSelectProperty] = _userSelect;
    			_userSelect = undefined;
    		}
    	};
    }

    // @function disableImageDrag()
    // As [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection), but
    // for `dragstart` DOM events, usually generated when the user drags an image.
    function disableImageDrag() {
    	on(window, 'dragstart', preventDefault);
    }

    // @function enableImageDrag()
    // Cancels the effects of a previous [`L.DomUtil.disableImageDrag`](#domutil-disabletextselection).
    function enableImageDrag() {
    	off(window, 'dragstart', preventDefault);
    }

    var _outlineElement, _outlineStyle;
    // @function preventOutline(el: HTMLElement)
    // Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
    // of the element `el` invisible. Used internally by Leaflet to prevent
    // focusable elements from displaying an outline when the user performs a
    // drag interaction on them.
    function preventOutline(element) {
    	while (element.tabIndex === -1) {
    		element = element.parentNode;
    	}
    	if (!element.style) { return; }
    	restoreOutline();
    	_outlineElement = element;
    	_outlineStyle = element.style.outline;
    	element.style.outline = 'none';
    	on(window, 'keydown', restoreOutline);
    }

    // @function restoreOutline()
    // Cancels the effects of a previous [`L.DomUtil.preventOutline`]().
    function restoreOutline() {
    	if (!_outlineElement) { return; }
    	_outlineElement.style.outline = _outlineStyle;
    	_outlineElement = undefined;
    	_outlineStyle = undefined;
    	off(window, 'keydown', restoreOutline);
    }

    // @function getSizedParentNode(el: HTMLElement): HTMLElement
    // Finds the closest parent node which size (width and height) is not null.
    function getSizedParentNode(element) {
    	do {
    		element = element.parentNode;
    	} while ((!element.offsetWidth || !element.offsetHeight) && element !== document.body);
    	return element;
    }

    // @function getScale(el: HTMLElement): Object
    // Computes the CSS scale currently applied on the element.
    // Returns an object with `x` and `y` members as horizontal and vertical scales respectively,
    // and `boundingClientRect` as the result of [`getBoundingClientRect()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect).
    function getScale(element) {
    	var rect = element.getBoundingClientRect(); // Read-only in old browsers.

    	return {
    		x: rect.width / element.offsetWidth || 1,
    		y: rect.height / element.offsetHeight || 1,
    		boundingClientRect: rect
    	};
    }

    // @class Class
    // @aka L.Class

    // @section
    // @uninheritable

    // Thanks to John Resig and Dean Edwards for inspiration!

    function Class() {}

    Class.extend = function (props) {

    	// @function extend(props: Object): Function
    	// [Extends the current class](#class-inheritance) given the properties to be included.
    	// Returns a Javascript function that is a class constructor (to be called with `new`).
    	var NewClass = function () {

    		// call the constructor
    		if (this.initialize) {
    			this.initialize.apply(this, arguments);
    		}

    		// call all constructor hooks
    		this.callInitHooks();
    	};

    	var parentProto = NewClass.__super__ = this.prototype;

    	var proto = create(parentProto);
    	proto.constructor = NewClass;

    	NewClass.prototype = proto;

    	// inherit parent's statics
    	for (var i in this) {
    		if (Object.prototype.hasOwnProperty.call(this, i) && i !== 'prototype' && i !== '__super__') {
    			NewClass[i] = this[i];
    		}
    	}

    	// mix static properties into the class
    	if (props.statics) {
    		extend(NewClass, props.statics);
    		delete props.statics;
    	}

    	// mix includes into the prototype
    	if (props.includes) {
    		checkDeprecatedMixinEvents(props.includes);
    		extend.apply(null, [proto].concat(props.includes));
    		delete props.includes;
    	}

    	// merge options
    	if (proto.options) {
    		props.options = extend(create(proto.options), props.options);
    	}

    	// mix given properties into the prototype
    	extend(proto, props);

    	proto._initHooks = [];

    	// add method for calling all hooks
    	proto.callInitHooks = function () {

    		if (this._initHooksCalled) { return; }

    		if (parentProto.callInitHooks) {
    			parentProto.callInitHooks.call(this);
    		}

    		this._initHooksCalled = true;

    		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
    			proto._initHooks[i].call(this);
    		}
    	};

    	return NewClass;
    };


    // @function include(properties: Object): this
    // [Includes a mixin](#class-includes) into the current class.
    Class.include = function (props) {
    	extend(this.prototype, props);
    	return this;
    };

    // @function mergeOptions(options: Object): this
    // [Merges `options`](#class-options) into the defaults of the class.
    Class.mergeOptions = function (options) {
    	extend(this.prototype.options, options);
    	return this;
    };

    // @function addInitHook(fn: Function): this
    // Adds a [constructor hook](#class-constructor-hooks) to the class.
    Class.addInitHook = function (fn) { // (Function) || (String, args...)
    	var args = Array.prototype.slice.call(arguments, 1);

    	var init = typeof fn === 'function' ? fn : function () {
    		this[fn].apply(this, args);
    	};

    	this.prototype._initHooks = this.prototype._initHooks || [];
    	this.prototype._initHooks.push(init);
    	return this;
    };

    function checkDeprecatedMixinEvents(includes) {
    	if (typeof L === 'undefined' || !L || !L.Mixin) { return; }

    	includes = isArray(includes) ? includes : [includes];

    	for (var i = 0; i < includes.length; i++) {
    		if (includes[i] === L.Mixin.Events) {
    			console.warn('Deprecated include of L.Mixin.Events: ' +
    				'this property will be removed in future releases, ' +
    				'please inherit from L.Evented instead.', new Error().stack);
    		}
    	}
    }

    /*
     * @class Evented
     * @aka L.Evented
     * @inherits Class
     *
     * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
     *
     * @example
     *
     * ```js
     * map.on('click', function(e) {
     * 	alert(e.latlng);
     * } );
     * ```
     *
     * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
     *
     * ```js
     * function onClick(e) { ... }
     *
     * map.on('click', onClick);
     * map.off('click', onClick);
     * ```
     */

    var Events = {
    	/* @method on(type: String, fn: Function, context?: Object): this
    	 * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
    	 *
    	 * @alternative
    	 * @method on(eventMap: Object): this
    	 * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
    	 */
    	on: function (types, fn, context) {

    		// types can be a map of types/handlers
    		if (typeof types === 'object') {
    			for (var type in types) {
    				// we don't process space-separated events here for performance;
    				// it's a hot path since Layer uses the on(obj) syntax
    				this._on(type, types[type], fn);
    			}

    		} else {
    			// types can be a string of space-separated words
    			types = splitWords(types);

    			for (var i = 0, len = types.length; i < len; i++) {
    				this._on(types[i], fn, context);
    			}
    		}

    		return this;
    	},

    	/* @method off(type: String, fn?: Function, context?: Object): this
    	 * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
    	 *
    	 * @alternative
    	 * @method off(eventMap: Object): this
    	 * Removes a set of type/listener pairs.
    	 *
    	 * @alternative
    	 * @method off: this
    	 * Removes all listeners to all events on the object. This includes implicitly attached events.
    	 */
    	off: function (types, fn, context) {

    		if (!types) {
    			// clear all listeners if called without arguments
    			delete this._events;

    		} else if (typeof types === 'object') {
    			for (var type in types) {
    				this._off(type, types[type], fn);
    			}

    		} else {
    			types = splitWords(types);

    			for (var i = 0, len = types.length; i < len; i++) {
    				this._off(types[i], fn, context);
    			}
    		}

    		return this;
    	},

    	// attach listener (without syntactic sugar now)
    	_on: function (type, fn, context) {
    		this._events = this._events || {};

    		/* get/init listeners for type */
    		var typeListeners = this._events[type];
    		if (!typeListeners) {
    			typeListeners = [];
    			this._events[type] = typeListeners;
    		}

    		if (context === this) {
    			// Less memory footprint.
    			context = undefined;
    		}
    		var newListener = {fn: fn, ctx: context},
    		    listeners = typeListeners;

    		// check if fn already there
    		for (var i = 0, len = listeners.length; i < len; i++) {
    			if (listeners[i].fn === fn && listeners[i].ctx === context) {
    				return;
    			}
    		}

    		listeners.push(newListener);
    	},

    	_off: function (type, fn, context) {
    		var listeners,
    		    i,
    		    len;

    		if (!this._events) { return; }

    		listeners = this._events[type];

    		if (!listeners) {
    			return;
    		}

    		if (!fn) {
    			// Set all removed listeners to noop so they are not called if remove happens in fire
    			for (i = 0, len = listeners.length; i < len; i++) {
    				listeners[i].fn = falseFn;
    			}
    			// clear all listeners for a type if function isn't specified
    			delete this._events[type];
    			return;
    		}

    		if (context === this) {
    			context = undefined;
    		}

    		if (listeners) {

    			// find fn and remove it
    			for (i = 0, len = listeners.length; i < len; i++) {
    				var l = listeners[i];
    				if (l.ctx !== context) { continue; }
    				if (l.fn === fn) {

    					// set the removed listener to noop so that's not called if remove happens in fire
    					l.fn = falseFn;

    					if (this._firingCount) {
    						/* copy array in case events are being fired */
    						this._events[type] = listeners = listeners.slice();
    					}
    					listeners.splice(i, 1);

    					return;
    				}
    			}
    		}
    	},

    	// @method fire(type: String, data?: Object, propagate?: Boolean): this
    	// Fires an event of the specified type. You can optionally provide an data
    	// object — the first argument of the listener function will contain its
    	// properties. The event can optionally be propagated to event parents.
    	fire: function (type, data, propagate) {
    		if (!this.listens(type, propagate)) { return this; }

    		var event = extend({}, data, {
    			type: type,
    			target: this,
    			sourceTarget: data && data.sourceTarget || this
    		});

    		if (this._events) {
    			var listeners = this._events[type];

    			if (listeners) {
    				this._firingCount = (this._firingCount + 1) || 1;
    				for (var i = 0, len = listeners.length; i < len; i++) {
    					var l = listeners[i];
    					l.fn.call(l.ctx || this, event);
    				}

    				this._firingCount--;
    			}
    		}

    		if (propagate) {
    			// propagate the event to parents (set with addEventParent)
    			this._propagateEvent(event);
    		}

    		return this;
    	},

    	// @method listens(type: String): Boolean
    	// Returns `true` if a particular event type has any listeners attached to it.
    	listens: function (type, propagate) {
    		var listeners = this._events && this._events[type];
    		if (listeners && listeners.length) { return true; }

    		if (propagate) {
    			// also check parents for listeners if event propagates
    			for (var id in this._eventParents) {
    				if (this._eventParents[id].listens(type, propagate)) { return true; }
    			}
    		}
    		return false;
    	},

    	// @method once(…): this
    	// Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
    	once: function (types, fn, context) {

    		if (typeof types === 'object') {
    			for (var type in types) {
    				this.once(type, types[type], fn);
    			}
    			return this;
    		}

    		var handler = bind$1(function () {
    			this
    			    .off(types, fn, context)
    			    .off(types, handler, context);
    		}, this);

    		// add a listener that's executed once and removed after that
    		return this
    		    .on(types, fn, context)
    		    .on(types, handler, context);
    	},

    	// @method addEventParent(obj: Evented): this
    	// Adds an event parent - an `Evented` that will receive propagated events
    	addEventParent: function (obj) {
    		this._eventParents = this._eventParents || {};
    		this._eventParents[stamp(obj)] = obj;
    		return this;
    	},

    	// @method removeEventParent(obj: Evented): this
    	// Removes an event parent, so it will stop receiving propagated events
    	removeEventParent: function (obj) {
    		if (this._eventParents) {
    			delete this._eventParents[stamp(obj)];
    		}
    		return this;
    	},

    	_propagateEvent: function (e) {
    		for (var id in this._eventParents) {
    			this._eventParents[id].fire(e.type, extend({
    				layer: e.target,
    				propagatedFrom: e.target
    			}, e), true);
    		}
    	}
    };

    // aliases; we should ditch those eventually

    // @method addEventListener(…): this
    // Alias to [`on(…)`](#evented-on)
    Events.addEventListener = Events.on;

    // @method removeEventListener(…): this
    // Alias to [`off(…)`](#evented-off)

    // @method clearAllEventListeners(…): this
    // Alias to [`off()`](#evented-off)
    Events.removeEventListener = Events.clearAllEventListeners = Events.off;

    // @method addOneTimeEventListener(…): this
    // Alias to [`once(…)`](#evented-once)
    Events.addOneTimeEventListener = Events.once;

    // @method fireEvent(…): this
    // Alias to [`fire(…)`](#evented-fire)
    Events.fireEvent = Events.fire;

    // @method hasEventListeners(…): Boolean
    // Alias to [`listens(…)`](#evented-listens)
    Events.hasEventListeners = Events.listens;

    var Evented = Class.extend(Events);

    /*
     * @class Bounds
     * @aka L.Bounds
     *
     * Represents a rectangular area in pixel coordinates.
     *
     * @example
     *
     * ```js
     * var p1 = L.point(10, 10),
     * p2 = L.point(40, 60),
     * bounds = L.bounds(p1, p2);
     * ```
     *
     * All Leaflet methods that accept `Bounds` objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
     *
     * ```js
     * otherBounds.intersects([[10, 10], [40, 60]]);
     * ```
     *
     * Note that `Bounds` does not inherit from Leaflet's `Class` object,
     * which means new classes can't inherit from it, and new methods
     * can't be added to it with the `include` function.
     */

    function Bounds(a, b) {
    	if (!a) { return; }

    	var points = b ? [a, b] : a;

    	for (var i = 0, len = points.length; i < len; i++) {
    		this.extend(points[i]);
    	}
    }

    Bounds.prototype = {
    	// @method extend(point: Point): this
    	// Extends the bounds to contain the given point.
    	extend: function (point) { // (Point)
    		point = toPoint(point);

    		// @property min: Point
    		// The top left corner of the rectangle.
    		// @property max: Point
    		// The bottom right corner of the rectangle.
    		if (!this.min && !this.max) {
    			this.min = point.clone();
    			this.max = point.clone();
    		} else {
    			this.min.x = Math.min(point.x, this.min.x);
    			this.max.x = Math.max(point.x, this.max.x);
    			this.min.y = Math.min(point.y, this.min.y);
    			this.max.y = Math.max(point.y, this.max.y);
    		}
    		return this;
    	},

    	// @method getCenter(round?: Boolean): Point
    	// Returns the center point of the bounds.
    	getCenter: function (round) {
    		return new Point(
    		        (this.min.x + this.max.x) / 2,
    		        (this.min.y + this.max.y) / 2, round);
    	},

    	// @method getBottomLeft(): Point
    	// Returns the bottom-left point of the bounds.
    	getBottomLeft: function () {
    		return new Point(this.min.x, this.max.y);
    	},

    	// @method getTopRight(): Point
    	// Returns the top-right point of the bounds.
    	getTopRight: function () { // -> Point
    		return new Point(this.max.x, this.min.y);
    	},

    	// @method getTopLeft(): Point
    	// Returns the top-left point of the bounds (i.e. [`this.min`](#bounds-min)).
    	getTopLeft: function () {
    		return this.min; // left, top
    	},

    	// @method getBottomRight(): Point
    	// Returns the bottom-right point of the bounds (i.e. [`this.max`](#bounds-max)).
    	getBottomRight: function () {
    		return this.max; // right, bottom
    	},

    	// @method getSize(): Point
    	// Returns the size of the given bounds
    	getSize: function () {
    		return this.max.subtract(this.min);
    	},

    	// @method contains(otherBounds: Bounds): Boolean
    	// Returns `true` if the rectangle contains the given one.
    	// @alternative
    	// @method contains(point: Point): Boolean
    	// Returns `true` if the rectangle contains the given point.
    	contains: function (obj) {
    		var min, max;

    		if (typeof obj[0] === 'number' || obj instanceof Point) {
    			obj = toPoint(obj);
    		} else {
    			obj = toBounds(obj);
    		}

    		if (obj instanceof Bounds) {
    			min = obj.min;
    			max = obj.max;
    		} else {
    			min = max = obj;
    		}

    		return (min.x >= this.min.x) &&
    		       (max.x <= this.max.x) &&
    		       (min.y >= this.min.y) &&
    		       (max.y <= this.max.y);
    	},

    	// @method intersects(otherBounds: Bounds): Boolean
    	// Returns `true` if the rectangle intersects the given bounds. Two bounds
    	// intersect if they have at least one point in common.
    	intersects: function (bounds) { // (Bounds) -> Boolean
    		bounds = toBounds(bounds);

    		var min = this.min,
    		    max = this.max,
    		    min2 = bounds.min,
    		    max2 = bounds.max,
    		    xIntersects = (max2.x >= min.x) && (min2.x <= max.x),
    		    yIntersects = (max2.y >= min.y) && (min2.y <= max.y);

    		return xIntersects && yIntersects;
    	},

    	// @method overlaps(otherBounds: Bounds): Boolean
    	// Returns `true` if the rectangle overlaps the given bounds. Two bounds
    	// overlap if their intersection is an area.
    	overlaps: function (bounds) { // (Bounds) -> Boolean
    		bounds = toBounds(bounds);

    		var min = this.min,
    		    max = this.max,
    		    min2 = bounds.min,
    		    max2 = bounds.max,
    		    xOverlaps = (max2.x > min.x) && (min2.x < max.x),
    		    yOverlaps = (max2.y > min.y) && (min2.y < max.y);

    		return xOverlaps && yOverlaps;
    	},

    	isValid: function () {
    		return !!(this.min && this.max);
    	}
    };


    // @factory L.bounds(corner1: Point, corner2: Point)
    // Creates a Bounds object from two corners coordinate pairs.
    // @alternative
    // @factory L.bounds(points: Point[])
    // Creates a Bounds object from the given array of points.
    function toBounds(a, b) {
    	if (!a || a instanceof Bounds) {
    		return a;
    	}
    	return new Bounds(a, b);
    }

    /*
     * @class LatLngBounds
     * @aka L.LatLngBounds
     *
     * Represents a rectangular geographical area on a map.
     *
     * @example
     *
     * ```js
     * var corner1 = L.latLng(40.712, -74.227),
     * corner2 = L.latLng(40.774, -74.125),
     * bounds = L.latLngBounds(corner1, corner2);
     * ```
     *
     * All Leaflet methods that accept LatLngBounds objects also accept them in a simple Array form (unless noted otherwise), so the bounds example above can be passed like this:
     *
     * ```js
     * map.fitBounds([
     * 	[40.712, -74.227],
     * 	[40.774, -74.125]
     * ]);
     * ```
     *
     * Caution: if the area crosses the antimeridian (often confused with the International Date Line), you must specify corners _outside_ the [-180, 180] degrees longitude range.
     *
     * Note that `LatLngBounds` does not inherit from Leaflet's `Class` object,
     * which means new classes can't inherit from it, and new methods
     * can't be added to it with the `include` function.
     */

    function LatLngBounds(corner1, corner2) { // (LatLng, LatLng) or (LatLng[])
    	if (!corner1) { return; }

    	var latlngs = corner2 ? [corner1, corner2] : corner1;

    	for (var i = 0, len = latlngs.length; i < len; i++) {
    		this.extend(latlngs[i]);
    	}
    }

    LatLngBounds.prototype = {

    	// @method extend(latlng: LatLng): this
    	// Extend the bounds to contain the given point

    	// @alternative
    	// @method extend(otherBounds: LatLngBounds): this
    	// Extend the bounds to contain the given bounds
    	extend: function (obj) {
    		var sw = this._southWest,
    		    ne = this._northEast,
    		    sw2, ne2;

    		if (obj instanceof LatLng) {
    			sw2 = obj;
    			ne2 = obj;

    		} else if (obj instanceof LatLngBounds) {
    			sw2 = obj._southWest;
    			ne2 = obj._northEast;

    			if (!sw2 || !ne2) { return this; }

    		} else {
    			return obj ? this.extend(toLatLng(obj) || toLatLngBounds(obj)) : this;
    		}

    		if (!sw && !ne) {
    			this._southWest = new LatLng(sw2.lat, sw2.lng);
    			this._northEast = new LatLng(ne2.lat, ne2.lng);
    		} else {
    			sw.lat = Math.min(sw2.lat, sw.lat);
    			sw.lng = Math.min(sw2.lng, sw.lng);
    			ne.lat = Math.max(ne2.lat, ne.lat);
    			ne.lng = Math.max(ne2.lng, ne.lng);
    		}

    		return this;
    	},

    	// @method pad(bufferRatio: Number): LatLngBounds
    	// Returns bounds created by extending or retracting the current bounds by a given ratio in each direction.
    	// For example, a ratio of 0.5 extends the bounds by 50% in each direction.
    	// Negative values will retract the bounds.
    	pad: function (bufferRatio) {
    		var sw = this._southWest,
    		    ne = this._northEast,
    		    heightBuffer = Math.abs(sw.lat - ne.lat) * bufferRatio,
    		    widthBuffer = Math.abs(sw.lng - ne.lng) * bufferRatio;

    		return new LatLngBounds(
    		        new LatLng(sw.lat - heightBuffer, sw.lng - widthBuffer),
    		        new LatLng(ne.lat + heightBuffer, ne.lng + widthBuffer));
    	},

    	// @method getCenter(): LatLng
    	// Returns the center point of the bounds.
    	getCenter: function () {
    		return new LatLng(
    		        (this._southWest.lat + this._northEast.lat) / 2,
    		        (this._southWest.lng + this._northEast.lng) / 2);
    	},

    	// @method getSouthWest(): LatLng
    	// Returns the south-west point of the bounds.
    	getSouthWest: function () {
    		return this._southWest;
    	},

    	// @method getNorthEast(): LatLng
    	// Returns the north-east point of the bounds.
    	getNorthEast: function () {
    		return this._northEast;
    	},

    	// @method getNorthWest(): LatLng
    	// Returns the north-west point of the bounds.
    	getNorthWest: function () {
    		return new LatLng(this.getNorth(), this.getWest());
    	},

    	// @method getSouthEast(): LatLng
    	// Returns the south-east point of the bounds.
    	getSouthEast: function () {
    		return new LatLng(this.getSouth(), this.getEast());
    	},

    	// @method getWest(): Number
    	// Returns the west longitude of the bounds
    	getWest: function () {
    		return this._southWest.lng;
    	},

    	// @method getSouth(): Number
    	// Returns the south latitude of the bounds
    	getSouth: function () {
    		return this._southWest.lat;
    	},

    	// @method getEast(): Number
    	// Returns the east longitude of the bounds
    	getEast: function () {
    		return this._northEast.lng;
    	},

    	// @method getNorth(): Number
    	// Returns the north latitude of the bounds
    	getNorth: function () {
    		return this._northEast.lat;
    	},

    	// @method contains(otherBounds: LatLngBounds): Boolean
    	// Returns `true` if the rectangle contains the given one.

    	// @alternative
    	// @method contains (latlng: LatLng): Boolean
    	// Returns `true` if the rectangle contains the given point.
    	contains: function (obj) { // (LatLngBounds) or (LatLng) -> Boolean
    		if (typeof obj[0] === 'number' || obj instanceof LatLng || 'lat' in obj) {
    			obj = toLatLng(obj);
    		} else {
    			obj = toLatLngBounds(obj);
    		}

    		var sw = this._southWest,
    		    ne = this._northEast,
    		    sw2, ne2;

    		if (obj instanceof LatLngBounds) {
    			sw2 = obj.getSouthWest();
    			ne2 = obj.getNorthEast();
    		} else {
    			sw2 = ne2 = obj;
    		}

    		return (sw2.lat >= sw.lat) && (ne2.lat <= ne.lat) &&
    		       (sw2.lng >= sw.lng) && (ne2.lng <= ne.lng);
    	},

    	// @method intersects(otherBounds: LatLngBounds): Boolean
    	// Returns `true` if the rectangle intersects the given bounds. Two bounds intersect if they have at least one point in common.
    	intersects: function (bounds) {
    		bounds = toLatLngBounds(bounds);

    		var sw = this._southWest,
    		    ne = this._northEast,
    		    sw2 = bounds.getSouthWest(),
    		    ne2 = bounds.getNorthEast(),

    		    latIntersects = (ne2.lat >= sw.lat) && (sw2.lat <= ne.lat),
    		    lngIntersects = (ne2.lng >= sw.lng) && (sw2.lng <= ne.lng);

    		return latIntersects && lngIntersects;
    	},

    	// @method overlaps(otherBounds: LatLngBounds): Boolean
    	// Returns `true` if the rectangle overlaps the given bounds. Two bounds overlap if their intersection is an area.
    	overlaps: function (bounds) {
    		bounds = toLatLngBounds(bounds);

    		var sw = this._southWest,
    		    ne = this._northEast,
    		    sw2 = bounds.getSouthWest(),
    		    ne2 = bounds.getNorthEast(),

    		    latOverlaps = (ne2.lat > sw.lat) && (sw2.lat < ne.lat),
    		    lngOverlaps = (ne2.lng > sw.lng) && (sw2.lng < ne.lng);

    		return latOverlaps && lngOverlaps;
    	},

    	// @method toBBoxString(): String
    	// Returns a string with bounding box coordinates in a 'southwest_lng,southwest_lat,northeast_lng,northeast_lat' format. Useful for sending requests to web services that return geo data.
    	toBBoxString: function () {
    		return [this.getWest(), this.getSouth(), this.getEast(), this.getNorth()].join(',');
    	},

    	// @method equals(otherBounds: LatLngBounds, maxMargin?: Number): Boolean
    	// Returns `true` if the rectangle is equivalent (within a small margin of error) to the given bounds. The margin of error can be overridden by setting `maxMargin` to a small number.
    	equals: function (bounds, maxMargin) {
    		if (!bounds) { return false; }

    		bounds = toLatLngBounds(bounds);

    		return this._southWest.equals(bounds.getSouthWest(), maxMargin) &&
    		       this._northEast.equals(bounds.getNorthEast(), maxMargin);
    	},

    	// @method isValid(): Boolean
    	// Returns `true` if the bounds are properly initialized.
    	isValid: function () {
    		return !!(this._southWest && this._northEast);
    	}
    };

    // TODO International date line?

    // @factory L.latLngBounds(corner1: LatLng, corner2: LatLng)
    // Creates a `LatLngBounds` object by defining two diagonally opposite corners of the rectangle.

    // @alternative
    // @factory L.latLngBounds(latlngs: LatLng[])
    // Creates a `LatLngBounds` object defined by the geographical points it contains. Very useful for zooming the map to fit a particular set of locations with [`fitBounds`](#map-fitbounds).
    function toLatLngBounds(a, b) {
    	if (a instanceof LatLngBounds) {
    		return a;
    	}
    	return new LatLngBounds(a, b);
    }

    /* @class LatLng
     * @aka L.LatLng
     *
     * Represents a geographical point with a certain latitude and longitude.
     *
     * @example
     *
     * ```
     * var latlng = L.latLng(50.5, 30.5);
     * ```
     *
     * All Leaflet methods that accept LatLng objects also accept them in a simple Array form and simple object form (unless noted otherwise), so these lines are equivalent:
     *
     * ```
     * map.panTo([50, 30]);
     * map.panTo({lon: 30, lat: 50});
     * map.panTo({lat: 50, lng: 30});
     * map.panTo(L.latLng(50, 30));
     * ```
     *
     * Note that `LatLng` does not inherit from Leaflet's `Class` object,
     * which means new classes can't inherit from it, and new methods
     * can't be added to it with the `include` function.
     */

    function LatLng(lat, lng, alt) {
    	if (isNaN(lat) || isNaN(lng)) {
    		throw new Error('Invalid LatLng object: (' + lat + ', ' + lng + ')');
    	}

    	// @property lat: Number
    	// Latitude in degrees
    	this.lat = +lat;

    	// @property lng: Number
    	// Longitude in degrees
    	this.lng = +lng;

    	// @property alt: Number
    	// Altitude in meters (optional)
    	if (alt !== undefined) {
    		this.alt = +alt;
    	}
    }

    LatLng.prototype = {
    	// @method equals(otherLatLng: LatLng, maxMargin?: Number): Boolean
    	// Returns `true` if the given `LatLng` point is at the same position (within a small margin of error). The margin of error can be overridden by setting `maxMargin` to a small number.
    	equals: function (obj, maxMargin) {
    		if (!obj) { return false; }

    		obj = toLatLng(obj);

    		var margin = Math.max(
    		        Math.abs(this.lat - obj.lat),
    		        Math.abs(this.lng - obj.lng));

    		return margin <= (maxMargin === undefined ? 1.0E-9 : maxMargin);
    	},

    	// @method toString(): String
    	// Returns a string representation of the point (for debugging purposes).
    	toString: function (precision) {
    		return 'LatLng(' +
    		        formatNum(this.lat, precision) + ', ' +
    		        formatNum(this.lng, precision) + ')';
    	},

    	// @method distanceTo(otherLatLng: LatLng): Number
    	// Returns the distance (in meters) to the given `LatLng` calculated using the [Spherical Law of Cosines](https://en.wikipedia.org/wiki/Spherical_law_of_cosines).
    	distanceTo: function (other) {
    		return Earth.distance(this, toLatLng(other));
    	},

    	// @method wrap(): LatLng
    	// Returns a new `LatLng` object with the longitude wrapped so it's always between -180 and +180 degrees.
    	wrap: function () {
    		return Earth.wrapLatLng(this);
    	},

    	// @method toBounds(sizeInMeters: Number): LatLngBounds
    	// Returns a new `LatLngBounds` object in which each boundary is `sizeInMeters/2` meters apart from the `LatLng`.
    	toBounds: function (sizeInMeters) {
    		var latAccuracy = 180 * sizeInMeters / 40075017,
    		    lngAccuracy = latAccuracy / Math.cos((Math.PI / 180) * this.lat);

    		return toLatLngBounds(
    		        [this.lat - latAccuracy, this.lng - lngAccuracy],
    		        [this.lat + latAccuracy, this.lng + lngAccuracy]);
    	},

    	clone: function () {
    		return new LatLng(this.lat, this.lng, this.alt);
    	}
    };



    // @factory L.latLng(latitude: Number, longitude: Number, altitude?: Number): LatLng
    // Creates an object representing a geographical point with the given latitude and longitude (and optionally altitude).

    // @alternative
    // @factory L.latLng(coords: Array): LatLng
    // Expects an array of the form `[Number, Number]` or `[Number, Number, Number]` instead.

    // @alternative
    // @factory L.latLng(coords: Object): LatLng
    // Expects an plain object of the form `{lat: Number, lng: Number}` or `{lat: Number, lng: Number, alt: Number}` instead.

    function toLatLng(a, b, c) {
    	if (a instanceof LatLng) {
    		return a;
    	}
    	if (isArray(a) && typeof a[0] !== 'object') {
    		if (a.length === 3) {
    			return new LatLng(a[0], a[1], a[2]);
    		}
    		if (a.length === 2) {
    			return new LatLng(a[0], a[1]);
    		}
    		return null;
    	}
    	if (a === undefined || a === null) {
    		return a;
    	}
    	if (typeof a === 'object' && 'lat' in a) {
    		return new LatLng(a.lat, 'lng' in a ? a.lng : a.lon, a.alt);
    	}
    	if (b === undefined) {
    		return null;
    	}
    	return new LatLng(a, b, c);
    }

    /*
     * @namespace CRS
     * @crs L.CRS.Base
     * Object that defines coordinate reference systems for projecting
     * geographical points into pixel (screen) coordinates and back (and to
     * coordinates in other units for [WMS](https://en.wikipedia.org/wiki/Web_Map_Service) services). See
     * [spatial reference system](http://en.wikipedia.org/wiki/Coordinate_reference_system).
     *
     * Leaflet defines the most usual CRSs by default. If you want to use a
     * CRS not defined by default, take a look at the
     * [Proj4Leaflet](https://github.com/kartena/Proj4Leaflet) plugin.
     *
     * Note that the CRS instances do not inherit from Leaflet's `Class` object,
     * and can't be instantiated. Also, new classes can't inherit from them,
     * and methods can't be added to them with the `include` function.
     */

    var CRS = {
    	// @method latLngToPoint(latlng: LatLng, zoom: Number): Point
    	// Projects geographical coordinates into pixel coordinates for a given zoom.
    	latLngToPoint: function (latlng, zoom) {
    		var projectedPoint = this.projection.project(latlng),
    		    scale = this.scale(zoom);

    		return this.transformation._transform(projectedPoint, scale);
    	},

    	// @method pointToLatLng(point: Point, zoom: Number): LatLng
    	// The inverse of `latLngToPoint`. Projects pixel coordinates on a given
    	// zoom into geographical coordinates.
    	pointToLatLng: function (point, zoom) {
    		var scale = this.scale(zoom),
    		    untransformedPoint = this.transformation.untransform(point, scale);

    		return this.projection.unproject(untransformedPoint);
    	},

    	// @method project(latlng: LatLng): Point
    	// Projects geographical coordinates into coordinates in units accepted for
    	// this CRS (e.g. meters for EPSG:3857, for passing it to WMS services).
    	project: function (latlng) {
    		return this.projection.project(latlng);
    	},

    	// @method unproject(point: Point): LatLng
    	// Given a projected coordinate returns the corresponding LatLng.
    	// The inverse of `project`.
    	unproject: function (point) {
    		return this.projection.unproject(point);
    	},

    	// @method scale(zoom: Number): Number
    	// Returns the scale used when transforming projected coordinates into
    	// pixel coordinates for a particular zoom. For example, it returns
    	// `256 * 2^zoom` for Mercator-based CRS.
    	scale: function (zoom) {
    		return 256 * Math.pow(2, zoom);
    	},

    	// @method zoom(scale: Number): Number
    	// Inverse of `scale()`, returns the zoom level corresponding to a scale
    	// factor of `scale`.
    	zoom: function (scale) {
    		return Math.log(scale / 256) / Math.LN2;
    	},

    	// @method getProjectedBounds(zoom: Number): Bounds
    	// Returns the projection's bounds scaled and transformed for the provided `zoom`.
    	getProjectedBounds: function (zoom) {
    		if (this.infinite) { return null; }

    		var b = this.projection.bounds,
    		    s = this.scale(zoom),
    		    min = this.transformation.transform(b.min, s),
    		    max = this.transformation.transform(b.max, s);

    		return new Bounds(min, max);
    	},

    	// @method distance(latlng1: LatLng, latlng2: LatLng): Number
    	// Returns the distance between two geographical coordinates.

    	// @property code: String
    	// Standard code name of the CRS passed into WMS services (e.g. `'EPSG:3857'`)
    	//
    	// @property wrapLng: Number[]
    	// An array of two numbers defining whether the longitude (horizontal) coordinate
    	// axis wraps around a given range and how. Defaults to `[-180, 180]` in most
    	// geographical CRSs. If `undefined`, the longitude axis does not wrap around.
    	//
    	// @property wrapLat: Number[]
    	// Like `wrapLng`, but for the latitude (vertical) axis.

    	// wrapLng: [min, max],
    	// wrapLat: [min, max],

    	// @property infinite: Boolean
    	// If true, the coordinate space will be unbounded (infinite in both axes)
    	infinite: false,

    	// @method wrapLatLng(latlng: LatLng): LatLng
    	// Returns a `LatLng` where lat and lng has been wrapped according to the
    	// CRS's `wrapLat` and `wrapLng` properties, if they are outside the CRS's bounds.
    	wrapLatLng: function (latlng) {
    		var lng = this.wrapLng ? wrapNum(latlng.lng, this.wrapLng, true) : latlng.lng,
    		    lat = this.wrapLat ? wrapNum(latlng.lat, this.wrapLat, true) : latlng.lat,
    		    alt = latlng.alt;

    		return new LatLng(lat, lng, alt);
    	},

    	// @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
    	// Returns a `LatLngBounds` with the same size as the given one, ensuring
    	// that its center is within the CRS's bounds.
    	// Only accepts actual `L.LatLngBounds` instances, not arrays.
    	wrapLatLngBounds: function (bounds) {
    		var center = bounds.getCenter(),
    		    newCenter = this.wrapLatLng(center),
    		    latShift = center.lat - newCenter.lat,
    		    lngShift = center.lng - newCenter.lng;

    		if (latShift === 0 && lngShift === 0) {
    			return bounds;
    		}

    		var sw = bounds.getSouthWest(),
    		    ne = bounds.getNorthEast(),
    		    newSw = new LatLng(sw.lat - latShift, sw.lng - lngShift),
    		    newNe = new LatLng(ne.lat - latShift, ne.lng - lngShift);

    		return new LatLngBounds(newSw, newNe);
    	}
    };

    /*
     * @namespace CRS
     * @crs L.CRS.Earth
     *
     * Serves as the base for CRS that are global such that they cover the earth.
     * Can only be used as the base for other CRS and cannot be used directly,
     * since it does not have a `code`, `projection` or `transformation`. `distance()` returns
     * meters.
     */

    var Earth = extend({}, CRS, {
    	wrapLng: [-180, 180],

    	// Mean Earth Radius, as recommended for use by
    	// the International Union of Geodesy and Geophysics,
    	// see http://rosettacode.org/wiki/Haversine_formula
    	R: 6371000,

    	// distance between two geographical points using spherical law of cosines approximation
    	distance: function (latlng1, latlng2) {
    		var rad = Math.PI / 180,
    		    lat1 = latlng1.lat * rad,
    		    lat2 = latlng2.lat * rad,
    		    sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
    		    sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
    		    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
    		    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    		return this.R * c;
    	}
    });

    /*
     * @namespace Projection
     * @projection L.Projection.SphericalMercator
     *
     * Spherical Mercator projection — the most common projection for online maps,
     * used by almost all free and commercial tile providers. Assumes that Earth is
     * a sphere. Used by the `EPSG:3857` CRS.
     */

    var earthRadius = 6378137;

    var SphericalMercator = {

    	R: earthRadius,
    	MAX_LATITUDE: 85.0511287798,

    	project: function (latlng) {
    		var d = Math.PI / 180,
    		    max = this.MAX_LATITUDE,
    		    lat = Math.max(Math.min(max, latlng.lat), -max),
    		    sin = Math.sin(lat * d);

    		return new Point(
    			this.R * latlng.lng * d,
    			this.R * Math.log((1 + sin) / (1 - sin)) / 2);
    	},

    	unproject: function (point) {
    		var d = 180 / Math.PI;

    		return new LatLng(
    			(2 * Math.atan(Math.exp(point.y / this.R)) - (Math.PI / 2)) * d,
    			point.x * d / this.R);
    	},

    	bounds: (function () {
    		var d = earthRadius * Math.PI;
    		return new Bounds([-d, -d], [d, d]);
    	})()
    };

    /*
     * @class Transformation
     * @aka L.Transformation
     *
     * Represents an affine transformation: a set of coefficients `a`, `b`, `c`, `d`
     * for transforming a point of a form `(x, y)` into `(a*x + b, c*y + d)` and doing
     * the reverse. Used by Leaflet in its projections code.
     *
     * @example
     *
     * ```js
     * var transformation = L.transformation(2, 5, -1, 10),
     * 	p = L.point(1, 2),
     * 	p2 = transformation.transform(p), //  L.point(7, 8)
     * 	p3 = transformation.untransform(p2); //  L.point(1, 2)
     * ```
     */


    // factory new L.Transformation(a: Number, b: Number, c: Number, d: Number)
    // Creates a `Transformation` object with the given coefficients.
    function Transformation(a, b, c, d) {
    	if (isArray(a)) {
    		// use array properties
    		this._a = a[0];
    		this._b = a[1];
    		this._c = a[2];
    		this._d = a[3];
    		return;
    	}
    	this._a = a;
    	this._b = b;
    	this._c = c;
    	this._d = d;
    }

    Transformation.prototype = {
    	// @method transform(point: Point, scale?: Number): Point
    	// Returns a transformed point, optionally multiplied by the given scale.
    	// Only accepts actual `L.Point` instances, not arrays.
    	transform: function (point, scale) { // (Point, Number) -> Point
    		return this._transform(point.clone(), scale);
    	},

    	// destructive transform (faster)
    	_transform: function (point, scale) {
    		scale = scale || 1;
    		point.x = scale * (this._a * point.x + this._b);
    		point.y = scale * (this._c * point.y + this._d);
    		return point;
    	},

    	// @method untransform(point: Point, scale?: Number): Point
    	// Returns the reverse transformation of the given point, optionally divided
    	// by the given scale. Only accepts actual `L.Point` instances, not arrays.
    	untransform: function (point, scale) {
    		scale = scale || 1;
    		return new Point(
    		        (point.x / scale - this._b) / this._a,
    		        (point.y / scale - this._d) / this._c);
    	}
    };

    // factory L.transformation(a: Number, b: Number, c: Number, d: Number)

    // @factory L.transformation(a: Number, b: Number, c: Number, d: Number)
    // Instantiates a Transformation object with the given coefficients.

    // @alternative
    // @factory L.transformation(coefficients: Array): Transformation
    // Expects an coefficients array of the form
    // `[a: Number, b: Number, c: Number, d: Number]`.

    function toTransformation(a, b, c, d) {
    	return new Transformation(a, b, c, d);
    }

    /*
     * @namespace CRS
     * @crs L.CRS.EPSG3857
     *
     * The most common CRS for online maps, used by almost all free and commercial
     * tile providers. Uses Spherical Mercator projection. Set in by default in
     * Map's `crs` option.
     */

    var EPSG3857 = extend({}, Earth, {
    	code: 'EPSG:3857',
    	projection: SphericalMercator,

    	transformation: (function () {
    		var scale = 0.5 / (Math.PI * SphericalMercator.R);
    		return toTransformation(scale, 0.5, -scale, 0.5);
    	}())
    });

    var EPSG900913 = extend({}, EPSG3857, {
    	code: 'EPSG:900913'
    });

    /*
     * @class PosAnimation
     * @aka L.PosAnimation
     * @inherits Evented
     * Used internally for panning animations, utilizing CSS3 Transitions for modern browsers and a timer fallback for IE6-9.
     *
     * @example
     * ```js
     * var fx = new L.PosAnimation();
     * fx.run(el, [300, 500], 0.5);
     * ```
     *
     * @constructor L.PosAnimation()
     * Creates a `PosAnimation` object.
     *
     */

    var PosAnimation = Evented.extend({

    	// @method run(el: HTMLElement, newPos: Point, duration?: Number, easeLinearity?: Number)
    	// Run an animation of a given element to a new position, optionally setting
    	// duration in seconds (`0.25` by default) and easing linearity factor (3rd
    	// argument of the [cubic bezier curve](http://cubic-bezier.com/#0,0,.5,1),
    	// `0.5` by default).
    	run: function (el, newPos, duration, easeLinearity) {
    		this.stop();

    		this._el = el;
    		this._inProgress = true;
    		this._duration = duration || 0.25;
    		this._easeOutPower = 1 / Math.max(easeLinearity || 0.5, 0.2);

    		this._startPos = getPosition(el);
    		this._offset = newPos.subtract(this._startPos);
    		this._startTime = +new Date();

    		// @event start: Event
    		// Fired when the animation starts
    		this.fire('start');

    		this._animate();
    	},

    	// @method stop()
    	// Stops the animation (if currently running).
    	stop: function () {
    		if (!this._inProgress) { return; }

    		this._step(true);
    		this._complete();
    	},

    	_animate: function () {
    		// animation loop
    		this._animId = requestAnimFrame(this._animate, this);
    		this._step();
    	},

    	_step: function (round) {
    		var elapsed = (+new Date()) - this._startTime,
    		    duration = this._duration * 1000;

    		if (elapsed < duration) {
    			this._runFrame(this._easeOut(elapsed / duration), round);
    		} else {
    			this._runFrame(1);
    			this._complete();
    		}
    	},

    	_runFrame: function (progress, round) {
    		var pos = this._startPos.add(this._offset.multiplyBy(progress));
    		if (round) {
    			pos._round();
    		}
    		setPosition(this._el, pos);

    		// @event step: Event
    		// Fired continuously during the animation.
    		this.fire('step');
    	},

    	_complete: function () {
    		cancelAnimFrame(this._animId);

    		this._inProgress = false;
    		// @event end: Event
    		// Fired when the animation ends.
    		this.fire('end');
    	},

    	_easeOut: function (t) {
    		return 1 - Math.pow(1 - t, this._easeOutPower);
    	}
    });

    /*
     * @class Map
     * @aka L.Map
     * @inherits Evented
     *
     * The central class of the API — it is used to create a map on a page and manipulate it.
     *
     * @example
     *
     * ```js
     * // initialize the map on the "map" div with a given center and zoom
     * var map = L.map('map', {
     * 	center: [51.505, -0.09],
     * 	zoom: 13
     * });
     * ```
     *
     */

    var Map$1 = Evented.extend({

    	options: {
    		// @section Map State Options
    		// @option crs: CRS = L.CRS.EPSG3857
    		// The [Coordinate Reference System](#crs) to use. Don't change this if you're not
    		// sure what it means.
    		crs: EPSG3857,

    		// @option center: LatLng = undefined
    		// Initial geographic center of the map
    		center: undefined,

    		// @option zoom: Number = undefined
    		// Initial map zoom level
    		zoom: undefined,

    		// @option minZoom: Number = *
    		// Minimum zoom level of the map.
    		// If not specified and at least one `GridLayer` or `TileLayer` is in the map,
    		// the lowest of their `minZoom` options will be used instead.
    		minZoom: undefined,

    		// @option maxZoom: Number = *
    		// Maximum zoom level of the map.
    		// If not specified and at least one `GridLayer` or `TileLayer` is in the map,
    		// the highest of their `maxZoom` options will be used instead.
    		maxZoom: undefined,

    		// @option layers: Layer[] = []
    		// Array of layers that will be added to the map initially
    		layers: [],

    		// @option maxBounds: LatLngBounds = null
    		// When this option is set, the map restricts the view to the given
    		// geographical bounds, bouncing the user back if the user tries to pan
    		// outside the view. To set the restriction dynamically, use
    		// [`setMaxBounds`](#map-setmaxbounds) method.
    		maxBounds: undefined,

    		// @option renderer: Renderer = *
    		// The default method for drawing vector layers on the map. `L.SVG`
    		// or `L.Canvas` by default depending on browser support.
    		renderer: undefined,


    		// @section Animation Options
    		// @option zoomAnimation: Boolean = true
    		// Whether the map zoom animation is enabled. By default it's enabled
    		// in all browsers that support CSS3 Transitions except Android.
    		zoomAnimation: true,

    		// @option zoomAnimationThreshold: Number = 4
    		// Won't animate zoom if the zoom difference exceeds this value.
    		zoomAnimationThreshold: 4,

    		// @option fadeAnimation: Boolean = true
    		// Whether the tile fade animation is enabled. By default it's enabled
    		// in all browsers that support CSS3 Transitions except Android.
    		fadeAnimation: true,

    		// @option markerZoomAnimation: Boolean = true
    		// Whether markers animate their zoom with the zoom animation, if disabled
    		// they will disappear for the length of the animation. By default it's
    		// enabled in all browsers that support CSS3 Transitions except Android.
    		markerZoomAnimation: true,

    		// @option transform3DLimit: Number = 2^23
    		// Defines the maximum size of a CSS translation transform. The default
    		// value should not be changed unless a web browser positions layers in
    		// the wrong place after doing a large `panBy`.
    		transform3DLimit: 8388608, // Precision limit of a 32-bit float

    		// @section Interaction Options
    		// @option zoomSnap: Number = 1
    		// Forces the map's zoom level to always be a multiple of this, particularly
    		// right after a [`fitBounds()`](#map-fitbounds) or a pinch-zoom.
    		// By default, the zoom level snaps to the nearest integer; lower values
    		// (e.g. `0.5` or `0.1`) allow for greater granularity. A value of `0`
    		// means the zoom level will not be snapped after `fitBounds` or a pinch-zoom.
    		zoomSnap: 1,

    		// @option zoomDelta: Number = 1
    		// Controls how much the map's zoom level will change after a
    		// [`zoomIn()`](#map-zoomin), [`zoomOut()`](#map-zoomout), pressing `+`
    		// or `-` on the keyboard, or using the [zoom controls](#control-zoom).
    		// Values smaller than `1` (e.g. `0.5`) allow for greater granularity.
    		zoomDelta: 1,

    		// @option trackResize: Boolean = true
    		// Whether the map automatically handles browser window resize to update itself.
    		trackResize: true
    	},

    	initialize: function (id, options) { // (HTMLElement or String, Object)
    		options = setOptions(this, options);

    		// Make sure to assign internal flags at the beginning,
    		// to avoid inconsistent state in some edge cases.
    		this._handlers = [];
    		this._layers = {};
    		this._zoomBoundLayers = {};
    		this._sizeChanged = true;

    		this._initContainer(id);
    		this._initLayout();

    		// hack for https://github.com/Leaflet/Leaflet/issues/1980
    		this._onResize = bind$1(this._onResize, this);

    		this._initEvents();

    		if (options.maxBounds) {
    			this.setMaxBounds(options.maxBounds);
    		}

    		if (options.zoom !== undefined) {
    			this._zoom = this._limitZoom(options.zoom);
    		}

    		if (options.center && options.zoom !== undefined) {
    			this.setView(toLatLng(options.center), options.zoom, {reset: true});
    		}

    		this.callInitHooks();

    		// don't animate on browsers without hardware-accelerated transitions or old Android/Opera
    		this._zoomAnimated = TRANSITION && any3d && !mobileOpera &&
    				this.options.zoomAnimation;

    		// zoom transitions run with the same duration for all layers, so if one of transitionend events
    		// happens after starting zoom animation (propagating to the map pane), we know that it ended globally
    		if (this._zoomAnimated) {
    			this._createAnimProxy();
    			on(this._proxy, TRANSITION_END, this._catchTransitionEnd, this);
    		}

    		this._addLayers(this.options.layers);
    	},


    	// @section Methods for modifying map state

    	// @method setView(center: LatLng, zoom: Number, options?: Zoom/pan options): this
    	// Sets the view of the map (geographical center and zoom) with the given
    	// animation options.
    	setView: function (center, zoom, options) {

    		zoom = zoom === undefined ? this._zoom : this._limitZoom(zoom);
    		center = this._limitCenter(toLatLng(center), zoom, this.options.maxBounds);
    		options = options || {};

    		this._stop();

    		if (this._loaded && !options.reset && options !== true) {

    			if (options.animate !== undefined) {
    				options.zoom = extend({animate: options.animate}, options.zoom);
    				options.pan = extend({animate: options.animate, duration: options.duration}, options.pan);
    			}

    			// try animating pan or zoom
    			var moved = (this._zoom !== zoom) ?
    				this._tryAnimatedZoom && this._tryAnimatedZoom(center, zoom, options.zoom) :
    				this._tryAnimatedPan(center, options.pan);

    			if (moved) {
    				// prevent resize handler call, the view will refresh after animation anyway
    				clearTimeout(this._sizeTimer);
    				return this;
    			}
    		}

    		// animation didn't start, just reset the map view
    		this._resetView(center, zoom);

    		return this;
    	},

    	// @method setZoom(zoom: Number, options?: Zoom/pan options): this
    	// Sets the zoom of the map.
    	setZoom: function (zoom, options) {
    		if (!this._loaded) {
    			this._zoom = zoom;
    			return this;
    		}
    		return this.setView(this.getCenter(), zoom, {zoom: options});
    	},

    	// @method zoomIn(delta?: Number, options?: Zoom options): this
    	// Increases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
    	zoomIn: function (delta, options) {
    		delta = delta || (any3d ? this.options.zoomDelta : 1);
    		return this.setZoom(this._zoom + delta, options);
    	},

    	// @method zoomOut(delta?: Number, options?: Zoom options): this
    	// Decreases the zoom of the map by `delta` ([`zoomDelta`](#map-zoomdelta) by default).
    	zoomOut: function (delta, options) {
    		delta = delta || (any3d ? this.options.zoomDelta : 1);
    		return this.setZoom(this._zoom - delta, options);
    	},

    	// @method setZoomAround(latlng: LatLng, zoom: Number, options: Zoom options): this
    	// Zooms the map while keeping a specified geographical point on the map
    	// stationary (e.g. used internally for scroll zoom and double-click zoom).
    	// @alternative
    	// @method setZoomAround(offset: Point, zoom: Number, options: Zoom options): this
    	// Zooms the map while keeping a specified pixel on the map (relative to the top-left corner) stationary.
    	setZoomAround: function (latlng, zoom, options) {
    		var scale = this.getZoomScale(zoom),
    		    viewHalf = this.getSize().divideBy(2),
    		    containerPoint = latlng instanceof Point ? latlng : this.latLngToContainerPoint(latlng),

    		    centerOffset = containerPoint.subtract(viewHalf).multiplyBy(1 - 1 / scale),
    		    newCenter = this.containerPointToLatLng(viewHalf.add(centerOffset));

    		return this.setView(newCenter, zoom, {zoom: options});
    	},

    	_getBoundsCenterZoom: function (bounds, options) {

    		options = options || {};
    		bounds = bounds.getBounds ? bounds.getBounds() : toLatLngBounds(bounds);

    		var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
    		    paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),

    		    zoom = this.getBoundsZoom(bounds, false, paddingTL.add(paddingBR));

    		zoom = (typeof options.maxZoom === 'number') ? Math.min(options.maxZoom, zoom) : zoom;

    		if (zoom === Infinity) {
    			return {
    				center: bounds.getCenter(),
    				zoom: zoom
    			};
    		}

    		var paddingOffset = paddingBR.subtract(paddingTL).divideBy(2),

    		    swPoint = this.project(bounds.getSouthWest(), zoom),
    		    nePoint = this.project(bounds.getNorthEast(), zoom),
    		    center = this.unproject(swPoint.add(nePoint).divideBy(2).add(paddingOffset), zoom);

    		return {
    			center: center,
    			zoom: zoom
    		};
    	},

    	// @method fitBounds(bounds: LatLngBounds, options?: fitBounds options): this
    	// Sets a map view that contains the given geographical bounds with the
    	// maximum zoom level possible.
    	fitBounds: function (bounds, options) {

    		bounds = toLatLngBounds(bounds);

    		if (!bounds.isValid()) {
    			throw new Error('Bounds are not valid.');
    		}

    		var target = this._getBoundsCenterZoom(bounds, options);
    		return this.setView(target.center, target.zoom, options);
    	},

    	// @method fitWorld(options?: fitBounds options): this
    	// Sets a map view that mostly contains the whole world with the maximum
    	// zoom level possible.
    	fitWorld: function (options) {
    		return this.fitBounds([[-90, -180], [90, 180]], options);
    	},

    	// @method panTo(latlng: LatLng, options?: Pan options): this
    	// Pans the map to a given center.
    	panTo: function (center, options) { // (LatLng)
    		return this.setView(center, this._zoom, {pan: options});
    	},

    	// @method panBy(offset: Point, options?: Pan options): this
    	// Pans the map by a given number of pixels (animated).
    	panBy: function (offset, options) {
    		offset = toPoint(offset).round();
    		options = options || {};

    		if (!offset.x && !offset.y) {
    			return this.fire('moveend');
    		}
    		// If we pan too far, Chrome gets issues with tiles
    		// and makes them disappear or appear in the wrong place (slightly offset) #2602
    		if (options.animate !== true && !this.getSize().contains(offset)) {
    			this._resetView(this.unproject(this.project(this.getCenter()).add(offset)), this.getZoom());
    			return this;
    		}

    		if (!this._panAnim) {
    			this._panAnim = new PosAnimation();

    			this._panAnim.on({
    				'step': this._onPanTransitionStep,
    				'end': this._onPanTransitionEnd
    			}, this);
    		}

    		// don't fire movestart if animating inertia
    		if (!options.noMoveStart) {
    			this.fire('movestart');
    		}

    		// animate pan unless animate: false specified
    		if (options.animate !== false) {
    			addClass(this._mapPane, 'leaflet-pan-anim');

    			var newPos = this._getMapPanePos().subtract(offset).round();
    			this._panAnim.run(this._mapPane, newPos, options.duration || 0.25, options.easeLinearity);
    		} else {
    			this._rawPanBy(offset);
    			this.fire('move').fire('moveend');
    		}

    		return this;
    	},

    	// @method flyTo(latlng: LatLng, zoom?: Number, options?: Zoom/pan options): this
    	// Sets the view of the map (geographical center and zoom) performing a smooth
    	// pan-zoom animation.
    	flyTo: function (targetCenter, targetZoom, options) {

    		options = options || {};
    		if (options.animate === false || !any3d) {
    			return this.setView(targetCenter, targetZoom, options);
    		}

    		this._stop();

    		var from = this.project(this.getCenter()),
    		    to = this.project(targetCenter),
    		    size = this.getSize(),
    		    startZoom = this._zoom;

    		targetCenter = toLatLng(targetCenter);
    		targetZoom = targetZoom === undefined ? startZoom : targetZoom;

    		var w0 = Math.max(size.x, size.y),
    		    w1 = w0 * this.getZoomScale(startZoom, targetZoom),
    		    u1 = (to.distanceTo(from)) || 1,
    		    rho = 1.42,
    		    rho2 = rho * rho;

    		function r(i) {
    			var s1 = i ? -1 : 1,
    			    s2 = i ? w1 : w0,
    			    t1 = w1 * w1 - w0 * w0 + s1 * rho2 * rho2 * u1 * u1,
    			    b1 = 2 * s2 * rho2 * u1,
    			    b = t1 / b1,
    			    sq = Math.sqrt(b * b + 1) - b;

    			    // workaround for floating point precision bug when sq = 0, log = -Infinite,
    			    // thus triggering an infinite loop in flyTo
    			    var log = sq < 0.000000001 ? -18 : Math.log(sq);

    			return log;
    		}

    		function sinh(n) { return (Math.exp(n) - Math.exp(-n)) / 2; }
    		function cosh(n) { return (Math.exp(n) + Math.exp(-n)) / 2; }
    		function tanh(n) { return sinh(n) / cosh(n); }

    		var r0 = r(0);

    		function w(s) { return w0 * (cosh(r0) / cosh(r0 + rho * s)); }
    		function u(s) { return w0 * (cosh(r0) * tanh(r0 + rho * s) - sinh(r0)) / rho2; }

    		function easeOut(t) { return 1 - Math.pow(1 - t, 1.5); }

    		var start = Date.now(),
    		    S = (r(1) - r0) / rho,
    		    duration = options.duration ? 1000 * options.duration : 1000 * S * 0.8;

    		function frame() {
    			var t = (Date.now() - start) / duration,
    			    s = easeOut(t) * S;

    			if (t <= 1) {
    				this._flyToFrame = requestAnimFrame(frame, this);

    				this._move(
    					this.unproject(from.add(to.subtract(from).multiplyBy(u(s) / u1)), startZoom),
    					this.getScaleZoom(w0 / w(s), startZoom),
    					{flyTo: true});

    			} else {
    				this
    					._move(targetCenter, targetZoom)
    					._moveEnd(true);
    			}
    		}

    		this._moveStart(true, options.noMoveStart);

    		frame.call(this);
    		return this;
    	},

    	// @method flyToBounds(bounds: LatLngBounds, options?: fitBounds options): this
    	// Sets the view of the map with a smooth animation like [`flyTo`](#map-flyto),
    	// but takes a bounds parameter like [`fitBounds`](#map-fitbounds).
    	flyToBounds: function (bounds, options) {
    		var target = this._getBoundsCenterZoom(bounds, options);
    		return this.flyTo(target.center, target.zoom, options);
    	},

    	// @method setMaxBounds(bounds: LatLngBounds): this
    	// Restricts the map view to the given bounds (see the [maxBounds](#map-maxbounds) option).
    	setMaxBounds: function (bounds) {
    		bounds = toLatLngBounds(bounds);

    		if (!bounds.isValid()) {
    			this.options.maxBounds = null;
    			return this.off('moveend', this._panInsideMaxBounds);
    		} else if (this.options.maxBounds) {
    			this.off('moveend', this._panInsideMaxBounds);
    		}

    		this.options.maxBounds = bounds;

    		if (this._loaded) {
    			this._panInsideMaxBounds();
    		}

    		return this.on('moveend', this._panInsideMaxBounds);
    	},

    	// @method setMinZoom(zoom: Number): this
    	// Sets the lower limit for the available zoom levels (see the [minZoom](#map-minzoom) option).
    	setMinZoom: function (zoom) {
    		var oldZoom = this.options.minZoom;
    		this.options.minZoom = zoom;

    		if (this._loaded && oldZoom !== zoom) {
    			this.fire('zoomlevelschange');

    			if (this.getZoom() < this.options.minZoom) {
    				return this.setZoom(zoom);
    			}
    		}

    		return this;
    	},

    	// @method setMaxZoom(zoom: Number): this
    	// Sets the upper limit for the available zoom levels (see the [maxZoom](#map-maxzoom) option).
    	setMaxZoom: function (zoom) {
    		var oldZoom = this.options.maxZoom;
    		this.options.maxZoom = zoom;

    		if (this._loaded && oldZoom !== zoom) {
    			this.fire('zoomlevelschange');

    			if (this.getZoom() > this.options.maxZoom) {
    				return this.setZoom(zoom);
    			}
    		}

    		return this;
    	},

    	// @method panInsideBounds(bounds: LatLngBounds, options?: Pan options): this
    	// Pans the map to the closest view that would lie inside the given bounds (if it's not already), controlling the animation using the options specific, if any.
    	panInsideBounds: function (bounds, options) {
    		this._enforcingBounds = true;
    		var center = this.getCenter(),
    		    newCenter = this._limitCenter(center, this._zoom, toLatLngBounds(bounds));

    		if (!center.equals(newCenter)) {
    			this.panTo(newCenter, options);
    		}

    		this._enforcingBounds = false;
    		return this;
    	},

    	// @method panInside(latlng: LatLng, options?: options): this
    	// Pans the map the minimum amount to make the `latlng` visible. Use
    	// `padding`, `paddingTopLeft` and `paddingTopRight` options to fit
    	// the display to more restricted bounds, like [`fitBounds`](#map-fitbounds).
    	// If `latlng` is already within the (optionally padded) display bounds,
    	// the map will not be panned.
    	panInside: function (latlng, options) {
    		options = options || {};

    		var paddingTL = toPoint(options.paddingTopLeft || options.padding || [0, 0]),
    		    paddingBR = toPoint(options.paddingBottomRight || options.padding || [0, 0]),
    		    center = this.getCenter(),
    		    pixelCenter = this.project(center),
    		    pixelPoint = this.project(latlng),
    		    pixelBounds = this.getPixelBounds(),
    		    halfPixelBounds = pixelBounds.getSize().divideBy(2),
    		    paddedBounds = toBounds([pixelBounds.min.add(paddingTL), pixelBounds.max.subtract(paddingBR)]);

    		if (!paddedBounds.contains(pixelPoint)) {
    			this._enforcingBounds = true;
    			var diff = pixelCenter.subtract(pixelPoint),
    			    newCenter = toPoint(pixelPoint.x + diff.x, pixelPoint.y + diff.y);

    			if (pixelPoint.x < paddedBounds.min.x || pixelPoint.x > paddedBounds.max.x) {
    				newCenter.x = pixelCenter.x - diff.x;
    				if (diff.x > 0) {
    					newCenter.x += halfPixelBounds.x - paddingTL.x;
    				} else {
    					newCenter.x -= halfPixelBounds.x - paddingBR.x;
    				}
    			}
    			if (pixelPoint.y < paddedBounds.min.y || pixelPoint.y > paddedBounds.max.y) {
    				newCenter.y = pixelCenter.y - diff.y;
    				if (diff.y > 0) {
    					newCenter.y += halfPixelBounds.y - paddingTL.y;
    				} else {
    					newCenter.y -= halfPixelBounds.y - paddingBR.y;
    				}
    			}
    			this.panTo(this.unproject(newCenter), options);
    			this._enforcingBounds = false;
    		}
    		return this;
    	},

    	// @method invalidateSize(options: Zoom/pan options): this
    	// Checks if the map container size changed and updates the map if so —
    	// call it after you've changed the map size dynamically, also animating
    	// pan by default. If `options.pan` is `false`, panning will not occur.
    	// If `options.debounceMoveend` is `true`, it will delay `moveend` event so
    	// that it doesn't happen often even if the method is called many
    	// times in a row.

    	// @alternative
    	// @method invalidateSize(animate: Boolean): this
    	// Checks if the map container size changed and updates the map if so —
    	// call it after you've changed the map size dynamically, also animating
    	// pan by default.
    	invalidateSize: function (options) {
    		if (!this._loaded) { return this; }

    		options = extend({
    			animate: false,
    			pan: true
    		}, options === true ? {animate: true} : options);

    		var oldSize = this.getSize();
    		this._sizeChanged = true;
    		this._lastCenter = null;

    		var newSize = this.getSize(),
    		    oldCenter = oldSize.divideBy(2).round(),
    		    newCenter = newSize.divideBy(2).round(),
    		    offset = oldCenter.subtract(newCenter);

    		if (!offset.x && !offset.y) { return this; }

    		if (options.animate && options.pan) {
    			this.panBy(offset);

    		} else {
    			if (options.pan) {
    				this._rawPanBy(offset);
    			}

    			this.fire('move');

    			if (options.debounceMoveend) {
    				clearTimeout(this._sizeTimer);
    				this._sizeTimer = setTimeout(bind$1(this.fire, this, 'moveend'), 200);
    			} else {
    				this.fire('moveend');
    			}
    		}

    		// @section Map state change events
    		// @event resize: ResizeEvent
    		// Fired when the map is resized.
    		return this.fire('resize', {
    			oldSize: oldSize,
    			newSize: newSize
    		});
    	},

    	// @section Methods for modifying map state
    	// @method stop(): this
    	// Stops the currently running `panTo` or `flyTo` animation, if any.
    	stop: function () {
    		this.setZoom(this._limitZoom(this._zoom));
    		if (!this.options.zoomSnap) {
    			this.fire('viewreset');
    		}
    		return this._stop();
    	},

    	// @section Geolocation methods
    	// @method locate(options?: Locate options): this
    	// Tries to locate the user using the Geolocation API, firing a [`locationfound`](#map-locationfound)
    	// event with location data on success or a [`locationerror`](#map-locationerror) event on failure,
    	// and optionally sets the map view to the user's location with respect to
    	// detection accuracy (or to the world view if geolocation failed).
    	// Note that, if your page doesn't use HTTPS, this method will fail in
    	// modern browsers ([Chrome 50 and newer](https://sites.google.com/a/chromium.org/dev/Home/chromium-security/deprecating-powerful-features-on-insecure-origins))
    	// See `Locate options` for more details.
    	locate: function (options) {

    		options = this._locateOptions = extend({
    			timeout: 10000,
    			watch: false
    			// setView: false
    			// maxZoom: <Number>
    			// maximumAge: 0
    			// enableHighAccuracy: false
    		}, options);

    		if (!('geolocation' in navigator)) {
    			this._handleGeolocationError({
    				code: 0,
    				message: 'Geolocation not supported.'
    			});
    			return this;
    		}

    		var onResponse = bind$1(this._handleGeolocationResponse, this),
    		    onError = bind$1(this._handleGeolocationError, this);

    		if (options.watch) {
    			this._locationWatchId =
    			        navigator.geolocation.watchPosition(onResponse, onError, options);
    		} else {
    			navigator.geolocation.getCurrentPosition(onResponse, onError, options);
    		}
    		return this;
    	},

    	// @method stopLocate(): this
    	// Stops watching location previously initiated by `map.locate({watch: true})`
    	// and aborts resetting the map view if map.locate was called with
    	// `{setView: true}`.
    	stopLocate: function () {
    		if (navigator.geolocation && navigator.geolocation.clearWatch) {
    			navigator.geolocation.clearWatch(this._locationWatchId);
    		}
    		if (this._locateOptions) {
    			this._locateOptions.setView = false;
    		}
    		return this;
    	},

    	_handleGeolocationError: function (error) {
    		var c = error.code,
    		    message = error.message ||
    		            (c === 1 ? 'permission denied' :
    		            (c === 2 ? 'position unavailable' : 'timeout'));

    		if (this._locateOptions.setView && !this._loaded) {
    			this.fitWorld();
    		}

    		// @section Location events
    		// @event locationerror: ErrorEvent
    		// Fired when geolocation (using the [`locate`](#map-locate) method) failed.
    		this.fire('locationerror', {
    			code: c,
    			message: 'Geolocation error: ' + message + '.'
    		});
    	},

    	_handleGeolocationResponse: function (pos) {
    		var lat = pos.coords.latitude,
    		    lng = pos.coords.longitude,
    		    latlng = new LatLng(lat, lng),
    		    bounds = latlng.toBounds(pos.coords.accuracy * 2),
    		    options = this._locateOptions;

    		if (options.setView) {
    			var zoom = this.getBoundsZoom(bounds);
    			this.setView(latlng, options.maxZoom ? Math.min(zoom, options.maxZoom) : zoom);
    		}

    		var data = {
    			latlng: latlng,
    			bounds: bounds,
    			timestamp: pos.timestamp
    		};

    		for (var i in pos.coords) {
    			if (typeof pos.coords[i] === 'number') {
    				data[i] = pos.coords[i];
    			}
    		}

    		// @event locationfound: LocationEvent
    		// Fired when geolocation (using the [`locate`](#map-locate) method)
    		// went successfully.
    		this.fire('locationfound', data);
    	},

    	// TODO Appropriate docs section?
    	// @section Other Methods
    	// @method addHandler(name: String, HandlerClass: Function): this
    	// Adds a new `Handler` to the map, given its name and constructor function.
    	addHandler: function (name, HandlerClass) {
    		if (!HandlerClass) { return this; }

    		var handler = this[name] = new HandlerClass(this);

    		this._handlers.push(handler);

    		if (this.options[name]) {
    			handler.enable();
    		}

    		return this;
    	},

    	// @method remove(): this
    	// Destroys the map and clears all related event listeners.
    	remove: function () {

    		this._initEvents(true);
    		this.off('moveend', this._panInsideMaxBounds);

    		if (this._containerId !== this._container._leaflet_id) {
    			throw new Error('Map container is being reused by another instance');
    		}

    		try {
    			// throws error in IE6-8
    			delete this._container._leaflet_id;
    			delete this._containerId;
    		} catch (e) {
    			/*eslint-disable */
    			this._container._leaflet_id = undefined;
    			/* eslint-enable */
    			this._containerId = undefined;
    		}

    		if (this._locationWatchId !== undefined) {
    			this.stopLocate();
    		}

    		this._stop();

    		remove(this._mapPane);

    		if (this._clearControlPos) {
    			this._clearControlPos();
    		}
    		if (this._resizeRequest) {
    			cancelAnimFrame(this._resizeRequest);
    			this._resizeRequest = null;
    		}

    		this._clearHandlers();

    		if (this._loaded) {
    			// @section Map state change events
    			// @event unload: Event
    			// Fired when the map is destroyed with [remove](#map-remove) method.
    			this.fire('unload');
    		}

    		var i;
    		for (i in this._layers) {
    			this._layers[i].remove();
    		}
    		for (i in this._panes) {
    			remove(this._panes[i]);
    		}

    		this._layers = [];
    		this._panes = [];
    		delete this._mapPane;
    		delete this._renderer;

    		return this;
    	},

    	// @section Other Methods
    	// @method createPane(name: String, container?: HTMLElement): HTMLElement
    	// Creates a new [map pane](#map-pane) with the given name if it doesn't exist already,
    	// then returns it. The pane is created as a child of `container`, or
    	// as a child of the main map pane if not set.
    	createPane: function (name, container) {
    		var className = 'leaflet-pane' + (name ? ' leaflet-' + name.replace('Pane', '') + '-pane' : ''),
    		    pane = create$1('div', className, container || this._mapPane);

    		if (name) {
    			this._panes[name] = pane;
    		}
    		return pane;
    	},

    	// @section Methods for Getting Map State

    	// @method getCenter(): LatLng
    	// Returns the geographical center of the map view
    	getCenter: function () {
    		this._checkIfLoaded();

    		if (this._lastCenter && !this._moved()) {
    			return this._lastCenter;
    		}
    		return this.layerPointToLatLng(this._getCenterLayerPoint());
    	},

    	// @method getZoom(): Number
    	// Returns the current zoom level of the map view
    	getZoom: function () {
    		return this._zoom;
    	},

    	// @method getBounds(): LatLngBounds
    	// Returns the geographical bounds visible in the current map view
    	getBounds: function () {
    		var bounds = this.getPixelBounds(),
    		    sw = this.unproject(bounds.getBottomLeft()),
    		    ne = this.unproject(bounds.getTopRight());

    		return new LatLngBounds(sw, ne);
    	},

    	// @method getMinZoom(): Number
    	// Returns the minimum zoom level of the map (if set in the `minZoom` option of the map or of any layers), or `0` by default.
    	getMinZoom: function () {
    		return this.options.minZoom === undefined ? this._layersMinZoom || 0 : this.options.minZoom;
    	},

    	// @method getMaxZoom(): Number
    	// Returns the maximum zoom level of the map (if set in the `maxZoom` option of the map or of any layers).
    	getMaxZoom: function () {
    		return this.options.maxZoom === undefined ?
    			(this._layersMaxZoom === undefined ? Infinity : this._layersMaxZoom) :
    			this.options.maxZoom;
    	},

    	// @method getBoundsZoom(bounds: LatLngBounds, inside?: Boolean, padding?: Point): Number
    	// Returns the maximum zoom level on which the given bounds fit to the map
    	// view in its entirety. If `inside` (optional) is set to `true`, the method
    	// instead returns the minimum zoom level on which the map view fits into
    	// the given bounds in its entirety.
    	getBoundsZoom: function (bounds, inside, padding) { // (LatLngBounds[, Boolean, Point]) -> Number
    		bounds = toLatLngBounds(bounds);
    		padding = toPoint(padding || [0, 0]);

    		var zoom = this.getZoom() || 0,
    		    min = this.getMinZoom(),
    		    max = this.getMaxZoom(),
    		    nw = bounds.getNorthWest(),
    		    se = bounds.getSouthEast(),
    		    size = this.getSize().subtract(padding),
    		    boundsSize = toBounds(this.project(se, zoom), this.project(nw, zoom)).getSize(),
    		    snap = any3d ? this.options.zoomSnap : 1,
    		    scalex = size.x / boundsSize.x,
    		    scaley = size.y / boundsSize.y,
    		    scale = inside ? Math.max(scalex, scaley) : Math.min(scalex, scaley);

    		zoom = this.getScaleZoom(scale, zoom);

    		if (snap) {
    			zoom = Math.round(zoom / (snap / 100)) * (snap / 100); // don't jump if within 1% of a snap level
    			zoom = inside ? Math.ceil(zoom / snap) * snap : Math.floor(zoom / snap) * snap;
    		}

    		return Math.max(min, Math.min(max, zoom));
    	},

    	// @method getSize(): Point
    	// Returns the current size of the map container (in pixels).
    	getSize: function () {
    		if (!this._size || this._sizeChanged) {
    			this._size = new Point(
    				this._container.clientWidth || 0,
    				this._container.clientHeight || 0);

    			this._sizeChanged = false;
    		}
    		return this._size.clone();
    	},

    	// @method getPixelBounds(): Bounds
    	// Returns the bounds of the current map view in projected pixel
    	// coordinates (sometimes useful in layer and overlay implementations).
    	getPixelBounds: function (center, zoom) {
    		var topLeftPoint = this._getTopLeftPoint(center, zoom);
    		return new Bounds(topLeftPoint, topLeftPoint.add(this.getSize()));
    	},

    	// TODO: Check semantics - isn't the pixel origin the 0,0 coord relative to
    	// the map pane? "left point of the map layer" can be confusing, specially
    	// since there can be negative offsets.
    	// @method getPixelOrigin(): Point
    	// Returns the projected pixel coordinates of the top left point of
    	// the map layer (useful in custom layer and overlay implementations).
    	getPixelOrigin: function () {
    		this._checkIfLoaded();
    		return this._pixelOrigin;
    	},

    	// @method getPixelWorldBounds(zoom?: Number): Bounds
    	// Returns the world's bounds in pixel coordinates for zoom level `zoom`.
    	// If `zoom` is omitted, the map's current zoom level is used.
    	getPixelWorldBounds: function (zoom) {
    		return this.options.crs.getProjectedBounds(zoom === undefined ? this.getZoom() : zoom);
    	},

    	// @section Other Methods

    	// @method getPane(pane: String|HTMLElement): HTMLElement
    	// Returns a [map pane](#map-pane), given its name or its HTML element (its identity).
    	getPane: function (pane) {
    		return typeof pane === 'string' ? this._panes[pane] : pane;
    	},

    	// @method getPanes(): Object
    	// Returns a plain object containing the names of all [panes](#map-pane) as keys and
    	// the panes as values.
    	getPanes: function () {
    		return this._panes;
    	},

    	// @method getContainer: HTMLElement
    	// Returns the HTML element that contains the map.
    	getContainer: function () {
    		return this._container;
    	},


    	// @section Conversion Methods

    	// @method getZoomScale(toZoom: Number, fromZoom: Number): Number
    	// Returns the scale factor to be applied to a map transition from zoom level
    	// `fromZoom` to `toZoom`. Used internally to help with zoom animations.
    	getZoomScale: function (toZoom, fromZoom) {
    		// TODO replace with universal implementation after refactoring projections
    		var crs = this.options.crs;
    		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
    		return crs.scale(toZoom) / crs.scale(fromZoom);
    	},

    	// @method getScaleZoom(scale: Number, fromZoom: Number): Number
    	// Returns the zoom level that the map would end up at, if it is at `fromZoom`
    	// level and everything is scaled by a factor of `scale`. Inverse of
    	// [`getZoomScale`](#map-getZoomScale).
    	getScaleZoom: function (scale, fromZoom) {
    		var crs = this.options.crs;
    		fromZoom = fromZoom === undefined ? this._zoom : fromZoom;
    		var zoom = crs.zoom(scale * crs.scale(fromZoom));
    		return isNaN(zoom) ? Infinity : zoom;
    	},

    	// @method project(latlng: LatLng, zoom: Number): Point
    	// Projects a geographical coordinate `LatLng` according to the projection
    	// of the map's CRS, then scales it according to `zoom` and the CRS's
    	// `Transformation`. The result is pixel coordinate relative to
    	// the CRS origin.
    	project: function (latlng, zoom) {
    		zoom = zoom === undefined ? this._zoom : zoom;
    		return this.options.crs.latLngToPoint(toLatLng(latlng), zoom);
    	},

    	// @method unproject(point: Point, zoom: Number): LatLng
    	// Inverse of [`project`](#map-project).
    	unproject: function (point, zoom) {
    		zoom = zoom === undefined ? this._zoom : zoom;
    		return this.options.crs.pointToLatLng(toPoint(point), zoom);
    	},

    	// @method layerPointToLatLng(point: Point): LatLng
    	// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
    	// returns the corresponding geographical coordinate (for the current zoom level).
    	layerPointToLatLng: function (point) {
    		var projectedPoint = toPoint(point).add(this.getPixelOrigin());
    		return this.unproject(projectedPoint);
    	},

    	// @method latLngToLayerPoint(latlng: LatLng): Point
    	// Given a geographical coordinate, returns the corresponding pixel coordinate
    	// relative to the [origin pixel](#map-getpixelorigin).
    	latLngToLayerPoint: function (latlng) {
    		var projectedPoint = this.project(toLatLng(latlng))._round();
    		return projectedPoint._subtract(this.getPixelOrigin());
    	},

    	// @method wrapLatLng(latlng: LatLng): LatLng
    	// Returns a `LatLng` where `lat` and `lng` has been wrapped according to the
    	// map's CRS's `wrapLat` and `wrapLng` properties, if they are outside the
    	// CRS's bounds.
    	// By default this means longitude is wrapped around the dateline so its
    	// value is between -180 and +180 degrees.
    	wrapLatLng: function (latlng) {
    		return this.options.crs.wrapLatLng(toLatLng(latlng));
    	},

    	// @method wrapLatLngBounds(bounds: LatLngBounds): LatLngBounds
    	// Returns a `LatLngBounds` with the same size as the given one, ensuring that
    	// its center is within the CRS's bounds.
    	// By default this means the center longitude is wrapped around the dateline so its
    	// value is between -180 and +180 degrees, and the majority of the bounds
    	// overlaps the CRS's bounds.
    	wrapLatLngBounds: function (latlng) {
    		return this.options.crs.wrapLatLngBounds(toLatLngBounds(latlng));
    	},

    	// @method distance(latlng1: LatLng, latlng2: LatLng): Number
    	// Returns the distance between two geographical coordinates according to
    	// the map's CRS. By default this measures distance in meters.
    	distance: function (latlng1, latlng2) {
    		return this.options.crs.distance(toLatLng(latlng1), toLatLng(latlng2));
    	},

    	// @method containerPointToLayerPoint(point: Point): Point
    	// Given a pixel coordinate relative to the map container, returns the corresponding
    	// pixel coordinate relative to the [origin pixel](#map-getpixelorigin).
    	containerPointToLayerPoint: function (point) { // (Point)
    		return toPoint(point).subtract(this._getMapPanePos());
    	},

    	// @method layerPointToContainerPoint(point: Point): Point
    	// Given a pixel coordinate relative to the [origin pixel](#map-getpixelorigin),
    	// returns the corresponding pixel coordinate relative to the map container.
    	layerPointToContainerPoint: function (point) { // (Point)
    		return toPoint(point).add(this._getMapPanePos());
    	},

    	// @method containerPointToLatLng(point: Point): LatLng
    	// Given a pixel coordinate relative to the map container, returns
    	// the corresponding geographical coordinate (for the current zoom level).
    	containerPointToLatLng: function (point) {
    		var layerPoint = this.containerPointToLayerPoint(toPoint(point));
    		return this.layerPointToLatLng(layerPoint);
    	},

    	// @method latLngToContainerPoint(latlng: LatLng): Point
    	// Given a geographical coordinate, returns the corresponding pixel coordinate
    	// relative to the map container.
    	latLngToContainerPoint: function (latlng) {
    		return this.layerPointToContainerPoint(this.latLngToLayerPoint(toLatLng(latlng)));
    	},

    	// @method mouseEventToContainerPoint(ev: MouseEvent): Point
    	// Given a MouseEvent object, returns the pixel coordinate relative to the
    	// map container where the event took place.
    	mouseEventToContainerPoint: function (e) {
    		return getMousePosition(e, this._container);
    	},

    	// @method mouseEventToLayerPoint(ev: MouseEvent): Point
    	// Given a MouseEvent object, returns the pixel coordinate relative to
    	// the [origin pixel](#map-getpixelorigin) where the event took place.
    	mouseEventToLayerPoint: function (e) {
    		return this.containerPointToLayerPoint(this.mouseEventToContainerPoint(e));
    	},

    	// @method mouseEventToLatLng(ev: MouseEvent): LatLng
    	// Given a MouseEvent object, returns geographical coordinate where the
    	// event took place.
    	mouseEventToLatLng: function (e) { // (MouseEvent)
    		return this.layerPointToLatLng(this.mouseEventToLayerPoint(e));
    	},


    	// map initialization methods

    	_initContainer: function (id) {
    		var container = this._container = get(id);

    		if (!container) {
    			throw new Error('Map container not found.');
    		} else if (container._leaflet_id) {
    			throw new Error('Map container is already initialized.');
    		}

    		on(container, 'scroll', this._onScroll, this);
    		this._containerId = stamp(container);
    	},

    	_initLayout: function () {
    		var container = this._container;

    		this._fadeAnimated = this.options.fadeAnimation && any3d;

    		addClass(container, 'leaflet-container' +
    			(touch ? ' leaflet-touch' : '') +
    			(retina ? ' leaflet-retina' : '') +
    			(ielt9 ? ' leaflet-oldie' : '') +
    			(safari ? ' leaflet-safari' : '') +
    			(this._fadeAnimated ? ' leaflet-fade-anim' : ''));

    		var position = getStyle(container, 'position');

    		if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
    			container.style.position = 'relative';
    		}

    		this._initPanes();

    		if (this._initControlPos) {
    			this._initControlPos();
    		}
    	},

    	_initPanes: function () {
    		var panes = this._panes = {};
    		this._paneRenderers = {};

    		// @section
    		//
    		// Panes are DOM elements used to control the ordering of layers on the map. You
    		// can access panes with [`map.getPane`](#map-getpane) or
    		// [`map.getPanes`](#map-getpanes) methods. New panes can be created with the
    		// [`map.createPane`](#map-createpane) method.
    		//
    		// Every map has the following default panes that differ only in zIndex.
    		//
    		// @pane mapPane: HTMLElement = 'auto'
    		// Pane that contains all other map panes

    		this._mapPane = this.createPane('mapPane', this._container);
    		setPosition(this._mapPane, new Point(0, 0));

    		// @pane tilePane: HTMLElement = 200
    		// Pane for `GridLayer`s and `TileLayer`s
    		this.createPane('tilePane');
    		// @pane overlayPane: HTMLElement = 400
    		// Pane for overlay shadows (e.g. `Marker` shadows)
    		this.createPane('shadowPane');
    		// @pane shadowPane: HTMLElement = 500
    		// Pane for vectors (`Path`s, like `Polyline`s and `Polygon`s), `ImageOverlay`s and `VideoOverlay`s
    		this.createPane('overlayPane');
    		// @pane markerPane: HTMLElement = 600
    		// Pane for `Icon`s of `Marker`s
    		this.createPane('markerPane');
    		// @pane tooltipPane: HTMLElement = 650
    		// Pane for `Tooltip`s.
    		this.createPane('tooltipPane');
    		// @pane popupPane: HTMLElement = 700
    		// Pane for `Popup`s.
    		this.createPane('popupPane');

    		if (!this.options.markerZoomAnimation) {
    			addClass(panes.markerPane, 'leaflet-zoom-hide');
    			addClass(panes.shadowPane, 'leaflet-zoom-hide');
    		}
    	},


    	// private methods that modify map state

    	// @section Map state change events
    	_resetView: function (center, zoom) {
    		setPosition(this._mapPane, new Point(0, 0));

    		var loading = !this._loaded;
    		this._loaded = true;
    		zoom = this._limitZoom(zoom);

    		this.fire('viewprereset');

    		var zoomChanged = this._zoom !== zoom;
    		this
    			._moveStart(zoomChanged, false)
    			._move(center, zoom)
    			._moveEnd(zoomChanged);

    		// @event viewreset: Event
    		// Fired when the map needs to redraw its content (this usually happens
    		// on map zoom or load). Very useful for creating custom overlays.
    		this.fire('viewreset');

    		// @event load: Event
    		// Fired when the map is initialized (when its center and zoom are set
    		// for the first time).
    		if (loading) {
    			this.fire('load');
    		}
    	},

    	_moveStart: function (zoomChanged, noMoveStart) {
    		// @event zoomstart: Event
    		// Fired when the map zoom is about to change (e.g. before zoom animation).
    		// @event movestart: Event
    		// Fired when the view of the map starts changing (e.g. user starts dragging the map).
    		if (zoomChanged) {
    			this.fire('zoomstart');
    		}
    		if (!noMoveStart) {
    			this.fire('movestart');
    		}
    		return this;
    	},

    	_move: function (center, zoom, data) {
    		if (zoom === undefined) {
    			zoom = this._zoom;
    		}
    		var zoomChanged = this._zoom !== zoom;

    		this._zoom = zoom;
    		this._lastCenter = center;
    		this._pixelOrigin = this._getNewPixelOrigin(center);

    		// @event zoom: Event
    		// Fired repeatedly during any change in zoom level, including zoom
    		// and fly animations.
    		if (zoomChanged || (data && data.pinch)) {	// Always fire 'zoom' if pinching because #3530
    			this.fire('zoom', data);
    		}

    		// @event move: Event
    		// Fired repeatedly during any movement of the map, including pan and
    		// fly animations.
    		return this.fire('move', data);
    	},

    	_moveEnd: function (zoomChanged) {
    		// @event zoomend: Event
    		// Fired when the map has changed, after any animations.
    		if (zoomChanged) {
    			this.fire('zoomend');
    		}

    		// @event moveend: Event
    		// Fired when the center of the map stops changing (e.g. user stopped
    		// dragging the map).
    		return this.fire('moveend');
    	},

    	_stop: function () {
    		cancelAnimFrame(this._flyToFrame);
    		if (this._panAnim) {
    			this._panAnim.stop();
    		}
    		return this;
    	},

    	_rawPanBy: function (offset) {
    		setPosition(this._mapPane, this._getMapPanePos().subtract(offset));
    	},

    	_getZoomSpan: function () {
    		return this.getMaxZoom() - this.getMinZoom();
    	},

    	_panInsideMaxBounds: function () {
    		if (!this._enforcingBounds) {
    			this.panInsideBounds(this.options.maxBounds);
    		}
    	},

    	_checkIfLoaded: function () {
    		if (!this._loaded) {
    			throw new Error('Set map center and zoom first.');
    		}
    	},

    	// DOM event handling

    	// @section Interaction events
    	_initEvents: function (remove) {
    		this._targets = {};
    		this._targets[stamp(this._container)] = this;

    		var onOff = remove ? off : on;

    		// @event click: MouseEvent
    		// Fired when the user clicks (or taps) the map.
    		// @event dblclick: MouseEvent
    		// Fired when the user double-clicks (or double-taps) the map.
    		// @event mousedown: MouseEvent
    		// Fired when the user pushes the mouse button on the map.
    		// @event mouseup: MouseEvent
    		// Fired when the user releases the mouse button on the map.
    		// @event mouseover: MouseEvent
    		// Fired when the mouse enters the map.
    		// @event mouseout: MouseEvent
    		// Fired when the mouse leaves the map.
    		// @event mousemove: MouseEvent
    		// Fired while the mouse moves over the map.
    		// @event contextmenu: MouseEvent
    		// Fired when the user pushes the right mouse button on the map, prevents
    		// default browser context menu from showing if there are listeners on
    		// this event. Also fired on mobile when the user holds a single touch
    		// for a second (also called long press).
    		// @event keypress: KeyboardEvent
    		// Fired when the user presses a key from the keyboard that produces a character value while the map is focused.
    		// @event keydown: KeyboardEvent
    		// Fired when the user presses a key from the keyboard while the map is focused. Unlike the `keypress` event,
    		// the `keydown` event is fired for keys that produce a character value and for keys
    		// that do not produce a character value.
    		// @event keyup: KeyboardEvent
    		// Fired when the user releases a key from the keyboard while the map is focused.
    		onOff(this._container, 'click dblclick mousedown mouseup ' +
    			'mouseover mouseout mousemove contextmenu keypress keydown keyup', this._handleDOMEvent, this);

    		if (this.options.trackResize) {
    			onOff(window, 'resize', this._onResize, this);
    		}

    		if (any3d && this.options.transform3DLimit) {
    			(remove ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
    		}
    	},

    	_onResize: function () {
    		cancelAnimFrame(this._resizeRequest);
    		this._resizeRequest = requestAnimFrame(
    		        function () { this.invalidateSize({debounceMoveend: true}); }, this);
    	},

    	_onScroll: function () {
    		this._container.scrollTop  = 0;
    		this._container.scrollLeft = 0;
    	},

    	_onMoveEnd: function () {
    		var pos = this._getMapPanePos();
    		if (Math.max(Math.abs(pos.x), Math.abs(pos.y)) >= this.options.transform3DLimit) {
    			// https://bugzilla.mozilla.org/show_bug.cgi?id=1203873 but Webkit also have
    			// a pixel offset on very high values, see: http://jsfiddle.net/dg6r5hhb/
    			this._resetView(this.getCenter(), this.getZoom());
    		}
    	},

    	_findEventTargets: function (e, type) {
    		var targets = [],
    		    target,
    		    isHover = type === 'mouseout' || type === 'mouseover',
    		    src = e.target || e.srcElement,
    		    dragging = false;

    		while (src) {
    			target = this._targets[stamp(src)];
    			if (target && (type === 'click' || type === 'preclick') && !e._simulated && this._draggableMoved(target)) {
    				// Prevent firing click after you just dragged an object.
    				dragging = true;
    				break;
    			}
    			if (target && target.listens(type, true)) {
    				if (isHover && !isExternalTarget(src, e)) { break; }
    				targets.push(target);
    				if (isHover) { break; }
    			}
    			if (src === this._container) { break; }
    			src = src.parentNode;
    		}
    		if (!targets.length && !dragging && !isHover && isExternalTarget(src, e)) {
    			targets = [this];
    		}
    		return targets;
    	},

    	_handleDOMEvent: function (e) {
    		if (!this._loaded || skipped(e)) { return; }

    		var type = e.type;

    		if (type === 'mousedown' || type === 'keypress' || type === 'keyup' || type === 'keydown') {
    			// prevents outline when clicking on keyboard-focusable element
    			preventOutline(e.target || e.srcElement);
    		}

    		this._fireDOMEvent(e, type);
    	},

    	_mouseEvents: ['click', 'dblclick', 'mouseover', 'mouseout', 'contextmenu'],

    	_fireDOMEvent: function (e, type, targets) {

    		if (e.type === 'click') {
    			// Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
    			// @event preclick: MouseEvent
    			// Fired before mouse click on the map (sometimes useful when you
    			// want something to happen on click before any existing click
    			// handlers start running).
    			var synth = extend({}, e);
    			synth.type = 'preclick';
    			this._fireDOMEvent(synth, synth.type, targets);
    		}

    		if (e._stopped) { return; }

    		// Find the layer the event is propagating from and its parents.
    		targets = (targets || []).concat(this._findEventTargets(e, type));

    		if (!targets.length) { return; }

    		var target = targets[0];
    		if (type === 'contextmenu' && target.listens(type, true)) {
    			preventDefault(e);
    		}

    		var data = {
    			originalEvent: e
    		};

    		if (e.type !== 'keypress' && e.type !== 'keydown' && e.type !== 'keyup') {
    			var isMarker = target.getLatLng && (!target._radius || target._radius <= 10);
    			data.containerPoint = isMarker ?
    				this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
    			data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
    			data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
    		}

    		for (var i = 0; i < targets.length; i++) {
    			targets[i].fire(type, data, true);
    			if (data.originalEvent._stopped ||
    				(targets[i].options.bubblingMouseEvents === false && indexOf(this._mouseEvents, type) !== -1)) { return; }
    		}
    	},

    	_draggableMoved: function (obj) {
    		obj = obj.dragging && obj.dragging.enabled() ? obj : this;
    		return (obj.dragging && obj.dragging.moved()) || (this.boxZoom && this.boxZoom.moved());
    	},

    	_clearHandlers: function () {
    		for (var i = 0, len = this._handlers.length; i < len; i++) {
    			this._handlers[i].disable();
    		}
    	},

    	// @section Other Methods

    	// @method whenReady(fn: Function, context?: Object): this
    	// Runs the given function `fn` when the map gets initialized with
    	// a view (center and zoom) and at least one layer, or immediately
    	// if it's already initialized, optionally passing a function context.
    	whenReady: function (callback, context) {
    		if (this._loaded) {
    			callback.call(context || this, {target: this});
    		} else {
    			this.on('load', callback, context);
    		}
    		return this;
    	},


    	// private methods for getting map state

    	_getMapPanePos: function () {
    		return getPosition(this._mapPane) || new Point(0, 0);
    	},

    	_moved: function () {
    		var pos = this._getMapPanePos();
    		return pos && !pos.equals([0, 0]);
    	},

    	_getTopLeftPoint: function (center, zoom) {
    		var pixelOrigin = center && zoom !== undefined ?
    			this._getNewPixelOrigin(center, zoom) :
    			this.getPixelOrigin();
    		return pixelOrigin.subtract(this._getMapPanePos());
    	},

    	_getNewPixelOrigin: function (center, zoom) {
    		var viewHalf = this.getSize()._divideBy(2);
    		return this.project(center, zoom)._subtract(viewHalf)._add(this._getMapPanePos())._round();
    	},

    	_latLngToNewLayerPoint: function (latlng, zoom, center) {
    		var topLeft = this._getNewPixelOrigin(center, zoom);
    		return this.project(latlng, zoom)._subtract(topLeft);
    	},

    	_latLngBoundsToNewLayerBounds: function (latLngBounds, zoom, center) {
    		var topLeft = this._getNewPixelOrigin(center, zoom);
    		return toBounds([
    			this.project(latLngBounds.getSouthWest(), zoom)._subtract(topLeft),
    			this.project(latLngBounds.getNorthWest(), zoom)._subtract(topLeft),
    			this.project(latLngBounds.getSouthEast(), zoom)._subtract(topLeft),
    			this.project(latLngBounds.getNorthEast(), zoom)._subtract(topLeft)
    		]);
    	},

    	// layer point of the current center
    	_getCenterLayerPoint: function () {
    		return this.containerPointToLayerPoint(this.getSize()._divideBy(2));
    	},

    	// offset of the specified place to the current center in pixels
    	_getCenterOffset: function (latlng) {
    		return this.latLngToLayerPoint(latlng).subtract(this._getCenterLayerPoint());
    	},

    	// adjust center for view to get inside bounds
    	_limitCenter: function (center, zoom, bounds) {

    		if (!bounds) { return center; }

    		var centerPoint = this.project(center, zoom),
    		    viewHalf = this.getSize().divideBy(2),
    		    viewBounds = new Bounds(centerPoint.subtract(viewHalf), centerPoint.add(viewHalf)),
    		    offset = this._getBoundsOffset(viewBounds, bounds, zoom);

    		// If offset is less than a pixel, ignore.
    		// This prevents unstable projections from getting into
    		// an infinite loop of tiny offsets.
    		if (offset.round().equals([0, 0])) {
    			return center;
    		}

    		return this.unproject(centerPoint.add(offset), zoom);
    	},

    	// adjust offset for view to get inside bounds
    	_limitOffset: function (offset, bounds) {
    		if (!bounds) { return offset; }

    		var viewBounds = this.getPixelBounds(),
    		    newBounds = new Bounds(viewBounds.min.add(offset), viewBounds.max.add(offset));

    		return offset.add(this._getBoundsOffset(newBounds, bounds));
    	},

    	// returns offset needed for pxBounds to get inside maxBounds at a specified zoom
    	_getBoundsOffset: function (pxBounds, maxBounds, zoom) {
    		var projectedMaxBounds = toBounds(
    		        this.project(maxBounds.getNorthEast(), zoom),
    		        this.project(maxBounds.getSouthWest(), zoom)
    		    ),
    		    minOffset = projectedMaxBounds.min.subtract(pxBounds.min),
    		    maxOffset = projectedMaxBounds.max.subtract(pxBounds.max),

    		    dx = this._rebound(minOffset.x, -maxOffset.x),
    		    dy = this._rebound(minOffset.y, -maxOffset.y);

    		return new Point(dx, dy);
    	},

    	_rebound: function (left, right) {
    		return left + right > 0 ?
    			Math.round(left - right) / 2 :
    			Math.max(0, Math.ceil(left)) - Math.max(0, Math.floor(right));
    	},

    	_limitZoom: function (zoom) {
    		var min = this.getMinZoom(),
    		    max = this.getMaxZoom(),
    		    snap = any3d ? this.options.zoomSnap : 1;
    		if (snap) {
    			zoom = Math.round(zoom / snap) * snap;
    		}
    		return Math.max(min, Math.min(max, zoom));
    	},

    	_onPanTransitionStep: function () {
    		this.fire('move');
    	},

    	_onPanTransitionEnd: function () {
    		removeClass(this._mapPane, 'leaflet-pan-anim');
    		this.fire('moveend');
    	},

    	_tryAnimatedPan: function (center, options) {
    		// difference between the new and current centers in pixels
    		var offset = this._getCenterOffset(center)._trunc();

    		// don't animate too far unless animate: true specified in options
    		if ((options && options.animate) !== true && !this.getSize().contains(offset)) { return false; }

    		this.panBy(offset, options);

    		return true;
    	},

    	_createAnimProxy: function () {

    		var proxy = this._proxy = create$1('div', 'leaflet-proxy leaflet-zoom-animated');
    		this._panes.mapPane.appendChild(proxy);

    		this.on('zoomanim', function (e) {
    			var prop = TRANSFORM,
    			    transform = this._proxy.style[prop];

    			setTransform(this._proxy, this.project(e.center, e.zoom), this.getZoomScale(e.zoom, 1));

    			// workaround for case when transform is the same and so transitionend event is not fired
    			if (transform === this._proxy.style[prop] && this._animatingZoom) {
    				this._onZoomTransitionEnd();
    			}
    		}, this);

    		this.on('load moveend', this._animMoveEnd, this);

    		this._on('unload', this._destroyAnimProxy, this);
    	},

    	_destroyAnimProxy: function () {
    		remove(this._proxy);
    		this.off('load moveend', this._animMoveEnd, this);
    		delete this._proxy;
    	},

    	_animMoveEnd: function () {
    		var c = this.getCenter(),
    		    z = this.getZoom();
    		setTransform(this._proxy, this.project(c, z), this.getZoomScale(z, 1));
    	},

    	_catchTransitionEnd: function (e) {
    		if (this._animatingZoom && e.propertyName.indexOf('transform') >= 0) {
    			this._onZoomTransitionEnd();
    		}
    	},

    	_nothingToAnimate: function () {
    		return !this._container.getElementsByClassName('leaflet-zoom-animated').length;
    	},

    	_tryAnimatedZoom: function (center, zoom, options) {

    		if (this._animatingZoom) { return true; }

    		options = options || {};

    		// don't animate if disabled, not supported or zoom difference is too large
    		if (!this._zoomAnimated || options.animate === false || this._nothingToAnimate() ||
    		        Math.abs(zoom - this._zoom) > this.options.zoomAnimationThreshold) { return false; }

    		// offset is the pixel coords of the zoom origin relative to the current center
    		var scale = this.getZoomScale(zoom),
    		    offset = this._getCenterOffset(center)._divideBy(1 - 1 / scale);

    		// don't animate if the zoom origin isn't within one screen from the current center, unless forced
    		if (options.animate !== true && !this.getSize().contains(offset)) { return false; }

    		requestAnimFrame(function () {
    			this
    			    ._moveStart(true, false)
    			    ._animateZoom(center, zoom, true);
    		}, this);

    		return true;
    	},

    	_animateZoom: function (center, zoom, startAnim, noUpdate) {
    		if (!this._mapPane) { return; }

    		if (startAnim) {
    			this._animatingZoom = true;

    			// remember what center/zoom to set after animation
    			this._animateToCenter = center;
    			this._animateToZoom = zoom;

    			addClass(this._mapPane, 'leaflet-zoom-anim');
    		}

    		// @section Other Events
    		// @event zoomanim: ZoomAnimEvent
    		// Fired at least once per zoom animation. For continuous zoom, like pinch zooming, fired once per frame during zoom.
    		this.fire('zoomanim', {
    			center: center,
    			zoom: zoom,
    			noUpdate: noUpdate
    		});

    		// Work around webkit not firing 'transitionend', see https://github.com/Leaflet/Leaflet/issues/3689, 2693
    		setTimeout(bind$1(this._onZoomTransitionEnd, this), 250);
    	},

    	_onZoomTransitionEnd: function () {
    		if (!this._animatingZoom) { return; }

    		if (this._mapPane) {
    			removeClass(this._mapPane, 'leaflet-zoom-anim');
    		}

    		this._animatingZoom = false;

    		this._move(this._animateToCenter, this._animateToZoom);

    		// This anim frame should prevent an obscure iOS webkit tile loading race condition.
    		requestAnimFrame(function () {
    			this._moveEnd(true);
    		}, this);
    	}
    });

    // @section

    // @factory L.map(id: String, options?: Map options)
    // Instantiates a map object given the DOM ID of a `<div>` element
    // and optionally an object literal with `Map options`.
    //
    // @alternative
    // @factory L.map(el: HTMLElement, options?: Map options)
    // Instantiates a map object given an instance of a `<div>` HTML element
    // and optionally an object literal with `Map options`.
    function createMap(id, options) {
    	return new Map$1(id, options);
    }

    /*
    	L.Handler is a base class for handler classes that are used internally to inject
    	interaction features like dragging to classes like Map and Marker.
    */

    // @class Handler
    // @aka L.Handler
    // Abstract class for map interaction handlers

    var Handler = Class.extend({
    	initialize: function (map) {
    		this._map = map;
    	},

    	// @method enable(): this
    	// Enables the handler
    	enable: function () {
    		if (this._enabled) { return this; }

    		this._enabled = true;
    		this.addHooks();
    		return this;
    	},

    	// @method disable(): this
    	// Disables the handler
    	disable: function () {
    		if (!this._enabled) { return this; }

    		this._enabled = false;
    		this.removeHooks();
    		return this;
    	},

    	// @method enabled(): Boolean
    	// Returns `true` if the handler is enabled
    	enabled: function () {
    		return !!this._enabled;
    	}

    	// @section Extension methods
    	// Classes inheriting from `Handler` must implement the two following methods:
    	// @method addHooks()
    	// Called when the handler is enabled, should add event hooks.
    	// @method removeHooks()
    	// Called when the handler is disabled, should remove the event hooks added previously.
    });

    // @section There is static function which can be called without instantiating L.Handler:
    // @function addTo(map: Map, name: String): this
    // Adds a new Handler to the given map with the given name.
    Handler.addTo = function (map, name) {
    	map.addHandler(name, this);
    	return this;
    };

    /*
     * L.Handler.BoxZoom is used to add shift-drag zoom interaction to the map
     * (zoom to a selected bounding box), enabled by default.
     */

    // @namespace Map
    // @section Interaction Options
    Map$1.mergeOptions({
    	// @option boxZoom: Boolean = true
    	// Whether the map can be zoomed to a rectangular area specified by
    	// dragging the mouse while pressing the shift key.
    	boxZoom: true
    });

    var BoxZoom = Handler.extend({
    	initialize: function (map) {
    		this._map = map;
    		this._container = map._container;
    		this._pane = map._panes.overlayPane;
    		this._resetStateTimeout = 0;
    		map.on('unload', this._destroy, this);
    	},

    	addHooks: function () {
    		on(this._container, 'mousedown', this._onMouseDown, this);
    	},

    	removeHooks: function () {
    		off(this._container, 'mousedown', this._onMouseDown, this);
    	},

    	moved: function () {
    		return this._moved;
    	},

    	_destroy: function () {
    		remove(this._pane);
    		delete this._pane;
    	},

    	_resetState: function () {
    		this._resetStateTimeout = 0;
    		this._moved = false;
    	},

    	_clearDeferredResetState: function () {
    		if (this._resetStateTimeout !== 0) {
    			clearTimeout(this._resetStateTimeout);
    			this._resetStateTimeout = 0;
    		}
    	},

    	_onMouseDown: function (e) {
    		if (!e.shiftKey || ((e.which !== 1) && (e.button !== 1))) { return false; }

    		// Clear the deferred resetState if it hasn't executed yet, otherwise it
    		// will interrupt the interaction and orphan a box element in the container.
    		this._clearDeferredResetState();
    		this._resetState();

    		disableTextSelection();
    		disableImageDrag();

    		this._startPoint = this._map.mouseEventToContainerPoint(e);

    		on(document, {
    			contextmenu: stop,
    			mousemove: this._onMouseMove,
    			mouseup: this._onMouseUp,
    			keydown: this._onKeyDown
    		}, this);
    	},

    	_onMouseMove: function (e) {
    		if (!this._moved) {
    			this._moved = true;

    			this._box = create$1('div', 'leaflet-zoom-box', this._container);
    			addClass(this._container, 'leaflet-crosshair');

    			this._map.fire('boxzoomstart');
    		}

    		this._point = this._map.mouseEventToContainerPoint(e);

    		var bounds = new Bounds(this._point, this._startPoint),
    		    size = bounds.getSize();

    		setPosition(this._box, bounds.min);

    		this._box.style.width  = size.x + 'px';
    		this._box.style.height = size.y + 'px';
    	},

    	_finish: function () {
    		if (this._moved) {
    			remove(this._box);
    			removeClass(this._container, 'leaflet-crosshair');
    		}

    		enableTextSelection();
    		enableImageDrag();

    		off(document, {
    			contextmenu: stop,
    			mousemove: this._onMouseMove,
    			mouseup: this._onMouseUp,
    			keydown: this._onKeyDown
    		}, this);
    	},

    	_onMouseUp: function (e) {
    		if ((e.which !== 1) && (e.button !== 1)) { return; }

    		this._finish();

    		if (!this._moved) { return; }
    		// Postpone to next JS tick so internal click event handling
    		// still see it as "moved".
    		this._clearDeferredResetState();
    		this._resetStateTimeout = setTimeout(bind$1(this._resetState, this), 0);

    		var bounds = new LatLngBounds(
    		        this._map.containerPointToLatLng(this._startPoint),
    		        this._map.containerPointToLatLng(this._point));

    		this._map
    			.fitBounds(bounds)
    			.fire('boxzoomend', {boxZoomBounds: bounds});
    	},

    	_onKeyDown: function (e) {
    		if (e.keyCode === 27) {
    			this._finish();
    		}
    	}
    });

    // @section Handlers
    // @property boxZoom: Handler
    // Box (shift-drag with mouse) zoom handler.
    Map$1.addInitHook('addHandler', 'boxZoom', BoxZoom);

    /*
     * L.Handler.DoubleClickZoom is used to handle double-click zoom on the map, enabled by default.
     */

    // @namespace Map
    // @section Interaction Options

    Map$1.mergeOptions({
    	// @option doubleClickZoom: Boolean|String = true
    	// Whether the map can be zoomed in by double clicking on it and
    	// zoomed out by double clicking while holding shift. If passed
    	// `'center'`, double-click zoom will zoom to the center of the
    	//  view regardless of where the mouse was.
    	doubleClickZoom: true
    });

    var DoubleClickZoom = Handler.extend({
    	addHooks: function () {
    		this._map.on('dblclick', this._onDoubleClick, this);
    	},

    	removeHooks: function () {
    		this._map.off('dblclick', this._onDoubleClick, this);
    	},

    	_onDoubleClick: function (e) {
    		var map = this._map,
    		    oldZoom = map.getZoom(),
    		    delta = map.options.zoomDelta,
    		    zoom = e.originalEvent.shiftKey ? oldZoom - delta : oldZoom + delta;

    		if (map.options.doubleClickZoom === 'center') {
    			map.setZoom(zoom);
    		} else {
    			map.setZoomAround(e.containerPoint, zoom);
    		}
    	}
    });

    // @section Handlers
    //
    // Map properties include interaction handlers that allow you to control
    // interaction behavior in runtime, enabling or disabling certain features such
    // as dragging or touch zoom (see `Handler` methods). For example:
    //
    // ```js
    // map.doubleClickZoom.disable();
    // ```
    //
    // @property doubleClickZoom: Handler
    // Double click zoom handler.
    Map$1.addInitHook('addHandler', 'doubleClickZoom', DoubleClickZoom);

    /*
     * @class Draggable
     * @aka L.Draggable
     * @inherits Evented
     *
     * A class for making DOM elements draggable (including touch support).
     * Used internally for map and marker dragging. Only works for elements
     * that were positioned with [`L.DomUtil.setPosition`](#domutil-setposition).
     *
     * @example
     * ```js
     * var draggable = new L.Draggable(elementToDrag);
     * draggable.enable();
     * ```
     */

    var START = touch ? 'touchstart mousedown' : 'mousedown';
    var END = {
    	mousedown: 'mouseup',
    	touchstart: 'touchend',
    	pointerdown: 'touchend',
    	MSPointerDown: 'touchend'
    };
    var MOVE = {
    	mousedown: 'mousemove',
    	touchstart: 'touchmove',
    	pointerdown: 'touchmove',
    	MSPointerDown: 'touchmove'
    };


    var Draggable = Evented.extend({

    	options: {
    		// @section
    		// @aka Draggable options
    		// @option clickTolerance: Number = 3
    		// The max number of pixels a user can shift the mouse pointer during a click
    		// for it to be considered a valid click (as opposed to a mouse drag).
    		clickTolerance: 3
    	},

    	// @constructor L.Draggable(el: HTMLElement, dragHandle?: HTMLElement, preventOutline?: Boolean, options?: Draggable options)
    	// Creates a `Draggable` object for moving `el` when you start dragging the `dragHandle` element (equals `el` itself by default).
    	initialize: function (element, dragStartTarget, preventOutline, options) {
    		setOptions(this, options);

    		this._element = element;
    		this._dragStartTarget = dragStartTarget || element;
    		this._preventOutline = preventOutline;
    	},

    	// @method enable()
    	// Enables the dragging ability
    	enable: function () {
    		if (this._enabled) { return; }

    		on(this._dragStartTarget, START, this._onDown, this);

    		this._enabled = true;
    	},

    	// @method disable()
    	// Disables the dragging ability
    	disable: function () {
    		if (!this._enabled) { return; }

    		// If we're currently dragging this draggable,
    		// disabling it counts as first ending the drag.
    		if (Draggable._dragging === this) {
    			this.finishDrag();
    		}

    		off(this._dragStartTarget, START, this._onDown, this);

    		this._enabled = false;
    		this._moved = false;
    	},

    	_onDown: function (e) {
    		// Ignore simulated events, since we handle both touch and
    		// mouse explicitly; otherwise we risk getting duplicates of
    		// touch events, see #4315.
    		// Also ignore the event if disabled; this happens in IE11
    		// under some circumstances, see #3666.
    		if (e._simulated || !this._enabled) { return; }

    		this._moved = false;

    		if (hasClass(this._element, 'leaflet-zoom-anim')) { return; }

    		if (Draggable._dragging || e.shiftKey || ((e.which !== 1) && (e.button !== 1) && !e.touches)) { return; }
    		Draggable._dragging = this;  // Prevent dragging multiple objects at once.

    		if (this._preventOutline) {
    			preventOutline(this._element);
    		}

    		disableImageDrag();
    		disableTextSelection();

    		if (this._moving) { return; }

    		// @event down: Event
    		// Fired when a drag is about to start.
    		this.fire('down');

    		var first = e.touches ? e.touches[0] : e,
    		    sizedParent = getSizedParentNode(this._element);

    		this._startPoint = new Point(first.clientX, first.clientY);

    		// Cache the scale, so that we can continuously compensate for it during drag (_onMove).
    		this._parentScale = getScale(sizedParent);

    		on(document, MOVE[e.type], this._onMove, this);
    		on(document, END[e.type], this._onUp, this);
    	},

    	_onMove: function (e) {
    		// Ignore simulated events, since we handle both touch and
    		// mouse explicitly; otherwise we risk getting duplicates of
    		// touch events, see #4315.
    		// Also ignore the event if disabled; this happens in IE11
    		// under some circumstances, see #3666.
    		if (e._simulated || !this._enabled) { return; }

    		if (e.touches && e.touches.length > 1) {
    			this._moved = true;
    			return;
    		}

    		var first = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
    		    offset = new Point(first.clientX, first.clientY)._subtract(this._startPoint);

    		if (!offset.x && !offset.y) { return; }
    		if (Math.abs(offset.x) + Math.abs(offset.y) < this.options.clickTolerance) { return; }

    		// We assume that the parent container's position, border and scale do not change for the duration of the drag.
    		// Therefore there is no need to account for the position and border (they are eliminated by the subtraction)
    		// and we can use the cached value for the scale.
    		offset.x /= this._parentScale.x;
    		offset.y /= this._parentScale.y;

    		preventDefault(e);

    		if (!this._moved) {
    			// @event dragstart: Event
    			// Fired when a drag starts
    			this.fire('dragstart');

    			this._moved = true;
    			this._startPos = getPosition(this._element).subtract(offset);

    			addClass(document.body, 'leaflet-dragging');

    			this._lastTarget = e.target || e.srcElement;
    			// IE and Edge do not give the <use> element, so fetch it
    			// if necessary
    			if (window.SVGElementInstance && this._lastTarget instanceof window.SVGElementInstance) {
    				this._lastTarget = this._lastTarget.correspondingUseElement;
    			}
    			addClass(this._lastTarget, 'leaflet-drag-target');
    		}

    		this._newPos = this._startPos.add(offset);
    		this._moving = true;

    		cancelAnimFrame(this._animRequest);
    		this._lastEvent = e;
    		this._animRequest = requestAnimFrame(this._updatePosition, this, true);
    	},

    	_updatePosition: function () {
    		var e = {originalEvent: this._lastEvent};

    		// @event predrag: Event
    		// Fired continuously during dragging *before* each corresponding
    		// update of the element's position.
    		this.fire('predrag', e);
    		setPosition(this._element, this._newPos);

    		// @event drag: Event
    		// Fired continuously during dragging.
    		this.fire('drag', e);
    	},

    	_onUp: function (e) {
    		// Ignore simulated events, since we handle both touch and
    		// mouse explicitly; otherwise we risk getting duplicates of
    		// touch events, see #4315.
    		// Also ignore the event if disabled; this happens in IE11
    		// under some circumstances, see #3666.
    		if (e._simulated || !this._enabled) { return; }
    		this.finishDrag();
    	},

    	finishDrag: function () {
    		removeClass(document.body, 'leaflet-dragging');

    		if (this._lastTarget) {
    			removeClass(this._lastTarget, 'leaflet-drag-target');
    			this._lastTarget = null;
    		}

    		for (var i in MOVE) {
    			off(document, MOVE[i], this._onMove, this);
    			off(document, END[i], this._onUp, this);
    		}

    		enableImageDrag();
    		enableTextSelection();

    		if (this._moved && this._moving) {
    			// ensure drag is not fired after dragend
    			cancelAnimFrame(this._animRequest);

    			// @event dragend: DragEndEvent
    			// Fired when the drag ends.
    			this.fire('dragend', {
    				distance: this._newPos.distanceTo(this._startPos)
    			});
    		}

    		this._moving = false;
    		Draggable._dragging = false;
    	}

    });

    /*
     * L.Handler.MapDrag is used to make the map draggable (with panning inertia), enabled by default.
     */

    // @namespace Map
    // @section Interaction Options
    Map$1.mergeOptions({
    	// @option dragging: Boolean = true
    	// Whether the map be draggable with mouse/touch or not.
    	dragging: true,

    	// @section Panning Inertia Options
    	// @option inertia: Boolean = *
    	// If enabled, panning of the map will have an inertia effect where
    	// the map builds momentum while dragging and continues moving in
    	// the same direction for some time. Feels especially nice on touch
    	// devices. Enabled by default unless running on old Android devices.
    	inertia: !android23,

    	// @option inertiaDeceleration: Number = 3000
    	// The rate with which the inertial movement slows down, in pixels/second².
    	inertiaDeceleration: 3400, // px/s^2

    	// @option inertiaMaxSpeed: Number = Infinity
    	// Max speed of the inertial movement, in pixels/second.
    	inertiaMaxSpeed: Infinity, // px/s

    	// @option easeLinearity: Number = 0.2
    	easeLinearity: 0.2,

    	// TODO refactor, move to CRS
    	// @option worldCopyJump: Boolean = false
    	// With this option enabled, the map tracks when you pan to another "copy"
    	// of the world and seamlessly jumps to the original one so that all overlays
    	// like markers and vector layers are still visible.
    	worldCopyJump: false,

    	// @option maxBoundsViscosity: Number = 0.0
    	// If `maxBounds` is set, this option will control how solid the bounds
    	// are when dragging the map around. The default value of `0.0` allows the
    	// user to drag outside the bounds at normal speed, higher values will
    	// slow down map dragging outside bounds, and `1.0` makes the bounds fully
    	// solid, preventing the user from dragging outside the bounds.
    	maxBoundsViscosity: 0.0
    });

    var Drag = Handler.extend({
    	addHooks: function () {
    		if (!this._draggable) {
    			var map = this._map;

    			this._draggable = new Draggable(map._mapPane, map._container);

    			this._draggable.on({
    				dragstart: this._onDragStart,
    				drag: this._onDrag,
    				dragend: this._onDragEnd
    			}, this);

    			this._draggable.on('predrag', this._onPreDragLimit, this);
    			if (map.options.worldCopyJump) {
    				this._draggable.on('predrag', this._onPreDragWrap, this);
    				map.on('zoomend', this._onZoomEnd, this);

    				map.whenReady(this._onZoomEnd, this);
    			}
    		}
    		addClass(this._map._container, 'leaflet-grab leaflet-touch-drag');
    		this._draggable.enable();
    		this._positions = [];
    		this._times = [];
    	},

    	removeHooks: function () {
    		removeClass(this._map._container, 'leaflet-grab');
    		removeClass(this._map._container, 'leaflet-touch-drag');
    		this._draggable.disable();
    	},

    	moved: function () {
    		return this._draggable && this._draggable._moved;
    	},

    	moving: function () {
    		return this._draggable && this._draggable._moving;
    	},

    	_onDragStart: function () {
    		var map = this._map;

    		map._stop();
    		if (this._map.options.maxBounds && this._map.options.maxBoundsViscosity) {
    			var bounds = toLatLngBounds(this._map.options.maxBounds);

    			this._offsetLimit = toBounds(
    				this._map.latLngToContainerPoint(bounds.getNorthWest()).multiplyBy(-1),
    				this._map.latLngToContainerPoint(bounds.getSouthEast()).multiplyBy(-1)
    					.add(this._map.getSize()));

    			this._viscosity = Math.min(1.0, Math.max(0.0, this._map.options.maxBoundsViscosity));
    		} else {
    			this._offsetLimit = null;
    		}

    		map
    		    .fire('movestart')
    		    .fire('dragstart');

    		if (map.options.inertia) {
    			this._positions = [];
    			this._times = [];
    		}
    	},

    	_onDrag: function (e) {
    		if (this._map.options.inertia) {
    			var time = this._lastTime = +new Date(),
    			    pos = this._lastPos = this._draggable._absPos || this._draggable._newPos;

    			this._positions.push(pos);
    			this._times.push(time);

    			this._prunePositions(time);
    		}

    		this._map
    		    .fire('move', e)
    		    .fire('drag', e);
    	},

    	_prunePositions: function (time) {
    		while (this._positions.length > 1 && time - this._times[0] > 50) {
    			this._positions.shift();
    			this._times.shift();
    		}
    	},

    	_onZoomEnd: function () {
    		var pxCenter = this._map.getSize().divideBy(2),
    		    pxWorldCenter = this._map.latLngToLayerPoint([0, 0]);

    		this._initialWorldOffset = pxWorldCenter.subtract(pxCenter).x;
    		this._worldWidth = this._map.getPixelWorldBounds().getSize().x;
    	},

    	_viscousLimit: function (value, threshold) {
    		return value - (value - threshold) * this._viscosity;
    	},

    	_onPreDragLimit: function () {
    		if (!this._viscosity || !this._offsetLimit) { return; }

    		var offset = this._draggable._newPos.subtract(this._draggable._startPos);

    		var limit = this._offsetLimit;
    		if (offset.x < limit.min.x) { offset.x = this._viscousLimit(offset.x, limit.min.x); }
    		if (offset.y < limit.min.y) { offset.y = this._viscousLimit(offset.y, limit.min.y); }
    		if (offset.x > limit.max.x) { offset.x = this._viscousLimit(offset.x, limit.max.x); }
    		if (offset.y > limit.max.y) { offset.y = this._viscousLimit(offset.y, limit.max.y); }

    		this._draggable._newPos = this._draggable._startPos.add(offset);
    	},

    	_onPreDragWrap: function () {
    		// TODO refactor to be able to adjust map pane position after zoom
    		var worldWidth = this._worldWidth,
    		    halfWidth = Math.round(worldWidth / 2),
    		    dx = this._initialWorldOffset,
    		    x = this._draggable._newPos.x,
    		    newX1 = (x - halfWidth + dx) % worldWidth + halfWidth - dx,
    		    newX2 = (x + halfWidth + dx) % worldWidth - halfWidth - dx,
    		    newX = Math.abs(newX1 + dx) < Math.abs(newX2 + dx) ? newX1 : newX2;

    		this._draggable._absPos = this._draggable._newPos.clone();
    		this._draggable._newPos.x = newX;
    	},

    	_onDragEnd: function (e) {
    		var map = this._map,
    		    options = map.options,

    		    noInertia = !options.inertia || this._times.length < 2;

    		map.fire('dragend', e);

    		if (noInertia) {
    			map.fire('moveend');

    		} else {
    			this._prunePositions(+new Date());

    			var direction = this._lastPos.subtract(this._positions[0]),
    			    duration = (this._lastTime - this._times[0]) / 1000,
    			    ease = options.easeLinearity,

    			    speedVector = direction.multiplyBy(ease / duration),
    			    speed = speedVector.distanceTo([0, 0]),

    			    limitedSpeed = Math.min(options.inertiaMaxSpeed, speed),
    			    limitedSpeedVector = speedVector.multiplyBy(limitedSpeed / speed),

    			    decelerationDuration = limitedSpeed / (options.inertiaDeceleration * ease),
    			    offset = limitedSpeedVector.multiplyBy(-decelerationDuration / 2).round();

    			if (!offset.x && !offset.y) {
    				map.fire('moveend');

    			} else {
    				offset = map._limitOffset(offset, map.options.maxBounds);

    				requestAnimFrame(function () {
    					map.panBy(offset, {
    						duration: decelerationDuration,
    						easeLinearity: ease,
    						noMoveStart: true,
    						animate: true
    					});
    				});
    			}
    		}
    	}
    });

    // @section Handlers
    // @property dragging: Handler
    // Map dragging handler (by both mouse and touch).
    Map$1.addInitHook('addHandler', 'dragging', Drag);

    /*
     * L.Map.Keyboard is handling keyboard interaction with the map, enabled by default.
     */

    // @namespace Map
    // @section Keyboard Navigation Options
    Map$1.mergeOptions({
    	// @option keyboard: Boolean = true
    	// Makes the map focusable and allows users to navigate the map with keyboard
    	// arrows and `+`/`-` keys.
    	keyboard: true,

    	// @option keyboardPanDelta: Number = 80
    	// Amount of pixels to pan when pressing an arrow key.
    	keyboardPanDelta: 80
    });

    var Keyboard = Handler.extend({

    	keyCodes: {
    		left:    [37],
    		right:   [39],
    		down:    [40],
    		up:      [38],
    		zoomIn:  [187, 107, 61, 171],
    		zoomOut: [189, 109, 54, 173]
    	},

    	initialize: function (map) {
    		this._map = map;

    		this._setPanDelta(map.options.keyboardPanDelta);
    		this._setZoomDelta(map.options.zoomDelta);
    	},

    	addHooks: function () {
    		var container = this._map._container;

    		// make the container focusable by tabbing
    		if (container.tabIndex <= 0) {
    			container.tabIndex = '0';
    		}

    		on(container, {
    			focus: this._onFocus,
    			blur: this._onBlur,
    			mousedown: this._onMouseDown
    		}, this);

    		this._map.on({
    			focus: this._addHooks,
    			blur: this._removeHooks
    		}, this);
    	},

    	removeHooks: function () {
    		this._removeHooks();

    		off(this._map._container, {
    			focus: this._onFocus,
    			blur: this._onBlur,
    			mousedown: this._onMouseDown
    		}, this);

    		this._map.off({
    			focus: this._addHooks,
    			blur: this._removeHooks
    		}, this);
    	},

    	_onMouseDown: function () {
    		if (this._focused) { return; }

    		var body = document.body,
    		    docEl = document.documentElement,
    		    top = body.scrollTop || docEl.scrollTop,
    		    left = body.scrollLeft || docEl.scrollLeft;

    		this._map._container.focus();

    		window.scrollTo(left, top);
    	},

    	_onFocus: function () {
    		this._focused = true;
    		this._map.fire('focus');
    	},

    	_onBlur: function () {
    		this._focused = false;
    		this._map.fire('blur');
    	},

    	_setPanDelta: function (panDelta) {
    		var keys = this._panKeys = {},
    		    codes = this.keyCodes,
    		    i, len;

    		for (i = 0, len = codes.left.length; i < len; i++) {
    			keys[codes.left[i]] = [-1 * panDelta, 0];
    		}
    		for (i = 0, len = codes.right.length; i < len; i++) {
    			keys[codes.right[i]] = [panDelta, 0];
    		}
    		for (i = 0, len = codes.down.length; i < len; i++) {
    			keys[codes.down[i]] = [0, panDelta];
    		}
    		for (i = 0, len = codes.up.length; i < len; i++) {
    			keys[codes.up[i]] = [0, -1 * panDelta];
    		}
    	},

    	_setZoomDelta: function (zoomDelta) {
    		var keys = this._zoomKeys = {},
    		    codes = this.keyCodes,
    		    i, len;

    		for (i = 0, len = codes.zoomIn.length; i < len; i++) {
    			keys[codes.zoomIn[i]] = zoomDelta;
    		}
    		for (i = 0, len = codes.zoomOut.length; i < len; i++) {
    			keys[codes.zoomOut[i]] = -zoomDelta;
    		}
    	},

    	_addHooks: function () {
    		on(document, 'keydown', this._onKeyDown, this);
    	},

    	_removeHooks: function () {
    		off(document, 'keydown', this._onKeyDown, this);
    	},

    	_onKeyDown: function (e) {
    		if (e.altKey || e.ctrlKey || e.metaKey) { return; }

    		var key = e.keyCode,
    		    map = this._map,
    		    offset;

    		if (key in this._panKeys) {
    			if (!map._panAnim || !map._panAnim._inProgress) {
    				offset = this._panKeys[key];
    				if (e.shiftKey) {
    					offset = toPoint(offset).multiplyBy(3);
    				}

    				map.panBy(offset);

    				if (map.options.maxBounds) {
    					map.panInsideBounds(map.options.maxBounds);
    				}
    			}
    		} else if (key in this._zoomKeys) {
    			map.setZoom(map.getZoom() + (e.shiftKey ? 3 : 1) * this._zoomKeys[key]);

    		} else if (key === 27 && map._popup && map._popup.options.closeOnEscapeKey) {
    			map.closePopup();

    		} else {
    			return;
    		}

    		stop(e);
    	}
    });

    // @section Handlers
    // @section Handlers
    // @property keyboard: Handler
    // Keyboard navigation handler.
    Map$1.addInitHook('addHandler', 'keyboard', Keyboard);

    /*
     * L.Handler.ScrollWheelZoom is used by L.Map to enable mouse scroll wheel zoom on the map.
     */

    // @namespace Map
    // @section Interaction Options
    Map$1.mergeOptions({
    	// @section Mouse wheel options
    	// @option scrollWheelZoom: Boolean|String = true
    	// Whether the map can be zoomed by using the mouse wheel. If passed `'center'`,
    	// it will zoom to the center of the view regardless of where the mouse was.
    	scrollWheelZoom: true,

    	// @option wheelDebounceTime: Number = 40
    	// Limits the rate at which a wheel can fire (in milliseconds). By default
    	// user can't zoom via wheel more often than once per 40 ms.
    	wheelDebounceTime: 40,

    	// @option wheelPxPerZoomLevel: Number = 60
    	// How many scroll pixels (as reported by [L.DomEvent.getWheelDelta](#domevent-getwheeldelta))
    	// mean a change of one full zoom level. Smaller values will make wheel-zooming
    	// faster (and vice versa).
    	wheelPxPerZoomLevel: 60
    });

    var ScrollWheelZoom = Handler.extend({
    	addHooks: function () {
    		on(this._map._container, 'wheel', this._onWheelScroll, this);

    		this._delta = 0;
    	},

    	removeHooks: function () {
    		off(this._map._container, 'wheel', this._onWheelScroll, this);
    	},

    	_onWheelScroll: function (e) {
    		var delta = getWheelDelta(e);

    		var debounce = this._map.options.wheelDebounceTime;

    		this._delta += delta;
    		this._lastMousePos = this._map.mouseEventToContainerPoint(e);

    		if (!this._startTime) {
    			this._startTime = +new Date();
    		}

    		var left = Math.max(debounce - (+new Date() - this._startTime), 0);

    		clearTimeout(this._timer);
    		this._timer = setTimeout(bind$1(this._performZoom, this), left);

    		stop(e);
    	},

    	_performZoom: function () {
    		var map = this._map,
    		    zoom = map.getZoom(),
    		    snap = this._map.options.zoomSnap || 0;

    		map._stop(); // stop panning and fly animations if any

    		// map the delta with a sigmoid function to -4..4 range leaning on -1..1
    		var d2 = this._delta / (this._map.options.wheelPxPerZoomLevel * 4),
    		    d3 = 4 * Math.log(2 / (1 + Math.exp(-Math.abs(d2)))) / Math.LN2,
    		    d4 = snap ? Math.ceil(d3 / snap) * snap : d3,
    		    delta = map._limitZoom(zoom + (this._delta > 0 ? d4 : -d4)) - zoom;

    		this._delta = 0;
    		this._startTime = null;

    		if (!delta) { return; }

    		if (map.options.scrollWheelZoom === 'center') {
    			map.setZoom(zoom + delta);
    		} else {
    			map.setZoomAround(this._lastMousePos, zoom + delta);
    		}
    	}
    });

    // @section Handlers
    // @property scrollWheelZoom: Handler
    // Scroll wheel zoom handler.
    Map$1.addInitHook('addHandler', 'scrollWheelZoom', ScrollWheelZoom);

    /*
     * L.Map.Tap is used to enable mobile hacks like quick taps and long hold.
     */

    // @namespace Map
    // @section Interaction Options
    Map$1.mergeOptions({
    	// @section Touch interaction options
    	// @option tap: Boolean = true
    	// Enables mobile hacks for supporting instant taps (fixing 200ms click
    	// delay on iOS/Android) and touch holds (fired as `contextmenu` events).
    	tap: true,

    	// @option tapTolerance: Number = 15
    	// The max number of pixels a user can shift his finger during touch
    	// for it to be considered a valid tap.
    	tapTolerance: 15
    });

    var Tap = Handler.extend({
    	addHooks: function () {
    		on(this._map._container, 'touchstart', this._onDown, this);
    	},

    	removeHooks: function () {
    		off(this._map._container, 'touchstart', this._onDown, this);
    	},

    	_onDown: function (e) {
    		if (!e.touches) { return; }

    		preventDefault(e);

    		this._fireClick = true;

    		// don't simulate click or track longpress if more than 1 touch
    		if (e.touches.length > 1) {
    			this._fireClick = false;
    			clearTimeout(this._holdTimeout);
    			return;
    		}

    		var first = e.touches[0],
    		    el = first.target;

    		this._startPos = this._newPos = new Point(first.clientX, first.clientY);

    		// if touching a link, highlight it
    		if (el.tagName && el.tagName.toLowerCase() === 'a') {
    			addClass(el, 'leaflet-active');
    		}

    		// simulate long hold but setting a timeout
    		this._holdTimeout = setTimeout(bind$1(function () {
    			if (this._isTapValid()) {
    				this._fireClick = false;
    				this._onUp();
    				this._simulateEvent('contextmenu', first);
    			}
    		}, this), 1000);

    		this._simulateEvent('mousedown', first);

    		on(document, {
    			touchmove: this._onMove,
    			touchend: this._onUp
    		}, this);
    	},

    	_onUp: function (e) {
    		clearTimeout(this._holdTimeout);

    		off(document, {
    			touchmove: this._onMove,
    			touchend: this._onUp
    		}, this);

    		if (this._fireClick && e && e.changedTouches) {

    			var first = e.changedTouches[0],
    			    el = first.target;

    			if (el && el.tagName && el.tagName.toLowerCase() === 'a') {
    				removeClass(el, 'leaflet-active');
    			}

    			this._simulateEvent('mouseup', first);

    			// simulate click if the touch didn't move too much
    			if (this._isTapValid()) {
    				this._simulateEvent('click', first);
    			}
    		}
    	},

    	_isTapValid: function () {
    		return this._newPos.distanceTo(this._startPos) <= this._map.options.tapTolerance;
    	},

    	_onMove: function (e) {
    		var first = e.touches[0];
    		this._newPos = new Point(first.clientX, first.clientY);
    		this._simulateEvent('mousemove', first);
    	},

    	_simulateEvent: function (type, e) {
    		var simulatedEvent = document.createEvent('MouseEvents');

    		simulatedEvent._simulated = true;
    		e.target._simulatedClick = true;

    		simulatedEvent.initMouseEvent(
    		        type, true, true, window, 1,
    		        e.screenX, e.screenY,
    		        e.clientX, e.clientY,
    		        false, false, false, false, 0, null);

    		e.target.dispatchEvent(simulatedEvent);
    	}
    });

    // @section Handlers
    // @property tap: Handler
    // Mobile touch hacks (quick tap and touch hold) handler.
    if (touch && (!pointer || safari)) {
    	Map$1.addInitHook('addHandler', 'tap', Tap);
    }

    /*
     * L.Handler.TouchZoom is used by L.Map to add pinch zoom on supported mobile browsers.
     */

    // @namespace Map
    // @section Interaction Options
    Map$1.mergeOptions({
    	// @section Touch interaction options
    	// @option touchZoom: Boolean|String = *
    	// Whether the map can be zoomed by touch-dragging with two fingers. If
    	// passed `'center'`, it will zoom to the center of the view regardless of
    	// where the touch events (fingers) were. Enabled for touch-capable web
    	// browsers except for old Androids.
    	touchZoom: touch && !android23,

    	// @option bounceAtZoomLimits: Boolean = true
    	// Set it to false if you don't want the map to zoom beyond min/max zoom
    	// and then bounce back when pinch-zooming.
    	bounceAtZoomLimits: true
    });

    var TouchZoom = Handler.extend({
    	addHooks: function () {
    		addClass(this._map._container, 'leaflet-touch-zoom');
    		on(this._map._container, 'touchstart', this._onTouchStart, this);
    	},

    	removeHooks: function () {
    		removeClass(this._map._container, 'leaflet-touch-zoom');
    		off(this._map._container, 'touchstart', this._onTouchStart, this);
    	},

    	_onTouchStart: function (e) {
    		var map = this._map;
    		if (!e.touches || e.touches.length !== 2 || map._animatingZoom || this._zooming) { return; }

    		var p1 = map.mouseEventToContainerPoint(e.touches[0]),
    		    p2 = map.mouseEventToContainerPoint(e.touches[1]);

    		this._centerPoint = map.getSize()._divideBy(2);
    		this._startLatLng = map.containerPointToLatLng(this._centerPoint);
    		if (map.options.touchZoom !== 'center') {
    			this._pinchStartLatLng = map.containerPointToLatLng(p1.add(p2)._divideBy(2));
    		}

    		this._startDist = p1.distanceTo(p2);
    		this._startZoom = map.getZoom();

    		this._moved = false;
    		this._zooming = true;

    		map._stop();

    		on(document, 'touchmove', this._onTouchMove, this);
    		on(document, 'touchend', this._onTouchEnd, this);

    		preventDefault(e);
    	},

    	_onTouchMove: function (e) {
    		if (!e.touches || e.touches.length !== 2 || !this._zooming) { return; }

    		var map = this._map,
    		    p1 = map.mouseEventToContainerPoint(e.touches[0]),
    		    p2 = map.mouseEventToContainerPoint(e.touches[1]),
    		    scale = p1.distanceTo(p2) / this._startDist;

    		this._zoom = map.getScaleZoom(scale, this._startZoom);

    		if (!map.options.bounceAtZoomLimits && (
    			(this._zoom < map.getMinZoom() && scale < 1) ||
    			(this._zoom > map.getMaxZoom() && scale > 1))) {
    			this._zoom = map._limitZoom(this._zoom);
    		}

    		if (map.options.touchZoom === 'center') {
    			this._center = this._startLatLng;
    			if (scale === 1) { return; }
    		} else {
    			// Get delta from pinch to center, so centerLatLng is delta applied to initial pinchLatLng
    			var delta = p1._add(p2)._divideBy(2)._subtract(this._centerPoint);
    			if (scale === 1 && delta.x === 0 && delta.y === 0) { return; }
    			this._center = map.unproject(map.project(this._pinchStartLatLng, this._zoom).subtract(delta), this._zoom);
    		}

    		if (!this._moved) {
    			map._moveStart(true, false);
    			this._moved = true;
    		}

    		cancelAnimFrame(this._animRequest);

    		var moveFn = bind$1(map._move, map, this._center, this._zoom, {pinch: true, round: false});
    		this._animRequest = requestAnimFrame(moveFn, this, true);

    		preventDefault(e);
    	},

    	_onTouchEnd: function () {
    		if (!this._moved || !this._zooming) {
    			this._zooming = false;
    			return;
    		}

    		this._zooming = false;
    		cancelAnimFrame(this._animRequest);

    		off(document, 'touchmove', this._onTouchMove, this);
    		off(document, 'touchend', this._onTouchEnd, this);

    		// Pinch updates GridLayers' levels only when zoomSnap is off, so zoomSnap becomes noUpdate.
    		if (this._map.options.zoomAnimation) {
    			this._map._animateZoom(this._center, this._map._limitZoom(this._zoom), true, this._map.options.zoomSnap);
    		} else {
    			this._map._resetView(this._center, this._map._limitZoom(this._zoom));
    		}
    	}
    });

    // @section Handlers
    // @property touchZoom: Handler
    // Touch zoom handler.
    Map$1.addInitHook('addHandler', 'touchZoom', TouchZoom);

    /*
     * @class Control
     * @aka L.Control
     * @inherits Class
     *
     * L.Control is a base class for implementing map controls. Handles positioning.
     * All other controls extend from this class.
     */

    var Control = Class.extend({
    	// @section
    	// @aka Control options
    	options: {
    		// @option position: String = 'topright'
    		// The position of the control (one of the map corners). Possible values are `'topleft'`,
    		// `'topright'`, `'bottomleft'` or `'bottomright'`
    		position: 'topright'
    	},

    	initialize: function (options) {
    		setOptions(this, options);
    	},

    	/* @section
    	 * Classes extending L.Control will inherit the following methods:
    	 *
    	 * @method getPosition: string
    	 * Returns the position of the control.
    	 */
    	getPosition: function () {
    		return this.options.position;
    	},

    	// @method setPosition(position: string): this
    	// Sets the position of the control.
    	setPosition: function (position) {
    		var map = this._map;

    		if (map) {
    			map.removeControl(this);
    		}

    		this.options.position = position;

    		if (map) {
    			map.addControl(this);
    		}

    		return this;
    	},

    	// @method getContainer: HTMLElement
    	// Returns the HTMLElement that contains the control.
    	getContainer: function () {
    		return this._container;
    	},

    	// @method addTo(map: Map): this
    	// Adds the control to the given map.
    	addTo: function (map) {
    		this.remove();
    		this._map = map;

    		var container = this._container = this.onAdd(map),
    		    pos = this.getPosition(),
    		    corner = map._controlCorners[pos];

    		addClass(container, 'leaflet-control');

    		if (pos.indexOf('bottom') !== -1) {
    			corner.insertBefore(container, corner.firstChild);
    		} else {
    			corner.appendChild(container);
    		}

    		this._map.on('unload', this.remove, this);

    		return this;
    	},

    	// @method remove: this
    	// Removes the control from the map it is currently active on.
    	remove: function () {
    		if (!this._map) {
    			return this;
    		}

    		remove(this._container);

    		if (this.onRemove) {
    			this.onRemove(this._map);
    		}

    		this._map.off('unload', this.remove, this);
    		this._map = null;

    		return this;
    	},

    	_refocusOnMap: function (e) {
    		// if map exists and event is not a keyboard event
    		if (this._map && e && e.screenX > 0 && e.screenY > 0) {
    			this._map.getContainer().focus();
    		}
    	}
    });

    /* @section Extension methods
     * @uninheritable
     *
     * Every control should extend from `L.Control` and (re-)implement the following methods.
     *
     * @method onAdd(map: Map): HTMLElement
     * Should return the container DOM element for the control and add listeners on relevant map events. Called on [`control.addTo(map)`](#control-addTo).
     *
     * @method onRemove(map: Map)
     * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
     */

    /* @namespace Map
     * @section Methods for Layers and Controls
     */
    Map$1.include({
    	// @method addControl(control: Control): this
    	// Adds the given control to the map
    	addControl: function (control) {
    		control.addTo(this);
    		return this;
    	},

    	// @method removeControl(control: Control): this
    	// Removes the given control from the map
    	removeControl: function (control) {
    		control.remove();
    		return this;
    	},

    	_initControlPos: function () {
    		var corners = this._controlCorners = {},
    		    l = 'leaflet-',
    		    container = this._controlContainer =
    		            create$1('div', l + 'control-container', this._container);

    		function createCorner(vSide, hSide) {
    			var className = l + vSide + ' ' + l + hSide;

    			corners[vSide + hSide] = create$1('div', className, container);
    		}

    		createCorner('top', 'left');
    		createCorner('top', 'right');
    		createCorner('bottom', 'left');
    		createCorner('bottom', 'right');
    	},

    	_clearControlPos: function () {
    		for (var i in this._controlCorners) {
    			remove(this._controlCorners[i]);
    		}
    		remove(this._controlContainer);
    		delete this._controlCorners;
    		delete this._controlContainer;
    	}
    });

    /*
     * @class Control.Zoom
     * @aka L.Control.Zoom
     * @inherits Control
     *
     * A basic zoom control with two buttons (zoom in and zoom out). It is put on the map by default unless you set its [`zoomControl` option](#map-zoomcontrol) to `false`. Extends `Control`.
     */

    var Zoom = Control.extend({
    	// @section
    	// @aka Control.Zoom options
    	options: {
    		position: 'topleft',

    		// @option zoomInText: String = '+'
    		// The text set on the 'zoom in' button.
    		zoomInText: '+',

    		// @option zoomInTitle: String = 'Zoom in'
    		// The title set on the 'zoom in' button.
    		zoomInTitle: 'Zoom in',

    		// @option zoomOutText: String = '&#x2212;'
    		// The text set on the 'zoom out' button.
    		zoomOutText: '&#x2212;',

    		// @option zoomOutTitle: String = 'Zoom out'
    		// The title set on the 'zoom out' button.
    		zoomOutTitle: 'Zoom out'
    	},

    	onAdd: function (map) {
    		var zoomName = 'leaflet-control-zoom',
    		    container = create$1('div', zoomName + ' leaflet-bar'),
    		    options = this.options;

    		this._zoomInButton  = this._createButton(options.zoomInText, options.zoomInTitle,
    		        zoomName + '-in',  container, this._zoomIn);
    		this._zoomOutButton = this._createButton(options.zoomOutText, options.zoomOutTitle,
    		        zoomName + '-out', container, this._zoomOut);

    		this._updateDisabled();
    		map.on('zoomend zoomlevelschange', this._updateDisabled, this);

    		return container;
    	},

    	onRemove: function (map) {
    		map.off('zoomend zoomlevelschange', this._updateDisabled, this);
    	},

    	disable: function () {
    		this._disabled = true;
    		this._updateDisabled();
    		return this;
    	},

    	enable: function () {
    		this._disabled = false;
    		this._updateDisabled();
    		return this;
    	},

    	_zoomIn: function (e) {
    		if (!this._disabled && this._map._zoom < this._map.getMaxZoom()) {
    			this._map.zoomIn(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
    		}
    	},

    	_zoomOut: function (e) {
    		if (!this._disabled && this._map._zoom > this._map.getMinZoom()) {
    			this._map.zoomOut(this._map.options.zoomDelta * (e.shiftKey ? 3 : 1));
    		}
    	},

    	_createButton: function (html, title, className, container, fn) {
    		var link = create$1('a', className, container);
    		link.innerHTML = html;
    		link.href = '#';
    		link.title = title;

    		/*
    		 * Will force screen readers like VoiceOver to read this as "Zoom in - button"
    		 */
    		link.setAttribute('role', 'button');
    		link.setAttribute('aria-label', title);

    		disableClickPropagation(link);
    		on(link, 'click', stop);
    		on(link, 'click', fn, this);
    		on(link, 'click', this._refocusOnMap, this);

    		return link;
    	},

    	_updateDisabled: function () {
    		var map = this._map,
    		    className = 'leaflet-disabled';

    		removeClass(this._zoomInButton, className);
    		removeClass(this._zoomOutButton, className);

    		if (this._disabled || map._zoom === map.getMinZoom()) {
    			addClass(this._zoomOutButton, className);
    		}
    		if (this._disabled || map._zoom === map.getMaxZoom()) {
    			addClass(this._zoomInButton, className);
    		}
    	}
    });

    // @namespace Map
    // @section Control options
    // @option zoomControl: Boolean = true
    // Whether a [zoom control](#control-zoom) is added to the map by default.
    Map$1.mergeOptions({
    	zoomControl: true
    });

    Map$1.addInitHook(function () {
    	if (this.options.zoomControl) {
    		// @section Controls
    		// @property zoomControl: Control.Zoom
    		// The default zoom control (only available if the
    		// [`zoomControl` option](#map-zoomcontrol) was `true` when creating the map).
    		this.zoomControl = new Zoom();
    		this.addControl(this.zoomControl);
    	}
    });

    /*
     * @class Control.Attribution
     * @aka L.Control.Attribution
     * @inherits Control
     *
     * The attribution control allows you to display attribution data in a small text box on a map. It is put on the map by default unless you set its [`attributionControl` option](#map-attributioncontrol) to `false`, and it fetches attribution texts from layers with the [`getAttribution` method](#layer-getattribution) automatically. Extends Control.
     */

    var Attribution = Control.extend({
    	// @section
    	// @aka Control.Attribution options
    	options: {
    		position: 'bottomright',

    		// @option prefix: String = 'Leaflet'
    		// The HTML text shown before the attributions. Pass `false` to disable.
    		prefix: '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
    	},

    	initialize: function (options) {
    		setOptions(this, options);

    		this._attributions = {};
    	},

    	onAdd: function (map) {
    		map.attributionControl = this;
    		this._container = create$1('div', 'leaflet-control-attribution');
    		disableClickPropagation(this._container);

    		// TODO ugly, refactor
    		for (var i in map._layers) {
    			if (map._layers[i].getAttribution) {
    				this.addAttribution(map._layers[i].getAttribution());
    			}
    		}

    		this._update();

    		return this._container;
    	},

    	// @method setPrefix(prefix: String): this
    	// Sets the text before the attributions.
    	setPrefix: function (prefix) {
    		this.options.prefix = prefix;
    		this._update();
    		return this;
    	},

    	// @method addAttribution(text: String): this
    	// Adds an attribution text (e.g. `'Vector data &copy; Mapbox'`).
    	addAttribution: function (text) {
    		if (!text) { return this; }

    		if (!this._attributions[text]) {
    			this._attributions[text] = 0;
    		}
    		this._attributions[text]++;

    		this._update();

    		return this;
    	},

    	// @method removeAttribution(text: String): this
    	// Removes an attribution text.
    	removeAttribution: function (text) {
    		if (!text) { return this; }

    		if (this._attributions[text]) {
    			this._attributions[text]--;
    			this._update();
    		}

    		return this;
    	},

    	_update: function () {
    		if (!this._map) { return; }

    		var attribs = [];

    		for (var i in this._attributions) {
    			if (this._attributions[i]) {
    				attribs.push(i);
    			}
    		}

    		var prefixAndAttribs = [];

    		if (this.options.prefix) {
    			prefixAndAttribs.push(this.options.prefix);
    		}
    		if (attribs.length) {
    			prefixAndAttribs.push(attribs.join(', '));
    		}

    		this._container.innerHTML = prefixAndAttribs.join(' | ');
    	}
    });

    // @namespace Map
    // @section Control options
    // @option attributionControl: Boolean = true
    // Whether a [attribution control](#control-attribution) is added to the map by default.
    Map$1.mergeOptions({
    	attributionControl: true
    });

    Map$1.addInitHook(function () {
    	if (this.options.attributionControl) {
    		new Attribution().addTo(this);
    	}
    });

    /* node_modules/svelte-leaflet/src/map.svelte generated by Svelte v3.30.0 */

    const { document: document_1 } = globals;

    const file = "node_modules/svelte-leaflet/src/map.svelte";

    function create_fragment(ctx) {
    	let link;
    	let t;
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[8].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[7], null);

    	const block = {
    		c: function create() {
    			link = element("link");
    			t = space();
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(link, "rel", "stylesheet");
    			attr_dev(link, "href", "https://unpkg.com/leaflet@1.6.0/dist/leaflet.css");
    			attr_dev(link, "integrity", "sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ==");
    			attr_dev(link, "crossorigin", "");
    			add_location(link, file, 103, 1, 3367);
    			attr_dev(div, "class", "map svelte-ywdufx");
    			attr_dev(div, "style", /*style*/ ctx[0]);
    			add_location(div, file, 111, 0, 3748);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			append_dev(document_1.head, link);
    			insert_dev(target, t, anchor);
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[9](div);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "resize", /*onResize*/ ctx[2], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 128) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[7], dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*style*/ 1) {
    				attr_dev(div, "style", /*style*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			detach_dev(link);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[9](null);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Map", slots, ['default']);
    	Map$1.BoxZoom = BoxZoom;
    	Map$1.DoubleClickZoom = DoubleClickZoom;
    	Map$1.Drag = Drag;
    	Map$1.Keyboard = Keyboard;
    	Map$1.ScrollWheelZoom = ScrollWheelZoom;
    	Map$1.Tap = Tap;
    	Map$1.TouchZoom = TouchZoom;
    	let { style = "" } = $$props;
    	let mapContainer;
    	let { center = [0, 0] } = $$props;
    	let { zoom = 1 } = $$props;
    	let { options = { center, zoom } } = $$props;
    	let internalContainer = create$1("div");
    	internalContainer.style.minWidth = "32px";
    	internalContainer.style.minHeight = "32px";
    	let { map = createMap(internalContainer, options) } = $$props;
    	setContext("leafletMapInstance", map);

    	onMount(() => {
    		pollCssLoaded();
    	});

    	onDestroy(() => map.remove());

    	// 	let onResize = map.invalidateSize;
    	function onResize() {
    		// 		console.log(ev);
    		map.invalidateSize();
    	}

    	map.on("move", () => $$invalidate(3, center = map.getCenter()));
    	map.on("zoom", () => $$invalidate(4, zoom = map.getZoom()));

    	// Since the CSS is loaded async'ly in <svelte:head> with no clear way of
    	// knowing when it has been loaded, poll for the styles before invalidating
    	// the map's size to re-position all layers.
    	// Failing to do this would result in popups being horizontally misplaced, as the
    	// contentWidth of the popup/tooltip contents would be calculated prior to the
    	// popup styles being loaded, which means potentially way wider than it should.
    	let pollRetries = 50;

    	function pollCssLoaded() {
    		var el = create$1("div", "leaflet-default-icon-path", document.body);
    		var path = getStyle(el, "background-image") || getStyle(el, "backgroundImage"); // IE8
    		document.body.removeChild(el);

    		if (pollRetries < 0 || path && path != "none") {
    			var c = map.getContainer();
    			mapContainer.appendChild(c);
    			c.style.width = "100%";
    			c.style.height = "100%";
    			map.invalidateSize();
    		} else {
    			pollRetries--;
    			setTimeout(pollCssLoaded, 30);
    		}
    	}

    	const writable_props = ["style", "center", "zoom", "options", "map"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Map> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			mapContainer = $$value;
    			$$invalidate(1, mapContainer);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("center" in $$props) $$invalidate(3, center = $$props.center);
    		if ("zoom" in $$props) $$invalidate(4, zoom = $$props.zoom);
    		if ("options" in $$props) $$invalidate(5, options = $$props.options);
    		if ("map" in $$props) $$invalidate(6, map = $$props.map);
    		if ("$$scope" in $$props) $$invalidate(7, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		create: create$1,
    		getStyle,
    		Map: Map$1,
    		createMap,
    		BoxZoom,
    		DoubleClickZoom,
    		Drag,
    		Keyboard,
    		ScrollWheelZoom,
    		Tap,
    		TouchZoom,
    		ZoomControl: Zoom,
    		AttributionControl: Attribution,
    		setContext,
    		onMount,
    		onDestroy,
    		style,
    		mapContainer,
    		center,
    		zoom,
    		options,
    		internalContainer,
    		map,
    		onResize,
    		pollRetries,
    		pollCssLoaded
    	});

    	$$self.$inject_state = $$props => {
    		if ("style" in $$props) $$invalidate(0, style = $$props.style);
    		if ("mapContainer" in $$props) $$invalidate(1, mapContainer = $$props.mapContainer);
    		if ("center" in $$props) $$invalidate(3, center = $$props.center);
    		if ("zoom" in $$props) $$invalidate(4, zoom = $$props.zoom);
    		if ("options" in $$props) $$invalidate(5, options = $$props.options);
    		if ("internalContainer" in $$props) internalContainer = $$props.internalContainer;
    		if ("map" in $$props) $$invalidate(6, map = $$props.map);
    		if ("pollRetries" in $$props) pollRetries = $$props.pollRetries;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*map, center*/ 72) {
    			 map.panTo(center);
    		}

    		if ($$self.$$.dirty & /*map, zoom*/ 80) {
    			 map.setZoom(zoom);
    		}
    	};

    	return [
    		style,
    		mapContainer,
    		onResize,
    		center,
    		zoom,
    		options,
    		map,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Map_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			style: 0,
    			center: 3,
    			zoom: 4,
    			options: 5,
    			map: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Map_1",
    			options,
    			id: create_fragment.name
    		});
    	}

    	get style() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get center() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set center(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get zoom() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set zoom(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get map() {
    		throw new Error("<Map>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set map(value) {
    		throw new Error("<Map>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*
     * @class Icon
     * @aka L.Icon
     *
     * Represents an icon to provide when creating a marker.
     *
     * @example
     *
     * ```js
     * var myIcon = L.icon({
     *     iconUrl: 'my-icon.png',
     *     iconRetinaUrl: 'my-icon@2x.png',
     *     iconSize: [38, 95],
     *     iconAnchor: [22, 94],
     *     popupAnchor: [-3, -76],
     *     shadowUrl: 'my-icon-shadow.png',
     *     shadowRetinaUrl: 'my-icon-shadow@2x.png',
     *     shadowSize: [68, 95],
     *     shadowAnchor: [22, 94]
     * });
     *
     * L.marker([50.505, 30.57], {icon: myIcon}).addTo(map);
     * ```
     *
     * `L.Icon.Default` extends `L.Icon` and is the blue icon Leaflet uses for markers by default.
     *
     */

    var Icon = Class.extend({

    	/* @section
    	 * @aka Icon options
    	 *
    	 * @option iconUrl: String = null
    	 * **(required)** The URL to the icon image (absolute or relative to your script path).
    	 *
    	 * @option iconRetinaUrl: String = null
    	 * The URL to a retina sized version of the icon image (absolute or relative to your
    	 * script path). Used for Retina screen devices.
    	 *
    	 * @option iconSize: Point = null
    	 * Size of the icon image in pixels.
    	 *
    	 * @option iconAnchor: Point = null
    	 * The coordinates of the "tip" of the icon (relative to its top left corner). The icon
    	 * will be aligned so that this point is at the marker's geographical location. Centered
    	 * by default if size is specified, also can be set in CSS with negative margins.
    	 *
    	 * @option popupAnchor: Point = [0, 0]
    	 * The coordinates of the point from which popups will "open", relative to the icon anchor.
    	 *
    	 * @option tooltipAnchor: Point = [0, 0]
    	 * The coordinates of the point from which tooltips will "open", relative to the icon anchor.
    	 *
    	 * @option shadowUrl: String = null
    	 * The URL to the icon shadow image. If not specified, no shadow image will be created.
    	 *
    	 * @option shadowRetinaUrl: String = null
    	 *
    	 * @option shadowSize: Point = null
    	 * Size of the shadow image in pixels.
    	 *
    	 * @option shadowAnchor: Point = null
    	 * The coordinates of the "tip" of the shadow (relative to its top left corner) (the same
    	 * as iconAnchor if not specified).
    	 *
    	 * @option className: String = ''
    	 * A custom class name to assign to both icon and shadow images. Empty by default.
    	 */

    	options: {
    		popupAnchor: [0, 0],
    		tooltipAnchor: [0, 0]
    	},

    	initialize: function (options) {
    		setOptions(this, options);
    	},

    	// @method createIcon(oldIcon?: HTMLElement): HTMLElement
    	// Called internally when the icon has to be shown, returns a `<img>` HTML element
    	// styled according to the options.
    	createIcon: function (oldIcon) {
    		return this._createIcon('icon', oldIcon);
    	},

    	// @method createShadow(oldIcon?: HTMLElement): HTMLElement
    	// As `createIcon`, but for the shadow beneath it.
    	createShadow: function (oldIcon) {
    		return this._createIcon('shadow', oldIcon);
    	},

    	_createIcon: function (name, oldIcon) {
    		var src = this._getIconUrl(name);

    		if (!src) {
    			if (name === 'icon') {
    				throw new Error('iconUrl not set in Icon options (see the docs).');
    			}
    			return null;
    		}

    		var img = this._createImg(src, oldIcon && oldIcon.tagName === 'IMG' ? oldIcon : null);
    		this._setIconStyles(img, name);

    		return img;
    	},

    	_setIconStyles: function (img, name) {
    		var options = this.options;
    		var sizeOption = options[name + 'Size'];

    		if (typeof sizeOption === 'number') {
    			sizeOption = [sizeOption, sizeOption];
    		}

    		var size = toPoint(sizeOption),
    		    anchor = toPoint(name === 'shadow' && options.shadowAnchor || options.iconAnchor ||
    		            size && size.divideBy(2, true));

    		img.className = 'leaflet-marker-' + name + ' ' + (options.className || '');

    		if (anchor) {
    			img.style.marginLeft = (-anchor.x) + 'px';
    			img.style.marginTop  = (-anchor.y) + 'px';
    		}

    		if (size) {
    			img.style.width  = size.x + 'px';
    			img.style.height = size.y + 'px';
    		}
    	},

    	_createImg: function (src, el) {
    		el = el || document.createElement('img');
    		el.src = src;
    		return el;
    	},

    	_getIconUrl: function (name) {
    		return retina && this.options[name + 'RetinaUrl'] || this.options[name + 'Url'];
    	}
    });

    /*
     * @miniclass Icon.Default (Icon)
     * @aka L.Icon.Default
     * @section
     *
     * A trivial subclass of `Icon`, represents the icon to use in `Marker`s when
     * no icon is specified. Points to the blue marker image distributed with Leaflet
     * releases.
     *
     * In order to customize the default icon, just change the properties of `L.Icon.Default.prototype.options`
     * (which is a set of `Icon options`).
     *
     * If you want to _completely_ replace the default icon, override the
     * `L.Marker.prototype.options.icon` with your own icon instead.
     */

    var IconDefault = Icon.extend({

    	options: {
    		iconUrl:       'marker-icon.png',
    		iconRetinaUrl: 'marker-icon-2x.png',
    		shadowUrl:     'marker-shadow.png',
    		iconSize:    [25, 41],
    		iconAnchor:  [12, 41],
    		popupAnchor: [1, -34],
    		tooltipAnchor: [16, -28],
    		shadowSize:  [41, 41]
    	},

    	_getIconUrl: function (name) {
    		if (!IconDefault.imagePath) {	// Deprecated, backwards-compatibility only
    			IconDefault.imagePath = this._detectIconPath();
    		}

    		// @option imagePath: String
    		// `Icon.Default` will try to auto-detect the location of the
    		// blue icon images. If you are placing these images in a non-standard
    		// way, set this option to point to the right path.
    		return (this.options.imagePath || IconDefault.imagePath) + Icon.prototype._getIconUrl.call(this, name);
    	},

    	_detectIconPath: function () {
    		var el = create$1('div',  'leaflet-default-icon-path', document.body);
    		var path = getStyle(el, 'background-image') ||
    		           getStyle(el, 'backgroundImage');	// IE8

    		document.body.removeChild(el);

    		if (path === null || path.indexOf('url') !== 0) {
    			path = '';
    		} else {
    			path = path.replace(/^url\(["']?/, '').replace(/marker-icon\.png["']?\)$/, '');
    		}

    		return path;
    	}
    });

    /*
     * @class Layer
     * @inherits Evented
     * @aka L.Layer
     * @aka ILayer
     *
     * A set of methods from the Layer base class that all Leaflet layers use.
     * Inherits all methods, options and events from `L.Evented`.
     *
     * @example
     *
     * ```js
     * var layer = L.marker(latlng).addTo(map);
     * layer.addTo(map);
     * layer.remove();
     * ```
     *
     * @event add: Event
     * Fired after the layer is added to a map
     *
     * @event remove: Event
     * Fired after the layer is removed from a map
     */


    var Layer = Evented.extend({

    	// Classes extending `L.Layer` will inherit the following options:
    	options: {
    		// @option pane: String = 'overlayPane'
    		// By default the layer will be added to the map's [overlay pane](#map-overlaypane). Overriding this option will cause the layer to be placed on another pane by default.
    		pane: 'overlayPane',

    		// @option attribution: String = null
    		// String to be shown in the attribution control, e.g. "© OpenStreetMap contributors". It describes the layer data and is often a legal obligation towards copyright holders and tile providers.
    		attribution: null,

    		bubblingMouseEvents: true
    	},

    	/* @section
    	 * Classes extending `L.Layer` will inherit the following methods:
    	 *
    	 * @method addTo(map: Map|LayerGroup): this
    	 * Adds the layer to the given map or layer group.
    	 */
    	addTo: function (map) {
    		map.addLayer(this);
    		return this;
    	},

    	// @method remove: this
    	// Removes the layer from the map it is currently active on.
    	remove: function () {
    		return this.removeFrom(this._map || this._mapToAdd);
    	},

    	// @method removeFrom(map: Map): this
    	// Removes the layer from the given map
    	//
    	// @alternative
    	// @method removeFrom(group: LayerGroup): this
    	// Removes the layer from the given `LayerGroup`
    	removeFrom: function (obj) {
    		if (obj) {
    			obj.removeLayer(this);
    		}
    		return this;
    	},

    	// @method getPane(name? : String): HTMLElement
    	// Returns the `HTMLElement` representing the named pane on the map. If `name` is omitted, returns the pane for this layer.
    	getPane: function (name) {
    		return this._map.getPane(name ? (this.options[name] || name) : this.options.pane);
    	},

    	addInteractiveTarget: function (targetEl) {
    		this._map._targets[stamp(targetEl)] = this;
    		return this;
    	},

    	removeInteractiveTarget: function (targetEl) {
    		delete this._map._targets[stamp(targetEl)];
    		return this;
    	},

    	// @method getAttribution: String
    	// Used by the `attribution control`, returns the [attribution option](#gridlayer-attribution).
    	getAttribution: function () {
    		return this.options.attribution;
    	},

    	_layerAdd: function (e) {
    		var map = e.target;

    		// check in case layer gets added and then removed before the map is ready
    		if (!map.hasLayer(this)) { return; }

    		this._map = map;
    		this._zoomAnimated = map._zoomAnimated;

    		if (this.getEvents) {
    			var events = this.getEvents();
    			map.on(events, this);
    			this.once('remove', function () {
    				map.off(events, this);
    			}, this);
    		}

    		this.onAdd(map);

    		if (this.getAttribution && map.attributionControl) {
    			map.attributionControl.addAttribution(this.getAttribution());
    		}

    		this.fire('add');
    		map.fire('layeradd', {layer: this});
    	}
    });

    /* @section Extension methods
     * @uninheritable
     *
     * Every layer should extend from `L.Layer` and (re-)implement the following methods.
     *
     * @method onAdd(map: Map): this
     * Should contain code that creates DOM elements for the layer, adds them to `map panes` where they should belong and puts listeners on relevant map events. Called on [`map.addLayer(layer)`](#map-addlayer).
     *
     * @method onRemove(map: Map): this
     * Should contain all clean up code that removes the layer's elements from the DOM and removes listeners previously added in [`onAdd`](#layer-onadd). Called on [`map.removeLayer(layer)`](#map-removelayer).
     *
     * @method getEvents(): Object
     * This optional method should return an object like `{ viewreset: this._reset }` for [`addEventListener`](#evented-addeventlistener). The event handlers in this object will be automatically added and removed from the map with your layer.
     *
     * @method getAttribution(): String
     * This optional method should return a string containing HTML to be shown on the `Attribution control` whenever the layer is visible.
     *
     * @method beforeAdd(map: Map): this
     * Optional method. Called on [`map.addLayer(layer)`](#map-addlayer), before the layer is added to the map, before events are initialized, without waiting until the map is in a usable state. Use for early initialization only.
     */


    /* @namespace Map
     * @section Layer events
     *
     * @event layeradd: LayerEvent
     * Fired when a new layer is added to the map.
     *
     * @event layerremove: LayerEvent
     * Fired when some layer is removed from the map
     *
     * @section Methods for Layers and Controls
     */
    Map$1.include({
    	// @method addLayer(layer: Layer): this
    	// Adds the given layer to the map
    	addLayer: function (layer) {
    		if (!layer._layerAdd) {
    			throw new Error('The provided object is not a Layer.');
    		}

    		var id = stamp(layer);
    		if (this._layers[id]) { return this; }
    		this._layers[id] = layer;

    		layer._mapToAdd = this;

    		if (layer.beforeAdd) {
    			layer.beforeAdd(this);
    		}

    		this.whenReady(layer._layerAdd, layer);

    		return this;
    	},

    	// @method removeLayer(layer: Layer): this
    	// Removes the given layer from the map.
    	removeLayer: function (layer) {
    		var id = stamp(layer);

    		if (!this._layers[id]) { return this; }

    		if (this._loaded) {
    			layer.onRemove(this);
    		}

    		if (layer.getAttribution && this.attributionControl) {
    			this.attributionControl.removeAttribution(layer.getAttribution());
    		}

    		delete this._layers[id];

    		if (this._loaded) {
    			this.fire('layerremove', {layer: layer});
    			layer.fire('remove');
    		}

    		layer._map = layer._mapToAdd = null;

    		return this;
    	},

    	// @method hasLayer(layer: Layer): Boolean
    	// Returns `true` if the given layer is currently added to the map
    	hasLayer: function (layer) {
    		return !!layer && (stamp(layer) in this._layers);
    	},

    	/* @method eachLayer(fn: Function, context?: Object): this
    	 * Iterates over the layers of the map, optionally specifying context of the iterator function.
    	 * ```
    	 * map.eachLayer(function(layer){
    	 *     layer.bindPopup('Hello');
    	 * });
    	 * ```
    	 */
    	eachLayer: function (method, context) {
    		for (var i in this._layers) {
    			method.call(context, this._layers[i]);
    		}
    		return this;
    	},

    	_addLayers: function (layers) {
    		layers = layers ? (isArray(layers) ? layers : [layers]) : [];

    		for (var i = 0, len = layers.length; i < len; i++) {
    			this.addLayer(layers[i]);
    		}
    	},

    	_addZoomLimit: function (layer) {
    		if (isNaN(layer.options.maxZoom) || !isNaN(layer.options.minZoom)) {
    			this._zoomBoundLayers[stamp(layer)] = layer;
    			this._updateZoomLevels();
    		}
    	},

    	_removeZoomLimit: function (layer) {
    		var id = stamp(layer);

    		if (this._zoomBoundLayers[id]) {
    			delete this._zoomBoundLayers[id];
    			this._updateZoomLevels();
    		}
    	},

    	_updateZoomLevels: function () {
    		var minZoom = Infinity,
    		    maxZoom = -Infinity,
    		    oldZoomSpan = this._getZoomSpan();

    		for (var i in this._zoomBoundLayers) {
    			var options = this._zoomBoundLayers[i].options;

    			minZoom = options.minZoom === undefined ? minZoom : Math.min(minZoom, options.minZoom);
    			maxZoom = options.maxZoom === undefined ? maxZoom : Math.max(maxZoom, options.maxZoom);
    		}

    		this._layersMaxZoom = maxZoom === -Infinity ? undefined : maxZoom;
    		this._layersMinZoom = minZoom === Infinity ? undefined : minZoom;

    		// @section Map state change events
    		// @event zoomlevelschange: Event
    		// Fired when the number of zoomlevels on the map is changed due
    		// to adding or removing a layer.
    		if (oldZoomSpan !== this._getZoomSpan()) {
    			this.fire('zoomlevelschange');
    		}

    		if (this.options.maxZoom === undefined && this._layersMaxZoom && this.getZoom() > this._layersMaxZoom) {
    			this.setZoom(this._layersMaxZoom);
    		}
    		if (this.options.minZoom === undefined && this._layersMinZoom && this.getZoom() < this._layersMinZoom) {
    			this.setZoom(this._layersMinZoom);
    		}
    	}
    });

    /*
     * L.Handler.MarkerDrag is used internally by L.Marker to make the markers draggable.
     */


    /* @namespace Marker
     * @section Interaction handlers
     *
     * Interaction handlers are properties of a marker instance that allow you to control interaction behavior in runtime, enabling or disabling certain features such as dragging (see `Handler` methods). Example:
     *
     * ```js
     * marker.dragging.disable();
     * ```
     *
     * @property dragging: Handler
     * Marker dragging handler (by both mouse and touch). Only valid when the marker is on the map (Otherwise set [`marker.options.draggable`](#marker-draggable)).
     */

    var MarkerDrag = Handler.extend({
    	initialize: function (marker) {
    		this._marker = marker;
    	},

    	addHooks: function () {
    		var icon = this._marker._icon;

    		if (!this._draggable) {
    			this._draggable = new Draggable(icon, icon, true);
    		}

    		this._draggable.on({
    			dragstart: this._onDragStart,
    			predrag: this._onPreDrag,
    			drag: this._onDrag,
    			dragend: this._onDragEnd
    		}, this).enable();

    		addClass(icon, 'leaflet-marker-draggable');
    	},

    	removeHooks: function () {
    		this._draggable.off({
    			dragstart: this._onDragStart,
    			predrag: this._onPreDrag,
    			drag: this._onDrag,
    			dragend: this._onDragEnd
    		}, this).disable();

    		if (this._marker._icon) {
    			removeClass(this._marker._icon, 'leaflet-marker-draggable');
    		}
    	},

    	moved: function () {
    		return this._draggable && this._draggable._moved;
    	},

    	_adjustPan: function (e) {
    		var marker = this._marker,
    		    map = marker._map,
    		    speed = this._marker.options.autoPanSpeed,
    		    padding = this._marker.options.autoPanPadding,
    		    iconPos = getPosition(marker._icon),
    		    bounds = map.getPixelBounds(),
    		    origin = map.getPixelOrigin();

    		var panBounds = toBounds(
    			bounds.min._subtract(origin).add(padding),
    			bounds.max._subtract(origin).subtract(padding)
    		);

    		if (!panBounds.contains(iconPos)) {
    			// Compute incremental movement
    			var movement = toPoint(
    				(Math.max(panBounds.max.x, iconPos.x) - panBounds.max.x) / (bounds.max.x - panBounds.max.x) -
    				(Math.min(panBounds.min.x, iconPos.x) - panBounds.min.x) / (bounds.min.x - panBounds.min.x),

    				(Math.max(panBounds.max.y, iconPos.y) - panBounds.max.y) / (bounds.max.y - panBounds.max.y) -
    				(Math.min(panBounds.min.y, iconPos.y) - panBounds.min.y) / (bounds.min.y - panBounds.min.y)
    			).multiplyBy(speed);

    			map.panBy(movement, {animate: false});

    			this._draggable._newPos._add(movement);
    			this._draggable._startPos._add(movement);

    			setPosition(marker._icon, this._draggable._newPos);
    			this._onDrag(e);

    			this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
    		}
    	},

    	_onDragStart: function () {
    		// @section Dragging events
    		// @event dragstart: Event
    		// Fired when the user starts dragging the marker.

    		// @event movestart: Event
    		// Fired when the marker starts moving (because of dragging).

    		this._oldLatLng = this._marker.getLatLng();

    		// When using ES6 imports it could not be set when `Popup` was not imported as well
    		this._marker.closePopup && this._marker.closePopup();

    		this._marker
    			.fire('movestart')
    			.fire('dragstart');
    	},

    	_onPreDrag: function (e) {
    		if (this._marker.options.autoPan) {
    			cancelAnimFrame(this._panRequest);
    			this._panRequest = requestAnimFrame(this._adjustPan.bind(this, e));
    		}
    	},

    	_onDrag: function (e) {
    		var marker = this._marker,
    		    shadow = marker._shadow,
    		    iconPos = getPosition(marker._icon),
    		    latlng = marker._map.layerPointToLatLng(iconPos);

    		// update shadow position
    		if (shadow) {
    			setPosition(shadow, iconPos);
    		}

    		marker._latlng = latlng;
    		e.latlng = latlng;
    		e.oldLatLng = this._oldLatLng;

    		// @event drag: Event
    		// Fired repeatedly while the user drags the marker.
    		marker
    		    .fire('move', e)
    		    .fire('drag', e);
    	},

    	_onDragEnd: function (e) {
    		// @event dragend: DragEndEvent
    		// Fired when the user stops dragging the marker.

    		 cancelAnimFrame(this._panRequest);

    		// @event moveend: Event
    		// Fired when the marker stops moving (because of dragging).
    		delete this._oldLatLng;
    		this._marker
    		    .fire('moveend')
    		    .fire('dragend', e);
    	}
    });

    /*
     * @class Marker
     * @inherits Interactive layer
     * @aka L.Marker
     * L.Marker is used to display clickable/draggable icons on the map. Extends `Layer`.
     *
     * @example
     *
     * ```js
     * L.marker([50.5, 30.5]).addTo(map);
     * ```
     */

    var Marker = Layer.extend({

    	// @section
    	// @aka Marker options
    	options: {
    		// @option icon: Icon = *
    		// Icon instance to use for rendering the marker.
    		// See [Icon documentation](#L.Icon) for details on how to customize the marker icon.
    		// If not specified, a common instance of `L.Icon.Default` is used.
    		icon: new IconDefault(),

    		// Option inherited from "Interactive layer" abstract class
    		interactive: true,

    		// @option keyboard: Boolean = true
    		// Whether the marker can be tabbed to with a keyboard and clicked by pressing enter.
    		keyboard: true,

    		// @option title: String = ''
    		// Text for the browser tooltip that appear on marker hover (no tooltip by default).
    		title: '',

    		// @option alt: String = ''
    		// Text for the `alt` attribute of the icon image (useful for accessibility).
    		alt: '',

    		// @option zIndexOffset: Number = 0
    		// By default, marker images zIndex is set automatically based on its latitude. Use this option if you want to put the marker on top of all others (or below), specifying a high value like `1000` (or high negative value, respectively).
    		zIndexOffset: 0,

    		// @option opacity: Number = 1.0
    		// The opacity of the marker.
    		opacity: 1,

    		// @option riseOnHover: Boolean = false
    		// If `true`, the marker will get on top of others when you hover the mouse over it.
    		riseOnHover: false,

    		// @option riseOffset: Number = 250
    		// The z-index offset used for the `riseOnHover` feature.
    		riseOffset: 250,

    		// @option pane: String = 'markerPane'
    		// `Map pane` where the markers icon will be added.
    		pane: 'markerPane',

    		// @option shadowPane: String = 'shadowPane'
    		// `Map pane` where the markers shadow will be added.
    		shadowPane: 'shadowPane',

    		// @option bubblingMouseEvents: Boolean = false
    		// When `true`, a mouse event on this marker will trigger the same event on the map
    		// (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
    		bubblingMouseEvents: false,

    		// @section Draggable marker options
    		// @option draggable: Boolean = false
    		// Whether the marker is draggable with mouse/touch or not.
    		draggable: false,

    		// @option autoPan: Boolean = false
    		// Whether to pan the map when dragging this marker near its edge or not.
    		autoPan: false,

    		// @option autoPanPadding: Point = Point(50, 50)
    		// Distance (in pixels to the left/right and to the top/bottom) of the
    		// map edge to start panning the map.
    		autoPanPadding: [50, 50],

    		// @option autoPanSpeed: Number = 10
    		// Number of pixels the map should pan by.
    		autoPanSpeed: 10
    	},

    	/* @section
    	 *
    	 * In addition to [shared layer methods](#Layer) like `addTo()` and `remove()` and [popup methods](#Popup) like bindPopup() you can also use the following methods:
    	 */

    	initialize: function (latlng, options) {
    		setOptions(this, options);
    		this._latlng = toLatLng(latlng);
    	},

    	onAdd: function (map) {
    		this._zoomAnimated = this._zoomAnimated && map.options.markerZoomAnimation;

    		if (this._zoomAnimated) {
    			map.on('zoomanim', this._animateZoom, this);
    		}

    		this._initIcon();
    		this.update();
    	},

    	onRemove: function (map) {
    		if (this.dragging && this.dragging.enabled()) {
    			this.options.draggable = true;
    			this.dragging.removeHooks();
    		}
    		delete this.dragging;

    		if (this._zoomAnimated) {
    			map.off('zoomanim', this._animateZoom, this);
    		}

    		this._removeIcon();
    		this._removeShadow();
    	},

    	getEvents: function () {
    		return {
    			zoom: this.update,
    			viewreset: this.update
    		};
    	},

    	// @method getLatLng: LatLng
    	// Returns the current geographical position of the marker.
    	getLatLng: function () {
    		return this._latlng;
    	},

    	// @method setLatLng(latlng: LatLng): this
    	// Changes the marker position to the given point.
    	setLatLng: function (latlng) {
    		var oldLatLng = this._latlng;
    		this._latlng = toLatLng(latlng);
    		this.update();

    		// @event move: Event
    		// Fired when the marker is moved via [`setLatLng`](#marker-setlatlng) or by [dragging](#marker-dragging). Old and new coordinates are included in event arguments as `oldLatLng`, `latlng`.
    		return this.fire('move', {oldLatLng: oldLatLng, latlng: this._latlng});
    	},

    	// @method setZIndexOffset(offset: Number): this
    	// Changes the [zIndex offset](#marker-zindexoffset) of the marker.
    	setZIndexOffset: function (offset) {
    		this.options.zIndexOffset = offset;
    		return this.update();
    	},

    	// @method getIcon: Icon
    	// Returns the current icon used by the marker
    	getIcon: function () {
    		return this.options.icon;
    	},

    	// @method setIcon(icon: Icon): this
    	// Changes the marker icon.
    	setIcon: function (icon) {

    		this.options.icon = icon;

    		if (this._map) {
    			this._initIcon();
    			this.update();
    		}

    		if (this._popup) {
    			this.bindPopup(this._popup, this._popup.options);
    		}

    		return this;
    	},

    	getElement: function () {
    		return this._icon;
    	},

    	update: function () {

    		if (this._icon && this._map) {
    			var pos = this._map.latLngToLayerPoint(this._latlng).round();
    			this._setPos(pos);
    		}

    		return this;
    	},

    	_initIcon: function () {
    		var options = this.options,
    		    classToAdd = 'leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

    		var icon = options.icon.createIcon(this._icon),
    		    addIcon = false;

    		// if we're not reusing the icon, remove the old one and init new one
    		if (icon !== this._icon) {
    			if (this._icon) {
    				this._removeIcon();
    			}
    			addIcon = true;

    			if (options.title) {
    				icon.title = options.title;
    			}

    			if (icon.tagName === 'IMG') {
    				icon.alt = options.alt || '';
    			}
    		}

    		addClass(icon, classToAdd);

    		if (options.keyboard) {
    			icon.tabIndex = '0';
    		}

    		this._icon = icon;

    		if (options.riseOnHover) {
    			this.on({
    				mouseover: this._bringToFront,
    				mouseout: this._resetZIndex
    			});
    		}

    		var newShadow = options.icon.createShadow(this._shadow),
    		    addShadow = false;

    		if (newShadow !== this._shadow) {
    			this._removeShadow();
    			addShadow = true;
    		}

    		if (newShadow) {
    			addClass(newShadow, classToAdd);
    			newShadow.alt = '';
    		}
    		this._shadow = newShadow;


    		if (options.opacity < 1) {
    			this._updateOpacity();
    		}


    		if (addIcon) {
    			this.getPane().appendChild(this._icon);
    		}
    		this._initInteraction();
    		if (newShadow && addShadow) {
    			this.getPane(options.shadowPane).appendChild(this._shadow);
    		}
    	},

    	_removeIcon: function () {
    		if (this.options.riseOnHover) {
    			this.off({
    				mouseover: this._bringToFront,
    				mouseout: this._resetZIndex
    			});
    		}

    		remove(this._icon);
    		this.removeInteractiveTarget(this._icon);

    		this._icon = null;
    	},

    	_removeShadow: function () {
    		if (this._shadow) {
    			remove(this._shadow);
    		}
    		this._shadow = null;
    	},

    	_setPos: function (pos) {

    		if (this._icon) {
    			setPosition(this._icon, pos);
    		}

    		if (this._shadow) {
    			setPosition(this._shadow, pos);
    		}

    		this._zIndex = pos.y + this.options.zIndexOffset;

    		this._resetZIndex();
    	},

    	_updateZIndex: function (offset) {
    		if (this._icon) {
    			this._icon.style.zIndex = this._zIndex + offset;
    		}
    	},

    	_animateZoom: function (opt) {
    		var pos = this._map._latLngToNewLayerPoint(this._latlng, opt.zoom, opt.center).round();

    		this._setPos(pos);
    	},

    	_initInteraction: function () {

    		if (!this.options.interactive) { return; }

    		addClass(this._icon, 'leaflet-interactive');

    		this.addInteractiveTarget(this._icon);

    		if (MarkerDrag) {
    			var draggable = this.options.draggable;
    			if (this.dragging) {
    				draggable = this.dragging.enabled();
    				this.dragging.disable();
    			}

    			this.dragging = new MarkerDrag(this);

    			if (draggable) {
    				this.dragging.enable();
    			}
    		}
    	},

    	// @method setOpacity(opacity: Number): this
    	// Changes the opacity of the marker.
    	setOpacity: function (opacity) {
    		this.options.opacity = opacity;
    		if (this._map) {
    			this._updateOpacity();
    		}

    		return this;
    	},

    	_updateOpacity: function () {
    		var opacity = this.options.opacity;

    		if (this._icon) {
    			setOpacity(this._icon, opacity);
    		}

    		if (this._shadow) {
    			setOpacity(this._shadow, opacity);
    		}
    	},

    	_bringToFront: function () {
    		this._updateZIndex(this.options.riseOffset);
    	},

    	_resetZIndex: function () {
    		this._updateZIndex(0);
    	},

    	_getPopupAnchor: function () {
    		return this.options.icon.options.popupAnchor;
    	},

    	_getTooltipAnchor: function () {
    		return this.options.icon.options.tooltipAnchor;
    	}
    });


    // factory L.marker(latlng: LatLng, options? : Marker options)

    // @factory L.marker(latlng: LatLng, options? : Marker options)
    // Instantiates a Marker object given a geographical point and optionally an options object.
    function marker(latlng, options) {
    	return new Marker(latlng, options);
    }

    /*
     * @class LayerGroup
     * @aka L.LayerGroup
     * @inherits Layer
     *
     * Used to group several layers and handle them as one. If you add it to the map,
     * any layers added or removed from the group will be added/removed on the map as
     * well. Extends `Layer`.
     *
     * @example
     *
     * ```js
     * L.layerGroup([marker1, marker2])
     * 	.addLayer(polyline)
     * 	.addTo(map);
     * ```
     */

    var LayerGroup = Layer.extend({

    	initialize: function (layers, options) {
    		setOptions(this, options);

    		this._layers = {};

    		var i, len;

    		if (layers) {
    			for (i = 0, len = layers.length; i < len; i++) {
    				this.addLayer(layers[i]);
    			}
    		}
    	},

    	// @method addLayer(layer: Layer): this
    	// Adds the given layer to the group.
    	addLayer: function (layer) {
    		var id = this.getLayerId(layer);

    		this._layers[id] = layer;

    		if (this._map) {
    			this._map.addLayer(layer);
    		}

    		return this;
    	},

    	// @method removeLayer(layer: Layer): this
    	// Removes the given layer from the group.
    	// @alternative
    	// @method removeLayer(id: Number): this
    	// Removes the layer with the given internal ID from the group.
    	removeLayer: function (layer) {
    		var id = layer in this._layers ? layer : this.getLayerId(layer);

    		if (this._map && this._layers[id]) {
    			this._map.removeLayer(this._layers[id]);
    		}

    		delete this._layers[id];

    		return this;
    	},

    	// @method hasLayer(layer: Layer): Boolean
    	// Returns `true` if the given layer is currently added to the group.
    	// @alternative
    	// @method hasLayer(id: Number): Boolean
    	// Returns `true` if the given internal ID is currently added to the group.
    	hasLayer: function (layer) {
    		if (!layer) { return false; }
    		var layerId = typeof layer === 'number' ? layer : this.getLayerId(layer);
    		return layerId in this._layers;
    	},

    	// @method clearLayers(): this
    	// Removes all the layers from the group.
    	clearLayers: function () {
    		return this.eachLayer(this.removeLayer, this);
    	},

    	// @method invoke(methodName: String, …): this
    	// Calls `methodName` on every layer contained in this group, passing any
    	// additional parameters. Has no effect if the layers contained do not
    	// implement `methodName`.
    	invoke: function (methodName) {
    		var args = Array.prototype.slice.call(arguments, 1),
    		    i, layer;

    		for (i in this._layers) {
    			layer = this._layers[i];

    			if (layer[methodName]) {
    				layer[methodName].apply(layer, args);
    			}
    		}

    		return this;
    	},

    	onAdd: function (map) {
    		this.eachLayer(map.addLayer, map);
    	},

    	onRemove: function (map) {
    		this.eachLayer(map.removeLayer, map);
    	},

    	// @method eachLayer(fn: Function, context?: Object): this
    	// Iterates over the layers of the group, optionally specifying context of the iterator function.
    	// ```js
    	// group.eachLayer(function (layer) {
    	// 	layer.bindPopup('Hello');
    	// });
    	// ```
    	eachLayer: function (method, context) {
    		for (var i in this._layers) {
    			method.call(context, this._layers[i]);
    		}
    		return this;
    	},

    	// @method getLayer(id: Number): Layer
    	// Returns the layer with the given internal ID.
    	getLayer: function (id) {
    		return this._layers[id];
    	},

    	// @method getLayers(): Layer[]
    	// Returns an array of all the layers added to the group.
    	getLayers: function () {
    		var layers = [];
    		this.eachLayer(layers.push, layers);
    		return layers;
    	},

    	// @method setZIndex(zIndex: Number): this
    	// Calls `setZIndex` on every layer contained in this group, passing the z-index.
    	setZIndex: function (zIndex) {
    		return this.invoke('setZIndex', zIndex);
    	},

    	// @method getLayerId(layer: Layer): Number
    	// Returns the internal ID for a layer
    	getLayerId: function (layer) {
    		return stamp(layer);
    	}
    });

    /*
     * @class FeatureGroup
     * @aka L.FeatureGroup
     * @inherits LayerGroup
     *
     * Extended `LayerGroup` that makes it easier to do the same thing to all its member layers:
     *  * [`bindPopup`](#layer-bindpopup) binds a popup to all of the layers at once (likewise with [`bindTooltip`](#layer-bindtooltip))
     *  * Events are propagated to the `FeatureGroup`, so if the group has an event
     * handler, it will handle events from any of the layers. This includes mouse events
     * and custom events.
     *  * Has `layeradd` and `layerremove` events
     *
     * @example
     *
     * ```js
     * L.featureGroup([marker1, marker2, polyline])
     * 	.bindPopup('Hello world!')
     * 	.on('click', function() { alert('Clicked on a member of the group!'); })
     * 	.addTo(map);
     * ```
     */

    var FeatureGroup = LayerGroup.extend({

    	addLayer: function (layer) {
    		if (this.hasLayer(layer)) {
    			return this;
    		}

    		layer.addEventParent(this);

    		LayerGroup.prototype.addLayer.call(this, layer);

    		// @event layeradd: LayerEvent
    		// Fired when a layer is added to this `FeatureGroup`
    		return this.fire('layeradd', {layer: layer});
    	},

    	removeLayer: function (layer) {
    		if (!this.hasLayer(layer)) {
    			return this;
    		}
    		if (layer in this._layers) {
    			layer = this._layers[layer];
    		}

    		layer.removeEventParent(this);

    		LayerGroup.prototype.removeLayer.call(this, layer);

    		// @event layerremove: LayerEvent
    		// Fired when a layer is removed from this `FeatureGroup`
    		return this.fire('layerremove', {layer: layer});
    	},

    	// @method setStyle(style: Path options): this
    	// Sets the given path options to each layer of the group that has a `setStyle` method.
    	setStyle: function (style) {
    		return this.invoke('setStyle', style);
    	},

    	// @method bringToFront(): this
    	// Brings the layer group to the top of all other layers
    	bringToFront: function () {
    		return this.invoke('bringToFront');
    	},

    	// @method bringToBack(): this
    	// Brings the layer group to the back of all other layers
    	bringToBack: function () {
    		return this.invoke('bringToBack');
    	},

    	// @method getBounds(): LatLngBounds
    	// Returns the LatLngBounds of the Feature Group (created from bounds and coordinates of its children).
    	getBounds: function () {
    		var bounds = new LatLngBounds();

    		for (var id in this._layers) {
    			var layer = this._layers[id];
    			bounds.extend(layer.getBounds ? layer.getBounds() : layer.getLatLng());
    		}
    		return bounds;
    	}
    });

    /*
     * @class DivOverlay
     * @inherits Layer
     * @aka L.DivOverlay
     * Base model for L.Popup and L.Tooltip. Inherit from it for custom popup like plugins.
     */

    // @namespace DivOverlay
    var DivOverlay = Layer.extend({

    	// @section
    	// @aka DivOverlay options
    	options: {
    		// @option offset: Point = Point(0, 7)
    		// The offset of the popup position. Useful to control the anchor
    		// of the popup when opening it on some overlays.
    		offset: [0, 7],

    		// @option className: String = ''
    		// A custom CSS class name to assign to the popup.
    		className: '',

    		// @option pane: String = 'popupPane'
    		// `Map pane` where the popup will be added.
    		pane: 'popupPane'
    	},

    	initialize: function (options, source) {
    		setOptions(this, options);

    		this._source = source;
    	},

    	onAdd: function (map) {
    		this._zoomAnimated = map._zoomAnimated;

    		if (!this._container) {
    			this._initLayout();
    		}

    		if (map._fadeAnimated) {
    			setOpacity(this._container, 0);
    		}

    		clearTimeout(this._removeTimeout);
    		this.getPane().appendChild(this._container);
    		this.update();

    		if (map._fadeAnimated) {
    			setOpacity(this._container, 1);
    		}

    		this.bringToFront();
    	},

    	onRemove: function (map) {
    		if (map._fadeAnimated) {
    			setOpacity(this._container, 0);
    			this._removeTimeout = setTimeout(bind$1(remove, undefined, this._container), 200);
    		} else {
    			remove(this._container);
    		}
    	},

    	// @namespace Popup
    	// @method getLatLng: LatLng
    	// Returns the geographical point of popup.
    	getLatLng: function () {
    		return this._latlng;
    	},

    	// @method setLatLng(latlng: LatLng): this
    	// Sets the geographical point where the popup will open.
    	setLatLng: function (latlng) {
    		this._latlng = toLatLng(latlng);
    		if (this._map) {
    			this._updatePosition();
    			this._adjustPan();
    		}
    		return this;
    	},

    	// @method getContent: String|HTMLElement
    	// Returns the content of the popup.
    	getContent: function () {
    		return this._content;
    	},

    	// @method setContent(htmlContent: String|HTMLElement|Function): this
    	// Sets the HTML content of the popup. If a function is passed the source layer will be passed to the function. The function should return a `String` or `HTMLElement` to be used in the popup.
    	setContent: function (content) {
    		this._content = content;
    		this.update();
    		return this;
    	},

    	// @method getElement: String|HTMLElement
    	// Returns the HTML container of the popup.
    	getElement: function () {
    		return this._container;
    	},

    	// @method update: null
    	// Updates the popup content, layout and position. Useful for updating the popup after something inside changed, e.g. image loaded.
    	update: function () {
    		if (!this._map) { return; }

    		this._container.style.visibility = 'hidden';

    		this._updateContent();
    		this._updateLayout();
    		this._updatePosition();

    		this._container.style.visibility = '';

    		this._adjustPan();
    	},

    	getEvents: function () {
    		var events = {
    			zoom: this._updatePosition,
    			viewreset: this._updatePosition
    		};

    		if (this._zoomAnimated) {
    			events.zoomanim = this._animateZoom;
    		}
    		return events;
    	},

    	// @method isOpen: Boolean
    	// Returns `true` when the popup is visible on the map.
    	isOpen: function () {
    		return !!this._map && this._map.hasLayer(this);
    	},

    	// @method bringToFront: this
    	// Brings this popup in front of other popups (in the same map pane).
    	bringToFront: function () {
    		if (this._map) {
    			toFront(this._container);
    		}
    		return this;
    	},

    	// @method bringToBack: this
    	// Brings this popup to the back of other popups (in the same map pane).
    	bringToBack: function () {
    		if (this._map) {
    			toBack(this._container);
    		}
    		return this;
    	},

    	_prepareOpen: function (parent, layer, latlng) {
    		if (!(layer instanceof Layer)) {
    			latlng = layer;
    			layer = parent;
    		}

    		if (layer instanceof FeatureGroup) {
    			for (var id in parent._layers) {
    				layer = parent._layers[id];
    				break;
    			}
    		}

    		if (!latlng) {
    			if (layer.getCenter) {
    				latlng = layer.getCenter();
    			} else if (layer.getLatLng) {
    				latlng = layer.getLatLng();
    			} else {
    				throw new Error('Unable to get source layer LatLng.');
    			}
    		}

    		// set overlay source to this layer
    		this._source = layer;

    		// update the overlay (content, layout, ect...)
    		this.update();

    		return latlng;
    	},

    	_updateContent: function () {
    		if (!this._content) { return; }

    		var node = this._contentNode;
    		var content = (typeof this._content === 'function') ? this._content(this._source || this) : this._content;

    		if (typeof content === 'string') {
    			node.innerHTML = content;
    		} else {
    			while (node.hasChildNodes()) {
    				node.removeChild(node.firstChild);
    			}
    			node.appendChild(content);
    		}
    		this.fire('contentupdate');
    	},

    	_updatePosition: function () {
    		if (!this._map) { return; }

    		var pos = this._map.latLngToLayerPoint(this._latlng),
    		    offset = toPoint(this.options.offset),
    		    anchor = this._getAnchor();

    		if (this._zoomAnimated) {
    			setPosition(this._container, pos.add(anchor));
    		} else {
    			offset = offset.add(pos).add(anchor);
    		}

    		var bottom = this._containerBottom = -offset.y,
    		    left = this._containerLeft = -Math.round(this._containerWidth / 2) + offset.x;

    		// bottom position the popup in case the height of the popup changes (images loading etc)
    		this._container.style.bottom = bottom + 'px';
    		this._container.style.left = left + 'px';
    	},

    	_getAnchor: function () {
    		return [0, 0];
    	}

    });

    /*
     * @class Path
     * @aka L.Path
     * @inherits Interactive layer
     *
     * An abstract class that contains options and constants shared between vector
     * overlays (Polygon, Polyline, Circle). Do not use it directly. Extends `Layer`.
     */

    var Path = Layer.extend({

    	// @section
    	// @aka Path options
    	options: {
    		// @option stroke: Boolean = true
    		// Whether to draw stroke along the path. Set it to `false` to disable borders on polygons or circles.
    		stroke: true,

    		// @option color: String = '#3388ff'
    		// Stroke color
    		color: '#3388ff',

    		// @option weight: Number = 3
    		// Stroke width in pixels
    		weight: 3,

    		// @option opacity: Number = 1.0
    		// Stroke opacity
    		opacity: 1,

    		// @option lineCap: String= 'round'
    		// A string that defines [shape to be used at the end](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linecap) of the stroke.
    		lineCap: 'round',

    		// @option lineJoin: String = 'round'
    		// A string that defines [shape to be used at the corners](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-linejoin) of the stroke.
    		lineJoin: 'round',

    		// @option dashArray: String = null
    		// A string that defines the stroke [dash pattern](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dasharray). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
    		dashArray: null,

    		// @option dashOffset: String = null
    		// A string that defines the [distance into the dash pattern to start the dash](https://developer.mozilla.org/docs/Web/SVG/Attribute/stroke-dashoffset). Doesn't work on `Canvas`-powered layers in [some old browsers](https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/setLineDash#Browser_compatibility).
    		dashOffset: null,

    		// @option fill: Boolean = depends
    		// Whether to fill the path with color. Set it to `false` to disable filling on polygons or circles.
    		fill: false,

    		// @option fillColor: String = *
    		// Fill color. Defaults to the value of the [`color`](#path-color) option
    		fillColor: null,

    		// @option fillOpacity: Number = 0.2
    		// Fill opacity.
    		fillOpacity: 0.2,

    		// @option fillRule: String = 'evenodd'
    		// A string that defines [how the inside of a shape](https://developer.mozilla.org/docs/Web/SVG/Attribute/fill-rule) is determined.
    		fillRule: 'evenodd',

    		// className: '',

    		// Option inherited from "Interactive layer" abstract class
    		interactive: true,

    		// @option bubblingMouseEvents: Boolean = true
    		// When `true`, a mouse event on this path will trigger the same event on the map
    		// (unless [`L.DomEvent.stopPropagation`](#domevent-stoppropagation) is used).
    		bubblingMouseEvents: true
    	},

    	beforeAdd: function (map) {
    		// Renderer is set here because we need to call renderer.getEvents
    		// before this.getEvents.
    		this._renderer = map.getRenderer(this);
    	},

    	onAdd: function () {
    		this._renderer._initPath(this);
    		this._reset();
    		this._renderer._addPath(this);
    	},

    	onRemove: function () {
    		this._renderer._removePath(this);
    	},

    	// @method redraw(): this
    	// Redraws the layer. Sometimes useful after you changed the coordinates that the path uses.
    	redraw: function () {
    		if (this._map) {
    			this._renderer._updatePath(this);
    		}
    		return this;
    	},

    	// @method setStyle(style: Path options): this
    	// Changes the appearance of a Path based on the options in the `Path options` object.
    	setStyle: function (style) {
    		setOptions(this, style);
    		if (this._renderer) {
    			this._renderer._updateStyle(this);
    			if (this.options.stroke && style && Object.prototype.hasOwnProperty.call(style, 'weight')) {
    				this._updateBounds();
    			}
    		}
    		return this;
    	},

    	// @method bringToFront(): this
    	// Brings the layer to the top of all path layers.
    	bringToFront: function () {
    		if (this._renderer) {
    			this._renderer._bringToFront(this);
    		}
    		return this;
    	},

    	// @method bringToBack(): this
    	// Brings the layer to the bottom of all path layers.
    	bringToBack: function () {
    		if (this._renderer) {
    			this._renderer._bringToBack(this);
    		}
    		return this;
    	},

    	getElement: function () {
    		return this._path;
    	},

    	_reset: function () {
    		// defined in child classes
    		this._project();
    		this._update();
    	},

    	_clickTolerance: function () {
    		// used when doing hit detection for Canvas layers
    		return (this.options.stroke ? this.options.weight / 2 : 0) + this._renderer.options.tolerance;
    	}
    });

    /*
     * @class Popup
     * @inherits DivOverlay
     * @aka L.Popup
     * Used to open popups in certain places of the map. Use [Map.openPopup](#map-openpopup) to
     * open popups while making sure that only one popup is open at one time
     * (recommended for usability), or use [Map.addLayer](#map-addlayer) to open as many as you want.
     *
     * @example
     *
     * If you want to just bind a popup to marker click and then open it, it's really easy:
     *
     * ```js
     * marker.bindPopup(popupContent).openPopup();
     * ```
     * Path overlays like polylines also have a `bindPopup` method.
     * Here's a more complicated way to open a popup on a map:
     *
     * ```js
     * var popup = L.popup()
     * 	.setLatLng(latlng)
     * 	.setContent('<p>Hello world!<br />This is a nice popup.</p>')
     * 	.openOn(map);
     * ```
     */


    // @namespace Popup
    var Popup = DivOverlay.extend({

    	// @section
    	// @aka Popup options
    	options: {
    		// @option maxWidth: Number = 300
    		// Max width of the popup, in pixels.
    		maxWidth: 300,

    		// @option minWidth: Number = 50
    		// Min width of the popup, in pixels.
    		minWidth: 50,

    		// @option maxHeight: Number = null
    		// If set, creates a scrollable container of the given height
    		// inside a popup if its content exceeds it.
    		maxHeight: null,

    		// @option autoPan: Boolean = true
    		// Set it to `false` if you don't want the map to do panning animation
    		// to fit the opened popup.
    		autoPan: true,

    		// @option autoPanPaddingTopLeft: Point = null
    		// The margin between the popup and the top left corner of the map
    		// view after autopanning was performed.
    		autoPanPaddingTopLeft: null,

    		// @option autoPanPaddingBottomRight: Point = null
    		// The margin between the popup and the bottom right corner of the map
    		// view after autopanning was performed.
    		autoPanPaddingBottomRight: null,

    		// @option autoPanPadding: Point = Point(5, 5)
    		// Equivalent of setting both top left and bottom right autopan padding to the same value.
    		autoPanPadding: [5, 5],

    		// @option keepInView: Boolean = false
    		// Set it to `true` if you want to prevent users from panning the popup
    		// off of the screen while it is open.
    		keepInView: false,

    		// @option closeButton: Boolean = true
    		// Controls the presence of a close button in the popup.
    		closeButton: true,

    		// @option autoClose: Boolean = true
    		// Set it to `false` if you want to override the default behavior of
    		// the popup closing when another popup is opened.
    		autoClose: true,

    		// @option closeOnEscapeKey: Boolean = true
    		// Set it to `false` if you want to override the default behavior of
    		// the ESC key for closing of the popup.
    		closeOnEscapeKey: true,

    		// @option closeOnClick: Boolean = *
    		// Set it if you want to override the default behavior of the popup closing when user clicks
    		// on the map. Defaults to the map's [`closePopupOnClick`](#map-closepopuponclick) option.

    		// @option className: String = ''
    		// A custom CSS class name to assign to the popup.
    		className: ''
    	},

    	// @namespace Popup
    	// @method openOn(map: Map): this
    	// Adds the popup to the map and closes the previous one. The same as `map.openPopup(popup)`.
    	openOn: function (map) {
    		map.openPopup(this);
    		return this;
    	},

    	onAdd: function (map) {
    		DivOverlay.prototype.onAdd.call(this, map);

    		// @namespace Map
    		// @section Popup events
    		// @event popupopen: PopupEvent
    		// Fired when a popup is opened in the map
    		map.fire('popupopen', {popup: this});

    		if (this._source) {
    			// @namespace Layer
    			// @section Popup events
    			// @event popupopen: PopupEvent
    			// Fired when a popup bound to this layer is opened
    			this._source.fire('popupopen', {popup: this}, true);
    			// For non-path layers, we toggle the popup when clicking
    			// again the layer, so prevent the map to reopen it.
    			if (!(this._source instanceof Path)) {
    				this._source.on('preclick', stopPropagation);
    			}
    		}
    	},

    	onRemove: function (map) {
    		DivOverlay.prototype.onRemove.call(this, map);

    		// @namespace Map
    		// @section Popup events
    		// @event popupclose: PopupEvent
    		// Fired when a popup in the map is closed
    		map.fire('popupclose', {popup: this});

    		if (this._source) {
    			// @namespace Layer
    			// @section Popup events
    			// @event popupclose: PopupEvent
    			// Fired when a popup bound to this layer is closed
    			this._source.fire('popupclose', {popup: this}, true);
    			if (!(this._source instanceof Path)) {
    				this._source.off('preclick', stopPropagation);
    			}
    		}
    	},

    	getEvents: function () {
    		var events = DivOverlay.prototype.getEvents.call(this);

    		if (this.options.closeOnClick !== undefined ? this.options.closeOnClick : this._map.options.closePopupOnClick) {
    			events.preclick = this._close;
    		}

    		if (this.options.keepInView) {
    			events.moveend = this._adjustPan;
    		}

    		return events;
    	},

    	_close: function () {
    		if (this._map) {
    			this._map.closePopup(this);
    		}
    	},

    	_initLayout: function () {
    		var prefix = 'leaflet-popup',
    		    container = this._container = create$1('div',
    			prefix + ' ' + (this.options.className || '') +
    			' leaflet-zoom-animated');

    		var wrapper = this._wrapper = create$1('div', prefix + '-content-wrapper', container);
    		this._contentNode = create$1('div', prefix + '-content', wrapper);

    		disableClickPropagation(container);
    		disableScrollPropagation(this._contentNode);
    		on(container, 'contextmenu', stopPropagation);

    		this._tipContainer = create$1('div', prefix + '-tip-container', container);
    		this._tip = create$1('div', prefix + '-tip', this._tipContainer);

    		if (this.options.closeButton) {
    			var closeButton = this._closeButton = create$1('a', prefix + '-close-button', container);
    			closeButton.href = '#close';
    			closeButton.innerHTML = '&#215;';

    			on(closeButton, 'click', this._onCloseButtonClick, this);
    		}
    	},

    	_updateLayout: function () {
    		var container = this._contentNode,
    		    style = container.style;

    		style.width = '';
    		style.whiteSpace = 'nowrap';

    		var width = container.offsetWidth;
    		width = Math.min(width, this.options.maxWidth);
    		width = Math.max(width, this.options.minWidth);

    		style.width = (width + 1) + 'px';
    		style.whiteSpace = '';

    		style.height = '';

    		var height = container.offsetHeight,
    		    maxHeight = this.options.maxHeight,
    		    scrolledClass = 'leaflet-popup-scrolled';

    		if (maxHeight && height > maxHeight) {
    			style.height = maxHeight + 'px';
    			addClass(container, scrolledClass);
    		} else {
    			removeClass(container, scrolledClass);
    		}

    		this._containerWidth = this._container.offsetWidth;
    	},

    	_animateZoom: function (e) {
    		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center),
    		    anchor = this._getAnchor();
    		setPosition(this._container, pos.add(anchor));
    	},

    	_adjustPan: function () {
    		if (!this.options.autoPan) { return; }
    		if (this._map._panAnim) { this._map._panAnim.stop(); }

    		var map = this._map,
    		    marginBottom = parseInt(getStyle(this._container, 'marginBottom'), 10) || 0,
    		    containerHeight = this._container.offsetHeight + marginBottom,
    		    containerWidth = this._containerWidth,
    		    layerPos = new Point(this._containerLeft, -containerHeight - this._containerBottom);

    		layerPos._add(getPosition(this._container));

    		var containerPos = map.layerPointToContainerPoint(layerPos),
    		    padding = toPoint(this.options.autoPanPadding),
    		    paddingTL = toPoint(this.options.autoPanPaddingTopLeft || padding),
    		    paddingBR = toPoint(this.options.autoPanPaddingBottomRight || padding),
    		    size = map.getSize(),
    		    dx = 0,
    		    dy = 0;

    		if (containerPos.x + containerWidth + paddingBR.x > size.x) { // right
    			dx = containerPos.x + containerWidth - size.x + paddingBR.x;
    		}
    		if (containerPos.x - dx - paddingTL.x < 0) { // left
    			dx = containerPos.x - paddingTL.x;
    		}
    		if (containerPos.y + containerHeight + paddingBR.y > size.y) { // bottom
    			dy = containerPos.y + containerHeight - size.y + paddingBR.y;
    		}
    		if (containerPos.y - dy - paddingTL.y < 0) { // top
    			dy = containerPos.y - paddingTL.y;
    		}

    		// @namespace Map
    		// @section Popup events
    		// @event autopanstart: Event
    		// Fired when the map starts autopanning when opening a popup.
    		if (dx || dy) {
    			map
    			    .fire('autopanstart')
    			    .panBy([dx, dy]);
    		}
    	},

    	_onCloseButtonClick: function (e) {
    		this._close();
    		stop(e);
    	},

    	_getAnchor: function () {
    		// Where should we anchor the popup on the source layer?
    		return toPoint(this._source && this._source._getPopupAnchor ? this._source._getPopupAnchor() : [0, 0]);
    	}

    });

    // @namespace Popup
    // @factory L.popup(options?: Popup options, source?: Layer)
    // Instantiates a `Popup` object given an optional `options` object that describes its appearance and location and an optional `source` object that is used to tag the popup with a reference to the Layer to which it refers.
    var popup = function (options, source) {
    	return new Popup(options, source);
    };


    /* @namespace Map
     * @section Interaction Options
     * @option closePopupOnClick: Boolean = true
     * Set it to `false` if you don't want popups to close when user clicks the map.
     */
    Map$1.mergeOptions({
    	closePopupOnClick: true
    });


    // @namespace Map
    // @section Methods for Layers and Controls
    Map$1.include({
    	// @method openPopup(popup: Popup): this
    	// Opens the specified popup while closing the previously opened (to make sure only one is opened at one time for usability).
    	// @alternative
    	// @method openPopup(content: String|HTMLElement, latlng: LatLng, options?: Popup options): this
    	// Creates a popup with the specified content and options and opens it in the given point on a map.
    	openPopup: function (popup, latlng, options) {
    		if (!(popup instanceof Popup)) {
    			popup = new Popup(options).setContent(popup);
    		}

    		if (latlng) {
    			popup.setLatLng(latlng);
    		}

    		if (this.hasLayer(popup)) {
    			return this;
    		}

    		if (this._popup && this._popup.options.autoClose) {
    			this.closePopup();
    		}

    		this._popup = popup;
    		return this.addLayer(popup);
    	},

    	// @method closePopup(popup?: Popup): this
    	// Closes the popup previously opened with [openPopup](#map-openpopup) (or the given one).
    	closePopup: function (popup) {
    		if (!popup || popup === this._popup) {
    			popup = this._popup;
    			this._popup = null;
    		}
    		if (popup) {
    			this.removeLayer(popup);
    		}
    		return this;
    	}
    });

    /*
     * @namespace Layer
     * @section Popup methods example
     *
     * All layers share a set of methods convenient for binding popups to it.
     *
     * ```js
     * var layer = L.Polygon(latlngs).bindPopup('Hi There!').addTo(map);
     * layer.openPopup();
     * layer.closePopup();
     * ```
     *
     * Popups will also be automatically opened when the layer is clicked on and closed when the layer is removed from the map or another popup is opened.
     */

    // @section Popup methods
    Layer.include({

    	// @method bindPopup(content: String|HTMLElement|Function|Popup, options?: Popup options): this
    	// Binds a popup to the layer with the passed `content` and sets up the
    	// necessary event listeners. If a `Function` is passed it will receive
    	// the layer as the first argument and should return a `String` or `HTMLElement`.
    	bindPopup: function (content, options) {

    		if (content instanceof Popup) {
    			setOptions(content, options);
    			this._popup = content;
    			content._source = this;
    		} else {
    			if (!this._popup || options) {
    				this._popup = new Popup(options, this);
    			}
    			this._popup.setContent(content);
    		}

    		if (!this._popupHandlersAdded) {
    			this.on({
    				click: this._openPopup,
    				keypress: this._onKeyPress,
    				remove: this.closePopup,
    				move: this._movePopup
    			});
    			this._popupHandlersAdded = true;
    		}

    		return this;
    	},

    	// @method unbindPopup(): this
    	// Removes the popup previously bound with `bindPopup`.
    	unbindPopup: function () {
    		if (this._popup) {
    			this.off({
    				click: this._openPopup,
    				keypress: this._onKeyPress,
    				remove: this.closePopup,
    				move: this._movePopup
    			});
    			this._popupHandlersAdded = false;
    			this._popup = null;
    		}
    		return this;
    	},

    	// @method openPopup(latlng?: LatLng): this
    	// Opens the bound popup at the specified `latlng` or at the default popup anchor if no `latlng` is passed.
    	openPopup: function (layer, latlng) {
    		if (this._popup && this._map) {
    			latlng = this._popup._prepareOpen(this, layer, latlng);

    			// open the popup on the map
    			this._map.openPopup(this._popup, latlng);
    		}

    		return this;
    	},

    	// @method closePopup(): this
    	// Closes the popup bound to this layer if it is open.
    	closePopup: function () {
    		if (this._popup) {
    			this._popup._close();
    		}
    		return this;
    	},

    	// @method togglePopup(): this
    	// Opens or closes the popup bound to this layer depending on its current state.
    	togglePopup: function (target) {
    		if (this._popup) {
    			if (this._popup._map) {
    				this.closePopup();
    			} else {
    				this.openPopup(target);
    			}
    		}
    		return this;
    	},

    	// @method isPopupOpen(): boolean
    	// Returns `true` if the popup bound to this layer is currently open.
    	isPopupOpen: function () {
    		return (this._popup ? this._popup.isOpen() : false);
    	},

    	// @method setPopupContent(content: String|HTMLElement|Popup): this
    	// Sets the content of the popup bound to this layer.
    	setPopupContent: function (content) {
    		if (this._popup) {
    			this._popup.setContent(content);
    		}
    		return this;
    	},

    	// @method getPopup(): Popup
    	// Returns the popup bound to this layer.
    	getPopup: function () {
    		return this._popup;
    	},

    	_openPopup: function (e) {
    		var layer = e.layer || e.target;

    		if (!this._popup) {
    			return;
    		}

    		if (!this._map) {
    			return;
    		}

    		// prevent map click
    		stop(e);

    		// if this inherits from Path its a vector and we can just
    		// open the popup at the new location
    		if (layer instanceof Path) {
    			this.openPopup(e.layer || e.target, e.latlng);
    			return;
    		}

    		// otherwise treat it like a marker and figure out
    		// if we should toggle it open/closed
    		if (this._map.hasLayer(this._popup) && this._popup._source === layer) {
    			this.closePopup();
    		} else {
    			this.openPopup(layer, e.latlng);
    		}
    	},

    	_movePopup: function (e) {
    		this._popup.setLatLng(e.latlng);
    	},

    	_onKeyPress: function (e) {
    		if (e.originalEvent.keyCode === 13) {
    			this._openPopup(e);
    		}
    	}
    });

    /* node_modules/svelte-leaflet/src/layers/marker.svelte generated by Svelte v3.30.0 */

    function create_fragment$1(ctx) {
    	let current;
    	const default_slot_template = /*#slots*/ ctx[4].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[3], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 8) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[3], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    IconDefault.imagePath = "https://unpkg.com/leaflet@1.6.0/dist/images/";

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Marker", slots, ['default']);
    	let { latLng } = $$props;
    	let { options = {} } = $$props;
    	let map = getContext("leafletMapInstance");
    	let { layer = marker(latLng, options).addTo(map) } = $$props;
    	layer.on("move", () => $$invalidate(0, latLng = layer.getLatLng()));
    	onDestroy(() => layer.remove());
    	setContext("leafletLayer", layer);
    	const writable_props = ["latLng", "options", "layer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Marker> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("latLng" in $$props) $$invalidate(0, latLng = $$props.latLng);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("layer" in $$props) $$invalidate(2, layer = $$props.layer);
    		if ("$$scope" in $$props) $$invalidate(3, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		IconDefault,
    		setContext,
    		getContext,
    		onDestroy,
    		marker,
    		popup,
    		latLng,
    		options,
    		map,
    		layer
    	});

    	$$self.$inject_state = $$props => {
    		if ("latLng" in $$props) $$invalidate(0, latLng = $$props.latLng);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("map" in $$props) map = $$props.map;
    		if ("layer" in $$props) $$invalidate(2, layer = $$props.layer);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*layer, latLng*/ 5) {
    			 layer.setLatLng(latLng);
    		}
    	};

    	return [latLng, options, layer, $$scope, slots];
    }

    class Marker$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { latLng: 0, options: 1, layer: 2 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Marker",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*latLng*/ ctx[0] === undefined && !("latLng" in props)) {
    			console.warn("<Marker> was created without expected prop 'latLng'");
    		}
    	}

    	get latLng() {
    		throw new Error("<Marker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set latLng(value) {
    		throw new Error("<Marker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Marker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Marker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get layer() {
    		throw new Error("<Marker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set layer(value) {
    		throw new Error("<Marker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-leaflet/src/layers/popup.svelte generated by Svelte v3.30.0 */
    const file$1 = "node_modules/svelte-leaflet/src/layers/popup.svelte";

    function create_fragment$2(ctx) {
    	let span;
    	let hide_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[3].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[2], null);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if (default_slot) default_slot.c();
    			add_location(span, file$1, 36, 0, 855);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);

    			if (default_slot) {
    				default_slot.m(span, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(hide_action = /*hide*/ ctx[0].call(null, span));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && dirty & /*$$scope*/ 4) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[2], dirty, null, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Popup", slots, ['default']);
    	let { options = {} } = $$props;
    	let map = getContext("leafletMapInstance");
    	let layer = getContext("leafletLayer");
    	let popupContent;
    	let popup$1 = popup(options, layer).setLatLng(layer.getLatLng()).addTo(map);
    	onMount(() => map.whenReady(() => popup$1.update()));
    	onDestroy(() => popup$1.remove());

    	function hide(node) {
    		if (node) {
    			popup$1.setContent(node);
    		}
    	}

    	afterUpdate(() => {
    		popup$1.update();
    	});

    	// The popup anchor is not calculated properly on first map load. Wait until
    	// the map has polled the Leaflet CSS, then update the position of the popup.
    	map.once("resize", () => {
    		popup$1.update();
    	});

    	layer.on("move", () => popup$1.setLatLng(layer.getLatLng()));
    	const writable_props = ["options"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Popup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("$$scope" in $$props) $$invalidate(2, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		lpopup: popup,
    		setContext,
    		getContext,
    		onDestroy,
    		onMount,
    		afterUpdate,
    		options,
    		map,
    		layer,
    		popupContent,
    		popup: popup$1,
    		hide
    	});

    	$$self.$inject_state = $$props => {
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("map" in $$props) map = $$props.map;
    		if ("layer" in $$props) layer = $$props.layer;
    		if ("popupContent" in $$props) popupContent = $$props.popupContent;
    		if ("popup" in $$props) popup$1 = $$props.popup;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [hide, options, $$scope, slots];
    }

    class Popup$1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { options: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get options() {
    		throw new Error("<Popup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Popup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*
     * @class Tooltip
     * @inherits DivOverlay
     * @aka L.Tooltip
     * Used to display small texts on top of map layers.
     *
     * @example
     *
     * ```js
     * marker.bindTooltip("my tooltip text").openTooltip();
     * ```
     * Note about tooltip offset. Leaflet takes two options in consideration
     * for computing tooltip offsetting:
     * - the `offset` Tooltip option: it defaults to [0, 0], and it's specific to one tooltip.
     *   Add a positive x offset to move the tooltip to the right, and a positive y offset to
     *   move it to the bottom. Negatives will move to the left and top.
     * - the `tooltipAnchor` Icon option: this will only be considered for Marker. You
     *   should adapt this value if you use a custom icon.
     */


    // @namespace Tooltip
    var Tooltip = DivOverlay.extend({

    	// @section
    	// @aka Tooltip options
    	options: {
    		// @option pane: String = 'tooltipPane'
    		// `Map pane` where the tooltip will be added.
    		pane: 'tooltipPane',

    		// @option offset: Point = Point(0, 0)
    		// Optional offset of the tooltip position.
    		offset: [0, 0],

    		// @option direction: String = 'auto'
    		// Direction where to open the tooltip. Possible values are: `right`, `left`,
    		// `top`, `bottom`, `center`, `auto`.
    		// `auto` will dynamically switch between `right` and `left` according to the tooltip
    		// position on the map.
    		direction: 'auto',

    		// @option permanent: Boolean = false
    		// Whether to open the tooltip permanently or only on mouseover.
    		permanent: false,

    		// @option sticky: Boolean = false
    		// If true, the tooltip will follow the mouse instead of being fixed at the feature center.
    		sticky: false,

    		// @option interactive: Boolean = false
    		// If true, the tooltip will listen to the feature events.
    		interactive: false,

    		// @option opacity: Number = 0.9
    		// Tooltip container opacity.
    		opacity: 0.9
    	},

    	onAdd: function (map) {
    		DivOverlay.prototype.onAdd.call(this, map);
    		this.setOpacity(this.options.opacity);

    		// @namespace Map
    		// @section Tooltip events
    		// @event tooltipopen: TooltipEvent
    		// Fired when a tooltip is opened in the map.
    		map.fire('tooltipopen', {tooltip: this});

    		if (this._source) {
    			// @namespace Layer
    			// @section Tooltip events
    			// @event tooltipopen: TooltipEvent
    			// Fired when a tooltip bound to this layer is opened.
    			this._source.fire('tooltipopen', {tooltip: this}, true);
    		}
    	},

    	onRemove: function (map) {
    		DivOverlay.prototype.onRemove.call(this, map);

    		// @namespace Map
    		// @section Tooltip events
    		// @event tooltipclose: TooltipEvent
    		// Fired when a tooltip in the map is closed.
    		map.fire('tooltipclose', {tooltip: this});

    		if (this._source) {
    			// @namespace Layer
    			// @section Tooltip events
    			// @event tooltipclose: TooltipEvent
    			// Fired when a tooltip bound to this layer is closed.
    			this._source.fire('tooltipclose', {tooltip: this}, true);
    		}
    	},

    	getEvents: function () {
    		var events = DivOverlay.prototype.getEvents.call(this);

    		if (touch && !this.options.permanent) {
    			events.preclick = this._close;
    		}

    		return events;
    	},

    	_close: function () {
    		if (this._map) {
    			this._map.closeTooltip(this);
    		}
    	},

    	_initLayout: function () {
    		var prefix = 'leaflet-tooltip',
    		    className = prefix + ' ' + (this.options.className || '') + ' leaflet-zoom-' + (this._zoomAnimated ? 'animated' : 'hide');

    		this._contentNode = this._container = create$1('div', className);
    	},

    	_updateLayout: function () {},

    	_adjustPan: function () {},

    	_setPosition: function (pos) {
    		var subX, subY,
    		    map = this._map,
    		    container = this._container,
    		    centerPoint = map.latLngToContainerPoint(map.getCenter()),
    		    tooltipPoint = map.layerPointToContainerPoint(pos),
    		    direction = this.options.direction,
    		    tooltipWidth = container.offsetWidth,
    		    tooltipHeight = container.offsetHeight,
    		    offset = toPoint(this.options.offset),
    		    anchor = this._getAnchor();

    		if (direction === 'top') {
    			subX = tooltipWidth / 2;
    			subY = tooltipHeight;
    		} else if (direction === 'bottom') {
    			subX = tooltipWidth / 2;
    			subY = 0;
    		} else if (direction === 'center') {
    			subX = tooltipWidth / 2;
    			subY = tooltipHeight / 2;
    		} else if (direction === 'right') {
    			subX = 0;
    			subY = tooltipHeight / 2;
    		} else if (direction === 'left') {
    			subX = tooltipWidth;
    			subY = tooltipHeight / 2;
    		} else if (tooltipPoint.x < centerPoint.x) {
    			direction = 'right';
    			subX = 0;
    			subY = tooltipHeight / 2;
    		} else {
    			direction = 'left';
    			subX = tooltipWidth + (offset.x + anchor.x) * 2;
    			subY = tooltipHeight / 2;
    		}

    		pos = pos.subtract(toPoint(subX, subY, true)).add(offset).add(anchor);

    		removeClass(container, 'leaflet-tooltip-right');
    		removeClass(container, 'leaflet-tooltip-left');
    		removeClass(container, 'leaflet-tooltip-top');
    		removeClass(container, 'leaflet-tooltip-bottom');
    		addClass(container, 'leaflet-tooltip-' + direction);
    		setPosition(container, pos);
    	},

    	_updatePosition: function () {
    		var pos = this._map.latLngToLayerPoint(this._latlng);
    		this._setPosition(pos);
    	},

    	setOpacity: function (opacity) {
    		this.options.opacity = opacity;

    		if (this._container) {
    			setOpacity(this._container, opacity);
    		}
    	},

    	_animateZoom: function (e) {
    		var pos = this._map._latLngToNewLayerPoint(this._latlng, e.zoom, e.center);
    		this._setPosition(pos);
    	},

    	_getAnchor: function () {
    		// Where should we anchor the tooltip on the source layer?
    		return toPoint(this._source && this._source._getTooltipAnchor && !this.options.sticky ? this._source._getTooltipAnchor() : [0, 0]);
    	}

    });

    // @namespace Map
    // @section Methods for Layers and Controls
    Map$1.include({

    	// @method openTooltip(tooltip: Tooltip): this
    	// Opens the specified tooltip.
    	// @alternative
    	// @method openTooltip(content: String|HTMLElement, latlng: LatLng, options?: Tooltip options): this
    	// Creates a tooltip with the specified content and options and open it.
    	openTooltip: function (tooltip, latlng, options) {
    		if (!(tooltip instanceof Tooltip)) {
    			tooltip = new Tooltip(options).setContent(tooltip);
    		}

    		if (latlng) {
    			tooltip.setLatLng(latlng);
    		}

    		if (this.hasLayer(tooltip)) {
    			return this;
    		}

    		return this.addLayer(tooltip);
    	},

    	// @method closeTooltip(tooltip?: Tooltip): this
    	// Closes the tooltip given as parameter.
    	closeTooltip: function (tooltip) {
    		if (tooltip) {
    			this.removeLayer(tooltip);
    		}
    		return this;
    	}

    });

    /*
     * @namespace Layer
     * @section Tooltip methods example
     *
     * All layers share a set of methods convenient for binding tooltips to it.
     *
     * ```js
     * var layer = L.Polygon(latlngs).bindTooltip('Hi There!').addTo(map);
     * layer.openTooltip();
     * layer.closeTooltip();
     * ```
     */

    // @section Tooltip methods
    Layer.include({

    	// @method bindTooltip(content: String|HTMLElement|Function|Tooltip, options?: Tooltip options): this
    	// Binds a tooltip to the layer with the passed `content` and sets up the
    	// necessary event listeners. If a `Function` is passed it will receive
    	// the layer as the first argument and should return a `String` or `HTMLElement`.
    	bindTooltip: function (content, options) {

    		if (content instanceof Tooltip) {
    			setOptions(content, options);
    			this._tooltip = content;
    			content._source = this;
    		} else {
    			if (!this._tooltip || options) {
    				this._tooltip = new Tooltip(options, this);
    			}
    			this._tooltip.setContent(content);

    		}

    		this._initTooltipInteractions();

    		if (this._tooltip.options.permanent && this._map && this._map.hasLayer(this)) {
    			this.openTooltip();
    		}

    		return this;
    	},

    	// @method unbindTooltip(): this
    	// Removes the tooltip previously bound with `bindTooltip`.
    	unbindTooltip: function () {
    		if (this._tooltip) {
    			this._initTooltipInteractions(true);
    			this.closeTooltip();
    			this._tooltip = null;
    		}
    		return this;
    	},

    	_initTooltipInteractions: function (remove) {
    		if (!remove && this._tooltipHandlersAdded) { return; }
    		var onOff = remove ? 'off' : 'on',
    		    events = {
    			remove: this.closeTooltip,
    			move: this._moveTooltip
    		    };
    		if (!this._tooltip.options.permanent) {
    			events.mouseover = this._openTooltip;
    			events.mouseout = this.closeTooltip;
    			if (this._tooltip.options.sticky) {
    				events.mousemove = this._moveTooltip;
    			}
    			if (touch) {
    				events.click = this._openTooltip;
    			}
    		} else {
    			events.add = this._openTooltip;
    		}
    		this[onOff](events);
    		this._tooltipHandlersAdded = !remove;
    	},

    	// @method openTooltip(latlng?: LatLng): this
    	// Opens the bound tooltip at the specified `latlng` or at the default tooltip anchor if no `latlng` is passed.
    	openTooltip: function (layer, latlng) {
    		if (this._tooltip && this._map) {
    			latlng = this._tooltip._prepareOpen(this, layer, latlng);

    			// open the tooltip on the map
    			this._map.openTooltip(this._tooltip, latlng);

    			// Tooltip container may not be defined if not permanent and never
    			// opened.
    			if (this._tooltip.options.interactive && this._tooltip._container) {
    				addClass(this._tooltip._container, 'leaflet-clickable');
    				this.addInteractiveTarget(this._tooltip._container);
    			}
    		}

    		return this;
    	},

    	// @method closeTooltip(): this
    	// Closes the tooltip bound to this layer if it is open.
    	closeTooltip: function () {
    		if (this._tooltip) {
    			this._tooltip._close();
    			if (this._tooltip.options.interactive && this._tooltip._container) {
    				removeClass(this._tooltip._container, 'leaflet-clickable');
    				this.removeInteractiveTarget(this._tooltip._container);
    			}
    		}
    		return this;
    	},

    	// @method toggleTooltip(): this
    	// Opens or closes the tooltip bound to this layer depending on its current state.
    	toggleTooltip: function (target) {
    		if (this._tooltip) {
    			if (this._tooltip._map) {
    				this.closeTooltip();
    			} else {
    				this.openTooltip(target);
    			}
    		}
    		return this;
    	},

    	// @method isTooltipOpen(): boolean
    	// Returns `true` if the tooltip bound to this layer is currently open.
    	isTooltipOpen: function () {
    		return this._tooltip.isOpen();
    	},

    	// @method setTooltipContent(content: String|HTMLElement|Tooltip): this
    	// Sets the content of the tooltip bound to this layer.
    	setTooltipContent: function (content) {
    		if (this._tooltip) {
    			this._tooltip.setContent(content);
    		}
    		return this;
    	},

    	// @method getTooltip(): Tooltip
    	// Returns the tooltip bound to this layer.
    	getTooltip: function () {
    		return this._tooltip;
    	},

    	_openTooltip: function (e) {
    		var layer = e.layer || e.target;

    		if (!this._tooltip || !this._map) {
    			return;
    		}
    		this.openTooltip(layer, this._tooltip.options.sticky ? e.latlng : undefined);
    	},

    	_moveTooltip: function (e) {
    		var latlng = e.latlng, containerPoint, layerPoint;
    		if (this._tooltip.options.sticky && e.originalEvent) {
    			containerPoint = this._map.mouseEventToContainerPoint(e.originalEvent);
    			layerPoint = this._map.containerPointToLayerPoint(containerPoint);
    			latlng = this._map.layerPointToLatLng(layerPoint);
    		}
    		this._tooltip.setLatLng(latlng);
    	}
    });

    /*
     * @class GridLayer
     * @inherits Layer
     * @aka L.GridLayer
     *
     * Generic class for handling a tiled grid of HTML elements. This is the base class for all tile layers and replaces `TileLayer.Canvas`.
     * GridLayer can be extended to create a tiled grid of HTML elements like `<canvas>`, `<img>` or `<div>`. GridLayer will handle creating and animating these DOM elements for you.
     *
     *
     * @section Synchronous usage
     * @example
     *
     * To create a custom layer, extend GridLayer and implement the `createTile()` method, which will be passed a `Point` object with the `x`, `y`, and `z` (zoom level) coordinates to draw your tile.
     *
     * ```js
     * var CanvasLayer = L.GridLayer.extend({
     *     createTile: function(coords){
     *         // create a <canvas> element for drawing
     *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
     *
     *         // setup tile width and height according to the options
     *         var size = this.getTileSize();
     *         tile.width = size.x;
     *         tile.height = size.y;
     *
     *         // get a canvas context and draw something on it using coords.x, coords.y and coords.z
     *         var ctx = tile.getContext('2d');
     *
     *         // return the tile so it can be rendered on screen
     *         return tile;
     *     }
     * });
     * ```
     *
     * @section Asynchronous usage
     * @example
     *
     * Tile creation can also be asynchronous, this is useful when using a third-party drawing library. Once the tile is finished drawing it can be passed to the `done()` callback.
     *
     * ```js
     * var CanvasLayer = L.GridLayer.extend({
     *     createTile: function(coords, done){
     *         var error;
     *
     *         // create a <canvas> element for drawing
     *         var tile = L.DomUtil.create('canvas', 'leaflet-tile');
     *
     *         // setup tile width and height according to the options
     *         var size = this.getTileSize();
     *         tile.width = size.x;
     *         tile.height = size.y;
     *
     *         // draw something asynchronously and pass the tile to the done() callback
     *         setTimeout(function() {
     *             done(error, tile);
     *         }, 1000);
     *
     *         return tile;
     *     }
     * });
     * ```
     *
     * @section
     */


    var GridLayer = Layer.extend({

    	// @section
    	// @aka GridLayer options
    	options: {
    		// @option tileSize: Number|Point = 256
    		// Width and height of tiles in the grid. Use a number if width and height are equal, or `L.point(width, height)` otherwise.
    		tileSize: 256,

    		// @option opacity: Number = 1.0
    		// Opacity of the tiles. Can be used in the `createTile()` function.
    		opacity: 1,

    		// @option updateWhenIdle: Boolean = (depends)
    		// Load new tiles only when panning ends.
    		// `true` by default on mobile browsers, in order to avoid too many requests and keep smooth navigation.
    		// `false` otherwise in order to display new tiles _during_ panning, since it is easy to pan outside the
    		// [`keepBuffer`](#gridlayer-keepbuffer) option in desktop browsers.
    		updateWhenIdle: mobile,

    		// @option updateWhenZooming: Boolean = true
    		// By default, a smooth zoom animation (during a [touch zoom](#map-touchzoom) or a [`flyTo()`](#map-flyto)) will update grid layers every integer zoom level. Setting this option to `false` will update the grid layer only when the smooth animation ends.
    		updateWhenZooming: true,

    		// @option updateInterval: Number = 200
    		// Tiles will not update more than once every `updateInterval` milliseconds when panning.
    		updateInterval: 200,

    		// @option zIndex: Number = 1
    		// The explicit zIndex of the tile layer.
    		zIndex: 1,

    		// @option bounds: LatLngBounds = undefined
    		// If set, tiles will only be loaded inside the set `LatLngBounds`.
    		bounds: null,

    		// @option minZoom: Number = 0
    		// The minimum zoom level down to which this layer will be displayed (inclusive).
    		minZoom: 0,

    		// @option maxZoom: Number = undefined
    		// The maximum zoom level up to which this layer will be displayed (inclusive).
    		maxZoom: undefined,

    		// @option maxNativeZoom: Number = undefined
    		// Maximum zoom number the tile source has available. If it is specified,
    		// the tiles on all zoom levels higher than `maxNativeZoom` will be loaded
    		// from `maxNativeZoom` level and auto-scaled.
    		maxNativeZoom: undefined,

    		// @option minNativeZoom: Number = undefined
    		// Minimum zoom number the tile source has available. If it is specified,
    		// the tiles on all zoom levels lower than `minNativeZoom` will be loaded
    		// from `minNativeZoom` level and auto-scaled.
    		minNativeZoom: undefined,

    		// @option noWrap: Boolean = false
    		// Whether the layer is wrapped around the antimeridian. If `true`, the
    		// GridLayer will only be displayed once at low zoom levels. Has no
    		// effect when the [map CRS](#map-crs) doesn't wrap around. Can be used
    		// in combination with [`bounds`](#gridlayer-bounds) to prevent requesting
    		// tiles outside the CRS limits.
    		noWrap: false,

    		// @option pane: String = 'tilePane'
    		// `Map pane` where the grid layer will be added.
    		pane: 'tilePane',

    		// @option className: String = ''
    		// A custom class name to assign to the tile layer. Empty by default.
    		className: '',

    		// @option keepBuffer: Number = 2
    		// When panning the map, keep this many rows and columns of tiles before unloading them.
    		keepBuffer: 2
    	},

    	initialize: function (options) {
    		setOptions(this, options);
    	},

    	onAdd: function () {
    		this._initContainer();

    		this._levels = {};
    		this._tiles = {};

    		this._resetView();
    		this._update();
    	},

    	beforeAdd: function (map) {
    		map._addZoomLimit(this);
    	},

    	onRemove: function (map) {
    		this._removeAllTiles();
    		remove(this._container);
    		map._removeZoomLimit(this);
    		this._container = null;
    		this._tileZoom = undefined;
    	},

    	// @method bringToFront: this
    	// Brings the tile layer to the top of all tile layers.
    	bringToFront: function () {
    		if (this._map) {
    			toFront(this._container);
    			this._setAutoZIndex(Math.max);
    		}
    		return this;
    	},

    	// @method bringToBack: this
    	// Brings the tile layer to the bottom of all tile layers.
    	bringToBack: function () {
    		if (this._map) {
    			toBack(this._container);
    			this._setAutoZIndex(Math.min);
    		}
    		return this;
    	},

    	// @method getContainer: HTMLElement
    	// Returns the HTML element that contains the tiles for this layer.
    	getContainer: function () {
    		return this._container;
    	},

    	// @method setOpacity(opacity: Number): this
    	// Changes the [opacity](#gridlayer-opacity) of the grid layer.
    	setOpacity: function (opacity) {
    		this.options.opacity = opacity;
    		this._updateOpacity();
    		return this;
    	},

    	// @method setZIndex(zIndex: Number): this
    	// Changes the [zIndex](#gridlayer-zindex) of the grid layer.
    	setZIndex: function (zIndex) {
    		this.options.zIndex = zIndex;
    		this._updateZIndex();

    		return this;
    	},

    	// @method isLoading: Boolean
    	// Returns `true` if any tile in the grid layer has not finished loading.
    	isLoading: function () {
    		return this._loading;
    	},

    	// @method redraw: this
    	// Causes the layer to clear all the tiles and request them again.
    	redraw: function () {
    		if (this._map) {
    			this._removeAllTiles();
    			this._update();
    		}
    		return this;
    	},

    	getEvents: function () {
    		var events = {
    			viewprereset: this._invalidateAll,
    			viewreset: this._resetView,
    			zoom: this._resetView,
    			moveend: this._onMoveEnd
    		};

    		if (!this.options.updateWhenIdle) {
    			// update tiles on move, but not more often than once per given interval
    			if (!this._onMove) {
    				this._onMove = throttle(this._onMoveEnd, this.options.updateInterval, this);
    			}

    			events.move = this._onMove;
    		}

    		if (this._zoomAnimated) {
    			events.zoomanim = this._animateZoom;
    		}

    		return events;
    	},

    	// @section Extension methods
    	// Layers extending `GridLayer` shall reimplement the following method.
    	// @method createTile(coords: Object, done?: Function): HTMLElement
    	// Called only internally, must be overridden by classes extending `GridLayer`.
    	// Returns the `HTMLElement` corresponding to the given `coords`. If the `done` callback
    	// is specified, it must be called when the tile has finished loading and drawing.
    	createTile: function () {
    		return document.createElement('div');
    	},

    	// @section
    	// @method getTileSize: Point
    	// Normalizes the [tileSize option](#gridlayer-tilesize) into a point. Used by the `createTile()` method.
    	getTileSize: function () {
    		var s = this.options.tileSize;
    		return s instanceof Point ? s : new Point(s, s);
    	},

    	_updateZIndex: function () {
    		if (this._container && this.options.zIndex !== undefined && this.options.zIndex !== null) {
    			this._container.style.zIndex = this.options.zIndex;
    		}
    	},

    	_setAutoZIndex: function (compare) {
    		// go through all other layers of the same pane, set zIndex to max + 1 (front) or min - 1 (back)

    		var layers = this.getPane().children,
    		    edgeZIndex = -compare(-Infinity, Infinity); // -Infinity for max, Infinity for min

    		for (var i = 0, len = layers.length, zIndex; i < len; i++) {

    			zIndex = layers[i].style.zIndex;

    			if (layers[i] !== this._container && zIndex) {
    				edgeZIndex = compare(edgeZIndex, +zIndex);
    			}
    		}

    		if (isFinite(edgeZIndex)) {
    			this.options.zIndex = edgeZIndex + compare(-1, 1);
    			this._updateZIndex();
    		}
    	},

    	_updateOpacity: function () {
    		if (!this._map) { return; }

    		// IE doesn't inherit filter opacity properly, so we're forced to set it on tiles
    		if (ielt9) { return; }

    		setOpacity(this._container, this.options.opacity);

    		var now = +new Date(),
    		    nextFrame = false,
    		    willPrune = false;

    		for (var key in this._tiles) {
    			var tile = this._tiles[key];
    			if (!tile.current || !tile.loaded) { continue; }

    			var fade = Math.min(1, (now - tile.loaded) / 200);

    			setOpacity(tile.el, fade);
    			if (fade < 1) {
    				nextFrame = true;
    			} else {
    				if (tile.active) {
    					willPrune = true;
    				} else {
    					this._onOpaqueTile(tile);
    				}
    				tile.active = true;
    			}
    		}

    		if (willPrune && !this._noPrune) { this._pruneTiles(); }

    		if (nextFrame) {
    			cancelAnimFrame(this._fadeFrame);
    			this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
    		}
    	},

    	_onOpaqueTile: falseFn,

    	_initContainer: function () {
    		if (this._container) { return; }

    		this._container = create$1('div', 'leaflet-layer ' + (this.options.className || ''));
    		this._updateZIndex();

    		if (this.options.opacity < 1) {
    			this._updateOpacity();
    		}

    		this.getPane().appendChild(this._container);
    	},

    	_updateLevels: function () {

    		var zoom = this._tileZoom,
    		    maxZoom = this.options.maxZoom;

    		if (zoom === undefined) { return undefined; }

    		for (var z in this._levels) {
    			z = Number(z);
    			if (this._levels[z].el.children.length || z === zoom) {
    				this._levels[z].el.style.zIndex = maxZoom - Math.abs(zoom - z);
    				this._onUpdateLevel(z);
    			} else {
    				remove(this._levels[z].el);
    				this._removeTilesAtZoom(z);
    				this._onRemoveLevel(z);
    				delete this._levels[z];
    			}
    		}

    		var level = this._levels[zoom],
    		    map = this._map;

    		if (!level) {
    			level = this._levels[zoom] = {};

    			level.el = create$1('div', 'leaflet-tile-container leaflet-zoom-animated', this._container);
    			level.el.style.zIndex = maxZoom;

    			level.origin = map.project(map.unproject(map.getPixelOrigin()), zoom).round();
    			level.zoom = zoom;

    			this._setZoomTransform(level, map.getCenter(), map.getZoom());

    			// force the browser to consider the newly added element for transition
    			falseFn(level.el.offsetWidth);

    			this._onCreateLevel(level);
    		}

    		this._level = level;

    		return level;
    	},

    	_onUpdateLevel: falseFn,

    	_onRemoveLevel: falseFn,

    	_onCreateLevel: falseFn,

    	_pruneTiles: function () {
    		if (!this._map) {
    			return;
    		}

    		var key, tile;

    		var zoom = this._map.getZoom();
    		if (zoom > this.options.maxZoom ||
    			zoom < this.options.minZoom) {
    			this._removeAllTiles();
    			return;
    		}

    		for (key in this._tiles) {
    			tile = this._tiles[key];
    			tile.retain = tile.current;
    		}

    		for (key in this._tiles) {
    			tile = this._tiles[key];
    			if (tile.current && !tile.active) {
    				var coords = tile.coords;
    				if (!this._retainParent(coords.x, coords.y, coords.z, coords.z - 5)) {
    					this._retainChildren(coords.x, coords.y, coords.z, coords.z + 2);
    				}
    			}
    		}

    		for (key in this._tiles) {
    			if (!this._tiles[key].retain) {
    				this._removeTile(key);
    			}
    		}
    	},

    	_removeTilesAtZoom: function (zoom) {
    		for (var key in this._tiles) {
    			if (this._tiles[key].coords.z !== zoom) {
    				continue;
    			}
    			this._removeTile(key);
    		}
    	},

    	_removeAllTiles: function () {
    		for (var key in this._tiles) {
    			this._removeTile(key);
    		}
    	},

    	_invalidateAll: function () {
    		for (var z in this._levels) {
    			remove(this._levels[z].el);
    			this._onRemoveLevel(Number(z));
    			delete this._levels[z];
    		}
    		this._removeAllTiles();

    		this._tileZoom = undefined;
    	},

    	_retainParent: function (x, y, z, minZoom) {
    		var x2 = Math.floor(x / 2),
    		    y2 = Math.floor(y / 2),
    		    z2 = z - 1,
    		    coords2 = new Point(+x2, +y2);
    		coords2.z = +z2;

    		var key = this._tileCoordsToKey(coords2),
    		    tile = this._tiles[key];

    		if (tile && tile.active) {
    			tile.retain = true;
    			return true;

    		} else if (tile && tile.loaded) {
    			tile.retain = true;
    		}

    		if (z2 > minZoom) {
    			return this._retainParent(x2, y2, z2, minZoom);
    		}

    		return false;
    	},

    	_retainChildren: function (x, y, z, maxZoom) {

    		for (var i = 2 * x; i < 2 * x + 2; i++) {
    			for (var j = 2 * y; j < 2 * y + 2; j++) {

    				var coords = new Point(i, j);
    				coords.z = z + 1;

    				var key = this._tileCoordsToKey(coords),
    				    tile = this._tiles[key];

    				if (tile && tile.active) {
    					tile.retain = true;
    					continue;

    				} else if (tile && tile.loaded) {
    					tile.retain = true;
    				}

    				if (z + 1 < maxZoom) {
    					this._retainChildren(i, j, z + 1, maxZoom);
    				}
    			}
    		}
    	},

    	_resetView: function (e) {
    		var animating = e && (e.pinch || e.flyTo);
    		this._setView(this._map.getCenter(), this._map.getZoom(), animating, animating);
    	},

    	_animateZoom: function (e) {
    		this._setView(e.center, e.zoom, true, e.noUpdate);
    	},

    	_clampZoom: function (zoom) {
    		var options = this.options;

    		if (undefined !== options.minNativeZoom && zoom < options.minNativeZoom) {
    			return options.minNativeZoom;
    		}

    		if (undefined !== options.maxNativeZoom && options.maxNativeZoom < zoom) {
    			return options.maxNativeZoom;
    		}

    		return zoom;
    	},

    	_setView: function (center, zoom, noPrune, noUpdate) {
    		var tileZoom = Math.round(zoom);
    		if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
    		    (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
    			tileZoom = undefined;
    		} else {
    			tileZoom = this._clampZoom(tileZoom);
    		}

    		var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);

    		if (!noUpdate || tileZoomChanged) {

    			this._tileZoom = tileZoom;

    			if (this._abortLoading) {
    				this._abortLoading();
    			}

    			this._updateLevels();
    			this._resetGrid();

    			if (tileZoom !== undefined) {
    				this._update(center);
    			}

    			if (!noPrune) {
    				this._pruneTiles();
    			}

    			// Flag to prevent _updateOpacity from pruning tiles during
    			// a zoom anim or a pinch gesture
    			this._noPrune = !!noPrune;
    		}

    		this._setZoomTransforms(center, zoom);
    	},

    	_setZoomTransforms: function (center, zoom) {
    		for (var i in this._levels) {
    			this._setZoomTransform(this._levels[i], center, zoom);
    		}
    	},

    	_setZoomTransform: function (level, center, zoom) {
    		var scale = this._map.getZoomScale(zoom, level.zoom),
    		    translate = level.origin.multiplyBy(scale)
    		        .subtract(this._map._getNewPixelOrigin(center, zoom)).round();

    		if (any3d) {
    			setTransform(level.el, translate, scale);
    		} else {
    			setPosition(level.el, translate);
    		}
    	},

    	_resetGrid: function () {
    		var map = this._map,
    		    crs = map.options.crs,
    		    tileSize = this._tileSize = this.getTileSize(),
    		    tileZoom = this._tileZoom;

    		var bounds = this._map.getPixelWorldBounds(this._tileZoom);
    		if (bounds) {
    			this._globalTileRange = this._pxBoundsToTileRange(bounds);
    		}

    		this._wrapX = crs.wrapLng && !this.options.noWrap && [
    			Math.floor(map.project([0, crs.wrapLng[0]], tileZoom).x / tileSize.x),
    			Math.ceil(map.project([0, crs.wrapLng[1]], tileZoom).x / tileSize.y)
    		];
    		this._wrapY = crs.wrapLat && !this.options.noWrap && [
    			Math.floor(map.project([crs.wrapLat[0], 0], tileZoom).y / tileSize.x),
    			Math.ceil(map.project([crs.wrapLat[1], 0], tileZoom).y / tileSize.y)
    		];
    	},

    	_onMoveEnd: function () {
    		if (!this._map || this._map._animatingZoom) { return; }

    		this._update();
    	},

    	_getTiledPixelBounds: function (center) {
    		var map = this._map,
    		    mapZoom = map._animatingZoom ? Math.max(map._animateToZoom, map.getZoom()) : map.getZoom(),
    		    scale = map.getZoomScale(mapZoom, this._tileZoom),
    		    pixelCenter = map.project(center, this._tileZoom).floor(),
    		    halfSize = map.getSize().divideBy(scale * 2);

    		return new Bounds(pixelCenter.subtract(halfSize), pixelCenter.add(halfSize));
    	},

    	// Private method to load tiles in the grid's active zoom level according to map bounds
    	_update: function (center) {
    		var map = this._map;
    		if (!map) { return; }
    		var zoom = this._clampZoom(map.getZoom());

    		if (center === undefined) { center = map.getCenter(); }
    		if (this._tileZoom === undefined) { return; }	// if out of minzoom/maxzoom

    		var pixelBounds = this._getTiledPixelBounds(center),
    		    tileRange = this._pxBoundsToTileRange(pixelBounds),
    		    tileCenter = tileRange.getCenter(),
    		    queue = [],
    		    margin = this.options.keepBuffer,
    		    noPruneRange = new Bounds(tileRange.getBottomLeft().subtract([margin, -margin]),
    		                              tileRange.getTopRight().add([margin, -margin]));

    		// Sanity check: panic if the tile range contains Infinity somewhere.
    		if (!(isFinite(tileRange.min.x) &&
    		      isFinite(tileRange.min.y) &&
    		      isFinite(tileRange.max.x) &&
    		      isFinite(tileRange.max.y))) { throw new Error('Attempted to load an infinite number of tiles'); }

    		for (var key in this._tiles) {
    			var c = this._tiles[key].coords;
    			if (c.z !== this._tileZoom || !noPruneRange.contains(new Point(c.x, c.y))) {
    				this._tiles[key].current = false;
    			}
    		}

    		// _update just loads more tiles. If the tile zoom level differs too much
    		// from the map's, let _setView reset levels and prune old tiles.
    		if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

    		// create a queue of coordinates to load tiles from
    		for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
    			for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
    				var coords = new Point(i, j);
    				coords.z = this._tileZoom;

    				if (!this._isValidTile(coords)) { continue; }

    				var tile = this._tiles[this._tileCoordsToKey(coords)];
    				if (tile) {
    					tile.current = true;
    				} else {
    					queue.push(coords);
    				}
    			}
    		}

    		// sort tile queue to load tiles in order of their distance to center
    		queue.sort(function (a, b) {
    			return a.distanceTo(tileCenter) - b.distanceTo(tileCenter);
    		});

    		if (queue.length !== 0) {
    			// if it's the first batch of tiles to load
    			if (!this._loading) {
    				this._loading = true;
    				// @event loading: Event
    				// Fired when the grid layer starts loading tiles.
    				this.fire('loading');
    			}

    			// create DOM fragment to append tiles in one batch
    			var fragment = document.createDocumentFragment();

    			for (i = 0; i < queue.length; i++) {
    				this._addTile(queue[i], fragment);
    			}

    			this._level.el.appendChild(fragment);
    		}
    	},

    	_isValidTile: function (coords) {
    		var crs = this._map.options.crs;

    		if (!crs.infinite) {
    			// don't load tile if it's out of bounds and not wrapped
    			var bounds = this._globalTileRange;
    			if ((!crs.wrapLng && (coords.x < bounds.min.x || coords.x > bounds.max.x)) ||
    			    (!crs.wrapLat && (coords.y < bounds.min.y || coords.y > bounds.max.y))) { return false; }
    		}

    		if (!this.options.bounds) { return true; }

    		// don't load tile if it doesn't intersect the bounds in options
    		var tileBounds = this._tileCoordsToBounds(coords);
    		return toLatLngBounds(this.options.bounds).overlaps(tileBounds);
    	},

    	_keyToBounds: function (key) {
    		return this._tileCoordsToBounds(this._keyToTileCoords(key));
    	},

    	_tileCoordsToNwSe: function (coords) {
    		var map = this._map,
    		    tileSize = this.getTileSize(),
    		    nwPoint = coords.scaleBy(tileSize),
    		    sePoint = nwPoint.add(tileSize),
    		    nw = map.unproject(nwPoint, coords.z),
    		    se = map.unproject(sePoint, coords.z);
    		return [nw, se];
    	},

    	// converts tile coordinates to its geographical bounds
    	_tileCoordsToBounds: function (coords) {
    		var bp = this._tileCoordsToNwSe(coords),
    		    bounds = new LatLngBounds(bp[0], bp[1]);

    		if (!this.options.noWrap) {
    			bounds = this._map.wrapLatLngBounds(bounds);
    		}
    		return bounds;
    	},
    	// converts tile coordinates to key for the tile cache
    	_tileCoordsToKey: function (coords) {
    		return coords.x + ':' + coords.y + ':' + coords.z;
    	},

    	// converts tile cache key to coordinates
    	_keyToTileCoords: function (key) {
    		var k = key.split(':'),
    		    coords = new Point(+k[0], +k[1]);
    		coords.z = +k[2];
    		return coords;
    	},

    	_removeTile: function (key) {
    		var tile = this._tiles[key];
    		if (!tile) { return; }

    		remove(tile.el);

    		delete this._tiles[key];

    		// @event tileunload: TileEvent
    		// Fired when a tile is removed (e.g. when a tile goes off the screen).
    		this.fire('tileunload', {
    			tile: tile.el,
    			coords: this._keyToTileCoords(key)
    		});
    	},

    	_initTile: function (tile) {
    		addClass(tile, 'leaflet-tile');

    		var tileSize = this.getTileSize();
    		tile.style.width = tileSize.x + 'px';
    		tile.style.height = tileSize.y + 'px';

    		tile.onselectstart = falseFn;
    		tile.onmousemove = falseFn;

    		// update opacity on tiles in IE7-8 because of filter inheritance problems
    		if (ielt9 && this.options.opacity < 1) {
    			setOpacity(tile, this.options.opacity);
    		}

    		// without this hack, tiles disappear after zoom on Chrome for Android
    		// https://github.com/Leaflet/Leaflet/issues/2078
    		if (android && !android23) {
    			tile.style.WebkitBackfaceVisibility = 'hidden';
    		}
    	},

    	_addTile: function (coords, container) {
    		var tilePos = this._getTilePos(coords),
    		    key = this._tileCoordsToKey(coords);

    		var tile = this.createTile(this._wrapCoords(coords), bind$1(this._tileReady, this, coords));

    		this._initTile(tile);

    		// if createTile is defined with a second argument ("done" callback),
    		// we know that tile is async and will be ready later; otherwise
    		if (this.createTile.length < 2) {
    			// mark tile as ready, but delay one frame for opacity animation to happen
    			requestAnimFrame(bind$1(this._tileReady, this, coords, null, tile));
    		}

    		setPosition(tile, tilePos);

    		// save tile in cache
    		this._tiles[key] = {
    			el: tile,
    			coords: coords,
    			current: true
    		};

    		container.appendChild(tile);
    		// @event tileloadstart: TileEvent
    		// Fired when a tile is requested and starts loading.
    		this.fire('tileloadstart', {
    			tile: tile,
    			coords: coords
    		});
    	},

    	_tileReady: function (coords, err, tile) {
    		if (err) {
    			// @event tileerror: TileErrorEvent
    			// Fired when there is an error loading a tile.
    			this.fire('tileerror', {
    				error: err,
    				tile: tile,
    				coords: coords
    			});
    		}

    		var key = this._tileCoordsToKey(coords);

    		tile = this._tiles[key];
    		if (!tile) { return; }

    		tile.loaded = +new Date();
    		if (this._map._fadeAnimated) {
    			setOpacity(tile.el, 0);
    			cancelAnimFrame(this._fadeFrame);
    			this._fadeFrame = requestAnimFrame(this._updateOpacity, this);
    		} else {
    			tile.active = true;
    			this._pruneTiles();
    		}

    		if (!err) {
    			addClass(tile.el, 'leaflet-tile-loaded');

    			// @event tileload: TileEvent
    			// Fired when a tile loads.
    			this.fire('tileload', {
    				tile: tile.el,
    				coords: coords
    			});
    		}

    		if (this._noTilesToLoad()) {
    			this._loading = false;
    			// @event load: Event
    			// Fired when the grid layer loaded all visible tiles.
    			this.fire('load');

    			if (ielt9 || !this._map._fadeAnimated) {
    				requestAnimFrame(this._pruneTiles, this);
    			} else {
    				// Wait a bit more than 0.2 secs (the duration of the tile fade-in)
    				// to trigger a pruning.
    				setTimeout(bind$1(this._pruneTiles, this), 250);
    			}
    		}
    	},

    	_getTilePos: function (coords) {
    		return coords.scaleBy(this.getTileSize()).subtract(this._level.origin);
    	},

    	_wrapCoords: function (coords) {
    		var newCoords = new Point(
    			this._wrapX ? wrapNum(coords.x, this._wrapX) : coords.x,
    			this._wrapY ? wrapNum(coords.y, this._wrapY) : coords.y);
    		newCoords.z = coords.z;
    		return newCoords;
    	},

    	_pxBoundsToTileRange: function (bounds) {
    		var tileSize = this.getTileSize();
    		return new Bounds(
    			bounds.min.unscaleBy(tileSize).floor(),
    			bounds.max.unscaleBy(tileSize).ceil().subtract([1, 1]));
    	},

    	_noTilesToLoad: function () {
    		for (var key in this._tiles) {
    			if (!this._tiles[key].loaded) { return false; }
    		}
    		return true;
    	}
    });

    /*
     * @class TileLayer
     * @inherits GridLayer
     * @aka L.TileLayer
     * Used to load and display tile layers on the map. Note that most tile servers require attribution, which you can set under `Layer`. Extends `GridLayer`.
     *
     * @example
     *
     * ```js
     * L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png?{foo}', {foo: 'bar', attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'}).addTo(map);
     * ```
     *
     * @section URL template
     * @example
     *
     * A string of the following form:
     *
     * ```
     * 'http://{s}.somedomain.com/blabla/{z}/{x}/{y}{r}.png'
     * ```
     *
     * `{s}` means one of the available subdomains (used sequentially to help with browser parallel requests per domain limitation; subdomain values are specified in options; `a`, `b` or `c` by default, can be omitted), `{z}` — zoom level, `{x}` and `{y}` — tile coordinates. `{r}` can be used to add "&commat;2x" to the URL to load retina tiles.
     *
     * You can use custom keys in the template, which will be [evaluated](#util-template) from TileLayer options, like this:
     *
     * ```
     * L.tileLayer('http://{s}.somedomain.com/{foo}/{z}/{x}/{y}.png', {foo: 'bar'});
     * ```
     */


    var TileLayer = GridLayer.extend({

    	// @section
    	// @aka TileLayer options
    	options: {
    		// @option minZoom: Number = 0
    		// The minimum zoom level down to which this layer will be displayed (inclusive).
    		minZoom: 0,

    		// @option maxZoom: Number = 18
    		// The maximum zoom level up to which this layer will be displayed (inclusive).
    		maxZoom: 18,

    		// @option subdomains: String|String[] = 'abc'
    		// Subdomains of the tile service. Can be passed in the form of one string (where each letter is a subdomain name) or an array of strings.
    		subdomains: 'abc',

    		// @option errorTileUrl: String = ''
    		// URL to the tile image to show in place of the tile that failed to load.
    		errorTileUrl: '',

    		// @option zoomOffset: Number = 0
    		// The zoom number used in tile URLs will be offset with this value.
    		zoomOffset: 0,

    		// @option tms: Boolean = false
    		// If `true`, inverses Y axis numbering for tiles (turn this on for [TMS](https://en.wikipedia.org/wiki/Tile_Map_Service) services).
    		tms: false,

    		// @option zoomReverse: Boolean = false
    		// If set to true, the zoom number used in tile URLs will be reversed (`maxZoom - zoom` instead of `zoom`)
    		zoomReverse: false,

    		// @option detectRetina: Boolean = false
    		// If `true` and user is on a retina display, it will request four tiles of half the specified size and a bigger zoom level in place of one to utilize the high resolution.
    		detectRetina: false,

    		// @option crossOrigin: Boolean|String = false
    		// Whether the crossOrigin attribute will be added to the tiles.
    		// If a String is provided, all tiles will have their crossOrigin attribute set to the String provided. This is needed if you want to access tile pixel data.
    		// Refer to [CORS Settings](https://developer.mozilla.org/en-US/docs/Web/HTML/CORS_settings_attributes) for valid String values.
    		crossOrigin: false
    	},

    	initialize: function (url, options) {

    		this._url = url;

    		options = setOptions(this, options);

    		// detecting retina displays, adjusting tileSize and zoom levels
    		if (options.detectRetina && retina && options.maxZoom > 0) {

    			options.tileSize = Math.floor(options.tileSize / 2);

    			if (!options.zoomReverse) {
    				options.zoomOffset++;
    				options.maxZoom--;
    			} else {
    				options.zoomOffset--;
    				options.minZoom++;
    			}

    			options.minZoom = Math.max(0, options.minZoom);
    		}

    		if (typeof options.subdomains === 'string') {
    			options.subdomains = options.subdomains.split('');
    		}

    		// for https://github.com/Leaflet/Leaflet/issues/137
    		if (!android) {
    			this.on('tileunload', this._onTileRemove);
    		}
    	},

    	// @method setUrl(url: String, noRedraw?: Boolean): this
    	// Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
    	// If the URL does not change, the layer will not be redrawn unless
    	// the noRedraw parameter is set to false.
    	setUrl: function (url, noRedraw) {
    		if (this._url === url && noRedraw === undefined) {
    			noRedraw = true;
    		}

    		this._url = url;

    		if (!noRedraw) {
    			this.redraw();
    		}
    		return this;
    	},

    	// @method createTile(coords: Object, done?: Function): HTMLElement
    	// Called only internally, overrides GridLayer's [`createTile()`](#gridlayer-createtile)
    	// to return an `<img>` HTML element with the appropriate image URL given `coords`. The `done`
    	// callback is called when the tile has been loaded.
    	createTile: function (coords, done) {
    		var tile = document.createElement('img');

    		on(tile, 'load', bind$1(this._tileOnLoad, this, done, tile));
    		on(tile, 'error', bind$1(this._tileOnError, this, done, tile));

    		if (this.options.crossOrigin || this.options.crossOrigin === '') {
    			tile.crossOrigin = this.options.crossOrigin === true ? '' : this.options.crossOrigin;
    		}

    		/*
    		 Alt tag is set to empty string to keep screen readers from reading URL and for compliance reasons
    		 http://www.w3.org/TR/WCAG20-TECHS/H67
    		*/
    		tile.alt = '';

    		/*
    		 Set role="presentation" to force screen readers to ignore this
    		 https://www.w3.org/TR/wai-aria/roles#textalternativecomputation
    		*/
    		tile.setAttribute('role', 'presentation');

    		tile.src = this.getTileUrl(coords);

    		return tile;
    	},

    	// @section Extension methods
    	// @uninheritable
    	// Layers extending `TileLayer` might reimplement the following method.
    	// @method getTileUrl(coords: Object): String
    	// Called only internally, returns the URL for a tile given its coordinates.
    	// Classes extending `TileLayer` can override this function to provide custom tile URL naming schemes.
    	getTileUrl: function (coords) {
    		var data = {
    			r: retina ? '@2x' : '',
    			s: this._getSubdomain(coords),
    			x: coords.x,
    			y: coords.y,
    			z: this._getZoomForUrl()
    		};
    		if (this._map && !this._map.options.crs.infinite) {
    			var invertedY = this._globalTileRange.max.y - coords.y;
    			if (this.options.tms) {
    				data['y'] = invertedY;
    			}
    			data['-y'] = invertedY;
    		}

    		return template(this._url, extend(data, this.options));
    	},

    	_tileOnLoad: function (done, tile) {
    		// For https://github.com/Leaflet/Leaflet/issues/3332
    		if (ielt9) {
    			setTimeout(bind$1(done, this, null, tile), 0);
    		} else {
    			done(null, tile);
    		}
    	},

    	_tileOnError: function (done, tile, e) {
    		var errorUrl = this.options.errorTileUrl;
    		if (errorUrl && tile.getAttribute('src') !== errorUrl) {
    			tile.src = errorUrl;
    		}
    		done(e, tile);
    	},

    	_onTileRemove: function (e) {
    		e.tile.onload = null;
    	},

    	_getZoomForUrl: function () {
    		var zoom = this._tileZoom,
    		maxZoom = this.options.maxZoom,
    		zoomReverse = this.options.zoomReverse,
    		zoomOffset = this.options.zoomOffset;

    		if (zoomReverse) {
    			zoom = maxZoom - zoom;
    		}

    		return zoom + zoomOffset;
    	},

    	_getSubdomain: function (tilePoint) {
    		var index = Math.abs(tilePoint.x + tilePoint.y) % this.options.subdomains.length;
    		return this.options.subdomains[index];
    	},

    	// stops loading all tiles in the background layer
    	_abortLoading: function () {
    		var i, tile;
    		for (i in this._tiles) {
    			if (this._tiles[i].coords.z !== this._tileZoom) {
    				tile = this._tiles[i].el;

    				tile.onload = falseFn;
    				tile.onerror = falseFn;

    				if (!tile.complete) {
    					tile.src = emptyImageUrl;
    					remove(tile);
    					delete this._tiles[i];
    				}
    			}
    		}
    	},

    	_removeTile: function (key) {
    		var tile = this._tiles[key];
    		if (!tile) { return; }

    		// Cancels any pending http requests associated with the tile
    		// unless we're on Android's stock browser,
    		// see https://github.com/Leaflet/Leaflet/issues/137
    		if (!androidStock) {
    			tile.el.setAttribute('src', emptyImageUrl);
    		}

    		return GridLayer.prototype._removeTile.call(this, key);
    	},

    	_tileReady: function (coords, err, tile) {
    		if (!this._map || (tile && tile.getAttribute('src') === emptyImageUrl)) {
    			return;
    		}

    		return GridLayer.prototype._tileReady.call(this, coords, err, tile);
    	}
    });


    // @factory L.tilelayer(urlTemplate: String, options?: TileLayer options)
    // Instantiates a tile layer object given a `URL template` and optionally an options object.

    function tileLayer(url, options) {
    	return new TileLayer(url, options);
    }

    /* node_modules/svelte-leaflet/src/layers/tilelayer.svelte generated by Svelte v3.30.0 */

    function create_fragment$3(ctx) {
    	const block = {
    		c: noop,
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Tilelayer", slots, []);
    	let { url } = $$props;
    	let { options = {} } = $$props;
    	let map = getContext("leafletMapInstance");
    	let layer = tileLayer(url, options).addTo(map);
    	onDestroy(() => layer.remove());
    	const writable_props = ["url", "options"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tilelayer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    	};

    	$$self.$capture_state = () => ({
    		tileLayer,
    		getContext,
    		onDestroy,
    		url,
    		options,
    		map,
    		layer
    	});

    	$$self.$inject_state = $$props => {
    		if ("url" in $$props) $$invalidate(0, url = $$props.url);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("map" in $$props) map = $$props.map;
    		if ("layer" in $$props) layer = $$props.layer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [url, options];
    }

    class Tilelayer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { url: 0, options: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tilelayer",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*url*/ ctx[0] === undefined && !("url" in props)) {
    			console.warn("<Tilelayer> was created without expected prop 'url'");
    		}
    	}

    	get url() {
    		throw new Error("<Tilelayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set url(value) {
    		throw new Error("<Tilelayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<Tilelayer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<Tilelayer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.30.0 */

    const { console: console_1 } = globals;
    const file$2 = "src/App.svelte";

    // (75:0) {:else }
    function create_else_block(ctx) {
    	let p0;
    	let t1;
    	let p1;
    	let t3;
    	let p2;
    	let t5;
    	let p3;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "緯度";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "緯度";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "timezone";
    			t5 = space();
    			p3 = element("p");
    			p3.textContent = "現在の天気";
    			add_location(p0, file$2, 75, 4, 1810);
    			add_location(p1, file$2, 76, 4, 1825);
    			add_location(p2, file$2, 77, 4, 1840);
    			add_location(p3, file$2, 78, 4, 1861);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, p1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, p2, anchor);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p3, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(75:0) {:else }",
    		ctx
    	});

    	return block;
    }

    // (70:0) {#if data_json}
    function create_if_block_1(ctx) {
    	let p0;
    	let t0;
    	let t1_value = /*data_json*/ ctx[3].latitude + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3;
    	let t4_value = /*data_json*/ ctx[3].longitude + "";
    	let t4;
    	let t5;
    	let p2;
    	let t6;
    	let t7_value = /*data_json*/ ctx[3].timezone + "";
    	let t7;
    	let t8;
    	let p3;
    	let t9;
    	let t10_value = /*data_json*/ ctx[3].currently.summary + "";
    	let t10;

    	const block = {
    		c: function create() {
    			p0 = element("p");
    			t0 = text("緯度 ");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text("緯度 ");
    			t4 = text(t4_value);
    			t5 = space();
    			p2 = element("p");
    			t6 = text("timezone ");
    			t7 = text(t7_value);
    			t8 = space();
    			p3 = element("p");
    			t9 = text("現在の天気 ");
    			t10 = text(t10_value);
    			add_location(p0, file$2, 70, 4, 1642);
    			add_location(p1, file$2, 71, 4, 1677);
    			add_location(p2, file$2, 72, 4, 1713);
    			add_location(p3, file$2, 73, 4, 1754);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p0, anchor);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p1, anchor);
    			append_dev(p1, t3);
    			append_dev(p1, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p2, anchor);
    			append_dev(p2, t6);
    			append_dev(p2, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, p3, anchor);
    			append_dev(p3, t9);
    			append_dev(p3, t10);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*data_json*/ 8 && t1_value !== (t1_value = /*data_json*/ ctx[3].latitude + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*data_json*/ 8 && t4_value !== (t4_value = /*data_json*/ ctx[3].longitude + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*data_json*/ 8 && t7_value !== (t7_value = /*data_json*/ ctx[3].timezone + "")) set_data_dev(t7, t7_value);
    			if (dirty & /*data_json*/ 8 && t10_value !== (t10_value = /*data_json*/ ctx[3].currently.summary + "")) set_data_dev(t10, t10_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p0);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(p2);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(p3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(70:0) {#if data_json}",
    		ctx
    	});

    	return block;
    }

    // (105:1) {#if markerVisible}
    function create_if_block(ctx) {
    	let leafletmarker;
    	let updating_latLng;
    	let current;

    	function leafletmarker_latLng_binding(value) {
    		/*leafletmarker_latLng_binding*/ ctx[9].call(null, value);
    	}

    	let leafletmarker_props = {
    		options: { draggable: true },
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*markerLatLng*/ ctx[2] !== void 0) {
    		leafletmarker_props.latLng = /*markerLatLng*/ ctx[2];
    	}

    	leafletmarker = new Marker$1({
    			props: leafletmarker_props,
    			$$inline: true
    		});

    	binding_callbacks.push(() => bind(leafletmarker, "latLng", leafletmarker_latLng_binding));

    	const block = {
    		c: function create() {
    			create_component(leafletmarker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(leafletmarker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const leafletmarker_changes = {};

    			if (dirty & /*$$scope, markerName*/ 2050) {
    				leafletmarker_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_latLng && dirty & /*markerLatLng*/ 4) {
    				updating_latLng = true;
    				leafletmarker_changes.latLng = /*markerLatLng*/ ctx[2];
    				add_flush_callback(() => updating_latLng = false);
    			}

    			leafletmarker.$set(leafletmarker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leafletmarker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leafletmarker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leafletmarker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(105:1) {#if markerVisible}",
    		ctx
    	});

    	return block;
    }

    // (107:3) <LeafletPopup options={{ closeButton: false, closeOnClick: false }}>
    function create_default_slot_2(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text(/*markerName*/ ctx[1]);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*markerName*/ 2) set_data_dev(t, /*markerName*/ ctx[1]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(107:3) <LeafletPopup options={{ closeButton: false, closeOnClick: false }}>",
    		ctx
    	});

    	return block;
    }

    // (106:8) <LeafletMarker bind:latLng={markerLatLng} options={{ draggable: true }}>
    function create_default_slot_1(ctx) {
    	let leafletpopup;
    	let current;

    	leafletpopup = new Popup$1({
    			props: {
    				options: { closeButton: false, closeOnClick: false },
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(leafletpopup.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(leafletpopup, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const leafletpopup_changes = {};

    			if (dirty & /*$$scope, markerName*/ 2050) {
    				leafletpopup_changes.$$scope = { dirty, ctx };
    			}

    			leafletpopup.$set(leafletpopup_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leafletpopup.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leafletpopup.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leafletpopup, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(106:8) <LeafletMarker bind:latLng={markerLatLng} options={{ draggable: true }}>",
    		ctx
    	});

    	return block;
    }

    // (100:0) <LeafletMap style="height:50vh; width: 80vw; position:absolute; left:20vw;">
    function create_default_slot(ctx) {
    	let leaflettilelayer;
    	let t;
    	let if_block_anchor;
    	let current;

    	leaflettilelayer = new Tilelayer({
    			props: {
    				url: "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
    				options: {
    					attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>"
    				}
    			},
    			$$inline: true
    		});

    	let if_block = /*markerVisible*/ ctx[0] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			create_component(leaflettilelayer.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			mount_component(leaflettilelayer, target, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (/*markerVisible*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*markerVisible*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leaflettilelayer.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leaflettilelayer.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(leaflettilelayer, detaching);
    			if (detaching) detach_dev(t);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(100:0) <LeafletMap style=\\\"height:50vh; width: 80vw; position:absolute; left:20vw;\\\">",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let button;
    	let t1;
    	let t2;
    	let fieldset;
    	let label0;
    	let input0;
    	let t3;
    	let t4;
    	let label1;
    	let t5;
    	let input1;
    	let t6;
    	let label2;
    	let t7;
    	let input2;
    	let t8;
    	let label3;
    	let t9;
    	let input3;
    	let t10;
    	let leafletmap;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*data_json*/ ctx[3]) return create_if_block_1;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	leafletmap = new Map_1({
    			props: {
    				style: "height:50vh; width: 80vw; position:absolute; left:20vw;",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "天気情報取得";
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			fieldset = element("fieldset");
    			label0 = element("label");
    			input0 = element("input");
    			t3 = text("\n\t\tdisplay marker");
    			t4 = space();
    			label1 = element("label");
    			t5 = text("Popup content:\n\t\t");
    			input1 = element("input");
    			t6 = space();
    			label2 = element("label");
    			t7 = text("Latitude:\n\t\t");
    			input2 = element("input");
    			t8 = space();
    			label3 = element("label");
    			t9 = text("Longitude:\n\t\t");
    			input3 = element("input");
    			t10 = space();
    			create_component(leafletmap.$$.fragment);
    			add_location(button, file$2, 66, 0, 1572);
    			attr_dev(input0, "type", "checkbox");
    			add_location(input0, file$2, 83, 2, 1908);
    			attr_dev(label0, "class", "svelte-1ebag41");
    			add_location(label0, file$2, 82, 1, 1898);
    			attr_dev(input1, "type", "text");
    			add_location(input1, file$2, 88, 2, 2018);
    			attr_dev(label1, "class", "svelte-1ebag41");
    			add_location(label1, file$2, 86, 1, 1991);
    			attr_dev(input2, "type", "number");
    			add_location(input2, file$2, 92, 2, 2097);
    			attr_dev(label2, "class", "svelte-1ebag41");
    			add_location(label2, file$2, 90, 1, 2075);
    			attr_dev(input3, "type", "number");
    			add_location(input3, file$2, 96, 2, 2185);
    			attr_dev(label3, "class", "svelte-1ebag41");
    			add_location(label3, file$2, 94, 1, 2162);
    			attr_dev(fieldset, "class", "svelte-1ebag41");
    			add_location(fieldset, file$2, 81, 0, 1886);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			insert_dev(target, t1, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, fieldset, anchor);
    			append_dev(fieldset, label0);
    			append_dev(label0, input0);
    			input0.checked = /*markerVisible*/ ctx[0];
    			append_dev(label0, t3);
    			append_dev(fieldset, t4);
    			append_dev(fieldset, label1);
    			append_dev(label1, t5);
    			append_dev(label1, input1);
    			set_input_value(input1, /*markerName*/ ctx[1]);
    			append_dev(fieldset, t6);
    			append_dev(fieldset, label2);
    			append_dev(label2, t7);
    			append_dev(label2, input2);
    			set_input_value(input2, /*markerLatLng*/ ctx[2].lat);
    			append_dev(fieldset, t8);
    			append_dev(fieldset, label3);
    			append_dev(label3, t9);
    			append_dev(label3, input3);
    			set_input_value(input3, /*markerLatLng*/ ctx[2].lng);
    			insert_dev(target, t10, anchor);
    			mount_component(leafletmap, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(button, "click", /*getfetch*/ ctx[4], false, false, false),
    					listen_dev(input0, "change", /*input0_change_handler*/ ctx[5]),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[6]),
    					listen_dev(input2, "input", /*input2_input_handler*/ ctx[7]),
    					listen_dev(input3, "input", /*input3_input_handler*/ ctx[8])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			}

    			if (dirty & /*markerVisible*/ 1) {
    				input0.checked = /*markerVisible*/ ctx[0];
    			}

    			if (dirty & /*markerName*/ 2 && input1.value !== /*markerName*/ ctx[1]) {
    				set_input_value(input1, /*markerName*/ ctx[1]);
    			}

    			if (dirty & /*markerLatLng*/ 4 && to_number(input2.value) !== /*markerLatLng*/ ctx[2].lat) {
    				set_input_value(input2, /*markerLatLng*/ ctx[2].lat);
    			}

    			if (dirty & /*markerLatLng*/ 4 && to_number(input3.value) !== /*markerLatLng*/ ctx[2].lng) {
    				set_input_value(input3, /*markerLatLng*/ ctx[2].lng);
    			}

    			const leafletmap_changes = {};

    			if (dirty & /*$$scope, markerLatLng, markerName, markerVisible*/ 2055) {
    				leafletmap_changes.$$scope = { dirty, ctx };
    			}

    			leafletmap.$set(leafletmap_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(leafletmap.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(leafletmap.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t1);
    			if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(fieldset);
    			if (detaching) detach_dev(t10);
    			destroy_component(leafletmap, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let apikeystr = new apikey();
    	let markerVisible = true;
    	let markerName = "Null Island";
    	let markerLatLng = toLatLng(35.68141918995945, 139.7671194333653, 1);
    	let data_json;

    	async function getfetch() {
    		let response = await fetch("https://cors-anywhere.herokuapp.com/https://api.darksky.net/forecast/" + apikeystr.private_key + "/" + markerLatLng.lat + "," + markerLatLng.lng + "?lang=ja");
    		$$invalidate(3, data_json = await response.json());
    		console.log(data_json);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input0_change_handler() {
    		markerVisible = this.checked;
    		$$invalidate(0, markerVisible);
    	}

    	function input1_input_handler() {
    		markerName = this.value;
    		$$invalidate(1, markerName);
    	}

    	function input2_input_handler() {
    		markerLatLng.lat = to_number(this.value);
    		$$invalidate(2, markerLatLng);
    	}

    	function input3_input_handler() {
    		markerLatLng.lng = to_number(this.value);
    		$$invalidate(2, markerLatLng);
    	}

    	function leafletmarker_latLng_binding(value) {
    		markerLatLng = value;
    		$$invalidate(2, markerLatLng);
    	}

    	$$self.$capture_state = () => ({
    		apikey,
    		LeafletMap: Map_1,
    		LeafletMarker: Marker$1,
    		LeafletPopup: Popup$1,
    		LeafletTileLayer: Tilelayer,
    		toLatLng,
    		apikeystr,
    		markerVisible,
    		markerName,
    		markerLatLng,
    		data_json,
    		getfetch
    	});

    	$$self.$inject_state = $$props => {
    		if ("apikeystr" in $$props) apikeystr = $$props.apikeystr;
    		if ("markerVisible" in $$props) $$invalidate(0, markerVisible = $$props.markerVisible);
    		if ("markerName" in $$props) $$invalidate(1, markerName = $$props.markerName);
    		if ("markerLatLng" in $$props) $$invalidate(2, markerLatLng = $$props.markerLatLng);
    		if ("data_json" in $$props) $$invalidate(3, data_json = $$props.data_json);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		markerVisible,
    		markerName,
    		markerLatLng,
    		data_json,
    		getfetch,
    		input0_change_handler,
    		input1_input_handler,
    		input2_input_handler,
    		input3_input_handler,
    		leafletmarker_latLng_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
