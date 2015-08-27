var fs = require('fs')
 , path = require('path');

var source = 'test/';

 var filename = 'test.b';

var Module = {'preRun' : function() {

                      
          var sourcePath = FS.createPath('/', source, true, false);

           var files = fs.readdirSync(source); 

           var file = path.join(source, filename);
            
           var data = fs.readFileSync(file);
           FS.createDataFile(sourcePath, filename, data, true, false); 
              },
};
Module.arguments = ['test/test.b'];
Module.return = '';
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = (typeof Module !== 'undefined' ? Module : null) || {};

// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}

// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_WEB = typeof window === 'object';
// Three configurations we can be running in:
// 1) We could be the application main() thread running in the main JS UI thread. (ENVIRONMENT_IS_WORKER == false and ENVIRONMENT_IS_PTHREAD == false)
// 2) We could be the application main() thread proxied to worker. (with Emscripten -s PROXY_TO_WORKER=1) (ENVIRONMENT_IS_WORKER == true, ENVIRONMENT_IS_PTHREAD == false)
// 3) We could be an application pthread running in a worker. (ENVIRONMENT_IS_WORKER == true and ENVIRONMENT_IS_PTHREAD == true)
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function' && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;

if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  if (!Module['print']) Module['print'] = function print(x) {
    process['stdout'].write(x + '\n');
  };
  if (!Module['printErr']) Module['printErr'] = function printErr(x) {
    process['stderr'].write(x + '\n');
  };

  var nodeFS = require('fs');
  var nodePath = require('path');

  Module['read'] = function read(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };

  Module['readBinary'] = function readBinary(filename) { return Module['read'](filename, true) };

  Module['load'] = function load(f) {
    globalEval(read(f));
  };

  if (!Module['thisProgram']) {
    if (process['argv'].length > 1) {
      Module['thisProgram'] = process['argv'][1].replace(/\\/g, '/');
    } else {
      Module['thisProgram'] = 'unknown-program';
    }
  }

  Module['arguments'] = process['argv'].slice(2);

  if (typeof module !== 'undefined') {
    module['exports'] = Module;
  }

  process['on']('uncaughtException', function(ex) {
    // suppress ExitStatus exceptions from showing an error
    if (!(ex instanceof ExitStatus)) {
      throw ex;
    }
  });

  Module['inspect'] = function () { return '[Emscripten Module object]'; };
}
else if (ENVIRONMENT_IS_SHELL) {
  if (!Module['print']) Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm

  if (typeof read != 'undefined') {
    Module['read'] = read;
  } else {
    Module['read'] = function read() { throw 'no read() available (jsc?)' };
  }

  Module['readBinary'] = function readBinary(f) {
    if (typeof readbuffer === 'function') {
      return new Uint8Array(readbuffer(f));
    }
    var data = read(f, 'binary');
    assert(typeof data === 'object');
    return data;
  };

  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function read(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };

  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }

  if (typeof console !== 'undefined') {
    if (!Module['print']) Module['print'] = function print(x) {
      console.log(x);
    };
    if (!Module['printErr']) Module['printErr'] = function printErr(x) {
      console.log(x);
    };
  } else {
    // Probably a worker, and without console.log. We can do very little here...
    var TRY_USE_DUMP = false;
    if (!Module['print']) Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
  }

  if (ENVIRONMENT_IS_WORKER) {
    Module['load'] = importScripts;
  }

  if (typeof Module['setWindowTitle'] === 'undefined') {
    Module['setWindowTitle'] = function(title) { document.title = title };
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}

function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] && Module['read']) {
  Module['load'] = function load(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
if (!Module['thisProgram']) {
  Module['thisProgram'] = './this.program';
}

// *** Environment setup code ***

// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];

// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];

// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}



// === Preamble library stuff ===

// Documentation for the public APIs defined in this file must be updated in: 
//    site/source/docs/api_reference/preamble.js.rst
// A prebuilt local version of the documentation is available at: 
//    site/build/text/docs/api_reference/preamble.js.txt
// You can also build docs locally as HTML or other formats in site/
// An online HTML version (which may be of a different version of Emscripten)
//    is up at http://kripken.github.io/emscripten-site/docs/api_reference/preamble.js.html

//========================================
// Runtime code shared with compiler
//========================================

var Runtime = {
  setTempRet0: function (value) {
    tempRet0 = value;
  },
  getTempRet0: function () {
    return tempRet0;
  },
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  getNativeTypeSize: function (type) {
    switch (type) {
      case 'i1': case 'i8': return 1;
      case 'i16': return 2;
      case 'i32': return 4;
      case 'i64': return 8;
      case 'float': return 4;
      case 'double': return 8;
      default: {
        if (type[type.length-1] === '*') {
          return Runtime.QUANTUM_SIZE; // A pointer
        } else if (type[0] === 'i') {
          var bits = parseInt(type.substr(1));
          assert(bits % 8 === 0);
          return bits/8;
        } else {
          return 0;
        }
      }
    }
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  STACK_ALIGN: 16,
  prepVararg: function (ptr, type) {
    if (type === 'double' || type === 'i64') {
      // move so the load is aligned
      if (ptr & 7) {
        assert((ptr & 7) === 4);
        ptr += 4;
      }
    } else {
      assert((ptr & 3) === 0);
    }
    return ptr;
  },
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (!vararg && (type == 'i64' || type == 'double')) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      assert(args.length == sig.length-1);
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      assert(sig.length == 1);
      assert(('dynCall_' + sig) in Module, 'bad function pointer type - no table for sig \'' + sig + '\'');
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2*(1 + i);
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[sig]) {
      Runtime.funcWrappers[sig] = {};
    }
    var sigCache = Runtime.funcWrappers[sig];
    if (!sigCache[func]) {
      sigCache[func] = function dynCall_wrapper() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return sigCache[func];
  },
  getCompilerSetting: function (name) {
    throw 'You must build with -s RETAIN_COMPILER_SETTINGS=1 for Runtime.getCompilerSetting or emscripten_get_compiler_setting to work';
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = (((STACKTOP)+15)&-16);(assert((((STACKTOP|0) < (STACK_MAX|0))|0))|0); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + (assert(!staticSealed),size))|0;STATICTOP = (((STATICTOP)+15)&-16); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + (assert(DYNAMICTOP > 0),size))|0;DYNAMICTOP = (((DYNAMICTOP)+15)&-16); if (DYNAMICTOP >= TOTAL_MEMORY) { var success = enlargeMemory(); if (!success) { DYNAMICTOP = ret; return 0; } }; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 16))*(quantum ? quantum : 16); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+((low>>>0)))+((+((high>>>0)))*4294967296.0)) : ((+((low>>>0)))+((+((high|0)))*4294967296.0))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}



Module["Runtime"] = Runtime;



//========================================
// Runtime essentials
//========================================

var __THREW__ = 0; // Used in checking for thrown exceptions.

var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var EXITSTATUS = 0;

var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD, tempDouble, tempFloat;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;

function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}

var globalScope = this;

// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  var func = Module['_' + ident]; // closure exported function
  if (!func) {
    try {
      func = eval('_' + ident); // explicit lookup
    } catch(e) {}
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}

var cwrap, ccall;
(function(){
  var JSfuncs = {
    // Helpers for cwrap -- it can't refer to Runtime directly because it might
    // be renamed by closure, instead it calls JSfuncs['stackSave'].body to find
    // out what the minified function name is.
    'stackSave': function() {
      Runtime.stackSave()
    },
    'stackRestore': function() {
      Runtime.stackRestore()
    },
    // type conversion from js to c
    'arrayToC' : function(arr) {
      var ret = Runtime.stackAlloc(arr.length);
      writeArrayToMemory(arr, ret);
      return ret;
    },
    'stringToC' : function(str) {
      var ret = 0;
      if (str !== null && str !== undefined && str !== 0) { // null string
        // at most 4 bytes per UTF-8 code point, +1 for the trailing '\0'
        ret = Runtime.stackAlloc((str.length << 2) + 1);
        writeStringToMemory(str, ret);
      }
      return ret;
    }
  };
  // For fast lookup of conversion functions
  var toC = {'string' : JSfuncs['stringToC'], 'array' : JSfuncs['arrayToC']};

  // C calling interface. 
  ccall = function ccallFunc(ident, returnType, argTypes, args, opts) {
    var func = getCFunc(ident);
    var cArgs = [];
    var stack = 0;
    assert(returnType !== 'array', 'Return type should not be "array".');
    if (args) {
      for (var i = 0; i < args.length; i++) {
        var converter = toC[argTypes[i]];
        if (converter) {
          if (stack === 0) stack = Runtime.stackSave();
          cArgs[i] = converter(args[i]);
        } else {
          cArgs[i] = args[i];
        }
      }
    }
    var ret = func.apply(null, cArgs);
    if ((!opts || !opts.async) && typeof EmterpreterAsync === 'object') {
      assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling ccall');
    }
    if (opts && opts.async) assert(!returnType, 'async ccalls cannot return values');
    if (returnType === 'string') ret = Pointer_stringify(ret);
    if (stack !== 0) {
      if (opts && opts.async) {
        EmterpreterAsync.asyncFinalizers.push(function() {
          Runtime.stackRestore(stack);
        });
        return;
      }
      Runtime.stackRestore(stack);
    }
    return ret;
  }

  var sourceRegex = /^function\s*\(([^)]*)\)\s*{\s*([^*]*?)[\s;]*(?:return\s*(.*?)[;\s]*)?}$/;
  function parseJSFunc(jsfunc) {
    // Match the body and the return value of a javascript function source
    var parsed = jsfunc.toString().match(sourceRegex).slice(1);
    return {arguments : parsed[0], body : parsed[1], returnValue: parsed[2]}
  }
  var JSsource = {};
  for (var fun in JSfuncs) {
    if (JSfuncs.hasOwnProperty(fun)) {
      // Elements of toCsource are arrays of three items:
      // the code, and the return value
      JSsource[fun] = parseJSFunc(JSfuncs[fun]);
    }
  }

  
  cwrap = function cwrap(ident, returnType, argTypes) {
    argTypes = argTypes || [];
    var cfunc = getCFunc(ident);
    // When the function takes numbers and returns a number, we can just return
    // the original function
    var numericArgs = argTypes.every(function(type){ return type === 'number'});
    var numericRet = (returnType !== 'string');
    if ( numericRet && numericArgs) {
      return cfunc;
    }
    // Creation of the arguments list (["$1","$2",...,"$nargs"])
    var argNames = argTypes.map(function(x,i){return '$'+i});
    var funcstr = "(function(" + argNames.join(',') + ") {";
    var nargs = argTypes.length;
    if (!numericArgs) {
      // Generate the code needed to convert the arguments from javascript
      // values to pointers
      funcstr += 'var stack = ' + JSsource['stackSave'].body + ';';
      for (var i = 0; i < nargs; i++) {
        var arg = argNames[i], type = argTypes[i];
        if (type === 'number') continue;
        var convertCode = JSsource[type + 'ToC']; // [code, return]
        funcstr += 'var ' + convertCode.arguments + ' = ' + arg + ';';
        funcstr += convertCode.body + ';';
        funcstr += arg + '=' + convertCode.returnValue + ';';
      }
    }

    // When the code is compressed, the name of cfunc is not literally 'cfunc' anymore
    var cfuncname = parseJSFunc(function(){return cfunc}).returnValue;
    // Call the function
    funcstr += 'var ret = ' + cfuncname + '(' + argNames.join(',') + ');';
    if (!numericRet) { // Return type can only by 'string' or 'number'
      // Convert the result to a string
      var strgfy = parseJSFunc(function(){return Pointer_stringify}).returnValue;
      funcstr += 'ret = ' + strgfy + '(ret);';
    }
    funcstr += "if (typeof EmterpreterAsync === 'object') { assert(!EmterpreterAsync.state, 'cannot start async op with normal JS calling cwrap') }";
    if (!numericArgs) {
      // If we had a stack, restore it
      funcstr += JSsource['stackRestore'].body.replace('()', '(stack)') + ';';
    }
    funcstr += 'return ret})';
    return eval(funcstr);
  };
})();
Module["ccall"] = ccall;
Module["cwrap"] = cwrap;

function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[((ptr)>>0)]=value; break;
      case 'i8': HEAP8[((ptr)>>0)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,(tempDouble=value,(+(Math_abs(tempDouble))) >= 1.0 ? (tempDouble > 0.0 ? ((Math_min((+(Math_floor((tempDouble)/4294967296.0))), 4294967295.0))|0)>>>0 : (~~((+(Math_ceil((tempDouble - +(((~~(tempDouble)))>>>0))/4294967296.0)))))>>>0) : 0)],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module["setValue"] = setValue;


function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[((ptr)>>0)];
      case 'i8': return HEAP8[((ptr)>>0)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module["getValue"] = getValue;

var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module["ALLOC_NORMAL"] = ALLOC_NORMAL;
Module["ALLOC_STACK"] = ALLOC_STACK;
Module["ALLOC_STATIC"] = ALLOC_STATIC;
Module["ALLOC_DYNAMIC"] = ALLOC_DYNAMIC;
Module["ALLOC_NONE"] = ALLOC_NONE;

// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }

  var singleType = typeof types === 'string' ? types : null;

  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }

  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)>>0)]=0;
    }
    return ret;
  }

  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }

  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];

    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }

    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    assert(type, 'Must know what type to store in allocate!');

    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later

    setValue(ret+i, curr, type);

    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }

  return ret;
}
Module["allocate"] = allocate;

// Allocate memory during any stage of startup - static memory early on, dynamic memory later, malloc when ready
function getMemory(size) {
  if (!staticSealed) return Runtime.staticAlloc(size);
  if ((typeof _sbrk !== 'undefined' && !_sbrk.called) || !runtimeInitialized) return Runtime.dynamicAlloc(size);
  return _malloc(size);
}
Module["getMemory"] = getMemory;

function Pointer_stringify(ptr, /* optional */ length) {
  if (length === 0 || !ptr) return '';
  // TODO: use TextDecoder
  // Find the length, and check for UTF while doing so
  var hasUtf = 0;
  var t;
  var i = 0;
  while (1) {
    assert(ptr + i < TOTAL_MEMORY);
    t = HEAPU8[(((ptr)+(i))>>0)];
    hasUtf |= t;
    if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;

  var ret = '';

  if (hasUtf < 128) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  return Module['UTF8ToString'](ptr);
}
Module["Pointer_stringify"] = Pointer_stringify;

// Given a pointer 'ptr' to a null-terminated ASCII-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function AsciiToString(ptr) {
  var str = '';
  while (1) {
    var ch = HEAP8[((ptr++)>>0)];
    if (!ch) return str;
    str += String.fromCharCode(ch);
  }
}
Module["AsciiToString"] = AsciiToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in ASCII form. The copy will require at most str.length+1 bytes of space in the HEAP.

function stringToAscii(str, outPtr) {
  return writeAsciiToMemory(str, outPtr, false);
}
Module["stringToAscii"] = stringToAscii;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the given array that contains uint8 values, returns
// a copy of that string as a Javascript String object.

function UTF8ArrayToString(u8Array, idx) {
  var u0, u1, u2, u3, u4, u5;

  var str = '';
  while (1) {
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    u0 = u8Array[idx++];
    if (!u0) return str;
    if (!(u0 & 0x80)) { str += String.fromCharCode(u0); continue; }
    u1 = u8Array[idx++] & 63;
    if ((u0 & 0xE0) == 0xC0) { str += String.fromCharCode(((u0 & 31) << 6) | u1); continue; }
    u2 = u8Array[idx++] & 63;
    if ((u0 & 0xF0) == 0xE0) {
      u0 = ((u0 & 15) << 12) | (u1 << 6) | u2;
    } else {
      u3 = u8Array[idx++] & 63;
      if ((u0 & 0xF8) == 0xF0) {
        u0 = ((u0 & 7) << 18) | (u1 << 12) | (u2 << 6) | u3;
      } else {
        u4 = u8Array[idx++] & 63;
        if ((u0 & 0xFC) == 0xF8) {
          u0 = ((u0 & 3) << 24) | (u1 << 18) | (u2 << 12) | (u3 << 6) | u4;
        } else {
          u5 = u8Array[idx++] & 63;
          u0 = ((u0 & 1) << 30) | (u1 << 24) | (u2 << 18) | (u3 << 12) | (u4 << 6) | u5;
        }
      }
    }
    if (u0 < 0x10000) {
      str += String.fromCharCode(u0);
    } else {
      var ch = u0 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    }
  }
}
Module["UTF8ArrayToString"] = UTF8ArrayToString;

// Given a pointer 'ptr' to a null-terminated UTF8-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF8ToString(ptr) {
  return UTF8ArrayToString(HEAPU8, ptr);
}
Module["UTF8ToString"] = UTF8ToString;

// Copies the given Javascript String object 'str' to the given byte array at address 'outIdx',
// encoded in UTF8 form and null-terminated. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outU8Array: the array to copy to. Each index in this array is assumed to be one 8-byte element.
//   outIdx: The starting offset in the array to begin the copying.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=1, only the null terminator will be written and nothing else.
//                    maxBytesToWrite=0 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
  if (!(maxBytesToWrite > 0)) // Parameter maxBytesToWrite is not optional. Negative values, 0, null, undefined and false each don't write out any bytes.
    return 0;

  var startIdx = outIdx;
  var endIdx = outIdx + maxBytesToWrite - 1; // -1 for string null terminator.
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    // For UTF8 byte structure, see http://en.wikipedia.org/wiki/UTF-8#Description and https://www.ietf.org/rfc/rfc2279.txt and https://tools.ietf.org/html/rfc3629
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      if (outIdx >= endIdx) break;
      outU8Array[outIdx++] = u;
    } else if (u <= 0x7FF) {
      if (outIdx + 1 >= endIdx) break;
      outU8Array[outIdx++] = 0xC0 | (u >> 6);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0xFFFF) {
      if (outIdx + 2 >= endIdx) break;
      outU8Array[outIdx++] = 0xE0 | (u >> 12);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x1FFFFF) {
      if (outIdx + 3 >= endIdx) break;
      outU8Array[outIdx++] = 0xF0 | (u >> 18);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else if (u <= 0x3FFFFFF) {
      if (outIdx + 4 >= endIdx) break;
      outU8Array[outIdx++] = 0xF8 | (u >> 24);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    } else {
      if (outIdx + 5 >= endIdx) break;
      outU8Array[outIdx++] = 0xFC | (u >> 30);
      outU8Array[outIdx++] = 0x80 | ((u >> 24) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 18) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 12) & 63);
      outU8Array[outIdx++] = 0x80 | ((u >> 6) & 63);
      outU8Array[outIdx++] = 0x80 | (u & 63);
    }
  }
  // Null-terminate the pointer to the buffer.
  outU8Array[outIdx] = 0;
  return outIdx - startIdx;
}
Module["stringToUTF8Array"] = stringToUTF8Array;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF8 form. The copy will require at most str.length*4+1 bytes of space in the HEAP.
// Use the function lengthBytesUTF8() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF8(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF8(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite);
}
Module["stringToUTF8"] = stringToUTF8;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF8 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF8(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! So decode UTF16->UTF32->UTF8.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var u = str.charCodeAt(i); // possibly a lead surrogate
    if (u >= 0xD800 && u <= 0xDFFF) u = 0x10000 + ((u & 0x3FF) << 10) | (str.charCodeAt(++i) & 0x3FF);
    if (u <= 0x7F) {
      ++len;
    } else if (u <= 0x7FF) {
      len += 2;
    } else if (u <= 0xFFFF) {
      len += 3;
    } else if (u <= 0x1FFFFF) {
      len += 4;
    } else if (u <= 0x3FFFFFF) {
      len += 5;
    } else {
      len += 6;
    }
  }
  return len;
}
Module["lengthBytesUTF8"] = lengthBytesUTF8;

// Given a pointer 'ptr' to a null-terminated UTF16LE-encoded string in the emscripten HEAP, returns
// a copy of that string as a Javascript String object.

function UTF16ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var codeUnit = HEAP16[(((ptr)+(i*2))>>1)];
    if (codeUnit == 0)
      return str;
    ++i;
    // fromCharCode constructs a character from a UTF-16 code unit, so we can pass the UTF16 string right through.
    str += String.fromCharCode(codeUnit);
  }
}
Module["UTF16ToString"] = UTF16ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF16 form. The copy will require at most str.length*4+2 bytes of space in the HEAP.
// Use the function lengthBytesUTF16() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=2, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<2 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF16(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF16(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 2) return 0;
  maxBytesToWrite -= 2; // Null terminator.
  var startPtr = outPtr;
  var numCharsToWrite = (maxBytesToWrite < str.length*2) ? (maxBytesToWrite / 2) : str.length;
  for (var i = 0; i < numCharsToWrite; ++i) {
    // charCodeAt returns a UTF-16 encoded code unit, so it can be directly written to the HEAP.
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    HEAP16[((outPtr)>>1)]=codeUnit;
    outPtr += 2;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP16[((outPtr)>>1)]=0;
  return outPtr - startPtr;
}
Module["stringToUTF16"] = stringToUTF16;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF16(str) {
  return str.length*2;
}
Module["lengthBytesUTF16"] = lengthBytesUTF16;

function UTF32ToString(ptr) {
  var i = 0;

  var str = '';
  while (1) {
    var utf32 = HEAP32[(((ptr)+(i*4))>>2)];
    if (utf32 == 0)
      return str;
    ++i;
    // Gotcha: fromCharCode constructs a character from a UTF-16 encoded code (pair), not from a Unicode code point! So encode the code point to UTF-16 for constructing.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    if (utf32 >= 0x10000) {
      var ch = utf32 - 0x10000;
      str += String.fromCharCode(0xD800 | (ch >> 10), 0xDC00 | (ch & 0x3FF));
    } else {
      str += String.fromCharCode(utf32);
    }
  }
}
Module["UTF32ToString"] = UTF32ToString;

// Copies the given Javascript String object 'str' to the emscripten HEAP at address 'outPtr',
// null-terminated and encoded in UTF32 form. The copy will require at most str.length*4+4 bytes of space in the HEAP.
// Use the function lengthBytesUTF32() to compute the exact number of bytes (excluding null terminator) that this function will write.
// Parameters:
//   str: the Javascript string to copy.
//   outPtr: Byte address in Emscripten HEAP where to write the string to.
//   maxBytesToWrite: The maximum number of bytes this function can write to the array. This count should include the null 
//                    terminator, i.e. if maxBytesToWrite=4, only the null terminator will be written and nothing else.
//                    maxBytesToWrite<4 does not write any bytes to the output, not even the null terminator.
// Returns the number of bytes written, EXCLUDING the null terminator.

function stringToUTF32(str, outPtr, maxBytesToWrite) {
  assert(typeof maxBytesToWrite == 'number', 'stringToUTF32(str, outPtr, maxBytesToWrite) is missing the third parameter that specifies the length of the output buffer!');
  // Backwards compatibility: if max bytes is not specified, assume unsafe unbounded write is allowed.
  if (maxBytesToWrite === undefined) {
    maxBytesToWrite = 0x7FFFFFFF;
  }
  if (maxBytesToWrite < 4) return 0;
  var startPtr = outPtr;
  var endPtr = startPtr + maxBytesToWrite - 4;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i); // possibly a lead surrogate
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) {
      var trailSurrogate = str.charCodeAt(++i);
      codeUnit = 0x10000 + ((codeUnit & 0x3FF) << 10) | (trailSurrogate & 0x3FF);
    }
    HEAP32[((outPtr)>>2)]=codeUnit;
    outPtr += 4;
    if (outPtr + 4 > endPtr) break;
  }
  // Null-terminate the pointer to the HEAP.
  HEAP32[((outPtr)>>2)]=0;
  return outPtr - startPtr;
}
Module["stringToUTF32"] = stringToUTF32;

// Returns the number of bytes the given Javascript string takes if encoded as a UTF16 byte array, EXCLUDING the null terminator byte.

function lengthBytesUTF32(str) {
  var len = 0;
  for (var i = 0; i < str.length; ++i) {
    // Gotcha: charCodeAt returns a 16-bit word that is a UTF-16 encoded code unit, not a Unicode code point of the character! We must decode the string to UTF-32 to the heap.
    // See http://unicode.org/faq/utf_bom.html#utf16-3
    var codeUnit = str.charCodeAt(i);
    if (codeUnit >= 0xD800 && codeUnit <= 0xDFFF) ++i; // possibly a lead surrogate, so skip over the tail surrogate.
    len += 4;
  }

  return len;
}
Module["lengthBytesUTF32"] = lengthBytesUTF32;

function demangle(func) {
  var hasLibcxxabi = !!Module['___cxa_demangle'];
  if (hasLibcxxabi) {
    try {
      var buf = _malloc(func.length);
      writeStringToMemory(func.substr(1), buf);
      var status = _malloc(4);
      var ret = Module['___cxa_demangle'](buf, 0, 0, status);
      if (getValue(status, 'i32') === 0 && ret) {
        return Pointer_stringify(ret);
      }
      // otherwise, libcxxabi failed, we can try ours which may return a partial result
    } catch(e) {
      // failure when using libcxxabi, we can try ours which may return a partial result
    } finally {
      if (buf) _free(buf);
      if (status) _free(status);
      if (ret) _free(ret);
    }
  }
  var i = 3;
  // params, etc.
  var basicTypes = {
    'v': 'void',
    'b': 'bool',
    'c': 'char',
    's': 'short',
    'i': 'int',
    'l': 'long',
    'f': 'float',
    'd': 'double',
    'w': 'wchar_t',
    'a': 'signed char',
    'h': 'unsigned char',
    't': 'unsigned short',
    'j': 'unsigned int',
    'm': 'unsigned long',
    'x': 'long long',
    'y': 'unsigned long long',
    'z': '...'
  };
  var subs = [];
  var first = true;
  function dump(x) {
    //return;
    if (x) Module.print(x);
    Module.print(func);
    var pre = '';
    for (var a = 0; a < i; a++) pre += ' ';
    Module.print (pre + '^');
  }
  function parseNested() {
    i++;
    if (func[i] === 'K') i++; // ignore const
    var parts = [];
    while (func[i] !== 'E') {
      if (func[i] === 'S') { // substitution
        i++;
        var next = func.indexOf('_', i);
        var num = func.substring(i, next) || 0;
        parts.push(subs[num] || '?');
        i = next+1;
        continue;
      }
      if (func[i] === 'C') { // constructor
        parts.push(parts[parts.length-1]);
        i += 2;
        continue;
      }
      var size = parseInt(func.substr(i));
      var pre = size.toString().length;
      if (!size || !pre) { i--; break; } // counter i++ below us
      var curr = func.substr(i + pre, size);
      parts.push(curr);
      subs.push(curr);
      i += pre + size;
    }
    i++; // skip E
    return parts;
  }
  function parse(rawList, limit, allowVoid) { // main parser
    limit = limit || Infinity;
    var ret = '', list = [];
    function flushList() {
      return '(' + list.join(', ') + ')';
    }
    var name;
    if (func[i] === 'N') {
      // namespaced N-E
      name = parseNested().join('::');
      limit--;
      if (limit === 0) return rawList ? [name] : name;
    } else {
      // not namespaced
      if (func[i] === 'K' || (first && func[i] === 'L')) i++; // ignore const and first 'L'
      var size = parseInt(func.substr(i));
      if (size) {
        var pre = size.toString().length;
        name = func.substr(i + pre, size);
        i += pre + size;
      }
    }
    first = false;
    if (func[i] === 'I') {
      i++;
      var iList = parse(true);
      var iRet = parse(true, 1, true);
      ret += iRet[0] + ' ' + name + '<' + iList.join(', ') + '>';
    } else {
      ret = name;
    }
    paramLoop: while (i < func.length && limit-- > 0) {
      //dump('paramLoop');
      var c = func[i++];
      if (c in basicTypes) {
        list.push(basicTypes[c]);
      } else {
        switch (c) {
          case 'P': list.push(parse(true, 1, true)[0] + '*'); break; // pointer
          case 'R': list.push(parse(true, 1, true)[0] + '&'); break; // reference
          case 'L': { // literal
            i++; // skip basic type
            var end = func.indexOf('E', i);
            var size = end - i;
            list.push(func.substr(i, size));
            i += size + 2; // size + 'EE'
            break;
          }
          case 'A': { // array
            var size = parseInt(func.substr(i));
            i += size.toString().length;
            if (func[i] !== '_') throw '?';
            i++; // skip _
            list.push(parse(true, 1, true)[0] + ' [' + size + ']');
            break;
          }
          case 'E': break paramLoop;
          default: ret += '?' + c; break paramLoop;
        }
      }
    }
    if (!allowVoid && list.length === 1 && list[0] === 'void') list = []; // avoid (void)
    if (rawList) {
      if (ret) {
        list.push(ret + '?');
      }
      return list;
    } else {
      return ret + flushList();
    }
  }
  var parsed = func;
  try {
    // Special-case the entry point, since its name differs from other name mangling.
    if (func == 'Object._main' || func == '_main') {
      return 'main()';
    }
    if (typeof func === 'number') func = Pointer_stringify(func);
    if (func[0] !== '_') return func;
    if (func[1] !== '_') return func; // C function
    if (func[2] !== 'Z') return func;
    switch (func[3]) {
      case 'n': return 'operator new()';
      case 'd': return 'operator delete()';
    }
    parsed = parse();
  } catch(e) {
    parsed += '?';
  }
  if (parsed.indexOf('?') >= 0 && !hasLibcxxabi) {
    Runtime.warnOnce('warning: a problem occurred in builtin C++ name demangling; build with  -s DEMANGLE_SUPPORT=1  to link in libcxxabi demangling');
  }
  return parsed;
}

function demangleAll(text) {
  return text.replace(/__Z[\w\d_]+/g, function(x) { var y = demangle(x); return x === y ? x : (x + ' [' + y + ']') });
}

function jsStackTrace() {
  var err = new Error();
  if (!err.stack) {
    // IE10+ special cases: It does have callstack info, but it is only populated if an Error object is thrown,
    // so try that as a special-case.
    try {
      throw new Error(0);
    } catch(e) {
      err = e;
    }
    if (!err.stack) {
      return '(no stack trace available)';
    }
  }
  return err.stack.toString();
}

function stackTrace() {
  return demangleAll(jsStackTrace());
}
Module["stackTrace"] = stackTrace;

// Memory management

var PAGE_SIZE = 4096;

function alignMemoryPage(x) {
  if (x % 4096 > 0) {
    x += (4096 - (x % 4096));
  }
  return x;
}

var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk


function enlargeMemory() {
  abort('Cannot enlarge memory arrays. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value ' + TOTAL_MEMORY + ', (2) compile with ALLOW_MEMORY_GROWTH which adjusts the size at runtime but prevents some optimizations, or (3) set Module.TOTAL_MEMORY before the program runs.');
}


var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;

var totalMemory = 64*1024;
while (totalMemory < TOTAL_MEMORY || totalMemory < 2*TOTAL_STACK) {
  if (totalMemory < 16*1024*1024) {
    totalMemory *= 2;
  } else {
    totalMemory += 16*1024*1024
  }
}
if (totalMemory !== TOTAL_MEMORY) {
  Module.printErr('increasing TOTAL_MEMORY to ' + totalMemory + ' to be compliant with the asm.js spec (and given that TOTAL_STACK=' + TOTAL_STACK + ')');
  TOTAL_MEMORY = totalMemory;
}

// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(typeof Int32Array !== 'undefined' && typeof Float64Array !== 'undefined' && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'JS engine does not provide full typed array support');

var buffer;
buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);

// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');

Module['HEAP'] = HEAP;
Module['buffer'] = buffer;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;

function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}

var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited

var runtimeInitialized = false;
var runtimeExited = false;


function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}

function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}

function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}

function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
  runtimeExited = true;
}

function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}

function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module["addOnPreRun"] = addOnPreRun;

function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module["addOnInit"] = addOnInit;

function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module["addOnPreMain"] = addOnPreMain;

function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module["addOnExit"] = addOnExit;

function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module["addOnPostRun"] = addOnPostRun;

// Tools


function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var len = length > 0 ? length : lengthBytesUTF8(stringy)+1;
  var u8array = new Array(len);
  var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
  if (dontAddNull) u8array.length = numBytesWritten;
  return u8array;
}
Module["intArrayFromString"] = intArrayFromString;

function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
        assert(false, 'Character code ' + chr + ' (' + String.fromCharCode(chr) + ')  at offset ' + i + ' not in 0x00-0xFF.');
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module["intArrayToString"] = intArrayToString;

function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))>>0)]=chr;
    i = i + 1;
  }
}
Module["writeStringToMemory"] = writeStringToMemory;

function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[((buffer++)>>0)]=array[i];
  }
}
Module["writeArrayToMemory"] = writeArrayToMemory;

function writeAsciiToMemory(str, buffer, dontAddNull) {
  for (var i = 0; i < str.length; ++i) {
    assert(str.charCodeAt(i) === str.charCodeAt(i)&0xff);
    HEAP8[((buffer++)>>0)]=str.charCodeAt(i);
  }
  // Null-terminate the pointer to the HEAP.
  if (!dontAddNull) HEAP8[((buffer)>>0)]=0;
}
Module["writeAsciiToMemory"] = writeAsciiToMemory;

function unSign(value, bits, ignore) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}


// check for imul support, and also for correctness ( https://bugs.webkit.org/show_bug.cgi?id=126345 )
if (!Math['imul'] || Math['imul'](0xffffffff, 5) !== -5) Math['imul'] = function imul(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];


if (!Math['clz32']) Math['clz32'] = function(x) {
  x = x >>> 0;
  for (var i = 0; i < 32; i++) {
    if (x & (1 << (31 - i))) return i;
  }
  return 32;
};
Math.clz32 = Math['clz32']

var Math_abs = Math.abs;
var Math_cos = Math.cos;
var Math_sin = Math.sin;
var Math_tan = Math.tan;
var Math_acos = Math.acos;
var Math_asin = Math.asin;
var Math_atan = Math.atan;
var Math_atan2 = Math.atan2;
var Math_exp = Math.exp;
var Math_log = Math.log;
var Math_sqrt = Math.sqrt;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_pow = Math.pow;
var Math_imul = Math.imul;
var Math_fround = Math.fround;
var Math_min = Math.min;
var Math_clz32 = Math.clz32;

// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null; // overridden to take different actions when all run dependencies are fulfilled
var runDependencyTracking = {};

function getUniqueRunDependency(id) {
  var orig = id;
  while (1) {
    if (!runDependencyTracking[id]) return id;
    id = orig + Math.random();
  }
  return id;
}

function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
    if (runDependencyWatcher === null && typeof setInterval !== 'undefined') {
      // Check for missing dependencies every few seconds
      runDependencyWatcher = setInterval(function() {
        if (ABORT) {
          clearInterval(runDependencyWatcher);
          runDependencyWatcher = null;
          return;
        }
        var shown = false;
        for (var dep in runDependencyTracking) {
          if (!shown) {
            shown = true;
            Module.printErr('still waiting on run dependencies:');
          }
          Module.printErr('dependency: ' + dep);
        }
        if (shown) {
          Module.printErr('(end of list)');
        }
      }, 10000);
    }
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module["addRunDependency"] = addRunDependency;

function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    }
    if (dependenciesFulfilled) {
      var callback = dependenciesFulfilled;
      dependenciesFulfilled = null;
      callback(); // can add another dependenciesFulfilled
    }
  }
}
Module["removeRunDependency"] = removeRunDependency;

Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data



var memoryInitializer = null;



// === Body ===

var ASM_CONSTS = [];




STATIC_BASE = 8;

STATICTOP = STATIC_BASE + 16304;
  /* global initializers */  __ATINIT__.push();
  

/* memory initializer */ allocate([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,4,0,0,0,5,0,0,0,1,0,0,0,1,0,0,0,6,0,0,0,7,0,0,0,1,0,0,0,8,0,0,0,9,0,0,0,10,0,0,0,11,0,0,0,12,0,0,0,13,0,0,0,14,0,0,0,15,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,16,0,0,0,1,0,0,0,17,0,0,0,18,0,0,0,19,0,0,0,20,0,0,0,1,0,0,0,1,0,0,0,21,0,0,0,21,0,0,0,21,0,0,0,21,0,0,0,21,0,0,0,21,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,22,0,0,0,23,0,0,0,24,0,0,0,25,0,0,0,26,0,0,0,1,0,0,0,27,0,0,0,28,0,0,0,29,0,0,0,30,0,0,0,31,0,0,0,32,0,0,0,33,0,0,0,34,0,0,0,35,0,0,0,36,0,0,0,37,0,0,0,38,0,0,0,39,0,0,0,40,0,0,0,41,0,0,0,42,0,0,0,43,0,0,0,44,0,0,0,45,0,0,0,46,0,0,0,47,0,0,0,36,0,0,0,48,0,0,0,36,0,0,0,49,0,0,0,36,0,0,0,50,0,0,0,51,0,0,0,52,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,192,3,0,0,192,4,0,0,192,5,0,0,192,6,0,0,192,7,0,0,192,8,0,0,192,9,0,0,192,10,0,0,192,11,0,0,192,12,0,0,192,13,0,0,192,14,0,0,192,15,0,0,192,16,0,0,192,17,0,0,192,18,0,0,192,19,0,0,192,20,0,0,192,21,0,0,192,22,0,0,192,23,0,0,192,24,0,0,192,25,0,0,192,26,0,0,192,27,0,0,192,28,0,0,192,29,0,0,192,30,0,0,192,31,0,0,192,0,0,0,179,1,0,0,195,2,0,0,195,3,0,0,195,4,0,0,195,5,0,0,195,6,0,0,195,7,0,0,195,8,0,0,195,9,0,0,195,10,0,0,195,11,0,0,195,12,0,0,195,13,0,0,211,14,0,0,195,15,0,0,195,0,0,12,187,1,0,12,195,2,0,12,195,3,0,12,195,4,0,12,211,60,9,0,0,172,9,0,0,28,10,0,0,28,10,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,4,0,0,0,156,61,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,4,0,0,0,148,57,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,5,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,6,0,0,0,4,0,0,0,140,53,0,0,0,4,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,10,255,255,255,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,131,255,156,0,131,255,96,1,22,2,131,255,225,255,131,255,49,0,2,0,131,255,131,255,237,255,239,255,131,255,241,255,131,255,251,255,19,0,131,255,131,255,20,0,131,255,131,255,131,255,131,255,131,255,131,255,22,2,22,2,196,0,131,255,4,0,131,255,131,255,131,255,73,0,9,0,131,255,131,255,110,0,43,2,22,2,244,255,131,255,131,255,21,0,22,2,22,2,28,0,22,2,29,0,22,2,22,2,30,0,1,2,131,255,129,1,220,1,13,0,131,255,131,255,26,1,131,255,131,255,22,2,22,2,22,2,22,2,22,2,131,255,131,255,228,255,31,0,246,255,73,0,1,0,33,0,138,1,35,0,73,0,22,2,141,1,22,2,150,1,184,1,131,255,131,255,131,255,26,0,73,0,131,255,239,0,220,1,131,255,131,255,22,2,22,2,45,0,249,255,250,255,250,255,45,0,22,2,90,0,131,255,64,2,131,255,39,0,46,0,42,0,131,255,131,255,3,0,73,0,131,255,73,0,131,255,131,255,1,2,131,255,131,255,110,0,131,0,249,255,131,255,235,255,73,0,43,0,51,0,80,0,131,255,220,1,50,0,131,255,61,1,131,255,94,0,55,0,22,2,82,0,220,1,131,255,79,0,65,0,74,0,131,255,131,255,131,255,33,0,131,255,131,255,131,255,220,1,5,0,196,0,22,2,131,255,131,255,131,255,15,0,78,0,131,255,131,255,220,1,131,255,3,0,1,0,4,0,10,0,10,0,4,0,5,0,3,0,3,0,40,0,8,0,10,0,40,0,12,0,45,0,139,0,3,0,45,0,3,0,40,0,11,0,40,0,13,0,40,0,45,0,40,0,28,0,29,0,35,0,36,0,37,0,37,0,156,0,45,0,44,0,40,0,35,0,36,0,37,0,41,0,42,0,8,0,39,0,39,0,39,0,47,0,48,0,46,0,50,0,44,0,52,0,53,0,39,0,55,0,39,0,58,0,43,0,8,0,43,0,40,0,40,0,40,0,62,0,65,0,66,0,67,0,68,0,69,0,40,0,40,0,44,0,41,0,41,0,24,0,25,0,26,0,41,0,4,0,5,0,81,0,31,0,83,0,37,0,10,0,45,0,12,0,44,0,41,0,8,0,46,0,93,0,41,0,92,0,42,0,96,0,97,0,6,0,3,0,8,0,9,0,45,0,103,0,104,0,13,0,106,0,23,0,27,0,17,0,35,0,36,0,37,0,46,0,22,0,39,0,24,0,25,0,26,0,119,0,28,0,41,0,10,0,31,0,12,0,155,0,149,0,119,0,36,0,8,0,255,255,132,0,40,0,255,255,255,255,135,0,255,255,4,0,46,0,139,0,141,0,255,255,255,255,10,0,255,255,12,0,255,255,35,0,36,0,37,0,255,255,255,255,153,0,255,255,255,255,255,255,156,0,255,255,0,0,1,0,255,255,3,0,255,255,164,0,6,0,7,0,8,0,9,0,35,0,36,0,37,0,13,0,14,0,15,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,255,255,24,0,25,0,26,0,255,255,28,0,29,0,30,0,31,0,32,0,33,0,34,0,255,255,36,0,255,255,255,255,39,0,40,0,1,0,42,0,3,0,255,255,255,255,6,0,7,0,8,0,9,0,255,255,255,255,255,255,13,0,255,255,15,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,255,255,24,0,25,0,26,0,255,255,28,0,29,0,30,0,31,0,32,0,33,0,34,0,255,255,36,0,255,255,255,255,39,0,40,0,255,255,42,0,43,0,1,0,255,255,3,0,255,255,255,255,6,0,7,0,8,0,9,0,255,255,255,255,255,255,13,0,255,255,15,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,255,255,24,0,25,0,26,0,255,255,28,0,29,0,30,0,31,0,32,0,33,0,34,0,255,255,36,0,255,255,255,255,39,0,40,0,255,255,42,0,43,0,1,0,255,255,3,0,255,255,255,255,6,0,7,0,8,0,9,0,255,255,255,255,255,255,13,0,255,255,15,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,255,255,24,0,25,0,26,0,255,255,28,0,29,0,30,0,31,0,32,0,33,0,34,0,255,255,36,0,255,255,255,255,39,0,40,0,6,0,42,0,8,0,9,0,255,255,255,255,255,255,13,0,255,255,255,255,255,255,17,0,255,255,255,255,255,255,255,255,22,0,255,255,24,0,25,0,26,0,255,255,28,0,255,255,255,255,31,0,255,255,255,255,255,255,255,255,36,0,255,255,3,0,255,255,40,0,6,0,7,0,8,0,9,0,255,255,46,0,255,255,13,0,255,255,15,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,255,255,24,0,25,0,26,0,255,255,28,0,29,0,30,0,31,0,32,0,33,0,34,0,255,255,36,0,4,0,5,0,255,255,40,0,255,255,42,0,10,0,255,255,12,0,4,0,5,0,255,255,4,0,5,0,255,255,10,0,255,255,12,0,10,0,255,255,12,0,4,0,5,0,255,255,255,255,255,255,255,255,10,0,255,255,12,0,255,255,35,0,36,0,37,0,255,255,255,255,255,255,41,0,255,255,255,255,35,0,36,0,37,0,35,0,36,0,37,0,41,0,255,255,255,255,41,0,255,255,255,255,35,0,36,0,37,0,4,0,5,0,255,255,41,0,255,255,255,255,10,0,255,255,12,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,35,0,36,0,37,0,255,255,255,255,255,255,41,0,6,0,7,0,8,0,9,0,255,255,255,255,255,255,13,0,255,255,15,0,16,0,17,0,18,0,19,0,20,0,21,0,22,0,255,255,24,0,25,0,26,0,255,255,28,0,29,0,30,0,31,0,32,0,33,0,34,0,255,255,36,0,255,255,255,255,255,255,40,0,255,255,42,0,6,0,7,0,8,0,9,0,255,255,255,255,255,255,13,0,255,255,255,255,255,255,17,0,255,255,255,255,255,255,255,255,22,0,255,255,24,0,25,0,26,0,6,0,28,0,8,0,9,0,31,0,255,255,255,255,13,0,255,255,36,0,255,255,17,0,255,255,40,0,255,255,255,255,22,0,255,255,24,0,25,0,26,0,6,0,28,0,8,0,9,0,31,0,255,255,255,255,13,0,255,255,36,0,255,255,17,0,255,255,40,0,255,255,255,255,22,0,255,255,24,0,25,0,26,0,6,0,28,0,8,0,9,0,31,0,255,255,255,255,13,0,255,255,36,0,255,255,17,0,255,255,40,0,255,255,255,255,22,0,255,255,24,0,25,0,26,0,255,255,28,0,255,255,255,255,31,0,255,255,255,255,255,255,255,255,36,0,255,255,255,255,255,255,40,0,39,0,33,0,40,0,65,0,65,0,63,0,64,0,61,0,158,0,41,0,46,0,65,0,41,0,66,0,42,0,145,0,92,0,104,0,92,0,41,0,70,0,47,0,71,0,48,0,135,0,50,0,56,0,57,0,67,0,68,0,69,0,69,0,161,0,42,0,106,0,52,0,67,0,68,0,69,0,75,0,76,0,108,0,131,0,62,0,159,0,78,0,80,0,107,0,82,0,130,0,84,0,85,0,93,0,90,0,93,0,39,0,94,0,43,0,162,0,53,0,54,0,77,0,95,0,98,0,99,0,100,0,101,0,102,0,81,0,83,0,119,0,86,0,105,0,44,0,19,0,20,0,112,0,63,0,64,0,114,0,24,0,116,0,69,0,65,0,128,0,66,0,130,0,129,0,138,0,136,0,121,0,141,0,120,0,137,0,122,0,123,0,4,0,143,0,6,0,7,0,144,0,124,0,76,0,8,0,127,0,146,0,149,0,12,0,67,0,68,0,69,0,151,0,17,0,152,0,18,0,19,0,20,0,90,0,21,0,163,0,65,0,24,0,66,0,160,0,154,0,134,0,28,0,45,0,0,0,140,0,29,0,0,0,0,0,76,0,0,0,63,0,125,0,114,0,148,0,0,0,0,0,65,0,0,0,66,0,0,0,67,0,68,0,69,0,0,0,0,0,157,0,0,0,0,0,0,0,114,0,0,0,2,0,3,0,0,0,249,255,0,0,165,0,4,0,5,0,6,0,7,0,67,0,68,0,69,0,8,0,9,0,10,0,11,0,12,0,13,0,14,0,15,0,16,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,0,0,28,0,0,0,0,0,249,255,29,0,58,0,30,0,245,255,0,0,0,0,4,0,5,0,6,0,7,0,0,0,0,0,0,0,8,0,0,0,10,0,11,0,12,0,13,0,14,0,15,0,16,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,0,0,28,0,0,0,0,0,245,255,29,0,0,0,30,0,245,255,58,0,0,0,243,255,0,0,0,0,4,0,5,0,6,0,7,0,0,0,0,0,0,0,8,0,0,0,10,0,11,0,12,0,13,0,14,0,15,0,16,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,0,0,28,0,0,0,0,0,243,255,29,0,0,0,30,0,243,255,58,0,0,0,246,255,0,0,0,0,4,0,5,0,6,0,7,0,0,0,0,0,0,0,8,0,0,0,10,0,11,0,12,0,13,0,14,0,15,0,16,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,0,0,28,0,0,0,0,0,246,255,29,0,4,0,30,0,6,0,7,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,0,0,0,0,24,0,0,0,0,0,0,0,0,0,28,0,0,0,38,0,0,0,29,0,4,0,5,0,6,0,7,0,0,0,142,0,0,0,8,0,0,0,10,0,11,0,12,0,13,0,14,0,15,0,16,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,0,0,28,0,63,0,64,0,0,0,29,0,0,0,30,0,65,0,0,0,66,0,63,0,64,0,0,0,63,0,64,0,0,0,65,0,0,0,66,0,65,0,0,0,66,0,63,0,64,0,0,0,0,0,0,0,0,0,65,0,0,0,66,0,0,0,67,0,68,0,69,0,0,0,0,0,0,0,91,0,0,0,0,0,67,0,68,0,69,0,67,0,68,0,69,0,111,0,0,0,0,0,115,0,0,0,0,0,67,0,68,0,69,0,63,0,64,0,0,0,117,0,0,0,0,0,65,0,0,0,66,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,67,0,68,0,69,0,0,0,0,0,0,0,118,0,4,0,5,0,6,0,7,0,0,0,0,0,0,0,8,0,0,0,10,0,11,0,12,0,13,0,14,0,15,0,16,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,22,0,23,0,24,0,25,0,26,0,27,0,0,0,28,0,0,0,0,0,0,0,29,0,0,0,30,0,4,0,87,0,6,0,7,0,0,0,0,0,0,0,8,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,17,0,0,0,18,0,19,0,20,0,4,0,21,0,6,0,7,0,24,0,0,0,0,0,8,0,0,0,28,0,0,0,12,0,0,0,29,0,0,0,0,0,17,0,0,0,18,0,19,0,20,0,4,0,21,0,72,0,7,0,24,0,0,0,0,0,8,0,0,0,28,0,0,0,12,0,0,0,29,0,0,0,0,0,17,0,0,0,18,0,19,0,20,0,4,0,21,0,126,0,7,0,24,0,0,0,0,0,8,0,0,0,28,0,0,0,12,0,0,0,29,0,0,0,0,0,17,0,0,0,18,0,19,0,20,0,0,0,21,0,0,0,0,0,24,0,0,0,0,0,0,0,0,0,28,0,0,0,0,0,0,0,29,0,255,255,1,0,31,0,32,0,59,0,60,0,34,0,49,0,139,0,156,0,164,0,132,0,51,0,133,0,55,0,88,0,89,0,147,0,153,0,35,0,155,0,109,0,150,0,110,0,73,0,74,0,113,0,79,0,36,0,103,0,96,0,97,0,37,0,0,0,0,0,0,0,41,0,39,0,34,0,32,0,26,0,39,0,27,0,39,0,23,0,27,0,23,0,23,0,22,0,27,0,38,0,30,0,28,0,30,0,39,0,23,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,39,0,34,0,30,0,0,0,37,0,28,0,24,0,31,0,38,0,0,0,35,0,38,0,38,0,0,0,29,0,33,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,7,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,25,0,38,0,0,0,0,0,38,0,0,0,36,0,36,0,36,0,36,0,36,0,6,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,36,0,13,0,36,0,36,0,36,0,14,0,16,0,36,0,17,0,36,0,36,0,36,0,36,0,3,0,15,0,36,0,36,0,9,0,36,0,36,0,2,0,36,0,36,0,11,0,36,0,36,0,12,0,20,0,36,0,10,0,36,0,8,0,36,0,1,0,4,0,21,0,5,0,36,0,36,0,36,0,19,0,18,0,0,0,0,0,0,0,0,0,193,0,194,0,190,0,194,0,172,0,185,0,170,0,181,0,194,0,168,0,42,0,41,0,41,0,46,0,52,0,167,0,61,0,166,0,181,0,164,0,135,0,137,0,139,0,148,0,140,0,136,0,0,0,149,0,27,0,50,0,147,0,130,0,126,0,141,0,40,0,36,0,120,0,168,0,194,0,164,0,194,0,194,0,194,0,194,0,66,0,165,0,194,0,72,0,76,0,164,0,194,0,194,0,0,0,120,0,134,0,124,0,131,0,117,0,117,0,122,0,132,0,0,0,113,0,117,0,117,0,128,0,119,0,118,0,52,0,125,0,107,0,106,0,114,0,194,0,80,0,145,0,84,0,88,0,144,0,105,0,118,0,98,0,108,0,111,0,0,0,95,0,95,0,93,0,105,0,102,0,91,0,95,0,88,0,103,0,85,0,93,0,84,0,85,0,90,0,0,0,90,0,91,0,85,0,0,0,0,0,93,0,0,0,77,0,76,0,90,0,74,0,0,0,0,0,75,0,87,0,0,0,90,0,85,0,0,0,75,0,83,0,0,0,76,0,63,0,0,0,0,0,66,0,0,0,62,0,0,0,47,0,0,0,0,0,0,0,0,0,45,0,53,0,29,0,0,0,0,0,194,0,111,0,56,0,0,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,1,0,13,0,14,0,31,0,16,0,15,0,145,0,31,0,14,0,13,0,15,0,38,0,15,0,16,0,17,0,19,0,17,0,37,0,38,0,19,0,19,0,17,0,19,0,17,0,19,0,32,0,140,0,71,0,19,0,32,0,47,0,37,0,139,0,32,0,19,0,47,0,50,0,47,0,51,0,138,0,51,0,50,0,133,0,50,0,77,0,51,0,71,0,51,0,79,0,77,0,131,0,77,0,80,0,79,0,129,0,79,0,126,0,80,0,125,0,80,0,144,0,144,0,123,0,122,0,120,0,119,0,117,0,116,0,113,0,112,0,111,0,110,0,108,0,105,0,104,0,103,0,101,0,100,0,99,0,98,0,97,0,96,0,95,0,94,0,93,0,92,0,91,0,90,0,89,0,88,0,86,0,85,0,84,0,83,0,82,0,81,0,78,0,75,0,74,0,73,0,72,0,70,0,69,0,68,0,67,0,66,0,65,0,63,0,62,0,61,0,60,0,59,0,58,0,57,0,56,0,52,0,48,0,42,0,40,0,39,0,36,0,35,0,34,0,33,0,30,0,28,0,27,0,26,0,25,0,24,0,23,0,22,0,21,0,20,0,18,0,12,0,10,0,9,0,8,0,7,0,5,0,3,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,0,0,143,0,1,0,143,0,143,0,143,0,143,0,143,0,144,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,143,0,143,0,143,0,144,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,143,0,143,0,143,0,143,0,143,0,143,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,145,0,0,0,143,0,143,0,0,0,4,0,5,0,6,0,7,0,8,0,9,0,10,0,11,0,11,0,12,0,13,0,11,0,14,0,15,0,16,0,17,0,11,0,18,0,19,0,20,0,17,0,11,0,21,0,11,0,22,0,4,0,23,0,24,0,25,0,26,0,27,0,28,0,29,0,30,0,31,0,29,0,29,0,32,0,29,0,29,0,33,0,34,0,35,0,36,0,37,0,29,0,29,0,38,0,29,0,11,0,39,0,11,0,46,0,46,0,63,0,49,0,47,0,55,0,64,0,44,0,44,0,47,0,74,0,48,0,44,0,50,0,53,0,51,0,72,0,75,0,53,0,53,0,51,0,53,0,52,0,53,0,65,0,142,0,96,0,41,0,66,0,77,0,73,0,141,0,67,0,53,0,77,0,80,0,78,0,50,0,140,0,51,0,80,0,139,0,81,0,77,0,51,0,97,0,52,0,47,0,77,0,138,0,78,0,80,0,47,0,137,0,48,0,136,0,80,0,135,0,81,0,42,0,42,0,134,0,133,0,132,0,131,0,130,0,129,0,128,0,127,0,126,0,125,0,124,0,123,0,122,0,121,0,120,0,119,0,118,0,117,0,116,0,115,0,114,0,113,0,112,0,111,0,110,0,109,0,108,0,107,0,106,0,105,0,104,0,103,0,102,0,80,0,77,0,101,0,100,0,99,0,98,0,95,0,94,0,93,0,92,0,91,0,90,0,89,0,88,0,87,0,86,0,85,0,84,0,83,0,82,0,51,0,79,0,43,0,40,0,76,0,71,0,70,0,69,0,68,0,62,0,61,0,60,0,59,0,58,0,57,0,56,0,44,0,54,0,41,0,41,0,44,0,45,0,44,0,43,0,41,0,40,0,143,0,3,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,143,0,0,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,40,41,2,35,44,36,2,2,2,2,2,2,2,2,2,2,2,2,2,39,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,45,2,46,37,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,42,2,43,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,38,2,0,1,0,0,22,93,84,0,0,23,25,0,27,29,0,36,0,97,95,96,0,19,26,98,24,40,20,0,0,0,3,0,8,17,5,21,83,6,18,76,60,0,93,97,87,0,0,68,0,0,0,0,0,0,0,82,0,0,0,12,4,0,72,74,0,0,0,0,0,70,88,93,0,61,62,0,51,0,0,69,66,0,0,0,0,92,44,41,42,45,85,0,15,39,9,0,0,80,77,78,79,81,0,0,86,0,94,56,0,52,89,28,0,67,34,37,90,91,0,14,16,73,75,71,63,93,64,0,0,0,30,0,0,43,0,57,0,58,66,46,0,65,53,0,0,47,35,38,0,49,59,31,0,0,0,66,48,54,55,0,0,50,32,0,33,0,2,0,2,2,1,2,0,1,3,2,0,1,2,3,2,3,1,2,1,1,1,1,1,1,1,1,1,4,0,0,0,0,13,0,7,0,0,7,3,0,3,1,3,1,1,0,0,3,0,11,0,1,0,3,3,1,3,3,5,0,1,1,3,3,5,0,1,0,1,0,4,0,4,0,4,2,3,3,3,3,3,2,1,1,3,4,2,2,4,4,4,3,1,4,1,1,1,1,0,99,111,109,112,97,114,105,115,111,110,32,105,110,32,101,120,112,114,101,115,115,105,111,110,0,87,0,112,0,119,0,66,114,101,97,107,32,111,117,116,115,105,100,101,32,97,32,102,111,114,47,119,104,105,108,101,0,74,37,49,100,58,0,67,111,110,116,105,110,117,101,32,115,116,97,116,101,109,101,110,116,0,67,111,110,116,105,110,117,101,32,111,117,116,115,105,100,101,32,97,32,102,111,114,0,104,0,48,82,0,82,0,67,111,109,112,97,114,105,115,111,110,32,105,110,32,102,105,114,115,116,32,102,111,114,32,101,120,112,114,101,115,115,105,111,110,0,78,37,49,100,58,0,112,78,37,49,100,58,0,49,0,66,37,49,100,58,74,37,49,100,58,0,67,111,109,112,97,114,105,115,111,110,32,105,110,32,116,104,105,114,100,32,102,111,114,32,101,120,112,114,101,115,115,105,111,110,0,74,37,49,100,58,78,37,49,100,58,0,112,74,37,49,100,58,78,37,49,100,58,0,90,37,49,100,58,0,112,114,105,110,116,32,115,116,97,116,101,109,101,110,116,0,79,0,80,0,101,108,115,101,32,99,108,97,117,115,101,32,105,110,32,105,102,32,115,116,97,116,101,109,101,110,116,0,74,37,100,58,78,37,49,100,58,0,70,37,100,44,37,115,46,37,115,91,0,48,82,93,0,99,111,109,112,97,114,105,115,111,110,32,105,110,32,97,114,103,117,109,101,110,116,0,75,37,100,58,0,77,105,115,115,105,110,103,32,101,120,112,114,101,115,115,105,111,110,32,105,110,32,102,111,114,32,115,116,97,116,101,109,101,110,116,0,48,0,99,111,109,112,97,114,105,115,111,110,32,105,110,32,114,101,116,117,114,110,32,101,120,112,114,101,115,105,111,110,0,68,76,37,100,58,0,108,37,100,58,0,99,111,109,112,97,114,105,115,111,110,32,105,110,32,97,115,115,105,103,110,109,101,110,116,0,83,37,100,58,0,115,37,100,58,0,38,38,32,111,112,101,114,97,116,111,114,0,68,90,37,100,58,112,0,68,90,37,100,58,112,49,78,37,100,58,0,124,124,32,111,112,101,114,97,116,111,114,0,66,37,100,58,0,66,37,100,58,48,74,37,100,58,78,37,100,58,49,78,37,100,58,0,33,32,111,112,101,114,97,116,111,114,0,33,0,61,0,35,0,123,0,60,0,125,0,62,0,43,0,45,0,94,0,110,0,76,37,100,58,0,75,0,58,0,67,37,100,44,37,115,58,0,67,37,100,58,0,68,65,37,100,58,76,37,100,58,0,68,77,37,100,58,76,37,100,58,0,105,37,100,58,108,37,100,58,0,100,37,100,58,108,37,100,58,0,68,76,37,100,58,120,0,65,37,100,58,0,77,37,100,58,0,105,37,100,58,0,100,37,100,58,0,99,76,0,99,82,0,99,83,0,114,101,97,100,32,102,117,110,99,116,105,111,110,0,99,73,0,99,111,109,112,97,114,105,115,111,110,32,105,110,32,115,117,98,115,99,114,105,112,116,0,76,97,115,116,32,118,97,114,105,97,98,108,101,0,0,47,48,48,49,49,49,50,50,50,50,51,51,51,51,51,51,52,52,53,53,53,53,53,53,53,53,53,53,54,55,56,57,53,58,53,59,60,53,53,61,53,62,62,63,63,64,65,64,67,66,68,68,69,69,69,70,70,70,70,71,71,72,72,72,72,73,73,74,74,76,75,77,75,78,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,75,79,79,79,79,79,79,131,131,131,131,224,0,253,131,131,131,131,131,131,131,131,6,131,131,131,131,131,131,131,231,131,131,132,131,254,131,131,131,119,115,121,110,116,97,120,32,101,114,114,111,114,0,109,101,109,111,114,121,32,101,120,104,97,117,115,116,101,100,0,111,117,116,32,111,102,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,105,110,32,121,121,101,110,115,117,114,101,95,98,117,102,102,101,114,95,115,116,97,99,107,40,41,0,0,69,79,70,32,101,110,99,111,117,110,116,101,114,101,100,32,105,110,32,97,32,99,111,109,109,101,110,116,46,10,0,78,85,76,32,99,104,97,114,97,99,116,101,114,32,105,110,32,115,116,114,105,110,103,46,0,105,108,108,101,103,97,108,32,99,104,97,114,97,99,116,101,114,58,32,94,37,99,0,105,108,108,101,103,97,108,32,99,104,97,114,97,99,116,101,114,58,32,92,37,51,100,0,105,108,108,101,103,97,108,32,99,104,97,114,97,99,116,101,114,58,32,37,115,0,102,97,116,97,108,32,102,108,101,120,32,115,99,97,110,110,101,114,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,45,45,110,111,32,97,99,116,105,111,110,32,102,111,117,110,100,0,111,117,116,32,111,102,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,105,110,32,121,121,95,99,114,101,97,116,101,95,98,117,102,102,101,114,40,41,0,102,97,116,97,108,32,102,108,101,120,32,115,99,97,110,110,101,114,32,105,110,116,101,114,110,97,108,32,101,114,114,111,114,45,45,101,110,100,32,111,102,32,98,117,102,102,101,114,32,109,105,115,115,101,100,0,102,97,116,97,108,32,101,114,114,111,114,32,45,32,115,99,97,110,110,101,114,32,105,110,112,117,116,32,98,117,102,102,101,114,32,111,118,101,114,102,108,111,119,0,114,101,97,100,40,41,32,105,110,32,102,108,101,120,32,115,99,97,110,110,101,114,32,102,97,105,108,101,100,0,111,117,116,32,111,102,32,100,121,110,97,109,105,99,32,109,101,109,111,114,121,32,105,110,32,121,121,95,103,101,116,95,110,101,120,116,95,98,117,102,102,101,114,40,41,0,37,115,10,0,100,117,112,108,105,99,97,116,101,32,112,97,114,97,109,101,116,101,114,32,110,97,109,101,115,0,65,114,114,97,121,32,112,97,114,97,109,101,116,101,114,0,100,117,112,108,105,99,97,116,101,32,97,117,116,111,32,118,97,114,105,97,98,108,101,32,110,97,109,101,115,0,118,97,114,105,97,98,108,101,32,105,110,32,98,111,116,104,32,112,97,114,97,109,101,116,101,114,32,97,110,100,32,97,117,116,111,32,108,105,115,116,115,0,40,115,116,97,110,100,97,114,100,95,105,110,41,0,37,115,32,37,100,58,32,0,37,115,32,37,100,58,32,40,87,97,114,110,105,110,103,41,32,0,64,105,0,37,115,0,64,114,0,109,117,108,116,105,112,108,101,32,108,101,116,116,101,114,32,110,97,109,101,32,45,32,37,115,0,84,111,111,32,109,97,110,121,32,97,114,114,97,121,32,118,97,114,105,97,98,108,101,115,0,84,111,111,32,109,97,110,121,32,102,117,110,99,116,105,111,110,115,0,84,111,111,32,109,97,110,121,32,118,97,114,105,97,98,108,101,115,0,84,104,105,115,32,105,115,32,102,114,101,101,32,115,111,102,116,119,97,114,101,32,119,105,116,104,32,65,66,83,79,76,85,84,69,76,89,32,78,79,32,87,65,82,82,65,78,84,89,46,0,70,111,114,32,100,101,116,97,105,108,115,32,116,121,112,101,32,96,119,97,114,114,97,110,116,121,39,46,32,0,10,37,115,37,115,10,10,0,37,115,37,115,37,115,37,115,37,115,37,115,37,115,37,115,37,115,37,115,37,115,0,32,32,32,32,84,104,105,115,32,112,114,111,103,114,97,109,32,105,115,32,102,114,101,101,32,115,111,102,116,119,97,114,101,59,32,121,111,117,32,99,97,110,32,114,101,100,105,115,116,114,105,98,117,116,101,32,105,116,32,97,110,100,47,111,114,32,109,111,100,105,102,121,10,0,32,32,32,32,105,116,32,117,110,100,101,114,32,116,104,101,32,116,101,114,109,115,32,111,102,32,116,104,101,32,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115,101,32,97,115,32,112,117,98,108,105,115,104,101,100,32,98,121,10,0,32,32,32,32,116,104,101,32,70,114,101,101,32,83,111,102,116,119,97,114,101,32,70,111,117,110,100,97,116,105,111,110,59,32,101,105,116,104,101,114,32,118,101,114,115,105,111,110,32,50,32,111,102,32,116,104,101,32,76,105,99,101,110,115,101,32,44,32,111,114,10,0,32,32,32,32,40,97,116,32,121,111,117,114,32,111,112,116,105,111,110,41,32,97,110,121,32,108,97,116,101,114,32,118,101,114,115,105,111,110,46,10,10,0,32,32,32,32,84,104,105,115,32,112,114,111,103,114,97,109,32,105,115,32,100,105,115,116,114,105,98,117,116,101,100,32,105,110,32,116,104,101,32,104,111,112,101,32,116,104,97,116,32,105,116,32,119,105,108,108,32,98,101,32,117,115,101,102,117,108,44,10,0,32,32,32,32,98,117,116,32,87,73,84,72,79,85,84,32,65,78,89,32,87,65,82,82,65,78,84,89,59,32,119,105,116,104,111,117,116,32,101,118,101,110,32,116,104,101,32,105,109,112,108,105,101,100,32,119,97,114,114,97,110,116,121,32,111,102,10,0,32,32,32,32,77,69,82,67,72,65,78,84,65,66,73,76,73,84,89,32,111,114,32,70,73,84,78,69,83,83,32,70,79,82,32,65,32,80,65,82,84,73,67,85,76,65,82,32,80,85,82,80,79,83,69,46,32,32,83,101,101,32,116,104,101,10,0,32,32,32,32,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115,101,32,102,111,114,32,109,111,114,101,32,100,101,116,97,105,108,115,46,10,10,0,32,32,32,32,89,111,117,32,115,104,111,117,108,100,32,104,97,118,101,32,114,101,99,101,105,118,101,100,32,97,32,99,111,112,121,32,111,102,32,116,104,101,32,71,78,85,32,71,101,110,101,114,97,108,32,80,117,98,108,105,99,32,76,105,99,101,110,115], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE);
/* memory initializer */ allocate([101,10,0,32,32,32,32,97,108,111,110,103,32,119,105,116,104,32,116,104,105,115,32,112,114,111,103,114,97,109,46,32,73,102,32,110,111,116,44,32,119,114,105,116,101,32,116,111,32,116,104,101,32,70,114,101,101,32,83,111,102,116,119,97,114,101,10,0,32,32,32,32,70,111,117,110,100,97,116,105,111,110,44,32,54,55,53,32,77,97,115,115,32,65,118,101,44,32,67,97,109,98,114,105,100,103,101,44,32,77,65,32,48,50,49,51,57,44,32,85,83,65,46,10,10,0,66,67,95,66,65,83,69,95,77,65,88,32,32,32,32,32,61,32,37,100,10,0,66,67,95,68,73,77,95,77,65,88,32,32,32,32,32,32,61,32,37,108,100,10,0,66,67,95,83,67,65,76,69,95,77,65,88,32,32,32,32,61,32,37,100,10,0,66,67,95,83,84,82,73,78,71,95,77,65,88,32,32,32,61,32,37,100,10,0,77,65,88,32,69,120,112,111,110,101,110,116,32,32,32,32,61,32,37,108,100,10,0,77,65,88,32,99,111,100,101,32,32,32,32,32,32,32,32,61,32,37,108,100,10,0,109,117,108,116,105,112,108,121,32,100,105,103,105,116,115,32,61,32,37,108,100,10,0,78,117,109,98,101,114,32,111,102,32,118,97,114,115,32,32,61,32,37,108,100,10,0,70,97,116,97,108,32,101,114,114,111,114,58,32,79,117,116,32,111,102,32,109,101,109,111,114,121,32,102,111,114,32,109,97,108,108,111,99,46,10,0,82,117,110,116,105,109,101,32,101,114,114,111,114,32,40,102,117,110,99,61,37,115,44,32,97,100,114,61,37,100,41,58,32,37,115,10,0,82,117,110,116,105,109,101,32,119,97,114,110,105,110,103,32,40,102,117,110,99,61,37,115,44,32,97,100,114,61,37,100,41,58,32,37,115,10,0,37,100,44,0,37,100,0,0,108,99,105,115,118,119,0,98,99,32,49,46,48,51,32,40,78,111,118,32,50,44,32,49,57,57,52,41,10,67,111,112,121,114,105,103,104,116,32,40,67,41,32,49,57,57,49,44,32,49,57,57,50,44,32,49,57,57,51,44,32,49,57,57,52,32,70,114,101,101,32,83,111,102,116,119,97,114,101,32,70,111,117,110,100,97,116,105,111,110,44,32,73,110,99,46,0,10,40,105,110,116,101,114,114,117,112,116,41,32,117,115,101,32,113,117,105,116,32,116,111,32,101,120,105,116,46,0,101,0,108,0,115,0,97,0,99,0,106,0,114,0,70,105,108,101,32,37,115,32,105,115,32,117,110,97,118,97,105,108,97,98,108,101,46,10,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,0,110,111,110,45,122,101,114,111,32,115,99,97,108,101,32,105,110,32,101,120,112,111,110,101,110,116,0,101,120,112,111,110,101,110,116,32,116,111,111,32,108,97,114,103,101,32,105,110,32,114,97,105,115,101,0,37,108,100,0,40,109,97,105,110,41,0,83,116,97,99,107,32,101,114,114,111,114,46,0,110,101,103,97,116,105,118,101,32,105,98,97,115,101,44,32,115,101,116,32,116,111,32,50,0,110,101,103,97,116,105,118,101,32,111,98,97,115,101,44,32,115,101,116,32,116,111,32,50,0,110,101,103,97,116,105,118,101,32,115,99,97,108,101,44,32,115,101,116,32,116,111,32,48,0,105,98,97,115,101,32,116,111,111,32,115,109,97,108,108,44,32,115,101,116,32,116,111,32,50,0,105,98,97,115,101,32,116,111,111,32,108,97,114,103,101,44,32,115,101,116,32,116,111,32,49,54,0,111,98,97,115,101,32,116,111,111,32,115,109,97,108,108,44,32,115,101,116,32,116,111,32,50,0,111,98,97,115,101,32,116,111,111,32,108,97,114,103,101,44,32,115,101,116,32,116,111,32,37,100,0,115,99,97,108,101,32,116,111,111,32,108,97,114,103,101,44,32,115,101,116,32,116,111,32,37,100,0,65,114,114,97,121,32,37,115,32,115,117,98,115,99,114,105,112,116,32,111,117,116,32,111,102,32,98,111,117,110,100,115,46,0,105,98,97,115,101,32,116,111,111,32,115,109,97,108,108,32,105,110,32,45,45,0,111,98,97,115,101,32,116,111,111,32,115,109,97,108,108,32,105,110,32,45,45,0,115,99,97,108,101,32,99,97,110,32,110,111,116,32,98,101,32,110,101,103,97,116,105,118,101,32,105,110,32,45,45,32,0,105,98,97,115,101,32,116,111,111,32,98,105,103,32,105,110,32,43,43,0,111,98,97,115,101,32,116,111,111,32,98,105,103,32,105,110,32,43,43,0,83,99,97,108,101,32,116,111,111,32,98,105,103,32,105,110,32,43,43,0,80,97,114,97,109,101,116,101,114,32,116,121,112,101,32,109,105,115,109,97,116,99,104,32,112,97,114,97,109,101,116,101,114,32,37,115,46,0,80,97,114,97,109,101,116,101,114,32,116,121,112,101,32,109,105,115,109,97,116,99,104,44,32,112,97,114,97,109,101,116,101,114,32,37,115,46,0,80,97,114,97,109,101,116,101,114,32,110,117,109,98,101,114,32,109,105,115,109,97,116,99,104,0,0,0,70,117,110,99,116,105,111,110,32,116,111,111,32,98,105,103,46,0,80,114,111,103,114,97,109,32,116,111,111,32,98,105,103,46,10,0,105,110,116,101,114,114,117,112,116,101,100,32,101,120,101,99,117,116,105,111,110,0,70,117,110,99,116,105,111,110,32,37,115,32,110,111,116,32,100,101,102,105,110,101,100,46,0,82,101,116,117,114,110,32,102,114,111,109,32,109,97,105,110,32,112,114,111,103,114,97,109,46,0,83,113,117,97,114,101,32,114,111,111,116,32,111,102,32,97,32,110,101,103,97,116,105,118,101,32,110,117,109,98,101,114,0,68,105,118,105,100,101,32,98,121,32,122,101,114,111,0,77,111,100,117,108,111,32,98,121,32,122,101,114,111,0,100,105,118,105,100,101,32,98,121,32,122,101,114,111,0,98,97,100,32,105,110,115,116,114,117,99,116,105,111,110,58,32,105,110,115,116,61,37,99,0,73,110,116,101,114,114,117,112,116,105,111,110,32,99,111,109,112,108,101,116,101,100,46,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,84,33,34,25,13,1,2,3,17,75,28,12,16,4,11,29,18,30,39,104,110,111,112,113,98,32,5,6,15,19,20,21,26,8,22,7,40,36,23,24,9,10,14,27,31,37,35,131,130,125,38,42,43,60,61,62,63,67,71,74,77,88,89,90,91,92,93,94,95,96,97,99,100,101,102,103,105,106,107,108,114,115,116,121,122,123,124,0,73,108,108,101,103,97,108,32,98,121,116,101,32,115,101,113,117,101,110,99,101,0,68,111,109,97,105,110,32,101,114,114,111,114,0,82,101,115,117,108,116,32,110,111,116,32,114,101,112,114,101,115,101,110,116,97,98,108,101,0,78,111,116,32,97,32,116,116,121,0,80,101,114,109,105,115,115,105,111,110,32,100,101,110,105,101,100,0,79,112,101,114,97,116,105,111,110,32,110,111,116,32,112,101,114,109,105,116,116,101,100,0,78,111,32,115,117,99,104,32,102,105,108,101,32,111,114,32,100,105,114,101,99,116,111,114,121,0,78,111,32,115,117,99,104,32,112,114,111,99,101,115,115,0,70,105,108,101,32,101,120,105,115,116,115,0,86,97,108,117,101,32,116,111,111,32,108,97,114,103,101,32,102,111,114,32,100,97,116,97,32,116,121,112,101,0,78,111,32,115,112,97,99,101,32,108,101,102,116,32,111,110,32,100,101,118,105,99,101,0,79,117,116,32,111,102,32,109,101,109,111,114,121,0,82,101,115,111,117,114,99,101,32,98,117,115,121,0,73,110,116,101,114,114,117,112,116,101,100,32,115,121,115,116,101,109,32,99,97,108,108,0,82,101,115,111,117,114,99,101,32,116,101,109,112,111,114,97,114,105,108,121,32,117,110,97,118,97,105,108,97,98,108,101,0,73,110,118,97,108,105,100,32,115,101,101,107,0,67,114,111,115,115,45,100,101,118,105,99,101,32,108,105,110,107,0,82,101,97,100,45,111,110,108,121,32,102,105,108,101,32,115,121,115,116,101,109,0,68,105,114,101,99,116,111,114,121,32,110,111,116,32,101,109,112,116,121,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,112,101,101,114,0,79,112,101,114,97,116,105,111,110,32,116,105,109,101,100,32,111,117,116,0,67,111,110,110,101,99,116,105,111,110,32,114,101,102,117,115,101,100,0,72,111,115,116,32,105,115,32,100,111,119,110,0,72,111,115,116,32,105,115,32,117,110,114,101,97,99,104,97,98,108,101,0,65,100,100,114,101,115,115,32,105,110,32,117,115,101,0,66,114,111,107,101,110,32,112,105,112,101,0,73,47,79,32,101,114,114,111,114,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,32,111,114,32,97,100,100,114,101,115,115,0,66,108,111,99,107,32,100,101,118,105,99,101,32,114,101,113,117,105,114,101,100,0,78,111,32,115,117,99,104,32,100,101,118,105,99,101,0,78,111,116,32,97,32,100,105,114,101,99,116,111,114,121,0,73,115,32,97,32,100,105,114,101,99,116,111,114,121,0,84,101,120,116,32,102,105,108,101,32,98,117,115,121,0,69,120,101,99,32,102,111,114,109,97,116,32,101,114,114,111,114,0,73,110,118,97,108,105,100,32,97,114,103,117,109,101,110,116,0,65,114,103,117,109,101,110,116,32,108,105,115,116,32,116,111,111,32,108,111,110,103,0,83,121,109,98,111,108,105,99,32,108,105,110,107,32,108,111,111,112,0,70,105,108,101,110,97,109,101,32,116,111,111,32,108,111,110,103,0,84,111,111,32,109,97,110,121,32,111,112,101,110,32,102,105,108,101,115,32,105,110,32,115,121,115,116,101,109,0,78,111,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,115,32,97,118,97,105,108,97,98,108,101,0,66,97,100,32,102,105,108,101,32,100,101,115,99,114,105,112,116,111,114,0,78,111,32,99,104,105,108,100,32,112,114,111,99,101,115,115,0,66,97,100,32,97,100,100,114,101,115,115,0,70,105,108,101,32,116,111,111,32,108,97,114,103,101,0,84,111,111,32,109,97,110,121,32,108,105,110,107,115,0,78,111,32,108,111,99,107,115,32,97,118,97,105,108,97,98,108,101,0,82,101,115,111,117,114,99,101,32,100,101,97,100,108,111,99,107,32,119,111,117,108,100,32,111,99,99,117,114,0,83,116,97,116,101,32,110,111,116,32,114,101,99,111,118,101,114,97,98,108,101,0,80,114,101,118,105,111,117,115,32,111,119,110,101,114,32,100,105,101,100,0,79,112,101,114,97,116,105,111,110,32,99,97,110,99,101,108,101,100,0,70,117,110,99,116,105,111,110,32,110,111,116,32,105,109,112,108,101,109,101,110,116,101,100,0,78,111,32,109,101,115,115,97,103,101,32,111,102,32,100,101,115,105,114,101,100,32,116,121,112,101,0,73,100,101,110,116,105,102,105,101,114,32,114,101,109,111,118,101,100,0,68,101,118,105,99,101,32,110,111,116,32,97,32,115,116,114,101,97,109,0,78,111,32,100,97,116,97,32,97,118,97,105,108,97,98,108,101,0,68,101,118,105,99,101,32,116,105,109,101,111,117,116,0,79,117,116,32,111,102,32,115,116,114,101,97,109,115,32,114,101,115,111,117,114,99,101,115,0,76,105,110,107,32,104,97,115,32,98,101,101,110,32,115,101,118,101,114,101,100,0,80,114,111,116,111,99,111,108,32,101,114,114,111,114,0,66,97,100,32,109,101,115,115,97,103,101,0,70,105,108,101,32,100,101,115,99,114,105,112,116,111,114,32,105,110,32,98,97,100,32,115,116,97,116,101,0,78,111,116,32,97,32,115,111,99,107,101,116,0,68,101,115,116,105,110,97,116,105,111,110,32,97,100,100,114,101,115,115,32,114,101,113,117,105,114,101,100,0,77,101,115,115,97,103,101,32,116,111,111,32,108,97,114,103,101,0,80,114,111,116,111,99,111,108,32,119,114,111,110,103,32,116,121,112,101,32,102,111,114,32,115,111,99,107,101,116,0,80,114,111,116,111,99,111,108,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,80,114,111,116,111,99,111,108,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,83,111,99,107,101,116,32,116,121,112,101,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,78,111,116,32,115,117,112,112,111,114,116,101,100,0,80,114,111,116,111,99,111,108,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,0,65,100,100,114,101,115,115,32,102,97,109,105,108,121,32,110,111,116,32,115,117,112,112,111,114,116,101,100,32,98,121,32,112,114,111,116,111,99,111,108,0,65,100,100,114,101,115,115,32,110,111,116,32,97,118,97,105,108,97,98,108,101,0,78,101,116,119,111,114,107,32,105,115,32,100,111,119,110,0,78,101,116,119,111,114,107,32,117,110,114,101,97,99,104,97,98,108,101,0,67,111,110,110,101,99,116,105,111,110,32,114,101,115,101,116,32,98,121,32,110,101,116,119,111,114,107,0,67,111,110,110,101,99,116,105,111,110,32,97,98,111,114,116,101,100,0,78,111,32,98,117,102,102,101,114,32,115,112,97,99,101,32,97,118,97,105,108,97,98,108,101,0,83,111,99,107,101,116,32,105,115,32,99,111,110,110,101,99,116,101,100,0,83,111,99,107,101,116,32,110,111,116,32,99,111,110,110,101,99,116,101,100,0,67,97,110,110,111,116,32,115,101,110,100,32,97,102,116,101,114,32,115,111,99,107,101,116,32,115,104,117,116,100,111,119,110,0,79,112,101,114,97,116,105,111,110,32,97,108,114,101,97,100,121,32,105,110,32,112,114,111,103,114,101,115,115,0,79,112,101,114,97,116,105,111,110,32,105,110,32,112,114,111,103,114,101,115,115,0,83,116,97,108,101,32,102,105,108,101,32,104,97,110,100,108,101,0,82,101,109,111,116,101,32,73,47,79,32,101,114,114,111,114,0,81,117,111,116,97,32,101,120,99,101,101,100,101,100,0,78,111,32,109,101,100,105,117,109,32,102,111,117,110,100,0,87,114,111,110,103,32,109,101,100,105,117,109,32,116,121,112,101,0,78,111,32,101,114,114,111,114,32,105,110,102,111,114,109,97,116,105,111,110,0,0,58,32,105,108,108,101,103,97,108,32,111,112,116,105,111,110,58,32,0,10,0,58,32,111,112,116,105,111,110,32,114,101,113,117,105,114,101,115,32,97,110,32,97,114,103,117,109,101,110,116,58,32,0,114,119,97], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+10240);
/* memory initializer */ allocate([17,0,10,0,17,17,17,0,0,0,0,5,0,0,0,0,0,0,9,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,15,10,17,17,17,3,10,7,0,1,19,9,11,11,0,0,9,6,11,0,0,11,0,6,17,0,0,0,17,17,17,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,17,0,10,10,17,17,17,0,10,0,0,2,0,9,11,0,0,0,9,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,14,0,0,0,0,0,0,0,0,0,0,0,13,0,0,0,4,13,0,0,0,0,9,14,0,0,0,0,0,14,0,0,14,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,15,0,0,0,0,15,0,0,0,0,9,16,0,0,0,0,0,16,0,0,16,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,18,0,0,0,18,18,18,0,0,0,0,0,0,9,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,11,0,0,0,0,0,0,0,0,0,0,0,10,0,0,0,0,10,0,0,0,0,9,11,0,0,0,0,0,11,0,0,11,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,0,0,0,0,0,0,0,12,0,0,0,0,12,0,0,0,0,9,12,0,0,0,0,0,12,0,0,12,0,0,48,49,50,51,52,53,54,55,56,57,65,66,67,68,69,70,45,43,32,32,32,48,88,48,120,0,40,110,117,108,108,41,0,45,48,88,43,48,88,32,48,88,45,48,120,43,48,120,32,48,120,0,105,110,102,0,73,78,70,0,110,97,110,0,78,65,78,0,46,0], "i8", ALLOC_NONE, Runtime.GLOBAL_BASE+15764);





/* no memory initializer */
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);

assert(tempDoublePtr % 8 == 0);

function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

}

function copyTempDouble(ptr) {

  HEAP8[tempDoublePtr] = HEAP8[ptr];

  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];

  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];

  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];

  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];

  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];

  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];

  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];

}

// {{PRE_LIBRARY}}


   
  Module["_i64Subtract"] = _i64Subtract;

  
  function ___setErrNo(value) {
      if (Module['___errno_location']) HEAP32[((Module['___errno_location']())>>2)]=value;
      else Module.printErr('failed to set errno from JS');
      return value;
    }
  
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:42,EIDRM:43,ECHRNG:44,EL2NSYNC:45,EL3HLT:46,EL3RST:47,ELNRNG:48,EUNATCH:49,ENOCSI:50,EL2HLT:51,EDEADLK:35,ENOLCK:37,EBADE:52,EBADR:53,EXFULL:54,ENOANO:55,EBADRQC:56,EBADSLT:57,EDEADLOCK:35,EBFONT:59,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:72,EDOTDOT:73,EBADMSG:74,ENOTUNIQ:76,EBADFD:77,EREMCHG:78,ELIBACC:79,ELIBBAD:80,ELIBSCN:81,ELIBMAX:82,ELIBEXEC:83,ENOSYS:38,ENOTEMPTY:39,ENAMETOOLONG:36,ELOOP:40,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:97,EPROTOTYPE:91,ENOTSOCK:88,ENOPROTOOPT:92,ESHUTDOWN:108,ECONNREFUSED:111,EADDRINUSE:98,ECONNABORTED:103,ENETUNREACH:101,ENETDOWN:100,ETIMEDOUT:110,EHOSTDOWN:112,EHOSTUNREACH:113,EINPROGRESS:115,EALREADY:114,EDESTADDRREQ:89,EMSGSIZE:90,EPROTONOSUPPORT:93,ESOCKTNOSUPPORT:94,EADDRNOTAVAIL:99,ENETRESET:102,EISCONN:106,ENOTCONN:107,ETOOMANYREFS:109,EUSERS:87,EDQUOT:122,ESTALE:116,ENOTSUP:95,ENOMEDIUM:123,EILSEQ:84,EOVERFLOW:75,ECANCELED:125,ENOTRECOVERABLE:131,EOWNERDEAD:130,ESTRPIPE:86};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 30: return PAGE_SIZE;
        case 85: return totalMemory / PAGE_SIZE;
        case 132:
        case 133:
        case 12:
        case 137:
        case 138:
        case 15:
        case 235:
        case 16:
        case 17:
        case 18:
        case 19:
        case 20:
        case 149:
        case 13:
        case 10:
        case 236:
        case 153:
        case 9:
        case 21:
        case 22:
        case 159:
        case 154:
        case 14:
        case 77:
        case 78:
        case 139:
        case 80:
        case 81:
        case 82:
        case 68:
        case 67:
        case 164:
        case 11:
        case 29:
        case 47:
        case 48:
        case 95:
        case 52:
        case 51:
        case 46:
          return 200809;
        case 79:
          return 0;
        case 27:
        case 246:
        case 127:
        case 128:
        case 23:
        case 24:
        case 160:
        case 161:
        case 181:
        case 182:
        case 242:
        case 183:
        case 184:
        case 243:
        case 244:
        case 245:
        case 165:
        case 178:
        case 179:
        case 49:
        case 50:
        case 168:
        case 169:
        case 175:
        case 170:
        case 171:
        case 172:
        case 97:
        case 76:
        case 32:
        case 173:
        case 35:
          return -1;
        case 176:
        case 177:
        case 7:
        case 155:
        case 8:
        case 157:
        case 125:
        case 126:
        case 92:
        case 93:
        case 129:
        case 130:
        case 131:
        case 94:
        case 91:
          return 1;
        case 74:
        case 60:
        case 69:
        case 70:
        case 4:
          return 1024;
        case 31:
        case 42:
        case 72:
          return 32;
        case 87:
        case 26:
        case 33:
          return 2147483647;
        case 34:
        case 1:
          return 47839;
        case 38:
        case 36:
          return 99;
        case 43:
        case 37:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 28: return 32768;
        case 44: return 32767;
        case 75: return 16384;
        case 39: return 1000;
        case 89: return 700;
        case 71: return 256;
        case 40: return 255;
        case 2: return 100;
        case 180: return 64;
        case 25: return 20;
        case 5: return 16;
        case 6: return 6;
        case 73: return 4;
        case 84: {
          if (typeof navigator === 'object') return navigator['hardwareConcurrency'] || 1;
          return 1;
        }
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }

   
  Module["_memset"] = _memset;

  var _BDtoILow=true;

   
  Module["_bitshift64Shl"] = _bitshift64Shl;

  function _abort() {
      Module['abort']();
    }

  function ___lock() {}

  function ___unlock() {}

   
  Module["_i64Add"] = _i64Add;

  
  function _emscripten_memcpy_big(dest, src, num) {
      HEAPU8.set(HEAPU8.subarray(src, src+num), dest);
      return dest;
    } 
  Module["_memcpy"] = _memcpy;

  
  function __exit(status) {
      // void _exit(int status);
      // http://pubs.opengroup.org/onlinepubs/000095399/functions/exit.html
      Module['exit'](status);
    }function _exit(status) {
      __exit(status);
    }

  
  
  
  var ERRNO_MESSAGES={0:"Success",1:"Not super-user",2:"No such file or directory",3:"No such process",4:"Interrupted system call",5:"I/O error",6:"No such device or address",7:"Arg list too long",8:"Exec format error",9:"Bad file number",10:"No children",11:"No more processes",12:"Not enough core",13:"Permission denied",14:"Bad address",15:"Block device required",16:"Mount device busy",17:"File exists",18:"Cross-device link",19:"No such device",20:"Not a directory",21:"Is a directory",22:"Invalid argument",23:"Too many open files in system",24:"Too many open files",25:"Not a typewriter",26:"Text file busy",27:"File too large",28:"No space left on device",29:"Illegal seek",30:"Read only file system",31:"Too many links",32:"Broken pipe",33:"Math arg out of domain of func",34:"Math result not representable",35:"File locking deadlock error",36:"File or path name too long",37:"No record locks available",38:"Function not implemented",39:"Directory not empty",40:"Too many symbolic links",42:"No message of desired type",43:"Identifier removed",44:"Channel number out of range",45:"Level 2 not synchronized",46:"Level 3 halted",47:"Level 3 reset",48:"Link number out of range",49:"Protocol driver not attached",50:"No CSI structure available",51:"Level 2 halted",52:"Invalid exchange",53:"Invalid request descriptor",54:"Exchange full",55:"No anode",56:"Invalid request code",57:"Invalid slot",59:"Bad font file fmt",60:"Device not a stream",61:"No data (for no delay io)",62:"Timer expired",63:"Out of streams resources",64:"Machine is not on the network",65:"Package not installed",66:"The object is remote",67:"The link has been severed",68:"Advertise error",69:"Srmount error",70:"Communication error on send",71:"Protocol error",72:"Multihop attempted",73:"Cross mount point (not really error)",74:"Trying to read unreadable message",75:"Value too large for defined data type",76:"Given log. name not unique",77:"f.d. invalid for this operation",78:"Remote address changed",79:"Can   access a needed shared lib",80:"Accessing a corrupted shared lib",81:".lib section in a.out corrupted",82:"Attempting to link in too many libs",83:"Attempting to exec a shared library",84:"Illegal byte sequence",86:"Streams pipe error",87:"Too many users",88:"Socket operation on non-socket",89:"Destination address required",90:"Message too long",91:"Protocol wrong type for socket",92:"Protocol not available",93:"Unknown protocol",94:"Socket type not supported",95:"Not supported",96:"Protocol family not supported",97:"Address family not supported by protocol family",98:"Address already in use",99:"Address not available",100:"Network interface is not configured",101:"Network is unreachable",102:"Connection reset by network",103:"Connection aborted",104:"Connection reset by peer",105:"No buffer space available",106:"Socket is already connected",107:"Socket is not connected",108:"Can't send after socket shutdown",109:"Too many references",110:"Connection timed out",111:"Connection refused",112:"Host is down",113:"Host is unreachable",114:"Socket already connected",115:"Connection already in progress",116:"Stale file handle",122:"Quota exceeded",123:"No medium (in tape drive)",125:"Operation canceled",130:"Previous owner died",131:"State not recoverable"};
  
  var TTY={ttys:[],init:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // currently, FS.init does not distinguish if process.stdin is a file or TTY
        //   // device, it always assumes it's a TTY device. because of this, we're forcing
        //   // process.stdin to UTF8 encoding to at least make stdin reading compatible
        //   // with text files until FS.init can be refactored.
        //   process['stdin']['setEncoding']('utf8');
        // }
      },shutdown:function () {
        // https://github.com/kripken/emscripten/pull/1555
        // if (ENVIRONMENT_IS_NODE) {
        //   // inolen: any idea as to why node -e 'process.stdin.read()' wouldn't exit immediately (with process.stdin being a tty)?
        //   // isaacs: because now it's reading from the stream, you've expressed interest in it, so that read() kicks off a _read() which creates a ReadReq operation
        //   // inolen: I thought read() in that case was a synchronous operation that just grabbed some amount of buffered data if it exists?
        //   // isaacs: it is. but it also triggers a _read() call, which calls readStart() on the handle
        //   // isaacs: do process.stdin.pause() and i'd think it'd probably close the pending call
        //   process['stdin']['pause']();
        // }
      },register:function (dev, ops) {
        TTY.ttys[dev] = { input: [], output: [], ops: ops };
        FS.registerDevice(dev, TTY.stream_ops);
      },stream_ops:{open:function (stream) {
          var tty = TTY.ttys[stream.node.rdev];
          if (!tty) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          stream.tty = tty;
          stream.seekable = false;
        },close:function (stream) {
          // flush any pending line data
          stream.tty.ops.flush(stream.tty);
        },flush:function (stream) {
          stream.tty.ops.flush(stream.tty);
        },read:function (stream, buffer, offset, length, pos /* ignored */) {
          if (!stream.tty || !stream.tty.ops.get_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          var bytesRead = 0;
          for (var i = 0; i < length; i++) {
            var result;
            try {
              result = stream.tty.ops.get_char(stream.tty);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            if (result === undefined && bytesRead === 0) {
              throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
            }
            if (result === null || result === undefined) break;
            bytesRead++;
            buffer[offset+i] = result;
          }
          if (bytesRead) {
            stream.node.timestamp = Date.now();
          }
          return bytesRead;
        },write:function (stream, buffer, offset, length, pos) {
          if (!stream.tty || !stream.tty.ops.put_char) {
            throw new FS.ErrnoError(ERRNO_CODES.ENXIO);
          }
          for (var i = 0; i < length; i++) {
            try {
              stream.tty.ops.put_char(stream.tty, buffer[offset+i]);
            } catch (e) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
          }
          if (length) {
            stream.node.timestamp = Date.now();
          }
          return i;
        }},default_tty_ops:{get_char:function (tty) {
          if (!tty.input.length) {
            var result = null;
            if (ENVIRONMENT_IS_NODE) {
              // we will read data by chunks of BUFSIZE
              var BUFSIZE = 256;
              var buf = new Buffer(BUFSIZE);
              var bytesRead = 0;
  
              var fd = process.stdin.fd;
              // Linux and Mac cannot use process.stdin.fd (which isn't set up as sync)
              var usingDevice = false;
              try {
                fd = fs.openSync('/dev/stdin', 'r');
                usingDevice = true;
              } catch (e) {}
  
              bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null);
  
              if (usingDevice) { fs.closeSync(fd); }
              if (bytesRead > 0) {
                result = buf.slice(0, bytesRead).toString('utf-8');
              } else {
                result = null;
              }
  
            } else if (typeof window != 'undefined' &&
              typeof window.prompt == 'function') {
              // Browser.
              result = window.prompt('Input: ');  // returns null on cancel
              if (result !== null) {
                result += '\n';
              }
            } else if (typeof readline == 'function') {
              // Command line.
              result = readline();
              if (result !== null) {
                result += '\n';
              }
            }
            if (!result) {
              return null;
            }
            tty.input = intArrayFromString(result, true);
          }
          return tty.input.shift();
        },put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val); // val == 0 would cut text output off in the middle.
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['print'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }},default_tty1_ops:{put_char:function (tty, val) {
          if (val === null || val === 10) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          } else {
            if (val != 0) tty.output.push(val);
          }
        },flush:function (tty) {
          if (tty.output && tty.output.length > 0) {
            Module['printErr'](UTF8ArrayToString(tty.output, 0));
            tty.output = [];
          }
        }}};
  
  var MEMFS={ops_table:null,mount:function (mount) {
        return MEMFS.createNode(null, '/', 16384 | 511 /* 0777 */, 0);
      },createNode:function (parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
          // no supported
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (!MEMFS.ops_table) {
          MEMFS.ops_table = {
            dir: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                lookup: MEMFS.node_ops.lookup,
                mknod: MEMFS.node_ops.mknod,
                rename: MEMFS.node_ops.rename,
                unlink: MEMFS.node_ops.unlink,
                rmdir: MEMFS.node_ops.rmdir,
                readdir: MEMFS.node_ops.readdir,
                symlink: MEMFS.node_ops.symlink
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek
              }
            },
            file: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: {
                llseek: MEMFS.stream_ops.llseek,
                read: MEMFS.stream_ops.read,
                write: MEMFS.stream_ops.write,
                allocate: MEMFS.stream_ops.allocate,
                mmap: MEMFS.stream_ops.mmap,
                msync: MEMFS.stream_ops.msync
              }
            },
            link: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr,
                readlink: MEMFS.node_ops.readlink
              },
              stream: {}
            },
            chrdev: {
              node: {
                getattr: MEMFS.node_ops.getattr,
                setattr: MEMFS.node_ops.setattr
              },
              stream: FS.chrdev_stream_ops
            }
          };
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
          node.node_ops = MEMFS.ops_table.dir.node;
          node.stream_ops = MEMFS.ops_table.dir.stream;
          node.contents = {};
        } else if (FS.isFile(node.mode)) {
          node.node_ops = MEMFS.ops_table.file.node;
          node.stream_ops = MEMFS.ops_table.file.stream;
          node.usedBytes = 0; // The actual number of bytes used in the typed array, as opposed to contents.buffer.byteLength which gives the whole capacity.
          // When the byte data of the file is populated, this will point to either a typed array, or a normal JS array. Typed arrays are preferred
          // for performance, and used by default. However, typed arrays are not resizable like normal JS arrays are, so there is a small disk size
          // penalty involved for appending file writes that continuously grow a file similar to std::vector capacity vs used -scheme.
          node.contents = null; 
        } else if (FS.isLink(node.mode)) {
          node.node_ops = MEMFS.ops_table.link.node;
          node.stream_ops = MEMFS.ops_table.link.stream;
        } else if (FS.isChrdev(node.mode)) {
          node.node_ops = MEMFS.ops_table.chrdev.node;
          node.stream_ops = MEMFS.ops_table.chrdev.stream;
        }
        node.timestamp = Date.now();
        // add the new node to the parent
        if (parent) {
          parent.contents[name] = node;
        }
        return node;
      },getFileDataAsRegularArray:function (node) {
        if (node.contents && node.contents.subarray) {
          var arr = [];
          for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
          return arr; // Returns a copy of the original data.
        }
        return node.contents; // No-op, the file contents are already in a JS array. Return as-is.
      },getFileDataAsTypedArray:function (node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes); // Make sure to not return excess unused bytes.
        return new Uint8Array(node.contents);
      },expandFileStorage:function (node, newCapacity) {
        // If we are asked to expand the size of a file that already exists, revert to using a standard JS array to store the file
        // instead of a typed array. This makes resizing the array more flexible because we can just .push() elements at the back to
        // increase the size.
        if (node.contents && node.contents.subarray && newCapacity > node.contents.length) {
          node.contents = MEMFS.getFileDataAsRegularArray(node);
          node.usedBytes = node.contents.length; // We might be writing to a lazy-loaded file which had overridden this property, so force-reset it.
        }
  
        if (!node.contents || node.contents.subarray) { // Keep using a typed array if creating a new storage, or if old one was a typed array as well.
          var prevCapacity = node.contents ? node.contents.buffer.byteLength : 0;
          if (prevCapacity >= newCapacity) return; // No need to expand, the storage was already large enough.
          // Don't expand strictly to the given requested limit if it's only a very small increase, but instead geometrically grow capacity.
          // For small filesizes (<1MB), perform size*2 geometric increase, but for large sizes, do a much more conservative size*1.125 increase to
          // avoid overshooting the allocation cap by a very large margin.
          var CAPACITY_DOUBLING_MAX = 1024 * 1024;
          newCapacity = Math.max(newCapacity, (prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2.0 : 1.125)) | 0);
          if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256); // At minimum allocate 256b for each file when expanding.
          var oldContents = node.contents;
          node.contents = new Uint8Array(newCapacity); // Allocate new storage.
          if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0); // Copy old data over to the new storage.
          return;
        }
        // Not using a typed array to back the file storage. Use a standard JS array instead.
        if (!node.contents && newCapacity > 0) node.contents = [];
        while (node.contents.length < newCapacity) node.contents.push(0);
      },resizeFileStorage:function (node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
          node.contents = null; // Fully decommit when requesting a resize to zero.
          node.usedBytes = 0;
          return;
        }
        if (!node.contents || node.contents.subarray) { // Resize a typed array if that is being used as the backing store.
          var oldContents = node.contents;
          node.contents = new Uint8Array(new ArrayBuffer(newSize)); // Allocate new storage.
          if (oldContents) {
            node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes))); // Copy old data over to the new storage.
          }
          node.usedBytes = newSize;
          return;
        }
        // Backing with a JS array.
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize;
      },node_ops:{getattr:function (node) {
          var attr = {};
          // device numbers reuse inode numbers.
          attr.dev = FS.isChrdev(node.mode) ? node.id : 1;
          attr.ino = node.id;
          attr.mode = node.mode;
          attr.nlink = 1;
          attr.uid = 0;
          attr.gid = 0;
          attr.rdev = node.rdev;
          if (FS.isDir(node.mode)) {
            attr.size = 4096;
          } else if (FS.isFile(node.mode)) {
            attr.size = node.usedBytes;
          } else if (FS.isLink(node.mode)) {
            attr.size = node.link.length;
          } else {
            attr.size = 0;
          }
          attr.atime = new Date(node.timestamp);
          attr.mtime = new Date(node.timestamp);
          attr.ctime = new Date(node.timestamp);
          // NOTE: In our implementation, st_blocks = Math.ceil(st_size/st_blksize),
          //       but this is not required by the standard.
          attr.blksize = 4096;
          attr.blocks = Math.ceil(attr.size / attr.blksize);
          return attr;
        },setattr:function (node, attr) {
          if (attr.mode !== undefined) {
            node.mode = attr.mode;
          }
          if (attr.timestamp !== undefined) {
            node.timestamp = attr.timestamp;
          }
          if (attr.size !== undefined) {
            MEMFS.resizeFileStorage(node, attr.size);
          }
        },lookup:function (parent, name) {
          throw FS.genericErrors[ERRNO_CODES.ENOENT];
        },mknod:function (parent, name, mode, dev) {
          return MEMFS.createNode(parent, name, mode, dev);
        },rename:function (old_node, new_dir, new_name) {
          // if we're overwriting a directory at new_name, make sure it's empty.
          if (FS.isDir(old_node.mode)) {
            var new_node;
            try {
              new_node = FS.lookupNode(new_dir, new_name);
            } catch (e) {
            }
            if (new_node) {
              for (var i in new_node.contents) {
                throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
              }
            }
          }
          // do the internal rewiring
          delete old_node.parent.contents[old_node.name];
          old_node.name = new_name;
          new_dir.contents[new_name] = old_node;
          old_node.parent = new_dir;
        },unlink:function (parent, name) {
          delete parent.contents[name];
        },rmdir:function (parent, name) {
          var node = FS.lookupNode(parent, name);
          for (var i in node.contents) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
          }
          delete parent.contents[name];
        },readdir:function (node) {
          var entries = ['.', '..']
          for (var key in node.contents) {
            if (!node.contents.hasOwnProperty(key)) {
              continue;
            }
            entries.push(key);
          }
          return entries;
        },symlink:function (parent, newname, oldpath) {
          var node = MEMFS.createNode(parent, newname, 511 /* 0777 */ | 40960, 0);
          node.link = oldpath;
          return node;
        },readlink:function (node) {
          if (!FS.isLink(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return node.link;
        }},stream_ops:{read:function (stream, buffer, offset, length, position) {
          var contents = stream.node.contents;
          if (position >= stream.node.usedBytes) return 0;
          var size = Math.min(stream.node.usedBytes - position, length);
          assert(size >= 0);
          if (size > 8 && contents.subarray) { // non-trivial, and typed array
            buffer.set(contents.subarray(position, position + size), offset);
          } else {
            for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i];
          }
          return size;
        },write:function (stream, buffer, offset, length, position, canOwn) {
          if (!length) return 0;
          var node = stream.node;
          node.timestamp = Date.now();
  
          if (buffer.subarray && (!node.contents || node.contents.subarray)) { // This write is from a typed array to a typed array?
            if (canOwn) { // Can we just reuse the buffer we are given?
              assert(position === 0, 'canOwn must imply no weird position inside the file');
              node.contents = buffer.subarray(offset, offset + length);
              node.usedBytes = length;
              return length;
            } else if (node.usedBytes === 0 && position === 0) { // If this is a simple first write to an empty file, do a fast set since we don't need to care about old data.
              node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
              node.usedBytes = length;
              return length;
            } else if (position + length <= node.usedBytes) { // Writing to an already allocated and used subrange of the file?
              node.contents.set(buffer.subarray(offset, offset + length), position);
              return length;
            }
          }
  
          // Appending to an existing file and we need to reallocate, or source data did not come as a typed array.
          MEMFS.expandFileStorage(node, position+length);
          if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position); // Use typed array write if available.
          else {
            for (var i = 0; i < length; i++) {
             node.contents[position + i] = buffer[offset + i]; // Or fall back to manual write if not.
            }
          }
          node.usedBytes = Math.max(node.usedBytes, position+length);
          return length;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              position += stream.node.usedBytes;
            }
          }
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
          return position;
        },allocate:function (stream, offset, length) {
          MEMFS.expandFileStorage(stream.node, offset + length);
          stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length);
        },mmap:function (stream, buffer, offset, length, position, prot, flags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          var ptr;
          var allocated;
          var contents = stream.node.contents;
          // Only make a new copy when MAP_PRIVATE is specified.
          if ( !(flags & 2) &&
                (contents.buffer === buffer || contents.buffer === buffer.buffer) ) {
            // We can't emulate MAP_SHARED when the file is not backed by the buffer
            // we're mapping to (e.g. the HEAP buffer).
            allocated = false;
            ptr = contents.byteOffset;
          } else {
            // Try to avoid unnecessary slices.
            if (position > 0 || position + length < stream.node.usedBytes) {
              if (contents.subarray) {
                contents = contents.subarray(position, position + length);
              } else {
                contents = Array.prototype.slice.call(contents, position, position + length);
              }
            }
            allocated = true;
            ptr = _malloc(length);
            if (!ptr) {
              throw new FS.ErrnoError(ERRNO_CODES.ENOMEM);
            }
            buffer.set(contents, ptr);
          }
          return { ptr: ptr, allocated: allocated };
        },msync:function (stream, buffer, offset, length, mmapFlags) {
          if (!FS.isFile(stream.node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
          }
          if (mmapFlags & 2) {
            // MAP_PRIVATE calls need not to be synced back to underlying fs
            return 0;
          }
  
          var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
          // should we check if bytesWritten and length are the same?
          return 0;
        }}};
  
  var IDBFS={dbs:{},indexedDB:function () {
        if (typeof indexedDB !== 'undefined') return indexedDB;
        var ret = null;
        if (typeof window === 'object') ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, 'IDBFS used, but indexedDB not supported');
        return ret;
      },DB_VERSION:21,DB_STORE_NAME:"FILE_DATA",mount:function (mount) {
        // reuse all of the core MEMFS functionality
        return MEMFS.mount.apply(null, arguments);
      },syncfs:function (mount, populate, callback) {
        IDBFS.getLocalSet(mount, function(err, local) {
          if (err) return callback(err);
  
          IDBFS.getRemoteSet(mount, function(err, remote) {
            if (err) return callback(err);
  
            var src = populate ? remote : local;
            var dst = populate ? local : remote;
  
            IDBFS.reconcile(src, dst, callback);
          });
        });
      },getDB:function (name, callback) {
        // check the cache first
        var db = IDBFS.dbs[name];
        if (db) {
          return callback(null, db);
        }
  
        var req;
        try {
          req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION);
        } catch (e) {
          return callback(e);
        }
        req.onupgradeneeded = function(e) {
          var db = e.target.result;
          var transaction = e.target.transaction;
  
          var fileStore;
  
          if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
            fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME);
          } else {
            fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME);
          }
  
          if (!fileStore.indexNames.contains('timestamp')) {
            fileStore.createIndex('timestamp', 'timestamp', { unique: false });
          }
        };
        req.onsuccess = function() {
          db = req.result;
  
          // add to the cache
          IDBFS.dbs[name] = db;
          callback(null, db);
        };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },getLocalSet:function (mount, callback) {
        var entries = {};
  
        function isRealDir(p) {
          return p !== '.' && p !== '..';
        };
        function toAbsolute(root) {
          return function(p) {
            return PATH.join2(root, p);
          }
        };
  
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
  
        while (check.length) {
          var path = check.pop();
          var stat;
  
          try {
            stat = FS.stat(path);
          } catch (e) {
            return callback(e);
          }
  
          if (FS.isDir(stat.mode)) {
            check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)));
          }
  
          entries[path] = { timestamp: stat.mtime };
        }
  
        return callback(null, { type: 'local', entries: entries });
      },getRemoteSet:function (mount, callback) {
        var entries = {};
  
        IDBFS.getDB(mount.mountpoint, function(err, db) {
          if (err) return callback(err);
  
          var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readonly');
          transaction.onerror = function(e) {
            callback(this.error);
            e.preventDefault();
          };
  
          var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
          var index = store.index('timestamp');
  
          index.openKeyCursor().onsuccess = function(event) {
            var cursor = event.target.result;
  
            if (!cursor) {
              return callback(null, { type: 'remote', db: db, entries: entries });
            }
  
            entries[cursor.primaryKey] = { timestamp: cursor.key };
  
            cursor.continue();
          };
        });
      },loadLocalEntry:function (path, callback) {
        var stat, node;
  
        try {
          var lookup = FS.lookupPath(path);
          node = lookup.node;
          stat = FS.stat(path);
        } catch (e) {
          return callback(e);
        }
  
        if (FS.isDir(stat.mode)) {
          return callback(null, { timestamp: stat.mtime, mode: stat.mode });
        } else if (FS.isFile(stat.mode)) {
          // Performance consideration: storing a normal JavaScript array to a IndexedDB is much slower than storing a typed array.
          // Therefore always convert the file contents to a typed array first before writing the data to IndexedDB.
          node.contents = MEMFS.getFileDataAsTypedArray(node);
          return callback(null, { timestamp: stat.mtime, mode: stat.mode, contents: node.contents });
        } else {
          return callback(new Error('node type not supported'));
        }
      },storeLocalEntry:function (path, entry, callback) {
        try {
          if (FS.isDir(entry.mode)) {
            FS.mkdir(path, entry.mode);
          } else if (FS.isFile(entry.mode)) {
            FS.writeFile(path, entry.contents, { encoding: 'binary', canOwn: true });
          } else {
            return callback(new Error('node type not supported'));
          }
  
          FS.chmod(path, entry.mode);
          FS.utime(path, entry.timestamp, entry.timestamp);
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },removeLocalEntry:function (path, callback) {
        try {
          var lookup = FS.lookupPath(path);
          var stat = FS.stat(path);
  
          if (FS.isDir(stat.mode)) {
            FS.rmdir(path);
          } else if (FS.isFile(stat.mode)) {
            FS.unlink(path);
          }
        } catch (e) {
          return callback(e);
        }
  
        callback(null);
      },loadRemoteEntry:function (store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) { callback(null, event.target.result); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },storeRemoteEntry:function (store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },removeRemoteEntry:function (store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() { callback(null); };
        req.onerror = function(e) {
          callback(this.error);
          e.preventDefault();
        };
      },reconcile:function (src, dst, callback) {
        var total = 0;
  
        var create = [];
        Object.keys(src.entries).forEach(function (key) {
          var e = src.entries[key];
          var e2 = dst.entries[key];
          if (!e2 || e.timestamp > e2.timestamp) {
            create.push(key);
            total++;
          }
        });
  
        var remove = [];
        Object.keys(dst.entries).forEach(function (key) {
          var e = dst.entries[key];
          var e2 = src.entries[key];
          if (!e2) {
            remove.push(key);
            total++;
          }
        });
  
        if (!total) {
          return callback(null);
        }
  
        var errored = false;
        var completed = 0;
        var db = src.type === 'remote' ? src.db : dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], 'readwrite');
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= total) {
            return callback(null);
          }
        };
  
        transaction.onerror = function(e) {
          done(this.error);
          e.preventDefault();
        };
  
        // sort paths in ascending order so directory entries are created
        // before the files inside them
        create.sort().forEach(function (path) {
          if (dst.type === 'local') {
            IDBFS.loadRemoteEntry(store, path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeLocalEntry(path, entry, done);
            });
          } else {
            IDBFS.loadLocalEntry(path, function (err, entry) {
              if (err) return done(err);
              IDBFS.storeRemoteEntry(store, path, entry, done);
            });
          }
        });
  
        // sort paths in descending order so files are deleted before their
        // parent directories
        remove.sort().reverse().forEach(function(path) {
          if (dst.type === 'local') {
            IDBFS.removeLocalEntry(path, done);
          } else {
            IDBFS.removeRemoteEntry(store, path, done);
          }
        });
      }};
  
  var NODEFS={isWindows:false,staticInit:function () {
        NODEFS.isWindows = !!process.platform.match(/^win/);
      },mount:function (mount) {
        assert(ENVIRONMENT_IS_NODE);
        return NODEFS.createNode(null, '/', NODEFS.getMode(mount.opts.root), 0);
      },createNode:function (parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node;
      },getMode:function (path) {
        var stat;
        try {
          stat = fs.lstatSync(path);
          if (NODEFS.isWindows) {
            // On Windows, directories return permission bits 'rw-rw-rw-', even though they have 'rwxrwxrwx', so
            // propagate write bits to execute bits.
            stat.mode = stat.mode | ((stat.mode & 146) >> 1);
          }
        } catch (e) {
          if (!e.code) throw e;
          throw new FS.ErrnoError(ERRNO_CODES[e.code]);
        }
        return stat.mode;
      },realPath:function (node) {
        var parts = [];
        while (node.parent !== node) {
          parts.push(node.name);
          node = node.parent;
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts);
      },flagsToPermissionStringMap:{0:"r",1:"r+",2:"r+",64:"r",65:"r+",66:"r+",129:"rx+",193:"rx+",514:"w+",577:"w",578:"w+",705:"wx",706:"wx+",1024:"a",1025:"a",1026:"a+",1089:"a",1090:"a+",1153:"ax",1154:"ax+",1217:"ax",1218:"ax+",4096:"rs",4098:"rs+"},flagsToPermissionString:function (flags) {
        if (flags in NODEFS.flagsToPermissionStringMap) {
          return NODEFS.flagsToPermissionStringMap[flags];
        } else {
          return flags;
        }
      },node_ops:{getattr:function (node) {
          var path = NODEFS.realPath(node);
          var stat;
          try {
            stat = fs.lstatSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          // node.js v0.10.20 doesn't report blksize and blocks on Windows. Fake them with default blksize of 4096.
          // See http://support.microsoft.com/kb/140365
          if (NODEFS.isWindows && !stat.blksize) {
            stat.blksize = 4096;
          }
          if (NODEFS.isWindows && !stat.blocks) {
            stat.blocks = (stat.size+stat.blksize-1)/stat.blksize|0;
          }
          return {
            dev: stat.dev,
            ino: stat.ino,
            mode: stat.mode,
            nlink: stat.nlink,
            uid: stat.uid,
            gid: stat.gid,
            rdev: stat.rdev,
            size: stat.size,
            atime: stat.atime,
            mtime: stat.mtime,
            ctime: stat.ctime,
            blksize: stat.blksize,
            blocks: stat.blocks
          };
        },setattr:function (node, attr) {
          var path = NODEFS.realPath(node);
          try {
            if (attr.mode !== undefined) {
              fs.chmodSync(path, attr.mode);
              // update the common node structure mode as well
              node.mode = attr.mode;
            }
            if (attr.timestamp !== undefined) {
              var date = new Date(attr.timestamp);
              fs.utimesSync(path, date, date);
            }
            if (attr.size !== undefined) {
              fs.truncateSync(path, attr.size);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },lookup:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          var mode = NODEFS.getMode(path);
          return NODEFS.createNode(parent, name, mode);
        },mknod:function (parent, name, mode, dev) {
          var node = NODEFS.createNode(parent, name, mode, dev);
          // create the backing node for this in the fs root as well
          var path = NODEFS.realPath(node);
          try {
            if (FS.isDir(node.mode)) {
              fs.mkdirSync(path, node.mode);
            } else {
              fs.writeFileSync(path, '', { mode: node.mode });
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return node;
        },rename:function (oldNode, newDir, newName) {
          var oldPath = NODEFS.realPath(oldNode);
          var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
          try {
            fs.renameSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },unlink:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.unlinkSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },rmdir:function (parent, name) {
          var path = PATH.join2(NODEFS.realPath(parent), name);
          try {
            fs.rmdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readdir:function (node) {
          var path = NODEFS.realPath(node);
          try {
            return fs.readdirSync(path);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },symlink:function (parent, newName, oldPath) {
          var newPath = PATH.join2(NODEFS.realPath(parent), newName);
          try {
            fs.symlinkSync(oldPath, newPath);
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },readlink:function (node) {
          var path = NODEFS.realPath(node);
          try {
            path = fs.readlinkSync(path);
            path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
            return path;
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        }},stream_ops:{open:function (stream) {
          var path = NODEFS.realPath(stream.node);
          try {
            if (FS.isFile(stream.node.mode)) {
              stream.nfd = fs.openSync(path, NODEFS.flagsToPermissionString(stream.flags));
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },close:function (stream) {
          try {
            if (FS.isFile(stream.node.mode) && stream.nfd) {
              fs.closeSync(stream.nfd);
            }
          } catch (e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
        },read:function (stream, buffer, offset, length, position) {
          if (length === 0) return 0; // node errors on 0 length reads
          // FIXME this is terrible.
          var nbuffer = new Buffer(length);
          var res;
          try {
            res = fs.readSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          if (res > 0) {
            for (var i = 0; i < res; i++) {
              buffer[offset + i] = nbuffer[i];
            }
          }
          return res;
        },write:function (stream, buffer, offset, length, position) {
          // FIXME this is terrible.
          var nbuffer = new Buffer(buffer.subarray(offset, offset + length));
          var res;
          try {
            res = fs.writeSync(stream.nfd, nbuffer, 0, length, position);
          } catch (e) {
            throw new FS.ErrnoError(ERRNO_CODES[e.code]);
          }
          return res;
        },llseek:function (stream, offset, whence) {
          var position = offset;
          if (whence === 1) {  // SEEK_CUR.
            position += stream.position;
          } else if (whence === 2) {  // SEEK_END.
            if (FS.isFile(stream.node.mode)) {
              try {
                var stat = fs.fstatSync(stream.nfd);
                position += stat.size;
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES[e.code]);
              }
            }
          }
  
          if (position < 0) {
            throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
          }
  
          return position;
        }}};
  
  var _stdin=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stdout=allocate(1, "i32*", ALLOC_STATIC);
  
  var _stderr=allocate(1, "i32*", ALLOC_STATIC);var FS={root:null,mounts:[],devices:[null],streams:[],nextInode:1,nameTable:null,currentPath:"/",initialized:false,ignorePermissions:true,trackingDelegate:{},tracking:{openFlags:{READ:1,WRITE:2}},ErrnoError:null,genericErrors:{},handleFSError:function (e) {
        if (!(e instanceof FS.ErrnoError)) throw e + ' : ' + stackTrace();
        return ___setErrNo(e.errno);
      },lookupPath:function (path, opts) {
        path = PATH.resolve(FS.cwd(), path);
        opts = opts || {};
  
        if (!path) return { path: '', node: null };
  
        var defaults = {
          follow_mount: true,
          recurse_count: 0
        };
        for (var key in defaults) {
          if (opts[key] === undefined) {
            opts[key] = defaults[key];
          }
        }
  
        if (opts.recurse_count > 8) {  // max recursive lookup of 8
          throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
        }
  
        // split the path
        var parts = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), false);
  
        // start at the root
        var current = FS.root;
        var current_path = '/';
  
        for (var i = 0; i < parts.length; i++) {
          var islast = (i === parts.length-1);
          if (islast && opts.parent) {
            // stop resolving
            break;
          }
  
          current = FS.lookupNode(current, parts[i]);
          current_path = PATH.join2(current_path, parts[i]);
  
          // jump to the mount's root node if this is a mountpoint
          if (FS.isMountpoint(current)) {
            if (!islast || (islast && opts.follow_mount)) {
              current = current.mounted.root;
            }
          }
  
          // by default, lookupPath will not follow a symlink if it is the final path component.
          // setting opts.follow = true will override this behavior.
          if (!islast || opts.follow) {
            var count = 0;
            while (FS.isLink(current.mode)) {
              var link = FS.readlink(current_path);
              current_path = PATH.resolve(PATH.dirname(current_path), link);
  
              var lookup = FS.lookupPath(current_path, { recurse_count: opts.recurse_count });
              current = lookup.node;
  
              if (count++ > 40) {  // limit max consecutive symlinks to 40 (SYMLOOP_MAX).
                throw new FS.ErrnoError(ERRNO_CODES.ELOOP);
              }
            }
          }
        }
  
        return { path: current_path, node: current };
      },getPath:function (node) {
        var path;
        while (true) {
          if (FS.isRoot(node)) {
            var mount = node.mount.mountpoint;
            if (!path) return mount;
            return mount[mount.length-1] !== '/' ? mount + '/' + path : mount + path;
          }
          path = path ? node.name + '/' + path : node.name;
          node = node.parent;
        }
      },hashName:function (parentid, name) {
        var hash = 0;
  
  
        for (var i = 0; i < name.length; i++) {
          hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
        }
        return ((parentid + hash) >>> 0) % FS.nameTable.length;
      },hashAddNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node;
      },hashRemoveNode:function (node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
          FS.nameTable[hash] = node.name_next;
        } else {
          var current = FS.nameTable[hash];
          while (current) {
            if (current.name_next === node) {
              current.name_next = node.name_next;
              break;
            }
            current = current.name_next;
          }
        }
      },lookupNode:function (parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
          throw new FS.ErrnoError(err, parent);
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
          var nodeName = node.name;
          if (node.parent.id === parent.id && nodeName === name) {
            return node;
          }
        }
        // if we failed to find it in the cache, call into the VFS
        return FS.lookup(parent, name);
      },createNode:function (parent, name, mode, rdev) {
        if (!FS.FSNode) {
          FS.FSNode = function(parent, name, mode, rdev) {
            if (!parent) {
              parent = this;  // root node sets parent to itself
            }
            this.parent = parent;
            this.mount = parent.mount;
            this.mounted = null;
            this.id = FS.nextInode++;
            this.name = name;
            this.mode = mode;
            this.node_ops = {};
            this.stream_ops = {};
            this.rdev = rdev;
          };
  
          FS.FSNode.prototype = {};
  
          // compatibility
          var readMode = 292 | 73;
          var writeMode = 146;
  
          // NOTE we must use Object.defineProperties instead of individual calls to
          // Object.defineProperty in order to make closure compiler happy
          Object.defineProperties(FS.FSNode.prototype, {
            read: {
              get: function() { return (this.mode & readMode) === readMode; },
              set: function(val) { val ? this.mode |= readMode : this.mode &= ~readMode; }
            },
            write: {
              get: function() { return (this.mode & writeMode) === writeMode; },
              set: function(val) { val ? this.mode |= writeMode : this.mode &= ~writeMode; }
            },
            isFolder: {
              get: function() { return FS.isDir(this.mode); }
            },
            isDevice: {
              get: function() { return FS.isChrdev(this.mode); }
            }
          });
        }
  
        var node = new FS.FSNode(parent, name, mode, rdev);
  
        FS.hashAddNode(node);
  
        return node;
      },destroyNode:function (node) {
        FS.hashRemoveNode(node);
      },isRoot:function (node) {
        return node === node.parent;
      },isMountpoint:function (node) {
        return !!node.mounted;
      },isFile:function (mode) {
        return (mode & 61440) === 32768;
      },isDir:function (mode) {
        return (mode & 61440) === 16384;
      },isLink:function (mode) {
        return (mode & 61440) === 40960;
      },isChrdev:function (mode) {
        return (mode & 61440) === 8192;
      },isBlkdev:function (mode) {
        return (mode & 61440) === 24576;
      },isFIFO:function (mode) {
        return (mode & 61440) === 4096;
      },isSocket:function (mode) {
        return (mode & 49152) === 49152;
      },flagModes:{"r":0,"rs":1052672,"r+":2,"w":577,"wx":705,"xw":705,"w+":578,"wx+":706,"xw+":706,"a":1089,"ax":1217,"xa":1217,"a+":1090,"ax+":1218,"xa+":1218},modeStringToFlags:function (str) {
        var flags = FS.flagModes[str];
        if (typeof flags === 'undefined') {
          throw new Error('Unknown file open mode: ' + str);
        }
        return flags;
      },flagsToPermissionString:function (flag) {
        var perms = ['r', 'w', 'rw'][flag & 3];
        if ((flag & 512)) {
          perms += 'w';
        }
        return perms;
      },nodePermissions:function (node, perms) {
        if (FS.ignorePermissions) {
          return 0;
        }
        // return 0 if any user, group or owner bits are set.
        if (perms.indexOf('r') !== -1 && !(node.mode & 292)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('w') !== -1 && !(node.mode & 146)) {
          return ERRNO_CODES.EACCES;
        } else if (perms.indexOf('x') !== -1 && !(node.mode & 73)) {
          return ERRNO_CODES.EACCES;
        }
        return 0;
      },mayLookup:function (dir) {
        var err = FS.nodePermissions(dir, 'x');
        if (err) return err;
        if (!dir.node_ops.lookup) return ERRNO_CODES.EACCES;
        return 0;
      },mayCreate:function (dir, name) {
        try {
          var node = FS.lookupNode(dir, name);
          return ERRNO_CODES.EEXIST;
        } catch (e) {
        }
        return FS.nodePermissions(dir, 'wx');
      },mayDelete:function (dir, name, isdir) {
        var node;
        try {
          node = FS.lookupNode(dir, name);
        } catch (e) {
          return e.errno;
        }
        var err = FS.nodePermissions(dir, 'wx');
        if (err) {
          return err;
        }
        if (isdir) {
          if (!FS.isDir(node.mode)) {
            return ERRNO_CODES.ENOTDIR;
          }
          if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
            return ERRNO_CODES.EBUSY;
          }
        } else {
          if (FS.isDir(node.mode)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return 0;
      },mayOpen:function (node, flags) {
        if (!node) {
          return ERRNO_CODES.ENOENT;
        }
        if (FS.isLink(node.mode)) {
          return ERRNO_CODES.ELOOP;
        } else if (FS.isDir(node.mode)) {
          if ((flags & 2097155) !== 0 ||  // opening for write
              (flags & 512)) {
            return ERRNO_CODES.EISDIR;
          }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags));
      },MAX_OPEN_FDS:4096,nextfd:function (fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
          if (!FS.streams[fd]) {
            return fd;
          }
        }
        throw new FS.ErrnoError(ERRNO_CODES.EMFILE);
      },getStream:function (fd) {
        return FS.streams[fd];
      },createStream:function (stream, fd_start, fd_end) {
        if (!FS.FSStream) {
          FS.FSStream = function(){};
          FS.FSStream.prototype = {};
          // compatibility
          Object.defineProperties(FS.FSStream.prototype, {
            object: {
              get: function() { return this.node; },
              set: function(val) { this.node = val; }
            },
            isRead: {
              get: function() { return (this.flags & 2097155) !== 1; }
            },
            isWrite: {
              get: function() { return (this.flags & 2097155) !== 0; }
            },
            isAppend: {
              get: function() { return (this.flags & 1024); }
            }
          });
        }
        // clone it, so we can return an instance of FSStream
        var newStream = new FS.FSStream();
        for (var p in stream) {
          newStream[p] = stream[p];
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream;
      },closeStream:function (fd) {
        FS.streams[fd] = null;
      },chrdev_stream_ops:{open:function (stream) {
          var device = FS.getDevice(stream.node.rdev);
          // override node's stream ops with the device's
          stream.stream_ops = device.stream_ops;
          // forward the open call
          if (stream.stream_ops.open) {
            stream.stream_ops.open(stream);
          }
        },llseek:function () {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }},major:function (dev) {
        return ((dev) >> 8);
      },minor:function (dev) {
        return ((dev) & 0xff);
      },makedev:function (ma, mi) {
        return ((ma) << 8 | (mi));
      },registerDevice:function (dev, ops) {
        FS.devices[dev] = { stream_ops: ops };
      },getDevice:function (dev) {
        return FS.devices[dev];
      },getMounts:function (mount) {
        var mounts = [];
        var check = [mount];
  
        while (check.length) {
          var m = check.pop();
  
          mounts.push(m);
  
          check.push.apply(check, m.mounts);
        }
  
        return mounts;
      },syncfs:function (populate, callback) {
        if (typeof(populate) === 'function') {
          callback = populate;
          populate = false;
        }
  
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
  
        function done(err) {
          if (err) {
            if (!done.errored) {
              done.errored = true;
              return callback(err);
            }
            return;
          }
          if (++completed >= mounts.length) {
            callback(null);
          }
        };
  
        // sync all mounts
        mounts.forEach(function (mount) {
          if (!mount.type.syncfs) {
            return done(null);
          }
          mount.type.syncfs(mount, populate, done);
        });
      },mount:function (type, opts, mountpoint) {
        var root = mountpoint === '/';
        var pseudo = !mountpoint;
        var node;
  
        if (root && FS.root) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        } else if (!root && !pseudo) {
          var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
          mountpoint = lookup.path;  // use the absolute path
          node = lookup.node;
  
          if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
          }
  
          if (!FS.isDir(node.mode)) {
            throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
          }
        }
  
        var mount = {
          type: type,
          opts: opts,
          mountpoint: mountpoint,
          mounts: []
        };
  
        // create a root node for the fs
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
  
        if (root) {
          FS.root = mountRoot;
        } else if (node) {
          // set as a mountpoint
          node.mounted = mount;
  
          // add the new mount to the current mount's children
          if (node.mount) {
            node.mount.mounts.push(mount);
          }
        }
  
        return mountRoot;
      },unmount:function (mountpoint) {
        var lookup = FS.lookupPath(mountpoint, { follow_mount: false });
  
        if (!FS.isMountpoint(lookup.node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
  
        // destroy the nodes for this mount, and all its child mounts
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
  
        Object.keys(FS.nameTable).forEach(function (hash) {
          var current = FS.nameTable[hash];
  
          while (current) {
            var next = current.name_next;
  
            if (mounts.indexOf(current.mount) !== -1) {
              FS.destroyNode(current);
            }
  
            current = next;
          }
        });
  
        // no longer a mountpoint
        node.mounted = null;
  
        // remove this mount from the child mounts
        var idx = node.mount.mounts.indexOf(mount);
        assert(idx !== -1);
        node.mount.mounts.splice(idx, 1);
      },lookup:function (parent, name) {
        return parent.node_ops.lookup(parent, name);
      },mknod:function (path, mode, dev) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === '.' || name === '..') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.mknod) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.mknod(parent, name, mode, dev);
      },create:function (path, mode) {
        mode = mode !== undefined ? mode : 438 /* 0666 */;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0);
      },mkdir:function (path, mode) {
        mode = mode !== undefined ? mode : 511 /* 0777 */;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0);
      },mkdev:function (path, mode, dev) {
        if (typeof(dev) === 'undefined') {
          dev = mode;
          mode = 438 /* 0666 */;
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev);
      },symlink:function (oldpath, newpath) {
        if (!PATH.resolve(oldpath)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var lookup = FS.lookupPath(newpath, { parent: true });
        var parent = lookup.node;
        if (!parent) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.symlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return parent.node_ops.symlink(parent, newname, oldpath);
      },rename:function (old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        // parents must exist
        var lookup, old_dir, new_dir;
        try {
          lookup = FS.lookupPath(old_path, { parent: true });
          old_dir = lookup.node;
          lookup = FS.lookupPath(new_path, { parent: true });
          new_dir = lookup.node;
        } catch (e) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        // need to be part of the same mount
        if (old_dir.mount !== new_dir.mount) {
          throw new FS.ErrnoError(ERRNO_CODES.EXDEV);
        }
        // source must exist
        var old_node = FS.lookupNode(old_dir, old_name);
        // old path should not be an ancestor of the new path
        var relative = PATH.relative(old_path, new_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        // new path should not be an ancestor of the old path
        relative = PATH.relative(new_path, old_dirname);
        if (relative.charAt(0) !== '.') {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTEMPTY);
        }
        // see if the new path already exists
        var new_node;
        try {
          new_node = FS.lookupNode(new_dir, new_name);
        } catch (e) {
          // not fatal
        }
        // early out if nothing needs to change
        if (old_node === new_node) {
          return;
        }
        // we'll need to delete the old entry
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        // need delete permissions if we'll be overwriting.
        // need create permissions if new doesn't already exist.
        err = new_node ?
          FS.mayDelete(new_dir, new_name, isdir) :
          FS.mayCreate(new_dir, new_name);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!old_dir.node_ops.rename) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(old_node) || (new_node && FS.isMountpoint(new_node))) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        // if we are going to change the parent, check write permissions
        if (new_dir !== old_dir) {
          err = FS.nodePermissions(old_dir, 'w');
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        try {
          if (FS.trackingDelegate['willMovePath']) {
            FS.trackingDelegate['willMovePath'](old_path, new_path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
        // remove the node from the lookup hash
        FS.hashRemoveNode(old_node);
        // do the underlying fs rename
        try {
          old_dir.node_ops.rename(old_node, new_dir, new_name);
        } catch (e) {
          throw e;
        } finally {
          // add the node back to the hash (in case node_ops.rename
          // changed its name)
          FS.hashAddNode(old_node);
        }
        try {
          if (FS.trackingDelegate['onMovePath']) FS.trackingDelegate['onMovePath'](old_path, new_path);
        } catch(e) {
          console.log("FS.trackingDelegate['onMovePath']('"+old_path+"', '"+new_path+"') threw an exception: " + e.message);
        }
      },rmdir:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.rmdir) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        return node.node_ops.readdir(node);
      },unlink:function (path) {
        var lookup = FS.lookupPath(path, { parent: true });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
          // POSIX says unlink should set EPERM, not EISDIR
          if (err === ERRNO_CODES.EISDIR) err = ERRNO_CODES.EPERM;
          throw new FS.ErrnoError(err);
        }
        if (!parent.node_ops.unlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isMountpoint(node)) {
          throw new FS.ErrnoError(ERRNO_CODES.EBUSY);
        }
        try {
          if (FS.trackingDelegate['willDeletePath']) {
            FS.trackingDelegate['willDeletePath'](path);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['willDeletePath']('"+path+"') threw an exception: " + e.message);
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
          if (FS.trackingDelegate['onDeletePath']) FS.trackingDelegate['onDeletePath'](path);
        } catch(e) {
          console.log("FS.trackingDelegate['onDeletePath']('"+path+"') threw an exception: " + e.message);
        }
      },readlink:function (path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!link.node_ops.readlink) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        return PATH.resolve(FS.getPath(link.parent), link.node_ops.readlink(link));
      },stat:function (path, dontFollow) {
        var lookup = FS.lookupPath(path, { follow: !dontFollow });
        var node = lookup.node;
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        if (!node.node_ops.getattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        return node.node_ops.getattr(node);
      },lstat:function (path) {
        return FS.stat(path, true);
      },chmod:function (path, mode, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          mode: (mode & 4095) | (node.mode & ~4095),
          timestamp: Date.now()
        });
      },lchmod:function (path, mode) {
        FS.chmod(path, mode, true);
      },fchmod:function (fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chmod(stream.node, mode);
      },chown:function (path, uid, gid, dontFollow) {
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: !dontFollow });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        node.node_ops.setattr(node, {
          timestamp: Date.now()
          // we ignore the uid / gid for now
        });
      },lchown:function (path, uid, gid) {
        FS.chown(path, uid, gid, true);
      },fchown:function (fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        FS.chown(stream.node, uid, gid);
      },truncate:function (path, len) {
        if (len < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var node;
        if (typeof path === 'string') {
          var lookup = FS.lookupPath(path, { follow: true });
          node = lookup.node;
        } else {
          node = path;
        }
        if (!node.node_ops.setattr) {
          throw new FS.ErrnoError(ERRNO_CODES.EPERM);
        }
        if (FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!FS.isFile(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var err = FS.nodePermissions(node, 'w');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        node.node_ops.setattr(node, {
          size: len,
          timestamp: Date.now()
        });
      },ftruncate:function (fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        FS.truncate(stream.node, len);
      },utime:function (path, atime, mtime) {
        var lookup = FS.lookupPath(path, { follow: true });
        var node = lookup.node;
        node.node_ops.setattr(node, {
          timestamp: Math.max(atime, mtime)
        });
      },open:function (path, flags, mode, fd_start, fd_end) {
        if (path === "") {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        flags = typeof flags === 'string' ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === 'undefined' ? 438 /* 0666 */ : mode;
        if ((flags & 64)) {
          mode = (mode & 4095) | 32768;
        } else {
          mode = 0;
        }
        var node;
        if (typeof path === 'object') {
          node = path;
        } else {
          path = PATH.normalize(path);
          try {
            var lookup = FS.lookupPath(path, {
              follow: !(flags & 131072)
            });
            node = lookup.node;
          } catch (e) {
            // ignore
          }
        }
        // perhaps we need to create the node
        var created = false;
        if ((flags & 64)) {
          if (node) {
            // if O_CREAT and O_EXCL are set, error out if the node already exists
            if ((flags & 128)) {
              throw new FS.ErrnoError(ERRNO_CODES.EEXIST);
            }
          } else {
            // node doesn't exist, try to create it
            node = FS.mknod(path, mode, 0);
            created = true;
          }
        }
        if (!node) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOENT);
        }
        // can't truncate a device
        if (FS.isChrdev(node.mode)) {
          flags &= ~512;
        }
        // if asked only for a directory, then this must be one
        if ((flags & 65536) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        // check permissions, if this is not a file we just created now (it is ok to
        // create and write to a file with read-only permissions; it is read-only
        // for later use)
        if (!created) {
          var err = FS.mayOpen(node, flags);
          if (err) {
            throw new FS.ErrnoError(err);
          }
        }
        // do truncation if necessary
        if ((flags & 512)) {
          FS.truncate(node, 0);
        }
        // we've already handled these, don't pass down to the underlying vfs
        flags &= ~(128 | 512);
  
        // register the stream with the filesystem
        var stream = FS.createStream({
          node: node,
          path: FS.getPath(node),  // we want the absolute path to the node
          flags: flags,
          seekable: true,
          position: 0,
          stream_ops: node.stream_ops,
          // used by the file family libc calls (fopen, fwrite, ferror, etc.)
          ungotten: [],
          error: false
        }, fd_start, fd_end);
        // call the new stream's open function
        if (stream.stream_ops.open) {
          stream.stream_ops.open(stream);
        }
        if (Module['logReadFiles'] && !(flags & 1)) {
          if (!FS.readFiles) FS.readFiles = {};
          if (!(path in FS.readFiles)) {
            FS.readFiles[path] = 1;
            Module['printErr']('read file: ' + path);
          }
        }
        try {
          if (FS.trackingDelegate['onOpenFile']) {
            var trackingFlags = 0;
            if ((flags & 2097155) !== 1) {
              trackingFlags |= FS.tracking.openFlags.READ;
            }
            if ((flags & 2097155) !== 0) {
              trackingFlags |= FS.tracking.openFlags.WRITE;
            }
            FS.trackingDelegate['onOpenFile'](path, trackingFlags);
          }
        } catch(e) {
          console.log("FS.trackingDelegate['onOpenFile']('"+path+"', flags) threw an exception: " + e.message);
        }
        return stream;
      },close:function (stream) {
        if (stream.getdents) stream.getdents = null; // free readdir state
        try {
          if (stream.stream_ops.close) {
            stream.stream_ops.close(stream);
          }
        } catch (e) {
          throw e;
        } finally {
          FS.closeStream(stream.fd);
        }
      },llseek:function (stream, offset, whence) {
        if (!stream.seekable || !stream.stream_ops.llseek) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position;
      },read:function (stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.read) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead;
      },write:function (stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (FS.isDir(stream.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.EISDIR);
        }
        if (!stream.stream_ops.write) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if (stream.flags & 1024) {
          // seek to the end before writing in append mode
          FS.llseek(stream, 0, 2);
        }
        var seeking = true;
        if (typeof position === 'undefined') {
          position = stream.position;
          seeking = false;
        } else if (!stream.seekable) {
          throw new FS.ErrnoError(ERRNO_CODES.ESPIPE);
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
          if (stream.path && FS.trackingDelegate['onWriteToFile']) FS.trackingDelegate['onWriteToFile'](stream.path);
        } catch(e) {
          console.log("FS.trackingDelegate['onWriteToFile']('"+path+"') threw an exception: " + e.message);
        }
        return bytesWritten;
      },allocate:function (stream, offset, length) {
        if (offset < 0 || length <= 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EINVAL);
        }
        if ((stream.flags & 2097155) === 0) {
          throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        if (!stream.stream_ops.allocate) {
          throw new FS.ErrnoError(ERRNO_CODES.EOPNOTSUPP);
        }
        stream.stream_ops.allocate(stream, offset, length);
      },mmap:function (stream, buffer, offset, length, position, prot, flags) {
        // TODO if PROT is PROT_WRITE, make sure we have write access
        if ((stream.flags & 2097155) === 1) {
          throw new FS.ErrnoError(ERRNO_CODES.EACCES);
        }
        if (!stream.stream_ops.mmap) {
          throw new FS.ErrnoError(ERRNO_CODES.ENODEV);
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags);
      },msync:function (stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
          return 0;
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags);
      },munmap:function (stream) {
        return 0;
      },ioctl:function (stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTTY);
        }
        return stream.stream_ops.ioctl(stream, cmd, arg);
      },readFile:function (path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'r';
        opts.encoding = opts.encoding || 'binary';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === 'utf8') {
          ret = UTF8ArrayToString(buf, 0);
        } else if (opts.encoding === 'binary') {
          ret = buf;
        }
        FS.close(stream);
        return ret;
      },writeFile:function (path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || 'w';
        opts.encoding = opts.encoding || 'utf8';
        if (opts.encoding !== 'utf8' && opts.encoding !== 'binary') {
          throw new Error('Invalid encoding type "' + opts.encoding + '"');
        }
        var stream = FS.open(path, opts.flags, opts.mode);
        if (opts.encoding === 'utf8') {
          var buf = new Uint8Array(lengthBytesUTF8(data)+1);
          var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
          FS.write(stream, buf, 0, actualNumBytes, 0, opts.canOwn);
        } else if (opts.encoding === 'binary') {
          FS.write(stream, data, 0, data.length, 0, opts.canOwn);
        }
        FS.close(stream);
      },cwd:function () {
        return FS.currentPath;
      },chdir:function (path) {
        var lookup = FS.lookupPath(path, { follow: true });
        if (!FS.isDir(lookup.node.mode)) {
          throw new FS.ErrnoError(ERRNO_CODES.ENOTDIR);
        }
        var err = FS.nodePermissions(lookup.node, 'x');
        if (err) {
          throw new FS.ErrnoError(err);
        }
        FS.currentPath = lookup.path;
      },createDefaultDirectories:function () {
        FS.mkdir('/tmp');
        FS.mkdir('/home');
        FS.mkdir('/home/web_user');
      },createDefaultDevices:function () {
        // create /dev
        FS.mkdir('/dev');
        // setup /dev/null
        FS.registerDevice(FS.makedev(1, 3), {
          read: function() { return 0; },
          write: function(stream, buffer, offset, length, pos) { return length; }
        });
        FS.mkdev('/dev/null', FS.makedev(1, 3));
        // setup /dev/tty and /dev/tty1
        // stderr needs to print output using Module['printErr']
        // so we register a second tty just for it.
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev('/dev/tty', FS.makedev(5, 0));
        FS.mkdev('/dev/tty1', FS.makedev(6, 0));
        // setup /dev/[u]random
        var random_device;
        if (typeof crypto !== 'undefined') {
          // for modern web browsers
          var randomBuffer = new Uint8Array(1);
          random_device = function() { crypto.getRandomValues(randomBuffer); return randomBuffer[0]; };
        } else if (ENVIRONMENT_IS_NODE) {
          // for nodejs
          random_device = function() { return require('crypto').randomBytes(1)[0]; };
        } else {
          // default for ES5 platforms
          random_device = function() { return (Math.random()*256)|0; };
        }
        FS.createDevice('/dev', 'random', random_device);
        FS.createDevice('/dev', 'urandom', random_device);
        // we're not going to emulate the actual shm device,
        // just create the tmp dirs that reside in it commonly
        FS.mkdir('/dev/shm');
        FS.mkdir('/dev/shm/tmp');
      },createSpecialDirectories:function () {
        // create /proc/self/fd which allows /proc/self/fd/6 => readlink gives the name of the stream for fd 6 (see test_unistd_ttyname)
        FS.mkdir('/proc');
        FS.mkdir('/proc/self');
        FS.mkdir('/proc/self/fd');
        FS.mount({
          mount: function() {
            var node = FS.createNode('/proc/self', 'fd', 16384 | 0777, 73);
            node.node_ops = {
              lookup: function(parent, name) {
                var fd = +name;
                var stream = FS.getStream(fd);
                if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
                var ret = {
                  parent: null,
                  mount: { mountpoint: 'fake' },
                  node_ops: { readlink: function() { return stream.path } }
                };
                ret.parent = ret; // make it look like a simple root node
                return ret;
              }
            };
            return node;
          }
        }, {}, '/proc/self/fd');
      },createStandardStreams:function () {
        // TODO deprecate the old functionality of a single
        // input / output callback and that utilizes FS.createDevice
        // and instead require a unique set of stream ops
  
        // by default, we symlink the standard streams to the
        // default tty devices. however, if the standard streams
        // have been overwritten we create a unique device for
        // them instead.
        if (Module['stdin']) {
          FS.createDevice('/dev', 'stdin', Module['stdin']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdin');
        }
        if (Module['stdout']) {
          FS.createDevice('/dev', 'stdout', null, Module['stdout']);
        } else {
          FS.symlink('/dev/tty', '/dev/stdout');
        }
        if (Module['stderr']) {
          FS.createDevice('/dev', 'stderr', null, Module['stderr']);
        } else {
          FS.symlink('/dev/tty1', '/dev/stderr');
        }
  
        // open default streams for the stdin, stdout and stderr devices
        var stdin = FS.open('/dev/stdin', 'r');
        assert(stdin.fd === 0, 'invalid handle for stdin (' + stdin.fd + ')');
  
        var stdout = FS.open('/dev/stdout', 'w');
        assert(stdout.fd === 1, 'invalid handle for stdout (' + stdout.fd + ')');
  
        var stderr = FS.open('/dev/stderr', 'w');
        assert(stderr.fd === 2, 'invalid handle for stderr (' + stderr.fd + ')');
      },ensureErrnoError:function () {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
          //Module.printErr(stackTrace()); // useful for debugging
          this.node = node;
          this.setErrno = function(errno) {
            this.errno = errno;
            for (var key in ERRNO_CODES) {
              if (ERRNO_CODES[key] === errno) {
                this.code = key;
                break;
              }
            }
          };
          this.setErrno(errno);
          this.message = ERRNO_MESSAGES[errno];
          if (this.stack) this.stack = demangleAll(this.stack);
        };
        FS.ErrnoError.prototype = new Error();
        FS.ErrnoError.prototype.constructor = FS.ErrnoError;
        // Some errors may happen quite a bit, to avoid overhead we reuse them (and suffer a lack of stack info)
        [ERRNO_CODES.ENOENT].forEach(function(code) {
          FS.genericErrors[code] = new FS.ErrnoError(code);
          FS.genericErrors[code].stack = '<generic error, no stack>';
        });
      },staticInit:function () {
        FS.ensureErrnoError();
  
        FS.nameTable = new Array(4096);
  
        FS.mount(MEMFS, {}, '/');
  
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
      },init:function (input, output, error) {
        assert(!FS.init.initialized, 'FS.init was previously called. If you want to initialize later with custom parameters, remove any earlier calls (note that one is automatically added to the generated code)');
        FS.init.initialized = true;
  
        FS.ensureErrnoError();
  
        // Allow Module.stdin etc. to provide defaults, if none explicitly passed to us here
        Module['stdin'] = input || Module['stdin'];
        Module['stdout'] = output || Module['stdout'];
        Module['stderr'] = error || Module['stderr'];
  
        FS.createStandardStreams();
      },quit:function () {
        FS.init.initialized = false;
        // force-flush all streams, so we get musl std streams printed out
        var fflush = Module['_fflush'];
        if (fflush) fflush(0);
        // close all of our streams
        for (var i = 0; i < FS.streams.length; i++) {
          var stream = FS.streams[i];
          if (!stream) {
            continue;
          }
          FS.close(stream);
        }
      },getMode:function (canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode;
      },joinPath:function (parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == '/') path = path.substr(1);
        return path;
      },absolutePath:function (relative, base) {
        return PATH.resolve(base, relative);
      },standardizePath:function (path) {
        return PATH.normalize(path);
      },findObject:function (path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
          return ret.object;
        } else {
          ___setErrNo(ret.error);
          return null;
        }
      },analyzePath:function (path, dontResolveLastLink) {
        // operate from within the context of the symlink's target
        try {
          var lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          path = lookup.path;
        } catch (e) {
        }
        var ret = {
          isRoot: false, exists: false, error: 0, name: null, path: null, object: null,
          parentExists: false, parentPath: null, parentObject: null
        };
        try {
          var lookup = FS.lookupPath(path, { parent: true });
          ret.parentExists = true;
          ret.parentPath = lookup.path;
          ret.parentObject = lookup.node;
          ret.name = PATH.basename(path);
          lookup = FS.lookupPath(path, { follow: !dontResolveLastLink });
          ret.exists = true;
          ret.path = lookup.path;
          ret.object = lookup.node;
          ret.name = lookup.node.name;
          ret.isRoot = lookup.path === '/';
        } catch (e) {
          ret.error = e.errno;
        };
        return ret;
      },createFolder:function (parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode);
      },createPath:function (parent, path, canRead, canWrite) {
        parent = typeof parent === 'string' ? parent : FS.getPath(parent);
        var parts = path.split('/').reverse();
        while (parts.length) {
          var part = parts.pop();
          if (!part) continue;
          var current = PATH.join2(parent, part);
          try {
            FS.mkdir(current);
          } catch (e) {
            // ignore EEXIST
          }
          parent = current;
        }
        return current;
      },createFile:function (parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode);
      },createDataFile:function (parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
          if (typeof data === 'string') {
            var arr = new Array(data.length);
            for (var i = 0, len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
            data = arr;
          }
          // make sure we can write to the file
          FS.chmod(node, mode | 146);
          var stream = FS.open(node, 'w');
          FS.write(stream, data, 0, data.length, 0, canOwn);
          FS.close(stream);
          FS.chmod(node, mode);
        }
        return node;
      },createDevice:function (parent, name, input, output) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        var mode = FS.getMode(!!input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        // Create a fake device that a set of stream ops to emulate
        // the old behavior.
        FS.registerDevice(dev, {
          open: function(stream) {
            stream.seekable = false;
          },
          close: function(stream) {
            // flush any pending line data
            if (output && output.buffer && output.buffer.length) {
              output(10);
            }
          },
          read: function(stream, buffer, offset, length, pos /* ignored */) {
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
              var result;
              try {
                result = input();
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
              if (result === undefined && bytesRead === 0) {
                throw new FS.ErrnoError(ERRNO_CODES.EAGAIN);
              }
              if (result === null || result === undefined) break;
              bytesRead++;
              buffer[offset+i] = result;
            }
            if (bytesRead) {
              stream.node.timestamp = Date.now();
            }
            return bytesRead;
          },
          write: function(stream, buffer, offset, length, pos) {
            for (var i = 0; i < length; i++) {
              try {
                output(buffer[offset+i]);
              } catch (e) {
                throw new FS.ErrnoError(ERRNO_CODES.EIO);
              }
            }
            if (length) {
              stream.node.timestamp = Date.now();
            }
            return i;
          }
        });
        return FS.mkdev(path, mode, dev);
      },createLink:function (parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === 'string' ? parent : FS.getPath(parent), name);
        return FS.symlink(target, path);
      },forceLoadFile:function (obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== 'undefined') {
          throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.");
        } else if (Module['read']) {
          // Command-line.
          try {
            // WARNING: Can't read binary files in V8's d8 or tracemonkey's js, as
            //          read() will try to parse UTF8.
            obj.contents = intArrayFromString(Module['read'](obj.url), true);
            obj.usedBytes = obj.contents.length;
          } catch (e) {
            success = false;
          }
        } else {
          throw new Error('Cannot load without read() or XMLHttpRequest.');
        }
        if (!success) ___setErrNo(ERRNO_CODES.EIO);
        return success;
      },createLazyFile:function (parent, name, url, canRead, canWrite) {
        // Lazy chunked Uint8Array (implements get and length from Uint8Array). Actual getting is abstracted away for eventual reuse.
        function LazyUint8Array() {
          this.lengthKnown = false;
          this.chunks = []; // Loaded chunks. Index is the chunk number
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
          if (idx > this.length-1 || idx < 0) {
            return undefined;
          }
          var chunkOffset = idx % this.chunkSize;
          var chunkNum = (idx / this.chunkSize)|0;
          return this.getter(chunkNum)[chunkOffset];
        }
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
          this.getter = getter;
        }
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
          // Find length
          var xhr = new XMLHttpRequest();
          xhr.open('HEAD', url, false);
          xhr.send(null);
          if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
          var datalength = Number(xhr.getResponseHeader("Content-length"));
          var header;
          var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
          var chunkSize = 1024*1024; // Chunk size in bytes
  
          if (!hasByteServing) chunkSize = datalength;
  
          // Function to get a range from the remote URL.
          var doXHR = (function(from, to) {
            if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
            if (to > datalength-1) throw new Error("only " + datalength + " bytes available! programmer error!");
  
            // TODO: Use mozResponseArrayBuffer, responseStream, etc. if available.
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, false);
            if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
  
            // Some hints to the browser that we want binary data.
            if (typeof Uint8Array != 'undefined') xhr.responseType = 'arraybuffer';
            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=x-user-defined');
            }
  
            xhr.send(null);
            if (!(xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            if (xhr.response !== undefined) {
              return new Uint8Array(xhr.response || []);
            } else {
              return intArrayFromString(xhr.responseText || '', true);
            }
          });
          var lazyArray = this;
          lazyArray.setDataGetter(function(chunkNum) {
            var start = chunkNum * chunkSize;
            var end = (chunkNum+1) * chunkSize - 1; // including this byte
            end = Math.min(end, datalength-1); // if datalength-1 is selected, this is the last block
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") {
              lazyArray.chunks[chunkNum] = doXHR(start, end);
            }
            if (typeof(lazyArray.chunks[chunkNum]) === "undefined") throw new Error("doXHR failed!");
            return lazyArray.chunks[chunkNum];
          });
  
          this._length = datalength;
          this._chunkSize = chunkSize;
          this.lengthKnown = true;
        }
        if (typeof XMLHttpRequest !== 'undefined') {
          if (!ENVIRONMENT_IS_WORKER) throw 'Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc';
          var lazyArray = new LazyUint8Array();
          Object.defineProperty(lazyArray, "length", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._length;
              }
          });
          Object.defineProperty(lazyArray, "chunkSize", {
              get: function() {
                  if(!this.lengthKnown) {
                      this.cacheLength();
                  }
                  return this._chunkSize;
              }
          });
  
          var properties = { isDevice: false, contents: lazyArray };
        } else {
          var properties = { isDevice: false, url: url };
        }
  
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        // This is a total hack, but I want to get this lazy file code out of the
        // core of MEMFS. If we want to keep this lazy file concept I feel it should
        // be its own thin LAZYFS proxying calls to MEMFS.
        if (properties.contents) {
          node.contents = properties.contents;
        } else if (properties.url) {
          node.contents = null;
          node.url = properties.url;
        }
        // Add a function that defers querying the file size until it is asked the first time.
        Object.defineProperty(node, "usedBytes", {
            get: function() { return this.contents.length; }
        });
        // override each stream op with one that tries to force load the lazy file first
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
          var fn = node.stream_ops[key];
          stream_ops[key] = function forceLoadLazyFile() {
            if (!FS.forceLoadFile(node)) {
              throw new FS.ErrnoError(ERRNO_CODES.EIO);
            }
            return fn.apply(null, arguments);
          };
        });
        // use a custom read function
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
          if (!FS.forceLoadFile(node)) {
            throw new FS.ErrnoError(ERRNO_CODES.EIO);
          }
          var contents = stream.node.contents;
          if (position >= contents.length)
            return 0;
          var size = Math.min(contents.length - position, length);
          assert(size >= 0);
          if (contents.slice) { // normal array
            for (var i = 0; i < size; i++) {
              buffer[offset + i] = contents[position + i];
            }
          } else {
            for (var i = 0; i < size; i++) { // LazyUint8Array from sync binary XHR
              buffer[offset + i] = contents.get(position + i);
            }
          }
          return size;
        };
        node.stream_ops = stream_ops;
        return node;
      },createPreloadedFile:function (parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        // TODO we should allow people to just pass in a complete filename instead
        // of parent and name being that we just join them anyways
        var fullname = name ? PATH.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency('cp ' + fullname); // might have several active requests for the same fullname
        function processData(byteArray) {
          function finish(byteArray) {
            if (preFinish) preFinish();
            if (!dontCreateFile) {
              FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn);
            }
            if (onload) onload();
            removeRunDependency(dep);
          }
          var handled = false;
          Module['preloadPlugins'].forEach(function(plugin) {
            if (handled) return;
            if (plugin['canHandle'](fullname)) {
              plugin['handle'](byteArray, fullname, finish, function() {
                if (onerror) onerror();
                removeRunDependency(dep);
              });
              handled = true;
            }
          });
          if (!handled) finish(byteArray);
        }
        addRunDependency(dep);
        if (typeof url == 'string') {
          Browser.asyncLoad(url, function(byteArray) {
            processData(byteArray);
          }, onerror);
        } else {
          processData(url);
        }
      },indexedDB:function () {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
      },DB_NAME:function () {
        return 'EM_FS_' + window.location.pathname;
      },DB_VERSION:20,DB_STORE_NAME:"FILE_DATA",saveFilesToDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
          console.log('creating db');
          var db = openRequest.result;
          db.createObjectStore(FS.DB_STORE_NAME);
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          var transaction = db.transaction([FS.DB_STORE_NAME], 'readwrite');
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var putRequest = files.put(FS.analyzePath(path).object.contents, path);
            putRequest.onsuccess = function putRequest_onsuccess() { ok++; if (ok + fail == total) finish() };
            putRequest.onerror = function putRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      },loadFilesFromDB:function (paths, onload, onerror) {
        onload = onload || function(){};
        onerror = onerror || function(){};
        var indexedDB = FS.indexedDB();
        try {
          var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION);
        } catch (e) {
          return onerror(e);
        }
        openRequest.onupgradeneeded = onerror; // no database to load from
        openRequest.onsuccess = function openRequest_onsuccess() {
          var db = openRequest.result;
          try {
            var transaction = db.transaction([FS.DB_STORE_NAME], 'readonly');
          } catch(e) {
            onerror(e);
            return;
          }
          var files = transaction.objectStore(FS.DB_STORE_NAME);
          var ok = 0, fail = 0, total = paths.length;
          function finish() {
            if (fail == 0) onload(); else onerror();
          }
          paths.forEach(function(path) {
            var getRequest = files.get(path);
            getRequest.onsuccess = function getRequest_onsuccess() {
              if (FS.analyzePath(path).exists) {
                FS.unlink(path);
              }
              FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
              ok++;
              if (ok + fail == total) finish();
            };
            getRequest.onerror = function getRequest_onerror() { fail++; if (ok + fail == total) finish() };
          });
          transaction.onerror = onerror;
        };
        openRequest.onerror = onerror;
      }};var PATH={splitPath:function (filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1);
      },normalizeArray:function (parts, allowAboveRoot) {
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
          var last = parts[i];
          if (last === '.') {
            parts.splice(i, 1);
          } else if (last === '..') {
            parts.splice(i, 1);
            up++;
          } else if (up) {
            parts.splice(i, 1);
            up--;
          }
        }
        // if the path is allowed to go above the root, restore leading ..s
        if (allowAboveRoot) {
          for (; up--; up) {
            parts.unshift('..');
          }
        }
        return parts;
      },normalize:function (path) {
        var isAbsolute = path.charAt(0) === '/',
            trailingSlash = path.substr(-1) === '/';
        // Normalize the path
        path = PATH.normalizeArray(path.split('/').filter(function(p) {
          return !!p;
        }), !isAbsolute).join('/');
        if (!path && !isAbsolute) {
          path = '.';
        }
        if (path && trailingSlash) {
          path += '/';
        }
        return (isAbsolute ? '/' : '') + path;
      },dirname:function (path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
          // No dirname whatsoever
          return '.';
        }
        if (dir) {
          // It has a dirname, strip trailing slash
          dir = dir.substr(0, dir.length - 1);
        }
        return root + dir;
      },basename:function (path) {
        // EMSCRIPTEN return '/'' for '/', not an empty string
        if (path === '/') return '/';
        var lastSlash = path.lastIndexOf('/');
        if (lastSlash === -1) return path;
        return path.substr(lastSlash+1);
      },extname:function (path) {
        return PATH.splitPath(path)[3];
      },join:function () {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join('/'));
      },join2:function (l, r) {
        return PATH.normalize(l + '/' + r);
      },resolve:function () {
        var resolvedPath = '',
          resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
          var path = (i >= 0) ? arguments[i] : FS.cwd();
          // Skip empty and invalid entries
          if (typeof path !== 'string') {
            throw new TypeError('Arguments to path.resolve must be strings');
          } else if (!path) {
            return ''; // an invalid portion invalidates the whole thing
          }
          resolvedPath = path + '/' + resolvedPath;
          resolvedAbsolute = path.charAt(0) === '/';
        }
        // At this point the path should be resolved to a full absolute path, but
        // handle relative paths to be safe (might happen when process.cwd() fails)
        resolvedPath = PATH.normalizeArray(resolvedPath.split('/').filter(function(p) {
          return !!p;
        }), !resolvedAbsolute).join('/');
        return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
      },relative:function (from, to) {
        from = PATH.resolve(from).substr(1);
        to = PATH.resolve(to).substr(1);
        function trim(arr) {
          var start = 0;
          for (; start < arr.length; start++) {
            if (arr[start] !== '') break;
          }
          var end = arr.length - 1;
          for (; end >= 0; end--) {
            if (arr[end] !== '') break;
          }
          if (start > end) return [];
          return arr.slice(start, end - start + 1);
        }
        var fromParts = trim(from.split('/'));
        var toParts = trim(to.split('/'));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
          if (fromParts[i] !== toParts[i]) {
            samePartsLength = i;
            break;
          }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
          outputParts.push('..');
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join('/');
      }};
  
  
  function _emscripten_set_main_loop_timing(mode, value) {
      Browser.mainLoop.timingMode = mode;
      Browser.mainLoop.timingValue = value;
  
      if (!Browser.mainLoop.func) {
        console.error('emscripten_set_main_loop_timing: Cannot set timing mode for main loop since a main loop does not exist! Call emscripten_set_main_loop first to set one up.');
        return 1; // Return non-zero on failure, can't set timing mode when there is no main loop.
      }
  
      if (mode == 0 /*EM_TIMING_SETTIMEOUT*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          setTimeout(Browser.mainLoop.runner, value); // doing this each time means that on exception, we stop
        };
        Browser.mainLoop.method = 'timeout';
      } else if (mode == 1 /*EM_TIMING_RAF*/) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler() {
          Browser.requestAnimationFrame(Browser.mainLoop.runner);
        };
        Browser.mainLoop.method = 'rAF';
      }
      return 0;
    }function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
      Module['noExitRuntime'] = true;
  
      assert(!Browser.mainLoop.func, 'emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.');
  
      Browser.mainLoop.func = func;
      Browser.mainLoop.arg = arg;
  
      var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
  
      Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
          var start = Date.now();
          var blocker = Browser.mainLoop.queue.shift();
          blocker.func(blocker.arg);
          if (Browser.mainLoop.remainingBlockers) {
            var remaining = Browser.mainLoop.remainingBlockers;
            var next = remaining%1 == 0 ? remaining-1 : Math.floor(remaining);
            if (blocker.counted) {
              Browser.mainLoop.remainingBlockers = next;
            } else {
              // not counted, but move the progress along a tiny bit
              next = next + 0.5; // do not steal all the next one's progress
              Browser.mainLoop.remainingBlockers = (8*remaining + next)/9;
            }
          }
          console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + ' ms'); //, left: ' + Browser.mainLoop.remainingBlockers);
          Browser.mainLoop.updateStatus();
          setTimeout(Browser.mainLoop.runner, 0);
          return;
        }
  
        // catch pauses from non-main loop sources
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Implement very basic swap interval control
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1/*EM_TIMING_RAF*/ && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
          // Not the scheduled time to render this frame - skip.
          Browser.mainLoop.scheduler();
          return;
        }
  
        // Signal GL rendering layer that processing of a new frame is about to start. This helps it optimize
        // VBO double-buffering and reduce GPU stalls.
  
        if (Browser.mainLoop.method === 'timeout' && Module.ctx) {
          Module.printErr('Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!');
          Browser.mainLoop.method = ''; // just warn once per call to set main loop
        }
  
        Browser.mainLoop.runIter(function() {
          if (typeof arg !== 'undefined') {
            Runtime.dynCall('vi', func, [arg]);
          } else {
            Runtime.dynCall('v', func);
          }
        });
  
        // catch pauses from the main loop itself
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
  
        // Queue new audio data. This is important to be right after the main loop invocation, so that we will immediately be able
        // to queue the newest produced audio samples.
        // TODO: Consider adding pre- and post- rAF callbacks so that GL.newRenderingFrameStarted() and SDL.audio.queueNewAudioData()
        //       do not need to be hardcoded into this function, but can be more generic.
        if (typeof SDL === 'object' && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
  
        Browser.mainLoop.scheduler();
      }
  
      if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0/*EM_TIMING_SETTIMEOUT*/, 1000.0 / fps);
        else _emscripten_set_main_loop_timing(1/*EM_TIMING_RAF*/, 1); // Do rAF by rendering each frame (no decimating)
  
        Browser.mainLoop.scheduler();
      }
  
      if (simulateInfiniteLoop) {
        throw 'SimulateInfiniteLoop';
      }
    }var Browser={mainLoop:{scheduler:null,method:"",currentlyRunningMainloop:0,func:null,arg:0,timingMode:0,timingValue:0,currentFrameNumber:0,queue:[],pause:function () {
          Browser.mainLoop.scheduler = null;
          Browser.mainLoop.currentlyRunningMainloop++; // Incrementing this signals the previous main loop that it's now become old, and it must return.
        },resume:function () {
          Browser.mainLoop.currentlyRunningMainloop++;
          var timingMode = Browser.mainLoop.timingMode;
          var timingValue = Browser.mainLoop.timingValue;
          var func = Browser.mainLoop.func;
          Browser.mainLoop.func = null;
          _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true /* do not set timing and call scheduler, we will do it on the next lines */);
          _emscripten_set_main_loop_timing(timingMode, timingValue);
          Browser.mainLoop.scheduler();
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        },runIter:function (func) {
          if (ABORT) return;
          if (Module['preMainLoop']) {
            var preRet = Module['preMainLoop']();
            if (preRet === false) {
              return; // |return false| skips a frame
            }
          }
          try {
            func();
          } catch (e) {
            if (e instanceof ExitStatus) {
              return;
            } else {
              if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
              throw e;
            }
          }
          if (Module['postMainLoop']) Module['postMainLoop']();
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
  
        if (Browser.initted) return;
        Browser.initted = true;
  
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === 'undefined') {
          console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
          Module.noImageDecoding = true;
        }
  
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
  
        var imagePlugin = {};
        imagePlugin['canHandle'] = function imagePlugin_canHandle(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function imagePlugin_handle(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          assert(typeof url == 'string', 'createObjectURL must return a url as a string');
          var img = new Image();
          img.onload = function img_onload() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function img_onerror(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
  
        var audioPlugin = {};
        audioPlugin['canHandle'] = function audioPlugin_canHandle(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function audioPlugin_handle(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            assert(typeof url == 'string', 'createObjectURL must return a url as a string');
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function audio_onerror(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
  
        // Canvas event setup
  
        var canvas = Module['canvas'];
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas ||
                                document['msPointerLockElement'] === canvas;
        }
        if (canvas) {
          // forced aspect ratio can be enabled by defining 'forcedAspectRatio' on Module
          // Module['forcedAspectRatio'] = 4 / 3;
          
          canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                      canvas['mozRequestPointerLock'] ||
                                      canvas['webkitRequestPointerLock'] ||
                                      canvas['msRequestPointerLock'] ||
                                      function(){};
          canvas.exitPointerLock = document['exitPointerLock'] ||
                                   document['mozExitPointerLock'] ||
                                   document['webkitExitPointerLock'] ||
                                   document['msExitPointerLock'] ||
                                   function(){}; // no-op if function does not exist
          canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
  
  
          document.addEventListener('pointerlockchange', pointerLockChange, false);
          document.addEventListener('mozpointerlockchange', pointerLockChange, false);
          document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
          document.addEventListener('mspointerlockchange', pointerLockChange, false);
  
          if (Module['elementPointerLock']) {
            canvas.addEventListener("click", function(ev) {
              if (!Browser.pointerLock && canvas.requestPointerLock) {
                canvas.requestPointerLock();
                ev.preventDefault();
              }
            }, false);
          }
        }
      },createContext:function (canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx; // no need to recreate GL context if it's already been created for this canvas.
  
        var ctx;
        var contextHandle;
        if (useWebGL) {
          // For GLES2/desktop GL compatibility, adjust a few defaults to be different to WebGL defaults, so that they align better with the desktop defaults.
          var contextAttributes = {
            antialias: false,
            alpha: false
          };
  
          if (webGLContextAttributes) {
            for (var attribute in webGLContextAttributes) {
              contextAttributes[attribute] = webGLContextAttributes[attribute];
            }
          }
  
          contextHandle = GL.createContext(canvas, contextAttributes);
          if (contextHandle) {
            ctx = GL.getContext(contextHandle).GLctx;
          }
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
        } else {
          ctx = canvas.getContext('2d');
        }
  
        if (!ctx) return null;
  
        if (setInModule) {
          if (!useWebGL) assert(typeof GLctx === 'undefined', 'cannot set in module if GLctx is used, but we are a non-GL context that would replace it');
  
          Module.ctx = ctx;
          if (useWebGL) GL.makeContextCurrent(contextHandle);
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === 'undefined') Browser.vrDevice = null;
  
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          var canvasContainer = canvas.parentNode;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement'] ||
               document['msFullScreenElement'] || document['msFullscreenElement'] ||
               document['webkitCurrentFullScreenElement']) === canvasContainer) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'] ||
                                      document['msExitFullscreen'] ||
                                      document['exitFullscreen'] ||
                                      function() {};
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else {
            
            // remove the full screen specific parent of the canvas again to restore the HTML structure from before going full screen
            canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
            canvasContainer.parentNode.removeChild(canvasContainer);
            
            if (Browser.resizeCanvas) Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
          Browser.updateCanvasDimensions(canvas);
        }
  
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
          document.addEventListener('MSFullscreenChange', fullScreenChange, false);
        }
  
        // create a new parent to ensure the canvas has no siblings. this allows browsers to optimize full screen performance when its parent is the full screen root
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
  
        // use parent of canvas as full screen root to allow aspect ratio correction (Firefox stretches the root to screen size)
        canvasContainer.requestFullScreen = canvasContainer['requestFullScreen'] ||
                                            canvasContainer['mozRequestFullScreen'] ||
                                            canvasContainer['msRequestFullscreen'] ||
                                           (canvasContainer['webkitRequestFullScreen'] ? function() { canvasContainer['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
  
        if (vrDevice) {
          canvasContainer.requestFullScreen({ vrDisplay: vrDevice });
        } else {
          canvasContainer.requestFullScreen();
        }
      },nextRAF:0,fakeRequestAnimationFrame:function (func) {
        // try to keep 60fps between calls to here
        var now = Date.now();
        if (Browser.nextRAF === 0) {
          Browser.nextRAF = now + 1000/60;
        } else {
          while (now + 2 >= Browser.nextRAF) { // fudge a little, to avoid timer jitter causing us to do lots of delay:0
            Browser.nextRAF += 1000/60;
          }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay);
      },requestAnimationFrame:function requestAnimationFrame(func) {
        if (typeof window === 'undefined') { // Provide fallback to setTimeout if window is undefined (e.g. in Node.js)
          Browser.fakeRequestAnimationFrame(func);
        } else {
          if (!window.requestAnimationFrame) {
            window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                           window['mozRequestAnimationFrame'] ||
                                           window['webkitRequestAnimationFrame'] ||
                                           window['msRequestAnimationFrame'] ||
                                           window['oRequestAnimationFrame'] ||
                                           Browser.fakeRequestAnimationFrame;
          }
          window.requestAnimationFrame(func);
        }
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },allowAsyncCallbacks:true,queuedAsyncCallbacks:[],pauseAsyncCallbacks:function () {
        Browser.allowAsyncCallbacks = false;
      },resumeAsyncCallbacks:function () { // marks future callbacks as ok to execute, and synchronously runs any remaining ones right now
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
          var callbacks = Browser.queuedAsyncCallbacks;
          Browser.queuedAsyncCallbacks = [];
          callbacks.forEach(function(func) {
            func();
          });
        }
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        });
      },safeSetTimeout:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setTimeout(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } else {
            Browser.queuedAsyncCallbacks.push(func);
          }
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        Module['noExitRuntime'] = true;
        return setInterval(function() {
          if (ABORT) return;
          if (Browser.allowAsyncCallbacks) {
            func();
          } // drop it on the floor otherwise, next interval will kick in
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },getMouseWheelDelta:function (event) {
        var delta = 0;
        switch (event.type) {
          case 'DOMMouseScroll': 
            delta = event.detail;
            break;
          case 'mousewheel': 
            delta = event.wheelDelta;
            break;
          case 'wheel': 
            delta = event['deltaY'];
            break;
          default:
            throw 'unrecognized mouse wheel event: ' + event.type;
        }
        return delta;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,touches:{},lastTouches:{},calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
  
          // Neither .scrollX or .pageXOffset are defined in a spec, but
          // we prefer .scrollX because it is currently in a spec draft.
          // (see: http://www.w3.org/TR/2013/WD-cssom-view-20131217/)
          var scrollX = ((typeof window.scrollX !== 'undefined') ? window.scrollX : window.pageXOffset);
          var scrollY = ((typeof window.scrollY !== 'undefined') ? window.scrollY : window.pageYOffset);
          // If this assert lands, it's likely because the browser doesn't support scrollX or pageXOffset
          // and we have no viable fallback.
          assert((typeof scrollX !== 'undefined') && (typeof scrollY !== 'undefined'), 'Unable to retrieve scroll position, mouse positions likely broken.');
  
          if (event.type === 'touchstart' || event.type === 'touchend' || event.type === 'touchmove') {
            var touch = event.touch;
            if (touch === undefined) {
              return; // the "touch" property is only defined in SDL
  
            }
            var adjustedX = touch.pageX - (scrollX + rect.left);
            var adjustedY = touch.pageY - (scrollY + rect.top);
  
            adjustedX = adjustedX * (cw / rect.width);
            adjustedY = adjustedY * (ch / rect.height);
  
            var coords = { x: adjustedX, y: adjustedY };
            
            if (event.type === 'touchstart') {
              Browser.lastTouches[touch.identifier] = coords;
              Browser.touches[touch.identifier] = coords;
            } else if (event.type === 'touchend' || event.type === 'touchmove') {
              var last = Browser.touches[touch.identifier];
              if (!last) last = coords;
              Browser.lastTouches[touch.identifier] = last;
              Browser.touches[touch.identifier] = coords;
            } 
            return;
          }
  
          var x = event.pageX - (scrollX + rect.left);
          var y = event.pageY - (scrollY + rect.top);
  
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
  
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function xhr_onload() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },updateCanvasDimensions:function (canvas, wNative, hNative) {
        if (wNative && hNative) {
          canvas.widthNative = wNative;
          canvas.heightNative = hNative;
        } else {
          wNative = canvas.widthNative;
          hNative = canvas.heightNative;
        }
        var w = wNative;
        var h = hNative;
        if (Module['forcedAspectRatio'] && Module['forcedAspectRatio'] > 0) {
          if (w/h < Module['forcedAspectRatio']) {
            w = Math.round(h * Module['forcedAspectRatio']);
          } else {
            h = Math.round(w / Module['forcedAspectRatio']);
          }
        }
        if (((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
             document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
             document['fullScreenElement'] || document['fullscreenElement'] ||
             document['msFullScreenElement'] || document['msFullscreenElement'] ||
             document['webkitCurrentFullScreenElement']) === canvas.parentNode) && (typeof screen != 'undefined')) {
           var factor = Math.min(screen.width / w, screen.height / h);
           w = Math.round(w * factor);
           h = Math.round(h * factor);
        }
        if (Browser.resizeCanvas) {
          if (canvas.width  != w) canvas.width  = w;
          if (canvas.height != h) canvas.height = h;
          if (typeof canvas.style != 'undefined') {
            canvas.style.removeProperty( "width");
            canvas.style.removeProperty("height");
          }
        } else {
          if (canvas.width  != wNative) canvas.width  = wNative;
          if (canvas.height != hNative) canvas.height = hNative;
          if (typeof canvas.style != 'undefined') {
            if (w != wNative || h != hNative) {
              canvas.style.setProperty( "width", w + "px", "important");
              canvas.style.setProperty("height", h + "px", "important");
            } else {
              canvas.style.removeProperty( "width");
              canvas.style.removeProperty("height");
            }
          }
        }
      },wgetRequests:{},nextWgetRequestHandle:0,getNextWgetRequestHandle:function () {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle;
      }};

  
  var SYSCALLS={DEFAULT_POLLMASK:5,mappings:{},umask:511,calculateAt:function (dirfd, path) {
        if (path[0] !== '/') {
          // relative path
          var dir;
          if (dirfd === -100) {
            dir = FS.cwd();
          } else {
            var dirstream = FS.getStream(dirfd);
            if (!dirstream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
            dir = dirstream.path;
          }
          path = PATH.join2(dir, path);
        }
        return path;
      },doStat:function (func, path, buf) {
        try {
          var stat = func(path);
        } catch (e) {
          if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
            // an error occurred while trying to look up the path; we should just report ENOTDIR
            return -ERRNO_CODES.ENOTDIR;
          }
          throw e;
        }
        HEAP32[((buf)>>2)]=stat.dev;
        HEAP32[(((buf)+(4))>>2)]=0;
        HEAP32[(((buf)+(8))>>2)]=stat.ino;
        HEAP32[(((buf)+(12))>>2)]=stat.mode;
        HEAP32[(((buf)+(16))>>2)]=stat.nlink;
        HEAP32[(((buf)+(20))>>2)]=stat.uid;
        HEAP32[(((buf)+(24))>>2)]=stat.gid;
        HEAP32[(((buf)+(28))>>2)]=stat.rdev;
        HEAP32[(((buf)+(32))>>2)]=0;
        HEAP32[(((buf)+(36))>>2)]=stat.size;
        HEAP32[(((buf)+(40))>>2)]=4096;
        HEAP32[(((buf)+(44))>>2)]=stat.blocks;
        HEAP32[(((buf)+(48))>>2)]=(stat.atime.getTime() / 1000)|0;
        HEAP32[(((buf)+(52))>>2)]=0;
        HEAP32[(((buf)+(56))>>2)]=(stat.mtime.getTime() / 1000)|0;
        HEAP32[(((buf)+(60))>>2)]=0;
        HEAP32[(((buf)+(64))>>2)]=(stat.ctime.getTime() / 1000)|0;
        HEAP32[(((buf)+(68))>>2)]=0;
        HEAP32[(((buf)+(72))>>2)]=stat.ino;
        return 0;
      },doMsync:function (addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.buffer, addr, len);
        FS.msync(stream, buffer, 0, len, flags);
      },doMkdir:function (path, mode) {
        // remove a trailing slash, if one - /a/b/ has basename of '', but
        // we want to create b in the context of this function
        path = PATH.normalize(path);
        if (path[path.length-1] === '/') path = path.substr(0, path.length-1);
        FS.mkdir(path, mode, 0);
        return 0;
      },doMknod:function (path, mode, dev) {
        // we don't want this in the JS API as it uses mknod to create all nodes.
        switch (mode & 61440) {
          case 32768:
          case 8192:
          case 24576:
          case 4096:
          case 49152:
            break;
          default: return -ERRNO_CODES.EINVAL;
        }
        FS.mknod(path, mode, dev);
        return 0;
      },doReadlink:function (path, buf, bufsize) {
        if (bufsize <= 0) return -ERRNO_CODES.EINVAL;
        var ret = FS.readlink(path);
        ret = ret.slice(0, Math.max(0, bufsize));
        writeStringToMemory(ret, buf, true);
        return ret.length;
      },doAccess:function (path, amode) {
        if (amode & ~7) {
          // need a valid mode
          return -ERRNO_CODES.EINVAL;
        }
        var node;
        var lookup = FS.lookupPath(path, { follow: true });
        node = lookup.node;
        var perms = '';
        if (amode & 4) perms += 'r';
        if (amode & 2) perms += 'w';
        if (amode & 1) perms += 'x';
        if (perms /* otherwise, they've just passed F_OK */ && FS.nodePermissions(node, perms)) {
          return -ERRNO_CODES.EACCES;
        }
        return 0;
      },doDup:function (path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd;
      },doReadv:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.read(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
          if (curr < len) break; // nothing more to read
        }
        return ret;
      },doWritev:function (stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
          var ptr = HEAP32[(((iov)+(i*8))>>2)];
          var len = HEAP32[(((iov)+(i*8 + 4))>>2)];
          var curr = FS.write(stream, HEAP8, ptr, len, offset);
          if (curr < 0) return -1;
          ret += curr;
        }
        return ret;
      },varargs:0,get:function (varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[(((SYSCALLS.varargs)-(4))>>2)];
        return ret;
      },getStr:function () {
        var ret = Pointer_stringify(SYSCALLS.get());
        return ret;
      },getStreamFromFD:function () {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return stream;
      },getSocketFromFD:function () {
        var socket = SOCKFS.getSocket(SYSCALLS.get());
        if (!socket) throw new FS.ErrnoError(ERRNO_CODES.EBADF);
        return socket;
      },getSocketAddress:function (allowNull) {
        var addrp = SYSCALLS.get(), addrlen = SYSCALLS.get();
        if (allowNull && addrp === 0) return null;
        var info = __read_sockaddr(addrp, addrlen);
        if (info.errno) throw new FS.ErrnoError(info.errno);
        info.addr = DNS.lookup_addr(info.addr) || info.addr;
        return info;
      },get64:function () {
        var low = SYSCALLS.get(), high = SYSCALLS.get();
        if (low >= 0) assert(high === 0);
        else assert(high === -1);
        return low;
      },getZero:function () {
        assert(SYSCALLS.get() === 0);
      }};function ___syscall54(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // ioctl
      var stream = SYSCALLS.getStreamFromFD(), op = SYSCALLS.get();
      switch (op) {
        case 21505: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0;
        }
        case 21506: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return 0; // no-op, not actually adjusting terminal settings
        }
        case 21519: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          var argp = SYSCALLS.get();
          HEAP32[((argp)>>2)]=0;
          return 0;
        }
        case 21520: {
          if (!stream.tty) return -ERRNO_CODES.ENOTTY;
          return -ERRNO_CODES.EINVAL; // not supported
        }
        case 21531: {
          var argp = SYSCALLS.get();
          return FS.ioctl(stream, op, argp);
        }
        default: abort('bad ioctl syscall ' + op);
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

   
  Module["_bitshift64Lshr"] = _bitshift64Lshr;

  var _BDtoIHigh=true;

  function _pthread_cleanup_push(routine, arg) {
      __ATEXIT__.push(function() { Runtime.dynCall('vi', routine, [arg]) })
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

  function _pthread_cleanup_pop() {
      assert(_pthread_cleanup_push.level == __ATEXIT__.length, 'cannot pop if something else added meanwhile!');
      __ATEXIT__.pop();
      _pthread_cleanup_push.level = __ATEXIT__.length;
    }

  function ___syscall3(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // read
      var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
      return FS.read(stream, HEAP8, buf, count);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall5(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // open
      var pathname = SYSCALLS.getStr(), flags = SYSCALLS.get(), mode = SYSCALLS.get() // optional TODO
      var stream = FS.open(pathname, flags, mode);
      return stream.fd;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall4(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // write
      var stream = SYSCALLS.getStreamFromFD(), buf = SYSCALLS.get(), count = SYSCALLS.get();
      return FS.write(stream, HEAP8, buf, count);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall6(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // close
      var stream = SYSCALLS.getStreamFromFD();
      FS.close(stream);
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) {
        var success = self.alloc(bytes);
        if (!success) return -1 >>> 0; // sbrk failure code
      }
      return ret;  // Previous break location.
    }

  
  var __sigalrm_handler=0;function _signal(sig, func) {
      if (sig == 14 /*SIGALRM*/) {
        __sigalrm_handler = func;
      } else {
        //Module.printErr('Calling stub instead of signal()');
      }
      return 0;
    }

  var _BItoD=true;

  function _time(ptr) {
      var ret = (Date.now()/1000)|0;
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret;
      }
      return ret;
    }

  function _pthread_self() {
      //FIXME: assumes only a single thread
      return 0;
    }

  function ___syscall140(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // llseek
      var stream = SYSCALLS.getStreamFromFD(), offset_high = SYSCALLS.get(), offset_low = SYSCALLS.get(), result = SYSCALLS.get(), whence = SYSCALLS.get();
      var offset = offset_low;
      assert(offset_high === 0);
      FS.llseek(stream, offset, whence);
      HEAP32[((result)>>2)]=stream.position;
      if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null; // reset readdir state
      return 0;
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall146(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // writev
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doWritev(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall221(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // fcntl64
      var stream = SYSCALLS.getStreamFromFD(), cmd = SYSCALLS.get();
      switch (cmd) {
        case 0: {
          var arg = SYSCALLS.get();
          if (arg < 0) {
            return -ERRNO_CODES.EINVAL;
          }
          var newStream;
          newStream = FS.open(stream.path, stream.flags, 0, arg);
          return newStream.fd;
        }
        case 1:
        case 2:
          return 0;  // FD_CLOEXEC makes no sense for a single process.
        case 3:
          return stream.flags;
        case 4: {
          var arg = SYSCALLS.get();
          stream.flags |= arg;
          return 0;
        }
        case 12:
        case 12: {
          var arg = SYSCALLS.get();
          var offset = 0;
          // We're always unlocked.
          HEAP16[(((arg)+(offset))>>1)]=2;
          return 0;
        }
        case 13:
        case 14:
        case 13:
        case 14:
          return 0; // Pretend that the locking is successful.
        case 16:
        case 8:
          return -ERRNO_CODES.EINVAL; // These are for sockets. We don't have them fully implemented yet.
        case 9:
          // musl trusts getown return values, due to a bug where they must be, as they overlap with errors. just return -1 here, so fnctl() returns that, and we set errno ourselves.
          ___setErrNo(ERRNO_CODES.EINVAL);
          return -1;
        default: {
          return -ERRNO_CODES.EINVAL;
        }
      }
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }

  function ___syscall145(which, varargs) {SYSCALLS.varargs = varargs;
  try {
   // readv
      var stream = SYSCALLS.getStreamFromFD(), iov = SYSCALLS.get(), iovcnt = SYSCALLS.get();
      return SYSCALLS.doReadv(stream, iov, iovcnt);
    } catch (e) {
    if (typeof FS === 'undefined' || !(e instanceof FS.ErrnoError)) abort(e);
    return -e.errno;
  }
  }
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) { Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice) };
  Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) { Browser.requestAnimationFrame(func) };
  Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) { Browser.setCanvasSize(width, height, noUpdates) };
  Module["pauseMainLoop"] = function Module_pauseMainLoop() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function Module_resumeMainLoop() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function Module_getUserMedia() { Browser.getUserMedia() }
  Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) { return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes) }
FS.staticInit();__ATINIT__.unshift(function() { if (!Module["noFSInit"] && !FS.init.initialized) FS.init() });__ATMAIN__.push(function() { FS.ignorePermissions = false });__ATEXIT__.push(function() { FS.quit() });Module["FS_createFolder"] = FS.createFolder;Module["FS_createPath"] = FS.createPath;Module["FS_createDataFile"] = FS.createDataFile;Module["FS_createPreloadedFile"] = FS.createPreloadedFile;Module["FS_createLazyFile"] = FS.createLazyFile;Module["FS_createLink"] = FS.createLink;Module["FS_createDevice"] = FS.createDevice;Module["FS_unlink"] = FS.unlink;
__ATINIT__.unshift(function() { TTY.init() });__ATEXIT__.push(function() { TTY.shutdown() });
if (ENVIRONMENT_IS_NODE) { var fs = require("fs"); var NODEJS_PATH = require("path"); NODEFS.staticInit(); }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);

staticSealed = true; // seal the static portion of memory

STACK_MAX = STACK_BASE + TOTAL_STACK;

DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);

assert(DYNAMIC_BASE < TOTAL_MEMORY, "TOTAL_MEMORY not big enough for stack");

 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);


function nullFunc_i(x) { Module["printErr"]("Invalid function pointer called with signature 'i'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_ii(x) { Module["printErr"]("Invalid function pointer called with signature 'ii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_iiii(x) { Module["printErr"]("Invalid function pointer called with signature 'iiii'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function nullFunc_vi(x) { Module["printErr"]("Invalid function pointer called with signature 'vi'. Perhaps this is an invalid value (e.g. caused by calling a virtual method on a NULL pointer)? Or calling a function with an incorrect type, which will fail? (it is worth building your source files with -Werror (warnings are errors), as warnings can indicate undefined behavior which can cause this)");  Module["printErr"]("Build with ASSERTIONS=2 for more info.");abort(x) }

function invoke_i(index) {
  try {
    return Module["dynCall_i"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_iiii(index,a1,a2,a3) {
  try {
    return Module["dynCall_iiii"](index,a1,a2,a3);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}

Module.asmGlobalArg = { "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array, "NaN": NaN, "Infinity": Infinity };
Module.asmLibraryArg = { "abort": abort, "assert": assert, "nullFunc_i": nullFunc_i, "nullFunc_ii": nullFunc_ii, "nullFunc_iiii": nullFunc_iiii, "nullFunc_vi": nullFunc_vi, "invoke_i": invoke_i, "invoke_ii": invoke_ii, "invoke_iiii": invoke_iiii, "invoke_vi": invoke_vi, "_pthread_cleanup_pop": _pthread_cleanup_pop, "___syscall221": ___syscall221, "___syscall6": ___syscall6, "_pthread_cleanup_push": _pthread_cleanup_push, "_signal": _signal, "_emscripten_set_main_loop_timing": _emscripten_set_main_loop_timing, "_sbrk": _sbrk, "_emscripten_memcpy_big": _emscripten_memcpy_big, "_sysconf": _sysconf, "___setErrNo": ___setErrNo, "_pthread_self": _pthread_self, "___syscall54": ___syscall54, "___unlock": ___unlock, "_emscripten_set_main_loop": _emscripten_set_main_loop, "___syscall3": ___syscall3, "__exit": __exit, "___lock": ___lock, "_abort": _abort, "___syscall5": ___syscall5, "___syscall4": ___syscall4, "_time": _time, "___syscall140": ___syscall140, "_exit": _exit, "___syscall145": ___syscall145, "___syscall146": ___syscall146, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8 };
// EMSCRIPTEN_START_ASM
var asm = (function(global, env, buffer) {
  'almost asm';
  
  var HEAP8 = new global.Int8Array(buffer);
  var HEAP16 = new global.Int16Array(buffer);
  var HEAP32 = new global.Int32Array(buffer);
  var HEAPU8 = new global.Uint8Array(buffer);
  var HEAPU16 = new global.Uint16Array(buffer);
  var HEAPU32 = new global.Uint32Array(buffer);
  var HEAPF32 = new global.Float32Array(buffer);
  var HEAPF64 = new global.Float64Array(buffer);


  var STACKTOP=env.STACKTOP|0;
  var STACK_MAX=env.STACK_MAX|0;
  var tempDoublePtr=env.tempDoublePtr|0;
  var ABORT=env.ABORT|0;
  var cttz_i8=env.cttz_i8|0;

  var __THREW__ = 0;
  var threwValue = 0;
  var setjmpId = 0;
  var undef = 0;
  var nan = global.NaN, inf = global.Infinity;
  var tempInt = 0, tempBigInt = 0, tempBigIntP = 0, tempBigIntS = 0, tempBigIntR = 0.0, tempBigIntI = 0, tempBigIntD = 0, tempValue = 0, tempDouble = 0.0;

  var tempRet0 = 0;
  var tempRet1 = 0;
  var tempRet2 = 0;
  var tempRet3 = 0;
  var tempRet4 = 0;
  var tempRet5 = 0;
  var tempRet6 = 0;
  var tempRet7 = 0;
  var tempRet8 = 0;
  var tempRet9 = 0;
  var Math_floor=global.Math.floor;
  var Math_abs=global.Math.abs;
  var Math_sqrt=global.Math.sqrt;
  var Math_pow=global.Math.pow;
  var Math_cos=global.Math.cos;
  var Math_sin=global.Math.sin;
  var Math_tan=global.Math.tan;
  var Math_acos=global.Math.acos;
  var Math_asin=global.Math.asin;
  var Math_atan=global.Math.atan;
  var Math_atan2=global.Math.atan2;
  var Math_exp=global.Math.exp;
  var Math_log=global.Math.log;
  var Math_ceil=global.Math.ceil;
  var Math_imul=global.Math.imul;
  var Math_min=global.Math.min;
  var Math_clz32=global.Math.clz32;
  var abort=env.abort;
  var assert=env.assert;
  var nullFunc_i=env.nullFunc_i;
  var nullFunc_ii=env.nullFunc_ii;
  var nullFunc_iiii=env.nullFunc_iiii;
  var nullFunc_vi=env.nullFunc_vi;
  var invoke_i=env.invoke_i;
  var invoke_ii=env.invoke_ii;
  var invoke_iiii=env.invoke_iiii;
  var invoke_vi=env.invoke_vi;
  var _pthread_cleanup_pop=env._pthread_cleanup_pop;
  var ___syscall221=env.___syscall221;
  var ___syscall6=env.___syscall6;
  var _pthread_cleanup_push=env._pthread_cleanup_push;
  var _signal=env._signal;
  var _emscripten_set_main_loop_timing=env._emscripten_set_main_loop_timing;
  var _sbrk=env._sbrk;
  var _emscripten_memcpy_big=env._emscripten_memcpy_big;
  var _sysconf=env._sysconf;
  var ___setErrNo=env.___setErrNo;
  var _pthread_self=env._pthread_self;
  var ___syscall54=env.___syscall54;
  var ___unlock=env.___unlock;
  var _emscripten_set_main_loop=env._emscripten_set_main_loop;
  var ___syscall3=env.___syscall3;
  var __exit=env.__exit;
  var ___lock=env.___lock;
  var _abort=env._abort;
  var ___syscall5=env.___syscall5;
  var ___syscall4=env.___syscall4;
  var _time=env._time;
  var ___syscall140=env.___syscall140;
  var _exit=env._exit;
  var ___syscall145=env.___syscall145;
  var ___syscall146=env.___syscall146;
  var tempFloat = 0.0;

// EMSCRIPTEN_START_FUNCS
function stackAlloc(size) {
  size = size|0;
  var ret = 0;
  ret = STACKTOP;
  STACKTOP = (STACKTOP + size)|0;
  STACKTOP = (STACKTOP + 15)&-16;
if ((STACKTOP|0) >= (STACK_MAX|0)) abort();

  return ret|0;
}
function stackSave() {
  return STACKTOP|0;
}
function stackRestore(top) {
  top = top|0;
  STACKTOP = top;
}
function establishStackSpace(stackBase, stackMax) {
  stackBase = stackBase|0;
  stackMax = stackMax|0;
  STACKTOP = stackBase;
  STACK_MAX = stackMax;
}

function setThrew(threw, value) {
  threw = threw|0;
  value = value|0;
  if ((__THREW__|0) == 0) {
    __THREW__ = threw;
    threwValue = value;
  }
}
function copyTempFloat(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
}
function copyTempDouble(ptr) {
  ptr = ptr|0;
  HEAP8[tempDoublePtr>>0] = HEAP8[ptr>>0];
  HEAP8[tempDoublePtr+1>>0] = HEAP8[ptr+1>>0];
  HEAP8[tempDoublePtr+2>>0] = HEAP8[ptr+2>>0];
  HEAP8[tempDoublePtr+3>>0] = HEAP8[ptr+3>>0];
  HEAP8[tempDoublePtr+4>>0] = HEAP8[ptr+4>>0];
  HEAP8[tempDoublePtr+5>>0] = HEAP8[ptr+5>>0];
  HEAP8[tempDoublePtr+6>>0] = HEAP8[ptr+6>>0];
  HEAP8[tempDoublePtr+7>>0] = HEAP8[ptr+7>>0];
}

function setTempRet0(value) {
  value = value|0;
  tempRet0 = value;
}
function getTempRet0() {
  return tempRet0|0;
}

function _yyparse() {
 var $$ = 0, $$lcssa = 0, $$phi$trans$insert = 0, $$pr = 0, $$pre = 0, $$pre31 = 0, $$sum = 0, $$sum11 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0;
 var $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0;
 var $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0;
 var $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0;
 var $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0;
 var $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0;
 var $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0;
 var $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0;
 var $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0;
 var $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0;
 var $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0;
 var $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0;
 var $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0;
 var $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0;
 var $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0, $360 = 0;
 var $361 = 0, $362 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0;
 var $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0;
 var $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0;
 var $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $or$cond7 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer100 = 0, $vararg_buffer103 = 0, $vararg_buffer107 = 0, $vararg_buffer109 = 0, $vararg_buffer112 = 0, $vararg_buffer118 = 0;
 var $vararg_buffer12 = 0, $vararg_buffer120 = 0, $vararg_buffer123 = 0, $vararg_buffer126 = 0, $vararg_buffer130 = 0, $vararg_buffer133 = 0, $vararg_buffer137 = 0, $vararg_buffer14 = 0, $vararg_buffer141 = 0, $vararg_buffer145 = 0, $vararg_buffer149 = 0, $vararg_buffer152 = 0, $vararg_buffer155 = 0, $vararg_buffer158 = 0, $vararg_buffer161 = 0, $vararg_buffer164 = 0, $vararg_buffer167 = 0, $vararg_buffer169 = 0, $vararg_buffer17 = 0, $vararg_buffer171 = 0;
 var $vararg_buffer173 = 0, $vararg_buffer175 = 0, $vararg_buffer20 = 0, $vararg_buffer24 = 0, $vararg_buffer27 = 0, $vararg_buffer29 = 0, $vararg_buffer3 = 0, $vararg_buffer33 = 0, $vararg_buffer37 = 0, $vararg_buffer41 = 0, $vararg_buffer44 = 0, $vararg_buffer47 = 0, $vararg_buffer5 = 0, $vararg_buffer50 = 0, $vararg_buffer53 = 0, $vararg_buffer57 = 0, $vararg_buffer59 = 0, $vararg_buffer61 = 0, $vararg_buffer65 = 0, $vararg_buffer7 = 0;
 var $vararg_buffer70 = 0, $vararg_buffer72 = 0, $vararg_buffer75 = 0, $vararg_buffer77 = 0, $vararg_buffer80 = 0, $vararg_buffer82 = 0, $vararg_buffer84 = 0, $vararg_buffer87 = 0, $vararg_buffer9 = 0, $vararg_buffer90 = 0, $vararg_buffer92 = 0, $vararg_buffer95 = 0, $vararg_buffer98 = 0, $vararg_ptr106 = 0, $vararg_ptr115 = 0, $vararg_ptr116 = 0, $vararg_ptr117 = 0, $vararg_ptr129 = 0, $vararg_ptr136 = 0, $vararg_ptr140 = 0;
 var $vararg_ptr144 = 0, $vararg_ptr148 = 0, $vararg_ptr23 = 0, $vararg_ptr32 = 0, $vararg_ptr36 = 0, $vararg_ptr40 = 0, $vararg_ptr56 = 0, $vararg_ptr64 = 0, $vararg_ptr68 = 0, $vararg_ptr69 = 0, $yyerrstatus$0 = 0, $yyerrstatus$1 = 0, $yyerrstatus$1$ = 0, $yyerrstatus$3 = 0, $yyn$0 = 0, $yyresult$0 = 0, $yyresult$032 = 0, $yyresult$033 = 0, $yyss$0 = 0, $yyss$0$lcssa = 0;
 var $yyss$1 = 0, $yyss$3 = 0, $yyss$334 = 0, $yyssa = 0, $yyssp$0 = 0, $yyssp$1 = 0, $yyssp$2 = 0, $yyssp$3 = 0, $yyssp$3$lcssa = 0, $yystacksize$0 = 0, $yystacksize$1 = 0, $yystate$0 = 0, $yystate$1 = 0, $yytoken$2 = 0, $yyval$sroa$0$0 = 0, $yyvs$0 = 0, $yyvs$1 = 0, $yyvsa = 0, $yyvsp$0 = 0, $yyvsp$1 = 0;
 var $yyvsp$2 = 0, $yyvsp$3 = 0, $yyvsp$3$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 1712|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer175 = sp + 496|0;
 $vararg_buffer173 = sp + 488|0;
 $vararg_buffer171 = sp + 480|0;
 $vararg_buffer169 = sp + 472|0;
 $vararg_buffer167 = sp + 464|0;
 $vararg_buffer164 = sp + 456|0;
 $vararg_buffer161 = sp + 448|0;
 $vararg_buffer158 = sp + 440|0;
 $vararg_buffer155 = sp + 432|0;
 $vararg_buffer152 = sp + 424|0;
 $vararg_buffer149 = sp + 416|0;
 $vararg_buffer145 = sp + 408|0;
 $vararg_buffer141 = sp + 400|0;
 $vararg_buffer137 = sp + 392|0;
 $vararg_buffer133 = sp + 384|0;
 $vararg_buffer130 = sp + 376|0;
 $vararg_buffer126 = sp + 368|0;
 $vararg_buffer123 = sp + 360|0;
 $vararg_buffer120 = sp + 352|0;
 $vararg_buffer118 = sp + 344|0;
 $vararg_buffer112 = sp + 328|0;
 $vararg_buffer109 = sp + 320|0;
 $vararg_buffer107 = sp + 312|0;
 $vararg_buffer103 = sp + 304|0;
 $vararg_buffer100 = sp + 296|0;
 $vararg_buffer98 = sp + 288|0;
 $vararg_buffer95 = sp + 280|0;
 $vararg_buffer92 = sp + 272|0;
 $vararg_buffer90 = sp + 264|0;
 $vararg_buffer87 = sp + 256|0;
 $vararg_buffer84 = sp + 248|0;
 $vararg_buffer82 = sp + 240|0;
 $vararg_buffer80 = sp + 232|0;
 $vararg_buffer77 = sp + 224|0;
 $vararg_buffer75 = sp + 216|0;
 $vararg_buffer72 = sp + 208|0;
 $vararg_buffer70 = sp + 200|0;
 $vararg_buffer65 = sp + 184|0;
 $vararg_buffer61 = sp + 176|0;
 $vararg_buffer59 = sp + 168|0;
 $vararg_buffer57 = sp + 160|0;
 $vararg_buffer53 = sp + 152|0;
 $vararg_buffer50 = sp + 144|0;
 $vararg_buffer47 = sp + 136|0;
 $vararg_buffer44 = sp + 128|0;
 $vararg_buffer41 = sp + 120|0;
 $vararg_buffer37 = sp + 112|0;
 $vararg_buffer33 = sp + 104|0;
 $vararg_buffer29 = sp + 96|0;
 $vararg_buffer27 = sp + 88|0;
 $vararg_buffer24 = sp + 80|0;
 $vararg_buffer20 = sp + 72|0;
 $vararg_buffer17 = sp + 64|0;
 $vararg_buffer14 = sp + 56|0;
 $vararg_buffer12 = sp + 48|0;
 $vararg_buffer9 = sp + 40|0;
 $vararg_buffer7 = sp + 32|0;
 $vararg_buffer5 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $yyssa = sp + 1304|0;
 $yyvsa = sp + 504|0;
 HEAP32[8>>2] = 0;
 HEAP32[12>>2] = -2;
 $yyerrstatus$1 = 0;$yyss$0 = $yyssa;$yyssp$1 = $yyssa;$yystacksize$0 = 200;$yystate$1 = 0;$yyvs$0 = $yyvsa;$yyvsp$1 = $yyvsa;
 L1: while(1) {
  $1 = $yystate$1&65535;
  HEAP16[$yyssp$1>>1] = $1;
  $$sum = (($yystacksize$0) + -1)|0;
  $2 = (($yyss$0) + ($$sum<<1)|0);
  $3 = ($2>>>0)>($yyssp$1>>>0);
  if ($3) {
   $yyss$1 = $yyss$0;$yyssp$2 = $yyssp$1;$yystacksize$1 = $yystacksize$0;$yyvs$1 = $yyvs$0;$yyvsp$2 = $yyvsp$1;
  } else {
   $4 = $yyssp$1;
   $5 = $yyss$0;
   $6 = (($4) - ($5))|0;
   $7 = $6 >> 1;
   $8 = (($7) + 1)|0;
   $9 = ($yystacksize$0>>>0)>(9999);
   if ($9) {
    $yyss$0$lcssa = $yyss$0;
    label = 192;
    break;
   }
   $10 = $yystacksize$0 << 1;
   $11 = ($10>>>0)>(10000);
   $$ = $11 ? 10000 : $10;
   $12 = ($$*6)|0;
   $13 = $12 | 3;
   $14 = (_malloc($13)|0);
   $15 = ($14|0)==(0|0);
   if ($15) {
    $yyss$0$lcssa = $yyss$0;
    label = 192;
    break;
   }
   $16 = $8 << 1;
   _memcpy(($14|0),($yyss$0|0),($16|0))|0;
   $17 = $$ >>> 1;
   $18 = $17 & 1073741823;
   $19 = (($14) + ($18<<2)|0);
   $20 = $8 << 2;
   _memcpy(($19|0),($yyvs$0|0),($20|0))|0;
   $21 = ($yyss$0|0)==($yyssa|0);
   if (!($21)) {
    _free($yyss$0);
   }
   $22 = (($14) + ($7<<1)|0);
   $23 = (($19) + ($7<<2)|0);
   $$sum11 = (($$) + -1)|0;
   $24 = ($$sum11|0)>($7|0);
   if ($24) {
    $yyss$1 = $14;$yyssp$2 = $22;$yystacksize$1 = $$;$yyvs$1 = $19;$yyvsp$2 = $23;
   } else {
    $yyresult$032 = 1;$yyss$334 = $14;
    break;
   }
  }
  $25 = ($yystate$1|0)==(2);
  if ($25) {
   $yyresult$0 = 0;$yyss$3 = $yyss$1;
   label = 193;
   break;
  }
  $26 = (2700 + ($yystate$1<<1)|0);
  $27 = HEAP16[$26>>1]|0;
  $28 = $27 << 16 >> 16;
  $29 = ($27<<16>>16)==(-125);
  do {
   if ($29) {
    label = 23;
   } else {
    $30 = HEAP32[12>>2]|0;
    $31 = ($30|0)==(-2);
    if ($31) {
     $32 = (_yylex()|0);
     HEAP32[12>>2] = $32;
     $33 = $32;
    } else {
     $33 = $30;
    }
    $34 = ($33|0)<(1);
    if ($34) {
     HEAP32[12>>2] = 0;
     $yytoken$2 = 0;
    } else {
     $35 = ($33>>>0)<(291);
     if ($35) {
      $36 = (7426 + ($33)|0);
      $37 = HEAP8[$36>>0]|0;
      $38 = $37&255;
      $yytoken$2 = $38;
     } else {
      $yytoken$2 = 2;
     }
    }
    $39 = (($yytoken$2) + ($28))|0;
    $40 = ($39>>>0)>(616);
    if ($40) {
     label = 23;
    } else {
     $41 = (3032 + ($39<<1)|0);
     $42 = HEAP16[$41>>1]|0;
     $43 = $42 << 16 >> 16;
     $44 = ($43|0)==($yytoken$2|0);
     if ($44) {
      $45 = (4266 + ($39<<1)|0);
      $46 = HEAP16[$45>>1]|0;
      $47 = $46 << 16 >> 16;
      $48 = ($46<<16>>16)<(1);
      if (!($48)) {
       $51 = ($yyerrstatus$1|0)==(0);
       $52 = (($yyerrstatus$1) + -1)|0;
       $yyerrstatus$1$ = $51 ? 0 : $52;
       HEAP32[12>>2] = -2;
       $53 = ((($yyvsp$2)) + 4|0);
       $54 = HEAP32[16>>2]|0;
       HEAP32[$53>>2] = $54;
       $yyerrstatus$0 = $yyerrstatus$1$;$yyssp$0 = $yyssp$2;$yystate$0 = $47;$yyvsp$0 = $53;
       break;
      }
      $49 = ($46<<16>>16)==(0);
      if ($49) {
       label = 180;
      } else {
       $50 = (0 - ($47))|0;
       $yyn$0 = $50;
       label = 24;
      }
     } else {
      label = 23;
     }
    }
   }
  } while(0);
  if ((label|0) == 23) {
   label = 0;
   $55 = (7717 + ($yystate$1)|0);
   $56 = HEAP8[$55>>0]|0;
   $57 = $56&255;
   $58 = ($56<<24>>24)==(0);
   if ($58) {
    label = 180;
   } else {
    $yyn$0 = $57;
    label = 24;
   }
  }
  do {
   if ((label|0) == 24) {
    label = 0;
    $59 = (7883 + ($yyn$0)|0);
    $60 = HEAP8[$59>>0]|0;
    $61 = $60&255;
    $62 = (1 - ($61))|0;
    $63 = (($yyvsp$2) + ($62<<2)|0);
    $64 = HEAP32[$63>>2]|0;
    L48: do {
     switch ($yyn$0|0) {
     case 25:  {
      label = 47;
      break L1;
      break;
     }
     case 2:  {
      $65 = HEAP8[11743>>0]|0;
      $66 = ($65<<24>>24)==(0);
      if ($66) {
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      } else {
       (_puts(10686)|0);
       _welcome();
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      }
      break;
     }
     case 4:  {
      _run_code();
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 5:  {
      _run_code();
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 6:  {
      _init_gen();
      $yyerrstatus$3 = 0;$yyval$sroa$0$0 = $64;
      break;
     }
     case 7:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 11:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 18:  {
      $67 = HEAP32[$yyvsp$2>>2]|0;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $67;
      break;
     }
     case 19:  {
      _warranty(7982);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 20:  {
      _limits();
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 21:  {
      $68 = HEAP32[$yyvsp$2>>2]|0;
      $69 = $68 & 2;
      $70 = ($69|0)==(0);
      if ($70) {
       $72 = $68;
      } else {
       _warns(7983,$vararg_buffer);
       $$pre = HEAP32[$yyvsp$2>>2]|0;
       $72 = $$pre;
      }
      $71 = $72 & 1;
      $73 = ($71|0)==(0);
      if ($73) {
       _generate(8010);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
       break L48;
      } else {
       _generate(8008);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
       break L48;
      }
      break;
     }
     case 22:  {
      _generate(8012);
      $74 = HEAP32[$yyvsp$2>>2]|0;
      _generate($74);
      $75 = HEAP32[$yyvsp$2>>2]|0;
      _free($75);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 23:  {
      $76 = HEAP32[1344>>2]|0;
      $77 = ($76|0)==(0);
      if ($77) {
       _yyerror(8014,$vararg_buffer1);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
       break L48;
      } else {
       HEAP32[$vararg_buffer3>>2] = $76;
       (_sprintf(11662,8040,$vararg_buffer3)|0);
       _generate(11662);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
       break L48;
      }
      break;
     }
     case 24:  {
      _warns(8046,$vararg_buffer5);
      $78 = HEAP32[1352>>2]|0;
      $79 = ($78|0)==(0);
      if ($79) {
       _yyerror(8065,$vararg_buffer7);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
       break L48;
      } else {
       HEAP32[$vararg_buffer9>>2] = $78;
       (_sprintf(11662,8040,$vararg_buffer9)|0);
       _generate(11662);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
       break L48;
      }
      break;
     }
     case 26:  {
      _generate(8088);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 27:  {
      _generate(8090);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 28:  {
      _generate(8093);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 29:  {
      $80 = HEAP32[1344>>2]|0;
      HEAP32[$yyvsp$2>>2] = $80;
      $81 = HEAP32[1356>>2]|0;
      $82 = (($81) + 1)|0;
      HEAP32[1356>>2] = $82;
      HEAP32[1344>>2] = $81;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 30:  {
      $83 = ((($yyvsp$2)) + -4|0);
      $84 = HEAP32[$83>>2]|0;
      $85 = ($84|0)>(1);
      if ($85) {
       _warns(8095,$vararg_buffer12);
      }
      $86 = HEAP32[1356>>2]|0;
      $87 = (($86) + 1)|0;
      HEAP32[1356>>2] = $87;
      HEAP32[$83>>2] = $86;
      $88 = ($86|0)<(0);
      if ($88) {
       HEAP32[$vararg_buffer14>>2] = $86;
       (_sprintf(11662,8130,$vararg_buffer14)|0);
      } else {
       HEAP32[$vararg_buffer17>>2] = $86;
       (_sprintf(11662,8136,$vararg_buffer17)|0);
      }
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 31:  {
      $89 = ((($yyvsp$2)) + -4|0);
      $90 = HEAP32[$89>>2]|0;
      $91 = ($90|0)<(0);
      if ($91) {
       _generate(8143);
      }
      $92 = HEAP32[1356>>2]|0;
      $93 = (($92) + 1)|0;
      HEAP32[1356>>2] = $93;
      HEAP32[$89>>2] = $92;
      $94 = HEAP32[1344>>2]|0;
      HEAP32[$vararg_buffer20>>2] = $92;
      $vararg_ptr23 = ((($vararg_buffer20)) + 4|0);
      HEAP32[$vararg_ptr23>>2] = $94;
      (_sprintf(11662,8145,$vararg_buffer20)|0);
      _generate(11662);
      $95 = HEAP32[1352>>2]|0;
      $96 = HEAP32[1356>>2]|0;
      $97 = (($96) + 1)|0;
      HEAP32[1356>>2] = $97;
      HEAP32[1352>>2] = $96;
      HEAP32[$vararg_buffer24>>2] = $96;
      (_sprintf(11662,8130,$vararg_buffer24)|0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $95;
      break;
     }
     case 32:  {
      $98 = ((($yyvsp$2)) + -4|0);
      $99 = HEAP32[$98>>2]|0;
      $100 = ($99|0)>(1);
      if ($100) {
       _warns(8156,$vararg_buffer27);
       $$pr = HEAP32[$98>>2]|0;
       $101 = $$pr;
      } else {
       $101 = $99;
      }
      $102 = ($101|0)<(0);
      $103 = ((($yyvsp$2)) + -28|0);
      $104 = HEAP32[$103>>2]|0;
      $105 = ((($yyvsp$2)) + -16|0);
      $106 = HEAP32[$105>>2]|0;
      if ($102) {
       HEAP32[$vararg_buffer29>>2] = $104;
       $vararg_ptr32 = ((($vararg_buffer29)) + 4|0);
       HEAP32[$vararg_ptr32>>2] = $106;
       (_sprintf(11662,8191,$vararg_buffer29)|0);
      } else {
       HEAP32[$vararg_buffer33>>2] = $104;
       $vararg_ptr36 = ((($vararg_buffer33)) + 4|0);
       HEAP32[$vararg_ptr36>>2] = $106;
       (_sprintf(11662,8202,$vararg_buffer33)|0);
      }
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 33:  {
      $107 = HEAP32[1352>>2]|0;
      $108 = HEAP32[1344>>2]|0;
      HEAP32[$vararg_buffer37>>2] = $107;
      $vararg_ptr40 = ((($vararg_buffer37)) + 4|0);
      HEAP32[$vararg_ptr40>>2] = $108;
      (_sprintf(11662,8191,$vararg_buffer37)|0);
      _generate(11662);
      $109 = ((($yyvsp$2)) + -48|0);
      $110 = HEAP32[$109>>2]|0;
      HEAP32[1344>>2] = $110;
      $111 = ((($yyvsp$2)) + -16|0);
      $112 = HEAP32[$111>>2]|0;
      HEAP32[1352>>2] = $112;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 34:  {
      $113 = HEAP32[1348>>2]|0;
      $114 = ((($yyvsp$2)) + -4|0);
      HEAP32[$114>>2] = $113;
      $115 = HEAP32[1356>>2]|0;
      $116 = (($115) + 1)|0;
      HEAP32[1356>>2] = $116;
      HEAP32[1348>>2] = $115;
      HEAP32[$vararg_buffer41>>2] = $115;
      (_sprintf(11662,8214,$vararg_buffer41)|0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 35:  {
      $117 = HEAP32[1348>>2]|0;
      HEAP32[$vararg_buffer44>>2] = $117;
      (_sprintf(11662,8130,$vararg_buffer44)|0);
      _generate(11662);
      $118 = ((($yyvsp$2)) + -16|0);
      $119 = HEAP32[$118>>2]|0;
      HEAP32[1348>>2] = $119;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 36:  {
      $120 = HEAP32[1356>>2]|0;
      $121 = (($120) + 1)|0;
      HEAP32[1356>>2] = $121;
      HEAP32[$yyvsp$2>>2] = $120;
      HEAP32[$vararg_buffer47>>2] = $120;
      (_sprintf(11662,8130,$vararg_buffer47)|0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 37:  {
      $122 = HEAP32[1344>>2]|0;
      HEAP32[$yyvsp$2>>2] = $122;
      $123 = HEAP32[1356>>2]|0;
      $124 = (($123) + 1)|0;
      HEAP32[1356>>2] = $124;
      HEAP32[1344>>2] = $123;
      HEAP32[$vararg_buffer50>>2] = $123;
      (_sprintf(11662,8214,$vararg_buffer50)|0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 38:  {
      $125 = ((($yyvsp$2)) + -24|0);
      $126 = HEAP32[$125>>2]|0;
      $127 = HEAP32[1344>>2]|0;
      HEAP32[$vararg_buffer53>>2] = $126;
      $vararg_ptr56 = ((($vararg_buffer53)) + 4|0);
      HEAP32[$vararg_ptr56>>2] = $127;
      (_sprintf(11662,8191,$vararg_buffer53)|0);
      _generate(11662);
      $128 = ((($yyvsp$2)) + -12|0);
      $129 = HEAP32[$128>>2]|0;
      HEAP32[1344>>2] = $129;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 39:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 40:  {
      _warns(8220,$vararg_buffer57);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 44:  {
      _generate(8236);
      $130 = HEAP32[$yyvsp$2>>2]|0;
      _generate($130);
      $131 = HEAP32[$yyvsp$2>>2]|0;
      _free($131);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 45:  {
      _generate(8238);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 47:  {
      _warns(8240,$vararg_buffer59);
      $132 = HEAP32[1356>>2]|0;
      $133 = (($132) + 1)|0;
      HEAP32[1356>>2] = $133;
      HEAP32[$yyvsp$2>>2] = $132;
      $134 = HEAP32[1348>>2]|0;
      HEAP32[$vararg_buffer61>>2] = $132;
      $vararg_ptr64 = ((($vararg_buffer61)) + 4|0);
      HEAP32[$vararg_ptr64>>2] = $134;
      (_sprintf(11662,8268,$vararg_buffer61)|0);
      _generate(11662);
      $135 = HEAP32[$yyvsp$2>>2]|0;
      HEAP32[1348>>2] = $135;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 49:  {
      $136 = ((($yyvsp$2)) + -16|0);
      $137 = HEAP32[$136>>2]|0;
      $138 = HEAP32[$yyvsp$2>>2]|0;
      _check_params($137,$138);
      $139 = ((($yyvsp$2)) + -24|0);
      $140 = HEAP32[$139>>2]|0;
      $141 = (_lookup($140,3)|0);
      $142 = HEAP32[$136>>2]|0;
      $143 = (_arg_str($142)|0);
      $144 = HEAP32[$yyvsp$2>>2]|0;
      $145 = (_arg_str($144)|0);
      HEAP32[$vararg_buffer65>>2] = $141;
      $vararg_ptr68 = ((($vararg_buffer65)) + 4|0);
      HEAP32[$vararg_ptr68>>2] = $143;
      $vararg_ptr69 = ((($vararg_buffer65)) + 8|0);
      HEAP32[$vararg_ptr69>>2] = $145;
      (_sprintf(11662,8278,$vararg_buffer65)|0);
      _generate(11662);
      $146 = HEAP32[$136>>2]|0;
      _free_args($146);
      $147 = HEAP32[$yyvsp$2>>2]|0;
      _free_args($147);
      $148 = HEAP32[1356>>2]|0;
      $149 = ((($yyvsp$2)) + -28|0);
      HEAP32[$149>>2] = $148;
      HEAP32[1356>>2] = 1;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 50:  {
      _generate(8289);
      $150 = ((($yyvsp$2)) + -40|0);
      $151 = HEAP32[$150>>2]|0;
      HEAP32[1356>>2] = $151;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 51:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 53:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 54:  {
      $152 = ((($yyvsp$2)) + -4|0);
      $153 = HEAP32[$152>>2]|0;
      $154 = $153;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $154;
      break;
     }
     case 55:  {
      $155 = ((($yyvsp$2)) + -4|0);
      $156 = HEAP32[$155>>2]|0;
      $157 = $156;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $157;
      break;
     }
     case 56:  {
      $158 = HEAP32[$yyvsp$2>>2]|0;
      $159 = (_lookup($158,0)|0);
      $160 = (_nextarg(0,$159)|0);
      $161 = $160;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $161;
      break;
     }
     case 57:  {
      $162 = ((($yyvsp$2)) + -8|0);
      $163 = HEAP32[$162>>2]|0;
      $164 = (_lookup($163,1)|0);
      $165 = (_nextarg(0,$164)|0);
      $166 = $165;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $166;
      break;
     }
     case 58:  {
      $167 = ((($yyvsp$2)) + -8|0);
      $168 = HEAP32[$167>>2]|0;
      $169 = HEAP32[$yyvsp$2>>2]|0;
      $170 = (_lookup($169,0)|0);
      $171 = (_nextarg($168,$170)|0);
      $172 = $171;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $172;
      break;
     }
     case 59:  {
      $173 = ((($yyvsp$2)) + -16|0);
      $174 = HEAP32[$173>>2]|0;
      $175 = ((($yyvsp$2)) + -8|0);
      $176 = HEAP32[$175>>2]|0;
      $177 = (_lookup($176,1)|0);
      $178 = (_nextarg($174,$177)|0);
      $179 = $178;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $179;
      break;
     }
     case 60:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 62:  {
      $180 = HEAP32[$yyvsp$2>>2]|0;
      $181 = ($180|0)>(1);
      if ($181) {
       _warns(8293,$vararg_buffer70);
      }
      $182 = (_nextarg(0,0)|0);
      $183 = $182;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $183;
      break;
     }
     case 63:  {
      $184 = ((($yyvsp$2)) + -8|0);
      $185 = HEAP32[$184>>2]|0;
      $186 = (_lookup($185,1)|0);
      $187 = (0 - ($186))|0;
      HEAP32[$vararg_buffer72>>2] = $187;
      (_sprintf(11662,8316,$vararg_buffer72)|0);
      _generate(11662);
      $188 = (_nextarg(0,1)|0);
      $189 = $188;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $189;
      break;
     }
     case 64:  {
      $190 = HEAP32[$yyvsp$2>>2]|0;
      $191 = ($190|0)>(1);
      if ($191) {
       _warns(8293,$vararg_buffer75);
      }
      $192 = ((($yyvsp$2)) + -8|0);
      $193 = HEAP32[$192>>2]|0;
      $194 = (_nextarg($193,0)|0);
      $195 = $194;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $195;
      break;
     }
     case 65:  {
      $196 = ((($yyvsp$2)) + -8|0);
      $197 = HEAP32[$196>>2]|0;
      $198 = (_lookup($197,1)|0);
      $199 = (0 - ($198))|0;
      HEAP32[$vararg_buffer77>>2] = $199;
      (_sprintf(11662,8316,$vararg_buffer77)|0);
      _generate(11662);
      $200 = ((($yyvsp$2)) + -16|0);
      $201 = HEAP32[$200>>2]|0;
      $202 = (_nextarg($201,1)|0);
      $203 = $202;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $203;
      break;
     }
     case 66:  {
      _warns(8321,$vararg_buffer80);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = -1;
      break;
     }
     case 68:  {
      _generate(8357);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 69:  {
      $204 = HEAP32[$yyvsp$2>>2]|0;
      $205 = ($204|0)>(1);
      if ($205) {
       _warns(8359,$vararg_buffer82);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      } else {
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      }
      break;
     }
     case 70:  {
      $206 = HEAP8[$yyvsp$2>>0]|0;
      $207 = ($206<<24>>24)==(61);
      if ($207) {
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      } else {
       $208 = ((($yyvsp$2)) + -4|0);
       $209 = HEAP32[$208>>2]|0;
       $210 = ($209|0)<(0);
       if ($210) {
        $211 = (0 - ($209))|0;
        HEAP32[$vararg_buffer84>>2] = $211;
        (_sprintf(11662,8390,$vararg_buffer84)|0);
       } else {
        HEAP32[$vararg_buffer87>>2] = $209;
        (_sprintf(11662,8396,$vararg_buffer87)|0);
       }
       _generate(11662);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      }
      break;
     }
     case 71:  {
      $212 = HEAP32[$yyvsp$2>>2]|0;
      $213 = ($212|0)>(1);
      if ($213) {
       _warns(8401,$vararg_buffer90);
      }
      $214 = ((($yyvsp$2)) + -8|0);
      $215 = HEAP8[$214>>0]|0;
      $216 = ($215<<24>>24)==(61);
      if (!($216)) {
       HEAP8[11662>>0] = $215;
       HEAP8[(11663)>>0] = 0;
       _generate(11662);
      }
      $217 = ((($yyvsp$2)) + -12|0);
      $218 = HEAP32[$217>>2]|0;
      $219 = ($218|0)<(0);
      if ($219) {
       $220 = (0 - ($218))|0;
       HEAP32[$vararg_buffer92>>2] = $220;
       (_sprintf(11662,8426,$vararg_buffer92)|0);
      } else {
       HEAP32[$vararg_buffer95>>2] = $218;
       (_sprintf(11662,8431,$vararg_buffer95)|0);
      }
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 72:  {
      _warns(8436,$vararg_buffer98);
      $221 = HEAP32[1356>>2]|0;
      $222 = (($221) + 1)|0;
      HEAP32[1356>>2] = $222;
      HEAP32[$yyvsp$2>>2] = $221;
      HEAP32[$vararg_buffer100>>2] = $221;
      (_sprintf(11662,8448,$vararg_buffer100)|0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 73:  {
      $223 = ((($yyvsp$2)) + -8|0);
      $224 = HEAP32[$223>>2]|0;
      HEAP32[$vararg_buffer103>>2] = $224;
      $vararg_ptr106 = ((($vararg_buffer103)) + 4|0);
      HEAP32[$vararg_ptr106>>2] = $224;
      (_sprintf(11662,8455,$vararg_buffer103)|0);
      _generate(11662);
      $225 = ((($yyvsp$2)) + -12|0);
      $226 = HEAP32[$225>>2]|0;
      $227 = HEAP32[$yyvsp$2>>2]|0;
      $228 = $227 | $226;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $228;
      break;
     }
     case 74:  {
      _warns(8467,$vararg_buffer107);
      $229 = HEAP32[1356>>2]|0;
      $230 = (($229) + 1)|0;
      HEAP32[1356>>2] = $230;
      HEAP32[$yyvsp$2>>2] = $229;
      HEAP32[$vararg_buffer109>>2] = $229;
      (_sprintf(11662,8479,$vararg_buffer109)|0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
      break;
     }
     case 75:  {
      $231 = HEAP32[1356>>2]|0;
      $232 = (($231) + 1)|0;
      HEAP32[1356>>2] = $232;
      $233 = ((($yyvsp$2)) + -8|0);
      $234 = HEAP32[$233>>2]|0;
      HEAP32[$vararg_buffer112>>2] = $234;
      $vararg_ptr115 = ((($vararg_buffer112)) + 4|0);
      HEAP32[$vararg_ptr115>>2] = $231;
      $vararg_ptr116 = ((($vararg_buffer112)) + 8|0);
      HEAP32[$vararg_ptr116>>2] = $234;
      $vararg_ptr117 = ((($vararg_buffer112)) + 12|0);
      HEAP32[$vararg_ptr117>>2] = $231;
      (_sprintf(11662,8484,$vararg_buffer112)|0);
      _generate(11662);
      $235 = ((($yyvsp$2)) + -12|0);
      $236 = HEAP32[$235>>2]|0;
      $237 = HEAP32[$yyvsp$2>>2]|0;
      $238 = $237 | $236;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $238;
      break;
     }
     case 76:  {
      $239 = HEAP32[$yyvsp$2>>2]|0;
      _warns(8503,$vararg_buffer118);
      _generate(8514);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $239;
      break;
     }
     case 77:  {
      $240 = ((($yyvsp$2)) + -4|0);
      $241 = HEAP32[$240>>2]|0;
      $242 = HEAP8[$241>>0]|0;
      $243 = $242 << 24 >> 24;
      switch ($243|0) {
      case 61:  {
       _generate(8516);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
       break L48;
       break;
      }
      case 33:  {
       _generate(8518);
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
       break L48;
       break;
      }
      case 60:  {
       $244 = ((($241)) + 1|0);
       $245 = HEAP8[$244>>0]|0;
       $246 = ($245<<24>>24)==(61);
       if ($246) {
        _generate(8520);
        $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
        break L48;
       } else {
        _generate(8522);
        $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
        break L48;
       }
       break;
      }
      case 62:  {
       $247 = ((($241)) + 1|0);
       $248 = HEAP8[$247>>0]|0;
       $249 = ($248<<24>>24)==(61);
       if ($249) {
        _generate(8524);
        $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
        break L48;
       } else {
        _generate(8526);
        $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
        break L48;
       }
       break;
      }
      default: {
       $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
       break L48;
      }
      }
      break;
     }
     case 78:  {
      _generate(8528);
      $250 = ((($yyvsp$2)) + -8|0);
      $251 = HEAP32[$250>>2]|0;
      $252 = HEAP32[$yyvsp$2>>2]|0;
      $253 = $252 | $251;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $253;
      break;
     }
     case 79:  {
      _generate(8530);
      $254 = ((($yyvsp$2)) + -8|0);
      $255 = HEAP32[$254>>2]|0;
      $256 = HEAP32[$yyvsp$2>>2]|0;
      $257 = $256 | $255;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $257;
      break;
     }
     case 80:  {
      $258 = ((($yyvsp$2)) + -4|0);
      $259 = HEAP8[$258>>0]|0;
      HEAP8[11662>>0] = $259;
      HEAP8[(11663)>>0] = 0;
      _generate(11662);
      $260 = ((($yyvsp$2)) + -8|0);
      $261 = HEAP32[$260>>2]|0;
      $262 = HEAP32[$yyvsp$2>>2]|0;
      $263 = $262 | $261;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $263;
      break;
     }
     case 81:  {
      _generate(8532);
      $264 = ((($yyvsp$2)) + -8|0);
      $265 = HEAP32[$264>>2]|0;
      $266 = HEAP32[$yyvsp$2>>2]|0;
      $267 = $266 | $265;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $267;
      break;
     }
     case 82:  {
      _generate(8534);
      $268 = HEAP32[$yyvsp$2>>2]|0;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $268;
      break;
     }
     case 83:  {
      $269 = HEAP32[$yyvsp$2>>2]|0;
      $270 = ($269|0)<(0);
      if ($270) {
       $271 = (0 - ($269))|0;
       HEAP32[$vararg_buffer120>>2] = $271;
       (_sprintf(11662,8536,$vararg_buffer120)|0);
      } else {
       HEAP32[$vararg_buffer123>>2] = $269;
       (_sprintf(11662,8396,$vararg_buffer123)|0);
      }
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 84:  {
      $272 = HEAP32[$yyvsp$2>>2]|0;
      $273 = (_strlen($272)|0);
      $274 = ($273|0)==(1);
      L180: do {
       if ($274) {
        $275 = HEAP8[$272>>0]|0;
        switch ($275<<24>>24) {
        case 48:  {
         _generate(8357);
         break L180;
         break;
        }
        case 49:  {
         _generate(8143);
         break L180;
         break;
        }
        default: {
         label = 141;
         break L180;
        }
        }
       } else {
        label = 141;
       }
      } while(0);
      if ((label|0) == 141) {
       label = 0;
       _generate(8541);
       $276 = HEAP32[$yyvsp$2>>2]|0;
       _generate($276);
       _generate(8543);
      }
      $277 = HEAP32[$yyvsp$2>>2]|0;
      _free($277);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 85:  {
      $278 = ((($yyvsp$2)) + -4|0);
      $279 = HEAP32[$278>>2]|0;
      $280 = $279 | 1;
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $280;
      break;
     }
     case 86:  {
      $281 = ((($yyvsp$2)) + -4|0);
      $282 = HEAP32[$281>>2]|0;
      $283 = ($282|0)==(0|0);
      $284 = ((($yyvsp$2)) + -12|0);
      $285 = HEAP32[$284>>2]|0;
      $286 = (_lookup($285,2)|0);
      if ($283) {
       HEAP32[$vararg_buffer130>>2] = $286;
       (_sprintf(11662,8553,$vararg_buffer130)|0);
      } else {
       $287 = HEAP32[$281>>2]|0;
       $288 = (_call_str($287)|0);
       HEAP32[$vararg_buffer126>>2] = $286;
       $vararg_ptr129 = ((($vararg_buffer126)) + 4|0);
       HEAP32[$vararg_ptr129>>2] = $288;
       (_sprintf(11662,8545,$vararg_buffer126)|0);
       $289 = HEAP32[$281>>2]|0;
       _free_args($289);
      }
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 87:  {
      $290 = HEAP32[$yyvsp$2>>2]|0;
      $291 = ($290|0)<(0);
      $292 = ((($yyvsp$2)) + -4|0);
      $293 = HEAP8[$292>>0]|0;
      $294 = ($293<<24>>24)==(43);
      do {
       if ($291) {
        $295 = (0 - ($290))|0;
        if ($294) {
         HEAP32[$vararg_buffer133>>2] = $295;
         $vararg_ptr136 = ((($vararg_buffer133)) + 4|0);
         HEAP32[$vararg_ptr136>>2] = $295;
         (_sprintf(11662,8558,$vararg_buffer133)|0);
         break;
        } else {
         HEAP32[$vararg_buffer137>>2] = $295;
         $vararg_ptr140 = ((($vararg_buffer137)) + 4|0);
         HEAP32[$vararg_ptr140>>2] = $295;
         (_sprintf(11662,8568,$vararg_buffer137)|0);
         break;
        }
       } else {
        if ($294) {
         HEAP32[$vararg_buffer141>>2] = $290;
         $vararg_ptr144 = ((($vararg_buffer141)) + 4|0);
         HEAP32[$vararg_ptr144>>2] = $290;
         (_sprintf(11662,8578,$vararg_buffer141)|0);
         break;
        } else {
         HEAP32[$vararg_buffer145>>2] = $290;
         $vararg_ptr148 = ((($vararg_buffer145)) + 4|0);
         HEAP32[$vararg_ptr148>>2] = $290;
         (_sprintf(11662,8587,$vararg_buffer145)|0);
         break;
        }
       }
      } while(0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 88:  {
      $296 = ((($yyvsp$2)) + -4|0);
      $297 = HEAP32[$296>>2]|0;
      $298 = ($297|0)<(0);
      do {
       if ($298) {
        $299 = (0 - ($297))|0;
        HEAP32[$vararg_buffer149>>2] = $299;
        (_sprintf(11662,8596,$vararg_buffer149)|0);
        _generate(11662);
        $300 = HEAP8[$yyvsp$2>>0]|0;
        $301 = ($300<<24>>24)==(43);
        $302 = HEAP32[$296>>2]|0;
        $303 = (0 - ($302))|0;
        if ($301) {
         HEAP32[$vararg_buffer152>>2] = $303;
         (_sprintf(11662,8603,$vararg_buffer152)|0);
         break;
        } else {
         HEAP32[$vararg_buffer155>>2] = $303;
         (_sprintf(11662,8608,$vararg_buffer155)|0);
         break;
        }
       } else {
        HEAP32[$vararg_buffer158>>2] = $297;
        (_sprintf(11662,8396,$vararg_buffer158)|0);
        _generate(11662);
        $304 = HEAP8[$yyvsp$2>>0]|0;
        $305 = ($304<<24>>24)==(43);
        $306 = HEAP32[$296>>2]|0;
        if ($305) {
         HEAP32[$vararg_buffer161>>2] = $306;
         (_sprintf(11662,8613,$vararg_buffer161)|0);
         break;
        } else {
         HEAP32[$vararg_buffer164>>2] = $306;
         (_sprintf(11662,8618,$vararg_buffer164)|0);
         break;
        }
       }
      } while(0);
      _generate(11662);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 89:  {
      _generate(8623);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 90:  {
      _generate(8626);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 91:  {
      _generate(8629);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 92:  {
      _warns(8632,$vararg_buffer167);
      _generate(8646);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 93:  {
      $307 = HEAP32[$yyvsp$2>>2]|0;
      $308 = (_lookup($307,0)|0);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $308;
      break;
     }
     case 94:  {
      $309 = ((($yyvsp$2)) + -4|0);
      $310 = HEAP32[$309>>2]|0;
      $311 = ($310|0)>(1);
      if ($311) {
       _warns(8649,$vararg_buffer169);
      }
      $312 = ((($yyvsp$2)) + -12|0);
      $313 = HEAP32[$312>>2]|0;
      $314 = (_lookup($313,1)|0);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $314;
      break;
     }
     case 95:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 0;
      break;
     }
     case 96:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 1;
      break;
     }
     case 97:  {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 2;
      break;
     }
     case 98:  {
      _warns(8673,$vararg_buffer171);
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = 3;
      break;
     }
     default: {
      $yyerrstatus$3 = $yyerrstatus$1;$yyval$sroa$0$0 = $64;
     }
     }
    } while(0);
    $315 = (0 - ($61))|0;
    $316 = (($yyssp$2) + ($315<<1)|0);
    HEAP32[$63>>2] = $yyval$sroa$0$0;
    $317 = (8687 + ($yyn$0)|0);
    $318 = HEAP8[$317>>0]|0;
    $319 = $318&255;
    $320 = (($319) + -47)|0;
    $321 = (8786 + ($320)|0);
    $322 = HEAP8[$321>>0]|0;
    $323 = $322 << 24 >> 24;
    $324 = HEAP16[$316>>1]|0;
    $325 = $324 << 16 >> 16;
    $326 = (($325) + ($323))|0;
    $327 = ($326>>>0)<(617);
    if ($327) {
     $328 = (3032 + ($326<<1)|0);
     $329 = HEAP16[$328>>1]|0;
     $330 = ($329<<16>>16)==($324<<16>>16);
     if ($330) {
      $331 = (4266 + ($326<<1)|0);
      $332 = HEAP16[$331>>1]|0;
      $333 = $332 << 16 >> 16;
      $yyerrstatus$0 = $yyerrstatus$3;$yyssp$0 = $316;$yystate$0 = $333;$yyvsp$0 = $63;
      break;
     }
    }
    $334 = (5500 + ($320<<1)|0);
    $335 = HEAP16[$334>>1]|0;
    $336 = $335 << 16 >> 16;
    $yyerrstatus$0 = $yyerrstatus$3;$yyssp$0 = $316;$yystate$0 = $336;$yyvsp$0 = $63;
   }
   else if ((label|0) == 180) {
    label = 0;
    L32: do {
     switch ($yyerrstatus$1|0) {
     case 0:  {
      $337 = HEAP32[8>>2]|0;
      $338 = (($337) + 1)|0;
      HEAP32[8>>2] = $338;
      _yyerror(8819,$vararg_buffer173);
      $342 = $27;$yyssp$3 = $yyssp$2;$yyvsp$3 = $yyvsp$2;
      break;
     }
     case 3:  {
      $339 = HEAP32[12>>2]|0;
      $340 = ($339|0)<(1);
      if ($340) {
       $341 = ($339|0)==(0);
       if ($341) {
        $yyresult$0 = 1;$yyss$3 = $yyss$1;
        label = 193;
        break L1;
       } else {
        $342 = $27;$yyssp$3 = $yyssp$2;$yyvsp$3 = $yyvsp$2;
        break L32;
       }
      } else {
       HEAP32[12>>2] = -2;
       $342 = $27;$yyssp$3 = $yyssp$2;$yyvsp$3 = $yyvsp$2;
       break L32;
      }
      break;
     }
     default: {
      $342 = $27;$yyssp$3 = $yyssp$2;$yyvsp$3 = $yyvsp$2;
     }
     }
    } while(0);
    while(1) {
     $343 = ($342<<16>>16)==(-125);
     if (!($343)) {
      $344 = $342 << 16 >> 16;
      $345 = (($344) + 1)|0;
      $346 = ($342<<16>>16)>(-2);
      $347 = ($345|0)<(617);
      $or$cond7 = $346 & $347;
      if ($or$cond7) {
       $348 = (3032 + ($345<<1)|0);
       $349 = HEAP16[$348>>1]|0;
       $350 = ($349<<16>>16)==(1);
       if ($350) {
        $351 = (4266 + ($345<<1)|0);
        $352 = HEAP16[$351>>1]|0;
        $353 = ($352<<16>>16)>(0);
        if ($353) {
         $$lcssa = $352;$yyssp$3$lcssa = $yyssp$3;$yyvsp$3$lcssa = $yyvsp$3;
         break;
        }
       }
      }
     }
     $354 = ($yyssp$3|0)==($yyss$1|0);
     if ($354) {
      $yyresult$0 = 1;$yyss$3 = $yyss$1;
      label = 193;
      break L1;
     }
     $355 = ((($yyvsp$3)) + -4|0);
     $356 = ((($yyssp$3)) + -2|0);
     $357 = HEAP16[$356>>1]|0;
     $358 = $357 << 16 >> 16;
     $$phi$trans$insert = (2700 + ($358<<1)|0);
     $$pre31 = HEAP16[$$phi$trans$insert>>1]|0;
     $342 = $$pre31;$yyssp$3 = $356;$yyvsp$3 = $355;
    }
    $359 = $$lcssa << 16 >> 16;
    $360 = ((($yyvsp$3$lcssa)) + 4|0);
    $361 = HEAP32[16>>2]|0;
    HEAP32[$360>>2] = $361;
    $yyerrstatus$0 = 3;$yyssp$0 = $yyssp$3$lcssa;$yystate$0 = $359;$yyvsp$0 = $360;
   }
  } while(0);
  $0 = ((($yyssp$0)) + 2|0);
  $yyerrstatus$1 = $yyerrstatus$0;$yyss$0 = $yyss$1;$yyssp$1 = $0;$yystacksize$0 = $yystacksize$1;$yystate$1 = $yystate$0;$yyvs$0 = $yyvs$1;$yyvsp$1 = $yyvsp$0;
 }
 if ((label|0) == 47) {
  _exit(0);
  // unreachable;
 }
 else if ((label|0) == 192) {
  _yyerror(8832,$vararg_buffer175);
  $yyresult$0 = 2;$yyss$3 = $yyss$0$lcssa;
  label = 193;
 }
 if ((label|0) == 193) {
  $362 = ($yyss$3|0)==($yyssa|0);
  if ($362) {
   $yyresult$033 = $yyresult$0;
   STACKTOP = sp;return ($yyresult$033|0);
  } else {
   $yyresult$032 = $yyresult$0;$yyss$334 = $yyss$3;
  }
 }
 _free($yyss$334);
 $yyresult$033 = $yyresult$032;
 STACKTOP = sp;return ($yyresult$033|0);
}
function _yylex() {
 var $$0 = 0, $$01$i = 0, $$count$0 = 0, $$lcssa = 0, $$lcssa$i = 0, $$lcssa841 = 0, $$lcssa843 = 0, $$lcssa846 = 0, $$lcssa847 = 0, $$lcssa937 = 0, $$lcssa938 = 0, $$lcssa941 = 0, $$lcssa943 = 0, $$lcssa946 = 0, $$lcssa948 = 0, $$lcssa994 = 0, $$lcssa995 = 0, $$lcssa996 = 0, $$lcssa997 = 0, $$lcssa999 = 0;
 var $$phi$trans$insert = 0, $$phi$trans$insert333 = 0, $$pre = 0, $$pre330 = 0, $$pre331 = 0, $$pre332 = 0, $$pre334 = 0, $$pre335 = 0, $$pre336 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0;
 var $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0;
 var $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0;
 var $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0;
 var $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0;
 var $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0;
 var $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0;
 var $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0;
 var $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0;
 var $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0;
 var $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0;
 var $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0;
 var $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0;
 var $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0;
 var $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0;
 var $97 = 0, $98 = 0, $99 = 0, $count$0 = 0, $count$0$lcssa = 0, $dst$0$ph = 0, $dst$0$ph$lcssa = 0, $exitcond = 0, $look$0 = 0, $src$0 = 0, $src$0$lcssa840 = 0, $src$1 = 0, $src$1$lcssa = 0, $src$1$ph22 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer3 = 0, $vararg_buffer6 = 0, $yy_act$0 = 0, $yy_act$1 = 0;
 var $yy_bp$0$ph = 0, $yy_bp$1$ph = 0, $yy_bp$1$ph$lcssa978 = 0, $yy_c$0$ph$in = 0, $yy_c$0$ph$in$i = 0, $yy_c$0$ph$in$i15 = 0, $yy_c$0$ph$in$i6 = 0, $yy_cp$0 = 0, $yy_cp$0$ph = 0, $yy_cp$05$i = 0, $yy_cp$05$i11 = 0, $yy_cp$05$i2 = 0, $yy_cp$1 = 0, $yy_cp$1$ph = 0, $yy_cp$2 = 0, $yy_cp$2$lcssa878 = 0, $yy_current_state$0 = 0, $yy_current_state$0$lcssa$i = 0, $yy_current_state$0$ph = 0, $yy_current_state$04$i = 0;
 var $yy_current_state$04$i12 = 0, $yy_current_state$04$i3 = 0, $yy_current_state$1 = 0, $yy_current_state$1$i = 0, $yy_current_state$1$i17 = 0, $yy_current_state$1$i8 = 0, $yy_current_state$1$ph = 0, $yy_current_state$1$ph$i = 0, $yy_current_state$1$ph$i14 = 0, $yy_current_state$1$ph$i5 = 0, $yy_current_state$2 = 0, $yy_current_state$2$ph = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer6 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = HEAP32[36>>2]|0;
 $1 = ($0|0)==(0);
 if ($1) {
  HEAP32[36>>2] = 1;
  $2 = HEAP32[40>>2]|0;
  $3 = ($2|0)==(0);
  if ($3) {
   HEAP32[40>>2] = 1;
  }
  $4 = HEAP32[20>>2]|0;
  $5 = ($4|0)==(0|0);
  if ($5) {
   $6 = HEAP32[435]|0;
   HEAP32[20>>2] = $6;
   $7 = $6;
   $329 = $7;
  } else {
   $329 = $4;
  }
  $8 = HEAP32[24>>2]|0;
  $9 = ($8|0)==(0|0);
  if ($9) {
   $10 = HEAP32[436]|0;
   HEAP32[24>>2] = $10;
  }
  $11 = HEAP32[44>>2]|0;
  $12 = ($11|0)==(0|0);
  do {
   if ($12) {
    $17 = (_malloc(4)|0);
    HEAP32[44>>2] = $17;
    $18 = ($17|0)==(0|0);
    if ($18) {
     _yy_fatal_error(8849);
     // unreachable;
    } else {
     HEAP32[$17>>2] = 0;
     HEAP32[52>>2] = 1;
     HEAP32[48>>2] = 0;
     $28 = $329;
     label = 17;
     break;
    }
   } else {
    $13 = HEAP32[48>>2]|0;
    $14 = (($11) + ($13<<2)|0);
    $15 = HEAP32[$14>>2]|0;
    $16 = ($15|0)==(0|0);
    if ($16) {
     $19 = HEAP32[52>>2]|0;
     $20 = (($19) + -1)|0;
     $21 = ($13>>>0)<($20>>>0);
     if ($21) {
      $28 = $329;
      label = 17;
     } else {
      $22 = (($19) + 8)|0;
      $23 = $22 << 2;
      $24 = (_realloc($11,$23)|0);
      HEAP32[44>>2] = $24;
      $25 = ($24|0)==(0|0);
      if ($25) {
       _yy_fatal_error(8849);
       // unreachable;
      } else {
       $26 = HEAP32[52>>2]|0;
       $27 = (($24) + ($26<<2)|0);
       ;HEAP32[$27>>2]=0|0;HEAP32[$27+4>>2]=0|0;HEAP32[$27+8>>2]=0|0;HEAP32[$27+12>>2]=0|0;HEAP32[$27+16>>2]=0|0;HEAP32[$27+20>>2]=0|0;HEAP32[$27+24>>2]=0|0;HEAP32[$27+28>>2]=0|0;
       HEAP32[52>>2] = $22;
       $$pre = HEAP32[20>>2]|0;
       $28 = $$pre;
       label = 17;
       break;
      }
     }
    } else {
     $34 = $11;$35 = $13;$37 = $15;
    }
   }
  } while(0);
  if ((label|0) == 17) {
   $29 = (_yy_create_buffer($28,16384)|0);
   $30 = HEAP32[48>>2]|0;
   $31 = HEAP32[44>>2]|0;
   $32 = (($31) + ($30<<2)|0);
   HEAP32[$32>>2] = $29;
   $$pre330 = HEAP32[44>>2]|0;
   $$phi$trans$insert = (($$pre330) + ($30<<2)|0);
   $$pre331 = HEAP32[$$phi$trans$insert>>2]|0;
   $34 = $$pre330;$35 = $30;$37 = $$pre331;
  }
  $33 = (($34) + ($35<<2)|0);
  $36 = ((($37)) + 16|0);
  $38 = HEAP32[$36>>2]|0;
  HEAP32[56>>2] = $38;
  $39 = ((($37)) + 8|0);
  $40 = HEAP32[$39>>2]|0;
  HEAP32[60>>2] = $40;
  HEAP32[28>>2] = $40;
  $41 = HEAP32[$33>>2]|0;
  $42 = HEAP32[$41>>2]|0;
  HEAP32[20>>2] = $42;
  $43 = $40;
  $44 = HEAP8[$43>>0]|0;
  HEAP8[8898>>0] = $44;
 }
 $45 = HEAP32[1736>>2]|0;
 L27: while(1) {
  $46 = HEAP32[60>>2]|0;
  $47 = HEAP8[8898>>0]|0;
  HEAP8[$46>>0] = $47;
  $48 = HEAP32[40>>2]|0;
  $yy_bp$0$ph = $46;$yy_cp$0$ph = $46;$yy_current_state$0$ph = $48;
  L29: while(1) {
   $yy_cp$0 = $yy_cp$0$ph;$yy_current_state$0 = $yy_current_state$0$ph;
   while(1) {
    $49 = HEAP8[$yy_cp$0>>0]|0;
    $50 = $49&255;
    $51 = (64 + ($50<<2)|0);
    $52 = HEAP32[$51>>2]|0;
    $53 = (5566 + ($yy_current_state$0<<1)|0);
    $54 = HEAP16[$53>>1]|0;
    $55 = ($54<<16>>16)==(0);
    if ($55) {
     $yy_c$0$ph$in = $52;$yy_current_state$1$ph = $yy_current_state$0;
    } else {
     HEAP32[1088>>2] = $yy_current_state$0;
     HEAP32[1092>>2] = $yy_cp$0;
     $yy_c$0$ph$in = $52;$yy_current_state$1$ph = $yy_current_state$0;
    }
    L35: while(1) {
     $56 = $yy_c$0$ph$in & 255;
     $yy_current_state$1 = $yy_current_state$1$ph;
     while(1) {
      $57 = (5854 + ($yy_current_state$1<<1)|0);
      $58 = HEAP16[$57>>1]|0;
      $59 = $58 << 16 >> 16;
      $60 = (($59) + ($56))|0;
      $61 = (6146 + ($60<<1)|0);
      $62 = HEAP16[$61>>1]|0;
      $63 = $62 << 16 >> 16;
      $64 = ($63|0)==($yy_current_state$1|0);
      if ($64) {
       $$lcssa841 = $60;
       break L35;
      }
      $65 = (6640 + ($yy_current_state$1<<1)|0);
      $66 = HEAP16[$65>>1]|0;
      $67 = $66 << 16 >> 16;
      $68 = ($66<<16>>16)>(143);
      if ($68) {
       $$lcssa843 = $67;
       break;
      } else {
       $yy_current_state$1 = $67;
      }
     }
     $69 = (1096 + ($56<<2)|0);
     $70 = HEAP32[$69>>2]|0;
     $yy_c$0$ph$in = $70;$yy_current_state$1$ph = $$lcssa843;
    }
    $71 = (6932 + ($$lcssa841<<1)|0);
    $72 = HEAP16[$71>>1]|0;
    $73 = $72 << 16 >> 16;
    $74 = ((($yy_cp$0)) + 1|0);
    $75 = (5854 + ($73<<1)|0);
    $76 = HEAP16[$75>>1]|0;
    $77 = ($76<<16>>16)==(194);
    if ($77) {
     $yy_bp$1$ph = $yy_bp$0$ph;$yy_cp$1$ph = $74;$yy_current_state$2$ph = $73;
     break;
    } else {
     $yy_cp$0 = $74;$yy_current_state$0 = $73;
    }
   }
   L42: while(1) {
    $78 = $yy_bp$1$ph;
    $yy_cp$1 = $yy_cp$1$ph;$yy_current_state$2 = $yy_current_state$2$ph;
    L44: while(1) {
     $79 = (5566 + ($yy_current_state$2<<1)|0);
     $80 = HEAP16[$79>>1]|0;
     $81 = $80 << 16 >> 16;
     $82 = ($80<<16>>16)==(0);
     if ($82) {
      $83 = HEAP32[1092>>2]|0;
      $84 = HEAP32[1088>>2]|0;
      $85 = (5566 + ($84<<1)|0);
      $86 = HEAP16[$85>>1]|0;
      $87 = $86 << 16 >> 16;
      $yy_act$0 = $87;$yy_cp$2 = $83;
     } else {
      $yy_act$0 = $81;$yy_cp$2 = $yy_cp$1;
     }
     HEAP32[28>>2] = $yy_bp$1$ph;
     $88 = $yy_cp$2;
     $89 = (($88) - ($78))|0;
     HEAP32[32>>2] = $89;
     $90 = HEAP8[$yy_cp$2>>0]|0;
     HEAP8[8898>>0] = $90;
     HEAP8[$yy_cp$2>>0] = 0;
     HEAP32[60>>2] = $yy_cp$2;
     $yy_act$1 = $yy_act$0;
     L49: while(1) {
      switch ($yy_act$1|0) {
      case 34:  {
       continue L27;
       break;
      }
      case 1:  {
       label = 138;
       break L27;
       break;
      }
      case 2:  {
       label = 139;
       break L27;
       break;
      }
      case 3:  {
       label = 140;
       break L27;
       break;
      }
      case 4:  {
       label = 141;
       break L27;
       break;
      }
      case 6:  {
       label = 35;
       break L27;
       break;
      }
      case 7:  {
       label = 36;
       break L27;
       break;
      }
      case 8:  {
       label = 37;
       break L27;
       break;
      }
      case 9:  {
       label = 38;
       break L27;
       break;
      }
      case 10:  {
       label = 39;
       break L27;
       break;
      }
      case 11:  {
       label = 40;
       break L27;
       break;
      }
      case 12:  {
       label = 41;
       break L27;
       break;
      }
      case 13:  {
       label = 42;
       break L27;
       break;
      }
      case 14:  {
       label = 43;
       break L27;
       break;
      }
      case 15:  {
       label = 44;
       break L27;
       break;
      }
      case 16:  {
       label = 45;
       break L27;
       break;
      }
      case 17:  {
       label = 46;
       break L27;
       break;
      }
      case 18:  {
       label = 47;
       break L27;
       break;
      }
      case 19:  {
       label = 48;
       break L27;
       break;
      }
      case 20:  {
       label = 49;
       break L27;
       break;
      }
      case 21:  {
       label = 50;
       break L27;
       break;
      }
      case 22:  {
       label = 51;
       break L27;
       break;
      }
      case 23:  {
       label = 52;
       break L27;
       break;
      }
      case 24:  {
       label = 53;
       break L27;
       break;
      }
      case 25:  {
       label = 54;
       break L27;
       break;
      }
      case 26:  {
       label = 55;
       break L27;
       break;
      }
      case 27:  {
       label = 56;
       break L27;
       break;
      }
      case 28:  {
       label = 57;
       break L27;
       break;
      }
      case 29:  {
       $yy_bp$1$ph$lcssa978 = $yy_bp$1$ph;$yy_cp$2$lcssa878 = $yy_cp$2;
       label = 58;
       break L27;
       break;
      }
      case 30:  {
       label = 59;
       break L27;
       break;
      }
      case 31:  {
       label = 60;
       break L27;
       break;
      }
      case 32:  {
       label = 61;
       break L27;
       break;
      }
      case 36:  {
       label = 68;
       break L27;
       break;
      }
      case 37:  {
       label = 69;
       break L27;
       break;
      }
      case 38:  {
       label = 75;
       break L27;
       break;
      }
      case 42:  {
       label = 92;
       break L27;
       break;
      }
      case 5:  {
       $$0 = 273;
       label = 142;
       break L27;
       break;
      }
      case 33:  {
       label = 62;
       break L29;
       break;
      }
      case 35:  {
       label = 63;
       break L29;
       break;
      }
      case 39:  {
       label = 86;
       break L29;
       break;
      }
      case 40:  {
       label = 91;
       break L29;
       break;
      }
      case 0:  {
       break L49;
       break;
      }
      case 41:  {
       break;
      }
      default: {
       label = 137;
       break L27;
      }
      }
      $158 = HEAP32[28>>2]|0;
      $159 = HEAP8[8898>>0]|0;
      HEAP8[$yy_cp$2>>0] = $159;
      $160 = HEAP32[48>>2]|0;
      $161 = HEAP32[44>>2]|0;
      $162 = (($161) + ($160<<2)|0);
      $163 = HEAP32[$162>>2]|0;
      $164 = ((($163)) + 44|0);
      $165 = HEAP32[$164>>2]|0;
      $166 = ($165|0)==(0);
      if ($166) {
       $167 = ((($163)) + 16|0);
       $168 = HEAP32[$167>>2]|0;
       HEAP32[56>>2] = $168;
       $169 = HEAP32[20>>2]|0;
       HEAP32[$163>>2] = $169;
       $170 = HEAP32[44>>2]|0;
       $171 = (($170) + ($160<<2)|0);
       $172 = HEAP32[$171>>2]|0;
       $173 = ((($172)) + 44|0);
       HEAP32[$173>>2] = 1;
       $$pre332 = HEAP32[48>>2]|0;
       $$phi$trans$insert333 = (($170) + ($$pre332<<2)|0);
       $$pre334 = HEAP32[$$phi$trans$insert333>>2]|0;
       $177 = $$pre334;
      } else {
       $177 = $163;
      }
      $174 = HEAP32[60>>2]|0;
      $175 = HEAP32[56>>2]|0;
      $176 = ((($177)) + 4|0);
      $178 = HEAP32[$176>>2]|0;
      $179 = (($178) + ($175)|0);
      $180 = ($174>>>0)>($179>>>0);
      if (!($180)) {
       $$lcssa846 = $158;$$lcssa937 = $88;
       break L44;
      }
      $245 = (_yy_get_next_buffer()|0);
      switch ($245|0) {
      case 0:  {
       $$lcssa847 = $158;$$lcssa938 = $88;
       break L42;
       break;
      }
      case 2:  {
       label = 127;
       break L44;
       break;
      }
      case 1:  {
       break;
      }
      default: {
       continue L27;
      }
      }
      HEAP32[1308>>2] = 0;
      $246 = (_open_new_file()|0);
      $247 = ($246|0)==(0);
      if (!($247)) {
       label = 115;
       break L29;
      }
      $248 = HEAP32[28>>2]|0;
      HEAP32[60>>2] = $248;
      $249 = HEAP32[40>>2]|0;
      $250 = (($249) + -1)|0;
      $251 = (($250|0) / 2)&-1;
      $252 = (($251) + 42)|0;
      $yy_act$1 = $252;
     }
     $91 = HEAP8[8898>>0]|0;
     HEAP8[$yy_cp$2>>0] = $91;
     $92 = HEAP32[1092>>2]|0;
     $93 = HEAP32[1088>>2]|0;
     $yy_cp$1 = $92;$yy_current_state$2 = $93;
    }
    if ((label|0) == 127) {
     label = 0;
     $291 = HEAP32[56>>2]|0;
     $292 = HEAP32[48>>2]|0;
     $293 = HEAP32[44>>2]|0;
     $294 = (($293) + ($292<<2)|0);
     $295 = HEAP32[$294>>2]|0;
     $296 = ((($295)) + 4|0);
     $297 = HEAP32[$296>>2]|0;
     $298 = (($297) + ($291)|0);
     HEAP32[60>>2] = $298;
     $299 = HEAP32[40>>2]|0;
     $300 = HEAP32[28>>2]|0;
     $301 = ($300>>>0)<($298>>>0);
     if ($301) {
      $yy_cp$05$i11 = $300;$yy_current_state$04$i12 = $299;
     } else {
      $yy_bp$1$ph = $300;$yy_cp$1$ph = $298;$yy_current_state$2$ph = $299;
      continue;
     }
     while(1) {
      $302 = HEAP8[$yy_cp$05$i11>>0]|0;
      $303 = ($302<<24>>24)==(0);
      if ($303) {
       $333 = 1;
      } else {
       $304 = $302&255;
       $305 = (64 + ($304<<2)|0);
       $306 = HEAP32[$305>>2]|0;
       $333 = $306;
      }
      $307 = (5566 + ($yy_current_state$04$i12<<1)|0);
      $308 = HEAP16[$307>>1]|0;
      $309 = ($308<<16>>16)==(0);
      if ($309) {
       $yy_c$0$ph$in$i15 = $333;$yy_current_state$1$ph$i14 = $yy_current_state$04$i12;
      } else {
       HEAP32[1088>>2] = $yy_current_state$04$i12;
       HEAP32[1092>>2] = $yy_cp$05$i11;
       $yy_c$0$ph$in$i15 = $333;$yy_current_state$1$ph$i14 = $yy_current_state$04$i12;
      }
      L68: while(1) {
       $310 = $yy_c$0$ph$in$i15 & 255;
       $yy_current_state$1$i17 = $yy_current_state$1$ph$i14;
       while(1) {
        $311 = (5854 + ($yy_current_state$1$i17<<1)|0);
        $312 = HEAP16[$311>>1]|0;
        $313 = $312 << 16 >> 16;
        $314 = (($313) + ($310))|0;
        $315 = (6146 + ($314<<1)|0);
        $316 = HEAP16[$315>>1]|0;
        $317 = $316 << 16 >> 16;
        $318 = ($317|0)==($yy_current_state$1$i17|0);
        if ($318) {
         $$lcssa946 = $314;
         break L68;
        }
        $319 = (6640 + ($yy_current_state$1$i17<<1)|0);
        $320 = HEAP16[$319>>1]|0;
        $321 = $320 << 16 >> 16;
        $322 = ($320<<16>>16)>(143);
        if ($322) {
         $$lcssa948 = $321;
         break;
        } else {
         $yy_current_state$1$i17 = $321;
        }
       }
       $323 = (1096 + ($310<<2)|0);
       $324 = HEAP32[$323>>2]|0;
       $yy_c$0$ph$in$i15 = $324;$yy_current_state$1$ph$i14 = $$lcssa948;
      }
      $325 = (6932 + ($$lcssa946<<1)|0);
      $326 = HEAP16[$325>>1]|0;
      $327 = $326 << 16 >> 16;
      $328 = ((($yy_cp$05$i11)) + 1|0);
      $exitcond = ($328|0)==($298|0);
      if ($exitcond) {
       $yy_bp$1$ph = $300;$yy_cp$1$ph = $298;$yy_current_state$2$ph = $327;
       continue L42;
      } else {
       $yy_cp$05$i11 = $328;$yy_current_state$04$i12 = $327;
      }
     }
    }
    $181 = $$lcssa846;
    $182 = (($$lcssa937) - ($181))|0;
    $183 = (($182) + -1)|0;
    $184 = HEAP32[28>>2]|0;
    $185 = (($184) + ($183)|0);
    HEAP32[60>>2] = $185;
    $186 = HEAP32[40>>2]|0;
    $187 = ($182|0)>(1);
    $188 = $185;
    if ($187) {
     $yy_cp$05$i = $184;$yy_current_state$04$i = $186;
     while(1) {
      $189 = HEAP8[$yy_cp$05$i>>0]|0;
      $190 = ($189<<24>>24)==(0);
      if ($190) {
       $331 = 1;
      } else {
       $191 = $189&255;
       $192 = (64 + ($191<<2)|0);
       $193 = HEAP32[$192>>2]|0;
       $331 = $193;
      }
      $194 = (5566 + ($yy_current_state$04$i<<1)|0);
      $195 = HEAP16[$194>>1]|0;
      $196 = ($195<<16>>16)==(0);
      if ($196) {
       $yy_c$0$ph$in$i = $331;$yy_current_state$1$ph$i = $yy_current_state$04$i;
      } else {
       HEAP32[1088>>2] = $yy_current_state$04$i;
       HEAP32[1092>>2] = $yy_cp$05$i;
       $yy_c$0$ph$in$i = $331;$yy_current_state$1$ph$i = $yy_current_state$04$i;
      }
      L84: while(1) {
       $197 = $yy_c$0$ph$in$i & 255;
       $yy_current_state$1$i = $yy_current_state$1$ph$i;
       while(1) {
        $198 = (5854 + ($yy_current_state$1$i<<1)|0);
        $199 = HEAP16[$198>>1]|0;
        $200 = $199 << 16 >> 16;
        $201 = (($200) + ($197))|0;
        $202 = (6146 + ($201<<1)|0);
        $203 = HEAP16[$202>>1]|0;
        $204 = $203 << 16 >> 16;
        $205 = ($204|0)==($yy_current_state$1$i|0);
        if ($205) {
         $$lcssa941 = $201;
         break L84;
        }
        $206 = (6640 + ($yy_current_state$1$i<<1)|0);
        $207 = HEAP16[$206>>1]|0;
        $208 = $207 << 16 >> 16;
        $209 = ($207<<16>>16)>(143);
        if ($209) {
         $$lcssa943 = $208;
         break;
        } else {
         $yy_current_state$1$i = $208;
        }
       }
       $210 = (1096 + ($197<<2)|0);
       $211 = HEAP32[$210>>2]|0;
       $yy_c$0$ph$in$i = $211;$yy_current_state$1$ph$i = $$lcssa943;
      }
      $212 = (6932 + ($$lcssa941<<1)|0);
      $213 = HEAP16[$212>>1]|0;
      $214 = $213 << 16 >> 16;
      $215 = ((($yy_cp$05$i)) + 1|0);
      $216 = ($215>>>0)<($185>>>0);
      if ($216) {
       $yy_cp$05$i = $215;$yy_current_state$04$i = $214;
      } else {
       $yy_current_state$0$lcssa$i = $214;
       break;
      }
     }
    } else {
     $yy_current_state$0$lcssa$i = $186;
    }
    $217 = (5566 + ($yy_current_state$0$lcssa$i<<1)|0);
    $218 = HEAP16[$217>>1]|0;
    $219 = ($218<<16>>16)==(0);
    if (!($219)) {
     HEAP32[1088>>2] = $yy_current_state$0$lcssa$i;
     HEAP32[1092>>2] = $188;
    }
    $220 = (5854 + ($yy_current_state$0$lcssa$i<<1)|0);
    $221 = HEAP16[$220>>1]|0;
    $222 = $221 << 16 >> 16;
    $223 = (($222) + 1)|0;
    $224 = (6146 + ($223<<1)|0);
    $225 = HEAP16[$224>>1]|0;
    $226 = $225 << 16 >> 16;
    $227 = ($226|0)==($yy_current_state$0$lcssa$i|0);
    if ($227) {
     $$lcssa$i = $223;
    } else {
     $$01$i = $yy_current_state$0$lcssa$i;
     while(1) {
      $228 = (6640 + ($$01$i<<1)|0);
      $229 = HEAP16[$228>>1]|0;
      $230 = $229 << 16 >> 16;
      $231 = (5854 + ($230<<1)|0);
      $232 = HEAP16[$231>>1]|0;
      $233 = $232 << 16 >> 16;
      $234 = (($233) + 1)|0;
      $235 = (6146 + ($234<<1)|0);
      $236 = HEAP16[$235>>1]|0;
      $237 = ($236<<16>>16)==($229<<16>>16);
      if ($237) {
       $$lcssa$i = $234;
       break;
      } else {
       $$01$i = $230;
      }
     }
    }
    $238 = (6932 + ($$lcssa$i<<1)|0);
    $239 = HEAP16[$238>>1]|0;
    $240 = ($239<<16>>16)==(143);
    $241 = ($$lcssa$i|0)==(0);
    $242 = $240 | $241;
    if ($242) {
     $yy_bp$1$ph = $184;$yy_cp$1$ph = $185;$yy_current_state$2$ph = $yy_current_state$0$lcssa$i;
    } else {
     $$lcssa994 = $182;$$lcssa995 = $184;$$lcssa996 = $239;
     label = 111;
     break;
    }
   }
   if ((label|0) == 111) {
    label = 0;
    $243 = $$lcssa996 << 16 >> 16;
    $244 = (($$lcssa995) + ($$lcssa994)|0);
    HEAP32[60>>2] = $244;
    $yy_bp$0$ph = $$lcssa995;$yy_cp$0$ph = $244;$yy_current_state$0$ph = $243;
    continue;
   }
   $256 = $$lcssa847;
   $257 = (($$lcssa938) - ($256))|0;
   $258 = (($257) + -1)|0;
   $259 = HEAP32[28>>2]|0;
   $260 = (($259) + ($258)|0);
   HEAP32[60>>2] = $260;
   $261 = HEAP32[40>>2]|0;
   $262 = ($257|0)>(1);
   if ($262) {
    $yy_cp$05$i2 = $259;$yy_current_state$04$i3 = $261;
   } else {
    $yy_bp$0$ph = $259;$yy_cp$0$ph = $260;$yy_current_state$0$ph = $261;
    continue;
   }
   while(1) {
    $263 = HEAP8[$yy_cp$05$i2>>0]|0;
    $264 = ($263<<24>>24)==(0);
    if ($264) {
     $332 = 1;
    } else {
     $265 = $263&255;
     $266 = (64 + ($265<<2)|0);
     $267 = HEAP32[$266>>2]|0;
     $332 = $267;
    }
    $268 = (5566 + ($yy_current_state$04$i3<<1)|0);
    $269 = HEAP16[$268>>1]|0;
    $270 = ($269<<16>>16)==(0);
    if ($270) {
     $yy_c$0$ph$in$i6 = $332;$yy_current_state$1$ph$i5 = $yy_current_state$04$i3;
    } else {
     HEAP32[1088>>2] = $yy_current_state$04$i3;
     HEAP32[1092>>2] = $yy_cp$05$i2;
     $yy_c$0$ph$in$i6 = $332;$yy_current_state$1$ph$i5 = $yy_current_state$04$i3;
    }
    L109: while(1) {
     $271 = $yy_c$0$ph$in$i6 & 255;
     $yy_current_state$1$i8 = $yy_current_state$1$ph$i5;
     while(1) {
      $272 = (5854 + ($yy_current_state$1$i8<<1)|0);
      $273 = HEAP16[$272>>1]|0;
      $274 = $273 << 16 >> 16;
      $275 = (($274) + ($271))|0;
      $276 = (6146 + ($275<<1)|0);
      $277 = HEAP16[$276>>1]|0;
      $278 = $277 << 16 >> 16;
      $279 = ($278|0)==($yy_current_state$1$i8|0);
      if ($279) {
       $$lcssa997 = $275;
       break L109;
      }
      $280 = (6640 + ($yy_current_state$1$i8<<1)|0);
      $281 = HEAP16[$280>>1]|0;
      $282 = $281 << 16 >> 16;
      $283 = ($281<<16>>16)>(143);
      if ($283) {
       $$lcssa999 = $282;
       break;
      } else {
       $yy_current_state$1$i8 = $282;
      }
     }
     $284 = (1096 + ($271<<2)|0);
     $285 = HEAP32[$284>>2]|0;
     $yy_c$0$ph$in$i6 = $285;$yy_current_state$1$ph$i5 = $$lcssa999;
    }
    $286 = (6932 + ($$lcssa997<<1)|0);
    $287 = HEAP16[$286>>1]|0;
    $288 = $287 << 16 >> 16;
    $289 = ((($yy_cp$05$i2)) + 1|0);
    $290 = ($289>>>0)<($260>>>0);
    if ($290) {
     $yy_cp$05$i2 = $289;$yy_current_state$04$i3 = $288;
    } else {
     $yy_bp$0$ph = $259;$yy_cp$0$ph = $260;$yy_current_state$0$ph = $288;
     continue L29;
    }
   }
  }
  if ((label|0) == 62) {
   label = 0;
   $111 = HEAP32[1432>>2]|0;
   $112 = (($111) + 1)|0;
   HEAP32[1432>>2] = $112;
   continue;
  }
  else if ((label|0) == 63) {
   L118: while(1) {
    label = 0;
    $113 = (_input()|0);
    switch ($113|0) {
    case -1:  {
     break L118;
     break;
    }
    case 10:  {
     $114 = HEAP32[1432>>2]|0;
     $115 = (($114) + 1)|0;
     HEAP32[1432>>2] = $115;
     label = 63;
     continue L118;
     break;
    }
    case 42:  {
     break;
    }
    default: {
     label = 63;
     continue L118;
    }
    }
    L122: while(1) {
     $116 = (_input()|0);
     switch ($116|0) {
     case 47:  {
      continue L27;
      break;
     }
     case -1:  {
      break L118;
      break;
     }
     case 42:  {
      break;
     }
     case 10:  {
      break L122;
      break;
     }
     default: {
      label = 63;
      continue L118;
     }
     }
    }
    $117 = HEAP32[1432>>2]|0;
    $118 = (($117) + 1)|0;
    HEAP32[1432>>2] = $118;
    label = 63;
   }
   (_fwrite(8899,30,1,$45)|0);
   continue;
  }
  else if ((label|0) == 86) {
   label = 0;
   $149 = HEAP32[28>>2]|0;
   $150 = HEAP8[$149>>0]|0;
   $151 = $150 << 24 >> 24;
   $152 = ($150<<24>>24)<(32);
   if ($152) {
    $153 = (($151) + 64)|0;
    HEAP32[$vararg_buffer1>>2] = $153;
    _yyerror(8955,$vararg_buffer1);
    continue;
   }
   $154 = ($150<<24>>24)==(127);
   if ($154) {
    HEAP32[$vararg_buffer3>>2] = $151;
    _yyerror(8978,$vararg_buffer3);
    continue;
   } else {
    HEAP32[$vararg_buffer6>>2] = $149;
    _yyerror(9002,$vararg_buffer6);
    continue;
   }
  }
  else if ((label|0) == 91) {
   label = 0;
   $155 = HEAP32[28>>2]|0;
   $156 = HEAP32[32>>2]|0;
   $157 = HEAP32[24>>2]|0;
   (_fwrite($155,$156,1,$157)|0);
   continue;
  }
  else if ((label|0) == 115) {
   label = 0;
   $253 = HEAP32[1308>>2]|0;
   $254 = ($253|0)==(0);
   if (!($254)) {
    continue;
   }
   $255 = HEAP32[20>>2]|0;
   _yyrestart($255);
   continue;
  }
 }
 switch (label|0) {
  case 35: {
   $$0 = 274;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 36: {
   $$0 = 275;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 37: {
   $$0 = 276;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 38: {
   $$0 = 277;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 39: {
   $$0 = 279;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 40: {
   $$0 = 280;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 41: {
   $$0 = 281;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 42: {
   $$0 = 282;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 43: {
   $$0 = 278;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 44: {
   $$0 = 283;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 45: {
   $$0 = 285;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 46: {
   $$0 = 286;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 47: {
   $$0 = 284;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 48: {
   $$0 = 287;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 49: {
   $$0 = 288;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 50: {
   $$0 = 289;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 51: {
   $$0 = 286;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 52: {
   $94 = HEAP32[28>>2]|0;
   $95 = HEAP8[$94>>0]|0;
   HEAP8[16>>0] = $95;
   $96 = HEAP8[$94>>0]|0;
   $97 = $96 << 24 >> 24;
   $$0 = $97;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 53: {
   $$0 = 259;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 54: {
   $$0 = 260;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 55: {
   $$0 = 261;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 56: {
   $98 = HEAP32[28>>2]|0;
   $99 = HEAP8[$98>>0]|0;
   HEAP8[16>>0] = $99;
   $$0 = 265;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 57: {
   $100 = HEAP32[28>>2]|0;
   $101 = HEAP8[$100>>0]|0;
   HEAP8[16>>0] = $101;
   $$0 = 266;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 58: {
   HEAP8[16>>0] = 61;
   $102 = HEAP8[8898>>0]|0;
   HEAP8[$yy_cp$2$lcssa878>>0] = $102;
   $103 = ((($yy_bp$1$ph$lcssa978)) + 1|0);
   HEAP32[60>>2] = $103;
   HEAP32[28>>2] = $yy_bp$1$ph$lcssa978;
   HEAP32[32>>2] = 1;
   $104 = HEAP8[$103>>0]|0;
   HEAP8[8898>>0] = $104;
   HEAP8[$103>>0] = 0;
   HEAP32[60>>2] = $103;
   $$0 = 266;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 59: {
   $105 = HEAP32[28>>2]|0;
   $106 = (_strcopyof($105)|0);
   HEAP32[16>>2] = $106;
   $$0 = 267;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 60: {
   $107 = HEAP32[28>>2]|0;
   $108 = HEAP8[$107>>0]|0;
   HEAP8[16>>0] = $108;
   $$0 = 268;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 61: {
   $109 = HEAP32[1432>>2]|0;
   $110 = (($109) + 1)|0;
   HEAP32[1432>>2] = $110;
   $$0 = 258;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 68: {
   $119 = HEAP32[28>>2]|0;
   $120 = (_strcopyof($119)|0);
   HEAP32[16>>2] = $120;
   $$0 = 263;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 69: {
   $121 = HEAP32[28>>2]|0;
   $122 = (_strcopyof($121)|0);
   HEAP32[16>>2] = $122;
   $123 = HEAP32[28>>2]|0;
   $count$0 = 0;$look$0 = $123;
   L203: while(1) {
    $124 = HEAP8[$look$0>>0]|0;
    switch ($124<<24>>24) {
    case 0:  {
     $count$0$lcssa = $count$0;
     break L203;
     break;
    }
    case 10:  {
     $125 = HEAP32[1432>>2]|0;
     $126 = (($125) + 1)|0;
     HEAP32[1432>>2] = $126;
     $$pre336 = HEAP8[$look$0>>0]|0;
     $127 = $$pre336;
     break;
    }
    default: {
     $127 = $124;
    }
    }
    $128 = ($127<<24>>24)==(34);
    $129 = $128&1;
    $$count$0 = (($129) + ($count$0))|0;
    $130 = ((($look$0)) + 1|0);
    $count$0 = $$count$0;$look$0 = $130;
   }
   $131 = ($count$0$lcssa|0)==(2);
   if ($131) {
    $$0 = 262;
    STACKTOP = sp;return ($$0|0);
   }
   _yyerror(8930,$vararg_buffer);
   $$0 = 262;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 75: {
   $132 = HEAP32[28>>2]|0;
   $133 = (_strlen($132)|0);
   $134 = (($133) + -1)|0;
   $135 = (($132) + ($134)|0);
   $136 = HEAP8[$135>>0]|0;
   $137 = ($136<<24>>24)==(46);
   if ($137) {
    HEAP8[$135>>0] = 0;
    $$pre335 = HEAP32[28>>2]|0;
    $330 = $$pre335;
   } else {
    $330 = $132;
   }
   $src$0 = $330;
   L217: while(1) {
    $138 = HEAP8[$src$0>>0]|0;
    switch ($138<<24>>24) {
    case 0:  {
     $src$0$lcssa840 = $src$0;
     label = 80;
     break L217;
     break;
    }
    case 48:  {
     break;
    }
    default: {
     $dst$0$ph = $330;$src$1$ph22 = $src$0;
     break L217;
    }
    }
    $139 = ((($src$0)) + 1|0);
    $src$0 = $139;
   }
   if ((label|0) == 80) {
    $140 = ((($src$0$lcssa840)) + -1|0);
    $dst$0$ph = $330;$src$1$ph22 = $140;
   }
   L222: while(1) {
    $src$1 = $src$1$ph22;
    L224: while(1) {
     $141 = HEAP8[$src$1>>0]|0;
     switch ($141<<24>>24) {
     case 0:  {
      $dst$0$ph$lcssa = $dst$0$ph;
      break L222;
      break;
     }
     case 92:  {
      break;
     }
     default: {
      $$lcssa = $141;$src$1$lcssa = $src$1;
      break L224;
     }
     }
     $142 = ((($src$1)) + 2|0);
     $143 = HEAP32[1432>>2]|0;
     $144 = (($143) + 1)|0;
     HEAP32[1432>>2] = $144;
     $src$1 = $142;
    }
    $145 = ((($src$1$lcssa)) + 1|0);
    $146 = ((($dst$0$ph)) + 1|0);
    HEAP8[$dst$0$ph>>0] = $$lcssa;
    $dst$0$ph = $146;$src$1$ph22 = $145;
   }
   HEAP8[$dst$0$ph$lcssa>>0] = 0;
   $147 = HEAP32[28>>2]|0;
   $148 = (_strcopyof($147)|0);
   HEAP32[16>>2] = $148;
   $$0 = 264;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 92: {
   $$0 = 0;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 137: {
   _yy_fatal_error(9024);
   // unreachable;
   break;
  }
  case 138: {
   $$0 = 269;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 139: {
   $$0 = 270;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 140: {
   $$0 = 271;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 141: {
   $$0 = 272;
   STACKTOP = sp;return ($$0|0);
   break;
  }
  case 142: {
   STACKTOP = sp;return ($$0|0);
   break;
  }
 }
 return (0)|0;
}
function _yy_create_buffer($file,$size) {
 $file = $file|0;
 $size = $size|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_malloc(48)|0);
 $1 = ($0|0)==(0|0);
 if ($1) {
  _yy_fatal_error(9075);
  // unreachable;
 }
 $2 = ((($0)) + 12|0);
 HEAP32[$2>>2] = $size;
 $3 = (($size) + 2)|0;
 $4 = (_malloc($3)|0);
 $5 = ((($0)) + 4|0);
 HEAP32[$5>>2] = $4;
 $6 = ($4|0)==(0|0);
 if ($6) {
  _yy_fatal_error(9075);
  // unreachable;
 }
 $7 = $4;
 $8 = ((($0)) + 20|0);
 HEAP32[$8>>2] = 1;
 $9 = (___errno_location()|0);
 $10 = HEAP32[$9>>2]|0;
 $11 = ((($0)) + 16|0);
 HEAP32[$11>>2] = 0;
 HEAP8[$4>>0] = 0;
 $12 = ((($4)) + 1|0);
 HEAP8[$12>>0] = 0;
 $13 = ((($0)) + 8|0);
 HEAP32[$13>>2] = $7;
 $14 = ((($0)) + 28|0);
 HEAP32[$14>>2] = 1;
 $15 = ((($0)) + 44|0);
 HEAP32[$15>>2] = 0;
 $16 = HEAP32[44>>2]|0;
 $17 = ($16|0)==(0|0);
 if ($17) {
  $21 = 0;
 } else {
  $18 = HEAP32[48>>2]|0;
  $19 = (($16) + ($18<<2)|0);
  $20 = HEAP32[$19>>2]|0;
  $21 = $20;
 }
 $22 = ($21|0)==($0|0);
 if ($22) {
  $23 = HEAP32[48>>2]|0;
  $24 = (($16) + ($23<<2)|0);
  $25 = HEAP32[$24>>2]|0;
  $26 = ((($25)) + 16|0);
  $27 = HEAP32[$26>>2]|0;
  HEAP32[56>>2] = $27;
  $28 = ((($25)) + 8|0);
  $29 = HEAP32[$28>>2]|0;
  HEAP32[60>>2] = $29;
  HEAP32[28>>2] = $29;
  $30 = HEAP32[$24>>2]|0;
  $31 = HEAP32[$30>>2]|0;
  HEAP32[20>>2] = $31;
  $32 = $29;
  $33 = HEAP8[$32>>0]|0;
  HEAP8[8898>>0] = $33;
 }
 HEAP32[$0>>2] = $file;
 $34 = ((($0)) + 40|0);
 HEAP32[$34>>2] = 1;
 if ($17) {
  $38 = 0;
 } else {
  $35 = HEAP32[48>>2]|0;
  $36 = (($16) + ($35<<2)|0);
  $37 = HEAP32[$36>>2]|0;
  $38 = $37;
 }
 $39 = ($38|0)==($0|0);
 if (!($39)) {
  $40 = ((($0)) + 32|0);
  HEAP32[$40>>2] = 1;
  $41 = ((($0)) + 36|0);
  HEAP32[$41>>2] = 0;
 }
 $42 = ($file|0)==(0|0);
 if ($42) {
  $48 = 0;
  $47 = ((($0)) + 24|0);
  HEAP32[$47>>2] = $48;
  HEAP32[$9>>2] = $10;
  return ($0|0);
 }
 $43 = (_fileno($file)|0);
 $44 = (_isatty($43)|0);
 $45 = ($44|0)>(0);
 $46 = $45&1;
 $48 = $46;
 $47 = ((($0)) + 24|0);
 HEAP32[$47>>2] = $48;
 HEAP32[$9>>2] = $10;
 return ($0|0);
}
function _yyrestart($input_file) {
 $input_file = $input_file|0;
 var $$pre = 0, $$pre2 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[44>>2]|0;
 $1 = ($0|0)==(0|0);
 do {
  if ($1) {
   $6 = (_malloc(4)|0);
   HEAP32[44>>2] = $6;
   $7 = ($6|0)==(0|0);
   if ($7) {
    _yy_fatal_error(8849);
    // unreachable;
   } else {
    HEAP32[$6>>2] = 0;
    HEAP32[52>>2] = 1;
    HEAP32[48>>2] = 0;
    label = 10;
    break;
   }
  } else {
   $2 = HEAP32[48>>2]|0;
   $3 = (($0) + ($2<<2)|0);
   $4 = HEAP32[$3>>2]|0;
   $5 = ($4|0)==(0|0);
   if ($5) {
    $8 = HEAP32[52>>2]|0;
    $9 = (($8) + -1)|0;
    $10 = ($2>>>0)<($9>>>0);
    if ($10) {
     label = 10;
    } else {
     $11 = (($8) + 8)|0;
     $12 = $11 << 2;
     $13 = (_realloc($0,$12)|0);
     HEAP32[44>>2] = $13;
     $14 = ($13|0)==(0|0);
     if ($14) {
      _yy_fatal_error(8849);
      // unreachable;
     } else {
      $15 = HEAP32[52>>2]|0;
      $16 = (($13) + ($15<<2)|0);
      ;HEAP32[$16>>2]=0|0;HEAP32[$16+4>>2]=0|0;HEAP32[$16+8>>2]=0|0;HEAP32[$16+12>>2]=0|0;HEAP32[$16+16>>2]=0|0;HEAP32[$16+20>>2]=0|0;HEAP32[$16+24>>2]=0|0;HEAP32[$16+28>>2]=0|0;
      HEAP32[52>>2] = $11;
      label = 10;
      break;
     }
    }
   } else {
    $26 = $0;$27 = $2;
    label = 12;
   }
  }
 } while(0);
 if ((label|0) == 10) {
  $17 = HEAP32[20>>2]|0;
  $18 = (_yy_create_buffer($17,16384)|0);
  $19 = HEAP32[48>>2]|0;
  $20 = HEAP32[44>>2]|0;
  $21 = (($20) + ($19<<2)|0);
  HEAP32[$21>>2] = $18;
  $$pre = HEAP32[44>>2]|0;
  $22 = ($$pre|0)==(0|0);
  if ($22) {
   $23 = (___errno_location()|0);
   $24 = HEAP32[$23>>2]|0;
   $59 = 0;$77 = $24;$78 = $23;
  } else {
   $26 = $$pre;$27 = $19;
   label = 12;
  }
 }
 if ((label|0) == 12) {
  $25 = (($26) + ($27<<2)|0);
  $28 = HEAP32[$25>>2]|0;
  $29 = (___errno_location()|0);
  $30 = HEAP32[$29>>2]|0;
  $31 = ($28|0)==(0|0);
  if ($31) {
   $59 = 0;$77 = $30;$78 = $29;
  } else {
   $32 = ((($28)) + 16|0);
   HEAP32[$32>>2] = 0;
   $33 = ((($28)) + 4|0);
   $34 = HEAP32[$33>>2]|0;
   HEAP8[$34>>0] = 0;
   $35 = HEAP32[$33>>2]|0;
   $36 = ((($35)) + 1|0);
   HEAP8[$36>>0] = 0;
   $37 = HEAP32[$33>>2]|0;
   $38 = ((($28)) + 8|0);
   HEAP32[$38>>2] = $37;
   $39 = ((($28)) + 28|0);
   HEAP32[$39>>2] = 1;
   $40 = ((($28)) + 44|0);
   HEAP32[$40>>2] = 0;
   $41 = HEAP32[44>>2]|0;
   $42 = ($41|0)==(0|0);
   if ($42) {
    $46 = 0;
   } else {
    $43 = HEAP32[48>>2]|0;
    $44 = (($41) + ($43<<2)|0);
    $45 = HEAP32[$44>>2]|0;
    $46 = $45;
   }
   $47 = ($46|0)==($28|0);
   if ($47) {
    $48 = HEAP32[48>>2]|0;
    $49 = (($41) + ($48<<2)|0);
    $50 = HEAP32[$49>>2]|0;
    $51 = ((($50)) + 16|0);
    $52 = HEAP32[$51>>2]|0;
    HEAP32[56>>2] = $52;
    $53 = ((($50)) + 8|0);
    $54 = HEAP32[$53>>2]|0;
    HEAP32[60>>2] = $54;
    HEAP32[28>>2] = $54;
    $55 = HEAP32[$49>>2]|0;
    $56 = HEAP32[$55>>2]|0;
    HEAP32[20>>2] = $56;
    $57 = $54;
    $58 = HEAP8[$57>>0]|0;
    HEAP8[8898>>0] = $58;
    $59 = $28;$77 = $30;$78 = $29;
   } else {
    $59 = $28;$77 = $30;$78 = $29;
   }
  }
 }
 HEAP32[$59>>2] = $input_file;
 $60 = ((($59)) + 40|0);
 HEAP32[$60>>2] = 1;
 $61 = HEAP32[44>>2]|0;
 $62 = ($61|0)==(0|0);
 if ($62) {
  $66 = 0;
 } else {
  $63 = HEAP32[48>>2]|0;
  $64 = (($61) + ($63<<2)|0);
  $65 = HEAP32[$64>>2]|0;
  $66 = $65;
 }
 $67 = ($66|0)==($59|0);
 if (!($67)) {
  $68 = ((($59)) + 32|0);
  HEAP32[$68>>2] = 1;
  $69 = ((($59)) + 36|0);
  HEAP32[$69>>2] = 0;
 }
 $70 = ($input_file|0)==(0|0);
 if ($70) {
  $76 = 0;$81 = $61;
  $75 = ((($59)) + 24|0);
  HEAP32[$75>>2] = $76;
  HEAP32[$78>>2] = $77;
  $79 = HEAP32[48>>2]|0;
  $80 = (($81) + ($79<<2)|0);
  $82 = HEAP32[$80>>2]|0;
  $83 = ((($82)) + 16|0);
  $84 = HEAP32[$83>>2]|0;
  HEAP32[56>>2] = $84;
  $85 = ((($82)) + 8|0);
  $86 = HEAP32[$85>>2]|0;
  HEAP32[60>>2] = $86;
  HEAP32[28>>2] = $86;
  $87 = HEAP32[$80>>2]|0;
  $88 = HEAP32[$87>>2]|0;
  HEAP32[20>>2] = $88;
  $89 = $86;
  $90 = HEAP8[$89>>0]|0;
  HEAP8[8898>>0] = $90;
  return;
 }
 $71 = (_fileno($input_file)|0);
 $72 = (_isatty($71)|0);
 $73 = ($72|0)>(0);
 $74 = $73&1;
 $$pre2 = HEAP32[44>>2]|0;
 $76 = $74;$81 = $$pre2;
 $75 = ((($59)) + 24|0);
 HEAP32[$75>>2] = $76;
 HEAP32[$78>>2] = $77;
 $79 = HEAP32[48>>2]|0;
 $80 = (($81) + ($79<<2)|0);
 $82 = HEAP32[$80>>2]|0;
 $83 = ((($82)) + 16|0);
 $84 = HEAP32[$83>>2]|0;
 HEAP32[56>>2] = $84;
 $85 = ((($82)) + 8|0);
 $86 = HEAP32[$85>>2]|0;
 HEAP32[60>>2] = $86;
 HEAP32[28>>2] = $86;
 $87 = HEAP32[$80>>2]|0;
 $88 = HEAP32[$87>>2]|0;
 HEAP32[20>>2] = $88;
 $89 = $86;
 $90 = HEAP8[$89>>0]|0;
 HEAP8[8898>>0] = $90;
 return;
}
function _yy_fatal_error($msg) {
 $msg = $msg|0;
 var $0 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = HEAP32[1736>>2]|0;
 HEAP32[$vararg_buffer>>2] = $msg;
 (_fprintf($0,9295,$vararg_buffer)|0);
 _exit(2);
 // unreachable;
}
function _input() {
 var $$0 = 0, $$lcssa = 0, $$lcssa33 = 0, $$lcssa36 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP8[8898>>0]|0;
 $1 = HEAP32[60>>2]|0;
 HEAP8[$1>>0] = $0;
 $2 = HEAP32[60>>2]|0;
 $3 = HEAP8[$2>>0]|0;
 $4 = ($3<<24>>24)==(0);
 L1: do {
  if ($4) {
   $13 = $2;
   L2: while(1) {
    $5 = HEAP32[56>>2]|0;
    $6 = HEAP32[48>>2]|0;
    $7 = HEAP32[44>>2]|0;
    $8 = (($7) + ($6<<2)|0);
    $9 = HEAP32[$8>>2]|0;
    $10 = ((($9)) + 4|0);
    $11 = HEAP32[$10>>2]|0;
    $12 = (($11) + ($5)|0);
    $14 = ($13>>>0)<($12>>>0);
    if ($14) {
     $$lcssa = $13;
     label = 3;
     break;
    }
    $15 = HEAP32[28>>2]|0;
    $16 = ((($13)) + 1|0);
    HEAP32[60>>2] = $16;
    $17 = (_yy_get_next_buffer()|0);
    switch ($17|0) {
    case 0:  {
     $$lcssa33 = $13;$$lcssa36 = $15;
     label = 10;
     break L2;
     break;
    }
    case 2:  {
     $18 = HEAP32[20>>2]|0;
     _yyrestart($18);
     break;
    }
    case 1:  {
     break;
    }
    default: {
     break L1;
    }
    }
    $19 = (_open_new_file()|0);
    $20 = ($19|0)==(0);
    if ($20) {
     $$0 = -1;
     label = 12;
     break;
    }
    $21 = HEAP32[1308>>2]|0;
    $22 = ($21|0)==(0);
    if ($22) {
     $28 = HEAP32[20>>2]|0;
     _yyrestart($28);
    }
    $23 = HEAP8[8898>>0]|0;
    $24 = HEAP32[60>>2]|0;
    HEAP8[$24>>0] = $23;
    $25 = HEAP32[60>>2]|0;
    $26 = HEAP8[$25>>0]|0;
    $27 = ($26<<24>>24)==(0);
    if ($27) {
     $13 = $25;
    } else {
     break L1;
    }
   }
   if ((label|0) == 3) {
    HEAP8[$$lcssa>>0] = 0;
    break;
   }
   else if ((label|0) == 10) {
    $29 = $$lcssa33;
    $30 = $$lcssa36;
    $31 = (($29) - ($30))|0;
    $32 = HEAP32[28>>2]|0;
    $33 = (($32) + ($31)|0);
    HEAP32[60>>2] = $33;
    break;
   }
   else if ((label|0) == 12) {
    return ($$0|0);
   }
  }
 } while(0);
 $34 = HEAP32[60>>2]|0;
 $35 = HEAP8[$34>>0]|0;
 $36 = $35&255;
 HEAP8[$34>>0] = 0;
 $37 = HEAP32[60>>2]|0;
 $38 = ((($37)) + 1|0);
 HEAP32[60>>2] = $38;
 $39 = HEAP8[$38>>0]|0;
 HEAP8[8898>>0] = $39;
 $$0 = $36;
 return ($$0|0);
}
function _yy_get_next_buffer() {
 var $$ = 0, $$0 = 0, $$36 = 0, $$lcssa = 0, $$lcssa48 = 0, $$num_to_read$0 = 0, $$phi$trans$insert = 0, $$phi$trans$insert29 = 0, $$pn = 0, $$pn$in = 0, $$pn$in8 = 0, $$pn9 = 0, $$pre = 0, $$pre23 = 0, $$pre24 = 0, $$pre25 = 0, $$pre27 = 0, $$pre30 = 0, $0 = 0, $1 = 0;
 var $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0;
 var $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $14 = 0, $15 = 0, $16 = 0;
 var $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0;
 var $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0;
 var $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0;
 var $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0;
 var $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $dest$014 = 0, $i$012 = 0, $num_to_read$0 = 0, $num_to_read$0$in = 0, $num_to_read$0$in10 = 0, $num_to_read$0$lcssa = 0, $num_to_read$011 = 0, $ret_val$0 = 0, $source$013 = 0;
 var $storemerge1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[48>>2]|0;
 $1 = HEAP32[44>>2]|0;
 $2 = (($1) + ($0<<2)|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ((($3)) + 4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = HEAP32[28>>2]|0;
 $7 = HEAP32[60>>2]|0;
 $8 = HEAP32[56>>2]|0;
 $9 = (($8) + 1)|0;
 $10 = (($5) + ($9)|0);
 $11 = ($7>>>0)>($10>>>0);
 if ($11) {
  _yy_fatal_error(9119);
  // unreachable;
 }
 $12 = ((($3)) + 40|0);
 $13 = HEAP32[$12>>2]|0;
 $14 = ($13|0)==(0);
 $15 = $7;
 $16 = $6;
 $17 = (($15) - ($16))|0;
 if ($14) {
  $18 = ($17|0)==(1);
  $$ = $18 ? 1 : 2;
  $$0 = $$;
  return ($$0|0);
 }
 $19 = (($17) + -1)|0;
 $20 = ($17|0)>(1);
 if ($20) {
  $dest$014 = $5;$i$012 = 0;$source$013 = $6;
  while(1) {
   $21 = ((($source$013)) + 1|0);
   $22 = HEAP8[$source$013>>0]|0;
   $23 = ((($dest$014)) + 1|0);
   HEAP8[$dest$014>>0] = $22;
   $24 = (($i$012) + 1)|0;
   $25 = ($24|0)<($19|0);
   if ($25) {
    $dest$014 = $23;$i$012 = $24;$source$013 = $21;
   } else {
    break;
   }
  }
  $$pre = HEAP32[48>>2]|0;
  $$pre23 = HEAP32[44>>2]|0;
  $$phi$trans$insert = (($$pre23) + ($$pre<<2)|0);
  $$pre24 = HEAP32[$$phi$trans$insert>>2]|0;
  $132 = $$pre23;$27 = $$pre24;
 } else {
  $132 = $1;$27 = $3;
 }
 $26 = ((($27)) + 44|0);
 $28 = HEAP32[$26>>2]|0;
 $29 = ($28|0)==(2);
 do {
  if ($29) {
   HEAP32[56>>2] = 0;
   $31 = ((($27)) + 16|0);
   HEAP32[$31>>2] = 0;
   $85 = $132;
  } else {
   $$pn$in8 = ((($27)) + 12|0);
   $$pn9 = HEAP32[$$pn$in8>>2]|0;
   $num_to_read$0$in10 = (($$pn9) - ($19))|0;
   $num_to_read$011 = (($num_to_read$0$in10) + -1)|0;
   $30 = ($num_to_read$011|0)<(1);
   L16: do {
    if ($30) {
     $32 = $132;$34 = $27;
     while(1) {
      $33 = ($32|0)==(0|0);
      $$36 = $33 ? 0 : $34;
      $35 = HEAP32[60>>2]|0;
      $36 = ((($$36)) + 4|0);
      $37 = HEAP32[$36>>2]|0;
      $38 = $35;
      $39 = $37;
      $40 = (($38) - ($39))|0;
      $41 = ((($$36)) + 20|0);
      $42 = HEAP32[$41>>2]|0;
      $43 = ($42|0)==(0);
      if ($43) {
       $$lcssa48 = $36;
       break;
      }
      $44 = ((($$36)) + 12|0);
      $45 = HEAP32[$44>>2]|0;
      $46 = $45 << 1;
      $47 = ($46|0)<(1);
      $48 = $45 >>> 3;
      $49 = (($48) + ($45))|0;
      $storemerge1 = $47 ? $49 : $46;
      HEAP32[$44>>2] = $storemerge1;
      $50 = (($storemerge1) + 2)|0;
      $51 = (_realloc($37,$50)|0);
      HEAP32[$36>>2] = $51;
      $52 = ($51|0)==(0|0);
      if ($52) {
       label = 14;
       break;
      }
      $53 = (($51) + ($40)|0);
      HEAP32[60>>2] = $53;
      $54 = HEAP32[48>>2]|0;
      $55 = HEAP32[44>>2]|0;
      $56 = (($55) + ($54<<2)|0);
      $57 = HEAP32[$56>>2]|0;
      $$pn$in = ((($57)) + 12|0);
      $$pn = HEAP32[$$pn$in>>2]|0;
      $num_to_read$0$in = (($$pn) - ($19))|0;
      $num_to_read$0 = (($num_to_read$0$in) + -1)|0;
      $58 = ($num_to_read$0|0)<(1);
      if ($58) {
       $32 = $55;$34 = $57;
      } else {
       $num_to_read$0$lcssa = $num_to_read$0;
       break L16;
      }
     }
     if ((label|0) == 14) {
      _yy_fatal_error(9175);
      // unreachable;
     }
     HEAP32[$$lcssa48>>2] = 0;
     _yy_fatal_error(9175);
     // unreachable;
    } else {
     $num_to_read$0$lcssa = $num_to_read$011;
    }
   } while(0);
   $59 = ($num_to_read$0$lcssa|0)>(8192);
   $$num_to_read$0 = $59 ? 8192 : $num_to_read$0$lcssa;
   while(1) {
    $60 = HEAP32[20>>2]|0;
    $61 = (_fileno($60)|0);
    $62 = HEAP32[48>>2]|0;
    $63 = HEAP32[44>>2]|0;
    $64 = (($63) + ($62<<2)|0);
    $65 = HEAP32[$64>>2]|0;
    $66 = ((($65)) + 4|0);
    $67 = HEAP32[$66>>2]|0;
    $68 = (($67) + ($19)|0);
    $69 = (_read($61,$68,$$num_to_read$0)|0);
    HEAP32[56>>2] = $69;
    $70 = ($69|0)<(0);
    if (!($70)) {
     $$lcssa = $69;
     label = 20;
     break;
    }
    $71 = (___errno_location()|0);
    $72 = HEAP32[$71>>2]|0;
    $73 = ($72|0)==(4);
    if (!($73)) {
     label = 19;
     break;
    }
   }
   if ((label|0) == 19) {
    _yy_fatal_error(9219);
    // unreachable;
   }
   else if ((label|0) == 20) {
    $74 = HEAP32[48>>2]|0;
    $75 = HEAP32[44>>2]|0;
    $76 = (($75) + ($74<<2)|0);
    $77 = HEAP32[$76>>2]|0;
    $78 = ((($77)) + 16|0);
    HEAP32[$78>>2] = $$lcssa;
    $85 = $75;
    break;
   }
  }
 } while(0);
 $79 = HEAP32[56>>2]|0;
 $80 = ($79|0)==(0);
 do {
  if ($80) {
   $81 = ($19|0)==(0);
   if ($81) {
    $82 = HEAP32[20>>2]|0;
    _yyrestart($82);
    $$pre25 = HEAP32[44>>2]|0;
    $92 = $$pre25;$ret_val$0 = 1;
    break;
   } else {
    $83 = HEAP32[48>>2]|0;
    $84 = (($85) + ($83<<2)|0);
    $86 = HEAP32[$84>>2]|0;
    $87 = ((($86)) + 44|0);
    HEAP32[$87>>2] = 2;
    $92 = $85;$ret_val$0 = 2;
    break;
   }
  } else {
   $92 = $85;$ret_val$0 = 0;
  }
 } while(0);
 $88 = HEAP32[56>>2]|0;
 $89 = (($88) + ($19))|0;
 $90 = HEAP32[48>>2]|0;
 $91 = (($92) + ($90<<2)|0);
 $93 = HEAP32[$91>>2]|0;
 $94 = ((($93)) + 12|0);
 $95 = HEAP32[$94>>2]|0;
 $96 = ($89>>>0)>($95>>>0);
 do {
  if ($96) {
   $97 = $88 >> 1;
   $98 = (($89) + ($97))|0;
   $99 = ((($93)) + 4|0);
   $100 = HEAP32[$99>>2]|0;
   $101 = (_realloc($100,$98)|0);
   $102 = HEAP32[48>>2]|0;
   $103 = HEAP32[44>>2]|0;
   $104 = (($103) + ($102<<2)|0);
   $105 = HEAP32[$104>>2]|0;
   $106 = ((($105)) + 4|0);
   HEAP32[$106>>2] = $101;
   $107 = HEAP32[44>>2]|0;
   $108 = (($107) + ($102<<2)|0);
   $109 = HEAP32[$108>>2]|0;
   $110 = ((($109)) + 4|0);
   $111 = HEAP32[$110>>2]|0;
   $112 = ($111|0)==(0|0);
   if ($112) {
    _yy_fatal_error(9249);
    // unreachable;
   } else {
    $$pre27 = HEAP32[56>>2]|0;
    $114 = $$pre27;$116 = $111;
    break;
   }
  } else {
   $$phi$trans$insert29 = ((($93)) + 4|0);
   $$pre30 = HEAP32[$$phi$trans$insert29>>2]|0;
   $114 = $88;$116 = $$pre30;
  }
 } while(0);
 $113 = (($114) + ($19))|0;
 HEAP32[56>>2] = $113;
 $115 = (($116) + ($113)|0);
 HEAP8[$115>>0] = 0;
 $117 = HEAP32[56>>2]|0;
 $118 = (($117) + 1)|0;
 $119 = HEAP32[48>>2]|0;
 $120 = HEAP32[44>>2]|0;
 $121 = (($120) + ($119<<2)|0);
 $122 = HEAP32[$121>>2]|0;
 $123 = ((($122)) + 4|0);
 $124 = HEAP32[$123>>2]|0;
 $125 = (($124) + ($118)|0);
 HEAP8[$125>>0] = 0;
 $126 = HEAP32[48>>2]|0;
 $127 = HEAP32[44>>2]|0;
 $128 = (($127) + ($126<<2)|0);
 $129 = HEAP32[$128>>2]|0;
 $130 = ((($129)) + 4|0);
 $131 = HEAP32[$130>>2]|0;
 HEAP32[28>>2] = $131;
 $$0 = $ret_val$0;
 return ($$0|0);
}
function _strcopyof($str) {
 $str = $str|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_strlen($str)|0);
 $1 = (($0) + 1)|0;
 $2 = (_malloc($1)|0);
 $3 = ($2|0)==(0|0);
 if ($3) {
  _out_of_memory();
  // unreachable;
 } else {
  $4 = (_strcpy($2,$str)|0);
  return ($4|0);
 }
 return (0)|0;
}
function _bc_malloc($size) {
 $size = $size|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_malloc($size)|0);
 $1 = ($0|0)==(0|0);
 if ($1) {
  _out_of_memory();
  // unreachable;
 } else {
  return ($0|0);
 }
 return (0)|0;
}
function _nextarg($args,$val) {
 $args = $args|0;
 $val = $val|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_malloc(8)|0);
 $1 = ($0|0)==(0|0);
 if ($1) {
  _out_of_memory();
  // unreachable;
 } else {
  HEAP32[$0>>2] = $val;
  $2 = ((($0)) + 4|0);
  HEAP32[$2>>2] = $args;
  return ($0|0);
 }
 return (0)|0;
}
function _arg_str($args) {
 $args = $args|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1312>>2]|0;
 $1 = ($0|0)==(0|0);
 if (!($1)) {
  _free($0);
 }
 $2 = HEAP32[1316>>2]|0;
 HEAP32[1312>>2] = $2;
 $3 = (_make_arg_str($args,1)|0);
 HEAP32[1316>>2] = $3;
 return ($3|0);
}
function _call_str($args) {
 $args = $args|0;
 var $$lcssa = 0, $$lcssa14 = 0, $$pre = 0, $$pre11 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $ix$0$lcssa = 0, $temp$03 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1312>>2]|0;
 $1 = ($0|0)==(0|0);
 if (!($1)) {
  _free($0);
 }
 $2 = HEAP32[1316>>2]|0;
 HEAP32[1312>>2] = $2;
 $3 = ($args|0)==(0|0);
 if ($3) {
  $$lcssa = 1;
 } else {
  $8 = 1;$temp$03 = $args;
  while(1) {
   $4 = ((($temp$03)) + 4|0);
   $5 = HEAP32[$4>>2]|0;
   $6 = ($5|0)==(0|0);
   $7 = (($8) + 1)|0;
   if ($6) {
    $$lcssa = $7;
    break;
   } else {
    $8 = $7;$temp$03 = $5;
   }
  }
 }
 $9 = (_malloc($$lcssa)|0);
 $10 = ($9|0)==(0|0);
 if ($10) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[1316>>2] = $9;
 if ($3) {
  $28 = $9;$ix$0$lcssa = 0;
  $27 = (($28) + ($ix$0$lcssa)|0);
  HEAP8[$27>>0] = 0;
  $29 = HEAP32[1316>>2]|0;
  return ($29|0);
 }
 $11 = HEAP32[$args>>2]|0;
 $12 = ($11|0)!=(0);
 $13 = $12 ? 49 : 48;
 HEAP8[$9>>0] = $13;
 $14 = ((($args)) + 4|0);
 $15 = HEAP32[$14>>2]|0;
 $16 = ($15|0)==(0|0);
 if ($16) {
  $$lcssa14 = 1;
 } else {
  $18 = $15;$22 = 1;
  while(1) {
   $$pre = HEAP32[1316>>2]|0;
   $17 = HEAP32[$18>>2]|0;
   $19 = ($17|0)!=(0);
   $20 = $19 ? 49 : 48;
   $21 = (($22) + 1)|0;
   $23 = (($$pre) + ($22)|0);
   HEAP8[$23>>0] = $20;
   $24 = ((($18)) + 4|0);
   $25 = HEAP32[$24>>2]|0;
   $26 = ($25|0)==(0|0);
   if ($26) {
    $$lcssa14 = $21;
    break;
   } else {
    $18 = $25;$22 = $21;
   }
  }
 }
 $$pre11 = HEAP32[1316>>2]|0;
 $28 = $$pre11;$ix$0$lcssa = $$lcssa14;
 $27 = (($28) + ($ix$0$lcssa)|0);
 HEAP8[$27>>0] = 0;
 $29 = HEAP32[1316>>2]|0;
 return ($29|0);
}
function _free_args($args) {
 $args = $args|0;
 var $$01 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($args|0)==(0|0);
 if ($0) {
  return;
 } else {
  $$01 = $args;
 }
 while(1) {
  $1 = ((($$01)) + 4|0);
  $2 = HEAP32[$1>>2]|0;
  _free($$01);
  $3 = ($2|0)==(0|0);
  if ($3) {
   break;
  } else {
   $$01 = $2;
  }
 }
 return;
}
function _check_params($params,$autos) {
 $params = $params|0;
 $autos = $autos|0;
 var $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $tmp1$021 = 0, $tmp1$113 = 0, $tmp1$27 = 0, $tmp2$0 = 0, $tmp2$016 = 0, $tmp2$017 = 0, $tmp2$1 = 0, $tmp2$18 = 0, $tmp2$19 = 0;
 var $tmp2$26 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer3 = 0, $vararg_buffer5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer5 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = ($params|0)!=(0|0);
 if ($0) {
  $tmp1$021 = $params;
  while(1) {
   $1 = ((($tmp1$021)) + 4|0);
   $tmp2$016 = HEAP32[$1>>2]|0;
   $2 = ($tmp2$016|0)==(0|0);
   if (!($2)) {
    $tmp2$017 = $tmp2$016;
    while(1) {
     $3 = HEAP32[$tmp2$017>>2]|0;
     $4 = HEAP32[$tmp1$021>>2]|0;
     $5 = ($3|0)==($4|0);
     if ($5) {
      _yyerror(9299,$vararg_buffer);
     }
     $6 = ((($tmp2$017)) + 4|0);
     $tmp2$0 = HEAP32[$6>>2]|0;
     $7 = ($tmp2$0|0)==(0|0);
     if ($7) {
      break;
     } else {
      $tmp2$017 = $tmp2$0;
     }
    }
   }
   $8 = HEAP32[$tmp1$021>>2]|0;
   $9 = ($8|0)<(0);
   if ($9) {
    _warns(9325,$vararg_buffer1);
   }
   $10 = HEAP32[$1>>2]|0;
   $11 = ($10|0)==(0|0);
   if ($11) {
    break;
   } else {
    $tmp1$021 = $10;
   }
  }
 }
 $12 = ($autos|0)==(0|0);
 if ($12) {
  STACKTOP = sp;return;
 } else {
  $tmp1$113 = $autos;
 }
 while(1) {
  $13 = ((($tmp1$113)) + 4|0);
  $tmp2$18 = HEAP32[$13>>2]|0;
  $14 = ($tmp2$18|0)==(0|0);
  if ($14) {
   break;
  }
  $tmp2$19 = $tmp2$18;
  while(1) {
   $15 = HEAP32[$tmp2$19>>2]|0;
   $16 = HEAP32[$tmp1$113>>2]|0;
   $17 = ($15|0)==($16|0);
   if ($17) {
    _yyerror(9341,$vararg_buffer3);
   }
   $18 = ((($tmp2$19)) + 4|0);
   $tmp2$1 = HEAP32[$18>>2]|0;
   $19 = ($tmp2$1|0)==(0|0);
   if ($19) {
    break;
   } else {
    $tmp2$19 = $tmp2$1;
   }
  }
  $$pre = HEAP32[$13>>2]|0;
  $20 = ($$pre|0)==(0|0);
  if ($20) {
   break;
  } else {
   $tmp1$113 = $$pre;
  }
 }
 if ($0) {
  $tmp1$27 = $params;
 } else {
  STACKTOP = sp;return;
 }
 while(1) {
  $tmp2$26 = $autos;
  while(1) {
   $21 = HEAP32[$tmp2$26>>2]|0;
   $22 = HEAP32[$tmp1$27>>2]|0;
   $23 = ($21|0)==($22|0);
   if ($23) {
    _yyerror(9371,$vararg_buffer5);
   }
   $24 = ((($tmp2$26)) + 4|0);
   $25 = HEAP32[$24>>2]|0;
   $26 = ($25|0)==(0|0);
   if ($26) {
    break;
   } else {
    $tmp2$26 = $25;
   }
  }
  $27 = ((($tmp1$27)) + 4|0);
  $28 = HEAP32[$27>>2]|0;
  $29 = ($28|0)==(0|0);
  if ($29) {
   break;
  } else {
   $tmp1$27 = $28;
  }
 }
 STACKTOP = sp;return;
}
function _yyerror($str,$varargs) {
 $str = $str|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $args = 0, $name$0 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $args = sp + 8|0;
 HEAP32[$args>>2] = $varargs;
 $0 = HEAP8[11750>>0]|0;
 $1 = ($0<<24>>24)==(0);
 if ($1) {
  $2 = HEAP32[1508>>2]|0;
  $3 = (($2) + -1)|0;
  $4 = HEAP32[1456>>2]|0;
  $5 = (($4) + ($3<<2)|0);
  $6 = HEAP32[$5>>2]|0;
  $name$0 = $6;
 } else {
  $name$0 = 9413;
 }
 $7 = HEAP32[1736>>2]|0;
 $8 = HEAP32[1432>>2]|0;
 HEAP32[$vararg_buffer>>2] = $name$0;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $8;
 (_fprintf($7,9427,$vararg_buffer)|0);
 (_vfprintf($7,$str,$args)|0);
 (_fputc(10,$7)|0);
 HEAP32[1436>>2] = 1;
 STACKTOP = sp;return;
}
function _warns($mesg,$varargs) {
 $mesg = $mesg|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $args = 0, $name$0 = 0, $name$1 = 0, $vararg_buffer = 0, $vararg_buffer2 = 0, $vararg_ptr1 = 0, $vararg_ptr5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 $args = sp + 16|0;
 HEAP32[$args>>2] = $varargs;
 $0 = HEAP8[11747>>0]|0;
 $1 = ($0<<24>>24)==(0);
 if (!($1)) {
  $2 = HEAP8[11750>>0]|0;
  $3 = ($2<<24>>24)==(0);
  if ($3) {
   $4 = HEAP32[1508>>2]|0;
   $5 = (($4) + -1)|0;
   $6 = HEAP32[1456>>2]|0;
   $7 = (($6) + ($5<<2)|0);
   $8 = HEAP32[$7>>2]|0;
   $name$0 = $8;
  } else {
   $name$0 = 9413;
  }
  $9 = HEAP32[1736>>2]|0;
  $10 = HEAP32[1432>>2]|0;
  HEAP32[$vararg_buffer>>2] = $name$0;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $10;
  (_fprintf($9,9427,$vararg_buffer)|0);
  (_vfprintf($9,$mesg,$args)|0);
  (_fputc(10,$9)|0);
  HEAP32[1436>>2] = 1;
  STACKTOP = sp;return;
 }
 $11 = HEAP8[11746>>0]|0;
 $12 = ($11<<24>>24)==(0);
 if ($12) {
  STACKTOP = sp;return;
 }
 $13 = HEAP8[11750>>0]|0;
 $14 = ($13<<24>>24)==(0);
 if ($14) {
  $15 = HEAP32[1508>>2]|0;
  $16 = (($15) + -1)|0;
  $17 = HEAP32[1456>>2]|0;
  $18 = (($17) + ($16<<2)|0);
  $19 = HEAP32[$18>>2]|0;
  $name$1 = $19;
 } else {
  $name$1 = 9413;
 }
 $20 = HEAP32[1736>>2]|0;
 $21 = HEAP32[1432>>2]|0;
 HEAP32[$vararg_buffer2>>2] = $name$1;
 $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
 HEAP32[$vararg_ptr5>>2] = $21;
 (_fprintf($20,9435,$vararg_buffer2)|0);
 (_vfprintf($20,$mesg,$args)|0);
 (_fputc(10,$20)|0);
 STACKTOP = sp;return;
}
function _init_gen() {
 var $0 = 0, $1 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP32[1344>>2] = 0;
 HEAP32[1352>>2] = 0;
 HEAP32[1356>>2] = 1;
 HEAP32[1360>>2] = 2;
 $0 = HEAP8[11744>>0]|0;
 $1 = ($0<<24>>24)==(0);
 if ($1) {
  _init_load();
 } else {
  (_printf(9453,$vararg_buffer)|0);
 }
 HEAP32[1436>>2] = 0;
 HEAP8[11742>>0] = 0;
 STACKTOP = sp;return;
}
function _generate($str) {
 $str = $str|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP8[11742>>0] = 1;
 $0 = HEAP8[11744>>0]|0;
 $1 = ($0<<24>>24)==(0);
 if ($1) {
  _load_code($str);
  STACKTOP = sp;return;
 }
 HEAP32[$vararg_buffer>>2] = $str;
 (_printf(9456,$vararg_buffer)|0);
 $2 = (_strlen($str)|0);
 $3 = HEAP32[1360>>2]|0;
 $4 = (($3) + ($2))|0;
 HEAP32[1360>>2] = $4;
 $5 = ($4|0)>(60);
 if (!($5)) {
  STACKTOP = sp;return;
 }
 (_putchar(10)|0);
 HEAP32[1360>>2] = 0;
 STACKTOP = sp;return;
}
function _run_code() {
 var $$pr = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = HEAP32[1436>>2]|0;
 $1 = ($0|0)!=(0);
 $2 = HEAP8[11742>>0]|0;
 $3 = ($2<<24>>24)==(0);
 $or$cond = $1 | $3;
 if ($or$cond) {
  $6 = $2;
 } else {
  $4 = HEAP8[11744>>0]|0;
  $5 = ($4<<24>>24)==(0);
  if ($5) {
   _execute();
  } else {
   (_puts(9459)|0);
   HEAP32[1360>>2] = 0;
  }
  $$pr = HEAP8[11742>>0]|0;
  $6 = $$pr;
 }
 $7 = ($6<<24>>24)==(0);
 if ($7) {
  HEAP32[1436>>2] = 0;
  STACKTOP = sp;return;
 }
 HEAP32[1344>>2] = 0;
 HEAP32[1352>>2] = 0;
 HEAP32[1356>>2] = 1;
 HEAP32[1360>>2] = 2;
 $8 = HEAP8[11744>>0]|0;
 $9 = ($8<<24>>24)==(0);
 if ($9) {
  _init_load();
 } else {
  (_printf(9453,$vararg_buffer)|0);
 }
 HEAP32[1436>>2] = 0;
 HEAP8[11742>>0] = 0;
 STACKTOP = sp;return;
}
function _out_char($0) {
 $0 = $0|0;
 var $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $sext = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $sext = $0 << 24;
 $1 = $sext >> 24;
 $2 = ($1|0)==(10);
 if ($2) {
  HEAP32[1420>>2] = 0;
  (_putchar(10)|0);
  return;
 }
 $3 = HEAP32[1420>>2]|0;
 $4 = (($3) + 1)|0;
 HEAP32[1420>>2] = $4;
 $5 = ($4|0)==(70);
 if ($5) {
  (_putchar(92)|0);
  (_putchar(10)|0);
  HEAP32[1420>>2] = 1;
 }
 (_putchar($1)|0);
 return;
}
function _insert_id_rec($root,$new_id) {
 $root = $root|0;
 $new_id = $new_id|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $62 = 0, $7 = 0, $8 = 0, $9 = 0, $cond = 0, $cond1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[$root>>2]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  HEAP32[$root>>2] = $new_id;
  $2 = ((($new_id)) + 20|0);
  HEAP32[$2>>2] = 0;
  $3 = ((($new_id)) + 24|0);
  HEAP32[$3>>2] = 0;
  $4 = ((($new_id)) + 16|0);
  HEAP16[$4>>1] = 0;
  $$0 = 1;
  return ($$0|0);
 }
 $5 = HEAP32[$new_id>>2]|0;
 $6 = HEAP32[$0>>2]|0;
 $7 = (_strcmp($5,$6)|0);
 $8 = ($7|0)<(0);
 if ($8) {
  $9 = ((($0)) + 20|0);
  $10 = (_insert_id_rec($9,$new_id)|0);
  $11 = ($10|0)==(0);
  if ($11) {
   $$0 = 0;
   return ($$0|0);
  }
  $12 = HEAP32[$root>>2]|0;
  $13 = ((($12)) + 16|0);
  $14 = HEAP16[$13>>1]|0;
  $15 = (($14) + -1)<<16>>16;
  HEAP16[$13>>1] = $15;
  $cond = ($15<<16>>16)==(-2);
  if (!($cond)) {
   $$0 = 0;
   return ($$0|0);
  }
  $16 = ((($12)) + 20|0);
  $17 = HEAP32[$16>>2]|0;
  $18 = ((($17)) + 16|0);
  $19 = HEAP16[$18>>1]|0;
  $20 = ($19<<16>>16)<(1);
  $21 = ((($17)) + 24|0);
  $22 = HEAP32[$21>>2]|0;
  if ($20) {
   HEAP32[$16>>2] = $22;
   HEAP32[$21>>2] = $12;
   HEAP32[$root>>2] = $17;
   HEAP16[$13>>1] = 0;
   HEAP16[$18>>1] = 0;
   $$0 = 0;
   return ($$0|0);
  }
  HEAP32[$root>>2] = $22;
  $23 = ((($22)) + 20|0);
  $24 = HEAP32[$23>>2]|0;
  HEAP32[$21>>2] = $24;
  $25 = HEAP32[$root>>2]|0;
  $26 = ((($25)) + 24|0);
  $27 = HEAP32[$26>>2]|0;
  HEAP32[$16>>2] = $27;
  $28 = HEAP32[$root>>2]|0;
  $29 = ((($28)) + 20|0);
  HEAP32[$29>>2] = $17;
  $30 = HEAP32[$root>>2]|0;
  $31 = ((($30)) + 24|0);
  HEAP32[$31>>2] = $12;
  $32 = HEAP32[$root>>2]|0;
  $33 = ((($32)) + 16|0);
  $34 = HEAP16[$33>>1]|0;
  $35 = $34 << 16 >> 16;
  switch ($35|0) {
  case -1:  {
   HEAP16[$13>>1] = 1;
   HEAP16[$18>>1] = 0;
   break;
  }
  case 0:  {
   HEAP16[$13>>1] = 0;
   HEAP16[$18>>1] = 0;
   break;
  }
  case 1:  {
   HEAP16[$13>>1] = 0;
   HEAP16[$18>>1] = -1;
   break;
  }
  default: {
  }
  }
  HEAP16[$33>>1] = 0;
  $$0 = 0;
  return ($$0|0);
 } else {
  $36 = ((($0)) + 24|0);
  $37 = (_insert_id_rec($36,$new_id)|0);
  $38 = ($37|0)==(0);
  if ($38) {
   $$0 = 0;
   return ($$0|0);
  }
  $39 = HEAP32[$root>>2]|0;
  $40 = ((($39)) + 16|0);
  $41 = HEAP16[$40>>1]|0;
  $42 = (($41) + 1)<<16>>16;
  HEAP16[$40>>1] = $42;
  $cond1 = ($42<<16>>16)==(2);
  if (!($cond1)) {
   $$0 = 0;
   return ($$0|0);
  }
  $43 = ((($39)) + 24|0);
  $44 = HEAP32[$43>>2]|0;
  $45 = ((($44)) + 16|0);
  $46 = HEAP16[$45>>1]|0;
  $47 = ($46<<16>>16)>(-1);
  $48 = ((($44)) + 20|0);
  $49 = HEAP32[$48>>2]|0;
  if ($47) {
   HEAP32[$43>>2] = $49;
   HEAP32[$48>>2] = $39;
   HEAP32[$root>>2] = $44;
   HEAP16[$40>>1] = 0;
   HEAP16[$45>>1] = 0;
   $$0 = 0;
   return ($$0|0);
  }
  HEAP32[$root>>2] = $49;
  $50 = ((($49)) + 24|0);
  $51 = HEAP32[$50>>2]|0;
  HEAP32[$48>>2] = $51;
  $52 = HEAP32[$root>>2]|0;
  $53 = ((($52)) + 20|0);
  $54 = HEAP32[$53>>2]|0;
  HEAP32[$43>>2] = $54;
  $55 = HEAP32[$root>>2]|0;
  $56 = ((($55)) + 20|0);
  HEAP32[$56>>2] = $39;
  $57 = HEAP32[$root>>2]|0;
  $58 = ((($57)) + 24|0);
  HEAP32[$58>>2] = $44;
  $59 = HEAP32[$root>>2]|0;
  $60 = ((($59)) + 16|0);
  $61 = HEAP16[$60>>1]|0;
  $62 = $61 << 16 >> 16;
  switch ($62|0) {
  case -1:  {
   HEAP16[$40>>1] = 0;
   HEAP16[$45>>1] = 1;
   break;
  }
  case 0:  {
   HEAP16[$40>>1] = 0;
   HEAP16[$45>>1] = 0;
   break;
  }
  case 1:  {
   HEAP16[$40>>1] = -1;
   HEAP16[$45>>1] = 0;
   break;
  }
  default: {
  }
  }
  HEAP16[$60>>1] = 0;
  $$0 = 0;
  return ($$0|0);
 }
 return (0)|0;
}
function _init_tree() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 HEAP32[1452>>2] = 0;
 HEAP32[1440>>2] = 1;
 HEAP32[1444>>2] = 1;
 HEAP32[1448>>2] = 4;
 return;
}
function _lookup($name,$namekind) {
 $name = $name|0;
 $namekind = $namekind|0;
 var $$0 = 0, $$pre = 0, $$pre6 = 0, $$pre7 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $7 = 0, $8 = 0, $9 = 0, $id$0 = 0, $or$cond = 0, $or$cond9 = 0, $tree$tr$be$i = 0, $tree$tr$be$in$i = 0, $tree$tr1$i = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer3 = 0, $vararg_buffer5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer5 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = (_strlen($name)|0);
 $1 = ($0|0)==(1);
 if (!($1)) {
  HEAP32[$vararg_buffer>>2] = $name;
  _warns(9462,$vararg_buffer);
 }
 $2 = HEAP32[1452>>2]|0;
 $3 = ($2|0)==(0|0);
 L4: do {
  if ($3) {
   label = 6;
  } else {
   $tree$tr1$i = $2;
   while(1) {
    $4 = HEAP32[$tree$tr1$i>>2]|0;
    $5 = (_strcmp($name,$4)|0);
    $6 = ($5|0)==(0);
    if ($6) {
     $id$0 = $tree$tr1$i;
     break L4;
    }
    $7 = ($5|0)<(0);
    $8 = ((($tree$tr1$i)) + 20|0);
    $9 = ((($tree$tr1$i)) + 24|0);
    $tree$tr$be$in$i = $7 ? $8 : $9;
    $tree$tr$be$i = HEAP32[$tree$tr$be$in$i>>2]|0;
    $10 = ($tree$tr$be$i|0)==(0|0);
    if ($10) {
     label = 6;
     break;
    } else {
     $tree$tr1$i = $tree$tr$be$i;
    }
   }
  }
 } while(0);
 do {
  if ((label|0) == 6) {
   $11 = (_malloc(28)|0);
   $12 = ($11|0)==(0|0);
   if ($12) {
    _out_of_memory();
    // unreachable;
   }
   $13 = (_strlen($name)|0);
   $14 = (($13) + 1)|0;
   $15 = (_malloc($14)|0);
   $16 = ($15|0)==(0|0);
   if ($16) {
    _out_of_memory();
    // unreachable;
   } else {
    $17 = (_strcpy($15,$name)|0);
    HEAP32[$11>>2] = $17;
    $18 = ((($11)) + 4|0);
    HEAP32[$18>>2] = 0;
    $19 = ((($11)) + 8|0);
    HEAP32[$19>>2] = 0;
    $20 = ((($11)) + 12|0);
    HEAP32[$20>>2] = 0;
    (_insert_id_rec(1452,$11)|0);
    $id$0 = $11;
    break;
   }
  }
 } while(0);
 switch ($namekind|0) {
 case 1:  {
  $21 = ((($id$0)) + 4|0);
  $22 = HEAP32[$21>>2]|0;
  $23 = ($22|0)==(0);
  if (!($23)) {
   _free($name);
   $24 = HEAP32[$21>>2]|0;
   $25 = (0 - ($24))|0;
   $$0 = $25;
   STACKTOP = sp;return ($$0|0);
  }
  $26 = HEAP32[1440>>2]|0;
  $27 = (($26) + 1)|0;
  HEAP32[1440>>2] = $27;
  HEAP32[$21>>2] = $26;
  $28 = HEAP32[1392>>2]|0;
  $29 = (($28) + ($26<<2)|0);
  HEAP32[$29>>2] = $name;
  $30 = ($26|0)<(32767);
  if (!($30)) {
   _yyerror(9488,$vararg_buffer1);
   _exit(1);
   // unreachable;
  }
  $31 = HEAP32[1396>>2]|0;
  $32 = ($26|0)<($31|0);
  if ($32) {
   $34 = $26;
  } else {
   _more_arrays();
   $$pre7 = HEAP32[$21>>2]|0;
   $34 = $$pre7;
  }
  $33 = (0 - ($34))|0;
  $$0 = $33;
  STACKTOP = sp;return ($$0|0);
  break;
 }
 case 3: case 2:  {
  $35 = ((($id$0)) + 8|0);
  $36 = HEAP32[$35>>2]|0;
  $37 = ($36|0)==(0);
  if (!($37)) {
   _free($name);
   $38 = HEAP8[11745>>0]|0;
   $39 = ($38<<24>>24)!=(0);
   $40 = ($namekind|0)==(3);
   $or$cond = $40 & $39;
   $41 = HEAP32[$35>>2]|0;
   $42 = ($41|0)<(7);
   $or$cond9 = $or$cond & $42;
   if (!($or$cond9)) {
    $$0 = $41;
    STACKTOP = sp;return ($$0|0);
   }
   $43 = HEAP32[1444>>2]|0;
   $44 = (($43) + 1)|0;
   HEAP32[1444>>2] = $44;
   HEAP32[$35>>2] = $43;
   $$0 = $43;
   STACKTOP = sp;return ($$0|0);
  }
  $45 = HEAP32[1444>>2]|0;
  $46 = (($45) + 1)|0;
  HEAP32[1444>>2] = $46;
  HEAP32[$35>>2] = $45;
  $47 = HEAP32[1368>>2]|0;
  $48 = (($47) + ($45<<2)|0);
  HEAP32[$48>>2] = $name;
  $49 = ($45|0)<(32767);
  if (!($49)) {
   _yyerror(9513,$vararg_buffer3);
   _exit(1);
   // unreachable;
  }
  $50 = HEAP32[1372>>2]|0;
  $51 = ($45|0)<($50|0);
  if ($51) {
   $$0 = $45;
   STACKTOP = sp;return ($$0|0);
  }
  _more_functions();
  $$pre6 = HEAP32[$35>>2]|0;
  $$0 = $$pre6;
  STACKTOP = sp;return ($$0|0);
  break;
 }
 case 0:  {
  $52 = ((($id$0)) + 12|0);
  $53 = HEAP32[$52>>2]|0;
  $54 = ($53|0)==(0);
  if (!($54)) {
   _free($name);
   $55 = HEAP32[$52>>2]|0;
   $$0 = $55;
   STACKTOP = sp;return ($$0|0);
  }
  $56 = HEAP32[1448>>2]|0;
  $57 = (($56) + 1)|0;
  HEAP32[1448>>2] = $57;
  HEAP32[$52>>2] = $56;
  $58 = (($56) + -1)|0;
  $59 = HEAP32[1380>>2]|0;
  $60 = (($59) + ($58<<2)|0);
  HEAP32[$60>>2] = $name;
  $61 = ($56|0)<(32768);
  if (!($61)) {
   _yyerror(9532,$vararg_buffer5);
   _exit(1);
   // unreachable;
  }
  $62 = HEAP32[1384>>2]|0;
  $63 = ($56|0)<($62|0);
  if ($63) {
   $$0 = $56;
   STACKTOP = sp;return ($$0|0);
  }
  _more_variables();
  $$pre = HEAP32[$52>>2]|0;
  $$0 = $$pre;
  STACKTOP = sp;return ($$0|0);
  break;
 }
 default: {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 }
 return (0)|0;
}
function _welcome() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 (_puts(9551)|0);
 (_puts(9602)|0);
 return;
}
function _warranty($prefix) {
 $prefix = $prefix|0;
 var $vararg_buffer = 0, $vararg_buffer2 = 0, $vararg_ptr1 = 0, $vararg_ptr10 = 0, $vararg_ptr11 = 0, $vararg_ptr12 = 0, $vararg_ptr13 = 0, $vararg_ptr14 = 0, $vararg_ptr5 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, $vararg_ptr8 = 0, $vararg_ptr9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer2 = sp + 8|0;
 $vararg_buffer = sp;
 HEAP32[$vararg_buffer>>2] = $prefix;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = 10686;
 (_printf(9632,$vararg_buffer)|0);
 HEAP32[$vararg_buffer2>>2] = 9663;
 $vararg_ptr5 = ((($vararg_buffer2)) + 4|0);
 HEAP32[$vararg_ptr5>>2] = 9737;
 $vararg_ptr6 = ((($vararg_buffer2)) + 8|0);
 HEAP32[$vararg_ptr6>>2] = 9811;
 $vararg_ptr7 = ((($vararg_buffer2)) + 12|0);
 HEAP32[$vararg_ptr7>>2] = 9883;
 $vararg_ptr8 = ((($vararg_buffer2)) + 16|0);
 HEAP32[$vararg_ptr8>>2] = 9925;
 $vararg_ptr9 = ((($vararg_buffer2)) + 20|0);
 HEAP32[$vararg_ptr9>>2] = 9994;
 $vararg_ptr10 = ((($vararg_buffer2)) + 24|0);
 HEAP32[$vararg_ptr10>>2] = 10062;
 $vararg_ptr11 = ((($vararg_buffer2)) + 28|0);
 HEAP32[$vararg_ptr11>>2] = 10129;
 $vararg_ptr12 = ((($vararg_buffer2)) + 32|0);
 HEAP32[$vararg_ptr12>>2] = 10180;
 $vararg_ptr13 = ((($vararg_buffer2)) + 36|0);
 HEAP32[$vararg_ptr13>>2] = 10251;
 $vararg_ptr14 = ((($vararg_buffer2)) + 40|0);
 HEAP32[$vararg_ptr14>>2] = 10316;
 (_printf(9640,$vararg_buffer2)|0);
 STACKTOP = sp;return;
}
function _limits() {
 var $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer10 = 0, $vararg_buffer13 = 0, $vararg_buffer16 = 0, $vararg_buffer19 = 0, $vararg_buffer4 = 0, $vararg_buffer7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer19 = sp + 56|0;
 $vararg_buffer16 = sp + 48|0;
 $vararg_buffer13 = sp + 40|0;
 $vararg_buffer10 = sp + 32|0;
 $vararg_buffer7 = sp + 24|0;
 $vararg_buffer4 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 HEAP32[$vararg_buffer>>2] = 99;
 (_printf(10374,$vararg_buffer)|0);
 HEAP32[$vararg_buffer1>>2] = 2048;
 (_printf(10396,$vararg_buffer1)|0);
 HEAP32[$vararg_buffer4>>2] = 99;
 (_printf(10419,$vararg_buffer4)|0);
 HEAP32[$vararg_buffer7>>2] = 1000;
 (_printf(10441,$vararg_buffer7)|0);
 HEAP32[$vararg_buffer10>>2] = 2147483647;
 (_printf(10463,$vararg_buffer10)|0);
 HEAP32[$vararg_buffer13>>2] = 16384;
 (_printf(10486,$vararg_buffer13)|0);
 HEAP32[$vararg_buffer16>>2] = 23860929;
 (_printf(10509,$vararg_buffer16)|0);
 HEAP32[$vararg_buffer19>>2] = 32767;
 (_printf(10532,$vararg_buffer19)|0);
 STACKTOP = sp;return;
}
function _out_of_memory() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1736>>2]|0;
 (_fwrite(10555,39,1,$0)|0);
 _exit(1);
 // unreachable;
}
function _rt_error($mesg,$varargs) {
 $mesg = $mesg|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $args = 0, $error_mesg = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 288|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $args = sp + 16|0;
 $error_mesg = sp + 32|0;
 HEAP32[$args>>2] = $varargs;
 (_vsprintf($error_mesg,$mesg,$args)|0);
 $0 = HEAP32[1736>>2]|0;
 $1 = HEAP32[1424>>2]|0;
 $2 = HEAP32[1368>>2]|0;
 $3 = (($2) + ($1<<2)|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = HEAP32[(1428)>>2]|0;
 HEAP32[$vararg_buffer>>2] = $4;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $5;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $error_mesg;
 (_fprintf($0,10595,$vararg_buffer)|0);
 HEAP8[11749>>0] = 1;
 STACKTOP = sp;return;
}
function _rt_warn($mesg,$varargs) {
 $mesg = $mesg|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $args = 0, $error_mesg = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 288|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $args = sp + 16|0;
 $error_mesg = sp + 32|0;
 HEAP32[$args>>2] = $varargs;
 (_vsprintf($error_mesg,$mesg,$args)|0);
 $0 = HEAP32[1736>>2]|0;
 $1 = HEAP32[1424>>2]|0;
 $2 = HEAP32[1368>>2]|0;
 $3 = (($2) + ($1<<2)|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = HEAP32[(1428)>>2]|0;
 HEAP32[$vararg_buffer>>2] = $4;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $5;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $error_mesg;
 (_fprintf($0,10632,$vararg_buffer)|0);
 STACKTOP = sp;return;
}
function _make_arg_str($args,$len) {
 $args = $args|0;
 $len = $len|0;
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $sval = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $sval = sp + 12|0;
 $0 = ($args|0)==(0|0);
 if ($0) {
  $7 = (_malloc($len)|0);
  $8 = ($7|0)==(0|0);
  if ($8) {
   _out_of_memory();
   // unreachable;
  }
  HEAP8[$7>>0] = 0;
  $$0 = $7;
  STACKTOP = sp;return ($$0|0);
 }
 $1 = ((($args)) + 4|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = (($len) + 11)|0;
 $4 = (_make_arg_str($2,$3)|0);
 $5 = ($len|0)==(1);
 $6 = HEAP32[$args>>2]|0;
 if ($5) {
  HEAP32[$vararg_buffer1>>2] = $6;
  (_sprintf($sval,10675,$vararg_buffer1)|0);
 } else {
  HEAP32[$vararg_buffer>>2] = $6;
  (_sprintf($sval,10671,$vararg_buffer)|0);
 }
 $9 = (_strcat($4,$sval)|0);
 $$0 = $9;
 STACKTOP = sp;return ($$0|0);
}
function _main($argc,$argv) {
 $argc = $argc|0;
 $argv = $argv|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $ch$0 = 0, $storemerge = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAP8[11744>>0] = 0;
 HEAP8[11745>>0] = 0;
 HEAP8[11746>>0] = 0;
 HEAP8[11747>>0] = 0;
 $0 = (_isatty(0)|0);
 $1 = ($0|0)==(0);
 if ($1) {
  label = 3;
 } else {
  $2 = (_isatty(1)|0);
  $3 = ($2|0)==(0);
  if ($3) {
   label = 3;
  } else {
   $storemerge = 1;
  }
 }
 if ((label|0) == 3) {
  $storemerge = 0;
 }
 HEAP8[11743>>0] = $storemerge;
 $4 = (_getopt($argc,$argv,10679)|0);
 $ch$0 = $4;
 L6: while(1) {
  switch ($ch$0|0) {
  case -1:  {
   break L6;
   break;
  }
  case 99:  {
   HEAP8[11744>>0] = 1;
   break;
  }
  case 108:  {
   HEAP8[11745>>0] = 1;
   break;
  }
  case 105:  {
   HEAP8[11743>>0] = 1;
   break;
  }
  case 119:  {
   HEAP8[11746>>0] = 1;
   break;
  }
  case 115:  {
   HEAP8[11747>>0] = 1;
   break;
  }
  case 118:  {
   (_puts(10686)|0);
   break;
  }
  default: {
  }
  }
  $5 = (_getopt($argc,$argv,10679)|0);
  $ch$0 = $5;
 }
 _init_storage();
 _init_load();
 $6 = HEAP8[11743>>0]|0;
 $7 = ($6<<24>>24)==(0);
 if (!($7)) {
  (_signal(2,(7|0))|0);
 }
 _init_tree();
 _init_gen();
 HEAP32[1456>>2] = $argv;
 HEAP32[1460>>2] = $argc;
 HEAP8[11750>>0] = 0;
 HEAP8[10678>>0] = 1;
 $8 = (_open_new_file()|0);
 $9 = ($8|0)==(0);
 if ($9) {
  _exit(1);
  // unreachable;
 }
 (_yyparse()|0);
 $10 = HEAP8[11744>>0]|0;
 $11 = ($10<<24>>24)==(0);
 if ($11) {
  _exit(0);
  // unreachable;
 }
 (_putchar(10)|0);
 _exit(0);
 // unreachable;
 return (0)|0;
}
function _use_quit($sig) {
 $sig = $sig|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 (_puts(10776)|0);
 (_signal(2,(7|0))|0);
 return;
}
function _open_new_file() {
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP32[1432>>2] = 1;
 $0 = HEAP8[11750>>0]|0;
 $1 = ($0<<24>>24)==(0);
 if (!($1)) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $2 = HEAP8[11745>>0]|0;
 $3 = ($2<<24>>24)==(0);
 $4 = HEAP8[10678>>0]|0;
 $5 = ($4<<24>>24)==(0);
 $or$cond = $3 | $5;
 if (!($or$cond)) {
  (_lookup(10807,2)|0);
  (_lookup(10809,2)|0);
  (_lookup(10811,2)|0);
  (_lookup(10813,2)|0);
  (_lookup(10815,2)|0);
  (_lookup(10817,2)|0);
  _load_code(7982);
 }
 $6 = HEAP32[1508>>2]|0;
 $7 = HEAP32[1460>>2]|0;
 $8 = ($6|0)<($7|0);
 if (!($8)) {
  $25 = HEAP32[435]|0;
  $26 = HEAP8[10678>>0]|0;
  $27 = ($26<<24>>24)==(0);
  if ($27) {
   $28 = HEAP32[20>>2]|0;
   (_fclose($28)|0);
  }
  HEAP32[20>>2] = $25;
  HEAP8[10678>>0] = 0;
  HEAP8[11750>>0] = 1;
  $$0 = 1;
  STACKTOP = sp;return ($$0|0);
 }
 $9 = HEAP32[1456>>2]|0;
 $10 = (($9) + ($6<<2)|0);
 $11 = HEAP32[$10>>2]|0;
 $12 = (_fopen($11,10819)|0);
 $13 = ($12|0)==(0|0);
 if ($13) {
  $19 = HEAP32[1736>>2]|0;
  $20 = HEAP32[1508>>2]|0;
  $21 = (($20) + 1)|0;
  HEAP32[1508>>2] = $21;
  $22 = HEAP32[1456>>2]|0;
  $23 = (($22) + ($20<<2)|0);
  $24 = HEAP32[$23>>2]|0;
  HEAP32[$vararg_buffer>>2] = $24;
  (_fprintf($19,10821,$vararg_buffer)|0);
  _exit(1);
  // unreachable;
 }
 $14 = HEAP8[10678>>0]|0;
 $15 = ($14<<24>>24)==(0);
 if ($15) {
  $16 = HEAP32[20>>2]|0;
  (_fclose($16)|0);
 }
 HEAP32[20>>2] = $12;
 HEAP8[10678>>0] = 0;
 $17 = HEAP32[1508>>2]|0;
 $18 = (($17) + 1)|0;
 HEAP32[1508>>2] = $18;
 $$0 = 1;
 STACKTOP = sp;return ($$0|0);
}
function _free_num($num) {
 $num = $num|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[$num>>2]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  return;
 }
 $2 = ((($0)) + 12|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = (($3) + -1)|0;
 HEAP32[$2>>2] = $4;
 $5 = ($4|0)==(0);
 if ($5) {
  _free($0);
 }
 HEAP32[$num>>2] = 0;
 return;
}
function _new_num($length,$scale) {
 $length = $length|0;
 $scale = $scale|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($length) + 20)|0;
 $1 = (($0) + ($scale))|0;
 $2 = (_malloc($1)|0);
 $3 = ($2|0)==(0|0);
 if ($3) {
  _out_of_memory();
  // unreachable;
 } else {
  HEAP32[$2>>2] = 0;
  $4 = ((($2)) + 4|0);
  HEAP32[$4>>2] = $length;
  $5 = ((($2)) + 8|0);
  HEAP32[$5>>2] = $scale;
  $6 = ((($2)) + 12|0);
  HEAP32[$6>>2] = 1;
  $7 = ((($2)) + 16|0);
  HEAP8[$7>>0] = 0;
  return ($2|0);
 }
 return (0)|0;
}
function _init_numbers() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_malloc(21)|0);
 $1 = ($0|0)==(0|0);
 if ($1) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$0>>2] = 0;
 $2 = ((($0)) + 4|0);
 HEAP32[$2>>2] = 1;
 $3 = ((($0)) + 8|0);
 HEAP32[$3>>2] = 0;
 $4 = ((($0)) + 12|0);
 HEAP32[$4>>2] = 1;
 $5 = ((($0)) + 16|0);
 HEAP8[$5>>0] = 0;
 HEAP32[1320>>2] = $0;
 $6 = (_malloc(21)|0);
 $7 = ($6|0)==(0|0);
 if ($7) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$6>>2] = 0;
 $8 = ((($6)) + 4|0);
 HEAP32[$8>>2] = 1;
 $9 = ((($6)) + 8|0);
 HEAP32[$9>>2] = 0;
 $10 = ((($6)) + 12|0);
 HEAP32[$10>>2] = 1;
 $11 = ((($6)) + 16|0);
 HEAP32[1324>>2] = $6;
 HEAP8[$11>>0] = 1;
 $12 = (_malloc(21)|0);
 $13 = ($12|0)==(0|0);
 if ($13) {
  _out_of_memory();
  // unreachable;
 } else {
  HEAP32[$12>>2] = 0;
  $14 = ((($12)) + 4|0);
  HEAP32[$14>>2] = 1;
  $15 = ((($12)) + 8|0);
  HEAP32[$15>>2] = 0;
  $16 = ((($12)) + 12|0);
  HEAP32[$16>>2] = 1;
  $17 = ((($12)) + 16|0);
  HEAP32[1328>>2] = $12;
  HEAP8[$17>>0] = 2;
  return;
 }
}
function _copy_num($num) {
 $num = $num|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($num)) + 12|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = (($1) + 1)|0;
 HEAP32[$0>>2] = $2;
 return ($num|0);
}
function _init_num($num) {
 $num = $num|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1320>>2]|0;
 $1 = ((($0)) + 12|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = (($2) + 1)|0;
 HEAP32[$1>>2] = $3;
 HEAP32[$num>>2] = $0;
 return;
}
function _int2num($num,$val) {
 $num = $num|0;
 $val = $val|0;
 var $$1$in$off = 0, $$1$in$off5 = 0, $$18 = 0, $$18$in = 0, $$val = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $bptr$0$lcssa = 0, $bptr$06 = 0, $bptr$11 = 0;
 var $buffer = 0, $ix$0$lcssa = 0, $ix$07 = 0, $ix$13 = 0, $vptr$02 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $buffer = sp;
 $0 = ($val|0)<(0);
 $1 = (0 - ($val))|0;
 $$val = $0 ? $1 : $val;
 $2 = (($$val|0) % 10)&-1;
 $3 = $2&255;
 $4 = ((($buffer)) + 1|0);
 HEAP8[$buffer>>0] = $3;
 $$1$in$off5 = (($$val) + 9)|0;
 $5 = ($$1$in$off5>>>0)>(18);
 if ($5) {
  $$18$in = $$val;$bptr$06 = $4;$ix$07 = 1;
  while(1) {
   $$18 = (($$18$in|0) / 10)&-1;
   $6 = (($$18|0) % 10)&-1;
   $7 = $6&255;
   $8 = ((($bptr$06)) + 1|0);
   HEAP8[$bptr$06>>0] = $7;
   $9 = (($ix$07) + 1)|0;
   $$1$in$off = (($$18) + 9)|0;
   $10 = ($$1$in$off>>>0)>(18);
   if ($10) {
    $$18$in = $$18;$bptr$06 = $8;$ix$07 = $9;
   } else {
    $bptr$0$lcssa = $8;$ix$0$lcssa = $9;
    break;
   }
  }
 } else {
  $bptr$0$lcssa = $4;$ix$0$lcssa = 1;
 }
 $11 = HEAP32[$num>>2]|0;
 $12 = ($11|0)==(0|0);
 if (!($12)) {
  $13 = ((($11)) + 12|0);
  $14 = HEAP32[$13>>2]|0;
  $15 = (($14) + -1)|0;
  HEAP32[$13>>2] = $15;
  $16 = ($15|0)==(0);
  if ($16) {
   _free($11);
  }
  HEAP32[$num>>2] = 0;
 }
 $17 = (($ix$0$lcssa) + 20)|0;
 $18 = (_malloc($17)|0);
 $19 = ($18|0)==(0|0);
 if ($19) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$18>>2] = 0;
 $20 = ((($18)) + 4|0);
 HEAP32[$20>>2] = $ix$0$lcssa;
 $21 = ((($18)) + 8|0);
 HEAP32[$21>>2] = 0;
 $22 = ((($18)) + 12|0);
 HEAP32[$22>>2] = 1;
 $23 = ((($18)) + 16|0);
 HEAP8[$23>>0] = 0;
 HEAP32[$num>>2] = $18;
 $24 = ($val|0)>(-1);
 if (!($24)) {
  HEAP32[$18>>2] = 1;
 }
 $25 = ($ix$0$lcssa|0)>(0);
 if (!($25)) {
  STACKTOP = sp;return;
 }
 $26 = ((($18)) + 16|0);
 $bptr$11 = $bptr$0$lcssa;$ix$13 = $ix$0$lcssa;$vptr$02 = $26;
 while(1) {
  $27 = (($ix$13) + -1)|0;
  $28 = ((($bptr$11)) + -1|0);
  $29 = HEAP8[$28>>0]|0;
  $30 = ((($vptr$02)) + 1|0);
  HEAP8[$vptr$02>>0] = $29;
  $31 = ($ix$13|0)>(1);
  if ($31) {
   $bptr$11 = $28;$ix$13 = $27;$vptr$02 = $30;
  } else {
   break;
  }
 }
 STACKTOP = sp;return;
}
function _num2long($num) {
 $num = $num|0;
 var $$0 = 0, $$lcssa = 0, $$lcssa13 = 0, $$lcssa14 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $index$03 = 0, $nptr$02 = 0, $phitmp = 0, $val$01 = 0, $val$2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($num)) + 4|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(0);
 if ($2) {
  $3 = ((($num)) + 16|0);
  $index$03 = $1;$nptr$02 = $3;$val$01 = 0;
  while(1) {
   $4 = ($val$01*10)|0;
   $5 = ((($nptr$02)) + 1|0);
   $6 = HEAP8[$nptr$02>>0]|0;
   $7 = $6 << 24 >> 24;
   $8 = (($7) + ($4))|0;
   $9 = (($index$03) + -1)|0;
   $10 = ($index$03|0)>(1);
   $11 = ($8|0)<(214748365);
   $12 = $11 & $10;
   if ($12) {
    $index$03 = $9;$nptr$02 = $5;$val$01 = $8;
   } else {
    $$lcssa13 = $8;$$lcssa14 = $10;
    break;
   }
  }
  $phitmp = $$lcssa14 ? 0 : $$lcssa13;
  $$lcssa = $phitmp;
 } else {
  $$lcssa = 0;
 }
 $13 = ($$lcssa|0)<(0);
 $val$2 = $13 ? 0 : $$lcssa;
 $14 = HEAP32[$num>>2]|0;
 $15 = ($14|0)==(0);
 $16 = (0 - ($val$2))|0;
 $$0 = $15 ? $val$2 : $16;
 return ($$0|0);
}
function _bc_compare($n1,$n2) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (__do_compare($n1,$n2,1,0)|0);
 return ($0|0);
}
function _is_zero($num) {
 $num = $num|0;
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $count$0$lcssa = 0, $count$01 = 0, $nptr$02 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1320>>2]|0;
 $1 = ($0|0)==($num|0);
 if ($1) {
  $$0 = 1;
  return ($$0|0);
 }
 $2 = ((($num)) + 4|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ((($num)) + 8|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (($5) + ($3))|0;
 $7 = ($6|0)>(0);
 L4: do {
  if ($7) {
   $8 = ((($num)) + 16|0);
   $count$01 = $6;$nptr$02 = $8;
   while(1) {
    $9 = HEAP8[$nptr$02>>0]|0;
    $10 = ($9<<24>>24)==(0);
    if (!($10)) {
     $count$0$lcssa = $count$01;
     break L4;
    }
    $11 = ((($nptr$02)) + 1|0);
    $12 = (($count$01) + -1)|0;
    $13 = ($count$01|0)>(1);
    if ($13) {
     $count$01 = $12;$nptr$02 = $11;
    } else {
     $count$0$lcssa = $12;
     break;
    }
   }
  } else {
   $count$0$lcssa = $6;
  }
 } while(0);
 $14 = ($count$0$lcssa|0)==(0);
 $$ = $14&1;
 $$0 = $$;
 return ($$0|0);
}
function _is_neg($num) {
 $num = $num|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[$num>>2]|0;
 $1 = ($0|0)==(1);
 $2 = $1&1;
 return ($2|0);
}
function _bc_add($n1,$n2,$result) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 $result = $result|0;
 var $$2$i = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $count$016$i = 0, $count$024$i = 0, $count$118$i = 0, $count$220$i = 0, $n1ptr$012$i = 0, $n1ptr$022$i = 0, $n1ptr$117$i = 0, $n2ptr$014$i = 0, $n2ptr$023$i = 0, $n2ptr$119$i = 0, $sum$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[$n1>>2]|0;
 $1 = HEAP32[$n2>>2]|0;
 $2 = ($0|0)==($1|0);
 L1: do {
  if ($2) {
   $3 = (__do_add($n1,$n2)|0);
   $4 = HEAP32[$n1>>2]|0;
   HEAP32[$3>>2] = $4;
   $sum$0 = $3;
  } else {
   $5 = ((($n1)) + 4|0);
   $6 = HEAP32[$5>>2]|0;
   $7 = ((($n2)) + 4|0);
   $8 = HEAP32[$7>>2]|0;
   $9 = ($6|0)==($8|0);
   L4: do {
    if ($9) {
     $11 = ((($n1)) + 8|0);
     $12 = HEAP32[$11>>2]|0;
     $13 = ((($n2)) + 8|0);
     $14 = HEAP32[$13>>2]|0;
     $15 = ($12|0)>($14|0);
     $$2$i = $15 ? $14 : $12;
     $16 = (($$2$i) + ($6))|0;
     $17 = ((($n1)) + 16|0);
     $18 = ((($n2)) + 16|0);
     $19 = ($16|0)>(0);
     L6: do {
      if ($19) {
       $count$024$i = $16;$n1ptr$022$i = $17;$n2ptr$023$i = $18;
       while(1) {
        $20 = HEAP8[$n1ptr$022$i>>0]|0;
        $21 = HEAP8[$n2ptr$023$i>>0]|0;
        $22 = ($20<<24>>24)==($21<<24>>24);
        if (!($22)) {
         $count$016$i = $count$024$i;$n1ptr$012$i = $n1ptr$022$i;$n2ptr$014$i = $n2ptr$023$i;
         break L6;
        }
        $23 = ((($n1ptr$022$i)) + 1|0);
        $24 = ((($n2ptr$023$i)) + 1|0);
        $25 = (($count$024$i) + -1)|0;
        $26 = ($count$024$i|0)>(1);
        if ($26) {
         $count$024$i = $25;$n1ptr$022$i = $23;$n2ptr$023$i = $24;
        } else {
         $count$016$i = $25;$n1ptr$012$i = $23;$n2ptr$014$i = $24;
         break;
        }
       }
      } else {
       $count$016$i = $16;$n1ptr$012$i = $17;$n2ptr$014$i = $18;
      }
     } while(0);
     $27 = ($count$016$i|0)==(0);
     if (!($27)) {
      $28 = HEAP8[$n1ptr$012$i>>0]|0;
      $29 = HEAP8[$n2ptr$014$i>>0]|0;
      $30 = ($28<<24>>24)>($29<<24>>24);
      if ($30) {
       label = 20;
       break;
      } else {
       label = 18;
       break;
      }
     }
     $31 = ($12|0)==($14|0);
     do {
      if (!($31)) {
       if ($15) {
        $32 = (($12) - ($14))|0;
        $33 = ($32|0)>(0);
        if ($33) {
         $count$118$i = $32;$n1ptr$117$i = $n1ptr$012$i;
        } else {
         break;
        }
        while(1) {
         $34 = HEAP8[$n1ptr$117$i>>0]|0;
         $35 = ($34<<24>>24)==(0);
         if (!($35)) {
          label = 20;
          break L4;
         }
         $36 = ((($n1ptr$117$i)) + 1|0);
         $37 = (($count$118$i) + -1)|0;
         $38 = ($count$118$i|0)>(1);
         if ($38) {
          $count$118$i = $37;$n1ptr$117$i = $36;
         } else {
          break;
         }
        }
       } else {
        $39 = (($14) - ($12))|0;
        $40 = ($39|0)>(0);
        if ($40) {
         $count$220$i = $39;$n2ptr$119$i = $n2ptr$014$i;
        } else {
         break;
        }
        while(1) {
         $41 = HEAP8[$n2ptr$119$i>>0]|0;
         $42 = ($41<<24>>24)==(0);
         if (!($42)) {
          label = 18;
          break L4;
         }
         $43 = ((($n2ptr$119$i)) + 1|0);
         $44 = (($count$220$i) + -1)|0;
         $45 = ($count$220$i|0)>(1);
         if ($45) {
          $count$220$i = $44;$n2ptr$119$i = $43;
         } else {
          break;
         }
        }
       }
      }
     } while(0);
     $48 = HEAP32[1320>>2]|0;
     $49 = ((($48)) + 12|0);
     $50 = HEAP32[$49>>2]|0;
     $51 = (($50) + 1)|0;
     HEAP32[$49>>2] = $51;
     $sum$0 = $48;
     break L1;
    } else {
     $10 = ($6|0)>($8|0);
     if ($10) {
      label = 20;
     } else {
      label = 18;
     }
    }
   } while(0);
   if ((label|0) == 18) {
    $46 = (__do_sub($n2,$n1)|0);
    $47 = HEAP32[$n2>>2]|0;
    HEAP32[$46>>2] = $47;
    $sum$0 = $46;
    break;
   }
   else if ((label|0) == 20) {
    $52 = (__do_sub($n1,$n2)|0);
    $53 = HEAP32[$n1>>2]|0;
    HEAP32[$52>>2] = $53;
    $sum$0 = $52;
    break;
   }
  }
 } while(0);
 $54 = HEAP32[$result>>2]|0;
 $55 = ($54|0)==(0|0);
 if ($55) {
  HEAP32[$result>>2] = $sum$0;
  return;
 }
 $56 = ((($54)) + 12|0);
 $57 = HEAP32[$56>>2]|0;
 $58 = (($57) + -1)|0;
 HEAP32[$56>>2] = $58;
 $59 = ($58|0)==(0);
 if ($59) {
  _free($54);
 }
 HEAP32[$result>>2] = 0;
 HEAP32[$result>>2] = $sum$0;
 return;
}
function _bc_sub($n1,$n2,$result) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 $result = $result|0;
 var $$2$i = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $count$016$i = 0, $count$024$i = 0, $count$118$i = 0, $count$220$i = 0, $diff$0 = 0, $n1ptr$012$i = 0, $n1ptr$022$i = 0, $n1ptr$117$i = 0, $n2ptr$014$i = 0, $n2ptr$023$i = 0, $n2ptr$119$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[$n1>>2]|0;
 $1 = HEAP32[$n2>>2]|0;
 $2 = ($0|0)==($1|0);
 L1: do {
  if ($2) {
   $5 = ((($n1)) + 4|0);
   $6 = HEAP32[$5>>2]|0;
   $7 = ((($n2)) + 4|0);
   $8 = HEAP32[$7>>2]|0;
   $9 = ($6|0)==($8|0);
   L3: do {
    if ($9) {
     $11 = ((($n1)) + 8|0);
     $12 = HEAP32[$11>>2]|0;
     $13 = ((($n2)) + 8|0);
     $14 = HEAP32[$13>>2]|0;
     $15 = ($12|0)>($14|0);
     $$2$i = $15 ? $14 : $12;
     $16 = (($$2$i) + ($6))|0;
     $17 = ((($n1)) + 16|0);
     $18 = ((($n2)) + 16|0);
     $19 = ($16|0)>(0);
     L5: do {
      if ($19) {
       $count$024$i = $16;$n1ptr$022$i = $17;$n2ptr$023$i = $18;
       while(1) {
        $20 = HEAP8[$n1ptr$022$i>>0]|0;
        $21 = HEAP8[$n2ptr$023$i>>0]|0;
        $22 = ($20<<24>>24)==($21<<24>>24);
        if (!($22)) {
         $count$016$i = $count$024$i;$n1ptr$012$i = $n1ptr$022$i;$n2ptr$014$i = $n2ptr$023$i;
         break L5;
        }
        $23 = ((($n1ptr$022$i)) + 1|0);
        $24 = ((($n2ptr$023$i)) + 1|0);
        $25 = (($count$024$i) + -1)|0;
        $26 = ($count$024$i|0)>(1);
        if ($26) {
         $count$024$i = $25;$n1ptr$022$i = $23;$n2ptr$023$i = $24;
        } else {
         $count$016$i = $25;$n1ptr$012$i = $23;$n2ptr$014$i = $24;
         break;
        }
       }
      } else {
       $count$016$i = $16;$n1ptr$012$i = $17;$n2ptr$014$i = $18;
      }
     } while(0);
     $27 = ($count$016$i|0)==(0);
     if (!($27)) {
      $28 = HEAP8[$n1ptr$012$i>>0]|0;
      $29 = HEAP8[$n2ptr$014$i>>0]|0;
      $30 = ($28<<24>>24)>($29<<24>>24);
      if ($30) {
       label = 20;
       break;
      } else {
       label = 18;
       break;
      }
     }
     $31 = ($12|0)==($14|0);
     do {
      if (!($31)) {
       if ($15) {
        $32 = (($12) - ($14))|0;
        $33 = ($32|0)>(0);
        if ($33) {
         $count$118$i = $32;$n1ptr$117$i = $n1ptr$012$i;
        } else {
         break;
        }
        while(1) {
         $34 = HEAP8[$n1ptr$117$i>>0]|0;
         $35 = ($34<<24>>24)==(0);
         if (!($35)) {
          label = 20;
          break L3;
         }
         $36 = ((($n1ptr$117$i)) + 1|0);
         $37 = (($count$118$i) + -1)|0;
         $38 = ($count$118$i|0)>(1);
         if ($38) {
          $count$118$i = $37;$n1ptr$117$i = $36;
         } else {
          break;
         }
        }
       } else {
        $39 = (($14) - ($12))|0;
        $40 = ($39|0)>(0);
        if ($40) {
         $count$220$i = $39;$n2ptr$119$i = $n2ptr$014$i;
        } else {
         break;
        }
        while(1) {
         $41 = HEAP8[$n2ptr$119$i>>0]|0;
         $42 = ($41<<24>>24)==(0);
         if (!($42)) {
          label = 18;
          break L3;
         }
         $43 = ((($n2ptr$119$i)) + 1|0);
         $44 = (($count$220$i) + -1)|0;
         $45 = ($count$220$i|0)>(1);
         if ($45) {
          $count$220$i = $44;$n2ptr$119$i = $43;
         } else {
          break;
         }
        }
       }
      }
     } while(0);
     $50 = HEAP32[1320>>2]|0;
     $51 = ((($50)) + 12|0);
     $52 = HEAP32[$51>>2]|0;
     $53 = (($52) + 1)|0;
     HEAP32[$51>>2] = $53;
     $diff$0 = $50;
     break L1;
    } else {
     $10 = ($6|0)>($8|0);
     if ($10) {
      label = 20;
     } else {
      label = 18;
     }
    }
   } while(0);
   if ((label|0) == 18) {
    $46 = (__do_sub($n2,$n1)|0);
    $47 = HEAP32[$n2>>2]|0;
    $48 = ($47|0)==(0);
    $49 = $48&1;
    HEAP32[$46>>2] = $49;
    $diff$0 = $46;
    break;
   }
   else if ((label|0) == 20) {
    $54 = (__do_sub($n1,$n2)|0);
    $55 = HEAP32[$n1>>2]|0;
    HEAP32[$54>>2] = $55;
    $diff$0 = $54;
    break;
   }
  } else {
   $3 = (__do_add($n1,$n2)|0);
   $4 = HEAP32[$n1>>2]|0;
   HEAP32[$3>>2] = $4;
   $diff$0 = $3;
  }
 } while(0);
 $56 = HEAP32[$result>>2]|0;
 $57 = ($56|0)==(0|0);
 if ($57) {
  HEAP32[$result>>2] = $diff$0;
  return;
 }
 $58 = ((($56)) + 12|0);
 $59 = HEAP32[$58>>2]|0;
 $60 = (($59) + -1)|0;
 HEAP32[$58>>2] = $60;
 $61 = ($60|0)==(0);
 if ($61) {
  _free($56);
 }
 HEAP32[$result>>2] = 0;
 HEAP32[$result>>2] = $diff$0;
 return;
}
function _bc_multiply($n1,$n2,$prod,$scale) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 $prod = $prod|0;
 $scale = $scale|0;
 var $$ = 0, $$12 = 0, $$13 = 0, $$lcssa65 = 0, $$pre = 0, $$pre$i = 0, $$sum = 0, $$sum2 = 0, $$sum3 = 0, $$sum4 = 0, $$sum5 = 0, $$sum6 = 0, $$sum7 = 0, $$sum8 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0;
 var $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0;
 var $121 = 0, $122 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0;
 var $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0;
 var $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0;
 var $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0;
 var $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $bytes$0$lcssa$i = 0, $bytes$04$i17 = 0, $bytes$11$i = 0;
 var $count$0$lcssa$i = 0, $count$01$i = 0, $dst$02$i = 0, $exitcond = 0, $exitcond47 = 0, $indx$0$lcssa = 0, $indx$035 = 0, $indx$122 = 0, $n1ptr$031 = 0, $n1ptr$121 = 0, $n2ptr$030 = 0, $n2ptr$120 = 0, $not$ = 0, $nptr$02$i = 0, $or$cond = 0, $or$cond14 = 0, $or$cond1418 = 0, $or$cond28 = 0, $pvptr$0$lcssa = 0, $pvptr$024 = 0;
 var $scale$$ = 0, $scale$$$ = 0, $scevgep = 0, $src$0$lcssa$i = 0, $src$05$i16 = 0, $src$13$i = 0, $sum$0$lcssa = 0, $sum$036 = 0, $sum$1$lcssa = 0, $sum$129 = 0, $sum$2$lcssa = 0, $sum$223 = 0, $sum$3$lcssa = 0, $sum$319 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($n1)) + 4|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ((($n1)) + 8|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = (($3) + ($1))|0;
 $5 = ((($n2)) + 4|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ((($n2)) + 8|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = (($8) + ($6))|0;
 $10 = (($9) + ($4))|0;
 $11 = (($8) + ($3))|0;
 $12 = ($3|0)>($8|0);
 $$ = $12 ? $3 : $8;
 $13 = ($$|0)<($scale|0);
 $scale$$ = $13 ? $scale : $$;
 $14 = ($11|0)>($scale$$|0);
 $scale$$$ = $14 ? $scale$$ : $11;
 $15 = (($11) - ($scale$$$))|0;
 $16 = (($10) - ($11))|0;
 $17 = (($16) + 20)|0;
 $18 = (($17) + ($scale$$$))|0;
 $19 = (_malloc($18)|0);
 $20 = ($19|0)==(0|0);
 if ($20) {
  _out_of_memory();
  // unreachable;
 }
 $21 = ((($19)) + 4|0);
 HEAP32[$21>>2] = $16;
 $22 = ((($19)) + 8|0);
 HEAP32[$22>>2] = $scale$$$;
 $23 = ((($19)) + 12|0);
 HEAP32[$23>>2] = 1;
 $24 = ((($19)) + 16|0);
 HEAP8[$24>>0] = 0;
 $25 = HEAP32[$n1>>2]|0;
 $26 = HEAP32[$n2>>2]|0;
 $not$ = ($25|0)!=($26|0);
 $27 = $not$&1;
 HEAP32[$19>>2] = $27;
 $28 = ((($n1)) + 16|0);
 $$sum = (($4) + -1)|0;
 $$sum2 = (($9) + -1)|0;
 $29 = (((($n2)) + 16|0) + ($$sum2)|0);
 $$sum3 = (($10) + -1)|0;
 $$sum4 = (($$sum3) - ($15))|0;
 $30 = (((($19)) + 16|0) + ($$sum4)|0);
 $31 = ($15|0)>(0);
 if ($31) {
  $indx$035 = 0;$sum$036 = 0;
  while(1) {
   $39 = (($indx$035) - ($9))|0;
   $40 = ($39|0)<(-1);
   $41 = (($39) + 1)|0;
   $$12 = $40 ? 0 : $41;
   $$sum7 = (($$sum) - ($$12))|0;
   $42 = ($indx$035|0)>($$sum2|0);
   $43 = $42 ? $$sum2 : $indx$035;
   $$sum8 = (($$sum2) - ($43))|0;
   $44 = ($$sum7|0)<(0);
   $45 = ($$sum8|0)>($$sum2|0);
   $or$cond28 = $45 | $44;
   if ($or$cond28) {
    $sum$1$lcssa = $sum$036;
   } else {
    $46 = (((($n2)) + 16|0) + ($$sum8)|0);
    $47 = (((($n1)) + 16|0) + ($$sum7)|0);
    $n1ptr$031 = $47;$n2ptr$030 = $46;$sum$129 = $sum$036;
    while(1) {
     $48 = ((($n1ptr$031)) + -1|0);
     $49 = HEAP8[$n1ptr$031>>0]|0;
     $50 = $49 << 24 >> 24;
     $51 = ((($n2ptr$030)) + 1|0);
     $52 = HEAP8[$n2ptr$030>>0]|0;
     $53 = $52 << 24 >> 24;
     $54 = Math_imul($53, $50)|0;
     $55 = (($54) + ($sum$129))|0;
     $56 = ($48>>>0)<($28>>>0);
     $57 = ($51>>>0)>($29>>>0);
     $or$cond = $57 | $56;
     if ($or$cond) {
      $sum$1$lcssa = $55;
      break;
     } else {
      $n1ptr$031 = $48;$n2ptr$030 = $51;$sum$129 = $55;
     }
    }
   }
   $58 = (($sum$1$lcssa|0) / 10)&-1;
   $59 = (($indx$035) + 1)|0;
   $exitcond47 = ($59|0)==($15|0);
   if ($exitcond47) {
    $indx$0$lcssa = $15;$sum$0$lcssa = $58;
    break;
   } else {
    $indx$035 = $59;$sum$036 = $58;
   }
  }
 } else {
  $indx$0$lcssa = 0;$sum$0$lcssa = 0;
 }
 $32 = ($indx$0$lcssa|0)<($$sum3|0);
 if ($32) {
  $33 = (($scale$$$) + ($indx$0$lcssa))|0;
  $34 = (($33) + 16)|0;
  $35 = (($34) - ($11))|0;
  $36 = (($4) + ($8))|0;
  $37 = (($36) + ($6))|0;
  $38 = (($37) + -1)|0;
  $indx$122 = $indx$0$lcssa;$pvptr$024 = $30;$sum$223 = $sum$0$lcssa;
  while(1) {
   $60 = (($indx$122) - ($9))|0;
   $61 = ($60|0)<(-1);
   $62 = (($60) + 1)|0;
   $$13 = $61 ? 0 : $62;
   $$sum5 = (($$sum) - ($$13))|0;
   $63 = ($indx$122|0)>($$sum2|0);
   $64 = $63 ? $$sum2 : $indx$122;
   $$sum6 = (($$sum2) - ($64))|0;
   $65 = ($$sum5|0)<(0);
   $66 = ($$sum6|0)>($$sum2|0);
   $or$cond1418 = $66 | $65;
   if ($or$cond1418) {
    $sum$3$lcssa = $sum$223;
   } else {
    $67 = (((($n2)) + 16|0) + ($$sum6)|0);
    $68 = (((($n1)) + 16|0) + ($$sum5)|0);
    $n1ptr$121 = $68;$n2ptr$120 = $67;$sum$319 = $sum$223;
    while(1) {
     $69 = ((($n1ptr$121)) + -1|0);
     $70 = HEAP8[$n1ptr$121>>0]|0;
     $71 = $70 << 24 >> 24;
     $72 = ((($n2ptr$120)) + 1|0);
     $73 = HEAP8[$n2ptr$120>>0]|0;
     $74 = $73 << 24 >> 24;
     $75 = Math_imul($74, $71)|0;
     $76 = (($75) + ($sum$319))|0;
     $77 = ($69>>>0)<($28>>>0);
     $78 = ($72>>>0)>($29>>>0);
     $or$cond14 = $78 | $77;
     if ($or$cond14) {
      $sum$3$lcssa = $76;
      break;
     } else {
      $n1ptr$121 = $69;$n2ptr$120 = $72;$sum$319 = $76;
     }
    }
   }
   $79 = (($sum$3$lcssa|0) % 10)&-1;
   $80 = $79&255;
   $81 = ((($pvptr$024)) + -1|0);
   HEAP8[$pvptr$024>>0] = $80;
   $82 = (($sum$3$lcssa|0) / 10)&-1;
   $83 = (($indx$122) + 1)|0;
   $exitcond = ($83|0)==($38|0);
   if ($exitcond) {
    $$lcssa65 = $82;
    break;
   } else {
    $indx$122 = $83;$pvptr$024 = $81;$sum$223 = $82;
   }
  }
  $scevgep = (($19) + ($35)|0);
  $pvptr$0$lcssa = $scevgep;$sum$2$lcssa = $$lcssa65;
 } else {
  $pvptr$0$lcssa = $30;$sum$2$lcssa = $sum$0$lcssa;
 }
 $84 = $sum$2$lcssa&255;
 HEAP8[$pvptr$0$lcssa>>0] = $84;
 $85 = HEAP32[$prod>>2]|0;
 $86 = ($85|0)==(0|0);
 if (!($86)) {
  $87 = ((($85)) + 12|0);
  $88 = HEAP32[$87>>2]|0;
  $89 = (($88) + -1)|0;
  HEAP32[$87>>2] = $89;
  $90 = ($89|0)==(0);
  if ($90) {
   _free($85);
  }
  HEAP32[$prod>>2] = 0;
 }
 HEAP32[$prod>>2] = $19;
 $91 = HEAP8[$24>>0]|0;
 $92 = ($91<<24>>24)==(0);
 if ($92) {
  $93 = HEAP32[$21>>2]|0;
  $94 = ($93|0)>(1);
  L32: do {
   if ($94) {
    $bytes$04$i17 = $93;$src$05$i16 = $24;
    while(1) {
     $95 = ((($src$05$i16)) + 1|0);
     $96 = (($bytes$04$i17) + -1)|0;
     $97 = ($96|0)>(1);
     if (!($97)) {
      $bytes$0$lcssa$i = $96;$src$0$lcssa$i = $95;
      break L32;
     }
     $$pre$i = HEAP8[$95>>0]|0;
     $98 = ($$pre$i<<24>>24)==(0);
     if ($98) {
      $bytes$04$i17 = $96;$src$05$i16 = $95;
     } else {
      $bytes$0$lcssa$i = $96;$src$0$lcssa$i = $95;
      break;
     }
    }
   } else {
    $bytes$0$lcssa$i = $93;$src$0$lcssa$i = $24;
   }
  } while(0);
  HEAP32[$21>>2] = $bytes$0$lcssa$i;
  $99 = HEAP32[$22>>2]|0;
  $100 = (($99) + ($bytes$0$lcssa$i))|0;
  $101 = ($100|0)>(0);
  if ($101) {
   $bytes$11$i = $100;$dst$02$i = $24;$src$13$i = $src$0$lcssa$i;
   while(1) {
    $102 = (($bytes$11$i) + -1)|0;
    $103 = ((($src$13$i)) + 1|0);
    $104 = HEAP8[$src$13$i>>0]|0;
    $105 = ((($dst$02$i)) + 1|0);
    HEAP8[$dst$02$i>>0] = $104;
    $106 = ($bytes$11$i|0)>(1);
    if ($106) {
     $bytes$11$i = $102;$dst$02$i = $105;$src$13$i = $103;
    } else {
     break;
    }
   }
   $$pre = HEAP32[$prod>>2]|0;
   $109 = $$pre;
  } else {
   $109 = $19;
  }
 } else {
  $109 = $19;
 }
 $107 = HEAP32[1320>>2]|0;
 $108 = ($107|0)==($109|0);
 if (!($108)) {
  $110 = ((($109)) + 4|0);
  $111 = HEAP32[$110>>2]|0;
  $112 = ((($109)) + 8|0);
  $113 = HEAP32[$112>>2]|0;
  $114 = (($113) + ($111))|0;
  $115 = ($114|0)>(0);
  L43: do {
   if ($115) {
    $116 = ((($109)) + 16|0);
    $count$01$i = $114;$nptr$02$i = $116;
    while(1) {
     $117 = HEAP8[$nptr$02$i>>0]|0;
     $118 = ($117<<24>>24)==(0);
     if (!($118)) {
      $count$0$lcssa$i = $count$01$i;
      break L43;
     }
     $119 = ((($nptr$02$i)) + 1|0);
     $120 = (($count$01$i) + -1)|0;
     $121 = ($count$01$i|0)>(1);
     if ($121) {
      $count$01$i = $120;$nptr$02$i = $119;
     } else {
      $count$0$lcssa$i = $120;
      break;
     }
    }
   } else {
    $count$0$lcssa$i = $114;
   }
  } while(0);
  $122 = ($count$0$lcssa$i|0)==(0);
  if (!($122)) {
   return;
  }
 }
 HEAP32[$109>>2] = 0;
 return;
}
function _bc_divide($n1,$n2,$quot,$scale) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 $quot = $quot|0;
 $scale = $scale|0;
 var $$ = 0, $$0 = 0, $$03$i = 0, $$03$i14 = 0, $$03$i24 = 0, $$lcssa136 = 0, $$lcssa137 = 0, $$lcssa139 = 0, $$lcssa140 = 0, $$lcssa141 = 0, $$lcssa142 = 0, $$lobit = 0, $$lobit$lcssa = 0, $$off$i = 0, $$off$i16 = 0, $$off$i26 = 0, $$phi$trans$insert = 0, $$pre$i = 0, $$pre$phi100Z2D = 0, $$pre$phi102Z2D = 0;
 var $$pre$phiZ2D = 0, $$pre101 = 0, $$pre91 = 0, $$pre95 = 0, $$pre96 = 0, $$pre97 = 0, $$pre99 = 0, $$sum = 0, $$sum$i = 0, $$sum1 = 0, $$sum2 = 0, $$sum3 = 0, $$sum4 = 0, $$sum5 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0;
 var $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0;
 var $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0;
 var $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0;
 var $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0;
 var $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0;
 var $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0;
 var $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0;
 var $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0;
 var $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0;
 var $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0;
 var $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0;
 var $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0;
 var $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $borrow$052 = 0, $bytes$0$lcssa$i = 0, $bytes$04$i48 = 0, $bytes$11$i = 0, $carry$02$i = 0, $carry$02$i15 = 0, $carry$02$i25 = 0, $carry$056 = 0, $carry$1 = 0, $cond = 0, $cond40 = 0, $count$0$lcssa$i = 0, $count$0$lcssa$i34 = 0, $count$01$i = 0, $count$01$i33 = 0;
 var $count$051 = 0, $count$155 = 0, $dst$02$i = 0, $exitcond = 0, $exitcond90 = 0, $extra$0 = 0, $indvars$iv = 0, $len2$0$lcssa = 0, $len2$065 = 0, $n2ptr$071 = 0, $n2ptr$1$lcssa = 0, $n2ptr$164 = 0, $not$ = 0, $not$6 = 0, $nptr$02$i = 0, $nptr$02$i32 = 0, $nptr$04$i23 = 0, $ptr1$050 = 0, $ptr1$154 = 0, $ptr2$049 = 0;
 var $ptr2$153 = 0, $qdig$063 = 0, $qdigits$0 = 0, $qdigits$0$in = 0, $qguess$0 = 0, $qguess$1 = 0, $qguess$2 = 0, $qptr$0$ph = 0, $qptr$062 = 0, $rptr$05$i = 0, $rptr$05$i12 = 0, $rptr$05$i22 = 0, $scale$ = 0, $scale$114 = 0, $scale2$0$lcssa = 0, $scale2$072 = 0, $scevgep = 0, $scevgep$i = 0, $scevgep$i17 = 0, $src$0$lcssa$i = 0;
 var $src$05$i47 = 0, $src$13$i = 0, $val$0 = 0, $val$1 = 0, $zero$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1320>>2]|0;
 $1 = ($0|0)==($n2|0);
 if ($1) {
  $$0 = -1;
  return ($$0|0);
 }
 $2 = ((($n2)) + 4|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ((($n2)) + 8|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (($5) + ($3))|0;
 $7 = ($6|0)>(0);
 L4: do {
  if ($7) {
   $8 = ((($n2)) + 16|0);
   $count$01$i = $6;$nptr$02$i = $8;
   while(1) {
    $9 = HEAP8[$nptr$02$i>>0]|0;
    $10 = ($9<<24>>24)==(0);
    if (!($10)) {
     $count$0$lcssa$i = $count$01$i;
     break L4;
    }
    $11 = ((($nptr$02$i)) + 1|0);
    $12 = (($count$01$i) + -1)|0;
    $13 = ($count$01$i|0)>(1);
    if ($13) {
     $count$01$i = $12;$nptr$02$i = $11;
    } else {
     $count$0$lcssa$i = $12;
     break;
    }
   }
  } else {
   $count$0$lcssa$i = $6;
  }
 } while(0);
 $14 = ($count$0$lcssa$i|0)==(0);
 if ($14) {
  $$0 = -1;
  return ($$0|0);
 }
 $15 = ($5|0)==(0);
 if ($15) {
  $16 = ($3|0)==(1);
  if ($16) {
   $17 = ((($n2)) + 16|0);
   $18 = HEAP8[$17>>0]|0;
   $19 = ($18<<24>>24)==(1);
   if ($19) {
    $20 = ((($n1)) + 4|0);
    $21 = HEAP32[$20>>2]|0;
    $22 = (($scale) + 20)|0;
    $23 = (($22) + ($21))|0;
    $24 = (_malloc($23)|0);
    $25 = ($24|0)==(0|0);
    if ($25) {
     _out_of_memory();
     // unreachable;
    }
    $26 = ((($24)) + 4|0);
    HEAP32[$26>>2] = $21;
    $27 = ((($24)) + 8|0);
    HEAP32[$27>>2] = $scale;
    $28 = ((($24)) + 12|0);
    HEAP32[$28>>2] = 1;
    $29 = ((($24)) + 16|0);
    HEAP8[$29>>0] = 0;
    $30 = HEAP32[$n1>>2]|0;
    $31 = HEAP32[$n2>>2]|0;
    $not$6 = ($30|0)!=($31|0);
    $32 = $not$6&1;
    HEAP32[$24>>2] = $32;
    $33 = (((($24)) + 16|0) + ($21)|0);
    _memset(($33|0),0,($scale|0))|0;
    $34 = ((($n1)) + 16|0);
    $35 = ((($n1)) + 8|0);
    $36 = HEAP32[$35>>2]|0;
    $37 = ($36|0)>($scale|0);
    $scale$ = $37 ? $scale : $36;
    $38 = (($scale$) + ($21))|0;
    _memcpy(($29|0),($34|0),($38|0))|0;
    $39 = HEAP32[$quot>>2]|0;
    $40 = ($39|0)==(0|0);
    if (!($40)) {
     $41 = ((($39)) + 12|0);
     $42 = HEAP32[$41>>2]|0;
     $43 = (($42) + -1)|0;
     HEAP32[$41>>2] = $43;
     $44 = ($43|0)==(0);
     if ($44) {
      _free($39);
     }
     HEAP32[$quot>>2] = 0;
    }
    HEAP32[$quot>>2] = $24;
    $$pre91 = HEAP32[$4>>2]|0;
    $45 = ($$pre91|0)==(0);
    if ($45) {
     $scale2$0$lcssa = 0;
    } else {
     $46 = $$pre91;
     label = 17;
    }
   } else {
    $scale2$0$lcssa = 0;
   }
  } else {
   $scale2$0$lcssa = 0;
  }
 } else {
  $46 = $5;
  label = 17;
 }
 L26: do {
  if ((label|0) == 17) {
   $$sum = (($46) + -1)|0;
   $47 = HEAP32[$2>>2]|0;
   $$sum1 = (($$sum) + ($47))|0;
   $48 = (((($n2)) + 16|0) + ($$sum1)|0);
   $n2ptr$071 = $48;$scale2$072 = $46;
   while(1) {
    $49 = HEAP8[$n2ptr$071>>0]|0;
    $50 = ($49<<24>>24)==(0);
    if (!($50)) {
     $scale2$0$lcssa = $scale2$072;
     break L26;
    }
    $51 = ((($n2ptr$071)) + -1|0);
    $52 = (($scale2$072) + -1)|0;
    $53 = ($52|0)==(0);
    if ($53) {
     $scale2$0$lcssa = 0;
     break;
    } else {
     $n2ptr$071 = $51;$scale2$072 = $52;
    }
   }
  }
 } while(0);
 $54 = ((($n1)) + 4|0);
 $55 = HEAP32[$54>>2]|0;
 $56 = (($55) + ($scale2$0$lcssa))|0;
 $57 = ((($n1)) + 8|0);
 $58 = HEAP32[$57>>2]|0;
 $59 = (($58) - ($scale2$0$lcssa))|0;
 $60 = ($59|0)<($scale|0);
 $61 = (($scale) - ($59))|0;
 $extra$0 = $60 ? $61 : 0;
 $62 = (($55) + 2)|0;
 $63 = (($62) + ($58))|0;
 $64 = (($63) + ($extra$0))|0;
 $65 = (_malloc($64)|0);
 $66 = ($65|0)==(0|0);
 if ($66) {
  _out_of_memory();
  // unreachable;
 }
 $67 = (($extra$0) + 2)|0;
 $68 = (($67) + ($55))|0;
 $69 = (($68) + ($58))|0;
 _memset(($65|0),0,($69|0))|0;
 $70 = ((($65)) + 1|0);
 $71 = ((($n1)) + 16|0);
 $72 = (($58) + ($55))|0;
 _memcpy(($70|0),($71|0),($72|0))|0;
 $73 = HEAP32[$2>>2]|0;
 $74 = (($73) + ($scale2$0$lcssa))|0;
 $75 = (($74) + 1)|0;
 $76 = (_malloc($75)|0);
 $77 = ($76|0)==(0|0);
 if ($77) {
  _out_of_memory();
  // unreachable;
 }
 $78 = ((($n2)) + 16|0);
 _memcpy(($76|0),($78|0),($74|0))|0;
 $79 = (($76) + ($74)|0);
 HEAP8[$79>>0] = 0;
 $80 = HEAP8[$76>>0]|0;
 $81 = ($80<<24>>24)==(0);
 if ($81) {
  $len2$065 = $74;$n2ptr$164 = $76;
  while(1) {
   $82 = ((($n2ptr$164)) + 1|0);
   $83 = (($len2$065) + -1)|0;
   $84 = HEAP8[$82>>0]|0;
   $85 = ($84<<24>>24)==(0);
   if ($85) {
    $len2$065 = $83;$n2ptr$164 = $82;
   } else {
    $len2$0$lcssa = $83;$n2ptr$1$lcssa = $82;
    break;
   }
  }
 } else {
  $len2$0$lcssa = $74;$n2ptr$1$lcssa = $76;
 }
 $86 = (($56) + ($scale))|0;
 $87 = ($86>>>0)<($len2$0$lcssa>>>0);
 if ($87) {
  $qdigits$0$in = $scale;$zero$0 = 1;
 } else {
  $88 = ($len2$0$lcssa>>>0)>($56>>>0);
  $89 = (($86) - ($len2$0$lcssa))|0;
  $scale$114 = $88 ? $scale : $89;
  $qdigits$0$in = $scale$114;$zero$0 = 0;
 }
 $qdigits$0 = (($qdigits$0$in) + 1)|0;
 $90 = (($qdigits$0) - ($scale))|0;
 $91 = (($qdigits$0$in) + 21)|0;
 $92 = (_malloc($91)|0);
 $93 = ($92|0)==(0|0);
 if ($93) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$92>>2] = 0;
 $94 = ((($92)) + 4|0);
 HEAP32[$94>>2] = $90;
 $95 = ((($92)) + 8|0);
 HEAP32[$95>>2] = $scale;
 $96 = ((($92)) + 12|0);
 HEAP32[$96>>2] = 1;
 $97 = ((($92)) + 16|0);
 HEAP8[$97>>0] = 0;
 _memset(($97|0),0,($qdigits$0|0))|0;
 $98 = (($len2$0$lcssa) + 1)|0;
 $99 = (_malloc($98)|0);
 $100 = ($99|0)==(0|0);
 if ($100) {
  _out_of_memory();
  // unreachable;
 }
 $101 = ($zero$0<<24>>24)==(0);
 if ($101) {
  $102 = HEAP8[$n2ptr$1$lcssa>>0]|0;
  $103 = $102&255;
  $104 = (($103) + 1)|0;
  $105 = (10 / ($104>>>0))&-1;
  $106 = ($105|0)==(1);
  L53: do {
   if (!($106)) {
    $107 = (($58) + ($55))|0;
    $108 = (($107) + ($extra$0))|0;
    $109 = (($108) + 1)|0;
    $cond = ($105|0)==(0);
    L55: do {
     if ($cond) {
      _memset(($65|0),0,($109|0))|0;
     } else {
      $110 = ($109|0)>(0);
      if ($110) {
       $111 = (($65) + ($108)|0);
       $$03$i = $109;$carry$02$i = 0;$rptr$05$i = $111;
       while(1) {
        $112 = (($$03$i) + -1)|0;
        $113 = ((($rptr$05$i)) + -1|0);
        $114 = HEAP8[$rptr$05$i>>0]|0;
        $115 = $114&255;
        $116 = Math_imul($115, $105)|0;
        $117 = (($116) + ($carry$02$i))|0;
        $118 = (($117|0) % 10)&-1;
        $119 = $118&255;
        HEAP8[$rptr$05$i>>0] = $119;
        $120 = (($117|0) / 10)&-1;
        $121 = ($$03$i|0)>(1);
        if ($121) {
         $$03$i = $112;$carry$02$i = $120;$rptr$05$i = $113;
        } else {
         $$lcssa141 = $117;$$lcssa142 = $120;
         break;
        }
       }
       $$off$i = (($$lcssa141) + 9)|0;
       $122 = ($$off$i>>>0)<(19);
       if (!($122)) {
        $scevgep$i = ((($65)) + -1|0);
        $123 = $$lcssa142&255;
        HEAP8[$scevgep$i>>0] = $123;
       }
      }
      switch ($105|0) {
      case 1:  {
       break L53;
       break;
      }
      case 0:  {
       break L55;
       break;
      }
      default: {
      }
      }
      $124 = ($len2$0$lcssa|0)>(0);
      if (!($124)) {
       break L53;
      }
      $$sum$i = (($len2$0$lcssa) + -1)|0;
      $125 = (($n2ptr$1$lcssa) + ($$sum$i)|0);
      $$03$i14 = $len2$0$lcssa;$carry$02$i15 = 0;$rptr$05$i12 = $125;
      while(1) {
       $126 = (($$03$i14) + -1)|0;
       $127 = ((($rptr$05$i12)) + -1|0);
       $128 = HEAP8[$rptr$05$i12>>0]|0;
       $129 = $128&255;
       $130 = Math_imul($129, $105)|0;
       $131 = (($130) + ($carry$02$i15))|0;
       $132 = (($131|0) % 10)&-1;
       $133 = $132&255;
       HEAP8[$rptr$05$i12>>0] = $133;
       $134 = (($131|0) / 10)&-1;
       $135 = ($$03$i14|0)>(1);
       if ($135) {
        $$03$i14 = $126;$carry$02$i15 = $134;$rptr$05$i12 = $127;
       } else {
        $$lcssa139 = $131;$$lcssa140 = $134;
        break;
       }
      }
      $$off$i16 = (($$lcssa139) + 9)|0;
      $136 = ($$off$i16>>>0)<(19);
      if ($136) {
       break L53;
      }
      $scevgep$i17 = ((($n2ptr$1$lcssa)) + -1|0);
      $137 = $$lcssa140&255;
      HEAP8[$scevgep$i17>>0] = $137;
      break L53;
     }
    } while(0);
    _memset(($n2ptr$1$lcssa|0),0,($len2$0$lcssa|0))|0;
   }
  } while(0);
  $138 = ($len2$0$lcssa>>>0)>($56>>>0);
  $$sum5 = (($len2$0$lcssa) - ($56))|0;
  $139 = (((($92)) + 16|0) + ($$sum5)|0);
  $qptr$0$ph = $138 ? $139 : $97;
  $140 = (($86) - ($len2$0$lcssa))|0;
  $141 = ((($n2ptr$1$lcssa)) + 1|0);
  $142 = ((($99)) + 1|0);
  $143 = (($99) + ($len2$0$lcssa)|0);
  $144 = ($98|0)==(0);
  $$sum3 = (($len2$0$lcssa) + -1)|0;
  $145 = (($n2ptr$1$lcssa) + ($$sum3)|0);
  $146 = ($len2$0$lcssa|0)==(0);
  $147 = ($len2$0$lcssa|0)>(0);
  $indvars$iv = $65;$qdig$063 = 0;$qptr$062 = $qptr$0$ph;
  while(1) {
   $148 = HEAP8[$n2ptr$1$lcssa>>0]|0;
   $149 = (($65) + ($qdig$063)|0);
   $150 = HEAP8[$149>>0]|0;
   $151 = ($148<<24>>24)==($150<<24>>24);
   if ($151) {
    $$pre95 = (($qdig$063) + 1)|0;
    $$phi$trans$insert = (($65) + ($$pre95)|0);
    $$pre96 = HEAP8[$$phi$trans$insert>>0]|0;
    $$pre97 = $150&255;
    $$pre99 = ($$pre97*10)|0;
    $$pre101 = $148&255;
    $$pre$phi100Z2D = $$pre99;$$pre$phi102Z2D = $$pre101;$$pre$phiZ2D = $$pre95;$165 = $$pre96;$qguess$0 = 9;
   } else {
    $152 = $148&255;
    $153 = $150&255;
    $154 = ($153*10)|0;
    $155 = (($qdig$063) + 1)|0;
    $156 = (($65) + ($155)|0);
    $157 = HEAP8[$156>>0]|0;
    $158 = $157&255;
    $159 = (($158) + ($154))|0;
    $160 = (($159>>>0) / ($152>>>0))&-1;
    $$pre$phi100Z2D = $154;$$pre$phi102Z2D = $152;$$pre$phiZ2D = $155;$165 = $157;$qguess$0 = $160;
   }
   $161 = HEAP8[$141>>0]|0;
   $162 = $161&255;
   $163 = Math_imul($162, $qguess$0)|0;
   $164 = $165&255;
   $166 = (($$pre$phi100Z2D) + ($164))|0;
   $167 = Math_imul($$pre$phi102Z2D, $qguess$0)|0;
   $168 = (($166) - ($167))|0;
   $169 = ($168*10)|0;
   $170 = (($qdig$063) + 2)|0;
   $171 = (($65) + ($170)|0);
   $172 = HEAP8[$171>>0]|0;
   $173 = $172&255;
   $174 = (($169) + ($173))|0;
   $175 = ($163>>>0)>($174>>>0);
   if ($175) {
    $176 = (($qguess$0) + -1)|0;
    $177 = Math_imul($162, $176)|0;
    $178 = Math_imul($$pre$phi102Z2D, $176)|0;
    $179 = (($166) - ($178))|0;
    $180 = ($179*10)|0;
    $181 = (($180) + ($173))|0;
    $182 = ($177>>>0)>($181>>>0);
    $183 = (($qguess$0) + -2)|0;
    $$ = $182 ? $183 : $176;
    $qguess$1 = $$;
   } else {
    $qguess$1 = $qguess$0;
   }
   $184 = ($qguess$1|0)==(0);
   do {
    if ($184) {
     $qguess$2 = 0;
    } else {
     HEAP8[$99>>0] = 0;
     $cond40 = ($qguess$1|0)==(1);
     do {
      if ($cond40) {
       _memcpy(($142|0),($n2ptr$1$lcssa|0),($len2$0$lcssa|0))|0;
      } else {
       if ($147) {
        $$03$i24 = $len2$0$lcssa;$carry$02$i25 = 0;$nptr$04$i23 = $145;$rptr$05$i22 = $143;
       } else {
        break;
       }
       while(1) {
        $185 = (($$03$i24) + -1)|0;
        $186 = ((($nptr$04$i23)) + -1|0);
        $187 = HEAP8[$nptr$04$i23>>0]|0;
        $188 = $187&255;
        $189 = Math_imul($188, $qguess$1)|0;
        $190 = (($189) + ($carry$02$i25))|0;
        $191 = (($190|0) % 10)&-1;
        $192 = $191&255;
        $193 = ((($rptr$05$i22)) + -1|0);
        HEAP8[$rptr$05$i22>>0] = $192;
        $194 = (($190|0) / 10)&-1;
        $195 = ($$03$i24|0)>(1);
        if ($195) {
         $$03$i24 = $185;$carry$02$i25 = $194;$nptr$04$i23 = $186;$rptr$05$i22 = $193;
        } else {
         $$lcssa136 = $190;$$lcssa137 = $194;
         break;
        }
       }
       $$off$i26 = (($$lcssa136) + 9)|0;
       $196 = ($$off$i26>>>0)<(19);
       if ($196) {
        break;
       }
       $197 = $$lcssa137&255;
       HEAP8[$99>>0] = $197;
      }
     } while(0);
     if ($144) {
      $qguess$2 = $qguess$1;
     } else {
      $$sum4 = (($qdig$063) + ($len2$0$lcssa))|0;
      $198 = (($65) + ($$sum4)|0);
      $borrow$052 = 0;$count$051 = 0;$ptr1$050 = $198;$ptr2$049 = $143;
      while(1) {
       $199 = HEAP8[$ptr1$050>>0]|0;
       $200 = $199&255;
       $201 = ((($ptr2$049)) + -1|0);
       $202 = HEAP8[$ptr2$049>>0]|0;
       $203 = $202&255;
       $204 = (($200) - ($203))|0;
       $205 = (($204) - ($borrow$052))|0;
       $206 = ($205|0)<(0);
       $207 = (($205) + 10)|0;
       $val$0 = $206 ? $207 : $205;
       $$lobit = $205 >>> 31;
       $208 = $val$0&255;
       $209 = ((($ptr1$050)) + -1|0);
       HEAP8[$ptr1$050>>0] = $208;
       $210 = (($count$051) + 1)|0;
       $exitcond = ($210|0)==($98|0);
       if ($exitcond) {
        $$lobit$lcssa = $$lobit;
        break;
       } else {
        $borrow$052 = $$lobit;$count$051 = $210;$ptr1$050 = $209;$ptr2$049 = $201;
       }
      }
      $211 = ($$lobit$lcssa|0)==(1);
      if (!($211)) {
       $qguess$2 = $qguess$1;
       break;
      }
      $212 = (($qguess$1) + -1)|0;
      if ($146) {
       $qguess$2 = $212;
       break;
      }
      $$sum2 = (($qdig$063) + ($len2$0$lcssa))|0;
      $213 = (($65) + ($$sum2)|0);
      $carry$056 = 0;$count$155 = 0;$ptr1$154 = $213;$ptr2$153 = $145;
      while(1) {
       $214 = HEAP8[$ptr1$154>>0]|0;
       $215 = $214&255;
       $216 = ((($ptr2$153)) + -1|0);
       $217 = HEAP8[$ptr2$153>>0]|0;
       $218 = $217&255;
       $219 = (($215) + ($carry$056))|0;
       $220 = (($219) + ($218))|0;
       $221 = ($220|0)>(9);
       $222 = (($220) + 246)|0;
       $val$1 = $221 ? $222 : $220;
       $carry$1 = $221&1;
       $223 = $val$1&255;
       $224 = ((($ptr1$154)) + -1|0);
       HEAP8[$ptr1$154>>0] = $223;
       $225 = (($count$155) + 1)|0;
       $exitcond90 = ($225|0)==($len2$0$lcssa|0);
       if ($exitcond90) {
        break;
       } else {
        $carry$056 = $carry$1;$count$155 = $225;$ptr1$154 = $224;$ptr2$153 = $216;
       }
      }
      if (!($221)) {
       $qguess$2 = $212;
       break;
      }
      $226 = HEAP8[$indvars$iv>>0]|0;
      $227 = $226&255;
      $228 = (($227) + 1)|0;
      $229 = (($228>>>0) % 10)&-1;
      $230 = $229&255;
      HEAP8[$indvars$iv>>0] = $230;
      $qguess$2 = $212;
     }
    }
   } while(0);
   $231 = $qguess$2&255;
   $232 = ((($qptr$062)) + 1|0);
   HEAP8[$qptr$062>>0] = $231;
   $233 = ($$pre$phiZ2D>>>0)>($140>>>0);
   $scevgep = ((($indvars$iv)) + 1|0);
   if ($233) {
    break;
   } else {
    $indvars$iv = $scevgep;$qdig$063 = $$pre$phiZ2D;$qptr$062 = $232;
   }
  }
 }
 $234 = HEAP32[$n1>>2]|0;
 $235 = HEAP32[$n2>>2]|0;
 $not$ = ($234|0)!=($235|0);
 $236 = $not$&1;
 HEAP32[$92>>2] = $236;
 $237 = HEAP32[1320>>2]|0;
 $238 = ($237|0)==($92|0);
 if ($238) {
  label = 76;
 } else {
  $239 = HEAP32[$94>>2]|0;
  $240 = HEAP32[$95>>2]|0;
  $241 = (($240) + ($239))|0;
  $242 = ($241|0)>(0);
  L106: do {
   if ($242) {
    $count$01$i33 = $241;$nptr$02$i32 = $97;
    while(1) {
     $243 = HEAP8[$nptr$02$i32>>0]|0;
     $244 = ($243<<24>>24)==(0);
     if (!($244)) {
      $count$0$lcssa$i34 = $count$01$i33;
      break L106;
     }
     $245 = ((($nptr$02$i32)) + 1|0);
     $246 = (($count$01$i33) + -1)|0;
     $247 = ($count$01$i33|0)>(1);
     if ($247) {
      $count$01$i33 = $246;$nptr$02$i32 = $245;
     } else {
      $count$0$lcssa$i34 = $246;
      break;
     }
    }
   } else {
    $count$0$lcssa$i34 = $241;
   }
  } while(0);
  $248 = ($count$0$lcssa$i34|0)==(0);
  if ($248) {
   label = 76;
  }
 }
 if ((label|0) == 76) {
  HEAP32[$92>>2] = 0;
 }
 $249 = HEAP8[$97>>0]|0;
 $250 = ($249<<24>>24)==(0);
 if ($250) {
  $251 = HEAP32[$94>>2]|0;
  $252 = ($251|0)>(1);
  L116: do {
   if ($252) {
    $bytes$04$i48 = $251;$src$05$i47 = $97;
    while(1) {
     $253 = ((($src$05$i47)) + 1|0);
     $254 = (($bytes$04$i48) + -1)|0;
     $255 = ($254|0)>(1);
     if (!($255)) {
      $bytes$0$lcssa$i = $254;$src$0$lcssa$i = $253;
      break L116;
     }
     $$pre$i = HEAP8[$253>>0]|0;
     $256 = ($$pre$i<<24>>24)==(0);
     if ($256) {
      $bytes$04$i48 = $254;$src$05$i47 = $253;
     } else {
      $bytes$0$lcssa$i = $254;$src$0$lcssa$i = $253;
      break;
     }
    }
   } else {
    $bytes$0$lcssa$i = $251;$src$0$lcssa$i = $97;
   }
  } while(0);
  HEAP32[$94>>2] = $bytes$0$lcssa$i;
  $257 = HEAP32[$95>>2]|0;
  $258 = (($257) + ($bytes$0$lcssa$i))|0;
  $259 = ($258|0)>(0);
  if ($259) {
   $bytes$11$i = $258;$dst$02$i = $97;$src$13$i = $src$0$lcssa$i;
   while(1) {
    $260 = (($bytes$11$i) + -1)|0;
    $261 = ((($src$13$i)) + 1|0);
    $262 = HEAP8[$src$13$i>>0]|0;
    $263 = ((($dst$02$i)) + 1|0);
    HEAP8[$dst$02$i>>0] = $262;
    $264 = ($bytes$11$i|0)>(1);
    if ($264) {
     $bytes$11$i = $260;$dst$02$i = $263;$src$13$i = $261;
    } else {
     break;
    }
   }
  }
 }
 $265 = HEAP32[$quot>>2]|0;
 $266 = ($265|0)==(0|0);
 if (!($266)) {
  $267 = ((($265)) + 12|0);
  $268 = HEAP32[$267>>2]|0;
  $269 = (($268) + -1)|0;
  HEAP32[$267>>2] = $269;
  $270 = ($269|0)==(0);
  if ($270) {
   _free($265);
  }
  HEAP32[$quot>>2] = 0;
 }
 HEAP32[$quot>>2] = $92;
 _free($99);
 _free($65);
 _free($76);
 $$0 = 0;
 return ($$0|0);
}
function _bc_modulo($num1,$num2,$result,$scale) {
 $num1 = $num1|0;
 $num2 = $num2|0;
 $result = $result|0;
 $scale = $scale|0;
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $count$0$lcssa$i = 0, $count$01$i = 0, $nptr$02$i = 0, $temp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $temp = sp;
 $0 = HEAP32[1320>>2]|0;
 $1 = ($0|0)==($num2|0);
 if ($1) {
  $$0 = -1;
  STACKTOP = sp;return ($$0|0);
 }
 $2 = ((($num2)) + 4|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ((($num2)) + 8|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = (($5) + ($3))|0;
 $7 = ($6|0)>(0);
 L4: do {
  if ($7) {
   $8 = ((($num2)) + 16|0);
   $count$01$i = $6;$nptr$02$i = $8;
   while(1) {
    $9 = HEAP8[$nptr$02$i>>0]|0;
    $10 = ($9<<24>>24)==(0);
    if (!($10)) {
     $count$0$lcssa$i = $count$01$i;
     break L4;
    }
    $11 = ((($nptr$02$i)) + 1|0);
    $12 = (($count$01$i) + -1)|0;
    $13 = ($count$01$i|0)>(1);
    if ($13) {
     $count$01$i = $12;$nptr$02$i = $11;
    } else {
     $count$0$lcssa$i = $12;
     break;
    }
   }
  } else {
   $count$0$lcssa$i = $6;
  }
 } while(0);
 $14 = ($count$0$lcssa$i|0)==(0);
 if ($14) {
  $$0 = -1;
  STACKTOP = sp;return ($$0|0);
 }
 $15 = ((($num1)) + 8|0);
 $16 = HEAP32[$15>>2]|0;
 $17 = (($5) + ($scale))|0;
 $18 = ($16|0)>($17|0);
 $$ = $18 ? $16 : $17;
 $19 = ((($0)) + 12|0);
 $20 = HEAP32[$19>>2]|0;
 $21 = (($20) + 1)|0;
 HEAP32[$19>>2] = $21;
 HEAP32[$temp>>2] = $0;
 (_bc_divide($num1,$num2,$temp,$scale)|0);
 $22 = HEAP32[$temp>>2]|0;
 _bc_multiply($22,$num2,$temp,$$);
 $23 = HEAP32[$temp>>2]|0;
 _bc_sub($num1,$23,$result);
 $24 = ($23|0)==(0|0);
 if ($24) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $25 = ((($23)) + 12|0);
 $26 = HEAP32[$25>>2]|0;
 $27 = (($26) + -1)|0;
 HEAP32[$25>>2] = $27;
 $28 = ($27|0)==(0);
 if ($28) {
  _free($23);
 }
 HEAP32[$temp>>2] = 0;
 $$0 = 0;
 STACKTOP = sp;return ($$0|0);
}
function _bc_raise($num1,$num2,$result,$scale) {
 $num1 = $num1|0;
 $num2 = $num2|0;
 $result = $result|0;
 $scale = $scale|0;
 var $$0$i = 0, $$lcssa = 0, $$lcssa$i = 0, $$lcssa31 = 0, $$lcssa32 = 0, $$lcssa33 = 0, $$lcssa34 = 0, $$phi$trans$insert = 0, $$pre = 0, $$pre18 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0;
 var $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0;
 var $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0;
 var $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0;
 var $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $9 = 0, $exponent$0 = 0, $exponent$1$lcssa = 0, $exponent$19 = 0, $exponent$2 = 0, $exponent$27 = 0, $exponent$28 = 0, $index$03$i = 0;
 var $neg$0 = 0, $nptr$02$i = 0, $phitmp$i = 0, $power = 0, $rscale$0 = 0, $scale$ = 0, $scale$$ = 0, $temp = 0, $val$01$i = 0, $val$2$i = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $temp = sp + 16|0;
 $power = sp + 12|0;
 $0 = ((($num2)) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0);
 if (!($2)) {
  _rt_warn(10863,$vararg_buffer);
 }
 $3 = ((($num2)) + 4|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = ($4|0)>(0);
 if ($5) {
  $6 = ((($num2)) + 16|0);
  $index$03$i = $4;$nptr$02$i = $6;$val$01$i = 0;
  while(1) {
   $7 = ($val$01$i*10)|0;
   $8 = ((($nptr$02$i)) + 1|0);
   $9 = HEAP8[$nptr$02$i>>0]|0;
   $10 = $9 << 24 >> 24;
   $11 = (($10) + ($7))|0;
   $12 = (($index$03$i) + -1)|0;
   $13 = ($index$03$i|0)>(1);
   $14 = ($11|0)<(214748365);
   $15 = $13 & $14;
   if ($15) {
    $index$03$i = $12;$nptr$02$i = $8;$val$01$i = $11;
   } else {
    $$lcssa33 = $11;$$lcssa34 = $13;
    break;
   }
  }
  $phitmp$i = $$lcssa34 ? 0 : $$lcssa33;
  $$lcssa$i = $phitmp$i;
 } else {
  $$lcssa$i = 0;
 }
 $16 = ($$lcssa$i|0)<(0);
 $val$2$i = $16 ? 0 : $$lcssa$i;
 $17 = HEAP32[$num2>>2]|0;
 $18 = ($17|0)==(0);
 $19 = (0 - ($val$2$i))|0;
 $$0$i = $18 ? $val$2$i : $19;
 $20 = ($$0$i|0)==(0);
 if ($20) {
  $21 = ($4|0)>(1);
  if ($21) {
   label = 10;
  } else {
   $22 = ((($num2)) + 16|0);
   $23 = HEAP8[$22>>0]|0;
   $24 = ($23<<24>>24)==(0);
   if (!($24)) {
    label = 10;
   }
  }
  if ((label|0) == 10) {
   _rt_error(10890,$vararg_buffer1);
  }
  $25 = HEAP32[$result>>2]|0;
  $26 = ($25|0)==(0|0);
  if (!($26)) {
   $27 = ((($25)) + 12|0);
   $28 = HEAP32[$27>>2]|0;
   $29 = (($28) + -1)|0;
   HEAP32[$27>>2] = $29;
   $30 = ($29|0)==(0);
   if ($30) {
    _free($25);
   }
   HEAP32[$result>>2] = 0;
  }
  $31 = HEAP32[1324>>2]|0;
  $32 = ((($31)) + 12|0);
  $33 = HEAP32[$32>>2]|0;
  $34 = (($33) + 1)|0;
  HEAP32[$32>>2] = $34;
  HEAP32[$result>>2] = $31;
  STACKTOP = sp;return;
 }
 $35 = ($$0$i|0)<(0);
 if ($35) {
  $36 = (0 - ($$0$i))|0;
  $exponent$0 = $36;$neg$0 = 1;$rscale$0 = $scale;
 } else {
  $37 = ((($num1)) + 8|0);
  $38 = HEAP32[$37>>2]|0;
  $39 = Math_imul($38, $$0$i)|0;
  $40 = ($38|0)<($scale|0);
  $scale$ = $40 ? $scale : $38;
  $41 = ($39|0)>($scale$|0);
  $scale$$ = $41 ? $scale$ : $39;
  $exponent$0 = $$0$i;$neg$0 = 0;$rscale$0 = $scale$$;
 }
 $42 = ((($num1)) + 12|0);
 $43 = HEAP32[$42>>2]|0;
 $44 = (($43) + 1)|0;
 HEAP32[$42>>2] = $44;
 HEAP32[$power>>2] = $num1;
 $45 = $exponent$0 & 1;
 $46 = ($45|0)==(0);
 if ($46) {
  $47 = $num1;$exponent$19 = $exponent$0;
  while(1) {
   _bc_multiply($47,$47,$power,$rscale$0);
   $48 = $exponent$19 >> 1;
   $49 = $48 & 1;
   $50 = ($49|0)==(0);
   $51 = HEAP32[$power>>2]|0;
   if ($50) {
    $47 = $51;$exponent$19 = $48;
   } else {
    $$lcssa31 = $48;$$lcssa32 = $51;
    break;
   }
  }
  $$phi$trans$insert = ((($$lcssa32)) + 12|0);
  $$pre = HEAP32[$$phi$trans$insert>>2]|0;
  $$lcssa = $$lcssa32;$54 = $$pre;$exponent$1$lcssa = $$lcssa31;
 } else {
  $$lcssa = $num1;$54 = $44;$exponent$1$lcssa = $exponent$0;
 }
 $52 = ((($$lcssa)) + 12|0);
 $53 = (($54) + 1)|0;
 HEAP32[$52>>2] = $53;
 HEAP32[$temp>>2] = $$lcssa;
 $exponent$27 = $exponent$1$lcssa >> 1;
 $55 = ($exponent$27|0)>(0);
 L34: do {
  if ($55) {
   $56 = $$lcssa;$exponent$28 = $exponent$27;
   while(1) {
    _bc_multiply($56,$56,$power,$rscale$0);
    $57 = $exponent$28 & 1;
    $58 = ($57|0)==(0);
    if (!($58)) {
     $60 = HEAP32[$temp>>2]|0;
     $61 = HEAP32[$power>>2]|0;
     _bc_multiply($60,$61,$temp,$rscale$0);
    }
    $exponent$2 = $exponent$28 >> 1;
    $59 = ($exponent$2|0)>(0);
    if (!($59)) {
     break L34;
    }
    $$pre18 = HEAP32[$power>>2]|0;
    $56 = $$pre18;$exponent$28 = $exponent$2;
   }
  }
 } while(0);
 $62 = ($neg$0<<24>>24)==(0);
 if ($62) {
  $70 = HEAP32[$result>>2]|0;
  $71 = ($70|0)==(0|0);
  if (!($71)) {
   $72 = ((($70)) + 12|0);
   $73 = HEAP32[$72>>2]|0;
   $74 = (($73) + -1)|0;
   HEAP32[$72>>2] = $74;
   $75 = ($74|0)==(0);
   if ($75) {
    _free($70);
   }
   HEAP32[$result>>2] = 0;
  }
  $76 = HEAP32[$temp>>2]|0;
  HEAP32[$result>>2] = $76;
 } else {
  $63 = HEAP32[1324>>2]|0;
  $64 = HEAP32[$temp>>2]|0;
  (_bc_divide($63,$64,$result,$rscale$0)|0);
  $65 = ($64|0)==(0|0);
  if (!($65)) {
   $66 = ((($64)) + 12|0);
   $67 = HEAP32[$66>>2]|0;
   $68 = (($67) + -1)|0;
   HEAP32[$66>>2] = $68;
   $69 = ($68|0)==(0);
   if ($69) {
    _free($64);
   }
   HEAP32[$temp>>2] = 0;
  }
 }
 $77 = HEAP32[$power>>2]|0;
 $78 = ($77|0)==(0|0);
 if ($78) {
  STACKTOP = sp;return;
 }
 $79 = ((($77)) + 12|0);
 $80 = HEAP32[$79>>2]|0;
 $81 = (($80) + -1)|0;
 HEAP32[$79>>2] = $81;
 $82 = ($81|0)==(0);
 if ($82) {
  _free($77);
 }
 HEAP32[$power>>2] = 0;
 STACKTOP = sp;return;
}
function _bc_sqrt($num,$scale) {
 $num = $num|0;
 $scale = $scale|0;
 var $$0 = 0, $$2$i$us = 0, $$lcssa102 = 0, $$lcssa103 = 0, $$pre = 0, $$pre42 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0;
 var $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0;
 var $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0;
 var $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0;
 var $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0;
 var $96 = 0, $97 = 0, $98 = 0, $99 = 0, $count$016$i$us = 0, $count$024$i$us = 0, $count$024$i$us$lcssa = 0, $count$118$i$us = 0, $count$220$i$us = 0, $cscale$0$ph1321 = 0, $guess = 0, $guess1 = 0, $n1ptr$012$i$us = 0, $n1ptr$022$i$us = 0, $n1ptr$022$i$us$lcssa = 0, $n1ptr$117$i$us = 0, $n2ptr$014$i$us = 0, $n2ptr$023$i$us = 0, $n2ptr$023$i$us$lcssa = 0, $n2ptr$119$i$us = 0;
 var $scale$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $guess = sp + 4|0;
 $guess1 = sp;
 $0 = HEAP32[$num>>2]|0;
 $1 = HEAP32[1320>>2]|0;
 $2 = (__do_compare($0,$1,1,0)|0);
 $3 = ($2|0)<(0);
 if ($3) {
  $$0 = 0;
  STACKTOP = sp;return ($$0|0);
 }
 $4 = ($2|0)==(0);
 if ($4) {
  $5 = ($0|0)==(0|0);
  if ($5) {
   $11 = $1;
  } else {
   $6 = ((($0)) + 12|0);
   $7 = HEAP32[$6>>2]|0;
   $8 = (($7) + -1)|0;
   HEAP32[$6>>2] = $8;
   $9 = ($8|0)==(0);
   if ($9) {
    _free($0);
   }
   HEAP32[$num>>2] = 0;
   $$pre42 = HEAP32[1320>>2]|0;
   $11 = $$pre42;
  }
  $10 = ((($11)) + 12|0);
  $12 = HEAP32[$10>>2]|0;
  $13 = (($12) + 1)|0;
  HEAP32[$10>>2] = $13;
  HEAP32[$num>>2] = $11;
  $$0 = 1;
  STACKTOP = sp;return ($$0|0);
 }
 $14 = HEAP32[1324>>2]|0;
 $15 = (__do_compare($0,$14,1,0)|0);
 $16 = ($15|0)==(0);
 if ($16) {
  $17 = ($0|0)==(0|0);
  if ($17) {
   $23 = $14;
  } else {
   $18 = ((($0)) + 12|0);
   $19 = HEAP32[$18>>2]|0;
   $20 = (($19) + -1)|0;
   HEAP32[$18>>2] = $20;
   $21 = ($20|0)==(0);
   if ($21) {
    _free($0);
   }
   HEAP32[$num>>2] = 0;
   $$pre = HEAP32[1324>>2]|0;
   $23 = $$pre;
  }
  $22 = ((($23)) + 12|0);
  $24 = HEAP32[$22>>2]|0;
  $25 = (($24) + 1)|0;
  HEAP32[$22>>2] = $25;
  HEAP32[$num>>2] = $23;
  $$0 = 1;
  STACKTOP = sp;return ($$0|0);
 }
 $26 = ((($0)) + 8|0);
 $27 = HEAP32[$26>>2]|0;
 $28 = ($27|0)<($scale|0);
 $scale$ = $28 ? $scale : $27;
 $29 = ((($1)) + 12|0);
 $30 = HEAP32[$29>>2]|0;
 HEAP32[$guess>>2] = $1;
 $31 = (($30) + 2)|0;
 HEAP32[$29>>2] = $31;
 HEAP32[$guess1>>2] = $1;
 $32 = (_malloc(22)|0);
 $33 = ($32|0)==(0|0);
 if ($33) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$32>>2] = 0;
 $34 = ((($32)) + 4|0);
 HEAP32[$34>>2] = 1;
 $35 = ((($32)) + 8|0);
 HEAP32[$35>>2] = 1;
 $36 = ((($32)) + 12|0);
 HEAP32[$36>>2] = 1;
 $37 = ((($32)) + 16|0);
 HEAP8[$37>>0] = 0;
 $38 = ((($32)) + 17|0);
 HEAP8[$38>>0] = 5;
 $39 = ($15|0)<(0);
 if ($39) {
  $40 = HEAP32[1324>>2]|0;
  $41 = ((($40)) + 12|0);
  $42 = HEAP32[$41>>2]|0;
  $43 = (($42) + 1)|0;
  HEAP32[$41>>2] = $43;
  HEAP32[$guess>>2] = $40;
  $134 = $1;
 } else {
  _int2num($guess,10);
  $44 = HEAP32[$num>>2]|0;
  $45 = ((($44)) + 4|0);
  $46 = HEAP32[$45>>2]|0;
  _int2num($guess1,$46);
  $47 = HEAP32[$guess1>>2]|0;
  _bc_multiply($47,$32,$guess1,0);
  $48 = HEAP32[$guess1>>2]|0;
  $49 = ((($48)) + 8|0);
  HEAP32[$49>>2] = 0;
  $50 = HEAP32[$guess>>2]|0;
  _bc_raise($50,$48,$guess,0);
  $51 = ($48|0)==(0|0);
  if ($51) {
   $134 = 0;
  } else {
   $52 = ((($48)) + 12|0);
   $53 = HEAP32[$52>>2]|0;
   $54 = (($53) + -1)|0;
   HEAP32[$52>>2] = $54;
   $55 = ($54|0)==(0);
   if ($55) {
    _free($48);
   }
   HEAP32[$guess1>>2] = 0;
   $134 = 0;
  }
 }
 $57 = (($scale$) + 1)|0;
 $137 = $134;$cscale$0$ph1321 = 2;
 while(1) {
  $58 = $137;
  L37: while(1) {
   $59 = ($58|0)==(0|0);
   if (!($59)) {
    $60 = ((($58)) + 12|0);
    $61 = HEAP32[$60>>2]|0;
    $62 = (($61) + -1)|0;
    HEAP32[$60>>2] = $62;
    $63 = ($62|0)==(0);
    if ($63) {
     _free($58);
    }
    HEAP32[$guess1>>2] = 0;
   }
   $64 = HEAP32[$guess>>2]|0;
   $65 = ((($64)) + 12|0);
   $66 = HEAP32[$65>>2]|0;
   $67 = (($66) + 1)|0;
   HEAP32[$65>>2] = $67;
   HEAP32[$guess1>>2] = $64;
   $68 = HEAP32[$num>>2]|0;
   (_bc_divide($68,$64,$guess,$cscale$0$ph1321)|0);
   $69 = HEAP32[$guess>>2]|0;
   _bc_add($69,$64,$guess);
   $70 = HEAP32[$guess>>2]|0;
   _bc_multiply($70,$32,$guess,$cscale$0$ph1321);
   $71 = HEAP32[$guess>>2]|0;
   $72 = ((($71)) + 4|0);
   $73 = HEAP32[$72>>2]|0;
   $74 = ((($64)) + 4|0);
   $75 = HEAP32[$74>>2]|0;
   $76 = ($73|0)==($75|0);
   if (!($76)) {
    $58 = $64;
    continue;
   }
   $77 = ((($71)) + 8|0);
   $78 = HEAP32[$77>>2]|0;
   $79 = ((($64)) + 8|0);
   $80 = HEAP32[$79>>2]|0;
   $81 = ($78|0)>($80|0);
   $$2$i$us = $81 ? $80 : $78;
   $82 = (($$2$i$us) + ($73))|0;
   $83 = ((($71)) + 16|0);
   $84 = ((($64)) + 16|0);
   $85 = ($82|0)>(0);
   L46: do {
    if ($85) {
     $count$024$i$us = $82;$n1ptr$022$i$us = $83;$n2ptr$023$i$us = $84;
     while(1) {
      $86 = HEAP8[$n1ptr$022$i$us>>0]|0;
      $87 = HEAP8[$n2ptr$023$i$us>>0]|0;
      $88 = ($86<<24>>24)==($87<<24>>24);
      if (!($88)) {
       $count$024$i$us$lcssa = $count$024$i$us;$n1ptr$022$i$us$lcssa = $n1ptr$022$i$us;$n2ptr$023$i$us$lcssa = $n2ptr$023$i$us;
       break;
      }
      $91 = ((($n1ptr$022$i$us)) + 1|0);
      $92 = ((($n2ptr$023$i$us)) + 1|0);
      $93 = (($count$024$i$us) + -1)|0;
      $94 = ($count$024$i$us|0)>(1);
      if ($94) {
       $count$024$i$us = $93;$n1ptr$022$i$us = $91;$n2ptr$023$i$us = $92;
      } else {
       $count$016$i$us = $93;$n1ptr$012$i$us = $91;$n2ptr$014$i$us = $92;
       break L46;
      }
     }
     $89 = ($count$024$i$us$lcssa|0)==(1);
     if ($89) {
      $90 = ($78|0)==($80|0);
      if ($90) {
       $135 = $64;$136 = $71;
       break L37;
      } else {
       $58 = $64;
       continue L37;
      }
     } else {
      $count$016$i$us = $count$024$i$us$lcssa;$n1ptr$012$i$us = $n1ptr$022$i$us$lcssa;$n2ptr$014$i$us = $n2ptr$023$i$us$lcssa;
     }
    } else {
     $count$016$i$us = $82;$n1ptr$012$i$us = $83;$n2ptr$014$i$us = $84;
    }
   } while(0);
   $95 = ($count$016$i$us|0)==(0);
   if (!($95)) {
    $58 = $64;
    continue;
   }
   $96 = ($78|0)==($80|0);
   if ($96) {
    $135 = $64;$136 = $71;
    break;
   }
   if ($81) {
    $104 = (($78) - ($80))|0;
    $105 = ($104|0)>(0);
    if ($105) {
     $count$118$i$us = $104;$n1ptr$117$i$us = $n1ptr$012$i$us;
    } else {
     $135 = $64;$136 = $71;
     break;
    }
    while(1) {
     $106 = HEAP8[$n1ptr$117$i$us>>0]|0;
     $107 = ($106<<24>>24)==(0);
     if (!($107)) {
      $58 = $64;
      continue L37;
     }
     $108 = ((($n1ptr$117$i$us)) + 1|0);
     $109 = (($count$118$i$us) + -1)|0;
     $110 = ($count$118$i$us|0)>(1);
     if ($110) {
      $count$118$i$us = $109;$n1ptr$117$i$us = $108;
     } else {
      $135 = $64;$136 = $71;
      break L37;
     }
    }
   } else {
    $97 = (($80) - ($78))|0;
    $98 = ($97|0)>(0);
    if ($98) {
     $count$220$i$us = $97;$n2ptr$119$i$us = $n2ptr$014$i$us;
    } else {
     $135 = $64;$136 = $71;
     break;
    }
    while(1) {
     $99 = HEAP8[$n2ptr$119$i$us>>0]|0;
     $100 = ($99<<24>>24)==(0);
     if (!($100)) {
      $58 = $64;
      continue L37;
     }
     $101 = ((($n2ptr$119$i$us)) + 1|0);
     $102 = (($count$220$i$us) + -1)|0;
     $103 = ($count$220$i$us|0)>(1);
     if ($103) {
      $count$220$i$us = $102;$n2ptr$119$i$us = $101;
     } else {
      $135 = $64;$136 = $71;
      break L37;
     }
    }
   }
  }
  $56 = ($cscale$0$ph1321|0)<($57|0);
  if (!($56)) {
   $$lcssa102 = $136;$$lcssa103 = $135;
   break;
  }
  $111 = ($cscale$0$ph1321*3)|0;
  $112 = ($111|0)>($57|0);
  $113 = $112 ? $57 : $111;
  $137 = $135;$cscale$0$ph1321 = $113;
 }
 $114 = HEAP32[$num>>2]|0;
 $115 = ($114|0)==(0|0);
 if (!($115)) {
  $116 = ((($114)) + 12|0);
  $117 = HEAP32[$116>>2]|0;
  $118 = (($117) + -1)|0;
  HEAP32[$116>>2] = $118;
  $119 = ($118|0)==(0);
  if ($119) {
   _free($114);
  }
  HEAP32[$num>>2] = 0;
 }
 $120 = HEAP32[1324>>2]|0;
 (_bc_divide($$lcssa102,$120,$num,$scale$)|0);
 $121 = ($$lcssa102|0)==(0|0);
 if (!($121)) {
  $122 = ((($$lcssa102)) + 12|0);
  $123 = HEAP32[$122>>2]|0;
  $124 = (($123) + -1)|0;
  HEAP32[$122>>2] = $124;
  $125 = ($124|0)==(0);
  if ($125) {
   _free($$lcssa102);
  }
  HEAP32[$guess>>2] = 0;
 }
 $126 = ($$lcssa103|0)==(0|0);
 if (!($126)) {
  $127 = ((($$lcssa103)) + 12|0);
  $128 = HEAP32[$127>>2]|0;
  $129 = (($128) + -1)|0;
  HEAP32[$127>>2] = $129;
  $130 = ($129|0)==(0);
  if ($130) {
   _free($$lcssa103);
  }
  HEAP32[$guess1>>2] = 0;
 }
 if ($33) {
  $$0 = 1;
  STACKTOP = sp;return ($$0|0);
 }
 $131 = HEAP32[$36>>2]|0;
 $132 = (($131) + -1)|0;
 HEAP32[$36>>2] = $132;
 $133 = ($132|0)==(0);
 if (!($133)) {
  $$0 = 1;
  STACKTOP = sp;return ($$0|0);
 }
 _free($32);
 $$0 = 1;
 STACKTOP = sp;return ($$0|0);
}
function _out_num($num,$o_base,$out_char) {
 $num = $num|0;
 $o_base = $o_base|0;
 $out_char = $out_char|0;
 var $$0$i16 = 0, $$0$i34 = 0, $$02$i = 0, $$02$i19 = 0, $$lcssa = 0, $$lcssa$i = 0, $$lcssa$i32 = 0, $$lcssa100 = 0, $$lcssa102 = 0, $$lcssa103 = 0, $$lcssa104 = 0, $$lcssa106 = 0, $$old1 = 0, $$pre = 0, $$pre59 = 0, $$pre60$pre = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0;
 var $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0;
 var $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0;
 var $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0;
 var $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0;
 var $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0;
 var $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $base = 0, $count$0$lcssa$i = 0, $count$0$lcssa$i9 = 0, $count$01$i = 0;
 var $count$01$i8 = 0, $cur_dig = 0, $digits$0$lcssa63 = 0, $digits$048 = 0, $digits$048$lcssa = 0, $digits$1 = 0, $digits$i = 0, $exitcond$i = 0, $exitcond$i22 = 0, $frac_part = 0, $index$03$i = 0, $index$03$i27 = 0, $index$043 = 0, $index$141 = 0, $int_part = 0, $ix$01$i = 0, $ix$01$i21 = 0, $max_o_digit = 0, $nptr$02$i = 0, $nptr$02$i15 = 0;
 var $nptr$02$i28 = 0, $nptr$02$i7 = 0, $nptr$044 = 0, $nptr$1 = 0, $nptr$242 = 0, $phitmp$i = 0, $phitmp$i30 = 0, $pre_space$046 = 0, $pre_space$1 = 0, $t_num = 0, $uglygep = 0, $val$01$i = 0, $val$01$i29 = 0, $val$2$i = 0, $val$2$i33 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $digits$i = sp + 40|0;
 $int_part = sp + 32|0;
 $frac_part = sp + 28|0;
 $base = sp + 24|0;
 $cur_dig = sp + 20|0;
 $t_num = sp + 16|0;
 $max_o_digit = sp + 12|0;
 $0 = HEAP32[$num>>2]|0;
 $1 = ($0|0)==(1);
 if ($1) {
  FUNCTION_TABLE_vi[$out_char & 15](45);
 }
 $2 = HEAP32[1320>>2]|0;
 $3 = ($2|0)==($num|0);
 if (!($3)) {
  $4 = ((($num)) + 4|0);
  $5 = HEAP32[$4>>2]|0;
  $6 = ((($num)) + 8|0);
  $7 = HEAP32[$6>>2]|0;
  $8 = (($7) + ($5))|0;
  $9 = ($8|0)>(0);
  L6: do {
   if ($9) {
    $10 = ((($num)) + 16|0);
    $count$01$i = $8;$nptr$02$i = $10;
    while(1) {
     $11 = HEAP8[$nptr$02$i>>0]|0;
     $12 = ($11<<24>>24)==(0);
     if (!($12)) {
      $count$0$lcssa$i = $count$01$i;
      break L6;
     }
     $13 = ((($nptr$02$i)) + 1|0);
     $14 = (($count$01$i) + -1)|0;
     $15 = ($count$01$i|0)>(1);
     if ($15) {
      $count$01$i = $14;$nptr$02$i = $13;
     } else {
      $count$0$lcssa$i = $14;
      break;
     }
    }
   } else {
    $count$0$lcssa$i = $8;
   }
  } while(0);
  $16 = ($count$0$lcssa$i|0)==(0);
  if (!($16)) {
   $17 = ($o_base|0)==(10);
   if ($17) {
    $18 = ((($num)) + 16|0);
    $19 = ($5|0)>(1);
    do {
     if ($19) {
      label = 14;
     } else {
      $20 = HEAP8[$18>>0]|0;
      $21 = ($20<<24>>24)==(0);
      if ($21) {
       $30 = ((($num)) + 17|0);
       $31 = $7;$nptr$1 = $30;
       break;
      } else {
       $22 = ($5|0)>(0);
       if ($22) {
        label = 14;
        break;
       } else {
        $31 = $7;$nptr$1 = $18;
        break;
       }
      }
     }
    } while(0);
    if ((label|0) == 14) {
     $23 = (($5) + 16)|0;
     $index$043 = $5;$nptr$044 = $18;
     while(1) {
      $24 = ((($nptr$044)) + 1|0);
      $25 = HEAP8[$nptr$044>>0]|0;
      $26 = $25 << 24 >> 24;
      $27 = (($26) + 48)|0;
      FUNCTION_TABLE_vi[$out_char & 15]($27);
      $28 = (($index$043) + -1)|0;
      $29 = ($index$043|0)>(1);
      if ($29) {
       $index$043 = $28;$nptr$044 = $24;
      } else {
       break;
      }
     }
     $uglygep = (($num) + ($23)|0);
     $$pre60$pre = HEAP32[$6>>2]|0;
     $31 = $$pre60$pre;$nptr$1 = $uglygep;
    }
    $32 = ($31|0)>(0);
    if (!($32)) {
     STACKTOP = sp;return;
    }
    FUNCTION_TABLE_vi[$out_char & 15](46);
    $33 = HEAP32[$6>>2]|0;
    $34 = ($33|0)>(0);
    if ($34) {
     $index$141 = 0;$nptr$242 = $nptr$1;
    } else {
     STACKTOP = sp;return;
    }
    while(1) {
     $35 = ((($nptr$242)) + 1|0);
     $36 = HEAP8[$nptr$242>>0]|0;
     $37 = $36 << 24 >> 24;
     $38 = (($37) + 48)|0;
     FUNCTION_TABLE_vi[$out_char & 15]($38);
     $39 = (($index$141) + 1)|0;
     $40 = HEAP32[$6>>2]|0;
     $41 = ($39|0)<($40|0);
     if ($41) {
      $index$141 = $39;$nptr$242 = $35;
     } else {
      break;
     }
    }
    STACKTOP = sp;return;
   }
   $42 = ((($2)) + 12|0);
   $43 = HEAP32[$42>>2]|0;
   $44 = (($43) + 1)|0;
   HEAP32[$42>>2] = $44;
   HEAP32[$int_part>>2] = $2;
   $45 = HEAP32[1324>>2]|0;
   (_bc_divide($num,$45,$int_part,0)|0);
   $46 = HEAP32[1320>>2]|0;
   $47 = ((($46)) + 12|0);
   $48 = HEAP32[$47>>2]|0;
   HEAP32[$frac_part>>2] = $46;
   HEAP32[$cur_dig>>2] = $46;
   $49 = (($48) + 3)|0;
   HEAP32[$47>>2] = $49;
   HEAP32[$base>>2] = $46;
   $50 = HEAP32[$int_part>>2]|0;
   _bc_sub($num,$50,$frac_part);
   HEAP32[$50>>2] = 0;
   $51 = HEAP32[$frac_part>>2]|0;
   HEAP32[$51>>2] = 0;
   _int2num($base,$o_base);
   $52 = HEAP32[1320>>2]|0;
   $53 = ((($52)) + 12|0);
   $54 = HEAP32[$53>>2]|0;
   $55 = (($54) + 1)|0;
   HEAP32[$53>>2] = $55;
   HEAP32[$max_o_digit>>2] = $52;
   $56 = (($o_base) + -1)|0;
   _int2num($max_o_digit,$56);
   $57 = HEAP32[1320>>2]|0;
   $58 = ($57|0)==($50|0);
   do {
    if ($58) {
     $190 = $46;$196 = $50;
    } else {
     $197 = $46;$60 = $50;$digits$048 = 0;
     while(1) {
      $59 = ((($60)) + 4|0);
      $61 = HEAP32[$59>>2]|0;
      $62 = ((($60)) + 8|0);
      $63 = HEAP32[$62>>2]|0;
      $64 = (($63) + ($61))|0;
      $65 = ($64|0)>(0);
      L38: do {
       if ($65) {
        $66 = ((($60)) + 16|0);
        $count$01$i8 = $64;$nptr$02$i7 = $66;
        while(1) {
         $67 = HEAP8[$nptr$02$i7>>0]|0;
         $68 = ($67<<24>>24)==(0);
         if (!($68)) {
          $count$0$lcssa$i9 = $count$01$i8;
          break L38;
         }
         $69 = ((($nptr$02$i7)) + 1|0);
         $70 = (($count$01$i8) + -1)|0;
         $71 = ($count$01$i8|0)>(1);
         if ($71) {
          $count$01$i8 = $70;$nptr$02$i7 = $69;
         } else {
          $count$0$lcssa$i9 = $70;
          break;
         }
        }
       } else {
        $count$0$lcssa$i9 = $64;
       }
      } while(0);
      $72 = ($count$0$lcssa$i9|0)==(0);
      if ($72) {
       $$lcssa104 = $197;$$lcssa106 = $60;$digits$048$lcssa = $digits$048;
       label = 34;
       break;
      }
      $73 = HEAP32[$base>>2]|0;
      (_bc_modulo($60,$73,$cur_dig,0)|0);
      $74 = (_malloc(8)|0);
      $75 = ($74|0)==(0|0);
      if ($75) {
       label = 28;
       break;
      }
      $76 = HEAP32[$cur_dig>>2]|0;
      $77 = ((($76)) + 4|0);
      $78 = HEAP32[$77>>2]|0;
      $79 = ($78|0)>(0);
      if ($79) {
       $80 = ((($76)) + 16|0);
       $index$03$i = $78;$nptr$02$i15 = $80;$val$01$i = 0;
       while(1) {
        $81 = ($val$01$i*10)|0;
        $82 = ((($nptr$02$i15)) + 1|0);
        $83 = HEAP8[$nptr$02$i15>>0]|0;
        $84 = $83 << 24 >> 24;
        $85 = (($84) + ($81))|0;
        $86 = (($index$03$i) + -1)|0;
        $87 = ($index$03$i|0)>(1);
        $88 = ($85|0)<(214748365);
        $89 = $87 & $88;
        if ($89) {
         $index$03$i = $86;$nptr$02$i15 = $82;$val$01$i = $85;
        } else {
         $$lcssa102 = $85;$$lcssa103 = $87;
         break;
        }
       }
       $phitmp$i = $$lcssa103 ? 0 : $$lcssa102;
       $$lcssa$i = $phitmp$i;
      } else {
       $$lcssa$i = 0;
      }
      $90 = ($$lcssa$i|0)<(0);
      $val$2$i = $90 ? 0 : $$lcssa$i;
      $91 = HEAP32[$76>>2]|0;
      $92 = ($91|0)==(0);
      $93 = (0 - ($val$2$i))|0;
      $$0$i16 = $92 ? $val$2$i : $93;
      HEAP32[$74>>2] = $$0$i16;
      $94 = ((($74)) + 4|0);
      HEAP32[$94>>2] = $digits$048;
      (_bc_divide($60,$73,$int_part,0)|0);
      $95 = HEAP32[$int_part>>2]|0;
      $96 = HEAP32[1320>>2]|0;
      $97 = ($96|0)==($95|0);
      if ($97) {
       $198 = $95;$199 = $76;$digits$0$lcssa63 = $74;
       break;
      } else {
       $197 = $76;$60 = $95;$digits$048 = $74;
      }
     }
     if ((label|0) == 28) {
      _out_of_memory();
      // unreachable;
     }
     else if ((label|0) == 34) {
      $98 = ($digits$048$lcssa|0)==(0|0);
      if ($98) {
       $190 = $$lcssa104;$196 = $$lcssa106;
       break;
      } else {
       $198 = $$lcssa106;$199 = $$lcssa104;$digits$0$lcssa63 = $digits$048$lcssa;
      }
     }
     $99 = ($o_base|0)<(17);
     $digits$1 = $digits$0$lcssa63;
     while(1) {
      $100 = ((($digits$1)) + 4|0);
      $101 = HEAP32[$100>>2]|0;
      $102 = HEAP32[$digits$1>>2]|0;
      if ($99) {
       $103 = (10846 + ($102)|0);
       $104 = HEAP8[$103>>0]|0;
       $105 = $104 << 24 >> 24;
       FUNCTION_TABLE_vi[$out_char & 15]($105);
      } else {
       $106 = HEAP32[$max_o_digit>>2]|0;
       $107 = ((($106)) + 4|0);
       $108 = HEAP32[$107>>2]|0;
       FUNCTION_TABLE_vi[$out_char & 15](32);
       HEAP32[$vararg_buffer>>2] = $102;
       (_sprintf($digits$i,10918,$vararg_buffer)|0);
       $109 = (_strlen($digits$i)|0);
       $110 = ($109|0)<($108|0);
       if ($110) {
        $$02$i19 = $108;
        while(1) {
         FUNCTION_TABLE_vi[$out_char & 15](48);
         $112 = (($$02$i19) + -1)|0;
         $113 = ($112|0)>($109|0);
         if ($113) {
          $$02$i19 = $112;
         } else {
          break;
         }
        }
       }
       $111 = ($109|0)>(0);
       if ($111) {
        $ix$01$i21 = 0;
        while(1) {
         $114 = (($digits$i) + ($ix$01$i21)|0);
         $115 = HEAP8[$114>>0]|0;
         $116 = $115 << 24 >> 24;
         FUNCTION_TABLE_vi[$out_char & 15]($116);
         $117 = (($ix$01$i21) + 1)|0;
         $exitcond$i22 = ($117|0)==($109|0);
         if ($exitcond$i22) {
          break;
         } else {
          $ix$01$i21 = $117;
         }
        }
       }
      }
      _free($digits$1);
      $$old1 = ($101|0)==(0|0);
      if ($$old1) {
       $190 = $199;$196 = $198;
       break;
      } else {
       $digits$1 = $101;
      }
     }
    }
   } while(0);
   $118 = HEAP32[$6>>2]|0;
   $119 = ($118|0)>(0);
   L71: do {
    if ($119) {
     FUNCTION_TABLE_vi[$out_char & 15](46);
     $120 = HEAP32[1324>>2]|0;
     $121 = ((($120)) + 12|0);
     $122 = HEAP32[$121>>2]|0;
     $123 = (($122) + 1)|0;
     HEAP32[$121>>2] = $123;
     HEAP32[$t_num>>2] = $120;
     $124 = ((($120)) + 4|0);
     $125 = HEAP32[$124>>2]|0;
     $126 = HEAP32[$6>>2]|0;
     $127 = ($125|0)>($126|0);
     if ($127) {
      $172 = $196;
     } else {
      $128 = ($o_base|0)<(17);
      $$pre59 = HEAP32[$base>>2]|0;
      $129 = $51;$130 = $126;$166 = $120;$pre_space$046 = 0;
      while(1) {
       _bc_multiply($129,$$pre59,$frac_part,$130);
       $131 = HEAP32[$frac_part>>2]|0;
       $132 = ((($131)) + 4|0);
       $133 = HEAP32[$132>>2]|0;
       $134 = ($133|0)>(0);
       if ($134) {
        $135 = ((($131)) + 16|0);
        $index$03$i27 = $133;$nptr$02$i28 = $135;$val$01$i29 = 0;
        while(1) {
         $136 = ($val$01$i29*10)|0;
         $137 = ((($nptr$02$i28)) + 1|0);
         $138 = HEAP8[$nptr$02$i28>>0]|0;
         $139 = $138 << 24 >> 24;
         $140 = (($139) + ($136))|0;
         $141 = (($index$03$i27) + -1)|0;
         $142 = ($index$03$i27|0)>(1);
         $143 = ($140|0)<(214748365);
         $144 = $142 & $143;
         if ($144) {
          $index$03$i27 = $141;$nptr$02$i28 = $137;$val$01$i29 = $140;
         } else {
          $$lcssa = $140;$$lcssa100 = $142;
          break;
         }
        }
        $phitmp$i30 = $$lcssa100 ? 0 : $$lcssa;
        $$lcssa$i32 = $phitmp$i30;
       } else {
        $$lcssa$i32 = 0;
       }
       $145 = ($$lcssa$i32|0)<(0);
       $val$2$i33 = $145 ? 0 : $$lcssa$i32;
       $146 = HEAP32[$131>>2]|0;
       $147 = ($146|0)==(0);
       $148 = (0 - ($val$2$i33))|0;
       $$0$i34 = $147 ? $val$2$i33 : $148;
       _int2num($int_part,$$0$i34);
       $149 = HEAP32[$int_part>>2]|0;
       _bc_sub($131,$149,$frac_part);
       if ($128) {
        $150 = (10846 + ($$0$i34)|0);
        $151 = HEAP8[$150>>0]|0;
        $152 = $151 << 24 >> 24;
        FUNCTION_TABLE_vi[$out_char & 15]($152);
        $pre_space$1 = $pre_space$046;
       } else {
        $153 = HEAP32[$max_o_digit>>2]|0;
        $154 = ((($153)) + 4|0);
        $155 = HEAP32[$154>>2]|0;
        $156 = ($pre_space$046|0)==(0);
        if (!($156)) {
         FUNCTION_TABLE_vi[$out_char & 15](32);
        }
        HEAP32[$vararg_buffer1>>2] = $$0$i34;
        (_sprintf($digits$i,10918,$vararg_buffer1)|0);
        $157 = (_strlen($digits$i)|0);
        $158 = ($157|0)<($155|0);
        if ($158) {
         $$02$i = $155;
         while(1) {
          FUNCTION_TABLE_vi[$out_char & 15](48);
          $160 = (($$02$i) + -1)|0;
          $161 = ($160|0)>($157|0);
          if ($161) {
           $$02$i = $160;
          } else {
           break;
          }
         }
        }
        $159 = ($157|0)>(0);
        if ($159) {
         $ix$01$i = 0;
         while(1) {
          $162 = (($digits$i) + ($ix$01$i)|0);
          $163 = HEAP8[$162>>0]|0;
          $164 = $163 << 24 >> 24;
          FUNCTION_TABLE_vi[$out_char & 15]($164);
          $165 = (($ix$01$i) + 1)|0;
          $exitcond$i = ($165|0)==($157|0);
          if ($exitcond$i) {
           break;
          } else {
           $ix$01$i = $165;
          }
         }
        }
        $pre_space$1 = 1;
       }
       _bc_multiply($166,$$pre59,$t_num,0);
       $167 = HEAP32[$t_num>>2]|0;
       $168 = ((($167)) + 4|0);
       $169 = HEAP32[$168>>2]|0;
       $170 = HEAP32[$6>>2]|0;
       $171 = ($169|0)>($170|0);
       if ($171) {
        $172 = $149;
        break L71;
       }
       $$pre = HEAP32[$frac_part>>2]|0;
       $129 = $$pre;$130 = $170;$166 = $167;$pre_space$046 = $pre_space$1;
      }
     }
    } else {
     $172 = $196;
    }
   } while(0);
   $173 = ($172|0)==(0|0);
   if (!($173)) {
    $174 = ((($172)) + 12|0);
    $175 = HEAP32[$174>>2]|0;
    $176 = (($175) + -1)|0;
    HEAP32[$174>>2] = $176;
    $177 = ($176|0)==(0);
    if ($177) {
     _free($172);
    }
    HEAP32[$int_part>>2] = 0;
   }
   $178 = HEAP32[$frac_part>>2]|0;
   $179 = ($178|0)==(0|0);
   if (!($179)) {
    $180 = ((($178)) + 12|0);
    $181 = HEAP32[$180>>2]|0;
    $182 = (($181) + -1)|0;
    HEAP32[$180>>2] = $182;
    $183 = ($182|0)==(0);
    if ($183) {
     _free($178);
    }
    HEAP32[$frac_part>>2] = 0;
   }
   $184 = HEAP32[$base>>2]|0;
   $185 = ($184|0)==(0|0);
   if (!($185)) {
    $186 = ((($184)) + 12|0);
    $187 = HEAP32[$186>>2]|0;
    $188 = (($187) + -1)|0;
    HEAP32[$186>>2] = $188;
    $189 = ($188|0)==(0);
    if ($189) {
     _free($184);
    }
    HEAP32[$base>>2] = 0;
   }
   $191 = ($190|0)==(0|0);
   if ($191) {
    STACKTOP = sp;return;
   }
   $192 = ((($190)) + 12|0);
   $193 = HEAP32[$192>>2]|0;
   $194 = (($193) + -1)|0;
   HEAP32[$192>>2] = $194;
   $195 = ($194|0)==(0);
   if ($195) {
    _free($190);
   }
   HEAP32[$cur_dig>>2] = 0;
   STACKTOP = sp;return;
  }
 }
 FUNCTION_TABLE_vi[$out_char & 15](48);
 STACKTOP = sp;return;
}
function __do_compare($n1,$n2,$use_sign,$ignore_last) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 $use_sign = $use_sign|0;
 $ignore_last = $ignore_last|0;
 var $$ = 0, $$0 = 0, $$2 = 0, $$3 = 0, $$4 = 0, $$5 = 0, $$6 = 0, $$7 = 0, $$8 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0;
 var $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $7 = 0, $8 = 0, $9 = 0, $count$016 = 0, $count$024 = 0, $count$024$lcssa = 0, $count$118 = 0, $count$220 = 0, $n1ptr$012 = 0, $n1ptr$01234 = 0, $n1ptr$022 = 0, $n1ptr$022$lcssa = 0, $n1ptr$117 = 0;
 var $n2ptr$014 = 0, $n2ptr$01433 = 0, $n2ptr$023 = 0, $n2ptr$023$lcssa = 0, $n2ptr$119 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($use_sign|0)!=(0);
 if ($0) {
  $1 = HEAP32[$n1>>2]|0;
  $2 = HEAP32[$n2>>2]|0;
  $3 = ($1|0)==($2|0);
  if (!($3)) {
   $4 = ($1|0)==(0);
   $$ = $4 ? 1 : -1;
   $$0 = $$;
   return ($$0|0);
  }
 }
 $5 = ((($n1)) + 4|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ((($n2)) + 4|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = ($6|0)==($8|0);
 if (!($9)) {
  $10 = ($6|0)>($8|0);
  if ($10) {
   if ($0) {
    $11 = HEAP32[$n1>>2]|0;
    $12 = ($11|0)==(0);
    $$3 = $12 ? 1 : -1;
    return ($$3|0);
   } else {
    $$0 = 1;
    return ($$0|0);
   }
  }
  if (!($0)) {
   $$0 = -1;
   return ($$0|0);
  }
  $13 = HEAP32[$n1>>2]|0;
  $14 = ($13|0)==(0);
  $$4 = $14 ? -1 : 1;
  $$0 = $$4;
  return ($$0|0);
 }
 $15 = ((($n1)) + 8|0);
 $16 = HEAP32[$15>>2]|0;
 $17 = ((($n2)) + 8|0);
 $18 = HEAP32[$17>>2]|0;
 $19 = ($16|0)>($18|0);
 $$2 = $19 ? $18 : $16;
 $20 = (($$2) + ($6))|0;
 $21 = ((($n1)) + 16|0);
 $22 = ((($n2)) + 16|0);
 $23 = ($20|0)>(0);
 L19: do {
  if ($23) {
   $count$024 = $20;$n1ptr$022 = $21;$n2ptr$023 = $22;
   while(1) {
    $24 = HEAP8[$n1ptr$022>>0]|0;
    $25 = HEAP8[$n2ptr$023>>0]|0;
    $26 = ($24<<24>>24)==($25<<24>>24);
    if (!($26)) {
     $count$024$lcssa = $count$024;$n1ptr$022$lcssa = $n1ptr$022;$n2ptr$023$lcssa = $n2ptr$023;
     break;
    }
    $27 = ((($n1ptr$022)) + 1|0);
    $28 = ((($n2ptr$023)) + 1|0);
    $29 = (($count$024) + -1)|0;
    $30 = ($count$024|0)>(1);
    if ($30) {
     $count$024 = $29;$n1ptr$022 = $27;$n2ptr$023 = $28;
    } else {
     $count$016 = $29;$n1ptr$012 = $27;$n2ptr$014 = $28;
     label = 15;
     break L19;
    }
   }
   $31 = ($ignore_last|0)!=(0);
   $32 = ($count$024$lcssa|0)==(1);
   $or$cond = $31 & $32;
   if ($or$cond) {
    $33 = ($16|0)==($18|0);
    if ($33) {
     $$0 = 0;
     return ($$0|0);
    } else {
     $n1ptr$01234 = $n1ptr$022$lcssa;$n2ptr$01433 = $n2ptr$023$lcssa;
    }
   } else {
    $count$016 = $count$024$lcssa;$n1ptr$012 = $n1ptr$022$lcssa;$n2ptr$014 = $n2ptr$023$lcssa;
    label = 15;
   }
  } else {
   $count$016 = $20;$n1ptr$012 = $21;$n2ptr$014 = $22;
   label = 15;
  }
 } while(0);
 if ((label|0) == 15) {
  $34 = ($count$016|0)==(0);
  if ($34) {
   $42 = ($16|0)==($18|0);
   if ($42) {
    $$0 = 0;
    return ($$0|0);
   }
   if ($19) {
    $43 = (($16) - ($18))|0;
    $44 = ($43|0)>(0);
    if ($44) {
     $count$118 = $43;$n1ptr$117 = $n1ptr$012;
    } else {
     $$0 = 0;
     return ($$0|0);
    }
    while(1) {
     $45 = HEAP8[$n1ptr$117>>0]|0;
     $46 = ($45<<24>>24)==(0);
     if (!($46)) {
      break;
     }
     $49 = ((($n1ptr$117)) + 1|0);
     $50 = (($count$118) + -1)|0;
     $51 = ($count$118|0)>(1);
     if ($51) {
      $count$118 = $50;$n1ptr$117 = $49;
     } else {
      $$0 = 0;
      label = 33;
      break;
     }
    }
    if ((label|0) == 33) {
     return ($$0|0);
    }
    if (!($0)) {
     $$0 = 1;
     return ($$0|0);
    }
    $47 = HEAP32[$n1>>2]|0;
    $48 = ($47|0)==(0);
    $$7 = $48 ? 1 : -1;
    $$0 = $$7;
    return ($$0|0);
   } else {
    $52 = (($18) - ($16))|0;
    $53 = ($52|0)>(0);
    if ($53) {
     $count$220 = $52;$n2ptr$119 = $n2ptr$014;
    } else {
     $$0 = 0;
     return ($$0|0);
    }
    while(1) {
     $54 = HEAP8[$n2ptr$119>>0]|0;
     $55 = ($54<<24>>24)==(0);
     if (!($55)) {
      break;
     }
     $58 = ((($n2ptr$119)) + 1|0);
     $59 = (($count$220) + -1)|0;
     $60 = ($count$220|0)>(1);
     if ($60) {
      $count$220 = $59;$n2ptr$119 = $58;
     } else {
      $$0 = 0;
      label = 33;
      break;
     }
    }
    if ((label|0) == 33) {
     return ($$0|0);
    }
    if (!($0)) {
     $$0 = -1;
     return ($$0|0);
    }
    $56 = HEAP32[$n1>>2]|0;
    $57 = ($56|0)==(0);
    $$8 = $57 ? -1 : 1;
    $$0 = $$8;
    return ($$0|0);
   }
  } else {
   $n1ptr$01234 = $n1ptr$012;$n2ptr$01433 = $n2ptr$014;
  }
 }
 $35 = HEAP8[$n1ptr$01234>>0]|0;
 $36 = HEAP8[$n2ptr$01433>>0]|0;
 $37 = ($35<<24>>24)>($36<<24>>24);
 if ($37) {
  if (!($0)) {
   $$0 = 1;
   return ($$0|0);
  }
  $38 = HEAP32[$n1>>2]|0;
  $39 = ($38|0)==(0);
  $$5 = $39 ? 1 : -1;
  $$0 = $$5;
  return ($$0|0);
 } else {
  if (!($0)) {
   $$0 = -1;
   return ($$0|0);
  }
  $40 = HEAP32[$n1>>2]|0;
  $41 = ($40|0)==(0);
  $$6 = $41 ? -1 : 1;
  $$0 = $$6;
  return ($$0|0);
 }
 return (0)|0;
}
function __do_add($n1,$n2) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 var $$ = 0, $$in = 0, $$op75 = 0, $$op76 = 0, $$pre$i = 0, $$sum = 0, $$sum1 = 0, $$sum2 = 0, $$sum3 = 0, $$sum5 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0;
 var $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0;
 var $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0;
 var $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0;
 var $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0;
 var $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0;
 var $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $bytes$0$lcssa$i = 0, $bytes$04$i11 = 0, $bytes$11$i = 0, $carry$0$lcssa = 0, $carry$019 = 0;
 var $carry$1 = 0, $carry$1$lcssa = 0, $carry$2$lcssa = 0, $carry$214 = 0, $carry$3 = 0, $carry$3$lcssa = 0, $dst$02$i = 0, $n1bytes$033 = 0, $n1bytes$1 = 0, $n1bytes$2$lcssa = 0, $n1bytes$220 = 0, $n1ptr$031 = 0, $n1ptr$1 = 0, $n1ptr$2$lcssa = 0, $n1ptr$216 = 0, $n1ptr$312 = 0, $n2bytes$040 = 0, $n2bytes$1 = 0, $n2bytes$2$lcssa = 0, $n2bytes$2$n1bytes$2 = 0;
 var $n2bytes$221 = 0, $n2ptr$038 = 0, $n2ptr$1 = 0, $n2ptr$2$lcssa = 0, $n2ptr$2$n1ptr$2 = 0, $n2ptr$217 = 0, $scevgep = 0, $scevgep60 = 0, $scevgep61 = 0, $scevgep62 = 0, $scevgep65 = 0, $scevgep69 = 0, $smax63 = 0, $smax64 = 0, $smax67 = 0, $smax68 = 0, $src$0$lcssa$i = 0, $src$05$i10 = 0, $src$13$i = 0, $storemerge = 0;
 var $storemerge7 = 0, $sumptr$032 = 0, $sumptr$139 = 0, $sumptr$2 = 0, $sumptr$3$lcssa = 0, $sumptr$318 = 0, $sumptr$4$lcssa = 0, $sumptr$413 = 0, $uglygep = 0, $uglygep71 = 0, $umax = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($n1)) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ((($n2)) + 8|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ($1|0)>($3|0);
 $$ = $4 ? $1 : $3;
 $5 = ((($n1)) + 4|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ((($n2)) + 4|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = ($6|0)>($8|0);
 $10 = $9 ? $6 : $8;
 $11 = (($10) + 1)|0;
 $12 = (($$) + 21)|0;
 $13 = (($12) + ($10))|0;
 $14 = (_malloc($13)|0);
 $15 = ($14|0)==(0|0);
 if ($15) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$14>>2] = 0;
 $16 = ((($14)) + 4|0);
 HEAP32[$16>>2] = $11;
 $17 = ((($14)) + 8|0);
 HEAP32[$17>>2] = $$;
 $18 = ((($14)) + 12|0);
 HEAP32[$18>>2] = 1;
 $19 = ((($14)) + 16|0);
 HEAP8[$19>>0] = 0;
 $$sum = (($1) + -1)|0;
 $$sum1 = (($$sum) + ($6))|0;
 $20 = (((($n1)) + 16|0) + ($$sum1)|0);
 $$sum2 = (($3) + -1)|0;
 $$sum3 = (($$sum2) + ($8))|0;
 $21 = (((($n2)) + 16|0) + ($$sum3)|0);
 $$sum5 = (($10) + ($$))|0;
 $22 = (((($14)) + 16|0) + ($$sum5)|0);
 $23 = ($1|0)==($3|0);
 do {
  if ($23) {
   $n1bytes$1 = $3;$n1ptr$1 = $20;$n2bytes$1 = $3;$n2ptr$1 = $21;$sumptr$2 = $22;
  } else {
   $24 = ($1|0)>($3|0);
   $25 = ($3|0)>($1|0);
   if ($24) {
    $smax63 = $25 ? $3 : $1;
    $34 = (($3) + ($smax63))|0;
    $35 = ($8|0)>($6|0);
    $smax64 = $35 ? $8 : $6;
    $36 = (($34) + ($smax64))|0;
    $37 = (($36) + 16)|0;
    $38 = (($37) - ($1))|0;
    $39 = (($3) + ($6))|0;
    $40 = (($39) + 15)|0;
    $n1bytes$033 = $1;$n1ptr$031 = $20;$sumptr$032 = $22;
    while(1) {
     $41 = ((($n1ptr$031)) + -1|0);
     $42 = HEAP8[$n1ptr$031>>0]|0;
     $43 = ((($sumptr$032)) + -1|0);
     HEAP8[$sumptr$032>>0] = $42;
     $44 = (($n1bytes$033) + -1)|0;
     $45 = ($44|0)>($3|0);
     if ($45) {
      $n1bytes$033 = $44;$n1ptr$031 = $41;$sumptr$032 = $43;
     } else {
      break;
     }
    }
    $scevgep65 = (($14) + ($38)|0);
    $uglygep = (($n1) + ($40)|0);
    $n1bytes$1 = $3;$n1ptr$1 = $uglygep;$n2bytes$1 = $3;$n2ptr$1 = $21;$sumptr$2 = $scevgep65;
    break;
   }
   if ($25) {
    $26 = ($3|0)>($1|0);
    $smax67 = $26 ? $3 : $1;
    $27 = (($1) + ($smax67))|0;
    $28 = ($8|0)>($6|0);
    $smax68 = $28 ? $8 : $6;
    $29 = (($27) + ($smax68))|0;
    $30 = (($29) + 16)|0;
    $31 = (($30) - ($3))|0;
    $32 = (($1) + ($8))|0;
    $33 = (($32) + 15)|0;
    $n2bytes$040 = $3;$n2ptr$038 = $21;$sumptr$139 = $22;
    while(1) {
     $46 = ((($n2ptr$038)) + -1|0);
     $47 = HEAP8[$n2ptr$038>>0]|0;
     $48 = ((($sumptr$139)) + -1|0);
     HEAP8[$sumptr$139>>0] = $47;
     $49 = (($n2bytes$040) + -1)|0;
     $50 = ($49|0)>($1|0);
     if ($50) {
      $n2bytes$040 = $49;$n2ptr$038 = $46;$sumptr$139 = $48;
     } else {
      break;
     }
    }
    $scevgep69 = (($14) + ($31)|0);
    $uglygep71 = (($n2) + ($33)|0);
    $n1bytes$1 = $1;$n1ptr$1 = $20;$n2bytes$1 = $1;$n2ptr$1 = $uglygep71;$sumptr$2 = $scevgep69;
   } else {
    $n1bytes$1 = $1;$n1ptr$1 = $20;$n2bytes$1 = $3;$n2ptr$1 = $21;$sumptr$2 = $22;
   }
  }
 } while(0);
 $51 = HEAP32[$5>>2]|0;
 $52 = (($51) + ($n1bytes$1))|0;
 $53 = HEAP32[$7>>2]|0;
 $54 = (($53) + ($n2bytes$1))|0;
 $55 = ($52|0)>(0);
 $56 = ($54|0)>(0);
 $57 = $55 & $56;
 if ($57) {
  $58 = (-2 - ($n2bytes$1))|0;
  $59 = (($58) - ($53))|0;
  $60 = ($54|0)<(1);
  $$op75 = $54 ^ -1;
  $61 = $60 ? $$op75 : -2;
  $62 = (($59) - ($61))|0;
  $63 = (-2 - ($n1bytes$1))|0;
  $64 = (($63) - ($51))|0;
  $65 = ($52|0)<(1);
  $$op76 = $52 ^ -1;
  $66 = $65 ? $$op76 : -2;
  $67 = (($64) - ($66))|0;
  $68 = ($62>>>0)>($67>>>0);
  $umax = $68 ? $62 : $67;
  $69 = (($52) + ($umax))|0;
  $scevgep61 = (($n2ptr$1) + ($umax)|0);
  $carry$019 = 0;$n1bytes$220 = $52;$n1ptr$216 = $n1ptr$1;$n2bytes$221 = $54;$n2ptr$217 = $n2ptr$1;$sumptr$318 = $sumptr$2;
  while(1) {
   $70 = ((($n1ptr$216)) + -1|0);
   $71 = HEAP8[$n1ptr$216>>0]|0;
   $72 = $71&255;
   $73 = ((($n2ptr$217)) + -1|0);
   $74 = HEAP8[$n2ptr$217>>0]|0;
   $75 = $74&255;
   $76 = (($72) + ($carry$019))|0;
   $77 = (($76) + ($75))|0;
   $78 = $77&255;
   $79 = ($78<<24>>24)>(9);
   $80 = (($77) + 246)|0;
   $81 = $80&255;
   $storemerge7 = $79 ? $81 : $78;
   $carry$1 = $79&1;
   HEAP8[$sumptr$318>>0] = $storemerge7;
   $82 = ((($sumptr$318)) + -1|0);
   $83 = (($n1bytes$220) + -1)|0;
   $84 = (($n2bytes$221) + -1)|0;
   $85 = ($n1bytes$220|0)>(1);
   $86 = ($n2bytes$221|0)>(1);
   $87 = $85 & $86;
   if ($87) {
    $carry$019 = $carry$1;$n1bytes$220 = $83;$n1ptr$216 = $70;$n2bytes$221 = $84;$n2ptr$217 = $73;$sumptr$318 = $82;
   } else {
    $carry$1$lcssa = $carry$1;
    break;
   }
  }
  $88 = (($54) + ($umax))|0;
  $scevgep60 = (($sumptr$2) + ($umax)|0);
  $scevgep62 = (($n1ptr$1) + ($umax)|0);
  $carry$0$lcssa = $carry$1$lcssa;$n1bytes$2$lcssa = $69;$n1ptr$2$lcssa = $scevgep62;$n2bytes$2$lcssa = $88;$n2ptr$2$lcssa = $scevgep61;$sumptr$3$lcssa = $scevgep60;
 } else {
  $carry$0$lcssa = 0;$n1bytes$2$lcssa = $52;$n1ptr$2$lcssa = $n1ptr$1;$n2bytes$2$lcssa = $54;$n2ptr$2$lcssa = $n2ptr$1;$sumptr$3$lcssa = $sumptr$2;
 }
 $89 = ($n1bytes$2$lcssa|0)==(0);
 $n2bytes$2$n1bytes$2 = $89 ? $n2bytes$2$lcssa : $n1bytes$2$lcssa;
 $90 = ($n2bytes$2$n1bytes$2|0)>(0);
 if ($90) {
  $n2ptr$2$n1ptr$2 = $89 ? $n2ptr$2$lcssa : $n1ptr$2$lcssa;
  $91 = (-2 - ($n2bytes$2$n1bytes$2))|0;
  $92 = (($91) + 2)|0;
  $$in = $n2bytes$2$n1bytes$2;$carry$214 = $carry$0$lcssa;$n1ptr$312 = $n2ptr$2$n1ptr$2;$sumptr$413 = $sumptr$3$lcssa;
  while(1) {
   $93 = (($$in) + -1)|0;
   $94 = ((($n1ptr$312)) + -1|0);
   $95 = HEAP8[$n1ptr$312>>0]|0;
   $96 = $95&255;
   $97 = (($96) + ($carry$214))|0;
   $98 = $97&255;
   $99 = ($98<<24>>24)>(9);
   $100 = (($97) + 246)|0;
   $101 = $100&255;
   $storemerge = $99 ? $101 : $98;
   $carry$3 = $99&1;
   HEAP8[$sumptr$413>>0] = $storemerge;
   $102 = ((($sumptr$413)) + -1|0);
   $103 = ($$in|0)>(1);
   if ($103) {
    $$in = $93;$carry$214 = $carry$3;$n1ptr$312 = $94;$sumptr$413 = $102;
   } else {
    $carry$3$lcssa = $carry$3;
    break;
   }
  }
  $scevgep = (($sumptr$3$lcssa) + ($92)|0);
  $carry$2$lcssa = $carry$3$lcssa;$sumptr$4$lcssa = $scevgep;
 } else {
  $carry$2$lcssa = $carry$0$lcssa;$sumptr$4$lcssa = $sumptr$3$lcssa;
 }
 $104 = ($carry$2$lcssa|0)==(1);
 if ($104) {
  $105 = HEAP8[$sumptr$4$lcssa>>0]|0;
  $106 = $105&255;
  $107 = (($106) + 1)|0;
  $108 = $107&255;
  HEAP8[$sumptr$4$lcssa>>0] = $108;
 }
 $109 = HEAP8[$19>>0]|0;
 $110 = ($109<<24>>24)==(0);
 if (!($110)) {
  return ($14|0);
 }
 $111 = HEAP32[$16>>2]|0;
 $112 = ($111|0)>(1);
 L35: do {
  if ($112) {
   $bytes$04$i11 = $111;$src$05$i10 = $19;
   while(1) {
    $113 = ((($src$05$i10)) + 1|0);
    $114 = (($bytes$04$i11) + -1)|0;
    $115 = ($114|0)>(1);
    if (!($115)) {
     $bytes$0$lcssa$i = $114;$src$0$lcssa$i = $113;
     break L35;
    }
    $$pre$i = HEAP8[$113>>0]|0;
    $116 = ($$pre$i<<24>>24)==(0);
    if ($116) {
     $bytes$04$i11 = $114;$src$05$i10 = $113;
    } else {
     $bytes$0$lcssa$i = $114;$src$0$lcssa$i = $113;
     break;
    }
   }
  } else {
   $bytes$0$lcssa$i = $111;$src$0$lcssa$i = $19;
  }
 } while(0);
 HEAP32[$16>>2] = $bytes$0$lcssa$i;
 $117 = HEAP32[$17>>2]|0;
 $118 = (($117) + ($bytes$0$lcssa$i))|0;
 $119 = ($118|0)>(0);
 if ($119) {
  $bytes$11$i = $118;$dst$02$i = $19;$src$13$i = $src$0$lcssa$i;
 } else {
  return ($14|0);
 }
 while(1) {
  $120 = (($bytes$11$i) + -1)|0;
  $121 = ((($src$13$i)) + 1|0);
  $122 = HEAP8[$src$13$i>>0]|0;
  $123 = ((($dst$02$i)) + 1|0);
  HEAP8[$dst$02$i>>0] = $122;
  $124 = ($bytes$11$i|0)>(1);
  if ($124) {
   $bytes$11$i = $120;$dst$02$i = $123;$src$13$i = $121;
  } else {
   break;
  }
 }
 return ($14|0);
}
function __do_sub($n1,$n2) {
 $n1 = $n1|0;
 $n2 = $n2|0;
 var $$ = 0, $$6 = 0, $$lobit = 0, $$lobit7 = 0, $$lobit7$lcssa = 0, $$lobit8 = 0, $$lobit8$lcssa = 0, $$pre$i = 0, $$sum = 0, $$sum1 = 0, $$sum2 = 0, $$sum3 = 0, $$sum4 = 0, $$sum5 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0;
 var $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0;
 var $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0;
 var $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0;
 var $97 = 0, $98 = 0, $99 = 0, $borrow$026 = 0, $borrow$3$lcssa = 0, $borrow$3$ph = 0, $borrow$319 = 0, $borrow$514 = 0, $bytes$0$lcssa$i = 0, $bytes$04$i11 = 0, $bytes$11$i = 0, $count$035 = 0, $count$127 = 0, $count$220 = 0, $count$315 = 0, $diffptr$034 = 0, $diffptr$125 = 0, $diffptr$3$lcssa = 0, $diffptr$3$ph = 0, $diffptr$318 = 0;
 var $diffptr$413 = 0, $dst$02$i = 0, $exitcond = 0, $n1ptr$033 = 0, $n1ptr$2$lcssa = 0, $n1ptr$2$ph = 0, $n1ptr$216 = 0, $n1ptr$312 = 0, $n2ptr$024 = 0, $n2ptr$2$ph = 0, $n2ptr$217 = 0, $scevgep = 0, $scevgep48 = 0, $scevgep53 = 0, $scevgep59 = 0, $smax49 = 0, $smax50 = 0, $smax52 = 0, $smax55 = 0, $smax56 = 0;
 var $smax58 = 0, $src$0$lcssa$i = 0, $src$05$i10 = 0, $src$13$i = 0, $sum = 0, $uglygep = 0, $uglygep61 = 0, $val$0 = 0, $val$1 = 0, $val$2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($n1)) + 4|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ((($n2)) + 4|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ($1|0)>($3|0);
 $$ = $4 ? $1 : $3;
 $5 = ((($n1)) + 8|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ((($n2)) + 8|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = ($6|0)>($8|0);
 $10 = $9 ? $6 : $8;
 $$6 = $4 ? $3 : $1;
 $11 = $9 ? $8 : $6;
 $12 = (($$) + 20)|0;
 $13 = (($12) + ($10))|0;
 $14 = (_malloc($13)|0);
 $15 = ($14|0)==(0|0);
 if ($15) {
  _out_of_memory();
  // unreachable;
 }
 HEAP32[$14>>2] = 0;
 $16 = ((($14)) + 4|0);
 HEAP32[$16>>2] = $$;
 $17 = ((($14)) + 8|0);
 HEAP32[$17>>2] = $10;
 $18 = ((($14)) + 12|0);
 HEAP32[$18>>2] = 1;
 $19 = ((($14)) + 16|0);
 HEAP8[$19>>0] = 0;
 $$sum = (($1) + -1)|0;
 $$sum1 = (($$sum) + ($6))|0;
 $20 = (((($n1)) + 16|0) + ($$sum1)|0);
 $$sum2 = (($3) + -1)|0;
 $$sum3 = (($$sum2) + ($8))|0;
 $21 = (((($n2)) + 16|0) + ($$sum3)|0);
 $$sum4 = (($$) + -1)|0;
 $$sum5 = (($$sum4) + ($10))|0;
 $22 = (((($14)) + 16|0) + ($$sum5)|0);
 $23 = ($6|0)==($11|0);
 if ($23) {
  $61 = (($8) - ($11))|0;
  $62 = ($61|0)>(0);
  if ($62) {
   $63 = ($8|0)>($6|0);
   $smax49 = $63 ? $8 : $6;
   $64 = ($3|0)>($1|0);
   $smax50 = $64 ? $3 : $1;
   $65 = (($smax49) + ($smax50))|0;
   $66 = (($65) + 12)|0;
   $67 = (($66) - ($8))|0;
   $68 = ($6|0)>($8|0);
   $69 = $68 ? $8 : $6;
   $70 = $69 ^ -1;
   $71 = (($67) - ($70))|0;
   $72 = (-2 - ($8))|0;
   $73 = (($72) - ($70))|0;
   $74 = ($73|0)>(-2);
   $smax52 = $74 ? $73 : -2;
   $42 = (($71) - ($smax52))|0;
   $75 = (($3) + 12)|0;
   $76 = (($smax52) + ($70))|0;
   $43 = (($75) - ($76))|0;
   $borrow$026 = 0;$count$127 = $61;$diffptr$125 = $22;$n2ptr$024 = $21;
   while(1) {
    $77 = ((($n2ptr$024)) + -1|0);
    $78 = HEAP8[$n2ptr$024>>0]|0;
    $79 = $78 << 24 >> 24;
    $sum = (($79) + ($borrow$026))|0;
    $80 = (0 - ($sum))|0;
    $81 = ($sum|0)>(0);
    $82 = (10 - ($sum))|0;
    $$lobit8 = $80 >>> 31;
    $val$0 = $81 ? $82 : $80;
    $83 = $val$0&255;
    $84 = ((($diffptr$125)) + -1|0);
    HEAP8[$diffptr$125>>0] = $83;
    $85 = (($count$127) + -1)|0;
    $86 = ($count$127|0)>(1);
    if ($86) {
     $borrow$026 = $$lobit8;$count$127 = $85;$diffptr$125 = $84;$n2ptr$024 = $77;
    } else {
     $$lobit8$lcssa = $$lobit8;
     break;
    }
   }
   $scevgep53 = (($14) + ($42)|0);
   $uglygep = (($n2) + ($43)|0);
   $borrow$3$ph = $$lobit8$lcssa;$diffptr$3$ph = $scevgep53;$n1ptr$2$ph = $20;$n2ptr$2$ph = $uglygep;
  } else {
   $borrow$3$ph = 0;$diffptr$3$ph = $22;$n1ptr$2$ph = $20;$n2ptr$2$ph = $21;
  }
 } else {
  $24 = (($6) - ($11))|0;
  $25 = ($24|0)>(0);
  if ($25) {
   $26 = ($8|0)>($6|0);
   $smax55 = $26 ? $8 : $6;
   $27 = ($3|0)>($1|0);
   $smax56 = $27 ? $3 : $1;
   $28 = (($smax55) + ($smax56))|0;
   $29 = (($28) + 12)|0;
   $30 = (($29) - ($6))|0;
   $31 = ($6|0)>($8|0);
   $32 = $31 ? $8 : $6;
   $33 = $32 ^ -1;
   $34 = (($30) - ($33))|0;
   $35 = (-2 - ($6))|0;
   $36 = (($35) - ($33))|0;
   $37 = ($36|0)>(-2);
   $smax58 = $37 ? $36 : -2;
   $38 = (($34) - ($smax58))|0;
   $39 = (($1) + 12)|0;
   $40 = (($smax58) + ($33))|0;
   $41 = (($39) - ($40))|0;
   $count$035 = $24;$diffptr$034 = $22;$n1ptr$033 = $20;
   while(1) {
    $56 = ((($n1ptr$033)) + -1|0);
    $57 = HEAP8[$n1ptr$033>>0]|0;
    $58 = ((($diffptr$034)) + -1|0);
    HEAP8[$diffptr$034>>0] = $57;
    $59 = (($count$035) + -1)|0;
    $60 = ($count$035|0)>(1);
    if ($60) {
     $count$035 = $59;$diffptr$034 = $58;$n1ptr$033 = $56;
    } else {
     break;
    }
   }
   $scevgep59 = (($14) + ($38)|0);
   $uglygep61 = (($n1) + ($41)|0);
   $borrow$3$ph = 0;$diffptr$3$ph = $scevgep59;$n1ptr$2$ph = $uglygep61;$n2ptr$2$ph = $21;
  } else {
   $borrow$3$ph = 0;$diffptr$3$ph = $22;$n1ptr$2$ph = $20;$n2ptr$2$ph = $21;
  }
 }
 $44 = (($11) + ($$6))|0;
 $45 = ($44|0)>(0);
 if ($45) {
  $46 = ($1|0)>($3|0);
  $47 = $46 ? $3 : $1;
  $48 = $47 ^ -1;
  $49 = ($6|0)>($8|0);
  $50 = $49 ? $8 : $6;
  $51 = $50 ^ -1;
  $52 = (($48) + ($51))|0;
  $53 = (($52) + 2)|0;
  $scevgep = (($diffptr$3$ph) + ($53)|0);
  $54 = (($50) + -1)|0;
  $55 = (($54) - ($48))|0;
  $borrow$319 = $borrow$3$ph;$count$220 = 0;$diffptr$318 = $diffptr$3$ph;$n1ptr$216 = $n1ptr$2$ph;$n2ptr$217 = $n2ptr$2$ph;
  while(1) {
   $87 = ((($n1ptr$216)) + -1|0);
   $88 = HEAP8[$n1ptr$216>>0]|0;
   $89 = $88 << 24 >> 24;
   $90 = ((($n2ptr$217)) + -1|0);
   $91 = HEAP8[$n2ptr$217>>0]|0;
   $92 = $91 << 24 >> 24;
   $93 = (($89) - ($92))|0;
   $94 = (($93) - ($borrow$319))|0;
   $95 = ($94|0)<(0);
   $96 = (($94) + 10)|0;
   $$lobit7 = $94 >>> 31;
   $val$1 = $95 ? $96 : $94;
   $97 = $val$1&255;
   $98 = ((($diffptr$318)) + -1|0);
   HEAP8[$diffptr$318>>0] = $97;
   $99 = (($count$220) + 1)|0;
   $exitcond = ($99|0)==($55|0);
   if ($exitcond) {
    $$lobit7$lcssa = $$lobit7;
    break;
   } else {
    $borrow$319 = $$lobit7;$count$220 = $99;$diffptr$318 = $98;$n1ptr$216 = $87;$n2ptr$217 = $90;
   }
  }
  $scevgep48 = (($n1ptr$2$ph) + ($53)|0);
  $borrow$3$lcssa = $$lobit7$lcssa;$diffptr$3$lcssa = $scevgep;$n1ptr$2$lcssa = $scevgep48;
 } else {
  $borrow$3$lcssa = $borrow$3$ph;$diffptr$3$lcssa = $diffptr$3$ph;$n1ptr$2$lcssa = $n1ptr$2$ph;
 }
 $100 = ($$|0)==($$6|0);
 if (!($100)) {
  $101 = (($$) - ($$6))|0;
  $102 = ($101|0)>(0);
  if ($102) {
   $borrow$514 = $borrow$3$lcssa;$count$315 = $101;$diffptr$413 = $diffptr$3$lcssa;$n1ptr$312 = $n1ptr$2$lcssa;
   while(1) {
    $103 = ((($n1ptr$312)) + -1|0);
    $104 = HEAP8[$n1ptr$312>>0]|0;
    $105 = $104 << 24 >> 24;
    $106 = (($105) - ($borrow$514))|0;
    $107 = ($106|0)<(0);
    $108 = (($106) + 10)|0;
    $$lobit = $106 >>> 31;
    $val$2 = $107 ? $108 : $106;
    $109 = $val$2&255;
    $110 = ((($diffptr$413)) + -1|0);
    HEAP8[$diffptr$413>>0] = $109;
    $111 = (($count$315) + -1)|0;
    $112 = ($count$315|0)>(1);
    if ($112) {
     $borrow$514 = $$lobit;$count$315 = $111;$diffptr$413 = $110;$n1ptr$312 = $103;
    } else {
     break;
    }
   }
  }
 }
 $113 = HEAP8[$19>>0]|0;
 $114 = ($113<<24>>24)==(0);
 if (!($114)) {
  return ($14|0);
 }
 $115 = HEAP32[$16>>2]|0;
 $116 = ($115|0)>(1);
 L30: do {
  if ($116) {
   $bytes$04$i11 = $115;$src$05$i10 = $19;
   while(1) {
    $117 = ((($src$05$i10)) + 1|0);
    $118 = (($bytes$04$i11) + -1)|0;
    $119 = ($118|0)>(1);
    if (!($119)) {
     $bytes$0$lcssa$i = $118;$src$0$lcssa$i = $117;
     break L30;
    }
    $$pre$i = HEAP8[$117>>0]|0;
    $120 = ($$pre$i<<24>>24)==(0);
    if ($120) {
     $bytes$04$i11 = $118;$src$05$i10 = $117;
    } else {
     $bytes$0$lcssa$i = $118;$src$0$lcssa$i = $117;
     break;
    }
   }
  } else {
   $bytes$0$lcssa$i = $115;$src$0$lcssa$i = $19;
  }
 } while(0);
 HEAP32[$16>>2] = $bytes$0$lcssa$i;
 $121 = HEAP32[$17>>2]|0;
 $122 = (($121) + ($bytes$0$lcssa$i))|0;
 $123 = ($122|0)>(0);
 if ($123) {
  $bytes$11$i = $122;$dst$02$i = $19;$src$13$i = $src$0$lcssa$i;
 } else {
  return ($14|0);
 }
 while(1) {
  $124 = (($bytes$11$i) + -1)|0;
  $125 = ((($src$13$i)) + 1|0);
  $126 = HEAP8[$src$13$i>>0]|0;
  $127 = ((($dst$02$i)) + 1|0);
  HEAP8[$dst$02$i>>0] = $126;
  $128 = ($bytes$11$i|0)>(1);
  if ($128) {
   $bytes$11$i = $124;$dst$02$i = $127;$src$13$i = $125;
  } else {
   break;
  }
 }
 return ($14|0);
}
function _init_storage() {
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAP32[1372>>2] = 0;
 _more_functions();
 $0 = HEAP32[1368>>2]|0;
 HEAP32[$0>>2] = 10922;
 HEAP32[1384>>2] = 0;
 _more_variables();
 HEAP32[1396>>2] = 0;
 _more_arrays();
 HEAP32[1400>>2] = 0;
 HEAP32[1404>>2] = 0;
 HEAP32[1408>>2] = 10;
 HEAP32[1412>>2] = 10;
 HEAP32[1416>>2] = 0;
 HEAP8[11748>>0] = 0;
 _init_numbers();
 return;
}
function _more_functions() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $exitcond = 0, $indvar = 0, $indvar$next = 0, $indx1$0$lcssa = 0, $indx1$03 = 0, $indx1$12 = 0, $scevgep = 0, dest = 0, label = 0, sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 $0 = HEAP32[1372>>2]|0;
 $1 = HEAP32[1364>>2]|0;
 $2 = HEAP32[1368>>2]|0;
 $3 = (($0) + 32)|0;
 HEAP32[1372>>2] = $3;
 $4 = ($3*84)|0;
 $5 = (_bc_malloc($4)|0);
 HEAP32[1364>>2] = $5;
 $6 = HEAP32[1372>>2]|0;
 $7 = $6 << 2;
 $8 = (_bc_malloc($7)|0);
 HEAP32[1368>>2] = $8;
 $9 = ($0|0)>(0);
 if ($9) {
  $indx1$03 = 0;
  while(1) {
   $12 = HEAP32[1364>>2]|0;
   $13 = (($12) + (($indx1$03*84)|0)|0);
   $14 = (($1) + (($indx1$03*84)|0)|0);
   dest=$13; src=$14; stop=dest+84|0; do { HEAP32[dest>>2]=HEAP32[src>>2]|0; dest=dest+4|0; src=src+4|0; } while ((dest|0) < (stop|0));
   $15 = (($2) + ($indx1$03<<2)|0);
   $16 = HEAP32[$15>>2]|0;
   $17 = HEAP32[1368>>2]|0;
   $18 = (($17) + ($indx1$03<<2)|0);
   HEAP32[$18>>2] = $16;
   $19 = (($indx1$03) + 1)|0;
   $exitcond = ($19|0)==($0|0);
   if ($exitcond) {
    $indx1$0$lcssa = $0;
    break;
   } else {
    $indx1$03 = $19;
   }
  }
 } else {
  $indx1$0$lcssa = 0;
 }
 $10 = HEAP32[1372>>2]|0;
 $11 = ($indx1$0$lcssa|0)<($10|0);
 if ($11) {
  $indvar = 0;$indx1$12 = $indx1$0$lcssa;
  while(1) {
   $20 = (($indx1$0$lcssa) + ($indvar))|0;
   $21 = HEAP32[1364>>2]|0;
   $22 = (($21) + (($indx1$12*84)|0)|0);
   HEAP8[$22>>0] = 0;
   $scevgep = (((($21) + (($20*84)|0)|0)) + 4|0);
   dest=$scevgep; stop=dest+64|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
   $23 = (((($21) + (($indx1$12*84)|0)|0)) + 68|0);
   $24 = (($indx1$12) + 1)|0;
   ;HEAP32[$23>>2]=0|0;HEAP32[$23+4>>2]=0|0;HEAP32[$23+8>>2]=0|0;HEAP32[$23+12>>2]=0|0;
   $25 = HEAP32[1372>>2]|0;
   $26 = ($24|0)<($25|0);
   $indvar$next = (($indvar) + 1)|0;
   if ($26) {
    $indvar = $indvar$next;$indx1$12 = $24;
   } else {
    break;
   }
  }
 }
 $27 = ($0|0)==(0);
 if ($27) {
  return;
 }
 _free($1);
 _free($2);
 return;
}
function _more_variables() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $exitcond = 0, $indx$0$lcssa = 0, $indx$02 = 0, $indx$11 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1384>>2]|0;
 $1 = HEAP32[1376>>2]|0;
 $2 = HEAP32[1380>>2]|0;
 $3 = (($0) + 32)|0;
 HEAP32[1384>>2] = $3;
 $4 = $3 << 2;
 $5 = (_bc_malloc($4)|0);
 HEAP32[1376>>2] = $5;
 $6 = HEAP32[1384>>2]|0;
 $7 = $6 << 2;
 $8 = (_bc_malloc($7)|0);
 HEAP32[1380>>2] = $8;
 $9 = ($0|0)>(3);
 if ($9) {
  $indx$02 = 3;
  while(1) {
   $12 = (($1) + ($indx$02<<2)|0);
   $13 = HEAP32[$12>>2]|0;
   $14 = HEAP32[1376>>2]|0;
   $15 = (($14) + ($indx$02<<2)|0);
   HEAP32[$15>>2] = $13;
   $16 = (($indx$02) + 1)|0;
   $exitcond = ($16|0)==($0|0);
   if ($exitcond) {
    $indx$0$lcssa = $0;
    break;
   } else {
    $indx$02 = $16;
   }
  }
 } else {
  $indx$0$lcssa = 3;
 }
 $10 = HEAP32[1384>>2]|0;
 $11 = ($indx$0$lcssa|0)<($10|0);
 if ($11) {
  $indx$11 = $indx$0$lcssa;
  while(1) {
   $17 = HEAP32[1376>>2]|0;
   $18 = (($17) + ($indx$11<<2)|0);
   HEAP32[$18>>2] = 0;
   $19 = (($indx$11) + 1)|0;
   $20 = ($19|0)<($10|0);
   if ($20) {
    $indx$11 = $19;
   } else {
    break;
   }
  }
 }
 $21 = ($0|0)==(0);
 if ($21) {
  return;
 }
 _free($1);
 _free($2);
 return;
}
function _more_arrays() {
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $exitcond = 0, $indx$0$lcssa = 0, $indx$02 = 0, $indx$11 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1396>>2]|0;
 $1 = HEAP32[1388>>2]|0;
 $2 = HEAP32[1392>>2]|0;
 $3 = (($0) + 32)|0;
 HEAP32[1396>>2] = $3;
 $4 = $3 << 2;
 $5 = (_bc_malloc($4)|0);
 HEAP32[1388>>2] = $5;
 $6 = HEAP32[1396>>2]|0;
 $7 = $6 << 2;
 $8 = (_bc_malloc($7)|0);
 HEAP32[1392>>2] = $8;
 $9 = ($0|0)>(1);
 if ($9) {
  $indx$02 = 1;
  while(1) {
   $12 = (($1) + ($indx$02<<2)|0);
   $13 = HEAP32[$12>>2]|0;
   $14 = HEAP32[1388>>2]|0;
   $15 = (($14) + ($indx$02<<2)|0);
   HEAP32[$15>>2] = $13;
   $16 = (($indx$02) + 1)|0;
   $exitcond = ($16|0)==($0|0);
   if ($exitcond) {
    $indx$0$lcssa = $0;
    break;
   } else {
    $indx$02 = $16;
   }
  }
 } else {
  $indx$0$lcssa = 1;
 }
 $10 = HEAP32[1384>>2]|0;
 $11 = ($indx$0$lcssa|0)<($10|0);
 if ($11) {
  $indx$11 = $indx$0$lcssa;
  while(1) {
   $17 = HEAP32[1388>>2]|0;
   $18 = (($17) + ($indx$11<<2)|0);
   HEAP32[$18>>2] = 0;
   $19 = (($indx$11) + 1)|0;
   $20 = ($19|0)<($10|0);
   if ($20) {
    $indx$11 = $19;
   } else {
    break;
   }
  }
 }
 $21 = ($0|0)==(0);
 if ($21) {
  return;
 }
 _free($1);
 _free($2);
 return;
}
function _clear_func($0) {
 $0 = $0|0;
 var $$cast = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0;
 var $63 = 0, $64 = 0, $65 = 0, $7 = 0, $8 = 0, $9 = 0, $sext = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $sext = $0 << 24;
 $1 = $sext >> 24;
 $2 = HEAP32[1364>>2]|0;
 $3 = (($2) + (($1*84)|0)|0);
 HEAP8[$3>>0] = 0;
 $4 = (((($2) + (($1*84)|0)|0)) + 4|0);
 $5 = HEAP32[$4>>2]|0;
 $6 = ($5|0)==(0|0);
 if (!($6)) {
  _free($5);
  HEAP32[$4>>2] = 0;
 }
 $7 = (((($2) + (($1*84)|0)|0)) + 8|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = ($8|0)==(0|0);
 if (!($9)) {
  _free($8);
  HEAP32[$7>>2] = 0;
 }
 $22 = (((($2) + (($1*84)|0)|0)) + 12|0);
 $23 = HEAP32[$22>>2]|0;
 $24 = ($23|0)==(0|0);
 if (!($24)) {
  _free($23);
  HEAP32[$22>>2] = 0;
 }
 $25 = (((($2) + (($1*84)|0)|0)) + 16|0);
 $26 = HEAP32[$25>>2]|0;
 $27 = ($26|0)==(0|0);
 if (!($27)) {
  _free($26);
  HEAP32[$25>>2] = 0;
 }
 $28 = (((($2) + (($1*84)|0)|0)) + 20|0);
 $29 = HEAP32[$28>>2]|0;
 $30 = ($29|0)==(0|0);
 if (!($30)) {
  _free($29);
  HEAP32[$28>>2] = 0;
 }
 $31 = (((($2) + (($1*84)|0)|0)) + 24|0);
 $32 = HEAP32[$31>>2]|0;
 $33 = ($32|0)==(0|0);
 if (!($33)) {
  _free($32);
  HEAP32[$31>>2] = 0;
 }
 $34 = (((($2) + (($1*84)|0)|0)) + 28|0);
 $35 = HEAP32[$34>>2]|0;
 $36 = ($35|0)==(0|0);
 if (!($36)) {
  _free($35);
  HEAP32[$34>>2] = 0;
 }
 $37 = (((($2) + (($1*84)|0)|0)) + 32|0);
 $38 = HEAP32[$37>>2]|0;
 $39 = ($38|0)==(0|0);
 if (!($39)) {
  _free($38);
  HEAP32[$37>>2] = 0;
 }
 $40 = (((($2) + (($1*84)|0)|0)) + 36|0);
 $41 = HEAP32[$40>>2]|0;
 $42 = ($41|0)==(0|0);
 if (!($42)) {
  _free($41);
  HEAP32[$40>>2] = 0;
 }
 $43 = (((($2) + (($1*84)|0)|0)) + 40|0);
 $44 = HEAP32[$43>>2]|0;
 $45 = ($44|0)==(0|0);
 if (!($45)) {
  _free($44);
  HEAP32[$43>>2] = 0;
 }
 $46 = (((($2) + (($1*84)|0)|0)) + 44|0);
 $47 = HEAP32[$46>>2]|0;
 $48 = ($47|0)==(0|0);
 if (!($48)) {
  _free($47);
  HEAP32[$46>>2] = 0;
 }
 $49 = (((($2) + (($1*84)|0)|0)) + 48|0);
 $50 = HEAP32[$49>>2]|0;
 $51 = ($50|0)==(0|0);
 if (!($51)) {
  _free($50);
  HEAP32[$49>>2] = 0;
 }
 $52 = (((($2) + (($1*84)|0)|0)) + 52|0);
 $53 = HEAP32[$52>>2]|0;
 $54 = ($53|0)==(0|0);
 if (!($54)) {
  _free($53);
  HEAP32[$52>>2] = 0;
 }
 $55 = (((($2) + (($1*84)|0)|0)) + 56|0);
 $56 = HEAP32[$55>>2]|0;
 $57 = ($56|0)==(0|0);
 if (!($57)) {
  _free($56);
  HEAP32[$55>>2] = 0;
 }
 $58 = (((($2) + (($1*84)|0)|0)) + 60|0);
 $59 = HEAP32[$58>>2]|0;
 $60 = ($59|0)==(0|0);
 if (!($60)) {
  _free($59);
  HEAP32[$58>>2] = 0;
 }
 $61 = (((($2) + (($1*84)|0)|0)) + 64|0);
 $62 = HEAP32[$61>>2]|0;
 $63 = ($62|0)==(0|0);
 if (!($63)) {
  _free($62);
  HEAP32[$61>>2] = 0;
 }
 $64 = (((($2) + (($1*84)|0)|0)) + 68|0);
 HEAP32[$64>>2] = 0;
 $11 = (((($2) + (($1*84)|0)|0)) + 80|0);
 $10 = HEAP32[$11>>2]|0;
 $65 = ($10|0)==(0|0);
 if (!($65)) {
  _free_args($10);
  HEAP32[$11>>2] = 0;
 }
 $12 = (((($2) + (($1*84)|0)|0)) + 76|0);
 $13 = HEAP32[$12>>2]|0;
 $14 = ($13|0)==(0|0);
 if (!($14)) {
  _free_args($13);
  HEAP32[$12>>2] = 0;
 }
 $15 = (((($2) + (($1*84)|0)|0)) + 72|0);
 $16 = HEAP32[$15>>2]|0;
 $17 = ($16|0)==(0|0);
 if ($17) {
  return;
 }
 $19 = $16;
 while(1) {
  $18 = ((($19)) + 256|0);
  $20 = HEAP32[$18>>2]|0;
  _free($19);
  HEAP32[$15>>2] = $20;
  $$cast = $20;
  $21 = ($20|0)==(0);
  if ($21) {
   break;
  } else {
   $19 = $$cast;
  }
 }
 return;
}
function _fpop() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $retval$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1404>>2]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  $retval$0 = 0;
  return ($retval$0|0);
 }
 $2 = ((($0)) + 4|0);
 $3 = HEAP32[$2>>2]|0;
 HEAP32[1404>>2] = $3;
 $4 = HEAP32[$0>>2]|0;
 _free($0);
 $retval$0 = $4;
 return ($retval$0|0);
}
function _fpush($val) {
 $val = $val|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_bc_malloc(8)|0);
 $1 = HEAP32[1404>>2]|0;
 $2 = ((($0)) + 4|0);
 HEAP32[$2>>2] = $1;
 HEAP32[$0>>2] = $val;
 HEAP32[1404>>2] = $0;
 return;
}
function _pop() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1400>>2]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  return;
 }
 $2 = ((($0)) + 4|0);
 $3 = HEAP32[$2>>2]|0;
 HEAP32[1400>>2] = $3;
 _free_num($0);
 _free($0);
 return;
}
function _push_copy($num) {
 $num = $num|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_bc_malloc(8)|0);
 $1 = (_copy_num($num)|0);
 HEAP32[$0>>2] = $1;
 $2 = HEAP32[1400>>2]|0;
 $3 = ((($0)) + 4|0);
 HEAP32[$3>>2] = $2;
 HEAP32[1400>>2] = $0;
 return;
}
function _push_num($num) {
 $num = $num|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_bc_malloc(8)|0);
 HEAP32[$0>>2] = $num;
 $1 = HEAP32[1400>>2]|0;
 $2 = ((($0)) + 4|0);
 HEAP32[$2>>2] = $1;
 HEAP32[1400>>2] = $0;
 return;
}
function _check_stack($depth) {
 $depth = $depth|0;
 var $$01 = 0, $$03 = 0, $$lcssa = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $temp$0 = 0, $temp$02 = 0, $temp$04 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $temp$02 = HEAP32[1400>>2]|0;
 $0 = ($temp$02|0)!=(0|0);
 $1 = ($depth|0)>(0);
 $2 = $1 & $0;
 if ($2) {
  $$03 = $depth;$temp$04 = $temp$02;
  while(1) {
   $3 = ((($temp$04)) + 4|0);
   $4 = (($$03) + -1)|0;
   $temp$0 = HEAP32[$3>>2]|0;
   $5 = ($temp$0|0)!=(0|0);
   $6 = ($$03|0)>(1);
   $7 = $6 & $5;
   if ($7) {
    $$03 = $4;$temp$04 = $temp$0;
   } else {
    $$lcssa = $6;
    break;
   }
  }
 } else {
  $$lcssa = $1;
 }
 if (!($$lcssa)) {
  $$01 = 1;
  STACKTOP = sp;return ($$01|0);
 }
 _rt_error(10929,$vararg_buffer);
 $$01 = 0;
 STACKTOP = sp;return ($$01|0);
}
function _get_array_num($var_index,$index) {
 $var_index = $var_index|0;
 $index = $index|0;
 var $$in = 0, $$lcssa37 = 0, $$lcssa38 = 0, $$lcssa39 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0;
 var $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0;
 var $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0;
 var $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0;
 var $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0;
 var $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $a_var$0 = 0, $ary_ptr$0 = 0, $ix$0 = 0, $ix$027 = 0, $ix$030 = 0, $log$0$lcssa = 0, $log$029 = 0, $or$cond = 0, $or$cond28 = 0, $scevgep = 0, $sub = 0, $temp$0$lcssa = 0, $temp$09 = 0, dest = 0, label = 0;
 var sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $sub = sp;
 $0 = HEAP32[1388>>2]|0;
 $1 = (($0) + ($var_index<<2)|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)==(0|0);
 if ($3) {
  $4 = (_bc_malloc(12)|0);
  $5 = HEAP32[1388>>2]|0;
  $6 = (($5) + ($var_index<<2)|0);
  HEAP32[$6>>2] = $4;
  HEAP32[$4>>2] = 0;
  $7 = ((($4)) + 8|0);
  HEAP32[$7>>2] = 0;
  $8 = ((($4)) + 4|0);
  HEAP8[$8>>0] = 0;
  $ary_ptr$0 = $4;
 } else {
  $ary_ptr$0 = $2;
 }
 $9 = HEAP32[$ary_ptr$0>>2]|0;
 $10 = ($9|0)==(0|0);
 if ($10) {
  $11 = (_bc_malloc(8)|0);
  HEAP32[$ary_ptr$0>>2] = $11;
  HEAP32[$11>>2] = 0;
  $12 = ((($11)) + 4|0);
  HEAP16[$12>>1] = 0;
  $a_var$0 = $11;
 } else {
  $a_var$0 = $9;
 }
 $13 = $index & 15;
 HEAP32[$sub>>2] = $13;
 $14 = ((($a_var$0)) + 4|0);
 $15 = HEAP16[$14>>1]|0;
 $16 = $15 << 16 >> 16;
 $ix$027 = $index >> 4;
 $17 = ($ix$027|0)>(0);
 $18 = ($15<<16>>16)>(1);
 $or$cond28 = $17 | $18;
 if ($or$cond28) {
  $ix$030 = $ix$027;$log$029 = 1;
  while(1) {
   $20 = $ix$030 & 15;
   $21 = (($sub) + ($log$029<<2)|0);
   HEAP32[$21>>2] = $20;
   $22 = (($log$029) + 1)|0;
   $ix$0 = $ix$030 >> 4;
   $23 = ($ix$0|0)>(0);
   $24 = ($22|0)<($16|0);
   $or$cond = $23 | $24;
   if ($or$cond) {
    $ix$030 = $ix$0;$log$029 = $22;
   } else {
    $log$0$lcssa = $22;
    break;
   }
  }
 } else {
  $log$0$lcssa = 1;
 }
 $19 = ($log$0$lcssa|0)>($16|0);
 if ($19) {
  while(1) {
   $25 = (_bc_malloc(64)|0);
   $26 = HEAP16[$14>>1]|0;
   $27 = ($26<<16>>16)==(0);
   if ($27) {
    $28 = HEAP32[1320>>2]|0;
    $29 = (_copy_num($28)|0);
    HEAP32[$25>>2] = $29;
    $30 = HEAP32[1320>>2]|0;
    $31 = (_copy_num($30)|0);
    $32 = ((($25)) + 4|0);
    HEAP32[$32>>2] = $31;
    $33 = HEAP32[1320>>2]|0;
    $34 = (_copy_num($33)|0);
    $35 = ((($25)) + 8|0);
    HEAP32[$35>>2] = $34;
    $36 = HEAP32[1320>>2]|0;
    $37 = (_copy_num($36)|0);
    $38 = ((($25)) + 12|0);
    HEAP32[$38>>2] = $37;
    $39 = HEAP32[1320>>2]|0;
    $40 = (_copy_num($39)|0);
    $41 = ((($25)) + 16|0);
    HEAP32[$41>>2] = $40;
    $42 = HEAP32[1320>>2]|0;
    $43 = (_copy_num($42)|0);
    $44 = ((($25)) + 20|0);
    HEAP32[$44>>2] = $43;
    $45 = HEAP32[1320>>2]|0;
    $46 = (_copy_num($45)|0);
    $47 = ((($25)) + 24|0);
    HEAP32[$47>>2] = $46;
    $48 = HEAP32[1320>>2]|0;
    $49 = (_copy_num($48)|0);
    $50 = ((($25)) + 28|0);
    HEAP32[$50>>2] = $49;
    $51 = HEAP32[1320>>2]|0;
    $52 = (_copy_num($51)|0);
    $53 = ((($25)) + 32|0);
    HEAP32[$53>>2] = $52;
    $54 = HEAP32[1320>>2]|0;
    $55 = (_copy_num($54)|0);
    $56 = ((($25)) + 36|0);
    HEAP32[$56>>2] = $55;
    $57 = HEAP32[1320>>2]|0;
    $58 = (_copy_num($57)|0);
    $59 = ((($25)) + 40|0);
    HEAP32[$59>>2] = $58;
    $60 = HEAP32[1320>>2]|0;
    $61 = (_copy_num($60)|0);
    $62 = ((($25)) + 44|0);
    HEAP32[$62>>2] = $61;
    $63 = HEAP32[1320>>2]|0;
    $64 = (_copy_num($63)|0);
    $65 = ((($25)) + 48|0);
    HEAP32[$65>>2] = $64;
    $66 = HEAP32[1320>>2]|0;
    $67 = (_copy_num($66)|0);
    $68 = ((($25)) + 52|0);
    HEAP32[$68>>2] = $67;
    $69 = HEAP32[1320>>2]|0;
    $70 = (_copy_num($69)|0);
    $71 = ((($25)) + 56|0);
    HEAP32[$71>>2] = $70;
    $72 = HEAP32[1320>>2]|0;
    $73 = (_copy_num($72)|0);
    $74 = ((($25)) + 60|0);
    HEAP32[$74>>2] = $73;
   } else {
    $75 = HEAP32[$a_var$0>>2]|0;
    HEAP32[$25>>2] = $75;
    $scevgep = ((($25)) + 4|0);
    dest=$scevgep; stop=dest+60|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
   }
   HEAP32[$a_var$0>>2] = $25;
   $76 = HEAP16[$14>>1]|0;
   $77 = (($76) + 1)<<16>>16;
   HEAP16[$14>>1] = $77;
   $78 = $77 << 16 >> 16;
   $79 = ($log$0$lcssa|0)>($78|0);
   if (!($79)) {
    $$lcssa39 = $25;
    break;
   }
  }
  $139 = $$lcssa39;
 } else {
  $$pre = HEAP32[$a_var$0>>2]|0;
  $139 = $$pre;
 }
 $80 = ($log$0$lcssa|0)>(1);
 if ($80) {
  $$in = $log$0$lcssa;$temp$09 = $139;
 } else {
  $temp$0$lcssa = $139;
  $137 = HEAP32[$sub>>2]|0;
  $138 = (($temp$0$lcssa) + ($137<<2)|0);
  STACKTOP = sp;return ($138|0);
 }
 while(1) {
  $81 = (($$in) + -1)|0;
  $82 = (($sub) + ($81<<2)|0);
  $83 = HEAP32[$82>>2]|0;
  $84 = (($temp$09) + ($83<<2)|0);
  $85 = HEAP32[$84>>2]|0;
  $86 = ($85|0)==(0|0);
  if (!($86)) {
   $87 = ($81|0)>(1);
   if ($87) {
    $$in = $81;$temp$09 = $85;
    continue;
   } else {
    $temp$0$lcssa = $85;
    label = 21;
    break;
   }
  }
  $88 = (_bc_malloc(64)|0);
  HEAP32[$84>>2] = $88;
  $89 = ($81|0)>(1);
  if (!($89)) {
   $$lcssa37 = $88;$$lcssa38 = $88;
   break;
  }
  dest=$88; stop=dest+64|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
  $$in = $81;$temp$09 = $88;
 }
 if ((label|0) == 21) {
  $137 = HEAP32[$sub>>2]|0;
  $138 = (($temp$0$lcssa) + ($137<<2)|0);
  STACKTOP = sp;return ($138|0);
 }
 $90 = HEAP32[1320>>2]|0;
 $91 = (_copy_num($90)|0);
 HEAP32[$$lcssa37>>2] = $91;
 $92 = HEAP32[1320>>2]|0;
 $93 = (_copy_num($92)|0);
 $94 = ((($$lcssa37)) + 4|0);
 HEAP32[$94>>2] = $93;
 $95 = HEAP32[1320>>2]|0;
 $96 = (_copy_num($95)|0);
 $97 = ((($$lcssa37)) + 8|0);
 HEAP32[$97>>2] = $96;
 $98 = HEAP32[1320>>2]|0;
 $99 = (_copy_num($98)|0);
 $100 = ((($$lcssa37)) + 12|0);
 HEAP32[$100>>2] = $99;
 $101 = HEAP32[1320>>2]|0;
 $102 = (_copy_num($101)|0);
 $103 = ((($$lcssa37)) + 16|0);
 HEAP32[$103>>2] = $102;
 $104 = HEAP32[1320>>2]|0;
 $105 = (_copy_num($104)|0);
 $106 = ((($$lcssa37)) + 20|0);
 HEAP32[$106>>2] = $105;
 $107 = HEAP32[1320>>2]|0;
 $108 = (_copy_num($107)|0);
 $109 = ((($$lcssa37)) + 24|0);
 HEAP32[$109>>2] = $108;
 $110 = HEAP32[1320>>2]|0;
 $111 = (_copy_num($110)|0);
 $112 = ((($$lcssa37)) + 28|0);
 HEAP32[$112>>2] = $111;
 $113 = HEAP32[1320>>2]|0;
 $114 = (_copy_num($113)|0);
 $115 = ((($$lcssa37)) + 32|0);
 HEAP32[$115>>2] = $114;
 $116 = HEAP32[1320>>2]|0;
 $117 = (_copy_num($116)|0);
 $118 = ((($$lcssa37)) + 36|0);
 HEAP32[$118>>2] = $117;
 $119 = HEAP32[1320>>2]|0;
 $120 = (_copy_num($119)|0);
 $121 = ((($$lcssa37)) + 40|0);
 HEAP32[$121>>2] = $120;
 $122 = HEAP32[1320>>2]|0;
 $123 = (_copy_num($122)|0);
 $124 = ((($$lcssa37)) + 44|0);
 HEAP32[$124>>2] = $123;
 $125 = HEAP32[1320>>2]|0;
 $126 = (_copy_num($125)|0);
 $127 = ((($$lcssa37)) + 48|0);
 HEAP32[$127>>2] = $126;
 $128 = HEAP32[1320>>2]|0;
 $129 = (_copy_num($128)|0);
 $130 = ((($$lcssa37)) + 52|0);
 HEAP32[$130>>2] = $129;
 $131 = HEAP32[1320>>2]|0;
 $132 = (_copy_num($131)|0);
 $133 = ((($$lcssa37)) + 56|0);
 HEAP32[$133>>2] = $132;
 $134 = HEAP32[1320>>2]|0;
 $135 = (_copy_num($134)|0);
 $136 = ((($$lcssa37)) + 60|0);
 HEAP32[$136>>2] = $135;
 $temp$0$lcssa = $$lcssa38;
 $137 = HEAP32[$sub>>2]|0;
 $138 = (($temp$0$lcssa) + ($137<<2)|0);
 STACKTOP = sp;return ($138|0);
}
function _store_var($var_name) {
 $var_name = $var_name|0;
 var $$ = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond3 = 0, $or$cond5 = 0, $or$cond6 = 0, $or$cond7 = 0;
 var $or$cond8 = 0, $temp$0 = 0, $temp$01021 = 0, $temp$01325 = 0, $temp$016 = 0, $toobig$0 = 0, $toobig$01120 = 0, $toobig$01424 = 0, $toobig$017 = 0, $var_ptr$0$i9 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer11 = 0, $vararg_buffer13 = 0, $vararg_buffer3 = 0, $vararg_buffer5 = 0, $vararg_buffer7 = 0, $vararg_buffer9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer13 = sp + 56|0;
 $vararg_buffer11 = sp + 48|0;
 $vararg_buffer9 = sp + 40|0;
 $vararg_buffer7 = sp + 32|0;
 $vararg_buffer5 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = ($var_name|0)>(2);
 if ($0) {
  $1 = HEAP32[1376>>2]|0;
  $2 = (($1) + ($var_name<<2)|0);
  $3 = HEAP32[$2>>2]|0;
  $4 = ($3|0)==(0|0);
  if ($4) {
   $5 = (_bc_malloc(8)|0);
   $6 = HEAP32[1376>>2]|0;
   $7 = (($6) + ($var_name<<2)|0);
   HEAP32[$7>>2] = $5;
   _init_num($5);
   $8 = ($5|0)==(0|0);
   if ($8) {
    STACKTOP = sp;return;
   } else {
    $var_ptr$0$i9 = $5;
   }
  } else {
   $var_ptr$0$i9 = $3;
  }
  _free_num($var_ptr$0$i9);
  $9 = HEAP32[1400>>2]|0;
  $10 = HEAP32[$9>>2]|0;
  $11 = (_copy_num($10)|0);
  HEAP32[$var_ptr$0$i9>>2] = $11;
  STACKTOP = sp;return;
 }
 $12 = HEAP32[1400>>2]|0;
 $13 = HEAP32[$12>>2]|0;
 $14 = (_is_neg($13)|0);
 $15 = ($14<<24>>24)==(0);
 L9: do {
  if ($15) {
   $16 = HEAP32[1400>>2]|0;
   $17 = HEAP32[$16>>2]|0;
   $18 = (_num2long($17)|0);
   $19 = HEAP32[1400>>2]|0;
   $20 = HEAP32[$19>>2]|0;
   $21 = (_is_zero($20)|0);
   $22 = ($21<<24>>24)==(0);
   $23 = ($18|0)==(0);
   $or$cond = $23 & $22;
   $$ = $or$cond&1;
   $temp$0 = $18;$toobig$0 = $$;
   label = 11;
  } else {
   switch ($var_name|0) {
   case 0:  {
    _rt_warn(10942,$vararg_buffer);
    $temp$01021 = 2;$toobig$01120 = 0;
    label = 14;
    break L9;
    break;
   }
   case 1:  {
    _rt_warn(10967,$vararg_buffer1);
    $temp$01325 = 2;$toobig$01424 = 0;
    label = 19;
    break L9;
    break;
   }
   case 2:  {
    _rt_warn(10992,$vararg_buffer3);
    $temp$016 = 0;$toobig$017 = 0;
    label = 22;
    break L9;
    break;
   }
   default: {
    $temp$0 = 0;$toobig$0 = 0;
    label = 11;
    break L9;
   }
   }
  }
 } while(0);
 L16: do {
  if ((label|0) == 11) {
   switch ($var_name|0) {
   case 2:  {
    $temp$016 = $temp$0;$toobig$017 = $toobig$0;
    label = 22;
    break L16;
    break;
   }
   case 0:  {
    $24 = ($temp$0|0)>(1);
    $25 = ($toobig$0<<24>>24)!=(0);
    $or$cond3 = $24 | $25;
    if ($or$cond3) {
     $temp$01021 = $temp$0;$toobig$01120 = $toobig$0;
     label = 14;
     break L16;
    }
    HEAP32[1408>>2] = 2;
    _rt_warn(11017,$vararg_buffer5);
    STACKTOP = sp;return;
    break;
   }
   case 1:  {
    $28 = ($temp$0|0)>(1);
    $29 = ($toobig$0<<24>>24)!=(0);
    $or$cond5 = $28 | $29;
    if ($or$cond5) {
     $temp$01325 = $temp$0;$toobig$01424 = $toobig$0;
     label = 19;
     break L16;
    }
    HEAP32[1412>>2] = 2;
    _rt_warn(11070,$vararg_buffer9);
    STACKTOP = sp;return;
    break;
   }
   default: {
    STACKTOP = sp;return;
   }
   }
  }
 } while(0);
 if ((label|0) == 14) {
  $26 = ($temp$01021|0)<(17);
  $27 = ($toobig$01120<<24>>24)==(0);
  $or$cond6 = $26 & $27;
  if ($or$cond6) {
   HEAP32[1408>>2] = $temp$01021;
   STACKTOP = sp;return;
  } else {
   HEAP32[1408>>2] = 16;
   _rt_warn(11043,$vararg_buffer7);
   STACKTOP = sp;return;
  }
 }
 else if ((label|0) == 19) {
  $30 = ($temp$01325|0)<(100);
  $31 = ($toobig$01424<<24>>24)==(0);
  $or$cond7 = $30 & $31;
  if ($or$cond7) {
   HEAP32[1412>>2] = $temp$01325;
   STACKTOP = sp;return;
  } else {
   HEAP32[1412>>2] = 99;
   HEAP32[$vararg_buffer11>>2] = 99;
   _rt_warn(11096,$vararg_buffer11);
   STACKTOP = sp;return;
  }
 }
 else if ((label|0) == 22) {
  $32 = ($temp$016|0)<(100);
  $33 = ($toobig$017<<24>>24)==(0);
  $or$cond8 = $33 & $32;
  if ($or$cond8) {
   HEAP32[1416>>2] = $temp$016;
   STACKTOP = sp;return;
  } else {
   HEAP32[1416>>2] = 99;
   HEAP32[$vararg_buffer13>>2] = 99;
   _rt_warn(11123,$vararg_buffer13);
   STACKTOP = sp;return;
  }
 }
}
function _store_array($var_name) {
 $var_name = $var_name|0;
 var $$03$i = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $temp$0$i = 0;
 var $temp$02$i = 0, $temp$04$i = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $temp$02$i = HEAP32[1400>>2]|0;
 $0 = ($temp$02$i|0)==(0|0);
 if (!($0)) {
  $$03$i = 2;$temp$04$i = $temp$02$i;
  while(1) {
   $1 = ((($temp$04$i)) + 4|0);
   $2 = (($$03$i) + -1)|0;
   $temp$0$i = HEAP32[$1>>2]|0;
   $3 = ($temp$0$i|0)!=(0|0);
   $4 = ($$03$i|0)>(1);
   $5 = $4 & $3;
   if ($5) {
    $$03$i = $2;$temp$04$i = $temp$0$i;
   } else {
    break;
   }
  }
  if (!($4)) {
   $6 = ((($temp$02$i)) + 4|0);
   $7 = HEAP32[$6>>2]|0;
   $8 = HEAP32[$7>>2]|0;
   $9 = (_num2long($8)|0);
   $10 = ($9>>>0)>(2048);
   do {
    if (!($10)) {
     $11 = ($9|0)==(0);
     if ($11) {
      $12 = HEAP32[1400>>2]|0;
      $13 = ((($12)) + 4|0);
      $14 = HEAP32[$13>>2]|0;
      $15 = HEAP32[$14>>2]|0;
      $16 = (_is_zero($15)|0);
      $17 = ($16<<24>>24)==(0);
      if ($17) {
       break;
      }
     }
     $21 = (_get_array_num($var_name,$9)|0);
     $22 = ($21|0)==(0|0);
     if ($22) {
      STACKTOP = sp;return;
     }
     _free_num($21);
     $23 = HEAP32[1400>>2]|0;
     $24 = HEAP32[$23>>2]|0;
     $25 = (_copy_num($24)|0);
     HEAP32[$21>>2] = $25;
     $26 = HEAP32[1400>>2]|0;
     $27 = ((($26)) + 4|0);
     $28 = HEAP32[$27>>2]|0;
     _free_num($28);
     $29 = HEAP32[1400>>2]|0;
     $30 = HEAP32[$29>>2]|0;
     $31 = ((($29)) + 4|0);
     $32 = HEAP32[$31>>2]|0;
     HEAP32[$32>>2] = $30;
     $33 = HEAP32[1400>>2]|0;
     _init_num($33);
     $34 = HEAP32[1400>>2]|0;
     $35 = ($34|0)==(0|0);
     if ($35) {
      STACKTOP = sp;return;
     }
     $36 = ((($34)) + 4|0);
     $37 = HEAP32[$36>>2]|0;
     HEAP32[1400>>2] = $37;
     _free_num($34);
     _free($34);
     STACKTOP = sp;return;
    }
   } while(0);
   $18 = HEAP32[1392>>2]|0;
   $19 = (($18) + ($var_name<<2)|0);
   $20 = HEAP32[$19>>2]|0;
   HEAP32[$vararg_buffer1>>2] = $20;
   _rt_error(11150,$vararg_buffer1);
   STACKTOP = sp;return;
  }
 }
 _rt_error(10929,$vararg_buffer);
 STACKTOP = sp;return;
}
function _load_var($var_name) {
 $var_name = $var_name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 switch ($var_name|0) {
 case 0:  {
  $0 = HEAP32[1320>>2]|0;
  $1 = (_bc_malloc(8)|0);
  $2 = (_copy_num($0)|0);
  HEAP32[$1>>2] = $2;
  $3 = HEAP32[1400>>2]|0;
  $4 = ((($1)) + 4|0);
  HEAP32[$4>>2] = $3;
  HEAP32[1400>>2] = $1;
  $5 = HEAP32[1408>>2]|0;
  _int2num($1,$5);
  return;
  break;
 }
 case 1:  {
  $6 = HEAP32[1320>>2]|0;
  $7 = (_bc_malloc(8)|0);
  $8 = (_copy_num($6)|0);
  HEAP32[$7>>2] = $8;
  $9 = HEAP32[1400>>2]|0;
  $10 = ((($7)) + 4|0);
  HEAP32[$10>>2] = $9;
  HEAP32[1400>>2] = $7;
  $11 = HEAP32[1412>>2]|0;
  _int2num($7,$11);
  return;
  break;
 }
 case 2:  {
  $12 = HEAP32[1320>>2]|0;
  $13 = (_bc_malloc(8)|0);
  $14 = (_copy_num($12)|0);
  HEAP32[$13>>2] = $14;
  $15 = HEAP32[1400>>2]|0;
  $16 = ((($13)) + 4|0);
  HEAP32[$16>>2] = $15;
  HEAP32[1400>>2] = $13;
  $17 = HEAP32[1416>>2]|0;
  _int2num($13,$17);
  return;
  break;
 }
 default: {
  $18 = HEAP32[1376>>2]|0;
  $19 = (($18) + ($var_name<<2)|0);
  $20 = HEAP32[$19>>2]|0;
  $21 = ($20|0)==(0|0);
  if ($21) {
   $27 = HEAP32[1320>>2]|0;
   $28 = (_bc_malloc(8)|0);
   $29 = (_copy_num($27)|0);
   HEAP32[$28>>2] = $29;
   $30 = HEAP32[1400>>2]|0;
   $31 = ((($28)) + 4|0);
   HEAP32[$31>>2] = $30;
   HEAP32[1400>>2] = $28;
   return;
  } else {
   $22 = HEAP32[$20>>2]|0;
   $23 = (_bc_malloc(8)|0);
   $24 = (_copy_num($22)|0);
   HEAP32[$23>>2] = $24;
   $25 = HEAP32[1400>>2]|0;
   $26 = ((($23)) + 4|0);
   HEAP32[$26>>2] = $25;
   HEAP32[1400>>2] = $23;
   return;
  }
 }
 }
}
function _load_array($var_name) {
 $var_name = $var_name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $temp$02$i = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $temp$02$i = HEAP32[1400>>2]|0;
 $0 = ($temp$02$i|0)==(0|0);
 if ($0) {
  _rt_error(10929,$vararg_buffer);
  STACKTOP = sp;return;
 }
 $1 = HEAP32[$temp$02$i>>2]|0;
 $2 = (_num2long($1)|0);
 $3 = ($2>>>0)>(2048);
 do {
  if (!($3)) {
   $4 = ($2|0)==(0);
   if ($4) {
    $5 = HEAP32[1400>>2]|0;
    $6 = HEAP32[$5>>2]|0;
    $7 = (_is_zero($6)|0);
    $8 = ($7<<24>>24)==(0);
    if ($8) {
     break;
    }
   }
   $12 = (_get_array_num($var_name,$2)|0);
   $13 = ($12|0)==(0|0);
   if ($13) {
    STACKTOP = sp;return;
   }
   $14 = HEAP32[1400>>2]|0;
   $15 = ($14|0)==(0|0);
   if (!($15)) {
    $16 = ((($14)) + 4|0);
    $17 = HEAP32[$16>>2]|0;
    HEAP32[1400>>2] = $17;
    _free_num($14);
    _free($14);
   }
   $18 = HEAP32[$12>>2]|0;
   $19 = (_bc_malloc(8)|0);
   $20 = (_copy_num($18)|0);
   HEAP32[$19>>2] = $20;
   $21 = HEAP32[1400>>2]|0;
   $22 = ((($19)) + 4|0);
   HEAP32[$22>>2] = $21;
   HEAP32[1400>>2] = $19;
   STACKTOP = sp;return;
  }
 } while(0);
 $9 = HEAP32[1392>>2]|0;
 $10 = (($9) + ($var_name<<2)|0);
 $11 = HEAP32[$10>>2]|0;
 HEAP32[$vararg_buffer1>>2] = $11;
 _rt_error(11150,$vararg_buffer1);
 STACKTOP = sp;return;
}
function _decr_var($var_name) {
 $var_name = $var_name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $var_ptr$0$i1 = 0;
 var $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 switch ($var_name|0) {
 case 0:  {
  $0 = HEAP32[1408>>2]|0;
  $1 = ($0|0)>(2);
  if ($1) {
   $2 = (($0) + -1)|0;
   HEAP32[1408>>2] = $2;
   STACKTOP = sp;return;
  } else {
   _rt_warn(11184,$vararg_buffer);
   STACKTOP = sp;return;
  }
  break;
 }
 case 1:  {
  $3 = HEAP32[1412>>2]|0;
  $4 = ($3|0)>(2);
  if ($4) {
   $5 = (($3) + -1)|0;
   HEAP32[1412>>2] = $5;
   STACKTOP = sp;return;
  } else {
   _rt_warn(11206,$vararg_buffer1);
   STACKTOP = sp;return;
  }
  break;
 }
 case 2:  {
  $6 = HEAP32[1416>>2]|0;
  $7 = ($6|0)>(0);
  if ($7) {
   $8 = (($6) + -1)|0;
   HEAP32[1416>>2] = $8;
   STACKTOP = sp;return;
  } else {
   _rt_warn(11228,$vararg_buffer3);
   STACKTOP = sp;return;
  }
  break;
 }
 default: {
  $9 = HEAP32[1376>>2]|0;
  $10 = (($9) + ($var_name<<2)|0);
  $11 = HEAP32[$10>>2]|0;
  $12 = ($11|0)==(0|0);
  if ($12) {
   $13 = (_bc_malloc(8)|0);
   $14 = HEAP32[1376>>2]|0;
   $15 = (($14) + ($var_name<<2)|0);
   HEAP32[$15>>2] = $13;
   _init_num($13);
   $16 = ($13|0)==(0|0);
   if ($16) {
    STACKTOP = sp;return;
   } else {
    $var_ptr$0$i1 = $13;
   }
  } else {
   $var_ptr$0$i1 = $11;
  }
  $17 = HEAP32[$var_ptr$0$i1>>2]|0;
  $18 = HEAP32[1324>>2]|0;
  _bc_sub($17,$18,$var_ptr$0$i1);
  STACKTOP = sp;return;
 }
 }
}
function _decr_array($0) {
 $0 = $0|0;
 var $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $sext = 0, $sext2 = 0, $temp$02$i = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $temp$02$i = HEAP32[1400>>2]|0;
 $1 = ($temp$02$i|0)==(0|0);
 if ($1) {
  _rt_error(10929,$vararg_buffer);
  STACKTOP = sp;return;
 }
 $2 = HEAP32[$temp$02$i>>2]|0;
 $3 = (_num2long($2)|0);
 $4 = ($3>>>0)>(2048);
 do {
  if (!($4)) {
   $5 = ($3|0)==(0);
   if ($5) {
    $6 = HEAP32[1400>>2]|0;
    $7 = HEAP32[$6>>2]|0;
    $8 = (_is_zero($7)|0);
    $9 = ($8<<24>>24)==(0);
    if ($9) {
     break;
    }
   }
   $sext = $0 << 24;
   $14 = $sext >> 24;
   $15 = (_get_array_num($14,$3)|0);
   $16 = ($15|0)==(0|0);
   if ($16) {
    STACKTOP = sp;return;
   }
   $17 = HEAP32[1400>>2]|0;
   $18 = ($17|0)==(0|0);
   if (!($18)) {
    $19 = ((($17)) + 4|0);
    $20 = HEAP32[$19>>2]|0;
    HEAP32[1400>>2] = $20;
    _free_num($17);
    _free($17);
   }
   $21 = HEAP32[$15>>2]|0;
   $22 = HEAP32[1324>>2]|0;
   _bc_sub($21,$22,$15);
   STACKTOP = sp;return;
  }
 } while(0);
 $sext2 = $0 << 24;
 $10 = $sext2 >> 24;
 $11 = HEAP32[1392>>2]|0;
 $12 = (($11) + ($10<<2)|0);
 $13 = HEAP32[$12>>2]|0;
 HEAP32[$vararg_buffer1>>2] = $13;
 _rt_error(11150,$vararg_buffer1);
 STACKTOP = sp;return;
}
function _incr_var($var_name) {
 $var_name = $var_name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $var_ptr$0$i1 = 0;
 var $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 switch ($var_name|0) {
 case 0:  {
  $0 = HEAP32[1408>>2]|0;
  $1 = ($0|0)<(16);
  if ($1) {
   $2 = (($0) + 1)|0;
   HEAP32[1408>>2] = $2;
   STACKTOP = sp;return;
  } else {
   _rt_warn(11261,$vararg_buffer);
   STACKTOP = sp;return;
  }
  break;
 }
 case 1:  {
  $3 = HEAP32[1412>>2]|0;
  $4 = ($3|0)<(99);
  if ($4) {
   $5 = (($3) + 1)|0;
   HEAP32[1412>>2] = $5;
   STACKTOP = sp;return;
  } else {
   _rt_warn(11281,$vararg_buffer1);
   STACKTOP = sp;return;
  }
  break;
 }
 case 2:  {
  $6 = HEAP32[1416>>2]|0;
  $7 = ($6|0)<(99);
  if ($7) {
   $8 = (($6) + 1)|0;
   HEAP32[1416>>2] = $8;
   STACKTOP = sp;return;
  } else {
   _rt_warn(11301,$vararg_buffer3);
   STACKTOP = sp;return;
  }
  break;
 }
 default: {
  $9 = HEAP32[1376>>2]|0;
  $10 = (($9) + ($var_name<<2)|0);
  $11 = HEAP32[$10>>2]|0;
  $12 = ($11|0)==(0|0);
  if ($12) {
   $13 = (_bc_malloc(8)|0);
   $14 = HEAP32[1376>>2]|0;
   $15 = (($14) + ($var_name<<2)|0);
   HEAP32[$15>>2] = $13;
   _init_num($13);
   $16 = ($13|0)==(0|0);
   if ($16) {
    STACKTOP = sp;return;
   } else {
    $var_ptr$0$i1 = $13;
   }
  } else {
   $var_ptr$0$i1 = $11;
  }
  $17 = HEAP32[$var_ptr$0$i1>>2]|0;
  $18 = HEAP32[1324>>2]|0;
  _bc_add($17,$18,$var_ptr$0$i1);
  STACKTOP = sp;return;
 }
 }
}
function _incr_array($var_name) {
 $var_name = $var_name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0;
 var $temp$02$i = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $temp$02$i = HEAP32[1400>>2]|0;
 $0 = ($temp$02$i|0)==(0|0);
 if ($0) {
  _rt_error(10929,$vararg_buffer);
  STACKTOP = sp;return;
 }
 $1 = HEAP32[$temp$02$i>>2]|0;
 $2 = (_num2long($1)|0);
 $3 = ($2>>>0)>(2048);
 do {
  if (!($3)) {
   $4 = ($2|0)==(0);
   if ($4) {
    $5 = HEAP32[1400>>2]|0;
    $6 = HEAP32[$5>>2]|0;
    $7 = (_is_zero($6)|0);
    $8 = ($7<<24>>24)==(0);
    if ($8) {
     break;
    }
   }
   $12 = (_get_array_num($var_name,$2)|0);
   $13 = ($12|0)==(0|0);
   if ($13) {
    STACKTOP = sp;return;
   }
   $14 = HEAP32[1400>>2]|0;
   $15 = ($14|0)==(0|0);
   if (!($15)) {
    $16 = ((($14)) + 4|0);
    $17 = HEAP32[$16>>2]|0;
    HEAP32[1400>>2] = $17;
    _free_num($14);
    _free($14);
   }
   $18 = HEAP32[$12>>2]|0;
   $19 = HEAP32[1324>>2]|0;
   _bc_add($18,$19,$12);
   STACKTOP = sp;return;
  }
 } while(0);
 $9 = HEAP32[1392>>2]|0;
 $10 = (($9) + ($var_name<<2)|0);
 $11 = HEAP32[$10>>2]|0;
 HEAP32[$vararg_buffer1>>2] = $11;
 _rt_error(11150,$vararg_buffer1);
 STACKTOP = sp;return;
}
function _auto_var($name) {
 $name = $name|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($name|0)>(0);
 if ($0) {
  $1 = (_bc_malloc(8)|0);
  $2 = HEAP32[1376>>2]|0;
  $3 = (($2) + ($name<<2)|0);
  $4 = HEAP32[$3>>2]|0;
  $5 = ((($1)) + 4|0);
  HEAP32[$5>>2] = $4;
  _init_num($1);
  $6 = HEAP32[1376>>2]|0;
  $7 = (($6) + ($name<<2)|0);
  HEAP32[$7>>2] = $1;
  return;
 } else {
  $8 = (0 - ($name))|0;
  $9 = (_bc_malloc(12)|0);
  $10 = HEAP32[1388>>2]|0;
  $11 = (($10) + ($8<<2)|0);
  $12 = HEAP32[$11>>2]|0;
  $13 = ((($9)) + 8|0);
  HEAP32[$13>>2] = $12;
  HEAP32[$9>>2] = 0;
  $14 = ((($9)) + 4|0);
  HEAP8[$14>>0] = 0;
  $15 = HEAP32[1388>>2]|0;
  $16 = (($15) + ($8<<2)|0);
  HEAP32[$16>>2] = $9;
  return;
 }
}
function _free_a_tree($root,$depth) {
 $root = $root|0;
 $depth = $depth|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0;
 var $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0;
 var $45 = 0, $46 = 0, $47 = 0, $48 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($root|0)==(0|0);
 if ($0) {
  return;
 }
 $1 = ($depth|0)>(1);
 if ($1) {
  $17 = (($depth) + -1)|0;
  $18 = HEAP32[$root>>2]|0;
  _free_a_tree($18,$17);
  $19 = ((($root)) + 4|0);
  $20 = HEAP32[$19>>2]|0;
  _free_a_tree($20,$17);
  $21 = ((($root)) + 8|0);
  $22 = HEAP32[$21>>2]|0;
  _free_a_tree($22,$17);
  $23 = ((($root)) + 12|0);
  $24 = HEAP32[$23>>2]|0;
  _free_a_tree($24,$17);
  $25 = ((($root)) + 16|0);
  $26 = HEAP32[$25>>2]|0;
  _free_a_tree($26,$17);
  $27 = ((($root)) + 20|0);
  $28 = HEAP32[$27>>2]|0;
  _free_a_tree($28,$17);
  $29 = ((($root)) + 24|0);
  $30 = HEAP32[$29>>2]|0;
  _free_a_tree($30,$17);
  $31 = ((($root)) + 28|0);
  $32 = HEAP32[$31>>2]|0;
  _free_a_tree($32,$17);
  $33 = ((($root)) + 32|0);
  $34 = HEAP32[$33>>2]|0;
  _free_a_tree($34,$17);
  $35 = ((($root)) + 36|0);
  $36 = HEAP32[$35>>2]|0;
  _free_a_tree($36,$17);
  $37 = ((($root)) + 40|0);
  $38 = HEAP32[$37>>2]|0;
  _free_a_tree($38,$17);
  $39 = ((($root)) + 44|0);
  $40 = HEAP32[$39>>2]|0;
  _free_a_tree($40,$17);
  $41 = ((($root)) + 48|0);
  $42 = HEAP32[$41>>2]|0;
  _free_a_tree($42,$17);
  $43 = ((($root)) + 52|0);
  $44 = HEAP32[$43>>2]|0;
  _free_a_tree($44,$17);
  $45 = ((($root)) + 56|0);
  $46 = HEAP32[$45>>2]|0;
  _free_a_tree($46,$17);
  $47 = ((($root)) + 60|0);
  $48 = HEAP32[$47>>2]|0;
  _free_a_tree($48,$17);
 } else {
  _free_num($root);
  $2 = ((($root)) + 4|0);
  _free_num($2);
  $3 = ((($root)) + 8|0);
  _free_num($3);
  $4 = ((($root)) + 12|0);
  _free_num($4);
  $5 = ((($root)) + 16|0);
  _free_num($5);
  $6 = ((($root)) + 20|0);
  _free_num($6);
  $7 = ((($root)) + 24|0);
  _free_num($7);
  $8 = ((($root)) + 28|0);
  _free_num($8);
  $9 = ((($root)) + 32|0);
  _free_num($9);
  $10 = ((($root)) + 36|0);
  _free_num($10);
  $11 = ((($root)) + 40|0);
  _free_num($11);
  $12 = ((($root)) + 44|0);
  _free_num($12);
  $13 = ((($root)) + 48|0);
  _free_num($13);
  $14 = ((($root)) + 52|0);
  _free_num($14);
  $15 = ((($root)) + 56|0);
  _free_num($15);
  $16 = ((($root)) + 60|0);
  _free_num($16);
 }
 _free($root);
 return;
}
function _pop_vars($list) {
 $list = $list|0;
 var $$01 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($list|0)==(0|0);
 if ($0) {
  return;
 } else {
  $$01 = $list;
 }
 while(1) {
  $1 = HEAP32[$$01>>2]|0;
  $2 = ($1|0)>(0);
  if ($2) {
   $3 = HEAP32[1376>>2]|0;
   $4 = (($3) + ($1<<2)|0);
   $5 = HEAP32[$4>>2]|0;
   $6 = ($5|0)==(0|0);
   if (!($6)) {
    $7 = ((($5)) + 4|0);
    $8 = HEAP32[$7>>2]|0;
    HEAP32[$4>>2] = $8;
    _free_num($5);
    _free($5);
   }
  } else {
   $9 = (0 - ($1))|0;
   $10 = HEAP32[1388>>2]|0;
   $11 = (($10) + ($9<<2)|0);
   $12 = HEAP32[$11>>2]|0;
   $13 = ($12|0)==(0|0);
   if (!($13)) {
    $14 = ((($12)) + 8|0);
    $15 = HEAP32[$14>>2]|0;
    HEAP32[$11>>2] = $15;
    $16 = ((($12)) + 4|0);
    $17 = HEAP8[$16>>0]|0;
    $18 = ($17<<24>>24)==(0);
    if ($18) {
     $19 = HEAP32[$12>>2]|0;
     $20 = ($19|0)==(0|0);
     if (!($20)) {
      $21 = HEAP32[$19>>2]|0;
      $22 = ((($19)) + 4|0);
      $23 = HEAP16[$22>>1]|0;
      $24 = $23 << 16 >> 16;
      _free_a_tree($21,$24);
      $25 = HEAP32[$12>>2]|0;
      _free($25);
     }
    }
    _free($12);
   }
  }
  $26 = ((($$01)) + 4|0);
  $27 = HEAP32[$26>>2]|0;
  $28 = ($27|0)==(0|0);
  if ($28) {
   break;
  } else {
   $$01 = $27;
  }
 }
 return;
}
function _process_params($pc,$func) {
 $pc = $pc|0;
 $func = $func|0;
 var $$lcssa = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $8 = 0, $9 = 0, $a_src$0 = 0, $params$0 = 0, $params$02 = 0, $params$03 = 0, $params$1 = 0;
 var $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer4 = 0, $vararg_buffer6 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer6 = sp + 24|0;
 $vararg_buffer4 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $0 = HEAP32[1364>>2]|0;
 $1 = (((($0) + (($func*84)|0)|0)) + 76|0);
 $params$02 = HEAP32[$1>>2]|0;
 $2 = (_byte($pc)|0);
 $3 = ($2<<24>>24)==(58);
 $4 = ($params$02|0)!=(0|0);
 L1: do {
  if ($3) {
   $$lcssa = $4;
  } else {
   $5 = $2;$72 = $4;$params$03 = $params$02;
   while(1) {
    if (!($72)) {
     break;
    }
    switch ($5<<24>>24) {
    case 48:  {
     $6 = HEAP32[$params$03>>2]|0;
     $7 = ($6|0)>(0);
     if ($7) {
      $8 = (_bc_malloc(8)|0);
      $9 = HEAP32[1376>>2]|0;
      $10 = (($9) + ($6<<2)|0);
      $11 = HEAP32[$10>>2]|0;
      $12 = ((($8)) + 4|0);
      HEAP32[$12>>2] = $11;
      $13 = HEAP32[1400>>2]|0;
      $14 = HEAP32[$13>>2]|0;
      HEAP32[$8>>2] = $14;
      $15 = HEAP32[1400>>2]|0;
      _init_num($15);
      $16 = HEAP32[1376>>2]|0;
      $17 = (($16) + ($6<<2)|0);
      HEAP32[$17>>2] = $8;
      $params$1 = $params$03;
     } else {
      $53 = $6;
      label = 14;
     }
     break;
    }
    case 49:  {
     $18 = HEAP32[$params$03>>2]|0;
     $19 = ($18|0)<(0);
     if ($19) {
      $20 = HEAP32[1400>>2]|0;
      $21 = HEAP32[$20>>2]|0;
      $22 = (_num2long($21)|0);
      (_get_array_num($22,0)|0);
      $23 = HEAP32[$params$03>>2]|0;
      $24 = ($23|0)>(0);
      if ($24) {
       $25 = (_bc_malloc(8)|0);
       $26 = HEAP32[1376>>2]|0;
       $27 = (($26) + ($23<<2)|0);
       $28 = HEAP32[$27>>2]|0;
       $29 = ((($25)) + 4|0);
       HEAP32[$29>>2] = $28;
       _init_num($25);
       $30 = HEAP32[1376>>2]|0;
       $31 = (($30) + ($23<<2)|0);
       HEAP32[$31>>2] = $25;
      } else {
       $32 = (0 - ($23))|0;
       $33 = (_bc_malloc(12)|0);
       $34 = HEAP32[1388>>2]|0;
       $35 = (($34) + ($32<<2)|0);
       $36 = HEAP32[$35>>2]|0;
       $37 = ((($33)) + 8|0);
       HEAP32[$37>>2] = $36;
       HEAP32[$33>>2] = 0;
       $38 = ((($33)) + 4|0);
       HEAP8[$38>>0] = 0;
       $39 = HEAP32[1388>>2]|0;
       $40 = (($39) + ($32<<2)|0);
       HEAP32[$40>>2] = $33;
      }
      $41 = HEAP32[$params$03>>2]|0;
      $42 = (0 - ($41))|0;
      $43 = ($22|0)==($42|0);
      $44 = HEAP32[1388>>2]|0;
      $45 = (($44) + ($22<<2)|0);
      $46 = HEAP32[$45>>2]|0;
      if ($43) {
       $47 = ((($46)) + 8|0);
       $48 = HEAP32[$47>>2]|0;
       $a_src$0 = $48;
      } else {
       $a_src$0 = $46;
      }
      $49 = (($44) + ($42<<2)|0);
      $50 = HEAP32[$49>>2]|0;
      $51 = ((($50)) + 4|0);
      HEAP8[$51>>0] = 1;
      $52 = HEAP32[$a_src$0>>2]|0;
      HEAP32[$50>>2] = $52;
      $params$1 = $params$03;
     } else {
      $61 = $18;
      label = 16;
     }
     break;
    }
    default: {
     $$pre = HEAP32[$params$03>>2]|0;
     $53 = $$pre;
     label = 14;
    }
    }
    if ((label|0) == 14) {
     label = 0;
     $54 = ($53|0)<(0);
     if ($54) {
      $55 = (0 - ($53))|0;
      $56 = HEAP32[1392>>2]|0;
      $57 = (($56) + ($55<<2)|0);
      $58 = HEAP32[$57>>2]|0;
      HEAP32[$vararg_buffer>>2] = $58;
      _rt_error(11321,$vararg_buffer);
      label = 17;
     } else {
      $61 = $53;
      label = 16;
     }
    }
    if ((label|0) == 16) {
     label = 0;
     $59 = HEAP32[1380>>2]|0;
     $60 = (($59) + ($61<<2)|0);
     $62 = HEAP32[$60>>2]|0;
     HEAP32[$vararg_buffer1>>2] = $62;
     _rt_error(11359,$vararg_buffer1);
     label = 17;
    }
    if ((label|0) == 17) {
     label = 0;
     $63 = ((($params$03)) + 8|0);
     $params$1 = $63;
    }
    $64 = HEAP32[1400>>2]|0;
    $65 = ($64|0)==(0|0);
    if (!($65)) {
     $66 = ((($64)) + 4|0);
     $67 = HEAP32[$66>>2]|0;
     HEAP32[1400>>2] = $67;
     _free_num($64);
     _free($64);
    }
    $68 = ((($params$1)) + 4|0);
    $params$0 = HEAP32[$68>>2]|0;
    $69 = (_byte($pc)|0);
    $70 = ($69<<24>>24)==(58);
    $71 = ($params$0|0)!=(0|0);
    if ($70) {
     $$lcssa = $71;
     break L1;
    } else {
     $5 = $69;$72 = $71;$params$03 = $params$0;
    }
   }
   _rt_error(11398,$vararg_buffer4);
   STACKTOP = sp;return;
  }
 } while(0);
 if (!($$lcssa)) {
  STACKTOP = sp;return;
 }
 _rt_error(11398,$vararg_buffer6);
 STACKTOP = sp;return;
}
function _init_load() {
 var label = 0, sp = 0;
 sp = STACKTOP;
 _clear_func(0);
 HEAP32[1332>>2] = 0;
 HEAP32[(1336)>>2] = 0;
 HEAP8[11424>>0] = 0;
 HEAP8[11425>>0] = 0;
 return;
}
function _load_code($code) {
 $code = $code|0;
 var $$0$i = 0, $$0$i105 = 0, $$0$i161 = 0, $$0$i42 = 0, $$0$i64 = 0, $$0$i76 = 0, $$0$i88 = 0, $$code192 = 0, $$phi$trans$insert$i = 0, $$phi$trans$insert$i10 = 0, $$phi$trans$insert$i109 = 0, $$phi$trans$insert$i114 = 0, $$phi$trans$insert$i119 = 0, $$phi$trans$insert$i124 = 0, $$phi$trans$insert$i128 = 0, $$phi$trans$insert$i133 = 0, $$phi$trans$insert$i138 = 0, $$phi$trans$insert$i143 = 0, $$phi$trans$insert$i148 = 0, $$phi$trans$insert$i15 = 0;
 var $$phi$trans$insert$i165 = 0, $$phi$trans$insert$i170 = 0, $$phi$trans$insert$i175 = 0, $$phi$trans$insert$i180 = 0, $$phi$trans$insert$i20 = 0, $$phi$trans$insert$i25 = 0, $$phi$trans$insert$i29 = 0, $$phi$trans$insert$i46 = 0, $$phi$trans$insert$i5 = 0, $$phi$trans$insert$i51 = 0, $$phi$trans$insert$i92 = 0, $$pr = 0, $$pr201 = 0, $$pr203 = 0, $$pr205 = 0, $$pr258 = 0, $$pre = 0, $$pre$i = 0, $$pre$i108 = 0, $$pre$i113 = 0;
 var $$pre$i118 = 0, $$pre$i123 = 0, $$pre$i127 = 0, $$pre$i132 = 0, $$pre$i137 = 0, $$pre$i14 = 0, $$pre$i142 = 0, $$pre$i147 = 0, $$pre$i151 = 0, $$pre$i164 = 0, $$pre$i169 = 0, $$pre$i174 = 0, $$pre$i179 = 0, $$pre$i19 = 0, $$pre$i23 = 0, $$pre$i24 = 0, $$pre$i28 = 0, $$pre$i32 = 0, $$pre$i4 = 0, $$pre$i45 = 0;
 var $$pre$i50 = 0, $$pre$i54 = 0, $$pre$i66 = 0, $$pre$i78 = 0, $$pre$i9 = 0, $$pre$i91 = 0, $$pre$i95 = 0, $$pre1$i = 0, $$pre1$i11 = 0, $$pre1$i110 = 0, $$pre1$i115 = 0, $$pre1$i120 = 0, $$pre1$i125 = 0, $$pre1$i129 = 0, $$pre1$i134 = 0, $$pre1$i139 = 0, $$pre1$i144 = 0, $$pre1$i149 = 0, $$pre1$i16 = 0, $$pre1$i166 = 0;
 var $$pre1$i171 = 0, $$pre1$i176 = 0, $$pre1$i181 = 0, $$pre1$i21 = 0, $$pre1$i30 = 0, $$pre1$i47 = 0, $$pre1$i52 = 0, $$pre1$i6 = 0, $$pre1$i93 = 0, $$pre307 = 0, $$pre308 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0;
 var $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0;
 var $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0;
 var $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0;
 var $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0;
 var $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0;
 var $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0;
 var $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0;
 var $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0;
 var $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0;
 var $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0;
 var $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0;
 var $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0;
 var $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0;
 var $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0;
 var $359 = 0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0;
 var $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0;
 var $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0;
 var $412 = 0, $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0;
 var $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0;
 var $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0;
 var $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0;
 var $485 = 0, $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0;
 var $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0;
 var $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0;
 var $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0;
 var $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0;
 var $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0;
 var $593 = 0, $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0;
 var $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0;
 var $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0;
 var $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0;
 var $665 = 0, $666 = 0, $667 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0;
 var $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $byte$i107 = 0;
 var $byte$i112 = 0, $byte$i117 = 0, $byte$i13 = 0, $byte$i163 = 0, $byte$i168 = 0, $byte$i173 = 0, $byte$i18 = 0, $byte$i44 = 0, $byte$i49 = 0, $code183$ph$be = 0, $code183$ph260 = 0, $code184 = 0, $code185 = 0, $code186 = 0, $code187255 = 0, $code187255$lcssa = 0, $code188 = 0, $code189 = 0, $code190 = 0, $code191 = 0;
 var $code191$lcssa = 0, $code192 = 0, $code193 = 0, $code194$lcssa = 0, $code194253 = 0, $code195 = 0, $code196 = 0, $code197 = 0, $code198 = 0, $code199 = 0, $code200 = 0, $group$02$i = 0, $isdigit$i = 0, $isdigit$i102 = 0, $isdigit$i158 = 0, $isdigit$i39 = 0, $isdigit$i61 = 0, $isdigit$i73 = 0, $isdigit$i85 = 0, $isdigit2$i = 0;
 var $isdigit2$i154 = 0, $isdigit2$i35 = 0, $isdigit2$i57 = 0, $isdigit2$i69 = 0, $isdigit2$i81 = 0, $isdigit2$i98 = 0, $isdigittmp$i = 0, $isdigittmp$i101 = 0, $isdigittmp$i157 = 0, $isdigittmp$i38 = 0, $isdigittmp$i60 = 0, $isdigittmp$i72 = 0, $isdigittmp$i84 = 0, $isdigittmp1$i = 0, $isdigittmp1$i153 = 0, $isdigittmp1$i34 = 0, $isdigittmp1$i56 = 0, $isdigittmp1$i68 = 0, $isdigittmp1$i80 = 0, $isdigittmp1$i97 = 0;
 var $neg$0$ph$i = 0, $neg$0$ph$i152 = 0, $neg$0$ph$i33 = 0, $neg$0$ph$i55 = 0, $neg$0$ph$i67 = 0, $neg$0$ph$i79 = 0, $neg$0$ph$i96 = 0, $or$cond251 = 0, $or$cond251259 = 0, $sext2 = 0, $temp$0$i = 0, $temp$0$lcssa$i = 0, $temp$0$pre$i = 0, $temp$01$i = 0, $temp$01$pre$i = 0, $temp$03$i = 0, $val$0$lcssa$i = 0, $val$0$lcssa$i104 = 0, $val$0$lcssa$i160 = 0, $val$0$lcssa$i41 = 0;
 var $val$0$lcssa$i63 = 0, $val$0$lcssa$i75 = 0, $val$0$lcssa$i87 = 0, $val$03$i = 0, $val$03$i100 = 0, $val$03$i156 = 0, $val$03$i37 = 0, $val$03$i59 = 0, $val$03$i71 = 0, $val$03$i83 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer11 = 0, $vararg_buffer13 = 0, $vararg_buffer15 = 0, $vararg_buffer17 = 0, $vararg_buffer19 = 0, $vararg_buffer21 = 0, $vararg_buffer23 = 0, $vararg_buffer25 = 0;
 var $vararg_buffer27 = 0, $vararg_buffer29 = 0, $vararg_buffer3 = 0, $vararg_buffer31 = 0, $vararg_buffer33 = 0, $vararg_buffer35 = 0, $vararg_buffer37 = 0, $vararg_buffer39 = 0, $vararg_buffer41 = 0, $vararg_buffer5 = 0, $vararg_buffer7 = 0, $vararg_buffer9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 176|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer41 = sp + 168|0;
 $vararg_buffer39 = sp + 160|0;
 $vararg_buffer37 = sp + 152|0;
 $vararg_buffer35 = sp + 144|0;
 $vararg_buffer33 = sp + 136|0;
 $vararg_buffer31 = sp + 128|0;
 $vararg_buffer29 = sp + 120|0;
 $vararg_buffer27 = sp + 112|0;
 $vararg_buffer25 = sp + 104|0;
 $vararg_buffer23 = sp + 96|0;
 $vararg_buffer21 = sp + 88|0;
 $vararg_buffer19 = sp + 80|0;
 $vararg_buffer17 = sp + 72|0;
 $vararg_buffer15 = sp + 64|0;
 $vararg_buffer13 = sp + 56|0;
 $vararg_buffer11 = sp + 48|0;
 $vararg_buffer9 = sp + 40|0;
 $vararg_buffer7 = sp + 32|0;
 $vararg_buffer5 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $$pr258 = HEAP32[1436>>2]|0;
 $0 = HEAP8[$code>>0]|0;
 $1 = ($0<<24>>24)==(0);
 $2 = ($$pr258|0)!=(0);
 $or$cond251259 = $2 | $1;
 if ($or$cond251259) {
  STACKTOP = sp;return;
 }
 $3 = $0 << 24 >> 24;
 $321 = 0;$324 = 0;$5 = $0;$79 = $3;$code183$ph260 = $code;
 L4: while(1) {
  $$pre = HEAP8[11424>>0]|0;
  $4 = ($$pre<<24>>24)==(0);
  L6: do {
   if ($4) {
    $28 = HEAP8[11425>>0]|0;
    $29 = ($28<<24>>24)==(0);
    if (!($29)) {
     switch ($5<<24>>24) {
     case 10:  {
      $30 = ((($code183$ph260)) + 1|0);
      $662 = $321;$663 = $324;$code183$ph$be = $30;
      break L6;
      break;
     }
     case 58:  {
      HEAP8[11425>>0] = 0;
      $31 = ((($code183$ph260)) + 1|0);
      $32 = HEAP8[$code183$ph260>>0]|0;
      $33 = HEAP32[(1336)>>2]|0;
      $34 = $33 >> 10;
      $35 = (($33) + 1)|0;
      HEAP32[(1336)>>2] = $35;
      $36 = (($33|0) % 1024)&-1;
      $37 = HEAP32[1332>>2]|0;
      $38 = ($34|0)>(15);
      if ($38) {
       _yyerror(11426,$vararg_buffer1);
       $662 = $321;$663 = $324;$code183$ph$be = $31;
       break L6;
      }
      $39 = HEAP32[1364>>2]|0;
      $40 = ((((($39) + (($37*84)|0)|0)) + 4|0) + ($34<<2)|0);
      $41 = HEAP32[$40>>2]|0;
      $42 = ($41|0)==(0|0);
      if ($42) {
       $43 = (_bc_malloc(1024)|0);
       $44 = HEAP32[1364>>2]|0;
       $45 = ((((($44) + (($37*84)|0)|0)) + 4|0) + ($34<<2)|0);
       HEAP32[$45>>2] = $43;
       $$pre$i4 = HEAP32[1364>>2]|0;
       $$phi$trans$insert$i5 = ((((($$pre$i4) + (($37*84)|0)|0)) + 4|0) + ($34<<2)|0);
       $$pre1$i6 = HEAP32[$$phi$trans$insert$i5>>2]|0;
       $47 = $$pre1$i6;
      } else {
       $47 = $41;
      }
      $46 = (($47) + ($36)|0);
      HEAP8[$46>>0] = $32;
      $48 = HEAP32[1364>>2]|0;
      $49 = (((($48) + (($37*84)|0)|0)) + 68|0);
      $50 = HEAP32[$49>>2]|0;
      $51 = (($50) + 1)|0;
      HEAP32[$49>>2] = $51;
      $662 = $321;$663 = $324;$code183$ph$be = $31;
      break L6;
      break;
     }
     case 46:  {
      $56 = ((($code183$ph260)) + 1|0);
      $57 = HEAP32[(1336)>>2]|0;
      $58 = $57 >> 10;
      $59 = (($57) + 1)|0;
      HEAP32[(1336)>>2] = $59;
      $60 = (($57|0) % 1024)&-1;
      $61 = HEAP32[1332>>2]|0;
      $62 = ($58|0)>(15);
      if ($62) {
       _yyerror(11426,$vararg_buffer3);
       $662 = $321;$663 = $324;$code183$ph$be = $56;
       break L6;
      }
      $63 = HEAP32[1364>>2]|0;
      $64 = ((((($63) + (($61*84)|0)|0)) + 4|0) + ($58<<2)|0);
      $65 = HEAP32[$64>>2]|0;
      $66 = ($65|0)==(0|0);
      if ($66) {
       $67 = (_bc_malloc(1024)|0);
       $68 = HEAP32[1364>>2]|0;
       $69 = ((((($68) + (($61*84)|0)|0)) + 4|0) + ($58<<2)|0);
       HEAP32[$69>>2] = $67;
       $$pre$i9 = HEAP32[1364>>2]|0;
       $$phi$trans$insert$i10 = ((((($$pre$i9) + (($61*84)|0)|0)) + 4|0) + ($58<<2)|0);
       $$pre1$i11 = HEAP32[$$phi$trans$insert$i10>>2]|0;
       $71 = $$pre1$i11;
      } else {
       $71 = $65;
      }
      $70 = (($71) + ($60)|0);
      HEAP8[$70>>0] = 46;
      $72 = HEAP32[1364>>2]|0;
      $73 = (((($72) + (($61*84)|0)|0)) + 68|0);
      $74 = HEAP32[$73>>2]|0;
      $75 = (($74) + 1)|0;
      HEAP32[$73>>2] = $75;
      $662 = $321;$663 = $324;$code183$ph$be = $56;
      break L6;
      break;
     }
     default: {
      $76 = ($5<<24>>24)>(64);
      $77 = ((($code183$ph260)) + 1|0);
      if ($76) {
       $78 = (($79) + 201)|0;
       $byte$i13 = $78&255;
       $80 = HEAP32[(1336)>>2]|0;
       $81 = $80 >> 10;
       $82 = (($80) + 1)|0;
       HEAP32[(1336)>>2] = $82;
       $83 = (($80|0) % 1024)&-1;
       $84 = HEAP32[1332>>2]|0;
       $85 = ($81|0)>(15);
       if ($85) {
        _yyerror(11426,$vararg_buffer5);
        $662 = $321;$663 = $324;$code183$ph$be = $77;
        break L6;
       }
       $86 = HEAP32[1364>>2]|0;
       $87 = ((((($86) + (($84*84)|0)|0)) + 4|0) + ($81<<2)|0);
       $88 = HEAP32[$87>>2]|0;
       $89 = ($88|0)==(0|0);
       if ($89) {
        $90 = (_bc_malloc(1024)|0);
        $91 = HEAP32[1364>>2]|0;
        $92 = ((((($91) + (($84*84)|0)|0)) + 4|0) + ($81<<2)|0);
        HEAP32[$92>>2] = $90;
        $$pre$i14 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i15 = ((((($$pre$i14) + (($84*84)|0)|0)) + 4|0) + ($81<<2)|0);
        $$pre1$i16 = HEAP32[$$phi$trans$insert$i15>>2]|0;
        $94 = $$pre1$i16;
       } else {
        $94 = $88;
       }
       $93 = (($94) + ($83)|0);
       HEAP8[$93>>0] = $byte$i13;
       $95 = HEAP32[1364>>2]|0;
       $96 = (((($95) + (($84*84)|0)|0)) + 68|0);
       $97 = HEAP32[$96>>2]|0;
       $98 = (($97) + 1)|0;
       HEAP32[$96>>2] = $98;
       $662 = $321;$663 = $324;$code183$ph$be = $77;
       break L6;
      } else {
       $99 = (($79) + 208)|0;
       $byte$i18 = $99&255;
       $100 = HEAP32[(1336)>>2]|0;
       $101 = $100 >> 10;
       $102 = (($100) + 1)|0;
       HEAP32[(1336)>>2] = $102;
       $103 = (($100|0) % 1024)&-1;
       $104 = HEAP32[1332>>2]|0;
       $105 = ($101|0)>(15);
       if ($105) {
        _yyerror(11426,$vararg_buffer7);
        $662 = $321;$663 = $324;$code183$ph$be = $77;
        break L6;
       }
       $106 = HEAP32[1364>>2]|0;
       $107 = ((((($106) + (($104*84)|0)|0)) + 4|0) + ($101<<2)|0);
       $108 = HEAP32[$107>>2]|0;
       $109 = ($108|0)==(0|0);
       if ($109) {
        $110 = (_bc_malloc(1024)|0);
        $111 = HEAP32[1364>>2]|0;
        $112 = ((((($111) + (($104*84)|0)|0)) + 4|0) + ($101<<2)|0);
        HEAP32[$112>>2] = $110;
        $$pre$i19 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i20 = ((((($$pre$i19) + (($104*84)|0)|0)) + 4|0) + ($101<<2)|0);
        $$pre1$i21 = HEAP32[$$phi$trans$insert$i20>>2]|0;
        $114 = $$pre1$i21;
       } else {
        $114 = $108;
       }
       $113 = (($114) + ($103)|0);
       HEAP8[$113>>0] = $byte$i18;
       $115 = HEAP32[1364>>2]|0;
       $116 = (((($115) + (($104*84)|0)|0)) + 68|0);
       $117 = HEAP32[$116>>2]|0;
       $118 = (($117) + 1)|0;
       HEAP32[$116>>2] = $118;
       $662 = $321;$663 = $324;$code183$ph$be = $77;
       break L6;
      }
     }
     }
    }
    L43: do {
     switch ($79|0) {
     case 34:  {
      HEAP8[11424>>0] = 1;
      $664 = $321;$665 = $324;$code200 = $code183$ph260;
      break;
     }
     case 78:  {
      $119 = ((($code183$ph260)) + 1|0);
      $120 = HEAP8[$119>>0]|0;
      $121 = ($120<<24>>24)==(45);
      if ($121) {
       $122 = ((($code183$ph260)) + 2|0);
       $$pre$i23 = HEAP8[$122>>0]|0;
       $124 = $$pre$i23;$666 = $122;$neg$0$ph$i = 1;
      } else {
       $124 = $120;$666 = $119;$neg$0$ph$i = 0;
      }
      $123 = $124 << 24 >> 24;
      $isdigittmp1$i = (($123) + -48)|0;
      $isdigit2$i = ($isdigittmp1$i>>>0)<(10);
      if ($isdigit2$i) {
       $127 = $666;$129 = $124;$val$03$i = 0;
       while(1) {
        $125 = ($val$03$i*10)|0;
        $126 = ((($127)) + 1|0);
        $128 = $129 << 24 >> 24;
        $130 = (($125) + -48)|0;
        $131 = (($130) + ($128))|0;
        $132 = HEAP8[$126>>0]|0;
        $133 = $132 << 24 >> 24;
        $isdigittmp$i = (($133) + -48)|0;
        $isdigit$i = ($isdigittmp$i>>>0)<(10);
        if ($isdigit$i) {
         $127 = $126;$129 = $132;$val$03$i = $131;
        } else {
         $code199 = $126;$val$0$lcssa$i = $131;
         break;
        }
       }
      } else {
       $code199 = $666;$val$0$lcssa$i = 0;
      }
      $134 = ($neg$0$ph$i<<24>>24)==(0);
      $135 = (0 - ($val$0$lcssa$i))|0;
      $$0$i = $134 ? $val$0$lcssa$i : $135;
      $136 = $$0$i >> 6;
      $137 = (($$0$i|0) % 64)&-1;
      $138 = HEAP32[1332>>2]|0;
      $139 = HEAP32[1364>>2]|0;
      $140 = (((($139) + (($138*84)|0)|0)) + 72|0);
      $141 = HEAP32[$140>>2]|0;
      $142 = ($141|0)==(0|0);
      if ($142) {
       $143 = (_bc_malloc(260)|0);
       $144 = HEAP32[1364>>2]|0;
       $145 = (((($144) + (($138*84)|0)|0)) + 72|0);
       HEAP32[$145>>2] = $143;
       $146 = HEAP32[1364>>2]|0;
       $147 = (((($146) + (($138*84)|0)|0)) + 72|0);
       $148 = HEAP32[$147>>2]|0;
       $149 = ((($148)) + 256|0);
       HEAP32[$149>>2] = 0;
       $$pre$i24 = HEAP32[1364>>2]|0;
       $$phi$trans$insert$i25 = (((($$pre$i24) + (($138*84)|0)|0)) + 72|0);
       $temp$01$pre$i = HEAP32[$$phi$trans$insert$i25>>2]|0;
       $temp$01$i = $temp$01$pre$i;
      } else {
       $temp$01$i = $141;
      }
      $150 = ($136|0)>(0);
      if ($150) {
       $group$02$i = $136;$temp$03$i = $temp$01$i;
       while(1) {
        $151 = ((($temp$03$i)) + 256|0);
        $152 = HEAP32[$151>>2]|0;
        $153 = ($152|0)==(0|0);
        if ($153) {
         $154 = (_bc_malloc(260)|0);
         HEAP32[$151>>2] = $154;
         $155 = ((($154)) + 256|0);
         HEAP32[$155>>2] = 0;
         $temp$0$pre$i = HEAP32[$151>>2]|0;
         $temp$0$i = $temp$0$pre$i;
        } else {
         $temp$0$i = $152;
        }
        $156 = (($group$02$i) + -1)|0;
        $157 = ($group$02$i|0)>(1);
        if ($157) {
         $group$02$i = $156;$temp$03$i = $temp$0$i;
        } else {
         $temp$0$lcssa$i = $temp$0$i;
         break;
        }
       }
      } else {
       $temp$0$lcssa$i = $temp$01$i;
      }
      $158 = HEAP32[(1336)>>2]|0;
      $159 = (($temp$0$lcssa$i) + ($137<<2)|0);
      HEAP32[$159>>2] = $158;
      $664 = $321;$665 = $324;$code200 = $code199;
      break;
     }
     case 90: case 74: case 66:  {
      $160 = ((($code183$ph260)) + 1|0);
      $161 = HEAP32[(1336)>>2]|0;
      $162 = $161 >> 10;
      $163 = (($161) + 1)|0;
      HEAP32[(1336)>>2] = $163;
      $164 = (($161|0) % 1024)&-1;
      $165 = HEAP32[1332>>2]|0;
      $166 = ($162|0)>(15);
      if ($166) {
       _yyerror(11426,$vararg_buffer9);
      } else {
       $167 = HEAP32[1364>>2]|0;
       $168 = ((((($167) + (($165*84)|0)|0)) + 4|0) + ($162<<2)|0);
       $169 = HEAP32[$168>>2]|0;
       $170 = ($169|0)==(0|0);
       if ($170) {
        $171 = (_bc_malloc(1024)|0);
        $172 = HEAP32[1364>>2]|0;
        $173 = ((((($172) + (($165*84)|0)|0)) + 4|0) + ($162<<2)|0);
        HEAP32[$173>>2] = $171;
        $$pre$i28 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i29 = ((((($$pre$i28) + (($165*84)|0)|0)) + 4|0) + ($162<<2)|0);
        $$pre1$i30 = HEAP32[$$phi$trans$insert$i29>>2]|0;
        $175 = $$pre1$i30;
       } else {
        $175 = $169;
       }
       $174 = (($175) + ($164)|0);
       HEAP8[$174>>0] = $5;
       $176 = HEAP32[1364>>2]|0;
       $177 = (((($176) + (($165*84)|0)|0)) + 68|0);
       $178 = HEAP32[$177>>2]|0;
       $179 = (($178) + 1)|0;
       HEAP32[$177>>2] = $179;
      }
      $180 = HEAP8[$160>>0]|0;
      $181 = ($180<<24>>24)==(45);
      if ($181) {
       $182 = ((($code183$ph260)) + 2|0);
       $$pre$i32 = HEAP8[$182>>0]|0;
       $184 = $$pre$i32;$code198 = $182;$neg$0$ph$i33 = 1;
      } else {
       $184 = $180;$code198 = $160;$neg$0$ph$i33 = 0;
      }
      $183 = $184 << 24 >> 24;
      $isdigittmp1$i34 = (($183) + -48)|0;
      $isdigit2$i35 = ($isdigittmp1$i34>>>0)<(10);
      if ($isdigit2$i35) {
       $187 = $code198;$189 = $184;$val$03$i37 = 0;
       while(1) {
        $185 = ($val$03$i37*10)|0;
        $186 = ((($187)) + 1|0);
        $188 = $189 << 24 >> 24;
        $190 = (($185) + -48)|0;
        $191 = (($190) + ($188))|0;
        $192 = HEAP8[$186>>0]|0;
        $193 = $192 << 24 >> 24;
        $isdigittmp$i38 = (($193) + -48)|0;
        $isdigit$i39 = ($isdigittmp$i38>>>0)<(10);
        if ($isdigit$i39) {
         $187 = $186;$189 = $192;$val$03$i37 = $191;
        } else {
         $code197 = $186;$val$0$lcssa$i41 = $191;
         break;
        }
       }
      } else {
       $code197 = $code198;$val$0$lcssa$i41 = 0;
      }
      $194 = ($neg$0$ph$i33<<24>>24)==(0);
      $195 = (0 - ($val$0$lcssa$i41))|0;
      $$0$i42 = $194 ? $val$0$lcssa$i41 : $195;
      $196 = ($$0$i42|0)>(65535);
      if ($196) {
       label = 59;
       break L4;
      }
      $sext2 = $$0$i42 << 24;
      $byte$i44 = $$0$i42&255;
      $198 = HEAP32[1436>>2]|0;
      $199 = ($198|0)==(0);
      if ($199) {
       $200 = HEAP32[(1336)>>2]|0;
       $201 = $200 >> 10;
       $202 = (($200) + 1)|0;
       HEAP32[(1336)>>2] = $202;
       $203 = (($200|0) % 1024)&-1;
       $204 = HEAP32[1332>>2]|0;
       $205 = ($201|0)>(15);
       if ($205) {
        _yyerror(11426,$vararg_buffer11);
       } else {
        $206 = HEAP32[1364>>2]|0;
        $207 = ((((($206) + (($204*84)|0)|0)) + 4|0) + ($201<<2)|0);
        $208 = HEAP32[$207>>2]|0;
        $209 = ($208|0)==(0|0);
        if ($209) {
         $210 = (_bc_malloc(1024)|0);
         $211 = HEAP32[1364>>2]|0;
         $212 = ((((($211) + (($204*84)|0)|0)) + 4|0) + ($201<<2)|0);
         HEAP32[$212>>2] = $210;
         $$pre$i45 = HEAP32[1364>>2]|0;
         $$phi$trans$insert$i46 = ((((($$pre$i45) + (($204*84)|0)|0)) + 4|0) + ($201<<2)|0);
         $$pre1$i47 = HEAP32[$$phi$trans$insert$i46>>2]|0;
         $214 = $$pre1$i47;
        } else {
         $214 = $208;
        }
        $213 = (($214) + ($203)|0);
        HEAP8[$213>>0] = $byte$i44;
        $215 = HEAP32[1364>>2]|0;
        $216 = (((($215) + (($204*84)|0)|0)) + 68|0);
        $217 = HEAP32[$216>>2]|0;
        $218 = (($217) + 1)|0;
        HEAP32[$216>>2] = $218;
       }
       $$pr201 = HEAP32[1436>>2]|0;
       $219 = $sext2 >> 31;
       $byte$i49 = $219&255;
       $220 = ($$pr201|0)==(0);
       if ($220) {
        $221 = HEAP32[(1336)>>2]|0;
        $222 = $221 >> 10;
        $223 = (($221) + 1)|0;
        HEAP32[(1336)>>2] = $223;
        $224 = (($221|0) % 1024)&-1;
        $225 = HEAP32[1332>>2]|0;
        $226 = ($222|0)>(15);
        if ($226) {
         _yyerror(11426,$vararg_buffer13);
         $664 = $321;$665 = $324;$code200 = $code197;
         break L43;
        }
        $227 = HEAP32[1364>>2]|0;
        $228 = ((((($227) + (($225*84)|0)|0)) + 4|0) + ($222<<2)|0);
        $229 = HEAP32[$228>>2]|0;
        $230 = ($229|0)==(0|0);
        if ($230) {
         $231 = (_bc_malloc(1024)|0);
         $232 = HEAP32[1364>>2]|0;
         $233 = ((((($232) + (($225*84)|0)|0)) + 4|0) + ($222<<2)|0);
         HEAP32[$233>>2] = $231;
         $$pre$i50 = HEAP32[1364>>2]|0;
         $$phi$trans$insert$i51 = ((((($$pre$i50) + (($225*84)|0)|0)) + 4|0) + ($222<<2)|0);
         $$pre1$i52 = HEAP32[$$phi$trans$insert$i51>>2]|0;
         $235 = $$pre1$i52;
        } else {
         $235 = $229;
        }
        $234 = (($235) + ($224)|0);
        HEAP8[$234>>0] = $byte$i49;
        $236 = HEAP32[1364>>2]|0;
        $237 = (((($236) + (($225*84)|0)|0)) + 68|0);
        $238 = HEAP32[$237>>2]|0;
        $239 = (($238) + 1)|0;
        HEAP32[$237>>2] = $239;
        $664 = $321;$665 = $324;$code200 = $code197;
       } else {
        $664 = $321;$665 = $324;$code200 = $code197;
       }
      } else {
       $664 = $321;$665 = $324;$code200 = $code197;
      }
      break;
     }
     case 70:  {
      $240 = ((($code183$ph260)) + 1|0);
      $241 = HEAP8[$240>>0]|0;
      $242 = ($241<<24>>24)==(45);
      if ($242) {
       $243 = ((($code183$ph260)) + 2|0);
       $$pre$i54 = HEAP8[$243>>0]|0;
       $245 = $$pre$i54;$667 = $243;$neg$0$ph$i55 = 1;
      } else {
       $245 = $241;$667 = $240;$neg$0$ph$i55 = 0;
      }
      $244 = $245 << 24 >> 24;
      $isdigittmp1$i56 = (($244) + -48)|0;
      $isdigit2$i57 = ($isdigittmp1$i56>>>0)<(10);
      if ($isdigit2$i57) {
       $248 = $667;$250 = $245;$val$03$i59 = 0;
       while(1) {
        $246 = ($val$03$i59*10)|0;
        $247 = ((($248)) + 1|0);
        $249 = $250 << 24 >> 24;
        $251 = (($246) + -48)|0;
        $252 = (($251) + ($249))|0;
        $253 = HEAP8[$247>>0]|0;
        $254 = $253 << 24 >> 24;
        $isdigittmp$i60 = (($254) + -48)|0;
        $isdigit$i61 = ($isdigittmp$i60>>>0)<(10);
        if ($isdigit$i61) {
         $248 = $247;$250 = $253;$val$03$i59 = $252;
        } else {
         $code186 = $247;$val$0$lcssa$i63 = $252;
         break;
        }
       }
      } else {
       $code186 = $667;$val$0$lcssa$i63 = 0;
      }
      $255 = ($neg$0$ph$i55<<24>>24)==(0);
      $256 = (0 - ($val$0$lcssa$i63))|0;
      $$0$i64 = $255 ? $val$0$lcssa$i63 : $256;
      _clear_func($$0$i64);
      $257 = ((($code186)) + 1|0);
      $258 = HEAP8[$code186>>0]|0;
      $259 = ($258<<24>>24)==(46);
      L109: do {
       if ($259) {
        $code191 = $257;
       } else {
        $261 = $257;$code187255 = $code186;
        L110: while(1) {
         $260 = HEAP8[$261>>0]|0;
         switch ($260<<24>>24) {
         case 46:  {
          $code187255$lcssa = $code187255;
          break L110;
          break;
         }
         case 45:  {
          $263 = ((($code187255)) + 2|0);
          $$pre$i66 = HEAP8[$263>>0]|0;
          $265 = $$pre$i66;$code185 = $263;$neg$0$ph$i67 = 1;
          break;
         }
         default: {
          $265 = $260;$code185 = $261;$neg$0$ph$i67 = 0;
         }
         }
         $264 = $265 << 24 >> 24;
         $isdigittmp1$i68 = (($264) + -48)|0;
         $isdigit2$i69 = ($isdigittmp1$i68>>>0)<(10);
         if ($isdigit2$i69) {
          $268 = $code185;$270 = $265;$val$03$i71 = 0;
          while(1) {
           $266 = ($val$03$i71*10)|0;
           $267 = ((($268)) + 1|0);
           $269 = $270 << 24 >> 24;
           $271 = (($266) + -48)|0;
           $272 = (($271) + ($269))|0;
           $273 = HEAP8[$267>>0]|0;
           $274 = $273 << 24 >> 24;
           $isdigittmp$i72 = (($274) + -48)|0;
           $isdigit$i73 = ($isdigittmp$i72>>>0)<(10);
           if ($isdigit$i73) {
            $268 = $267;$270 = $273;$val$03$i71 = $272;
           } else {
            $code184 = $267;$val$0$lcssa$i75 = $272;
            break;
           }
          }
         } else {
          $code184 = $code185;$val$0$lcssa$i75 = 0;
         }
         $275 = ($neg$0$ph$i67<<24>>24)==(0);
         $276 = (0 - ($val$0$lcssa$i75))|0;
         $$0$i76 = $275 ? $val$0$lcssa$i75 : $276;
         $277 = HEAP32[1364>>2]|0;
         $278 = (((($277) + (($$0$i64*84)|0)|0)) + 76|0);
         $279 = HEAP32[$278>>2]|0;
         $280 = (_nextarg($279,$$0$i76)|0);
         $281 = HEAP32[1364>>2]|0;
         $282 = (((($281) + (($$0$i64*84)|0)|0)) + 76|0);
         HEAP32[$282>>2] = $280;
         $283 = ((($code184)) + 1|0);
         $284 = HEAP8[$code184>>0]|0;
         $285 = ($284<<24>>24)==(46);
         if ($285) {
          $code191 = $283;
          break L109;
         } else {
          $261 = $283;$code187255 = $code184;
         }
        }
        $262 = ((($code187255$lcssa)) + 2|0);
        $code191 = $262;
       }
      } while(0);
      L120: while(1) {
       $286 = HEAP8[$code191>>0]|0;
       switch ($286<<24>>24) {
       case 91:  {
        $code191$lcssa = $code191;
        break L120;
        break;
       }
       case 44:  {
        $287 = ((($code191)) + 1|0);
        $$pre308 = HEAP8[$287>>0]|0;
        $288 = $$pre308;$code190 = $287;
        break;
       }
       default: {
        $288 = $286;$code190 = $code191;
       }
       }
       $289 = ($288<<24>>24)==(45);
       if ($289) {
        $290 = ((($code190)) + 1|0);
        $$pre$i78 = HEAP8[$290>>0]|0;
        $292 = $$pre$i78;$code189 = $290;$neg$0$ph$i79 = 1;
       } else {
        $292 = $288;$code189 = $code190;$neg$0$ph$i79 = 0;
       }
       $291 = $292 << 24 >> 24;
       $isdigittmp1$i80 = (($291) + -48)|0;
       $isdigit2$i81 = ($isdigittmp1$i80>>>0)<(10);
       if ($isdigit2$i81) {
        $295 = $code189;$297 = $292;$val$03$i83 = 0;
        while(1) {
         $293 = ($val$03$i83*10)|0;
         $294 = ((($295)) + 1|0);
         $296 = $297 << 24 >> 24;
         $298 = (($293) + -48)|0;
         $299 = (($298) + ($296))|0;
         $300 = HEAP8[$294>>0]|0;
         $301 = $300 << 24 >> 24;
         $isdigittmp$i84 = (($301) + -48)|0;
         $isdigit$i85 = ($isdigittmp$i84>>>0)<(10);
         if ($isdigit$i85) {
          $295 = $294;$297 = $300;$val$03$i83 = $299;
         } else {
          $code188 = $294;$val$0$lcssa$i87 = $299;
          break;
         }
        }
       } else {
        $code188 = $code189;$val$0$lcssa$i87 = 0;
       }
       $302 = ($neg$0$ph$i79<<24>>24)==(0);
       $303 = (0 - ($val$0$lcssa$i87))|0;
       $$0$i88 = $302 ? $val$0$lcssa$i87 : $303;
       $304 = HEAP32[1364>>2]|0;
       $305 = (((($304) + (($$0$i64*84)|0)|0)) + 80|0);
       $306 = HEAP32[$305>>2]|0;
       $307 = (_nextarg($306,$$0$i88)|0);
       $308 = HEAP32[1364>>2]|0;
       $309 = (((($308) + (($$0$i64*84)|0)|0)) + 80|0);
       HEAP32[$309>>2] = $307;
       $code191 = $code188;
      }
      $310 = 1332;
      $311 = $310;
      $312 = HEAP32[$311>>2]|0;
      $313 = (($310) + 4)|0;
      $314 = $313;
      $315 = HEAP32[$314>>2]|0;
      HEAP32[1332>>2] = $$0$i64;
      HEAP32[(1336)>>2] = 0;
      $664 = $312;$665 = $315;$code200 = $code191$lcssa;
      break;
     }
     case 93:  {
      $316 = HEAP32[1332>>2]|0;
      $317 = HEAP32[1364>>2]|0;
      $318 = (($317) + (($316*84)|0)|0);
      HEAP8[$318>>0] = 1;
      $319 = 1332;
      $320 = $319;
      HEAP32[$320>>2] = $321;
      $322 = (($319) + 4)|0;
      $323 = $322;
      HEAP32[$323>>2] = $324;
      $664 = $321;$665 = $324;$code200 = $code183$ph260;
      break;
     }
     case 67:  {
      $325 = ((($code183$ph260)) + 1|0);
      $326 = HEAP32[(1336)>>2]|0;
      $327 = $326 >> 10;
      $328 = (($326) + 1)|0;
      HEAP32[(1336)>>2] = $328;
      $329 = (($326|0) % 1024)&-1;
      $330 = HEAP32[1332>>2]|0;
      $331 = ($327|0)>(15);
      if ($331) {
       _yyerror(11426,$vararg_buffer15);
      } else {
       $332 = HEAP32[1364>>2]|0;
       $333 = ((((($332) + (($330*84)|0)|0)) + 4|0) + ($327<<2)|0);
       $334 = HEAP32[$333>>2]|0;
       $335 = ($334|0)==(0|0);
       if ($335) {
        $336 = (_bc_malloc(1024)|0);
        $337 = HEAP32[1364>>2]|0;
        $338 = ((((($337) + (($330*84)|0)|0)) + 4|0) + ($327<<2)|0);
        HEAP32[$338>>2] = $336;
        $$pre$i91 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i92 = ((((($$pre$i91) + (($330*84)|0)|0)) + 4|0) + ($327<<2)|0);
        $$pre1$i93 = HEAP32[$$phi$trans$insert$i92>>2]|0;
        $340 = $$pre1$i93;
       } else {
        $340 = $334;
       }
       $339 = (($340) + ($329)|0);
       HEAP8[$339>>0] = $5;
       $341 = HEAP32[1364>>2]|0;
       $342 = (((($341) + (($330*84)|0)|0)) + 68|0);
       $343 = HEAP32[$342>>2]|0;
       $344 = (($343) + 1)|0;
       HEAP32[$342>>2] = $344;
      }
      $345 = HEAP8[$325>>0]|0;
      $346 = ($345<<24>>24)==(45);
      if ($346) {
       $347 = ((($code183$ph260)) + 2|0);
       $$pre$i95 = HEAP8[$347>>0]|0;
       $349 = $$pre$i95;$code193 = $347;$neg$0$ph$i96 = 1;
      } else {
       $349 = $345;$code193 = $325;$neg$0$ph$i96 = 0;
      }
      $348 = $349 << 24 >> 24;
      $isdigittmp1$i97 = (($348) + -48)|0;
      $isdigit2$i98 = ($isdigittmp1$i97>>>0)<(10);
      if ($isdigit2$i98) {
       $352 = $code193;$354 = $349;$val$03$i100 = 0;
       while(1) {
        $350 = ($val$03$i100*10)|0;
        $351 = ((($352)) + 1|0);
        $353 = $354 << 24 >> 24;
        $355 = (($350) + -48)|0;
        $356 = (($355) + ($353))|0;
        $357 = HEAP8[$351>>0]|0;
        $358 = $357 << 24 >> 24;
        $isdigittmp$i101 = (($358) + -48)|0;
        $isdigit$i102 = ($isdigittmp$i101>>>0)<(10);
        if ($isdigit$i102) {
         $352 = $351;$354 = $357;$val$03$i100 = $356;
        } else {
         $code192 = $351;$val$0$lcssa$i104 = $356;
         break;
        }
       }
      } else {
       $code192 = $code193;$val$0$lcssa$i104 = 0;
      }
      $359 = ($neg$0$ph$i96<<24>>24)==(0);
      $360 = (0 - ($val$0$lcssa$i104))|0;
      $$0$i105 = $359 ? $val$0$lcssa$i104 : $360;
      $361 = ($$0$i105|0)<(128);
      do {
       if ($361) {
        $byte$i107 = $$0$i105&255;
        $362 = HEAP32[1436>>2]|0;
        $363 = ($362|0)==(0);
        if ($363) {
         $364 = HEAP32[(1336)>>2]|0;
         $365 = $364 >> 10;
         $366 = (($364) + 1)|0;
         HEAP32[(1336)>>2] = $366;
         $367 = (($364|0) % 1024)&-1;
         $368 = HEAP32[1332>>2]|0;
         $369 = ($365|0)>(15);
         if ($369) {
          _yyerror(11426,$vararg_buffer17);
          break;
         }
         $370 = HEAP32[1364>>2]|0;
         $371 = ((((($370) + (($368*84)|0)|0)) + 4|0) + ($365<<2)|0);
         $372 = HEAP32[$371>>2]|0;
         $373 = ($372|0)==(0|0);
         if ($373) {
          $374 = (_bc_malloc(1024)|0);
          $375 = HEAP32[1364>>2]|0;
          $376 = ((((($375) + (($368*84)|0)|0)) + 4|0) + ($365<<2)|0);
          HEAP32[$376>>2] = $374;
          $$pre$i108 = HEAP32[1364>>2]|0;
          $$phi$trans$insert$i109 = ((((($$pre$i108) + (($368*84)|0)|0)) + 4|0) + ($365<<2)|0);
          $$pre1$i110 = HEAP32[$$phi$trans$insert$i109>>2]|0;
          $378 = $$pre1$i110;
         } else {
          $378 = $372;
         }
         $377 = (($378) + ($367)|0);
         HEAP8[$377>>0] = $byte$i107;
         $379 = HEAP32[1364>>2]|0;
         $380 = (((($379) + (($368*84)|0)|0)) + 68|0);
         $381 = HEAP32[$380>>2]|0;
         $382 = (($381) + 1)|0;
         HEAP32[$380>>2] = $382;
        }
       } else {
        $383 = $$0$i105 >>> 8;
        $384 = $383 | 128;
        $byte$i112 = $384&255;
        $385 = HEAP32[1436>>2]|0;
        $386 = ($385|0)==(0);
        if ($386) {
         $387 = HEAP32[(1336)>>2]|0;
         $388 = $387 >> 10;
         $389 = (($387) + 1)|0;
         HEAP32[(1336)>>2] = $389;
         $390 = (($387|0) % 1024)&-1;
         $391 = HEAP32[1332>>2]|0;
         $392 = ($388|0)>(15);
         if ($392) {
          _yyerror(11426,$vararg_buffer19);
         } else {
          $393 = HEAP32[1364>>2]|0;
          $394 = ((((($393) + (($391*84)|0)|0)) + 4|0) + ($388<<2)|0);
          $395 = HEAP32[$394>>2]|0;
          $396 = ($395|0)==(0|0);
          if ($396) {
           $397 = (_bc_malloc(1024)|0);
           $398 = HEAP32[1364>>2]|0;
           $399 = ((((($398) + (($391*84)|0)|0)) + 4|0) + ($388<<2)|0);
           HEAP32[$399>>2] = $397;
           $$pre$i113 = HEAP32[1364>>2]|0;
           $$phi$trans$insert$i114 = ((((($$pre$i113) + (($391*84)|0)|0)) + 4|0) + ($388<<2)|0);
           $$pre1$i115 = HEAP32[$$phi$trans$insert$i114>>2]|0;
           $401 = $$pre1$i115;
          } else {
           $401 = $395;
          }
          $400 = (($401) + ($390)|0);
          HEAP8[$400>>0] = $byte$i112;
          $402 = HEAP32[1364>>2]|0;
          $403 = (((($402) + (($391*84)|0)|0)) + 68|0);
          $404 = HEAP32[$403>>2]|0;
          $405 = (($404) + 1)|0;
          HEAP32[$403>>2] = $405;
         }
         $$pr203 = HEAP32[1436>>2]|0;
         $byte$i117 = $$0$i105&255;
         $406 = ($$pr203|0)==(0);
         if ($406) {
          $407 = HEAP32[(1336)>>2]|0;
          $408 = $407 >> 10;
          $409 = (($407) + 1)|0;
          HEAP32[(1336)>>2] = $409;
          $410 = (($407|0) % 1024)&-1;
          $411 = HEAP32[1332>>2]|0;
          $412 = ($408|0)>(15);
          if ($412) {
           _yyerror(11426,$vararg_buffer21);
           break;
          }
          $413 = HEAP32[1364>>2]|0;
          $414 = ((((($413) + (($411*84)|0)|0)) + 4|0) + ($408<<2)|0);
          $415 = HEAP32[$414>>2]|0;
          $416 = ($415|0)==(0|0);
          if ($416) {
           $417 = (_bc_malloc(1024)|0);
           $418 = HEAP32[1364>>2]|0;
           $419 = ((((($418) + (($411*84)|0)|0)) + 4|0) + ($408<<2)|0);
           HEAP32[$419>>2] = $417;
           $$pre$i118 = HEAP32[1364>>2]|0;
           $$phi$trans$insert$i119 = ((((($$pre$i118) + (($411*84)|0)|0)) + 4|0) + ($408<<2)|0);
           $$pre1$i120 = HEAP32[$$phi$trans$insert$i119>>2]|0;
           $421 = $$pre1$i120;
          } else {
           $421 = $415;
          }
          $420 = (($421) + ($410)|0);
          HEAP8[$420>>0] = $byte$i117;
          $422 = HEAP32[1364>>2]|0;
          $423 = (((($422) + (($411*84)|0)|0)) + 68|0);
          $424 = HEAP32[$423>>2]|0;
          $425 = (($424) + 1)|0;
          HEAP32[$423>>2] = $425;
         }
        }
       }
      } while(0);
      $426 = HEAP8[$code192>>0]|0;
      $427 = ($426<<24>>24)==(44);
      $428 = ((($code192)) + 1|0);
      $$code192 = $427 ? $428 : $code192;
      $429 = HEAP8[$$code192>>0]|0;
      $430 = ($429<<24>>24)==(58);
      if ($430) {
       $code194$lcssa = $$code192;
      } else {
       $451 = $429;$code194253 = $$code192;
       while(1) {
        $431 = ((($code194253)) + 1|0);
        $432 = HEAP32[1436>>2]|0;
        $433 = ($432|0)==(0);
        do {
         if ($433) {
          $436 = HEAP32[(1336)>>2]|0;
          $437 = $436 >> 10;
          $438 = (($436) + 1)|0;
          HEAP32[(1336)>>2] = $438;
          $439 = (($436|0) % 1024)&-1;
          $440 = HEAP32[1332>>2]|0;
          $441 = ($437|0)>(15);
          if ($441) {
           _yyerror(11426,$vararg_buffer23);
           break;
          }
          $442 = HEAP32[1364>>2]|0;
          $443 = ((((($442) + (($440*84)|0)|0)) + 4|0) + ($437<<2)|0);
          $444 = HEAP32[$443>>2]|0;
          $445 = ($444|0)==(0|0);
          if ($445) {
           $446 = (_bc_malloc(1024)|0);
           $447 = HEAP32[1364>>2]|0;
           $448 = ((((($447) + (($440*84)|0)|0)) + 4|0) + ($437<<2)|0);
           HEAP32[$448>>2] = $446;
           $$pre$i123 = HEAP32[1364>>2]|0;
           $$phi$trans$insert$i124 = ((((($$pre$i123) + (($440*84)|0)|0)) + 4|0) + ($437<<2)|0);
           $$pre1$i125 = HEAP32[$$phi$trans$insert$i124>>2]|0;
           $450 = $$pre1$i125;
          } else {
           $450 = $444;
          }
          $449 = (($450) + ($439)|0);
          HEAP8[$449>>0] = $451;
          $452 = HEAP32[1364>>2]|0;
          $453 = (((($452) + (($440*84)|0)|0)) + 68|0);
          $454 = HEAP32[$453>>2]|0;
          $455 = (($454) + 1)|0;
          HEAP32[$453>>2] = $455;
         }
        } while(0);
        $434 = HEAP8[$431>>0]|0;
        $435 = ($434<<24>>24)==(58);
        if ($435) {
         $code194$lcssa = $431;
         break;
        } else {
         $451 = $434;$code194253 = $431;
        }
       }
      }
      $456 = HEAP32[1436>>2]|0;
      $457 = ($456|0)==(0);
      if ($457) {
       $458 = HEAP32[(1336)>>2]|0;
       $459 = $458 >> 10;
       $460 = (($458) + 1)|0;
       HEAP32[(1336)>>2] = $460;
       $461 = (($458|0) % 1024)&-1;
       $462 = HEAP32[1332>>2]|0;
       $463 = ($459|0)>(15);
       if ($463) {
        _yyerror(11426,$vararg_buffer25);
        $664 = $321;$665 = $324;$code200 = $code194$lcssa;
        break L43;
       }
       $464 = HEAP32[1364>>2]|0;
       $465 = ((((($464) + (($462*84)|0)|0)) + 4|0) + ($459<<2)|0);
       $466 = HEAP32[$465>>2]|0;
       $467 = ($466|0)==(0|0);
       if ($467) {
        $468 = (_bc_malloc(1024)|0);
        $469 = HEAP32[1364>>2]|0;
        $470 = ((((($469) + (($462*84)|0)|0)) + 4|0) + ($459<<2)|0);
        HEAP32[$470>>2] = $468;
        $$pre$i127 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i128 = ((((($$pre$i127) + (($462*84)|0)|0)) + 4|0) + ($459<<2)|0);
        $$pre1$i129 = HEAP32[$$phi$trans$insert$i128>>2]|0;
        $472 = $$pre1$i129;
       } else {
        $472 = $466;
       }
       $471 = (($472) + ($461)|0);
       HEAP8[$471>>0] = 58;
       $473 = HEAP32[1364>>2]|0;
       $474 = (((($473) + (($462*84)|0)|0)) + 68|0);
       $475 = HEAP32[$474>>2]|0;
       $476 = (($475) + 1)|0;
       HEAP32[$474>>2] = $476;
       $664 = $321;$665 = $324;$code200 = $code194$lcssa;
      } else {
       $664 = $321;$665 = $324;$code200 = $code194$lcssa;
      }
      break;
     }
     case 99:  {
      $477 = ((($code183$ph260)) + 1|0);
      $478 = HEAP32[(1336)>>2]|0;
      $479 = $478 >> 10;
      $480 = (($478) + 1)|0;
      HEAP32[(1336)>>2] = $480;
      $481 = (($478|0) % 1024)&-1;
      $482 = HEAP32[1332>>2]|0;
      $483 = ($479|0)>(15);
      if ($483) {
       _yyerror(11426,$vararg_buffer27);
      } else {
       $484 = HEAP32[1364>>2]|0;
       $485 = ((((($484) + (($482*84)|0)|0)) + 4|0) + ($479<<2)|0);
       $486 = HEAP32[$485>>2]|0;
       $487 = ($486|0)==(0|0);
       if ($487) {
        $488 = (_bc_malloc(1024)|0);
        $489 = HEAP32[1364>>2]|0;
        $490 = ((((($489) + (($482*84)|0)|0)) + 4|0) + ($479<<2)|0);
        HEAP32[$490>>2] = $488;
        $$pre$i132 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i133 = ((((($$pre$i132) + (($482*84)|0)|0)) + 4|0) + ($479<<2)|0);
        $$pre1$i134 = HEAP32[$$phi$trans$insert$i133>>2]|0;
        $492 = $$pre1$i134;
       } else {
        $492 = $486;
       }
       $491 = (($492) + ($481)|0);
       HEAP8[$491>>0] = $5;
       $493 = HEAP32[1364>>2]|0;
       $494 = (((($493) + (($482*84)|0)|0)) + 68|0);
       $495 = HEAP32[$494>>2]|0;
       $496 = (($495) + 1)|0;
       HEAP32[$494>>2] = $496;
      }
      $497 = HEAP8[$477>>0]|0;
      $498 = HEAP32[1436>>2]|0;
      $499 = ($498|0)==(0);
      if ($499) {
       $500 = HEAP32[(1336)>>2]|0;
       $501 = $500 >> 10;
       $502 = (($500) + 1)|0;
       HEAP32[(1336)>>2] = $502;
       $503 = (($500|0) % 1024)&-1;
       $504 = HEAP32[1332>>2]|0;
       $505 = ($501|0)>(15);
       if ($505) {
        _yyerror(11426,$vararg_buffer29);
        $664 = $321;$665 = $324;$code200 = $477;
        break L43;
       }
       $506 = HEAP32[1364>>2]|0;
       $507 = ((((($506) + (($504*84)|0)|0)) + 4|0) + ($501<<2)|0);
       $508 = HEAP32[$507>>2]|0;
       $509 = ($508|0)==(0|0);
       if ($509) {
        $510 = (_bc_malloc(1024)|0);
        $511 = HEAP32[1364>>2]|0;
        $512 = ((((($511) + (($504*84)|0)|0)) + 4|0) + ($501<<2)|0);
        HEAP32[$512>>2] = $510;
        $$pre$i137 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i138 = ((((($$pre$i137) + (($504*84)|0)|0)) + 4|0) + ($501<<2)|0);
        $$pre1$i139 = HEAP32[$$phi$trans$insert$i138>>2]|0;
        $514 = $$pre1$i139;
       } else {
        $514 = $508;
       }
       $513 = (($514) + ($503)|0);
       HEAP8[$513>>0] = $497;
       $515 = HEAP32[1364>>2]|0;
       $516 = (((($515) + (($504*84)|0)|0)) + 68|0);
       $517 = HEAP32[$516>>2]|0;
       $518 = (($517) + 1)|0;
       HEAP32[$516>>2] = $518;
       $664 = $321;$665 = $324;$code200 = $477;
      } else {
       $664 = $321;$665 = $324;$code200 = $477;
      }
      break;
     }
     case 75:  {
      $519 = HEAP32[(1336)>>2]|0;
      $520 = $519 >> 10;
      $521 = (($519) + 1)|0;
      HEAP32[(1336)>>2] = $521;
      $522 = (($519|0) % 1024)&-1;
      $523 = HEAP32[1332>>2]|0;
      $524 = ($520|0)>(15);
      if ($524) {
       _yyerror(11426,$vararg_buffer31);
      } else {
       $525 = HEAP32[1364>>2]|0;
       $526 = ((((($525) + (($523*84)|0)|0)) + 4|0) + ($520<<2)|0);
       $527 = HEAP32[$526>>2]|0;
       $528 = ($527|0)==(0|0);
       if ($528) {
        $529 = (_bc_malloc(1024)|0);
        $530 = HEAP32[1364>>2]|0;
        $531 = ((((($530) + (($523*84)|0)|0)) + 4|0) + ($520<<2)|0);
        HEAP32[$531>>2] = $529;
        $$pre$i142 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i143 = ((((($$pre$i142) + (($523*84)|0)|0)) + 4|0) + ($520<<2)|0);
        $$pre1$i144 = HEAP32[$$phi$trans$insert$i143>>2]|0;
        $533 = $$pre1$i144;
       } else {
        $533 = $527;
       }
       $532 = (($533) + ($522)|0);
       HEAP8[$532>>0] = $5;
       $534 = HEAP32[1364>>2]|0;
       $535 = (((($534) + (($523*84)|0)|0)) + 68|0);
       $536 = HEAP32[$535>>2]|0;
       $537 = (($536) + 1)|0;
       HEAP32[$535>>2] = $537;
      }
      HEAP8[11425>>0] = 1;
      $664 = $321;$665 = $324;$code200 = $code183$ph260;
      break;
     }
     case 83: case 76: case 77: case 65: case 115: case 108: case 105: case 100:  {
      $538 = ((($code183$ph260)) + 1|0);
      $539 = HEAP32[(1336)>>2]|0;
      $540 = $539 >> 10;
      $541 = (($539) + 1)|0;
      HEAP32[(1336)>>2] = $541;
      $542 = (($539|0) % 1024)&-1;
      $543 = HEAP32[1332>>2]|0;
      $544 = ($540|0)>(15);
      if ($544) {
       _yyerror(11426,$vararg_buffer33);
      } else {
       $545 = HEAP32[1364>>2]|0;
       $546 = ((((($545) + (($543*84)|0)|0)) + 4|0) + ($540<<2)|0);
       $547 = HEAP32[$546>>2]|0;
       $548 = ($547|0)==(0|0);
       if ($548) {
        $549 = (_bc_malloc(1024)|0);
        $550 = HEAP32[1364>>2]|0;
        $551 = ((((($550) + (($543*84)|0)|0)) + 4|0) + ($540<<2)|0);
        HEAP32[$551>>2] = $549;
        $$pre$i147 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i148 = ((((($$pre$i147) + (($543*84)|0)|0)) + 4|0) + ($540<<2)|0);
        $$pre1$i149 = HEAP32[$$phi$trans$insert$i148>>2]|0;
        $553 = $$pre1$i149;
       } else {
        $553 = $547;
       }
       $552 = (($553) + ($542)|0);
       HEAP8[$552>>0] = $5;
       $554 = HEAP32[1364>>2]|0;
       $555 = (((($554) + (($543*84)|0)|0)) + 68|0);
       $556 = HEAP32[$555>>2]|0;
       $557 = (($556) + 1)|0;
       HEAP32[$555>>2] = $557;
      }
      $558 = HEAP8[$538>>0]|0;
      $559 = ($558<<24>>24)==(45);
      if ($559) {
       $560 = ((($code183$ph260)) + 2|0);
       $$pre$i151 = HEAP8[$560>>0]|0;
       $562 = $$pre$i151;$code196 = $560;$neg$0$ph$i152 = 1;
      } else {
       $562 = $558;$code196 = $538;$neg$0$ph$i152 = 0;
      }
      $561 = $562 << 24 >> 24;
      $isdigittmp1$i153 = (($561) + -48)|0;
      $isdigit2$i154 = ($isdigittmp1$i153>>>0)<(10);
      if ($isdigit2$i154) {
       $565 = $code196;$567 = $562;$val$03$i156 = 0;
       while(1) {
        $563 = ($val$03$i156*10)|0;
        $564 = ((($565)) + 1|0);
        $566 = $567 << 24 >> 24;
        $568 = (($563) + -48)|0;
        $569 = (($568) + ($566))|0;
        $570 = HEAP8[$564>>0]|0;
        $571 = $570 << 24 >> 24;
        $isdigittmp$i157 = (($571) + -48)|0;
        $isdigit$i158 = ($isdigittmp$i157>>>0)<(10);
        if ($isdigit$i158) {
         $565 = $564;$567 = $570;$val$03$i156 = $569;
        } else {
         $code195 = $564;$val$0$lcssa$i160 = $569;
         break;
        }
       }
      } else {
       $code195 = $code196;$val$0$lcssa$i160 = 0;
      }
      $572 = ($neg$0$ph$i152<<24>>24)==(0);
      $573 = (0 - ($val$0$lcssa$i160))|0;
      $$0$i161 = $572 ? $val$0$lcssa$i160 : $573;
      $574 = ($$0$i161|0)<(128);
      if ($574) {
       $byte$i163 = $$0$i161&255;
       $575 = HEAP32[1436>>2]|0;
       $576 = ($575|0)==(0);
       if (!($576)) {
        $664 = $321;$665 = $324;$code200 = $code195;
        break L43;
       }
       $577 = HEAP32[(1336)>>2]|0;
       $578 = $577 >> 10;
       $579 = (($577) + 1)|0;
       HEAP32[(1336)>>2] = $579;
       $580 = (($577|0) % 1024)&-1;
       $581 = HEAP32[1332>>2]|0;
       $582 = ($578|0)>(15);
       if ($582) {
        _yyerror(11426,$vararg_buffer35);
        $664 = $321;$665 = $324;$code200 = $code195;
        break L43;
       }
       $583 = HEAP32[1364>>2]|0;
       $584 = ((((($583) + (($581*84)|0)|0)) + 4|0) + ($578<<2)|0);
       $585 = HEAP32[$584>>2]|0;
       $586 = ($585|0)==(0|0);
       if ($586) {
        $587 = (_bc_malloc(1024)|0);
        $588 = HEAP32[1364>>2]|0;
        $589 = ((((($588) + (($581*84)|0)|0)) + 4|0) + ($578<<2)|0);
        HEAP32[$589>>2] = $587;
        $$pre$i164 = HEAP32[1364>>2]|0;
        $$phi$trans$insert$i165 = ((((($$pre$i164) + (($581*84)|0)|0)) + 4|0) + ($578<<2)|0);
        $$pre1$i166 = HEAP32[$$phi$trans$insert$i165>>2]|0;
        $591 = $$pre1$i166;
       } else {
        $591 = $585;
       }
       $590 = (($591) + ($580)|0);
       HEAP8[$590>>0] = $byte$i163;
       $592 = HEAP32[1364>>2]|0;
       $593 = (((($592) + (($581*84)|0)|0)) + 68|0);
       $594 = HEAP32[$593>>2]|0;
       $595 = (($594) + 1)|0;
       HEAP32[$593>>2] = $595;
       $664 = $321;$665 = $324;$code200 = $code195;
       break L43;
      }
      $596 = $$0$i161 >>> 8;
      $597 = $596 | 128;
      $byte$i168 = $597&255;
      $598 = HEAP32[1436>>2]|0;
      $599 = ($598|0)==(0);
      if ($599) {
       $600 = HEAP32[(1336)>>2]|0;
       $601 = $600 >> 10;
       $602 = (($600) + 1)|0;
       HEAP32[(1336)>>2] = $602;
       $603 = (($600|0) % 1024)&-1;
       $604 = HEAP32[1332>>2]|0;
       $605 = ($601|0)>(15);
       if ($605) {
        _yyerror(11426,$vararg_buffer37);
       } else {
        $606 = HEAP32[1364>>2]|0;
        $607 = ((((($606) + (($604*84)|0)|0)) + 4|0) + ($601<<2)|0);
        $608 = HEAP32[$607>>2]|0;
        $609 = ($608|0)==(0|0);
        if ($609) {
         $610 = (_bc_malloc(1024)|0);
         $611 = HEAP32[1364>>2]|0;
         $612 = ((((($611) + (($604*84)|0)|0)) + 4|0) + ($601<<2)|0);
         HEAP32[$612>>2] = $610;
         $$pre$i169 = HEAP32[1364>>2]|0;
         $$phi$trans$insert$i170 = ((((($$pre$i169) + (($604*84)|0)|0)) + 4|0) + ($601<<2)|0);
         $$pre1$i171 = HEAP32[$$phi$trans$insert$i170>>2]|0;
         $614 = $$pre1$i171;
        } else {
         $614 = $608;
        }
        $613 = (($614) + ($603)|0);
        HEAP8[$613>>0] = $byte$i168;
        $615 = HEAP32[1364>>2]|0;
        $616 = (((($615) + (($604*84)|0)|0)) + 68|0);
        $617 = HEAP32[$616>>2]|0;
        $618 = (($617) + 1)|0;
        HEAP32[$616>>2] = $618;
       }
       $$pr205 = HEAP32[1436>>2]|0;
       $byte$i173 = $$0$i161&255;
       $619 = ($$pr205|0)==(0);
       if ($619) {
        $620 = HEAP32[(1336)>>2]|0;
        $621 = $620 >> 10;
        $622 = (($620) + 1)|0;
        HEAP32[(1336)>>2] = $622;
        $623 = (($620|0) % 1024)&-1;
        $624 = HEAP32[1332>>2]|0;
        $625 = ($621|0)>(15);
        if ($625) {
         _yyerror(11426,$vararg_buffer39);
         $664 = $321;$665 = $324;$code200 = $code195;
         break L43;
        }
        $626 = HEAP32[1364>>2]|0;
        $627 = ((((($626) + (($624*84)|0)|0)) + 4|0) + ($621<<2)|0);
        $628 = HEAP32[$627>>2]|0;
        $629 = ($628|0)==(0|0);
        if ($629) {
         $630 = (_bc_malloc(1024)|0);
         $631 = HEAP32[1364>>2]|0;
         $632 = ((((($631) + (($624*84)|0)|0)) + 4|0) + ($621<<2)|0);
         HEAP32[$632>>2] = $630;
         $$pre$i174 = HEAP32[1364>>2]|0;
         $$phi$trans$insert$i175 = ((((($$pre$i174) + (($624*84)|0)|0)) + 4|0) + ($621<<2)|0);
         $$pre1$i176 = HEAP32[$$phi$trans$insert$i175>>2]|0;
         $634 = $$pre1$i176;
        } else {
         $634 = $628;
        }
        $633 = (($634) + ($623)|0);
        HEAP8[$633>>0] = $byte$i173;
        $635 = HEAP32[1364>>2]|0;
        $636 = (((($635) + (($624*84)|0)|0)) + 68|0);
        $637 = HEAP32[$636>>2]|0;
        $638 = (($637) + 1)|0;
        HEAP32[$636>>2] = $638;
        $664 = $321;$665 = $324;$code200 = $code195;
       } else {
        $664 = $321;$665 = $324;$code200 = $code195;
       }
      } else {
       $664 = $321;$665 = $324;$code200 = $code195;
      }
      break;
     }
     case 64:  {
      $639 = ((($code183$ph260)) + 1|0);
      $640 = HEAP8[$639>>0]|0;
      $641 = $640 << 24 >> 24;
      switch ($641|0) {
      case 105:  {
       _clear_func(0);
       HEAP32[1332>>2] = 0;
       HEAP32[(1336)>>2] = 0;
       HEAP8[11424>>0] = 0;
       HEAP8[11425>>0] = 0;
       $664 = $321;$665 = $324;$code200 = $639;
       break L43;
       break;
      }
      case 114:  {
       _execute();
       $664 = $321;$665 = $324;$code200 = $639;
       break L43;
       break;
      }
      default: {
       $664 = $321;$665 = $324;$code200 = $639;
       break L43;
      }
      }
      break;
     }
     case 10:  {
      $664 = $321;$665 = $324;$code200 = $code183$ph260;
      break;
     }
     default: {
      $642 = HEAP32[(1336)>>2]|0;
      $643 = $642 >> 10;
      $644 = (($642) + 1)|0;
      HEAP32[(1336)>>2] = $644;
      $645 = (($642|0) % 1024)&-1;
      $646 = HEAP32[1332>>2]|0;
      $647 = ($643|0)>(15);
      if ($647) {
       _yyerror(11426,$vararg_buffer41);
       $664 = $321;$665 = $324;$code200 = $code183$ph260;
       break L43;
      }
      $648 = HEAP32[1364>>2]|0;
      $649 = ((((($648) + (($646*84)|0)|0)) + 4|0) + ($643<<2)|0);
      $650 = HEAP32[$649>>2]|0;
      $651 = ($650|0)==(0|0);
      if ($651) {
       $652 = (_bc_malloc(1024)|0);
       $653 = HEAP32[1364>>2]|0;
       $654 = ((((($653) + (($646*84)|0)|0)) + 4|0) + ($643<<2)|0);
       HEAP32[$654>>2] = $652;
       $$pre$i179 = HEAP32[1364>>2]|0;
       $$phi$trans$insert$i180 = ((((($$pre$i179) + (($646*84)|0)|0)) + 4|0) + ($643<<2)|0);
       $$pre1$i181 = HEAP32[$$phi$trans$insert$i180>>2]|0;
       $656 = $$pre1$i181;
      } else {
       $656 = $650;
      }
      $655 = (($656) + ($645)|0);
      HEAP8[$655>>0] = $5;
      $657 = HEAP32[1364>>2]|0;
      $658 = (((($657) + (($646*84)|0)|0)) + 68|0);
      $659 = HEAP32[$658>>2]|0;
      $660 = (($659) + 1)|0;
      HEAP32[$658>>2] = $660;
      $664 = $321;$665 = $324;$code200 = $code183$ph260;
     }
     }
    } while(0);
    $661 = ((($code200)) + 1|0);
    $662 = $664;$663 = $665;$code183$ph$be = $661;
   } else {
    $6 = ($5<<24>>24)==(34);
    if ($6) {
     HEAP8[11424>>0] = 0;
     $$pre307 = HEAP8[$code183$ph260>>0]|0;
     $23 = $$pre307;
    } else {
     $23 = $5;
    }
    $7 = ((($code183$ph260)) + 1|0);
    $8 = HEAP32[(1336)>>2]|0;
    $9 = $8 >> 10;
    $10 = (($8) + 1)|0;
    HEAP32[(1336)>>2] = $10;
    $11 = (($8|0) % 1024)&-1;
    $12 = HEAP32[1332>>2]|0;
    $13 = ($9|0)>(15);
    if ($13) {
     _yyerror(11426,$vararg_buffer);
     $662 = $321;$663 = $324;$code183$ph$be = $7;
     break;
    }
    $14 = HEAP32[1364>>2]|0;
    $15 = ((((($14) + (($12*84)|0)|0)) + 4|0) + ($9<<2)|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ($16|0)==(0|0);
    if ($17) {
     $18 = (_bc_malloc(1024)|0);
     $19 = HEAP32[1364>>2]|0;
     $20 = ((((($19) + (($12*84)|0)|0)) + 4|0) + ($9<<2)|0);
     HEAP32[$20>>2] = $18;
     $$pre$i = HEAP32[1364>>2]|0;
     $$phi$trans$insert$i = ((((($$pre$i) + (($12*84)|0)|0)) + 4|0) + ($9<<2)|0);
     $$pre1$i = HEAP32[$$phi$trans$insert$i>>2]|0;
     $22 = $$pre1$i;
    } else {
     $22 = $16;
    }
    $21 = (($22) + ($11)|0);
    HEAP8[$21>>0] = $23;
    $24 = HEAP32[1364>>2]|0;
    $25 = (((($24) + (($12*84)|0)|0)) + 68|0);
    $26 = HEAP32[$25>>2]|0;
    $27 = (($26) + 1)|0;
    HEAP32[$25>>2] = $27;
    $662 = $321;$663 = $324;$code183$ph$be = $7;
   }
  } while(0);
  $$pr = HEAP32[1436>>2]|0;
  $52 = HEAP8[$code183$ph$be>>0]|0;
  $53 = $52 << 24 >> 24;
  $54 = ($52<<24>>24)==(0);
  $55 = ($$pr|0)!=(0);
  $or$cond251 = $55 | $54;
  if ($or$cond251) {
   label = 188;
   break;
  } else {
   $321 = $662;$324 = $663;$5 = $52;$79 = $53;$code183$ph260 = $code183$ph$be;
  }
 }
 if ((label|0) == 59) {
  $197 = HEAP32[1736>>2]|0;
  (_fwrite(11444,17,1,$197)|0);
  _exit(1);
  // unreachable;
 }
 else if ((label|0) == 188) {
  STACKTOP = sp;return;
 }
}
function _stop_execution($sig) {
 $sig = $sig|0;
 var $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP32[1340>>2] = 1;
 (_putchar(10)|0);
 _rt_error(11462,$vararg_buffer);
 STACKTOP = sp;return;
}
function _byte($pc) {
 $pc = $pc|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($pc)) + 4|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = $1 >> 10;
 $3 = (($1) + 1)|0;
 HEAP32[$0>>2] = $3;
 $4 = (($1|0) % 1024)&-1;
 $5 = HEAP32[$pc>>2]|0;
 $6 = HEAP32[1364>>2]|0;
 $7 = ((((($6) + (($5*84)|0)|0)) + 4|0) + ($2<<2)|0);
 $8 = HEAP32[$7>>2]|0;
 $9 = (($8) + ($4)|0);
 $10 = HEAP8[$9>>0]|0;
 return ($10|0);
}
function _execute() {
 var $$lobit = 0, $$not = 0, $$pr = 0, $$pre43 = 0, $$pre44 = 0, $$pre45 = 0, $$pre46 = 0, $$pre47 = 0, $$pre48 = 0, $$pre50 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0;
 var $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0;
 var $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0;
 var $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0;
 var $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0;
 var $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0;
 var $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0;
 var $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0;
 var $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0;
 var $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0;
 var $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0;
 var $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0;
 var $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0;
 var $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0;
 var $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0;
 var $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0;
 var $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0;
 var $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0;
 var $413 = 0, $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0;
 var $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0;
 var $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0;
 var $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0;
 var $486 = 0, $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0;
 var $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0;
 var $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0;
 var $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0;
 var $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0;
 var $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0;
 var $594 = 0, $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0;
 var $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $63 = 0, $64 = 0;
 var $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0;
 var $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $auto_list$0 = 0, $auto_list$028 = 0;
 var $auto_list$029 = 0, $const_base$0 = 0, $const_base$0$in = 0, $gp$0 = 0, $gp$0$lcssa = 0, $gp$033 = 0, $gp$035 = 0, $l_gp$034 = 0, $new_func$0 = 0, $or$cond = 0, $or$cond3 = 0, $or$cond339 = 0, $temp_num = 0, $var_name$0 = 0, $var_name$1 = 0, $var_name$2 = 0, $var_name$3 = 0, $var_name$4 = 0, $var_name$5 = 0, $var_name$6 = 0;
 var $var_name$7 = 0, $vararg_buffer = 0, $vararg_buffer1 = 0, $vararg_buffer11 = 0, $vararg_buffer3 = 0, $vararg_buffer5 = 0, $vararg_buffer7 = 0, $vararg_buffer9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer11 = sp + 48|0;
 $vararg_buffer9 = sp + 40|0;
 $vararg_buffer7 = sp + 32|0;
 $vararg_buffer5 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer1 = sp + 8|0;
 $vararg_buffer = sp;
 $temp_num = sp + 52|0;
 HEAP32[1424>>2] = 0;
 HEAP32[(1428)>>2] = 0;
 HEAP8[11749>>0] = 0;
 _init_num($temp_num);
 $0 = HEAP8[11743>>0]|0;
 $1 = ($0<<24>>24)==(0);
 if (!($1)) {
  (_signal(2,(8|0))|0);
  HEAP32[1340>>2] = 0;
 }
 $2 = HEAP32[(1428)>>2]|0;
 $3 = HEAP32[1424>>2]|0;
 $4 = HEAP32[1364>>2]|0;
 $5 = (((($4) + (($3*84)|0)|0)) + 68|0);
 $6 = HEAP32[$5>>2]|0;
 $7 = ($2|0)<($6|0);
 $8 = HEAP8[11749>>0]|0;
 $9 = ($8<<24>>24)==(0);
 $or$cond339 = $7 & $9;
 L4: do {
  if ($or$cond339) {
   $10 = HEAP32[1744>>2]|0;
   $12 = $2;$16 = $4;$17 = $3;
   L6: while(1) {
    $11 = $12 >> 10;
    $13 = (($12) + 1)|0;
    HEAP32[(1428)>>2] = $13;
    $14 = (($12|0) % 1024)&-1;
    $15 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($11<<2)|0);
    $18 = HEAP32[$15>>2]|0;
    $19 = (($18) + ($14)|0);
    $20 = HEAP8[$19>>0]|0;
    $21 = $20 << 24 >> 24;
    L8: do {
     switch ($21|0) {
     case 104:  {
      break L6;
      break;
     }
     case 65:  {
      $30 = $13 >> 10;
      $31 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $31;
      $32 = (($13|0) % 1024)&-1;
      $33 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($30<<2)|0);
      $34 = HEAP32[$33>>2]|0;
      $35 = (($34) + ($32)|0);
      $36 = HEAP8[$35>>0]|0;
      $37 = $36&255;
      $38 = $37 & 128;
      $39 = ($38|0)==(0);
      if ($39) {
       $var_name$0 = $37;
      } else {
       $40 = $31 >> 10;
       $41 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $41;
       $42 = (($31|0) % 1024)&-1;
       $43 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($40<<2)|0);
       $44 = HEAP32[$43>>2]|0;
       $45 = (($44) + ($42)|0);
       $46 = HEAP8[$45>>0]|0;
       $47 = $46&255;
       $var_name$0 = $47;
      }
      _incr_array($var_name$0);
      break;
     }
     case 90: case 66:  {
      $48 = HEAP32[1400>>2]|0;
      $49 = HEAP32[$48>>2]|0;
      $50 = (_is_zero($49)|0);
      $51 = ($50<<24>>24)==(0);
      $52 = $51&1;
      HEAP8[11748>>0] = $52;
      _pop();
      $$pre46 = HEAP32[(1428)>>2]|0;
      $$pre47 = HEAP32[1424>>2]|0;
      $$pre48 = HEAP32[1364>>2]|0;
      $54 = $$pre46;$58 = $$pre48;$59 = $$pre47;
      label = 11;
      break;
     }
     case 74:  {
      $54 = $13;$58 = $16;$59 = $17;
      label = 11;
      break;
     }
     case 67:  {
      $89 = $13 >> 10;
      $90 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $90;
      $91 = (($13|0) % 1024)&-1;
      $92 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($89<<2)|0);
      $93 = HEAP32[$92>>2]|0;
      $94 = (($93) + ($91)|0);
      $95 = HEAP8[$94>>0]|0;
      $96 = $95&255;
      $97 = $96 & 128;
      $98 = ($97|0)==(0);
      if ($98) {
       $new_func$0 = $96;
      } else {
       $99 = $90 >> 10;
       $100 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $100;
       $101 = (($90|0) % 1024)&-1;
       $102 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($99<<2)|0);
       $103 = HEAP32[$102>>2]|0;
       $104 = (($103) + ($101)|0);
       $105 = HEAP8[$104>>0]|0;
       $106 = $105&255;
       $new_func$0 = $106;
      }
      $107 = (($16) + (($new_func$0*84)|0)|0);
      $108 = HEAP8[$107>>0]|0;
      $109 = ($108<<24>>24)==(0);
      if ($109) {
       $110 = HEAP32[1368>>2]|0;
       $111 = (($110) + ($new_func$0<<2)|0);
       $112 = HEAP32[$111>>2]|0;
       HEAP32[$vararg_buffer>>2] = $112;
       _rt_error(11484,$vararg_buffer);
       break L8;
      }
      _process_params(1424,$new_func$0);
      $113 = HEAP32[1364>>2]|0;
      $114 = (((($113) + (($new_func$0*84)|0)|0)) + 80|0);
      $auto_list$028 = HEAP32[$114>>2]|0;
      $115 = ($auto_list$028|0)==(0|0);
      if (!($115)) {
       $auto_list$029 = $auto_list$028;
       while(1) {
        $116 = HEAP32[$auto_list$029>>2]|0;
        _auto_var($116);
        $117 = ((($auto_list$029)) + 4|0);
        $auto_list$0 = HEAP32[$117>>2]|0;
        $118 = ($auto_list$0|0)==(0|0);
        if ($118) {
         break;
        } else {
         $auto_list$029 = $auto_list$0;
        }
       }
      }
      $119 = HEAP32[1424>>2]|0;
      _fpush($119);
      $120 = HEAP32[(1428)>>2]|0;
      _fpush($120);
      $121 = HEAP32[1408>>2]|0;
      _fpush($121);
      HEAP32[1424>>2] = $new_func$0;
      HEAP32[(1428)>>2] = 0;
      break;
     }
     case 68:  {
      $122 = HEAP32[1400>>2]|0;
      $123 = HEAP32[$122>>2]|0;
      _push_copy($123);
      break;
     }
     case 75:  {
      $124 = ($17|0)==(0);
      $125 = HEAP32[1404>>2]|0;
      $const_base$0$in = $124 ? 1408 : $125;
      $const_base$0 = HEAP32[$const_base$0$in>>2]|0;
      $126 = ($const_base$0|0)==(10);
      if ($126) {
       _push_b10_const(1424);
       break L8;
      } else {
       _push_constant(9,$const_base$0);
       break L8;
      }
      break;
     }
     case 76:  {
      $127 = $13 >> 10;
      $128 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $128;
      $129 = (($13|0) % 1024)&-1;
      $130 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($127<<2)|0);
      $131 = HEAP32[$130>>2]|0;
      $132 = (($131) + ($129)|0);
      $133 = HEAP8[$132>>0]|0;
      $134 = $133&255;
      $135 = $134 & 128;
      $136 = ($135|0)==(0);
      if ($136) {
       $var_name$1 = $134;
      } else {
       $137 = $128 >> 10;
       $138 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $138;
       $139 = (($128|0) % 1024)&-1;
       $140 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($137<<2)|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = (($141) + ($139)|0);
       $143 = HEAP8[$142>>0]|0;
       $144 = $143&255;
       $var_name$1 = $144;
      }
      _load_array($var_name$1);
      break;
     }
     case 77:  {
      $145 = $13 >> 10;
      $146 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $146;
      $147 = (($13|0) % 1024)&-1;
      $148 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($145<<2)|0);
      $149 = HEAP32[$148>>2]|0;
      $150 = (($149) + ($147)|0);
      $151 = HEAP8[$150>>0]|0;
      $152 = $151&255;
      $153 = $152 & 128;
      $154 = ($153|0)==(0);
      if ($154) {
       $var_name$2 = $152;
      } else {
       $155 = $146 >> 10;
       $156 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $156;
       $157 = (($146|0) % 1024)&-1;
       $158 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($155<<2)|0);
       $159 = HEAP32[$158>>2]|0;
       $160 = (($159) + ($157)|0);
       $161 = HEAP8[$160>>0]|0;
       $162 = $161&255;
       $var_name$2 = $162;
      }
      _decr_array($var_name$2);
      break;
     }
     case 79:  {
      $164 = $13;$168 = $16;$169 = $17;
      L39: while(1) {
       $163 = $164 >> 10;
       $165 = (($164) + 1)|0;
       HEAP32[(1428)>>2] = $165;
       $166 = (($164|0) % 1024)&-1;
       $167 = ((((($168) + (($169*84)|0)|0)) + 4|0) + ($163<<2)|0);
       $170 = HEAP32[$167>>2]|0;
       $171 = (($170) + ($166)|0);
       $172 = HEAP8[$171>>0]|0;
       L41: do {
        switch ($172<<24>>24) {
        case 34:  {
         break L39;
         break;
        }
        case 92:  {
         $174 = $165 >> 10;
         $175 = (($164) + 2)|0;
         HEAP32[(1428)>>2] = $175;
         $176 = (($165|0) % 1024)&-1;
         $177 = ((((($168) + (($169*84)|0)|0)) + 4|0) + ($174<<2)|0);
         $178 = HEAP32[$177>>2]|0;
         $179 = (($178) + ($176)|0);
         $180 = HEAP8[$179>>0]|0;
         $181 = ($180<<24>>24)==(34);
         if ($181) {
          break L39;
         }
         $182 = $180 << 24 >> 24;
         switch ($182|0) {
         case 97:  {
          _out_char(7);
          break L41;
          break;
         }
         case 98:  {
          _out_char(8);
          break L41;
          break;
         }
         case 102:  {
          _out_char(12);
          break L41;
          break;
         }
         case 110:  {
          _out_char(10);
          break L41;
          break;
         }
         case 113:  {
          _out_char(34);
          break L41;
          break;
         }
         case 114:  {
          _out_char(13);
          break L41;
          break;
         }
         case 116:  {
          _out_char(9);
          break L41;
          break;
         }
         case 92:  {
          _out_char(92);
          break L41;
          break;
         }
         default: {
          break L41;
         }
         }
         break;
        }
        default: {
         $173 = $172 << 24 >> 24;
         _out_char($173);
        }
        }
       } while(0);
       $$pre43 = HEAP32[(1428)>>2]|0;
       $$pre44 = HEAP32[1424>>2]|0;
       $$pre45 = HEAP32[1364>>2]|0;
       $164 = $$pre43;$168 = $$pre45;$169 = $$pre44;
      }
      $183 = HEAP8[11743>>0]|0;
      $184 = ($183<<24>>24)==(0);
      if (!($184)) {
       (_fflush($10)|0);
      }
      break;
     }
     case 82:  {
      $185 = ($17|0)==(0);
      if ($185) {
       _rt_error(11509,$vararg_buffer1);
       break L8;
      } else {
       $186 = (((($16) + (($17*84)|0)|0)) + 80|0);
       $187 = HEAP32[$186>>2]|0;
       _pop_vars($187);
       $188 = HEAP32[1424>>2]|0;
       $189 = HEAP32[1364>>2]|0;
       $190 = (((($189) + (($188*84)|0)|0)) + 76|0);
       $191 = HEAP32[$190>>2]|0;
       _pop_vars($191);
       (_fpop()|0);
       $192 = (_fpop()|0);
       HEAP32[(1428)>>2] = $192;
       $193 = (_fpop()|0);
       HEAP32[1424>>2] = $193;
       break L8;
      }
      break;
     }
     case 83:  {
      $194 = $13 >> 10;
      $195 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $195;
      $196 = (($13|0) % 1024)&-1;
      $197 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($194<<2)|0);
      $198 = HEAP32[$197>>2]|0;
      $199 = (($198) + ($196)|0);
      $200 = HEAP8[$199>>0]|0;
      $201 = $200&255;
      $202 = $201 & 128;
      $203 = ($202|0)==(0);
      if ($203) {
       $var_name$3 = $201;
      } else {
       $204 = $195 >> 10;
       $205 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $205;
       $206 = (($195|0) % 1024)&-1;
       $207 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($204<<2)|0);
       $208 = HEAP32[$207>>2]|0;
       $209 = (($208) + ($206)|0);
       $210 = HEAP8[$209>>0]|0;
       $211 = $210&255;
       $var_name$3 = $211;
      }
      _store_array($var_name$3);
      break;
     }
     case 84:  {
      $212 = HEAP32[1400>>2]|0;
      $213 = HEAP32[$212>>2]|0;
      $214 = (_is_zero($213)|0);
      HEAP8[11748>>0] = $214;
      $215 = HEAP32[1400>>2]|0;
      _free_num($215);
      $216 = ($214<<24>>24)==(0);
      if ($216) {
       $220 = HEAP32[1320>>2]|0;
       $221 = (_copy_num($220)|0);
       $222 = HEAP32[1400>>2]|0;
       HEAP32[$222>>2] = $221;
       break L8;
      } else {
       $217 = HEAP32[1324>>2]|0;
       $218 = (_copy_num($217)|0);
       $219 = HEAP32[1400>>2]|0;
       HEAP32[$219>>2] = $218;
       break L8;
      }
      break;
     }
     case 80: case 87:  {
      $223 = HEAP32[1400>>2]|0;
      $224 = HEAP32[$223>>2]|0;
      $225 = HEAP32[1412>>2]|0;
      _out_num($224,$225,10);
      $226 = ($20<<24>>24)==(87);
      if ($226) {
       _out_char(10);
      }
      _store_var(3);
      $227 = HEAP8[11743>>0]|0;
      $228 = ($227<<24>>24)==(0);
      if (!($228)) {
       (_fflush($10)|0);
      }
      break;
     }
     case 99:  {
      $229 = $13 >> 10;
      $230 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $230;
      $231 = (($13|0) % 1024)&-1;
      $232 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($229<<2)|0);
      $233 = HEAP32[$232>>2]|0;
      $234 = (($233) + ($231)|0);
      $235 = HEAP8[$234>>0]|0;
      $236 = $235&255;
      switch ($236|0) {
      case 76:  {
       $237 = HEAP32[1400>>2]|0;
       $238 = HEAP32[$237>>2]|0;
       $239 = ((($238)) + 4|0);
       $240 = HEAP32[$239>>2]|0;
       $241 = ($240|0)==(1);
       $242 = ((($238)) + 8|0);
       $243 = HEAP32[$242>>2]|0;
       if ($241) {
        $244 = ($243|0)==(0);
        if ($244) {
         $249 = 0;
        } else {
         $245 = ((($238)) + 16|0);
         $246 = HEAP8[$245>>0]|0;
         $247 = ($246<<24>>24)==(0);
         if ($247) {
          _int2num($237,$243);
          break L8;
         } else {
          $249 = $243;
         }
        }
       } else {
        $249 = $243;
       }
       $248 = (($249) + ($240))|0;
       _int2num($237,$248);
       break L8;
       break;
      }
      case 83:  {
       $250 = HEAP32[1400>>2]|0;
       $251 = HEAP32[$250>>2]|0;
       $252 = ((($251)) + 8|0);
       $253 = HEAP32[$252>>2]|0;
       _int2num($250,$253);
       break L8;
       break;
      }
      case 82:  {
       $254 = HEAP32[1400>>2]|0;
       $255 = HEAP32[1416>>2]|0;
       $256 = (_bc_sqrt($254,$255)|0);
       $257 = ($256|0)==(0);
       if (!($257)) {
        break L8;
       }
       _rt_error(11535,$vararg_buffer3);
       break L8;
       break;
      }
      case 73:  {
       $258 = HEAP32[1408>>2]|0;
       _push_constant(11,$258);
       break L8;
       break;
      }
      default: {
       break L8;
      }
      }
      break;
     }
     case 100:  {
      $259 = $13 >> 10;
      $260 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $260;
      $261 = (($13|0) % 1024)&-1;
      $262 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($259<<2)|0);
      $263 = HEAP32[$262>>2]|0;
      $264 = (($263) + ($261)|0);
      $265 = HEAP8[$264>>0]|0;
      $266 = $265&255;
      $267 = $266 & 128;
      $268 = ($267|0)==(0);
      if ($268) {
       $var_name$4 = $266;
      } else {
       $269 = $260 >> 10;
       $270 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $270;
       $271 = (($260|0) % 1024)&-1;
       $272 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($269<<2)|0);
       $273 = HEAP32[$272>>2]|0;
       $274 = (($273) + ($271)|0);
       $275 = HEAP8[$274>>0]|0;
       $276 = $275&255;
       $var_name$4 = $276;
      }
      _decr_var($var_name$4);
      break;
     }
     case 105:  {
      $277 = $13 >> 10;
      $278 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $278;
      $279 = (($13|0) % 1024)&-1;
      $280 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($277<<2)|0);
      $281 = HEAP32[$280>>2]|0;
      $282 = (($281) + ($279)|0);
      $283 = HEAP8[$282>>0]|0;
      $284 = $283&255;
      $285 = $284 & 128;
      $286 = ($285|0)==(0);
      if ($286) {
       $var_name$5 = $284;
      } else {
       $287 = $278 >> 10;
       $288 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $288;
       $289 = (($278|0) % 1024)&-1;
       $290 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($287<<2)|0);
       $291 = HEAP32[$290>>2]|0;
       $292 = (($291) + ($289)|0);
       $293 = HEAP8[$292>>0]|0;
       $294 = $293&255;
       $var_name$5 = $294;
      }
      _incr_var($var_name$5);
      break;
     }
     case 108:  {
      $295 = $13 >> 10;
      $296 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $296;
      $297 = (($13|0) % 1024)&-1;
      $298 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($295<<2)|0);
      $299 = HEAP32[$298>>2]|0;
      $300 = (($299) + ($297)|0);
      $301 = HEAP8[$300>>0]|0;
      $302 = $301&255;
      $303 = $302 & 128;
      $304 = ($303|0)==(0);
      if ($304) {
       $var_name$6 = $302;
      } else {
       $305 = $296 >> 10;
       $306 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $306;
       $307 = (($296|0) % 1024)&-1;
       $308 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($305<<2)|0);
       $309 = HEAP32[$308>>2]|0;
       $310 = (($309) + ($307)|0);
       $311 = HEAP8[$310>>0]|0;
       $312 = $311&255;
       $var_name$6 = $312;
      }
      _load_var($var_name$6);
      break;
     }
     case 110:  {
      $313 = HEAP32[1320>>2]|0;
      $314 = HEAP32[1400>>2]|0;
      $315 = HEAP32[$314>>2]|0;
      _bc_sub($313,$315,$314);
      break;
     }
     case 112:  {
      _pop();
      break;
     }
     case 115:  {
      $316 = $13 >> 10;
      $317 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $317;
      $318 = (($13|0) % 1024)&-1;
      $319 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($316<<2)|0);
      $320 = HEAP32[$319>>2]|0;
      $321 = (($320) + ($318)|0);
      $322 = HEAP8[$321>>0]|0;
      $323 = $322&255;
      $324 = $323 & 128;
      $325 = ($324|0)==(0);
      if ($325) {
       $var_name$7 = $323;
      } else {
       $326 = $317 >> 10;
       $327 = (($12) + 3)|0;
       HEAP32[(1428)>>2] = $327;
       $328 = (($317|0) % 1024)&-1;
       $329 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($326<<2)|0);
       $330 = HEAP32[$329>>2]|0;
       $331 = (($330) + ($328)|0);
       $332 = HEAP8[$331>>0]|0;
       $333 = $332&255;
       $var_name$7 = $333;
      }
      _store_var($var_name$7);
      break;
     }
     case 119:  {
      $22 = $13 >> 10;
      $23 = (($12) + 2)|0;
      HEAP32[(1428)>>2] = $23;
      $24 = (($13|0) % 1024)&-1;
      $25 = ((((($16) + (($17*84)|0)|0)) + 4|0) + ($22<<2)|0);
      $26 = HEAP32[$25>>2]|0;
      $27 = (($26) + ($24)|0);
      $28 = HEAP8[$27>>0]|0;
      $29 = ($28<<24>>24)==(34);
      if (!($29)) {
       $335 = $28;
       while(1) {
        $334 = $335 << 24 >> 24;
        _out_char($334);
        $336 = HEAP32[(1428)>>2]|0;
        $337 = $336 >> 10;
        $338 = (($336) + 1)|0;
        HEAP32[(1428)>>2] = $338;
        $339 = (($336|0) % 1024)&-1;
        $340 = HEAP32[1424>>2]|0;
        $341 = HEAP32[1364>>2]|0;
        $342 = ((((($341) + (($340*84)|0)|0)) + 4|0) + ($337<<2)|0);
        $343 = HEAP32[$342>>2]|0;
        $344 = (($343) + ($339)|0);
        $345 = HEAP8[$344>>0]|0;
        $346 = ($345<<24>>24)==(34);
        if ($346) {
         break;
        } else {
         $335 = $345;
        }
       }
      }
      $347 = HEAP8[11743>>0]|0;
      $348 = ($347<<24>>24)==(0);
      if (!($348)) {
       (_fflush($10)|0);
      }
      break;
     }
     case 120:  {
      $349 = (_check_stack(2)|0);
      $350 = ($349<<24>>24)==(0);
      if (!($350)) {
       $351 = HEAP32[1400>>2]|0;
       $352 = HEAP32[$351>>2]|0;
       $353 = ((($351)) + 4|0);
       $354 = HEAP32[$353>>2]|0;
       $355 = HEAP32[$354>>2]|0;
       HEAP32[$351>>2] = $355;
       $356 = HEAP32[1400>>2]|0;
       $357 = ((($356)) + 4|0);
       $358 = HEAP32[$357>>2]|0;
       HEAP32[$358>>2] = $352;
      }
      break;
     }
     case 48:  {
      $359 = HEAP32[1320>>2]|0;
      _push_copy($359);
      break;
     }
     case 49:  {
      $360 = HEAP32[1324>>2]|0;
      _push_copy($360);
      break;
     }
     case 33:  {
      $361 = HEAP32[1400>>2]|0;
      $362 = HEAP32[$361>>2]|0;
      $363 = (_is_zero($362)|0);
      HEAP8[11748>>0] = $363;
      $364 = HEAP32[1400>>2]|0;
      _free_num($364);
      $365 = ($363<<24>>24)==(0);
      if ($365) {
       $369 = HEAP32[1320>>2]|0;
       $370 = (_copy_num($369)|0);
       $371 = HEAP32[1400>>2]|0;
       HEAP32[$371>>2] = $370;
       break L8;
      } else {
       $366 = HEAP32[1324>>2]|0;
       $367 = (_copy_num($366)|0);
       $368 = HEAP32[1400>>2]|0;
       HEAP32[$368>>2] = $367;
       break L8;
      }
      break;
     }
     case 38:  {
      $372 = (_check_stack(2)|0);
      $373 = ($372<<24>>24)==(0);
      if (!($373)) {
       $374 = HEAP32[1400>>2]|0;
       $375 = ((($374)) + 4|0);
       $376 = HEAP32[$375>>2]|0;
       $377 = HEAP32[$376>>2]|0;
       $378 = (_is_zero($377)|0);
       $379 = ($378<<24>>24)==(0);
       if ($379) {
        $380 = HEAP32[1400>>2]|0;
        $381 = HEAP32[$380>>2]|0;
        $382 = (_is_zero($381)|0);
        $383 = ($382<<24>>24)==(0);
        $385 = $383;
       } else {
        $385 = 0;
       }
       $384 = $385&1;
       HEAP8[11748>>0] = $384;
       _pop();
       $386 = HEAP8[11748>>0]|0;
       $387 = HEAP32[1400>>2]|0;
       _free_num($387);
       $388 = ($386<<24>>24)==(0);
       if ($388) {
        $392 = HEAP32[1320>>2]|0;
        $393 = (_copy_num($392)|0);
        $394 = HEAP32[1400>>2]|0;
        HEAP32[$394>>2] = $393;
        break L8;
       } else {
        $389 = HEAP32[1324>>2]|0;
        $390 = (_copy_num($389)|0);
        $391 = HEAP32[1400>>2]|0;
        HEAP32[$391>>2] = $390;
        break L8;
       }
      }
      break;
     }
     case 124:  {
      $395 = (_check_stack(2)|0);
      $396 = ($395<<24>>24)==(0);
      if (!($396)) {
       $397 = HEAP32[1400>>2]|0;
       $398 = ((($397)) + 4|0);
       $399 = HEAP32[$398>>2]|0;
       $400 = HEAP32[$399>>2]|0;
       $401 = (_is_zero($400)|0);
       $402 = ($401<<24>>24)==(0);
       if ($402) {
        $408 = 1;
       } else {
        $403 = HEAP32[1400>>2]|0;
        $404 = HEAP32[$403>>2]|0;
        $405 = (_is_zero($404)|0);
        $406 = ($405<<24>>24)==(0);
        $408 = $406;
       }
       $407 = $408&1;
       HEAP8[11748>>0] = $407;
       _pop();
       $409 = HEAP8[11748>>0]|0;
       $410 = HEAP32[1400>>2]|0;
       _free_num($410);
       $411 = ($409<<24>>24)==(0);
       if ($411) {
        $415 = HEAP32[1320>>2]|0;
        $416 = (_copy_num($415)|0);
        $417 = HEAP32[1400>>2]|0;
        HEAP32[$417>>2] = $416;
        break L8;
       } else {
        $412 = HEAP32[1324>>2]|0;
        $413 = (_copy_num($412)|0);
        $414 = HEAP32[1400>>2]|0;
        HEAP32[$414>>2] = $413;
        break L8;
       }
      }
      break;
     }
     case 43:  {
      $418 = (_check_stack(2)|0);
      $419 = ($418<<24>>24)==(0);
      if (!($419)) {
       $420 = HEAP32[1400>>2]|0;
       $421 = ((($420)) + 4|0);
       $422 = HEAP32[$421>>2]|0;
       $423 = HEAP32[$422>>2]|0;
       $424 = HEAP32[$420>>2]|0;
       _bc_add($423,$424,$temp_num);
       _pop();
       _pop();
       $425 = HEAP32[$temp_num>>2]|0;
       _push_num($425);
       _init_num($temp_num);
      }
      break;
     }
     case 45:  {
      $426 = (_check_stack(2)|0);
      $427 = ($426<<24>>24)==(0);
      if (!($427)) {
       $428 = HEAP32[1400>>2]|0;
       $429 = ((($428)) + 4|0);
       $430 = HEAP32[$429>>2]|0;
       $431 = HEAP32[$430>>2]|0;
       $432 = HEAP32[$428>>2]|0;
       _bc_sub($431,$432,$temp_num);
       _pop();
       _pop();
       $433 = HEAP32[$temp_num>>2]|0;
       _push_num($433);
       _init_num($temp_num);
      }
      break;
     }
     case 42:  {
      $434 = (_check_stack(2)|0);
      $435 = ($434<<24>>24)==(0);
      if (!($435)) {
       $436 = HEAP32[1400>>2]|0;
       $437 = ((($436)) + 4|0);
       $438 = HEAP32[$437>>2]|0;
       $439 = HEAP32[$438>>2]|0;
       $440 = HEAP32[$436>>2]|0;
       $441 = HEAP32[1416>>2]|0;
       _bc_multiply($439,$440,$temp_num,$441);
       _pop();
       _pop();
       $442 = HEAP32[$temp_num>>2]|0;
       _push_num($442);
       _init_num($temp_num);
      }
      break;
     }
     case 47:  {
      $443 = (_check_stack(2)|0);
      $444 = ($443<<24>>24)==(0);
      if (!($444)) {
       $445 = HEAP32[1400>>2]|0;
       $446 = ((($445)) + 4|0);
       $447 = HEAP32[$446>>2]|0;
       $448 = HEAP32[$447>>2]|0;
       $449 = HEAP32[$445>>2]|0;
       $450 = HEAP32[1416>>2]|0;
       $451 = (_bc_divide($448,$449,$temp_num,$450)|0);
       $452 = ($451|0)==(0);
       if ($452) {
        _pop();
        _pop();
        $453 = HEAP32[$temp_num>>2]|0;
        _push_num($453);
        _init_num($temp_num);
        break L8;
       } else {
        _rt_error(11568,$vararg_buffer5);
        break L8;
       }
      }
      break;
     }
     case 37:  {
      $454 = (_check_stack(2)|0);
      $455 = ($454<<24>>24)==(0);
      if (!($455)) {
       $456 = HEAP32[1400>>2]|0;
       $457 = HEAP32[$456>>2]|0;
       $458 = (_is_zero($457)|0);
       $459 = ($458<<24>>24)==(0);
       if ($459) {
        $460 = HEAP32[1400>>2]|0;
        $461 = ((($460)) + 4|0);
        $462 = HEAP32[$461>>2]|0;
        $463 = HEAP32[$462>>2]|0;
        $464 = HEAP32[$460>>2]|0;
        $465 = HEAP32[1416>>2]|0;
        (_bc_modulo($463,$464,$temp_num,$465)|0);
        _pop();
        _pop();
        $466 = HEAP32[$temp_num>>2]|0;
        _push_num($466);
        _init_num($temp_num);
        break L8;
       } else {
        _rt_error(11583,$vararg_buffer7);
        break L8;
       }
      }
      break;
     }
     case 94:  {
      $467 = (_check_stack(2)|0);
      $468 = ($467<<24>>24)==(0);
      if (!($468)) {
       $469 = HEAP32[1400>>2]|0;
       $470 = ((($469)) + 4|0);
       $471 = HEAP32[$470>>2]|0;
       $472 = HEAP32[$471>>2]|0;
       $473 = HEAP32[$469>>2]|0;
       $474 = HEAP32[1416>>2]|0;
       _bc_raise($472,$473,$temp_num,$474);
       $475 = HEAP32[1400>>2]|0;
       $476 = ((($475)) + 4|0);
       $477 = HEAP32[$476>>2]|0;
       $478 = HEAP32[$477>>2]|0;
       $479 = (_is_zero($478)|0);
       $480 = ($479<<24>>24)==(0);
       if (!($480)) {
        $481 = HEAP32[1400>>2]|0;
        $482 = HEAP32[$481>>2]|0;
        $483 = (_is_neg($482)|0);
        $484 = ($483<<24>>24)==(0);
        if (!($484)) {
         _rt_error(11598,$vararg_buffer9);
        }
       }
       _pop();
       _pop();
       $485 = HEAP32[$temp_num>>2]|0;
       _push_num($485);
       _init_num($temp_num);
      }
      break;
     }
     case 61:  {
      $494 = (_check_stack(2)|0);
      $495 = ($494<<24>>24)==(0);
      if (!($495)) {
       $496 = HEAP32[1400>>2]|0;
       $497 = ((($496)) + 4|0);
       $498 = HEAP32[$497>>2]|0;
       $499 = HEAP32[$498>>2]|0;
       $500 = HEAP32[$496>>2]|0;
       $501 = (_bc_compare($499,$500)|0);
       $502 = ($501|0)==(0);
       $503 = $502&1;
       HEAP8[11748>>0] = $503;
       _pop();
       $504 = HEAP8[11748>>0]|0;
       $505 = HEAP32[1400>>2]|0;
       _free_num($505);
       $506 = ($504<<24>>24)==(0);
       if ($506) {
        $510 = HEAP32[1320>>2]|0;
        $511 = (_copy_num($510)|0);
        $512 = HEAP32[1400>>2]|0;
        HEAP32[$512>>2] = $511;
        break L8;
       } else {
        $507 = HEAP32[1324>>2]|0;
        $508 = (_copy_num($507)|0);
        $509 = HEAP32[1400>>2]|0;
        HEAP32[$509>>2] = $508;
        break L8;
       }
      }
      break;
     }
     case 35:  {
      $513 = (_check_stack(2)|0);
      $514 = ($513<<24>>24)==(0);
      if (!($514)) {
       $515 = HEAP32[1400>>2]|0;
       $516 = ((($515)) + 4|0);
       $517 = HEAP32[$516>>2]|0;
       $518 = HEAP32[$517>>2]|0;
       $519 = HEAP32[$515>>2]|0;
       $520 = (_bc_compare($518,$519)|0);
       $521 = ($520|0)!=(0);
       $522 = $521&1;
       HEAP8[11748>>0] = $522;
       _pop();
       $523 = HEAP8[11748>>0]|0;
       $524 = HEAP32[1400>>2]|0;
       _free_num($524);
       $525 = ($523<<24>>24)==(0);
       if ($525) {
        $529 = HEAP32[1320>>2]|0;
        $530 = (_copy_num($529)|0);
        $531 = HEAP32[1400>>2]|0;
        HEAP32[$531>>2] = $530;
        break L8;
       } else {
        $526 = HEAP32[1324>>2]|0;
        $527 = (_copy_num($526)|0);
        $528 = HEAP32[1400>>2]|0;
        HEAP32[$528>>2] = $527;
        break L8;
       }
      }
      break;
     }
     case 60:  {
      $532 = (_check_stack(2)|0);
      $533 = ($532<<24>>24)==(0);
      if (!($533)) {
       $534 = HEAP32[1400>>2]|0;
       $535 = ((($534)) + 4|0);
       $536 = HEAP32[$535>>2]|0;
       $537 = HEAP32[$536>>2]|0;
       $538 = HEAP32[$534>>2]|0;
       $539 = (_bc_compare($537,$538)|0);
       $540 = ($539|0)==(-1);
       $541 = $540&1;
       HEAP8[11748>>0] = $541;
       _pop();
       $542 = HEAP8[11748>>0]|0;
       $543 = HEAP32[1400>>2]|0;
       _free_num($543);
       $544 = ($542<<24>>24)==(0);
       if ($544) {
        $548 = HEAP32[1320>>2]|0;
        $549 = (_copy_num($548)|0);
        $550 = HEAP32[1400>>2]|0;
        HEAP32[$550>>2] = $549;
        break L8;
       } else {
        $545 = HEAP32[1324>>2]|0;
        $546 = (_copy_num($545)|0);
        $547 = HEAP32[1400>>2]|0;
        HEAP32[$547>>2] = $546;
        break L8;
       }
      }
      break;
     }
     case 123:  {
      $551 = (_check_stack(2)|0);
      $552 = ($551<<24>>24)==(0);
      if (!($552)) {
       $553 = HEAP32[1400>>2]|0;
       $554 = ((($553)) + 4|0);
       $555 = HEAP32[$554>>2]|0;
       $556 = HEAP32[$555>>2]|0;
       $557 = HEAP32[$553>>2]|0;
       $558 = (_bc_compare($556,$557)|0);
       $559 = ($558|0)<(1);
       $560 = $559&1;
       HEAP8[11748>>0] = $560;
       _pop();
       $561 = HEAP8[11748>>0]|0;
       $562 = HEAP32[1400>>2]|0;
       _free_num($562);
       $563 = ($561<<24>>24)==(0);
       if ($563) {
        $567 = HEAP32[1320>>2]|0;
        $568 = (_copy_num($567)|0);
        $569 = HEAP32[1400>>2]|0;
        HEAP32[$569>>2] = $568;
        break L8;
       } else {
        $564 = HEAP32[1324>>2]|0;
        $565 = (_copy_num($564)|0);
        $566 = HEAP32[1400>>2]|0;
        HEAP32[$566>>2] = $565;
        break L8;
       }
      }
      break;
     }
     case 62:  {
      $570 = (_check_stack(2)|0);
      $571 = ($570<<24>>24)==(0);
      if (!($571)) {
       $572 = HEAP32[1400>>2]|0;
       $573 = ((($572)) + 4|0);
       $574 = HEAP32[$573>>2]|0;
       $575 = HEAP32[$574>>2]|0;
       $576 = HEAP32[$572>>2]|0;
       $577 = (_bc_compare($575,$576)|0);
       $578 = ($577|0)==(1);
       $579 = $578&1;
       HEAP8[11748>>0] = $579;
       _pop();
       $580 = HEAP8[11748>>0]|0;
       $581 = HEAP32[1400>>2]|0;
       _free_num($581);
       $582 = ($580<<24>>24)==(0);
       if ($582) {
        $586 = HEAP32[1320>>2]|0;
        $587 = (_copy_num($586)|0);
        $588 = HEAP32[1400>>2]|0;
        HEAP32[$588>>2] = $587;
        break L8;
       } else {
        $583 = HEAP32[1324>>2]|0;
        $584 = (_copy_num($583)|0);
        $585 = HEAP32[1400>>2]|0;
        HEAP32[$585>>2] = $584;
        break L8;
       }
      }
      break;
     }
     case 125:  {
      $589 = (_check_stack(2)|0);
      $590 = ($589<<24>>24)==(0);
      if (!($590)) {
       $591 = HEAP32[1400>>2]|0;
       $592 = ((($591)) + 4|0);
       $593 = HEAP32[$592>>2]|0;
       $594 = HEAP32[$593>>2]|0;
       $595 = HEAP32[$591>>2]|0;
       $596 = (_bc_compare($594,$595)|0);
       $$lobit = $596 >>> 31;
       $597 = $$lobit&255;
       $$not = $597 ^ 1;
       HEAP8[11748>>0] = $$not;
       _pop();
       $598 = HEAP8[11748>>0]|0;
       $599 = HEAP32[1400>>2]|0;
       _free_num($599);
       $600 = ($598<<24>>24)==(0);
       if ($600) {
        $604 = HEAP32[1320>>2]|0;
        $605 = (_copy_num($604)|0);
        $606 = HEAP32[1400>>2]|0;
        HEAP32[$606>>2] = $605;
        break L8;
       } else {
        $601 = HEAP32[1324>>2]|0;
        $602 = (_copy_num($601)|0);
        $603 = HEAP32[1400>>2]|0;
        HEAP32[$603>>2] = $602;
        break L8;
       }
      }
      break;
     }
     default: {
      HEAP32[$vararg_buffer11>>2] = $21;
      _rt_error(11613,$vararg_buffer11);
     }
     }
    } while(0);
    L186: do {
     if ((label|0) == 11) {
      label = 0;
      $53 = $54 >> 10;
      $55 = (($54) + 1)|0;
      HEAP32[(1428)>>2] = $55;
      $56 = (($54|0) % 1024)&-1;
      $57 = ((((($58) + (($59*84)|0)|0)) + 4|0) + ($53<<2)|0);
      $60 = HEAP32[$57>>2]|0;
      $61 = (($60) + ($56)|0);
      $62 = HEAP8[$61>>0]|0;
      $63 = $62&255;
      $64 = $55 >> 10;
      $65 = (($54) + 2)|0;
      HEAP32[(1428)>>2] = $65;
      $66 = (($55|0) % 1024)&-1;
      $67 = ((((($58) + (($59*84)|0)|0)) + 4|0) + ($64<<2)|0);
      $68 = HEAP32[$67>>2]|0;
      $69 = (($68) + ($66)|0);
      $70 = HEAP8[$69>>0]|0;
      $71 = $70&255;
      $72 = $71 << 8;
      $73 = $72 | $63;
      switch ($20<<24>>24) {
      case 74:  {
       break;
      }
      case 66:  {
       $74 = HEAP8[11748>>0]|0;
       $75 = ($74<<24>>24)==(0);
       if ($75) {
        break L186;
       }
       break;
      }
      default: {
       $76 = ($20<<24>>24)!=(90);
       $77 = HEAP8[11748>>0]|0;
       $78 = ($77<<24>>24)!=(0);
       $or$cond = $76 | $78;
       if ($or$cond) {
        break L186;
       }
      }
      }
      $79 = (((($58) + (($59*84)|0)|0)) + 72|0);
      $80 = $73 >>> 6;
      $81 = $62 & 63;
      $82 = $81&255;
      $gp$033 = HEAP32[$79>>2]|0;
      $83 = ($80|0)==(0);
      if ($83) {
       $gp$0$lcssa = $gp$033;
      } else {
       $gp$035 = $gp$033;$l_gp$034 = $80;
       while(1) {
        $84 = (($l_gp$034) + -1)|0;
        $85 = ((($gp$035)) + 256|0);
        $gp$0 = HEAP32[$85>>2]|0;
        $86 = ($l_gp$034|0)>(1);
        if ($86) {
         $gp$035 = $gp$0;$l_gp$034 = $84;
        } else {
         $gp$0$lcssa = $gp$0;
         break;
        }
       }
      }
      $87 = (($gp$0$lcssa) + ($82<<2)|0);
      $88 = HEAP32[$87>>2]|0;
      HEAP32[(1428)>>2] = $88;
     }
    } while(0);
    $486 = HEAP32[(1428)>>2]|0;
    $487 = HEAP32[1424>>2]|0;
    $488 = HEAP32[1364>>2]|0;
    $489 = (((($488) + (($487*84)|0)|0)) + 68|0);
    $490 = HEAP32[$489>>2]|0;
    $491 = ($486|0)<($490|0);
    $492 = HEAP8[11749>>0]|0;
    $493 = ($492<<24>>24)==(0);
    $or$cond3 = $491 & $493;
    if ($or$cond3) {
     $12 = $486;$16 = $488;$17 = $487;
    } else {
     $$pr = $487;$627 = $488;
     break L4;
    }
   }
   _exit(0);
   // unreachable;
  } else {
   $$pr = $3;$627 = $4;
  }
 } while(0);
 $607 = ($$pr|0)==(0);
 L199: do {
  if (!($607)) {
   $611 = $627;$612 = $$pr;
   while(1) {
    $610 = (((($611) + (($612*84)|0)|0)) + 80|0);
    $613 = HEAP32[$610>>2]|0;
    _pop_vars($613);
    $614 = HEAP32[1424>>2]|0;
    $615 = HEAP32[1364>>2]|0;
    $616 = (((($615) + (($614*84)|0)|0)) + 76|0);
    $617 = HEAP32[$616>>2]|0;
    _pop_vars($617);
    (_fpop()|0);
    $618 = (_fpop()|0);
    HEAP32[(1428)>>2] = $618;
    $619 = (_fpop()|0);
    HEAP32[1424>>2] = $619;
    $620 = ($619|0)==(0);
    if ($620) {
     break L199;
    }
    $$pre50 = HEAP32[1364>>2]|0;
    $611 = $$pre50;$612 = $619;
   }
  }
 } while(0);
 $608 = HEAP32[1400>>2]|0;
 $609 = ($608|0)==(0|0);
 if (!($609)) {
  while(1) {
   _pop();
   $621 = HEAP32[1400>>2]|0;
   $622 = ($621|0)==(0|0);
   if ($622) {
    break;
   }
  }
 }
 $623 = HEAP8[11743>>0]|0;
 $624 = ($623<<24>>24)==(0);
 if ($624) {
  STACKTOP = sp;return;
 }
 (_signal(2,(7|0))|0);
 $625 = HEAP32[1340>>2]|0;
 $626 = ($625|0)==(0);
 if ($626) {
  STACKTOP = sp;return;
 }
 (_puts(11638)|0);
 STACKTOP = sp;return;
}
function _push_b10_const($pc) {
 $pc = $pc|0;
 var $$in = 0, $$in$lcssa = 0, $$lcssa35 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $8 = 0, $9 = 0, $build = 0;
 var $inchar$0 = 0, $inchar$0$in = 0, $inchar$1 = 0, $inchar$17 = 0, $inchar$2 = 0, $kdigits$0 = 0, $kdigits$0$lcssa = 0, $kdigits$034 = 0, $kscale$08 = 0, $kscale$1 = 0, $or$cond = 0, $ptr$0 = 0, $ptr$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $build = sp;
 $0 = $pc;
 $1 = $0;
 $2 = HEAP32[$1>>2]|0;
 $3 = (($0) + 4)|0;
 $4 = $3;
 $5 = HEAP32[$4>>2]|0;
 $6 = $5 >> 10;
 $7 = (($5|0) % 1024)&-1;
 $8 = HEAP32[1364>>2]|0;
 $9 = ((((($8) + (($2*84)|0)|0)) + 4|0) + ($6<<2)|0);
 $10 = HEAP32[$9>>2]|0;
 $11 = (($10) + ($7)|0);
 $$in = $5;$inchar$0$in = $11;$kdigits$0 = 0;
 L1: while(1) {
  $inchar$0 = HEAP8[$inchar$0$in>>0]|0;
  $12 = (($$in) + 1)|0;
  switch ($inchar$0<<24>>24) {
  case 46:  {
   $$in$lcssa = $$in;$$lcssa35 = $12;$kdigits$0$lcssa = $kdigits$0;
   label = 4;
   break L1;
   break;
  }
  case 58:  {
   $kdigits$034 = $kdigits$0;$kscale$1 = 0;
   break L1;
   break;
  }
  default: {
  }
  }
  $13 = (($kdigits$0) + 1)|0;
  $14 = $12 >> 10;
  $15 = (($12|0) % 1024)&-1;
  $16 = ((((($8) + (($2*84)|0)|0)) + 4|0) + ($14<<2)|0);
  $17 = HEAP32[$16>>2]|0;
  $18 = (($17) + ($15)|0);
  $$in = $12;$inchar$0$in = $18;$kdigits$0 = $13;
 }
 if ((label|0) == 4) {
  $19 = $$lcssa35 >> 10;
  $20 = (($$lcssa35|0) % 1024)&-1;
  $21 = ((((($8) + (($2*84)|0)|0)) + 4|0) + ($19<<2)|0);
  $22 = HEAP32[$21>>2]|0;
  $23 = (($22) + ($20)|0);
  $inchar$17 = HEAP8[$23>>0]|0;
  $24 = ($inchar$17<<24>>24)==(58);
  if ($24) {
   $kdigits$034 = $kdigits$0$lcssa;$kscale$1 = 0;
  } else {
   $25 = (($$in$lcssa) + 2)|0;
   $28 = $25;$kscale$08 = 0;
   while(1) {
    $26 = (($kscale$08) + 1)|0;
    $27 = $28 >> 10;
    $29 = (($28) + 1)|0;
    $30 = (($28|0) % 1024)&-1;
    $31 = ((((($8) + (($2*84)|0)|0)) + 4|0) + ($27<<2)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = (($32) + ($30)|0);
    $inchar$1 = HEAP8[$33>>0]|0;
    $34 = ($inchar$1<<24>>24)==(58);
    if ($34) {
     $kdigits$034 = $kdigits$0$lcssa;$kscale$1 = $26;
     break;
    } else {
     $28 = $29;$kscale$08 = $26;
    }
   }
  }
 }
 $35 = ((($pc)) + 4|0);
 $36 = HEAP32[$35>>2]|0;
 $37 = $36 >> 10;
 $38 = (($36) + 1)|0;
 HEAP32[$35>>2] = $38;
 $39 = (($36|0) % 1024)&-1;
 $40 = ((((($8) + (($2*84)|0)|0)) + 4|0) + ($37<<2)|0);
 $41 = HEAP32[$40>>2]|0;
 $42 = (($41) + ($39)|0);
 $43 = HEAP8[$42>>0]|0;
 $44 = ($kdigits$034|0)==(1);
 $45 = ($kscale$1|0)==(0);
 $or$cond = $44 & $45;
 L10: do {
  if ($or$cond) {
   $46 = $43 << 24 >> 24;
   switch ($43<<24>>24) {
   case 0:  {
    $47 = HEAP32[1320>>2]|0;
    _push_copy($47);
    $48 = HEAP32[$35>>2]|0;
    $49 = (($48) + 1)|0;
    HEAP32[$35>>2] = $49;
    STACKTOP = sp;return;
    break;
   }
   case 1:  {
    $50 = HEAP32[1324>>2]|0;
    _push_copy($50);
    $51 = HEAP32[$35>>2]|0;
    $52 = (($51) + 1)|0;
    HEAP32[$35>>2] = $52;
    STACKTOP = sp;return;
    break;
   }
   default: {
    $53 = ($43<<24>>24)>(9);
    if (!($53)) {
     break L10;
    }
    _init_num($build);
    _int2num($build,$46);
    $54 = HEAP32[$build>>2]|0;
    _push_num($54);
    $55 = HEAP32[$35>>2]|0;
    $56 = (($55) + 1)|0;
    HEAP32[$35>>2] = $56;
    STACKTOP = sp;return;
   }
   }
  }
 } while(0);
 $57 = ($kdigits$034|0)==(0);
 if ($57) {
  $58 = (_new_num(1,$kscale$1)|0);
  HEAP32[$build>>2] = $58;
  $59 = ((($58)) + 16|0);
  $60 = ((($58)) + 17|0);
  HEAP8[$59>>0] = 0;
  $inchar$2 = $43;$ptr$0 = $60;
 } else {
  $61 = (_new_num($kdigits$034,$kscale$1)|0);
  HEAP32[$build>>2] = $61;
  $62 = ((($61)) + 16|0);
  $inchar$2 = $43;$ptr$0 = $62;
 }
 L24: while(1) {
  L26: do {
   switch ($inchar$2<<24>>24) {
   case 58:  {
    break L24;
    break;
   }
   case 46:  {
    $ptr$1 = $ptr$0;
    break;
   }
   default: {
    $63 = ($inchar$2<<24>>24)>(9);
    $64 = ((($ptr$0)) + 1|0);
    if ($63) {
     HEAP8[$ptr$0>>0] = 9;
     $ptr$1 = $64;
     break L26;
    } else {
     HEAP8[$ptr$0>>0] = $inchar$2;
     $ptr$1 = $64;
     break L26;
    }
   }
   }
  } while(0);
  $65 = HEAP32[$35>>2]|0;
  $66 = $65 >> 10;
  $67 = (($65) + 1)|0;
  HEAP32[$35>>2] = $67;
  $68 = (($65|0) % 1024)&-1;
  $69 = HEAP32[$pc>>2]|0;
  $70 = HEAP32[1364>>2]|0;
  $71 = ((((($70) + (($69*84)|0)|0)) + 4|0) + ($66<<2)|0);
  $72 = HEAP32[$71>>2]|0;
  $73 = (($72) + ($68)|0);
  $74 = HEAP8[$73>>0]|0;
  $inchar$2 = $74;$ptr$0 = $ptr$1;
 }
 $75 = HEAP32[$build>>2]|0;
 _push_num($75);
 STACKTOP = sp;return;
}
function _push_constant($in_char,$conv_base) {
 $in_char = $in_char|0;
 $conv_base = $conv_base|0;
 var $$ = 0, $$lcssa = 0, $$lcssa32 = 0, $$lcssa33 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0;
 var $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $build = 0, $digits$0$lcssa = 0, $digits$05 = 0, $divisor = 0, $first_ch$0 = 0, $in_ch$0 = 0, $in_ch$1 = 0, $in_ch$2$lcssa = 0, $in_ch$28 = 0, $in_ch$3 = 0, $in_ch$4 = 0, $in_ch$56 = 0, $mult = 0, $negative$0 = 0, $or$cond = 0, $or$cond2 = 0, $result = 0;
 var $temp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $build = sp + 16|0;
 $temp = sp + 12|0;
 $result = sp + 8|0;
 $mult = sp + 4|0;
 $divisor = sp;
 _init_num($temp);
 _init_num($result);
 _init_num($mult);
 $0 = HEAP32[1320>>2]|0;
 $1 = (_copy_num($0)|0);
 HEAP32[$build>>2] = $1;
 _int2num($mult,$conv_base);
 $2 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
 $in_ch$0 = $2;
 L1: while(1) {
  switch ($in_ch$0<<24>>24) {
  case 43:  {
   label = 4;
   break L1;
   break;
  }
  case 45:  {
   label = 5;
   break L1;
   break;
  }
  case 32:  {
   break;
  }
  default: {
   $in_ch$1 = $in_ch$0;$negative$0 = 0;
   break L1;
  }
  }
  $3 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
  $in_ch$0 = $3;
 }
 if ((label|0) == 4) {
  $4 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
  $in_ch$1 = $4;$negative$0 = 0;
 }
 else if ((label|0) == 5) {
  $5 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
  $in_ch$1 = $5;$negative$0 = 1;
 }
 $6 = ($in_ch$1<<24>>24)<(16);
 if ($6) {
  $7 = $in_ch$1 << 24 >> 24;
  $8 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
  $9 = ($8<<24>>24)>(15);
  $10 = ($7|0)<($conv_base|0);
  $or$cond = $10 | $9;
  $11 = (($conv_base) + 255)|0;
  $12 = $11&255;
  $first_ch$0 = $or$cond ? $in_ch$1 : $12;
  $13 = $first_ch$0 << 24 >> 24;
  _int2num($build,$13);
  $14 = ($8<<24>>24)<(16);
  if ($14) {
   $15 = (($conv_base) + 255)|0;
   $16 = $15&255;
   $in_ch$28 = $8;
   while(1) {
    $17 = $in_ch$28 << 24 >> 24;
    $18 = ($17|0)<($conv_base|0);
    $in_ch$3 = $18 ? $in_ch$28 : $16;
    $19 = HEAP32[$build>>2]|0;
    $20 = HEAP32[$mult>>2]|0;
    _bc_multiply($19,$20,$result,0);
    $21 = $in_ch$3 << 24 >> 24;
    _int2num($temp,$21);
    $22 = HEAP32[$result>>2]|0;
    $23 = HEAP32[$temp>>2]|0;
    _bc_add($22,$23,$build);
    $24 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
    $25 = ($24<<24>>24)<(16);
    if ($25) {
     $in_ch$28 = $24;
    } else {
     $in_ch$2$lcssa = $24;
     break;
    }
   }
  } else {
   $in_ch$2$lcssa = $8;
  }
 } else {
  $in_ch$2$lcssa = $in_ch$1;
 }
 $26 = ($in_ch$2$lcssa<<24>>24)==(46);
 if ($26) {
  $27 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
  $28 = $27 << 24 >> 24;
  $29 = ($28|0)<($conv_base|0);
  $30 = (($conv_base) + 255)|0;
  $31 = $30&255;
  $in_ch$4 = $29 ? $27 : $31;
  _free_num($result);
  _free_num($temp);
  $32 = HEAP32[1324>>2]|0;
  $33 = (_copy_num($32)|0);
  HEAP32[$divisor>>2] = $33;
  $34 = HEAP32[1320>>2]|0;
  $35 = (_copy_num($34)|0);
  HEAP32[$result>>2] = $35;
  $36 = ($in_ch$4<<24>>24)<(16);
  if ($36) {
   $39 = $35;$digits$05 = 0;$in_ch$56 = $in_ch$4;
   while(1) {
    $37 = $in_ch$56 << 24 >> 24;
    $38 = HEAP32[$mult>>2]|0;
    _bc_multiply($39,$38,$result,0);
    _int2num($temp,$37);
    $40 = HEAP32[$result>>2]|0;
    $41 = HEAP32[$temp>>2]|0;
    _bc_add($40,$41,$result);
    $42 = HEAP32[$divisor>>2]|0;
    $43 = HEAP32[$mult>>2]|0;
    _bc_multiply($42,$43,$divisor,0);
    $44 = (($digits$05) + 1)|0;
    $45 = (FUNCTION_TABLE_i[$in_char & 15]()|0);
    $46 = ($45<<24>>24)>(15);
    $47 = $45 << 24 >> 24;
    $48 = ($47|0)<($conv_base|0);
    $or$cond2 = $46 | $48;
    $$ = $or$cond2 ? $45 : $31;
    $49 = ($$<<24>>24)<(16);
    $50 = HEAP32[$result>>2]|0;
    if ($49) {
     $39 = $50;$digits$05 = $44;$in_ch$56 = $$;
    } else {
     $$lcssa32 = $44;$$lcssa33 = $50;
     break;
    }
   }
   $$pre = HEAP32[$divisor>>2]|0;
   $$lcssa = $$lcssa33;$51 = $$pre;$digits$0$lcssa = $$lcssa32;
  } else {
   $$lcssa = $35;$51 = $33;$digits$0$lcssa = 0;
  }
  (_bc_divide($$lcssa,$51,$result,$digits$0$lcssa)|0);
  $52 = HEAP32[$build>>2]|0;
  $53 = HEAP32[$result>>2]|0;
  _bc_add($52,$53,$build);
 }
 $54 = ($negative$0<<24>>24)==(0);
 if ($54) {
  $57 = HEAP32[$build>>2]|0;
  _push_num($57);
  _free_num($temp);
  _free_num($result);
  _free_num($mult);
  STACKTOP = sp;return;
 }
 $55 = HEAP32[1320>>2]|0;
 $56 = HEAP32[$build>>2]|0;
 _bc_sub($55,$56,$build);
 $57 = HEAP32[$build>>2]|0;
 _push_num($57);
 _free_num($temp);
 _free_num($result);
 _free_num($mult);
 STACKTOP = sp;return;
}
function _prog_char() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[(1428)>>2]|0;
 $1 = $0 >> 10;
 $2 = (($0) + 1)|0;
 HEAP32[(1428)>>2] = $2;
 $3 = (($0|0) % 1024)&-1;
 $4 = HEAP32[1424>>2]|0;
 $5 = HEAP32[1364>>2]|0;
 $6 = ((((($5) + (($4*84)|0)|0)) + 4|0) + ($1<<2)|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = (($7) + ($3)|0);
 $9 = HEAP8[$8>>0]|0;
 return ($9|0);
}
function _input_char() {
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $in_ch$0 = 0, $in_ch$0$in = 0, $in_ch$0$off = 0;
 var $in_ch$0$off3 = 0, $isdigit = 0, $isdigittmp = 0, $sext = 0, $sext$mask = 0, $sext$mask1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_getchar()|0);
 $sext$mask = $0 & 255;
 $1 = ($sext$mask|0)==(92);
 if ($1) {
  $2 = (_getchar()|0);
  $sext$mask1 = $2 & 255;
  $3 = ($sext$mask1|0)==(10);
  if ($3) {
   $4 = (_getchar()|0);
   $in_ch$0$in = $4;
  } else {
   $in_ch$0$in = $2;
  }
 } else {
  $in_ch$0$in = $0;
 }
 $in_ch$0 = $in_ch$0$in&255;
 $sext = $in_ch$0$in << 24;
 $5 = $sext >> 24;
 $isdigittmp = (($5) + -48)|0;
 $isdigit = ($isdigittmp>>>0)<(10);
 if ($isdigit) {
  $6 = (($5) + 208)|0;
  $7 = $6&255;
  $$0 = $7;
  return ($$0|0);
 }
 $in_ch$0$off = (($in_ch$0) + -65)<<24>>24;
 $8 = ($in_ch$0$off&255)<(6);
 if ($8) {
  $9 = (($5) + 201)|0;
  $10 = $9&255;
  $$0 = $10;
  return ($$0|0);
 }
 $in_ch$0$off3 = (($in_ch$0) + -97)<<24>>24;
 $11 = ($in_ch$0$off3&255)<(6);
 if ($11) {
  $12 = (($5) + 169)|0;
  $13 = $12&255;
  $$0 = $13;
  return ($$0|0);
 }
 switch ($in_ch$0<<24>>24) {
 case 45: case 43: case 46:  {
  $$0 = $in_ch$0;
  return ($$0|0);
  break;
 }
 default: {
 }
 }
 $14 = ($in_ch$0<<24>>24)<(33);
 $$ = $14 ? 32 : 58;
 $$0 = $$;
 return ($$0|0);
}
function _malloc($bytes) {
 $bytes = $bytes|0;
 var $$3$i = 0, $$lcssa = 0, $$lcssa211 = 0, $$lcssa215 = 0, $$lcssa216 = 0, $$lcssa217 = 0, $$lcssa219 = 0, $$lcssa222 = 0, $$lcssa224 = 0, $$lcssa226 = 0, $$lcssa228 = 0, $$lcssa230 = 0, $$lcssa232 = 0, $$pre = 0, $$pre$i = 0, $$pre$i$i = 0, $$pre$i22$i = 0, $$pre$i25 = 0, $$pre$phi$i$iZ2D = 0, $$pre$phi$i23$iZ2D = 0;
 var $$pre$phi$i26Z2D = 0, $$pre$phi$iZ2D = 0, $$pre$phi58$i$iZ2D = 0, $$pre$phiZ2D = 0, $$pre105 = 0, $$pre106 = 0, $$pre14$i$i = 0, $$pre43$i = 0, $$pre56$i$i = 0, $$pre57$i$i = 0, $$pre8$i = 0, $$rsize$0$i = 0, $$rsize$3$i = 0, $$sum = 0, $$sum$i$i = 0, $$sum$i$i$i = 0, $$sum$i13$i = 0, $$sum$i15$i = 0, $$sum$i17$i = 0, $$sum$i19$i = 0;
 var $$sum$i2334 = 0, $$sum$i32 = 0, $$sum$i35 = 0, $$sum1 = 0, $$sum1$i = 0, $$sum1$i$i = 0, $$sum1$i14$i = 0, $$sum1$i20$i = 0, $$sum1$i24 = 0, $$sum10 = 0, $$sum10$i = 0, $$sum10$i$i = 0, $$sum11$i = 0, $$sum11$i$i = 0, $$sum1112 = 0, $$sum112$i = 0, $$sum113$i = 0, $$sum114$i = 0, $$sum115$i = 0, $$sum116$i = 0;
 var $$sum117$i = 0, $$sum118$i = 0, $$sum119$i = 0, $$sum12$i = 0, $$sum12$i$i = 0, $$sum120$i = 0, $$sum121$i = 0, $$sum122$i = 0, $$sum123$i = 0, $$sum124$i = 0, $$sum125$i = 0, $$sum13$i = 0, $$sum13$i$i = 0, $$sum14$i$i = 0, $$sum15$i = 0, $$sum15$i$i = 0, $$sum16$i = 0, $$sum16$i$i = 0, $$sum17$i = 0, $$sum17$i$i = 0;
 var $$sum18$i = 0, $$sum1819$i$i = 0, $$sum2 = 0, $$sum2$i = 0, $$sum2$i$i = 0, $$sum2$i$i$i = 0, $$sum2$i16$i = 0, $$sum2$i18$i = 0, $$sum2$i21$i = 0, $$sum20$i$i = 0, $$sum21$i$i = 0, $$sum22$i$i = 0, $$sum23$i$i = 0, $$sum24$i$i = 0, $$sum25$i$i = 0, $$sum27$i$i = 0, $$sum28$i$i = 0, $$sum29$i$i = 0, $$sum3$i = 0, $$sum3$i27 = 0;
 var $$sum30$i$i = 0, $$sum3132$i$i = 0, $$sum34$i$i = 0, $$sum3536$i$i = 0, $$sum3738$i$i = 0, $$sum39$i$i = 0, $$sum4 = 0, $$sum4$i = 0, $$sum4$i$i = 0, $$sum4$i28 = 0, $$sum40$i$i = 0, $$sum41$i$i = 0, $$sum42$i$i = 0, $$sum5$i = 0, $$sum5$i$i = 0, $$sum56 = 0, $$sum6$i = 0, $$sum67$i$i = 0, $$sum7$i = 0, $$sum8$i = 0;
 var $$sum9 = 0, $$sum9$i = 0, $$sum9$i$i = 0, $$tsize$1$i = 0, $$v$0$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $1000 = 0, $1001 = 0, $1002 = 0, $1003 = 0, $1004 = 0, $1005 = 0, $1006 = 0, $1007 = 0, $1008 = 0, $1009 = 0, $101 = 0;
 var $1010 = 0, $1011 = 0, $1012 = 0, $1013 = 0, $1014 = 0, $1015 = 0, $1016 = 0, $1017 = 0, $1018 = 0, $1019 = 0, $102 = 0, $1020 = 0, $1021 = 0, $1022 = 0, $1023 = 0, $1024 = 0, $1025 = 0, $1026 = 0, $1027 = 0, $1028 = 0;
 var $1029 = 0, $103 = 0, $1030 = 0, $1031 = 0, $1032 = 0, $1033 = 0, $1034 = 0, $1035 = 0, $1036 = 0, $1037 = 0, $1038 = 0, $1039 = 0, $104 = 0, $1040 = 0, $1041 = 0, $1042 = 0, $1043 = 0, $1044 = 0, $1045 = 0, $1046 = 0;
 var $1047 = 0, $1048 = 0, $1049 = 0, $105 = 0, $1050 = 0, $1051 = 0, $1052 = 0, $1053 = 0, $1054 = 0, $1055 = 0, $1056 = 0, $1057 = 0, $1058 = 0, $1059 = 0, $106 = 0, $1060 = 0, $1061 = 0, $1062 = 0, $1063 = 0, $107 = 0;
 var $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0;
 var $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0;
 var $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0;
 var $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0;
 var $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0;
 var $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0;
 var $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0;
 var $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0;
 var $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0;
 var $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0;
 var $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0;
 var $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0;
 var $324 = 0, $325 = 0, $326 = 0, $327 = 0, $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0;
 var $342 = 0, $343 = 0, $344 = 0, $345 = 0, $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0, $36 = 0;
 var $360 = 0, $361 = 0, $362 = 0, $363 = 0, $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0;
 var $379 = 0, $38 = 0, $380 = 0, $381 = 0, $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0, $392 = 0, $393 = 0, $394 = 0, $395 = 0, $396 = 0;
 var $397 = 0, $398 = 0, $399 = 0, $4 = 0, $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0, $412 = 0, $413 = 0;
 var $414 = 0, $415 = 0, $416 = 0, $417 = 0, $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0;
 var $432 = 0, $433 = 0, $434 = 0, $435 = 0, $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0, $443 = 0, $444 = 0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0;
 var $450 = 0, $451 = 0, $452 = 0, $453 = 0, $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0;
 var $469 = 0, $47 = 0, $470 = 0, $471 = 0, $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0, $486 = 0;
 var $487 = 0, $488 = 0, $489 = 0, $49 = 0, $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0;
 var $504 = 0, $505 = 0, $506 = 0, $507 = 0, $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0;
 var $522 = 0, $523 = 0, $524 = 0, $525 = 0, $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0;
 var $540 = 0, $541 = 0, $542 = 0, $543 = 0, $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0;
 var $559 = 0, $56 = 0, $560 = 0, $561 = 0, $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0;
 var $577 = 0, $578 = 0, $579 = 0, $58 = 0, $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0;
 var $595 = 0, $596 = 0, $597 = 0, $598 = 0, $599 = 0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0;
 var $612 = 0, $613 = 0, $614 = 0, $615 = 0, $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0;
 var $630 = 0, $631 = 0, $632 = 0, $633 = 0, $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0;
 var $649 = 0, $65 = 0, $650 = 0, $651 = 0, $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0;
 var $667 = 0, $668 = 0, $669 = 0, $67 = 0, $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0;
 var $685 = 0, $686 = 0, $687 = 0, $688 = 0, $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0;
 var $702 = 0, $703 = 0, $704 = 0, $705 = 0, $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0;
 var $720 = 0, $721 = 0, $722 = 0, $723 = 0, $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0;
 var $739 = 0, $74 = 0, $740 = 0, $741 = 0, $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0;
 var $757 = 0, $758 = 0, $759 = 0, $76 = 0, $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0;
 var $775 = 0, $776 = 0, $777 = 0, $778 = 0, $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0;
 var $793 = 0, $794 = 0, $795 = 0, $796 = 0, $797 = 0, $798 = 0, $799 = 0, $8 = 0, $80 = 0, $800 = 0, $801 = 0, $802 = 0, $803 = 0, $804 = 0, $805 = 0, $806 = 0, $807 = 0, $808 = 0, $809 = 0, $81 = 0;
 var $810 = 0, $811 = 0, $812 = 0, $813 = 0, $814 = 0, $815 = 0, $816 = 0, $817 = 0, $818 = 0, $819 = 0, $82 = 0, $820 = 0, $821 = 0, $822 = 0, $823 = 0, $824 = 0, $825 = 0, $826 = 0, $827 = 0, $828 = 0;
 var $829 = 0, $83 = 0, $830 = 0, $831 = 0, $832 = 0, $833 = 0, $834 = 0, $835 = 0, $836 = 0, $837 = 0, $838 = 0, $839 = 0, $84 = 0, $840 = 0, $841 = 0, $842 = 0, $843 = 0, $844 = 0, $845 = 0, $846 = 0;
 var $847 = 0, $848 = 0, $849 = 0, $85 = 0, $850 = 0, $851 = 0, $852 = 0, $853 = 0, $854 = 0, $855 = 0, $856 = 0, $857 = 0, $858 = 0, $859 = 0, $86 = 0, $860 = 0, $861 = 0, $862 = 0, $863 = 0, $864 = 0;
 var $865 = 0, $866 = 0, $867 = 0, $868 = 0, $869 = 0, $87 = 0, $870 = 0, $871 = 0, $872 = 0, $873 = 0, $874 = 0, $875 = 0, $876 = 0, $877 = 0, $878 = 0, $879 = 0, $88 = 0, $880 = 0, $881 = 0, $882 = 0;
 var $883 = 0, $884 = 0, $885 = 0, $886 = 0, $887 = 0, $888 = 0, $889 = 0, $89 = 0, $890 = 0, $891 = 0, $892 = 0, $893 = 0, $894 = 0, $895 = 0, $896 = 0, $897 = 0, $898 = 0, $899 = 0, $9 = 0, $90 = 0;
 var $900 = 0, $901 = 0, $902 = 0, $903 = 0, $904 = 0, $905 = 0, $906 = 0, $907 = 0, $908 = 0, $909 = 0, $91 = 0, $910 = 0, $911 = 0, $912 = 0, $913 = 0, $914 = 0, $915 = 0, $916 = 0, $917 = 0, $918 = 0;
 var $919 = 0, $92 = 0, $920 = 0, $921 = 0, $922 = 0, $923 = 0, $924 = 0, $925 = 0, $926 = 0, $927 = 0, $928 = 0, $929 = 0, $93 = 0, $930 = 0, $931 = 0, $932 = 0, $933 = 0, $934 = 0, $935 = 0, $936 = 0;
 var $937 = 0, $938 = 0, $939 = 0, $94 = 0, $940 = 0, $941 = 0, $942 = 0, $943 = 0, $944 = 0, $945 = 0, $946 = 0, $947 = 0, $948 = 0, $949 = 0, $95 = 0, $950 = 0, $951 = 0, $952 = 0, $953 = 0, $954 = 0;
 var $955 = 0, $956 = 0, $957 = 0, $958 = 0, $959 = 0, $96 = 0, $960 = 0, $961 = 0, $962 = 0, $963 = 0, $964 = 0, $965 = 0, $966 = 0, $967 = 0, $968 = 0, $969 = 0, $97 = 0, $970 = 0, $971 = 0, $972 = 0;
 var $973 = 0, $974 = 0, $975 = 0, $976 = 0, $977 = 0, $978 = 0, $979 = 0, $98 = 0, $980 = 0, $981 = 0, $982 = 0, $983 = 0, $984 = 0, $985 = 0, $986 = 0, $987 = 0, $988 = 0, $989 = 0, $99 = 0, $990 = 0;
 var $991 = 0, $992 = 0, $993 = 0, $994 = 0, $995 = 0, $996 = 0, $997 = 0, $998 = 0, $999 = 0, $F$0$i$i = 0, $F1$0$i = 0, $F4$0 = 0, $F4$0$i$i = 0, $F5$0$i = 0, $I1$0$i$i = 0, $I7$0$i = 0, $I7$0$i$i = 0, $K12$029$i = 0, $K2$07$i$i = 0, $K8$051$i$i = 0;
 var $R$0$i = 0, $R$0$i$i = 0, $R$0$i$i$lcssa = 0, $R$0$i$lcssa = 0, $R$0$i18 = 0, $R$0$i18$lcssa = 0, $R$1$i = 0, $R$1$i$i = 0, $R$1$i20 = 0, $RP$0$i = 0, $RP$0$i$i = 0, $RP$0$i$i$lcssa = 0, $RP$0$i$lcssa = 0, $RP$0$i17 = 0, $RP$0$i17$lcssa = 0, $T$0$lcssa$i = 0, $T$0$lcssa$i$i = 0, $T$0$lcssa$i25$i = 0, $T$028$i = 0, $T$028$i$lcssa = 0;
 var $T$050$i$i = 0, $T$050$i$i$lcssa = 0, $T$06$i$i = 0, $T$06$i$i$lcssa = 0, $br$0$ph$i = 0, $cond$i = 0, $cond$i$i = 0, $cond$i21 = 0, $exitcond$i$i = 0, $i$02$i$i = 0, $idx$0$i = 0, $mem$0 = 0, $nb$0 = 0, $not$$i = 0, $not$$i$i = 0, $not$$i26$i = 0, $oldfirst$0$i$i = 0, $or$cond$i = 0, $or$cond$i30 = 0, $or$cond1$i = 0;
 var $or$cond19$i = 0, $or$cond2$i = 0, $or$cond3$i = 0, $or$cond5$i = 0, $or$cond57$i = 0, $or$cond6$i = 0, $or$cond8$i = 0, $or$cond9$i = 0, $qsize$0$i$i = 0, $rsize$0$i = 0, $rsize$0$i$lcssa = 0, $rsize$0$i15 = 0, $rsize$1$i = 0, $rsize$2$i = 0, $rsize$3$lcssa$i = 0, $rsize$331$i = 0, $rst$0$i = 0, $rst$1$i = 0, $sizebits$0$i = 0, $sp$0$i$i = 0;
 var $sp$0$i$i$i = 0, $sp$084$i = 0, $sp$084$i$lcssa = 0, $sp$183$i = 0, $sp$183$i$lcssa = 0, $ssize$0$$i = 0, $ssize$0$i = 0, $ssize$1$ph$i = 0, $ssize$2$i = 0, $t$0$i = 0, $t$0$i14 = 0, $t$1$i = 0, $t$2$ph$i = 0, $t$2$v$3$i = 0, $t$230$i = 0, $tbase$255$i = 0, $tsize$0$ph$i = 0, $tsize$0323944$i = 0, $tsize$1$i = 0, $tsize$254$i = 0;
 var $v$0$i = 0, $v$0$i$lcssa = 0, $v$0$i16 = 0, $v$1$i = 0, $v$2$i = 0, $v$3$lcssa$i = 0, $v$3$ph$i = 0, $v$332$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($bytes>>>0)<(245);
 do {
  if ($0) {
   $1 = ($bytes>>>0)<(11);
   $2 = (($bytes) + 11)|0;
   $3 = $2 & -8;
   $4 = $1 ? 16 : $3;
   $5 = $4 >>> 3;
   $6 = HEAP32[1752>>2]|0;
   $7 = $6 >>> $5;
   $8 = $7 & 3;
   $9 = ($8|0)==(0);
   if (!($9)) {
    $10 = $7 & 1;
    $11 = $10 ^ 1;
    $12 = (($11) + ($5))|0;
    $13 = $12 << 1;
    $14 = (1792 + ($13<<2)|0);
    $$sum10 = (($13) + 2)|0;
    $15 = (1792 + ($$sum10<<2)|0);
    $16 = HEAP32[$15>>2]|0;
    $17 = ((($16)) + 8|0);
    $18 = HEAP32[$17>>2]|0;
    $19 = ($14|0)==($18|0);
    do {
     if ($19) {
      $20 = 1 << $12;
      $21 = $20 ^ -1;
      $22 = $6 & $21;
      HEAP32[1752>>2] = $22;
     } else {
      $23 = HEAP32[(1768)>>2]|0;
      $24 = ($18>>>0)<($23>>>0);
      if (!($24)) {
       $25 = ((($18)) + 12|0);
       $26 = HEAP32[$25>>2]|0;
       $27 = ($26|0)==($16|0);
       if ($27) {
        HEAP32[$25>>2] = $14;
        HEAP32[$15>>2] = $18;
        break;
       }
      }
      _abort();
      // unreachable;
     }
    } while(0);
    $28 = $12 << 3;
    $29 = $28 | 3;
    $30 = ((($16)) + 4|0);
    HEAP32[$30>>2] = $29;
    $$sum1112 = $28 | 4;
    $31 = (($16) + ($$sum1112)|0);
    $32 = HEAP32[$31>>2]|0;
    $33 = $32 | 1;
    HEAP32[$31>>2] = $33;
    $mem$0 = $17;
    break;
   }
   $34 = HEAP32[(1760)>>2]|0;
   $35 = ($4>>>0)>($34>>>0);
   if ($35) {
    $36 = ($7|0)==(0);
    if (!($36)) {
     $37 = $7 << $5;
     $38 = 2 << $5;
     $39 = (0 - ($38))|0;
     $40 = $38 | $39;
     $41 = $37 & $40;
     $42 = (0 - ($41))|0;
     $43 = $41 & $42;
     $44 = (($43) + -1)|0;
     $45 = $44 >>> 12;
     $46 = $45 & 16;
     $47 = $44 >>> $46;
     $48 = $47 >>> 5;
     $49 = $48 & 8;
     $50 = $49 | $46;
     $51 = $47 >>> $49;
     $52 = $51 >>> 2;
     $53 = $52 & 4;
     $54 = $50 | $53;
     $55 = $51 >>> $53;
     $56 = $55 >>> 1;
     $57 = $56 & 2;
     $58 = $54 | $57;
     $59 = $55 >>> $57;
     $60 = $59 >>> 1;
     $61 = $60 & 1;
     $62 = $58 | $61;
     $63 = $59 >>> $61;
     $64 = (($62) + ($63))|0;
     $65 = $64 << 1;
     $66 = (1792 + ($65<<2)|0);
     $$sum4 = (($65) + 2)|0;
     $67 = (1792 + ($$sum4<<2)|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = ((($68)) + 8|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($66|0)==($70|0);
     do {
      if ($71) {
       $72 = 1 << $64;
       $73 = $72 ^ -1;
       $74 = $6 & $73;
       HEAP32[1752>>2] = $74;
       $88 = $34;
      } else {
       $75 = HEAP32[(1768)>>2]|0;
       $76 = ($70>>>0)<($75>>>0);
       if (!($76)) {
        $77 = ((($70)) + 12|0);
        $78 = HEAP32[$77>>2]|0;
        $79 = ($78|0)==($68|0);
        if ($79) {
         HEAP32[$77>>2] = $66;
         HEAP32[$67>>2] = $70;
         $$pre = HEAP32[(1760)>>2]|0;
         $88 = $$pre;
         break;
        }
       }
       _abort();
       // unreachable;
      }
     } while(0);
     $80 = $64 << 3;
     $81 = (($80) - ($4))|0;
     $82 = $4 | 3;
     $83 = ((($68)) + 4|0);
     HEAP32[$83>>2] = $82;
     $84 = (($68) + ($4)|0);
     $85 = $81 | 1;
     $$sum56 = $4 | 4;
     $86 = (($68) + ($$sum56)|0);
     HEAP32[$86>>2] = $85;
     $87 = (($68) + ($80)|0);
     HEAP32[$87>>2] = $81;
     $89 = ($88|0)==(0);
     if (!($89)) {
      $90 = HEAP32[(1772)>>2]|0;
      $91 = $88 >>> 3;
      $92 = $91 << 1;
      $93 = (1792 + ($92<<2)|0);
      $94 = HEAP32[1752>>2]|0;
      $95 = 1 << $91;
      $96 = $94 & $95;
      $97 = ($96|0)==(0);
      if ($97) {
       $98 = $94 | $95;
       HEAP32[1752>>2] = $98;
       $$pre105 = (($92) + 2)|0;
       $$pre106 = (1792 + ($$pre105<<2)|0);
       $$pre$phiZ2D = $$pre106;$F4$0 = $93;
      } else {
       $$sum9 = (($92) + 2)|0;
       $99 = (1792 + ($$sum9<<2)|0);
       $100 = HEAP32[$99>>2]|0;
       $101 = HEAP32[(1768)>>2]|0;
       $102 = ($100>>>0)<($101>>>0);
       if ($102) {
        _abort();
        // unreachable;
       } else {
        $$pre$phiZ2D = $99;$F4$0 = $100;
       }
      }
      HEAP32[$$pre$phiZ2D>>2] = $90;
      $103 = ((($F4$0)) + 12|0);
      HEAP32[$103>>2] = $90;
      $104 = ((($90)) + 8|0);
      HEAP32[$104>>2] = $F4$0;
      $105 = ((($90)) + 12|0);
      HEAP32[$105>>2] = $93;
     }
     HEAP32[(1760)>>2] = $81;
     HEAP32[(1772)>>2] = $84;
     $mem$0 = $69;
     break;
    }
    $106 = HEAP32[(1756)>>2]|0;
    $107 = ($106|0)==(0);
    if ($107) {
     $nb$0 = $4;
     label = 154;
    } else {
     $108 = (0 - ($106))|0;
     $109 = $106 & $108;
     $110 = (($109) + -1)|0;
     $111 = $110 >>> 12;
     $112 = $111 & 16;
     $113 = $110 >>> $112;
     $114 = $113 >>> 5;
     $115 = $114 & 8;
     $116 = $115 | $112;
     $117 = $113 >>> $115;
     $118 = $117 >>> 2;
     $119 = $118 & 4;
     $120 = $116 | $119;
     $121 = $117 >>> $119;
     $122 = $121 >>> 1;
     $123 = $122 & 2;
     $124 = $120 | $123;
     $125 = $121 >>> $123;
     $126 = $125 >>> 1;
     $127 = $126 & 1;
     $128 = $124 | $127;
     $129 = $125 >>> $127;
     $130 = (($128) + ($129))|0;
     $131 = (2056 + ($130<<2)|0);
     $132 = HEAP32[$131>>2]|0;
     $133 = ((($132)) + 4|0);
     $134 = HEAP32[$133>>2]|0;
     $135 = $134 & -8;
     $136 = (($135) - ($4))|0;
     $rsize$0$i = $136;$t$0$i = $132;$v$0$i = $132;
     while(1) {
      $137 = ((($t$0$i)) + 16|0);
      $138 = HEAP32[$137>>2]|0;
      $139 = ($138|0)==(0|0);
      if ($139) {
       $140 = ((($t$0$i)) + 20|0);
       $141 = HEAP32[$140>>2]|0;
       $142 = ($141|0)==(0|0);
       if ($142) {
        $rsize$0$i$lcssa = $rsize$0$i;$v$0$i$lcssa = $v$0$i;
        break;
       } else {
        $144 = $141;
       }
      } else {
       $144 = $138;
      }
      $143 = ((($144)) + 4|0);
      $145 = HEAP32[$143>>2]|0;
      $146 = $145 & -8;
      $147 = (($146) - ($4))|0;
      $148 = ($147>>>0)<($rsize$0$i>>>0);
      $$rsize$0$i = $148 ? $147 : $rsize$0$i;
      $$v$0$i = $148 ? $144 : $v$0$i;
      $rsize$0$i = $$rsize$0$i;$t$0$i = $144;$v$0$i = $$v$0$i;
     }
     $149 = HEAP32[(1768)>>2]|0;
     $150 = ($v$0$i$lcssa>>>0)<($149>>>0);
     if (!($150)) {
      $151 = (($v$0$i$lcssa) + ($4)|0);
      $152 = ($v$0$i$lcssa>>>0)<($151>>>0);
      if ($152) {
       $153 = ((($v$0$i$lcssa)) + 24|0);
       $154 = HEAP32[$153>>2]|0;
       $155 = ((($v$0$i$lcssa)) + 12|0);
       $156 = HEAP32[$155>>2]|0;
       $157 = ($156|0)==($v$0$i$lcssa|0);
       do {
        if ($157) {
         $167 = ((($v$0$i$lcssa)) + 20|0);
         $168 = HEAP32[$167>>2]|0;
         $169 = ($168|0)==(0|0);
         if ($169) {
          $170 = ((($v$0$i$lcssa)) + 16|0);
          $171 = HEAP32[$170>>2]|0;
          $172 = ($171|0)==(0|0);
          if ($172) {
           $R$1$i = 0;
           break;
          } else {
           $R$0$i = $171;$RP$0$i = $170;
          }
         } else {
          $R$0$i = $168;$RP$0$i = $167;
         }
         while(1) {
          $173 = ((($R$0$i)) + 20|0);
          $174 = HEAP32[$173>>2]|0;
          $175 = ($174|0)==(0|0);
          if (!($175)) {
           $R$0$i = $174;$RP$0$i = $173;
           continue;
          }
          $176 = ((($R$0$i)) + 16|0);
          $177 = HEAP32[$176>>2]|0;
          $178 = ($177|0)==(0|0);
          if ($178) {
           $R$0$i$lcssa = $R$0$i;$RP$0$i$lcssa = $RP$0$i;
           break;
          } else {
           $R$0$i = $177;$RP$0$i = $176;
          }
         }
         $179 = ($RP$0$i$lcssa>>>0)<($149>>>0);
         if ($179) {
          _abort();
          // unreachable;
         } else {
          HEAP32[$RP$0$i$lcssa>>2] = 0;
          $R$1$i = $R$0$i$lcssa;
          break;
         }
        } else {
         $158 = ((($v$0$i$lcssa)) + 8|0);
         $159 = HEAP32[$158>>2]|0;
         $160 = ($159>>>0)<($149>>>0);
         if (!($160)) {
          $161 = ((($159)) + 12|0);
          $162 = HEAP32[$161>>2]|0;
          $163 = ($162|0)==($v$0$i$lcssa|0);
          if ($163) {
           $164 = ((($156)) + 8|0);
           $165 = HEAP32[$164>>2]|0;
           $166 = ($165|0)==($v$0$i$lcssa|0);
           if ($166) {
            HEAP32[$161>>2] = $156;
            HEAP32[$164>>2] = $159;
            $R$1$i = $156;
            break;
           }
          }
         }
         _abort();
         // unreachable;
        }
       } while(0);
       $180 = ($154|0)==(0|0);
       do {
        if (!($180)) {
         $181 = ((($v$0$i$lcssa)) + 28|0);
         $182 = HEAP32[$181>>2]|0;
         $183 = (2056 + ($182<<2)|0);
         $184 = HEAP32[$183>>2]|0;
         $185 = ($v$0$i$lcssa|0)==($184|0);
         if ($185) {
          HEAP32[$183>>2] = $R$1$i;
          $cond$i = ($R$1$i|0)==(0|0);
          if ($cond$i) {
           $186 = 1 << $182;
           $187 = $186 ^ -1;
           $188 = HEAP32[(1756)>>2]|0;
           $189 = $188 & $187;
           HEAP32[(1756)>>2] = $189;
           break;
          }
         } else {
          $190 = HEAP32[(1768)>>2]|0;
          $191 = ($154>>>0)<($190>>>0);
          if ($191) {
           _abort();
           // unreachable;
          }
          $192 = ((($154)) + 16|0);
          $193 = HEAP32[$192>>2]|0;
          $194 = ($193|0)==($v$0$i$lcssa|0);
          if ($194) {
           HEAP32[$192>>2] = $R$1$i;
          } else {
           $195 = ((($154)) + 20|0);
           HEAP32[$195>>2] = $R$1$i;
          }
          $196 = ($R$1$i|0)==(0|0);
          if ($196) {
           break;
          }
         }
         $197 = HEAP32[(1768)>>2]|0;
         $198 = ($R$1$i>>>0)<($197>>>0);
         if ($198) {
          _abort();
          // unreachable;
         }
         $199 = ((($R$1$i)) + 24|0);
         HEAP32[$199>>2] = $154;
         $200 = ((($v$0$i$lcssa)) + 16|0);
         $201 = HEAP32[$200>>2]|0;
         $202 = ($201|0)==(0|0);
         do {
          if (!($202)) {
           $203 = ($201>>>0)<($197>>>0);
           if ($203) {
            _abort();
            // unreachable;
           } else {
            $204 = ((($R$1$i)) + 16|0);
            HEAP32[$204>>2] = $201;
            $205 = ((($201)) + 24|0);
            HEAP32[$205>>2] = $R$1$i;
            break;
           }
          }
         } while(0);
         $206 = ((($v$0$i$lcssa)) + 20|0);
         $207 = HEAP32[$206>>2]|0;
         $208 = ($207|0)==(0|0);
         if (!($208)) {
          $209 = HEAP32[(1768)>>2]|0;
          $210 = ($207>>>0)<($209>>>0);
          if ($210) {
           _abort();
           // unreachable;
          } else {
           $211 = ((($R$1$i)) + 20|0);
           HEAP32[$211>>2] = $207;
           $212 = ((($207)) + 24|0);
           HEAP32[$212>>2] = $R$1$i;
           break;
          }
         }
        }
       } while(0);
       $213 = ($rsize$0$i$lcssa>>>0)<(16);
       if ($213) {
        $214 = (($rsize$0$i$lcssa) + ($4))|0;
        $215 = $214 | 3;
        $216 = ((($v$0$i$lcssa)) + 4|0);
        HEAP32[$216>>2] = $215;
        $$sum4$i = (($214) + 4)|0;
        $217 = (($v$0$i$lcssa) + ($$sum4$i)|0);
        $218 = HEAP32[$217>>2]|0;
        $219 = $218 | 1;
        HEAP32[$217>>2] = $219;
       } else {
        $220 = $4 | 3;
        $221 = ((($v$0$i$lcssa)) + 4|0);
        HEAP32[$221>>2] = $220;
        $222 = $rsize$0$i$lcssa | 1;
        $$sum$i35 = $4 | 4;
        $223 = (($v$0$i$lcssa) + ($$sum$i35)|0);
        HEAP32[$223>>2] = $222;
        $$sum1$i = (($rsize$0$i$lcssa) + ($4))|0;
        $224 = (($v$0$i$lcssa) + ($$sum1$i)|0);
        HEAP32[$224>>2] = $rsize$0$i$lcssa;
        $225 = HEAP32[(1760)>>2]|0;
        $226 = ($225|0)==(0);
        if (!($226)) {
         $227 = HEAP32[(1772)>>2]|0;
         $228 = $225 >>> 3;
         $229 = $228 << 1;
         $230 = (1792 + ($229<<2)|0);
         $231 = HEAP32[1752>>2]|0;
         $232 = 1 << $228;
         $233 = $231 & $232;
         $234 = ($233|0)==(0);
         if ($234) {
          $235 = $231 | $232;
          HEAP32[1752>>2] = $235;
          $$pre$i = (($229) + 2)|0;
          $$pre8$i = (1792 + ($$pre$i<<2)|0);
          $$pre$phi$iZ2D = $$pre8$i;$F1$0$i = $230;
         } else {
          $$sum3$i = (($229) + 2)|0;
          $236 = (1792 + ($$sum3$i<<2)|0);
          $237 = HEAP32[$236>>2]|0;
          $238 = HEAP32[(1768)>>2]|0;
          $239 = ($237>>>0)<($238>>>0);
          if ($239) {
           _abort();
           // unreachable;
          } else {
           $$pre$phi$iZ2D = $236;$F1$0$i = $237;
          }
         }
         HEAP32[$$pre$phi$iZ2D>>2] = $227;
         $240 = ((($F1$0$i)) + 12|0);
         HEAP32[$240>>2] = $227;
         $241 = ((($227)) + 8|0);
         HEAP32[$241>>2] = $F1$0$i;
         $242 = ((($227)) + 12|0);
         HEAP32[$242>>2] = $230;
        }
        HEAP32[(1760)>>2] = $rsize$0$i$lcssa;
        HEAP32[(1772)>>2] = $151;
       }
       $243 = ((($v$0$i$lcssa)) + 8|0);
       $mem$0 = $243;
       break;
      }
     }
     _abort();
     // unreachable;
    }
   } else {
    $nb$0 = $4;
    label = 154;
   }
  } else {
   $244 = ($bytes>>>0)>(4294967231);
   if ($244) {
    $nb$0 = -1;
    label = 154;
   } else {
    $245 = (($bytes) + 11)|0;
    $246 = $245 & -8;
    $247 = HEAP32[(1756)>>2]|0;
    $248 = ($247|0)==(0);
    if ($248) {
     $nb$0 = $246;
     label = 154;
    } else {
     $249 = (0 - ($246))|0;
     $250 = $245 >>> 8;
     $251 = ($250|0)==(0);
     if ($251) {
      $idx$0$i = 0;
     } else {
      $252 = ($246>>>0)>(16777215);
      if ($252) {
       $idx$0$i = 31;
      } else {
       $253 = (($250) + 1048320)|0;
       $254 = $253 >>> 16;
       $255 = $254 & 8;
       $256 = $250 << $255;
       $257 = (($256) + 520192)|0;
       $258 = $257 >>> 16;
       $259 = $258 & 4;
       $260 = $259 | $255;
       $261 = $256 << $259;
       $262 = (($261) + 245760)|0;
       $263 = $262 >>> 16;
       $264 = $263 & 2;
       $265 = $260 | $264;
       $266 = (14 - ($265))|0;
       $267 = $261 << $264;
       $268 = $267 >>> 15;
       $269 = (($266) + ($268))|0;
       $270 = $269 << 1;
       $271 = (($269) + 7)|0;
       $272 = $246 >>> $271;
       $273 = $272 & 1;
       $274 = $273 | $270;
       $idx$0$i = $274;
      }
     }
     $275 = (2056 + ($idx$0$i<<2)|0);
     $276 = HEAP32[$275>>2]|0;
     $277 = ($276|0)==(0|0);
     L110: do {
      if ($277) {
       $rsize$2$i = $249;$t$1$i = 0;$v$2$i = 0;
       label = 86;
      } else {
       $278 = ($idx$0$i|0)==(31);
       $279 = $idx$0$i >>> 1;
       $280 = (25 - ($279))|0;
       $281 = $278 ? 0 : $280;
       $282 = $246 << $281;
       $rsize$0$i15 = $249;$rst$0$i = 0;$sizebits$0$i = $282;$t$0$i14 = $276;$v$0$i16 = 0;
       while(1) {
        $283 = ((($t$0$i14)) + 4|0);
        $284 = HEAP32[$283>>2]|0;
        $285 = $284 & -8;
        $286 = (($285) - ($246))|0;
        $287 = ($286>>>0)<($rsize$0$i15>>>0);
        if ($287) {
         $288 = ($285|0)==($246|0);
         if ($288) {
          $rsize$331$i = $286;$t$230$i = $t$0$i14;$v$332$i = $t$0$i14;
          label = 90;
          break L110;
         } else {
          $rsize$1$i = $286;$v$1$i = $t$0$i14;
         }
        } else {
         $rsize$1$i = $rsize$0$i15;$v$1$i = $v$0$i16;
        }
        $289 = ((($t$0$i14)) + 20|0);
        $290 = HEAP32[$289>>2]|0;
        $291 = $sizebits$0$i >>> 31;
        $292 = (((($t$0$i14)) + 16|0) + ($291<<2)|0);
        $293 = HEAP32[$292>>2]|0;
        $294 = ($290|0)==(0|0);
        $295 = ($290|0)==($293|0);
        $or$cond19$i = $294 | $295;
        $rst$1$i = $or$cond19$i ? $rst$0$i : $290;
        $296 = ($293|0)==(0|0);
        $297 = $sizebits$0$i << 1;
        if ($296) {
         $rsize$2$i = $rsize$1$i;$t$1$i = $rst$1$i;$v$2$i = $v$1$i;
         label = 86;
         break;
        } else {
         $rsize$0$i15 = $rsize$1$i;$rst$0$i = $rst$1$i;$sizebits$0$i = $297;$t$0$i14 = $293;$v$0$i16 = $v$1$i;
        }
       }
      }
     } while(0);
     if ((label|0) == 86) {
      $298 = ($t$1$i|0)==(0|0);
      $299 = ($v$2$i|0)==(0|0);
      $or$cond$i = $298 & $299;
      if ($or$cond$i) {
       $300 = 2 << $idx$0$i;
       $301 = (0 - ($300))|0;
       $302 = $300 | $301;
       $303 = $247 & $302;
       $304 = ($303|0)==(0);
       if ($304) {
        $nb$0 = $246;
        label = 154;
        break;
       }
       $305 = (0 - ($303))|0;
       $306 = $303 & $305;
       $307 = (($306) + -1)|0;
       $308 = $307 >>> 12;
       $309 = $308 & 16;
       $310 = $307 >>> $309;
       $311 = $310 >>> 5;
       $312 = $311 & 8;
       $313 = $312 | $309;
       $314 = $310 >>> $312;
       $315 = $314 >>> 2;
       $316 = $315 & 4;
       $317 = $313 | $316;
       $318 = $314 >>> $316;
       $319 = $318 >>> 1;
       $320 = $319 & 2;
       $321 = $317 | $320;
       $322 = $318 >>> $320;
       $323 = $322 >>> 1;
       $324 = $323 & 1;
       $325 = $321 | $324;
       $326 = $322 >>> $324;
       $327 = (($325) + ($326))|0;
       $328 = (2056 + ($327<<2)|0);
       $329 = HEAP32[$328>>2]|0;
       $t$2$ph$i = $329;$v$3$ph$i = 0;
      } else {
       $t$2$ph$i = $t$1$i;$v$3$ph$i = $v$2$i;
      }
      $330 = ($t$2$ph$i|0)==(0|0);
      if ($330) {
       $rsize$3$lcssa$i = $rsize$2$i;$v$3$lcssa$i = $v$3$ph$i;
      } else {
       $rsize$331$i = $rsize$2$i;$t$230$i = $t$2$ph$i;$v$332$i = $v$3$ph$i;
       label = 90;
      }
     }
     if ((label|0) == 90) {
      while(1) {
       label = 0;
       $331 = ((($t$230$i)) + 4|0);
       $332 = HEAP32[$331>>2]|0;
       $333 = $332 & -8;
       $334 = (($333) - ($246))|0;
       $335 = ($334>>>0)<($rsize$331$i>>>0);
       $$rsize$3$i = $335 ? $334 : $rsize$331$i;
       $t$2$v$3$i = $335 ? $t$230$i : $v$332$i;
       $336 = ((($t$230$i)) + 16|0);
       $337 = HEAP32[$336>>2]|0;
       $338 = ($337|0)==(0|0);
       if (!($338)) {
        $rsize$331$i = $$rsize$3$i;$t$230$i = $337;$v$332$i = $t$2$v$3$i;
        label = 90;
        continue;
       }
       $339 = ((($t$230$i)) + 20|0);
       $340 = HEAP32[$339>>2]|0;
       $341 = ($340|0)==(0|0);
       if ($341) {
        $rsize$3$lcssa$i = $$rsize$3$i;$v$3$lcssa$i = $t$2$v$3$i;
        break;
       } else {
        $rsize$331$i = $$rsize$3$i;$t$230$i = $340;$v$332$i = $t$2$v$3$i;
        label = 90;
       }
      }
     }
     $342 = ($v$3$lcssa$i|0)==(0|0);
     if ($342) {
      $nb$0 = $246;
      label = 154;
     } else {
      $343 = HEAP32[(1760)>>2]|0;
      $344 = (($343) - ($246))|0;
      $345 = ($rsize$3$lcssa$i>>>0)<($344>>>0);
      if ($345) {
       $346 = HEAP32[(1768)>>2]|0;
       $347 = ($v$3$lcssa$i>>>0)<($346>>>0);
       if (!($347)) {
        $348 = (($v$3$lcssa$i) + ($246)|0);
        $349 = ($v$3$lcssa$i>>>0)<($348>>>0);
        if ($349) {
         $350 = ((($v$3$lcssa$i)) + 24|0);
         $351 = HEAP32[$350>>2]|0;
         $352 = ((($v$3$lcssa$i)) + 12|0);
         $353 = HEAP32[$352>>2]|0;
         $354 = ($353|0)==($v$3$lcssa$i|0);
         do {
          if ($354) {
           $364 = ((($v$3$lcssa$i)) + 20|0);
           $365 = HEAP32[$364>>2]|0;
           $366 = ($365|0)==(0|0);
           if ($366) {
            $367 = ((($v$3$lcssa$i)) + 16|0);
            $368 = HEAP32[$367>>2]|0;
            $369 = ($368|0)==(0|0);
            if ($369) {
             $R$1$i20 = 0;
             break;
            } else {
             $R$0$i18 = $368;$RP$0$i17 = $367;
            }
           } else {
            $R$0$i18 = $365;$RP$0$i17 = $364;
           }
           while(1) {
            $370 = ((($R$0$i18)) + 20|0);
            $371 = HEAP32[$370>>2]|0;
            $372 = ($371|0)==(0|0);
            if (!($372)) {
             $R$0$i18 = $371;$RP$0$i17 = $370;
             continue;
            }
            $373 = ((($R$0$i18)) + 16|0);
            $374 = HEAP32[$373>>2]|0;
            $375 = ($374|0)==(0|0);
            if ($375) {
             $R$0$i18$lcssa = $R$0$i18;$RP$0$i17$lcssa = $RP$0$i17;
             break;
            } else {
             $R$0$i18 = $374;$RP$0$i17 = $373;
            }
           }
           $376 = ($RP$0$i17$lcssa>>>0)<($346>>>0);
           if ($376) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$RP$0$i17$lcssa>>2] = 0;
            $R$1$i20 = $R$0$i18$lcssa;
            break;
           }
          } else {
           $355 = ((($v$3$lcssa$i)) + 8|0);
           $356 = HEAP32[$355>>2]|0;
           $357 = ($356>>>0)<($346>>>0);
           if (!($357)) {
            $358 = ((($356)) + 12|0);
            $359 = HEAP32[$358>>2]|0;
            $360 = ($359|0)==($v$3$lcssa$i|0);
            if ($360) {
             $361 = ((($353)) + 8|0);
             $362 = HEAP32[$361>>2]|0;
             $363 = ($362|0)==($v$3$lcssa$i|0);
             if ($363) {
              HEAP32[$358>>2] = $353;
              HEAP32[$361>>2] = $356;
              $R$1$i20 = $353;
              break;
             }
            }
           }
           _abort();
           // unreachable;
          }
         } while(0);
         $377 = ($351|0)==(0|0);
         do {
          if (!($377)) {
           $378 = ((($v$3$lcssa$i)) + 28|0);
           $379 = HEAP32[$378>>2]|0;
           $380 = (2056 + ($379<<2)|0);
           $381 = HEAP32[$380>>2]|0;
           $382 = ($v$3$lcssa$i|0)==($381|0);
           if ($382) {
            HEAP32[$380>>2] = $R$1$i20;
            $cond$i21 = ($R$1$i20|0)==(0|0);
            if ($cond$i21) {
             $383 = 1 << $379;
             $384 = $383 ^ -1;
             $385 = HEAP32[(1756)>>2]|0;
             $386 = $385 & $384;
             HEAP32[(1756)>>2] = $386;
             break;
            }
           } else {
            $387 = HEAP32[(1768)>>2]|0;
            $388 = ($351>>>0)<($387>>>0);
            if ($388) {
             _abort();
             // unreachable;
            }
            $389 = ((($351)) + 16|0);
            $390 = HEAP32[$389>>2]|0;
            $391 = ($390|0)==($v$3$lcssa$i|0);
            if ($391) {
             HEAP32[$389>>2] = $R$1$i20;
            } else {
             $392 = ((($351)) + 20|0);
             HEAP32[$392>>2] = $R$1$i20;
            }
            $393 = ($R$1$i20|0)==(0|0);
            if ($393) {
             break;
            }
           }
           $394 = HEAP32[(1768)>>2]|0;
           $395 = ($R$1$i20>>>0)<($394>>>0);
           if ($395) {
            _abort();
            // unreachable;
           }
           $396 = ((($R$1$i20)) + 24|0);
           HEAP32[$396>>2] = $351;
           $397 = ((($v$3$lcssa$i)) + 16|0);
           $398 = HEAP32[$397>>2]|0;
           $399 = ($398|0)==(0|0);
           do {
            if (!($399)) {
             $400 = ($398>>>0)<($394>>>0);
             if ($400) {
              _abort();
              // unreachable;
             } else {
              $401 = ((($R$1$i20)) + 16|0);
              HEAP32[$401>>2] = $398;
              $402 = ((($398)) + 24|0);
              HEAP32[$402>>2] = $R$1$i20;
              break;
             }
            }
           } while(0);
           $403 = ((($v$3$lcssa$i)) + 20|0);
           $404 = HEAP32[$403>>2]|0;
           $405 = ($404|0)==(0|0);
           if (!($405)) {
            $406 = HEAP32[(1768)>>2]|0;
            $407 = ($404>>>0)<($406>>>0);
            if ($407) {
             _abort();
             // unreachable;
            } else {
             $408 = ((($R$1$i20)) + 20|0);
             HEAP32[$408>>2] = $404;
             $409 = ((($404)) + 24|0);
             HEAP32[$409>>2] = $R$1$i20;
             break;
            }
           }
          }
         } while(0);
         $410 = ($rsize$3$lcssa$i>>>0)<(16);
         L179: do {
          if ($410) {
           $411 = (($rsize$3$lcssa$i) + ($246))|0;
           $412 = $411 | 3;
           $413 = ((($v$3$lcssa$i)) + 4|0);
           HEAP32[$413>>2] = $412;
           $$sum18$i = (($411) + 4)|0;
           $414 = (($v$3$lcssa$i) + ($$sum18$i)|0);
           $415 = HEAP32[$414>>2]|0;
           $416 = $415 | 1;
           HEAP32[$414>>2] = $416;
          } else {
           $417 = $246 | 3;
           $418 = ((($v$3$lcssa$i)) + 4|0);
           HEAP32[$418>>2] = $417;
           $419 = $rsize$3$lcssa$i | 1;
           $$sum$i2334 = $246 | 4;
           $420 = (($v$3$lcssa$i) + ($$sum$i2334)|0);
           HEAP32[$420>>2] = $419;
           $$sum1$i24 = (($rsize$3$lcssa$i) + ($246))|0;
           $421 = (($v$3$lcssa$i) + ($$sum1$i24)|0);
           HEAP32[$421>>2] = $rsize$3$lcssa$i;
           $422 = $rsize$3$lcssa$i >>> 3;
           $423 = ($rsize$3$lcssa$i>>>0)<(256);
           if ($423) {
            $424 = $422 << 1;
            $425 = (1792 + ($424<<2)|0);
            $426 = HEAP32[1752>>2]|0;
            $427 = 1 << $422;
            $428 = $426 & $427;
            $429 = ($428|0)==(0);
            if ($429) {
             $430 = $426 | $427;
             HEAP32[1752>>2] = $430;
             $$pre$i25 = (($424) + 2)|0;
             $$pre43$i = (1792 + ($$pre$i25<<2)|0);
             $$pre$phi$i26Z2D = $$pre43$i;$F5$0$i = $425;
            } else {
             $$sum17$i = (($424) + 2)|0;
             $431 = (1792 + ($$sum17$i<<2)|0);
             $432 = HEAP32[$431>>2]|0;
             $433 = HEAP32[(1768)>>2]|0;
             $434 = ($432>>>0)<($433>>>0);
             if ($434) {
              _abort();
              // unreachable;
             } else {
              $$pre$phi$i26Z2D = $431;$F5$0$i = $432;
             }
            }
            HEAP32[$$pre$phi$i26Z2D>>2] = $348;
            $435 = ((($F5$0$i)) + 12|0);
            HEAP32[$435>>2] = $348;
            $$sum15$i = (($246) + 8)|0;
            $436 = (($v$3$lcssa$i) + ($$sum15$i)|0);
            HEAP32[$436>>2] = $F5$0$i;
            $$sum16$i = (($246) + 12)|0;
            $437 = (($v$3$lcssa$i) + ($$sum16$i)|0);
            HEAP32[$437>>2] = $425;
            break;
           }
           $438 = $rsize$3$lcssa$i >>> 8;
           $439 = ($438|0)==(0);
           if ($439) {
            $I7$0$i = 0;
           } else {
            $440 = ($rsize$3$lcssa$i>>>0)>(16777215);
            if ($440) {
             $I7$0$i = 31;
            } else {
             $441 = (($438) + 1048320)|0;
             $442 = $441 >>> 16;
             $443 = $442 & 8;
             $444 = $438 << $443;
             $445 = (($444) + 520192)|0;
             $446 = $445 >>> 16;
             $447 = $446 & 4;
             $448 = $447 | $443;
             $449 = $444 << $447;
             $450 = (($449) + 245760)|0;
             $451 = $450 >>> 16;
             $452 = $451 & 2;
             $453 = $448 | $452;
             $454 = (14 - ($453))|0;
             $455 = $449 << $452;
             $456 = $455 >>> 15;
             $457 = (($454) + ($456))|0;
             $458 = $457 << 1;
             $459 = (($457) + 7)|0;
             $460 = $rsize$3$lcssa$i >>> $459;
             $461 = $460 & 1;
             $462 = $461 | $458;
             $I7$0$i = $462;
            }
           }
           $463 = (2056 + ($I7$0$i<<2)|0);
           $$sum2$i = (($246) + 28)|0;
           $464 = (($v$3$lcssa$i) + ($$sum2$i)|0);
           HEAP32[$464>>2] = $I7$0$i;
           $$sum3$i27 = (($246) + 16)|0;
           $465 = (($v$3$lcssa$i) + ($$sum3$i27)|0);
           $$sum4$i28 = (($246) + 20)|0;
           $466 = (($v$3$lcssa$i) + ($$sum4$i28)|0);
           HEAP32[$466>>2] = 0;
           HEAP32[$465>>2] = 0;
           $467 = HEAP32[(1756)>>2]|0;
           $468 = 1 << $I7$0$i;
           $469 = $467 & $468;
           $470 = ($469|0)==(0);
           if ($470) {
            $471 = $467 | $468;
            HEAP32[(1756)>>2] = $471;
            HEAP32[$463>>2] = $348;
            $$sum5$i = (($246) + 24)|0;
            $472 = (($v$3$lcssa$i) + ($$sum5$i)|0);
            HEAP32[$472>>2] = $463;
            $$sum6$i = (($246) + 12)|0;
            $473 = (($v$3$lcssa$i) + ($$sum6$i)|0);
            HEAP32[$473>>2] = $348;
            $$sum7$i = (($246) + 8)|0;
            $474 = (($v$3$lcssa$i) + ($$sum7$i)|0);
            HEAP32[$474>>2] = $348;
            break;
           }
           $475 = HEAP32[$463>>2]|0;
           $476 = ((($475)) + 4|0);
           $477 = HEAP32[$476>>2]|0;
           $478 = $477 & -8;
           $479 = ($478|0)==($rsize$3$lcssa$i|0);
           L197: do {
            if ($479) {
             $T$0$lcssa$i = $475;
            } else {
             $480 = ($I7$0$i|0)==(31);
             $481 = $I7$0$i >>> 1;
             $482 = (25 - ($481))|0;
             $483 = $480 ? 0 : $482;
             $484 = $rsize$3$lcssa$i << $483;
             $K12$029$i = $484;$T$028$i = $475;
             while(1) {
              $491 = $K12$029$i >>> 31;
              $492 = (((($T$028$i)) + 16|0) + ($491<<2)|0);
              $487 = HEAP32[$492>>2]|0;
              $493 = ($487|0)==(0|0);
              if ($493) {
               $$lcssa232 = $492;$T$028$i$lcssa = $T$028$i;
               break;
              }
              $485 = $K12$029$i << 1;
              $486 = ((($487)) + 4|0);
              $488 = HEAP32[$486>>2]|0;
              $489 = $488 & -8;
              $490 = ($489|0)==($rsize$3$lcssa$i|0);
              if ($490) {
               $T$0$lcssa$i = $487;
               break L197;
              } else {
               $K12$029$i = $485;$T$028$i = $487;
              }
             }
             $494 = HEAP32[(1768)>>2]|0;
             $495 = ($$lcssa232>>>0)<($494>>>0);
             if ($495) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$$lcssa232>>2] = $348;
              $$sum11$i = (($246) + 24)|0;
              $496 = (($v$3$lcssa$i) + ($$sum11$i)|0);
              HEAP32[$496>>2] = $T$028$i$lcssa;
              $$sum12$i = (($246) + 12)|0;
              $497 = (($v$3$lcssa$i) + ($$sum12$i)|0);
              HEAP32[$497>>2] = $348;
              $$sum13$i = (($246) + 8)|0;
              $498 = (($v$3$lcssa$i) + ($$sum13$i)|0);
              HEAP32[$498>>2] = $348;
              break L179;
             }
            }
           } while(0);
           $499 = ((($T$0$lcssa$i)) + 8|0);
           $500 = HEAP32[$499>>2]|0;
           $501 = HEAP32[(1768)>>2]|0;
           $502 = ($500>>>0)>=($501>>>0);
           $not$$i = ($T$0$lcssa$i>>>0)>=($501>>>0);
           $503 = $502 & $not$$i;
           if ($503) {
            $504 = ((($500)) + 12|0);
            HEAP32[$504>>2] = $348;
            HEAP32[$499>>2] = $348;
            $$sum8$i = (($246) + 8)|0;
            $505 = (($v$3$lcssa$i) + ($$sum8$i)|0);
            HEAP32[$505>>2] = $500;
            $$sum9$i = (($246) + 12)|0;
            $506 = (($v$3$lcssa$i) + ($$sum9$i)|0);
            HEAP32[$506>>2] = $T$0$lcssa$i;
            $$sum10$i = (($246) + 24)|0;
            $507 = (($v$3$lcssa$i) + ($$sum10$i)|0);
            HEAP32[$507>>2] = 0;
            break;
           } else {
            _abort();
            // unreachable;
           }
          }
         } while(0);
         $508 = ((($v$3$lcssa$i)) + 8|0);
         $mem$0 = $508;
         break;
        }
       }
       _abort();
       // unreachable;
      } else {
       $nb$0 = $246;
       label = 154;
      }
     }
    }
   }
  }
 } while(0);
 L212: do {
  if ((label|0) == 154) {
   $509 = HEAP32[(1760)>>2]|0;
   $510 = ($509>>>0)<($nb$0>>>0);
   if (!($510)) {
    $511 = (($509) - ($nb$0))|0;
    $512 = HEAP32[(1772)>>2]|0;
    $513 = ($511>>>0)>(15);
    if ($513) {
     $514 = (($512) + ($nb$0)|0);
     HEAP32[(1772)>>2] = $514;
     HEAP32[(1760)>>2] = $511;
     $515 = $511 | 1;
     $$sum2 = (($nb$0) + 4)|0;
     $516 = (($512) + ($$sum2)|0);
     HEAP32[$516>>2] = $515;
     $517 = (($512) + ($509)|0);
     HEAP32[$517>>2] = $511;
     $518 = $nb$0 | 3;
     $519 = ((($512)) + 4|0);
     HEAP32[$519>>2] = $518;
    } else {
     HEAP32[(1760)>>2] = 0;
     HEAP32[(1772)>>2] = 0;
     $520 = $509 | 3;
     $521 = ((($512)) + 4|0);
     HEAP32[$521>>2] = $520;
     $$sum1 = (($509) + 4)|0;
     $522 = (($512) + ($$sum1)|0);
     $523 = HEAP32[$522>>2]|0;
     $524 = $523 | 1;
     HEAP32[$522>>2] = $524;
    }
    $525 = ((($512)) + 8|0);
    $mem$0 = $525;
    break;
   }
   $526 = HEAP32[(1764)>>2]|0;
   $527 = ($526>>>0)>($nb$0>>>0);
   if ($527) {
    $528 = (($526) - ($nb$0))|0;
    HEAP32[(1764)>>2] = $528;
    $529 = HEAP32[(1776)>>2]|0;
    $530 = (($529) + ($nb$0)|0);
    HEAP32[(1776)>>2] = $530;
    $531 = $528 | 1;
    $$sum = (($nb$0) + 4)|0;
    $532 = (($529) + ($$sum)|0);
    HEAP32[$532>>2] = $531;
    $533 = $nb$0 | 3;
    $534 = ((($529)) + 4|0);
    HEAP32[$534>>2] = $533;
    $535 = ((($529)) + 8|0);
    $mem$0 = $535;
    break;
   }
   $536 = HEAP32[2224>>2]|0;
   $537 = ($536|0)==(0);
   if ($537) {
    _init_mparams();
   }
   $538 = (($nb$0) + 48)|0;
   $539 = HEAP32[(2232)>>2]|0;
   $540 = (($nb$0) + 47)|0;
   $541 = (($539) + ($540))|0;
   $542 = (0 - ($539))|0;
   $543 = $541 & $542;
   $544 = ($543>>>0)>($nb$0>>>0);
   if ($544) {
    $545 = HEAP32[(2192)>>2]|0;
    $546 = ($545|0)==(0);
    if (!($546)) {
     $547 = HEAP32[(2184)>>2]|0;
     $548 = (($547) + ($543))|0;
     $549 = ($548>>>0)<=($547>>>0);
     $550 = ($548>>>0)>($545>>>0);
     $or$cond1$i = $549 | $550;
     if ($or$cond1$i) {
      $mem$0 = 0;
      break;
     }
    }
    $551 = HEAP32[(2196)>>2]|0;
    $552 = $551 & 4;
    $553 = ($552|0)==(0);
    L231: do {
     if ($553) {
      $554 = HEAP32[(1776)>>2]|0;
      $555 = ($554|0)==(0|0);
      L233: do {
       if ($555) {
        label = 172;
       } else {
        $sp$0$i$i = (2200);
        while(1) {
         $556 = HEAP32[$sp$0$i$i>>2]|0;
         $557 = ($556>>>0)>($554>>>0);
         if (!($557)) {
          $558 = ((($sp$0$i$i)) + 4|0);
          $559 = HEAP32[$558>>2]|0;
          $560 = (($556) + ($559)|0);
          $561 = ($560>>>0)>($554>>>0);
          if ($561) {
           $$lcssa228 = $sp$0$i$i;$$lcssa230 = $558;
           break;
          }
         }
         $562 = ((($sp$0$i$i)) + 8|0);
         $563 = HEAP32[$562>>2]|0;
         $564 = ($563|0)==(0|0);
         if ($564) {
          label = 172;
          break L233;
         } else {
          $sp$0$i$i = $563;
         }
        }
        $587 = HEAP32[(1764)>>2]|0;
        $588 = (($541) - ($587))|0;
        $589 = $588 & $542;
        $590 = ($589>>>0)<(2147483647);
        if ($590) {
         $591 = (_sbrk(($589|0))|0);
         $592 = HEAP32[$$lcssa228>>2]|0;
         $593 = HEAP32[$$lcssa230>>2]|0;
         $594 = (($592) + ($593)|0);
         $595 = ($591|0)==($594|0);
         $$3$i = $595 ? $589 : 0;
         if ($595) {
          $596 = ($591|0)==((-1)|0);
          if ($596) {
           $tsize$0323944$i = $$3$i;
          } else {
           $tbase$255$i = $591;$tsize$254$i = $$3$i;
           label = 192;
           break L231;
          }
         } else {
          $br$0$ph$i = $591;$ssize$1$ph$i = $589;$tsize$0$ph$i = $$3$i;
          label = 182;
         }
        } else {
         $tsize$0323944$i = 0;
        }
       }
      } while(0);
      do {
       if ((label|0) == 172) {
        $565 = (_sbrk(0)|0);
        $566 = ($565|0)==((-1)|0);
        if ($566) {
         $tsize$0323944$i = 0;
        } else {
         $567 = $565;
         $568 = HEAP32[(2228)>>2]|0;
         $569 = (($568) + -1)|0;
         $570 = $569 & $567;
         $571 = ($570|0)==(0);
         if ($571) {
          $ssize$0$i = $543;
         } else {
          $572 = (($569) + ($567))|0;
          $573 = (0 - ($568))|0;
          $574 = $572 & $573;
          $575 = (($543) - ($567))|0;
          $576 = (($575) + ($574))|0;
          $ssize$0$i = $576;
         }
         $577 = HEAP32[(2184)>>2]|0;
         $578 = (($577) + ($ssize$0$i))|0;
         $579 = ($ssize$0$i>>>0)>($nb$0>>>0);
         $580 = ($ssize$0$i>>>0)<(2147483647);
         $or$cond$i30 = $579 & $580;
         if ($or$cond$i30) {
          $581 = HEAP32[(2192)>>2]|0;
          $582 = ($581|0)==(0);
          if (!($582)) {
           $583 = ($578>>>0)<=($577>>>0);
           $584 = ($578>>>0)>($581>>>0);
           $or$cond2$i = $583 | $584;
           if ($or$cond2$i) {
            $tsize$0323944$i = 0;
            break;
           }
          }
          $585 = (_sbrk(($ssize$0$i|0))|0);
          $586 = ($585|0)==($565|0);
          $ssize$0$$i = $586 ? $ssize$0$i : 0;
          if ($586) {
           $tbase$255$i = $565;$tsize$254$i = $ssize$0$$i;
           label = 192;
           break L231;
          } else {
           $br$0$ph$i = $585;$ssize$1$ph$i = $ssize$0$i;$tsize$0$ph$i = $ssize$0$$i;
           label = 182;
          }
         } else {
          $tsize$0323944$i = 0;
         }
        }
       }
      } while(0);
      L253: do {
       if ((label|0) == 182) {
        $597 = (0 - ($ssize$1$ph$i))|0;
        $598 = ($br$0$ph$i|0)!=((-1)|0);
        $599 = ($ssize$1$ph$i>>>0)<(2147483647);
        $or$cond5$i = $599 & $598;
        $600 = ($538>>>0)>($ssize$1$ph$i>>>0);
        $or$cond6$i = $600 & $or$cond5$i;
        do {
         if ($or$cond6$i) {
          $601 = HEAP32[(2232)>>2]|0;
          $602 = (($540) - ($ssize$1$ph$i))|0;
          $603 = (($602) + ($601))|0;
          $604 = (0 - ($601))|0;
          $605 = $603 & $604;
          $606 = ($605>>>0)<(2147483647);
          if ($606) {
           $607 = (_sbrk(($605|0))|0);
           $608 = ($607|0)==((-1)|0);
           if ($608) {
            (_sbrk(($597|0))|0);
            $tsize$0323944$i = $tsize$0$ph$i;
            break L253;
           } else {
            $609 = (($605) + ($ssize$1$ph$i))|0;
            $ssize$2$i = $609;
            break;
           }
          } else {
           $ssize$2$i = $ssize$1$ph$i;
          }
         } else {
          $ssize$2$i = $ssize$1$ph$i;
         }
        } while(0);
        $610 = ($br$0$ph$i|0)==((-1)|0);
        if ($610) {
         $tsize$0323944$i = $tsize$0$ph$i;
        } else {
         $tbase$255$i = $br$0$ph$i;$tsize$254$i = $ssize$2$i;
         label = 192;
         break L231;
        }
       }
      } while(0);
      $611 = HEAP32[(2196)>>2]|0;
      $612 = $611 | 4;
      HEAP32[(2196)>>2] = $612;
      $tsize$1$i = $tsize$0323944$i;
      label = 189;
     } else {
      $tsize$1$i = 0;
      label = 189;
     }
    } while(0);
    if ((label|0) == 189) {
     $613 = ($543>>>0)<(2147483647);
     if ($613) {
      $614 = (_sbrk(($543|0))|0);
      $615 = (_sbrk(0)|0);
      $616 = ($614|0)!=((-1)|0);
      $617 = ($615|0)!=((-1)|0);
      $or$cond3$i = $616 & $617;
      $618 = ($614>>>0)<($615>>>0);
      $or$cond8$i = $618 & $or$cond3$i;
      if ($or$cond8$i) {
       $619 = $615;
       $620 = $614;
       $621 = (($619) - ($620))|0;
       $622 = (($nb$0) + 40)|0;
       $623 = ($621>>>0)>($622>>>0);
       $$tsize$1$i = $623 ? $621 : $tsize$1$i;
       if ($623) {
        $tbase$255$i = $614;$tsize$254$i = $$tsize$1$i;
        label = 192;
       }
      }
     }
    }
    if ((label|0) == 192) {
     $624 = HEAP32[(2184)>>2]|0;
     $625 = (($624) + ($tsize$254$i))|0;
     HEAP32[(2184)>>2] = $625;
     $626 = HEAP32[(2188)>>2]|0;
     $627 = ($625>>>0)>($626>>>0);
     if ($627) {
      HEAP32[(2188)>>2] = $625;
     }
     $628 = HEAP32[(1776)>>2]|0;
     $629 = ($628|0)==(0|0);
     L272: do {
      if ($629) {
       $630 = HEAP32[(1768)>>2]|0;
       $631 = ($630|0)==(0|0);
       $632 = ($tbase$255$i>>>0)<($630>>>0);
       $or$cond9$i = $631 | $632;
       if ($or$cond9$i) {
        HEAP32[(1768)>>2] = $tbase$255$i;
       }
       HEAP32[(2200)>>2] = $tbase$255$i;
       HEAP32[(2204)>>2] = $tsize$254$i;
       HEAP32[(2212)>>2] = 0;
       $633 = HEAP32[2224>>2]|0;
       HEAP32[(1788)>>2] = $633;
       HEAP32[(1784)>>2] = -1;
       $i$02$i$i = 0;
       while(1) {
        $634 = $i$02$i$i << 1;
        $635 = (1792 + ($634<<2)|0);
        $$sum$i13$i = (($634) + 3)|0;
        $636 = (1792 + ($$sum$i13$i<<2)|0);
        HEAP32[$636>>2] = $635;
        $$sum1$i14$i = (($634) + 2)|0;
        $637 = (1792 + ($$sum1$i14$i<<2)|0);
        HEAP32[$637>>2] = $635;
        $638 = (($i$02$i$i) + 1)|0;
        $exitcond$i$i = ($638|0)==(32);
        if ($exitcond$i$i) {
         break;
        } else {
         $i$02$i$i = $638;
        }
       }
       $639 = (($tsize$254$i) + -40)|0;
       $640 = ((($tbase$255$i)) + 8|0);
       $641 = $640;
       $642 = $641 & 7;
       $643 = ($642|0)==(0);
       $644 = (0 - ($641))|0;
       $645 = $644 & 7;
       $646 = $643 ? 0 : $645;
       $647 = (($tbase$255$i) + ($646)|0);
       $648 = (($639) - ($646))|0;
       HEAP32[(1776)>>2] = $647;
       HEAP32[(1764)>>2] = $648;
       $649 = $648 | 1;
       $$sum$i15$i = (($646) + 4)|0;
       $650 = (($tbase$255$i) + ($$sum$i15$i)|0);
       HEAP32[$650>>2] = $649;
       $$sum2$i16$i = (($tsize$254$i) + -36)|0;
       $651 = (($tbase$255$i) + ($$sum2$i16$i)|0);
       HEAP32[$651>>2] = 40;
       $652 = HEAP32[(2240)>>2]|0;
       HEAP32[(1780)>>2] = $652;
      } else {
       $sp$084$i = (2200);
       while(1) {
        $653 = HEAP32[$sp$084$i>>2]|0;
        $654 = ((($sp$084$i)) + 4|0);
        $655 = HEAP32[$654>>2]|0;
        $656 = (($653) + ($655)|0);
        $657 = ($tbase$255$i|0)==($656|0);
        if ($657) {
         $$lcssa222 = $653;$$lcssa224 = $654;$$lcssa226 = $655;$sp$084$i$lcssa = $sp$084$i;
         label = 202;
         break;
        }
        $658 = ((($sp$084$i)) + 8|0);
        $659 = HEAP32[$658>>2]|0;
        $660 = ($659|0)==(0|0);
        if ($660) {
         break;
        } else {
         $sp$084$i = $659;
        }
       }
       if ((label|0) == 202) {
        $661 = ((($sp$084$i$lcssa)) + 12|0);
        $662 = HEAP32[$661>>2]|0;
        $663 = $662 & 8;
        $664 = ($663|0)==(0);
        if ($664) {
         $665 = ($628>>>0)>=($$lcssa222>>>0);
         $666 = ($628>>>0)<($tbase$255$i>>>0);
         $or$cond57$i = $666 & $665;
         if ($or$cond57$i) {
          $667 = (($$lcssa226) + ($tsize$254$i))|0;
          HEAP32[$$lcssa224>>2] = $667;
          $668 = HEAP32[(1764)>>2]|0;
          $669 = (($668) + ($tsize$254$i))|0;
          $670 = ((($628)) + 8|0);
          $671 = $670;
          $672 = $671 & 7;
          $673 = ($672|0)==(0);
          $674 = (0 - ($671))|0;
          $675 = $674 & 7;
          $676 = $673 ? 0 : $675;
          $677 = (($628) + ($676)|0);
          $678 = (($669) - ($676))|0;
          HEAP32[(1776)>>2] = $677;
          HEAP32[(1764)>>2] = $678;
          $679 = $678 | 1;
          $$sum$i17$i = (($676) + 4)|0;
          $680 = (($628) + ($$sum$i17$i)|0);
          HEAP32[$680>>2] = $679;
          $$sum2$i18$i = (($669) + 4)|0;
          $681 = (($628) + ($$sum2$i18$i)|0);
          HEAP32[$681>>2] = 40;
          $682 = HEAP32[(2240)>>2]|0;
          HEAP32[(1780)>>2] = $682;
          break;
         }
        }
       }
       $683 = HEAP32[(1768)>>2]|0;
       $684 = ($tbase$255$i>>>0)<($683>>>0);
       if ($684) {
        HEAP32[(1768)>>2] = $tbase$255$i;
        $748 = $tbase$255$i;
       } else {
        $748 = $683;
       }
       $685 = (($tbase$255$i) + ($tsize$254$i)|0);
       $sp$183$i = (2200);
       while(1) {
        $686 = HEAP32[$sp$183$i>>2]|0;
        $687 = ($686|0)==($685|0);
        if ($687) {
         $$lcssa219 = $sp$183$i;$sp$183$i$lcssa = $sp$183$i;
         label = 210;
         break;
        }
        $688 = ((($sp$183$i)) + 8|0);
        $689 = HEAP32[$688>>2]|0;
        $690 = ($689|0)==(0|0);
        if ($690) {
         $sp$0$i$i$i = (2200);
         break;
        } else {
         $sp$183$i = $689;
        }
       }
       if ((label|0) == 210) {
        $691 = ((($sp$183$i$lcssa)) + 12|0);
        $692 = HEAP32[$691>>2]|0;
        $693 = $692 & 8;
        $694 = ($693|0)==(0);
        if ($694) {
         HEAP32[$$lcssa219>>2] = $tbase$255$i;
         $695 = ((($sp$183$i$lcssa)) + 4|0);
         $696 = HEAP32[$695>>2]|0;
         $697 = (($696) + ($tsize$254$i))|0;
         HEAP32[$695>>2] = $697;
         $698 = ((($tbase$255$i)) + 8|0);
         $699 = $698;
         $700 = $699 & 7;
         $701 = ($700|0)==(0);
         $702 = (0 - ($699))|0;
         $703 = $702 & 7;
         $704 = $701 ? 0 : $703;
         $705 = (($tbase$255$i) + ($704)|0);
         $$sum112$i = (($tsize$254$i) + 8)|0;
         $706 = (($tbase$255$i) + ($$sum112$i)|0);
         $707 = $706;
         $708 = $707 & 7;
         $709 = ($708|0)==(0);
         $710 = (0 - ($707))|0;
         $711 = $710 & 7;
         $712 = $709 ? 0 : $711;
         $$sum113$i = (($712) + ($tsize$254$i))|0;
         $713 = (($tbase$255$i) + ($$sum113$i)|0);
         $714 = $713;
         $715 = $705;
         $716 = (($714) - ($715))|0;
         $$sum$i19$i = (($704) + ($nb$0))|0;
         $717 = (($tbase$255$i) + ($$sum$i19$i)|0);
         $718 = (($716) - ($nb$0))|0;
         $719 = $nb$0 | 3;
         $$sum1$i20$i = (($704) + 4)|0;
         $720 = (($tbase$255$i) + ($$sum1$i20$i)|0);
         HEAP32[$720>>2] = $719;
         $721 = ($713|0)==($628|0);
         L297: do {
          if ($721) {
           $722 = HEAP32[(1764)>>2]|0;
           $723 = (($722) + ($718))|0;
           HEAP32[(1764)>>2] = $723;
           HEAP32[(1776)>>2] = $717;
           $724 = $723 | 1;
           $$sum42$i$i = (($$sum$i19$i) + 4)|0;
           $725 = (($tbase$255$i) + ($$sum42$i$i)|0);
           HEAP32[$725>>2] = $724;
          } else {
           $726 = HEAP32[(1772)>>2]|0;
           $727 = ($713|0)==($726|0);
           if ($727) {
            $728 = HEAP32[(1760)>>2]|0;
            $729 = (($728) + ($718))|0;
            HEAP32[(1760)>>2] = $729;
            HEAP32[(1772)>>2] = $717;
            $730 = $729 | 1;
            $$sum40$i$i = (($$sum$i19$i) + 4)|0;
            $731 = (($tbase$255$i) + ($$sum40$i$i)|0);
            HEAP32[$731>>2] = $730;
            $$sum41$i$i = (($729) + ($$sum$i19$i))|0;
            $732 = (($tbase$255$i) + ($$sum41$i$i)|0);
            HEAP32[$732>>2] = $729;
            break;
           }
           $$sum2$i21$i = (($tsize$254$i) + 4)|0;
           $$sum114$i = (($$sum2$i21$i) + ($712))|0;
           $733 = (($tbase$255$i) + ($$sum114$i)|0);
           $734 = HEAP32[$733>>2]|0;
           $735 = $734 & 3;
           $736 = ($735|0)==(1);
           if ($736) {
            $737 = $734 & -8;
            $738 = $734 >>> 3;
            $739 = ($734>>>0)<(256);
            L305: do {
             if ($739) {
              $$sum3738$i$i = $712 | 8;
              $$sum124$i = (($$sum3738$i$i) + ($tsize$254$i))|0;
              $740 = (($tbase$255$i) + ($$sum124$i)|0);
              $741 = HEAP32[$740>>2]|0;
              $$sum39$i$i = (($tsize$254$i) + 12)|0;
              $$sum125$i = (($$sum39$i$i) + ($712))|0;
              $742 = (($tbase$255$i) + ($$sum125$i)|0);
              $743 = HEAP32[$742>>2]|0;
              $744 = $738 << 1;
              $745 = (1792 + ($744<<2)|0);
              $746 = ($741|0)==($745|0);
              do {
               if (!($746)) {
                $747 = ($741>>>0)<($748>>>0);
                if (!($747)) {
                 $749 = ((($741)) + 12|0);
                 $750 = HEAP32[$749>>2]|0;
                 $751 = ($750|0)==($713|0);
                 if ($751) {
                  break;
                 }
                }
                _abort();
                // unreachable;
               }
              } while(0);
              $752 = ($743|0)==($741|0);
              if ($752) {
               $753 = 1 << $738;
               $754 = $753 ^ -1;
               $755 = HEAP32[1752>>2]|0;
               $756 = $755 & $754;
               HEAP32[1752>>2] = $756;
               break;
              }
              $757 = ($743|0)==($745|0);
              do {
               if ($757) {
                $$pre57$i$i = ((($743)) + 8|0);
                $$pre$phi58$i$iZ2D = $$pre57$i$i;
               } else {
                $758 = ($743>>>0)<($748>>>0);
                if (!($758)) {
                 $759 = ((($743)) + 8|0);
                 $760 = HEAP32[$759>>2]|0;
                 $761 = ($760|0)==($713|0);
                 if ($761) {
                  $$pre$phi58$i$iZ2D = $759;
                  break;
                 }
                }
                _abort();
                // unreachable;
               }
              } while(0);
              $762 = ((($741)) + 12|0);
              HEAP32[$762>>2] = $743;
              HEAP32[$$pre$phi58$i$iZ2D>>2] = $741;
             } else {
              $$sum34$i$i = $712 | 24;
              $$sum115$i = (($$sum34$i$i) + ($tsize$254$i))|0;
              $763 = (($tbase$255$i) + ($$sum115$i)|0);
              $764 = HEAP32[$763>>2]|0;
              $$sum5$i$i = (($tsize$254$i) + 12)|0;
              $$sum116$i = (($$sum5$i$i) + ($712))|0;
              $765 = (($tbase$255$i) + ($$sum116$i)|0);
              $766 = HEAP32[$765>>2]|0;
              $767 = ($766|0)==($713|0);
              L324: do {
               if ($767) {
                $$sum67$i$i = $712 | 16;
                $$sum122$i = (($$sum2$i21$i) + ($$sum67$i$i))|0;
                $777 = (($tbase$255$i) + ($$sum122$i)|0);
                $778 = HEAP32[$777>>2]|0;
                $779 = ($778|0)==(0|0);
                if ($779) {
                 $$sum123$i = (($$sum67$i$i) + ($tsize$254$i))|0;
                 $780 = (($tbase$255$i) + ($$sum123$i)|0);
                 $781 = HEAP32[$780>>2]|0;
                 $782 = ($781|0)==(0|0);
                 if ($782) {
                  $R$1$i$i = 0;
                  break;
                 } else {
                  $R$0$i$i = $781;$RP$0$i$i = $780;
                 }
                } else {
                 $R$0$i$i = $778;$RP$0$i$i = $777;
                }
                while(1) {
                 $783 = ((($R$0$i$i)) + 20|0);
                 $784 = HEAP32[$783>>2]|0;
                 $785 = ($784|0)==(0|0);
                 if (!($785)) {
                  $R$0$i$i = $784;$RP$0$i$i = $783;
                  continue;
                 }
                 $786 = ((($R$0$i$i)) + 16|0);
                 $787 = HEAP32[$786>>2]|0;
                 $788 = ($787|0)==(0|0);
                 if ($788) {
                  $R$0$i$i$lcssa = $R$0$i$i;$RP$0$i$i$lcssa = $RP$0$i$i;
                  break;
                 } else {
                  $R$0$i$i = $787;$RP$0$i$i = $786;
                 }
                }
                $789 = ($RP$0$i$i$lcssa>>>0)<($748>>>0);
                if ($789) {
                 _abort();
                 // unreachable;
                } else {
                 HEAP32[$RP$0$i$i$lcssa>>2] = 0;
                 $R$1$i$i = $R$0$i$i$lcssa;
                 break;
                }
               } else {
                $$sum3536$i$i = $712 | 8;
                $$sum117$i = (($$sum3536$i$i) + ($tsize$254$i))|0;
                $768 = (($tbase$255$i) + ($$sum117$i)|0);
                $769 = HEAP32[$768>>2]|0;
                $770 = ($769>>>0)<($748>>>0);
                do {
                 if (!($770)) {
                  $771 = ((($769)) + 12|0);
                  $772 = HEAP32[$771>>2]|0;
                  $773 = ($772|0)==($713|0);
                  if (!($773)) {
                   break;
                  }
                  $774 = ((($766)) + 8|0);
                  $775 = HEAP32[$774>>2]|0;
                  $776 = ($775|0)==($713|0);
                  if (!($776)) {
                   break;
                  }
                  HEAP32[$771>>2] = $766;
                  HEAP32[$774>>2] = $769;
                  $R$1$i$i = $766;
                  break L324;
                 }
                } while(0);
                _abort();
                // unreachable;
               }
              } while(0);
              $790 = ($764|0)==(0|0);
              if ($790) {
               break;
              }
              $$sum30$i$i = (($tsize$254$i) + 28)|0;
              $$sum118$i = (($$sum30$i$i) + ($712))|0;
              $791 = (($tbase$255$i) + ($$sum118$i)|0);
              $792 = HEAP32[$791>>2]|0;
              $793 = (2056 + ($792<<2)|0);
              $794 = HEAP32[$793>>2]|0;
              $795 = ($713|0)==($794|0);
              do {
               if ($795) {
                HEAP32[$793>>2] = $R$1$i$i;
                $cond$i$i = ($R$1$i$i|0)==(0|0);
                if (!($cond$i$i)) {
                 break;
                }
                $796 = 1 << $792;
                $797 = $796 ^ -1;
                $798 = HEAP32[(1756)>>2]|0;
                $799 = $798 & $797;
                HEAP32[(1756)>>2] = $799;
                break L305;
               } else {
                $800 = HEAP32[(1768)>>2]|0;
                $801 = ($764>>>0)<($800>>>0);
                if ($801) {
                 _abort();
                 // unreachable;
                }
                $802 = ((($764)) + 16|0);
                $803 = HEAP32[$802>>2]|0;
                $804 = ($803|0)==($713|0);
                if ($804) {
                 HEAP32[$802>>2] = $R$1$i$i;
                } else {
                 $805 = ((($764)) + 20|0);
                 HEAP32[$805>>2] = $R$1$i$i;
                }
                $806 = ($R$1$i$i|0)==(0|0);
                if ($806) {
                 break L305;
                }
               }
              } while(0);
              $807 = HEAP32[(1768)>>2]|0;
              $808 = ($R$1$i$i>>>0)<($807>>>0);
              if ($808) {
               _abort();
               // unreachable;
              }
              $809 = ((($R$1$i$i)) + 24|0);
              HEAP32[$809>>2] = $764;
              $$sum3132$i$i = $712 | 16;
              $$sum119$i = (($$sum3132$i$i) + ($tsize$254$i))|0;
              $810 = (($tbase$255$i) + ($$sum119$i)|0);
              $811 = HEAP32[$810>>2]|0;
              $812 = ($811|0)==(0|0);
              do {
               if (!($812)) {
                $813 = ($811>>>0)<($807>>>0);
                if ($813) {
                 _abort();
                 // unreachable;
                } else {
                 $814 = ((($R$1$i$i)) + 16|0);
                 HEAP32[$814>>2] = $811;
                 $815 = ((($811)) + 24|0);
                 HEAP32[$815>>2] = $R$1$i$i;
                 break;
                }
               }
              } while(0);
              $$sum120$i = (($$sum2$i21$i) + ($$sum3132$i$i))|0;
              $816 = (($tbase$255$i) + ($$sum120$i)|0);
              $817 = HEAP32[$816>>2]|0;
              $818 = ($817|0)==(0|0);
              if ($818) {
               break;
              }
              $819 = HEAP32[(1768)>>2]|0;
              $820 = ($817>>>0)<($819>>>0);
              if ($820) {
               _abort();
               // unreachable;
              } else {
               $821 = ((($R$1$i$i)) + 20|0);
               HEAP32[$821>>2] = $817;
               $822 = ((($817)) + 24|0);
               HEAP32[$822>>2] = $R$1$i$i;
               break;
              }
             }
            } while(0);
            $$sum9$i$i = $737 | $712;
            $$sum121$i = (($$sum9$i$i) + ($tsize$254$i))|0;
            $823 = (($tbase$255$i) + ($$sum121$i)|0);
            $824 = (($737) + ($718))|0;
            $oldfirst$0$i$i = $823;$qsize$0$i$i = $824;
           } else {
            $oldfirst$0$i$i = $713;$qsize$0$i$i = $718;
           }
           $825 = ((($oldfirst$0$i$i)) + 4|0);
           $826 = HEAP32[$825>>2]|0;
           $827 = $826 & -2;
           HEAP32[$825>>2] = $827;
           $828 = $qsize$0$i$i | 1;
           $$sum10$i$i = (($$sum$i19$i) + 4)|0;
           $829 = (($tbase$255$i) + ($$sum10$i$i)|0);
           HEAP32[$829>>2] = $828;
           $$sum11$i$i = (($qsize$0$i$i) + ($$sum$i19$i))|0;
           $830 = (($tbase$255$i) + ($$sum11$i$i)|0);
           HEAP32[$830>>2] = $qsize$0$i$i;
           $831 = $qsize$0$i$i >>> 3;
           $832 = ($qsize$0$i$i>>>0)<(256);
           if ($832) {
            $833 = $831 << 1;
            $834 = (1792 + ($833<<2)|0);
            $835 = HEAP32[1752>>2]|0;
            $836 = 1 << $831;
            $837 = $835 & $836;
            $838 = ($837|0)==(0);
            do {
             if ($838) {
              $839 = $835 | $836;
              HEAP32[1752>>2] = $839;
              $$pre$i22$i = (($833) + 2)|0;
              $$pre56$i$i = (1792 + ($$pre$i22$i<<2)|0);
              $$pre$phi$i23$iZ2D = $$pre56$i$i;$F4$0$i$i = $834;
             } else {
              $$sum29$i$i = (($833) + 2)|0;
              $840 = (1792 + ($$sum29$i$i<<2)|0);
              $841 = HEAP32[$840>>2]|0;
              $842 = HEAP32[(1768)>>2]|0;
              $843 = ($841>>>0)<($842>>>0);
              if (!($843)) {
               $$pre$phi$i23$iZ2D = $840;$F4$0$i$i = $841;
               break;
              }
              _abort();
              // unreachable;
             }
            } while(0);
            HEAP32[$$pre$phi$i23$iZ2D>>2] = $717;
            $844 = ((($F4$0$i$i)) + 12|0);
            HEAP32[$844>>2] = $717;
            $$sum27$i$i = (($$sum$i19$i) + 8)|0;
            $845 = (($tbase$255$i) + ($$sum27$i$i)|0);
            HEAP32[$845>>2] = $F4$0$i$i;
            $$sum28$i$i = (($$sum$i19$i) + 12)|0;
            $846 = (($tbase$255$i) + ($$sum28$i$i)|0);
            HEAP32[$846>>2] = $834;
            break;
           }
           $847 = $qsize$0$i$i >>> 8;
           $848 = ($847|0)==(0);
           do {
            if ($848) {
             $I7$0$i$i = 0;
            } else {
             $849 = ($qsize$0$i$i>>>0)>(16777215);
             if ($849) {
              $I7$0$i$i = 31;
              break;
             }
             $850 = (($847) + 1048320)|0;
             $851 = $850 >>> 16;
             $852 = $851 & 8;
             $853 = $847 << $852;
             $854 = (($853) + 520192)|0;
             $855 = $854 >>> 16;
             $856 = $855 & 4;
             $857 = $856 | $852;
             $858 = $853 << $856;
             $859 = (($858) + 245760)|0;
             $860 = $859 >>> 16;
             $861 = $860 & 2;
             $862 = $857 | $861;
             $863 = (14 - ($862))|0;
             $864 = $858 << $861;
             $865 = $864 >>> 15;
             $866 = (($863) + ($865))|0;
             $867 = $866 << 1;
             $868 = (($866) + 7)|0;
             $869 = $qsize$0$i$i >>> $868;
             $870 = $869 & 1;
             $871 = $870 | $867;
             $I7$0$i$i = $871;
            }
           } while(0);
           $872 = (2056 + ($I7$0$i$i<<2)|0);
           $$sum12$i$i = (($$sum$i19$i) + 28)|0;
           $873 = (($tbase$255$i) + ($$sum12$i$i)|0);
           HEAP32[$873>>2] = $I7$0$i$i;
           $$sum13$i$i = (($$sum$i19$i) + 16)|0;
           $874 = (($tbase$255$i) + ($$sum13$i$i)|0);
           $$sum14$i$i = (($$sum$i19$i) + 20)|0;
           $875 = (($tbase$255$i) + ($$sum14$i$i)|0);
           HEAP32[$875>>2] = 0;
           HEAP32[$874>>2] = 0;
           $876 = HEAP32[(1756)>>2]|0;
           $877 = 1 << $I7$0$i$i;
           $878 = $876 & $877;
           $879 = ($878|0)==(0);
           if ($879) {
            $880 = $876 | $877;
            HEAP32[(1756)>>2] = $880;
            HEAP32[$872>>2] = $717;
            $$sum15$i$i = (($$sum$i19$i) + 24)|0;
            $881 = (($tbase$255$i) + ($$sum15$i$i)|0);
            HEAP32[$881>>2] = $872;
            $$sum16$i$i = (($$sum$i19$i) + 12)|0;
            $882 = (($tbase$255$i) + ($$sum16$i$i)|0);
            HEAP32[$882>>2] = $717;
            $$sum17$i$i = (($$sum$i19$i) + 8)|0;
            $883 = (($tbase$255$i) + ($$sum17$i$i)|0);
            HEAP32[$883>>2] = $717;
            break;
           }
           $884 = HEAP32[$872>>2]|0;
           $885 = ((($884)) + 4|0);
           $886 = HEAP32[$885>>2]|0;
           $887 = $886 & -8;
           $888 = ($887|0)==($qsize$0$i$i|0);
           L385: do {
            if ($888) {
             $T$0$lcssa$i25$i = $884;
            } else {
             $889 = ($I7$0$i$i|0)==(31);
             $890 = $I7$0$i$i >>> 1;
             $891 = (25 - ($890))|0;
             $892 = $889 ? 0 : $891;
             $893 = $qsize$0$i$i << $892;
             $K8$051$i$i = $893;$T$050$i$i = $884;
             while(1) {
              $900 = $K8$051$i$i >>> 31;
              $901 = (((($T$050$i$i)) + 16|0) + ($900<<2)|0);
              $896 = HEAP32[$901>>2]|0;
              $902 = ($896|0)==(0|0);
              if ($902) {
               $$lcssa = $901;$T$050$i$i$lcssa = $T$050$i$i;
               break;
              }
              $894 = $K8$051$i$i << 1;
              $895 = ((($896)) + 4|0);
              $897 = HEAP32[$895>>2]|0;
              $898 = $897 & -8;
              $899 = ($898|0)==($qsize$0$i$i|0);
              if ($899) {
               $T$0$lcssa$i25$i = $896;
               break L385;
              } else {
               $K8$051$i$i = $894;$T$050$i$i = $896;
              }
             }
             $903 = HEAP32[(1768)>>2]|0;
             $904 = ($$lcssa>>>0)<($903>>>0);
             if ($904) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$$lcssa>>2] = $717;
              $$sum23$i$i = (($$sum$i19$i) + 24)|0;
              $905 = (($tbase$255$i) + ($$sum23$i$i)|0);
              HEAP32[$905>>2] = $T$050$i$i$lcssa;
              $$sum24$i$i = (($$sum$i19$i) + 12)|0;
              $906 = (($tbase$255$i) + ($$sum24$i$i)|0);
              HEAP32[$906>>2] = $717;
              $$sum25$i$i = (($$sum$i19$i) + 8)|0;
              $907 = (($tbase$255$i) + ($$sum25$i$i)|0);
              HEAP32[$907>>2] = $717;
              break L297;
             }
            }
           } while(0);
           $908 = ((($T$0$lcssa$i25$i)) + 8|0);
           $909 = HEAP32[$908>>2]|0;
           $910 = HEAP32[(1768)>>2]|0;
           $911 = ($909>>>0)>=($910>>>0);
           $not$$i26$i = ($T$0$lcssa$i25$i>>>0)>=($910>>>0);
           $912 = $911 & $not$$i26$i;
           if ($912) {
            $913 = ((($909)) + 12|0);
            HEAP32[$913>>2] = $717;
            HEAP32[$908>>2] = $717;
            $$sum20$i$i = (($$sum$i19$i) + 8)|0;
            $914 = (($tbase$255$i) + ($$sum20$i$i)|0);
            HEAP32[$914>>2] = $909;
            $$sum21$i$i = (($$sum$i19$i) + 12)|0;
            $915 = (($tbase$255$i) + ($$sum21$i$i)|0);
            HEAP32[$915>>2] = $T$0$lcssa$i25$i;
            $$sum22$i$i = (($$sum$i19$i) + 24)|0;
            $916 = (($tbase$255$i) + ($$sum22$i$i)|0);
            HEAP32[$916>>2] = 0;
            break;
           } else {
            _abort();
            // unreachable;
           }
          }
         } while(0);
         $$sum1819$i$i = $704 | 8;
         $917 = (($tbase$255$i) + ($$sum1819$i$i)|0);
         $mem$0 = $917;
         break L212;
        } else {
         $sp$0$i$i$i = (2200);
        }
       }
       while(1) {
        $918 = HEAP32[$sp$0$i$i$i>>2]|0;
        $919 = ($918>>>0)>($628>>>0);
        if (!($919)) {
         $920 = ((($sp$0$i$i$i)) + 4|0);
         $921 = HEAP32[$920>>2]|0;
         $922 = (($918) + ($921)|0);
         $923 = ($922>>>0)>($628>>>0);
         if ($923) {
          $$lcssa215 = $918;$$lcssa216 = $921;$$lcssa217 = $922;
          break;
         }
        }
        $924 = ((($sp$0$i$i$i)) + 8|0);
        $925 = HEAP32[$924>>2]|0;
        $sp$0$i$i$i = $925;
       }
       $$sum$i$i = (($$lcssa216) + -47)|0;
       $$sum1$i$i = (($$lcssa216) + -39)|0;
       $926 = (($$lcssa215) + ($$sum1$i$i)|0);
       $927 = $926;
       $928 = $927 & 7;
       $929 = ($928|0)==(0);
       $930 = (0 - ($927))|0;
       $931 = $930 & 7;
       $932 = $929 ? 0 : $931;
       $$sum2$i$i = (($$sum$i$i) + ($932))|0;
       $933 = (($$lcssa215) + ($$sum2$i$i)|0);
       $934 = ((($628)) + 16|0);
       $935 = ($933>>>0)<($934>>>0);
       $936 = $935 ? $628 : $933;
       $937 = ((($936)) + 8|0);
       $938 = (($tsize$254$i) + -40)|0;
       $939 = ((($tbase$255$i)) + 8|0);
       $940 = $939;
       $941 = $940 & 7;
       $942 = ($941|0)==(0);
       $943 = (0 - ($940))|0;
       $944 = $943 & 7;
       $945 = $942 ? 0 : $944;
       $946 = (($tbase$255$i) + ($945)|0);
       $947 = (($938) - ($945))|0;
       HEAP32[(1776)>>2] = $946;
       HEAP32[(1764)>>2] = $947;
       $948 = $947 | 1;
       $$sum$i$i$i = (($945) + 4)|0;
       $949 = (($tbase$255$i) + ($$sum$i$i$i)|0);
       HEAP32[$949>>2] = $948;
       $$sum2$i$i$i = (($tsize$254$i) + -36)|0;
       $950 = (($tbase$255$i) + ($$sum2$i$i$i)|0);
       HEAP32[$950>>2] = 40;
       $951 = HEAP32[(2240)>>2]|0;
       HEAP32[(1780)>>2] = $951;
       $952 = ((($936)) + 4|0);
       HEAP32[$952>>2] = 27;
       ;HEAP32[$937>>2]=HEAP32[(2200)>>2]|0;HEAP32[$937+4>>2]=HEAP32[(2200)+4>>2]|0;HEAP32[$937+8>>2]=HEAP32[(2200)+8>>2]|0;HEAP32[$937+12>>2]=HEAP32[(2200)+12>>2]|0;
       HEAP32[(2200)>>2] = $tbase$255$i;
       HEAP32[(2204)>>2] = $tsize$254$i;
       HEAP32[(2212)>>2] = 0;
       HEAP32[(2208)>>2] = $937;
       $953 = ((($936)) + 28|0);
       HEAP32[$953>>2] = 7;
       $954 = ((($936)) + 32|0);
       $955 = ($954>>>0)<($$lcssa217>>>0);
       if ($955) {
        $957 = $953;
        while(1) {
         $956 = ((($957)) + 4|0);
         HEAP32[$956>>2] = 7;
         $958 = ((($957)) + 8|0);
         $959 = ($958>>>0)<($$lcssa217>>>0);
         if ($959) {
          $957 = $956;
         } else {
          break;
         }
        }
       }
       $960 = ($936|0)==($628|0);
       if (!($960)) {
        $961 = $936;
        $962 = $628;
        $963 = (($961) - ($962))|0;
        $964 = HEAP32[$952>>2]|0;
        $965 = $964 & -2;
        HEAP32[$952>>2] = $965;
        $966 = $963 | 1;
        $967 = ((($628)) + 4|0);
        HEAP32[$967>>2] = $966;
        HEAP32[$936>>2] = $963;
        $968 = $963 >>> 3;
        $969 = ($963>>>0)<(256);
        if ($969) {
         $970 = $968 << 1;
         $971 = (1792 + ($970<<2)|0);
         $972 = HEAP32[1752>>2]|0;
         $973 = 1 << $968;
         $974 = $972 & $973;
         $975 = ($974|0)==(0);
         if ($975) {
          $976 = $972 | $973;
          HEAP32[1752>>2] = $976;
          $$pre$i$i = (($970) + 2)|0;
          $$pre14$i$i = (1792 + ($$pre$i$i<<2)|0);
          $$pre$phi$i$iZ2D = $$pre14$i$i;$F$0$i$i = $971;
         } else {
          $$sum4$i$i = (($970) + 2)|0;
          $977 = (1792 + ($$sum4$i$i<<2)|0);
          $978 = HEAP32[$977>>2]|0;
          $979 = HEAP32[(1768)>>2]|0;
          $980 = ($978>>>0)<($979>>>0);
          if ($980) {
           _abort();
           // unreachable;
          } else {
           $$pre$phi$i$iZ2D = $977;$F$0$i$i = $978;
          }
         }
         HEAP32[$$pre$phi$i$iZ2D>>2] = $628;
         $981 = ((($F$0$i$i)) + 12|0);
         HEAP32[$981>>2] = $628;
         $982 = ((($628)) + 8|0);
         HEAP32[$982>>2] = $F$0$i$i;
         $983 = ((($628)) + 12|0);
         HEAP32[$983>>2] = $971;
         break;
        }
        $984 = $963 >>> 8;
        $985 = ($984|0)==(0);
        if ($985) {
         $I1$0$i$i = 0;
        } else {
         $986 = ($963>>>0)>(16777215);
         if ($986) {
          $I1$0$i$i = 31;
         } else {
          $987 = (($984) + 1048320)|0;
          $988 = $987 >>> 16;
          $989 = $988 & 8;
          $990 = $984 << $989;
          $991 = (($990) + 520192)|0;
          $992 = $991 >>> 16;
          $993 = $992 & 4;
          $994 = $993 | $989;
          $995 = $990 << $993;
          $996 = (($995) + 245760)|0;
          $997 = $996 >>> 16;
          $998 = $997 & 2;
          $999 = $994 | $998;
          $1000 = (14 - ($999))|0;
          $1001 = $995 << $998;
          $1002 = $1001 >>> 15;
          $1003 = (($1000) + ($1002))|0;
          $1004 = $1003 << 1;
          $1005 = (($1003) + 7)|0;
          $1006 = $963 >>> $1005;
          $1007 = $1006 & 1;
          $1008 = $1007 | $1004;
          $I1$0$i$i = $1008;
         }
        }
        $1009 = (2056 + ($I1$0$i$i<<2)|0);
        $1010 = ((($628)) + 28|0);
        HEAP32[$1010>>2] = $I1$0$i$i;
        $1011 = ((($628)) + 20|0);
        HEAP32[$1011>>2] = 0;
        HEAP32[$934>>2] = 0;
        $1012 = HEAP32[(1756)>>2]|0;
        $1013 = 1 << $I1$0$i$i;
        $1014 = $1012 & $1013;
        $1015 = ($1014|0)==(0);
        if ($1015) {
         $1016 = $1012 | $1013;
         HEAP32[(1756)>>2] = $1016;
         HEAP32[$1009>>2] = $628;
         $1017 = ((($628)) + 24|0);
         HEAP32[$1017>>2] = $1009;
         $1018 = ((($628)) + 12|0);
         HEAP32[$1018>>2] = $628;
         $1019 = ((($628)) + 8|0);
         HEAP32[$1019>>2] = $628;
         break;
        }
        $1020 = HEAP32[$1009>>2]|0;
        $1021 = ((($1020)) + 4|0);
        $1022 = HEAP32[$1021>>2]|0;
        $1023 = $1022 & -8;
        $1024 = ($1023|0)==($963|0);
        L425: do {
         if ($1024) {
          $T$0$lcssa$i$i = $1020;
         } else {
          $1025 = ($I1$0$i$i|0)==(31);
          $1026 = $I1$0$i$i >>> 1;
          $1027 = (25 - ($1026))|0;
          $1028 = $1025 ? 0 : $1027;
          $1029 = $963 << $1028;
          $K2$07$i$i = $1029;$T$06$i$i = $1020;
          while(1) {
           $1036 = $K2$07$i$i >>> 31;
           $1037 = (((($T$06$i$i)) + 16|0) + ($1036<<2)|0);
           $1032 = HEAP32[$1037>>2]|0;
           $1038 = ($1032|0)==(0|0);
           if ($1038) {
            $$lcssa211 = $1037;$T$06$i$i$lcssa = $T$06$i$i;
            break;
           }
           $1030 = $K2$07$i$i << 1;
           $1031 = ((($1032)) + 4|0);
           $1033 = HEAP32[$1031>>2]|0;
           $1034 = $1033 & -8;
           $1035 = ($1034|0)==($963|0);
           if ($1035) {
            $T$0$lcssa$i$i = $1032;
            break L425;
           } else {
            $K2$07$i$i = $1030;$T$06$i$i = $1032;
           }
          }
          $1039 = HEAP32[(1768)>>2]|0;
          $1040 = ($$lcssa211>>>0)<($1039>>>0);
          if ($1040) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$$lcssa211>>2] = $628;
           $1041 = ((($628)) + 24|0);
           HEAP32[$1041>>2] = $T$06$i$i$lcssa;
           $1042 = ((($628)) + 12|0);
           HEAP32[$1042>>2] = $628;
           $1043 = ((($628)) + 8|0);
           HEAP32[$1043>>2] = $628;
           break L272;
          }
         }
        } while(0);
        $1044 = ((($T$0$lcssa$i$i)) + 8|0);
        $1045 = HEAP32[$1044>>2]|0;
        $1046 = HEAP32[(1768)>>2]|0;
        $1047 = ($1045>>>0)>=($1046>>>0);
        $not$$i$i = ($T$0$lcssa$i$i>>>0)>=($1046>>>0);
        $1048 = $1047 & $not$$i$i;
        if ($1048) {
         $1049 = ((($1045)) + 12|0);
         HEAP32[$1049>>2] = $628;
         HEAP32[$1044>>2] = $628;
         $1050 = ((($628)) + 8|0);
         HEAP32[$1050>>2] = $1045;
         $1051 = ((($628)) + 12|0);
         HEAP32[$1051>>2] = $T$0$lcssa$i$i;
         $1052 = ((($628)) + 24|0);
         HEAP32[$1052>>2] = 0;
         break;
        } else {
         _abort();
         // unreachable;
        }
       }
      }
     } while(0);
     $1053 = HEAP32[(1764)>>2]|0;
     $1054 = ($1053>>>0)>($nb$0>>>0);
     if ($1054) {
      $1055 = (($1053) - ($nb$0))|0;
      HEAP32[(1764)>>2] = $1055;
      $1056 = HEAP32[(1776)>>2]|0;
      $1057 = (($1056) + ($nb$0)|0);
      HEAP32[(1776)>>2] = $1057;
      $1058 = $1055 | 1;
      $$sum$i32 = (($nb$0) + 4)|0;
      $1059 = (($1056) + ($$sum$i32)|0);
      HEAP32[$1059>>2] = $1058;
      $1060 = $nb$0 | 3;
      $1061 = ((($1056)) + 4|0);
      HEAP32[$1061>>2] = $1060;
      $1062 = ((($1056)) + 8|0);
      $mem$0 = $1062;
      break;
     }
    }
    $1063 = (___errno_location()|0);
    HEAP32[$1063>>2] = 12;
    $mem$0 = 0;
   } else {
    $mem$0 = 0;
   }
  }
 } while(0);
 return ($mem$0|0);
}
function _free($mem) {
 $mem = $mem|0;
 var $$lcssa = 0, $$pre = 0, $$pre$phi59Z2D = 0, $$pre$phi61Z2D = 0, $$pre$phiZ2D = 0, $$pre57 = 0, $$pre58 = 0, $$pre60 = 0, $$sum = 0, $$sum11 = 0, $$sum12 = 0, $$sum13 = 0, $$sum14 = 0, $$sum1718 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum22 = 0, $$sum23 = 0, $$sum24 = 0;
 var $$sum25 = 0, $$sum26 = 0, $$sum27 = 0, $$sum28 = 0, $$sum29 = 0, $$sum3 = 0, $$sum30 = 0, $$sum31 = 0, $$sum5 = 0, $$sum67 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0;
 var $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0;
 var $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0;
 var $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0;
 var $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0;
 var $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0;
 var $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0;
 var $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0;
 var $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0;
 var $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0;
 var $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0;
 var $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0;
 var $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0, $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0;
 var $321 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0;
 var $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0;
 var $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0;
 var $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I18$0 = 0, $K19$052 = 0, $R$0 = 0, $R$0$lcssa = 0, $R$1 = 0;
 var $R7$0 = 0, $R7$0$lcssa = 0, $R7$1 = 0, $RP$0 = 0, $RP$0$lcssa = 0, $RP9$0 = 0, $RP9$0$lcssa = 0, $T$0$lcssa = 0, $T$051 = 0, $T$051$lcssa = 0, $cond = 0, $cond47 = 0, $not$ = 0, $p$0 = 0, $psize$0 = 0, $psize$1 = 0, $sp$0$i = 0, $sp$0$in$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($mem|0)==(0|0);
 L1: do {
  if (!($0)) {
   $1 = ((($mem)) + -8|0);
   $2 = HEAP32[(1768)>>2]|0;
   $3 = ($1>>>0)<($2>>>0);
   L3: do {
    if (!($3)) {
     $4 = ((($mem)) + -4|0);
     $5 = HEAP32[$4>>2]|0;
     $6 = $5 & 3;
     $7 = ($6|0)==(1);
     if (!($7)) {
      $8 = $5 & -8;
      $$sum = (($8) + -8)|0;
      $9 = (($mem) + ($$sum)|0);
      $10 = $5 & 1;
      $11 = ($10|0)==(0);
      do {
       if ($11) {
        $12 = HEAP32[$1>>2]|0;
        $13 = ($6|0)==(0);
        if ($13) {
         break L1;
        }
        $$sum2 = (-8 - ($12))|0;
        $14 = (($mem) + ($$sum2)|0);
        $15 = (($12) + ($8))|0;
        $16 = ($14>>>0)<($2>>>0);
        if ($16) {
         break L3;
        }
        $17 = HEAP32[(1772)>>2]|0;
        $18 = ($14|0)==($17|0);
        if ($18) {
         $$sum3 = (($8) + -4)|0;
         $103 = (($mem) + ($$sum3)|0);
         $104 = HEAP32[$103>>2]|0;
         $105 = $104 & 3;
         $106 = ($105|0)==(3);
         if (!($106)) {
          $p$0 = $14;$psize$0 = $15;
          break;
         }
         HEAP32[(1760)>>2] = $15;
         $107 = $104 & -2;
         HEAP32[$103>>2] = $107;
         $108 = $15 | 1;
         $$sum20 = (($$sum2) + 4)|0;
         $109 = (($mem) + ($$sum20)|0);
         HEAP32[$109>>2] = $108;
         HEAP32[$9>>2] = $15;
         break L1;
        }
        $19 = $12 >>> 3;
        $20 = ($12>>>0)<(256);
        if ($20) {
         $$sum30 = (($$sum2) + 8)|0;
         $21 = (($mem) + ($$sum30)|0);
         $22 = HEAP32[$21>>2]|0;
         $$sum31 = (($$sum2) + 12)|0;
         $23 = (($mem) + ($$sum31)|0);
         $24 = HEAP32[$23>>2]|0;
         $25 = $19 << 1;
         $26 = (1792 + ($25<<2)|0);
         $27 = ($22|0)==($26|0);
         do {
          if (!($27)) {
           $28 = ($22>>>0)<($2>>>0);
           if (!($28)) {
            $29 = ((($22)) + 12|0);
            $30 = HEAP32[$29>>2]|0;
            $31 = ($30|0)==($14|0);
            if ($31) {
             break;
            }
           }
           _abort();
           // unreachable;
          }
         } while(0);
         $32 = ($24|0)==($22|0);
         if ($32) {
          $33 = 1 << $19;
          $34 = $33 ^ -1;
          $35 = HEAP32[1752>>2]|0;
          $36 = $35 & $34;
          HEAP32[1752>>2] = $36;
          $p$0 = $14;$psize$0 = $15;
          break;
         }
         $37 = ($24|0)==($26|0);
         do {
          if ($37) {
           $$pre60 = ((($24)) + 8|0);
           $$pre$phi61Z2D = $$pre60;
          } else {
           $38 = ($24>>>0)<($2>>>0);
           if (!($38)) {
            $39 = ((($24)) + 8|0);
            $40 = HEAP32[$39>>2]|0;
            $41 = ($40|0)==($14|0);
            if ($41) {
             $$pre$phi61Z2D = $39;
             break;
            }
           }
           _abort();
           // unreachable;
          }
         } while(0);
         $42 = ((($22)) + 12|0);
         HEAP32[$42>>2] = $24;
         HEAP32[$$pre$phi61Z2D>>2] = $22;
         $p$0 = $14;$psize$0 = $15;
         break;
        }
        $$sum22 = (($$sum2) + 24)|0;
        $43 = (($mem) + ($$sum22)|0);
        $44 = HEAP32[$43>>2]|0;
        $$sum23 = (($$sum2) + 12)|0;
        $45 = (($mem) + ($$sum23)|0);
        $46 = HEAP32[$45>>2]|0;
        $47 = ($46|0)==($14|0);
        do {
         if ($47) {
          $$sum25 = (($$sum2) + 20)|0;
          $57 = (($mem) + ($$sum25)|0);
          $58 = HEAP32[$57>>2]|0;
          $59 = ($58|0)==(0|0);
          if ($59) {
           $$sum24 = (($$sum2) + 16)|0;
           $60 = (($mem) + ($$sum24)|0);
           $61 = HEAP32[$60>>2]|0;
           $62 = ($61|0)==(0|0);
           if ($62) {
            $R$1 = 0;
            break;
           } else {
            $R$0 = $61;$RP$0 = $60;
           }
          } else {
           $R$0 = $58;$RP$0 = $57;
          }
          while(1) {
           $63 = ((($R$0)) + 20|0);
           $64 = HEAP32[$63>>2]|0;
           $65 = ($64|0)==(0|0);
           if (!($65)) {
            $R$0 = $64;$RP$0 = $63;
            continue;
           }
           $66 = ((($R$0)) + 16|0);
           $67 = HEAP32[$66>>2]|0;
           $68 = ($67|0)==(0|0);
           if ($68) {
            $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
            break;
           } else {
            $R$0 = $67;$RP$0 = $66;
           }
          }
          $69 = ($RP$0$lcssa>>>0)<($2>>>0);
          if ($69) {
           _abort();
           // unreachable;
          } else {
           HEAP32[$RP$0$lcssa>>2] = 0;
           $R$1 = $R$0$lcssa;
           break;
          }
         } else {
          $$sum29 = (($$sum2) + 8)|0;
          $48 = (($mem) + ($$sum29)|0);
          $49 = HEAP32[$48>>2]|0;
          $50 = ($49>>>0)<($2>>>0);
          if (!($50)) {
           $51 = ((($49)) + 12|0);
           $52 = HEAP32[$51>>2]|0;
           $53 = ($52|0)==($14|0);
           if ($53) {
            $54 = ((($46)) + 8|0);
            $55 = HEAP32[$54>>2]|0;
            $56 = ($55|0)==($14|0);
            if ($56) {
             HEAP32[$51>>2] = $46;
             HEAP32[$54>>2] = $49;
             $R$1 = $46;
             break;
            }
           }
          }
          _abort();
          // unreachable;
         }
        } while(0);
        $70 = ($44|0)==(0|0);
        if ($70) {
         $p$0 = $14;$psize$0 = $15;
        } else {
         $$sum26 = (($$sum2) + 28)|0;
         $71 = (($mem) + ($$sum26)|0);
         $72 = HEAP32[$71>>2]|0;
         $73 = (2056 + ($72<<2)|0);
         $74 = HEAP32[$73>>2]|0;
         $75 = ($14|0)==($74|0);
         if ($75) {
          HEAP32[$73>>2] = $R$1;
          $cond = ($R$1|0)==(0|0);
          if ($cond) {
           $76 = 1 << $72;
           $77 = $76 ^ -1;
           $78 = HEAP32[(1756)>>2]|0;
           $79 = $78 & $77;
           HEAP32[(1756)>>2] = $79;
           $p$0 = $14;$psize$0 = $15;
           break;
          }
         } else {
          $80 = HEAP32[(1768)>>2]|0;
          $81 = ($44>>>0)<($80>>>0);
          if ($81) {
           _abort();
           // unreachable;
          }
          $82 = ((($44)) + 16|0);
          $83 = HEAP32[$82>>2]|0;
          $84 = ($83|0)==($14|0);
          if ($84) {
           HEAP32[$82>>2] = $R$1;
          } else {
           $85 = ((($44)) + 20|0);
           HEAP32[$85>>2] = $R$1;
          }
          $86 = ($R$1|0)==(0|0);
          if ($86) {
           $p$0 = $14;$psize$0 = $15;
           break;
          }
         }
         $87 = HEAP32[(1768)>>2]|0;
         $88 = ($R$1>>>0)<($87>>>0);
         if ($88) {
          _abort();
          // unreachable;
         }
         $89 = ((($R$1)) + 24|0);
         HEAP32[$89>>2] = $44;
         $$sum27 = (($$sum2) + 16)|0;
         $90 = (($mem) + ($$sum27)|0);
         $91 = HEAP32[$90>>2]|0;
         $92 = ($91|0)==(0|0);
         do {
          if (!($92)) {
           $93 = ($91>>>0)<($87>>>0);
           if ($93) {
            _abort();
            // unreachable;
           } else {
            $94 = ((($R$1)) + 16|0);
            HEAP32[$94>>2] = $91;
            $95 = ((($91)) + 24|0);
            HEAP32[$95>>2] = $R$1;
            break;
           }
          }
         } while(0);
         $$sum28 = (($$sum2) + 20)|0;
         $96 = (($mem) + ($$sum28)|0);
         $97 = HEAP32[$96>>2]|0;
         $98 = ($97|0)==(0|0);
         if ($98) {
          $p$0 = $14;$psize$0 = $15;
         } else {
          $99 = HEAP32[(1768)>>2]|0;
          $100 = ($97>>>0)<($99>>>0);
          if ($100) {
           _abort();
           // unreachable;
          } else {
           $101 = ((($R$1)) + 20|0);
           HEAP32[$101>>2] = $97;
           $102 = ((($97)) + 24|0);
           HEAP32[$102>>2] = $R$1;
           $p$0 = $14;$psize$0 = $15;
           break;
          }
         }
        }
       } else {
        $p$0 = $1;$psize$0 = $8;
       }
      } while(0);
      $110 = ($p$0>>>0)<($9>>>0);
      if ($110) {
       $$sum19 = (($8) + -4)|0;
       $111 = (($mem) + ($$sum19)|0);
       $112 = HEAP32[$111>>2]|0;
       $113 = $112 & 1;
       $114 = ($113|0)==(0);
       if (!($114)) {
        $115 = $112 & 2;
        $116 = ($115|0)==(0);
        if ($116) {
         $117 = HEAP32[(1776)>>2]|0;
         $118 = ($9|0)==($117|0);
         if ($118) {
          $119 = HEAP32[(1764)>>2]|0;
          $120 = (($119) + ($psize$0))|0;
          HEAP32[(1764)>>2] = $120;
          HEAP32[(1776)>>2] = $p$0;
          $121 = $120 | 1;
          $122 = ((($p$0)) + 4|0);
          HEAP32[$122>>2] = $121;
          $123 = HEAP32[(1772)>>2]|0;
          $124 = ($p$0|0)==($123|0);
          if (!($124)) {
           break L1;
          }
          HEAP32[(1772)>>2] = 0;
          HEAP32[(1760)>>2] = 0;
          break L1;
         }
         $125 = HEAP32[(1772)>>2]|0;
         $126 = ($9|0)==($125|0);
         if ($126) {
          $127 = HEAP32[(1760)>>2]|0;
          $128 = (($127) + ($psize$0))|0;
          HEAP32[(1760)>>2] = $128;
          HEAP32[(1772)>>2] = $p$0;
          $129 = $128 | 1;
          $130 = ((($p$0)) + 4|0);
          HEAP32[$130>>2] = $129;
          $131 = (($p$0) + ($128)|0);
          HEAP32[$131>>2] = $128;
          break L1;
         }
         $132 = $112 & -8;
         $133 = (($132) + ($psize$0))|0;
         $134 = $112 >>> 3;
         $135 = ($112>>>0)<(256);
         do {
          if ($135) {
           $136 = (($mem) + ($8)|0);
           $137 = HEAP32[$136>>2]|0;
           $$sum1718 = $8 | 4;
           $138 = (($mem) + ($$sum1718)|0);
           $139 = HEAP32[$138>>2]|0;
           $140 = $134 << 1;
           $141 = (1792 + ($140<<2)|0);
           $142 = ($137|0)==($141|0);
           do {
            if (!($142)) {
             $143 = HEAP32[(1768)>>2]|0;
             $144 = ($137>>>0)<($143>>>0);
             if (!($144)) {
              $145 = ((($137)) + 12|0);
              $146 = HEAP32[$145>>2]|0;
              $147 = ($146|0)==($9|0);
              if ($147) {
               break;
              }
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $148 = ($139|0)==($137|0);
           if ($148) {
            $149 = 1 << $134;
            $150 = $149 ^ -1;
            $151 = HEAP32[1752>>2]|0;
            $152 = $151 & $150;
            HEAP32[1752>>2] = $152;
            break;
           }
           $153 = ($139|0)==($141|0);
           do {
            if ($153) {
             $$pre58 = ((($139)) + 8|0);
             $$pre$phi59Z2D = $$pre58;
            } else {
             $154 = HEAP32[(1768)>>2]|0;
             $155 = ($139>>>0)<($154>>>0);
             if (!($155)) {
              $156 = ((($139)) + 8|0);
              $157 = HEAP32[$156>>2]|0;
              $158 = ($157|0)==($9|0);
              if ($158) {
               $$pre$phi59Z2D = $156;
               break;
              }
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $159 = ((($137)) + 12|0);
           HEAP32[$159>>2] = $139;
           HEAP32[$$pre$phi59Z2D>>2] = $137;
          } else {
           $$sum5 = (($8) + 16)|0;
           $160 = (($mem) + ($$sum5)|0);
           $161 = HEAP32[$160>>2]|0;
           $$sum67 = $8 | 4;
           $162 = (($mem) + ($$sum67)|0);
           $163 = HEAP32[$162>>2]|0;
           $164 = ($163|0)==($9|0);
           do {
            if ($164) {
             $$sum9 = (($8) + 12)|0;
             $175 = (($mem) + ($$sum9)|0);
             $176 = HEAP32[$175>>2]|0;
             $177 = ($176|0)==(0|0);
             if ($177) {
              $$sum8 = (($8) + 8)|0;
              $178 = (($mem) + ($$sum8)|0);
              $179 = HEAP32[$178>>2]|0;
              $180 = ($179|0)==(0|0);
              if ($180) {
               $R7$1 = 0;
               break;
              } else {
               $R7$0 = $179;$RP9$0 = $178;
              }
             } else {
              $R7$0 = $176;$RP9$0 = $175;
             }
             while(1) {
              $181 = ((($R7$0)) + 20|0);
              $182 = HEAP32[$181>>2]|0;
              $183 = ($182|0)==(0|0);
              if (!($183)) {
               $R7$0 = $182;$RP9$0 = $181;
               continue;
              }
              $184 = ((($R7$0)) + 16|0);
              $185 = HEAP32[$184>>2]|0;
              $186 = ($185|0)==(0|0);
              if ($186) {
               $R7$0$lcssa = $R7$0;$RP9$0$lcssa = $RP9$0;
               break;
              } else {
               $R7$0 = $185;$RP9$0 = $184;
              }
             }
             $187 = HEAP32[(1768)>>2]|0;
             $188 = ($RP9$0$lcssa>>>0)<($187>>>0);
             if ($188) {
              _abort();
              // unreachable;
             } else {
              HEAP32[$RP9$0$lcssa>>2] = 0;
              $R7$1 = $R7$0$lcssa;
              break;
             }
            } else {
             $165 = (($mem) + ($8)|0);
             $166 = HEAP32[$165>>2]|0;
             $167 = HEAP32[(1768)>>2]|0;
             $168 = ($166>>>0)<($167>>>0);
             if (!($168)) {
              $169 = ((($166)) + 12|0);
              $170 = HEAP32[$169>>2]|0;
              $171 = ($170|0)==($9|0);
              if ($171) {
               $172 = ((($163)) + 8|0);
               $173 = HEAP32[$172>>2]|0;
               $174 = ($173|0)==($9|0);
               if ($174) {
                HEAP32[$169>>2] = $163;
                HEAP32[$172>>2] = $166;
                $R7$1 = $163;
                break;
               }
              }
             }
             _abort();
             // unreachable;
            }
           } while(0);
           $189 = ($161|0)==(0|0);
           if (!($189)) {
            $$sum12 = (($8) + 20)|0;
            $190 = (($mem) + ($$sum12)|0);
            $191 = HEAP32[$190>>2]|0;
            $192 = (2056 + ($191<<2)|0);
            $193 = HEAP32[$192>>2]|0;
            $194 = ($9|0)==($193|0);
            if ($194) {
             HEAP32[$192>>2] = $R7$1;
             $cond47 = ($R7$1|0)==(0|0);
             if ($cond47) {
              $195 = 1 << $191;
              $196 = $195 ^ -1;
              $197 = HEAP32[(1756)>>2]|0;
              $198 = $197 & $196;
              HEAP32[(1756)>>2] = $198;
              break;
             }
            } else {
             $199 = HEAP32[(1768)>>2]|0;
             $200 = ($161>>>0)<($199>>>0);
             if ($200) {
              _abort();
              // unreachable;
             }
             $201 = ((($161)) + 16|0);
             $202 = HEAP32[$201>>2]|0;
             $203 = ($202|0)==($9|0);
             if ($203) {
              HEAP32[$201>>2] = $R7$1;
             } else {
              $204 = ((($161)) + 20|0);
              HEAP32[$204>>2] = $R7$1;
             }
             $205 = ($R7$1|0)==(0|0);
             if ($205) {
              break;
             }
            }
            $206 = HEAP32[(1768)>>2]|0;
            $207 = ($R7$1>>>0)<($206>>>0);
            if ($207) {
             _abort();
             // unreachable;
            }
            $208 = ((($R7$1)) + 24|0);
            HEAP32[$208>>2] = $161;
            $$sum13 = (($8) + 8)|0;
            $209 = (($mem) + ($$sum13)|0);
            $210 = HEAP32[$209>>2]|0;
            $211 = ($210|0)==(0|0);
            do {
             if (!($211)) {
              $212 = ($210>>>0)<($206>>>0);
              if ($212) {
               _abort();
               // unreachable;
              } else {
               $213 = ((($R7$1)) + 16|0);
               HEAP32[$213>>2] = $210;
               $214 = ((($210)) + 24|0);
               HEAP32[$214>>2] = $R7$1;
               break;
              }
             }
            } while(0);
            $$sum14 = (($8) + 12)|0;
            $215 = (($mem) + ($$sum14)|0);
            $216 = HEAP32[$215>>2]|0;
            $217 = ($216|0)==(0|0);
            if (!($217)) {
             $218 = HEAP32[(1768)>>2]|0;
             $219 = ($216>>>0)<($218>>>0);
             if ($219) {
              _abort();
              // unreachable;
             } else {
              $220 = ((($R7$1)) + 20|0);
              HEAP32[$220>>2] = $216;
              $221 = ((($216)) + 24|0);
              HEAP32[$221>>2] = $R7$1;
              break;
             }
            }
           }
          }
         } while(0);
         $222 = $133 | 1;
         $223 = ((($p$0)) + 4|0);
         HEAP32[$223>>2] = $222;
         $224 = (($p$0) + ($133)|0);
         HEAP32[$224>>2] = $133;
         $225 = HEAP32[(1772)>>2]|0;
         $226 = ($p$0|0)==($225|0);
         if ($226) {
          HEAP32[(1760)>>2] = $133;
          break L1;
         } else {
          $psize$1 = $133;
         }
        } else {
         $227 = $112 & -2;
         HEAP32[$111>>2] = $227;
         $228 = $psize$0 | 1;
         $229 = ((($p$0)) + 4|0);
         HEAP32[$229>>2] = $228;
         $230 = (($p$0) + ($psize$0)|0);
         HEAP32[$230>>2] = $psize$0;
         $psize$1 = $psize$0;
        }
        $231 = $psize$1 >>> 3;
        $232 = ($psize$1>>>0)<(256);
        if ($232) {
         $233 = $231 << 1;
         $234 = (1792 + ($233<<2)|0);
         $235 = HEAP32[1752>>2]|0;
         $236 = 1 << $231;
         $237 = $235 & $236;
         $238 = ($237|0)==(0);
         if ($238) {
          $239 = $235 | $236;
          HEAP32[1752>>2] = $239;
          $$pre = (($233) + 2)|0;
          $$pre57 = (1792 + ($$pre<<2)|0);
          $$pre$phiZ2D = $$pre57;$F16$0 = $234;
         } else {
          $$sum11 = (($233) + 2)|0;
          $240 = (1792 + ($$sum11<<2)|0);
          $241 = HEAP32[$240>>2]|0;
          $242 = HEAP32[(1768)>>2]|0;
          $243 = ($241>>>0)<($242>>>0);
          if ($243) {
           _abort();
           // unreachable;
          } else {
           $$pre$phiZ2D = $240;$F16$0 = $241;
          }
         }
         HEAP32[$$pre$phiZ2D>>2] = $p$0;
         $244 = ((($F16$0)) + 12|0);
         HEAP32[$244>>2] = $p$0;
         $245 = ((($p$0)) + 8|0);
         HEAP32[$245>>2] = $F16$0;
         $246 = ((($p$0)) + 12|0);
         HEAP32[$246>>2] = $234;
         break L1;
        }
        $247 = $psize$1 >>> 8;
        $248 = ($247|0)==(0);
        if ($248) {
         $I18$0 = 0;
        } else {
         $249 = ($psize$1>>>0)>(16777215);
         if ($249) {
          $I18$0 = 31;
         } else {
          $250 = (($247) + 1048320)|0;
          $251 = $250 >>> 16;
          $252 = $251 & 8;
          $253 = $247 << $252;
          $254 = (($253) + 520192)|0;
          $255 = $254 >>> 16;
          $256 = $255 & 4;
          $257 = $256 | $252;
          $258 = $253 << $256;
          $259 = (($258) + 245760)|0;
          $260 = $259 >>> 16;
          $261 = $260 & 2;
          $262 = $257 | $261;
          $263 = (14 - ($262))|0;
          $264 = $258 << $261;
          $265 = $264 >>> 15;
          $266 = (($263) + ($265))|0;
          $267 = $266 << 1;
          $268 = (($266) + 7)|0;
          $269 = $psize$1 >>> $268;
          $270 = $269 & 1;
          $271 = $270 | $267;
          $I18$0 = $271;
         }
        }
        $272 = (2056 + ($I18$0<<2)|0);
        $273 = ((($p$0)) + 28|0);
        HEAP32[$273>>2] = $I18$0;
        $274 = ((($p$0)) + 16|0);
        $275 = ((($p$0)) + 20|0);
        HEAP32[$275>>2] = 0;
        HEAP32[$274>>2] = 0;
        $276 = HEAP32[(1756)>>2]|0;
        $277 = 1 << $I18$0;
        $278 = $276 & $277;
        $279 = ($278|0)==(0);
        L168: do {
         if ($279) {
          $280 = $276 | $277;
          HEAP32[(1756)>>2] = $280;
          HEAP32[$272>>2] = $p$0;
          $281 = ((($p$0)) + 24|0);
          HEAP32[$281>>2] = $272;
          $282 = ((($p$0)) + 12|0);
          HEAP32[$282>>2] = $p$0;
          $283 = ((($p$0)) + 8|0);
          HEAP32[$283>>2] = $p$0;
         } else {
          $284 = HEAP32[$272>>2]|0;
          $285 = ((($284)) + 4|0);
          $286 = HEAP32[$285>>2]|0;
          $287 = $286 & -8;
          $288 = ($287|0)==($psize$1|0);
          L171: do {
           if ($288) {
            $T$0$lcssa = $284;
           } else {
            $289 = ($I18$0|0)==(31);
            $290 = $I18$0 >>> 1;
            $291 = (25 - ($290))|0;
            $292 = $289 ? 0 : $291;
            $293 = $psize$1 << $292;
            $K19$052 = $293;$T$051 = $284;
            while(1) {
             $300 = $K19$052 >>> 31;
             $301 = (((($T$051)) + 16|0) + ($300<<2)|0);
             $296 = HEAP32[$301>>2]|0;
             $302 = ($296|0)==(0|0);
             if ($302) {
              $$lcssa = $301;$T$051$lcssa = $T$051;
              break;
             }
             $294 = $K19$052 << 1;
             $295 = ((($296)) + 4|0);
             $297 = HEAP32[$295>>2]|0;
             $298 = $297 & -8;
             $299 = ($298|0)==($psize$1|0);
             if ($299) {
              $T$0$lcssa = $296;
              break L171;
             } else {
              $K19$052 = $294;$T$051 = $296;
             }
            }
            $303 = HEAP32[(1768)>>2]|0;
            $304 = ($$lcssa>>>0)<($303>>>0);
            if ($304) {
             _abort();
             // unreachable;
            } else {
             HEAP32[$$lcssa>>2] = $p$0;
             $305 = ((($p$0)) + 24|0);
             HEAP32[$305>>2] = $T$051$lcssa;
             $306 = ((($p$0)) + 12|0);
             HEAP32[$306>>2] = $p$0;
             $307 = ((($p$0)) + 8|0);
             HEAP32[$307>>2] = $p$0;
             break L168;
            }
           }
          } while(0);
          $308 = ((($T$0$lcssa)) + 8|0);
          $309 = HEAP32[$308>>2]|0;
          $310 = HEAP32[(1768)>>2]|0;
          $311 = ($309>>>0)>=($310>>>0);
          $not$ = ($T$0$lcssa>>>0)>=($310>>>0);
          $312 = $311 & $not$;
          if ($312) {
           $313 = ((($309)) + 12|0);
           HEAP32[$313>>2] = $p$0;
           HEAP32[$308>>2] = $p$0;
           $314 = ((($p$0)) + 8|0);
           HEAP32[$314>>2] = $309;
           $315 = ((($p$0)) + 12|0);
           HEAP32[$315>>2] = $T$0$lcssa;
           $316 = ((($p$0)) + 24|0);
           HEAP32[$316>>2] = 0;
           break;
          } else {
           _abort();
           // unreachable;
          }
         }
        } while(0);
        $317 = HEAP32[(1784)>>2]|0;
        $318 = (($317) + -1)|0;
        HEAP32[(1784)>>2] = $318;
        $319 = ($318|0)==(0);
        if ($319) {
         $sp$0$in$i = (2208);
        } else {
         break L1;
        }
        while(1) {
         $sp$0$i = HEAP32[$sp$0$in$i>>2]|0;
         $320 = ($sp$0$i|0)==(0|0);
         $321 = ((($sp$0$i)) + 8|0);
         if ($320) {
          break;
         } else {
          $sp$0$in$i = $321;
         }
        }
        HEAP32[(1784)>>2] = -1;
        break L1;
       }
      }
     }
    }
   } while(0);
   _abort();
   // unreachable;
  }
 } while(0);
 return;
}
function _realloc($oldmem,$bytes) {
 $oldmem = $oldmem|0;
 $bytes = $bytes|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0;
 var $7 = 0, $8 = 0, $9 = 0, $mem$0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($oldmem|0)==(0|0);
 do {
  if ($0) {
   $1 = (_malloc($bytes)|0);
   $mem$0 = $1;
  } else {
   $2 = ($bytes>>>0)>(4294967231);
   if ($2) {
    $3 = (___errno_location()|0);
    HEAP32[$3>>2] = 12;
    $mem$0 = 0;
    break;
   }
   $4 = ($bytes>>>0)<(11);
   $5 = (($bytes) + 11)|0;
   $6 = $5 & -8;
   $7 = $4 ? 16 : $6;
   $8 = ((($oldmem)) + -8|0);
   $9 = (_try_realloc_chunk($8,$7)|0);
   $10 = ($9|0)==(0|0);
   if (!($10)) {
    $11 = ((($9)) + 8|0);
    $mem$0 = $11;
    break;
   }
   $12 = (_malloc($bytes)|0);
   $13 = ($12|0)==(0|0);
   if ($13) {
    $mem$0 = 0;
   } else {
    $14 = ((($oldmem)) + -4|0);
    $15 = HEAP32[$14>>2]|0;
    $16 = $15 & -8;
    $17 = $15 & 3;
    $18 = ($17|0)==(0);
    $19 = $18 ? 8 : 4;
    $20 = (($16) - ($19))|0;
    $21 = ($20>>>0)<($bytes>>>0);
    $22 = $21 ? $20 : $bytes;
    _memcpy(($12|0),($oldmem|0),($22|0))|0;
    _free($oldmem);
    $mem$0 = $12;
   }
  }
 } while(0);
 return ($mem$0|0);
}
function _strerror($e) {
 $e = $e|0;
 var $$lcssa = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i$03 = 0, $i$03$lcssa = 0, $i$12 = 0, $s$0$lcssa = 0, $s$01 = 0, $s$1 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $i$03 = 0;
 while(1) {
  $1 = (11751 + ($i$03)|0);
  $2 = HEAP8[$1>>0]|0;
  $3 = $2&255;
  $4 = ($3|0)==($e|0);
  if ($4) {
   $i$03$lcssa = $i$03;
   label = 2;
   break;
  }
  $5 = (($i$03) + 1)|0;
  $6 = ($5|0)==(87);
  if ($6) {
   $i$12 = 87;$s$01 = 11839;
   label = 5;
   break;
  } else {
   $i$03 = $5;
  }
 }
 if ((label|0) == 2) {
  $0 = ($i$03$lcssa|0)==(0);
  if ($0) {
   $s$0$lcssa = 11839;
  } else {
   $i$12 = $i$03$lcssa;$s$01 = 11839;
   label = 5;
  }
 }
 if ((label|0) == 5) {
  while(1) {
   label = 0;
   $s$1 = $s$01;
   while(1) {
    $7 = HEAP8[$s$1>>0]|0;
    $8 = ($7<<24>>24)==(0);
    $9 = ((($s$1)) + 1|0);
    if ($8) {
     $$lcssa = $9;
     break;
    } else {
     $s$1 = $9;
    }
   }
   $10 = (($i$12) + -1)|0;
   $11 = ($10|0)==(0);
   if ($11) {
    $s$0$lcssa = $$lcssa;
    break;
   } else {
    $i$12 = $10;$s$01 = $$lcssa;
    label = 5;
   }
  }
 }
 return ($s$0$lcssa|0);
}
function ___errno_location() {
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1464>>2]|0;
 $1 = ($0|0)==(0|0);
 if ($1) {
  $$0 = 2248;
 } else {
  $2 = (_pthread_self()|0);
  $3 = ((($2)) + 60|0);
  $4 = HEAP32[$3>>2]|0;
  $$0 = $4;
 }
 return ($$0|0);
}
function ___syscall_ret($r) {
 $r = $r|0;
 var $$0 = 0, $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($r>>>0)>(4294963200);
 if ($0) {
  $1 = (0 - ($r))|0;
  $2 = (___errno_location()|0);
  HEAP32[$2>>2] = $1;
  $$0 = -1;
 } else {
  $$0 = $r;
 }
 return ($$0|0);
}
function _frexp($x,$e) {
 $x = +$x;
 $e = $e|0;
 var $$0 = 0.0, $$01 = 0.0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0.0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0.0, $7 = 0.0, $8 = 0, $9 = 0, $storemerge = 0, label = 0, sp = 0;
 sp = STACKTOP;
 HEAPF64[tempDoublePtr>>3] = $x;$0 = HEAP32[tempDoublePtr>>2]|0;
 $1 = HEAP32[tempDoublePtr+4>>2]|0;
 $2 = (_bitshift64Lshr(($0|0),($1|0),52)|0);
 $3 = tempRet0;
 $4 = $2 & 2047;
 switch ($4|0) {
 case 0:  {
  $5 = $x != 0.0;
  if ($5) {
   $6 = $x * 1.8446744073709552E+19;
   $7 = (+_frexp($6,$e));
   $8 = HEAP32[$e>>2]|0;
   $9 = (($8) + -64)|0;
   $$01 = $7;$storemerge = $9;
  } else {
   $$01 = $x;$storemerge = 0;
  }
  HEAP32[$e>>2] = $storemerge;
  $$0 = $$01;
  break;
 }
 case 2047:  {
  $$0 = $x;
  break;
 }
 default: {
  $10 = (($4) + -1022)|0;
  HEAP32[$e>>2] = $10;
  $11 = $1 & -2146435073;
  $12 = $11 | 1071644672;
  HEAP32[tempDoublePtr>>2] = $0;HEAP32[tempDoublePtr+4>>2] = $12;$13 = +HEAPF64[tempDoublePtr>>3];
  $$0 = $13;
 }
 }
 return (+$$0);
}
function _frexpl($x,$e) {
 $x = +$x;
 $e = $e|0;
 var $0 = 0.0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (+_frexp($x,$e));
 return (+$0);
}
function _getopt($argc,$argv,$optstring) {
 $argc = $argc|0;
 $argv = $argv|0;
 $optstring = $optstring|0;
 var $$0 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0;
 var $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0;
 var $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $8 = 0, $9 = 0, $c = 0, $d = 0, $i$0$lcssa = 0, $i$04 = 0, $k$0 = 0, $or$cond = 0;
 var $or$cond3 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $c = sp + 4|0;
 $d = sp;
 $0 = HEAP32[1508>>2]|0;
 $1 = ($0|0)==(0);
 $2 = HEAP32[1516>>2]|0;
 $3 = ($2|0)!=(0);
 $or$cond = $1 | $3;
 if ($or$cond) {
  HEAP32[1516>>2] = 0;
  HEAP32[1520>>2] = 0;
  HEAP32[1508>>2] = 1;
  $4 = 1;
 } else {
  $4 = $0;
 }
 $5 = ($4|0)<($argc|0);
 L4: do {
  if ($5) {
   $6 = (($argv) + ($4<<2)|0);
   $7 = HEAP32[$6>>2]|0;
   $8 = ($7|0)==(0|0);
   if ($8) {
    $$0 = -1;
   } else {
    $9 = HEAP8[$7>>0]|0;
    $10 = ($9<<24>>24)==(45);
    if ($10) {
     $11 = ((($7)) + 1|0);
     $12 = HEAP8[$11>>0]|0;
     switch ($12<<24>>24) {
     case 0:  {
      $$0 = -1;
      break L4;
      break;
     }
     case 45:  {
      $13 = ((($7)) + 2|0);
      $14 = HEAP8[$13>>0]|0;
      $15 = ($14<<24>>24)==(0);
      if ($15) {
       $16 = (($4) + 1)|0;
       HEAP32[1508>>2] = $16;
       $$0 = -1;
       break L4;
      }
      break;
     }
     default: {
     }
     }
     $17 = HEAP32[1520>>2]|0;
     $18 = ($17|0)==(0);
     if ($18) {
      HEAP32[1520>>2] = 1;
      $20 = 1;
     } else {
      $20 = $17;
     }
     $19 = (($7) + ($20)|0);
     $21 = (_mbtowc($c,$19,4)|0);
     $22 = ($21|0)<(0);
     if ($22) {
      HEAP32[$c>>2] = 65533;
      $28 = 65533;$k$0 = 1;
     } else {
      $$pre = HEAP32[$c>>2]|0;
      $28 = $$pre;$k$0 = $21;
     }
     $23 = HEAP32[1508>>2]|0;
     $24 = (($argv) + ($23<<2)|0);
     $25 = HEAP32[$24>>2]|0;
     $26 = HEAP32[1520>>2]|0;
     $27 = (($25) + ($26)|0);
     HEAP32[1524>>2] = $28;
     $29 = (($26) + ($k$0))|0;
     HEAP32[1520>>2] = $29;
     $30 = (($25) + ($29)|0);
     $31 = HEAP8[$30>>0]|0;
     $32 = ($31<<24>>24)==(0);
     if ($32) {
      $33 = (($23) + 1)|0;
      HEAP32[1508>>2] = $33;
      HEAP32[1520>>2] = 0;
     }
     $34 = (_mbtowc($d,$optstring,4)|0);
     $35 = ($34|0)==(0);
     L22: do {
      if ($35) {
       $i$0$lcssa = 0;
      } else {
       $39 = $34;$i$04 = 0;
       while(1) {
        $36 = HEAP32[$d>>2]|0;
        $37 = HEAP32[$c>>2]|0;
        $38 = ($36|0)==($37|0);
        if ($38) {
         $i$0$lcssa = $i$04;
         break L22;
        }
        $40 = ($39|0)<(1);
        $41 = $40 ? 1 : $39;
        $42 = (($41) + ($i$04))|0;
        $43 = (($optstring) + ($42)|0);
        $44 = (_mbtowc($d,$43,4)|0);
        $45 = ($44|0)==(0);
        if ($45) {
         $i$0$lcssa = $42;
         break;
        } else {
         $39 = $44;$i$04 = $42;
        }
       }
      }
     } while(0);
     $46 = HEAP32[$d>>2]|0;
     $47 = HEAP32[$c>>2]|0;
     $48 = ($46|0)==($47|0);
     if (!($48)) {
      $49 = HEAP8[$optstring>>0]|0;
      $50 = ($49<<24>>24)!=(58);
      $51 = HEAP32[1512>>2]|0;
      $52 = ($51|0)!=(0);
      $or$cond3 = $50 & $52;
      if (!($or$cond3)) {
       $$0 = 63;
       break;
      }
      $53 = HEAP32[$argv>>2]|0;
      $54 = (_strlen($53)|0);
      (_write(2,$53,$54)|0);
      (_write(2,13643,18)|0);
      (_write(2,$27,$k$0)|0);
      (_write(2,13662,1)|0);
      $$0 = 63;
      break;
     }
     $55 = (($i$0$lcssa) + 1)|0;
     $56 = (($optstring) + ($55)|0);
     $57 = HEAP8[$56>>0]|0;
     $58 = ($57<<24>>24)==(58);
     if ($58) {
      $59 = HEAP32[1508>>2]|0;
      $60 = ($59|0)<($argc|0);
      if ($60) {
       $67 = (($59) + 1)|0;
       HEAP32[1508>>2] = $67;
       $68 = (($argv) + ($59<<2)|0);
       $69 = HEAP32[$68>>2]|0;
       $70 = HEAP32[1520>>2]|0;
       $71 = (($69) + ($70)|0);
       HEAP32[1528>>2] = $71;
       HEAP32[1520>>2] = 0;
       $$0 = $46;
       break;
      }
      $61 = HEAP8[$optstring>>0]|0;
      $62 = ($61<<24>>24)==(58);
      if ($62) {
       $$0 = 58;
      } else {
       $63 = HEAP32[1512>>2]|0;
       $64 = ($63|0)==(0);
       if ($64) {
        $$0 = 63;
       } else {
        $65 = HEAP32[$argv>>2]|0;
        $66 = (_strlen($65)|0);
        (_write(2,$65,$66)|0);
        (_write(2,13664,31)|0);
        (_write(2,$27,$k$0)|0);
        (_write(2,13662,1)|0);
        $$0 = 63;
       }
      }
     } else {
      $$0 = $46;
     }
    } else {
     $$0 = -1;
    }
   }
  } else {
   $$0 = -1;
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function _ioctl($fd,$req,$varargs) {
 $fd = $fd|0;
 $req = $req|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $ap = 0, $arglist_current = 0, $arglist_next = 0, $expanded = 0, $expanded2 = 0, $expanded4 = 0, $expanded5 = 0, $expanded6 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $ap = sp + 16|0;
 HEAP32[$ap>>2] = $varargs;
 $arglist_current = HEAP32[$ap>>2]|0;
 $0 = $arglist_current;
 $1 = ((0) + 4|0);
 $expanded2 = $1;
 $expanded = (($expanded2) - 1)|0;
 $2 = (($0) + ($expanded))|0;
 $3 = ((0) + 4|0);
 $expanded6 = $3;
 $expanded5 = (($expanded6) - 1)|0;
 $expanded4 = $expanded5 ^ -1;
 $4 = $2 & $expanded4;
 $5 = $4;
 $6 = HEAP32[$5>>2]|0;
 $arglist_next = ((($5)) + 4|0);
 HEAP32[$ap>>2] = $arglist_next;
 HEAP32[$vararg_buffer>>2] = $fd;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $req;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $6;
 $7 = (___syscall54(54,($vararg_buffer|0))|0);
 $8 = (___syscall_ret($7)|0);
 STACKTOP = sp;return ($8|0);
}
function _mbtowc($wc,$src,$n) {
 $wc = $wc|0;
 $src = $src|0;
 $n = $n|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $dummy = 0, $dummy$wc = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $dummy = sp;
 $0 = ($src|0)==(0|0);
 L1: do {
  if ($0) {
   $$0 = 0;
  } else {
   $1 = ($n|0)==(0);
   do {
    if (!($1)) {
     $2 = ($wc|0)==(0|0);
     $dummy$wc = $2 ? $dummy : $wc;
     $3 = HEAP8[$src>>0]|0;
     $4 = $3&255;
     $5 = ($3<<24>>24)>(-1);
     if ($5) {
      HEAP32[$dummy$wc>>2] = $4;
      $6 = ($3<<24>>24)!=(0);
      $7 = $6&1;
      $$0 = $7;
      break L1;
     }
     $8 = (($4) + -194)|0;
     $9 = ($8>>>0)>(50);
     if (!($9)) {
      $10 = ((($src)) + 1|0);
      $11 = (1532 + ($8<<2)|0);
      $12 = HEAP32[$11>>2]|0;
      $13 = ($n>>>0)<(4);
      if ($13) {
       $14 = ($n*6)|0;
       $15 = (($14) + -6)|0;
       $16 = -2147483648 >>> $15;
       $17 = $12 & $16;
       $18 = ($17|0)==(0);
       if (!($18)) {
        break;
       }
      }
      $19 = HEAP8[$10>>0]|0;
      $20 = $19&255;
      $21 = $20 >>> 3;
      $22 = (($21) + -16)|0;
      $23 = $12 >> 26;
      $24 = (($21) + ($23))|0;
      $25 = $22 | $24;
      $26 = ($25>>>0)>(7);
      if (!($26)) {
       $27 = $12 << 6;
       $28 = (($20) + -128)|0;
       $29 = $28 | $27;
       $30 = ($29|0)<(0);
       if (!($30)) {
        HEAP32[$dummy$wc>>2] = $29;
        $$0 = 2;
        break L1;
       }
       $31 = ((($src)) + 2|0);
       $32 = HEAP8[$31>>0]|0;
       $33 = $32&255;
       $34 = $33 & 192;
       $35 = ($34|0)==(128);
       if ($35) {
        $36 = $29 << 6;
        $37 = (($33) + -128)|0;
        $38 = $37 | $36;
        $39 = ($38|0)<(0);
        if (!($39)) {
         HEAP32[$dummy$wc>>2] = $38;
         $$0 = 3;
         break L1;
        }
        $40 = ((($src)) + 3|0);
        $41 = HEAP8[$40>>0]|0;
        $42 = $41&255;
        $43 = $42 & 192;
        $44 = ($43|0)==(128);
        if ($44) {
         $45 = $38 << 6;
         $46 = (($42) + -128)|0;
         $47 = $46 | $45;
         HEAP32[$dummy$wc>>2] = $47;
         $$0 = 4;
         break L1;
        }
       }
      }
     }
    }
   } while(0);
   $48 = (___errno_location()|0);
   HEAP32[$48>>2] = 84;
   $$0 = -1;
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function _wcrtomb($s,$wc,$st) {
 $s = $s|0;
 $wc = $wc|0;
 $st = $st|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0;
 var $44 = 0, $45 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 do {
  if ($0) {
   $$0 = 1;
  } else {
   $1 = ($wc>>>0)<(128);
   if ($1) {
    $2 = $wc&255;
    HEAP8[$s>>0] = $2;
    $$0 = 1;
    break;
   }
   $3 = ($wc>>>0)<(2048);
   if ($3) {
    $4 = $wc >>> 6;
    $5 = $4 | 192;
    $6 = $5&255;
    $7 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $6;
    $8 = $wc & 63;
    $9 = $8 | 128;
    $10 = $9&255;
    HEAP8[$7>>0] = $10;
    $$0 = 2;
    break;
   }
   $11 = ($wc>>>0)<(55296);
   $12 = $wc & -8192;
   $13 = ($12|0)==(57344);
   $or$cond = $11 | $13;
   if ($or$cond) {
    $14 = $wc >>> 12;
    $15 = $14 | 224;
    $16 = $15&255;
    $17 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $16;
    $18 = $wc >>> 6;
    $19 = $18 & 63;
    $20 = $19 | 128;
    $21 = $20&255;
    $22 = ((($s)) + 2|0);
    HEAP8[$17>>0] = $21;
    $23 = $wc & 63;
    $24 = $23 | 128;
    $25 = $24&255;
    HEAP8[$22>>0] = $25;
    $$0 = 3;
    break;
   }
   $26 = (($wc) + -65536)|0;
   $27 = ($26>>>0)<(1048576);
   if ($27) {
    $28 = $wc >>> 18;
    $29 = $28 | 240;
    $30 = $29&255;
    $31 = ((($s)) + 1|0);
    HEAP8[$s>>0] = $30;
    $32 = $wc >>> 12;
    $33 = $32 & 63;
    $34 = $33 | 128;
    $35 = $34&255;
    $36 = ((($s)) + 2|0);
    HEAP8[$31>>0] = $35;
    $37 = $wc >>> 6;
    $38 = $37 & 63;
    $39 = $38 | 128;
    $40 = $39&255;
    $41 = ((($s)) + 3|0);
    HEAP8[$36>>0] = $40;
    $42 = $wc & 63;
    $43 = $42 | 128;
    $44 = $43&255;
    HEAP8[$41>>0] = $44;
    $$0 = 4;
    break;
   } else {
    $45 = (___errno_location()|0);
    HEAP32[$45>>2] = 84;
    $$0 = -1;
    break;
   }
  }
 } while(0);
 return ($$0|0);
}
function _wctomb($s,$wc) {
 $s = $s|0;
 $wc = $wc|0;
 var $$0 = 0, $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($s|0)==(0|0);
 if ($0) {
  $$0 = 0;
 } else {
  $1 = (_wcrtomb($s,$wc,0)|0);
  $$0 = $1;
 }
 return ($$0|0);
}
function _fclose($f) {
 $f = $f|0;
 var $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(-1);
 if ($2) {
  (___lockfile($f)|0);
 }
 $3 = HEAP32[$f>>2]|0;
 $4 = $3 & 1;
 $5 = ($4|0)!=(0);
 if (!($5)) {
  ___lock(((1492)|0));
  $6 = ((($f)) + 52|0);
  $7 = HEAP32[$6>>2]|0;
  $8 = ($7|0)==(0|0);
  $9 = $7;
  $$pre = ((($f)) + 56|0);
  if (!($8)) {
   $10 = HEAP32[$$pre>>2]|0;
   $11 = ((($7)) + 56|0);
   HEAP32[$11>>2] = $10;
  }
  $12 = HEAP32[$$pre>>2]|0;
  $13 = ($12|0)==(0|0);
  $14 = $12;
  if (!($13)) {
   $15 = ((($12)) + 52|0);
   HEAP32[$15>>2] = $9;
  }
  $16 = HEAP32[(1488)>>2]|0;
  $17 = ($16|0)==($f|0);
  if ($17) {
   HEAP32[(1488)>>2] = $14;
  }
  ___unlock(((1492)|0));
 }
 $18 = (_fflush($f)|0);
 $19 = ((($f)) + 12|0);
 $20 = HEAP32[$19>>2]|0;
 $21 = (FUNCTION_TABLE_ii[$20 & 3]($f)|0);
 $22 = $21 | $18;
 $23 = ((($f)) + 92|0);
 $24 = HEAP32[$23>>2]|0;
 $25 = ($24|0)==(0|0);
 if (!($25)) {
  _free($24);
 }
 if (!($5)) {
  _free($f);
 }
 return ($22|0);
}
function _fflush($f) {
 $f = $f|0;
 var $$0 = 0, $$01 = 0, $$012 = 0, $$014 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $phitmp = 0, $r$0$lcssa = 0, $r$03 = 0, $r$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($f|0)==(0|0);
 do {
  if ($0) {
   $7 = HEAP32[1748>>2]|0;
   $8 = ($7|0)==(0|0);
   if ($8) {
    $27 = 0;
   } else {
    $9 = HEAP32[1748>>2]|0;
    $10 = (_fflush($9)|0);
    $27 = $10;
   }
   ___lock(((1492)|0));
   $$012 = HEAP32[(1488)>>2]|0;
   $11 = ($$012|0)==(0|0);
   if ($11) {
    $r$0$lcssa = $27;
   } else {
    $$014 = $$012;$r$03 = $27;
    while(1) {
     $12 = ((($$014)) + 76|0);
     $13 = HEAP32[$12>>2]|0;
     $14 = ($13|0)>(-1);
     if ($14) {
      $15 = (___lockfile($$014)|0);
      $23 = $15;
     } else {
      $23 = 0;
     }
     $16 = ((($$014)) + 20|0);
     $17 = HEAP32[$16>>2]|0;
     $18 = ((($$014)) + 28|0);
     $19 = HEAP32[$18>>2]|0;
     $20 = ($17>>>0)>($19>>>0);
     if ($20) {
      $21 = (___fflush_unlocked($$014)|0);
      $22 = $21 | $r$03;
      $r$1 = $22;
     } else {
      $r$1 = $r$03;
     }
     $24 = ($23|0)==(0);
     if (!($24)) {
      ___unlockfile($$014);
     }
     $25 = ((($$014)) + 56|0);
     $$01 = HEAP32[$25>>2]|0;
     $26 = ($$01|0)==(0|0);
     if ($26) {
      $r$0$lcssa = $r$1;
      break;
     } else {
      $$014 = $$01;$r$03 = $r$1;
     }
    }
   }
   ___unlock(((1492)|0));
   $$0 = $r$0$lcssa;
  } else {
   $1 = ((($f)) + 76|0);
   $2 = HEAP32[$1>>2]|0;
   $3 = ($2|0)>(-1);
   if (!($3)) {
    $4 = (___fflush_unlocked($f)|0);
    $$0 = $4;
    break;
   }
   $5 = (___lockfile($f)|0);
   $phitmp = ($5|0)==(0);
   $6 = (___fflush_unlocked($f)|0);
   if ($phitmp) {
    $$0 = $6;
   } else {
    ___unlockfile($f);
    $$0 = $6;
   }
  }
 } while(0);
 return ($$0|0);
}
function _fgetc($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)<(0);
 if ($2) {
  label = 3;
 } else {
  $3 = (___lockfile($f)|0);
  $4 = ($3|0)==(0);
  if ($4) {
   label = 3;
  } else {
   $14 = ((($f)) + 4|0);
   $15 = HEAP32[$14>>2]|0;
   $16 = ((($f)) + 8|0);
   $17 = HEAP32[$16>>2]|0;
   $18 = ($15>>>0)<($17>>>0);
   if ($18) {
    $19 = ((($15)) + 1|0);
    HEAP32[$14>>2] = $19;
    $20 = HEAP8[$15>>0]|0;
    $21 = $20&255;
    $23 = $21;
   } else {
    $22 = (___uflow($f)|0);
    $23 = $22;
   }
   ___unlockfile($f);
   $$0 = $23;
  }
 }
 do {
  if ((label|0) == 3) {
   $5 = ((($f)) + 4|0);
   $6 = HEAP32[$5>>2]|0;
   $7 = ((($f)) + 8|0);
   $8 = HEAP32[$7>>2]|0;
   $9 = ($6>>>0)<($8>>>0);
   if ($9) {
    $10 = ((($6)) + 1|0);
    HEAP32[$5>>2] = $10;
    $11 = HEAP8[$6>>0]|0;
    $12 = $11&255;
    $$0 = $12;
    break;
   } else {
    $13 = (___uflow($f)|0);
    $$0 = $13;
    break;
   }
  }
 } while(0);
 return ($$0|0);
}
function _fileno($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)>(-1);
 if ($2) {
  $3 = (___lockfile($f)|0);
  $phitmp = ($3|0)==(0);
  if (!($phitmp)) {
   ___unlockfile($f);
  }
 }
 $4 = ((($f)) + 60|0);
 $5 = HEAP32[$4>>2]|0;
 return ($5|0);
}
function _fopen($filename,$mode) {
 $filename = $filename|0;
 $mode = $mode|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $memchr = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $0 = HEAP8[$mode>>0]|0;
 $1 = $0 << 24 >> 24;
 $memchr = (_memchr(13696,$1,4)|0);
 $2 = ($memchr|0)==(0|0);
 if ($2) {
  $3 = (___errno_location()|0);
  HEAP32[$3>>2] = 22;
  $$0 = 0;
 } else {
  $4 = (___fmodeflags($mode)|0);
  $5 = $4 | 32768;
  HEAP32[$vararg_buffer>>2] = $filename;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $5;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = 438;
  $6 = (___syscall5(5,($vararg_buffer|0))|0);
  $7 = (___syscall_ret($6)|0);
  $8 = ($7|0)<(0);
  if ($8) {
   $$0 = 0;
  } else {
   $9 = (___fdopen($7,$mode)|0);
   $10 = ($9|0)==(0|0);
   if ($10) {
    HEAP32[$vararg_buffer3>>2] = $7;
    (___syscall6(6,($vararg_buffer3|0))|0);
    $$0 = 0;
   } else {
    $$0 = $9;
   }
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function _fprintf($f,$fmt,$varargs) {
 $f = $f|0;
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = (_vfprintf($f,$fmt,$ap)|0);
 STACKTOP = sp;return ($0|0);
}
function _fputc($c,$f) {
 $c = $c|0;
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 76|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)<(0);
 if ($2) {
  label = 3;
 } else {
  $3 = (___lockfile($f)|0);
  $4 = ($3|0)==(0);
  if ($4) {
   label = 3;
  } else {
   $18 = ((($f)) + 75|0);
   $19 = HEAP8[$18>>0]|0;
   $20 = $19 << 24 >> 24;
   $21 = ($20|0)==($c|0);
   if ($21) {
    label = 10;
   } else {
    $22 = ((($f)) + 20|0);
    $23 = HEAP32[$22>>2]|0;
    $24 = ((($f)) + 16|0);
    $25 = HEAP32[$24>>2]|0;
    $26 = ($23>>>0)<($25>>>0);
    if ($26) {
     $27 = $c&255;
     $28 = ((($23)) + 1|0);
     HEAP32[$22>>2] = $28;
     HEAP8[$23>>0] = $27;
     $29 = $c & 255;
     $31 = $29;
    } else {
     label = 10;
    }
   }
   if ((label|0) == 10) {
    $30 = (___overflow($f,$c)|0);
    $31 = $30;
   }
   ___unlockfile($f);
   $$0 = $31;
  }
 }
 do {
  if ((label|0) == 3) {
   $5 = ((($f)) + 75|0);
   $6 = HEAP8[$5>>0]|0;
   $7 = $6 << 24 >> 24;
   $8 = ($7|0)==($c|0);
   if (!($8)) {
    $9 = ((($f)) + 20|0);
    $10 = HEAP32[$9>>2]|0;
    $11 = ((($f)) + 16|0);
    $12 = HEAP32[$11>>2]|0;
    $13 = ($10>>>0)<($12>>>0);
    if ($13) {
     $14 = $c&255;
     $15 = ((($10)) + 1|0);
     HEAP32[$9>>2] = $15;
     HEAP8[$10>>0] = $14;
     $16 = $c & 255;
     $$0 = $16;
     break;
    }
   }
   $17 = (___overflow($f,$c)|0);
   $$0 = $17;
  }
 } while(0);
 return ($$0|0);
}
function _fputs($s,$f) {
 $s = $s|0;
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_strlen($s)|0);
 $1 = (_fwrite($s,$0,1,$f)|0);
 $2 = (($1) + -1)|0;
 return ($2|0);
}
function ___fwritex($s,$l,$f) {
 $s = $s|0;
 $l = $l|0;
 $f = $f|0;
 var $$0 = 0, $$01 = 0, $$02 = 0, $$pre = 0, $$pre6 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0;
 var $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $i$0 = 0, $i$0$lcssa10 = 0;
 var $i$1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 16|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0|0);
 if ($2) {
  $3 = (___towrite($f)|0);
  $4 = ($3|0)==(0);
  if ($4) {
   $$pre = HEAP32[$0>>2]|0;
   $7 = $$pre;
   label = 4;
  } else {
   $$0 = 0;
  }
 } else {
  $7 = $1;
  label = 4;
 }
 L4: do {
  if ((label|0) == 4) {
   $5 = ((($f)) + 20|0);
   $6 = HEAP32[$5>>2]|0;
   $8 = $7;
   $9 = $6;
   $10 = (($8) - ($9))|0;
   $11 = ($10>>>0)<($l>>>0);
   if ($11) {
    $12 = ((($f)) + 36|0);
    $13 = HEAP32[$12>>2]|0;
    $14 = (FUNCTION_TABLE_iiii[$13 & 7]($f,$s,$l)|0);
    $$0 = $14;
    break;
   }
   $15 = ((($f)) + 75|0);
   $16 = HEAP8[$15>>0]|0;
   $17 = ($16<<24>>24)>(-1);
   L9: do {
    if ($17) {
     $i$0 = $l;
     while(1) {
      $18 = ($i$0|0)==(0);
      if ($18) {
       $$01 = $l;$$02 = $s;$29 = $6;$i$1 = 0;
       break L9;
      }
      $19 = (($i$0) + -1)|0;
      $20 = (($s) + ($19)|0);
      $21 = HEAP8[$20>>0]|0;
      $22 = ($21<<24>>24)==(10);
      if ($22) {
       $i$0$lcssa10 = $i$0;
       break;
      } else {
       $i$0 = $19;
      }
     }
     $23 = ((($f)) + 36|0);
     $24 = HEAP32[$23>>2]|0;
     $25 = (FUNCTION_TABLE_iiii[$24 & 7]($f,$s,$i$0$lcssa10)|0);
     $26 = ($25>>>0)<($i$0$lcssa10>>>0);
     if ($26) {
      $$0 = $i$0$lcssa10;
      break L4;
     }
     $27 = (($s) + ($i$0$lcssa10)|0);
     $28 = (($l) - ($i$0$lcssa10))|0;
     $$pre6 = HEAP32[$5>>2]|0;
     $$01 = $28;$$02 = $27;$29 = $$pre6;$i$1 = $i$0$lcssa10;
    } else {
     $$01 = $l;$$02 = $s;$29 = $6;$i$1 = 0;
    }
   } while(0);
   _memcpy(($29|0),($$02|0),($$01|0))|0;
   $30 = HEAP32[$5>>2]|0;
   $31 = (($30) + ($$01)|0);
   HEAP32[$5>>2] = $31;
   $32 = (($i$1) + ($$01))|0;
   $$0 = $32;
  }
 } while(0);
 return ($$0|0);
}
function _fwrite($src,$size,$nmemb,$f) {
 $src = $src|0;
 $size = $size|0;
 $nmemb = $nmemb|0;
 $f = $f|0;
 var $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = Math_imul($nmemb, $size)|0;
 $1 = ((($f)) + 76|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)>(-1);
 if ($3) {
  $5 = (___lockfile($f)|0);
  $phitmp = ($5|0)==(0);
  $6 = (___fwritex($src,$0,$f)|0);
  if ($phitmp) {
   $7 = $6;
  } else {
   ___unlockfile($f);
   $7 = $6;
  }
 } else {
  $4 = (___fwritex($src,$0,$f)|0);
  $7 = $4;
 }
 $8 = ($7|0)==($0|0);
 if ($8) {
  $10 = $nmemb;
 } else {
  $9 = (($7>>>0) / ($size>>>0))&-1;
  $10 = $9;
 }
 return ($10|0);
}
function _getchar() {
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1740>>2]|0;
 $1 = (_fgetc($0)|0);
 return ($1|0);
}
function _printf($fmt,$varargs) {
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $1 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = HEAP32[1744>>2]|0;
 $1 = (_vfprintf($0,$fmt,$ap)|0);
 STACKTOP = sp;return ($1|0);
}
function _putchar($c) {
 $c = $c|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1744>>2]|0;
 $1 = (_fputc($c,$0)|0);
 return ($1|0);
}
function _puts($s) {
 $s = $s|0;
 var $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, $phitmp = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[1744>>2]|0;
 $1 = ((($0)) + 76|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)>(-1);
 if ($3) {
  $4 = (___lockfile($0)|0);
  $19 = $4;
 } else {
  $19 = 0;
 }
 $5 = (_fputs($s,$0)|0);
 $6 = ($5|0)<(0);
 do {
  if ($6) {
   $18 = 1;
  } else {
   $7 = ((($0)) + 75|0);
   $8 = HEAP8[$7>>0]|0;
   $9 = ($8<<24>>24)==(10);
   if (!($9)) {
    $10 = ((($0)) + 20|0);
    $11 = HEAP32[$10>>2]|0;
    $12 = ((($0)) + 16|0);
    $13 = HEAP32[$12>>2]|0;
    $14 = ($11>>>0)<($13>>>0);
    if ($14) {
     $15 = ((($11)) + 1|0);
     HEAP32[$10>>2] = $15;
     HEAP8[$11>>0] = 10;
     $18 = 0;
     break;
    }
   }
   $16 = (___overflow($0,10)|0);
   $phitmp = ($16|0)<(0);
   $18 = $phitmp;
  }
 } while(0);
 $17 = $18 << 31 >> 31;
 $20 = ($19|0)==(0);
 if (!($20)) {
  ___unlockfile($0);
 }
 return ($17|0);
}
function _sprintf($s,$fmt,$varargs) {
 $s = $s|0;
 $fmt = $fmt|0;
 $varargs = $varargs|0;
 var $0 = 0, $ap = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap = sp;
 HEAP32[$ap>>2] = $varargs;
 $0 = (_vsprintf($s,$fmt,$ap)|0);
 STACKTOP = sp;return ($0|0);
}
function _vfprintf($f,$fmt,$ap) {
 $f = $f|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 var $$ = 0, $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0;
 var $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $ap2 = 0, $internal_buf = 0, $nl_arg = 0, $nl_type = 0;
 var $ret$1 = 0, $ret$1$ = 0, $vacopy_currentptr = 0, dest = 0, label = 0, sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 224|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $ap2 = sp + 120|0;
 $nl_type = sp + 80|0;
 $nl_arg = sp;
 $internal_buf = sp + 136|0;
 dest=$nl_type; stop=dest+40|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
 $vacopy_currentptr = HEAP32[$ap>>2]|0;
 HEAP32[$ap2>>2] = $vacopy_currentptr;
 $0 = (_printf_core(0,$fmt,$ap2,$nl_arg,$nl_type)|0);
 $1 = ($0|0)<(0);
 if ($1) {
  $$0 = -1;
 } else {
  $2 = ((($f)) + 76|0);
  $3 = HEAP32[$2>>2]|0;
  $4 = ($3|0)>(-1);
  if ($4) {
   $5 = (___lockfile($f)|0);
   $32 = $5;
  } else {
   $32 = 0;
  }
  $6 = HEAP32[$f>>2]|0;
  $7 = $6 & 32;
  $8 = ((($f)) + 74|0);
  $9 = HEAP8[$8>>0]|0;
  $10 = ($9<<24>>24)<(1);
  if ($10) {
   $11 = $6 & -33;
   HEAP32[$f>>2] = $11;
  }
  $12 = ((($f)) + 48|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ($13|0)==(0);
  if ($14) {
   $16 = ((($f)) + 44|0);
   $17 = HEAP32[$16>>2]|0;
   HEAP32[$16>>2] = $internal_buf;
   $18 = ((($f)) + 28|0);
   HEAP32[$18>>2] = $internal_buf;
   $19 = ((($f)) + 20|0);
   HEAP32[$19>>2] = $internal_buf;
   HEAP32[$12>>2] = 80;
   $20 = ((($internal_buf)) + 80|0);
   $21 = ((($f)) + 16|0);
   HEAP32[$21>>2] = $20;
   $22 = (_printf_core($f,$fmt,$ap2,$nl_arg,$nl_type)|0);
   $23 = ($17|0)==(0|0);
   if ($23) {
    $ret$1 = $22;
   } else {
    $24 = ((($f)) + 36|0);
    $25 = HEAP32[$24>>2]|0;
    (FUNCTION_TABLE_iiii[$25 & 7]($f,0,0)|0);
    $26 = HEAP32[$19>>2]|0;
    $27 = ($26|0)==(0|0);
    $$ = $27 ? -1 : $22;
    HEAP32[$16>>2] = $17;
    HEAP32[$12>>2] = 0;
    HEAP32[$21>>2] = 0;
    HEAP32[$18>>2] = 0;
    HEAP32[$19>>2] = 0;
    $ret$1 = $$;
   }
  } else {
   $15 = (_printf_core($f,$fmt,$ap2,$nl_arg,$nl_type)|0);
   $ret$1 = $15;
  }
  $28 = HEAP32[$f>>2]|0;
  $29 = $28 & 32;
  $30 = ($29|0)==(0);
  $ret$1$ = $30 ? $ret$1 : -1;
  $31 = $28 | $7;
  HEAP32[$f>>2] = $31;
  $33 = ($32|0)==(0);
  if (!($33)) {
   ___unlockfile($f);
  }
  $$0 = $ret$1$;
 }
 STACKTOP = sp;return ($$0|0);
}
function _vsnprintf($s,$n,$fmt,$ap) {
 $s = $s|0;
 $n = $n|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 var $$$02 = 0, $$0 = 0, $$01 = 0, $$02 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $b = 0, $f = 0, dest = 0, label = 0, sp = 0, src = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 128|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $b = sp + 112|0;
 $f = sp;
 dest=$f; src=2252; stop=dest+112|0; do { HEAP32[dest>>2]=HEAP32[src>>2]|0; dest=dest+4|0; src=src+4|0; } while ((dest|0) < (stop|0));
 $0 = (($n) + -1)|0;
 $1 = ($0>>>0)>(2147483646);
 if ($1) {
  $2 = ($n|0)==(0);
  if ($2) {
   $$01 = $b;$$02 = 1;
   label = 4;
  } else {
   $3 = (___errno_location()|0);
   HEAP32[$3>>2] = 75;
   $$0 = -1;
  }
 } else {
  $$01 = $s;$$02 = $n;
  label = 4;
 }
 if ((label|0) == 4) {
  $4 = $$01;
  $5 = (-2 - ($4))|0;
  $6 = ($$02>>>0)>($5>>>0);
  $$$02 = $6 ? $5 : $$02;
  $7 = ((($f)) + 48|0);
  HEAP32[$7>>2] = $$$02;
  $8 = ((($f)) + 20|0);
  HEAP32[$8>>2] = $$01;
  $9 = ((($f)) + 44|0);
  HEAP32[$9>>2] = $$01;
  $10 = (($$01) + ($$$02)|0);
  $11 = ((($f)) + 16|0);
  HEAP32[$11>>2] = $10;
  $12 = ((($f)) + 28|0);
  HEAP32[$12>>2] = $10;
  $13 = (_vfprintf($f,$fmt,$ap)|0);
  $14 = ($$$02|0)==(0);
  if ($14) {
   $$0 = $13;
  } else {
   $15 = HEAP32[$8>>2]|0;
   $16 = HEAP32[$11>>2]|0;
   $17 = ($15|0)==($16|0);
   $18 = $17 << 31 >> 31;
   $19 = (($15) + ($18)|0);
   HEAP8[$19>>0] = 0;
   $$0 = $13;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function _vsprintf($s,$fmt,$ap) {
 $s = $s|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 var $0 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_vsnprintf($s,2147483647,$fmt,$ap)|0);
 return ($0|0);
}
function ___fdopen($fd,$mode) {
 $fd = $fd|0;
 $mode = $mode|0;
 var $$0 = 0, $$pre = 0, $$pre1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $memchr = 0, $tio = 0, $vararg_buffer = 0, $vararg_buffer12 = 0, $vararg_buffer3 = 0, $vararg_buffer7 = 0, $vararg_ptr1 = 0, $vararg_ptr10 = 0, $vararg_ptr11 = 0, $vararg_ptr15 = 0, $vararg_ptr16 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, dest = 0, label = 0;
 var sp = 0, stop = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 112|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer12 = sp + 40|0;
 $vararg_buffer7 = sp + 24|0;
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $tio = sp + 52|0;
 $0 = HEAP8[$mode>>0]|0;
 $1 = $0 << 24 >> 24;
 $memchr = (_memchr(13696,$1,4)|0);
 $2 = ($memchr|0)==(0|0);
 if ($2) {
  $3 = (___errno_location()|0);
  HEAP32[$3>>2] = 22;
  $$0 = 0;
 } else {
  $4 = (_malloc(1144)|0);
  $5 = ($4|0)==(0|0);
  if ($5) {
   $$0 = 0;
  } else {
   dest=$4; stop=dest+112|0; do { HEAP32[dest>>2]=0|0; dest=dest+4|0; } while ((dest|0) < (stop|0));
   $6 = (_strchr($mode,43)|0);
   $7 = ($6|0)==(0|0);
   if ($7) {
    $8 = ($0<<24>>24)==(114);
    $9 = $8 ? 8 : 4;
    HEAP32[$4>>2] = $9;
   }
   $10 = (_strchr($mode,101)|0);
   $11 = ($10|0)==(0|0);
   if ($11) {
    $12 = $0;
   } else {
    HEAP32[$vararg_buffer>>2] = $fd;
    $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
    HEAP32[$vararg_ptr1>>2] = 2;
    $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
    HEAP32[$vararg_ptr2>>2] = 1;
    (___syscall221(221,($vararg_buffer|0))|0);
    $$pre = HEAP8[$mode>>0]|0;
    $12 = $$pre;
   }
   $13 = ($12<<24>>24)==(97);
   if ($13) {
    HEAP32[$vararg_buffer3>>2] = $fd;
    $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
    HEAP32[$vararg_ptr6>>2] = 3;
    $14 = (___syscall221(221,($vararg_buffer3|0))|0);
    $15 = $14 & 1024;
    $16 = ($15|0)==(0);
    if ($16) {
     $17 = $14 | 1024;
     HEAP32[$vararg_buffer7>>2] = $fd;
     $vararg_ptr10 = ((($vararg_buffer7)) + 4|0);
     HEAP32[$vararg_ptr10>>2] = 4;
     $vararg_ptr11 = ((($vararg_buffer7)) + 8|0);
     HEAP32[$vararg_ptr11>>2] = $17;
     (___syscall221(221,($vararg_buffer7|0))|0);
    }
    $18 = HEAP32[$4>>2]|0;
    $19 = $18 | 128;
    HEAP32[$4>>2] = $19;
    $26 = $19;
   } else {
    $$pre1 = HEAP32[$4>>2]|0;
    $26 = $$pre1;
   }
   $20 = ((($4)) + 60|0);
   HEAP32[$20>>2] = $fd;
   $21 = ((($4)) + 120|0);
   $22 = ((($4)) + 44|0);
   HEAP32[$22>>2] = $21;
   $23 = ((($4)) + 48|0);
   HEAP32[$23>>2] = 1024;
   $24 = ((($4)) + 75|0);
   HEAP8[$24>>0] = -1;
   $25 = $26 & 8;
   $27 = ($25|0)==(0);
   if ($27) {
    HEAP32[$vararg_buffer12>>2] = $fd;
    $vararg_ptr15 = ((($vararg_buffer12)) + 4|0);
    HEAP32[$vararg_ptr15>>2] = 21505;
    $vararg_ptr16 = ((($vararg_buffer12)) + 8|0);
    HEAP32[$vararg_ptr16>>2] = $tio;
    $28 = (___syscall54(54,($vararg_buffer12|0))|0);
    $29 = ($28|0)==(0);
    if ($29) {
     HEAP8[$24>>0] = 10;
    }
   }
   $30 = ((($4)) + 32|0);
   HEAP32[$30>>2] = 5;
   $31 = ((($4)) + 36|0);
   HEAP32[$31>>2] = 3;
   $32 = ((($4)) + 40|0);
   HEAP32[$32>>2] = 4;
   $33 = ((($4)) + 12|0);
   HEAP32[$33>>2] = 2;
   $34 = HEAP32[(1468)>>2]|0;
   $35 = ($34|0)==(0);
   if ($35) {
    $36 = ((($4)) + 76|0);
    HEAP32[$36>>2] = -1;
   }
   ___lock(((1492)|0));
   $37 = HEAP32[(1488)>>2]|0;
   $38 = ((($4)) + 56|0);
   HEAP32[$38>>2] = $37;
   $39 = ($37|0)==(0);
   if (!($39)) {
    $40 = $37;
    $41 = ((($40)) + 52|0);
    HEAP32[$41>>2] = $4;
   }
   HEAP32[(1488)>>2] = $4;
   ___unlock(((1492)|0));
   $$0 = $4;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function ___fmodeflags($mode) {
 $mode = $mode|0;
 var $$ = 0, $$flags$4 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $flags$0 = 0, $flags$0$ = 0, $flags$2 = 0;
 var $flags$2$ = 0, $flags$4 = 0, $not$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_strchr($mode,43)|0);
 $1 = ($0|0)==(0|0);
 $2 = HEAP8[$mode>>0]|0;
 $not$ = ($2<<24>>24)!=(114);
 $$ = $not$&1;
 $flags$0 = $1 ? $$ : 2;
 $3 = (_strchr($mode,120)|0);
 $4 = ($3|0)==(0|0);
 $5 = $flags$0 | 128;
 $flags$0$ = $4 ? $flags$0 : $5;
 $6 = (_strchr($mode,101)|0);
 $7 = ($6|0)==(0|0);
 $8 = $flags$0$ | 524288;
 $flags$2 = $7 ? $flags$0$ : $8;
 $9 = ($2<<24>>24)==(114);
 $10 = $flags$2 | 64;
 $flags$2$ = $9 ? $flags$2 : $10;
 $11 = ($2<<24>>24)==(119);
 $12 = $flags$2$ | 512;
 $flags$4 = $11 ? $12 : $flags$2$;
 $13 = ($2<<24>>24)==(97);
 $14 = $flags$4 | 1024;
 $$flags$4 = $13 ? $14 : $flags$4;
 return ($$flags$4|0);
}
function ___lockfile($f) {
 $f = $f|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return 0;
}
function ___unlockfile($f) {
 $f = $f|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 return;
}
function ___overflow($f,$_c) {
 $f = $f|0;
 $_c = $_c|0;
 var $$0 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $c = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $c = sp;
 $0 = $_c&255;
 HEAP8[$c>>0] = $0;
 $1 = ((($f)) + 16|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)==(0|0);
 if ($3) {
  $4 = (___towrite($f)|0);
  $5 = ($4|0)==(0);
  if ($5) {
   $$pre = HEAP32[$1>>2]|0;
   $9 = $$pre;
   label = 4;
  } else {
   $$0 = -1;
  }
 } else {
  $9 = $2;
  label = 4;
 }
 do {
  if ((label|0) == 4) {
   $6 = ((($f)) + 20|0);
   $7 = HEAP32[$6>>2]|0;
   $8 = ($7>>>0)<($9>>>0);
   if ($8) {
    $10 = $_c & 255;
    $11 = ((($f)) + 75|0);
    $12 = HEAP8[$11>>0]|0;
    $13 = $12 << 24 >> 24;
    $14 = ($10|0)==($13|0);
    if (!($14)) {
     $15 = ((($7)) + 1|0);
     HEAP32[$6>>2] = $15;
     HEAP8[$7>>0] = $0;
     $$0 = $10;
     break;
    }
   }
   $16 = ((($f)) + 36|0);
   $17 = HEAP32[$16>>2]|0;
   $18 = (FUNCTION_TABLE_iiii[$17 & 7]($f,$c,1)|0);
   $19 = ($18|0)==(1);
   if ($19) {
    $20 = HEAP8[$c>>0]|0;
    $21 = $20&255;
    $$0 = $21;
   } else {
    $$0 = -1;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function ___stdio_close($f) {
 $f = $f|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $0 = ((($f)) + 60|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$vararg_buffer>>2] = $1;
 $2 = (___syscall6(6,($vararg_buffer|0))|0);
 $3 = (___syscall_ret($2)|0);
 STACKTOP = sp;return ($3|0);
}
function ___stdio_read($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0;
 var $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $cnt$0 = 0, $iov = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $iov = sp + 32|0;
 HEAP32[$iov>>2] = $buf;
 $0 = ((($iov)) + 4|0);
 $1 = ((($f)) + 48|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = ($2|0)!=(0);
 $4 = $3&1;
 $5 = (($len) - ($4))|0;
 HEAP32[$0>>2] = $5;
 $6 = ((($iov)) + 8|0);
 $7 = ((($f)) + 44|0);
 $8 = HEAP32[$7>>2]|0;
 HEAP32[$6>>2] = $8;
 $9 = ((($iov)) + 12|0);
 HEAP32[$9>>2] = $2;
 $10 = HEAP32[1464>>2]|0;
 $11 = ($10|0)==(0|0);
 if ($11) {
  $16 = ((($f)) + 60|0);
  $17 = HEAP32[$16>>2]|0;
  HEAP32[$vararg_buffer3>>2] = $17;
  $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
  HEAP32[$vararg_ptr6>>2] = $iov;
  $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
  HEAP32[$vararg_ptr7>>2] = 2;
  $18 = (___syscall145(145,($vararg_buffer3|0))|0);
  $19 = (___syscall_ret($18)|0);
  $cnt$0 = $19;
 } else {
  _pthread_cleanup_push((12|0),($f|0));
  $12 = ((($f)) + 60|0);
  $13 = HEAP32[$12>>2]|0;
  HEAP32[$vararg_buffer>>2] = $13;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = $iov;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = 2;
  $14 = (___syscall145(145,($vararg_buffer|0))|0);
  $15 = (___syscall_ret($14)|0);
  _pthread_cleanup_pop(0);
  $cnt$0 = $15;
 }
 $20 = ($cnt$0|0)<(1);
 if ($20) {
  $21 = $cnt$0 & 48;
  $22 = $21 ^ 16;
  $23 = HEAP32[$f>>2]|0;
  $24 = $23 | $22;
  HEAP32[$f>>2] = $24;
  $25 = ((($f)) + 8|0);
  HEAP32[$25>>2] = 0;
  $26 = ((($f)) + 4|0);
  HEAP32[$26>>2] = 0;
  $$0 = $cnt$0;
 } else {
  $27 = HEAP32[$0>>2]|0;
  $28 = ($cnt$0>>>0)>($27>>>0);
  if ($28) {
   $29 = (($cnt$0) - ($27))|0;
   $30 = HEAP32[$7>>2]|0;
   $31 = ((($f)) + 4|0);
   HEAP32[$31>>2] = $30;
   $32 = $30;
   $33 = (($32) + ($29)|0);
   $34 = ((($f)) + 8|0);
   HEAP32[$34>>2] = $33;
   $35 = HEAP32[$1>>2]|0;
   $36 = ($35|0)==(0);
   if ($36) {
    $$0 = $len;
   } else {
    $37 = ((($32)) + 1|0);
    HEAP32[$31>>2] = $37;
    $38 = HEAP8[$32>>0]|0;
    $39 = (($len) + -1)|0;
    $40 = (($buf) + ($39)|0);
    HEAP8[$40>>0] = $38;
    $$0 = $len;
   }
  } else {
   $$0 = $cnt$0;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function ___stdio_seek($f,$off,$whence) {
 $f = $f|0;
 $off = $off|0;
 $whence = $whence|0;
 var $$pre = 0, $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $ret = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr3 = 0, $vararg_ptr4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 32|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $ret = sp + 20|0;
 $0 = ((($f)) + 60|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$vararg_buffer>>2] = $1;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = 0;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $off;
 $vararg_ptr3 = ((($vararg_buffer)) + 12|0);
 HEAP32[$vararg_ptr3>>2] = $ret;
 $vararg_ptr4 = ((($vararg_buffer)) + 16|0);
 HEAP32[$vararg_ptr4>>2] = $whence;
 $2 = (___syscall140(140,($vararg_buffer|0))|0);
 $3 = (___syscall_ret($2)|0);
 $4 = ($3|0)<(0);
 if ($4) {
  HEAP32[$ret>>2] = -1;
  $5 = -1;
 } else {
  $$pre = HEAP32[$ret>>2]|0;
  $5 = $$pre;
 }
 STACKTOP = sp;return ($5|0);
}
function ___stdio_write($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $$0 = 0, $$phi$trans$insert = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0;
 var $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $cnt$0 = 0, $cnt$1 = 0, $iov$0 = 0, $iov$0$lcssa11 = 0, $iov$1 = 0, $iovcnt$0 = 0;
 var $iovcnt$0$lcssa12 = 0, $iovcnt$1 = 0, $iovs = 0, $rem$0 = 0, $vararg_buffer = 0, $vararg_buffer3 = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, $vararg_ptr6 = 0, $vararg_ptr7 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 48|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer3 = sp + 16|0;
 $vararg_buffer = sp;
 $iovs = sp + 32|0;
 $0 = ((($f)) + 28|0);
 $1 = HEAP32[$0>>2]|0;
 HEAP32[$iovs>>2] = $1;
 $2 = ((($iovs)) + 4|0);
 $3 = ((($f)) + 20|0);
 $4 = HEAP32[$3>>2]|0;
 $5 = $4;
 $6 = (($5) - ($1))|0;
 HEAP32[$2>>2] = $6;
 $7 = ((($iovs)) + 8|0);
 HEAP32[$7>>2] = $buf;
 $8 = ((($iovs)) + 12|0);
 HEAP32[$8>>2] = $len;
 $9 = (($6) + ($len))|0;
 $10 = ((($f)) + 60|0);
 $11 = ((($f)) + 44|0);
 $iov$0 = $iovs;$iovcnt$0 = 2;$rem$0 = $9;
 while(1) {
  $12 = HEAP32[1464>>2]|0;
  $13 = ($12|0)==(0|0);
  if ($13) {
   $17 = HEAP32[$10>>2]|0;
   HEAP32[$vararg_buffer3>>2] = $17;
   $vararg_ptr6 = ((($vararg_buffer3)) + 4|0);
   HEAP32[$vararg_ptr6>>2] = $iov$0;
   $vararg_ptr7 = ((($vararg_buffer3)) + 8|0);
   HEAP32[$vararg_ptr7>>2] = $iovcnt$0;
   $18 = (___syscall146(146,($vararg_buffer3|0))|0);
   $19 = (___syscall_ret($18)|0);
   $cnt$0 = $19;
  } else {
   _pthread_cleanup_push((13|0),($f|0));
   $14 = HEAP32[$10>>2]|0;
   HEAP32[$vararg_buffer>>2] = $14;
   $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
   HEAP32[$vararg_ptr1>>2] = $iov$0;
   $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
   HEAP32[$vararg_ptr2>>2] = $iovcnt$0;
   $15 = (___syscall146(146,($vararg_buffer|0))|0);
   $16 = (___syscall_ret($15)|0);
   _pthread_cleanup_pop(0);
   $cnt$0 = $16;
  }
  $20 = ($rem$0|0)==($cnt$0|0);
  if ($20) {
   label = 6;
   break;
  }
  $27 = ($cnt$0|0)<(0);
  if ($27) {
   $iov$0$lcssa11 = $iov$0;$iovcnt$0$lcssa12 = $iovcnt$0;
   label = 8;
   break;
  }
  $35 = (($rem$0) - ($cnt$0))|0;
  $36 = ((($iov$0)) + 4|0);
  $37 = HEAP32[$36>>2]|0;
  $38 = ($cnt$0>>>0)>($37>>>0);
  if ($38) {
   $39 = HEAP32[$11>>2]|0;
   HEAP32[$0>>2] = $39;
   HEAP32[$3>>2] = $39;
   $40 = (($cnt$0) - ($37))|0;
   $41 = ((($iov$0)) + 8|0);
   $42 = (($iovcnt$0) + -1)|0;
   $$phi$trans$insert = ((($iov$0)) + 12|0);
   $$pre = HEAP32[$$phi$trans$insert>>2]|0;
   $50 = $$pre;$cnt$1 = $40;$iov$1 = $41;$iovcnt$1 = $42;
  } else {
   $43 = ($iovcnt$0|0)==(2);
   if ($43) {
    $44 = HEAP32[$0>>2]|0;
    $45 = (($44) + ($cnt$0)|0);
    HEAP32[$0>>2] = $45;
    $50 = $37;$cnt$1 = $cnt$0;$iov$1 = $iov$0;$iovcnt$1 = 2;
   } else {
    $50 = $37;$cnt$1 = $cnt$0;$iov$1 = $iov$0;$iovcnt$1 = $iovcnt$0;
   }
  }
  $46 = HEAP32[$iov$1>>2]|0;
  $47 = (($46) + ($cnt$1)|0);
  HEAP32[$iov$1>>2] = $47;
  $48 = ((($iov$1)) + 4|0);
  $49 = (($50) - ($cnt$1))|0;
  HEAP32[$48>>2] = $49;
  $iov$0 = $iov$1;$iovcnt$0 = $iovcnt$1;$rem$0 = $35;
 }
 if ((label|0) == 6) {
  $21 = HEAP32[$11>>2]|0;
  $22 = ((($f)) + 48|0);
  $23 = HEAP32[$22>>2]|0;
  $24 = (($21) + ($23)|0);
  $25 = ((($f)) + 16|0);
  HEAP32[$25>>2] = $24;
  $26 = $21;
  HEAP32[$0>>2] = $26;
  HEAP32[$3>>2] = $26;
  $$0 = $len;
 }
 else if ((label|0) == 8) {
  $28 = ((($f)) + 16|0);
  HEAP32[$28>>2] = 0;
  HEAP32[$0>>2] = 0;
  HEAP32[$3>>2] = 0;
  $29 = HEAP32[$f>>2]|0;
  $30 = $29 | 32;
  HEAP32[$f>>2] = $30;
  $31 = ($iovcnt$0$lcssa12|0)==(2);
  if ($31) {
   $$0 = 0;
  } else {
   $32 = ((($iov$0$lcssa11)) + 4|0);
   $33 = HEAP32[$32>>2]|0;
   $34 = (($len) - ($33))|0;
   $$0 = $34;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function ___stdout_write($f,$buf,$len) {
 $f = $f|0;
 $buf = $buf|0;
 $len = $len|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $tio = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 80|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 $tio = sp + 12|0;
 $0 = ((($f)) + 36|0);
 HEAP32[$0>>2] = 3;
 $1 = HEAP32[$f>>2]|0;
 $2 = $1 & 64;
 $3 = ($2|0)==(0);
 if ($3) {
  $4 = ((($f)) + 60|0);
  $5 = HEAP32[$4>>2]|0;
  HEAP32[$vararg_buffer>>2] = $5;
  $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
  HEAP32[$vararg_ptr1>>2] = 21505;
  $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
  HEAP32[$vararg_ptr2>>2] = $tio;
  $6 = (___syscall54(54,($vararg_buffer|0))|0);
  $7 = ($6|0)==(0);
  if (!($7)) {
   $8 = ((($f)) + 75|0);
   HEAP8[$8>>0] = -1;
  }
 }
 $9 = (___stdio_write($f,$buf,$len)|0);
 STACKTOP = sp;return ($9|0);
}
function ___toread($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $3 = 0, $4 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 74|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $1 << 24 >> 24;
 $3 = (($2) + 255)|0;
 $4 = $3 | $2;
 $5 = $4&255;
 HEAP8[$0>>0] = $5;
 $6 = ((($f)) + 20|0);
 $7 = HEAP32[$6>>2]|0;
 $8 = ((($f)) + 44|0);
 $9 = HEAP32[$8>>2]|0;
 $10 = ($7>>>0)>($9>>>0);
 if ($10) {
  $11 = ((($f)) + 36|0);
  $12 = HEAP32[$11>>2]|0;
  (FUNCTION_TABLE_iiii[$12 & 7]($f,0,0)|0);
 }
 $13 = ((($f)) + 16|0);
 HEAP32[$13>>2] = 0;
 $14 = ((($f)) + 28|0);
 HEAP32[$14>>2] = 0;
 HEAP32[$6>>2] = 0;
 $15 = HEAP32[$f>>2]|0;
 $16 = $15 & 20;
 $17 = ($16|0)==(0);
 if ($17) {
  $21 = HEAP32[$8>>2]|0;
  $22 = ((($f)) + 8|0);
  HEAP32[$22>>2] = $21;
  $23 = ((($f)) + 4|0);
  HEAP32[$23>>2] = $21;
  $$0 = 0;
 } else {
  $18 = $15 & 4;
  $19 = ($18|0)==(0);
  if ($19) {
   $$0 = -1;
  } else {
   $20 = $15 | 32;
   HEAP32[$f>>2] = $20;
   $$0 = -1;
  }
 }
 return ($$0|0);
}
function ___towrite($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 74|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $1 << 24 >> 24;
 $3 = (($2) + 255)|0;
 $4 = $3 | $2;
 $5 = $4&255;
 HEAP8[$0>>0] = $5;
 $6 = HEAP32[$f>>2]|0;
 $7 = $6 & 8;
 $8 = ($7|0)==(0);
 if ($8) {
  $10 = ((($f)) + 8|0);
  HEAP32[$10>>2] = 0;
  $11 = ((($f)) + 4|0);
  HEAP32[$11>>2] = 0;
  $12 = ((($f)) + 44|0);
  $13 = HEAP32[$12>>2]|0;
  $14 = ((($f)) + 28|0);
  HEAP32[$14>>2] = $13;
  $15 = ((($f)) + 20|0);
  HEAP32[$15>>2] = $13;
  $16 = $13;
  $17 = ((($f)) + 48|0);
  $18 = HEAP32[$17>>2]|0;
  $19 = (($16) + ($18)|0);
  $20 = ((($f)) + 16|0);
  HEAP32[$20>>2] = $19;
  $$0 = 0;
 } else {
  $9 = $6 | 32;
  HEAP32[$f>>2] = $9;
  $$0 = -1;
 }
 return ($$0|0);
}
function ___uflow($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $c = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $c = sp;
 $0 = ((($f)) + 8|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0|0);
 if ($2) {
  $3 = (___toread($f)|0);
  $4 = ($3|0)==(0);
  if ($4) {
   label = 3;
  } else {
   $$0 = -1;
  }
 } else {
  label = 3;
 }
 if ((label|0) == 3) {
  $5 = ((($f)) + 32|0);
  $6 = HEAP32[$5>>2]|0;
  $7 = (FUNCTION_TABLE_iiii[$6 & 7]($f,$c,1)|0);
  $8 = ($7|0)==(1);
  if ($8) {
   $9 = HEAP8[$c>>0]|0;
   $10 = $9&255;
   $$0 = $10;
  } else {
   $$0 = -1;
  }
 }
 STACKTOP = sp;return ($$0|0);
}
function _memchr($src,$c,$n) {
 $src = $src|0;
 $c = $c|0;
 $n = $n|0;
 var $$0$lcssa = 0, $$0$lcssa44 = 0, $$019 = 0, $$1$lcssa = 0, $$110 = 0, $$110$lcssa = 0, $$24 = 0, $$3 = 0, $$lcssa = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0;
 var $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond18 = 0, $s$0$lcssa = 0, $s$0$lcssa43 = 0, $s$020 = 0, $s$15 = 0, $s$2 = 0, $w$0$lcssa = 0, $w$011 = 0, $w$011$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $c & 255;
 $1 = $src;
 $2 = $1 & 3;
 $3 = ($2|0)!=(0);
 $4 = ($n|0)!=(0);
 $or$cond18 = $4 & $3;
 L1: do {
  if ($or$cond18) {
   $5 = $c&255;
   $$019 = $n;$s$020 = $src;
   while(1) {
    $6 = HEAP8[$s$020>>0]|0;
    $7 = ($6<<24>>24)==($5<<24>>24);
    if ($7) {
     $$0$lcssa44 = $$019;$s$0$lcssa43 = $s$020;
     label = 6;
     break L1;
    }
    $8 = ((($s$020)) + 1|0);
    $9 = (($$019) + -1)|0;
    $10 = $8;
    $11 = $10 & 3;
    $12 = ($11|0)!=(0);
    $13 = ($9|0)!=(0);
    $or$cond = $13 & $12;
    if ($or$cond) {
     $$019 = $9;$s$020 = $8;
    } else {
     $$0$lcssa = $9;$$lcssa = $13;$s$0$lcssa = $8;
     label = 5;
     break;
    }
   }
  } else {
   $$0$lcssa = $n;$$lcssa = $4;$s$0$lcssa = $src;
   label = 5;
  }
 } while(0);
 if ((label|0) == 5) {
  if ($$lcssa) {
   $$0$lcssa44 = $$0$lcssa;$s$0$lcssa43 = $s$0$lcssa;
   label = 6;
  } else {
   $$3 = 0;$s$2 = $s$0$lcssa;
  }
 }
 L8: do {
  if ((label|0) == 6) {
   $14 = HEAP8[$s$0$lcssa43>>0]|0;
   $15 = $c&255;
   $16 = ($14<<24>>24)==($15<<24>>24);
   if ($16) {
    $$3 = $$0$lcssa44;$s$2 = $s$0$lcssa43;
   } else {
    $17 = Math_imul($0, 16843009)|0;
    $18 = ($$0$lcssa44>>>0)>(3);
    L11: do {
     if ($18) {
      $$110 = $$0$lcssa44;$w$011 = $s$0$lcssa43;
      while(1) {
       $19 = HEAP32[$w$011>>2]|0;
       $20 = $19 ^ $17;
       $21 = (($20) + -16843009)|0;
       $22 = $20 & -2139062144;
       $23 = $22 ^ -2139062144;
       $24 = $23 & $21;
       $25 = ($24|0)==(0);
       if (!($25)) {
        $$110$lcssa = $$110;$w$011$lcssa = $w$011;
        break;
       }
       $26 = ((($w$011)) + 4|0);
       $27 = (($$110) + -4)|0;
       $28 = ($27>>>0)>(3);
       if ($28) {
        $$110 = $27;$w$011 = $26;
       } else {
        $$1$lcssa = $27;$w$0$lcssa = $26;
        label = 11;
        break L11;
       }
      }
      $$24 = $$110$lcssa;$s$15 = $w$011$lcssa;
     } else {
      $$1$lcssa = $$0$lcssa44;$w$0$lcssa = $s$0$lcssa43;
      label = 11;
     }
    } while(0);
    if ((label|0) == 11) {
     $29 = ($$1$lcssa|0)==(0);
     if ($29) {
      $$3 = 0;$s$2 = $w$0$lcssa;
      break;
     } else {
      $$24 = $$1$lcssa;$s$15 = $w$0$lcssa;
     }
    }
    while(1) {
     $30 = HEAP8[$s$15>>0]|0;
     $31 = ($30<<24>>24)==($15<<24>>24);
     if ($31) {
      $$3 = $$24;$s$2 = $s$15;
      break L8;
     }
     $32 = ((($s$15)) + 1|0);
     $33 = (($$24) + -1)|0;
     $34 = ($33|0)==(0);
     if ($34) {
      $$3 = 0;$s$2 = $32;
      break;
     } else {
      $$24 = $33;$s$15 = $32;
     }
    }
   }
  }
 } while(0);
 $35 = ($$3|0)!=(0);
 $36 = $35 ? $s$2 : 0;
 return ($36|0);
}
function ___stpcpy($d,$s) {
 $d = $d|0;
 $s = $s|0;
 var $$0$lcssa = 0, $$01$lcssa = 0, $$0115 = 0, $$016 = 0, $$03 = 0, $$1$ph = 0, $$12$ph = 0, $$128 = 0, $$19 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0;
 var $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $4 = 0, $5 = 0;
 var $6 = 0, $7 = 0, $8 = 0, $9 = 0, $wd$0$lcssa = 0, $wd$010 = 0, $ws$0$lcssa = 0, $ws$011 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $s;
 $1 = $d;
 $2 = $0 ^ $1;
 $3 = $2 & 3;
 $4 = ($3|0)==(0);
 L1: do {
  if ($4) {
   $5 = $0 & 3;
   $6 = ($5|0)==(0);
   if ($6) {
    $$0$lcssa = $s;$$01$lcssa = $d;
   } else {
    $$0115 = $d;$$016 = $s;
    while(1) {
     $7 = HEAP8[$$016>>0]|0;
     HEAP8[$$0115>>0] = $7;
     $8 = ($7<<24>>24)==(0);
     if ($8) {
      $$03 = $$0115;
      break L1;
     }
     $9 = ((($$016)) + 1|0);
     $10 = ((($$0115)) + 1|0);
     $11 = $9;
     $12 = $11 & 3;
     $13 = ($12|0)==(0);
     if ($13) {
      $$0$lcssa = $9;$$01$lcssa = $10;
      break;
     } else {
      $$0115 = $10;$$016 = $9;
     }
    }
   }
   $14 = HEAP32[$$0$lcssa>>2]|0;
   $15 = (($14) + -16843009)|0;
   $16 = $14 & -2139062144;
   $17 = $16 ^ -2139062144;
   $18 = $17 & $15;
   $19 = ($18|0)==(0);
   if ($19) {
    $22 = $14;$wd$010 = $$01$lcssa;$ws$011 = $$0$lcssa;
    while(1) {
     $20 = ((($ws$011)) + 4|0);
     $21 = ((($wd$010)) + 4|0);
     HEAP32[$wd$010>>2] = $22;
     $23 = HEAP32[$20>>2]|0;
     $24 = (($23) + -16843009)|0;
     $25 = $23 & -2139062144;
     $26 = $25 ^ -2139062144;
     $27 = $26 & $24;
     $28 = ($27|0)==(0);
     if ($28) {
      $22 = $23;$wd$010 = $21;$ws$011 = $20;
     } else {
      $wd$0$lcssa = $21;$ws$0$lcssa = $20;
      break;
     }
    }
   } else {
    $wd$0$lcssa = $$01$lcssa;$ws$0$lcssa = $$0$lcssa;
   }
   $$1$ph = $ws$0$lcssa;$$12$ph = $wd$0$lcssa;
   label = 8;
  } else {
   $$1$ph = $s;$$12$ph = $d;
   label = 8;
  }
 } while(0);
 if ((label|0) == 8) {
  $29 = HEAP8[$$1$ph>>0]|0;
  HEAP8[$$12$ph>>0] = $29;
  $30 = ($29<<24>>24)==(0);
  if ($30) {
   $$03 = $$12$ph;
  } else {
   $$128 = $$12$ph;$$19 = $$1$ph;
   while(1) {
    $31 = ((($$19)) + 1|0);
    $32 = ((($$128)) + 1|0);
    $33 = HEAP8[$31>>0]|0;
    HEAP8[$32>>0] = $33;
    $34 = ($33<<24>>24)==(0);
    if ($34) {
     $$03 = $32;
     break;
    } else {
     $$128 = $32;$$19 = $31;
    }
   }
  }
 }
 return ($$03|0);
}
function _strcat($dest,$src) {
 $dest = $dest|0;
 $src = $src|0;
 var $0 = 0, $1 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (_strlen($dest)|0);
 $1 = (($dest) + ($0)|0);
 (_strcpy($1,$src)|0);
 return ($dest|0);
}
function _strchr($s,$c) {
 $s = $s|0;
 $c = $c|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (___strchrnul($s,$c)|0);
 $1 = HEAP8[$0>>0]|0;
 $2 = $c&255;
 $3 = ($1<<24>>24)==($2<<24>>24);
 $4 = $3 ? $0 : 0;
 return ($4|0);
}
function ___strchrnul($s,$c) {
 $s = $s|0;
 $c = $c|0;
 var $$0 = 0, $$02$lcssa = 0, $$0211 = 0, $$1 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0;
 var $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond5 = 0, $w$0$lcssa = 0, $w$08 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $c & 255;
 $1 = ($0|0)==(0);
 L1: do {
  if ($1) {
   $6 = (_strlen($s)|0);
   $7 = (($s) + ($6)|0);
   $$0 = $7;
  } else {
   $2 = $s;
   $3 = $2 & 3;
   $4 = ($3|0)==(0);
   if ($4) {
    $$02$lcssa = $s;
   } else {
    $5 = $c&255;
    $$0211 = $s;
    while(1) {
     $8 = HEAP8[$$0211>>0]|0;
     $9 = ($8<<24>>24)==(0);
     $10 = ($8<<24>>24)==($5<<24>>24);
     $or$cond = $9 | $10;
     if ($or$cond) {
      $$0 = $$0211;
      break L1;
     }
     $11 = ((($$0211)) + 1|0);
     $12 = $11;
     $13 = $12 & 3;
     $14 = ($13|0)==(0);
     if ($14) {
      $$02$lcssa = $11;
      break;
     } else {
      $$0211 = $11;
     }
    }
   }
   $15 = Math_imul($0, 16843009)|0;
   $16 = HEAP32[$$02$lcssa>>2]|0;
   $17 = (($16) + -16843009)|0;
   $18 = $16 & -2139062144;
   $19 = $18 ^ -2139062144;
   $20 = $19 & $17;
   $21 = ($20|0)==(0);
   L10: do {
    if ($21) {
     $23 = $16;$w$08 = $$02$lcssa;
     while(1) {
      $22 = $23 ^ $15;
      $24 = (($22) + -16843009)|0;
      $25 = $22 & -2139062144;
      $26 = $25 ^ -2139062144;
      $27 = $26 & $24;
      $28 = ($27|0)==(0);
      if (!($28)) {
       $w$0$lcssa = $w$08;
       break L10;
      }
      $29 = ((($w$08)) + 4|0);
      $30 = HEAP32[$29>>2]|0;
      $31 = (($30) + -16843009)|0;
      $32 = $30 & -2139062144;
      $33 = $32 ^ -2139062144;
      $34 = $33 & $31;
      $35 = ($34|0)==(0);
      if ($35) {
       $23 = $30;$w$08 = $29;
      } else {
       $w$0$lcssa = $29;
       break;
      }
     }
    } else {
     $w$0$lcssa = $$02$lcssa;
    }
   } while(0);
   $36 = $c&255;
   $$1 = $w$0$lcssa;
   while(1) {
    $37 = HEAP8[$$1>>0]|0;
    $38 = ($37<<24>>24)==(0);
    $39 = ($37<<24>>24)==($36<<24>>24);
    $or$cond5 = $38 | $39;
    $40 = ((($$1)) + 1|0);
    if ($or$cond5) {
     $$0 = $$1;
     break;
    } else {
     $$1 = $40;
    }
   }
  }
 } while(0);
 return ($$0|0);
}
function _strcmp($l,$r) {
 $l = $l|0;
 $r = $r|0;
 var $$014 = 0, $$05 = 0, $$lcssa = 0, $$lcssa2 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $or$cond = 0, $or$cond3 = 0, label = 0;
 var sp = 0;
 sp = STACKTOP;
 $0 = HEAP8[$l>>0]|0;
 $1 = HEAP8[$r>>0]|0;
 $2 = ($0<<24>>24)!=($1<<24>>24);
 $3 = ($0<<24>>24)==(0);
 $or$cond3 = $3 | $2;
 if ($or$cond3) {
  $$lcssa = $0;$$lcssa2 = $1;
 } else {
  $$014 = $l;$$05 = $r;
  while(1) {
   $4 = ((($$014)) + 1|0);
   $5 = ((($$05)) + 1|0);
   $6 = HEAP8[$4>>0]|0;
   $7 = HEAP8[$5>>0]|0;
   $8 = ($6<<24>>24)!=($7<<24>>24);
   $9 = ($6<<24>>24)==(0);
   $or$cond = $9 | $8;
   if ($or$cond) {
    $$lcssa = $6;$$lcssa2 = $7;
    break;
   } else {
    $$014 = $4;$$05 = $5;
   }
  }
 }
 $10 = $$lcssa&255;
 $11 = $$lcssa2&255;
 $12 = (($10) - ($11))|0;
 return ($12|0);
}
function _strcpy($dest,$src) {
 $dest = $dest|0;
 $src = $src|0;
 var label = 0, sp = 0;
 sp = STACKTOP;
 (___stpcpy($dest,$src)|0);
 return ($dest|0);
}
function _strlen($s) {
 $s = $s|0;
 var $$0 = 0, $$01$lcssa = 0, $$014 = 0, $$1$lcssa = 0, $$lcssa20 = 0, $$pn = 0, $$pn15 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0;
 var $2 = 0, $20 = 0, $21 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $w$0 = 0, $w$0$lcssa = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = $s;
 $1 = $0 & 3;
 $2 = ($1|0)==(0);
 L1: do {
  if ($2) {
   $$01$lcssa = $s;
   label = 4;
  } else {
   $$014 = $s;$21 = $0;
   while(1) {
    $3 = HEAP8[$$014>>0]|0;
    $4 = ($3<<24>>24)==(0);
    if ($4) {
     $$pn = $21;
     break L1;
    }
    $5 = ((($$014)) + 1|0);
    $6 = $5;
    $7 = $6 & 3;
    $8 = ($7|0)==(0);
    if ($8) {
     $$01$lcssa = $5;
     label = 4;
     break;
    } else {
     $$014 = $5;$21 = $6;
    }
   }
  }
 } while(0);
 if ((label|0) == 4) {
  $w$0 = $$01$lcssa;
  while(1) {
   $9 = HEAP32[$w$0>>2]|0;
   $10 = (($9) + -16843009)|0;
   $11 = $9 & -2139062144;
   $12 = $11 ^ -2139062144;
   $13 = $12 & $10;
   $14 = ($13|0)==(0);
   $15 = ((($w$0)) + 4|0);
   if ($14) {
    $w$0 = $15;
   } else {
    $$lcssa20 = $9;$w$0$lcssa = $w$0;
    break;
   }
  }
  $16 = $$lcssa20&255;
  $17 = ($16<<24>>24)==(0);
  if ($17) {
   $$1$lcssa = $w$0$lcssa;
  } else {
   $$pn15 = $w$0$lcssa;
   while(1) {
    $18 = ((($$pn15)) + 1|0);
    $$pre = HEAP8[$18>>0]|0;
    $19 = ($$pre<<24>>24)==(0);
    if ($19) {
     $$1$lcssa = $18;
     break;
    } else {
     $$pn15 = $18;
    }
   }
  }
  $20 = $$1$lcssa;
  $$pn = $20;
 }
 $$0 = (($$pn) - ($0))|0;
 return ($$0|0);
}
function _tcgetattr($fd,$tio) {
 $fd = $fd|0;
 $tio = $tio|0;
 var $$ = 0, $0 = 0, $not$ = 0, $vararg_buffer = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP32[$vararg_buffer>>2] = $tio;
 $0 = (_ioctl($fd,21505,$vararg_buffer)|0);
 $not$ = ($0|0)!=(0);
 $$ = $not$ << 31 >> 31;
 STACKTOP = sp;return ($$|0);
}
function _isatty($fd) {
 $fd = $fd|0;
 var $0 = 0, $1 = 0, $2 = 0, $t = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 64|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $t = sp;
 $0 = (_tcgetattr($fd,$t)|0);
 $1 = ($0|0)==(0);
 $2 = $1&1;
 STACKTOP = sp;return ($2|0);
}
function _read($fd,$buf,$count) {
 $fd = $fd|0;
 $buf = $buf|0;
 $count = $count|0;
 var $0 = 0, $1 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP32[$vararg_buffer>>2] = $fd;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $buf;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $count;
 $0 = (___syscall3(3,($vararg_buffer|0))|0);
 $1 = (___syscall_ret($0)|0);
 STACKTOP = sp;return ($1|0);
}
function _write($fd,$buf,$count) {
 $fd = $fd|0;
 $buf = $buf|0;
 $count = $count|0;
 var $0 = 0, $1 = 0, $vararg_buffer = 0, $vararg_ptr1 = 0, $vararg_ptr2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 16|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $vararg_buffer = sp;
 HEAP32[$vararg_buffer>>2] = $fd;
 $vararg_ptr1 = ((($vararg_buffer)) + 4|0);
 HEAP32[$vararg_ptr1>>2] = $buf;
 $vararg_ptr2 = ((($vararg_buffer)) + 8|0);
 HEAP32[$vararg_ptr2>>2] = $count;
 $0 = (___syscall4(4,($vararg_buffer|0))|0);
 $1 = (___syscall_ret($0)|0);
 STACKTOP = sp;return ($1|0);
}
function _init_mparams() {
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = HEAP32[2224>>2]|0;
 $1 = ($0|0)==(0);
 do {
  if ($1) {
   $2 = (_sysconf(30)|0);
   $3 = (($2) + -1)|0;
   $4 = $3 & $2;
   $5 = ($4|0)==(0);
   if ($5) {
    HEAP32[(2232)>>2] = $2;
    HEAP32[(2228)>>2] = $2;
    HEAP32[(2236)>>2] = -1;
    HEAP32[(2240)>>2] = -1;
    HEAP32[(2244)>>2] = 0;
    HEAP32[(2196)>>2] = 0;
    $6 = (_time((0|0))|0);
    $7 = $6 & -16;
    $8 = $7 ^ 1431655768;
    HEAP32[2224>>2] = $8;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 return;
}
function _try_realloc_chunk($p,$nb) {
 $p = $p|0;
 $nb = $nb|0;
 var $$pre = 0, $$pre$phiZ2D = 0, $$sum = 0, $$sum11 = 0, $$sum12 = 0, $$sum13 = 0, $$sum14 = 0, $$sum15 = 0, $$sum16 = 0, $$sum17 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum22 = 0, $$sum23 = 0, $$sum2728 = 0, $$sum3 = 0, $$sum4 = 0, $$sum5 = 0, $$sum78 = 0;
 var $$sum910 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0;
 var $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0;
 var $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0;
 var $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0;
 var $17 = 0, $170 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $30 = 0, $31 = 0, $32 = 0, $33 = 0;
 var $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0;
 var $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0;
 var $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0;
 var $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $R$0 = 0, $R$0$lcssa = 0, $R$1 = 0, $RP$0 = 0, $RP$0$lcssa = 0, $cond = 0, $newp$0 = 0, $notlhs = 0;
 var $notrhs = 0, $or$cond$not = 0, $or$cond30 = 0, $storemerge = 0, $storemerge21 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($p)) + 4|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = $1 & -8;
 $3 = (($p) + ($2)|0);
 $4 = HEAP32[(1768)>>2]|0;
 $5 = $1 & 3;
 $notlhs = ($p>>>0)>=($4>>>0);
 $notrhs = ($5|0)!=(1);
 $or$cond$not = $notrhs & $notlhs;
 $6 = ($p>>>0)<($3>>>0);
 $or$cond30 = $or$cond$not & $6;
 if ($or$cond30) {
  $$sum2728 = $2 | 4;
  $7 = (($p) + ($$sum2728)|0);
  $8 = HEAP32[$7>>2]|0;
  $9 = $8 & 1;
  $10 = ($9|0)==(0);
  if (!($10)) {
   $11 = ($5|0)==(0);
   do {
    if ($11) {
     $12 = ($nb>>>0)<(256);
     if ($12) {
      $newp$0 = 0;
     } else {
      $13 = (($nb) + 4)|0;
      $14 = ($2>>>0)<($13>>>0);
      if (!($14)) {
       $15 = (($2) - ($nb))|0;
       $16 = HEAP32[(2232)>>2]|0;
       $17 = $16 << 1;
       $18 = ($15>>>0)>($17>>>0);
       if (!($18)) {
        $newp$0 = $p;
        break;
       }
      }
      $newp$0 = 0;
     }
    } else {
     $19 = ($2>>>0)<($nb>>>0);
     if (!($19)) {
      $20 = (($2) - ($nb))|0;
      $21 = ($20>>>0)>(15);
      if (!($21)) {
       $newp$0 = $p;
       break;
      }
      $22 = (($p) + ($nb)|0);
      $23 = $1 & 1;
      $24 = $23 | $nb;
      $25 = $24 | 2;
      HEAP32[$0>>2] = $25;
      $$sum23 = (($nb) + 4)|0;
      $26 = (($p) + ($$sum23)|0);
      $27 = $20 | 3;
      HEAP32[$26>>2] = $27;
      $28 = HEAP32[$7>>2]|0;
      $29 = $28 | 1;
      HEAP32[$7>>2] = $29;
      _dispose_chunk($22,$20);
      $newp$0 = $p;
      break;
     }
     $30 = HEAP32[(1776)>>2]|0;
     $31 = ($3|0)==($30|0);
     if ($31) {
      $32 = HEAP32[(1764)>>2]|0;
      $33 = (($32) + ($2))|0;
      $34 = ($33>>>0)>($nb>>>0);
      if (!($34)) {
       $newp$0 = 0;
       break;
      }
      $35 = (($33) - ($nb))|0;
      $36 = (($p) + ($nb)|0);
      $37 = $1 & 1;
      $38 = $37 | $nb;
      $39 = $38 | 2;
      HEAP32[$0>>2] = $39;
      $$sum22 = (($nb) + 4)|0;
      $40 = (($p) + ($$sum22)|0);
      $41 = $35 | 1;
      HEAP32[$40>>2] = $41;
      HEAP32[(1776)>>2] = $36;
      HEAP32[(1764)>>2] = $35;
      $newp$0 = $p;
      break;
     }
     $42 = HEAP32[(1772)>>2]|0;
     $43 = ($3|0)==($42|0);
     if ($43) {
      $44 = HEAP32[(1760)>>2]|0;
      $45 = (($44) + ($2))|0;
      $46 = ($45>>>0)<($nb>>>0);
      if ($46) {
       $newp$0 = 0;
       break;
      }
      $47 = (($45) - ($nb))|0;
      $48 = ($47>>>0)>(15);
      if ($48) {
       $49 = (($p) + ($nb)|0);
       $50 = (($p) + ($45)|0);
       $51 = $1 & 1;
       $52 = $51 | $nb;
       $53 = $52 | 2;
       HEAP32[$0>>2] = $53;
       $$sum19 = (($nb) + 4)|0;
       $54 = (($p) + ($$sum19)|0);
       $55 = $47 | 1;
       HEAP32[$54>>2] = $55;
       HEAP32[$50>>2] = $47;
       $$sum20 = (($45) + 4)|0;
       $56 = (($p) + ($$sum20)|0);
       $57 = HEAP32[$56>>2]|0;
       $58 = $57 & -2;
       HEAP32[$56>>2] = $58;
       $storemerge = $49;$storemerge21 = $47;
      } else {
       $59 = $1 & 1;
       $60 = $59 | $45;
       $61 = $60 | 2;
       HEAP32[$0>>2] = $61;
       $$sum17 = (($45) + 4)|0;
       $62 = (($p) + ($$sum17)|0);
       $63 = HEAP32[$62>>2]|0;
       $64 = $63 | 1;
       HEAP32[$62>>2] = $64;
       $storemerge = 0;$storemerge21 = 0;
      }
      HEAP32[(1760)>>2] = $storemerge21;
      HEAP32[(1772)>>2] = $storemerge;
      $newp$0 = $p;
      break;
     }
     $65 = $8 & 2;
     $66 = ($65|0)==(0);
     if ($66) {
      $67 = $8 & -8;
      $68 = (($67) + ($2))|0;
      $69 = ($68>>>0)<($nb>>>0);
      if ($69) {
       $newp$0 = 0;
      } else {
       $70 = (($68) - ($nb))|0;
       $71 = $8 >>> 3;
       $72 = ($8>>>0)<(256);
       do {
        if ($72) {
         $$sum15 = (($2) + 8)|0;
         $73 = (($p) + ($$sum15)|0);
         $74 = HEAP32[$73>>2]|0;
         $$sum16 = (($2) + 12)|0;
         $75 = (($p) + ($$sum16)|0);
         $76 = HEAP32[$75>>2]|0;
         $77 = $71 << 1;
         $78 = (1792 + ($77<<2)|0);
         $79 = ($74|0)==($78|0);
         do {
          if (!($79)) {
           $80 = ($74>>>0)<($4>>>0);
           if (!($80)) {
            $81 = ((($74)) + 12|0);
            $82 = HEAP32[$81>>2]|0;
            $83 = ($82|0)==($3|0);
            if ($83) {
             break;
            }
           }
           _abort();
           // unreachable;
          }
         } while(0);
         $84 = ($76|0)==($74|0);
         if ($84) {
          $85 = 1 << $71;
          $86 = $85 ^ -1;
          $87 = HEAP32[1752>>2]|0;
          $88 = $87 & $86;
          HEAP32[1752>>2] = $88;
          break;
         }
         $89 = ($76|0)==($78|0);
         do {
          if ($89) {
           $$pre = ((($76)) + 8|0);
           $$pre$phiZ2D = $$pre;
          } else {
           $90 = ($76>>>0)<($4>>>0);
           if (!($90)) {
            $91 = ((($76)) + 8|0);
            $92 = HEAP32[$91>>2]|0;
            $93 = ($92|0)==($3|0);
            if ($93) {
             $$pre$phiZ2D = $91;
             break;
            }
           }
           _abort();
           // unreachable;
          }
         } while(0);
         $94 = ((($74)) + 12|0);
         HEAP32[$94>>2] = $76;
         HEAP32[$$pre$phiZ2D>>2] = $74;
        } else {
         $$sum = (($2) + 24)|0;
         $95 = (($p) + ($$sum)|0);
         $96 = HEAP32[$95>>2]|0;
         $$sum2 = (($2) + 12)|0;
         $97 = (($p) + ($$sum2)|0);
         $98 = HEAP32[$97>>2]|0;
         $99 = ($98|0)==($3|0);
         do {
          if ($99) {
           $$sum4 = (($2) + 20)|0;
           $109 = (($p) + ($$sum4)|0);
           $110 = HEAP32[$109>>2]|0;
           $111 = ($110|0)==(0|0);
           if ($111) {
            $$sum3 = (($2) + 16)|0;
            $112 = (($p) + ($$sum3)|0);
            $113 = HEAP32[$112>>2]|0;
            $114 = ($113|0)==(0|0);
            if ($114) {
             $R$1 = 0;
             break;
            } else {
             $R$0 = $113;$RP$0 = $112;
            }
           } else {
            $R$0 = $110;$RP$0 = $109;
           }
           while(1) {
            $115 = ((($R$0)) + 20|0);
            $116 = HEAP32[$115>>2]|0;
            $117 = ($116|0)==(0|0);
            if (!($117)) {
             $R$0 = $116;$RP$0 = $115;
             continue;
            }
            $118 = ((($R$0)) + 16|0);
            $119 = HEAP32[$118>>2]|0;
            $120 = ($119|0)==(0|0);
            if ($120) {
             $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
             break;
            } else {
             $R$0 = $119;$RP$0 = $118;
            }
           }
           $121 = ($RP$0$lcssa>>>0)<($4>>>0);
           if ($121) {
            _abort();
            // unreachable;
           } else {
            HEAP32[$RP$0$lcssa>>2] = 0;
            $R$1 = $R$0$lcssa;
            break;
           }
          } else {
           $$sum14 = (($2) + 8)|0;
           $100 = (($p) + ($$sum14)|0);
           $101 = HEAP32[$100>>2]|0;
           $102 = ($101>>>0)<($4>>>0);
           if (!($102)) {
            $103 = ((($101)) + 12|0);
            $104 = HEAP32[$103>>2]|0;
            $105 = ($104|0)==($3|0);
            if ($105) {
             $106 = ((($98)) + 8|0);
             $107 = HEAP32[$106>>2]|0;
             $108 = ($107|0)==($3|0);
             if ($108) {
              HEAP32[$103>>2] = $98;
              HEAP32[$106>>2] = $101;
              $R$1 = $98;
              break;
             }
            }
           }
           _abort();
           // unreachable;
          }
         } while(0);
         $122 = ($96|0)==(0|0);
         if (!($122)) {
          $$sum11 = (($2) + 28)|0;
          $123 = (($p) + ($$sum11)|0);
          $124 = HEAP32[$123>>2]|0;
          $125 = (2056 + ($124<<2)|0);
          $126 = HEAP32[$125>>2]|0;
          $127 = ($3|0)==($126|0);
          if ($127) {
           HEAP32[$125>>2] = $R$1;
           $cond = ($R$1|0)==(0|0);
           if ($cond) {
            $128 = 1 << $124;
            $129 = $128 ^ -1;
            $130 = HEAP32[(1756)>>2]|0;
            $131 = $130 & $129;
            HEAP32[(1756)>>2] = $131;
            break;
           }
          } else {
           $132 = HEAP32[(1768)>>2]|0;
           $133 = ($96>>>0)<($132>>>0);
           if ($133) {
            _abort();
            // unreachable;
           }
           $134 = ((($96)) + 16|0);
           $135 = HEAP32[$134>>2]|0;
           $136 = ($135|0)==($3|0);
           if ($136) {
            HEAP32[$134>>2] = $R$1;
           } else {
            $137 = ((($96)) + 20|0);
            HEAP32[$137>>2] = $R$1;
           }
           $138 = ($R$1|0)==(0|0);
           if ($138) {
            break;
           }
          }
          $139 = HEAP32[(1768)>>2]|0;
          $140 = ($R$1>>>0)<($139>>>0);
          if ($140) {
           _abort();
           // unreachable;
          }
          $141 = ((($R$1)) + 24|0);
          HEAP32[$141>>2] = $96;
          $$sum12 = (($2) + 16)|0;
          $142 = (($p) + ($$sum12)|0);
          $143 = HEAP32[$142>>2]|0;
          $144 = ($143|0)==(0|0);
          do {
           if (!($144)) {
            $145 = ($143>>>0)<($139>>>0);
            if ($145) {
             _abort();
             // unreachable;
            } else {
             $146 = ((($R$1)) + 16|0);
             HEAP32[$146>>2] = $143;
             $147 = ((($143)) + 24|0);
             HEAP32[$147>>2] = $R$1;
             break;
            }
           }
          } while(0);
          $$sum13 = (($2) + 20)|0;
          $148 = (($p) + ($$sum13)|0);
          $149 = HEAP32[$148>>2]|0;
          $150 = ($149|0)==(0|0);
          if (!($150)) {
           $151 = HEAP32[(1768)>>2]|0;
           $152 = ($149>>>0)<($151>>>0);
           if ($152) {
            _abort();
            // unreachable;
           } else {
            $153 = ((($R$1)) + 20|0);
            HEAP32[$153>>2] = $149;
            $154 = ((($149)) + 24|0);
            HEAP32[$154>>2] = $R$1;
            break;
           }
          }
         }
        }
       } while(0);
       $155 = ($70>>>0)<(16);
       if ($155) {
        $156 = $1 & 1;
        $157 = $68 | $156;
        $158 = $157 | 2;
        HEAP32[$0>>2] = $158;
        $$sum910 = $68 | 4;
        $159 = (($p) + ($$sum910)|0);
        $160 = HEAP32[$159>>2]|0;
        $161 = $160 | 1;
        HEAP32[$159>>2] = $161;
        $newp$0 = $p;
        break;
       } else {
        $162 = (($p) + ($nb)|0);
        $163 = $1 & 1;
        $164 = $163 | $nb;
        $165 = $164 | 2;
        HEAP32[$0>>2] = $165;
        $$sum5 = (($nb) + 4)|0;
        $166 = (($p) + ($$sum5)|0);
        $167 = $70 | 3;
        HEAP32[$166>>2] = $167;
        $$sum78 = $68 | 4;
        $168 = (($p) + ($$sum78)|0);
        $169 = HEAP32[$168>>2]|0;
        $170 = $169 | 1;
        HEAP32[$168>>2] = $170;
        _dispose_chunk($162,$70);
        $newp$0 = $p;
        break;
       }
      }
     } else {
      $newp$0 = 0;
     }
    }
   } while(0);
   return ($newp$0|0);
  }
 }
 _abort();
 // unreachable;
 return (0)|0;
}
function _dispose_chunk($p,$psize) {
 $p = $p|0;
 $psize = $psize|0;
 var $$0 = 0, $$02 = 0, $$1 = 0, $$lcssa = 0, $$pre = 0, $$pre$phi50Z2D = 0, $$pre$phi52Z2D = 0, $$pre$phiZ2D = 0, $$pre48 = 0, $$pre49 = 0, $$pre51 = 0, $$sum = 0, $$sum1 = 0, $$sum10 = 0, $$sum11 = 0, $$sum12 = 0, $$sum13 = 0, $$sum14 = 0, $$sum16 = 0, $$sum17 = 0;
 var $$sum18 = 0, $$sum19 = 0, $$sum2 = 0, $$sum20 = 0, $$sum21 = 0, $$sum22 = 0, $$sum23 = 0, $$sum24 = 0, $$sum25 = 0, $$sum3 = 0, $$sum4 = 0, $$sum5 = 0, $$sum7 = 0, $$sum8 = 0, $$sum9 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0;
 var $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0;
 var $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0, $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0;
 var $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0, $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0;
 var $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0, $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0;
 var $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0, $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0;
 var $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0, $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0;
 var $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0, $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0;
 var $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0, $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0;
 var $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0, $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0;
 var $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0, $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0;
 var $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0, $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0;
 var $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0;
 var $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0, $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0;
 var $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0, $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0;
 var $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0;
 var $97 = 0, $98 = 0, $99 = 0, $F16$0 = 0, $I19$0 = 0, $K20$043 = 0, $R$0 = 0, $R$0$lcssa = 0, $R$1 = 0, $R7$0 = 0, $R7$0$lcssa = 0, $R7$1 = 0, $RP$0 = 0, $RP$0$lcssa = 0, $RP9$0 = 0, $RP9$0$lcssa = 0, $T$0$lcssa = 0, $T$042 = 0, $T$042$lcssa = 0, $cond = 0;
 var $cond39 = 0, $not$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = (($p) + ($psize)|0);
 $1 = ((($p)) + 4|0);
 $2 = HEAP32[$1>>2]|0;
 $3 = $2 & 1;
 $4 = ($3|0)==(0);
 do {
  if ($4) {
   $5 = HEAP32[$p>>2]|0;
   $6 = $2 & 3;
   $7 = ($6|0)==(0);
   if (!($7)) {
    $8 = (0 - ($5))|0;
    $9 = (($p) + ($8)|0);
    $10 = (($5) + ($psize))|0;
    $11 = HEAP32[(1768)>>2]|0;
    $12 = ($9>>>0)<($11>>>0);
    if ($12) {
     _abort();
     // unreachable;
    }
    $13 = HEAP32[(1772)>>2]|0;
    $14 = ($9|0)==($13|0);
    if ($14) {
     $$sum = (($psize) + 4)|0;
     $99 = (($p) + ($$sum)|0);
     $100 = HEAP32[$99>>2]|0;
     $101 = $100 & 3;
     $102 = ($101|0)==(3);
     if (!($102)) {
      $$0 = $9;$$02 = $10;
      label = 54;
      break;
     }
     HEAP32[(1760)>>2] = $10;
     $103 = $100 & -2;
     HEAP32[$99>>2] = $103;
     $104 = $10 | 1;
     $$sum14 = (4 - ($5))|0;
     $105 = (($p) + ($$sum14)|0);
     HEAP32[$105>>2] = $104;
     HEAP32[$0>>2] = $10;
     break;
    }
    $15 = $5 >>> 3;
    $16 = ($5>>>0)<(256);
    if ($16) {
     $$sum24 = (8 - ($5))|0;
     $17 = (($p) + ($$sum24)|0);
     $18 = HEAP32[$17>>2]|0;
     $$sum25 = (12 - ($5))|0;
     $19 = (($p) + ($$sum25)|0);
     $20 = HEAP32[$19>>2]|0;
     $21 = $15 << 1;
     $22 = (1792 + ($21<<2)|0);
     $23 = ($18|0)==($22|0);
     do {
      if (!($23)) {
       $24 = ($18>>>0)<($11>>>0);
       if (!($24)) {
        $25 = ((($18)) + 12|0);
        $26 = HEAP32[$25>>2]|0;
        $27 = ($26|0)==($9|0);
        if ($27) {
         break;
        }
       }
       _abort();
       // unreachable;
      }
     } while(0);
     $28 = ($20|0)==($18|0);
     if ($28) {
      $29 = 1 << $15;
      $30 = $29 ^ -1;
      $31 = HEAP32[1752>>2]|0;
      $32 = $31 & $30;
      HEAP32[1752>>2] = $32;
      $$0 = $9;$$02 = $10;
      label = 54;
      break;
     }
     $33 = ($20|0)==($22|0);
     do {
      if ($33) {
       $$pre51 = ((($20)) + 8|0);
       $$pre$phi52Z2D = $$pre51;
      } else {
       $34 = ($20>>>0)<($11>>>0);
       if (!($34)) {
        $35 = ((($20)) + 8|0);
        $36 = HEAP32[$35>>2]|0;
        $37 = ($36|0)==($9|0);
        if ($37) {
         $$pre$phi52Z2D = $35;
         break;
        }
       }
       _abort();
       // unreachable;
      }
     } while(0);
     $38 = ((($18)) + 12|0);
     HEAP32[$38>>2] = $20;
     HEAP32[$$pre$phi52Z2D>>2] = $18;
     $$0 = $9;$$02 = $10;
     label = 54;
     break;
    }
    $$sum16 = (24 - ($5))|0;
    $39 = (($p) + ($$sum16)|0);
    $40 = HEAP32[$39>>2]|0;
    $$sum17 = (12 - ($5))|0;
    $41 = (($p) + ($$sum17)|0);
    $42 = HEAP32[$41>>2]|0;
    $43 = ($42|0)==($9|0);
    do {
     if ($43) {
      $$sum18 = (16 - ($5))|0;
      $$sum19 = (($$sum18) + 4)|0;
      $53 = (($p) + ($$sum19)|0);
      $54 = HEAP32[$53>>2]|0;
      $55 = ($54|0)==(0|0);
      if ($55) {
       $56 = (($p) + ($$sum18)|0);
       $57 = HEAP32[$56>>2]|0;
       $58 = ($57|0)==(0|0);
       if ($58) {
        $R$1 = 0;
        break;
       } else {
        $R$0 = $57;$RP$0 = $56;
       }
      } else {
       $R$0 = $54;$RP$0 = $53;
      }
      while(1) {
       $59 = ((($R$0)) + 20|0);
       $60 = HEAP32[$59>>2]|0;
       $61 = ($60|0)==(0|0);
       if (!($61)) {
        $R$0 = $60;$RP$0 = $59;
        continue;
       }
       $62 = ((($R$0)) + 16|0);
       $63 = HEAP32[$62>>2]|0;
       $64 = ($63|0)==(0|0);
       if ($64) {
        $R$0$lcssa = $R$0;$RP$0$lcssa = $RP$0;
        break;
       } else {
        $R$0 = $63;$RP$0 = $62;
       }
      }
      $65 = ($RP$0$lcssa>>>0)<($11>>>0);
      if ($65) {
       _abort();
       // unreachable;
      } else {
       HEAP32[$RP$0$lcssa>>2] = 0;
       $R$1 = $R$0$lcssa;
       break;
      }
     } else {
      $$sum23 = (8 - ($5))|0;
      $44 = (($p) + ($$sum23)|0);
      $45 = HEAP32[$44>>2]|0;
      $46 = ($45>>>0)<($11>>>0);
      if (!($46)) {
       $47 = ((($45)) + 12|0);
       $48 = HEAP32[$47>>2]|0;
       $49 = ($48|0)==($9|0);
       if ($49) {
        $50 = ((($42)) + 8|0);
        $51 = HEAP32[$50>>2]|0;
        $52 = ($51|0)==($9|0);
        if ($52) {
         HEAP32[$47>>2] = $42;
         HEAP32[$50>>2] = $45;
         $R$1 = $42;
         break;
        }
       }
      }
      _abort();
      // unreachable;
     }
    } while(0);
    $66 = ($40|0)==(0|0);
    if ($66) {
     $$0 = $9;$$02 = $10;
     label = 54;
    } else {
     $$sum20 = (28 - ($5))|0;
     $67 = (($p) + ($$sum20)|0);
     $68 = HEAP32[$67>>2]|0;
     $69 = (2056 + ($68<<2)|0);
     $70 = HEAP32[$69>>2]|0;
     $71 = ($9|0)==($70|0);
     if ($71) {
      HEAP32[$69>>2] = $R$1;
      $cond = ($R$1|0)==(0|0);
      if ($cond) {
       $72 = 1 << $68;
       $73 = $72 ^ -1;
       $74 = HEAP32[(1756)>>2]|0;
       $75 = $74 & $73;
       HEAP32[(1756)>>2] = $75;
       $$0 = $9;$$02 = $10;
       label = 54;
       break;
      }
     } else {
      $76 = HEAP32[(1768)>>2]|0;
      $77 = ($40>>>0)<($76>>>0);
      if ($77) {
       _abort();
       // unreachable;
      }
      $78 = ((($40)) + 16|0);
      $79 = HEAP32[$78>>2]|0;
      $80 = ($79|0)==($9|0);
      if ($80) {
       HEAP32[$78>>2] = $R$1;
      } else {
       $81 = ((($40)) + 20|0);
       HEAP32[$81>>2] = $R$1;
      }
      $82 = ($R$1|0)==(0|0);
      if ($82) {
       $$0 = $9;$$02 = $10;
       label = 54;
       break;
      }
     }
     $83 = HEAP32[(1768)>>2]|0;
     $84 = ($R$1>>>0)<($83>>>0);
     if ($84) {
      _abort();
      // unreachable;
     }
     $85 = ((($R$1)) + 24|0);
     HEAP32[$85>>2] = $40;
     $$sum21 = (16 - ($5))|0;
     $86 = (($p) + ($$sum21)|0);
     $87 = HEAP32[$86>>2]|0;
     $88 = ($87|0)==(0|0);
     do {
      if (!($88)) {
       $89 = ($87>>>0)<($83>>>0);
       if ($89) {
        _abort();
        // unreachable;
       } else {
        $90 = ((($R$1)) + 16|0);
        HEAP32[$90>>2] = $87;
        $91 = ((($87)) + 24|0);
        HEAP32[$91>>2] = $R$1;
        break;
       }
      }
     } while(0);
     $$sum22 = (($$sum21) + 4)|0;
     $92 = (($p) + ($$sum22)|0);
     $93 = HEAP32[$92>>2]|0;
     $94 = ($93|0)==(0|0);
     if ($94) {
      $$0 = $9;$$02 = $10;
      label = 54;
     } else {
      $95 = HEAP32[(1768)>>2]|0;
      $96 = ($93>>>0)<($95>>>0);
      if ($96) {
       _abort();
       // unreachable;
      } else {
       $97 = ((($R$1)) + 20|0);
       HEAP32[$97>>2] = $93;
       $98 = ((($93)) + 24|0);
       HEAP32[$98>>2] = $R$1;
       $$0 = $9;$$02 = $10;
       label = 54;
       break;
      }
     }
    }
   }
  } else {
   $$0 = $p;$$02 = $psize;
   label = 54;
  }
 } while(0);
 L74: do {
  if ((label|0) == 54) {
   $106 = HEAP32[(1768)>>2]|0;
   $107 = ($0>>>0)<($106>>>0);
   if ($107) {
    _abort();
    // unreachable;
   }
   $$sum1 = (($psize) + 4)|0;
   $108 = (($p) + ($$sum1)|0);
   $109 = HEAP32[$108>>2]|0;
   $110 = $109 & 2;
   $111 = ($110|0)==(0);
   if ($111) {
    $112 = HEAP32[(1776)>>2]|0;
    $113 = ($0|0)==($112|0);
    if ($113) {
     $114 = HEAP32[(1764)>>2]|0;
     $115 = (($114) + ($$02))|0;
     HEAP32[(1764)>>2] = $115;
     HEAP32[(1776)>>2] = $$0;
     $116 = $115 | 1;
     $117 = ((($$0)) + 4|0);
     HEAP32[$117>>2] = $116;
     $118 = HEAP32[(1772)>>2]|0;
     $119 = ($$0|0)==($118|0);
     if (!($119)) {
      break;
     }
     HEAP32[(1772)>>2] = 0;
     HEAP32[(1760)>>2] = 0;
     break;
    }
    $120 = HEAP32[(1772)>>2]|0;
    $121 = ($0|0)==($120|0);
    if ($121) {
     $122 = HEAP32[(1760)>>2]|0;
     $123 = (($122) + ($$02))|0;
     HEAP32[(1760)>>2] = $123;
     HEAP32[(1772)>>2] = $$0;
     $124 = $123 | 1;
     $125 = ((($$0)) + 4|0);
     HEAP32[$125>>2] = $124;
     $126 = (($$0) + ($123)|0);
     HEAP32[$126>>2] = $123;
     break;
    }
    $127 = $109 & -8;
    $128 = (($127) + ($$02))|0;
    $129 = $109 >>> 3;
    $130 = ($109>>>0)<(256);
    do {
     if ($130) {
      $$sum12 = (($psize) + 8)|0;
      $131 = (($p) + ($$sum12)|0);
      $132 = HEAP32[$131>>2]|0;
      $$sum13 = (($psize) + 12)|0;
      $133 = (($p) + ($$sum13)|0);
      $134 = HEAP32[$133>>2]|0;
      $135 = $129 << 1;
      $136 = (1792 + ($135<<2)|0);
      $137 = ($132|0)==($136|0);
      do {
       if (!($137)) {
        $138 = ($132>>>0)<($106>>>0);
        if (!($138)) {
         $139 = ((($132)) + 12|0);
         $140 = HEAP32[$139>>2]|0;
         $141 = ($140|0)==($0|0);
         if ($141) {
          break;
         }
        }
        _abort();
        // unreachable;
       }
      } while(0);
      $142 = ($134|0)==($132|0);
      if ($142) {
       $143 = 1 << $129;
       $144 = $143 ^ -1;
       $145 = HEAP32[1752>>2]|0;
       $146 = $145 & $144;
       HEAP32[1752>>2] = $146;
       break;
      }
      $147 = ($134|0)==($136|0);
      do {
       if ($147) {
        $$pre49 = ((($134)) + 8|0);
        $$pre$phi50Z2D = $$pre49;
       } else {
        $148 = ($134>>>0)<($106>>>0);
        if (!($148)) {
         $149 = ((($134)) + 8|0);
         $150 = HEAP32[$149>>2]|0;
         $151 = ($150|0)==($0|0);
         if ($151) {
          $$pre$phi50Z2D = $149;
          break;
         }
        }
        _abort();
        // unreachable;
       }
      } while(0);
      $152 = ((($132)) + 12|0);
      HEAP32[$152>>2] = $134;
      HEAP32[$$pre$phi50Z2D>>2] = $132;
     } else {
      $$sum2 = (($psize) + 24)|0;
      $153 = (($p) + ($$sum2)|0);
      $154 = HEAP32[$153>>2]|0;
      $$sum3 = (($psize) + 12)|0;
      $155 = (($p) + ($$sum3)|0);
      $156 = HEAP32[$155>>2]|0;
      $157 = ($156|0)==($0|0);
      do {
       if ($157) {
        $$sum5 = (($psize) + 20)|0;
        $167 = (($p) + ($$sum5)|0);
        $168 = HEAP32[$167>>2]|0;
        $169 = ($168|0)==(0|0);
        if ($169) {
         $$sum4 = (($psize) + 16)|0;
         $170 = (($p) + ($$sum4)|0);
         $171 = HEAP32[$170>>2]|0;
         $172 = ($171|0)==(0|0);
         if ($172) {
          $R7$1 = 0;
          break;
         } else {
          $R7$0 = $171;$RP9$0 = $170;
         }
        } else {
         $R7$0 = $168;$RP9$0 = $167;
        }
        while(1) {
         $173 = ((($R7$0)) + 20|0);
         $174 = HEAP32[$173>>2]|0;
         $175 = ($174|0)==(0|0);
         if (!($175)) {
          $R7$0 = $174;$RP9$0 = $173;
          continue;
         }
         $176 = ((($R7$0)) + 16|0);
         $177 = HEAP32[$176>>2]|0;
         $178 = ($177|0)==(0|0);
         if ($178) {
          $R7$0$lcssa = $R7$0;$RP9$0$lcssa = $RP9$0;
          break;
         } else {
          $R7$0 = $177;$RP9$0 = $176;
         }
        }
        $179 = ($RP9$0$lcssa>>>0)<($106>>>0);
        if ($179) {
         _abort();
         // unreachable;
        } else {
         HEAP32[$RP9$0$lcssa>>2] = 0;
         $R7$1 = $R7$0$lcssa;
         break;
        }
       } else {
        $$sum11 = (($psize) + 8)|0;
        $158 = (($p) + ($$sum11)|0);
        $159 = HEAP32[$158>>2]|0;
        $160 = ($159>>>0)<($106>>>0);
        if (!($160)) {
         $161 = ((($159)) + 12|0);
         $162 = HEAP32[$161>>2]|0;
         $163 = ($162|0)==($0|0);
         if ($163) {
          $164 = ((($156)) + 8|0);
          $165 = HEAP32[$164>>2]|0;
          $166 = ($165|0)==($0|0);
          if ($166) {
           HEAP32[$161>>2] = $156;
           HEAP32[$164>>2] = $159;
           $R7$1 = $156;
           break;
          }
         }
        }
        _abort();
        // unreachable;
       }
      } while(0);
      $180 = ($154|0)==(0|0);
      if (!($180)) {
       $$sum8 = (($psize) + 28)|0;
       $181 = (($p) + ($$sum8)|0);
       $182 = HEAP32[$181>>2]|0;
       $183 = (2056 + ($182<<2)|0);
       $184 = HEAP32[$183>>2]|0;
       $185 = ($0|0)==($184|0);
       if ($185) {
        HEAP32[$183>>2] = $R7$1;
        $cond39 = ($R7$1|0)==(0|0);
        if ($cond39) {
         $186 = 1 << $182;
         $187 = $186 ^ -1;
         $188 = HEAP32[(1756)>>2]|0;
         $189 = $188 & $187;
         HEAP32[(1756)>>2] = $189;
         break;
        }
       } else {
        $190 = HEAP32[(1768)>>2]|0;
        $191 = ($154>>>0)<($190>>>0);
        if ($191) {
         _abort();
         // unreachable;
        }
        $192 = ((($154)) + 16|0);
        $193 = HEAP32[$192>>2]|0;
        $194 = ($193|0)==($0|0);
        if ($194) {
         HEAP32[$192>>2] = $R7$1;
        } else {
         $195 = ((($154)) + 20|0);
         HEAP32[$195>>2] = $R7$1;
        }
        $196 = ($R7$1|0)==(0|0);
        if ($196) {
         break;
        }
       }
       $197 = HEAP32[(1768)>>2]|0;
       $198 = ($R7$1>>>0)<($197>>>0);
       if ($198) {
        _abort();
        // unreachable;
       }
       $199 = ((($R7$1)) + 24|0);
       HEAP32[$199>>2] = $154;
       $$sum9 = (($psize) + 16)|0;
       $200 = (($p) + ($$sum9)|0);
       $201 = HEAP32[$200>>2]|0;
       $202 = ($201|0)==(0|0);
       do {
        if (!($202)) {
         $203 = ($201>>>0)<($197>>>0);
         if ($203) {
          _abort();
          // unreachable;
         } else {
          $204 = ((($R7$1)) + 16|0);
          HEAP32[$204>>2] = $201;
          $205 = ((($201)) + 24|0);
          HEAP32[$205>>2] = $R7$1;
          break;
         }
        }
       } while(0);
       $$sum10 = (($psize) + 20)|0;
       $206 = (($p) + ($$sum10)|0);
       $207 = HEAP32[$206>>2]|0;
       $208 = ($207|0)==(0|0);
       if (!($208)) {
        $209 = HEAP32[(1768)>>2]|0;
        $210 = ($207>>>0)<($209>>>0);
        if ($210) {
         _abort();
         // unreachable;
        } else {
         $211 = ((($R7$1)) + 20|0);
         HEAP32[$211>>2] = $207;
         $212 = ((($207)) + 24|0);
         HEAP32[$212>>2] = $R7$1;
         break;
        }
       }
      }
     }
    } while(0);
    $213 = $128 | 1;
    $214 = ((($$0)) + 4|0);
    HEAP32[$214>>2] = $213;
    $215 = (($$0) + ($128)|0);
    HEAP32[$215>>2] = $128;
    $216 = HEAP32[(1772)>>2]|0;
    $217 = ($$0|0)==($216|0);
    if ($217) {
     HEAP32[(1760)>>2] = $128;
     break;
    } else {
     $$1 = $128;
    }
   } else {
    $218 = $109 & -2;
    HEAP32[$108>>2] = $218;
    $219 = $$02 | 1;
    $220 = ((($$0)) + 4|0);
    HEAP32[$220>>2] = $219;
    $221 = (($$0) + ($$02)|0);
    HEAP32[$221>>2] = $$02;
    $$1 = $$02;
   }
   $222 = $$1 >>> 3;
   $223 = ($$1>>>0)<(256);
   if ($223) {
    $224 = $222 << 1;
    $225 = (1792 + ($224<<2)|0);
    $226 = HEAP32[1752>>2]|0;
    $227 = 1 << $222;
    $228 = $226 & $227;
    $229 = ($228|0)==(0);
    if ($229) {
     $230 = $226 | $227;
     HEAP32[1752>>2] = $230;
     $$pre = (($224) + 2)|0;
     $$pre48 = (1792 + ($$pre<<2)|0);
     $$pre$phiZ2D = $$pre48;$F16$0 = $225;
    } else {
     $$sum7 = (($224) + 2)|0;
     $231 = (1792 + ($$sum7<<2)|0);
     $232 = HEAP32[$231>>2]|0;
     $233 = HEAP32[(1768)>>2]|0;
     $234 = ($232>>>0)<($233>>>0);
     if ($234) {
      _abort();
      // unreachable;
     } else {
      $$pre$phiZ2D = $231;$F16$0 = $232;
     }
    }
    HEAP32[$$pre$phiZ2D>>2] = $$0;
    $235 = ((($F16$0)) + 12|0);
    HEAP32[$235>>2] = $$0;
    $236 = ((($$0)) + 8|0);
    HEAP32[$236>>2] = $F16$0;
    $237 = ((($$0)) + 12|0);
    HEAP32[$237>>2] = $225;
    break;
   }
   $238 = $$1 >>> 8;
   $239 = ($238|0)==(0);
   if ($239) {
    $I19$0 = 0;
   } else {
    $240 = ($$1>>>0)>(16777215);
    if ($240) {
     $I19$0 = 31;
    } else {
     $241 = (($238) + 1048320)|0;
     $242 = $241 >>> 16;
     $243 = $242 & 8;
     $244 = $238 << $243;
     $245 = (($244) + 520192)|0;
     $246 = $245 >>> 16;
     $247 = $246 & 4;
     $248 = $247 | $243;
     $249 = $244 << $247;
     $250 = (($249) + 245760)|0;
     $251 = $250 >>> 16;
     $252 = $251 & 2;
     $253 = $248 | $252;
     $254 = (14 - ($253))|0;
     $255 = $249 << $252;
     $256 = $255 >>> 15;
     $257 = (($254) + ($256))|0;
     $258 = $257 << 1;
     $259 = (($257) + 7)|0;
     $260 = $$1 >>> $259;
     $261 = $260 & 1;
     $262 = $261 | $258;
     $I19$0 = $262;
    }
   }
   $263 = (2056 + ($I19$0<<2)|0);
   $264 = ((($$0)) + 28|0);
   HEAP32[$264>>2] = $I19$0;
   $265 = ((($$0)) + 16|0);
   $266 = ((($$0)) + 20|0);
   HEAP32[$266>>2] = 0;
   HEAP32[$265>>2] = 0;
   $267 = HEAP32[(1756)>>2]|0;
   $268 = 1 << $I19$0;
   $269 = $267 & $268;
   $270 = ($269|0)==(0);
   if ($270) {
    $271 = $267 | $268;
    HEAP32[(1756)>>2] = $271;
    HEAP32[$263>>2] = $$0;
    $272 = ((($$0)) + 24|0);
    HEAP32[$272>>2] = $263;
    $273 = ((($$0)) + 12|0);
    HEAP32[$273>>2] = $$0;
    $274 = ((($$0)) + 8|0);
    HEAP32[$274>>2] = $$0;
    break;
   }
   $275 = HEAP32[$263>>2]|0;
   $276 = ((($275)) + 4|0);
   $277 = HEAP32[$276>>2]|0;
   $278 = $277 & -8;
   $279 = ($278|0)==($$1|0);
   L170: do {
    if ($279) {
     $T$0$lcssa = $275;
    } else {
     $280 = ($I19$0|0)==(31);
     $281 = $I19$0 >>> 1;
     $282 = (25 - ($281))|0;
     $283 = $280 ? 0 : $282;
     $284 = $$1 << $283;
     $K20$043 = $284;$T$042 = $275;
     while(1) {
      $291 = $K20$043 >>> 31;
      $292 = (((($T$042)) + 16|0) + ($291<<2)|0);
      $287 = HEAP32[$292>>2]|0;
      $293 = ($287|0)==(0|0);
      if ($293) {
       $$lcssa = $292;$T$042$lcssa = $T$042;
       break;
      }
      $285 = $K20$043 << 1;
      $286 = ((($287)) + 4|0);
      $288 = HEAP32[$286>>2]|0;
      $289 = $288 & -8;
      $290 = ($289|0)==($$1|0);
      if ($290) {
       $T$0$lcssa = $287;
       break L170;
      } else {
       $K20$043 = $285;$T$042 = $287;
      }
     }
     $294 = HEAP32[(1768)>>2]|0;
     $295 = ($$lcssa>>>0)<($294>>>0);
     if ($295) {
      _abort();
      // unreachable;
     } else {
      HEAP32[$$lcssa>>2] = $$0;
      $296 = ((($$0)) + 24|0);
      HEAP32[$296>>2] = $T$042$lcssa;
      $297 = ((($$0)) + 12|0);
      HEAP32[$297>>2] = $$0;
      $298 = ((($$0)) + 8|0);
      HEAP32[$298>>2] = $$0;
      break L74;
     }
    }
   } while(0);
   $299 = ((($T$0$lcssa)) + 8|0);
   $300 = HEAP32[$299>>2]|0;
   $301 = HEAP32[(1768)>>2]|0;
   $302 = ($300>>>0)>=($301>>>0);
   $not$ = ($T$0$lcssa>>>0)>=($301>>>0);
   $303 = $302 & $not$;
   if ($303) {
    $304 = ((($300)) + 12|0);
    HEAP32[$304>>2] = $$0;
    HEAP32[$299>>2] = $$0;
    $305 = ((($$0)) + 8|0);
    HEAP32[$305>>2] = $300;
    $306 = ((($$0)) + 12|0);
    HEAP32[$306>>2] = $T$0$lcssa;
    $307 = ((($$0)) + 24|0);
    HEAP32[$307>>2] = 0;
    break;
   } else {
    _abort();
    // unreachable;
   }
  }
 } while(0);
 return;
}
function ___fflush_unlocked($f) {
 $f = $f|0;
 var $$0 = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0;
 var $9 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 20|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ((($f)) + 28|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = ($1>>>0)>($3>>>0);
 if ($4) {
  $5 = ((($f)) + 36|0);
  $6 = HEAP32[$5>>2]|0;
  (FUNCTION_TABLE_iiii[$6 & 7]($f,0,0)|0);
  $7 = HEAP32[$0>>2]|0;
  $8 = ($7|0)==(0|0);
  if ($8) {
   $$0 = -1;
  } else {
   label = 3;
  }
 } else {
  label = 3;
 }
 if ((label|0) == 3) {
  $9 = ((($f)) + 4|0);
  $10 = HEAP32[$9>>2]|0;
  $11 = ((($f)) + 8|0);
  $12 = HEAP32[$11>>2]|0;
  $13 = ($10>>>0)<($12>>>0);
  if ($13) {
   $14 = ((($f)) + 40|0);
   $15 = HEAP32[$14>>2]|0;
   $16 = $10;
   $17 = $12;
   $18 = (($16) - ($17))|0;
   (FUNCTION_TABLE_iiii[$15 & 7]($f,$18,1)|0);
  }
  $19 = ((($f)) + 16|0);
  HEAP32[$19>>2] = 0;
  HEAP32[$2>>2] = 0;
  HEAP32[$0>>2] = 0;
  HEAP32[$11>>2] = 0;
  HEAP32[$9>>2] = 0;
  $$0 = 0;
 }
 return ($$0|0);
}
function _printf_core($f,$fmt,$ap,$nl_arg,$nl_type) {
 $f = $f|0;
 $fmt = $fmt|0;
 $ap = $ap|0;
 $nl_arg = $nl_arg|0;
 $nl_type = $nl_type|0;
 var $$ = 0, $$$i = 0, $$0 = 0, $$0$i = 0, $$0$lcssa$i = 0, $$012$i = 0, $$013$i = 0, $$03$i33 = 0, $$07$i = 0.0, $$1$i = 0.0, $$114$i = 0, $$2$i = 0.0, $$20$i = 0.0, $$21$i = 0, $$210$$22$i = 0, $$210$$24$i = 0, $$210$i = 0, $$23$i = 0, $$3$i = 0.0, $$31$i = 0;
 var $$311$i = 0, $$4$i = 0.0, $$412$lcssa$i = 0, $$41276$i = 0, $$5$lcssa$i = 0, $$51 = 0, $$587$i = 0, $$a$3$i = 0, $$a$3185$i = 0, $$a$3186$i = 0, $$fl$4 = 0, $$l10n$0 = 0, $$lcssa = 0, $$lcssa159$i = 0, $$lcssa318 = 0, $$lcssa323 = 0, $$lcssa324 = 0, $$lcssa325 = 0, $$lcssa326 = 0, $$lcssa327 = 0;
 var $$lcssa329 = 0, $$lcssa339 = 0, $$lcssa342 = 0.0, $$lcssa344 = 0, $$neg52$i = 0, $$neg53$i = 0, $$p$$i = 0, $$p$0 = 0, $$p$5 = 0, $$p$i = 0, $$pn$i = 0, $$pr$i = 0, $$pr47$i = 0, $$pre = 0, $$pre$i = 0, $$pre$phi184$iZ2D = 0, $$pre179$i = 0, $$pre182$i = 0, $$pre183$i = 0, $$pre193 = 0;
 var $$sum$i = 0, $$sum15$i = 0, $$sum16$i = 0, $$z$3$i = 0, $$z$4$i = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0;
 var $111 = 0, $112 = 0, $113 = 0, $114 = 0, $115 = 0, $116 = 0, $117 = 0, $118 = 0, $119 = 0, $12 = 0, $120 = 0, $121 = 0, $122 = 0, $123 = 0, $124 = 0, $125 = 0, $126 = 0, $127 = 0, $128 = 0, $129 = 0;
 var $13 = 0, $130 = 0, $131 = 0, $132 = 0, $133 = 0, $134 = 0, $135 = 0, $136 = 0, $137 = 0, $138 = 0, $139 = 0, $14 = 0, $140 = 0, $141 = 0, $142 = 0, $143 = 0, $144 = 0, $145 = 0, $146 = 0, $147 = 0;
 var $148 = 0, $149 = 0, $15 = 0, $150 = 0, $151 = 0, $152 = 0, $153 = 0, $154 = 0, $155 = 0, $156 = 0, $157 = 0, $158 = 0, $159 = 0, $16 = 0, $160 = 0, $161 = 0, $162 = 0, $163 = 0, $164 = 0, $165 = 0;
 var $166 = 0, $167 = 0, $168 = 0, $169 = 0, $17 = 0, $170 = 0, $171 = 0, $172 = 0, $173 = 0, $174 = 0, $175 = 0, $176 = 0, $177 = 0, $178 = 0, $179 = 0, $18 = 0, $180 = 0, $181 = 0, $182 = 0, $183 = 0;
 var $184 = 0, $185 = 0, $186 = 0, $187 = 0, $188 = 0, $189 = 0, $19 = 0, $190 = 0, $191 = 0, $192 = 0, $193 = 0, $194 = 0, $195 = 0, $196 = 0, $197 = 0, $198 = 0, $199 = 0, $2 = 0, $20 = 0, $200 = 0;
 var $201 = 0, $202 = 0, $203 = 0, $204 = 0, $205 = 0, $206 = 0, $207 = 0, $208 = 0, $209 = 0, $21 = 0, $210 = 0, $211 = 0, $212 = 0, $213 = 0, $214 = 0, $215 = 0, $216 = 0, $217 = 0, $218 = 0, $219 = 0;
 var $22 = 0, $220 = 0, $221 = 0, $222 = 0, $223 = 0, $224 = 0, $225 = 0, $226 = 0, $227 = 0, $228 = 0, $229 = 0, $23 = 0, $230 = 0, $231 = 0, $232 = 0, $233 = 0, $234 = 0, $235 = 0, $236 = 0, $237 = 0;
 var $238 = 0, $239 = 0, $24 = 0, $240 = 0, $241 = 0, $242 = 0, $243 = 0, $244 = 0, $245 = 0, $246 = 0, $247 = 0, $248 = 0, $249 = 0, $25 = 0, $250 = 0, $251 = 0, $252 = 0, $253 = 0, $254 = 0, $255 = 0;
 var $256 = 0, $257 = 0, $258 = 0, $259 = 0, $26 = 0, $260 = 0, $261 = 0, $262 = 0, $263 = 0, $264 = 0, $265 = 0, $266 = 0, $267 = 0, $268 = 0, $269 = 0, $27 = 0, $270 = 0, $271 = 0, $272 = 0, $273 = 0;
 var $274 = 0, $275 = 0, $276 = 0, $277 = 0, $278 = 0, $279 = 0, $28 = 0, $280 = 0, $281 = 0, $282 = 0, $283 = 0, $284 = 0, $285 = 0, $286 = 0, $287 = 0, $288 = 0, $289 = 0, $29 = 0, $290 = 0, $291 = 0;
 var $292 = 0, $293 = 0, $294 = 0, $295 = 0, $296 = 0, $297 = 0, $298 = 0, $299 = 0, $3 = 0, $30 = 0, $300 = 0, $301 = 0, $302 = 0, $303 = 0, $304 = 0, $305 = 0, $306 = 0, $307 = 0, $308 = 0, $309 = 0;
 var $31 = 0, $310 = 0, $311 = 0, $312 = 0, $313 = 0, $314 = 0, $315 = 0, $316 = 0, $317 = 0, $318 = 0, $319 = 0, $32 = 0, $320 = 0, $321 = 0, $322 = 0, $323 = 0, $324 = 0, $325 = 0, $326 = 0, $327 = 0;
 var $328 = 0, $329 = 0, $33 = 0, $330 = 0, $331 = 0, $332 = 0, $333 = 0, $334 = 0, $335 = 0, $336 = 0, $337 = 0, $338 = 0, $339 = 0, $34 = 0, $340 = 0, $341 = 0, $342 = 0, $343 = 0, $344 = 0, $345 = 0;
 var $346 = 0, $347 = 0, $348 = 0, $349 = 0, $35 = 0, $350 = 0, $351 = 0, $352 = 0, $353 = 0, $354 = 0, $355 = 0, $356 = 0, $357 = 0, $358 = 0, $359 = 0.0, $36 = 0, $360 = 0, $361 = 0, $362 = 0, $363 = 0.0;
 var $364 = 0, $365 = 0, $366 = 0, $367 = 0, $368 = 0, $369 = 0, $37 = 0, $370 = 0, $371 = 0, $372 = 0, $373 = 0, $374 = 0, $375 = 0, $376 = 0, $377 = 0, $378 = 0, $379 = 0, $38 = 0, $380 = 0, $381 = 0;
 var $382 = 0, $383 = 0, $384 = 0, $385 = 0, $386 = 0, $387 = 0, $388 = 0, $389 = 0, $39 = 0, $390 = 0, $391 = 0.0, $392 = 0.0, $393 = 0, $394 = 0, $395 = 0, $396 = 0, $397 = 0, $398 = 0, $399 = 0, $4 = 0;
 var $40 = 0, $400 = 0, $401 = 0, $402 = 0, $403 = 0, $404 = 0, $405 = 0, $406 = 0, $407 = 0.0, $408 = 0, $409 = 0, $41 = 0, $410 = 0, $411 = 0.0, $412 = 0.0, $413 = 0.0, $414 = 0.0, $415 = 0.0, $416 = 0.0, $417 = 0;
 var $418 = 0, $419 = 0, $42 = 0, $420 = 0, $421 = 0, $422 = 0, $423 = 0, $424 = 0, $425 = 0, $426 = 0, $427 = 0, $428 = 0, $429 = 0, $43 = 0, $430 = 0, $431 = 0, $432 = 0, $433 = 0, $434 = 0, $435 = 0;
 var $436 = 0, $437 = 0, $438 = 0, $439 = 0, $44 = 0, $440 = 0, $441 = 0, $442 = 0.0, $443 = 0.0, $444 = 0.0, $445 = 0, $446 = 0, $447 = 0, $448 = 0, $449 = 0, $45 = 0, $450 = 0, $451 = 0, $452 = 0, $453 = 0;
 var $454 = 0, $455 = 0, $456 = 0, $457 = 0, $458 = 0, $459 = 0, $46 = 0, $460 = 0, $461 = 0, $462 = 0, $463 = 0, $464 = 0, $465 = 0, $466 = 0, $467 = 0, $468 = 0, $469 = 0, $47 = 0, $470 = 0, $471 = 0;
 var $472 = 0, $473 = 0, $474 = 0, $475 = 0, $476 = 0, $477 = 0.0, $478 = 0, $479 = 0, $48 = 0, $480 = 0, $481 = 0, $482 = 0, $483 = 0, $484 = 0, $485 = 0.0, $486 = 0.0, $487 = 0.0, $488 = 0, $489 = 0, $49 = 0;
 var $490 = 0, $491 = 0, $492 = 0, $493 = 0, $494 = 0, $495 = 0, $496 = 0, $497 = 0, $498 = 0, $499 = 0, $5 = 0, $50 = 0, $500 = 0, $501 = 0, $502 = 0, $503 = 0, $504 = 0, $505 = 0, $506 = 0, $507 = 0;
 var $508 = 0, $509 = 0, $51 = 0, $510 = 0, $511 = 0, $512 = 0, $513 = 0, $514 = 0, $515 = 0, $516 = 0, $517 = 0, $518 = 0, $519 = 0, $52 = 0, $520 = 0, $521 = 0, $522 = 0, $523 = 0, $524 = 0, $525 = 0;
 var $526 = 0, $527 = 0, $528 = 0, $529 = 0, $53 = 0, $530 = 0, $531 = 0, $532 = 0, $533 = 0, $534 = 0, $535 = 0, $536 = 0, $537 = 0, $538 = 0, $539 = 0, $54 = 0, $540 = 0, $541 = 0, $542 = 0, $543 = 0;
 var $544 = 0, $545 = 0, $546 = 0, $547 = 0, $548 = 0, $549 = 0, $55 = 0, $550 = 0, $551 = 0, $552 = 0, $553 = 0, $554 = 0, $555 = 0, $556 = 0, $557 = 0, $558 = 0, $559 = 0, $56 = 0, $560 = 0, $561 = 0;
 var $562 = 0, $563 = 0, $564 = 0, $565 = 0, $566 = 0, $567 = 0, $568 = 0, $569 = 0, $57 = 0, $570 = 0, $571 = 0, $572 = 0, $573 = 0, $574 = 0, $575 = 0, $576 = 0, $577 = 0, $578 = 0, $579 = 0, $58 = 0;
 var $580 = 0, $581 = 0, $582 = 0, $583 = 0, $584 = 0, $585 = 0, $586 = 0, $587 = 0, $588 = 0, $589 = 0, $59 = 0, $590 = 0, $591 = 0, $592 = 0, $593 = 0, $594 = 0, $595 = 0, $596 = 0.0, $597 = 0.0, $598 = 0;
 var $599 = 0.0, $6 = 0, $60 = 0, $600 = 0, $601 = 0, $602 = 0, $603 = 0, $604 = 0, $605 = 0, $606 = 0, $607 = 0, $608 = 0, $609 = 0, $61 = 0, $610 = 0, $611 = 0, $612 = 0, $613 = 0, $614 = 0, $615 = 0;
 var $616 = 0, $617 = 0, $618 = 0, $619 = 0, $62 = 0, $620 = 0, $621 = 0, $622 = 0, $623 = 0, $624 = 0, $625 = 0, $626 = 0, $627 = 0, $628 = 0, $629 = 0, $63 = 0, $630 = 0, $631 = 0, $632 = 0, $633 = 0;
 var $634 = 0, $635 = 0, $636 = 0, $637 = 0, $638 = 0, $639 = 0, $64 = 0, $640 = 0, $641 = 0, $642 = 0, $643 = 0, $644 = 0, $645 = 0, $646 = 0, $647 = 0, $648 = 0, $649 = 0, $65 = 0, $650 = 0, $651 = 0;
 var $652 = 0, $653 = 0, $654 = 0, $655 = 0, $656 = 0, $657 = 0, $658 = 0, $659 = 0, $66 = 0, $660 = 0, $661 = 0, $662 = 0, $663 = 0, $664 = 0, $665 = 0, $666 = 0, $667 = 0, $668 = 0, $669 = 0, $67 = 0;
 var $670 = 0, $671 = 0, $672 = 0, $673 = 0, $674 = 0, $675 = 0, $676 = 0, $677 = 0, $678 = 0, $679 = 0, $68 = 0, $680 = 0, $681 = 0, $682 = 0, $683 = 0, $684 = 0, $685 = 0, $686 = 0, $687 = 0, $688 = 0;
 var $689 = 0, $69 = 0, $690 = 0, $691 = 0, $692 = 0, $693 = 0, $694 = 0, $695 = 0, $696 = 0, $697 = 0, $698 = 0, $699 = 0, $7 = 0, $70 = 0, $700 = 0, $701 = 0, $702 = 0, $703 = 0, $704 = 0, $705 = 0;
 var $706 = 0, $707 = 0, $708 = 0, $709 = 0, $71 = 0, $710 = 0, $711 = 0, $712 = 0, $713 = 0, $714 = 0, $715 = 0, $716 = 0, $717 = 0, $718 = 0, $719 = 0, $72 = 0, $720 = 0, $721 = 0, $722 = 0, $723 = 0;
 var $724 = 0, $725 = 0, $726 = 0, $727 = 0, $728 = 0, $729 = 0, $73 = 0, $730 = 0, $731 = 0, $732 = 0, $733 = 0, $734 = 0, $735 = 0, $736 = 0, $737 = 0, $738 = 0, $739 = 0, $74 = 0, $740 = 0, $741 = 0;
 var $742 = 0, $743 = 0, $744 = 0, $745 = 0, $746 = 0, $747 = 0, $748 = 0, $749 = 0, $75 = 0, $750 = 0, $751 = 0, $752 = 0, $753 = 0, $754 = 0, $755 = 0, $756 = 0, $757 = 0, $758 = 0, $759 = 0, $76 = 0;
 var $760 = 0, $761 = 0, $762 = 0, $763 = 0, $764 = 0, $765 = 0, $766 = 0, $767 = 0, $768 = 0, $769 = 0, $77 = 0, $770 = 0, $771 = 0, $772 = 0, $773 = 0, $774 = 0, $775 = 0, $776 = 0, $777 = 0, $778 = 0;
 var $779 = 0, $78 = 0, $780 = 0, $781 = 0, $782 = 0, $783 = 0, $784 = 0, $785 = 0, $786 = 0, $787 = 0, $788 = 0, $789 = 0, $79 = 0, $790 = 0, $791 = 0, $792 = 0, $793 = 0, $794 = 0, $795 = 0, $796 = 0;
 var $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0, $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0;
 var $98 = 0, $99 = 0, $a$0 = 0, $a$1 = 0, $a$1$lcssa$i = 0, $a$1147$i = 0, $a$2 = 0, $a$2$ph$i = 0, $a$3$lcssa$i = 0, $a$3134$i = 0, $a$5$lcssa$i = 0, $a$5109$i = 0, $a$6$i = 0, $a$7$i = 0, $a$8$ph$i = 0, $arg = 0, $arglist_current = 0, $arglist_current2 = 0, $arglist_next = 0, $arglist_next3 = 0;
 var $argpos$0 = 0, $big$i = 0, $buf = 0, $buf$i = 0, $carry$0140$i = 0, $carry3$0128$i = 0, $cnt$0 = 0, $cnt$1 = 0, $cnt$1$lcssa = 0, $d$0$i = 0, $d$0139$i = 0, $d$0141$i = 0, $d$1127$i = 0, $d$2$lcssa$i = 0, $d$2108$i = 0, $d$3$i = 0, $d$482$i = 0, $d$575$i = 0, $d$686$i = 0, $e$0123$i = 0;
 var $e$1$i = 0, $e$2104$i = 0, $e$3$i = 0, $e$4$ph$i = 0, $e2$i = 0, $ebuf0$i = 0, $estr$0$i = 0, $estr$1$lcssa$i = 0, $estr$193$i = 0, $estr$2$i = 0, $exitcond$i = 0, $expanded = 0, $expanded10 = 0, $expanded11 = 0, $expanded13 = 0, $expanded14 = 0, $expanded15 = 0, $expanded4 = 0, $expanded6 = 0, $expanded7 = 0;
 var $expanded8 = 0, $fl$0109 = 0, $fl$062 = 0, $fl$1 = 0, $fl$1$ = 0, $fl$3 = 0, $fl$4 = 0, $fl$6 = 0, $fmt39$lcssa = 0, $fmt39101 = 0, $fmt40 = 0, $fmt41 = 0, $fmt42 = 0, $fmt44 = 0, $fmt44$lcssa321 = 0, $fmt45 = 0, $i$0$lcssa = 0, $i$0$lcssa200 = 0, $i$0114 = 0, $i$0122$i = 0;
 var $i$03$i = 0, $i$03$i25 = 0, $i$1$lcssa$i = 0, $i$1116$i = 0, $i$1125 = 0, $i$2100 = 0, $i$2100$lcssa = 0, $i$2103$i = 0, $i$398 = 0, $i$399$i = 0, $isdigit = 0, $isdigit$i = 0, $isdigit$i27 = 0, $isdigit10 = 0, $isdigit12 = 0, $isdigit2$i = 0, $isdigit2$i23 = 0, $isdigittmp = 0, $isdigittmp$ = 0, $isdigittmp$i = 0;
 var $isdigittmp$i26 = 0, $isdigittmp1$i = 0, $isdigittmp1$i22 = 0, $isdigittmp11 = 0, $isdigittmp4$i = 0, $isdigittmp4$i24 = 0, $isdigittmp9 = 0, $j$0$i = 0, $j$0115$i = 0, $j$0117$i = 0, $j$1100$i = 0, $j$2$i = 0, $l$0 = 0, $l$0$i = 0, $l$1$i = 0, $l$1113 = 0, $l$2 = 0, $l10n$0 = 0, $l10n$0$lcssa = 0, $l10n$0$phi = 0;
 var $l10n$1 = 0, $l10n$2 = 0, $l10n$3 = 0, $mb = 0, $notlhs$i = 0, $notrhs$i = 0, $or$cond = 0, $or$cond$i = 0, $or$cond15 = 0, $or$cond17 = 0, $or$cond20 = 0, $or$cond240 = 0, $or$cond29$i = 0, $or$cond3$not$i = 0, $or$cond6$i = 0, $p$0 = 0, $p$1 = 0, $p$2 = 0, $p$2$ = 0, $p$3 = 0;
 var $p$4198 = 0, $p$5 = 0, $pl$0 = 0, $pl$0$i = 0, $pl$1 = 0, $pl$1$i = 0, $pl$2 = 0, $prefix$0 = 0, $prefix$0$$i = 0, $prefix$0$i = 0, $prefix$1 = 0, $prefix$2 = 0, $r$0$a$8$i = 0, $re$169$i = 0, $round$068$i = 0.0, $round6$1$i = 0.0, $s$0$i = 0, $s$1$i = 0, $s$1$i$lcssa = 0, $s1$0$i = 0;
 var $s7$079$i = 0, $s7$1$i = 0, $s8$0$lcssa$i = 0, $s8$070$i = 0, $s9$0$i = 0, $s9$183$i = 0, $s9$2$i = 0, $small$0$i = 0.0, $small$1$i = 0.0, $st$0 = 0, $st$0$lcssa322 = 0, $storemerge = 0, $storemerge13 = 0, $storemerge8108 = 0, $storemerge860 = 0, $sum = 0, $t$0 = 0, $t$1 = 0, $w$$i = 0, $w$0 = 0;
 var $w$1 = 0, $w$2 = 0, $w$30$i = 0, $wc = 0, $ws$0115 = 0, $ws$1126 = 0, $z$0$i = 0, $z$0$lcssa = 0, $z$0102 = 0, $z$1 = 0, $z$1$lcssa$i = 0, $z$1146$i = 0, $z$2 = 0, $z$2$i = 0, $z$2$i$lcssa = 0, $z$3$lcssa$i = 0, $z$3133$i = 0, $z$4$i = 0, $z$6$$i = 0, $z$6$i = 0;
 var $z$6$i$lcssa = 0, $z$6$ph$i = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 624|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $big$i = sp + 24|0;
 $e2$i = sp + 16|0;
 $buf$i = sp + 588|0;
 $ebuf0$i = sp + 576|0;
 $arg = sp;
 $buf = sp + 536|0;
 $wc = sp + 8|0;
 $mb = sp + 528|0;
 $0 = ($f|0)!=(0|0);
 $1 = ((($buf)) + 40|0);
 $2 = $1;
 $3 = ((($buf)) + 39|0);
 $4 = ((($wc)) + 4|0);
 $5 = ((($ebuf0$i)) + 12|0);
 $6 = ((($ebuf0$i)) + 11|0);
 $7 = $buf$i;
 $8 = $5;
 $9 = (($8) - ($7))|0;
 $10 = (-2 - ($7))|0;
 $11 = (($8) + 2)|0;
 $12 = ((($big$i)) + 288|0);
 $13 = ((($buf$i)) + 9|0);
 $14 = $13;
 $15 = ((($buf$i)) + 8|0);
 $cnt$0 = 0;$fmt41 = $fmt;$l$0 = 0;$l10n$0 = 0;
 L1: while(1) {
  $16 = ($cnt$0|0)>(-1);
  do {
   if ($16) {
    $17 = (2147483647 - ($cnt$0))|0;
    $18 = ($l$0|0)>($17|0);
    if ($18) {
     $19 = (___errno_location()|0);
     HEAP32[$19>>2] = 75;
     $cnt$1 = -1;
     break;
    } else {
     $20 = (($l$0) + ($cnt$0))|0;
     $cnt$1 = $20;
     break;
    }
   } else {
    $cnt$1 = $cnt$0;
   }
  } while(0);
  $21 = HEAP8[$fmt41>>0]|0;
  $22 = ($21<<24>>24)==(0);
  if ($22) {
   $cnt$1$lcssa = $cnt$1;$l10n$0$lcssa = $l10n$0;
   label = 245;
   break;
  } else {
   $23 = $21;$fmt40 = $fmt41;
  }
  L9: while(1) {
   switch ($23<<24>>24) {
   case 37:  {
    $fmt39101 = $fmt40;$z$0102 = $fmt40;
    label = 9;
    break L9;
    break;
   }
   case 0:  {
    $fmt39$lcssa = $fmt40;$z$0$lcssa = $fmt40;
    break L9;
    break;
   }
   default: {
   }
   }
   $24 = ((($fmt40)) + 1|0);
   $$pre = HEAP8[$24>>0]|0;
   $23 = $$pre;$fmt40 = $24;
  }
  L12: do {
   if ((label|0) == 9) {
    while(1) {
     label = 0;
     $25 = ((($fmt39101)) + 1|0);
     $26 = HEAP8[$25>>0]|0;
     $27 = ($26<<24>>24)==(37);
     if (!($27)) {
      $fmt39$lcssa = $fmt39101;$z$0$lcssa = $z$0102;
      break L12;
     }
     $28 = ((($z$0102)) + 1|0);
     $29 = ((($fmt39101)) + 2|0);
     $30 = HEAP8[$29>>0]|0;
     $31 = ($30<<24>>24)==(37);
     if ($31) {
      $fmt39101 = $29;$z$0102 = $28;
      label = 9;
     } else {
      $fmt39$lcssa = $29;$z$0$lcssa = $28;
      break;
     }
    }
   }
  } while(0);
  $32 = $z$0$lcssa;
  $33 = $fmt41;
  $34 = (($32) - ($33))|0;
  if ($0) {
   $35 = HEAP32[$f>>2]|0;
   $36 = $35 & 32;
   $37 = ($36|0)==(0);
   if ($37) {
    (___fwritex($fmt41,$34,$f)|0);
   }
  }
  $38 = ($z$0$lcssa|0)==($fmt41|0);
  if (!($38)) {
   $l10n$0$phi = $l10n$0;$cnt$0 = $cnt$1;$fmt41 = $fmt39$lcssa;$l$0 = $34;$l10n$0 = $l10n$0$phi;
   continue;
  }
  $39 = ((($fmt39$lcssa)) + 1|0);
  $40 = HEAP8[$39>>0]|0;
  $41 = $40 << 24 >> 24;
  $isdigittmp = (($41) + -48)|0;
  $isdigit = ($isdigittmp>>>0)<(10);
  if ($isdigit) {
   $42 = ((($fmt39$lcssa)) + 2|0);
   $43 = HEAP8[$42>>0]|0;
   $44 = ($43<<24>>24)==(36);
   $45 = ((($fmt39$lcssa)) + 3|0);
   $$51 = $44 ? $45 : $39;
   $$l10n$0 = $44 ? 1 : $l10n$0;
   $isdigittmp$ = $44 ? $isdigittmp : -1;
   $$pre193 = HEAP8[$$51>>0]|0;
   $47 = $$pre193;$argpos$0 = $isdigittmp$;$l10n$1 = $$l10n$0;$storemerge = $$51;
  } else {
   $47 = $40;$argpos$0 = -1;$l10n$1 = $l10n$0;$storemerge = $39;
  }
  $46 = $47 << 24 >> 24;
  $48 = $46 & -32;
  $49 = ($48|0)==(32);
  L25: do {
   if ($49) {
    $51 = $46;$56 = $47;$fl$0109 = 0;$storemerge8108 = $storemerge;
    while(1) {
     $50 = (($51) + -32)|0;
     $52 = 1 << $50;
     $53 = $52 & 75913;
     $54 = ($53|0)==(0);
     if ($54) {
      $65 = $56;$fl$062 = $fl$0109;$storemerge860 = $storemerge8108;
      break L25;
     }
     $55 = $56 << 24 >> 24;
     $57 = (($55) + -32)|0;
     $58 = 1 << $57;
     $59 = $58 | $fl$0109;
     $60 = ((($storemerge8108)) + 1|0);
     $61 = HEAP8[$60>>0]|0;
     $62 = $61 << 24 >> 24;
     $63 = $62 & -32;
     $64 = ($63|0)==(32);
     if ($64) {
      $51 = $62;$56 = $61;$fl$0109 = $59;$storemerge8108 = $60;
     } else {
      $65 = $61;$fl$062 = $59;$storemerge860 = $60;
      break;
     }
    }
   } else {
    $65 = $47;$fl$062 = 0;$storemerge860 = $storemerge;
   }
  } while(0);
  $66 = ($65<<24>>24)==(42);
  do {
   if ($66) {
    $67 = ((($storemerge860)) + 1|0);
    $68 = HEAP8[$67>>0]|0;
    $69 = $68 << 24 >> 24;
    $isdigittmp11 = (($69) + -48)|0;
    $isdigit12 = ($isdigittmp11>>>0)<(10);
    if ($isdigit12) {
     $70 = ((($storemerge860)) + 2|0);
     $71 = HEAP8[$70>>0]|0;
     $72 = ($71<<24>>24)==(36);
     if ($72) {
      $73 = (($nl_type) + ($isdigittmp11<<2)|0);
      HEAP32[$73>>2] = 10;
      $74 = HEAP8[$67>>0]|0;
      $75 = $74 << 24 >> 24;
      $76 = (($75) + -48)|0;
      $77 = (($nl_arg) + ($76<<3)|0);
      $78 = $77;
      $79 = $78;
      $80 = HEAP32[$79>>2]|0;
      $81 = (($78) + 4)|0;
      $82 = $81;
      $83 = HEAP32[$82>>2]|0;
      $84 = ((($storemerge860)) + 3|0);
      $l10n$2 = 1;$storemerge13 = $84;$w$0 = $80;
     } else {
      label = 24;
     }
    } else {
     label = 24;
    }
    if ((label|0) == 24) {
     label = 0;
     $85 = ($l10n$1|0)==(0);
     if (!($85)) {
      $$0 = -1;
      break L1;
     }
     if (!($0)) {
      $fl$1 = $fl$062;$fmt42 = $67;$l10n$3 = 0;$w$1 = 0;
      break;
     }
     $arglist_current = HEAP32[$ap>>2]|0;
     $86 = $arglist_current;
     $87 = ((0) + 4|0);
     $expanded4 = $87;
     $expanded = (($expanded4) - 1)|0;
     $88 = (($86) + ($expanded))|0;
     $89 = ((0) + 4|0);
     $expanded8 = $89;
     $expanded7 = (($expanded8) - 1)|0;
     $expanded6 = $expanded7 ^ -1;
     $90 = $88 & $expanded6;
     $91 = $90;
     $92 = HEAP32[$91>>2]|0;
     $arglist_next = ((($91)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next;
     $l10n$2 = 0;$storemerge13 = $67;$w$0 = $92;
    }
    $93 = ($w$0|0)<(0);
    if ($93) {
     $94 = $fl$062 | 8192;
     $95 = (0 - ($w$0))|0;
     $fl$1 = $94;$fmt42 = $storemerge13;$l10n$3 = $l10n$2;$w$1 = $95;
    } else {
     $fl$1 = $fl$062;$fmt42 = $storemerge13;$l10n$3 = $l10n$2;$w$1 = $w$0;
    }
   } else {
    $96 = $65 << 24 >> 24;
    $isdigittmp1$i = (($96) + -48)|0;
    $isdigit2$i = ($isdigittmp1$i>>>0)<(10);
    if ($isdigit2$i) {
     $100 = $storemerge860;$i$03$i = 0;$isdigittmp4$i = $isdigittmp1$i;
     while(1) {
      $97 = ($i$03$i*10)|0;
      $98 = (($97) + ($isdigittmp4$i))|0;
      $99 = ((($100)) + 1|0);
      $101 = HEAP8[$99>>0]|0;
      $102 = $101 << 24 >> 24;
      $isdigittmp$i = (($102) + -48)|0;
      $isdigit$i = ($isdigittmp$i>>>0)<(10);
      if ($isdigit$i) {
       $100 = $99;$i$03$i = $98;$isdigittmp4$i = $isdigittmp$i;
      } else {
       $$lcssa = $98;$$lcssa318 = $99;
       break;
      }
     }
     $103 = ($$lcssa|0)<(0);
     if ($103) {
      $$0 = -1;
      break L1;
     } else {
      $fl$1 = $fl$062;$fmt42 = $$lcssa318;$l10n$3 = $l10n$1;$w$1 = $$lcssa;
     }
    } else {
     $fl$1 = $fl$062;$fmt42 = $storemerge860;$l10n$3 = $l10n$1;$w$1 = 0;
    }
   }
  } while(0);
  $104 = HEAP8[$fmt42>>0]|0;
  $105 = ($104<<24>>24)==(46);
  L46: do {
   if ($105) {
    $106 = ((($fmt42)) + 1|0);
    $107 = HEAP8[$106>>0]|0;
    $108 = ($107<<24>>24)==(42);
    if (!($108)) {
     $135 = $107 << 24 >> 24;
     $isdigittmp1$i22 = (($135) + -48)|0;
     $isdigit2$i23 = ($isdigittmp1$i22>>>0)<(10);
     if ($isdigit2$i23) {
      $139 = $106;$i$03$i25 = 0;$isdigittmp4$i24 = $isdigittmp1$i22;
     } else {
      $fmt45 = $106;$p$0 = 0;
      break;
     }
     while(1) {
      $136 = ($i$03$i25*10)|0;
      $137 = (($136) + ($isdigittmp4$i24))|0;
      $138 = ((($139)) + 1|0);
      $140 = HEAP8[$138>>0]|0;
      $141 = $140 << 24 >> 24;
      $isdigittmp$i26 = (($141) + -48)|0;
      $isdigit$i27 = ($isdigittmp$i26>>>0)<(10);
      if ($isdigit$i27) {
       $139 = $138;$i$03$i25 = $137;$isdigittmp4$i24 = $isdigittmp$i26;
      } else {
       $fmt45 = $138;$p$0 = $137;
       break L46;
      }
     }
    }
    $109 = ((($fmt42)) + 2|0);
    $110 = HEAP8[$109>>0]|0;
    $111 = $110 << 24 >> 24;
    $isdigittmp9 = (($111) + -48)|0;
    $isdigit10 = ($isdigittmp9>>>0)<(10);
    if ($isdigit10) {
     $112 = ((($fmt42)) + 3|0);
     $113 = HEAP8[$112>>0]|0;
     $114 = ($113<<24>>24)==(36);
     if ($114) {
      $115 = (($nl_type) + ($isdigittmp9<<2)|0);
      HEAP32[$115>>2] = 10;
      $116 = HEAP8[$109>>0]|0;
      $117 = $116 << 24 >> 24;
      $118 = (($117) + -48)|0;
      $119 = (($nl_arg) + ($118<<3)|0);
      $120 = $119;
      $121 = $120;
      $122 = HEAP32[$121>>2]|0;
      $123 = (($120) + 4)|0;
      $124 = $123;
      $125 = HEAP32[$124>>2]|0;
      $126 = ((($fmt42)) + 4|0);
      $fmt45 = $126;$p$0 = $122;
      break;
     }
    }
    $127 = ($l10n$3|0)==(0);
    if (!($127)) {
     $$0 = -1;
     break L1;
    }
    if ($0) {
     $arglist_current2 = HEAP32[$ap>>2]|0;
     $128 = $arglist_current2;
     $129 = ((0) + 4|0);
     $expanded11 = $129;
     $expanded10 = (($expanded11) - 1)|0;
     $130 = (($128) + ($expanded10))|0;
     $131 = ((0) + 4|0);
     $expanded15 = $131;
     $expanded14 = (($expanded15) - 1)|0;
     $expanded13 = $expanded14 ^ -1;
     $132 = $130 & $expanded13;
     $133 = $132;
     $134 = HEAP32[$133>>2]|0;
     $arglist_next3 = ((($133)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next3;
     $fmt45 = $109;$p$0 = $134;
    } else {
     $fmt45 = $109;$p$0 = 0;
    }
   } else {
    $fmt45 = $fmt42;$p$0 = -1;
   }
  } while(0);
  $fmt44 = $fmt45;$st$0 = 0;
  while(1) {
   $142 = HEAP8[$fmt44>>0]|0;
   $143 = $142 << 24 >> 24;
   $144 = (($143) + -65)|0;
   $145 = ($144>>>0)>(57);
   if ($145) {
    $$0 = -1;
    break L1;
   }
   $146 = ((($fmt44)) + 1|0);
   $147 = ((15772 + (($st$0*58)|0)|0) + ($144)|0);
   $148 = HEAP8[$147>>0]|0;
   $149 = $148&255;
   $150 = (($149) + -1)|0;
   $151 = ($150>>>0)<(8);
   if ($151) {
    $fmt44 = $146;$st$0 = $149;
   } else {
    $$lcssa323 = $146;$$lcssa324 = $148;$$lcssa325 = $149;$fmt44$lcssa321 = $fmt44;$st$0$lcssa322 = $st$0;
    break;
   }
  }
  $152 = ($$lcssa324<<24>>24)==(0);
  if ($152) {
   $$0 = -1;
   break;
  }
  $153 = ($$lcssa324<<24>>24)==(19);
  $154 = ($argpos$0|0)>(-1);
  do {
   if ($153) {
    if ($154) {
     $$0 = -1;
     break L1;
    } else {
     label = 52;
    }
   } else {
    if ($154) {
     $155 = (($nl_type) + ($argpos$0<<2)|0);
     HEAP32[$155>>2] = $$lcssa325;
     $156 = (($nl_arg) + ($argpos$0<<3)|0);
     $157 = $156;
     $158 = $157;
     $159 = HEAP32[$158>>2]|0;
     $160 = (($157) + 4)|0;
     $161 = $160;
     $162 = HEAP32[$161>>2]|0;
     $163 = $arg;
     $164 = $163;
     HEAP32[$164>>2] = $159;
     $165 = (($163) + 4)|0;
     $166 = $165;
     HEAP32[$166>>2] = $162;
     label = 52;
     break;
    }
    if (!($0)) {
     $$0 = 0;
     break L1;
    }
    _pop_arg($arg,$$lcssa325,$ap);
   }
  } while(0);
  if ((label|0) == 52) {
   label = 0;
   if (!($0)) {
    $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
    continue;
   }
  }
  $167 = HEAP8[$fmt44$lcssa321>>0]|0;
  $168 = $167 << 24 >> 24;
  $169 = ($st$0$lcssa322|0)!=(0);
  $170 = $168 & 15;
  $171 = ($170|0)==(3);
  $or$cond15 = $169 & $171;
  $172 = $168 & -33;
  $t$0 = $or$cond15 ? $172 : $168;
  $173 = $fl$1 & 8192;
  $174 = ($173|0)==(0);
  $175 = $fl$1 & -65537;
  $fl$1$ = $174 ? $fl$1 : $175;
  L75: do {
   switch ($t$0|0) {
   case 110:  {
    switch ($st$0$lcssa322|0) {
    case 0:  {
     $182 = HEAP32[$arg>>2]|0;
     HEAP32[$182>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 1:  {
     $183 = HEAP32[$arg>>2]|0;
     HEAP32[$183>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 2:  {
     $184 = ($cnt$1|0)<(0);
     $185 = $184 << 31 >> 31;
     $186 = HEAP32[$arg>>2]|0;
     $187 = $186;
     $188 = $187;
     HEAP32[$188>>2] = $cnt$1;
     $189 = (($187) + 4)|0;
     $190 = $189;
     HEAP32[$190>>2] = $185;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 3:  {
     $191 = $cnt$1&65535;
     $192 = HEAP32[$arg>>2]|0;
     HEAP16[$192>>1] = $191;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 4:  {
     $193 = $cnt$1&255;
     $194 = HEAP32[$arg>>2]|0;
     HEAP8[$194>>0] = $193;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 6:  {
     $195 = HEAP32[$arg>>2]|0;
     HEAP32[$195>>2] = $cnt$1;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    case 7:  {
     $196 = ($cnt$1|0)<(0);
     $197 = $196 << 31 >> 31;
     $198 = HEAP32[$arg>>2]|0;
     $199 = $198;
     $200 = $199;
     HEAP32[$200>>2] = $cnt$1;
     $201 = (($199) + 4)|0;
     $202 = $201;
     HEAP32[$202>>2] = $197;
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
     break;
    }
    default: {
     $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $34;$l10n$0 = $l10n$3;
     continue L1;
    }
    }
    break;
   }
   case 112:  {
    $203 = ($p$0>>>0)>(8);
    $204 = $203 ? $p$0 : 8;
    $205 = $fl$1$ | 8;
    $fl$3 = $205;$p$1 = $204;$t$1 = 120;
    label = 64;
    break;
   }
   case 88: case 120:  {
    $fl$3 = $fl$1$;$p$1 = $p$0;$t$1 = $t$0;
    label = 64;
    break;
   }
   case 111:  {
    $243 = $arg;
    $244 = $243;
    $245 = HEAP32[$244>>2]|0;
    $246 = (($243) + 4)|0;
    $247 = $246;
    $248 = HEAP32[$247>>2]|0;
    $249 = ($245|0)==(0);
    $250 = ($248|0)==(0);
    $251 = $249 & $250;
    if ($251) {
     $$0$lcssa$i = $1;
    } else {
     $$03$i33 = $1;$253 = $245;$257 = $248;
     while(1) {
      $252 = $253 & 7;
      $254 = $252 | 48;
      $255 = $254&255;
      $256 = ((($$03$i33)) + -1|0);
      HEAP8[$256>>0] = $255;
      $258 = (_bitshift64Lshr(($253|0),($257|0),3)|0);
      $259 = tempRet0;
      $260 = ($258|0)==(0);
      $261 = ($259|0)==(0);
      $262 = $260 & $261;
      if ($262) {
       $$0$lcssa$i = $256;
       break;
      } else {
       $$03$i33 = $256;$253 = $258;$257 = $259;
      }
     }
    }
    $263 = $fl$1$ & 8;
    $264 = ($263|0)==(0);
    if ($264) {
     $a$0 = $$0$lcssa$i;$fl$4 = $fl$1$;$p$2 = $p$0;$pl$1 = 0;$prefix$1 = 16252;
     label = 77;
    } else {
     $265 = $$0$lcssa$i;
     $266 = (($2) - ($265))|0;
     $267 = (($266) + 1)|0;
     $268 = ($p$0|0)<($267|0);
     $$p$0 = $268 ? $267 : $p$0;
     $a$0 = $$0$lcssa$i;$fl$4 = $fl$1$;$p$2 = $$p$0;$pl$1 = 0;$prefix$1 = 16252;
     label = 77;
    }
    break;
   }
   case 105: case 100:  {
    $269 = $arg;
    $270 = $269;
    $271 = HEAP32[$270>>2]|0;
    $272 = (($269) + 4)|0;
    $273 = $272;
    $274 = HEAP32[$273>>2]|0;
    $275 = ($274|0)<(0);
    if ($275) {
     $276 = (_i64Subtract(0,0,($271|0),($274|0))|0);
     $277 = tempRet0;
     $278 = $arg;
     $279 = $278;
     HEAP32[$279>>2] = $276;
     $280 = (($278) + 4)|0;
     $281 = $280;
     HEAP32[$281>>2] = $277;
     $286 = $276;$287 = $277;$pl$0 = 1;$prefix$0 = 16252;
     label = 76;
     break L75;
    }
    $282 = $fl$1$ & 2048;
    $283 = ($282|0)==(0);
    if ($283) {
     $284 = $fl$1$ & 1;
     $285 = ($284|0)==(0);
     $$ = $285 ? 16252 : (16254);
     $286 = $271;$287 = $274;$pl$0 = $284;$prefix$0 = $$;
     label = 76;
    } else {
     $286 = $271;$287 = $274;$pl$0 = 1;$prefix$0 = (16253);
     label = 76;
    }
    break;
   }
   case 117:  {
    $176 = $arg;
    $177 = $176;
    $178 = HEAP32[$177>>2]|0;
    $179 = (($176) + 4)|0;
    $180 = $179;
    $181 = HEAP32[$180>>2]|0;
    $286 = $178;$287 = $181;$pl$0 = 0;$prefix$0 = 16252;
    label = 76;
    break;
   }
   case 99:  {
    $307 = $arg;
    $308 = $307;
    $309 = HEAP32[$308>>2]|0;
    $310 = (($307) + 4)|0;
    $311 = $310;
    $312 = HEAP32[$311>>2]|0;
    $313 = $309&255;
    HEAP8[$3>>0] = $313;
    $a$2 = $3;$fl$6 = $175;$p$5 = 1;$pl$2 = 0;$prefix$2 = 16252;$z$2 = $1;
    break;
   }
   case 109:  {
    $314 = (___errno_location()|0);
    $315 = HEAP32[$314>>2]|0;
    $316 = (_strerror($315)|0);
    $a$1 = $316;
    label = 82;
    break;
   }
   case 115:  {
    $317 = HEAP32[$arg>>2]|0;
    $318 = ($317|0)!=(0|0);
    $319 = $318 ? $317 : 16262;
    $a$1 = $319;
    label = 82;
    break;
   }
   case 67:  {
    $326 = $arg;
    $327 = $326;
    $328 = HEAP32[$327>>2]|0;
    $329 = (($326) + 4)|0;
    $330 = $329;
    $331 = HEAP32[$330>>2]|0;
    HEAP32[$wc>>2] = $328;
    HEAP32[$4>>2] = 0;
    HEAP32[$arg>>2] = $wc;
    $p$4198 = -1;
    label = 86;
    break;
   }
   case 83:  {
    $332 = ($p$0|0)==(0);
    if ($332) {
     _pad($f,32,$w$1,0,$fl$1$);
     $i$0$lcssa200 = 0;
     label = 98;
    } else {
     $p$4198 = $p$0;
     label = 86;
    }
    break;
   }
   case 65: case 71: case 70: case 69: case 97: case 103: case 102: case 101:  {
    $359 = +HEAPF64[$arg>>3];
    HEAP32[$e2$i>>2] = 0;
    HEAPF64[tempDoublePtr>>3] = $359;$360 = HEAP32[tempDoublePtr>>2]|0;
    $361 = HEAP32[tempDoublePtr+4>>2]|0;
    $362 = ($361|0)<(0);
    if ($362) {
     $363 = -$359;
     $$07$i = $363;$pl$0$i = 1;$prefix$0$i = 16269;
    } else {
     $364 = $fl$1$ & 2048;
     $365 = ($364|0)==(0);
     if ($365) {
      $366 = $fl$1$ & 1;
      $367 = ($366|0)==(0);
      $$$i = $367 ? (16270) : (16275);
      $$07$i = $359;$pl$0$i = $366;$prefix$0$i = $$$i;
     } else {
      $$07$i = $359;$pl$0$i = 1;$prefix$0$i = (16272);
     }
    }
    HEAPF64[tempDoublePtr>>3] = $$07$i;$368 = HEAP32[tempDoublePtr>>2]|0;
    $369 = HEAP32[tempDoublePtr+4>>2]|0;
    $370 = $369 & 2146435072;
    $371 = ($370>>>0)<(2146435072);
    $372 = (0)<(0);
    $373 = ($370|0)==(2146435072);
    $374 = $373 & $372;
    $375 = $371 | $374;
    do {
     if ($375) {
      $391 = (+_frexpl($$07$i,$e2$i));
      $392 = $391 * 2.0;
      $393 = $392 != 0.0;
      if ($393) {
       $394 = HEAP32[$e2$i>>2]|0;
       $395 = (($394) + -1)|0;
       HEAP32[$e2$i>>2] = $395;
      }
      $396 = $t$0 | 32;
      $397 = ($396|0)==(97);
      if ($397) {
       $398 = $t$0 & 32;
       $399 = ($398|0)==(0);
       $400 = ((($prefix$0$i)) + 9|0);
       $prefix$0$$i = $399 ? $prefix$0$i : $400;
       $401 = $pl$0$i | 2;
       $402 = ($p$0>>>0)>(11);
       $403 = (12 - ($p$0))|0;
       $404 = ($403|0)==(0);
       $405 = $402 | $404;
       do {
        if ($405) {
         $$1$i = $392;
        } else {
         $re$169$i = $403;$round$068$i = 8.0;
         while(1) {
          $406 = (($re$169$i) + -1)|0;
          $407 = $round$068$i * 16.0;
          $408 = ($406|0)==(0);
          if ($408) {
           $$lcssa342 = $407;
           break;
          } else {
           $re$169$i = $406;$round$068$i = $407;
          }
         }
         $409 = HEAP8[$prefix$0$$i>>0]|0;
         $410 = ($409<<24>>24)==(45);
         if ($410) {
          $411 = -$392;
          $412 = $411 - $$lcssa342;
          $413 = $$lcssa342 + $412;
          $414 = -$413;
          $$1$i = $414;
          break;
         } else {
          $415 = $392 + $$lcssa342;
          $416 = $415 - $$lcssa342;
          $$1$i = $416;
          break;
         }
        }
       } while(0);
       $417 = HEAP32[$e2$i>>2]|0;
       $418 = ($417|0)<(0);
       $419 = (0 - ($417))|0;
       $420 = $418 ? $419 : $417;
       $421 = ($420|0)<(0);
       $422 = $421 << 31 >> 31;
       $423 = (_fmt_u($420,$422,$5)|0);
       $424 = ($423|0)==($5|0);
       if ($424) {
        HEAP8[$6>>0] = 48;
        $estr$0$i = $6;
       } else {
        $estr$0$i = $423;
       }
       $425 = $417 >> 31;
       $426 = $425 & 2;
       $427 = (($426) + 43)|0;
       $428 = $427&255;
       $429 = ((($estr$0$i)) + -1|0);
       HEAP8[$429>>0] = $428;
       $430 = (($t$0) + 15)|0;
       $431 = $430&255;
       $432 = ((($estr$0$i)) + -2|0);
       HEAP8[$432>>0] = $431;
       $notrhs$i = ($p$0|0)<(1);
       $433 = $fl$1$ & 8;
       $434 = ($433|0)==(0);
       $$2$i = $$1$i;$s$0$i = $buf$i;
       while(1) {
        $435 = (~~(($$2$i)));
        $436 = (16236 + ($435)|0);
        $437 = HEAP8[$436>>0]|0;
        $438 = $437&255;
        $439 = $438 | $398;
        $440 = $439&255;
        $441 = ((($s$0$i)) + 1|0);
        HEAP8[$s$0$i>>0] = $440;
        $442 = (+($435|0));
        $443 = $$2$i - $442;
        $444 = $443 * 16.0;
        $445 = $441;
        $446 = (($445) - ($7))|0;
        $447 = ($446|0)==(1);
        do {
         if ($447) {
          $notlhs$i = $444 == 0.0;
          $or$cond3$not$i = $notrhs$i & $notlhs$i;
          $or$cond$i = $434 & $or$cond3$not$i;
          if ($or$cond$i) {
           $s$1$i = $441;
           break;
          }
          $448 = ((($s$0$i)) + 2|0);
          HEAP8[$441>>0] = 46;
          $s$1$i = $448;
         } else {
          $s$1$i = $441;
         }
        } while(0);
        $449 = $444 != 0.0;
        if ($449) {
         $$2$i = $444;$s$0$i = $s$1$i;
        } else {
         $s$1$i$lcssa = $s$1$i;
         break;
        }
       }
       $450 = ($p$0|0)!=(0);
       $$pre182$i = $s$1$i$lcssa;
       $451 = (($10) + ($$pre182$i))|0;
       $452 = ($451|0)<($p$0|0);
       $or$cond240 = $450 & $452;
       $453 = $432;
       $454 = (($11) + ($p$0))|0;
       $455 = (($454) - ($453))|0;
       $456 = $432;
       $457 = (($9) - ($456))|0;
       $458 = (($457) + ($$pre182$i))|0;
       $l$0$i = $or$cond240 ? $455 : $458;
       $459 = (($l$0$i) + ($401))|0;
       _pad($f,32,$w$1,$459,$fl$1$);
       $460 = HEAP32[$f>>2]|0;
       $461 = $460 & 32;
       $462 = ($461|0)==(0);
       if ($462) {
        (___fwritex($prefix$0$$i,$401,$f)|0);
       }
       $463 = $fl$1$ ^ 65536;
       _pad($f,48,$w$1,$459,$463);
       $464 = (($$pre182$i) - ($7))|0;
       $465 = HEAP32[$f>>2]|0;
       $466 = $465 & 32;
       $467 = ($466|0)==(0);
       if ($467) {
        (___fwritex($buf$i,$464,$f)|0);
       }
       $468 = $432;
       $469 = (($8) - ($468))|0;
       $sum = (($464) + ($469))|0;
       $470 = (($l$0$i) - ($sum))|0;
       _pad($f,48,$470,0,0);
       $471 = HEAP32[$f>>2]|0;
       $472 = $471 & 32;
       $473 = ($472|0)==(0);
       if ($473) {
        (___fwritex($432,$469,$f)|0);
       }
       $474 = $fl$1$ ^ 8192;
       _pad($f,32,$w$1,$459,$474);
       $475 = ($459|0)<($w$1|0);
       $w$$i = $475 ? $w$1 : $459;
       $$0$i = $w$$i;
       break;
      }
      $476 = ($p$0|0)<(0);
      $$p$i = $476 ? 6 : $p$0;
      if ($393) {
       $477 = $392 * 268435456.0;
       $478 = HEAP32[$e2$i>>2]|0;
       $479 = (($478) + -28)|0;
       HEAP32[$e2$i>>2] = $479;
       $$3$i = $477;$480 = $479;
      } else {
       $$pre179$i = HEAP32[$e2$i>>2]|0;
       $$3$i = $392;$480 = $$pre179$i;
      }
      $481 = ($480|0)<(0);
      $$31$i = $481 ? $big$i : $12;
      $482 = $$31$i;
      $$4$i = $$3$i;$z$0$i = $$31$i;
      while(1) {
       $483 = (~~(($$4$i))>>>0);
       HEAP32[$z$0$i>>2] = $483;
       $484 = ((($z$0$i)) + 4|0);
       $485 = (+($483>>>0));
       $486 = $$4$i - $485;
       $487 = $486 * 1.0E+9;
       $488 = $487 != 0.0;
       if ($488) {
        $$4$i = $487;$z$0$i = $484;
       } else {
        $$lcssa326 = $484;
        break;
       }
      }
      $$pr$i = HEAP32[$e2$i>>2]|0;
      $489 = ($$pr$i|0)>(0);
      if ($489) {
       $490 = $$pr$i;$a$1147$i = $$31$i;$z$1146$i = $$lcssa326;
       while(1) {
        $491 = ($490|0)>(29);
        $492 = $491 ? 29 : $490;
        $d$0139$i = ((($z$1146$i)) + -4|0);
        $493 = ($d$0139$i>>>0)<($a$1147$i>>>0);
        do {
         if ($493) {
          $a$2$ph$i = $a$1147$i;
         } else {
          $carry$0140$i = 0;$d$0141$i = $d$0139$i;
          while(1) {
           $494 = HEAP32[$d$0141$i>>2]|0;
           $495 = (_bitshift64Shl(($494|0),0,($492|0))|0);
           $496 = tempRet0;
           $497 = (_i64Add(($495|0),($496|0),($carry$0140$i|0),0)|0);
           $498 = tempRet0;
           $499 = (___uremdi3(($497|0),($498|0),1000000000,0)|0);
           $500 = tempRet0;
           HEAP32[$d$0141$i>>2] = $499;
           $501 = (___udivdi3(($497|0),($498|0),1000000000,0)|0);
           $502 = tempRet0;
           $d$0$i = ((($d$0141$i)) + -4|0);
           $503 = ($d$0$i>>>0)<($a$1147$i>>>0);
           if ($503) {
            $$lcssa327 = $501;
            break;
           } else {
            $carry$0140$i = $501;$d$0141$i = $d$0$i;
           }
          }
          $504 = ($$lcssa327|0)==(0);
          if ($504) {
           $a$2$ph$i = $a$1147$i;
           break;
          }
          $505 = ((($a$1147$i)) + -4|0);
          HEAP32[$505>>2] = $$lcssa327;
          $a$2$ph$i = $505;
         }
        } while(0);
        $z$2$i = $z$1146$i;
        while(1) {
         $506 = ($z$2$i>>>0)>($a$2$ph$i>>>0);
         if (!($506)) {
          $z$2$i$lcssa = $z$2$i;
          break;
         }
         $507 = ((($z$2$i)) + -4|0);
         $508 = HEAP32[$507>>2]|0;
         $509 = ($508|0)==(0);
         if ($509) {
          $z$2$i = $507;
         } else {
          $z$2$i$lcssa = $z$2$i;
          break;
         }
        }
        $510 = HEAP32[$e2$i>>2]|0;
        $511 = (($510) - ($492))|0;
        HEAP32[$e2$i>>2] = $511;
        $512 = ($511|0)>(0);
        if ($512) {
         $490 = $511;$a$1147$i = $a$2$ph$i;$z$1146$i = $z$2$i$lcssa;
        } else {
         $$pr47$i = $511;$a$1$lcssa$i = $a$2$ph$i;$z$1$lcssa$i = $z$2$i$lcssa;
         break;
        }
       }
      } else {
       $$pr47$i = $$pr$i;$a$1$lcssa$i = $$31$i;$z$1$lcssa$i = $$lcssa326;
      }
      $513 = ($$pr47$i|0)<(0);
      if ($513) {
       $514 = (($$p$i) + 25)|0;
       $515 = (($514|0) / 9)&-1;
       $516 = (($515) + 1)|0;
       $517 = ($396|0)==(102);
       $519 = $$pr47$i;$a$3134$i = $a$1$lcssa$i;$z$3133$i = $z$1$lcssa$i;
       while(1) {
        $518 = (0 - ($519))|0;
        $520 = ($518|0)>(9);
        $521 = $520 ? 9 : $518;
        $522 = ($a$3134$i>>>0)<($z$3133$i>>>0);
        do {
         if ($522) {
          $526 = 1 << $521;
          $527 = (($526) + -1)|0;
          $528 = 1000000000 >>> $521;
          $carry3$0128$i = 0;$d$1127$i = $a$3134$i;
          while(1) {
           $529 = HEAP32[$d$1127$i>>2]|0;
           $530 = $529 & $527;
           $531 = $529 >>> $521;
           $532 = (($531) + ($carry3$0128$i))|0;
           HEAP32[$d$1127$i>>2] = $532;
           $533 = Math_imul($530, $528)|0;
           $534 = ((($d$1127$i)) + 4|0);
           $535 = ($534>>>0)<($z$3133$i>>>0);
           if ($535) {
            $carry3$0128$i = $533;$d$1127$i = $534;
           } else {
            $$lcssa329 = $533;
            break;
           }
          }
          $536 = HEAP32[$a$3134$i>>2]|0;
          $537 = ($536|0)==(0);
          $538 = ((($a$3134$i)) + 4|0);
          $$a$3$i = $537 ? $538 : $a$3134$i;
          $539 = ($$lcssa329|0)==(0);
          if ($539) {
           $$a$3186$i = $$a$3$i;$z$4$i = $z$3133$i;
           break;
          }
          $540 = ((($z$3133$i)) + 4|0);
          HEAP32[$z$3133$i>>2] = $$lcssa329;
          $$a$3186$i = $$a$3$i;$z$4$i = $540;
         } else {
          $523 = HEAP32[$a$3134$i>>2]|0;
          $524 = ($523|0)==(0);
          $525 = ((($a$3134$i)) + 4|0);
          $$a$3185$i = $524 ? $525 : $a$3134$i;
          $$a$3186$i = $$a$3185$i;$z$4$i = $z$3133$i;
         }
        } while(0);
        $541 = $517 ? $$31$i : $$a$3186$i;
        $542 = $z$4$i;
        $543 = $541;
        $544 = (($542) - ($543))|0;
        $545 = $544 >> 2;
        $546 = ($545|0)>($516|0);
        $547 = (($541) + ($516<<2)|0);
        $$z$4$i = $546 ? $547 : $z$4$i;
        $548 = HEAP32[$e2$i>>2]|0;
        $549 = (($548) + ($521))|0;
        HEAP32[$e2$i>>2] = $549;
        $550 = ($549|0)<(0);
        if ($550) {
         $519 = $549;$a$3134$i = $$a$3186$i;$z$3133$i = $$z$4$i;
        } else {
         $a$3$lcssa$i = $$a$3186$i;$z$3$lcssa$i = $$z$4$i;
         break;
        }
       }
      } else {
       $a$3$lcssa$i = $a$1$lcssa$i;$z$3$lcssa$i = $z$1$lcssa$i;
      }
      $551 = ($a$3$lcssa$i>>>0)<($z$3$lcssa$i>>>0);
      do {
       if ($551) {
        $552 = $a$3$lcssa$i;
        $553 = (($482) - ($552))|0;
        $554 = $553 >> 2;
        $555 = ($554*9)|0;
        $556 = HEAP32[$a$3$lcssa$i>>2]|0;
        $557 = ($556>>>0)<(10);
        if ($557) {
         $e$1$i = $555;
         break;
        } else {
         $e$0123$i = $555;$i$0122$i = 10;
        }
        while(1) {
         $558 = ($i$0122$i*10)|0;
         $559 = (($e$0123$i) + 1)|0;
         $560 = ($556>>>0)<($558>>>0);
         if ($560) {
          $e$1$i = $559;
          break;
         } else {
          $e$0123$i = $559;$i$0122$i = $558;
         }
        }
       } else {
        $e$1$i = 0;
       }
      } while(0);
      $561 = ($396|0)!=(102);
      $562 = $561 ? $e$1$i : 0;
      $563 = (($$p$i) - ($562))|0;
      $564 = ($396|0)==(103);
      $565 = ($$p$i|0)!=(0);
      $566 = $565 & $564;
      $$neg52$i = $566 << 31 >> 31;
      $567 = (($563) + ($$neg52$i))|0;
      $568 = $z$3$lcssa$i;
      $569 = (($568) - ($482))|0;
      $570 = $569 >> 2;
      $571 = ($570*9)|0;
      $572 = (($571) + -9)|0;
      $573 = ($567|0)<($572|0);
      if ($573) {
       $574 = (($567) + 9216)|0;
       $575 = (($574|0) / 9)&-1;
       $$sum$i = (($575) + -1023)|0;
       $576 = (($$31$i) + ($$sum$i<<2)|0);
       $577 = (($574|0) % 9)&-1;
       $j$0115$i = (($577) + 1)|0;
       $578 = ($j$0115$i|0)<(9);
       if ($578) {
        $i$1116$i = 10;$j$0117$i = $j$0115$i;
        while(1) {
         $579 = ($i$1116$i*10)|0;
         $j$0$i = (($j$0117$i) + 1)|0;
         $exitcond$i = ($j$0$i|0)==(9);
         if ($exitcond$i) {
          $i$1$lcssa$i = $579;
          break;
         } else {
          $i$1116$i = $579;$j$0117$i = $j$0$i;
         }
        }
       } else {
        $i$1$lcssa$i = 10;
       }
       $580 = HEAP32[$576>>2]|0;
       $581 = (($580>>>0) % ($i$1$lcssa$i>>>0))&-1;
       $582 = ($581|0)==(0);
       if ($582) {
        $$sum15$i = (($575) + -1022)|0;
        $583 = (($$31$i) + ($$sum15$i<<2)|0);
        $584 = ($583|0)==($z$3$lcssa$i|0);
        if ($584) {
         $a$7$i = $a$3$lcssa$i;$d$3$i = $576;$e$3$i = $e$1$i;
        } else {
         label = 163;
        }
       } else {
        label = 163;
       }
       do {
        if ((label|0) == 163) {
         label = 0;
         $585 = (($580>>>0) / ($i$1$lcssa$i>>>0))&-1;
         $586 = $585 & 1;
         $587 = ($586|0)==(0);
         $$20$i = $587 ? 9007199254740992.0 : 9007199254740994.0;
         $588 = (($i$1$lcssa$i|0) / 2)&-1;
         $589 = ($581>>>0)<($588>>>0);
         do {
          if ($589) {
           $small$0$i = 0.5;
          } else {
           $590 = ($581|0)==($588|0);
           if ($590) {
            $$sum16$i = (($575) + -1022)|0;
            $591 = (($$31$i) + ($$sum16$i<<2)|0);
            $592 = ($591|0)==($z$3$lcssa$i|0);
            if ($592) {
             $small$0$i = 1.0;
             break;
            }
           }
           $small$0$i = 1.5;
          }
         } while(0);
         $593 = ($pl$0$i|0)==(0);
         do {
          if ($593) {
           $round6$1$i = $$20$i;$small$1$i = $small$0$i;
          } else {
           $594 = HEAP8[$prefix$0$i>>0]|0;
           $595 = ($594<<24>>24)==(45);
           if (!($595)) {
            $round6$1$i = $$20$i;$small$1$i = $small$0$i;
            break;
           }
           $596 = -$$20$i;
           $597 = -$small$0$i;
           $round6$1$i = $596;$small$1$i = $597;
          }
         } while(0);
         $598 = (($580) - ($581))|0;
         HEAP32[$576>>2] = $598;
         $599 = $round6$1$i + $small$1$i;
         $600 = $599 != $round6$1$i;
         if (!($600)) {
          $a$7$i = $a$3$lcssa$i;$d$3$i = $576;$e$3$i = $e$1$i;
          break;
         }
         $601 = (($598) + ($i$1$lcssa$i))|0;
         HEAP32[$576>>2] = $601;
         $602 = ($601>>>0)>(999999999);
         if ($602) {
          $a$5109$i = $a$3$lcssa$i;$d$2108$i = $576;
          while(1) {
           $603 = ((($d$2108$i)) + -4|0);
           HEAP32[$d$2108$i>>2] = 0;
           $604 = ($603>>>0)<($a$5109$i>>>0);
           if ($604) {
            $605 = ((($a$5109$i)) + -4|0);
            HEAP32[$605>>2] = 0;
            $a$6$i = $605;
           } else {
            $a$6$i = $a$5109$i;
           }
           $606 = HEAP32[$603>>2]|0;
           $607 = (($606) + 1)|0;
           HEAP32[$603>>2] = $607;
           $608 = ($607>>>0)>(999999999);
           if ($608) {
            $a$5109$i = $a$6$i;$d$2108$i = $603;
           } else {
            $a$5$lcssa$i = $a$6$i;$d$2$lcssa$i = $603;
            break;
           }
          }
         } else {
          $a$5$lcssa$i = $a$3$lcssa$i;$d$2$lcssa$i = $576;
         }
         $609 = $a$5$lcssa$i;
         $610 = (($482) - ($609))|0;
         $611 = $610 >> 2;
         $612 = ($611*9)|0;
         $613 = HEAP32[$a$5$lcssa$i>>2]|0;
         $614 = ($613>>>0)<(10);
         if ($614) {
          $a$7$i = $a$5$lcssa$i;$d$3$i = $d$2$lcssa$i;$e$3$i = $612;
          break;
         } else {
          $e$2104$i = $612;$i$2103$i = 10;
         }
         while(1) {
          $615 = ($i$2103$i*10)|0;
          $616 = (($e$2104$i) + 1)|0;
          $617 = ($613>>>0)<($615>>>0);
          if ($617) {
           $a$7$i = $a$5$lcssa$i;$d$3$i = $d$2$lcssa$i;$e$3$i = $616;
           break;
          } else {
           $e$2104$i = $616;$i$2103$i = $615;
          }
         }
        }
       } while(0);
       $618 = ((($d$3$i)) + 4|0);
       $619 = ($z$3$lcssa$i>>>0)>($618>>>0);
       $$z$3$i = $619 ? $618 : $z$3$lcssa$i;
       $a$8$ph$i = $a$7$i;$e$4$ph$i = $e$3$i;$z$6$ph$i = $$z$3$i;
      } else {
       $a$8$ph$i = $a$3$lcssa$i;$e$4$ph$i = $e$1$i;$z$6$ph$i = $z$3$lcssa$i;
      }
      $620 = (0 - ($e$4$ph$i))|0;
      $z$6$i = $z$6$ph$i;
      while(1) {
       $621 = ($z$6$i>>>0)>($a$8$ph$i>>>0);
       if (!($621)) {
        $$lcssa159$i = 0;$z$6$i$lcssa = $z$6$i;
        break;
       }
       $622 = ((($z$6$i)) + -4|0);
       $623 = HEAP32[$622>>2]|0;
       $624 = ($623|0)==(0);
       if ($624) {
        $z$6$i = $622;
       } else {
        $$lcssa159$i = 1;$z$6$i$lcssa = $z$6$i;
        break;
       }
      }
      do {
       if ($564) {
        $625 = $565&1;
        $626 = $625 ^ 1;
        $$p$$i = (($626) + ($$p$i))|0;
        $627 = ($$p$$i|0)>($e$4$ph$i|0);
        $628 = ($e$4$ph$i|0)>(-5);
        $or$cond6$i = $627 & $628;
        if ($or$cond6$i) {
         $629 = (($t$0) + -1)|0;
         $$neg53$i = (($$p$$i) + -1)|0;
         $630 = (($$neg53$i) - ($e$4$ph$i))|0;
         $$013$i = $629;$$210$i = $630;
        } else {
         $631 = (($t$0) + -2)|0;
         $632 = (($$p$$i) + -1)|0;
         $$013$i = $631;$$210$i = $632;
        }
        $633 = $fl$1$ & 8;
        $634 = ($633|0)==(0);
        if (!($634)) {
         $$114$i = $$013$i;$$311$i = $$210$i;$$pre$phi184$iZ2D = $633;
         break;
        }
        do {
         if ($$lcssa159$i) {
          $635 = ((($z$6$i$lcssa)) + -4|0);
          $636 = HEAP32[$635>>2]|0;
          $637 = ($636|0)==(0);
          if ($637) {
           $j$2$i = 9;
           break;
          }
          $638 = (($636>>>0) % 10)&-1;
          $639 = ($638|0)==(0);
          if ($639) {
           $i$399$i = 10;$j$1100$i = 0;
          } else {
           $j$2$i = 0;
           break;
          }
          while(1) {
           $640 = ($i$399$i*10)|0;
           $641 = (($j$1100$i) + 1)|0;
           $642 = (($636>>>0) % ($640>>>0))&-1;
           $643 = ($642|0)==(0);
           if ($643) {
            $i$399$i = $640;$j$1100$i = $641;
           } else {
            $j$2$i = $641;
            break;
           }
          }
         } else {
          $j$2$i = 9;
         }
        } while(0);
        $644 = $$013$i | 32;
        $645 = ($644|0)==(102);
        $646 = $z$6$i$lcssa;
        $647 = (($646) - ($482))|0;
        $648 = $647 >> 2;
        $649 = ($648*9)|0;
        $650 = (($649) + -9)|0;
        if ($645) {
         $651 = (($650) - ($j$2$i))|0;
         $652 = ($651|0)<(0);
         $$21$i = $652 ? 0 : $651;
         $653 = ($$210$i|0)<($$21$i|0);
         $$210$$22$i = $653 ? $$210$i : $$21$i;
         $$114$i = $$013$i;$$311$i = $$210$$22$i;$$pre$phi184$iZ2D = 0;
         break;
        } else {
         $654 = (($650) + ($e$4$ph$i))|0;
         $655 = (($654) - ($j$2$i))|0;
         $656 = ($655|0)<(0);
         $$23$i = $656 ? 0 : $655;
         $657 = ($$210$i|0)<($$23$i|0);
         $$210$$24$i = $657 ? $$210$i : $$23$i;
         $$114$i = $$013$i;$$311$i = $$210$$24$i;$$pre$phi184$iZ2D = 0;
         break;
        }
       } else {
        $$pre183$i = $fl$1$ & 8;
        $$114$i = $t$0;$$311$i = $$p$i;$$pre$phi184$iZ2D = $$pre183$i;
       }
      } while(0);
      $658 = $$311$i | $$pre$phi184$iZ2D;
      $659 = ($658|0)!=(0);
      $660 = $659&1;
      $661 = $$114$i | 32;
      $662 = ($661|0)==(102);
      if ($662) {
       $663 = ($e$4$ph$i|0)>(0);
       $664 = $663 ? $e$4$ph$i : 0;
       $$pn$i = $664;$estr$2$i = 0;
      } else {
       $665 = ($e$4$ph$i|0)<(0);
       $666 = $665 ? $620 : $e$4$ph$i;
       $667 = ($666|0)<(0);
       $668 = $667 << 31 >> 31;
       $669 = (_fmt_u($666,$668,$5)|0);
       $670 = $669;
       $671 = (($8) - ($670))|0;
       $672 = ($671|0)<(2);
       if ($672) {
        $estr$193$i = $669;
        while(1) {
         $673 = ((($estr$193$i)) + -1|0);
         HEAP8[$673>>0] = 48;
         $674 = $673;
         $675 = (($8) - ($674))|0;
         $676 = ($675|0)<(2);
         if ($676) {
          $estr$193$i = $673;
         } else {
          $estr$1$lcssa$i = $673;
          break;
         }
        }
       } else {
        $estr$1$lcssa$i = $669;
       }
       $677 = $e$4$ph$i >> 31;
       $678 = $677 & 2;
       $679 = (($678) + 43)|0;
       $680 = $679&255;
       $681 = ((($estr$1$lcssa$i)) + -1|0);
       HEAP8[$681>>0] = $680;
       $682 = $$114$i&255;
       $683 = ((($estr$1$lcssa$i)) + -2|0);
       HEAP8[$683>>0] = $682;
       $684 = $683;
       $685 = (($8) - ($684))|0;
       $$pn$i = $685;$estr$2$i = $683;
      }
      $686 = (($pl$0$i) + 1)|0;
      $687 = (($686) + ($$311$i))|0;
      $l$1$i = (($687) + ($660))|0;
      $688 = (($l$1$i) + ($$pn$i))|0;
      _pad($f,32,$w$1,$688,$fl$1$);
      $689 = HEAP32[$f>>2]|0;
      $690 = $689 & 32;
      $691 = ($690|0)==(0);
      if ($691) {
       (___fwritex($prefix$0$i,$pl$0$i,$f)|0);
      }
      $692 = $fl$1$ ^ 65536;
      _pad($f,48,$w$1,$688,$692);
      do {
       if ($662) {
        $693 = ($a$8$ph$i>>>0)>($$31$i>>>0);
        $r$0$a$8$i = $693 ? $$31$i : $a$8$ph$i;
        $d$482$i = $r$0$a$8$i;
        while(1) {
         $694 = HEAP32[$d$482$i>>2]|0;
         $695 = (_fmt_u($694,0,$13)|0);
         $696 = ($d$482$i|0)==($r$0$a$8$i|0);
         do {
          if ($696) {
           $700 = ($695|0)==($13|0);
           if (!($700)) {
            $s7$1$i = $695;
            break;
           }
           HEAP8[$15>>0] = 48;
           $s7$1$i = $15;
          } else {
           $697 = ($695>>>0)>($buf$i>>>0);
           if ($697) {
            $s7$079$i = $695;
           } else {
            $s7$1$i = $695;
            break;
           }
           while(1) {
            $698 = ((($s7$079$i)) + -1|0);
            HEAP8[$698>>0] = 48;
            $699 = ($698>>>0)>($buf$i>>>0);
            if ($699) {
             $s7$079$i = $698;
            } else {
             $s7$1$i = $698;
             break;
            }
           }
          }
         } while(0);
         $701 = HEAP32[$f>>2]|0;
         $702 = $701 & 32;
         $703 = ($702|0)==(0);
         if ($703) {
          $704 = $s7$1$i;
          $705 = (($14) - ($704))|0;
          (___fwritex($s7$1$i,$705,$f)|0);
         }
         $706 = ((($d$482$i)) + 4|0);
         $707 = ($706>>>0)>($$31$i>>>0);
         if ($707) {
          $$lcssa339 = $706;
          break;
         } else {
          $d$482$i = $706;
         }
        }
        $708 = ($658|0)==(0);
        do {
         if (!($708)) {
          $709 = HEAP32[$f>>2]|0;
          $710 = $709 & 32;
          $711 = ($710|0)==(0);
          if (!($711)) {
           break;
          }
          (___fwritex(16304,1,$f)|0);
         }
        } while(0);
        $712 = ($$lcssa339>>>0)<($z$6$i$lcssa>>>0);
        $713 = ($$311$i|0)>(0);
        $714 = $713 & $712;
        if ($714) {
         $$41276$i = $$311$i;$d$575$i = $$lcssa339;
         while(1) {
          $715 = HEAP32[$d$575$i>>2]|0;
          $716 = (_fmt_u($715,0,$13)|0);
          $717 = ($716>>>0)>($buf$i>>>0);
          if ($717) {
           $s8$070$i = $716;
           while(1) {
            $718 = ((($s8$070$i)) + -1|0);
            HEAP8[$718>>0] = 48;
            $719 = ($718>>>0)>($buf$i>>>0);
            if ($719) {
             $s8$070$i = $718;
            } else {
             $s8$0$lcssa$i = $718;
             break;
            }
           }
          } else {
           $s8$0$lcssa$i = $716;
          }
          $720 = HEAP32[$f>>2]|0;
          $721 = $720 & 32;
          $722 = ($721|0)==(0);
          if ($722) {
           $723 = ($$41276$i|0)>(9);
           $724 = $723 ? 9 : $$41276$i;
           (___fwritex($s8$0$lcssa$i,$724,$f)|0);
          }
          $725 = ((($d$575$i)) + 4|0);
          $726 = (($$41276$i) + -9)|0;
          $727 = ($725>>>0)<($z$6$i$lcssa>>>0);
          $728 = ($$41276$i|0)>(9);
          $729 = $728 & $727;
          if ($729) {
           $$41276$i = $726;$d$575$i = $725;
          } else {
           $$412$lcssa$i = $726;
           break;
          }
         }
        } else {
         $$412$lcssa$i = $$311$i;
        }
        $730 = (($$412$lcssa$i) + 9)|0;
        _pad($f,48,$730,9,0);
       } else {
        $731 = ((($a$8$ph$i)) + 4|0);
        $z$6$$i = $$lcssa159$i ? $z$6$i$lcssa : $731;
        $732 = ($$311$i|0)>(-1);
        if ($732) {
         $733 = ($$pre$phi184$iZ2D|0)==(0);
         $$587$i = $$311$i;$d$686$i = $a$8$ph$i;
         while(1) {
          $734 = HEAP32[$d$686$i>>2]|0;
          $735 = (_fmt_u($734,0,$13)|0);
          $736 = ($735|0)==($13|0);
          if ($736) {
           HEAP8[$15>>0] = 48;
           $s9$0$i = $15;
          } else {
           $s9$0$i = $735;
          }
          $737 = ($d$686$i|0)==($a$8$ph$i|0);
          do {
           if ($737) {
            $741 = ((($s9$0$i)) + 1|0);
            $742 = HEAP32[$f>>2]|0;
            $743 = $742 & 32;
            $744 = ($743|0)==(0);
            if ($744) {
             (___fwritex($s9$0$i,1,$f)|0);
            }
            $745 = ($$587$i|0)<(1);
            $or$cond29$i = $733 & $745;
            if ($or$cond29$i) {
             $s9$2$i = $741;
             break;
            }
            $746 = HEAP32[$f>>2]|0;
            $747 = $746 & 32;
            $748 = ($747|0)==(0);
            if (!($748)) {
             $s9$2$i = $741;
             break;
            }
            (___fwritex(16304,1,$f)|0);
            $s9$2$i = $741;
           } else {
            $738 = ($s9$0$i>>>0)>($buf$i>>>0);
            if ($738) {
             $s9$183$i = $s9$0$i;
            } else {
             $s9$2$i = $s9$0$i;
             break;
            }
            while(1) {
             $739 = ((($s9$183$i)) + -1|0);
             HEAP8[$739>>0] = 48;
             $740 = ($739>>>0)>($buf$i>>>0);
             if ($740) {
              $s9$183$i = $739;
             } else {
              $s9$2$i = $739;
              break;
             }
            }
           }
          } while(0);
          $749 = $s9$2$i;
          $750 = (($14) - ($749))|0;
          $751 = HEAP32[$f>>2]|0;
          $752 = $751 & 32;
          $753 = ($752|0)==(0);
          if ($753) {
           $754 = ($$587$i|0)>($750|0);
           $755 = $754 ? $750 : $$587$i;
           (___fwritex($s9$2$i,$755,$f)|0);
          }
          $756 = (($$587$i) - ($750))|0;
          $757 = ((($d$686$i)) + 4|0);
          $758 = ($757>>>0)<($z$6$$i>>>0);
          $759 = ($756|0)>(-1);
          $760 = $758 & $759;
          if ($760) {
           $$587$i = $756;$d$686$i = $757;
          } else {
           $$5$lcssa$i = $756;
           break;
          }
         }
        } else {
         $$5$lcssa$i = $$311$i;
        }
        $761 = (($$5$lcssa$i) + 18)|0;
        _pad($f,48,$761,18,0);
        $762 = HEAP32[$f>>2]|0;
        $763 = $762 & 32;
        $764 = ($763|0)==(0);
        if (!($764)) {
         break;
        }
        $765 = $estr$2$i;
        $766 = (($8) - ($765))|0;
        (___fwritex($estr$2$i,$766,$f)|0);
       }
      } while(0);
      $767 = $fl$1$ ^ 8192;
      _pad($f,32,$w$1,$688,$767);
      $768 = ($688|0)<($w$1|0);
      $w$30$i = $768 ? $w$1 : $688;
      $$0$i = $w$30$i;
     } else {
      $376 = $t$0 & 32;
      $377 = ($376|0)!=(0);
      $378 = $377 ? 16288 : 16292;
      $379 = ($$07$i != $$07$i) | (0.0 != 0.0);
      $380 = $377 ? 16296 : 16300;
      $pl$1$i = $379 ? 0 : $pl$0$i;
      $s1$0$i = $379 ? $380 : $378;
      $381 = (($pl$1$i) + 3)|0;
      _pad($f,32,$w$1,$381,$175);
      $382 = HEAP32[$f>>2]|0;
      $383 = $382 & 32;
      $384 = ($383|0)==(0);
      if ($384) {
       (___fwritex($prefix$0$i,$pl$1$i,$f)|0);
       $$pre$i = HEAP32[$f>>2]|0;
       $386 = $$pre$i;
      } else {
       $386 = $382;
      }
      $385 = $386 & 32;
      $387 = ($385|0)==(0);
      if ($387) {
       (___fwritex($s1$0$i,3,$f)|0);
      }
      $388 = $fl$1$ ^ 8192;
      _pad($f,32,$w$1,$381,$388);
      $389 = ($381|0)<($w$1|0);
      $390 = $389 ? $w$1 : $381;
      $$0$i = $390;
     }
    } while(0);
    $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $$0$i;$l10n$0 = $l10n$3;
    continue L1;
    break;
   }
   default: {
    $a$2 = $fmt41;$fl$6 = $fl$1$;$p$5 = $p$0;$pl$2 = 0;$prefix$2 = 16252;$z$2 = $1;
   }
   }
  } while(0);
  L313: do {
   if ((label|0) == 64) {
    label = 0;
    $206 = $arg;
    $207 = $206;
    $208 = HEAP32[$207>>2]|0;
    $209 = (($206) + 4)|0;
    $210 = $209;
    $211 = HEAP32[$210>>2]|0;
    $212 = $t$1 & 32;
    $213 = ($208|0)==(0);
    $214 = ($211|0)==(0);
    $215 = $213 & $214;
    if ($215) {
     $a$0 = $1;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 0;$prefix$1 = 16252;
     label = 77;
    } else {
     $$012$i = $1;$217 = $208;$224 = $211;
     while(1) {
      $216 = $217 & 15;
      $218 = (16236 + ($216)|0);
      $219 = HEAP8[$218>>0]|0;
      $220 = $219&255;
      $221 = $220 | $212;
      $222 = $221&255;
      $223 = ((($$012$i)) + -1|0);
      HEAP8[$223>>0] = $222;
      $225 = (_bitshift64Lshr(($217|0),($224|0),4)|0);
      $226 = tempRet0;
      $227 = ($225|0)==(0);
      $228 = ($226|0)==(0);
      $229 = $227 & $228;
      if ($229) {
       $$lcssa344 = $223;
       break;
      } else {
       $$012$i = $223;$217 = $225;$224 = $226;
      }
     }
     $230 = $arg;
     $231 = $230;
     $232 = HEAP32[$231>>2]|0;
     $233 = (($230) + 4)|0;
     $234 = $233;
     $235 = HEAP32[$234>>2]|0;
     $236 = ($232|0)==(0);
     $237 = ($235|0)==(0);
     $238 = $236 & $237;
     $239 = $fl$3 & 8;
     $240 = ($239|0)==(0);
     $or$cond17 = $240 | $238;
     if ($or$cond17) {
      $a$0 = $$lcssa344;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 0;$prefix$1 = 16252;
      label = 77;
     } else {
      $241 = $t$1 >> 4;
      $242 = (16252 + ($241)|0);
      $a$0 = $$lcssa344;$fl$4 = $fl$3;$p$2 = $p$1;$pl$1 = 2;$prefix$1 = $242;
      label = 77;
     }
    }
   }
   else if ((label|0) == 76) {
    label = 0;
    $288 = (_fmt_u($286,$287,$1)|0);
    $a$0 = $288;$fl$4 = $fl$1$;$p$2 = $p$0;$pl$1 = $pl$0;$prefix$1 = $prefix$0;
    label = 77;
   }
   else if ((label|0) == 82) {
    label = 0;
    $320 = (_memchr($a$1,0,$p$0)|0);
    $321 = ($320|0)==(0|0);
    $322 = $320;
    $323 = $a$1;
    $324 = (($322) - ($323))|0;
    $325 = (($a$1) + ($p$0)|0);
    $z$1 = $321 ? $325 : $320;
    $p$3 = $321 ? $p$0 : $324;
    $a$2 = $a$1;$fl$6 = $175;$p$5 = $p$3;$pl$2 = 0;$prefix$2 = 16252;$z$2 = $z$1;
   }
   else if ((label|0) == 86) {
    label = 0;
    $333 = HEAP32[$arg>>2]|0;
    $i$0114 = 0;$l$1113 = 0;$ws$0115 = $333;
    while(1) {
     $334 = HEAP32[$ws$0115>>2]|0;
     $335 = ($334|0)==(0);
     if ($335) {
      $i$0$lcssa = $i$0114;$l$2 = $l$1113;
      break;
     }
     $336 = (_wctomb($mb,$334)|0);
     $337 = ($336|0)<(0);
     $338 = (($p$4198) - ($i$0114))|0;
     $339 = ($336>>>0)>($338>>>0);
     $or$cond20 = $337 | $339;
     if ($or$cond20) {
      $i$0$lcssa = $i$0114;$l$2 = $336;
      break;
     }
     $340 = ((($ws$0115)) + 4|0);
     $341 = (($336) + ($i$0114))|0;
     $342 = ($p$4198>>>0)>($341>>>0);
     if ($342) {
      $i$0114 = $341;$l$1113 = $336;$ws$0115 = $340;
     } else {
      $i$0$lcssa = $341;$l$2 = $336;
      break;
     }
    }
    $343 = ($l$2|0)<(0);
    if ($343) {
     $$0 = -1;
     break L1;
    }
    _pad($f,32,$w$1,$i$0$lcssa,$fl$1$);
    $344 = ($i$0$lcssa|0)==(0);
    if ($344) {
     $i$0$lcssa200 = 0;
     label = 98;
    } else {
     $345 = HEAP32[$arg>>2]|0;
     $i$1125 = 0;$ws$1126 = $345;
     while(1) {
      $346 = HEAP32[$ws$1126>>2]|0;
      $347 = ($346|0)==(0);
      if ($347) {
       $i$0$lcssa200 = $i$0$lcssa;
       label = 98;
       break L313;
      }
      $348 = ((($ws$1126)) + 4|0);
      $349 = (_wctomb($mb,$346)|0);
      $350 = (($349) + ($i$1125))|0;
      $351 = ($350|0)>($i$0$lcssa|0);
      if ($351) {
       $i$0$lcssa200 = $i$0$lcssa;
       label = 98;
       break L313;
      }
      $352 = HEAP32[$f>>2]|0;
      $353 = $352 & 32;
      $354 = ($353|0)==(0);
      if ($354) {
       (___fwritex($mb,$349,$f)|0);
      }
      $355 = ($350>>>0)<($i$0$lcssa>>>0);
      if ($355) {
       $i$1125 = $350;$ws$1126 = $348;
      } else {
       $i$0$lcssa200 = $i$0$lcssa;
       label = 98;
       break;
      }
     }
    }
   }
  } while(0);
  if ((label|0) == 98) {
   label = 0;
   $356 = $fl$1$ ^ 8192;
   _pad($f,32,$w$1,$i$0$lcssa200,$356);
   $357 = ($w$1|0)>($i$0$lcssa200|0);
   $358 = $357 ? $w$1 : $i$0$lcssa200;
   $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $358;$l10n$0 = $l10n$3;
   continue;
  }
  if ((label|0) == 77) {
   label = 0;
   $289 = ($p$2|0)>(-1);
   $290 = $fl$4 & -65537;
   $$fl$4 = $289 ? $290 : $fl$4;
   $291 = $arg;
   $292 = $291;
   $293 = HEAP32[$292>>2]|0;
   $294 = (($291) + 4)|0;
   $295 = $294;
   $296 = HEAP32[$295>>2]|0;
   $297 = ($293|0)!=(0);
   $298 = ($296|0)!=(0);
   $299 = $297 | $298;
   $300 = ($p$2|0)!=(0);
   $or$cond = $300 | $299;
   if ($or$cond) {
    $301 = $a$0;
    $302 = (($2) - ($301))|0;
    $303 = $299&1;
    $304 = $303 ^ 1;
    $305 = (($304) + ($302))|0;
    $306 = ($p$2|0)>($305|0);
    $p$2$ = $306 ? $p$2 : $305;
    $a$2 = $a$0;$fl$6 = $$fl$4;$p$5 = $p$2$;$pl$2 = $pl$1;$prefix$2 = $prefix$1;$z$2 = $1;
   } else {
    $a$2 = $1;$fl$6 = $$fl$4;$p$5 = 0;$pl$2 = $pl$1;$prefix$2 = $prefix$1;$z$2 = $1;
   }
  }
  $769 = $z$2;
  $770 = $a$2;
  $771 = (($769) - ($770))|0;
  $772 = ($p$5|0)<($771|0);
  $$p$5 = $772 ? $771 : $p$5;
  $773 = (($pl$2) + ($$p$5))|0;
  $774 = ($w$1|0)<($773|0);
  $w$2 = $774 ? $773 : $w$1;
  _pad($f,32,$w$2,$773,$fl$6);
  $775 = HEAP32[$f>>2]|0;
  $776 = $775 & 32;
  $777 = ($776|0)==(0);
  if ($777) {
   (___fwritex($prefix$2,$pl$2,$f)|0);
  }
  $778 = $fl$6 ^ 65536;
  _pad($f,48,$w$2,$773,$778);
  _pad($f,48,$$p$5,$771,0);
  $779 = HEAP32[$f>>2]|0;
  $780 = $779 & 32;
  $781 = ($780|0)==(0);
  if ($781) {
   (___fwritex($a$2,$771,$f)|0);
  }
  $782 = $fl$6 ^ 8192;
  _pad($f,32,$w$2,$773,$782);
  $cnt$0 = $cnt$1;$fmt41 = $$lcssa323;$l$0 = $w$2;$l10n$0 = $l10n$3;
 }
 L348: do {
  if ((label|0) == 245) {
   $783 = ($f|0)==(0|0);
   if ($783) {
    $784 = ($l10n$0$lcssa|0)==(0);
    if ($784) {
     $$0 = 0;
    } else {
     $i$2100 = 1;
     while(1) {
      $785 = (($nl_type) + ($i$2100<<2)|0);
      $786 = HEAP32[$785>>2]|0;
      $787 = ($786|0)==(0);
      if ($787) {
       $i$2100$lcssa = $i$2100;
       break;
      }
      $789 = (($nl_arg) + ($i$2100<<3)|0);
      _pop_arg($789,$786,$ap);
      $790 = (($i$2100) + 1)|0;
      $791 = ($790|0)<(10);
      if ($791) {
       $i$2100 = $790;
      } else {
       $$0 = 1;
       break L348;
      }
     }
     $788 = ($i$2100$lcssa|0)<(10);
     if ($788) {
      $i$398 = $i$2100$lcssa;
      while(1) {
       $794 = (($nl_type) + ($i$398<<2)|0);
       $795 = HEAP32[$794>>2]|0;
       $796 = ($795|0)==(0);
       $792 = (($i$398) + 1)|0;
       if (!($796)) {
        $$0 = -1;
        break L348;
       }
       $793 = ($792|0)<(10);
       if ($793) {
        $i$398 = $792;
       } else {
        $$0 = 1;
        break;
       }
      }
     } else {
      $$0 = 1;
     }
    }
   } else {
    $$0 = $cnt$1$lcssa;
   }
  }
 } while(0);
 STACKTOP = sp;return ($$0|0);
}
function _cleanup528($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($p)) + 68|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0);
 if ($2) {
  ___unlockfile($p);
 }
 return;
}
function _cleanup533($p) {
 $p = $p|0;
 var $0 = 0, $1 = 0, $2 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($p)) + 68|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ($1|0)==(0);
 if ($2) {
  ___unlockfile($p);
 }
 return;
}
function _sn_write($f,$s,$l) {
 $f = $f|0;
 $s = $s|0;
 $l = $l|0;
 var $0 = 0, $1 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $l$ = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ((($f)) + 16|0);
 $1 = HEAP32[$0>>2]|0;
 $2 = ((($f)) + 20|0);
 $3 = HEAP32[$2>>2]|0;
 $4 = $1;
 $5 = $3;
 $6 = (($4) - ($5))|0;
 $7 = ($6>>>0)>($l>>>0);
 $l$ = $7 ? $l : $6;
 _memcpy(($3|0),($s|0),($l$|0))|0;
 $8 = HEAP32[$2>>2]|0;
 $9 = (($8) + ($l$)|0);
 HEAP32[$2>>2] = $9;
 return ($l|0);
}
function _pop_arg($arg,$type,$ap) {
 $arg = $arg|0;
 $type = $type|0;
 $ap = $ap|0;
 var $$mask = 0, $$mask1 = 0, $0 = 0, $1 = 0, $10 = 0, $100 = 0, $101 = 0, $102 = 0, $103 = 0, $104 = 0, $105 = 0, $106 = 0.0, $107 = 0, $108 = 0, $109 = 0, $11 = 0, $110 = 0, $111 = 0, $112 = 0, $113 = 0.0;
 var $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0, $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0;
 var $30 = 0, $31 = 0, $32 = 0, $33 = 0, $34 = 0, $35 = 0, $36 = 0, $37 = 0, $38 = 0, $39 = 0, $4 = 0, $40 = 0, $41 = 0, $42 = 0, $43 = 0, $44 = 0, $45 = 0, $46 = 0, $47 = 0, $48 = 0;
 var $49 = 0, $5 = 0, $50 = 0, $51 = 0, $52 = 0, $53 = 0, $54 = 0, $55 = 0, $56 = 0, $57 = 0, $58 = 0, $59 = 0, $6 = 0, $60 = 0, $61 = 0, $62 = 0, $63 = 0, $64 = 0, $65 = 0, $66 = 0;
 var $67 = 0, $68 = 0, $69 = 0, $7 = 0, $70 = 0, $71 = 0, $72 = 0, $73 = 0, $74 = 0, $75 = 0, $76 = 0, $77 = 0, $78 = 0, $79 = 0, $8 = 0, $80 = 0, $81 = 0, $82 = 0, $83 = 0, $84 = 0;
 var $85 = 0, $86 = 0, $87 = 0, $88 = 0, $89 = 0, $9 = 0, $90 = 0, $91 = 0, $92 = 0, $93 = 0, $94 = 0, $95 = 0, $96 = 0, $97 = 0, $98 = 0, $99 = 0, $arglist_current = 0, $arglist_current11 = 0, $arglist_current14 = 0, $arglist_current17 = 0;
 var $arglist_current2 = 0, $arglist_current20 = 0, $arglist_current23 = 0, $arglist_current26 = 0, $arglist_current5 = 0, $arglist_current8 = 0, $arglist_next = 0, $arglist_next12 = 0, $arglist_next15 = 0, $arglist_next18 = 0, $arglist_next21 = 0, $arglist_next24 = 0, $arglist_next27 = 0, $arglist_next3 = 0, $arglist_next6 = 0, $arglist_next9 = 0, $expanded = 0, $expanded28 = 0, $expanded30 = 0, $expanded31 = 0;
 var $expanded32 = 0, $expanded34 = 0, $expanded35 = 0, $expanded37 = 0, $expanded38 = 0, $expanded39 = 0, $expanded41 = 0, $expanded42 = 0, $expanded44 = 0, $expanded45 = 0, $expanded46 = 0, $expanded48 = 0, $expanded49 = 0, $expanded51 = 0, $expanded52 = 0, $expanded53 = 0, $expanded55 = 0, $expanded56 = 0, $expanded58 = 0, $expanded59 = 0;
 var $expanded60 = 0, $expanded62 = 0, $expanded63 = 0, $expanded65 = 0, $expanded66 = 0, $expanded67 = 0, $expanded69 = 0, $expanded70 = 0, $expanded72 = 0, $expanded73 = 0, $expanded74 = 0, $expanded76 = 0, $expanded77 = 0, $expanded79 = 0, $expanded80 = 0, $expanded81 = 0, $expanded83 = 0, $expanded84 = 0, $expanded86 = 0, $expanded87 = 0;
 var $expanded88 = 0, $expanded90 = 0, $expanded91 = 0, $expanded93 = 0, $expanded94 = 0, $expanded95 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $0 = ($type>>>0)>(20);
 L1: do {
  if (!($0)) {
   do {
    switch ($type|0) {
    case 9:  {
     $arglist_current = HEAP32[$ap>>2]|0;
     $1 = $arglist_current;
     $2 = ((0) + 4|0);
     $expanded28 = $2;
     $expanded = (($expanded28) - 1)|0;
     $3 = (($1) + ($expanded))|0;
     $4 = ((0) + 4|0);
     $expanded32 = $4;
     $expanded31 = (($expanded32) - 1)|0;
     $expanded30 = $expanded31 ^ -1;
     $5 = $3 & $expanded30;
     $6 = $5;
     $7 = HEAP32[$6>>2]|0;
     $arglist_next = ((($6)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next;
     HEAP32[$arg>>2] = $7;
     break L1;
     break;
    }
    case 10:  {
     $arglist_current2 = HEAP32[$ap>>2]|0;
     $8 = $arglist_current2;
     $9 = ((0) + 4|0);
     $expanded35 = $9;
     $expanded34 = (($expanded35) - 1)|0;
     $10 = (($8) + ($expanded34))|0;
     $11 = ((0) + 4|0);
     $expanded39 = $11;
     $expanded38 = (($expanded39) - 1)|0;
     $expanded37 = $expanded38 ^ -1;
     $12 = $10 & $expanded37;
     $13 = $12;
     $14 = HEAP32[$13>>2]|0;
     $arglist_next3 = ((($13)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next3;
     $15 = ($14|0)<(0);
     $16 = $15 << 31 >> 31;
     $17 = $arg;
     $18 = $17;
     HEAP32[$18>>2] = $14;
     $19 = (($17) + 4)|0;
     $20 = $19;
     HEAP32[$20>>2] = $16;
     break L1;
     break;
    }
    case 11:  {
     $arglist_current5 = HEAP32[$ap>>2]|0;
     $21 = $arglist_current5;
     $22 = ((0) + 4|0);
     $expanded42 = $22;
     $expanded41 = (($expanded42) - 1)|0;
     $23 = (($21) + ($expanded41))|0;
     $24 = ((0) + 4|0);
     $expanded46 = $24;
     $expanded45 = (($expanded46) - 1)|0;
     $expanded44 = $expanded45 ^ -1;
     $25 = $23 & $expanded44;
     $26 = $25;
     $27 = HEAP32[$26>>2]|0;
     $arglist_next6 = ((($26)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next6;
     $28 = $arg;
     $29 = $28;
     HEAP32[$29>>2] = $27;
     $30 = (($28) + 4)|0;
     $31 = $30;
     HEAP32[$31>>2] = 0;
     break L1;
     break;
    }
    case 12:  {
     $arglist_current8 = HEAP32[$ap>>2]|0;
     $32 = $arglist_current8;
     $33 = ((0) + 8|0);
     $expanded49 = $33;
     $expanded48 = (($expanded49) - 1)|0;
     $34 = (($32) + ($expanded48))|0;
     $35 = ((0) + 8|0);
     $expanded53 = $35;
     $expanded52 = (($expanded53) - 1)|0;
     $expanded51 = $expanded52 ^ -1;
     $36 = $34 & $expanded51;
     $37 = $36;
     $38 = $37;
     $39 = $38;
     $40 = HEAP32[$39>>2]|0;
     $41 = (($38) + 4)|0;
     $42 = $41;
     $43 = HEAP32[$42>>2]|0;
     $arglist_next9 = ((($37)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next9;
     $44 = $arg;
     $45 = $44;
     HEAP32[$45>>2] = $40;
     $46 = (($44) + 4)|0;
     $47 = $46;
     HEAP32[$47>>2] = $43;
     break L1;
     break;
    }
    case 13:  {
     $arglist_current11 = HEAP32[$ap>>2]|0;
     $48 = $arglist_current11;
     $49 = ((0) + 4|0);
     $expanded56 = $49;
     $expanded55 = (($expanded56) - 1)|0;
     $50 = (($48) + ($expanded55))|0;
     $51 = ((0) + 4|0);
     $expanded60 = $51;
     $expanded59 = (($expanded60) - 1)|0;
     $expanded58 = $expanded59 ^ -1;
     $52 = $50 & $expanded58;
     $53 = $52;
     $54 = HEAP32[$53>>2]|0;
     $arglist_next12 = ((($53)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next12;
     $55 = $54&65535;
     $56 = $55 << 16 >> 16;
     $57 = ($56|0)<(0);
     $58 = $57 << 31 >> 31;
     $59 = $arg;
     $60 = $59;
     HEAP32[$60>>2] = $56;
     $61 = (($59) + 4)|0;
     $62 = $61;
     HEAP32[$62>>2] = $58;
     break L1;
     break;
    }
    case 14:  {
     $arglist_current14 = HEAP32[$ap>>2]|0;
     $63 = $arglist_current14;
     $64 = ((0) + 4|0);
     $expanded63 = $64;
     $expanded62 = (($expanded63) - 1)|0;
     $65 = (($63) + ($expanded62))|0;
     $66 = ((0) + 4|0);
     $expanded67 = $66;
     $expanded66 = (($expanded67) - 1)|0;
     $expanded65 = $expanded66 ^ -1;
     $67 = $65 & $expanded65;
     $68 = $67;
     $69 = HEAP32[$68>>2]|0;
     $arglist_next15 = ((($68)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next15;
     $$mask1 = $69 & 65535;
     $70 = $arg;
     $71 = $70;
     HEAP32[$71>>2] = $$mask1;
     $72 = (($70) + 4)|0;
     $73 = $72;
     HEAP32[$73>>2] = 0;
     break L1;
     break;
    }
    case 15:  {
     $arglist_current17 = HEAP32[$ap>>2]|0;
     $74 = $arglist_current17;
     $75 = ((0) + 4|0);
     $expanded70 = $75;
     $expanded69 = (($expanded70) - 1)|0;
     $76 = (($74) + ($expanded69))|0;
     $77 = ((0) + 4|0);
     $expanded74 = $77;
     $expanded73 = (($expanded74) - 1)|0;
     $expanded72 = $expanded73 ^ -1;
     $78 = $76 & $expanded72;
     $79 = $78;
     $80 = HEAP32[$79>>2]|0;
     $arglist_next18 = ((($79)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next18;
     $81 = $80&255;
     $82 = $81 << 24 >> 24;
     $83 = ($82|0)<(0);
     $84 = $83 << 31 >> 31;
     $85 = $arg;
     $86 = $85;
     HEAP32[$86>>2] = $82;
     $87 = (($85) + 4)|0;
     $88 = $87;
     HEAP32[$88>>2] = $84;
     break L1;
     break;
    }
    case 16:  {
     $arglist_current20 = HEAP32[$ap>>2]|0;
     $89 = $arglist_current20;
     $90 = ((0) + 4|0);
     $expanded77 = $90;
     $expanded76 = (($expanded77) - 1)|0;
     $91 = (($89) + ($expanded76))|0;
     $92 = ((0) + 4|0);
     $expanded81 = $92;
     $expanded80 = (($expanded81) - 1)|0;
     $expanded79 = $expanded80 ^ -1;
     $93 = $91 & $expanded79;
     $94 = $93;
     $95 = HEAP32[$94>>2]|0;
     $arglist_next21 = ((($94)) + 4|0);
     HEAP32[$ap>>2] = $arglist_next21;
     $$mask = $95 & 255;
     $96 = $arg;
     $97 = $96;
     HEAP32[$97>>2] = $$mask;
     $98 = (($96) + 4)|0;
     $99 = $98;
     HEAP32[$99>>2] = 0;
     break L1;
     break;
    }
    case 17:  {
     $arglist_current23 = HEAP32[$ap>>2]|0;
     $100 = $arglist_current23;
     $101 = ((0) + 8|0);
     $expanded84 = $101;
     $expanded83 = (($expanded84) - 1)|0;
     $102 = (($100) + ($expanded83))|0;
     $103 = ((0) + 8|0);
     $expanded88 = $103;
     $expanded87 = (($expanded88) - 1)|0;
     $expanded86 = $expanded87 ^ -1;
     $104 = $102 & $expanded86;
     $105 = $104;
     $106 = +HEAPF64[$105>>3];
     $arglist_next24 = ((($105)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next24;
     HEAPF64[$arg>>3] = $106;
     break L1;
     break;
    }
    case 18:  {
     $arglist_current26 = HEAP32[$ap>>2]|0;
     $107 = $arglist_current26;
     $108 = ((0) + 8|0);
     $expanded91 = $108;
     $expanded90 = (($expanded91) - 1)|0;
     $109 = (($107) + ($expanded90))|0;
     $110 = ((0) + 8|0);
     $expanded95 = $110;
     $expanded94 = (($expanded95) - 1)|0;
     $expanded93 = $expanded94 ^ -1;
     $111 = $109 & $expanded93;
     $112 = $111;
     $113 = +HEAPF64[$112>>3];
     $arglist_next27 = ((($112)) + 8|0);
     HEAP32[$ap>>2] = $arglist_next27;
     HEAPF64[$arg>>3] = $113;
     break L1;
     break;
    }
    default: {
     break L1;
    }
    }
   } while(0);
  }
 } while(0);
 return;
}
function _fmt_u($0,$1,$s) {
 $0 = $0|0;
 $1 = $1|0;
 $s = $s|0;
 var $$0$lcssa = 0, $$01$lcssa$off0 = 0, $$05 = 0, $$1$lcssa = 0, $$12 = 0, $$lcssa20 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $19 = 0, $2 = 0, $20 = 0, $21 = 0, $22 = 0;
 var $23 = 0, $24 = 0, $25 = 0, $26 = 0, $27 = 0, $28 = 0, $29 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0, $8 = 0, $9 = 0, $y$03 = 0, label = 0, sp = 0;
 sp = STACKTOP;
 $2 = ($1>>>0)>(0);
 $3 = ($0>>>0)>(4294967295);
 $4 = ($1|0)==(0);
 $5 = $4 & $3;
 $6 = $2 | $5;
 if ($6) {
  $$05 = $s;$7 = $0;$8 = $1;
  while(1) {
   $9 = (___uremdi3(($7|0),($8|0),10,0)|0);
   $10 = tempRet0;
   $11 = $9 | 48;
   $12 = $11&255;
   $13 = ((($$05)) + -1|0);
   HEAP8[$13>>0] = $12;
   $14 = (___udivdi3(($7|0),($8|0),10,0)|0);
   $15 = tempRet0;
   $16 = ($8>>>0)>(9);
   $17 = ($7>>>0)>(4294967295);
   $18 = ($8|0)==(9);
   $19 = $18 & $17;
   $20 = $16 | $19;
   if ($20) {
    $$05 = $13;$7 = $14;$8 = $15;
   } else {
    $$lcssa20 = $13;$28 = $14;$29 = $15;
    break;
   }
  }
  $$0$lcssa = $$lcssa20;$$01$lcssa$off0 = $28;
 } else {
  $$0$lcssa = $s;$$01$lcssa$off0 = $0;
 }
 $21 = ($$01$lcssa$off0|0)==(0);
 if ($21) {
  $$1$lcssa = $$0$lcssa;
 } else {
  $$12 = $$0$lcssa;$y$03 = $$01$lcssa$off0;
  while(1) {
   $22 = (($y$03>>>0) % 10)&-1;
   $23 = $22 | 48;
   $24 = $23&255;
   $25 = ((($$12)) + -1|0);
   HEAP8[$25>>0] = $24;
   $26 = (($y$03>>>0) / 10)&-1;
   $27 = ($y$03>>>0)<(10);
   if ($27) {
    $$1$lcssa = $25;
    break;
   } else {
    $$12 = $25;$y$03 = $26;
   }
  }
 }
 return ($$1$lcssa|0);
}
function _pad($f,$c,$w,$l,$fl) {
 $f = $f|0;
 $c = $c|0;
 $w = $w|0;
 $l = $l|0;
 $fl = $fl|0;
 var $$0$lcssa6 = 0, $$02 = 0, $$pre = 0, $0 = 0, $1 = 0, $10 = 0, $11 = 0, $12 = 0, $13 = 0, $14 = 0, $15 = 0, $16 = 0, $17 = 0, $18 = 0, $2 = 0, $3 = 0, $4 = 0, $5 = 0, $6 = 0, $7 = 0;
 var $8 = 0, $9 = 0, $or$cond = 0, $pad = 0, label = 0, sp = 0;
 sp = STACKTOP;
 STACKTOP = STACKTOP + 256|0; if ((STACKTOP|0) >= (STACK_MAX|0)) abort();
 $pad = sp;
 $0 = $fl & 73728;
 $1 = ($0|0)==(0);
 $2 = ($w|0)>($l|0);
 $or$cond = $2 & $1;
 do {
  if ($or$cond) {
   $3 = (($w) - ($l))|0;
   $4 = ($3>>>0)>(256);
   $5 = $4 ? 256 : $3;
   _memset(($pad|0),($c|0),($5|0))|0;
   $6 = ($3>>>0)>(255);
   $7 = HEAP32[$f>>2]|0;
   $8 = $7 & 32;
   $9 = ($8|0)==(0);
   if ($6) {
    $10 = (($w) - ($l))|0;
    $$02 = $3;$17 = $7;$18 = $9;
    while(1) {
     if ($18) {
      (___fwritex($pad,256,$f)|0);
      $$pre = HEAP32[$f>>2]|0;
      $14 = $$pre;
     } else {
      $14 = $17;
     }
     $11 = (($$02) + -256)|0;
     $12 = ($11>>>0)>(255);
     $13 = $14 & 32;
     $15 = ($13|0)==(0);
     if ($12) {
      $$02 = $11;$17 = $14;$18 = $15;
     } else {
      break;
     }
    }
    $16 = $10 & 255;
    if ($15) {
     $$0$lcssa6 = $16;
    } else {
     break;
    }
   } else {
    if ($9) {
     $$0$lcssa6 = $3;
    } else {
     break;
    }
   }
   (___fwritex($pad,$$0$lcssa6,$f)|0);
  }
 } while(0);
 STACKTOP = sp;return;
}
function runPostSets() {

}
function _i64Subtract(a, b, c, d) {
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a - c)>>>0;
    h = (b - d)>>>0;
    h = (b - d - (((c>>>0) > (a>>>0))|0))>>>0; // Borrow one from high word to low word on underflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memset(ptr, value, num) {
    ptr = ptr|0; value = value|0; num = num|0;
    var stop = 0, value4 = 0, stop4 = 0, unaligned = 0;
    stop = (ptr + num)|0;
    if ((num|0) >= 20) {
      // This is unaligned, but quite large, so work hard to get to aligned settings
      value = value & 0xff;
      unaligned = ptr & 3;
      value4 = value | (value << 8) | (value << 16) | (value << 24);
      stop4 = stop & ~3;
      if (unaligned) {
        unaligned = (ptr + 4 - unaligned)|0;
        while ((ptr|0) < (unaligned|0)) { // no need to check for stop, since we have large num
          HEAP8[((ptr)>>0)]=value;
          ptr = (ptr+1)|0;
        }
      }
      while ((ptr|0) < (stop4|0)) {
        HEAP32[((ptr)>>2)]=value4;
        ptr = (ptr+4)|0;
      }
    }
    while ((ptr|0) < (stop|0)) {
      HEAP8[((ptr)>>0)]=value;
      ptr = (ptr+1)|0;
    }
    return (ptr-num)|0;
}
function _bitshift64Shl(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = (high << bits) | ((low&(ander << (32 - bits))) >>> (32 - bits));
      return low << bits;
    }
    tempRet0 = low << (bits - 32);
    return 0;
}
function _i64Add(a, b, c, d) {
    /*
      x = a + b*2^32
      y = c + d*2^32
      result = l + h*2^32
    */
    a = a|0; b = b|0; c = c|0; d = d|0;
    var l = 0, h = 0;
    l = (a + c)>>>0;
    h = (b + d + (((l>>>0) < (a>>>0))|0))>>>0; // Add carry from low word to high word on overflow.
    return ((tempRet0 = h,l|0)|0);
}
function _memcpy(dest, src, num) {
    dest = dest|0; src = src|0; num = num|0;
    var ret = 0;
    if ((num|0) >= 4096) return _emscripten_memcpy_big(dest|0, src|0, num|0)|0;
    ret = dest|0;
    if ((dest&3) == (src&3)) {
      while (dest & 3) {
        if ((num|0) == 0) return ret|0;
        HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
        dest = (dest+1)|0;
        src = (src+1)|0;
        num = (num-1)|0;
      }
      while ((num|0) >= 4) {
        HEAP32[((dest)>>2)]=((HEAP32[((src)>>2)])|0);
        dest = (dest+4)|0;
        src = (src+4)|0;
        num = (num-4)|0;
      }
    }
    while ((num|0) > 0) {
      HEAP8[((dest)>>0)]=((HEAP8[((src)>>0)])|0);
      dest = (dest+1)|0;
      src = (src+1)|0;
      num = (num-1)|0;
    }
    return ret|0;
}
function _bitshift64Lshr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >>> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = 0;
    return (high >>> (bits - 32))|0;
}
function _bitshift64Ashr(low, high, bits) {
    low = low|0; high = high|0; bits = bits|0;
    var ander = 0;
    if ((bits|0) < 32) {
      ander = ((1 << bits) - 1)|0;
      tempRet0 = high >> bits;
      return (low >>> bits) | ((high&ander) << (32 - bits));
    }
    tempRet0 = (high|0) < 0 ? -1 : 0;
    return (high >> (bits - 32))|0;
  }
function _llvm_cttz_i32(x) {
    x = x|0;
    var ret = 0;
    ret = ((HEAP8[(((cttz_i8)+(x & 0xff))>>0)])|0);
    if ((ret|0) < 8) return ret|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 8)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 8)|0;
    ret = ((HEAP8[(((cttz_i8)+((x >> 16)&0xff))>>0)])|0);
    if ((ret|0) < 8) return (ret + 16)|0;
    return (((HEAP8[(((cttz_i8)+(x >>> 24))>>0)])|0) + 24)|0;
  }

// ======== compiled code from system/lib/compiler-rt , see readme therein
function ___muldsi3($a, $b) {
  $a = $a | 0;
  $b = $b | 0;
  var $1 = 0, $2 = 0, $3 = 0, $6 = 0, $8 = 0, $11 = 0, $12 = 0;
  $1 = $a & 65535;
  $2 = $b & 65535;
  $3 = Math_imul($2, $1) | 0;
  $6 = $a >>> 16;
  $8 = ($3 >>> 16) + (Math_imul($2, $6) | 0) | 0;
  $11 = $b >>> 16;
  $12 = Math_imul($11, $1) | 0;
  return (tempRet0 = (($8 >>> 16) + (Math_imul($11, $6) | 0) | 0) + ((($8 & 65535) + $12 | 0) >>> 16) | 0, 0 | ($8 + $12 << 16 | $3 & 65535)) | 0;
}
function ___divdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $7$0 = 0, $7$1 = 0, $8$0 = 0, $10$0 = 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  $7$0 = $2$0 ^ $1$0;
  $7$1 = $2$1 ^ $1$1;
  $8$0 = ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, 0) | 0;
  $10$0 = _i64Subtract($8$0 ^ $7$0, tempRet0 ^ $7$1, $7$0, $7$1) | 0;
  return $10$0 | 0;
}
function ___remdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, $1$0 = 0, $1$1 = 0, $2$0 = 0, $2$1 = 0, $4$0 = 0, $4$1 = 0, $6$0 = 0, $10$0 = 0, $10$1 = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  $1$0 = $a$1 >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $1$1 = (($a$1 | 0) < 0 ? -1 : 0) >> 31 | (($a$1 | 0) < 0 ? -1 : 0) << 1;
  $2$0 = $b$1 >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $2$1 = (($b$1 | 0) < 0 ? -1 : 0) >> 31 | (($b$1 | 0) < 0 ? -1 : 0) << 1;
  $4$0 = _i64Subtract($1$0 ^ $a$0, $1$1 ^ $a$1, $1$0, $1$1) | 0;
  $4$1 = tempRet0;
  $6$0 = _i64Subtract($2$0 ^ $b$0, $2$1 ^ $b$1, $2$0, $2$1) | 0;
  ___udivmoddi4($4$0, $4$1, $6$0, tempRet0, $rem) | 0;
  $10$0 = _i64Subtract(HEAP32[$rem >> 2] ^ $1$0, HEAP32[$rem + 4 >> 2] ^ $1$1, $1$0, $1$1) | 0;
  $10$1 = tempRet0;
  STACKTOP = __stackBase__;
  return (tempRet0 = $10$1, $10$0) | 0;
}
function ___muldi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $x_sroa_0_0_extract_trunc = 0, $y_sroa_0_0_extract_trunc = 0, $1$0 = 0, $1$1 = 0, $2 = 0;
  $x_sroa_0_0_extract_trunc = $a$0;
  $y_sroa_0_0_extract_trunc = $b$0;
  $1$0 = ___muldsi3($x_sroa_0_0_extract_trunc, $y_sroa_0_0_extract_trunc) | 0;
  $1$1 = tempRet0;
  $2 = Math_imul($a$1, $y_sroa_0_0_extract_trunc) | 0;
  return (tempRet0 = ((Math_imul($b$1, $x_sroa_0_0_extract_trunc) | 0) + $2 | 0) + $1$1 | $1$1 & 0, 0 | $1$0 & -1) | 0;
}
function ___udivdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $1$0 = 0;
  $1$0 = ___udivmoddi4($a$0, $a$1, $b$0, $b$1, 0) | 0;
  return $1$0 | 0;
}
function ___uremdi3($a$0, $a$1, $b$0, $b$1) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  var $rem = 0, __stackBase__ = 0;
  __stackBase__ = STACKTOP;
  STACKTOP = STACKTOP + 16 | 0;
  $rem = __stackBase__ | 0;
  ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) | 0;
  STACKTOP = __stackBase__;
  return (tempRet0 = HEAP32[$rem + 4 >> 2] | 0, HEAP32[$rem >> 2] | 0) | 0;
}
function ___udivmoddi4($a$0, $a$1, $b$0, $b$1, $rem) {
  $a$0 = $a$0 | 0;
  $a$1 = $a$1 | 0;
  $b$0 = $b$0 | 0;
  $b$1 = $b$1 | 0;
  $rem = $rem | 0;
  var $n_sroa_0_0_extract_trunc = 0, $n_sroa_1_4_extract_shift$0 = 0, $n_sroa_1_4_extract_trunc = 0, $d_sroa_0_0_extract_trunc = 0, $d_sroa_1_4_extract_shift$0 = 0, $d_sroa_1_4_extract_trunc = 0, $4 = 0, $17 = 0, $37 = 0, $49 = 0, $51 = 0, $57 = 0, $58 = 0, $66 = 0, $78 = 0, $86 = 0, $88 = 0, $89 = 0, $91 = 0, $92 = 0, $95 = 0, $105 = 0, $117 = 0, $119 = 0, $125 = 0, $126 = 0, $130 = 0, $q_sroa_1_1_ph = 0, $q_sroa_0_1_ph = 0, $r_sroa_1_1_ph = 0, $r_sroa_0_1_ph = 0, $sr_1_ph = 0, $d_sroa_0_0_insert_insert99$0 = 0, $d_sroa_0_0_insert_insert99$1 = 0, $137$0 = 0, $137$1 = 0, $carry_0203 = 0, $sr_1202 = 0, $r_sroa_0_1201 = 0, $r_sroa_1_1200 = 0, $q_sroa_0_1199 = 0, $q_sroa_1_1198 = 0, $147 = 0, $149 = 0, $r_sroa_0_0_insert_insert42$0 = 0, $r_sroa_0_0_insert_insert42$1 = 0, $150$1 = 0, $151$0 = 0, $152 = 0, $154$0 = 0, $r_sroa_0_0_extract_trunc = 0, $r_sroa_1_4_extract_trunc = 0, $155 = 0, $carry_0_lcssa$0 = 0, $carry_0_lcssa$1 = 0, $r_sroa_0_1_lcssa = 0, $r_sroa_1_1_lcssa = 0, $q_sroa_0_1_lcssa = 0, $q_sroa_1_1_lcssa = 0, $q_sroa_0_0_insert_ext75$0 = 0, $q_sroa_0_0_insert_ext75$1 = 0, $q_sroa_0_0_insert_insert77$1 = 0, $_0$0 = 0, $_0$1 = 0;
  $n_sroa_0_0_extract_trunc = $a$0;
  $n_sroa_1_4_extract_shift$0 = $a$1;
  $n_sroa_1_4_extract_trunc = $n_sroa_1_4_extract_shift$0;
  $d_sroa_0_0_extract_trunc = $b$0;
  $d_sroa_1_4_extract_shift$0 = $b$1;
  $d_sroa_1_4_extract_trunc = $d_sroa_1_4_extract_shift$0;
  if (($n_sroa_1_4_extract_trunc | 0) == 0) {
    $4 = ($rem | 0) != 0;
    if (($d_sroa_1_4_extract_trunc | 0) == 0) {
      if ($4) {
        HEAP32[$rem >> 2] = ($n_sroa_0_0_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
        HEAP32[$rem + 4 >> 2] = 0;
      }
      $_0$1 = 0;
      $_0$0 = ($n_sroa_0_0_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$4) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    }
  }
  $17 = ($d_sroa_1_4_extract_trunc | 0) == 0;
  do {
    if (($d_sroa_0_0_extract_trunc | 0) == 0) {
      if ($17) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_0_0_extract_trunc >>> 0);
          HEAP32[$rem + 4 >> 2] = 0;
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_0_0_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      if (($n_sroa_0_0_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0;
          HEAP32[$rem + 4 >> 2] = ($n_sroa_1_4_extract_trunc >>> 0) % ($d_sroa_1_4_extract_trunc >>> 0);
        }
        $_0$1 = 0;
        $_0$0 = ($n_sroa_1_4_extract_trunc >>> 0) / ($d_sroa_1_4_extract_trunc >>> 0) >>> 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $37 = $d_sroa_1_4_extract_trunc - 1 | 0;
      if (($37 & $d_sroa_1_4_extract_trunc | 0) == 0) {
        if (($rem | 0) != 0) {
          HEAP32[$rem >> 2] = 0 | $a$0 & -1;
          HEAP32[$rem + 4 >> 2] = $37 & $n_sroa_1_4_extract_trunc | $a$1 & 0;
        }
        $_0$1 = 0;
        $_0$0 = $n_sroa_1_4_extract_trunc >>> ((_llvm_cttz_i32($d_sroa_1_4_extract_trunc | 0) | 0) >>> 0);
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $49 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
      $51 = $49 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
      if ($51 >>> 0 <= 30) {
        $57 = $51 + 1 | 0;
        $58 = 31 - $51 | 0;
        $sr_1_ph = $57;
        $r_sroa_0_1_ph = $n_sroa_1_4_extract_trunc << $58 | $n_sroa_0_0_extract_trunc >>> ($57 >>> 0);
        $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($57 >>> 0);
        $q_sroa_0_1_ph = 0;
        $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $58;
        break;
      }
      if (($rem | 0) == 0) {
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      HEAP32[$rem >> 2] = 0 | $a$0 & -1;
      HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
      $_0$1 = 0;
      $_0$0 = 0;
      return (tempRet0 = $_0$1, $_0$0) | 0;
    } else {
      if (!$17) {
        $117 = Math_clz32($d_sroa_1_4_extract_trunc | 0) | 0;
        $119 = $117 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        if ($119 >>> 0 <= 31) {
          $125 = $119 + 1 | 0;
          $126 = 31 - $119 | 0;
          $130 = $119 - 31 >> 31;
          $sr_1_ph = $125;
          $r_sroa_0_1_ph = $n_sroa_0_0_extract_trunc >>> ($125 >>> 0) & $130 | $n_sroa_1_4_extract_trunc << $126;
          $r_sroa_1_1_ph = $n_sroa_1_4_extract_trunc >>> ($125 >>> 0) & $130;
          $q_sroa_0_1_ph = 0;
          $q_sroa_1_1_ph = $n_sroa_0_0_extract_trunc << $126;
          break;
        }
        if (($rem | 0) == 0) {
          $_0$1 = 0;
          $_0$0 = 0;
          return (tempRet0 = $_0$1, $_0$0) | 0;
        }
        HEAP32[$rem >> 2] = 0 | $a$0 & -1;
        HEAP32[$rem + 4 >> 2] = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$1 = 0;
        $_0$0 = 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
      $66 = $d_sroa_0_0_extract_trunc - 1 | 0;
      if (($66 & $d_sroa_0_0_extract_trunc | 0) != 0) {
        $86 = (Math_clz32($d_sroa_0_0_extract_trunc | 0) | 0) + 33 | 0;
        $88 = $86 - (Math_clz32($n_sroa_1_4_extract_trunc | 0) | 0) | 0;
        $89 = 64 - $88 | 0;
        $91 = 32 - $88 | 0;
        $92 = $91 >> 31;
        $95 = $88 - 32 | 0;
        $105 = $95 >> 31;
        $sr_1_ph = $88;
        $r_sroa_0_1_ph = $91 - 1 >> 31 & $n_sroa_1_4_extract_trunc >>> ($95 >>> 0) | ($n_sroa_1_4_extract_trunc << $91 | $n_sroa_0_0_extract_trunc >>> ($88 >>> 0)) & $105;
        $r_sroa_1_1_ph = $105 & $n_sroa_1_4_extract_trunc >>> ($88 >>> 0);
        $q_sroa_0_1_ph = $n_sroa_0_0_extract_trunc << $89 & $92;
        $q_sroa_1_1_ph = ($n_sroa_1_4_extract_trunc << $89 | $n_sroa_0_0_extract_trunc >>> ($95 >>> 0)) & $92 | $n_sroa_0_0_extract_trunc << $91 & $88 - 33 >> 31;
        break;
      }
      if (($rem | 0) != 0) {
        HEAP32[$rem >> 2] = $66 & $n_sroa_0_0_extract_trunc;
        HEAP32[$rem + 4 >> 2] = 0;
      }
      if (($d_sroa_0_0_extract_trunc | 0) == 1) {
        $_0$1 = $n_sroa_1_4_extract_shift$0 | $a$1 & 0;
        $_0$0 = 0 | $a$0 & -1;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      } else {
        $78 = _llvm_cttz_i32($d_sroa_0_0_extract_trunc | 0) | 0;
        $_0$1 = 0 | $n_sroa_1_4_extract_trunc >>> ($78 >>> 0);
        $_0$0 = $n_sroa_1_4_extract_trunc << 32 - $78 | $n_sroa_0_0_extract_trunc >>> ($78 >>> 0) | 0;
        return (tempRet0 = $_0$1, $_0$0) | 0;
      }
    }
  } while (0);
  if (($sr_1_ph | 0) == 0) {
    $q_sroa_1_1_lcssa = $q_sroa_1_1_ph;
    $q_sroa_0_1_lcssa = $q_sroa_0_1_ph;
    $r_sroa_1_1_lcssa = $r_sroa_1_1_ph;
    $r_sroa_0_1_lcssa = $r_sroa_0_1_ph;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = 0;
  } else {
    $d_sroa_0_0_insert_insert99$0 = 0 | $b$0 & -1;
    $d_sroa_0_0_insert_insert99$1 = $d_sroa_1_4_extract_shift$0 | $b$1 & 0;
    $137$0 = _i64Add($d_sroa_0_0_insert_insert99$0 | 0, $d_sroa_0_0_insert_insert99$1 | 0, -1, -1) | 0;
    $137$1 = tempRet0;
    $q_sroa_1_1198 = $q_sroa_1_1_ph;
    $q_sroa_0_1199 = $q_sroa_0_1_ph;
    $r_sroa_1_1200 = $r_sroa_1_1_ph;
    $r_sroa_0_1201 = $r_sroa_0_1_ph;
    $sr_1202 = $sr_1_ph;
    $carry_0203 = 0;
    while (1) {
      $147 = $q_sroa_0_1199 >>> 31 | $q_sroa_1_1198 << 1;
      $149 = $carry_0203 | $q_sroa_0_1199 << 1;
      $r_sroa_0_0_insert_insert42$0 = 0 | ($r_sroa_0_1201 << 1 | $q_sroa_1_1198 >>> 31);
      $r_sroa_0_0_insert_insert42$1 = $r_sroa_0_1201 >>> 31 | $r_sroa_1_1200 << 1 | 0;
      _i64Subtract($137$0, $137$1, $r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1) | 0;
      $150$1 = tempRet0;
      $151$0 = $150$1 >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1;
      $152 = $151$0 & 1;
      $154$0 = _i64Subtract($r_sroa_0_0_insert_insert42$0, $r_sroa_0_0_insert_insert42$1, $151$0 & $d_sroa_0_0_insert_insert99$0, ((($150$1 | 0) < 0 ? -1 : 0) >> 31 | (($150$1 | 0) < 0 ? -1 : 0) << 1) & $d_sroa_0_0_insert_insert99$1) | 0;
      $r_sroa_0_0_extract_trunc = $154$0;
      $r_sroa_1_4_extract_trunc = tempRet0;
      $155 = $sr_1202 - 1 | 0;
      if (($155 | 0) == 0) {
        break;
      } else {
        $q_sroa_1_1198 = $147;
        $q_sroa_0_1199 = $149;
        $r_sroa_1_1200 = $r_sroa_1_4_extract_trunc;
        $r_sroa_0_1201 = $r_sroa_0_0_extract_trunc;
        $sr_1202 = $155;
        $carry_0203 = $152;
      }
    }
    $q_sroa_1_1_lcssa = $147;
    $q_sroa_0_1_lcssa = $149;
    $r_sroa_1_1_lcssa = $r_sroa_1_4_extract_trunc;
    $r_sroa_0_1_lcssa = $r_sroa_0_0_extract_trunc;
    $carry_0_lcssa$1 = 0;
    $carry_0_lcssa$0 = $152;
  }
  $q_sroa_0_0_insert_ext75$0 = $q_sroa_0_1_lcssa;
  $q_sroa_0_0_insert_ext75$1 = 0;
  $q_sroa_0_0_insert_insert77$1 = $q_sroa_1_1_lcssa | $q_sroa_0_0_insert_ext75$1;
  if (($rem | 0) != 0) {
    HEAP32[$rem >> 2] = 0 | $r_sroa_0_1_lcssa;
    HEAP32[$rem + 4 >> 2] = $r_sroa_1_1_lcssa | 0;
  }
  $_0$1 = (0 | $q_sroa_0_0_insert_ext75$0) >>> 31 | $q_sroa_0_0_insert_insert77$1 << 1 | ($q_sroa_0_0_insert_ext75$1 << 1 | $q_sroa_0_0_insert_ext75$0 >>> 31) & 0 | $carry_0_lcssa$1;
  $_0$0 = ($q_sroa_0_0_insert_ext75$0 << 1 | 0 >>> 31) & -2 | $carry_0_lcssa$0;
  return (tempRet0 = $_0$1, $_0$0) | 0;
}
// =======================================================================



  
function dynCall_i(index) {
  index = index|0;
  
  return FUNCTION_TABLE_i[index&15]()|0;
}


function dynCall_ii(index,a1) {
  index = index|0;
  a1=a1|0;
  return FUNCTION_TABLE_ii[index&3](a1|0)|0;
}


function dynCall_iiii(index,a1,a2,a3) {
  index = index|0;
  a1=a1|0; a2=a2|0; a3=a3|0;
  return FUNCTION_TABLE_iiii[index&7](a1|0,a2|0,a3|0)|0;
}


function dynCall_vi(index,a1) {
  index = index|0;
  a1=a1|0;
  FUNCTION_TABLE_vi[index&15](a1|0);
}

function b0() { ; nullFunc_i(0);return 0; }
function b1(p0) { p0 = p0|0; nullFunc_ii(1);return 0; }
function b2(p0,p1,p2) { p0 = p0|0;p1 = p1|0;p2 = p2|0; nullFunc_iiii(2);return 0; }
function b3(p0) { p0 = p0|0; nullFunc_vi(3); }

// EMSCRIPTEN_END_FUNCS
var FUNCTION_TABLE_i = [b0,b0,b0,b0,b0,b0,b0,b0,b0,_prog_char,b0,_input_char,b0,b0,b0,b0];
var FUNCTION_TABLE_ii = [b1,b1,___stdio_close,b1];
var FUNCTION_TABLE_iiii = [b2,_sn_write,b2,___stdio_write,___stdio_seek,___stdio_read,___stdout_write,b2];
var FUNCTION_TABLE_vi = [b3,b3,b3,b3,b3,b3,b3,_use_quit,_stop_execution,b3,_out_char,b3,_cleanup528,_cleanup533,b3,b3];

  return { _i64Subtract: _i64Subtract, _fflush: _fflush, _main: _main, _i64Add: _i64Add, _memset: _memset, _malloc: _malloc, _memcpy: _memcpy, _bitshift64Lshr: _bitshift64Lshr, _free: _free, ___errno_location: ___errno_location, _bitshift64Shl: _bitshift64Shl, runPostSets: runPostSets, stackAlloc: stackAlloc, stackSave: stackSave, stackRestore: stackRestore, establishStackSpace: establishStackSpace, setThrew: setThrew, setTempRet0: setTempRet0, getTempRet0: getTempRet0, dynCall_i: dynCall_i, dynCall_ii: dynCall_ii, dynCall_iiii: dynCall_iiii, dynCall_vi: dynCall_vi };
})
// EMSCRIPTEN_END_ASM
(Module.asmGlobalArg, Module.asmLibraryArg, buffer);
var real__i64Subtract = asm["_i64Subtract"]; asm["_i64Subtract"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Subtract.apply(null, arguments);
};

var real__fflush = asm["_fflush"]; asm["_fflush"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__fflush.apply(null, arguments);
};

var real__main = asm["_main"]; asm["_main"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__main.apply(null, arguments);
};

var real__i64Add = asm["_i64Add"]; asm["_i64Add"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__i64Add.apply(null, arguments);
};

var real__malloc = asm["_malloc"]; asm["_malloc"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__malloc.apply(null, arguments);
};

var real__bitshift64Lshr = asm["_bitshift64Lshr"]; asm["_bitshift64Lshr"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Lshr.apply(null, arguments);
};

var real__free = asm["_free"]; asm["_free"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__free.apply(null, arguments);
};

var real____errno_location = asm["___errno_location"]; asm["___errno_location"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real____errno_location.apply(null, arguments);
};

var real__bitshift64Shl = asm["_bitshift64Shl"]; asm["_bitshift64Shl"] = function() {
assert(runtimeInitialized, 'you need to wait for the runtime to be ready (e.g. wait for main() to be called)');
assert(!runtimeExited, 'the runtime was exited (use NO_EXIT_RUNTIME to keep it alive after main() exits)');
return real__bitshift64Shl.apply(null, arguments);
};
var _i64Subtract = Module["_i64Subtract"] = asm["_i64Subtract"];
var _fflush = Module["_fflush"] = asm["_fflush"];
var _main = Module["_main"] = asm["_main"];
var _i64Add = Module["_i64Add"] = asm["_i64Add"];
var _memset = Module["_memset"] = asm["_memset"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _bitshift64Lshr = Module["_bitshift64Lshr"] = asm["_bitshift64Lshr"];
var _free = Module["_free"] = asm["_free"];
var ___errno_location = Module["___errno_location"] = asm["___errno_location"];
var _bitshift64Shl = Module["_bitshift64Shl"] = asm["_bitshift64Shl"];
var dynCall_i = Module["dynCall_i"] = asm["dynCall_i"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_iiii = Module["dynCall_iiii"] = asm["dynCall_iiii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
;

Runtime.stackAlloc = asm['stackAlloc'];
Runtime.stackSave = asm['stackSave'];
Runtime.stackRestore = asm['stackRestore'];
Runtime.establishStackSpace = asm['establishStackSpace'];

Runtime.setTempRet0 = asm['setTempRet0'];
Runtime.getTempRet0 = asm['getTempRet0'];



// === Auto-generated postamble setup entry stuff ===


function ExitStatus(status) {
  this.name = "ExitStatus";
  this.message = "Program terminated with exit(" + status + ")";
  this.status = status;
};
ExitStatus.prototype = new Error();
ExitStatus.prototype.constructor = ExitStatus;

var initialStackTop;
var preloadStartTime = null;
var calledMain = false;

dependenciesFulfilled = function runCaller() {
  // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
  if (!Module['calledRun']) run();
  if (!Module['calledRun']) dependenciesFulfilled = runCaller; // try this again later, after new deps are fulfilled
}

Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');

  args = args || [];

  ensureInitRuntime();

  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString(Module['thisProgram']), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);

  initialStackTop = Runtime.stackSave();

  try {

    var ret = Module['_main'](argc, argv, 0);


    // if we're not running an evented main loop, it's time to exit
    exit(ret, /* implicit = */ true);
  }
  catch(e) {
    if (e instanceof ExitStatus) {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      return;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
      Runtime.stackRestore(initialStackTop);
      return;
    } else {
      if (e && typeof e === 'object' && e.stack) Module.printErr('exception thrown: ' + [e, e.stack]);
      throw e;
    }
  } finally {
    calledMain = true;
  }
}




function run(args) {
  args = args || Module['arguments'];

  if (preloadStartTime === null) preloadStartTime = Date.now();

  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }

  preRun();

  if (runDependencies > 0) return; // a preRun added a dependency, run will be called later
  if (Module['calledRun']) return; // run may have just been called through dependencies being fulfilled just in this very frame

  function doRun() {
    if (Module['calledRun']) return; // run may have just been called while the async setStatus time below was happening
    Module['calledRun'] = true;

    if (ABORT) return; 

    ensureInitRuntime();

    preMain();

    if (ENVIRONMENT_IS_WEB && preloadStartTime !== null) {
      Module.printErr('pre-main prep time: ' + (Date.now() - preloadStartTime) + ' ms');
    }

    if (Module['onRuntimeInitialized']) Module['onRuntimeInitialized']();

    if (Module['_main'] && shouldRunNow) Module['callMain'](args);

    postRun();
  }

  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;

function exit(status, implicit) {
  if (implicit && Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') implicitly called by end of main(), but noExitRuntime, so not exiting the runtime (you can use emscripten_force_exit, if you want to force a true shutdown)');
    return;
  }

  if (Module['noExitRuntime']) {
    Module.printErr('exit(' + status + ') called, but noExitRuntime, so halting execution but not exiting the runtime or preventing further async execution (you can use emscripten_force_exit, if you want to force a true shutdown)');
  } else {

    ABORT = true;
    EXITSTATUS = status;
    STACKTOP = initialStackTop;

    exitRuntime();

    if (Module['onExit']) Module['onExit'](status);
  }

  if (ENVIRONMENT_IS_NODE) {
    // Work around a node.js bug where stdout buffer is not flushed at process exit:
    // Instead of process.exit() directly, wait for stdout flush event.
    // See https://github.com/joyent/node/issues/1669 and https://github.com/kripken/emscripten/issues/2582
    // Workaround is based on https://github.com/RReverser/acorn/commit/50ab143cecc9ed71a2d66f78b4aec3bb2e9844f6
    process['stdout']['once']('drain', function () {
      process['exit'](status);
    });
    console.log(' '); // Make sure to print something to force the drain event to occur, in case the stdout buffer was empty.
    // Work around another node bug where sometimes 'drain' is never fired - make another effort
    // to emit the exit status, after a significant delay (if node hasn't fired drain by then, give up)
    setTimeout(function() {
      process['exit'](status);
    }, 500);
  } else
  if (ENVIRONMENT_IS_SHELL && typeof quit === 'function') {
    quit(status);
  }
  // if we reach here, we must throw an exception to halt the current execution
  throw new ExitStatus(status);
}
Module['exit'] = Module.exit = exit;

var abortDecorators = [];

function abort(what) {
  if (what !== undefined) {
    Module.print(what);
    Module.printErr(what);
    what = JSON.stringify(what)
  } else {
    what = '';
  }

  ABORT = true;
  EXITSTATUS = 1;

  var extra = '';

  var output = 'abort(' + what + ') at ' + stackTrace() + extra;
  if (abortDecorators) {
    abortDecorators.forEach(function(decorator) {
      output = decorator(output, what);
    });
  }
  throw output;
}
Module['abort'] = Module.abort = abort;

// {{PRE_RUN_ADDITIONS}}

if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}

// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}


run();

// {{POST_RUN_ADDITIONS}}






// {{MODULE_ADDITIONS}}



