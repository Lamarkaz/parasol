#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var watch = require('node-watch');
var fse = require('fs-extra')
var ganache = require("ganache-cli");
var solc = require('solc');
var read = require('fs-readdir-recursive')
var docs = require('./docs.js')
var Web3 = require('web3');
var rimraf = require('rimraf');
var path = require('path');
var colors = require('colors');
var repl = require('repl');
var stubber = require('async-repl/stubber');

var replInstance = null;

program
  .version('1.0.0')
  .option('init', 'Initialize a new Parasol project in this folder')
  .option('dev', 'Run development environment (Default)')
  .option('deploy [network]', 'Deploy to network (Default network: Mainnet)')
  .option('test', 'Run unit tests')
  .parse(process.argv);

  
  var compile = async function(web3, accounts, network) {
    var networklist = ['mainnet', 'ropsten', 'infuranet', 'kovan', 'rinkeby']
    if((networklist.indexOf(network) > -1)) {
        var web3 = new Web3('https://'+network+'.infura.io');
    } else if(network != "dev") { 
        var web3 = new Web3();
    }
    if(network != "dev" && Array.isArray(accounts) && accounts.length > 0){
        var addresses = []
        for (var i = 0; i < accounts.length; i++) {
            if(!accounts[i].startsWith('0x')){
                accounts[i] = '0x'+accounts[i]
            }
            addresses[i] = await web3.eth.accounts.wallet.add(accounts[i]).address;
        }
        accounts = addresses;
    }
    if(config.contracts === "*"){
        var contracts = read(process.cwd() + '/contracts/')
    }else{
        var contracts = []
        for (var i = 0; i < config.contracts; i++) {
            contracts.push(read(process.cwd() + '/contracts/'+config.contracts[i])); //TODO: Test
        }
    }
    var sources = {}
    for (var i = 0; i < contracts.length; i++) {
        if(sources[contracts[i]] != null) {
            console.log(("Error: Duplicated file name found: " + contracts[i]).red)
        } else {
            console.log(('Compiling ' + contracts[i]).blue)
            sources[contracts[i]] = fs.readFileSync(process.cwd() + '/contracts/' + contracts[i], 'utf8');
        }
    }
    var output = solc.compile({ sources, settings:config.solc }, 1)
    var abort = false;
    // Print errors
    var errors = output.errors;
    if(errors != null) {
        for (var i = 0; i < errors.length; i++) {
            if (errors[i].includes("Error")) {
                abort = true;
                console.log(errors[i].red)
            } else {
                console.log(errors[i].red.yellow)
            }
        }
    }
    if(abort) {
        console.log("Errors have been found while compiling contracts. Aborting.".red)
        watcher.close();
        process.exit()
    }else{
        rimraf.sync(process.cwd() + '/ABI/*');
        var contractDocs = [];
        var instances = {}
        for (var contractName in output.contracts) {
            console.log(("Deploying " + contractName).blue);
            var metadata = JSON.parse(output.contracts[contractName].metadata)
            var cDocs = metadata;
            metadata.contractName = contractName;
            contractDocs.push(cDocs);
            var ABI = metadata.output.abi
            var instance = new web3.eth.Contract(ABI, {data: '0x'+output.contracts[contractName].bytecode, from:accounts[0], gasPrice:"0", gas: 6000000});
            instances[contractName] = instance;
            var filename = contractName.replace(".","_").replace(":","-") + '.json';
            fse.outputFileSync(process.cwd() + '/ABI/' + filename,JSON.stringify(ABI, null, 2),{encoding:'utf8',flag:'w'});
        }
        if(network === "dev" && (program.dev || !process.argv.slice(2).length)) {
            replInstance.displayPrompt()
        }
        config.deployer(instances, network, web3, function(contracts, net){
            if(net === "dev"){ // Only runs tests in dev environment
                var Mocha = require('mocha');
                var mocha = new Mocha();
                var testDir = process.cwd() + '/tests'
                // Add each .js file to th e mocha instance
                var files = fs.readdirSync(testDir).filter(function(file){
                    // Only keep the .js files
                    return file.substr(-3) === '.js';

                })
                for (var i = 0; i < files.length; i++) {
                    delete require.cache[require.resolve(path.join(testDir, files[i]))]
                    mocha.addFile(path.join(testDir, files[i]))
                }
                // In order to pass contracts to mocha tests
                global.web3 = web3;
                global.contracts = contracts;
                global.address0 = "0x0000000000000000000000000000000000000000";
                global.accounts = accounts;
                global.assert = require('assert');
                global.assertRevert = function(e) {
                    global.assert(e.results[Object.keys(e.results)[0]].error, 'revert')
                }
                // Run the tests.

                mocha.run(function(){
                    if(network === "dev" && (program.dev || !process.argv.slice(2).length)) {
                        replInstance.displayPrompt()
                    }
                });
            }
        });
        docs(contractDocs)
    }
}

