import * as fs from "fs";
import * as tape from "tape";
import * as loader from "..";

const moduleFile = __dirname + "/assembly/module.wasm";
const moduleBlob = fs.readFileSync(moduleFile);

tape("load - file", test => {
  loader.load(moduleFile)
  .catch(err => {
    test.fail("should not be rejected");
    test.end();
  })
  .then((mod: loader.Module) => {
    test.ok(mod, "should resolve");
    test.ok(mod.exports, "should expose exports");
    test.ok(typeof mod.exports.add === "function", "should expose exports.add");
    test.strictEqual(mod.exports.add(1, 2), 3, "should calculate 1 + 2 = 3");
    test.end();
  });
});

tape("load - blob", test => {
  loader.load(moduleBlob)
  .catch(err => {
    test.fail("should not be rejected");
    test.end();
  })
  .then((mod: loader.Module) => {
    test.ok(mod, "should resolve");
    test.ok(mod.exports, "should expose exports");
    test.ok(typeof mod.exports.add === "function", "should expose exports.add");
    test.strictEqual(mod.exports.add(1, 2), 3, "should calculate 1 + 2 = 3");
    test.end();
  });
});

tape("ready - file", test => {
  let exports: any = {};
  loader.load(moduleFile, { exports: exports });
  exports.ready.catch(err => {
    test.fail("should not be rejected");
    test.end();
  }).then((mod: loader.Module) => {
    test.ok(mod, "should resolve");
    test.strictEqual(mod.exports, exports, "should populate provided exports");
    test.ok(mod.exports, "should expose exports");
    test.ok(typeof mod.exports.add === "function", "should expose exports.add");
    test.strictEqual(mod.exports.add(1, 2), 3, "should calculate 1 + 2 = 3");
    test.end();
  });
});

tape("ready - blob", test => {
  let exports: any = {};
  loader.load(moduleBlob, { exports: exports });
  exports.ready.catch(err => {
    test.fail("should not be rejected");
    test.end();
  }).then((mod: loader.Module) => {
    test.ok(mod, "should resolve");
    test.strictEqual(mod.exports, exports, "should populate provided exports");
    test.ok(mod.exports, "should expose exports");
    test.ok(typeof mod.exports.add === "function", "should expose exports.add");
    test.strictEqual(mod.exports.add(1, 2), 3, "should calculate 1 + 2 = 3");
    test.end();
  });
});

// TODO:
// - check imports
// - check imported memory
// - maybe check accessors (extensively used and thus checked in the main repo already)
