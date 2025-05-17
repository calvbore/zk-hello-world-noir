# ZK Hello World - Merkle Tree

Develop a smart contract and zero knowledge circuit that allows users to store a secret in a [merkle tree](https://hackmd.io/@vplasencia/S1whLBN16) and will allow anyone that can prove they know a secret hidden inside the merkle tree to anonymously set a greeting stored in the smart contract.

Using this basic merkle tree structure you will be able to construct arbitrary membership groups and allow those within the group to prove their membership anonymously. 

---
## Checkpoint 0: Environment
- install dependencies
Before you begin, you need to install the following tools:

- [Node (>= v18.17)](https://nodejs.org/en/download/)
- Yarn ([v1](https://classic.yarnpkg.com/en/docs/install/) or [v2+](https://yarnpkg.com/getting-started/install))
- [Git](https://git-scm.com/downloads)
- [Nargo](https://noir-lang.org/docs/getting_started/quick_start#installation)
- [bb](https://noir-lang.org/docs/getting_started/quick_start#proving-backend)

After installing `bbup` make sure to install the version of `bb` that is compatible with this challenge.

```sh
bbup --version 0.72.1
```

If you are using vscode you may want to install the [Noir Language Support](https://marketplace.visualstudio.com/items?itemName=noir-lang.vscode-noir) extension.

Then download the challenge to your computer and install dependencies by running:

```sh
npx create-eth@0.1.0 -e calvbore/zk-hello-world-noir zk-hello-world
cd zk-hello-world
```

> in the same terminal, start your local network (a blockchain emulator in your computer):

```sh
yarn chain
```

> in a second terminal window, 🛰 deploy your contract (locally):

```sh
cd zk-hello-world
yarn deploy
```

> in a third terminal window, start your 📱 frontend:

```sh
cd zk-hello-world
yarn start
```

📱 Open http://localhost:3000 to see the app.

> 👩‍💻 Rerun `yarn deploy` whenever you want to deploy new contracts to the frontend. If you haven't made any contract changes, you can run `yarn deploy --reset` for a completely fresh deploy.

---
## Checkpoint 1: Smart Contract Merkle Tree
First, install the `zk-kit` dependency in your solidity workspace.

```
yarn workspace @se-2/hardhat add @zk-kit/lean-imt.sol
```

You'll need to import the `InternalLeanIMT` Contract and `LeanIMTData` struct from zk-kit into `YourContract.sol`.

```
import { InternalLeanIMT, LeanIMTData } from "@zk-kit/lean-imt.sol/LeanIMT.sol";
```

If you try to deploy `YourContract` after importing this library you may run into issues right now. The fix for deploying the contract is covered at the end of this section.

Instantiate a merkle tree data variable in `YourContract.sol`, make sure to use the `InternalLeanIMT` contract library for the struct!

```
using InternalLeanIMT for LeanIMTData;
LeanIMTData public mt;
```

Create an event to track all the added members, we want to keep this so we can recreate the merkle tree at any time.

```
event NewLeaf(uint256 indexed index, uint256 indexed leaf);
```

Write function that will accept ETH if a premium is set and give membership in exchange. It should take in one `uint256` value and emit the `NewLeaf` event.

```
function insert(uint256 _hashedSecret) public payable {
    if (premium) require(msg.value > 0);
    mt._insert(_hashedSecret);
    emit NewLeaf(mt.size-1, _hashedSecret);
}
```

Add a couple convenience functions. One to see the root of the contract's merkle tree and another to get the index of a leaf after it has been committed.

```
function getRoot() public view returns (uint256) {
	return mt._root();
}

function getLeafIndex(uint256 _leaf) public view returns (uint256) {
	return mt._indexOf(_leaf);
}
```

Before you can deploy the contract you will need to modify the deployment script (`packages/hardhat/deploy/00_deploy_your_contract.ts`) so that the libraries will work properly. Deploy the `PoseidonT3` contract, it is a dependency of the `InternalLeanIMT` library that is used.

```
const poseidon = await deploy("PoseidonT3", {
	from: deployer,
	log: true,
	autoMine: true
});
```

Pass its `address` as a library to `YourContract`'s deployment function.

```
await deploy("YourContract", {
	from: deployer,
	// Contract constructor arguments
	args: [deployer],
	log: true,
	// autoMine: can be passed to the deploy function to make the deployment process faster on local networks by
	// automatically mining the contract deployment transaction. There is no effect on live networks.
	autoMine: true,
	libraries: {
		PoseidonT3: poseidon.address,
	}
});
```

Run `yarn deploy` to deploy the new version of `YourContract.sol`.

---
## Checkpoint 2: Noir Merkle Proof Verification Circuit
The first thing we need to do for our circuit is add `zk-kit` merkle tree as dependency to `packages/nargo/circuits/your_circuit/Nargo.toml`. This library is the noir counterpart to the solidity library that you imported earlier.

```
[dependencies]
binary_merkle_root = { git = "https://github.com/privacy-scaling-explorations/zk-kit.noir", tag = "binary-merkle-root-v0.0.1", directory = "packages/binary-merkle-root" }
```

Import it into `packages/nargo/circuits/your_circuit/src/main.nr`. Right at the top of the file add the import with all the traits that are needed. While you're up here import the `poseidon` hash function from the standard library. 

```
use binary_merkle_root::binary_merkle_root; 
use std::hash::poseidon::bn254::hash_2;
```

Define the `hasher` function that will be used inside the merkle tree calculations. It will be a simple wrapper around the `poseidon` `hash` function.

```
fn hasher(leaves: [Field; 2]) -> Field {
	hash_2(leaves)
}
```

Set all of the inputs necessary for the `main` function.
- `secret` along with `salt` are used to by the prover to claim that they know a secret value hashed behind one of leaves of the merkle tree managed by `YourContract`. 
- `salt` a random value hashed with `secret` to generate a merkle tree leaf. In another design this could be used as a nullifier.
- `indexes` will encode the position of the merkle tree leaf.
- `siblings` is an array forming the hash path from the merkle leaf to the merkle root. Arrays in noir must be a fixed length.
- `pub_root` will be compared to the merkle root of the tree stored in `YourContract`.
- `depth` will be the depth of the tree in `YourContract`
- `msg` is the message we want to set `YourContract`'s greeting to. This value doesn't actually do anything inside of the circuit, but it is a good practice to tie any values that change the state of a smart contract directly to the proof giving validity to those changes otherwise the proof could be used to front run the authentic contract call with different values. Strings in noir must be a fixed length.

```
fn main(
	secret: Field,
	salt: Field,
	indexes: Field,
	siblings: [Field; 4],
	pub_root: pub Field,
	depth: pub u32,
	msg: pub str<10>
) {
//...
}
```

Inside of the `main` function generate the merkle `leaf` by feeding `secret` and `salt` to `hasher`.

```
let leaf = hasher([secret, salt]);
```

Then you'll need to figure out the index where the empty elements in the siblings array begin. You'll need this variable so that the merkle root calculation can be performed correctly.

```
let mut siblings_num = 0;
for i in 0..siblings.len() {
	if siblings[i] != 0 {
		siblings_num += 1;
	}
}
```

Calculate the merkle root. You'll need to convert the index to bits, first. Then pass the `hasher`, `leaf`, `siblings_num`, `index_bits`, and `siblings` to the `binary_merkle_root` that you imported earlier. If you're curious about the inner working of the calculation [ceck out the function code](https://github.com/privacy-scaling-explorations/zk-kit.noir/blob/54de5f14ec1a510d4a60db4278e52c919892b975/packages/binary-merkle-root/src/lib.nr#L10).

```
let index_bits: [u1; 4] = indexes.to_le_bits();

let bin_root = binary_merkle_root(hasher, leaf, siblings_num, index_bits, siblings);
```

Now `assert` that `pub_root` and the calculated `bin_root` are the same value.

```
assert(pub_root == bin_root);
```

The `assert` statement allows you to add constraints to your zero knowledge circuit. If the boolean statement in an `assert` evaluates to `false` then a valid proof cannot be constructed.

For safe measure we can add assertions that `depth` is less than the length of `siblings`, and that `msg` is in fact equal to itself.

```
assert(depth <= siblings.len());
assert(msg == msg);
```

Run `yarn nargo:compile` in your terminal to compile `your_circuit` and generate its associated files.

## Checkpoint 3: Circuit Smart Contract Verifier

After running `yarn nargo:compile` you'll find that a new solidity file in your contracts directory. Import the new contract into `YourContract.sol` and inherit `UltraVerifier` in `YourContract`.

```
import "./your_circuitVerifier.sol";

contract YourContract is UltraVerifier {
//...
}
```

Write a function that takes in the a proof and public values for `your_circuit`.

```
function setGreetingAnon(bytes calldata _proof, bytes32[] calldata _publicInputs) public {
//...
}
```

The public inputs to the noir circuit will be gathered together as a `bytes32[]` and passed to `YourContract` as calldata. They will be arranged in the order you defined in the `main` function of `your_circuit/src/main.nr`. 

Parse `_publicInputs` into values you can use.

```
uint256 proved_root = uint256(_publicInputs[0]);
uint256 proved_depth = uint256(_publicInputs[1]);

bytes32 message;
bytes32[] memory messageChars = _publicInputs[2:12];
for (uint256 i; i<messageChars.length; i++) {
    message = message | messageChars[i] << 8*(messageChars.length-i-1);
}
```
Each character of the `msg` string will be its own element of the array. You'll need to gather them into a single `bytes32` and place each in the correct position.

Check that the `proved_root` and `proved_depth` values match those stored by `YourContract`.

```
require(proved_root == mt._root(), "Root does not match");
require(proved_depth == mt.depth, "Depth does not match");
```

And check the validity of the proof.

```
bool validity = this.verify(_proof, _publicInputs);
require(validity == true, "Invalid proof");
```

After the proof is found to be valid set the greeting message of `YourContract` to the message tied to the proof.

```
greeting = string(abi.encode(message));
totalCounter += 1;
```

As this function stands anyone could dig through old transactions and replay a proof to reset the greeting to the value tied to the proof. It is good practice to track if a proof has been used before. Add a `mapping` from `bytes32` to a `bool` in `YourContract`.

```
mapping(bytes32 => bool) public isProved;
```

calculate the `keccak256` hash of `_proof` and `_publicInputs` right at the top of the anonymous greeting setter function and at the end set the mapping to `true`.

```
bytes32 proofHash = keccak256(abi.encode(_proof, _publicInputs));
//...
isProved[proofHash] = true;
```

Then add a check at the beginning of the function to see if the proof has been used before.

```
bytes32 proofHash = keccak256(abi.encode(_proof, _publicInputs));
require(isProved[proofHash] == false, "Proof has been used");
//...
```

`yarn deploy` the updated contract to your local chain.

---
## Checkpoint 4: Frontend Secret Committer

Click on the `MerkleUI` tab in your front end. You'll see two main components on the page.

<img src="https://github.com/user-attachments/assets/5e8a1cf0-d528-4c47-b954-6f933550b8c7" width="500">

In the input field under `Secret:` enter a string you'd like to use as your secret. If you'd like to generate a new salt for you're commitment you can click the refresh button beside the `Salt:` heading. Below you will see the `Hash:` heading with the calculated hash of your secret input and the salt. 

<img src="https://github.com/user-attachments/assets/3ec3afaf-be74-4e63-83d3-137fecc3ad03" width="500">

When you're ready click the `Commit` button and your secret commitment will be added to the merkle tree in `YourContract`. You can click on the `Commit Info:` heading below to expand and see your commitment information. Click on the `Copy to Clipboard` button to copy it to your clipboard.

---
## Checkpoint 5: Frontend Secret Prover

Open your front end in a new incognito or private window.

Paste your commitment info into the input field below the `Leaf Info:` heading.

Enter a string you would like to set the contract greeting to in the input field beneath the `Message:` heading. Be careful to ensure that the string you enter is the same length as the string defined as an input in `your_circuit`, otherwise the field will warn you and the circuit will fail to execute.

<img src="https://github.com/user-attachments/assets/e9361acc-d1c6-428d-9835-0bc67eeff0e5" width="500">

Beneath you can click `Circuit Inputs:` to expand and view the input parameters that will be passed to `your_circuit`.

Click the `Execute` button. If everything is running correctly it will enable the `Prove` button beside it. Click `Prove`, a loading circle will begin to spin. It may take a couple moments for your browser to generate the proof, be patient with it. If the proof is valid the loading icon will turn into a check and the `Set Greeting` button will be enabled, you can click this button to send a transaction with the generated proof and set the greeting in `YourContract` to the string you entered in the `Message:` field.

<img src="https://github.com/user-attachments/assets/443f7750-7100-40f4-a261-53f83cc83e97" width="500">

---
