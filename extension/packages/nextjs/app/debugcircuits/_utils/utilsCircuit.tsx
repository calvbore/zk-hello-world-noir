import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, UltraPlonkBackend } from "@aztec/bb.js";
import { AbiParameter, AbiType, InputMap, InputValue } from "@noir-lang/types";
import nargoCircuits from "~~/circuits/nargoCircuits";

function getCircuitNames(): string[] {
  return Object.keys(nargoCircuits);
}

function getCircuitInputParams(name: string): any[] {
  return nargoCircuits[name].abi.parameters;
}

function getCircuitBytecode(name: string): string {
  return nargoCircuits[name].bytecode;
}

// use the returned executable to generate a witness
function getCircuitExecutable(name: string): Noir | undefined {
  const  executable = new Noir(nargoCircuits[name]);
  return executable;
}

// use teh return value to generate a proof
function getCircuitProver(name: string) {
  const  bytecode = getCircuitBytecode(name);
  const  prover   = new UltraPlonkBackend(bytecode);
  return prover;
}

function getCircuitHash(name: string) {
  return nargoCircuits[name].hash;
}

function getCircuitNoirVersion(name: string) {
  return nargoCircuits[name].noir_version;
}

function fillInputMap(
  params: AbiParameter[], 
  oldInputs?: InputMap, 
): InputMap {
  function fillInputItem(
    abiType: AbiType,
    oldInputs?: InputMap,
    path?: (string | number)[],
  ): InputValue {
    let nextPath: (string | number)[] | undefined = path;
    switch (abiType.kind) {
      case "field":
        let f;
        if (oldInputs && path) {
          let obj: any = oldInputs;
          for (let i = 0; i<path?.length; i++) {
            obj = obj?.[path[i]];
          }
          f = obj;
        }
        if (!f || typeof(f) != "number") f = 0;
        return f;
      case "boolean":
        let b;
        if (oldInputs && path) {
          let obj: any = oldInputs;
          for (let i = 0; i<path?.length; i++) {
            obj = obj?.[path[i]];
          }
          b = obj;
        }
        if (!b || typeof(b) != "boolean") b = false;
        return b;
      case "string":
        let str;
        if (oldInputs && path) {
          let obj: any = oldInputs;
          for (let i = 0; i<path?.length; i++) {
            obj = obj?.[path[i]];
          }
          str = obj;
        }
        if (!str || typeof(str) != "string") {
          str = "";
          for (let i = 0; i<abiType.length; i++) {
            str += "*";
          }
        }
        return str;
      case "integer":
        let int;
        if (oldInputs && path) {
          let obj: any = oldInputs;
          for (let i = 0; i<path?.length; i++) {
            obj = obj?.[path[i]];
          }
          int = obj;
        }
        if (!int || typeof(int) != "number") int = 0;
        return int;
      case "array":
        let a: InputValue = [];
        for (let i = 0; i<abiType.length; i++) {          
          if (oldInputs && path) {
            nextPath = [...path, i];
          }
          const m = fillInputItem(abiType.type, oldInputs, nextPath)
          a.push(m);
        }
        return a;
      case "tuple":
        let t: InputValue = abiType.fields.map((child, index) => {   
          if (oldInputs && path) {
            nextPath = [...path, index];
          }       
          return fillInputItem(child, oldInputs, nextPath);
        });
        return t;
      case "struct":
        let s: InputValue = {};
        for (let i = 0; i<abiType.fields.length; i++) {
          if (oldInputs && path) {
            nextPath = [...path, abiType.fields[i].name];
          }   
          s[abiType.fields[i].name] = fillInputItem(abiType.fields[i].type, oldInputs, nextPath);
        }
        return s;
    }
  }
  let emptyInputs: InputMap = {};
  for (let i = 0; i<params.length; i++) {
    let path: (string | number)[] | undefined;
    if (oldInputs) {
      path = [params[i].name];
    }
    emptyInputs[params[i].name] = fillInputItem(
      params[i].type,
      oldInputs,
      path,
    );
  }
  return emptyInputs;
}

export {
  fillInputMap,
  getCircuitNames,
  getCircuitInputParams,
  getCircuitBytecode,
  getCircuitExecutable,
  getCircuitProver,
  getCircuitHash,
  getCircuitNoirVersion,
};