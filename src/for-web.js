( function ( scope, factory ) {
	if( typeof exports === 'object' && typeof module === 'object' ) {
		module.exports = factory( scope );
	} else if( typeof define === 'function' && define.amd ) {
		define( [], function () { return factory( scope ); } );
	} else {
		( typeof exports === 'object' ? exports : scope ).Natives = factory( scope );
	}
} ) ( this, function () {
	var ArrayProto = Array.prototype, 
		ArrayPush = Array.prototype.push;
	var HasOwn = ( function () {
		var has_own = {}.hasOwnProperty;
		return function HasOwn( target, name ) {
			return !!name && has_own.call( target, name );
		};
	} ) ();
	var IsArray = Array.isArray;
	function IsObject( value ) { return value != null && ( typeof value === 'function' || typeof value === 'object' ); };
	function IsScalar( value ) { return !IsObject( value ); };
	function IsNumber( value ) { return !isNaN( value ) && value+0 === value; };
	var IsFunction = ( function () {
		var func_proto = Function.prototype;
		return function IsFunction( target ) { return typeof target === 'function' && target != func_proto; };
	} ) ();
	function IsString( target ) { return target != null && ( GetType( target ) === 'string' ); };
	function IsWindow( target ) { return target != null && (target === target.window); };
	function IsArrayLike( obj ) {
		if( !IsObject( obj ) || IsFunction( obj ) || IsWindow( obj ) )
			return false;
		var length = !!obj && ('length' in obj) && obj.length;
		return IsArray( obj ) || length === 0 || IsNumber( length ) && length > 0 && ( length - 1 ) in obj;
	};
	function InsertAt ( container, elements, index ) {
		if( !IsArrayLike( elements ) ) 
			elements = [ elements ];
		if( index === undefined ) {
			ArrayPush.apply( container, elements );
		} else {
			var args = [ index, 0 ];
			ArrayPush.apply( args, elements );
			ArrayProto.splice.apply( container, args );
		}
		return container;
	};
	function IsINT( n ) { return IsScalar(n) && !isNaN(n) && (n % 1) === 0; };
	function IsBool( arg ) { return arg === true || arg === false; };
	function IsUINT( n ) { return IsINT( n ) && n >= 0; };
	function Slice( target, begin, end ) {
		var i, result = [], size, len = target.length;
		begin = ((begin = begin || 0) >= 0) ? begin : Math.max(0, len + begin);
		if((end = isNaN(end) ? len : Math.min(end, len)) < 0) end = len + end;
		if((size = end - begin) > 0) {
			result = new Array(size);
			for (i = 0; i < size; i++) result[i] = target[begin + i];
		}
		return result;
	};
	function IsObjectEmpty ( arg ) {
		for( var i in arg ) return false;
		return true;
	};
	function Extend() {
		var options, name, src, copy, is_array, clone,
			i = 1, 
			deep = false;
		if( IsBool( target ) ) {
			deep = target;
			i++;
		}
		var target = arguments[i-1] || _(),
			length = arguments.length;

		if ( !IsFunction( target ) && !IsObject( target ) ) 
			target = _();

		if ( i === length ) 
			return target;
		for ( ; i < length; i++ ) {
			if ( ( options = arguments[ i ] ) != null ) {
				for ( name in options ) {
					src = target[ name ];
					copy = options[ name ];

					if( target === copy ) 
						continue;

					if( deep && copy && ( IsPlainObject( copy ) ||
						( is_array = IsArray( copy ) ) ) ) {

						if ( is_array ) {
							is_array = false;
							clone = src && IsArray( src ) ? src : [];
						} else {
							clone = src && IsPlainObject( src ) ? src : _();
						}
						target[ name ] = Extend( deep, clone, copy );
					} else if( copy !== undefined ) {
						target[ name ] = copy;
					}
				}
			}
		}
		return target;
	};
	var GetType, IsInstanceOf;
	( function () {
		var class2type = _(), 
			ToString = {}.toString;

		[ 'Boolean', 'Number', 'String', 'Function', 'Array', 'Date', 'RegExp', 'Object', 'Error', 'Symbol' ].forEach( function ( name ) {
			class2type[ '[object ' + name + ']' ] = name.toLowerCase();
		} );
		GetType = function ( obj ) {
			return obj == null ? obj + '' : (
				typeof obj === 'object' || typeof obj === 'function' ?
				class2type[ ToString.call( obj ) ] || 'object' :
				typeof obj
			);
		};
		IsInstanceOf = function ( obj, classname ) { return obj != null && ToString.call( obj ).slice( 8, -1 ) == classname; };
	} ) ();
	function GetLast( list ) { return list[ list.length - 1 ]; };
	function SetLast( list, value ) { return ( list[ list.length - 1 ] = value, list ); };
	function RandomString( len ) { return Math.random().toString( 16 ).substr( 2, len || 8 ); };
	function ObjectID( target, dont_make ) {
		var key = target.objectUniqueID;
		if( !key && !dont_make ) 
			Object.defineProperty( target, 'objectUniqueID', { value: key = RandomString() } )
		return key;
	};
	function PopProp( object, property ) {
		var value = object[ property ];
		delete object[ property ];
		return value;
	};
	function ObjectValues( target, skip ) {
		var result = []; skip = skip || 0;
		for( var key in target ) 
			if( --skip < 0 ) 
				result.push( target[ key ] );
		return result;
	};

	//	It turns out that in internet explorer some objects that are not functions can have instances.
	//	For example XMLHttpRequestEventTarget in IE11.
	function CanHaveInstance( target ) {
		var ok = IsFunction( target ), a;
		if( !ok && ( ok = IsObject( target ) ) ) 
			//	Variable a is used only to bypass uglifier optimizations.
			try { a = this instanceof target; } catch( err ) { ok = false; }
		return ok;
	};
	function _() {
		var result = Object.create( null ), name, i = 0;
		for( ; i < arguments.length; i++ ) {
			var value = arguments[i];
			if( !(i % 2) ) {
				name = value;
			} else {
				result[ name ] = value;
			}
		}
		return result;
	};
	function ShiftObject( target, only_value ) {
		for( var key in target ) {
			var value = PopProp( target, key );
			if( only_value ) {
				return value;
			} else {
				return { key: key, value: value };
			}
		}
	};

	var self = {}, 
		main = self, 
		publics = (main.$ = {}), 

		faked_to_string_keys = { toString: RandomString(4) + 'hookedFunctionToStringValue' }, 

		hooked2original = _(), 
		original2hooked = _(), 

		bound2original = _(), 
		original2bound = _(), 

		hooked_from_outside = _(), 

		cached = _(), 

		ONLY_CHECK = 1, 
		IGNORE_NAME_FAIL = 2, 
		ONLY_FUNCTIONS = 4, 
		BIND_TO_PARENT = 8, 
		IGNORE_FIRST_NAME_FAIL = 16;

	//	If function's toSource is supported, use it.
	if( _.toSource )
		faked_to_string_keys.toSource = RandomString(4) + 'hookedFunctionToSourceValue';

	var ExtendOptions = ( function ( all_options ) {

		//	Preparing all options objects.
		var overall = PopProp( all_options, 'overall' ), 
			options = { '*': overall }, 
			defaults = { '*': PopProp( overall, 'default' ) };
		for( var name in all_options ) {
			options[ name ] = Extend( _(), overall, all_options[ name ] );
			defaults[ name ] = PopProp( options[ name ], 'default' );
		};
		return function ExtendOptions( settings, type ) {
			type = type || '*';
			var def_options = options[ type ], 
				def_property = defaults[ type ];
			if( IsScalar( settings ) && settings != null )
				settings = _( def_property, settings );
			return Extend( _(), def_options, settings );
		};
	} ) ( {
		overall: {
			from: null, 
			bindToParent: false, 
			default: 'bindToParent'
		}, 
		translate: {
			prefixType: 'JS', 
			getAll: false, 
			default: 'getAll'
		}, 
		need: {
			names: false, 
			first: false, 
			default: 'names'
		}
	} );

	var Hook = ( function () {
		function FixName( name ) { return name && name.slice( name.lastIndexOf(' ') + 1 ) || ''; };
		function FakeIt( hooked, original ) {
			var args = [], 
				i = original.length;
			while( i-- ) 
				args.push( 'a' + i );

			var faked = eval( '(function(hooked){return function ' + FixName( original.name ) + '( ' + args.join( ', ' ) + ' ){return hooked.apply(this,arguments);};})(arguments[0])' ), 
				originals = main.$['Function.prototype.*'];
			for( var name in faked_to_string_keys ) {
				Object.defineProperty( 
					faked, 
					faked_to_string_keys[name], 
					{ value: originals[name].call( original ) } 
				);
			}
			return faked;
		};
		return function Hook( handler, generator, original, args ) {
			args = args || [];
			args.unshift( handler );

			//	Calling generator function.
			var hooked = generator.apply( null, args );
			if( !IsFunction( hooked ) )
				throw new Error( 'hook method\'s generator argument MUST return a function.' );

			//	If original function is not given, no need to fake it.
			if( original ) {

				//	Faking hooked call.
				hooked = FakeIt( hooked, original );

				//	Copying properties from original function.
				for( var prop in original ) 
					Object.defineProperty( hooked, prop, { value: original[ prop ] } );

				//	Copying prototype and properties and methods that are defined natively.
				hooked.prototype = original.prototype;
			}
			return hooked;
		};
	} ) ();

	function BindToParent( info ) {
		var method = GetOriginal( info );
		if( !method )
			return false;

		var original = main.originalOf( method ), 
			key = ObjectID( original );

		if( !HasOwn( original2bound, key ) ) {
			bound = SetOriginal( info, original2bound[ key ] = Hook( method, function ( original ) {
				return function () {
					return original.apply( info.parents.current, arguments );
				}
			}, method ) );
			bound2original[ ObjectID( bound ) ] = original;
		}
		return true;
	};

	//	Functions to get current and original parents from cache information entry.
	//	For current parents container, we need to check if that name in current container exists, 
	//	in other case, get it from original container, becuase maybe it's have been translated.
	function SetOriginal( info, value ) { return info.parents.original[ info.name ] = value; };
	function GetOriginal( info ) { return info.parents.original[ info.name ]; };
	function GetCurrent( info, not_orig ) { return info.parents.current[ info.name ] || (not_orig && GetOriginal( info )); };

	/**
	 * Give method to this function to get it's original version.
	 * @param	{Function}	method			Function, which original version needed.
	 * @param	{Boolean}	include_binding	If original variant of this function is bound to it's parent, 
	 *                                  	give that variant.
	 * @return	{Function}					undefined or desired original function.
	 */
	main.originalOf = function ( method, include_binding ) {
		var key = ObjectID( method, true ), 
			original = key && (hooked2original[ key ] || bound2original[ key ]) || method, 
			or_key = ObjectID( original, true );
		if( include_binding && or_key )
			original = original2bound[ or_key ] || original;
		return original;
	};

	/**
	 * Give method to this function to get it's original version.
	 * @param	{Function}	method			Function, which original version needed.
	 * @param	{Boolean}	include_binding	If original variant of this function is bound to it's parent, 
	 *                                  	give that variant.
	 * @return	{Function}					undefined or desired original function.
	 */
	main.hookedOf = function ( method ) {
		var original = main.originalOf( method ), 
			id = ObjectID( original, true );
		return id && original2hooked[ id ];
	};

	function SaveHookedPair( new_handler, original, from_outside ) {
		var rewrited = main.removeHooked( original ), 
			new_id = ObjectID( new_handler ), 
			or_id = ObjectID( original );
		hooked2original[ new_id ] = original;
		original2hooked[ or_id ] = new_handler;
		if( from_outside ) {
			hooked_from_outside[ new_id ] = true;
			hooked_from_outside[ or_id ] = true;
		}
		return rewrited;
	};
	function ClearHookInfo( method, from_outside ) {
		var id = ObjectID( method, true ), 
			found = false;
		if( id && ( !from_outside || HasOwn( hooked_from_outside, id ) ) ) {
			var containers = [ hooked2original, original2hooked ];
				li = containers.length - 1, 
				i = 0;
			for( ; i < containers.length; i++ ) {
				var handler = PopProp( hooked2original, id );
				if( handler ) {
					var opp_i = li - i, 
						opp_container = containers[ opp_i ], 
						key = ObjectID( handler, true );
					if( key && !from_outside || HasOwn( hooked_from_outside, key ) ) {
						found = true;
						delete opp_container[ key ];
						if( from_outside ) 
							delete hooked_from_outside[ key ];
					}
				}
			}
		}
		return found;
	};
	function Trim( text ) { return text.replace( /^[\.\s\uFEFF\xA0]+|[\.\s\uFEFF\xA0]+$/g, "" ); };
	function MakeFullName( info ) { return info.path + '.' + info.name; };
	function SplitPath( container ) {
		if( !container ) container = [];
		if( IsArray( container ) ) return container;
		var result = Trim( container ).split( '.' ), i = 0;
		for( ; i < result.length; i++ ) {
			var value = result[ i ] = Trim( result[ i ] );
			if( !value || value == '$' ) return false;
		}
		return result;
	};
	function JoinPath( path ) { return path.join( '.' ) || '*'; };
	function PathToStr( path, prefix ) {
		var raw = path.join( '.' ), path = raw || '*';
		if( prefix && prefix != '*' ) path = prefix + ( raw ? '.' + path : '' );
		return path;
	};
	function ParsePath( raw_path, flags, prefix ) {
		var path = IsArray( raw_path ) ? CopyArray( raw_path ) : SplitPath( raw_path );
		if( !path ) 
			return false;

		//	Default flags is 0
		flags = flags || 0;

		//	Trying to get result
		var only_check = ONLY_CHECK & flags, 
			only_functions = ONLY_FUNCTIONS & flags, 
			ignore_name_fail = IGNORE_NAME_FAIL & flags, 
			bind_to_parent = BIND_TO_PARENT & flags, 

			//	Geting cached result
			result = cached[ PathToStr( path, prefix ) ];
		if( !result ) {
			var current = window, 
				container = publics, 

				ex_sum_path, 
				sum_path = prefix || '', 

				last_i = path.length - 1, 
				i = 0, 

				pre_result = prefix && cached[ prefix ];

			//	If prefix is given, try to get information from that container
			if( pre_result ) {
				current = GetCurrent( pre_result );
				container = pre_result.container;
			}
			for( ; i < path.length; i++ ) {
				var entry = path[ i ], t_cache;

				//	Moving forward with all path
				ex_sum_path = sum_path;
				sum_path += (sum_path && '.') + entry;
				if( t_cache = cached[ sum_path ] ) {
					current = GetCurrent( t_cache );
					container = t_cache.container;
					continue;
				}

				//	If container is invalid, return immediatly.
				if( !current ) 
					return false;

				//	If this entry does not exist in public native JS api, 
				//	and ignore name fail not wanted or this is not the wanted name, 
				//	then execution failed.
				var exists = HasOwn( current, entry ), 
					ex_current = current, 
					is_last = last_i == i, 
					current = current[ entry ];
				if( !exists && ( !ignore_name_fail || !is_last ) ) 
					return false;

				//	If this value is a function, copy that function into originals container directly.
				//	Also, we dont need to convert this function to the original one, 
				//	because if it's undefined here, then it have not been hooked. :)
				var value, ex_container = container;
				if( exists ) {

					//	Saving current original value.
					if( exists ) {
						value = (CanHaveInstance( current ) && IsFunction( current ) && main.originalOf( current, true )) || current;
						container[ entry ] = value;
					}
					container = publics[ sum_path + '.*' ] = _();

					//	Saving public version.
					publics[ sum_path ] = exists ? value : container;
				}

				//	Saving this path information
				cached[ sum_path ] = {
					parents: {
						original: ex_container, 
						current: ex_current
					}, 
					container: container, 
					path: sum_path, 
					name: entry
				};
				if( !exists ) break;
			}
			result = cached[ sum_path ];
		}

		//	Binding this information to parent.
		if( bind_to_parent ) 
			BindToParent( result );

		//	If only function wanted as a result check if it's a function.
		return ( !only_functions || IsFunction( GetOriginal( result ) ) ) && ( only_check ? result.path : result );
	};
	function Load( args, source, flags, on_step, step_args ) {

		//	Geting postfix and prefix information
		var from_path, 
			i = 0, 
			ignore_first_fail = IGNORE_FIRST_NAME_FAIL & flags, 
			succeed_count = 0;
		if( source ) {
			var from_path = ParsePath( source, ONLY_CHECK, null );
			if( !from_path ) 
				return null;
		}

		//	Removing name ignoring flags from flags.
		if( ignore_first_fail ) 
			flags &= ~(IGNORE_FIRST_NAME_FAIL | IGNORE_NAME_FAIL);

		//	Prepearing step arguments
		if( on_step ) {
			step_args = step_args || [];
			step_args.unshift( null );
		}
		for( ; i < args.length; i++ ) {

			//	Spliting this path to get names.
			var t_flags = flags, info;
			if( ignore_first_fail && !i ) 
				t_flags |= IGNORE_NAME_FAIL;

			info = ParsePath( args[ i ], t_flags, from_path );
			if( !info ) 
				continue;

			if( on_step ) {

				//	Calling step handler
				info.index = i;
				step_args[0] = info;
				on_step.apply( null, step_args );
			}
			succeed_count++;
		}
		return succeed_count;
	};
	function PrepareOptions( args, type ) {
		var options = null;
		if( args.length && !IsString( GetLast( args ) ) ) {
			if( args.length <= 1 ) 
				throw new Error( 'No paths left.' );
			options = args.pop();
		}
		return ExtendOptions( options, type );
	};
	function TranslateHandler( info, result, prefixes, group, tr_target, get_name ) {
		var i = info.index, 
			name = info.name, 
			is_first = !i, 
			current = GetCurrent( info, true );	//	parents.current[ name ];

		//	This is the first one.
		if( is_first ) 
			tr_target.info = info;

		//	If everything succeed.
		if( !current ) 
			return;

		//	Geting original method from current one.
		if( !HasOwn( tr_target, 'isObject' ) ) 
			tr_target.isObject = IsObject( current );

		var is_object = tr_target.isObject, 
			original = (is_object && GetOriginal( info )) || current, 
			tr_info = tr_target.info;

		//	Saving this method information into originals
		if( !is_first ) {

			//	If translated, check which vendor prefix was choosed.
			//	For checking use prefix if this index exists in prefixes container, 
			//	otherwise use the hole name to check for any prefix.
			var prefix = prefixes[ i ];
			if( prefix != '*' )
				VendorPrefixes.matched( prefix );

			if( !tr_target.succeed ) 
				SetOriginal( tr_info, publics[ tr_info.path ] = original );
		}
		tr_target.succeed = true;

		//	Saving to result object, which will be returned.
		result.push( get_name ? name : original );

		//	Checking if this method is first in this method groups, save the name of this method.
		if( is_object && !info.group ) {

			//	Saving this group for every handler that exists.
			//	No need to save group info for primitive types, because they will not be used by hooker.
			group[ ObjectID( main.originalOf( current ) ) ] = name;
			info.group = group;
		}
	};

	function NeedStepHandler( info, result, get_first ) {
		if( !get_first || IsObjectEmpty( result ) ) 
			result[ info.name ] = GetOriginal( info );
	};
	/**
	 * Get the original version of some functions.
	 * Give the list of that function names by arguments.
	 * The last argument is the options. If ommited, APIs will be loaded using default options.
	 * @param {String}	...names	Function paths that needed to be loaded.
	 * @param {Options}	options		Load options. (optional)
	 * @return {Mixed}				Returns list of the needed functions, or a function if one function was wanted. False if failed.
	 */
	main.need = function () {
		var args = Slice( arguments ), 
			options = PrepareOptions( args, 'load' ), 
			flags = 0, 
			result = {};

		if( !options ) 
			return false;

		if( options.bindToParent ) 
			flags |= BIND_TO_PARENT;

		//	Geting postfix and prefix information
		Load( args, options.from, flags, NeedStepHandler, [ result, options.first ] );
		if( options.names )
			result = Object.keys( result );
		return options.first || args.length == 1 ? ( options.names ? result.pop() : ShiftObject( result, true ) ) : result;
	};

	/**
	 * Same as need, but does not return getherd functions, just keeps in cache.
	 * @param {String}	...names	Function paths that needed to be loaded.
	 * @param {Options}	options		Load options. (optional)
	 * @return {Mixed}				Returns list of the needed functions, or a function if one function was wanted. False if failed.
	 */
	main.load = function () {
		var args = Slice( arguments ), 
			options = PrepareOptions( args ), 
			flags = 0;
		if( !options )
			return false;

		if( options.bindToParent ) 
			flags |= BIND_TO_PARENT;

		Load( args, options.from, flags );
		return true;
	};

	/**
	 * Used to translate to supported vendor prefixed version.
	 * API still will be available with a non prefixed variant.
	 * @param {String}	method				Methods path to translate.
	 * @param {String}	...custom_versions	Additional verions for this method. (optional)
	 * @param {Object}	options				Translation options. (optional)
	 * @return {Methods}					False if failed, found method(s) otherwise.
	 */
	main.translate = function ( method ) {
		var args = Slice( arguments ), 
			options = PrepareOptions( args, 'translate' );

		if( !options ) 
			return false;

		var flags = IGNORE_FIRST_NAME_FAIL, 
			target = { succeed: false }, 

			group = _(), 
			result = [], 

			names = [], 
			prefixes = [], 
			i = 0;
		for( ; i < args.length; i++ ) {
			var original = args[ i ], 
				versions = VendorPrefixes.versions( original, options.prefixType, true );
			ArrayPush.apply( names, [original].concat( ObjectValues( versions ) ) );
			ArrayPush.apply( prefixes, ['*'].concat( Object.keys( versions ) ) );
		}

		if( options.bindToParent ) 
			flags |= BIND_TO_PARENT;

		Load( names, options.from, flags, TranslateHandler, [ result, prefixes, group, target, options.name ] );
		return result.length ? ( options.getAll && result.length != 1 ? result : result.shift() ) : null;
	};

	function HookHandler( info, rehook, generator, gen_args ) {
		var name = info.name, 
			parents = info.parents, 
			originals = parents.original, 
			currents = parents.current, 

			//	Preparing generator arguments array
			group = info.group || { '*': info.name };

		for( var key in group ) {
			var name = group[ key ], 
				current = currents[ name ] || originals[ name ], 
				original = main.originalOf( current ), 

				//	Hook function will make hooked function look like as original one, 
				//	with the same arguments count and the same name.
				new_handler = Hook( rehook ? original : current, generator, original, gen_args );

			//	If returned hooked version of this function/object is not a function, return immediatly.
			if( !new_handler ) 
				continue;

			//	Saving hooked method information to prevent same function changes
			SaveHookedPair( new_handler, original );

			//	Saving new handler as a current one
			currents[ name ] = new_handler;
		}
	}
	function Hooker( arguments, rehook ) {
		var i = 0, 
			paths = [], 
			generator = null, 
			options = null, 
			gen_args = [];
		for( ; i < arguments.length; i++ ) {
			var entry = arguments[i];
			if( generator ) {
				gen_args.push( entry );
			} else if( IsString( entry ) ) {
				paths.push( entry );
			} else if( IsFunction( entry ) ) {
				generator = entry;
			} else if( !options ) {
				options = entry;
			}
		}

		options = ExtendOptions( options );
		if( !paths.length || !generator ) 
			throw new Error( 'Correct usage` ...path, [options], generator, [...gen_args].' );

		var flags = ONLY_FUNCTIONS;
		if( options.bindToParent ) 
			flags |= BIND_TO_PARENT;
		Load( paths, options.from, flags, HookHandler, [ rehook, generator, gen_args ] );
		return true;
	}

	/**
	 * Hooks a function and replaces it.
	 * If it's already hooked, it will hook the current available version.
	 * @param	{String}	...path				Path to a function that needs to be hooked.
	 * @param	{Function}	generator			Hooked function generator.
	 * @param	{ArrayLike}	...generator_args	Generator arguments. (optional)
	 * @return	{Boolean}						Success indicator.
	 */
	main.hook = function () { return Hooker( arguments, false ); };

	/**
	 * Hooks a function and replaces it. 
	 * This will always hook the original version of desired function.
	 * @param	{String}	...path				Path to a function that needs to be hooked.
	 * @param	{Function}	generator			Hooked function generator.
	 * @param	{ArrayLike}	...generator_args	Generator arguments. (optional)
	 * @return	{Boolean}						Success indicator.
	 */
	main.reHook = function () { return Hooker( arguments, true ); };

	/**
	 * This one hooks given function and add's hooked pair.
	 * @param	{Function}	original	Original function which needs to be hooked.
	 * @param	{UINT}		flags		Available flags`
	 *                       			Natives.DONT_FAKE
	 *                       			Natives.SAVE
	 *                       			Pass dont fake if you dont need additional 
	 *                           		If it's for your own use and there is no need to fake properties to original function, will increase performance.
	 * @param	{Function}	generator	Hooker function.
	 * @param	{...Mixed}	hooker_args Additional args to pass to generator function.
	 * @return	{Function}				Hooked function.
	 */
	main.DONT_FAKE = 1;
	main.SAVE = 2;
	main.hookFunction = function ( original, flags, generator ) {
		if( !IsUINT( flags ) )
			InsertAt( arguments, 0, 1 );
		return HookFunctionAction.apply( main, arguments );
	};
	function HookFunctionAction( original, flags, generator ) {
		var fake_it = !(main.DONT_FAKE & flags), 
			save = main.SAVE & flags, 
			hooked = Hook( original, generator, fake_it && original, Slice( arguments, 3 ) );
		if( save ) 
			main.saveHooked( hooked, original );
		return hooked;
	};

	/**
	 * Use this function from outside to save hooked functions pair to fake toString function result :).
	 * NOTE: This is not a weak pointer container, 
	 * so make sure you deleted those functions from here if they become unavailable.
	 * @param	{Function}	hooked		Hooked function.
	 * @param	{Function}	original	Original function that has been hooked.
	 * @return	{Boolean}				True if this original was already hooked, and now we are rewriting it.
	 */
	main.saveHooked = function ( hooked, original ) { return SaveHookedPair( hooked, original, true ); };

	/**
	 * Deletes hooked functions pair if it became unavailable is no need anymore
	 * @param	{Function}	method	A function, does'nt matter hooked one or original.
	 * @return	{Boolean}			True if function has been found and deleted.
	 */
	main.removeHooked = function ( method ) { return ClearHookInfo( method, true ); };

	/**
	 * Restores an original function.
	 * @param	{String}	path	Path to a function that needs to be restored to the original one.
	 * @return	{Boolean}			Success indicator.
	 */
	function RestoreHandler( info ) {
		var name = info.name, 
			parents = info.parents, 
			currents = parents.current, 
			current = currents[ name ];

		//	Saving hooked method information to prevent same function changes
		currents[ name ] = main.originalOf( current );
		ClearHookInfo( current );
	}
	main.restore = function () {
		var args = Slice( arguments ), 
			options = PrepareOptions( args );

		Load( args, options.from, ONLY_FUNCTIONS, RestoreHandler );
	};

	//	Hooking toString method of Function, to prevent geting it's hooked source code. 3:)
	//	By doing this, checking if function is hooked or not, becomes impossible.
	main.need( 'toString', 'toSource', { from: 'Function.prototype', names: true } ).forEach( function ( method ) {
		main.hook( 'Function.prototype.' + method, function ( original ) {
			return function () {
				return this[faked_to_string_keys[ original.name ]] || original.apply( this, arguments );
			};
		} );
	} );
	return main;
} );