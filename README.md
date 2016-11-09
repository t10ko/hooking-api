# JavaScript API for easy hooking and managing native APIs.

[Hooking or function overriding](https://en.wikipedia.org/wiki/Hooking) is a well known technique in programming.  
It's usefull for debugging your code, extending plugins and doing things that seem impossible( for example overriding events mechanisms in JS, to gain full control over events ).

There are couple of problems according to hooking, which are`  
1. Saving original functions in some container(if you'r the hooker, you need to use original functions).  
2. Hooked functions can easily be spotted.  
3. It's easy to break things around because hooked methods are different than originals.

Here is a complete hooking API for JavaScript which solves all the problems mentioned above.

This API uses error prone hooking techniques using which hooked functions cannot be spotted.  
It has local container for original functions which is well organized.  
Also this API solves vendor prefixing problems.

### Dependencies.

This package depends on [vendor-prefixes API](http://github.com/t10ko/vendor-prefixes).

You can install this using bower.
```sh
bower install hooking-api
```

Or load dependencies manually.

#### To use with NodeJS run.

```sh
npm install hooking-api.
```

# API reference.

## Hooking API!!

### Natives.hook( ...path, [options], generator, [...gen_args] );

Loads and hooks given functions.  
**Path** is the list of functions that needs to be hooked. Every item is a string path to it's function like **'Array.prototype.slice'**.

Also i've added a support for getter/setter functions too!!.  
To point to a getter of some property, you need to write **'HTMLElement.prototype.onclick > get'**.  
Or **'... > set'** to point to a setter function.

You can give **options** to control original functions loading and hooking.  
Here are all available options.  
1. *bindToParent*. This is used to [bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) loaded functions to its parents.  
2. *from*. If you need to load multiple functions from the same source, use this.  
For example if you need to load **addEventListener**, **removeEventListener**, **dispatchEvent** functions from **EventTarget.prototype**, you can pass 'EventTarget.prototype' to from arg.  
3. *ignoreHookeds*. Pass *false*, if you want to hook methods even if they're already hooked. By default it's true.  
4. *rehook*. Works only with *ignoreHookeds* flag set to false. Pass *false* if you need to hook already hooked methods. By default it's true, which means that **hook** call will rewrite all your pervious hooks of a partuclar function.

**Generator** is the hooker function, which hooks needed functions based on the original or the current version( *it's not an optional argument* ).  
Generator arguments(**gen_args**) are additional arguments to pass to generator function.

Usage.

```javascript
//  Hooking addEventListener and removeEventListener methods of EventTarget.
Natives.hook( 'EventTarget.prototype.addEventListener', 'EventTarget.prototype.removeEventListener', function ( original, number ) {
    //  This is the generator function.
    //  It returns a hooked version.
    
    //  original is the original version of function that is being overrided right now.
    //  This will print 12 to your console.
    console.log( number );
    return function () {
        var result = original.apply( this, arguments );

        //  Do something after original function call, and return original function's returned value
        console.log( 'Add or remove event listener method called!' );
        return result;
    }
    //  This 12 is the additional argument to pass to generator.
}, 12 );

//  After hooking those methods you can try to bind some event to some element, 
//  message that prints hooked function will be printed for every addEventListener or removeEventListener call, let's try.
document.querySelector( '#target' ).addEventListener( 'click', function () {
    console.log( 'Clicked on target!' );
} );
console.log( 'This will be printed after the message from hooked function.' );
```

Here is the shorter way to do the same as above.
```javascript
Natives.hook( 'addEventListener', 'removeEventListener', { from: 'EventTarget.prototype' }, function ( original, number ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'Add or remove event listener method called!' );
        return result;
    }
}, 12 );
```

You can hook a function, and get the original one of that function like this.
```javascript
Natives.hook( 'setTimeout', function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'Called setTimeout method!!!' );
        return result;
    }
} );

//  You have the original setTimeout function here. :)
//  This is the container for loaded functions.
console.log( Natives.$.setTimeout );
```

As I mentioned above, there is a new feature, which allows to access getter/setter accessor methods.  
Let's try to hook HTML element's **onclick** setter.
```javascript
Natives.hook( 'HTMLElement.prototype.onclick > set', function ( original ) {
    return function () {
        console.log( 'Setting an onclick handler on object', this );
        return original.apply( this, arguments );
    }
} );

