//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "hardhat/console.sol";

import { InternalLeanIMT, LeanIMTData } from "@zk-kit/lean-imt.sol/LeanIMT.sol";


contract ZKMerkleTree {
    using InternalLeanIMT for LeanIMTData;
    LeanIMTData public mt;
    // State Variables
    string public greeting = "MerkleTree";
    uint256 public totalCounter = 0;
    mapping(address => uint) public userGreetingCounter;
    mapping(bytes32 => bool) public isProved;

    // Events: a way to emit log statements from smart contract that can be listened to by external parties
    event GreetingChange(address indexed greetingSetter, string newGreeting, bool premium, uint256 value);
    event NewLeaf(uint256 indexed index, uint256 indexed leaf);

    constructor() {}

    function insert(uint256 _hashedSecret) public payable {
        //...
    }

    function getRoot() public view returns (uint256) {
        return mt._root();
    }

    function getLeafIndex(uint256 _leaf) public view returns (uint256) {
        return mt._indexOf(_leaf);
    }

    function setGreetingAnon(bytes calldata _proof, bytes32[] calldata _publicInputs) public {
        //...
    }
} 