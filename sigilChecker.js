import * as fs from 'node:fs/promises';
// // It is unreasonable to manually type out the module file for exporting the sigils dynamically so use this instead
let fileNames = await fs.readdir("./sigils")
// // renames the files containing numbers 
for(let i = 0; i < fileNames.length; i++){
    if(fileNames[i].match(/(\_?\d)+/gm)){
    let newFileName = fileNames[i].replace(/(\_?\d)+/gm, "")
    console.log(fileNames[i], newFileName)
    fs.rename(`./sigils/${fileNames[i]}`, `./sigils/${newFileName}`)
    }
}
// // read again to contain the new names
// // you could combine both functions to avoid calling this twice but it is really quick and has a marginal improvement on the speed
fileNames = await fs.readdir("./sigils")
// console.log(fileNames)
// // import data stores string giving a variable and listing the source directory for the file
let importData = []
// export data stores list of variables to be exported
let exportData = []
fileNames.map(item => {
    if (item!=="Sigils.js"){
        let name = item.replace( /\..*/gm, "")
        let text = `import ${name} from "./${item}"`
        importData.push(text)
        exportData.push(`\t${name}`)
    }
})
importData = importData.join(";\n")
exportData = exportData.join(",\n")
console.log(exportData)
await fs.writeFile("./sigils/Sigils.js", `${importData}\n\nexport default{\n${exportData}\n}`)
