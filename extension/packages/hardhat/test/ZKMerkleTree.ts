import fs from 'fs';
import { expect } from "chai";
import { ethers } from "hardhat";
import { LeanIMT } from "@zk-kit/lean-imt";
import { poseidon2 } from "poseidon-lite";
import { InputMap } from "@noir-lang/types";
import { UltraPlonkBackend } from "@aztec/bb.js";
import { Noir } from "@noir-lang/noir_js";

describe("ZKMerkleTree", function () {
  // We define a fixture to reuse the same setup in every test.

  let zkMerkleTreeContract: any;
  before(async () => {
    const [owner] = await ethers.getSigners();

    const poseidonT3Factory = await ethers.getContractFactory("PoseidonT3");
    const poseidonT3 = await poseidonT3Factory.deploy();
    await poseidonT3.waitForDeployment();

    const zkMerkleTreeContractFactory = await ethers.getContractFactory("ZKMerkleTree", { libraries: {
      PoseidonT3:  await poseidonT3.getAddress(),
    }});
    zkMerkleTreeContract = (await zkMerkleTreeContractFactory.deploy(owner.address));
    await zkMerkleTreeContract.waitForDeployment();
  });

  describe("Circuit", function () {
    const yourCircuit = JSON.parse(
      fs.readFileSync(`${__dirname}/../temp/nargo/your_circuit.json`).toString()
    );
    // console.log("circuit: ", circuit);
    const executable = new Noir(yourCircuit);
    const backend = new UltraPlonkBackend(yourCircuit.bytecode);

    const secrets = [BigInt(1), BigInt(2), BigInt(3)];
    const salts   = [BigInt(4), BigInt(5), BigInt(6)];

    const mTree = new LeanIMT((a: bigint, b: bigint) => poseidon2([a, b]));

    const secretIndex = Math.floor(Math.random()*3);
    const saltIndex = Math.floor(Math.random()*3);
    console.log(secretIndex, saltIndex);

    it("Should insert a merkle tree leaf", async function () {
      const commitment = poseidon2([secrets[secretIndex], salts[saltIndex]])
      mTree.insert(commitment);
      const root = mTree.root;

      await zkMerkleTreeContract.insert(commitment);

      const contractRoot = await zkMerkleTreeContract.getRoot();

      expect(contractRoot).to.equal(root);
    });

    it("Should generate and accept a valid proof", async function () {
      const merkleProof = mTree.generateProof(0);
      // console.log(merkleProof);

      const treeData = await zkMerkleTreeContract.mt();
      // console.log(treeData);

      const sibs = merkleProof.siblings.map(sib => {
        return sib.toString();
      });

      const lengthDiff = 4 - sibs.length;
      for (let i = 0; i < lengthDiff; i++) {
        sibs.push("0");
      }

      const contractRoot = await zkMerkleTreeContract.getRoot();

      const circuitInput: InputMap = {
        secret: secrets[0].toString(),
        salt: salts[0].toString(),
        indexes: merkleProof.index ? merkleProof.index : 0,
        siblings: sibs,
        pub_root: contractRoot.toString(),
        depth: treeData ? treeData[1].toString() : 0,
        msg: "teststring",
      };

      const executed = await executable.execute(circuitInput);
      // console.log(witness);
      const circuitProof = await backend.generateProof(executed.witness);
      console.log(circuitProof);
      expect(await backend.verifyProof(circuitProof)).to.be.true;
    })
  });
});
