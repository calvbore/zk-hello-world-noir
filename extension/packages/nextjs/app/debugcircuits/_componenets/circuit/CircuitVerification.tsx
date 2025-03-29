import { useState, useEffect,useMemo } from "react";
import { 
  useScaffoldContract,
  useTransactor,
} from "~~/hooks/scaffold-eth";
import { useAllContracts } from "~~/utils/scaffold-eth/contractsData";
import { ContractName, ContractAbi } from "~~/utils/scaffold-eth/contract";
import { notification } from "~~/utils/scaffold-eth";
import { useWalletClient } from "wagmi";
import { ProofStatusIcon } from "./ProofStatusIcon";

type CircuitVerificationProps = {
  publicInputs?: string[],
  proof?: Uint8Array,
  isLoadingProof?: boolean,
  disable?: boolean,
}

function uint8ArrayToHexString(buffer: Uint8Array): string {
  const hex: string[] = [];

  buffer.forEach(function (i) {
    let h = i.toString(16);
    if (h.length % 2) {
      h = '0' + h;
    }
    hex.push(h);
  });

  return '0x' + hex.join('');
}

export const CircuitVerification = ({
  publicInputs,
  proof,
  isLoadingProof,
  disable,
}: CircuitVerificationProps) => {
  const contractsData = useAllContracts();
  const contractNames = useMemo(
    () =>
      Object.keys(contractsData).sort((a, b) => {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
      }) as ContractName[],
    [contractsData],
  );

  const [ selectedContract, setSelectedContract ] = useState<ContractName>(contractNames[0]);
  const [ selectedFunction, setSelectedFunction ] = useState<string>("");

  const [ readWrite, setReadWrite ] = useState<"read" | "write" | "simulate">("simulate");

  const [ callSuccess, setCallSuccess ] = useState<boolean>();
  const [ isLoading , setIsLoading ] = useState<boolean>(false);

  useEffect(() => {
    if (callSuccess != undefined) {
      setIsLoading(false);
    }
  }, [callSuccess]);

  useEffect(() => {
    setCallSuccess(undefined);
  }, [selectedFunction, selectedContract, proof])

  const transactor = useTransactor();

  const { data: walletClient } = useWalletClient();
  const { data: callableContract } = useScaffoldContract({
    contractName: selectedContract,
    walletClient,
  },);

  return (
    <>
      <span>
        <button
          className="btn btn-secondary btn-sm self-end md:self-start mr-1"
          onClick={async () => {
            setIsLoading(true);
            setCallSuccess(undefined);
            let g;
            // proof[97] = 6;
            if (readWrite == "read") {
              //@ts-ignore
              g = await callableContract?.[readWrite][selectedFunction](
                [uint8ArrayToHexString(proof as Uint8Array), publicInputs]
              ).catch((e: Error) => {
                setCallSuccess(false);
                notification.error(
                  <div className={`flex flex-col ml-1 cursor-default`}>
                    <p className="my-0">{e.message}</p>
                  </div>
                );
              });
            }
            if (readWrite == "write") {
            await transactor(
              //@ts-expect-error
              () => callableContract?.[readWrite][selectedFunction](
                [uint8ArrayToHexString(proof as Uint8Array), publicInputs]
              )
            ).then((result) => {g = result}, () => {g = false});
            }

            if (g) {
              setCallSuccess(true);
            } else {
              setCallSuccess(false);
            }
            console.log("result: ", g);
          }}
          disabled={!publicInputs || !proof || !selectedContract || !selectedFunction || isLoadingProof || disable}
        >
          Submit
          <ProofStatusIcon
            isLoading={isLoading}
            isValid={callSuccess}
          />
        </button>
        <select defaultValue="Pick a color" className="select select-xs select-secondary mr-1">
          <option disabled={true}>Pick a contract</option>
          {contractNames.map((name) => {return (
            <option onClick={() => {setSelectedContract(name)}}>{name}</option>
          )})}
        </select>
        <select defaultValue="Pick a color" className="select select-xs select-secondary">
          <option disabled={true}>Pick a function</option>
          {contractsData[selectedContract]?.abi.map((func) => {
            if (func.type == "function") {
              return (
                <option onClick={() => {
                  if (func.stateMutability == "view" || func.stateMutability == "pure") {
                    setReadWrite("read");
                  } else {
                    setReadWrite("write");
                  }
                  setSelectedFunction(func.name)
                }}>{func.name}</option>
              )
            }
          })}
        </select>
      </span>
    </>
  )
}