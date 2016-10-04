var Natives = require( './src/for-node.js' );
Natives.hook( 'Array.prototype.slice', function ( original ) {
    return function () {
        var result = original.apply( this, arguments );
        console.log( 'Called array slice method!!!' );
        return result;
    }
} );

//  You have the original setTimeout function here. :)
//  This is the container for loaded functions.
console.log( [ 'qwer', 'asf', 'lhj' ].slice( 2, 3 ) );