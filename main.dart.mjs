// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(
      await WebAssembly.compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string']};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      AE: x0 => globalThis.parseFloat(x0),
      AF: x0 => x0.touches,
      AG: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      AH: x0 => x0.minWidth,
      AI: x0 => x0.deref(),
      AJ: (x0,x1,x2,x3) => x0.removeEventListener(x1,x2,x3),
      AK: (x0,x1) => x0.get(x1),
      AL: (x0,x1) => { x0.position = x1 },
      AM: (x0,x1) => { x0.disabled = x1 },
      AN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: x0 => x0.tabIndex,
      BE: (x0,x1) => x0.getComputedStyle(x1),
      BF: x0 => x0.pressure,
      BG: x0 => x0.v8BreakIterator,
      BH: (x0,x1) => x0.removeProperty(x1),
      BI: () => globalThis.WeakRef,
      BJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      BK: x0 => x0.body,
      BL: (x0,x1) => { x0.srcdoc = x1 },
      BM: (x0,x1) => { x0.scrollLeft = x1 },
      BN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: (x0,x1) => x0.contains(x1),
      CE: x0 => x0.documentElement,
      CF: x0 => x0.tiltY,
      CG: () => globalThis.Intl,
      CH: (x0,x1) => x0.add(x1),
      CI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      CJ: x0 => x0.withCredentials,
      CK: x0 => x0.headers,
      CL: (x0,x1) => { x0.title = x1 },
      CM: (x0,x1) => { x0.spellcheck = x1 },
      CN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: x0 => x0.activeElement,
      DE: x0 => x0.computedStyleMap(),
      DF: x0 => x0.tiltX,
      DG: (x0,x1) => x0.segment(x1),
      DH: x0 => x0.data,
      DI: (a, s, e) => a.slice(s, e),
      DJ: (x0,x1) => { x0.timeout = x1 },
      DK: (x0,x1) => x0.getRandomValues(x1),
      DL: (x0,x1,x2) => x0.transaction(x1,x2),
      DM: (x0,x1) => { x0.disabled = x1 },
      DN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: x0 => x0.parentNode,
      EE: (x0,x1) => x0.get(x1),
      EF: x0 => x0.pointerType,
      EG: x0 => x0.index,
      EH: (x0,x1) => { x0.scrollTop = x1 },
      EI: (x0,x1,x2,x3) => x0.call(x1,x2,x3),
      EJ: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      EK: () => globalThis.crypto,
      EL: (x0,x1) => x0.objectStore(x1),
      EM: (x0,x1) => x0.removeAttribute(x1),
      EN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.tagName,
      FE: (o, p) => p in o,
      FF: x0 => x0.pointerId,
      FG: x0 => x0.next(),
      FH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      FI: () => globalThis.__colliderAmbient,
      FJ: (x0,x1) => { x0.withCredentials = x1 },
      FK: l => new DataView(new ArrayBuffer(l)),
      FL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      FM: x0 => x0.load(),
      FN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.target,
      GE: (x0,x1) => { x0.textContent = x1 },
      GF: x0 => x0.getCoalescedEvents(),
      GG: x0 => x0.value,
      GH: (x0,x1) => { x0.value = x1 },
      GI: (o, p, v) => o[p] = v,
      GJ: (x0,x1) => { x0.responseType = x1 },
      GK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GM: (x0,x1) => x0.transferFromImageBitmap(x1),
      GN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: x0 => x0.clientY,
      HE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      HF: (x0,x1) => x0.getModifierState(x1),
      HG: x0 => x0.done,
      HH: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      HI: (x0,x1) => x0.append(x1),
      HJ: (a, l) => a.length = l,
      HK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      HL: (x0,x1) => { x0.onerror = x1 },
      HM: (x0,x1) => x0.getContext(x1),
      HN: x0 => x0.src,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: x0 => x0.clientX,
      IE: x0 => x0.matches,
      IF: s => s.trimLeft(),
      IG: (o, m, a) => o[m].apply(o, a),
      IH: (x0,x1) => { x0.value = x1 },
      II: x0 => x0.head,
      IJ: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      IK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      IL: (x0,x1) => { x0.onsuccess = x1 },
      IM: (x0,x1) => { x0.height = x1 },
      IN: (x0,x1) => x0.setSinkId(x1),
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      JE: (x0,x1) => x0.matchMedia(x1),
      JF: (x0,x1) => x0[x1],
      JG: x0 => x0.iterator,
      JH: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      JI: () => globalThis.document,
      JJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      JK: (x0,x1) => x0.removeChild(x1),
      JL: x0 => x0.result,
      JM: (x0,x1) => { x0.width = x1 },
      JN: (x0,x1) => x0.querySelector(x1),
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: x0 => x0.getBoundingClientRect(),
      KE: x0 => x0.matches,
      KF: x0 => x0.index,
      KG: () => globalThis.Symbol,
      KH: x0 => x0.value,
      KI: (x0,x1) => { x0.text = x1 },
      KJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      KK: x0 => x0.click(),
      KL: (x0,x1,x2) => x0.open(x1,x2),
      KM: x0 => x0.height,
      KN: x0 => x0.href,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      LE: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      LF: s => s.toUpperCase(),
      LG: (x0,x1) => new Intl.Segmenter(x0,x1),
      LH: x0 => x0.selectionDirection,
      LI: (x0,x1) => x0.createElement(x1),
      LJ: x0 => x0.play(),
      LK: (o, a) => o + a,
      LL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      LM: x0 => x0.width,
      LN: x0 => x0.location,
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      ME: f => f.dartFunction,
      MF: x0 => x0.pop(),
      MG: x0 => x0.Segmenter,
      MH: x0 => x0.selectionStart,
      MI: x0 => x0.firstElementChild,
      MJ: (x0,x1) => { x0.src = x1 },
      MK: x0 => x0.children,
      ML: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MM: x0 => x0.rasterEndMilliseconds,
      MN: x0 => x0.length,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: Date.now,
      NE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NF: x0 => x0.flags,
      NG: x0 => x0.buffer,
      NH: x0 => x0.selectionEnd,
      NI: (x0,x1) => { x0.background = x1 },
      NJ: x0 => x0.pause(),
      NK: x0 => x0.firstChild,
      NL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NM: x0 => x0.rasterStartMilliseconds,
      NN: x0 => x0.getReader(),
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (handle) => clearTimeout(handle),
      OE: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      OF: (a, s) => a.join(s),
      OG: x0 => x0.wasmMemory,
      OH: x0 => x0.value,
      OI: (x0,x1) => { x0.height = x1 },
      OJ: (x0,x1) => x0.revokeObjectURL(x1),
      OK: () => globalThis.window,
      OL: (x0,x1) => { x0.onupgradeneeded = x1 },
      OM: x0 => x0.imageBitmaps,
      ON: x0 => x0.value,
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: (x0,x1) => x0.closest(x1),
      PE: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      PF: (x0,x1) => x0.error(x1),
      PG: () => globalThis.window._flutter_skwasmInstance,
      PH: x0 => x0.selectionDirection,
      PI: (x0,x1) => { x0.width = x1 },
      PJ: (x0,x1) => { x0.src = x1 },
      PK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PL: (x0,x1) => x0.contains(x1),
      PM: x0 => x0.canvasKitMaximumSurfaces,
      PN: x0 => x0.done,
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: x0 => x0.bottom,
      QE: (o, i) => o[i],
      QF: () => globalThis.console,
      QG: () => new TextDecoder(),
      QH: x0 => x0.selectionStart,
      QI: (x0,x1) => { x0.border = x1 },
      QJ: (x0,x1,x2,x3,x4) => globalThis.createImageBitmap(x0,x1,x2,x3,x4),
      QK: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      QL: (x0,x1) => x0.createObjectStore(x1),
      QM: x0 => x0.nextSibling,
      QN: x0 => x0.read(),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: x0 => x0.top,
      RE: o => o.length,
      RF: s => s.trimRight(),
      RG: (a, i) => a.splice(i, 1),
      RH: x0 => x0.selectionEnd,
      RI: x0 => x0.style,
      RJ: x0 => x0.naturalHeight,
      RK: (x0,x1) => x0.item(x1),
      RL: x0 => x0.objectStoreNames,
      RM: (x0,x1) => x0.debug(x1),
      RN: (x0,x1) => new OffscreenCanvas(x0,x1),
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: x0 => x0.right,
      SE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      SF: x0 => x0.blur(),
      SG: a => a.pop(),
      SH: x0 => x0.keyCode,
      SI: (x0,x1) => { x0.src = x1 },
      SJ: x0 => x0.naturalWidth,
      SK: () => new FileReader(),
      SL: x0 => x0.indexedDB,
      SM: x0 => x0.hostElement,
      SN: x0 => x0.assetBase,
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (x0,x1) => x0.exec(x1),
      TD: x0 => x0.left,
      TE: x0 => x0.language,
      TF: x0 => x0.button,
      TG: (map, o, v) => map.set(o, v),
      TH: (x0,x1) => x0.scrollIntoView(x1),
      TI: () => new AbortController(),
      TJ: x0 => x0.decode(),
      TK: (x0,x1) => x0.readAsArrayBuffer(x1),
      TL: x0 => x0.getAllKeys(),
      TM: x0 => x0.location,
      TN: x0 => x0.loader,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: x0 => x0.length,
      UD: x0 => x0.clientY,
      UE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      UF: x0 => x0.innerHeight,
      UG: (map, o) => map.get(o),
      UH: x0 => x0.multiViewEnabled,
      UI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      UJ: (x0,x1) => { x0.decoding = x1 },
      UK: x0 => ({type: x0}),
      UL: (x0,x1) => x0.delete(x1),
      UM: (x0,x1) => x0.getModifierState(x1),
      UN: () => globalThis._flutter,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (x0,x1) => { x0.lastIndex = x1 },
      VD: x0 => x0.clientX,
      VE: () => globalThis.window.FinalizationRegistry,
      VF: x0 => x0.innerWidth,
      VG: () => new WeakMap(),
      VH: (x0,x1) => x0.replaceWith(x1),
      VI: (x0,x1) => globalThis.fetch(x0,x1),
      VJ: (x0,x1) => { x0.crossOrigin = x1 },
      VK: (x0,x1) => new Blob(x0,x1),
      VL: (x0,x1) => x0.get(x1),
      VM: x0 => x0.metaKey,
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      WD: x0 => x0.changedTouches,
      WE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      WF: x0 => x0.height,
      WG: x0 => x0.debugSkipFontRetryDelay,
      WH: (x0,x1) => { x0.type = x1 },
      WI: (x0,x1) => x0.get(x1),
      WJ: (x0,x1) => x0.createObjectURL(x1),
      WK: x0 => globalThis.URL.createObjectURL(x0),
      WL: (x0,x1,x2) => x0.open(x1,x2),
      WM: x0 => x0.altKey,
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: o => o instanceof RegExp,
      XD: x0 => x0.offsetY,
      XE: x0 => new window.FinalizationRegistry(x0),
      XF: x0 => x0.width,
      XG: x0 => x0.status,
      XH: (x0,x1) => { x0.className = x1 },
      XI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      XJ: x0 => x0.URL,
      XK: x0 => x0.size,
      XL: x0 => x0.remove(),
      XM: x0 => x0.ctrlKey,
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: (string, times) => string.repeat(times),
      YD: x0 => x0.offsetX,
      YE: (x0,x1) => x0.unregister(x1),
      YF: x0 => x0.clientHeight,
      YG: (x0,x1,x2) => x0.set(x1,x2),
      YH: (x0,x1) => { x0.tabIndex = x1 },
      YI: (x0,x1) => x0.forEach(x1),
      YJ: x0 => new Blob(x0),
      YK: x0 => x0.name,
      YL: x0 => globalThis.URL.revokeObjectURL(x0),
      YM: x0 => x0.isComposing,
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.dotAll,
      ZD: x0 => x0.type,
      ZE: (x0,x1) => x0.contains(x1),
      ZF: x0 => x0.clientWidth,
      ZG: x0 => x0.arrayBuffer(),
      ZH: (x0,x1) => { x0.name = x1 },
      ZI: x0 => x0.name,
      ZJ: x0 => x0.close(),
      ZK: x0 => x0.type,
      ZL: x0 => x0.body,
      ZM: x0 => x0.code,
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: x0 => x0.unicode,
      aD: x0 => x0.maxTouchPoints,
      aE: (s) => +s,
      aF: (x0,x1) => { x0.content = x1 },
      aG: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      aH: (x0,x1) => { x0.placeholder = x1 },
      aI: x0 => x0.statusText,
      aJ: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      aK: x0 => x0.result,
      aL: (x0,x1) => { x0.download = x1 },
      aM: x0 => x0.repeat,
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: x0 => x0.ignoreCase,
      bD: x0 => x0.platform,
      bE: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      bF: (x0,x1) => { x0.name = x1 },
      bG: (x0,x1) => x0.fetch(x1),
      bH: (x0,x1) => { x0.autocomplete = x1 },
      bI: x0 => x0.url,
      bJ: (x0,x1) => x0.decode(x1),
      bK: x0 => x0.length,
      bL: (x0,x1) => { x0.href = x1 },
      bM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.multiline,
      cD: x0 => x0.body,
      cE: s => s.trim(),
      cF: x0 => x0.head,
      cG: x0 => x0.fontFallbackBaseUrl,
      cH: (x0,x1) => { x0.name = x1 },
      cI: x0 => x0.status,
      cJ: x0 => x0.displayHeight,
      cK: x0 => x0.files,
      cL: (x0,x1,x2) => x0.put(x1,x2),
      cM: x0 => x0.message,
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (string, token) => string.split(token),
      dD: () => globalThis.document,
      dE: x0 => x0.classList,
      dF: (x0,x1) => x0.removeChild(x1),
      dG: (handle) => clearInterval(handle),
      dH: (x0,x1) => { x0.placeholder = x1 },
      dI: x0 => x0.getReader(),
      dJ: x0 => x0.displayWidth,
      dK: (x0,x1) => { x0.display = x1 },
      dL: x0 => x0.videoHeight,
      dM: x0 => x0.code,
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: o => o instanceof Array,
      eD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      eE: x0 => x0.preventDefault(),
      eF: x0 => x0.firstChild,
      eG: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      eH: (x0,x1) => { x0.action = x1 },
      eI: x0 => x0.read(),
      eJ: x0 => x0.duration,
      eK: (x0,x1) => { x0.accept = x1 },
      eL: x0 => x0.videoWidth,
      eM: x0 => x0.error,
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (a, i) => a[i],
      fD: x0 => x0.hasFocus(),
      fE: x0 => x0.parent,
      fF: x0 => x0.viewConstraints,
      fG: () => Date.now(),
      fH: (x0,x1) => { x0.method = x1 },
      fI: x0 => x0.value,
      fJ: x0 => x0.image,
      fK: (x0,x1) => { x0.multiple = x1 },
      fL: x0 => x0.readyState,
      fM: (x0,x1) => x0.start(x1),
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: a => a.length,
      gD: x0 => x0.relatedTarget,
      gE: x0 => x0.timeStamp,
      gF: x0 => x0.hostElement,
      gG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      gH: (x0,x1) => { x0.noValidate = x1 },
      gI: x0 => x0.done,
      gJ: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      gK: (x0,x1) => { x0.draggable = x1 },
      gL: (x0,x1) => { x0.zIndex = x1 },
      gM: (x0,x1) => x0.end(x1),
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: (x0,x1) => x0.test(x1),
      hD: x0 => x0.shiftKey,
      hE: (x0,x1) => x0.hasAttribute(x1),
      hF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      hG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      hH: (x0,x1) => x0.removeAttribute(x1),
      hI: x0 => x0.cancel(),
      hJ: x0 => new window.ImageDecoder(x0),
      hK: (x0,x1) => { x0.type = x1 },
      hL: (x0,x1) => { x0.pointerEvents = x1 },
      hM: x0 => x0.length,
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: x0 => x0.userAgent,
      iD: (decoder, codeUnits) => decoder.decode(codeUnits),
      iE: x0 => x0.buttons,
      iF: x0 => ({runApp: x0}),
      iG: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      iH: x0 => x0.isConnected,
      iI: x0 => x0.body,
      iJ: x0 => x0.name,
      iK: x0 => x0.decode(),
      iL: (x0,x1) => { x0.opacity = x1 },
      iM: x0 => x0.buffered,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: x0 => x0.navigator,
      jD: () => new TextDecoder("utf-8", {fatal: true}),
      jE: x0 => x0.ctrlKey,
      jF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      jG: x0 => x0.history,
      jH: x0 => x0.click(),
      jI: x0 => x0.headers,
      jJ: x0 => x0.repetitionCount,
      jK: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      jL: (x0,x1) => { x0.top = x1 },
      jM: x0 => x0.duration,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: Function.prototype.call.bind(String.prototype.toLowerCase),
      kD: () => new TextDecoder("utf-8", {fatal: false}),
      kE: x0 => x0.y,
      kF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      kG: x0 => x0.search,
      kH: (x0,x1) => x0.getElementsByClassName(x1),
      kI: x0 => x0.signal,
      kJ: x0 => x0.frameCount,
      kK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      kL: (x0,x1) => { x0.left = x1 },
      kM: (x0,x1) => { x0.controls = x1 },
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: Object.is,
      lD: (a, i, v) => a[i] = v,
      lE: x0 => x0.x,
      lF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      lG: x0 => x0.location,
      lH: (x0,x1) => x0.dispatchEvent(x1),
      lI: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      lJ: x0 => x0.selectedTrack,
      lK: (x0,x1,x2) => x0.addEventListener(x1,x2),
      lL: (x0,x1) => { x0.preload = x1 },
      lM: (x0,x1) => { x0.id = x1 },
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: x0 => x0.vendor,
      mD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      mE: x0 => x0.scrollTop,
      mF: () => typeof dartUseDateNowForTicks !== "undefined",
      mG: x0 => x0.pathname,
      mH: (x0,x1) => x0.createEvent(x1),
      mI: () => new XMLHttpRequest(),
      mJ: x0 => x0.completed,
      mK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      mL: (x0,x1) => { x0.crossOrigin = x1 },
      mM: (x0,x1) => { x0.volume = x1 },
      n: (x0,x1) => x0.prepend(x1),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: (x0,x1) => x0.createTextNode(x1),
      nD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      nE: x0 => x0.offsetTop,
      nF: () => Date.now(),
      nG: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      nH: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      nI: (x0,x1,x2) => x0.open(x1,x2),
      nJ: x0 => x0.ready,
      nK: x0 => x0.send(),
      nL: (x0,x1) => { x0.playsInline = x1 },
      nM: (x0,x1) => { x0.currentTime = x1 },
      o: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: (x0,x1) => { x0.id = x1 },
      oD: x0 => x0.visibilityState,
      oE: x0 => x0.scrollLeft,
      oF: () => 1000 * performance.now(),
      oG: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      oH: x0 => x0.readText(),
      oI: (x0,x1) => x0.send(x1),
      oJ: x0 => x0.tracks,
      oK: x0 => x0.status,
      oL: (x0,x1) => { x0.autoplay = x1 },
      oM: x0 => x0.currentTime,
      p: b => !!b,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: (x0,x1) => { x0.nonce = x1 },
      pD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      pE: x0 => x0.offsetLeft,
      pF: (x0,x1) => x0.requestAnimationFrame(x1),
      pG: o => Object.keys(o),
      pH: x0 => x0.clipboard,
      pI: x0 => x0.send(),
      pJ: () => globalThis.window.ImageDecoder,
      pK: x0 => x0.response,
      pL: (x0,x1) => { x0.loop = x1 },
      pM: (x0,x1) => { x0.playbackRate = x1 },
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: x0 => x0.nonce,
      qD: x0 => x0.disconnect(),
      qE: x0 => x0.offsetParent,
      qF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qG: x0 => x0.state,
      qH: (x0,x1) => x0.writeText(x1),
      qI: x0 => x0.abort(),
      qJ: x0 => x0.naturalHeight,
      qK: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      qL: (x0,x1) => { x0.defaultMuted = x1 },
      qM: x0 => x0.message,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: () => globalThis.window.flutterConfiguration,
      rD: x0 => new Intl.Locale(x0),
      rE: (o, p, r) => o.replace(p, () => r),
      rF: x0 => x0.now(),
      rG: x0 => x0.hash,
      rH: x0 => x0.unlock(),
      rI: x0 => x0.upload,
      rJ: x0 => x0.naturalWidth,
      rK: (x0,x1) => { x0.responseType = x1 },
      rL: (x0,x1) => { x0.muted = x1 },
      rM: x0 => x0.userAgent,
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: (x0,x1) => x0.attachShadow(x1),
      sD: x0 => x0.region,
      sE: (o, p, r) => o.replaceAll(p, () => r),
      sF: x0 => x0.performance,
      sG: x0 => x0.state,
      sH: (x0,x1) => x0.lock(x1),
      sI: x0 => x0.readyState,
      sJ: (x0,x1) => x0.createElement(x1),
      sK: () => new XMLHttpRequest(),
      sL: (x0,x1,x2) => x0.insertBefore(x1,x2),
      sM: x0 => x0.navigator,
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: (x0,x1) => x0.createElement(x1),
      tD: x0 => x0.script,
      tE: x0 => x0.deltaMode,
      tF: x0 => new Uint8Array(x0),
      tG: (x0,x1) => x0.go(x1),
      tH: x0 => x0.orientation,
      tI: x0 => x0.responseURL,
      tJ: (x0,x1) => { x0.pointerEvents = x1 },
      tK: (x0,x1,x2) => x0.postMessage(x1,x2),
      tL: x0 => x0.id,
      tM: (x0,x1,x2) => x0.setItem(x1,x2),
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.scale,
      uD: x0 => x0.language,
      uE: x0 => x0.deltaY,
      uF: (x0,x1,x2) => x0.slice(x1,x2),
      uG: x0 => x0.parentElement,
      uH: (x0,x1) => x0.querySelector(x1),
      uI: x0 => x0.statusText,
      uJ: (x0,x1) => { x0.height = x1 },
      uK: x0 => x0.contentWindow,
      uL: x0 => x0.offsetHeight,
      uM: x0 => x0.localStorage,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.visualViewport,
      vD: x0 => x0.languages,
      vE: x0 => x0.deltaX,
      vF: (x0,x1) => x0.decode(x1),
      vG: (x0,x1) => x0.querySelectorAll(x1),
      vH: (x0,x1) => { x0.title = x1 },
      vI: x0 => x0.getAllResponseHeaders(),
      vJ: (x0,x1) => { x0.width = x1 },
      vK: (x0,x1,x2) => x0.setAttribute(x1,x2),
      vL: x0 => x0.offsetWidth,
      vM: (x0,x1) => x0.getItem(x1),
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.devicePixelRatio,
      wD: (x0,x1) => x0.observe(x1),
      wE: x0 => x0.wheelDeltaY,
      wF: (x0,x1) => x0.adoptText(x1),
      wG: (d, digits) => d.toFixed(digits),
      wH: (x0,x1) => x0.vibrate(x1),
      wI: x0 => x0.status,
      wJ: x0 => x0.style,
      wK: (x0,x1,x2) => x0.setProperty(x1,x2),
      wL: x0 => x0.stopPropagation(),
      wM: (x0,x1) => x0.key(x1),
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.height,
      xD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      xE: x0 => x0.wheelDeltaX,
      xF: x0 => x0.first(),
      xG: x0 => x0.maxHeight,
      xH: x0 => x0.content,
      xI: x0 => x0.response,
      xJ: (x0,x1) => { x0.src = x1 },
      xK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xL: x0 => x0.disabled,
      xM: x0 => x0.length,
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.width,
      yD: x0 => new ResizeObserver(x0),
      yE: x0 => x0.key,
      yF: x0 => x0.next(),
      yG: x0 => x0.maxWidth,
      yH: x0 => x0.document,
      yI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      yJ: () => globalThis.document,
      yK: x0 => x0.data,
      yL: (x0,x1) => { x0.min = x1 },
      yM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.screen,
      zD: (x0,x1) => x0.getPropertyValue(x1),
      zE: x0 => x0.identifier,
      zF: x0 => x0.current(),
      zG: x0 => x0.minHeight,
      zH: x0 => new WeakRef(x0),
      zI: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      zJ: x0 => x0.src,
      zK: (x0,x1) => { x0.backgroundColor = x1 },
      zL: (x0,x1) => { x0.max = x1 },
      zM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    const jsStringPolyfill = {
      "charCodeAt": (s, i) => s.charCodeAt(i),
      "compare": (s1, s2) => {
        if (s1 < s2) return -1;
        if (s1 > s2) return 1;
        return 0;
      },
      "concat": (s1, s2) => s1 + s2,
      "equals": (s1, s2) => s1 === s2,
      "fromCharCode": (i) => String.fromCharCode(i),
      "length": (s) => s.length,
      "substring": (s, a, b) => s.substring(a, b),
      "fromCharCodeArray": (a, start, end) => {
        if (end <= start) return '';

        const read = dartInstance.exports.$wasmI16ArrayGet;
        let result = '';
        let index = start;
        const chunkLength = Math.min(end - index, 500);
        let array = new Array(chunkLength);
        while (index < end) {
          const newChunkLength = Math.min(end - index, 500);
          for (let i = 0; i < newChunkLength; i++) {
            array[i] = read(a, index++);
          }
          if (newChunkLength < chunkLength) {
            array = array.slice(0, newChunkLength);
          }
          result += String.fromCharCode(...array);
        }
        return result;
      },
      "intoCharCodeArray": (s, a, start) => {
        if (s === '') return 0;

        const write = dartInstance.exports.$wasmI16ArraySet;
        for (var i = 0; i < s.length; ++i) {
          write(a, start++, s.charCodeAt(i));
        }
        return s.length;
      },
      "test": (s) => typeof s == "string",
    };


    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
      "wasm:js-string": jsStringPolyfill,
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
