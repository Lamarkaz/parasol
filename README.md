# Parasol
Powerful Smart Contract Development Environment

## Features
* Instant zero-configuration contract deployments using INFURA
* Integrated Markdown contract documentation using Natspec + ABI
* Extended Mocha unit tests
* Auto-recompiling, tests & documentation on file change
* Unlimited customizability, exposure of all dependency configs
* Unopinionated design, low design pattern restrictions

## Principles
#### 1. Separation of Concerns
Most existing development environments are designed for dApps, not for smart contracts. Developers are restricted to the Migration smart contracts design pattern as required by other development environments to facilitate dApp versioning. Parasol puts into consideration developers who intend to develop pure smart contracts and avoids restricting them to a specific dApp design pattern.
#### 2. Freedom
Parasol aims to implement as little abstraction on top of its dependencies as possible. It provides direct configuration access to its core components such as [solc](https://github.com/ethereum/solc-js) and [ganache](https://github.com/trufflesuite/ganache-cli). Additionally, it allows the user the freedom to customize and contract deployment logic through the `deployer()` function in the configuration file.
#### 3. Agility
Agile development is important for the entire smart contract development cycle, not only for the Solidity contracts themselves. In the realm of Solidity, unit tests can end up taking substantially longer to perfect than their source contracts. Hence, they consume more time. And then comes, documentation. In Parasol's development environment, any changes made to unit tests, smart contract source code or any js/json file will immediately and quickly recompile all code, run static analysis, redeploy on ganache, recompile documentation and rerun unit tests. 

## Installation
`sudo npm -g parasol-cli`

`parasol --help` for list of commands
## Usage

##### Initialize project structure:
`parasol init`

##### Run development environment:
`parasol`

## [Documentation](https://developer.lamarkaz.com/parasol/)

## Contract Deployment
INFURA.io is the default node endpoint for Parasol deployments on all supported networks. The available networks are: `mainnet`, `ropsten`, `kovan`, `rinkeby` and `infuranet`
1. Create a `secrets.json` file in your project directory containing an array of at least one private key with sufficient balance to deploy contracts.
`["YOURPRIVATEKEY"]`
Don't worry, this file is `.gitignore`d on the repo. It will never be exposed using Git.
2. Select your network of choice and run the following command:
`parasol deploy [network]` where `[network]` is a network from the list above.
If you only run `parasol deploy`, the contracts will be deployed to the mainnet by default.

## Project Structure
After running `parasol init`, the resulting project structure is described below. All top-level directories and files are required for Parasol to function properly. That said, feel free to modify anything if you know what you're doing.
```
├── ABI/              Location of generated ABI files for each contract
├── contracts/        Solidity smart contracts location
|   ├── Token.sol     Sample contract of a minimum viable token contract
├── docs/             Location of generated markdown docs
├── tests/            Mocha unit tests location
|   ├── Token.js      Minumum sample unit token for the Token contract
├── .gitignore        Git Ignore file. Important to protect secrets.json file from being uploaded on commits
├── parasol.js        Parasol configuration file
```

## Unit Tests
All Javascript mocha unit tests must be inside the `tests` directory in order to run. The tests are automatically run on `parasol` and are rerun on file changes in the tests, Solidity contracts or the `parasol.js` config file. Alternatively, you may run tests manually using `parasol test`. Unit tests in Parasol have no restrictions on file names or location inside the tests folder; they are disconnected from smart contract names and file names.

The following Javascript global variables are available for each mocha test:
#### web3 `Object`
web3 1.0 already attached to the Ganache provider and 10 generated accounts funded with 100 ETH each. Read the web3 1.0 docs for [full API](https://web3js.readthedocs.io/en/1.0/)

#### contracts `Object`
Object of contract instances deployed on ganache. Key is relative location from contracts folder + ":" + contract name. Example: `contracts['Folder/File.sol:Token']` would return the deployed instance of a `Token` contract located at `/contracts/Folder/File.sol`. Read the web3 1.0 docs for [full API](https://web3js.readthedocs.io/en/1.0/web3-eth-contract.html)

#### address0 `String`
Short for `0x00000000000000000000000000000000000` also known as `address(0)` in solidity. Useful to reduce code redundancy.

#### accounts `Array`
Array of public Ethereum addresses of accounts attached to the above web3 instance.

#### assert `Object|Function`
The native Node.js assertion module required for basic unit tests. Read Node.js Docs for [full API](https://nodejs.org/api/assert.html)

#### assertRevert(e) `Function`
Special assertion function used to assert failure of a web3 `send` transaction. Takes a Promise error as an argument. Useful for many unit test cases specific to smart contracts.

___

In order to demonstrate the utility of available JS global variables in Mocha tests, a sample unit test was embedded in the default project structure at `/tests/Token.js`:
```javascript
describe('Token.sol', function() {
  describe('Transfer()', function() {
    it('should revert when transferred amount is smaller than 0', function() {
      contracts['Token.sol:Token'].methods.transfer(address0, -1).send().on('error', (e) => assertRevert(e))
    });
  });
});
```
Notice the above test does not `require()` any of the modules it is using, because they are global variables. Of course, you can `require()` any additional npm modules you need.

## Documentation Generation
Just running the `parasol` command, or in addition to any of the `dev`, `deploy` and `test` arguments will automatically generate a single `README.md` markdown file in the `docs/` directory containing Natspec Devdoc and ABI documentation for all compiled contracts. Additionally, while actively running the `parasol` command, the documentation file will be regenerated on every change.

## Configuration
Parasol can be customized to the lowest level at its sole configuration file `parasol.js`. The file exports an object of different properties to the `parasol` cli tool to manipulate its functionality and the functionality of its dependencies. Here's the default config file:

```javascript
module.exports = {
    dev: { // Ganache-cli options (https://github.com/trufflesuite/ganache-cli)
        port:8555,
        total_accounts:10,
        locked:false,
        debug:false,
        //logger:console,
        gasPrice: 0
    },
    contracts : "*", // To select specific contracts, replace it with an array: ["File1.sol", "Folder/File2.sol"]
    solc: { // Solidity compiler options (https://solidity.readthedocs.io/en/develop/using-the-compiler.html)
        optimizer: {
          enabled: true,
          runs: 200
        },
        evmVersion: "byzantium",
        outputSelection: {
          "*": {
            "*": [ "metadata", "evm.bytecode", "devdoc" ]
          }
        }
    },
    deployer: async function (contracts, network, web3, test) {
        for (var contract in contracts) {
            var gasPrice = "50000000000"; //50 Gwei
            if(network === "dev") {
                gasPrice = "0";
            }
            contracts[contract] = await contracts[contract].deploy().send({from: web3.eth.accounts[0], gasPrice, gas:1000000})
            console.log(contract + " deployed at address " + contracts[contract].options.address)
        }
        test(contracts, network) // Call the test function if you want to run unit tests after deployment. Tests will only run if network is dev
    }
}
```
Here's the explanation of the above configuration object:
#### dev `Object`
Development environment configuration file passed directly to ganache when running `parasol`

#### contracts `Array|String`
List of all contracts to be compiled, documented tested and deployed. Items must be file locations relative to the `contracts/` folder. Example: `['Token.sol']`.

#### solc `Object`
Solidity compiler configuration file passed directly to solc-js

#### deployer(contracts `Object`, network `String`, web3 `Object`, test(contracts, network) `Function`) `Function`
Functions deployment handler. Handles all contract deployment across all networks including development. It is also responsible for passing contracts back to Parasol after deployment using the `test()` function for potential unit tests execution if the current network is dev.
* The first arguments is an object of contract instances to be deployed. Key is of the same syntax as unit tests contract object:relative location from contracts folder + ":" + contract name.
* The second argument is a string representing the name of the current network selected by the user. If `parasol` is running, the network variable will always be `dev`. If the `deploy [network]` argument is used instead, the network variable will take the value of `[network]`. This can be used to provide the hostname and port of a private network or node to the deployer from the command line (e.g. `parasol deploy http://localhost:8540`).
* The third argument is a web3 1.0 object already populated with either ganache-generated accounts (in case of `parasol`) or accounts imported from private keys at `secrets.json` if using `parasol deploy`. Additionally, if the user specified a network that matches the name of any of INFURA's five networks, web3 will be attached to the appropriate INFURA node.
* The fourth argument is a function that takes two arguments:
`contracts` which has to be an object of the same structure as the provided contracts variable but includes deployed contract instances instead.
 `network` which has to be passed from the original `network` argument string.

## Contributions
are very welcome
