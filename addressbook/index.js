var jsonfile = require('jsonfile');

module.exports = {
    get: function() {
        return jsonfile.readFileSync(process.cwd() + '/addressbook.json');
    },
    add: function(contracts) {
        if(contracts[Object.keys(contracts)[0]].currentProvider.ganache === undefined) {
            const assign = require('assign-deep');
            for (var contract in contracts) {
                var host = contracts[contract].currentProvider.host
                var network = /(?<=https:\/\/).*?(?=.infura.io)/.exec(host)
                const file = process.cwd() + '/addressbook.json';
                var book = jsonfile.readFileSync(file)
                if(network === null){
                    var obj = {
                        [host]:{
                            [contract]:contracts[contract].options.address
                        }
                    }
                }else {
                    var obj = {
                        [network]:{
                            [contract]:contracts[contract].options.address
                        }
                    }
                var result = assign(book, obj)                    }
                jsonfile.writeFileSync(file, result, { spaces:2 })
            }
        }
    },
    checkNetwork: function(network) {
        var book = require(process.cwd()+'/addressbook.json');
        if(typeof book[network] === "undefined") {
            console.log(("There are no contracts registered for this network in your address book. Please make sure you deploy your contracts to " + network + " first").red)
            process.exit()
        }
    }
}