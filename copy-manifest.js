import fs from 'fs-extra'

const sourceDir = './manifest.json'
const destinationDir = './dist/manifest.json'
fs.copySync(sourceDir, destinationDir, { overwrite: true })
console.log('Manifest copied successfully.')
