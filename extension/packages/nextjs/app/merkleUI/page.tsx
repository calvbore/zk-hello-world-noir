"use client";

import { CommitUI } from "./_components/CommitUI";
import { ProveUI } from "./_components/ProveUI";
import type { NextPage } from "next";

const MerkleUI: NextPage = () => {
  return (
    <div className="justify-center items-center">
      <div className="flex flex-col gap-y-6 lg:gap-y-8 py-8 lg:py-12 justify-center items-center">
        <div className={`grid grid-cols-1 lg:grid-cols-6 px-6 lg:px-10 lg:gap-12 w-full max-w-7xl my-0`}>
          <div className="col-span-5 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
            <div className="col-span-1 flex flex-col"></div>
            <div className="col-span-1 lg:col-span-2 flex flex-col gap-6">
              <div className="z-10">
                <CommitUI />
                <ProveUI />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerkleUI;
