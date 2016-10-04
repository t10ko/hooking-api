# JavaScript API for easy Hooking and managing native APIs.

[Hooking or function overriding](https://en.wikipedia.org/wiki/Hooking) is a well known technique in programming.  
It's usefull for debugging your code, extending plugins and doing things that seem impossible( for example overriding events mechanisms in JS, to gain full control over events ).

There are couple of problems according to Hooking, which are`  
1. Saving original functions in some container(if you'r the hooker, you need to use original functions).  
2. Hooked functions can easily be spotted.  
3. It's easy to break things around because hooked methods are different than originals.

Here is a complete hooking API for JavaScript which solves all the problems mentioned above.

This API uses error prone hooking techniques after which hook functions cannot be spotted.  
It has local container for original functions which is well organized.  
Also this API solves vendor prefixing problems.

#### To use with NodeJS run.

```sh
npm install hooking-api.
```

# API reference.

## Hooking API!!

### Natives.hook( ...path, [options], generator, [...gen_args] );

Loads and hooks given functions.  
**Path** is the list of functions that needs to be hooked. Every item is a string path to it's function like **'Array.prototype.slice'**.  

You can give **options** to control original functions loading, There are this available options to pass.  
1. *bindToParent*. This is used to [bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) loaded functions to its parents.  
2. *from*. If you need to load multiple functions from the same place, use this.  
For example if you need to load **addEventListener**, **removeEventListener**, **dispatchEvent** functions from **EventTarget.prototype**, you can pass 'EventTarget.prototype' to from arg.

**Generator** is the hooker function, which overrides wanted functions based on original one, *it's not an optional argument*.  
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

The only differnce that remains is that errors that have been thrown from original functions, will have different backtraces.  
Backtraces will have more entries because of hooks.

### Natives.reHook( ...path, [options], generator, [...gen_args] );

This is the alias of hook with one difference.

When you call hook on a function that already has been hooked you will hook the hooked version *(ahahaha)*, not the original one.  
This is because in other case you'll lose all the changes done before.

**reHook** is for hooking that function from 0.  
You will replace all changes done before.

```javascript
Natives.hook( 'setTimeout', {bindToParent: true}, function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'setTimeout first hook call' );
        return result;
    }
} );
Natives.hook( 'setTimeout', function ( original ) {
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
    console.log( 'This is printed after a second.' )
}, 1000 );

//  To avoid this situation call this.
Natives.reHook( 'setTimeout', function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'setTimeout\'s only one hook call' );
        return result;
    }
} );

//  We have rehooked setTimeout method.
//  So window.setTimeout call will print only this to your console.
//  setTimeout\'s only one hook call
//  So try this.
window.setTimeout( function () {
    console.log( 'This is printed after a second.' )
}, 1000 );
```

### Natives.restore( ...path, [options] );

Restores hooked functions to original ones.

```javascript
Natives.reHook( 'setTimeout', function ( original ) {
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
Fast loading for the functions that are in the same place.
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
console.log( Natives.$['EventTarget.prototype'].addEventListener );
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
console.log( Natives.$.EventTarget.prototype.addEventListener === Natives.$['EventTarget.prototype'].addEventListener );
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
As we can see third version is a vendor prefixed version of cancelAnimationFrame.
It's a prefixed version of cancelRequestAnimationFrame, which is the same function.
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

Translating constants are not usefull for hooking, it's an additional feature that makes vendor prefixed versions easier to organize.

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