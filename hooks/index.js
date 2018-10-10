module.exports = {
    onCompiled: function (context, callback) {
        if(typeof this.compiled[context.source] === "array") {
            this.compiled[context.source].push(callback);
        } else {
            this.compiled[context.source] = [callback];
        }
    },
    compiled: {},
    executeCompiled(compiledFileName) {
        for (fileName in this.compiled) {
            if (compiledFileName.startsWith(fileName)) {
                for (var i = 0; i < this.compiled[fileName].length; i++) {
                    this.compiled[fileName][i](compiledFileName)
                }             
            }
        }
    },
    onDeployed: function (context, callback) {
        if(typeof this.deployed[context.source] === "array") {
            this.deployed[context.source].push(callback);
        } else {
            this.deployed[context.source] = [callback];
        }
    },
    deployed: {},
    executeDeployed(contracts) {
        this.executeAllDeployed(contracts)
        for (contractName in contracts) {
            for (fileName in this.deployed) {
                if (contractName.startsWith(fileName)) {
                    for (var i = 0; i < this.deployed[fileName].length; i++) {
                        this.deployed[fileName][i](contracts[contractName], contractName)
                    }
                    
                }
            }
        }
    },
    onAllDeployed: function (callback) {
        this.allDeployed.push(callback)
    },
    allDeployed: [],
    executeAllDeployed: function(contracts){
        for (var i = 0; i < this.allDeployed.length; i++) {
            this.allDeployed[i](contracts)
        }
    },
    onError: function (context, callback) {
        if(typeof this.errors[context.source] === "array") {
            this.errors[context.source].push(callback);
        } else {
            this.errors[context.source] = [callback];
        }
    },
    errors: {},
    executeErrors: function(errors) {
        var self = this;
        errors.forEach(function(error) {
            for (fileName in self.errors) {
                if (error.includes(fileName)) {
                    for (var i = 0; i < self.errors[fileName].length; i++) {
                        self.errors[fileName][i](error)
                    }             
                }
            }
        })
    },
    tests:{},
    onTest: function (context, description, callback) {
        if(typeof this.tests[context.source] != "object") {
            this.tests[context.source] = {[description]: callback}
        } else {
            this.tests[context.source][description] = callback
        }
    },
}