if (program.dev || !process.argv.slice(2).length) {
    if (fs.existsSync("./parasol.js")) {
        var config = require(process.cwd()+'/parasol.js');
        var web3 = new Web3(ganache.provider(config.dev));
        console.log(('Ethereum development network running on port ' + config.dev.port).blue)
        web3.eth.getAccounts().then(function(accounts){
            replInstance = repl.start({ prompt: 'parasol> '.bold.cyan, useGlobal:true, ignoreUndefined:true, useColors:true });
            replInstance.defineCommand('help', {
                action: function(){
                    console.log(`
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
                    `)
                    replInstance.displayPrompt()
                }
            })
            replInstance.defineCommand('recompile', {
                action: function(){
                    compile(web3, accounts, "dev")
                }
            })
            replInstance.defineCommand('deploy', {
                action: function(network){
                    console.log(network)
                    deploy(network)
                }
            })
            replInstance.on('exit', () => {
                console.log('Shutting down Parasol development environment'.blue);
                watcher.close();
                process.exit();
            });
            stubber(replInstance);
            compile(web3, accounts, "dev");
            global.watcher = watch('./', { recursive: true }, function(evt, name) {
                if((name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.sol')) && !name.startsWith('ABI/')) {
                    console.log('%s changed. Recompiling.'.blue, name);
                    compile(web3, accounts, "dev")
                    replInstance.displayPrompt()
                }
            });
        })
    } else {
        console.log('This is not a valid Parasol project. Please run "parasol init" in an empty directory to initialize a new project.'.red)
    }
}

if (program.init) {
    if(fs.existsSync("./parasol.js")){
        console.log('This directory already contains a Parasol project'.red)
    } else {
        try {
            fse.copySync(__dirname + '/init/', './')
            console.log('Parasol project created successfully!'.green)
          } catch (err) {
            console.error(err.red)
          }
    }
}

if(program.test) {
    if (fs.existsSync("./parasol.js")) {
        var config = require(process.cwd()+'/parasol.js');
        var web3 = new Web3(ganache.provider(config.dev));
        console.log(('Ethereum development network running on port ' + config.dev.port).blue)
        web3.eth.getAccounts().then(function(accounts){
            compile(web3, accounts, "dev");
        })
    } else {
        console.log('This is not a valid Parasol project. Please run "parasol init" in an empty directory to initialize a new project.'.red)
    }
}

global.deploy = function(network){
    if(network === true || network === ""){
        network = "mainnet"
    }
    var config = require(process.cwd()+'/parasol.js');
    var secrets = require(process.cwd()+'/secrets.json');
    console.log(('Deploying contracts to ' + network).blue)
    compile(web3, secrets, network);
}

if(program.deploy) {
    if (fs.existsSync("./parasol.js")) {
        deploy(program.deploy)
    } else {
        console.log('This is not a valid Parasol project. Please run "parasol init" in an empty directory to initialize a new project.'.red)
    }    
}
