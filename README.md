# contextmenu
A very basic pure JavaScript implementation of a context menu.

This is something I coded up one Saturday afternoon for a small project. It is not nearly
as robust as many of the context menu libraries which you can find on the web.

However, I wrote it because I wanted a pure JavaScript implementation of a context menu.
I could only find one other library that did not require jQuery, and I found bugs in it,
so, this was made.

### Usage

All context menus are made with a simple JavaScript object, which I will call a *menu object*,
which defines the menu. The *menu object* contains properties which represent each menu item.

The most basic, and likely sufficient approach, each property is as simple as a key: function() pair.
The key is used for the menu item label, and the function is called when the item is selected.

```javascript
var menu = {
    New: function( target ) { ... },
    Open: function( target ) { ... },
    Close: function( target ) { ... }
};
```

More advanced options can be set by using a key: Object pair.

```javascript
var menu = {
    New: {
        // Function to call when item is selected
        onSelect: function( target ) { ... },
        
        // Flag indicating if menu item is enabled. Default is true
        enabled: true,
        
        // Text to be used for menu item. If not provided, the key will be used as the text.
        // Note that HTML can be used here as well.
        label: "<em>Create New File</em>",
        
        // Title attribute added to the 
        title: "Click here to create a new file"
    },
    Open: function( target ) { ... },
    Close: function( target ) { ... }
}
```

The **onSelect** function, identified above with

```javascript
function( target ) { ... }
```

can take up to four parameters:

```javascript
function( target, key, item, data )
```

**target** is the DOM object for the item selected to create the context menu. That is, the thing you originally clicked on to create and open the context menu.

**key** is the item that was selected. In the above example, it would be one of **New**, **Open**, or **Close**.

**item** is the DOM object for the item. This wraps whatever text or HTML is in the item. This is particularly useful if you had some data tied to the label.

**data** is the data you may have added to the options (see [attach](#attach)), default value is an empty object.

```javascript
var menu = {
    New: {
        label: '<em data-id="1">New</em>',
        onSelect: function( target, key, item, data ) { 
            // <em> is a child of the item, so we have to fetch the child element of item.
            console.log( item.childNodes[ 0 ].getAttribute( "data-id" ) );
        }
    }
}
```

### API

All API functions work on selectors. Selectors can be a CSS-like string, a jQuery Selector, a NodeList, or a DOM object.

```javascript
// CSS-like string
selector = ".menus";

// jQuery selector
selector = $( ".menus" );

// NodeList
selector = document.getElementsByClassName( "menus" );

// DOM object
selector = document.getElementById( "menu" );
```

#### attach

```javascript
ContextMenu.attach( selector, menu [, options] );
```

Attaches a menu to an element or elements

```javascript
ContextMenu.attach( selector, menu );

// Attach with options
ContextMenu.attach( selector, menu, {
    // The event to trigger the menu. Likey "click" or "contextmenu"
    event: "click",
    
    // The position of the relative to the element.
    // Can be one of "bottom", "top", "left", "right", or "click"
    position: "bottom",
    
    // Additional horizontal offset to position of menu, in pixels
    horizontalOffset: 0,
    
    // Additional vertical offset to position of menu, in pixels
    verticalOffset: 0,

    // Some data you may want to add
    data: {}
} );
```


#### display

```javascript
ContextMenu.display( event_or_element, menu [, options] );
```

Displays a menu associated with an event or element. Useful
if you don't want to attach a menu to a whole bunch of items
or if you are dealing with dynamic items.

```javascript
$( document ).on( "click", ".user", function( e ) {
	// Passing an event
	ContextMenu.display( e, menu, { horizontalOffset : 5 } );
	
	// You can also pass an element
	ContextMenu.display( e.target, menu );
} );
```


#### disable

```javascript
ContextMenu.disable( selector, key );
```

Disables a menu item. The *key* reference the key in the menu object to disable.


#### enable

```javascript
ContextMenu.enable( selector, key );
```

Enables a menu item. The *key* reference the key in the menu object to disable.


#### close

```javascript
ContextMenu.close();
```

Close every opened menu.


#### isOpen

```javascript
ContextMenu.isOpen();
```

Check if a menu is open.


### CSS

There are four CSS classes used. 

```css
/* Overall style for the context menu. Should always be inline-block and position absolute */
div.context-menu { 
    position: absolute;
    display: inline-block;
}

/* Style for each menu item */
div.context-menu-item {}

/* Style for menu item when hovered */
div.context-menu-item:hover {}

/* Style for disabled menu items */
div.context-menu-item-disabled {}
```

See [contextmenu.css](https://github.com/theyak/contextmenu/blob/master/contextmenu.css) for a sample 
configuration, which is designed for the application I was writing this for. 
You will want to change it for your own application.

### TODO

These are things I may add if the features should ever be needed:

* Icon images
* Hot Keys
* Submenus
* Second wrapper for menu to make more advanced menu designs
* Permit different class names
* Theming
