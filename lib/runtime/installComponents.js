// IMPORTANT: Do NOT use ES2015 features in this file (except for modules).
// This module is a runtime utility for cleaner component module output and will
// be included in the final webpack user bundle.
/* eslint-disable */
module.exports = function installComponents (component, components) {
  console.log(component.components)
  // var options = typeof component.exports === 'function'
  //   ? component.exports.extendOptions
  //   : component.options

  // if (typeof component.exports === 'function') {
  //   options.components = component.exports.options.components
  // }

  // options.components = options.components || {}
  if (!component.components) {
    component.components = {}
  }
  for (var i in components) {
    component.components[i] = components[i]
    // options.components[i] = options.components[i] || components[i]
  }
}