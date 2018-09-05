var Handlebars = require('handlebars');
var template = require('./template.js');
var fs = require('fs')

module.exports = function(contracts){
    for (var contract in contracts) {
        contracts[contract].source = Object.keys(contracts[contract].sources)[0]
        for (var func in contracts[contract].output.abi) {
            for (var dd in contracts[contract].output.devdoc.methods) {
                if(dd.startsWith(contracts[contract].output.abi[func].name)){
                    contracts[contract].output.abi[func].devdoc = contracts[contract].output.devdoc.methods[dd]
                }
            }
        }
    }
    //console.log(JSON.stringify(contracts[0].output.abi, null, 2))
    var templ = Handlebars.compile(template);
    var output    = templ({contracts});
    fs.writeFileSync(process.cwd() + '/docs/README.md',output,{encoding:'utf8',flag:'w'})
}