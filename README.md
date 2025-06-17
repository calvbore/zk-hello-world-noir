# ZK Hello World - Merkle Tree

Build a membership registry that allows members to use smart contract privileges anonymously! You'll create a smart contract, [merkle tree](https://hackmd.io/@vplasencia/S1whLBN16), and zero knowledge circuit using the [noir programming language](https://noir-lang.org/).

You'll write a contact that will allow anyone to call a function be added to a registry stored in the contract as a [merkle tree](https://hackmd.io/@vplasencia/S1whLBN16). You'll then write a zero knowledge circuit (some fancy math that will let you prove that you ran a program without revealing the inputs to that program) that will let any member of the registry prove that they are included in it without revealing which member they are. Then you'll modify your contract to allow anyone that can create a valid proof to anonymously set a greeting on the contract.

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

<!-- If you try to deploy `ZKMerkleTree` after importing this library you may run into issues right now. The fix for deploying the contract is covered at the end of this section. -->

Navigate into `packages/hardhat/contracts/ZKMerkleTree.sol`. At the top of the file you'll see a couple imports that you'll be taking advantage of here.

```
import { InternalLeanIMT, LeanIMTData } from "@zk-kit/lean-imt.sol/LeanIMT.sol";
```

There are few variables and events already within the contract waiting for you to use them.

```
contract ZKMerkleTree {
	using InternalLeanIMT for LeanIMTData;
    LeanIMTData public mt;
    
    string public greeting = "MerkleTree";
    uint256 public totalCounter = 0;
    mapping(address => uint) public userGreetingCounter;
    mapping(bytes32 => bool) public isProved;

    event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);
    event NewLeaf(uint256 indexed index, uint256 indexed leaf);
	//...
}
```

Some of these should already look pretty familiar to you, but the newer variables are explained below.

- `mt` is the instantiation of the merkle tree data variable for `ZKMerkleTree.sol`. We are using the methods defined in `InternalLeanIMT` as operators for the `LeanIMTData` type.
- `isProved` is a mapping we will use to keep track of proofs and prevent replay attacks.
- `NewLeaf` is an event that the front end will use to index and parse memberships in order to recreate the merkle tree offchain.

Write function that will give membership to anyone that calls it and provides a hashed secret. It should take in one `uint256` value and emit the `NewLeaf` event.

```
function insert(uint256 _hashedSecret) public payable {
    mt._insert(_hashedSecret);
    emit NewLeaf(mt.size-1, _hashedSecret);
}
```

You'll see a couple convenience functions already defined in the contract. They are simple getters used to look at the state of the contract's merkle tree. `getRoot()` see the root of the contract's merkle tree and `getLeafIndex()` to get the index of a leaf after it has been committed.

```
function getRoot() public view returns (uint256) {
	return mt._root();
}

function getLeafIndex(uint256 _leaf) public view returns (uint256) {
	return mt._indexOf(_leaf);
}
```

<!-- Before you can deploy the contract you will need to modify the deployment script (`packages/hardhat/deploy/00_deploy_your_contract.ts`) so that the libraries will work properly.

