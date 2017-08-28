AssemblyScript Loader
=====================

[AssemblyScript](http://assemblyscript.org)'s loader component to run and work with compiled WebAssembly modules, as a stand-alone module.

[![npm](https://img.shields.io/npm/v/assemblyscript-loader.svg)](https://www.npmjs.com/package/assemblyscript-loader) [![Build Status](https://travis-ci.org/AssemblyScript/loader.svg?branch=master)](https://travis-ci.org/AssemblyScript/loader)

Usage
-----

```
$> npm install assemblyscript-loader
```

```ts
import load from "assemblyscript-loader"; // JS: var load = require("assemblyscript-loader").load;

load("path/to/myModule.wasm", {
  imports: {
    ...
  }
}).then(module => {
  ...
  // i.e. call module.exports.main()
});
```

Alternatively, when `LoadOptions#exports` is specified, the respective object is pre-initialized
with the (always present) `ready` promise that is resolved when loading is complete:

```js
// myModule.js (CommonJS)
require("assemblyscript-loader").load("path/to/myModule.wasm", { exports: module.exports });
```

```js
// otherModule.js (CommonJS)
var myModule = require("./myModule.js");
myModule.ready.then(() => {
  ...
});
```

API
---

* **load**(file: `string | Uint8Array | ArrayBuffer`, options: `LoadOptions`): `Promise<Module>`<br />
  Loads a WebAssembly module either from a file or a buffer and returns a promise for the loaded `Module`.

* **LoadOptions**<br />
  Options to set up the environment created by `load`.

  * **memory**: `WebAssembly.Memory`<br />
    Memory instance to import, if applicable.
  * **imports**: `{ [key: string]: any }`<br />
    Import elements. Usually functions.
  * **exports**: `{ [key: string]: any }`<br />
    Object to populate with exports. Creates a new object if omitted.

* **Module**<br />
  Common module interface as returned by `load`.

  * **imports**: `Imports`<br />
    Imported elements. Usually functions.
  * **exports**: `Exports`<br />
    Exported elements. Usually functions.
  * **memory**: `Memory`<br />
    A reference to the underlying memory instance.
  * **log**(type: `LogType`, message: `string`): `void`<br />
    An overridable method receiving console outputs.

* **Imports**<br />
  An object of imported functions.

* **Exports**<br />
  An object of exported functions (plus the `ready` promise).

* **LogType**<br />
  An enum of log types:

  Key   | Value
  ------|-------
  LOG   | 0
  INFO  | 1
  WARN  | 2
  ERROR | 3

* **Memory** extends *WebAssembly.Memory*<br />
  The [WebAssembly Memory](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Memory)
  instance populated with additional accessors for more convenient memory access.

  * **sbyte** / **s8**: `NumberAccessor`<br />
    Signed 8-bit integer accessors.
  * **byte** / **u8**: `NumberAccessor`<br />
    Unsigned 8-bit integer accessors.
  * **short** / **s16**: `NumberAccessor`<br />
    Signed 16-bit integer accessors.
  * **ushort** / **u16**: `NumberAccessor`<br />
    Unsigned 16-bit integer accessors.
  * **int** / **s32**: `NumberAccessor`<br />
    Signed 32-bit integer accessors.
  * **uint** / **u32**: `NumberAccessor`<br />
    Unsigned 32-bit integer accessors.
  * **long** / **s64**: `LongAccessor`<br />
    Signed 64-bit integer accessors.
  * **ulong** / **u64**: `LongAccessor`<br />
    Unsigned 64-bit integer accessors.
  * **float** / **f32**: `NumberAccessor`<br />
    32-bit float accessors.
  * **double** / **f64**: `NumberAccessor`<br />
    64-bit float accessors.
  * **array**: `ArrayAccessor`<br />
    Array accessors.
  * **string**: `StringAccessor`<br />
    String accessors.

* **NumberAccessor**<br />
  Number memory accessor.

  * **get**(ptr: `number`): `number`<br />
    Gets a value of the underlying type from memory at the specified pointer.
  * **set**(ptr: `number`, value: `number`): `void`<br />
    Sets a value of the underlying type in memory at the specified pointer.

* **LongAccessor**<br />
  Long memory accessor. See also: [long.js](https://github.com/dcodeIO/long.js)

  * **get**(ptr: `number`): `Long`<br />
    Gets a Long from memory at the specified pointer.
  * **set**(ptr: `number`, value: `Long`): `void`<br />
    Sets a Long in memory at the specified pointer.

* **ArrayAccessor**<br />
  Array memory accessor.

  * **get**(ptr: `number`): `{ length: number, base: number }`<br />
    Gets an array from memory at the specified pointer and returns its length and element base
    pointer.
  * **create**(length: `number`, elementByteSize: `number`): `{ ptr: number, base: number }`<br />
    Creates an array in memory and returns its pointer and element base pointer.

* **StringAccessor**<br />
  String memory accessor.

  * **get**(ptr: `number`): `string`<br />
    Gets a string from memory at the specified pointer.
  * **create**(value: `string`): `number`<br />
    Creates a string in memory and returns its pointer.

* **initializeMemory**(memoryInstance: `WebAssembly.Memory`, malloc: `Function`, memset: `Function`): `Memory`<br />
  Just populates a WebAssembly Memory instance with the AssemblyScript-typical accessors.

* **xfetch**(file: `string`): `Promise<Response>`<br />
  Underlying [fetch](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch)
  implementation that also works under node.js.

**Note** that the `create` methods of array and string accessors require an exported or imported
implementation of `malloc`, `memset`, `free` etc. to be present. Also remember that memory is
unmanaged here and that `free` must be called manually to clean up memory, just like in C. Once
WebAssembly exposes the garbage collector natively, there will be other options as well.

The [long.js](https://github.com/dcodeIO/long.js) dependency can be safely excluded if working with
long/ulong values isn't needed. In this case, the implementation will still accept and produce
Long-like objects having a `low` and a `high` property representing the respective low and high
32-bits.

Building
========

Clone the GitHub repository and install the development dependencies:

```
$> git clone https://github.com/AssemblyScript/loader.git
$> cd loader
$> npm install
```

Afterwards, to build the distribution files to *dist/*, run:

```
$> npm run build
```
