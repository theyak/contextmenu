/**
 * Basic Context Menu - v0.0.2
 *
 * Copyright (c) 2015
 * Released under the MIT license.
 *
 * This is an extremely basic context menu library for JavaScript.
 * It has no dependencies.
 *
 * 0.0.2 - Reformat. No code changes.
 *
 * Usage:
 *
 * // The menu object contains a key along with an object describing
 * // the item, or a function which is called when the item is clicked.
 * //
 * // The key can be used to identify which menu option was clicked
 * // in an onSelect handler. The key is also used to perform actions,
 * // such as disable or enable, on the menu item.
 *
 * var menu = {
 *     // Basic menu option: Key and onSelect
 *     "New" : function( target ) { ... },
 *
 *     // More advanced options
 *     "Open" : {
 *         onSelect : function( target ) { ... },
 *         enabled : true, // Use false for disabled, default true
 *         text : "Open...", // Overrides the key, always use if array
 *         title : "Open a file" // Title attribute for menu item
 *     },
 *
 *     // More parameters in onSelect function
 *     "Save" : {
 *         // target : DOM object that was clicked to open menu
 *         // key : The key of the menu object, in this case, "Save"
 *         // item : DOM object of the menu item that was clicked
 *         onSelect : function( target, key, item ) {
 *             ...
 *         }
 *     }
 * }
 *
 * // A selector can be a CSS-like selector
 * selector = ".menus";
 *
 * // Or a jQuery selector
 * selector = $(".menus")
 *
 * // Or a DOM object
 * selector = document.getElementById("menu")
 *
 * // Or a NodeList
 * selector = document.getElementsByClassName("menus")
 *
 * // Attach a menu
 * ContextMenu.attach(selector, menu);
 *
 * // Attach menu with options
 * ContextMenu.attach(".menus", menu, {
 *     event: "click", // Any valid mouse/touch event
 *     position: "bottom", // One of bottom, top, left, right, or click
 *     horizontalOffset: 0, // Add horizontal offset to position of menu
 *     verticalOffset: 0, // Add vertical offset to position of menu
 * });
 *
 * // Disable a menu item
 * ContextMenu.disable(selector, "Close");
 *
 * // Enable a menu item
 * ContextMenu.enable(selector, "Close");
 *
 */
