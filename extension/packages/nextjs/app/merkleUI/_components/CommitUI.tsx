"use client";

import { useEffect, useState } from "react";
import * as crypto from "crypto";
import { poseidon2 } from "poseidon-lite";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { CircuitInfoDisplay } from "~~/app/debugcircuits/_componenets/circuit";
import { generateRandomBigInt } from "~~/app/debugcircuits/_utils/utilsCircuit";
import { InputBase } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const SNARK_SCALAR_FIELD = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");

export const CommitUI = () => {
  const [salt, setSalt] = useState<bigint>(0n);
  const [secretInput, setSecretInput] = useState<string>(``);
  const [hash, setHash] = useState<bigint>();
  const [encodedSecret, setEncodedSecret] = useState<string>(``);

  useEffect(() => {
    setSalt(generateRandomBigInt(0n, SNARK_SCALAR_FIELD));
  }, []);

  useEffect(() => {
    const v = secretInput;
    let s;
    try {
      s = BigInt(v);
      s = s.toString();
    } catch (e) {
      s = Array.from(v)
        .map(char => char.charCodeAt(0).toString(16))
        .join("");
      s = `0x` + s;
    }
    if (s == null) s = `0x0`;
    setEncodedSecret(s);
    setHash(poseidon2([s, salt]));
  }, [secretInput, salt]);

  const { writeContractAsync: writeContract } = useScaffoldWriteContract({ contractName: "YourContract" });
  const { data: leafIndex } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getLeafIndex",
    args: [hash],
  });

  return (
    <>
      <div className="bg-base-100 rounded-3xl shadow-md shadow-secondary border border-base-300 flex flex-col mt-10 relative">
        <div className="p-5 divide-y divide-base-300">
          <div>
            <div className={`flex items-center ml-2 mb-2`}>
              <span>Secret:</span>
            </div>
            <InputBase
              value={secretInput}
              onChange={(v: string) => {
                setSecretInput(v);
              }}
            />
            <div className={`flex items-center ml-2 mb-2 mt-2`}>
              <span>Salt</span>
              <div className="cursor-pointer">
                <button
                  className="btn btn-ghost btn-xs"
                  onClick={() => {
                    setSalt(generateRandomBigInt(0n, SNARK_SCALAR_FIELD));
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center ml-2 mb-2">
              <span className="font-extralight text-xs">{salt?.toString()}</span>
            </div>
            <div className={`flex items-center ml-2 mb-2`}>
              <span>Hash:</span>
            </div>
            <div className="flex items-center ml-2 mb-2">
              <span className="font-extralight text-xs">{hash?.toString()}</span>
            </div>
            <div className="mt-2 mb-2 flex gap-2">
              <span>
                <button
                  className="btn btn-secondary btn-sm self-end md:self-start mr-1"
                  onClick={async () => {
                    await writeContract({
                      functionName: "insert",
                      args: [hash],
                    });
                  }}
                >
                  Commit
                </button>
              </span>
              <span>
                <button
                  className="btn btn-secondary btn-sm self-end md:self-start mr-1"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      JSON.stringify({
                        secret: encodedSecret,
                        salt: salt.toString(),
                        indexes: leafIndex?.toString(),
                      }),
                    );
                  }}
                  disabled={leafIndex === undefined}
                >
                  Copy to Clipboard
                </button>
              </span>
            </div>
            <div className="mt-2 mb-2">
              <CircuitInfoDisplay
                title="Commit Info"
                object={{
                  secret: encodedSecret,
                  salt: salt,
                  indexes: leafIndex,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
