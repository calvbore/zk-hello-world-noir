"use client";

import { useLocalStorage } from "usehooks-ts";
import { CircuitUI } from "./circuit";
import { useCircuitNames } from "../_hooks/useCircuitNames";
import { useEffect } from "react";
const selectedCircuitStorageKey = "scaffoldEth2.selectedCircuit";

export const DebugCircuits = () => {
  const circuitNames = useCircuitNames();
  const [selectedCircuit, setSelectedCircuit] = useLocalStorage<string>(
    selectedCircuitStorageKey, 
    circuitNames[0],
    { initializeWithValue: false },
  );

  useEffect(() => {
    if (!circuitNames.includes(selectedCircuit)) {
      setSelectedCircuit(circuitNames[0]);
    }
  }, [circuitNames, selectedCircuit, setSelectedCircuit]);

  return (
    <>
      <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
        {circuitNames.length === 0 ? (
          <p className="text-3xl mt-14">No circuits found!</p>
        ) : (
          <>
            {circuitNames.length > 1 && (
              <div className="flex flex-row gap-2 w-full max-w-7xl pb-1 px-6 lg:px-10 flex-wrap">
                {circuitNames.map(circuitName => (
                  <button
                    className={`btn btn-secondary btn-sm normal-case font-thin ${
                      circuitName === selectedCircuit ? "bg-base-300" : "bg-base-100"
                    }`}
                    key={circuitName}
                    onClick={() => setSelectedCircuit(circuitName)}
                  >
                    {circuitName}
                  </button>
                ))}
              </div>
            )}
            {circuitNames.map(circuitName => (
              <CircuitUI
                key={circuitName}
                circuitName={circuitName}
                className={circuitName === selectedCircuit ? "" : "hidden"}
              />
            ))}
          </>
        )}
      </div>
    </>
  );
};

export default DebugCircuits;
