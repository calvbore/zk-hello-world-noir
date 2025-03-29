import { useState, useEffect } from "react";
import { AbiParameter, AbiType, InputMap, InputValue } from "@noir-lang/types";
import { displayTxResult } from "~~/app/debug/_components/contract";
import { useCircuitExecutable } from "../../_hooks/useCircuitExecutable";
import { useCircuitProver } from "../../_hooks/useCircuitProver";
import { CircuitInfoDisplay } from "./CircuitInfoDisplay";
import { notification } from "~~/utils/scaffold-eth";
import { CircuitVerification } from "./CircuitVerification";
import { ProofStatusIcon } from "./ProofStatusIcon";

type CircuitExecutionProps = {
  circuitName: string,
  inputs: InputMap,
  params: AbiParameter[],
  disableExecution: boolean,
}

enum Stage {
  execution, 
  executed,
  proving,
  proved,
  verification,
  verified,
}

export const CircuitExecution = ({
  circuitName,
  inputs,
  params,
  disableExecution,
}: CircuitExecutionProps) => {
  const [executable, returnValue, witness] = useCircuitExecutable(circuitName, inputs, params);
  const [prover, proof, publicInputs, isVerified] = useCircuitProver(circuitName, witness as Uint8Array, params, inputs);

  const [ isLoadingProof, setIsLoadingProof ] = useState<boolean>();

  const [ disableProver, setDisableProver ] = useState<boolean>(true);
  const [ disableVerifier, setDisableVerifier ] = useState<boolean>(true);

  useEffect(() => {
    if (isVerified != undefined) {
      setIsLoadingProof(false);
    }
  }, [isVerified]);

  useEffect(() => {
    setIsLoadingProof(false);
    setDisableProver(true);
    setDisableVerifier(true);
    console.log('change')
  }, [params, inputs])

  return (
    <>
      <div className="mt-2 mb-2 flex gap-2">
        <span>
          <button
            className="btn btn-secondary btn-sm self-end md:self-start mr-1"
            onClick={() => {
              //@ts-ignore
              executable().catch((e: Error) => {
                notification.error(
                  <div className={`flex flex-col ml-1 cursor-default`}>
                    <p className="my-0">{e.message}</p>
                  </div>
                );
              });
              setDisableProver(false);
            }}
            disabled={disableExecution}
          >
            Execute
          </button>
          <button
            className="btn btn-secondary btn-sm self-end md:self-start mr-1"
            onClick={() => {
              setIsLoadingProof(true);
              prover();
              setDisableVerifier(false);
            }}
            disabled={!witness || disableProver}
          >
            Prove
            <ProofStatusIcon
              isLoading={isLoadingProof}
              isValid={isVerified}
            />
          </button>
          <span>
            <CircuitVerification
              publicInputs={publicInputs}
              proof={proof}
              isLoadingProof={isLoadingProof}
              disable={disableVerifier}
            />
          </span>
        </span>
      </div>
      <CircuitInfoDisplay
        title="Inputs"
        object={inputs}
        nullMessage={"inputs not found"}
      />
      <CircuitInfoDisplay
        title="Outputs"
        object={returnValue}
        nullMessage={witness? "no program outputs" : "program has not been executed"}
      />
      <CircuitInfoDisplay
        title="Public Values"
        object={publicInputs}
        nullMessage={proof? "no public values in circuit" : "circuit inputs have not been proved"}
      />
      <CircuitInfoDisplay
        title="Witness"
        object={witness}
        nullMessage={"program has not been executed"}
      />
      <CircuitInfoDisplay
        title="Proof"
        object={proof}
        nullMessage={"circuit inputs have not been proved"}
      />
    </>
  );
}