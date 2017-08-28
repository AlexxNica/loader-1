/** Log message types. */
export enum LogType {
  LOG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

/** Size of an array header in bytes. */
export const arrayHeaderSize = 8; // capacity and length

/** Number memory accessor. */
export interface NumberAccessor {
  /** Gets a value of the underlying type from memory at the specified pointer. */
  get(ptr: number): number;
  /** Sets a value of the underlying type in memory at the specified pointer. */
  set(ptr: number, value: number): void;
}

/** Long memory accessor. */
export interface LongAccessor {
  /** Gets a Long from memory at the specified pointer. */
  get(ptr: number): Long;
  /** Sets a Long in memory at the specified pointer. */
  set(ptr: number, value: Long): void;
}

/** Array memory accessor. */
export interface ArrayAccessor {
  /** Gets an array from memory at the specified pointer and returns its capacity, length and element base pointer. */
  get(ptr: number): { capacity: number, length: number, base: number };
  /** Creates an array in memory and returns its pointer and element base pointer. */
  create(length: number, elementByteSize: number): { ptr: number, base: number };
}

/** String memory accessor. */
export interface StringAccessor {
  /** Gets a string from memory at the specified pointer. */
  get(ptr: number): string;
  /** Creates a string in memory and returns its pointer. */
  create(value: string): number;
}

/** A reference to the underlying memory instance populated with additional utility. */
export interface Memory extends WebAssembly.Memory {

  /** Signed 8-bit integer accessors. */
  sbyte: NumberAccessor;
  /** Signed 8-bit integer accessors. Alias of `sbyte`. */
  s8: NumberAccessor;

  /** Unsigned 8-bit integer accessors. */
  byte: NumberAccessor;
  /** Unsigned 8-bit integer accessors. Alias of `byte`. */
  u8: NumberAccessor;

  /** Signed 16-bit integer accessors. */
  short: NumberAccessor;
  /** Signed 16-bit integer value accessors. Alias of `short`. */
  s16: NumberAccessor;

  /** Unsigned 16-bit integer accessors. */
  ushort: NumberAccessor;
  /** Unsigned 16-bit integer accessors. Alias of `ushort`. */
  u16: NumberAccessor;

  /** Signed 32-bit integer accessors. */
  int: NumberAccessor;
  /** Signed 32-bit integer accessors. Alias of `int`. */
  s32: NumberAccessor;

  /** Unsigned 32-bit integer accessors. */
  uint: NumberAccessor;
  /** Unsigned 32-bit integer accessors. Alias of `uint`. */
  u32: NumberAccessor;

  /** Signed 64-bit integer accessors. */
  long: LongAccessor;
  /** Signed 64-bit integer accessors. Alias of `long`. */
  s64: LongAccessor;

  /** Unsigned 64-bit integer accessors. */
  ulong: LongAccessor;
  /** Unsigned 64-bit integer accessors. Alias of `ulong`. */
  u64: LongAccessor;

  /** 32-bit float accessors. */
  float: NumberAccessor;
  /** 32-bit float accessors. Alias of `float`. */
  f32: NumberAccessor;

  /** 64-bit float accessors. */
  double: NumberAccessor;
  /** 64-bit float accessors. Alias of `double`. */
  f64: NumberAccessor;

  /** Array accessors. */
  array: ArrayAccessor;