//  After this call you will see a new line from the hooked function in your console.
document.querySelector( '#target' ).onclick = function () {
    console.log( 'Clicked on target!' );
}

//  You can access this function's original version from here.
//  NOTE: you must write the path without any space character.
console.log( Natives.$['HTMLElement.prototype.onclick>set'] );
```

**ONLY IN WEB**:
Accually you cant use this setTimeout function directly, it will throw an error with text '*Illegal invocation*'.
```javascript
try {
    Natives.$.setTimeout( function () {
        console.log( 'This line will never be printed!' );
    }, 1000 );
} catch( err ) {
    console.error( err );
}

//  But theres a way to call this setTimeout.
Natives.$.setTimeout.call( window, function () {
    console.log( 'This line will be printed after 1s!' );
}, 1000 );
```
This is because setTimeout function must be called on window only, and that's why there is an option called **bindToParent**.  
Try to pass option object **{bindToParent: true}** when hooking, and try to call setTimeout again.  
```javascript
Natives.hook( 'setTimeout', {bindToParent: true}, function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'Called setTimeout method!!!' );
        return result;
    }
} );

//  Now this will work, because it's bound to window.
Natives.$.setTimeout( function () {
    console.log( 'This line will be printed after 1s!' );
}, 1000 );
```
Accually there is a simpler way to bind already loaded function to it's parent, see in the section **Helpier methods**.

**ignoreHookeds** flag prevents doing multiple hooks on the same functions.  
For example, if you try to hook the method *HTMLElement.prototype.addEventListener*, and then hook the *HTMLDocument.prototype.addEventListener* you will accually hooked that method twice, because in modern browsers *HTMLDocument* and *HTMLElement* classes inherit addEventListener from *EventTarget* class and those methods are the same.  

Here is demo.
```javascript

//  Using this flags to create a situation described above.
Natives.hook( 'HTMLElement.prototype.addEventListener', 'HTMLDocument.prototype.addEventListener', {ignoreHookeds: false, rehook: false}, function ( original ) {
    return function () {
        console.log( 'Called addEventListener method!!!' );
        return original.apply( this, arguments );
    };
} );

//  This call will cause 2 same lines('Called addEventListener method!!!') in your console.
document.querySelector( '#target' ).addEventListener( 'click', function () {
    console.log( 'Clicked on target element!' );
} );
```

So *ignoreHookeds* flag prevents situations like this.

Let's try to hook a function multiple times and then rewrite all changes we've done.

```javascript
Natives.hook( 'setTimeout', {bindToParent: true}, function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'setTimeout first hook call' );
        return result;
    }
} );

//  Rehooking already hooked method.
Natives.hook( 'setTimeout', {ignoreHookeds: false, rehook: false}, function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'setTimeout second hook call' );
        return result;
    }
} );

//  window.setTimeout call will print this two lines in your console.
//  'setTimeout first hook call'
//  'setTimeout second hook call'
//  This is because the second hooker's original argument was the already hooked version.
window.setTimeout( function () {
    console.log( 'This is printed immedately after a second.' );
    
    //  To avoid this situation call this.
    Natives.hook( 'setTimeout', {rehook: true, ignoreHookeds: false}, function ( original ) {
        console.log( 'Rewriting all previous hooks.' );
        return function () {
            var result = original.apply( this, arguments );
            console.log( 'setTimeout\'s first and only hooked method' );
            return result;
        }
    } );
    
    //  We have rehooked setTimeout method.
    //  So window.setTimeout call will print only this to your console.
    //  setTimeout\'s only one hook call
    //  So try this.
    window.setTimeout( function () {
        console.log( 'This is printed immedately after \'first and only\'.' )
    }, 500 );
}, 500 );
```

Hooked functions keep original's name, arguments count and toString declaration.  
To get sure that hooked function is the same as original, try this.

```javascript
Natives.hook( 'setTimeout', {bindToParent: true}, function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'setTimeout called now from somewhere!' );
        return result;
    }
} );
console.log( Natives.$.setTimeout.toString() == window.setTimeout.toString() );
console.log( Natives.$.setTimeout.length == window.setTimeout.length );
console.log( Natives.$.setTimeout.name == window.setTimeout.name );
```

##### This proves that it's impossible to differentiate the original function from the hooked one, so this makes safe to hook any function from anywhere.  

The only differnce that remains is that errors that have been thrown from original functions will have different backtraces.  
Backtraces will have more entries because of hooks.

### Natives.restore( ...path, [options] );

Restores hooked functions to original ones.

```javascript
Natives.hook( 'setTimeout', function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'Message from hooked setTimeout` setTimeout called' );
        return result;
    }
} );

