import { InputMap, InputValue, AbiParameter } from "@noir-lang/types";
import { getCircuitExecutable } from "../_utils/utilsCircuit";
import { useEffect, useState } from "react";

type ExecutableReturn = {witness: Uint8Array, returnValue: InputValue} | undefined

export const useCircuitExecutable = (
  name: string,
  inputs: InputMap,
  inputParameters: AbiParameter[],
): [() => void, InputValue | undefined, Uint8Array | undefined] => {

  const [ executable, setExecutable ] = useState(() => getCircuitExecutable(name));
  const [ witness, setWitness ] = useState<Uint8Array>();
  const [ returnValue, setReturnValue ] = useState<InputValue>();

  useEffect(() => {
    setExecutable(() => getCircuitExecutable(name));
    setWitness(undefined);
    setReturnValue(undefined);
  }, [name, inputParameters]);

  useEffect(() => {
    setWitness(undefined);
    setReturnValue(undefined);
  }, [inputs])

  const executeCircuit = async () => {
    const executed = await executable?.execute(inputs);
    setWitness(executed?.witness);
    setReturnValue(executed?.returnValue);
  }

  return [executeCircuit, returnValue, witness];

}