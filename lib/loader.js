const path = require('path') // eslint-disable-line
const loaderUtils = require('loader-utils') // eslint-disable-line
const compiler = require('@vue/compiler-sfc') // eslint-disable-line

const { camelize, capitalize, hyphenate, requirePeer } = require('./util') // eslint-disable-line
const runtimePaths = {
  installComponents: require.resolve('./runtime/installComponents')
}

function getMatches (type, items, matches, component) {
  const imports = []
  // console.log(component)
  items.forEach(item => {
    for (const matcher of matches) {
      const match = matcher(item, {
        [`kebab${type}`]: hyphenate(item),
        [`camel${type}`]: capitalize(camelize(item)),
        path: this.resourcePath.substring(this.rootContext.length + 1),
        component
      })
      if (match) {
        imports.push(match)
        break
      }
    }
  })

  imports.sort((a, b) => a[0] < b[0] ? -1 : (a[0] > b[0] ? 1 : 0))
  return imports
}

// function injectStylesSSR (imports) {
//   const styles = imports.map(componentImport => (componentImport[2] || [])).reduce((acc, styles) => {
//     styles && styles.forEach(style => acc.add(style))
//     return acc
//   }, new Set())

//   if (styles.size) {
//     return `
// if (process.env.VUE_ENV === 'server') {
//   const options = typeof component.exports === 'function'
//     ? component.exports.extendOptions
//     : component.options
//   const existing = options.beforeCreate
//   const hook = function () {
// ${[...styles].map((style) => `    require('vuetify/${style}').__inject__(this.$ssrContext)`).join('\n')}
//   }
//   options.beforeCreate = existing
//     ? [].concat(existing, hook)
//     : [hook]
// }
//     `
//   }
//   return ""
// }

function install (install, content, imports) { // missing arg (options = {}) for ssr
  if (imports.length) {
    let newContent = '/* maitext-loader */\n'
    // newContent += 'debugger\n'
    newContent += `import ${install} from ${loaderUtils.stringifyRequest(this, '!' + runtimePaths[install])}\n`
    newContent += imports.map(i => i[1]).join('\n') + '\n'
    newContent += `${install}(script, {${imports.map(i => i[0]).join(',')}})\n`

    // if (options.registerStylesSSR) {
    //   newContent += injectStylesSSR(imports, newContent)
    // }

    // Insert our modification before the HMR code
    const hotReload = content.indexOf('/* hot reload */')
    if (hotReload > -1) {
      content = content.slice(0, hotReload) + newContent + '\n\n' + content.slice(hotReload)
    } else {
      content += '\n\n' + newContent
    }
  }

  return content
}

module.exports = async function (content, sourceMap) {
  this.async()
  this.cacheable()

  const options = {
    match: [],
    attrsMatch: [],
    registerStylesSSR: false,
    ...loaderUtils.getOptions(this)
  }

  if (!Array.isArray(options.match)) options.match = [options.match]
  if (!Array.isArray(options.attrsMatch)) options.attrsMatch = [options.attrsMatch]

  if (!this.resourceQuery) {
    const readFile = path => new Promise((resolve, reject) => {
      this.fs.readFile(path, function (err, data) {
        if (err) reject(err)
        else resolve(data)
      })
    })

    this.addDependency(this.resourcePath)

    const tags = new Set()
    const attrs = new Set()
    const file = (await readFile(this.resourcePath)).toString('utf8')
    const component = compiler.parse(file)
    const template = component.descriptor.template
    if (template) {
      if (template.src) {
        const externalFile = (await new Promise((resolve, reject) =>
          this.resolve(path.dirname(this.resourcePath), component.template.src, (err, result) => {
            if (err) reject(err)
            else resolve(result)
          })
        ))
        const externalContent = (await readFile(externalFile)).toString('utf8')
        component.template.content = externalContent
      }
      if (template.lang === 'pug') {
        const pug = requirePeer('pug')
        try {
          component.template.content = pug.render(component.template.content, { filename: this.resourcePath })
        } catch (err) { /* Ignore compilation errors, they'll be picked up by other loaders */ }
      }
      compiler.compileTemplate({
        ...component.descriptor,
        compilerOptions: {
          isCustomElement: tag => {
            tags.add(tag)
          }
        }
      })
    }

    content = install.call(this, 'installComponents', content, getMatches.call(this, 'Tag', tags, options.match, component), options)
  }

  this.callback(null, content, sourceMap)
}
