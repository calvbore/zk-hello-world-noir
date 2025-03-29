import { useState, useEffect } from "react";
import { InputMap, AbiParameter, ProofData } from "@noir-lang/types";
import { getCircuitProver } from "../_utils/utilsCircuit";

export const useCircuitProver = (
  name: string,
  witness: Uint8Array,
  inputParameters: AbiParameter[],
  inputs?: InputMap,
): [() => void, Uint8Array?, string[]?, boolean?, any?] => {
  const [ backend, setBackend ] = useState(() => getCircuitProver(name));
  const [ proof, setProof ] = useState<Uint8Array>();
  const [ publicInputs, setPublicInputs ] = useState<string[]>();
  const [ recursiveArtifacts, setRecursiveArtifacts ] = useState<any>();
  const [ isVerified, setIsVerified ] = useState<boolean>();

  useEffect(() => {
    setBackend(() => getCircuitProver(name));
    setProof(undefined);
    setPublicInputs(undefined);
    setRecursiveArtifacts(undefined);
    setIsVerified(undefined)
  }, [name, inputParameters,]);

  useEffect(() => {
    setProof(undefined);
    setPublicInputs(undefined);
    setRecursiveArtifacts(undefined);
    setIsVerified(undefined)
  }, [witness, inputs]);

  const proveCircuit = async () => {
    setIsVerified(undefined)
    const p: ProofData = await backend.generateProof(witness);
    setProof(p?.proof);
    setPublicInputs(p?.publicInputs);
    console.log(p?.publicInputs);
    // const r = await backend.generateRecursiveProofArtifacts(p);
    // setRecursiveArtifacts(r);
    const v = await backend.verifyProof(p);
    console.log(v);
    setIsVerified(v);
  }

  return [proveCircuit, proof, publicInputs, isVerified, recursiveArtifacts]
}