//  This will print 'setTimeout has been called' to your console, because it's hooked.
window.setTimeout( function () {
    console.log( 'This will be printed after 1s.' );
}, 1000 );

//  Restoring original function.
Natives.restore( 'setTimeout' );

//  So this will not print anything anymore.
window.setTimeout( function () {
    console.log( 'This will be printed after 1s.' );
}, 1000 );
```

### Natives.hookFunction( function, [options], generator, [...gen_args] );

Hooks function directly.  
If there is no need to fake hooked functions properties, pass *dontFake* option, it will improve performance.  
If you want to save hooked pair into this API's local container, pass *save* option.  
Make sure that this will not become a garbage, or delete it when it will.

Examples of usage of **saveHooked**, **removeHooked**, **originalOf**, **hookedOf**, **hookFunction** methods.
```javascript
function DoSomething( name, value ) {
    console.log( 'Doing something', name + value );
};

//  Hooking DoSomething function.
var hooked = Natives.hookFunction( DoSomething, function ( original ) {
    return function () {
        console.log( 'Do something else before doing something' );
        return original.apply( this, arguments );
    }
} );

//  Checking are this functions different.
//  Will print 3 trues.
console.log( hooked.toString() === DoSomething.toString() );
console.log( hooked.length == DoSomething.length );
console.log( hooked.name == DoSomething.name );

//  Try this one with gecko.
if( 'toSource' in Function.prototype )
    console.log( hooked.toSource() === DoSomething.toSource() );

//  Hooking DoSomething again, but this time without faking it.
var hooked = Natives.hookFunction( DoSomething, {dontFake: true}, function () {
    return function () {
        console.log( 'Again, do something else before doing something' );
        return original.apply( this, arguments );
    }
} );

//  Checking are this functions different.
//  This time this will print 3 falses.
console.log( hooked.toString() === DoSomething.toString() );
console.log( hooked.length == DoSomething.length );
console.log( hooked.name == DoSomething.name );

//  Now tryinig to hook and save function in the local container of this API.
var hooked = Natives.hookFunction( DoSomething, {dontFake: true, save: true}, function () {
    return function () {
        console.log( 'Again, do something else before doing something' );
        return original.apply( this, arguments );
    }
} );

//  2 trues.
console.log( Natives.originalOf( hooked ) === DoSomething );
console.log( Natives.hookedOf( DoSomething ) === hooked );
```

### Natives.saveHooked( hooked, original );

If you hooked a method for your own, add it to this API's container.  
Be carefull, this will save given functions in the local container and garbage collection wont collect functions that have been removed, so you need to delete this methods manually.

### Natives.removeHooked( function );

This removes hooked and original pair of functions from local containers.

Example of usage of **saveHooked** and **removeHooked** methods
```javascript
function DoSomething( name, value ) {
    console.log( 'Doing something', name + value );
};

//  Now tryinig to hook and save function in the local container of this API.
var hooked = Natives.hookFunction( DoSomething, {dontFake: true, save: true}, function () {
    return function () {
        console.log( 'Again, do something else before doing something' );
        return original.apply( this, arguments );
    }
} );

Natives.removeHooked( DoSomething );

//  2 falses. because we removed all info for this functions from container.
console.log( Natives.originalOf( hooked ) === DoSomething );
console.log( Natives.hookedOf( DoSomething ) === hooked );

//  It's possible to save into container manually too.
var hooked = Natives.hookFunction( DoSomething, function () {
    return function () {
        console.log( 'Again, do something else before doing something' );
        return original.apply( this, arguments );
    }
} );
Natives.saveHooked( hooked, DoSomething );

