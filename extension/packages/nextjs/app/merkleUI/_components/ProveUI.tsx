"use client";

import { useEffect, useState } from "react";
import { InputMap } from "@noir-lang/types";
import { LeanIMT } from "@zk-kit/lean-imt";
import { poseidon2 } from "poseidon-lite";
import { useWalletClient } from "wagmi";
import { CircuitInfoDisplay } from "~~/app/debugcircuits/_componenets/circuit";
import { ProofStatusIcon } from "~~/app/debugcircuits/_componenets/circuit/ProofStatusIcon";
import { useCircuitExecutable } from "~~/app/debugcircuits/_hooks/useCircuitExecutable";
import { useCircuitInputParams } from "~~/app/debugcircuits/_hooks/useCircuitInputParams";
import { useCircuitProver } from "~~/app/debugcircuits/_hooks/useCircuitProver";
import { uint8ArrayToHexString } from "~~/app/debugcircuits/_utils/utilsCircuit";
import { InputBase } from "~~/components/scaffold-eth";
import {
  useScaffoldContract,
  useScaffoldEventHistory,
  useScaffoldReadContract,
  useScaffoldWatchContractEvent,
  useScaffoldWriteContract,
  useTransactor,
} from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const ProveUI = () => {
  const [inputItems, setInputItems] = useState<InputMap>({});
  const [secret, setSecret] = useState<bigint>(0n);
  const [salt, setSalt] = useState<bigint>(0n);
  const [indexes, setIndexes] = useState<number>(0);
  const [message, setMessage] = useState<string>("**********");

  const [isLoadingProof, setIsLoadingProof] = useState<boolean>();
  const [isLoadingCall, setIsLoadingCall] = useState<boolean>();
  const [disableProver, setDisableProver] = useState<boolean>(true);
  const [disableVerifier, setDisableVerifier] = useState<boolean>(true);
  const [callSuccess, setCallSuccess] = useState<boolean>();

  const params = useCircuitInputParams("your_circuit");
  const [executable, returnValues, witness] = useCircuitExecutable("your_circuit", inputItems, params);
  const [prover, proof, publicInputs, isVerified] = useCircuitProver(
    "your_circuit",
    witness as Uint8Array,
    params,
    inputItems,
  );

  useEffect(() => {
    if (isVerified != undefined) {
      setIsLoadingProof(false);
    }
  }, [isVerified]);

  useEffect(() => {
    setIsLoadingProof(false);
    setDisableProver(true);
    setDisableVerifier(true);
    // console.log("change");
  }, [params, inputItems, message, secret, salt, indexes]);

  const { data: contractRoot } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getRoot",
  });

  // array with size and depth
  const { data: treeData } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "mt",
  });

  const { data: walletClient } = useWalletClient();
  const { data: yourContract } = useScaffoldContract({
    contractName: "YourContract",
    walletClient,
  });

  const transactor = useTransactor();

  const {
    data: leafEvents,
    isLoading: isLoadingLeafEvents,
    error: errorReadingLeafEvents,
  } = useScaffoldEventHistory({
    contractName: "YourContract",
    eventName: "NewLeaf",
    fromBlock: 0n,
    watch: true,
    enabled: true,
  });

  // console.log("leafEvents: ", leafEvents)

  useEffect(() => {
    if (leafEvents && !isLoadingLeafEvents) {
      const mTree = new LeanIMT((a: bigint, b: bigint) => poseidon2([a, b]));
      const leaves = leafEvents.reverse().map(event => {
        return event?.args.leaf;
      });
      // console.log(leaves);
      mTree.insertMany(leaves as bigint[]);
      console.log("root", mTree.root);
      // const calcedLeaf = poseidon2([BigInt(secret),BigInt(salt)]);
      // console.log(`index of ${calcedLeaf} is ${mTree.indexOf(calcedLeaf)}, should be ${indexes}:`);
      const proof = mTree.generateProof(indexes);
      console.log("merkle proof: ", proof);
      const sibs = proof.siblings.map(sib => {
        return sib.toString();
      });

      const lengthDiff = 4 - sibs.length;
      for (let i = 0; i < lengthDiff; i++) {
        sibs.push("0");
      }

      const obj: InputMap = {
        secret: secret.toString(),
        salt: salt.toString(),
        indexes: proof.index ? proof.index : 0,
        siblings: sibs,
        pub_root: contractRoot ? contractRoot.toString() : 0,
        depth: treeData ? treeData[1].toString() : 0,
        msg: message,
      };
      setInputItems(() => obj);
    }
  }, [secret, salt, indexes, message]);

  return (
    <>
      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
        <div className="p-5 divide-y divide-base-300">
          <div>
            <div className={`flex items-center ml-2 mb-2`}>
              <span>Leaf Info:</span>
            </div>
            {/* @ts-ignore */}
            <InputBase
              onChange={(v: string) => {
                if (v != "") {
                  const obj = JSON.parse(v);
                  if (obj.indexes) setIndexes(() => parseInt(obj.indexes));
                  if (obj.salt) setSalt(() => BigInt(obj.salt));
                  if (obj.secret) setSecret(() => BigInt(obj.secret));
                }
              }}
            />
          </div>
          <div>
            <div className={`flex items-center ml-2 mb-2 mt-2`}>
              <span>Tree Size:</span>
              <span className="font-extralight text-xs ml-2">{treeData?.[0]}</span>
            </div>
          </div>
          <div>
            <div className={`flex items-center ml-2 mb-2 mt-2`}>
              <span>Tree Depth:</span>
              <span className="font-extralight text-xs ml-2">{treeData?.[1]}</span>
            </div>
          </div>
          <div>
            <div className={`flex items-center ml-2 mb-2 mt-2`}>
              <span>Tree Root:</span>
              <span className="font-extralight text-xs ml-2">{contractRoot}</span>
            </div>
          </div>
          <div>
            <div className={`flex items-center ml-2 mb-2 mt-2`}>
              <span>Message:</span>
            </div>
            <div>
              <InputBase
                value={message}
                onChange={(v: string) => {
                  setMessage(v);
                }}
                error={message.length != 10}
              />
            </div>
          </div>
          <div className="mt-2 mb-2">
            <CircuitInfoDisplay title="Circuit Inputs" object={inputItems} />
          </div>
          <div className="mt-2 mb-2 flex gap-2">
            <button
              className="btn btn-secondary btn-sm self-end md:self-start mr-1"
              onClick={() => {
                //@ts-ignore
                executable().catch((e: Error) => {
                  console.error(e);
                  notification.error(
                    <div className={`flex flex-col ml-1 cursor-default`}>
                      <p className="my-0">{e.message}</p>
                    </div>,
                  );
                });
                setDisableProver(false);
              }}
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
              <ProofStatusIcon isLoading={isLoadingProof} isValid={isVerified} />
            </button>
            <button
              className="btn btn-secondary btn-sm self-end md:self-start mr-1"
              onClick={async () => {
                let g;
                await transactor(() => {
                  return yourContract?.write.setGreetingAnon([
                    uint8ArrayToHexString(proof as Uint8Array),
                    publicInputs as `0x${string}`[],
                  ]) as Promise<`0x${string}`>;
                }).then(
                  result => {
                    g = result;
                  },
                  () => {
                    g = false;
                  },
                );
                if (g) {
                  setCallSuccess(true);
                } else {
                  setCallSuccess(false);
                }
                console.log("result: ", g);
              }}
              disabled={!proof || isLoadingProof}
            >
              Set Greeting
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
