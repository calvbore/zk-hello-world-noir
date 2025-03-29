import { useEffect, useState } from "react";
import { AbiParameter, AbiType, InputMap, InputValue } from "@noir-lang/types";
import { CircuitInput } from "./CircuitInput";
import { useCircuitInputParams } from "../../_hooks/useCircuitInputParams";
import { fillInputMap } from "../../_utils/utilsCircuit";
import { displayTxResult } from "~~/app/debug/_components/contract";


type CircuitInputsFormProps = {
  circuitName: string,
  params: AbiParameter[],
  mutateInputs?: (v: any, p: (string | number)[], i: number) => void,
  inputs: InputMap,
  surfaceError: (p: (string | number)[], v: boolean) => void,
};

export const CircuitInputsForm = ({
  circuitName,
  params,
  mutateInputs,
  inputs,
  surfaceError
}: CircuitInputsFormProps) => {

  const inputFields = params.map((param) => {
    return (
      <>
        <div>
          <CircuitInput
            inputParam={param}
            stateMutateFunc={mutateInputs}
            inputs={inputs}
            surfaceError={surfaceError}
          />
        </div>
      </>
    );
  })

  return (
    <>
      {inputFields}
    </>
  );
}