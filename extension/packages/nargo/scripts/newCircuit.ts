import fs from 'fs';
import { execSync } from 'child_process';
import * as TOML from '@iarna/toml';

const circuitName = process.argv[2];
const circuitsDir = `${__dirname}/../circuits`;

const nargoToml = TOML.parse(fs.readFileSync(`${__dirname}/../Nargo.toml`).toString());

console.log(`${process.argv[4]}`);

try {
  // create circuit working directory with nargo
  execSync(
    `nargo new ${circuitsDir}/${circuitName}${process.argv[4]? ` ${process.argv[4]}` : ``}`,
    { stdio: 'inherit' }
  );
} catch (e) {
  console.error(e);
  process.exit();
}

// add circuit working directory path to nargo.toml
// @ts-ignore
nargoToml.workspace.members.push(`circuits/${circuitName}`);
// @ts-ignore
console.log(nargoToml.workspace.members);
fs.writeFileSync(`${__dirname}/../Nargo.toml`, TOML.stringify(nargoToml));