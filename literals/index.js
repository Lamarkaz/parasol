module.exports = {
    interact: `
Parasol global variables:
    web3         web3 1.0 already attached to the Ganache provider and 10 generated accounts funded with 100 ETH each
    contracts    Object of contract instances deployed on ganache. Key is relative location from contracts/ folder + ":" + contract name
    address0     Short for 0x00000000000000000000000000000000000 also known as address(0) in solidity. Useful to reduce code redundancy
    accounts     Array of public Ethereum addresses of accounts attached to the above web3 instance
    assert       The native Node.js assertion module required for basic unit tests
    assertRevert Special assertion function used to assert failure of a web3 send transaction. Takes a Promise error as an argument.
REPL commands:
    .break       Sometimes you get stuck, this gets you out
    .clear       Alias for .break
    .editor      Enter editor mode
    .exit        Exit the repl
    .help        Print this help message
    .history     Show the history
    .load        Load JS from a file into the REPL session
    .save        Save all evaluated commands in this REPL session to a file
Documentation:
https://developer.lamarkaz.com/parasol
    `,
    dev: `
Parasol global variables:
    web3         web3 1.0 already attached to the Ganache provider and 10 generated accounts funded with 100 ETH each
    contracts    Object of contract instances deployed on ganache. Key is relative location from contracts/ folder + ":" + contract name
    address0     Short for 0x00000000000000000000000000000000000 also known as address(0) in solidity. Useful to reduce code redundancy
    accounts     Array of public Ethereum addresses of accounts attached to the above web3 instance
    assert       The native Node.js assertion module required for basic unit tests
    assertRevert Special assertion function used to assert failure of a web3 send transaction. Takes a Promise error as an argument.
Parasol commands:
    .recompile   Recompile all contracts, redeploy on devnet, recompile docs & run tests
    .deploy      .deploy [network] will deploy contracts to [network] (Default network is mainnet)
REPL commands:
    .break       Sometimes you get stuck, this gets you out
    .clear       Alias for .break
    .editor      Enter editor mode
    .exit        Exit the repl
    .help        Print this help message
    .history     Show the history
    .load        Load JS from a file into the REPL session
    .save        Save all evaluated commands in this REPL session to a file
Documentation:
    https://developer.lamarkaz.com/parasol
    `
}