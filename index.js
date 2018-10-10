#!/usr/bin/env node

var fs = require('fs');
var program = require('commander');
var watch = require('node-watch');
var fse = require('fs-extra')
var ganache = require("ganache-cli");
var solc = require('solc');
var read = require('fs-readdir-recursive')
var docs = require('./docs')
var addressbook = require('./addressbook')
var literals = require('./literals')
var Web3 = require('web3');
var rimraf = require('rimraf');
var path = require('path');
var colors = require('colors');
var repl = require('repl');
var stubber = require('async-repl/stubber');
var psol = require('psol')
var logger = require('./logger');
const resnap = require('resnap')()

if(fs.existsSync("./parasol.js")){
    var config = require(process.cwd()+'/parasol.js');
}

var replInstance = null;

program
  .version(require('./package.json').version)
  .option('init', 'Initialize a new Parasol project in this folder')
  .option('dev', 'Run development environment (Default)')
  .option('deploy [network]', 'Deploy to network (Default network: Mainnet)')
  .option('interact [network]', 'Interact with deployed contracts on a [network]')
  .option('test', 'Run unit tests')
  .parse(process.argv);

  
  var compile = async function(web3, accounts, network) {
    resnap();
    var config = require(process.cwd()+'/parasol.js');
    var networklist = ['mainnet', 'ropsten', 'infuranet', 'kovan', 'rinkeby']
    if((networklist.indexOf(network) > -1)) {
        var web3 = new Web3('https://'+network+'.infura.io');
    } else if(network != "dev") { 
        var web3 = new Web3(network);
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
        var contracts = config.contracts
    }
    var sources = {}
    for (var i = 0; i < contracts.length; i++) {
        if(sources[contracts[i]] != null) {
            logger.warning("Warning: Duplicated file name found: " + contracts[i]) // Is this necessary?
        } else {
            sources[contracts[i]] = fs.readFileSync(process.cwd() + '/contracts/' + contracts[i], 'utf8');
        }
    }
    var abort = false;
    var context = {
        ignored: [],
        ignore: function (self) {
            this.ignored.push(self.source);
        },
        aborted: false,
        abortReason:"unknown",
        abort: function(reason) {
            abort = true;
            this.aborted = true;
            if(typeof reason === "string") {
                this.abortReason = reason;
            }
        },
        strict: config.preprocessor.strict,
        parasol: require('./hooks'),
        test: function (context, description, statement) {
            if(this.network === "dev") {
                this.parasol.onTest(context, description, statement);
            }
        },
        assertRevert: function(e) {
            global.assert(e.results[Object.keys(e.results)[0]].error, 'revert')
        },
        web3,
        accounts,
        network
    }
    psol(sources, context, config.preprocessor)

    for (var i = 0; i < context.ignored.length; i++) {
        for (source in sources) {
            if (source.startsWith(context.ignored[i])) {
                logger.warn('Preprocessor ignoring compilation of ' + source)
                delete sources[source];
            }
        }
    }

    var output = solc.compile({ sources: sources, settings:config.solc }, 1)

    // Print errors
    var errors = output.errors;
    if(errors != null) {
        if(context.strict || config.preprocessor.strict) {
            abort = true;
        }
        for (var i = 0; i < errors.length; i++) {
            if (errors[i].includes("Error")) {
                abort = true;
                context.parasol.executeErrors(errors)
                logger.error(errors[i])
            } else {
                logger.warning(errors[i])
            }
        }
    }
    if(abort) {
        if(context.aborted) {
            logger.error('Deployment aborted by preprocessor. Abort reason: ' + context.abortReason)
        } else if(context.strict) {
            logger.error('Strict mode is active. Deployment will abort due to errors or warnings')
        } else {
            logger.error("Errors have been found while compiling contracts. Aborting.")
        }
    }else{
        rimraf.sync(process.cwd() + '/ABI/*');
        var contractDocs = [];
        var instances = {}
        for (var contractName in output.contracts) {
            logger.success('Compiled ' + contractName)
            if(output.contracts[contractName].metadata.length > 0){ //Skip interface contracts
                var metadata = JSON.parse(output.contracts[contractName].metadata)
                var cDocs = metadata;
                metadata.contractName = contractName;
                contractDocs.push(cDocs);
                var ABI = metadata.output.abi;
                var bytecode = output.contracts[contractName].bytecode;
                var instance = new web3.eth.Contract(ABI, {data: bytecode, from:accounts[0], gasPrice:"0", gas: 6000000});
                instances[contractName] = instance;
                var filename = contractName.replace(".","_").replace(":","-") + '.json';
                fse.outputFileSync(process.cwd() + '/ABI/' + filename,JSON.stringify(ABI, null, 2),{encoding:'utf8',flag:'w'});
                context.parasol.executeCompiled(contractName);
            }
        }
        if(network === "dev" && (program.dev || !process.argv.slice(2).length)) {
            replInstance.displayPrompt()
        }
        config.deployer(instances, network, web3, function(contracts){
            if(contracts[Object.keys(contracts)[0]].currentProvider.ganache === true){ // Only runs tests in dev environment
                var Mocha = require('mocha');
                var mocha = new Mocha();
                var testDir = process.cwd() + '/tests'
                // Add each .js file to the mocha instance
                var files = fs.readdirSync(testDir).filter(function(file){
                    // Only keep the .js files
                    return file.substr(-3) === '.js';

                })

                if(Object.keys(context.parasol.tests).length > 0) {
                    for (file in context.parasol.tests) {
                        var suite = Mocha.Suite.create(mocha.suite, file + ": Inline tests");
                        for (test in context.parasol.tests[file]) {
                            suite.addTest(new Mocha.Test(test, context.parasol.tests[file][test]))
                        }
                        //var runner = new Mocha.Runner(suite);
                        //runner.run();
                    }
                }

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
        },
        function(contracts){
            context.parasol.executeDeployed(contracts)
            addressbook.add(contracts);
        });
        docs(contractDocs)
    }
}

if (program.dev || !process.argv.slice(2).length) { // Default argument
    if (fs.existsSync("./parasol.js")) {
        var provider = ganache.provider(config.dev)
        provider.ganache = true;
        var web3 = new Web3(provider);
        logger.success('Ethereum development network running on port ' + config.dev.port)
        web3.eth.getAccounts().then(function(accounts){
            replInstance = repl.start({ prompt: 'parasol> '.bold.cyan, useGlobal:true, ignoreUndefined:true, useColors:true });
            replInstance.defineCommand('help', {
                action: function(){
                    console.log(literals.dev)
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
                    deploy(network)
                }
            })
            replInstance.on('exit', () => {
                logger.info('Shutting down Parasol development environment'.blue);
                watcher.close();
                process.exit();
            });
            stubber(replInstance);
            compile(web3, accounts, "dev");
            global.watcher = watch('./', { recursive: true }, function(evt, name) {
                if((name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.sol') || name.endsWith('.psol')) && !name.startsWith('ABI/')) {
                    logger.info(name + ' changed. Recompiling.');
                    compile(web3, accounts, "dev")
                    replInstance.displayPrompt()
                }
            });
        })
    } else {
        logger.error('This is not a valid Parasol project. Please run "parasol init" in an empty directory to initialize a new project.')
    }
}

if (program.init) {
    if(fs.existsSync("./parasol.js")){
        logger.error('This directory already contains a Parasol project')
    } else {
        try {
            fse.copySync(__dirname + '/init/', './')
            logger.success('Parasol project created successfully!')
          } catch (err) {
            logger.error(err)
          }
    }
}

if(program.test) {
    if (fs.existsSync("./parasol.js")) {
        var provider = ganache.provider(config.dev)
        provider.ganache = true;
        var web3 = new Web3(provider);
        logger.info('Ethereum testing network running on port ' + config.dev.port)
        web3.eth.getAccounts().then(function(accounts){
            compile(web3, accounts, "dev");
        })
    } else {
        logger.error('This is not a valid Parasol project. Please run "parasol init" in an empty directory to initialize a new project.')
    }
}

global.deploy = function(network){
    if(network === true || network === ""){
        network = "mainnet"
    }
    var secrets = require(process.cwd()+'/secrets.json');
    logger.info('Deploying contracts to ' + network)
    compile(web3, secrets, network);
}

if(program.deploy) {
    if (fs.existsSync("./parasol.js")) {
        deploy(program.deploy)
    } else {
        logger.error('This is not a valid Parasol project. Please run "parasol init" in an empty directory to initialize a new project.')
    }    
}

if(program.interact) {
    (async function () {
        var network = "mainnet"
        if(program.interact != true){
            network = program.interact
        }
        var networklist = ['mainnet', 'ropsten', 'infuranet', 'kovan', 'rinkeby']
        if((networklist.indexOf(network) > -1)) {
            global.web3 = new Web3('https://'+network+'.infura.io');
        } else { 
            global.web3 = new Web3(network);
        }

        addressbook.checkNetwork(network);

        var files = read(process.cwd() + '/ABI');

        global.contracts = {}

        for (var i = 0; i < files.length; i++) {
            var newName = files[i].replace("_",".").replace("-",":").slice(0, -5)
            var interface = JSON.parse(fs.readFileSync(process.cwd() + "/ABI/" + files[i], 'utf8'));
            contracts[newName] = new global.web3.eth.Contract(interface, addressbook.get()[network][newName])
        }

        if(contracts.length === 0){
            logger.error('There are are no contract interfaces in your ABI/ directory. Please deploy your contracts first')
            process.exit()
        }

        if(fs.existsSync("./secrets.json")){
            var accounts = require(process.cwd()+'/secrets.json');
            var addresses = []
            for (var i = 0; i < accounts.length; i++) {
                if(!accounts[i].startsWith('0x')){
                    accounts[i] = '0x'+accounts[i]
                }
                addresses[i] = await global.web3.eth.accounts.wallet.add(accounts[i]).address;
            }
            global.accounts = addresses;
        }else{
            global.accounts = {}
        }
        global.address0 = "0x0000000000000000000000000000000000000000";
        global.assert = require('assert');
        global.assertRevert = function(e) {
            global.assert(e.results[Object.keys(e.results)[0]].error, 'revert')
        }
        logger.info('Parasol interacting with contracts on ' + network)
        replInstance = repl.start({ prompt: 'parasol> '.bold.cyan, useGlobal:true, ignoreUndefined:true, useColors:true });
        replInstance.defineCommand('help', {
            action: function(){
                console.log(literals.interact)
                replInstance.displayPrompt()
            }
        })
        replInstance.on('exit', () => {
            logger.info('Shutting down Parasol interaction console');
            process.exit();
        });
        stubber(replInstance);
    })()
}
