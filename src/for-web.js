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
	function IsScalar( value ) { return !IsObject( value ); };
	function IsNumber( value ) { return !isNaN( value ) && value+0 === value; };
	function IsObject( value ) { return value != null && ( typeof value === 'function' || typeof value === 'object' ); };
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
	var ObjectID = ( function () {
		var self = ObjectID;
		function ObjectID( target, dont_make ) {
			var key = target.objectUniqueID;
			if( !key && !dont_make ) 
				Object.defineProperty( target, self.$, { value: key = RandomString() } )
			return key;
		};
		self.$ = 'objectUniqueID';
		return self;
	} ) ();
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
	function IsClass( target ) {
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

		faked_to_string_keys = { toString: RandomString(4) + '-hooked-function-faked-toString' }, 

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
	if( 'toSource' in Function.prototype )
		faked_to_string_keys.toSource = RandomString(4) + '-hooked-function-faked-toSource';

	var ExtendOptions = ( function ( all_options, options ) {

		//	Preparing all options objects.
		var overall = PopProp( all_options, 'overall' ), 
			defaults = { '*': PopProp( overall, 'default' ) };
		options[ '*' ] = overall;
		for( var name in all_options ) {
			options[ name ] = Extend( _(), overall, all_options[ name ] );
			defaults[ name ] = PopProp( options[ name ], 'default' );
		};
		return function ExtendOptions( settings, type ) {
			type = type || '*';
			var def_options = options[ type ], 
				def_property = defaults[ type ];
			if( IsScalar( settings ) && settings != null ) 
				settings = def_property && _( def_property, settings ) || undefined;
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
		hook: {
			rehook: true, 
			ignoreHookeds: true, 
			default: 'rehook'
		}, 
		need: {
			names: false, 
			first: false, 
			default: 'names'
		}
	}, {
		'hook-function': {
			fake: true,
			save: false
		}
	} );

	var CopyOwnProperties = ( function () {
		var props_to_ignore = { prototype: 0 };
		props_to_ignore[ ObjectID.$ ] = 0;
		return function CopyOwnProperties( source, target ) {
			//	Copying all own properties.
			var list = Object.getOwnPropertyNames( source ), 
				i = 0;
			for( ; i < list.length; i++ ) {
				var prop = list[i];
				if( !HasOwn( props_to_ignore, prop ) && !HasOwn( target, prop ) )
					Object.defineProperty( target, prop, Object.getOwnPropertyDescriptor( source, prop ) );
			}
			return target;
		};
	} ) ();
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
			var hooked = generator.apply( null, args ), 
				source = original || handler;
			if( !IsFunction( hooked ) )
				throw new Error( 'Hook method\'s generator argument MUST return a function.' );

			//	Faking hooked call and copying prototype, properties and methods that are defined natively.
			if( original ) 
				hooked = FakeIt( hooked, original );

			//	If original function is not given, no need to fake it.
			hooked.prototype = source.prototype;
			CopyOwnProperties( source, hooked );
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
			var parent = (info.instance && info.instance.object) || info.parents.current;
			original2bound[ key ] = bound = Hook( method, function ( original ) {
				return function () {
					return original.apply( parent, arguments );
				};
			}, method );
			SetOriginal( info, bound );
			bound2original[ ObjectID( bound ) ] = original;
		}
		return true;
	};

	var Accessors = ( function () {
		var names = [ 'get', 'set' ];
		return function Accessors( target, property ) {
			var descriptor = Object.getOwnPropertyDescriptor( target, property ), 
				result = _();
			if( !descriptor )
				return result;
			for( var i = 0; i < names.length; i++ ) {
				var name = names[i], 
					accessor = descriptor[ name ];
				if( accessor )
					result[ name ] = accessor;
			}
			return result;
		};
	} ) ();
	function GetAccessor( target, property, which ) {
		var descriptor = Object.getOwnPropertyDescriptor( target, property );
		return descriptor && descriptor[ which ];
	};

	//	Functions to get current and original parents from cache information entry.
	//	For current parents container, we need to check if that name in current container exists, 
	//	in other case, get it from original container, becuase maybe it's have been translated.
	function SetOriginal( info, value ) {
		var accessor = info.accessor;
		if( accessor ) {
			accessor.original = value;
		} else {
			info.parents.original[ info.name ] = value;
			if( info.instance ) 
				publics[ info.instance.path ] = value;
		}
	};
	function SetCurrent( info, value, name ) {
		var currents = info.parents.current, 
			accessor = info.accessor;
		name = name || info.name;
		if( accessor ) {
			var descriptor = Object.getOwnPropertyDescriptor( currents, name );
			if( descriptor && (descriptor.set || descriptor.get) ) {
				descriptor[ accessor.name ] = value;
				try {
					Object.defineProperty( currents, name, descriptor );
					return true;
				} catch( err ) {}
			}
			return false;
		}
		currents[ name ] = value;
		return true;
	};

	/**
	 * Give method to this function to get it's original version.
	 * @param	{Function}	method			Function, which original version needed.
	 * @param	{Boolean}	inc_binds	If original variant of this function is bound to it's parent, 
	 *                                  	give that variant.
	 * @return	{Function}					undefined or desired original function.
	 */
	main.originalOf = function ( method, inc_binds ) {
		if( !method )
			return null;
		var key = ObjectID( method, true ), 
			original = key && (hooked2original[ key ] || bound2original[ key ]) || method, 
			or_key = ObjectID( original, true );
		if( inc_binds && or_key )
			original = original2bound[ or_key ] || original;
		return original;
	};

	/**
	 * Give method to this function to get it's current hooked version.
	 * @param	{Function}	method			Function, which hooked version needed.
	 * @return	{Function}					undefined or desired hooked function.
	 */
	main.hookedOf = function ( method ) {
		if( !method )
			return null;
		var original = main.originalOf( method ), 
			id = ObjectID( original, true );
		return id && original2hooked[ id ];
	};

	function GetOriginal( info, name ) {
		var accessor = info.accessor, 
			parents = info.parents;
		if( accessor && name && name != info.name ) {
			var accessor_f = GetAccessor( parents.current, name, accessor );
			return accessor_f && main.originalOf( accessor_f );
		}
		return (accessor && accessor.original) || parents.original[ name || info.name ];
	};
	function GetCurrent( info, name, not_orig ) {
		var original, orig_name, 
			accessor = info.accessor, 
			currents = info.parents.current;
		orig_name = name;
		name = name || info.name;
		return (accessor && GetAccessor( currents, name, accessor.name )) || currents[ name ] || (not_orig && (main.hookedOf( original = GetOriginal( info, orig_name )) || original));
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
		if( id && ( !from_outside || PopProp( hooked_from_outside, id ) ) ) {
			var containers = [ hooked2original, original2hooked ];
				li = containers.length - 1, 
				i = 0;
			for( ; i < containers.length; i++ ) {
				var container = containers[i], 
					handler = PopProp( container, id );
				if( handler ) {
					var opp_i = li - i, 
						opp_container = containers[ opp_i ], 
						key = ObjectID( handler, true );
					if( key && !from_outside || HasOwn( hooked_from_outside, key ) ) {
						found = true;
						delete opp_container[ key ];
						delete hooked_from_outside[ key ];
					}
				}
			}
		}
		return found;
	};
	function Trim( path ) { return path.replace( /^[\.\s\uFEFF\xA0]+|[\.\s\uFEFF\xA0]+$/g, '' ); };
	function SplitPath( path_str, ret_empty ) {
		if( !path_str )
			return [];

		var path = Trim( path_str ).split( '.' ), i = 0;
		for( ; i < path.length; i++ ) {
			var entry = Trim( path[ i ] ), 

				//	Checking for needed accessor.
				a_pos = entry.indexOf( '>' );

			if( a_pos != -1 ) {
				var accessor = Trim(entry.slice( a_pos + 1 ));
				entry = (accessor == 'get' || accessor == 'set') && (Trim(entry.slice( 0, a_pos )) + '>' + accessor);
			}

			if( !( path[ i ] = entry ) ) {
				console.error( 'Invalid path string', path_str, 'given' );
				return false;
			}
		}
		return path;
	};
	var GetFunctionName = ( function () {
		var has = 'name' in Function;
		return function GetFunctionName( target ) {
			if( !target )
				return '';
			var is_func = IsFunction( target ),
				can_have_instance = is_func || IsClass( target );
			if( !can_have_instance )
				return '';
			if( has && is_func )
				return target.name;
			var result = target.toString().trim();
			if( is_func ) {
				result = result.slice( 9 );
				result = result.slice( 0, result.indexOf( '(' ) );
			} else {
				result = result.slice( 8, -1 );
			}
			return result;
		};
	} ) ();
	var GetPrototypesOf = ( function() {
		var data_key = 'objects-class-list';
		return function GetPrototypesOf( target, get_list ) {
			if( target[ data_key ] )
				return target[ data_key ];
			var list = get_list ? [] : _(), proto = target, name;
			while( 
				(IsClass( proto ) ? proto = proto.prototype : proto) && 
				(proto = Object.getPrototypeOf( proto )) && 
				(name = GetFunctionName( proto.constructor )) 
			) {
				if( get_list ) {
					list.push( proto );
				} else {
					list[ name ] = proto;
				}
			}
			Object.defineProperty( target, data_key, { value: list } );
			return list;
		};
	} ) ();

	//	This function is only used for cached containers, which are empty.
	function ClearPathInfo( path ) {
		path = Shortcuts.getReal( path );
		delete cached[ path ];
		delete publics[ path ];
		delete publics[ path + '.*' ];
	};
	function GetCached( path, translated ) { return cached[ translated ? path : Shortcuts.getReal( path ) ]; };
	var Shortcuts = ( function () {
		var self = _(), 
			list = _();
		self.save = function ( shortcut, real_path ) {
			var info = GetCached( real_path ), 
				original = GetOriginal( info );
			real_path = info.path;
			publics[ shortcut ] = original;

			//	Saving container information.
			if( info.container )
				publics[ shortcut + '.*' ] = info.container;
			list[ shortcut ] = info.path;
		};
		self.getReal = function ( path, only_translated ) {
			return list[ path ] || (!only_translated && path);
		};
		return self;
	} ) ();
	function ParsePath( path, flags ) {

		//	Default flags is 0
		flags = flags >>> 0;

		//	Trying to get result
		var only_check = ONLY_CHECK & flags, 
			only_functions = ONLY_FUNCTIONS & flags, 
			ignore_name_fail = IGNORE_NAME_FAIL & flags, 
			bind_to_parent = BIND_TO_PARENT & flags, 

			//	Geting cached result
			result = GetCached( path.join('.') );

		if( !result ) {
			var current = window, 
				container = publics, 

				ex_sum_path, 
				t_cache, 

				sum_path = '', 
				shortcuts = [], 

				last_i = path.length - 1, 
				i = 0;

			for( ; i < path.length; i++ ) {
				var entry = path[i], 

					ex_entry = full_entry, 
					full_entry = entry, 
					sum_path_woa = sum_path, 

					is_last = last_i == i, 
					accessor = null, 
					shortcut, 

					//	Accessor separator simbol position.
					a_pos = entry.indexOf( '>' );

				//	Parsing getter/setter information array.
				//	If this had a getter setter attribute.
				if( a_pos != -1 ) {
					accessor = entry.slice( a_pos + 1 );
					entry = entry.slice( 0, a_pos );
				}

				//	Moving forward with all path.
				ex_sum_path = sum_path;

				//	woa is 'without accessor'.
				sum_path += (sum_path && '.') + full_entry;
				sum_path_woa += (sum_path_woa && '.') + entry;

				//	Getting shortcut path from this one.
				shortcut = Shortcuts.getReal( sum_path, true );
				if( t_cache = GetCached( shortcut || sum_path, true ) ) {
					current = GetCurrent( t_cache );
					container = t_cache.container;

					//	Changing sum path to the needed one.
					if( shortcut ) {
						shortcuts.push( sum_path );
						sum_path = t_cache.path;
					}
					continue;
				}

				//	Checking if given entry exists in current path item.
				//	If it exists in it's prototype chain, check to which one it belongs, 
				//	parse that path, and return it.
				//	Also create a shortcut with publics API.
				var exists = entry in current;
				if( exists && !HasOwn( current, entry ) ) {

					//	If this was a class, add a new entry to a path, 
					//	to find a prototype object.
					//	And assign this entry to it.
					var real_one, protos = GetPrototypesOf( current );
					for( var name in protos ) {
						var proto = protos[ name ];
						if( HasOwn( proto, entry ) ) {

							//	This case is only possible if accessor wanted, but not existed.
							real_one = ParsePath( [ name, 'prototype', full_entry ] );
							if( !real_one ) {
								return false;

								//	Copying an instance object for bindToParent functionality, 
								//	specially for FUCKING IE11.
							} else if( ex_entry != 'prototype' && (current instanceof Natives.$[name]) ) {
								real_one.instance = {
									path: sum_path, 
									object: current
								};
							}
							break;
						}
					}
					if( !real_one ) {
						console.error( 'Couldnt find method/property.' );
						return false;
					}

					//	Creating a shortcut path.
					container[ full_entry ] = publics[ sum_path ] = GetOriginal( real_one );

					//	In case of shortucts, no difference of choosing 
					//	original or current versions of wanted item.
					//	Copying container from the real cache.
					current = GetCurrent( real_one );
					container = real_one.container;
					sum_path = real_one.path;

					//	Saving a new shortcut entry.
					shortcuts.push( ex_sum_path );
				} else {

					//	If this entry does not exist in public native JS api, 
					//	and ignore name fail not wanted or this is not the wanted name, 
					//	then execution failed.
					var accessors = Accessors( current, entry ), 
						has_accessors = !IsObjectEmpty( accessors );

					//	If accessor given, check if it really exists.
					exists = exists && (!accessor || HasOwn( accessors, accessor ));
					if( !exists && ( !ignore_name_fail || !is_last ) )
						return false;

					//	If accessor does not exist for this function, create a dummy one.
					if( !exists && accessor )
						accessors[ accessor ] = null;

					//	If this value is a function, copy that function into originals container directly.
					//	Also, we dont need to convert this function to the original one, 
					//	because if it's undefined here, then it have not been hooked. :)
					var save_to_cache = _(), 
						ex_current = current, 
						ex_container = container;
					if( has_accessors ) {
						for( var name in accessors ) {
							var plus_name = '>' + name, 
								full_path = sum_path_woa + plus_name, 
								accessor_f = accessors[ name ], 
								this_container = _();

							if( accessor_f )
								publics[ full_path ] = main.originalOf( accessor_f, true );
							publics[ full_path + '.*' ] = this_container;

							save_to_cache[ name ] = this_container;
						}
					} else {
						current = current[ entry ];

						//	Checking if wanted entry really exists.
						if( exists ) 
							publics[ sum_path ] = container[ full_entry ] = (IsFunction( current ) && main.originalOf( current, true )) || current;
						publics[ sum_path + '.*' ] = save_to_cache[ '*' ] = _();
					}

					//	This will be saved in cache.
					container = save_to_cache[ accessor || '*' ];

					//	Saving this path information.
					for( var name in save_to_cache ) {
						var this_container = save_to_cache[ name ], 
							full_path = sum_path_woa, plus_name, 
							is_accessor = name != '*' && this_container;

						if( is_accessor ) {
							full_path += plus_name = '>' + name;
						} else {
							name = null;
						}

						//	Caching this path information.
						cached[ full_path ] = {
							parents: {
								original: ex_container, 
								current: ex_current
							}, 
							accessor: is_accessor && {
								name: name, 
								original: (accessor_f = accessors[ name ]) || main.originalOf( accessor_f, true )
							}, 
							container: this_container, 
							path: full_path, 
							name: entry
						};
					}

					var j = 0;
					for( ; j < shortcuts.length; j++ ) 
						Shortcuts.save( shortcuts[j] += (shortcuts[j] && '.') + full_entry, sum_path );
				}

				//	If value does not exist, return false.
				if( !exists ) {
					break;

					//	If changers existed but not wanted, and this is not the last path item wanted, 
					//	that this failed because if property has a getter setter defined, 
					//	it's value is not static, so we need to ignore it.
				} else if( has_accessors && !is_last && !accessor ) {
					return false;
				}
			}
			result = GetCached( sum_path );
		}

		//	Binding this information to parent.
		if( bind_to_parent ) 
			BindToParent( result );

		//	If only function wanted as a result check if it's a function.
		return ( !only_functions || IsFunction( GetOriginal( result ) ) ) && ( only_check ? result.path : result );
	};
	function Load( args, source, flags, on_step, step_args ) {

		//	Geting postfix and prefix information
		var i = 0, 
			ignore_first_fail = IGNORE_FIRST_NAME_FAIL & flags;

		//	Removing name ignoring flags from flags.
		if( ignore_first_fail ) 
			flags &= ~(IGNORE_FIRST_NAME_FAIL | IGNORE_NAME_FAIL);

		//	Prepearing step arguments
		if( on_step ) {
			step_args = step_args || [];
			step_args.unshift( null );
		}

		//	Trimming source path string.
		source = SplitPath( source, true );
		for( ; i < args.length; i++ ) {

			//	Spliting this path to get names.
			var t_flags = flags, info;
			if( ignore_first_fail && !i ) 
				t_flags |= IGNORE_NAME_FAIL;

			info = ParsePath( source.concat( SplitPath( args[i] ) ), t_flags );
			if( !info ) 
				continue;

			if( on_step ) {

				//	Calling step handler
				info.index = i;
				step_args[0] = info;
				on_step.apply( null, step_args );
			}
		}
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
			current = GetCurrent( info, null, true );	//	parents.current[ name ];

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
			var key = ObjectID( main.originalOf( current ) );
			if( !HasOwn( group, key ) ) 
				group[ key ] = name;
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
	 * Finds a prototype object which has own given method.
	 * @param  {Object}	object	Object in which we need to find that method.
	 * @param  {String}	method	Method name to search for.
	 * @return {Mixed}			Gives found prototype object or null if not found.
	 */
	main.findProto = function ( object, method ) {
		var protos, proto, i = 0;
		if( method in object ) {
			protos = GetPrototypesOf( object, true );
			for( ; i < protos.length; i++ ) 
				if( HasOwn( proto = protos[ i ], method ) )
					return proto;
		}
		return null;
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

		//	First handler will be parsed even if value is not found, 
		//	so delete it in case of failure.
		if( !result.length )
			ClearPathInfo( target.path );
		return result.length ? ( options.getAll ? result : result.shift() ) : null;
	};
	function HookHandler( info, rehook, ignore_if_hooked, generator, gen_args ) {

		//	Preparing generator arguments array
		var group = info.group || { '*': info.name };
		for( var key in group ) {
			var name = key != '*' && group[ key ], 
				current = GetCurrent( info, name, true ), 
				original = main.originalOf( current ), 

				//	Hook function will make hooked function look like as original one, 
				//	with the same arguments count and the same name.
				new_handler = (original == current || !ignore_if_hooked) && Hook( rehook ? original : current, generator, original, gen_args );

			//	If returned hooked version of this function/object is not a function, return immediatly.
			if( new_handler && SetCurrent( info, new_handler, name ) ) 
				SaveHookedPair( new_handler, original );
		}
	};

	/**
	 * Hooks a function and replaces it.
	 * If it's already hooked, it will hook the current available version.
	 * @param	{String}	...path				Path to a function that needs to be hooked.
	 * @param	{Function}	generator			Hooked function generator.
	 * @param	{ArrayLike}	...generator_args	Generator arguments. (optional)
	 * @return	{Boolean}						Success indicator.
	 */
	function HookUsingPaths() {
		var i = 0, 
			generator = null, 
			options = null, 
			paths = [], 
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

		if( !paths.length || !generator ) 
			throw new Error( 'Correct usage` ...path, [options], generator, [...gen_args].' );
		options = ExtendOptions( options, 'hook' );

		var flags = ONLY_FUNCTIONS, 
			ignore_hookeds = options.ignoreHookeds;
		if( options.bindToParent ) 
			flags |= BIND_TO_PARENT;
		Load( paths, options.from, flags, HookHandler, [ !ignore_hookeds && options.rehook, ignore_hookeds, generator, gen_args ] );
		return true;
	};

	/**
	 * This one hooks given function and saves in the container if there is a need.
	 * @param	{Function}	original	Original function which needs to be hooked.
	 * @param	{UINT}		options		Available options`
	 *                         			save	false by default
	 *                         			fake	true by default
	 *                       			Pass fake as false if it's for your own use and there is no 
	 *                       			need to fake properties to original function, will increase performance.
	 * @param	{Function}	generator	Hooker function.
	 * @param	{...Mixed}	hooker_args Additional args to pass to generator function.
	 * @return	{Function}				Hooked function.
	 */
	function HookFunction( original, options, generator ) {
		if( IsFunction( options ) ) {
			generator = options;
			options = {};
		}
		options = ExtendOptions( options, 'hook-function' );
		var hooked = Hook( original, generator, options.fake && original, Slice( arguments, 3 ) );
		if( options.save ) 
			main.saveHooked( hooked, original );
		return hooked;
	};

	/**
	 * Hooks given functions.
	 * This function has 2 declarations, see HookFunction and HookUsingPaths.
	 */
	main.hook = function ( first ) {
		return (IsFunction( first ) ? HookFunction : HookUsingPaths).apply( main, arguments );
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

		//	Getting group information of wanted resource.
		var group = info.group || { '*': info.name };
		for( var key in group ) {
			var name = key != '*' && group[ key ], 
				current = GetCurrent( info, name, true ), 
				original = main.originalOf( current );

			if( current != original && SetCurrent( info, CopyOwnProperties( current, original ), name ) ) 
				ClearHookInfo( current );
		}
	};
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
				return this[faked_to_string_keys[ method ]] || original.apply( this, arguments );
			};
		} );
	} );
	return main;
} );