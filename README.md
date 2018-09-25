# Parasol
Agile Smart Contract Development Environment

## Features
* Instant zero-configuration contract deployments using INFURA
* Async-REPL Javascript session to interact with deployed contracts & web3
* Integrated Markdown contract documentation using Natspec + ABI
* Extended Mocha unit tests
* Auto-recompiling, tests & documentation on file change
* Unlimited customizability, exposure of all dependency configs
* Unopinionated design, low design pattern restrictions

## Installation
`sudo npm i -g parasol-cli`

`parasol --help` for list of commands
## Usage

##### Initialize project structure:
`parasol init`

##### Run development environment:
`parasol`

## Documentation
Parasol full documentation is available for both beginner and advanced users at the [Lamarkaz Developer Portal](https://developer.lamarkaz.com/parasol/)

## Interactive Javascript Session
The development environment will automatically spawn a REPL Javascript interative session on startup. The new session allows you to interact synchronously with your deployed contracts and the web3 instance. It also allows you access to a set of handy global variables.

In order to print the list of available global variables and commands just type `.help` in the interactive shell.

A nice feature of the Parasol session is that it automatically handles Promises synchronously. This makes life easier when interacting with contracts and web3.

## Contract Deployment
INFURA.io is the default node endpoint for Parasol deployments on all supported networks. The available networks are: `mainnet`, `ropsten`, `kovan`, `rinkeby` and `infuranet`
1. Create a `secrets.json` file in your project directory containing an array of at least one private key with sufficient balance to deploy contracts.
`["YOURPRIVATEKEY"]`
Don't worry, this file is `.gitignore`d on the repo. It will never be exposed using Git.
2. Select your network of choice and run the following command:
`parasol deploy [network]` where `[network]` is a network from the list above.
If you only run `parasol deploy`, the contracts will be deployed to the mainnet by default.
3. To interact with your live contracts using the interactive Javascript session, simply type:
`parasol interact [network]` where `[network]` is a network from the list above. The default network is `mainnet`.

## Unit Tests
All Javascript mocha unit tests must be inside the `tests` directory in order to run. The tests are automatically run on `parasol` and are rerun on file changes in the tests, Solidity contracts or the `parasol.js` config file. Alternatively, you may run tests manually using `parasol test`. Unit tests in Parasol have no restrictions on file names or location inside the tests folder; they are disconnected from smart contract names and file names.

## Documentation Generation
Just running the `parasol` command, or in addition to any of the `dev`, `deploy` and `test` arguments will automatically generate a single `README.md` markdown file in the `docs/` directory containing Natspec Devdoc and ABI documentation for all compiled contracts. Additionally, while actively running the `parasol` command, the documentation file will be regenerated on every change.

## Principles
#### 1. Separation of Concerns
Most existing development environments are designed for dApps, not for smart contracts. Developers are restricted to the Migration smart contracts design pattern as required by other development environments to facilitate dApp versioning. Parasol puts into consideration developers who intend to develop pure smart contracts and avoids restricting them to a specific dApp design pattern.
#### 2. Freedom
Parasol aims to implement as little abstraction on top of its dependencies as possible. It provides direct configuration access to its core components such as [solc](https://github.com/ethereum/solc-js) and [ganache](https://github.com/trufflesuite/ganache-cli). Additionally, it allows the user the freedom to customize and contract deployment logic through the `deployer()` function in the configuration file.
#### 3. Agility
Agile development is important for the entire smart contract development cycle, not only for the Solidity contracts themselves. In the realm of Solidity, unit tests can end up taking substantially longer to perfect than their source contracts. Hence, they consume more time. And then comes, documentation. In Parasol's development environment, any changes made to unit tests, smart contract source code or any js/json file will immediately and quickly recompile all code, run static analysis, redeploy on ganache, recompile documentation and rerun unit tests. 

## Future
* Integrating Solidity style & security linting and auto-fixing using [Solium](https://solium.readthedocs.io/en/latest/).

## Contributions
are very welcome
