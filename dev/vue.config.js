const { VueAutoImportPlugin } = require('@chazy/vue-autoimport')

module.exports = {
  configureWebpack: {
    plugins: [
      new VueAutoImportPlugin({
        match (originalTag, { kebabTag, camelTag, path }) {
          /**
           * This function will be called for every tag used in each vue component
           * It should return an array, the first element will be inserted into the
           * components array, the second should be a corresponding import
           *
           * originalTag - the tag as it was originally used in the template
           * kebabTag    - the tag normalised to kebab-case
           * camelTag    - the tag normalised to PascalCase
           * path        - a relative path to the current .vue file
           * component   - a parsed representation of the current component
           */
          if (kebabTag.startsWith('base-')) {
            return [
              camelTag,
              `import ${camelTag} from '@/components/${camelTag}.vue'`
            ]
          }
        }
      })
    ]
  }
}