// @ts-check
const path = require("path")
const camelCase = require("camelcase")

/**
 * @param {string} content
 * @returns {string[]}
 */
const getCssModuleKeys = (content) => {
  const keyRegex = /"([^"\n]+)":/g
  let match
  const cssModuleKeys = []

  while ((match = keyRegex.exec(content))) {
    if (cssModuleKeys.indexOf(match[1]) < 0) {
      cssModuleKeys.push(match[1])
    }
  }
  return cssModuleKeys
}

/**
 * @param {string} filename
 */
const filenameToPascalCase = (filename) => {
  return camelCase(path.basename(filename), { pascalCase: true })
}

const camelDigitLower = s => s.replace(/([\d]\w|$)/g, function (_, x) {
  return x.toLowerCase()
})

/**
 * @param {string[]} cssModuleKeys
 * @param {string=} indent
 */
const cssModuleToTypescriptInterfaceProperties = (cssModuleKeys, indent, lower = false) => {
  return [...cssModuleKeys]
    .sort()
    .map((key) => `${indent || ""}'${lower ? camelDigitLower(key) : key}': string;`)
    .join("\n")
}

const filenameToTypingsFilename = (filename) => {
  const dirName = path.dirname(filename)
  const baseName = path.basename(filename)
  return path.join(dirName, `${baseName}.d.ts`)
}

/**
 * @param {string[]} cssModuleKeys
 * @param {string} pascalCaseFileName
 */
const generateGenericExportInterface = (
  cssModuleKeys,
  pascalCaseFileName,
  disableLocalsExport,
  lazy,
  options = {}
) => {
  const interfaceName = `I${pascalCaseFileName}`
  const moduleName = `${pascalCaseFileName}Module`
  const namespaceName = `${pascalCaseFileName}Namespace`

  const localsExportType = disableLocalsExport
    ? ``
    : ` & {
  /** WARNING: Only available when \`css-loader\` is used without \`style-loader\` or \`mini-css-extract-plugin\` */
  locals: ${namespaceName}.${interfaceName};
}`

  const { lower } = options

  const interfaceProperties = cssModuleToTypescriptInterfaceProperties(
    cssModuleKeys,
    "    ",
    lower
  )
  const lz = lazy ? `
    use: () => void;
    unuse: () => void;
`: ``

  return `declare namespace ${namespaceName} {
  export interface I${pascalCaseFileName} {
${interfaceProperties}
${lz}
  }
}

declare const ${moduleName}: ${namespaceName}.${interfaceName}${localsExportType};

export = ${moduleName};`
}

module.exports = {
  getCssModuleKeys,
  filenameToPascalCase,
  filenameToTypingsFilename,
  generateGenericExportInterface,
}