In most cases solidity libraries use functions labelled `internal`, but the merkle tree library implementation we are depending on calls a library function labelled `public`. Because of the strange way [solidity handles libraries](https://docs.soliditylang.org/en/v0.7.4/contracts.html#libraries), mainly if a function is `internal` it is directly compiled into the calling contract, but if it is not a kind of internal call then [`DELEGATECALL`](https://www.evm.codes/?fork=cancun#f4) will be used and we are required to deploy it and pass its address to the calling contract. 

Deploy the `PoseidonT3` contract, it is a dependency of the `InternalLeanIMT` library that is used.

```
const poseidon = await deploy("PoseidonT3", {
	from: deployer,
	log: true,
	autoMine: true
});
```

Pass its `address` as a library to `ZKMerkleTree`'s deployment function.

```
await deploy("ZKMerkleTree", {
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
``` -->

Run `yarn deploy` to deploy the new version of `ZKMerkleTree.sol`.

---
## Checkpoint 2: Noir Merkle Proof Verification Circuit
Here you'll use the [noir programming language](https://noir-lang.org/) to write a program to verify a  merkle tree inclusion proof in zero knowledge. We would never be able, or at lease it would be unbearably difficult, to prove inclusion in a merkle tree anonymously with solidity alone. Luckily, noir comes to our rescue. Noir is a DSL (domain specific language) used to write zero knowledge circuits.

A circuit is effectively just a very complex math equation that represents a program. Noir lets us write a program and compile it into that complex math equation. The magic (math) of ZK allows us to prove and verify that we know the solution to that equation without revealing the solution. This is a very powerful primitive that let's us both preserve privacy and offload computation from places where it is expensive (like the ethereum blockchain) to places where it is cheap (like your CPU or GPU in your PC)!

The first thing we need to do for our circuit is add `zk-kit` merkle tree as dependency to `packages/nargo/circuits/your_circuit/Nargo.toml`. This library is the noir counterpart to the solidity library that you imported earlier.

```
[dependencies]
binary_merkle_root = { git = "https://github.com/privacy-scaling-explorations/zk-kit.noir", tag = "binary-merkle-root-v0.0.1", directory = "packages/binary-merkle-root" }
```

Import it into `packages/nargo/circuits/your_circuit/src/main.nr`. Right at the top of the file add the import with all the traits that are needed. While you're up here import the `hash_2` function from the noir standard library. It is an implementation of the [poseidon hash](https://www.poseidon-hash.info/). Poseidon is an efficient hash for zero knowledge circuits and will give you better performance than the standard hash functions we're used to using like `keccak256` and `sha256`.

```
use binary_merkle_root::binary_merkle_root; 
use std::hash::poseidon::bn254::hash_2;
```

You'll see a `main` function declared in `your_circuit/src/main.nr` already prepopulated with the parameters we'll be passing to the circuit. You'll see that they have different types like `Field`, `u32`, and `string`. You can read more about noir's data types in the [documentation here](https://noir-lang.org/docs/noir/concepts/data_types).

The `main` function is the entry point for any noir circuit. Anything that we want to happen in the circuit, and thus to be provable has to happen inside of `main`. The inputs to `main` can be marked `public`. In that case the value passed as that parameter must be included with the proof generated by the circuit in order to be verified. In our case we will use `public` inputs to bind proofs to the merkle tree state of our smart contract. You can read more about input visibility [here](https://noir-lang.org/docs/noir/concepts/data_types#private--public-types).

- `secret` along with `salt` are used to by the prover to claim that they know a secret value hashed behind one of leaves of the merkle tree managed by `ZKMerkleTree`. 
- `salt` a random value hashed with `secret` to generate a merkle tree leaf. In another design this could be used as a nullifier.
- `indexes` will encode the position of the merkle tree leaf.
- `siblings` is an array forming the hash path from the merkle leaf to the merkle root. Arrays in noir must be a fixed length.
- `pub_root` will be compared to the merkle root of the tree stored in `ZKMerkleTree`.
- `depth` will be the depth of the tree in `ZKMerkleTree`
- `msg` is the message we want to set `ZKMerkleTree`'s greeting to. This value doesn't actually do anything inside of the circuit, but it is a good practice to tie any values that change the state of a smart contract directly to the proof giving validity to those changes otherwise the proof could be used to front run the authentic contract call with different values. Strings in noir must be a fixed length.

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

Inside of the `main` function generate the merkle `leaf` by feeding `secret` and `salt` to `hash_2`.

```
let leaf = hash_2([secret, salt]);
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

Calculate the merkle root. You'll need to convert the index to bits, first. Then pass the `hash_2`, `leaf`, `siblings_num`, `index_bits`, and `siblings` to the `binary_merkle_root` that you imported earlier. If you're curious about the inner working of the calculation [check out the function code](https://github.com/privacy-scaling-explorations/zk-kit.noir/blob/54de5f14ec1a510d4a60db4278e52c919892b975/packages/binary-merkle-root/src/lib.nr#L10).

```
let index_bits: [u1; 4] = indexes.to_le_bits();

let bin_root = binary_merkle_root(hash_2, leaf, siblings_num, index_bits, siblings);
```

Now `assert` that `pub_root` and the calculated `bin_root` are the same value.

```
assert(pub_root == bin_root);
```

The `assert` statement allows you to add constraints to your zero knowledge circuit. If the boolean statement in an `assert` evaluates to `false` then a valid proof cannot be constructed. Learn more about `assert`s [here](https://noir-lang.org/docs/noir/concepts/assert).

For safe measure we can add assertions that `depth` is less than the length of `siblings`, and that `msg` is in fact equal to itself.

```
assert(depth <= siblings.len());
assert(msg == msg);
```

Run `yarn nargo:compile` in your terminal to compile `your_circuit` and generate its associated files. If this command fails go back to `Checkpoint 0` and make sure you have all the dependencies installed.

## Checkpoint 3: Circuit Smart Contract Verifier

After running `yarn nargo:compile` you'll find that a new solidity file in your contracts directory. Import the new contract into `ZKMerkleTree.sol` and inherit `UltraVerifier` in `ZKMerkleTree`.

```
import "./your_circuitVerifier.sol";

contract ZKMerkleTree is UltraVerifier {
//...
}
```

Write a function that takes in the a proof and public values for `your_circuit`.

```
function setGreetingAnon(bytes calldata _proof, bytes32[] calldata _publicInputs) public {
//...
}
```

The public inputs to the noir circuit  will be gathered together as a `bytes32[]` array and passed to `ZKMerkleTree` as calldata along with the proof of your circuit's execution. They will be arranged in the order you defined in the `main` function of `your_circuit/src/main.nr`. 

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
Each character of the `msg` input parameter from our noir program will be its own element of the array. You'll need to gather them into a single `bytes32` and place each in the correct position. Here we use an [array slice](https://docs.soliditylang.org/en/v0.8.30/types.html#array-slices) to achieve this and then iterate through to map the characters in the correct order.

Check that the `proved_root` and `proved_depth` values match those stored by `ZKMerkleTree`.

```
require(proved_root == mt._root(), "Root does not match");
require(proved_depth == mt.depth, "Depth does not match");
```

And check the validity of the proof.

```
bool validity = this.verify(_proof, _publicInputs);
require(validity == true, "Invalid proof");
```

After the proof is found to be valid set the greeting message of `ZKMerkleTree` to the message tied to the proof.

```
greeting = string(abi.encode(message));
totalCounter += 1;
```

As this function stands anyone could dig through old transactions and replay a proof to reset the greeting to the value tied to the proof. It is good practice to track if a proof has been used before. Add a `mapping` from `bytes32` to a `bool` in `ZKMerkleTree`.

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

Now let's use our front end to actually interact with the smart contract and circuit we just developed! Here you'll commit to a secret that will be hidden within the merkle tree stored in your smart contract. 

Click on the `MerkleUI` tab in your front end. You'll see two main components on the page.

<img src="https://github.com/user-attachments/assets/5e8a1cf0-d528-4c47-b954-6f933550b8c7" width="500">

In the input field under `Secret:` enter a string you'd like to use as your secret. If you'd like to generate a new salt for you're commitment you can click the refresh button beside the `Salt:` heading. Below you will see the `Hash:` heading with the calculated hash of your secret input and the salt. 

<img src="https://github.com/user-attachments/assets/3ec3afaf-be74-4e63-83d3-137fecc3ad03" width="500">

When you're ready click the `Commit` button and your secret commitment will be added to the merkle tree in `ZKMerkleTree`. You can click on the `Commit Info:` heading below to expand and see your commitment information. Click on the `Copy to Clipboard` button to copy it to your clipboard.

Now your secret is hidden in the smart contract's merkle root. You're the only one that knows this secret!

---
## Checkpoint 5: Frontend Secret Prover

If we tried to use a regular merkle proof to prove membership it would expose your secret to everyone that can see a transaction on the blockchain. Not only would you no longer have kept your secret hidden but a regular merkle proof could be used traced back directly to you. This is why we made a zero knowledge circuit. It allows you to both use your secret without exposing it and preserve your anonymity. Let's try it out!

Open your front end in a new incognito or private window.

Paste your commitment info into the input field below the `Leaf Info:` heading.

Enter a string you would like to set the contract greeting to in the input field beneath the `Message:` heading. Be careful to ensure that the string you enter is the same length as the string defined as an input in `your_circuit`, otherwise the field will warn you and the circuit will fail to execute.

<img src="https://github.com/user-attachments/assets/e9361acc-d1c6-428d-9835-0bc67eeff0e5" width="500">

Beneath you can click `Circuit Inputs:` to expand and view the input parameters that will be passed to `your_circuit`.

Click the `Execute` button. If everything is running correctly it will enable the `Prove` button beside it. Click `Prove`, a loading circle will begin to spin. It may take a couple moments for your browser to generate the proof, be patient with it. If the proof is valid the loading icon will turn into a check and the `Set Greeting` button will be enabled, you can click this button to send a transaction with the generated proof and set the greeting in `ZKMerkleTree` to the string you entered in the `Message:` field.

<img src="https://github.com/user-attachments/assets/443f7750-7100-40f4-a261-53f83cc83e97" width="500">

If you've made it this far congratulations! You've made your first onchain zero knowledge circuit with noir, that's a big accomplishment.

---