//  Again 2 trues.
console.log( Natives.originalOf( hooked ) === DoSomething );
console.log( Natives.hookedOf( DoSomething ) === hooked );
Natives.removeHooked( DoSomething );
```
### Natives.originalOf( function, [include_bound] );

Give a function and it will return original version of it.  
Will return bound version if **include_bound** is true and original version has been bound to parent.

### Natives.hookedOf( function );

Give a function and it will return hooked version of it.

## Helper methods.

### Natives.load( ...path, [options] );

Loads functions original versions into container.  
**Options** possible flags.  
1. *bindToParent*  
2. *from*

We've discussed both of this flags above.

Usage example.

```javascript
//  Will find and save setTimeout and setInterval native versions.
Natives.load( 'setTimeout' );
Natives.load( 'setInterval' );

//  After loading those methods will be available here.
//  Natives.$ is the container for all loaded functions.
console.log( Natives.$.setTimeout );
console.log( Natives.$.setInterval );
```

Using with options.  
As mentioned above, here is a technique to reload wanted function with *bindToParent*.
```javascript
//  Lets load setTimeout method.
Natives.load( 'setTimeout' );

//  But this will throw an error with text 'Illegal invocation'.
//  It's because setTimeout is only allowed to be called from window object.
//  Already discussed this above.
try {
    Natives.$.setTimeout( function () {
        console.log( 'This will never be printed!!!' );
    }, 1000 );
} catch( err ) {
    console.error( err );
}

//  So you can pass bindToParent flag here too.
Natives.load( 'setTimeout', { bindToParent: true } );

//  This will work now.
Natives.$.setTimeout( function () {
    console.log( 'Timeout called!!!' );
}, 1000 );
```
Fast loading functions from the same source.
```javascript
//  You can load functions from the same source, so instead of writing this.
Natives.load( 'EventTarget.prototype.addEventListener', 'EventTarget.prototype.removeEventListener', 'EventTarget.prototype.dispatchEvent' );

//  You can pass from option to loader, and get multiple functions from the same source. 
//  It will look like this.
Natives.load( 'addEventListener', 'removeEventListener', 'dispatchEvent', { from: 'EventTarget.prototype' } );
```
Functions with paths can be accessed like this.
```javascript
console.log( Natives.$['EventTarget.prototype.addEventListener'] );

//  Or like this.
console.log( Natives.$['EventTarget.prototype.*'].addEventListener );
```
But this one will return the real(maybe hooked) version.  
It's because EventTarget.prototype is the real prototype of EventTarget interface, so in order to get the original functions, you need to access them using methods mentioned above.  
It's a little complicated, but you will understand it after doing few trys.
```javascript
console.log( Natives.$.EventTarget.prototype.addEventListener );
```
Lets hook addEventListener to check it.
```javascript
Natives.hook( 'EventTarget.prototype.addEventListener', function ( original ) {
    return function () {
        return original.apply( this, arguments );
    };
} );

