const template = `
# Smart Contract Documentation

{{#each contracts}}

## [{{contractName}}](../contracts/{{source}})
\`{{language}} version {{compiler.version}}\`
{{output.devdoc.title}}

{{#each output.abi}}
 ##### {{type}} {{name}} \`{{signature}}\` {{#if devdoc.author}}by {{devdoc.author}}{{/if}}
 {{#if constant}}constant{{/if}} {{stateMutability}} {{#if payable}}payable{{/if}}
{{devdoc.details}}

{{#if inputs}}
 Type | Name |
--- | --- |
{{/if}}
{{#each inputs}}
| {{type}} | {{name}} |
{{/each}}
___
{{/each}}

{{/each}}
---`;

module.exports = template;