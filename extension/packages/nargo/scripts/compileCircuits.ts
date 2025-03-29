import fs from 'fs';
import { execSync } from 'child_process';
import * as TOML from '@iarna/toml';
import { publishNargoCircuits } from './publishCircuits';

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
// @ts-ignore
let circuitsList = nargoToml.workspace.members.map(
  (name: string) => { return name.replace("circuits/", "") }
);

// circuitsList = fs.readdirSync(circuitsDir, { withFileTypes: true })
//   .filter(dirent => dirent.isDirectory())
//   .map(dirent => dirent.name).join().split(',');

console.log(circuitsList);

try {
  execSync(
    `nargo compile`,
    { stdio: 'inherit' }
  );
} catch (e) {
  console.error(e);
  process.exit();
}

// const circuitsInfo: Record<string, any> = {};

for (let i = 0; i<circuitsList.length; i++) {
  // write verification key to target directory
  try {
    execSync(
      `bb write_vk -b ${targetDir}/${circuitsList[i]}.json -o ${targetDir}/${circuitsList[i]}.vk`,
      { stdio: 'inherit' }
    );
  } catch (e) {
    console.error(e);
    process.exit();
  }
  console.log(`${circuitsList[i]} verification key compiled`);

  // generate verifier solidity file in target directory
  try {
    execSync(
      `bb contract -k ${targetDir}/${circuitsList[i]}.vk -b ${targetDir}/${circuitsList[i]}.json -o ${targetDir}/${circuitsList[i]}Verifier.sol`,
      { stdio: 'inherit' }
    );
    console.log(`${circuitsList[i]} smart contract verifier generated`)
  } catch (e) {
    console.error(e);
    process.exit();
  }

  // copy files to contract workspace
  try {
    fs.copyFileSync(
      `${targetDir}/${circuitsList[i]}Verifier.sol`,
      `${contractDir}/${circuitsList[i]}Verifier.sol`
    );
    console.log(`${circuitsList[i]} noir circuit verifier contract published to ${contractDir}/`);
  } catch (e) {
    console.error(e);
    process.exit();
  }

  // copy additional files to contract workspace
  try {
    if (!fs.existsSync(`${artifactsDir}/`)) {
      fs.mkdirSync(
        `${artifactsDir}/`,
        { recursive: true }
      );
    }
    fs.copyFileSync(
      `${targetDir}/${circuitsList[i]}.json`,
      `${artifactsDir}/${circuitsList[i]}.json`
    );
    fs.copyFileSync(
      `${targetDir}/${circuitsList[i]}.vk`,
      `${artifactsDir}/${circuitsList[i]}.vk`
    );
    console.log(`${circuitsList[i]} noir circuit data published to ${artifactsDir}/`);
  } catch (e) {
    console.error(e);
    process.exit();
  }

  // copy circuit files to app workspace
  // try {
  //   if (!fs.existsSync(`${publicDir}/`)) {
  //     fs.mkdirSync(`${publicDir}/`);
  //   }
  //   fs.copyFileSync(
  //     `${targetDir}/${circuitsList[i]}.json`,
  //     `${publicDir}/${circuitsList[i]}.json`
  //   );
  //   fs.copyFileSync(
  //     `${targetDir}/${circuitsList[i]}.vk`,
  //     `${publicDir}/${circuitsList[i]}.vk`
  //   );
  //   console.log(`${circuitsList[i]} noir circuit data published to ${publicDir}/`);
  // } catch (e) {
  //   console.error(e);
  //   process.exit();
  // }

  // const circuitJSON = JSON.parse(
  //   fs.readFileSync(`${targetDir}/${circuitsList[i]}.json`).toString()
  // );

  // circuitsInfo[circuitsList[i]] = circuitJSON;
}

publishNargoCircuits(circuitsList);

// console.log((circuitsInfo));

