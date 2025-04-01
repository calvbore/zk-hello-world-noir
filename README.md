# Noir Starter Kit

This scaffold-eth 2 extension provides an additional workspace to work on noir programs and integrate them with your web3 applications.

## Requirements

In addition the scaffold-eth 2 requirements you will need to install the noir tools:

- [Nargo](https://noir-lang.org/docs/getting_started/quick_start#installation)
```

curl -L https://raw.githubusercontent.com/noir-lang/noirup/refs/heads/main/install | bash
noirup
```

- [bb](https://noir-lang.org/docs/getting_started/quick_start#proving-backend)

```
curl -L https://raw.githubusercontent.com/AztecProtocol/aztec-packages/refs/heads/master/barretenberg/bbup/install | bash
bbup
```

Check your `nargo` and `bb` versions:

```
nargo --version
```

Should read at least `nargo version = 1.0.0-beta.2`.

And inside the nargo workspace:

```
cd packages/nargo
bb --version
```

Should read at least `0.72.1`.

## Usage

```
npx create-eth@latest -e calvbore/noir-starter-kit
```

### Foundry

If you are opting to use the foundry flavour of scaffold-eth 2 then you should make sure that the optimizer is enabled in `foundry.toml`, simply add `optimizer = true` under `[profile.default]`, otherwise the compiler will likely throw a stack too deep error.

```
[profile.default]
optimizer = true
```

### Commands

#### `compile`

To compile all your circuits in the nargo workspace:

```
yarn nargo:compile
```

This command will generate a solidity verifier contract in you solidity workspace and the necessary objects and files to work with your circuits in the nextjs app workspace.

#### `new`

To add a circuit to the the nargo workspace use:

```
yarn nargo:new <name>
```

This will create a new circuit in `/packages/nargo/circuits/<name>/src/main.nr` and a new entry in the workspace `nargo.toml` file. If a new circuit is created without this command it will not be tracked and may cause issues with your workflow. 

#### `delete`

To remove a circuit use:

```
yarn nargo:delete <name>
```

This will remove the circuit from the nargo workspace and its entries in `nargo.toml` as well as any artifacts created by the compilation of circuits including its verifier smart contract and objects exported to both your solidity (hardhat or foundry) and nextjs app workspaces. Manually removing circuits may cause issues with your workflow.

#### `test`

To test your circuits in the nargo workspace:

```
yarn nargo:test
```

Will run any tests you have defined in your circuits' noir files.

### Additional Packages

To test your verifier smart contracts you may want to install `@aztec/bb.js`, `@noir-lang/noir_js`, and `@noir-lang/noir_wasm` in your solidity workspace.

For hardhat:
```
yarn workspace @se-2/hardhat add -D @aztec/bb.js @noir-lang/noir_js @noir-lang/noir_wasm
```

For foundry:
```
yarn workspace @se-2/foundry add -D @aztec/bb.js @noir-lang/noir_js @noir-lang/noir_wasm
```

### Solidity Verifier

The `yarn nargo:compile` command will generate a solidity verifier contract and put it in your `contracts` directory. All you need to do is import it into your solidity file and inherit `UltraVerifier` in the contract that you would like to verify proofs with.

```
import "./your_circuitVerifier.sol";

contract YourContract is UltraVerifier {
    //...
}
```

`UltraVerifier` comes equipped with a `verify()` function that you can feed your proof data and public values into and receive a `bool` to check the proof's validity.

```
function verify(bytes calldata _proof, bytes32[] calldata _publicInputs) external view returns (bool);
```

Because the visibility of this function is set to `external` in order to use it within your contract you will need use an external call in a similar manner as this:

```
//...
bool validity = this.verify(_proof, _publicInputs);
require(validity == true);
//...
```