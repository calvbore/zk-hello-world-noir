import { JSX, useEffect, useState } from "react";
import { AbiParameter, AbiType, InputMap, InputValue } from "@noir-lang/types";
import { InputBase } from "~~/components/scaffold-eth";

type CircuitInputProps = {
  inputParam: AbiParameter;
  stateMutateFunc: any;
  inputs: InputMap;
  surfaceError: (p: (string | number)[], v: boolean) => void;
};

const checkError = (abiType: AbiType, v: string, obj?: any): boolean => {
  if (!obj && obj != 0) {
    try {
      if (abiType.kind == "string") {
        obj = v;
      } else {
        obj = JSON.parse(v);
      }
    } catch {
      return true;
    }
  }

  switch (abiType.kind) {
    case "field":
      if (typeof obj != "number") return true;
      return false;
    case "boolean":
      return false;
    case "string":
      if (typeof obj != "string") return true;
      if (obj.length != abiType.length) return true;
      return false;
    case "integer":
      if (typeof obj != "number") return true;
      if (abiType.sign == "unsigned" && obj < 0) return true;
      return false;
    case "array":
      for (let i = 0; i < abiType.length; i++) {
        console.log(typeof obj[i]);
        const e: boolean = checkError(abiType.type, v, obj[i]);
        if (e == true) return true;
      }
      if (obj.length != abiType.length) {
        return true;
      }
      return false;
    case "tuple":
      // if (abiType.kind != 'tuple') return true;
      console.log(obj);
      for (let i = 0; i < abiType.fields.length; i++) {
        console.log("tuple component: ", obj[i]);
        const e: boolean = checkError(abiType.fields[i], v, obj[i]);
        if (e == true) return true;
      }
      console.log(obj.length);
      console.log(abiType.fields.length);
      if (obj.length != abiType.fields.length) {
        return true;
      }
      return false;
    case "struct":
      // if (abiType.kind != 'struct') return true;
      const keys = Object.keys(obj);
      if (keys.length != abiType.fields.length) return true;
      for (let i = 0; i < abiType.fields.length; i++) {
        // if field is not included surface error
        if (!keys.includes(abiType.fields[i].name)) return true;
        const e = checkError(abiType.fields[i].type, v, obj[abiType.fields[i].name]);
        if (e == true) return true;
      }
      return false;
    default:
      return false;
  }

  return false;
};

