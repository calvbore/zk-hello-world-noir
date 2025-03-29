import { DebugCircuits } from "./_componenets/DebugCircuits";
import type { NextPage } from "next";
import { getMetadata } from "~~/utils/scaffold-eth/getMetadata";

export const metadata = getMetadata({
  title: "Debug Contracts",
  description: "Debug your deployed 🏗 Scaffold-ETH 2 circuits in an easy way",
});

const Debug: NextPage = () => {
  return (
    <>
      <DebugCircuits />
      <div className="text-center mt-8 bg-secondary p-10">
        <h1 className="text-4xl my-0">Debug Circuits</h1>
        <p className="text-neutral">
          You can debug & interact with your published circuits here.
          <br /> Check{" "}
          <code className="italic bg-base-300 text-base font-bold [word-spacing:-0.5rem] px-1">
            packages / nextjs / app / debugcircuits / page.tsx
          </code>{" "}
        </p>
      </div>
    </>
  );
}

export default Debug;