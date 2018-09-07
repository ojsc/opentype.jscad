(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.mainframe_spore_ttf_data = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],2:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":1,"ieee754":3}],3:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],4:[function(require,module,exports){
(function (Buffer){

//var font = fs.readFileSync(__dirname + );
var font = Buffer("AAEAAAATAQAABAAwR1BPU6n3sJUAAN+IAAAKukxUU0i7I7NkAAAHoAAAAWZPUy8ylQseHAAAAbgAAABgVkRNWG+1d0cAAAkIAAAF4GNtYXDnijYsAAAu7AAABC5jdnQgABQAAAAANJQAAAACZnBnbQZZnDcAADMcAAABc2dhc3AAFwAJAADfeAAAABBnbHlmA5pjmwAANJgAAJokaGRteKxKGpoAAA7oAAAgBGhlYWT3cUkjAAABPAAAADZoaGVhB5sECgAAAXQAAAAkaG10eO+wRw4AAAIYAAAFiGtlcm4TUBE5AADRhAAAAZhsb2NhkwdsjAAAzrwAAALGbWF4cAN6Az4AAAGYAAAAIG5hbWWlORiZAADTHAAABW1wb3N0WOsAAQAA2IwAAAbpcHJlcLgAACsAADSQAAAABAABAAAAAQAAmRcdDF8PPPUAGQPoAAAAAL7qKfAAAAAA1XHbsv///wYD6QOVAAAACQACAAAAAAAAAAEAAAOV/zYAGwQl////TAPpAAEAAAAAAAAAAAAAAAAAAAFiAAEAAAFiAKAABwCTAAQAAQAAAAAACgAAAgACCQACAAEAAwIhA4QABQAAAGQAZAAAAIwAZABkAAAAjAAyAPoAAAQDCAUGCwIACgSgAAAvEAAASgAAAAAAAAAAZGlzYQBAACD2wwK8/zgANgOVAMoAAAADAAAAAAK8ArwAAAAgAAICjwA8AAAAAAH0AAABLAAAAZIAMgJsAFoCLgBQAuQAMgM0AHgA8gA8AcEAKAHBADICVAA8AkgAPAFVAEQBlAA8ATYAUAH+AEsCWAA8AaQAPAJIADwCQQA8AmIAMgJEADwCYgA8AhIAFAKoADwCTgA8ASIAUAFFAEQCLQAeAj4APAIpADICUgBLAwcARgJlADICWAA8AeAAHgIrADwCBAAjAeoAMgIwAB4CbAA8ARgAPAH1AB4CYgA8AdsAMgKtADwCewA8Ak8AHgIiADwCTwAeAk8APAImACgB8AAeAkkAPAJpADIDGgAyAj0AMgIwACgB6wAoATYAPAImAEsBNgAyAg4ARgJSAEYB9ACTAmUAMgJYADwB4AAeAisAPAIEACMB6gAyAjAAHgJsADwBGAA8AfUAHgJiADwB2wAyAq0APAJ7ADwCTwAeAiIAPAJPAB4CTwA8AiYAKAHwAB4CSQA8AmkAMgMaADICPQAyAjAAKAHrACgBtQBGAQQAUAG1ADwCCwA8ASwAAAE2AFACMgBQAlgAKAJmADwClABQAQQAUAH0AH8BjABGAvEAPAI6ADwB9ABQAXIARgJcAEYBbwBGAWsARgH0AN8CagBGAkAAMgEiAEYB9ADCAPAAPAGBADsC8QBGAsEAUALBAFACwQBLAlIASwJlADICZQAyAmUAMgJlADICZQAyAmUAMgOQADIB4AAeAgQAIwIEACMCBAAjAgQAIwEYABYBEgA8ARgACQEYABQCKwAKAnsAPAJPAB4CTwAeAk8AHgJPAB4CTwAeAigAUAJPAB4CSQA8AkkAPAJJADwCSQA8AhwAHwI0ADwCYgA8AmUAMgJlADICZQAyAmUAMgJlADICZQAyA5AAMgHgAB4CBAAjAgQAIwIEACMCBAAjARgAFgESADwBGAAJARgAFAIrAAoCewA8Ak8AHgJPAB4CTwAeAk8AHgJPAB4CPgA8Ak8AHgJJADwCSQA8AkkAPAJJADwCHAAfAjQAPAIwACgCZQAyAmUAMgJlADICZQAyAmUAMgJlADIB4AAeAeAAHgHgAB4B4AAeAeAAHgHgAB4B4AAeAeAAHgIhADMCIQAzAisACgIrAAoCBAAjAgQAIwIEACMCBAAjAgQAIwIEACMCBAAjAgQAIwIEACMCBAAjAjAAHgIwAB4CMAAeAjAAHgIwAB4CMAAeAjAAHgIwAB4CbAA8AmwAPAJsAAgCbAAIARgACQEYAAkBGAAXARgAFwEYABQBGAAUARgAPAEYADwB9QAeAfUAHgJiADwCYgA8AdsAMgHbADIB2wAyAdsAMgHbADIB2wAyAdsAMgHbADIB2wAAAdsAAAJ7ADwCewA8AnsAPAJ7ADwCewA8AnsAPAJ7ADwCTwAeAk8AHgJPAB4CTwAeAk8AHgJPAB4DqAAeA6gAHgJPADwCTwA8Ak8APAJPADwCTwA8Ak8APAImACgCJgAoAiYAKAImACgCJgAoAiYAKAImACgCJgAoAfAAHgHwAB4B8AAeAfAAHgHwAB4B8AAeAkkAPAJJADwCSQA8AkkAPAJJADwCSQA8AkkAPAJJADwCSQA8AkkAPAJJADwCSQA8AxoAMgMaADICMAAoAjAAKAIwACgB6wAoAesAKAHrACgB6wAoAesAKAHrACgCJgAoAiYAKAHwAB4B8AAeAfQAbAH0AGwB9AA8AfQAegNBAF8B9ACeAfQBBAH0AF0D6ADfAl0ARgMaADIDGgAyAxoAMgMaADIDGgAyAxoAMgI+ADwDagA8ASYAJAEOADIBAAAQAeEAJAHjADIB1QAQAjoAPAI6ADwB9ABkA2YAPAQlADwB2QA8AdkARgKQ//8CVgAjAj4APAI+ADwCVQA8AlIAPADIAPgBNgBQAlwAKAJdADwAAAFiAQEBAQEBAURMAQFEAQEBAQE7TEw3ATMzTExMTDtEAQEBO0xETAEBAQFEN0wBRAE7OwEBAURMATdEKyEmAQEmTEwBAQEBAQEBAUQBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBRAE7AQFMAUwBAQEBTC9MAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQFMAQEBAQEBAQEBAQEBAQEBTAEBAQEBAQEBAQEBAQEBAUwBAQEBAQEBAQEBAQEBAQEBAQEBAUQBAQEBAQEBAQEBAQEBAQEBAQEBRAEBAQEBAQEBAQEBAQEBTDs7TEwBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE3AQEBAQEBAQEBAQEBAQEBAQEBAUwBASsBAQEBAQEBAQEBAQEBAQEBAQEBAUw7AQEBAQEBAQEBATtEAAAAAAABAAEBAQEBAAwA+Aj/AAgACP/+AAkACf/+AAoACv/9AAsAC//9AAwADP/9AA0ADP/9AA4ADf/9AA8ADv/8ABAAD//8ABEAEP/8ABIAEf/8ABMAEv/8ABQAE//7ABUAFP/7ABYAFf/7ABcAFv/7ABgAF//7ABkAF//6ABoAGP/6ABsAGf/6ABwAGv/6AB0AG//6AB4AHP/5AB8AHf/5ACAAHv/5ACEAH//5ACIAIP/5ACMAIf/4ACQAIv/4ACUAIv/4ACYAI//4ACcAJP/4ACgAJf/3ACkAJv/3ACoAJ//3ACsAKP/3ACwAKf/3AC0AKv/2AC4AK//2AC8ALP/2ADAALf/2ADEALf/2ADIALv/1ADMAL//1ADQAMP/1ADUAMf/1ADYAMv/1ADcAM//0ADgANP/0ADkANf/0ADoANv/0ADsAN//0ADwAOP/zAD0AOP/zAD4AOf/zAD8AOv/zAEAAO//zAEEAPP/yAEIAPf/yAEMAPv/yAEQAP//yAEUAQP/yAEYAQf/xAEcAQv/xAEgAQ//xAEkAQ//xAEoARP/xAEsARf/wAEwARv/wAE0AR//wAE4ASP/wAE8ASf/wAFAASv/vAFEAS//vAFIATP/vAFMATf/vAFQATv/vAFUATv/uAFYAT//uAFcAUP/uAFgAUf/uAFkAUv/uAFoAU//tAFsAVP/tAFwAVf/tAF0AVv/tAF4AV//tAF8AWP/sAGAAWf/sAGEAWf/sAGIAWv/sAGMAW//sAGQAXP/rAGUAXf/rAGYAXv/rAGcAX//rAGgAYP/qAGkAYf/qAGoAYv/qAGsAY//qAGwAZP/qAG0AZP/pAG4AZf/pAG8AZv/pAHAAZ//pAHEAaP/pAHIAaf/oAHMAav/oAHQAa//oAHUAbP/oAHYAbf/oAHcAbv/nAHgAb//nAHkAb//nAHoAcP/nAHsAcf/nAHwAcv/mAH0Ac//mAH4AdP/mAH8Adf/mAIAAdv/mAIEAd//lAIIAeP/lAIMAef/lAIQAev/lAIUAev/lAIYAe//kAIcAfP/kAIgAff/kAIkAfv/kAIoAf//kAIsAgP/jAIwAgf/jAI0Agv/jAI4Ag//jAI8AhP/jAJAAhf/iAJEAhf/iAJIAhv/iAJMAh//iAJQAiP/iAJUAif/hAJYAiv/hAJcAi//hAJgAjP/hAJkAjf/hAJoAjv/gAJsAj//gAJwAkP/gAJ0AkP/gAJ4Akf/gAJ8Akv/fAKAAk//fAKEAlP/fAKIAlf/fAKMAlv/fAKQAl//eAKUAmP/eAKYAmf/eAKcAmv/eAKgAm//eAKkAm//dAKoAnP/dAKsAnf/dAKwAnv/dAK0An//dAK4AoP/cAK8Aof/cALAAov/cALEAo//cALIApP/cALMApf/bALQApv/bALUApv/bALYAp//bALcAqP/bALgAqf/aALkAqv/aALoAq//aALsArP/aALwArf/aAL0Arv/ZAL4Ar//ZAL8AsP/ZAMAAsf/ZAMEAsf/ZAMIAsv/YAMMAs//YAMQAtP/YAMUAtf/YAMYAtv/YAMcAt//XAMgAuP/XAMkAuf/XAMoAuv/XAMsAu//WAMwAvP/WAM0AvP/WAM4Avf/WAM8Avv/WANAAv//VANEAwP/VANIAwf/VANMAwv/VANQAw//VANUAxP/UANYAxf/UANcAxv/UANgAx//UANkAx//UANoAyP/TANsAyf/TANwAyv/TAN0Ay//TAN4AzP/TAN8Azf/SAOAAzv/SAOEAz//SAOIA0P/SAOMA0f/SAOQA0v/RAOUA0v/RAOYA0//RAOcA1P/RAOgA1f/RAOkA1v/QAOoA1//QAOsA2P/QAOwA2f/QAO0A2v/QAO4A2//PAO8A3P/PAPAA3f/PAPEA3f/PAPIA3v/PAPMA3//OAPQA4P/OAPUA4f/OAPYA4v/OAPcA4//OAPgA5P/NAPkA5f/NAPoA5v/NAPsA5//NAPwA6P/NAP0A6f/MAP4A6f/MAP8A6v/MAAAAFwAAAWQJCgYABQMEBgUHCAIEBQUFAwQDBQYGBgUFBgYFBgYDAwUFBQYHBgYEBQUEBgYEBQYEBwYFBQUGBgQGBgcFBQQDBQMFBQUGBQQFBQQGBgMFBQQGBgUFBQUFBAUGBwUFBAQCBAUDAwUFBgcCBQQHBgUEBQMDBQYGAwUCAwcGBgYFBgYGBgYGCAQFBQUFAwIDAwUGBQUFBQUFBQUFBQUFBQYGBgYGBgYIBAUFBQUDAgMDBQYFBQUFBQUFBQUFBQUFBQYGBgYGBgQEBAQEBAQEBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQYGBgYDAwMDAwMDAwUFBQUEBAQEBAQEBAQEBgYGBgYGBgUFBQUFBQgIBQUFBQUFBQUFBQUFBQUEBAQEBAQFBQUFBQUFBQUFBgUHBwUFBQQEBAQEBAUFBAQFBQUFCAUFBQkFBwcHBwcHBQgDAgIEBAQFBQUICgQEBgUFBQUFAgMGBQoLBwAFAwQGBggIAgQFBgYDBAMFBgUGBgYGBwYGBgQEBgYGBggHBwUGBQUGBgQFBgUIBwYFBgcGBQcHCQYGBQMGBAYGBQYGBQYFBQYGAwUGBQcGBgUGBgYFBgYIBgYFBAMEBQMDBgYGBwMFBAgGBQQGBAQFBgYDBQIECAcHBwYGBgYGBgYJBQUFBQUDAwMEBgYGBgYGBgYGBgYGBgUGBwYGBgYGBgkFBQUFBQMDAwQGBgYGBgYGBgYGBgYGBQYGBgYGBgcGBQUFBQUFBQUFBQYGBQUFBQUFBgUFBQYGBgYGBgYGBgYGBgMDAwMDAwMDBQUGBgUFBQUFBQUFBQUGBgYGBgYGBgYGBgYGCQkGBgYGBgYGBgYGBgYGBgUFBQUFBQYGBgYGBgYGBgYHBggIBgYGBQUFBQUFBgYFBQUFBQUIBQUFCgYICAgICAgGCQMDAwUFBQYGBQoLBQUHBgYGBgYCAwcGCwwHAAYDBAcGCQkDBQUHBgQEAwYHBQcGBwcHBwgHBAQGBgYHCAcHBQYGBQcHBAYHBQgIBwYHBwYFBwcJBwcFAwcEBgcGBwcFBgYFBwcDBgcFCAcHBgcHBgUGBwkGBgUFAwUGAwMGBwcHAwUECAcGBQcEBAYHBwQGAwQICAgIBwcHBwcHBwoFBgYGBgMDAwQGBwcHBwcHBgcGBgYGBgYHBwcHBwcHCgUGBgYGAwMDBAYHBwcHBwcGBwYGBgYGBgYHBwcHBwcFBQUFBQUFBQYGBgYGBgYGBgYGBgYGBgYGBgYGBgYHBwcHAwMEBAMDAwMGBgcHBQUFBQUFBQUFBQcHBwcHBwcHBwcHBwcKCgcHBwcHBwYGBgYGBgYGBQUFBQUFBgYGBgYGBgYGBgcGCQkGBgYFBQUFBQUGBgUFBgYGBQkGBgYLBwkJCQkJCQYKAwMDBQUFBgYGCgwFBQcHBgYHBwIDBwcMDQgABgQFBwcJCQMFBgcHBAUEBgcFBwcHBwgHCAcEBAcHBwcJBwgGBwYGBwgFBgcGCQgHBwcIBwYICAoHBwYEBwQGBwYHBwYHBgYHBwMGBwYICAcHBwcHBgcHCgcHBgUDBQYEBAcHBwcDBQUJBwYFBwQEBgcHBAYDBQkICAgHBwcHBwcHCwYGBgYGAwMDBAcIBwcHBwcHBwcHBwcGBwgHBwcHBwcLBgYGBgYDAwMEBwgHBwcHBwcHBwcHBwYHBwcHBwcIBwYGBgYGBgYGBwcHBwYGBgYGBgYGBgYHBwcHBwcHBwcHBwcEBAQEAwMDAwYGBwcGBgYGBgYGBgYGCAgICAgICAcHBwcHBwsLBwcHBwcHBwcHBwcHBwcGBgYGBgYHBwcHBwcHBwcHCAcKCgcHBwYGBgYGBgcHBgYGBgYGCgYGBgwHCgoKCgoKBwoEAwMGBgYHBwYKDQYGCAcHBwcHAgQHCA0OCQAHBAUIBwoLAwYGCAgEBQQGCAUICAgICAgJCAQEBwcHCAoICAYHBwYICAUHCAYJCQgHCAgHBggICwgIBgQHBAcIBwgIBgcHBggIBAcIBgkICAcICAcGCAgKBwcGBgMGBwQEBwgICQMGBQoHBwUIBQUHCAcEBwMFCgkJCQgICAgICAgMBgcHBwcEBAQEBwgICAgICAcICAgICAcHCQgICAgICAwGBwcHBwQEBAQHCAgICAgIBwgICAgIBwcHCAgICAgIBgYGBgYGBgYHBwcHBwcHBwcHBwcHBwcHBwcHBwcHCAgICAUFBAQEBAQEBwcICAYGBgYGBgYGBgYICAgICAgICAgICAgIDAwICAgICAgHBwcHBwcHBwYGBgYGBggICAgICAgICAgICAoKBwcHBgYGBgYGBwcGBgcHBwcLBwYHDQgKCgoKCgoHCwQEAwYGBgcHBwwOBgYJCAcHCAgDBAgJDxAKAAgFBgkICw0EBwcJCQUGBQgJBwgJCQkKCAoJBAUICQgJDAoJBwgIBwgJBggKBwoKCQgJCgkHCQkMCQkHBQgFCAkICQkHCAgHCAkECAkHCgoJCAkJCAcJCQwJCAcHBAcIBQUICQkKBAgGCwkIBQkGBQgJCQQIBAYLCwsLCQkJCQkJCQ4HCAgICAQEBAUICgkJCQkJCAkJCQkJCAgKCQkJCQkJDgcICAgIBAQEBQgKCQkJCQkJCQkJCQkICAgJCQkJCgkHBwcHBwcHBwgICAgICAgICAgICAgICAgICAgICAgJCQkJBQUEBAQEBAQICAkJBwcHBwcHBwcHBwoKCgoKCgoJCQkJCQkODgkJCQkJCQgICAgICAgIBwcHBwcHCQkJCQkJCQkJCQkJDAwICAgHBwcHBwcICAcHCAgICA0ICAgPCQwMDAwMDAkNBAQEBwcHCQkIDRAHBwoJCQkJCQMFCgoQEQoACAUGCgkMDQQHCAoJBQYFCAoHCgkKCgoJCwoEBQkJCQkNCgoICQgICQoGCAoIDAsJCQkKCQgKCg0KCggFCAUJCggKCggJCAgJCgQICggLCgkJCQkJCAkKDQkJCAcEBwgFBQkKCgoECQYMCQgGCgYGCAsJBAgEBgwLCwsKCgoKCgoKDwgICAgIBAQEBQkKCQkJCQkJCQkJCQkJCQoKCgoKCgoPCAgICAgEBAQFCQoJCQkJCQkJCQkJCQkJCQoKCgoKCggICAgICAgICQkJCQgICAgICAgICAgJCQkJCQkJCQoKCgoFBQUFBAQEBAgICgoICAgICAgICAgICgoKCgoKCgkJCQkJCQ8PCQkJCQkJCQkJCQkJCQkICAgICAgJCQkJCQkJCQkJCgkNDQkJCQgICAgICAkJCAgICAgIDQgICBAKDQ0NDQ0NCQ4FBAQICAgJCQgOEQgICwoJCQoKAwUKChESCwAJBQcLCQ0OBAgICgoGBwUJCgcKCgsKCwoLCgUFCQoJCg4LCggJCQgKCgYJCwgMCwoJCgoKCAoLDgoKCAUKBQkKCQoKCAkJCAoLBQkKCAwLCgkKCgkICgoOCgoIBwQHCQUFCgoKCgQJBw0KCQYKBgYJCwoFCQQHDQwMDAoKCgoKCgoQCAkJCQkFBQUGCQsKCgoKCgkKCgoKCgkKDAoKCgoKChAICQkJCQUFBQYJCwoKCgoKCgoKCgoKCQoKCgoKCgsKCAgICAgICAgJCQkJCQkJCQkJCQkJCQoKCgoKCgoKCwsLCgUFBQUFBQUFCQkKCggICAgICAgICAgLCwsLCwsLCgoKCgoKEBAKCgoKCgoJCQkJCQkJCQgICAgICAoKCgoKCgoKCgoKCg4OCgoKCAgICAgICQkICAkJCQgOCQkJEQoODg4ODg4KDwUFBAgICAoKCQ8SCAgLCgoKCgoDBQsKExQMAAoGCAwLDhAFCQkLCwYIBgkLCQsLDAsMCw0LBQcLCwsMDwwLCQsKCQsMBgoMCQ0MCwoLCwsJCwwPCwsJBgoGCgsKDAsJCwoJCwwFCgwJDQwLCgsLCgkLDA8LCwkIBQgKBgYLCwwMBQkIDgsKBgsHBwoMCwUKBQcODQ0NCwwMDAwMDBEJCgoKCgUFBQYLDAsLCwsLCgsLCwsLCgsMDAwMDAwMEQkKCgoKBQUFBgsMCwsLCwsLCwsLCwsKCwsMDAwMDAwJCQkJCQkJCQoKCwsKCgoKCgoJCgoKCwsLCwsLCwsMDAwLBQUFBQUFBQUKCgwMCQkJCQkJCQkJCQwMDAwMDAwLCwsLCwsSEgsLCwsLCwoKCgoKCgoKCQkJCQkJCwsLCwsLCwsLCwsLDw8LCwsJCQkJCQkKCgkJCgoKCRAKCQoTDA8PDw8PDwsRBgUFCQkJCwsKERQJCQwLCwsLCwQGDAwVFg4ACwYIDQwQEQUJCg0MBwgHCwwJDAwMDA0LDgwGBwwMDA0QDA0KDAsKDA0HCw0KDg0MCwwMCwoMDRAMDAoHDAYKDAsNDQoMCwoMDQYLDQoODQwLDAwMCgwNEQwMCgkFCQsGBwwNDQ4FCggQDAsHDQgICw0MBgsFCBAPDw8MDQ0NDQ0NEwoLCwsLBgYGBgwNDAwMDAwMDAwMDAwLDA0NDQ0NDQ0TCgsLCwsGBgYGDA0MDAwMDAwMDAwMDAsMDA0NDQ0NDQoKCgoKCgoKCwsMDAsLCwsLCwsLCwsMDAwMDAwMDA0NDQwGBgUFBgYGBgsLDQ0KCgoKCgoKCgoKDQ0NDQ0NDQwMDAwMDBQUDAwMDAwMDAwMDAwMDAwKCgoKCgoMDAwMDAwMDAwMDAwREQwMDAoKCgoKCgwMCgoLCwsLEgsKCxUNERERERERDBIGBgUKCgoMDAsSFgoKDg0MDA0MBAcNDRgZEAAMBwoPDRIUBgsLDg4ICgcNDgsNDg8NDg0QDQcIDQ4NDhIPDgwNDAwNDwcMDgsRDw4NDg4NDA4PEw4ODAcOBw0ODA8ODA0MDA0PBwwPCxAPDg0ODg0MDg8TDg0MCgYKDQcHDQ4PEAYMChINDAoPCQkMDg4HDAYJEhEREQ4PDw8PDw8WDAwMDAwHBwcHDQ8ODg4ODg0ODg4ODg0ODg8PDw8PDxYMDAwMDAcHBwcNDw4ODg4ODg4ODg4ODQ4NDw8PDw8PDAwMDAwMDAwNDQ0NDAwMDAwMDAwMDA0NDQ0NDQ0NDw8PDwcHBgYHBwcHDAwPDwsLCwsLCwsLCwsPDw8PDw8PDg4ODg4OFhYODg4ODg4NDQ0NDQ0NDQwMDAwMDA4ODg4ODg4ODg4ODhMTDQ0NDAwMDAwMDQ0MDAwMDAwUDAwMGA8TExMTExMOFQcGBgwMCw4ODBUZCwsQDg4ODg4FBw8PGx0SAA4ICxEPFBYHDAwQEAkLCA4RDBEQEBAQDxMRCAkPEA8QFRAQDQ8ODQ8RCg4QDRIREA8QDw8NEBAWDw8NCA8JDxAOERANDw4NDxEIDhANExEQDxAQDw0QERUPDw0MBwwOCAgPEBERBw4LFBAOChAKCg4REAgOBgoUExMTEBERERERERkNDg4ODggHCAgPERAQEBAQDxAQEBAQDw8PERERERERGQ0ODg4OCAcICA8REBAQEBAQEBAQEBAPDw8REREREBENDQ0NDQ0NDQ8PDw8ODg4ODg4ODg4ODw8PDw8PDw8RERERCQkICAgICAgODhAQDQ0NDQ0NDQ0NDREREREREREQEBAQEBAZGRAQEBAQEA8PDw8PDw8PDQ0NDQ0NEBAQEBAQEBAQEBAQFRUPDw8NDQ0NDQ0PDw0NDg4ODRYODg4bEBUVFRUVFRAYCAcHDQ0NDw8OGB0NDRIQEBAQEAUIEBEdHxMADwkMEhAVGAcNDRERCgwJDhIOERESEBEPFBEICRAREBEXEREOEA8OEBIKDxEOFBIREBEREA4REhcQEA4JDwkPEQ8SEQ4QDw4QEggPEg4UEhEQEREQDhESFxEQDg0IDQ8JCRAREhMIDgsWEQ8LEgsLDxIRCA8HCxYUFBQREhISEhISGg4PDw8PCAgICRASEREREREQEREREREQEBESEhISEhIaDg8PDw8ICAgJEBIRERERERERERERERAQEBISEhIREg4ODg4ODg4OEBAQEA8PDw8PDw8PDw8QEBAQEBAQEBISEhIJCQkJCAgICA8PEhIODg4ODg4ODg4OEhISEhISEhERERERERsbEREREREREBAQEBAQEBAODg4ODg4REREREREREREREREXFxAQEA4ODg4ODhAQDg4PDw8PGA8PDx0SFxcXFxcXERkJCAcODg4REQ8aHw4OExERERERBgkREiAiFQAQCg0UEhgaCA4OExMLDQoQEw8TEhMTFBEVEwkLEhISExgUFA8SERASEwoQFA8WFBMRExQSEBMTGhMSEAoRChATEBQTDxIREBIUCRAUDxYUExETExIQExQZEhIQDggOEQoKEhMUFQgQDRgSEAsTDAwQFBIJEAgMGBcXFxMUFBQUFBQdDxEREREJCQkJEhQTExMTExITExMTExESFBQUFBQUFB0PEREREQkJCQkSFBMTExMTEhMTExMTERISFBQUFBQUDw8PDw8PDw8RERISERERERERERERERISEhISEhISFBQUEwkJCQkJCQkJEBAUFA8PDw8PDw8PDw8UFBQUFBQUExMTExMTHh4TExMTExMSEhISEhISEhAQEBAQEBMTExMTExMTExMTExkZEhISEBAQEBAQEhIQEBAQEBAbEBAQIBMZGRkZGRkSHAkJCA8PDxISEB0iDw8VExISExMGChMTISMWABEKDRQSGRwIDw4UEwsNChEUDxMTFBMUEhcTCgsSExIUGRUUEBIREBMUChEVEBYUFBIUFRIQExQaExIQChIKERQRFBQQEhEQExQJERQQFxUUEhQUEhATFBoTEhAOCQ4RCgoTFBQXCRANGRMRDBQMDBEUEwkRCA0ZFxcXFBQUFBQUFB4QEREREQkJCQkSFRQUFBQUEhQTExMTEhMVFBQUFBQUHhARERERCQkJCRIVFBQUFBQTFBMTExMSExIUFBQUFRQQEBAQEBAQEBISEhIREREREREREREREhISEhISEhIUFBQUCQkJCQkJCQkRERQUEBAQEBAQEBAQEBUVFRUVFRUUFBQUFBQfHxQUFBQUFBISEhISEhISEBAQEBAQExMTExMTExMTExMTGhoSEhIQEBAQEBASEhAQEREREBsREBEhFBoaGhoaGhMdCgkIEBAPExMRHSMQEBYUExMUFAcKFBUlJxgAEwsPFxUcHgkREBYWDQ8LExYQFhUXFhcTGRYLDBUVFBYdFxcSFRMSFRcLExcSGRcWFBYWFRIVFh0VFBILFQsUFhMXFhIVExIVFwoTFxIZGBYUFhYUEhYXHRUVEhAKEBMLCxUWFxgKEw8cFRMPFg4NExcWCxMJDhwaGhoWFxcXFxcXIhITExMTCgoKCxUYFhYWFhYUFhYWFhYUFRYXFxcXFxciEhMTExMKCgoLFRgWFhYWFhUWFhYWFhQVFRcXFxcXFxISEhISEhISFBQVFRMTExMTExMTExMVFRUVFRUVFRcXFxcKCgoKCgoKChMTFxcSEhISEhISEhISGBgYGBgYGBYWFhYWFiMjFhYWFhYWFBQUFBQUFBQSEhISEhIWFhYWFhYWFhYWFRYdHRUVFRISEhISEhQUEhITExMTHxMTEyUWHR0dHR0dFSALCgkSEhEVFRMgJxISGBYVFRYWBwsWFiotHAAVDREaFx8jChMTGRkOEQ0WGhMZGBkYGRYdGQ0NFxgXGCAaGRQXFhUYGg0VGhQdGxkXGRkXFRkaIhgYFQ0XDRYZFRoZFBcWFRgaDBUaFB0bGRcZGRcVGRohGBgVEgsSFg0NGBkaGgsVESAYFRAZDw8VGhgMFQoQIB4eHhkaGhoaGhomFBYWFhYMDAwMFxsZGRkZGRcZGRkZGRcYGhoaGhoaGiYUFhYWFgwMDAwXGxkZGRkZGBkZGRkZFxgYGhoaGhoaFBQUFBQUFBQXFxcXFhYWFhYWFhYWFhgYGBgYGBgYGhoaGgsLDAwMDAwMFRUaGhQUFBQUFBQUFBQbGxsbGxsbGRkZGRkZJycZGRkZGRkXFxcXFxcXFxUVFRUVFRkZGRkZGRkZGRkZGSEhGBgYFRUVFRUVFxcVFRUVFRUjFRQVKhkhISEhISEYJQwLCxQUFBgYFSYtFBQcGRgYGRkIDRoaLjEeABcOEh0aIiYLFRUbGxATDhccFRsbHBscGB8cDg8aGhkcJBwcFhoYFxkcDhccFh8dGxkbGxkXGxwlGhoXDhkOGBsXHBwWGhgXGR0NFxwWIB0bGRsbGRcbHCUaGhcUDBQYDg4aHBwfDBcSIxsXERwRERccGg0XCxIjICAgGxwcHBwcHCoWGBgYGA0NDQ0aHRsbGxsbGRsbGxsbGRocHBwcHBwcKhYYGBgYDQ0NDRodGxsbGxsaGxsbGxsZGhocHBwcHBwWFhYWFhYWFhkZGhoYGBgYGBgYGBgYGhoaGhoaGhodHR0cDQ0NDQ0NDQ0XFxwcFhYWFhYWFhYWFh0dHR0dHR0bGxsbGxsrKxsbGxsbGxkZGRkZGRkZFxcXFxcXGxsbGxsbGxsbGxsbJSUaGhoXFxcXFxcZGRcXFxcXFyYXFxcuHCUlJSUlJRooDgwMFhYWGhoXKTEWFh4cGhobGwkOHBsyNSEAGQ8UHxwmKgwWFh4dERQQGh4XHR0eHh8bIh4PERwdHB4nIB4YHBoZHSAQGSAYIiAeGx4fHBkeHygdHBkQHBAbHhkfHhgcGhkdHw4ZHxgiIB4bHh4cGR0fKB0cGRYNFhoPEBweHyENGRQmHRkUHhISGR8dDxkMEyYjIyMeHx8fHx8fLhgaGhoaDg4ODhwgHh4eHh4cHh0dHR0bHB8fHx8fHx8uGBoaGhoODg4OHCAeHh4eHh0eHR0dHRscHB8fHx8fHxgYGBgYGBgYGxscHBoaGhoaGhoaGhocHBwcHBwcHB8fHx8PDw4ODg4ODhkZHx8YGBgYGBgYGBgYICAgICAgIB4eHh4eHi8vHh4eHh4eHBwcHBwcHBwZGRkZGRkdHR0dHR0dHR0dHh0oKBwcHBkZGRkZGRwcGRkZGRkZKhkZGTIeKCgoKCgoHSwPDg0YGBcdHRksNRgYIR4dHR4eChAeHjY5IwAbEBYhHigtDRgYICASFhEcIBcfHyEfIR0lHw8RHh8eICkhIRoeHBofIhAbIRolIiAdICAeGx8hKx8eGxEeERwgGyEgGh4cGh8hDxshGiUiIB0gIB4bICErHx4bGA4YHBARHiAhIw4bFSkeGxQhFBQbIR8QGw0VKSYmJiAhISEhISExGhwcHBwPDw8PHiIgICAgIB4gICAgIB0eISEhISEhITEaHBwcHA8PDw8eIiAgICAgHyAgICAgHR4eISEhISEhGhoaGhoaGhodHR4eHBwcHBwcHBwcHB4eHh4eHh4eISEhIg8PDw8PDw8PGxshIRoaGhoaGhoaGhoiIiIiIiIiICAgICAgMzMgICAgICAeHh4eHh4eHhsbGxsbGyAgICAgICAgICAfICsrHh4eGxsbGxsbHh4bGxsbGxwtGxsbNiErKysrKysfLxAPDhoaGR8fGy45GhojIB8fICALESEgOj0mAB0RFyQgKy8OGhojIhQXEh0iGSIhIyIkHyciEBMgISAjLSMjHCAeHCAkER0jHCckIiAiIiAdIiMuISAcEiASHyIdJCMcIB4cICQQHSMcKCUiICIiIB0iJC4hIBwZDxkeERIhIyQoDx4XLCEdFSMVFR0jIREdDhYsKSkpIiQkJCQkJDUcHh4eHhAQEBAgJSIiIiIiICIiIiIiHyEjJCQkJCQkNRweHh4eEBAQECAlIiIiIiIhIiIiIiIfISAkJCQkIyQcHBwcHBwcHCAgICAeHh4eHh4eHh4eICAgICAgICAkJCQkEREQEBAQEBAdHSMjHBwcHBwcHBwcHCUlJSUlJSUiIiIiIiI2NiIiIiIiIiAgICAgICAgHR0dHR0dIiIiIiIiIiIiIiIiLi4gICAcHBwcHBwgIB0dHR0dHTAdHR06Iy4uLi4uLiEzERAPHBwbISEdMT0bGyYjISEjIgwSIiRDRywAIhQbKiUxNhAeHygnFxsVIigdJycpJykkLSgTFSUmJSg0KCggJSMhJSoUIiggLisoJSgmJSEnKjUmJiEVJRUkKCIpKCAlIyElKhMiKSAuKyglKCglIScpNSYmIR0RHSMUFSYoKSsRIhsyJiIZKBkYIiknFCIQGjIvLy8oKSkpKSkpPSAjIyMjExITEyUrKCgoKCglKCcnJyckJikpKSkpKSk9ICMjIyMTEhMTJSsoKCgoKCYoJycnJyQmJikpKSkoKSAgICAgICAgJSUlJSMjIyMjIyIjIyMmJiYmJiYmJioqKioTExMTExMTEyIiKSkgICAgICAgICAgKysrKysrKygoKCgoKD8/KCgoKCgoJSUlJSUlJSUhISEhISEnJycnJycnJycnJyc1NSYmJiEhISEhISUlISEiIiIiOCIiIkMpNTU1NTU1JjsUEhEgIB8mJiI6RyAgLCgmJigoDRUoKEtQMQAmFx4vKjg9EiIiLSwaHhcmLiEsKy4sLyc0LRYYKispLTsuLiQqJyUq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AAIAHgAAA3YCvABhAIcAQwC6AGsAGQADK7oAKQB+AAMrugBPAFUAAyu4AGsQuAAA0LgAAC+4ABkQuAAK0LgAKRC4ADfQuAB+ELgAQtC4AEIvMDElMh4CFRQOAisBIi4CLwEmIgcOAyMiLgInLgE1NDY3PgMzMh4CFxYyPwE+AzsBMh4CFRQOAisBIg4CDwEGFRQWOwEyFhUUBisBIgYVFB8BHgMzJRQfAR4DOwEyPgI/AT4BPQE0Ji8BLgMrASIOAg8BBhUDJhogEQUFESAach4wJBkJEwUNBRIcKUE2PkMqHxkMGxsMGR8qQz42QSkcEgUNBRMJGSQwHnIaIBEFBREgGmQUHRQNBhACGRexHRUVHbEXGQIQBg0UHRT9wg8XChEZJyAGICcZEQoXBwgIBxcKERknIAYgJxkRChcPlgQQHhkaHRAECBQjHDsODi06Ig0RLU09H0cwMEcfPU0tEQ0iOi0ODjscIxQIBBAeGRodEAQCCRUSNgoFEQ4VHR0VDhEFCjYSFQkCxh8kORoeDwUFDx4ZOhIiDwQPIhI6GR4PBQUPHxk5JB8AAAD//wAeAAADdgK8AgYBCAAA//8APAAAAh0DegImADQAAAAGAHEeAAAA//8APAAAAh0DegImADQAAAAGAHEeAAAA//8APP8GAh0CvAImADQAAAAGAV7tAAAA//8APP8GAh0CvAImADQAAAAGAV73AAAA//8APAAAAh0DegImADQAAAAGATooAAAA//8APAAAAh0DegImADQAAAAGATooAAAA//8AKAAAAfQDegImADUAAAAGAHEWAAAA//8AKAAAAfQDegImADUAAAAGAHEWAAAA//8AKAAAAfQDegImADUAAAAGATkqAAAA//8AKAAAAfQDegImADUAAAAGATkqAAAA//8AKP9MAfQCvAImADUAAAAGAHXlAAAA//8AKP9MAfQCvAImADUAAAAGAHXlAAAA//8AKAAAAfQDegImADUAAAAGAToyAAAA//8AKAAAAfQDegImADUAAAAGAToyAAAA//8AHv8GAdICvAImADYAAAAGAV67AAAA//8AHv8GAdICvAImADYAAAAGAV67AAAA//8AHgAAAdIDegImADYAAAAGAToJAAAA//8AHgAAAdIDegImADYAAAAGAToJAAAAAAEAHgAAAdICvAA5AE+6ACgABwADK7gA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AHEAcAByAHMAdQB0AHYAdwDqAHgAegB5AHsAfQB8ALgAoQB/AH4AgACBAOwA7gC6AQYBBwEIAQkBCgELAP0A/gEMAQ0BDgEPAP8BAAEQAREBEgETARQBFQEWARcBGAEZARoBGwEcAR0BHgEfAPgA+QEgASEBIgEjASQBJQEmAScBKAEpASoBKwEsAS0BLgDXAS8BMAExATIBMwE0ATUBNgE3ATgBOQE6AOIA4wE7ATwBPQE+AT8BQAFBAUIBQwFEAUUBRgFHALAAsQFIAUkBSgFLAUwBTQFOAU8BUAFRAPsA/ADkAOUBUgFTAVQBVQFWAVcBWAFZAVoBWwFcAV0BXgFfAWABYQFiAWMBZAFlAWYBZwC7AWgBaQFqAWsA5gDnAWwBbQFuAW8A2ADhAXAA2wDcAN0A4ADZAN8BcQFyAXMBdAF1AXYBdwCyALMAtgC3AMQAtAC1AMUAggDCAIcAqwDGAL4AvwF4AIwA7wCPAJQAlQF5AAQBegF7BS5udWxsB3VuaTAwQTAGbWFjcm9uDnBlcmlvZGNlbnRlcmVkB0FtYWNyb24HYW1hY3JvbgZBYnJldmUGYWJyZXZlB0FvZ29uZWsHYW9nb25lawtDY2lyY3VtZmxleAtjY2lyY3VtZmxleApDZG90YWNjZW50CmNkb3RhY2NlbnQGRGNhcm9uBmRjYXJvbgZEY3JvYXQGZGNyb2F0B0VtYWNyb24HZW1hY3JvbgZFYnJldmUGZWJyZXZlCkVkb3RhY2NlbnQKZWRvdGFjY2VudAdFb2dvbmVrB2VvZ29uZWsGRWNhcm9uBmVjYXJvbgtHY2lyY3VtZmxleAtnY2lyY3VtZmxleApHZG90YWNjZW50Cmdkb3RhY2NlbnQHdW5pMDEyMgd1bmkwMTIzC0hjaXJjdW1mbGV4C2hjaXJjdW1mbGV4BEhiYXIEaGJhcgZJdGlsZGUGaXRpbGRlB0ltYWNyb24HaW1hY3JvbgdJb2dvbmVrB2lvZ29uZWsKSWRvdGFjY2VudAtKY2lyY3VtZmxleAtqY2lyY3VtZmxleAd1bmkwMTM2B3VuaTAxMzcGTGFjdXRlBmxhY3V0ZQd1bmkwMTNCB3VuaTAxM0MGTGNhcm9uBmxjYXJvbgRMZG90BGxkb3QGTmFjdXRlBm5hY3V0ZQd1bmkwMTQ1B3VuaTAxNDYGTmNhcm9uBm5jYXJvbgtuYXBvc3Ryb3BoZQdPbWFjcm9uB29tYWNyb24GT2JyZXZlBm9icmV2ZQ1PaHVuZ2FydW1sYXV0DW9odW5nYXJ1bWxhdXQGUmFjdXRlBnJhY3V0ZQd1bmkwMTU2B3VuaTAxNTcGUmNhcm9uBnJjYXJvbgZTYWN1dGUGc2FjdXRlC1NjaXJjdW1mbGV4C3NjaXJjdW1mbGV4B3VuaTAxNjIHdW5pMDE2MwZUY2Fyb24GdGNhcm9uBFRiYXIEdGJhcgZVdGlsZGUGdXRpbGRlB1VtYWNyb24HdW1hY3JvbgZVYnJldmUGdWJyZXZlBVVyaW5nBXVyaW5nDVVodW5nYXJ1bWxhdXQNdWh1bmdhcnVtbGF1dAdVb2dvbmVrB3VvZ29uZWsLV2NpcmN1bWZsZXgLd2NpcmN1bWZsZXgLWWNpcmN1bWZsZXgLeWNpcmN1bWZsZXgGWmFjdXRlBnphY3V0ZQpaZG90YWNjZW50Cnpkb3RhY2NlbnQHdW5pMDIxOAd1bmkwMjE5B3VuaTAyMUEHdW5pMDIxQgd1bmkwMkM5B3VuaTAzQkMGV2dyYXZlBndncmF2ZQZXYWN1dGUGd2FjdXRlCVdkaWVyZXNpcwl3ZGllcmVzaXMERXVybwtjb21tYWFjY2VudAVfemVybwJfUgAAAAAAAAMACAACABAAAf//AAMAAQAAAAoAHgAsAAFsYXRuAAgABAAAAAD//wABAAAAAWtlcm4ACAAAAAEAAAABAAQAAgAAAAMADAKCBOAAAQZMAAQAAAA3AHgAggCIAI4AmACiAKwAtgDAAMYAzADWAOAA6gD0AP4BCAESARwBJgEwAToBRAFOAVgBYgFsAXYBgAGKAZQBngGoAbIBvAHGAcwB0gHYAd4B6AHyAfwCBgIQAhoCJAIuAjgCQgJMAlYCYAJqAnAAAgAO/84AEP/YAAEAEP/YAAEAOf/YAAIADv/OABD/2AACAA7/zgAQ/84AAgAO/7AAEP+cAAIADv+wABD/pgACAA7/zgAQ/9gAAQAQ/9gAAQA5/9gAAgAO/84AEP/YAAIADv/OABD/zgACAA7/sAAQ/5wAAgAO/7AAEP+mAAIADv/OABD/2AACAA7/zgAQ/9gAAgAO/84AEP/YAAIADv/OABD/2AACAA7/zgAQ/9gAAgAO/84AEP/YAAIADv/OABD/2AAC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AAIAUQBRAAQAUgBSAAsAVABUAAYAVQBVAAMAWABYAAoAWQBZAAkAWwBbAAEAfQCCAAUAhACEAAwAjQCNAAQAjwCTAAQAlQCVAAQAmgCaAAEAnACcAAMAnQCiAAUApACkAAwArQCtAAQArwCzAAQAtQC1AAQAugC6AAEAvAC8AAEAvQDCAAUAwwDKAAwAywDOAAQA2QDgAAMA7QDuAA0A7wDwAAYA8QD0AAIBAgEHAAQBCgEPAAYBEAEXAAMBKgErAAkBLAEuAAEBNQE2AAMBQwFIAAkBSQFKAA4BSwFLAAcBTAFMAAgBTgFOAAcBTwFPAAj/////AAwAAgA1AA8ADwAJACMAIwACACUAJQABACcAJwAEACkAKQABACwALAALADEAMQABADMAMwABADUANQADADYANgAFADgAOAAGADsAOwAHADwAPAAKAEMAQwACAEUARQABAEcARwAEAEkASQABAEwATAALAFEAUQABAFMAUwABAFUAVQADAFYAVgAFAFgAWAAGAFsAWwAHAFwAXAAKAH0AgwACAIQAhAABAIUAiAAEAI8AkwABAJUAlQABAJoAmgAHAJ0AowACAKQApAABAKUAqAAEAK8AswABALUAtQABALoAugAHALwAvAAHAL0AwgACAMMAygABAM8A2AAEANkA4AABAO0A7gALAQIBCQABARABFwADARgBGwAFASwBLgAHAS8BNAAKATUBNgADATcBNwAFAUkBSgAJAUwBTAAIAU8BTwAIAAA=","base64");
module.exports = font;

}).call(this,require("buffer").Buffer)
},{"buffer":2}]},{},[4])(4)
});
