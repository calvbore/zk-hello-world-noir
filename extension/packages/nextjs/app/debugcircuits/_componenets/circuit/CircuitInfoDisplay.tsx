import { useState, useEffect } from "react";
import { AbiParameter, AbiType, InputMap, InputValue } from "@noir-lang/types";
import { displayTxResult } from "~~/app/debug/_components/contract";

type CircuitInfoDisplayProps = {
  title: string,
  object: any,
  nullMessage?: string,
}

export const CircuitInfoDisplay = ({
  title,
  object,
  nullMessage
}: CircuitInfoDisplayProps) => {
  const [ isOpen, setIsOpen ] = useState<boolean>(false);
  return (
    <>
      <div className="mb-1">
        <div 
          tabIndex={0} 
          className={`collapse collapse-${isOpen? `open` : `close`} bg-secondary rounded-3xl text-sm px-4 py-1.5 break-words`}
          onClick={() => {setIsOpen(!isOpen)}}
        >
          <p className="font-bold m-0 mb-1">{title}:</p>
          {!object || object?.length == 0 ?
          (
            <pre className="collapse-content whitespace-pre-wrap break-words">{nullMessage}</pre>
          ) : (
            <pre className="collapse-content whitespace-pre-wrap break-words">{displayTxResult(object, "sm")}</pre>
          )
          }
        </div>
      </div>
    </>
  );
}