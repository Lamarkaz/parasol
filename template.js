const template = `
# Smart Contract Documentation

{{#each contracts}}

## [{{contractName}}](../contracts/{{source}})
\`{{language}} version {{compiler.version}}\`
{{output.devdoc.title}}

{{#each output.abi}}
 ##### {{type}} {{name}} {{#if constant}}constant{{/if}} {{stateMutability}} {{#if payable}}payable{{/if}} \`{{signature}}\` {{#if devdoc.author}}by {{devdoc.author}}{{/if}}
{{devdoc.details}}

{{#if inputs}}
 Type | Name |
--- | --- |
{{/if}}
{{#each inputs}}
| {{type}} | {{name}} |
{{/each}}
{{/each}}

{{/each}}
---`;

module.exports = template;