"use client";

import { useEffect, useState } from "react";
import { useCircuitExecutable } from "../../_hooks/useCircuitExecutable";
import { useCircuitHash } from "../../_hooks/useCircuitHash";
import { useCircuitInputParams } from "../../_hooks/useCircuitInputParams";
import { useCircuitProver } from "../../_hooks/useCircuitProver";
import { fillInputMap, getCircuitHash, getCircuitNoirVersion } from "../../_utils/utilsCircuit";
import { CircuitExecution } from "./CircuitExecution";
import { CircuitInputsForm } from "./CircuitInputsForm";
import { AbiParameter, AbiType, InputMap, InputValue } from "@noir-lang/types";
import { displayTxResult } from "~~/app/debug/_components/contract";

type CircuitUIProps = {
  circuitName: string;
  className?: string;
};

export const CircuitUI = ({ circuitName, className = "" }: CircuitUIProps) => {
  const params: AbiParameter[] = useCircuitInputParams(circuitName);

  const [inputs, setInputs] = useState<InputMap>(() => fillInputMap(params));

  const [inputErrors, setInputErrors] = useState<Record<string, boolean>>({});

  const surfaceError = (path: (string | number)[], value: boolean) => {
    const cloneErrors = structuredClone(inputErrors);
    const key = JSON.stringify(path);

    if (value == false) {
      delete cloneErrors[key];
    } else {
      cloneErrors[key] = value;
    }

    setInputErrors(() => cloneErrors);
  };

  const seeIfError = (): boolean => {
    const keys = Object.keys(inputErrors);
    for (let i = 0; i < keys.length; i++) {
      if (inputErrors[keys[i]]) return true;
    }
    return false;
  };

  const [disableExecution, setDisableExecution] = useState<boolean>(false);

  useEffect(() => {
    const b = seeIfError();
    setDisableExecution(b);
  }, [inputErrors]);

  useEffect(() => {
    setInputs(() => fillInputMap(params, inputs));
    setInputErrors({});
  }, [params]);

  function mutateInputs(v: any, path: (string | number)[], index: number = 0): void {
    const mutateClone = (obj: any, v: any, path: (string | number)[], index: number = 0): any => {
      let objClone = structuredClone(obj);
      if (index == path.length - 1) {
        objClone[path[index]] = v;
      } else {
        objClone[path[index]] = mutateClone(objClone[path[index]], v, path, index + 1);
      }

      return objClone;
    };

    const inputsClone = mutateClone(inputs, v, path);

    setInputs(() => {
      return inputsClone;
    });
  }

  const hash = useCircuitHash(circuitName);
  // const version = getCircuitNoirVersion(circuitName);

  return (
    <>
      <div className={`grid grid-cols-1 lg:grid-cols-6 px-6 lg:px-10 lg:gap-12 w-full max-w-7xl my-0 ${className}`}>
        <div className="col-span-5 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          <div className="col-span-1 flex flex-col">
            <div className="bg-base-100 border-base-300 border shadow-md shadow-secondary rounded-3xl px-6 lg:px-8 mb-6 space-y-1 py-4">
              <div className="flex">
                <div className="flex flex-col gap-1">
                  <span className="font-bold">{circuitName}</span>
                </div>
              </div>
            </div>
            <div className="bg-base-300 rounded-3xl px-6 lg:px-8 py-4 shadow-lg shadow-base-300">
              <span className="font-bold text-sm">Circuit Hash: </span>
              <span className="font-extralight text-xs">{hash}</span>
              {/* <div>
                <span className="font-bold text-sm">Noir Version: </span>
                <span className="font-extralight text-xs">{version}</span>
              </div> */}
            </div>
          </div>
          <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
            <div className="z-10">
              <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
                <div className="h-[5rem] w-[5.5rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] -left-[1px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="my-0 text-sm">Inputs</p>
                  </div>
                </div>
                <div className="p-5 divide-y divide-base-300">
                  <CircuitInputsForm
                    circuitName={circuitName}
                    params={params}
                    mutateInputs={mutateInputs}
                    inputs={inputs}
                    surfaceError={surfaceError}
                  />
                </div>
              </div>
            </div>
            <div className="z-10">
              <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
                <div className="h-[5rem] w-[5.5rem] bg-base-300 absolute self-start rounded-[22px] -top-[38px] -left-[1px] -z-10 py-[0.65rem] shadow-lg shadow-base-300">
                  <div className="flex items-center justify-center space-x-2">
                    <p className="my-0 text-sm">Outputs</p>
                  </div>
                </div>
                <div className="p-5 divide-y divide-base-300">
                  <CircuitExecution
                    circuitName={circuitName}
                    inputs={inputs}
                    params={params}
                    disableExecution={disableExecution}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