//  This will print false.
console.log( Natives.$.EventTarget.prototype.addEventListener === Natives.$['EventTarget.prototype.*'].addEventListener );
```

### Natives.need( ...path, [options] );

Same as load, but returns loaded functions.

Will return an object which maps given function names to functions.  
Functions that does not exist, will not be included into this object.  
In this example resulted object will map setTimeout and setInterval to it's functions, but doAnything will not be included.
```javascript
console.log( Natives.need( 'setTimeout', 'setInterval', 'doAnything', { bindToParent: true } ) );
```
If you give 'names' flag, function will return only filtered list, which contains loaded function names only.  
This one will result to [ 'setTimeout', 'setInterval' ];
```javascript
console.log( Natives.need( 'setTimeout', 'setInterval', { bindToParent: true, names: true } ) );
```
If you pass 'first' flag only first matched object will be returned.  
In this case it will be setTimeout function.
```javascript
console.log( Natives.need( 'doAnything', 'setTimeout', 'setInterval', { bindToParent: true, first: true } ) );
```
Flags can be combined.  
This will return first existed method's name.  
So this will print 'setTimeout'.
```javascript
console.log( Natives.need( 'doAnything', 'setTimeout', 'setInterval', { bindToParent: true, first: true, names: true } ) );
```

### Natives.translate( path, [...additional_variants], [options] );

Translates vendor prefixed versions of functions to original, keeps all into container and groups that changes, so it will be easy to hook all of them.

**Path** is the function's path that needs to be translated.  
**Additional variants**. There are cases where function haves additional variants as "vendor prefixed versions", which have different name.

Available options to pass with **options** argument.  
1. *getAll*. Pass this flag and translate will return all verions of functions that are available on this system.  
2. *prefixType*( *'JS'*, *'JSClass'*, *'const'* ). Give prefixing style with this option.  
3. *bindToParent*. Same as for loader.  
4. *from*. Same as for loader.

Returns first available version found.

**NOTE**:
Translation functionality is not available in NodeJS, because there are no vendor prefixes there.

Try this with webkit.
```javascript
Natives.translate( 'requestAnimationFrame', { bindToParent: true } );
```

In webkit there are 3 available functions for cancelling requested animation frame.  
1. **cancelAnimationFrame**  
2. **webkitCancelAnimationFrame**  
3. **webkitCancelRequestAnimationFrame**  
As we can see third version is not a vendor prefixed version of cancelAnimationFrame.
It's a prefixed version of cancelRequestAnimationFrame, which does the same thing as cancelAnimationFrame, so this is considered as an additional version of those functions.  
You can pass this additional variants too.

Try to delete cancelAnimationFrame default function, to see what happenes in case of default version is not available.  
**ATTENTION**: We've passed getAll flag, this will force translator to return all found versions in the system.
```javascript
delete window.cancelAnimationFrame;
console.log( Natives.translate( 'cancelAnimationFrame', 'cancelRequestAnimationFrame', { bindToParent: true, getAll: true } ) );

//  This will print webkitCancelAnimationFrame method.
//  As we can see, API translated vendor prefixed version to original one for easier use.
console.log( Natives.$.cancelAnimationFrame );
```
If you need to convert JavaScript classes such as MutationObserver, use vendorPrefix flag to change default prefixing type.  
This will try following versions.  
**MutationObserver**, **WebkitMutationObserver**, **MozMutationObserver**, **MsMutationObserver**, **OMutationObserver**.
```javascript
Natives.translate( 'MutationObserver', { prefixType: 'JSClass' } );
```
If you need to convert JavaScript constants such as CSSRule.KEYFRAMES_RULE, use vendorPrefix flag to change default prefixing type.  
This will try the following versions 
**KEYFRAMES_RULE**, **WEBKIT_KEYFRAMES_RULE**, **MOZ_KEYFRAMES_RULE**, **MS_KEYFRAMES_RULE**, **O_KEYFRAMES_RULE**.
```javascript
Natives.translate( 'KEYFRAMES_RULE', { from: 'CSSRule', prefixType: 'const' } );
```

Translating constants are not usefull for hooking, but it's an additional feature that makes vendor prefixed versions easier to organize.

If there is vendor prefix versions available for the same function, first translate it to parse all known translations, than hook it.  
It will override all variants of available functions.
```javascript
//  As mentioned above, cancelAnimationFrame in webkit is available in 3 forms` 
//  cancelAnimationFrame, webkitCancelAnimationFrame and webkitCancelRequestAnimationFrame.
//  So we will load all versions of this method.
Natives.translate( 'cancelAnimationFrame', 'cancelRequestAnimationFrame', { bindToParent: true } );
```
Now we hook **cancelAnimationFrame**.
```javascript
Natives.hook( 'cancelAnimationFrame', function ( original ) {
    console.log( 'Hooking ', original.name );
    return function () {
        return original.apply( this, arguments );
    }
} );
```
After this call, you will see following three lines in your console(if you'r using webkit)  
    'Hooking cancelAnimationFrame'  
    'Hooking webkitCancelAnimationFrame'  
    'Hooking webkitCancelRequestAnimationFrame'  

This means that all versions of **cancelAnimationFrame** will be hooked.  
But you **must** call hook after the translate to be able to do this.

And that's all.
Please submit bug report if you find something.

## Browser support

|Firefox|Chrome |IE |Opera  |Safari |
|:-----:|:-----:|:-:|:-----:|:-----:|
|7      |5      |9  |12     |5.1    |