  /** String accessors. */
  string: StringAccessor;
}

export interface Imports {
  [key: string]: any;
}

export interface Exports {
  [key: string]: any;
  ready: Promise<Module>;
}

export interface Module {
  imports: Imports;
  exports: Exports;
  memory: Memory;
  log: (type: LogType, message: string) => void;
}

let LongModule: any;
try { LongModule = require("long"); if (typeof LongModule !== "function") LongModule = undefined; } catch (e) {}

/** Initializes a memory instance and adds additional utilities. */
export function initializeMemory(memoryInstance: WebAssembly.Memory, malloc: (n: number) => number, memset: (d: number, i: number, n: number) => number): Memory {
  const memory = <Memory>memoryInstance;
  const buffer = new Uint8Array(memoryInstance.buffer);

  memory.byte = memory.u8 = {
    get: function get_byte(ptr) {
      return buffer[ptr];
    },
    set: function set_byte(ptr, value) {
      buffer[ptr] = value;
    }
  };

  memory.sbyte = memory.s8 = {
    get: function get_sbyte(ptr) {
      return buffer[ptr] << 24 >> 24;
    },
    set: function set_sbyte(ptr, value) {
      buffer[ptr] = value;
    }
  };

  memory.short = memory.s16 = {
    get: function get_short(ptr) {
      return (buffer[ptr    ]
            | buffer[ptr + 1] << 8) << 16 >> 16;
    },
    set: function set_short(ptr, value) {
      buffer[ptr    ] = value       & 255;
      buffer[ptr + 1] = value >>> 8 & 255;
    }
  };

  memory.ushort = memory.u16 = {
    get: function get_ushort(ptr) {
      return buffer[ptr    ]
           | buffer[ptr + 1] << 8;
    },
    set: function set_ushort(ptr, value) {
      buffer[ptr    ] = value       & 255;
      buffer[ptr + 1] = value >>> 8 & 255;
    }
  };

  memory.int = memory.s32 = {
    get: function get_int(ptr) {
      return buffer[ptr    ]
           | buffer[ptr + 1] << 8
           | buffer[ptr + 2] << 16
           | buffer[ptr + 3] << 24;
    },
    set: function set_int(ptr, value) {
      buffer[ptr    ] = value        & 255;
      buffer[ptr + 1] = value >>> 8  & 255;
      buffer[ptr + 2] = value >>> 16 & 255;
      buffer[ptr + 3] = value >>> 24;
    }
  };

  memory.uint = memory.u32 = {
    get: function get_uint(ptr: number): number {
      return (buffer[ptr    ]
            | buffer[ptr + 1] << 8
            | buffer[ptr + 2] << 16
            | buffer[ptr + 3] << 24) >>> 0;
    },
    set: function set_uint(ptr: number, value: number): void {
      buffer[ptr    ] = value        & 255;
      buffer[ptr + 1] = value >>> 8  & 255;
      buffer[ptr + 2] = value >>> 16 & 255;
      buffer[ptr + 3] = value >>> 24;
    }
  };

  function get_long_s(ptr: number, unsigned?: boolean): Long {
    const lo = buffer[ptr    ]
             | buffer[ptr + 1] << 8
             | buffer[ptr + 2] << 16
             | buffer[ptr + 3] << 24;
    const hi = buffer[ptr + 4]
             | buffer[ptr + 5] << 8
             | buffer[ptr + 6] << 16
             | buffer[ptr + 7] << 24;
    return LongModule
      ? LongModule.fromBits(lo, hi, !!unsigned)
      : { low: lo, high: hi, unsigned: !!unsigned };
  }

  function set_long_s(ptr: number, value: Long): void {
    buffer[ptr    ] = value.low         & 255;
    buffer[ptr + 1] = value.low  >>> 8  & 255;
    buffer[ptr + 2] = value.low  >>> 16 & 255;
    buffer[ptr + 3] = value.low  >>> 24;
    buffer[ptr + 4] = value.high        & 255;
    buffer[ptr + 5] = value.high >>> 8  & 255;
    buffer[ptr + 6] = value.high >>> 16 & 255;
    buffer[ptr + 7] = value.high >>> 24;
  }

  memory.long = memory.s64 = {
    get: function get_long(ptr: number) { return get_long_s(ptr, false); },
    set: set_long_s
  };

  memory.ulong = memory.u64 = {
    get: function get_ulong(ptr: number) { return get_long_s(ptr, true); },
    set: set_long_s
  };

  const f64 = new Float64Array([ -0 ]);
  const f32 = new Float32Array(f64.buffer);
  const f8b = new Uint8Array(f64.buffer);
  const fle = f8b[7] === 128;

  memory.float = memory.f32 = {
    get: function get_float(ptr: number): number {
      if (fle) {
        f8b[0] = buffer[ptr    ];
        f8b[1] = buffer[ptr + 1];
        f8b[2] = buffer[ptr + 2];
        f8b[3] = buffer[ptr + 3];
      } else {
        f8b[3] = buffer[ptr    ];
        f8b[2] = buffer[ptr + 1];
        f8b[1] = buffer[ptr + 2];
        f8b[0] = buffer[ptr + 3];
      }
      return f32[0];
    },
    set: function set_float(ptr: number, value: number): void {
      f32[0] = value;
      if (fle) {
        buffer[ptr    ] = f8b[0];
        buffer[ptr + 1] = f8b[1];
        buffer[ptr + 2] = f8b[2];
        buffer[ptr + 3] = f8b[3];
      } else {
        buffer[ptr    ] = f8b[3];
        buffer[ptr + 1] = f8b[2];
        buffer[ptr + 2] = f8b[1];
        buffer[ptr + 3] = f8b[0];
      }
    }
  };

  memory.double = memory.f64 = {
    get: function get_double(ptr: number): number {
      if (fle) {
        f8b[0] = buffer[ptr    ];
        f8b[1] = buffer[ptr + 1];
        f8b[2] = buffer[ptr + 2];
        f8b[3] = buffer[ptr + 3];
        f8b[4] = buffer[ptr + 4];
        f8b[5] = buffer[ptr + 5];
        f8b[6] = buffer[ptr + 6];
        f8b[7] = buffer[ptr + 7];
      } else {
        f8b[7] = buffer[ptr    ];
        f8b[6] = buffer[ptr + 1];
        f8b[5] = buffer[ptr + 2];
        f8b[4] = buffer[ptr + 3];
        f8b[3] = buffer[ptr + 4];
        f8b[2] = buffer[ptr + 5];
        f8b[1] = buffer[ptr + 6];
        f8b[0] = buffer[ptr + 7];
      }
      return f64[0];
    },
    set: function set_double(ptr: number, value: number): void {
      f64[0] = value;
      if (fle) {
        buffer[ptr    ] = f8b[0];
        buffer[ptr + 1] = f8b[1];
        buffer[ptr + 2] = f8b[2];
        buffer[ptr + 3] = f8b[3];
        buffer[ptr + 4] = f8b[4];
        buffer[ptr + 5] = f8b[5];
        buffer[ptr + 6] = f8b[6];
        buffer[ptr + 7] = f8b[7];
      } else {
        buffer[ptr    ] = f8b[7];
        buffer[ptr + 1] = f8b[6];
        buffer[ptr + 2] = f8b[5];
        buffer[ptr + 3] = f8b[4];
        buffer[ptr + 4] = f8b[3];
        buffer[ptr + 5] = f8b[2];
        buffer[ptr + 6] = f8b[1];
        buffer[ptr + 7] = f8b[0];
      }
    }
  };

  memory.array = {
    get: function get_array(ptr) {
      const capacity = memory.int.get(ptr);
      const length = memory.int.get(ptr + 4);
      return {
        capacity: capacity,
        length: length,
        base: ptr + arrayHeaderSize
      };
    },
    create: function create_array(length, elementByteSize) {
      const size = length * elementByteSize;
      const ptr = malloc(arrayHeaderSize + size);
      memory.int.set(ptr, length); // capacity
      memory.int.set(ptr + 4, length); // length
      memset(ptr + arrayHeaderSize, 0, size - arrayHeaderSize);
      return {
        ptr: ptr,
        base: ptr + arrayHeaderSize
      };
    }
  };

  memory.string = {
    get: function get_string(ptr) {
      const capacity = memory.int.get(ptr);
      const length = memory.int.get(ptr + 4);
      const chars = new Array(length);
      for (let i = 0, base = arrayHeaderSize + ptr; i < length; ++i)
        chars[i] = memory.ushort.get(base + (i << 1));
      return String.fromCharCode.apply(String, chars); // TODO: chunking
    },
    create: function create_string(value) {
      const size = value.length << 1;
      const ptr = malloc(arrayHeaderSize + size);
      memory.int.set(ptr, value.length); // capacity
      memory.int.set(ptr + 4, value.length); // length
      memset(ptr + arrayHeaderSize, 0, size - arrayHeaderSize);
      for (let i = 0, base = arrayHeaderSize + ptr; i < value.length; ++i)
        memory.ushort.set(base + (i << 1), value.charCodeAt(i));
      return ptr;
    }
  };

  return memory;
}

/** Options to set up the environment created by {@link load}. */
export interface LoadOptions {
  /** Imported elements. Usually functions. */
  imports?: { [key: string]: any };
  /** Object to populate with exports. Creates a new object if omitted. */
  exports?: { [key: string]: any };
  /** Memory instance to import, if applicable. */
  memory?: WebAssembly.Memory;
}

export function load(file: string | Uint8Array | ArrayBuffer, options?: LoadOptions): Promise<Module> {
  if (!options) options = {};

  const imp = <Imports>(options.imports || {});
  const exp = <Exports>(options.exports || {});
  let   mem = <Memory>(options.memory || null);
  const mod: Module = {
    imports: imp,
    exports: exp,
    memory: <Memory>mem,
    log: (type, message) => {
      let fn: (message: string) => void;
      switch (type) {
        case 1: fn = console.info; break;
        case 2: fn = console.warn; break;
        case 3: fn = console.error; break;
        default: fn = console.log;
      }
      fn(message);
    }
  };

  // initialize imports
  if (!imp.lib) imp.lib = {};
  if (!imp.lib.log) imp.lib.log = (type: LogType, messagePtr: number) => mod.log(type, mem.string.get(messagePtr));
  if (!imp.lib.resize)
    imp.lib.resize = () => {
      initializeMemory(mem, exp.malloc || imp.lib.malloc, exp.memset || imp.lib.memset);
    };

  // initialize exports
  let resolveReady: (value: Module) => void;
  let rejectReady: (reason: Error) => void;
  if (!exp.ready)
    exp.ready = new Promise<Module>((resolve, reject) => {
      resolveReady = resolve;
      rejectReady = reject;
    });

  return (typeof file === "string"
    ? xfetch(file) // transpiles to exports.xfetch, no matter if there's a local 'exports'
      .then(result => result.arrayBuffer())
      .then(buffer => WebAssembly.instantiate(buffer, imp))
    : WebAssembly.instantiate(file, imp)
  )
  .catch(reason => {
    rejectReady(reason);
    return Promise.reject(reason);
  })
  .then(result => {
    for (let keys = Object.keys(result.instance.exports), i = 0; i < keys.length; ++i)
      mod.exports[keys[i]] = result.instance.exports[keys[i]];
    if (mod.exports.memory)
      mem = mod.memory = mod.exports.memory;
    imp.lib.resize();
    resolveReady(mod);
    return Promise.resolve(mod);
  });
}

export { load as default };

let fs: any;

export let xfetch: typeof fetch = typeof fetch === "function" ? fetch : function fetch_node(file): Promise<Response> {
  return new Promise((resolve, reject) => {
    (fs || (fs = eval("equire".replace(/^/, "r"))("fs")))
    .readFile(file, (err: Error, data: Buffer) => {
      return err
        ? reject(err)
        : resolve(<Response><any>{ arrayBuffer: () => new Uint8Array(data).buffer });
    })
  });
};