const renderInput = (
  abiType: AbiType,
  path: (string | number)[],
  stateMutateFunc: any,
  inputs: InputMap,
  surfaceError: (p: (string | number)[], v: boolean) => void,
): [JSX.Element, string?, string?] => {
  const key: string = `renderInput:${JSON.stringify(path)}`;
  let curValue: any = structuredClone(inputs);
  for (let i = 0; i < path.length; i++) {
    curValue = curValue[path[i]];
  }

  let mutateItem: (v: string) => void;
  let typeTitle: string | undefined;

  const [inputIndividualMode, setInputIndividualMode] = useState<boolean>(true);
  const [isErrored, setIsErrored] = useState<boolean>(false);

  // console.log(path);

  switch (abiType.kind) {
    case "field":
      mutateItem = (v: string) => {
        let n: number = parseInt(v);
        if (!n) n = 0;
        stateMutateFunc(n, path);
      };
      typeTitle = `Field`;
      return [
        <div key={key}>
          <div className={`flex items-center ml-2 mb-2`}>
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              {typeTitle}
            </span>
          </div>
          <div className="mb-2">
            {/* @ts-ignore */}
            <InputBase
              placeholder={curValue}
              // value={curValue}
              onChange={(v: string) => {
                // console.log(v)
                // console.log(JSON.parse(v));
                const e = checkError(abiType, v);
                surfaceError(path, e);
                setIsErrored(e);
                if (!e) {
                  mutateItem(v);
                }
              }}
              error={isErrored}
            />
          </div>
        </div>,
        abiType.kind,
        typeTitle,
      ];
    case "boolean":
      mutateItem = (v: string) => {
        v = v.toLowerCase();
        const b = v == "true" || v == "1";
        stateMutateFunc(b, path);
      };
      typeTitle = `bool`;
      return [
        <div key={key}>
          <div className="flex items-center ml-2 mb-2">
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              {typeTitle}
            </span>
          </div>
          <div className="mb-2">
            {/* @ts-ignore */}
            <InputBase
              placeholder={JSON.stringify(curValue)}
              // value={curValue}
              onChange={(v: string) => {
                const e = checkError(abiType, v);
                surfaceError(path, e);
                setIsErrored(e);
                if (!e) {
                  mutateItem(v);
                }
              }}
              error={isErrored}
            />
          </div>
        </div>,
        abiType.kind,
        typeTitle,
      ];
    case "string":
      mutateItem = (v: string) => {
        v = v.slice(0, abiType.length);
        stateMutateFunc(v, path);
      };
      typeTitle = `str<${abiType.length}>`;
      return [
        <div key={key}>
          <div className="flex items-center ml-2 mb-2">
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              {typeTitle}
            </span>
          </div>
          <div className="mb-2">
            {/* @ts-ignore */}
            <InputBase
              placeholder={curValue}
              // value={curValue}
              onChange={(v: string) => {
                const e = checkError(abiType, v);
                surfaceError(path, e);
                setIsErrored(e);
                if (!e) {
                  mutateItem(v);
                }
              }}
              error={isErrored}
            />
          </div>
        </div>,
        abiType.kind,
        typeTitle,
      ];
    case "integer":
      mutateItem = (v: string) => {
        const n: number = parseInt(v);
        stateMutateFunc(n, path);
      };
      typeTitle = `${abiType.sign == "unsigned" ? "u" : "i"}${abiType.width}`;
      return [
        <div key={key}>
          <div className="flex items-center ml-2 mb-2">
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              {typeTitle}
            </span>
          </div>
          <div className="mb-2">
            {/* @ts-ignore */}
            <InputBase
              placeholder={curValue}
              // value={curValue}
              onChange={(v: string) => {
                // console.log(v)
                // console.log(JSON.parse(v));
                const e = checkError(abiType, v);
                surfaceError(path, e);
                setIsErrored(e);
                if (!e) {
                  mutateItem(v);
                }
              }}
              error={isErrored}
            />
          </div>
        </div>,
        abiType.kind,
        typeTitle,
      ];
    case "array":
      let kind: string | undefined;
      let title: string | undefined;
      let members = [];
      for (let i = 0; i < abiType.length; i++) {
        const [jsx, subKind, subtitle] = renderInput(
          abiType.type,
          [...structuredClone(path), i],
          stateMutateFunc,
          inputs,
          surfaceError,
        );
        if (!kind && subKind != "array") kind = subKind;
        if (!title) title = subtitle;
        members.push(jsx);
      }
      title = `[${title}; ${abiType.length}]`;

      mutateItem = (v: string) => {
        let arr = JSON.parse(v);
        // console.log(arr);
        stateMutateFunc(arr, path);
      };

      return [
        <div key={key}>
          <div className="flex items-center ml-2 mb-2">
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              <div
                onClick={() => {
                  setInputIndividualMode(!inputIndividualMode);
                  setIsErrored(false);
                }}
              >
                {inputIndividualMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 ml-1 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 ml-1 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </div>
              {title}
            </span>
          </div>
          {inputIndividualMode ? (
            <>{members}</>
          ) : (
            <div className="mb-2">
              {/* @ts-ignore */}
              <InputBase
                placeholder={JSON.stringify(curValue)}
                onChange={(v: string) => {
                  const e = checkError(abiType, v);
                  surfaceError(path, e);
                  setIsErrored(e);
                  if (!e) {
                    mutateItem(v);
                  }
                }}
                error={isErrored}
              />
            </div>
          )}
          {/* {members} */}
        </div>,
        kind,
        title,
      ];
    case "tuple":
      typeTitle = `(`;
      const elements = abiType.fields.map((child, index): any => {
        const [jsx, subKind, subtitle] = renderInput(
          child,
          [...structuredClone(path), index],
          stateMutateFunc,
          inputs,
          surfaceError,
        );
        typeTitle += `${subtitle}, `;
        return jsx;
      });
      typeTitle = typeTitle.slice(0, -2) + `)`;

      mutateItem = (v: string) => {
        let arr = JSON.parse(v);
        // console.log(arr);
        stateMutateFunc(arr, path);
      };

      return [
        <div key={key}>
          <div className="flex items-center ml-2 mb-2">
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              <div
                onClick={() => {
                  setInputIndividualMode(!inputIndividualMode);
                  setIsErrored(false);
                }}
              >
                {inputIndividualMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 ml-1 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 ml-1 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </div>
              {typeTitle}
            </span>
          </div>
          {inputIndividualMode ? (
            elements
          ) : (
            <>
              {/* @ts-ignore */}
              <InputBase
                placeholder={JSON.stringify(curValue)}
                onChange={(v: string) => {
                  // console.log(v)
                  // console.log(JSON.parse(v));
                  const e = checkError(abiType, v);
                  surfaceError(path, e);
                  setIsErrored(e);
                  if (!e) {
                    mutateItem(v);
                  }
                }}
                error={isErrored}
              />
            </>
          )}
        </div>,
        abiType.kind,
        typeTitle,
      ];
    case "struct":
      let fields = [];
      for (let i = 0; i < abiType.fields.length; i++) {
        const [jsx, subKind, subtitle] = renderInput(
          abiType.fields[i].type,
          [...structuredClone(path), abiType.fields[i].name],
          stateMutateFunc,
          inputs,
          surfaceError,
        );
        fields.push(
          <div key={key + `[${i}]`}>
            <div className="flex items-center ml-2 mb-2">
              <span
                className={`ml-${Math.min(path.length, 4)} flex items-center block text-xs font-medium leading-none`}
              >
                {abiType.fields[i].name}
              </span>
            </div>
            {jsx}
          </div>,
        );
      }

      mutateItem = (v: string) => {
        let arr = JSON.parse(v);
        // console.log(arr);
        stateMutateFunc(arr, path);
      };

      typeTitle = abiType.path;

      return [
        <div>
          <div className={`flex items-center ml-2 mb-2`}>
            <span
              className={`ml-${Math.min(path.length - 1, 4)} flex items-center block text-xs font-extralight leading-none`}
            >
              <div
                onClick={() => {
                  setInputIndividualMode(!inputIndividualMode);
                  setIsErrored(false);
                }}
              >
                {inputIndividualMode ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 ml-1 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-3 ml-1 mr-1"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </div>
              {abiType.path}
            </span>
          </div>
          {inputIndividualMode ? (
            fields
          ) : (
            <>
              {/* @ts-ignore */}
              <InputBase
                placeholder={JSON.stringify(curValue)}
                onChange={(v: string) => {
                  console.log(v);
                  // console.log(JSON.parse(v));
                  const e = checkError(abiType, v);
                  surfaceError(path, e);
                  setIsErrored(e);
                  if (!e) {
                    mutateItem(v);
                  }
                }}
                error={isErrored}
              />
            </>
          )}
        </div>,
        abiType.kind,
        typeTitle,
      ];
      return [
        <>
          <div className="flex items-center ml-2 mb-2">
            <span className="block text-xs font-extralight leading-none">{abiType.kind}</span>
          </div>
          <div className="mb-2">
            {/* @ts-ignore */}
            <InputBase />
          </div>
        </>,
      ];
  }
};

export const CircuitInput = ({ inputParam, stateMutateFunc, inputs, surfaceError }: CircuitInputProps) => {
  return (
    <>
      <div className="flex flex-col gap-1.5 w-full">
        <div className="flex items-center ml-2">
          <span className="font-medium my-0 break-words">{inputParam.name}</span>
        </div>
        <div>
          {inputParam.visibility && (
            <span className="flex items-center block text-xs font-medium ml-2 leading-none">
              <div className="flex items-center ml-1 mr-1">
                {inputParam.visibility == "private" ? (
                  <>
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
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  </>
                ) : (
                  <>
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
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </>
                )}
              </div>
              {inputParam.visibility}
            </span>
          )}
        </div>
        <div className="mb-2 mt-2">
          {renderInput(inputParam.type, [structuredClone(inputParam.name)], stateMutateFunc, inputs, surfaceError)[0]}
        </div>
      </div>
    </>
  );
};
