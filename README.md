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

## Usage

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
yarn workspace @se-2/hardhat add @aztec/bb.js @noir-lang/noir_js @noir-lang/noir_wasm
```

For foundry:
```
yarn workspace @se-2/foundry add @aztec/bb.js @noir-lang/noir_js @noir-lang/noir_wasm
```