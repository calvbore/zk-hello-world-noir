import fs from 'fs';
import { execSync } from 'child_process';
import * as TOML from '@iarna/toml';
import { publishNargoCircuits } from './publishCircuits';

const circuitName = process.argv[2];
const circuitsDir = `${__dirname}/../circuits`;
const targetDir   = `${__dirname}/../target`;
// const publicDir = `${__dirname}/../../nextjs/public/nargo`;

let contractDir;
let artifactsDir;
if (fs.existsSync(`${__dirname}/../../hardhat/`)) {
  contractDir  = `${__dirname}/../../hardhat/contracts`;
  artifactsDir = `${__dirname}/../../hardhat/temp/nargo`;
} else if (fs.existsSync(`${__dirname}/../../foundry/`)) {
  contractDir  = `${__dirname}/../../foundry/contracts`;
  artifactsDir = `${__dirname}/../../foundry/out/nargo`;
}

const nargoToml = TOML.parse(fs.readFileSync(`${__dirname}/../Nargo.toml`).toString());

try {
  if (
    fs.existsSync(`${circuitsDir}/${circuitName}`) ||
    // @ts-ignore
    nargoToml.workspace.members.includes(`circuits/${circuitName}`)
  ) {
    // remove circuit working directory
    fs.rmdirSync(
      `${circuitsDir}/${circuitName}`,
      { recursive: true, }
    );

    // remove circuit working directory path from nargo.toml
    // @ts-ignore
    if (nargoToml.workspace.members.includes(`circuits/${circuitName}`)) {
      // @ts-ignore
      const index = nargoToml.workspace.members.indexOf(`circuits/${circuitName}`);
      // @ts-ignore
      nargoToml.workspace.members.splice(index, 1);
      // @ts-ignore
      console.log(nargoToml.workspace.members);
      fs.writeFileSync(`${__dirname}/../Nargo.toml`, TOML.stringify(nargoToml));
    }

    // remove any compilation artifacts from target directory
    if (fs.existsSync(`${targetDir}/${circuitName}.json`)) {
      fs.rmSync(`${targetDir}/${circuitName}.json`);
    }
    if (fs.existsSync(`${targetDir}/${circuitName}.vk`)) {
      fs.rmSync(`${targetDir}/${circuitName}.vk`);
    }
    if (fs.existsSync(`${targetDir}/${circuitName}Verifier.sol`)) {
      fs.rmSync(`${targetDir}/${circuitName}Verifier.sol`);
    }
    // remove circuit data artifacts from contract workspace
    if (fs.existsSync(`${artifactsDir}/${circuitName}.json`)) {
      fs.rmSync(`${artifactsDir}/${circuitName}.json`);
    }
    if (fs.existsSync(`${artifactsDir}/${circuitName}.vk`)) {
      fs.rmSync(`${artifactsDir}/${circuitName}.vk`);
    }
    if (fs.existsSync(`${contractDir}/${circuitName}Verifier.sol`)) {
      fs.rmSync(`${contractDir}/${circuitName}Verifier.sol`);
    }
    // remove circuit data artifacts from app workspace
    // if (fs.existsSync(`${publicDir}/${circuitName}.json`)) {
    //   fs.rmSync(`${publicDir}/${circuitName}.json`);
    // }
    // if (fs.existsSync(`${publicDir}/${circuitName}.vk`)) {
    //   fs.rmSync(`${publicDir}/${circuitName}.vk`);
    // }
    // @ts-ignore
    publishNargoCircuits(nargoToml.workspace.members);
  } else {
    throw(`${circuitName} is not specified`)
  }
} catch (e) {
  console.error(e);
  process.exit();
}
