import { useEffect, useState } from "react";
import { getCircuitHash } from "../_utils/utilsCircuit";

export const useCircuitHash = (name: string) => {
  const [hash, setHash] = useState(getCircuitHash(name));

  useEffect(() => {
    setHash(getCircuitHash(name));
  }, [name]);

  return hash;
};
