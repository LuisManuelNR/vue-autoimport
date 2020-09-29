const RuleSet = require('webpack/lib/RuleSet') // eslint-disable-line

function isVueLoader (use) {
  return use.loader.includes('vue-loader') && use.loader.includes('index.js')
}

class MaitextLoaderPlugin {
  constructor (options) {
    this.options = options || {}
  }

  apply (compiler) {
    // use webpack's RuleSet utility to normalize user rules
    const rawRules = compiler.options.module.rules
    const { rules } = new RuleSet(rawRules)
    this.rules = rules
    // find the rules that apply to vue files
    const vueRules = rules.filter(rule => rule.use && rule.use.find(isVueLoader))

    if (!vueRules.length) {
      throw new Error(
        '[MaitextLoaderPlugin Error] No matching rule for vue-loader found.\n' +
        'Make sure there is at least one root-level rule that uses vue-loader.'
      )
    }

    vueRules.forEach(this.updateRule.bind(this))

    compiler.options.module.rules = rules
  }

  updateRule (rule) {
    rule.oneOf = [
      {
        resourceQuery: '?',
        use: rule.use
      },
      {
        use: [
          {
            loader: require.resolve('./loader'),
            options: {
              match: this.options.match || [],
              attrsMatch: this.options.attrsMatch || [],
              registerStylesSSR: this.options.registerStylesSSR || false
            }
          },
          ...rule.use
        ]
      }
    ]
    delete rule.use
  }
}

module.exports = MaitextLoaderPlugin