(function(window) {
    'use strict';


    var conf = {
        event: "click",
        position: "bottom",
        horizontalOffset: 0,
        verticalOffset: 0,
        data: {}
    };

    /**
     * Variable indicating if a menu is open
     * @type {boolean}
     */
    var isOpen = false;


    /**
     * Target object of context menu. This is the DOM object clicked
     * on to open the context menu.
     * @type {HTMLElement}
     */
    var target = null;


    /**
     * Class to apply to context menu
     * @type String
     */
    var menuClassName = "context-menu";


    /**
     * Class to apply to conext menu items
     * @type String
     */
    var itemClassName = "context-menu-item";


    /**
     * Class to apply to conext menu items which are disabled
     * @type String
     */
    var itemClassNameDisabled = "context-menu-item-disabled";


    ///////////////////////////////
    // Helper functions
    ///////////////////////////////

    /**
     * Check if object is a function
     *
     * @param {Mixed} obj
     * @returns {boolean}
     */
    var isFunction = function(obj) {
        return !!(obj && obj.constructor && obj.call && obj.apply);
    };



    /**
     * Check if object is a string
     *
     * @param {Mixed} obj
     * @returns {boolean}
     */
    var isString = function(obj) {
        return (typeof obj === 'string' || obj instanceof String);
    };



    /**
     * A super simple extend function. This is all that we need
     * for this library
     *
     * @param {Object}
     * @returns {Object}
     */
    var extend = function(obj) {
        var length = arguments.length;

        if (length < 2 || obj === null) {
            return obj;
        }

        for (var idx = 1; idx < length; idx++) {
            var source = arguments[idx];
            for (var key in source) {
                obj[key] = source[key];
            }
        }

        return obj;
    };



    /**
     * Get elements based on selector. The selector may be any of a
     * DOM element, a jQuery object, a css-selector string, or
     * a NodeList, likely retrieved from .querySelectorAll().
     *
     * @param {jQuery|NodeList|String|HTMLElement} selector
     * @returns {Array|jQuery|NodeList}
     */
    var getElements = function(selector) {
        var elements = [];

        if (typeof jQuery !== "undefined" && selector instanceof jQuery) {
            return selector;
        }

        if (selector instanceof HTMLElement) {
            return [selector];
        }

        if (isString(selector)) {
            return document.querySelectorAll(selector);
        }

        if (selector instanceof NodeList) {
            return selector;
        }

        return elements;
    };


    ///////////////////////////////
    // Private functions
    ///////////////////////////////


    /**
     * Called when a context menu is requested.
     *
     * @param {Event} e
     */
    var onContextMenu = function(e) {
        e.stopPropagation();
        e.preventDefault();

        target = e.target;
        closeContextMenu();

        if (target.ctxMenu) {

            var menu = createContextMenu(target);
            document.body.appendChild(menu);
            isOpen = true;

            // On next tick, position menu. We can't do it right
            // away because width and height of menu needs to be computed
            // first.
            setTimeout(function() {
                // Set up events to process or close context menu
                window.addEventListener("click", closeContextMenu);
                window.addEventListener("resize", closeContextMenu);
                window.addEventListener("scroll", closeContextMenu);

                // Position and display
                menu.style.visibility = "visible";
                positionContextMenu(e, target, menu);
            }, 1);
        }
    };



    /**
     * Create context menu
     *
     * @param {HTMLElement} target The element user clicks on to get context menu
     * @returns {HTMLElement} The menu
     */
    var createContextMenu = function(target) {
        var key;

        var contextMenu = document.createElement("div");
        contextMenu.className = menuClassName;

        // Initially hidden until we compute position
        contextMenu.style.visibility = "hidden";
        contextMenu.style.display = "inline-block";

        for (key in target.ctxMenu.menu) {
            var value = target.ctxMenu.menu[key];

            var item = document.createElement("div");
            item.ctxMenu = {
                key: key,
                enabled: value.enabled ? true : false
            };

            if (item.ctxMenu.enabled) {
                item.className = itemClassName;
            } else {
                item.className = itemClassNameDisabled;
            }
            item.innerHTML = value && value.label ? value.label : key;

            // Assign event listener
            if (item.ctxMenu.enabled) {
                if (isFunction(value.onSelect)) {
                    item.ctxMenu.onSelect = value.onSelect;
                } else {
                    item.ctxMenu.onSelect = onSelect;
                }

                item.addEventListener("click", function(e) {
                    this.ctxMenu.onSelect(target, this.ctxMenu.key, item, target.ctxMenu.data);
                    closeContextMenu();
                });
            }

            if (value.title) {
                item.title = value.title;
            }

            contextMenu.appendChild(item);
        }

        return contextMenu;
    };



    /**
     * Position the menu relative to the target
     *
     * @param {Event} e The event that triggered the display of context menu
     * @param {HTMLElement} target
     * @param {HTMLElement} menu
     */
    var positionContextMenu = function(e, target, menu) {
        var left = 0;
        var top = 0;
        var targetBox = target.getBoundingClientRect();
        var menuBox = menu.getBoundingClientRect();

        // Default position
        var position = "click";

        if (target.ctxMenu && target.ctxMenu.position) {
            position = target.ctxMenu.position;
        }

        if (position === "bottom") {
            // Display below element, left aligned (what about RTL languages?)
            left = targetBox.left + target.ctxMenu.horizontalOffset;
            top = targetBox.bottom + target.ctxMenu.verticalOffset;
        } else if (position === "top") {
            // Display above element, left aligned (what about RTL languages?)
            left = targetBox.left + target.ctxMenu.horizontalOffset;
            top = targetBox.top - menuBox.height + target.ctxMenu.verticalOffset;
        } else if (position === "right") {
            // Display to the right of the element, aligned to the top
            left = targetBox.left + targetBox.width + target.ctxMenu.horizontalOffset;
            top = targetBox.top + target.ctxMenu.verticalOffset;
        } else if (position === "left") {
            // Display to the left of the element, aligned to the top
            left = targetBox.left - menuBox.width + target.ctxMenu.horizontalOffset;
            top = targetBox.top + target.ctxMenu.verticalOffset;
        } else {
            // Display wherever the user clicked the mouse
            left = e.clientX + target.ctxMenu.horizontalOffset;
            top = e.clientY + target.ctxMenu.verticalOffset;
        }

        // Check if off screen

        // Too far to the left?
        if (left < 0) {
            if (target.ctxMenu.horizontalOffset >= 0) {
                left = target.ctxMenu.horizontalOffset;
            } else {
                left = 0;
            }
        }

        // Too far up?
        if (top < 0) {
            if (target.ctxMenu.verticalOffset >= 0) {
                top = target.ctxMenu.verticalOffset;
            } else {
                top = 0;
            }
        }

        // Too far to the right?
        if (left + menuBox.width > document.body.clientWidth) {
            if (target.ctxMenu.horizontalOffset >= 0) {
                left = document.body.clientWidth - menuBox.width;
            } else {
                left = document.body.clientWidth - menuBox.width + target.ctxMenu.horizontalOffset;
            }
        }

        // Too far to the bottom?
        if (top + menuBox.height > document.body.clientHeight) {
            if (target.ctxMenu.verticalOffset >= 0) {
                top = document.body.clientHeight - menuBox.height;
            } else {
                top = document.body.clientHeight - menuBox.height + target.ctxMenu.verticalOffset;
            }
        }

        // And finally, apply to positioning to the menu
        menu.style.left = left + "px";
        menu.style.top = top + "px";
    };



    /**
     * Default onSelect routine if client failed to pass one in
     *
     * @param {HTMLElement} target The DOM element which context menu is applied to
     * @param {String} key Key related to menu
     * @param {HTMLElement} item The item clicked
     */
    var onSelect = function(target, key, item) {
        // TODO: Maybe throw an event
    };



    /**
     * Close any context menus (there should be only one!) that
     * currently exist.
     */
    var closeContextMenu = function() {
        var idx = 0;
        var elements = document.getElementsByClassName(menuClassName);

        // Remove event listeners. If they don't exist, nothing will happen.
        window.removeEventListener("click", closeContextMenu);
        window.removeEventListener("resize", closeContextMenu);
        window.removeEventListener("scroll", closeContextMenu);

        for (idx = 0; idx < elements.length; idx++) {
            elements[idx].parentNode.removeChild(elements[idx]);
        }
        isOpen = false;
    };



    /**
     * Set the enabled state of a menu item
     * @param {jQuery|NodeList|String|HTMLElement} selector
     * @param {String|int} key Key in menu object
     * @param {boolean} enabled
     */
    var setEnabledState = function(selector, key, enabled) {
        var idx = 0;

        // Get list of elements to attach context menu to
        var elements = getElements(selector);

        // Disable each menu element
        for (idx = 0; idx < elements.length; idx++) {
            if (elements[idx].ctxMenu.menu.hasOwnProperty(key)) {
                elements[idx].ctxMenu.menu[key].enabled = enabled;
            }
        }
    };



    /**
     * Normalize a menu structure so that all properties are present
     *
     * @param {Object} menu
     * @returns {Object}
     */
    var normalizeMenu = function(menu) {
        var idx;
        var itemDefaults = {
            type: "item",
            enabled: true,
            label: "",
            onSelect: function() {},
            icon: "", // This isn't used yet
            title: ""
        };

        // Quick normalization of menu object
        for (idx in menu) {
            // Create copy of defaults
            var dflt = extend({}, itemDefaults);

            if (!menu[idx]) {
                menu[idx] = extend(dflt, {
                    label: idx
                });
            } else if (isFunction(menu[idx])) {
                menu[idx] = extend(dflt, {
                    label: idx,
                    onSelect: menu[idx]
                });
            } else {
                menu[idx] = extend(dflt, menu[idx]);
            }
        }

        return menu;
    };



    ///////////////////////////////
    // Public API
    ///////////////////////////////
    var ContextMenu = {

        /**
         * Attach a context menu to one or more elements. This is the
         * API that will be used most often.
         *
         * @param {jQuery|NodeList|HTMLElement|String} selector
         * @param {Array|Object} menu
         * @param {Object} options
         */
        attach: function(selector, menu, options) {
            var idx = 0;

            menu = normalizeMenu(menu);

            // Create object to associate with element(s).
            // extend() is used so that each element gets a unique copy.
            var obj = extend({
                menu: extend({}, menu)
            }, conf, options);

            // Get list of elements to attach context menu to
            var elements = getElements(selector);

            // Attach context menu to each element
            for (idx = 0; idx < elements.length; idx++) {
                elements[idx].ctxMenu = obj;
                elements[idx].addEventListener(obj.event, onContextMenu);
            }
        },



        /**
         * Display a context menu with an element or event. 
         * Useful for when you don't want to attach the context
         * menu to a whole bunch of things but just display it
         * dynamically.
         * 
         * @example
         *	$( document ).on( "click", ".target-button", function( e ) {
         *		ContextMenu.display( e.target, menu, { horizontalOffset : 5 } );
         *	} );
         *	
         * @example
         *	$( document ).on( "click", ".target-button", function( e ) {
         *		ContextMenu.display( e, menu, { horizontalOffset : 5 } );
         *	} );
         * 
         * @param {Event|HTMLElement} e
         * @param {Array|Object} menu
         * @param {Object} options
         */
        display: function(e, menu, options) {
            menu = normalizeMenu(extend({}, menu));

            // Create object to associate with element(s).
            // extend() is used so that we have a unique copy.
            var contextMenu = extend({
                menu: extend({}, menu)
            }, conf, options);

            // Is e a selector or an event?
            if (e instanceof Event) {
                e.target.ctxMenu = contextMenu;
                onContextMenu(e);
            } else if (typeof jQuery !== "undefined" && e instanceof jQuery.Event) {
                e.target.ctxMenu = contextMenu;
                onContextMenu(e);
            } else if (e instanceof HTMLElement) {
                e.ctxMenu = contextMenu;

                // Create a simulated event
                var box = e.getBoundingClientRect();
                var evt = {
                    target: e,
                    clientX: box.left,
                    clientY: box.top,
                    stopPropagation: function() {},
                    preventDefault: function() {}
                }
                onContextMenu(evt);
            } else {
                console.log(e);
            }
        },


        /**
         * Disable a menu items
         *
         * @param {jQuery|NodeList|HTMLElement|String} selector
         * @param {String|int} key The key passed in to the menu object in .attach()
         */
        disable: function(selector, key) {
            setEnabledState(selector, key, false);
        },



        /**
         * Disable a menu items
         *
         * @param {jQuery|NodeList|HTMLElement|String} selector
         * @param {String|int} key The key passed in to the menu object in .attach()
         */
        enable: function(selector, key) {
            setEnabledState(selector, key, true);
        },



        /**
         * Close context menu(s)
         */
        close: function() {
            closeContextMenu();
        },



        /**
         * Check if a context menu is open
         * @returns {boolean}
         */
        isOpen: function() {
            return isOpen;
        }
    };



    /**
     * Expose
     */
    // AMD
    if (typeof window.define === "function" && window.define.amd !== undefined) {
        window.define('ContextMenu', [], function() {
            return ContextMenu;
        });
        // CommonJS
    } else if (typeof module !== "undefined" && module.exports !== undefined) {
        module.exports = ContextMenu;
        // Browser
    } else {
        window.ContextMenu = ContextMenu;
    }
})(window || this);
