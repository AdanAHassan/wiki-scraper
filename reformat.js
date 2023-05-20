import * as fs from 'node:fs/promises';
import * as path from 'path';
import _ from 'lodash'
import { mkdir } from 'node:fs/promises';
// // this reformats the flat json object into the nested object needed for the wiki

// creates an array of the file names
const jsonsInDir = await fs.readdir('./inputList')

async function fetchJson(file, location){
//      fetch the data and set it to the variable
        const fileData = await fs.readFile(path.join(location, file))
//      convert the data to json so it can be used
        const json = JSON.parse(fileData.toString())
        return json
        }

const reformatJSON = (input, pageTitle, inputRegion, inputGroup) => {
    if (!input.content){
        console.log("Invalid input")
        return null
    } 
    let output = [{}]
//     the path is dynamically created to track the position of the current object
    let objPath = [0]
    for(let i = 0; i < input.content.length; i++){
        const pushTitle = (inputTitle) => {
            let camelKey = _.camelCase(inputTitle)
            let snakeKey = _.snakeCase(inputTitle)
// Resets path completely 
            objPath = [0]
            try { 
                if(input.content[i+1].text){
//              titles with no subtitle that are followed by text exist and need to be accounted for 
                    output[0][camelKey] = {
                        title: inputTitle,
                        id: snakeKey,
                        terminal: true,
                        content: []
                    }
                } else {
                    output[0][camelKey] = {
                        title: inputTitle,
                        id: snakeKey,
                        terminal: false,
                        content: {}
                    }
                }
            } catch {
                output[0][camelKey] = {
                    title: inputTitle,
                    id: snakeKey,
                    terminal: false,
                    content: {}
                }
            }
            
            objPath.push(camelKey)
            objPath.push("content")
        }
        const pushSubtitle = (inputSubtitle) => {
            let camelKey = _.camelCase(inputSubtitle)
            let snakeKey = _.snakeCase(inputSubtitle)
            try {
                if(input.content[i+1].text){
//                     setWith uses the path to set the value of the object
                    _.setWith(output, [...objPath, camelKey], {
                        title: inputSubtitle,
                        id: snakeKey,
                        terminal: true,
                        content: []
                    }, Object)      
                }
            } catch {
                _.setWith(output, [...objPath, camelKey], {
                    title: inputSubtitle,
                    id: snakeKey,
                    terminal: false,
                    content: {}
                }, Object) 
            }
            objPath.push(camelKey)
            objPath.push("content")
        }
        const pushText = (inputText) => {
            let camelKey = _.camelCase(inputText)
            let innerValues = _.get(output, objPath)
            let cleanText = inputText.replace(/\n/gm, ``)
            if(cleanText.length > 0){
                _.set(output, objPath, [...innerValues, cleanText])
            }
        }
        if(input.content[i].title){
            pushTitle(input.content[i].title)
        }
        if(input.content[i].subtitle){
            if(input.content[i-1].text){
// Resets the path to the title path so adjacent subtitles are siblings within the object
                objPath.splice(-2)
            }
            pushSubtitle(input.content[i].subtitle)
        }
        if(input.content[i].text && objPath.length === 1){
//             if there is no title and it is the start of the object this would be the intro section
            output[0]["intro"] = {
                    title: "Intro",
                    id: "Intro",
                    terminal: true,
                    content: []
                }
                objPath.push("intro")
                objPath.push("content")
        }
        if(input.content[i].text && Array.isArray(_.get(output, objPath))){
            pushText(input.content[i].text)
        }
    }

        let index = 0
        while(index<Object.keys(output[0]).length){
//             remove objects that do not have a nested a text array within them
//             these would just render titles with no text
//             these include lists and diagrams 
//             next step would be to include these somehow
            if(Object.keys(Object.values(output[0])[index].content).length === 0){
                let int = Object.keys(output[0])[index]
                delete output[0][int]
            }else { 
                index++
            }
            
        }
//     return an object with the necessary key value pairs needed in the wiki
    const data = {
        title: _.startCase(pageTitle),
        id: pageTitle,
        group: inputGroup,
        region: inputRegion,
        content: output[0],
        houseCard: input.houseCard
    }
    return data
}

const westerosiInDir = await fs.readdir('./rawScrape/westerosi')
const basedOnGamesInDir = await fs.readdir('./rawScrape/basedOnGames')
const freeCitiesInDir = await fs.readdir('./rawScrape/freeCities')
const ghiscarAndSlaversBayInDir = await fs.readdir('./rawScrape/ghiscarAndSlaversBay')
const summerIslesInDir = await fs.readdir('./rawScrape/summerIsles')
const yiTiInDir = await fs.readdir('./rawScrape/yiTi')

let finalJSON = []
// // loop through all the pages available and return a final JSON object to export to the database
for (let i = 0; i < westerosiInDir.length; i++){
    let inputData = await fetchJson(westerosiInDir[i], './rawScrape/westerosi' )
    let regionData = inputData.region
    regionData = regionData.replace(/(;.+)?(\s\(.+\))?/gm, "")
    let int = await reformatJSON(inputData, inputData.name, regionData, inputData.group)
    finalJSON.push(int)
}

for (let i = 0; i < basedOnGamesInDir.length; i++){
    let inputData = await fetchJson(basedOnGamesInDir[i], './rawScrape/basedOnGames' )
    let regionData = inputData.region
    regionData = regionData.replace(/(;.+)?(\s\(.+\))?/gm, "")
    let int = await reformatJSON(inputData, inputData.name, regionData, inputData.group)
    finalJSON.push(int)
}

for (let i = 0; i < freeCitiesInDir.length; i++){
    let inputData = await fetchJson(freeCitiesInDir[i], './rawScrape/freeCities' )
    let regionData = inputData.region
    regionData = regionData.replace(/(;.+)?(\s\(.+\))?/gm, "")
    let int = await reformatJSON(inputData, inputData.name, regionData, inputData.group)
    finalJSON.push(int)
}

for (let i = 0; i < ghiscarAndSlaversBayInDir.length; i++){
    let inputData = await fetchJson(ghiscarAndSlaversBayInDir[i], './rawScrape/ghiscarAndSlaversBay' )
    let regionData = inputData.region
    regionData = regionData.replace(/(;.+)?(\s\(.+\))?/gm, "")
    let int = await reformatJSON(inputData, inputData.name, regionData, inputData.group)
    finalJSON.push(int)
}

for (let i = 0; i < summerIslesInDir.length; i++){
//     console.log(summerIslesInDir[i])
    let inputData = await fetchJson(summerIslesInDir[i], './rawScrape/summerIsles' )
    let regionData = inputData.region
    regionData = regionData.replace(/(;.+)?(\s\(.+\))?/gm, "")
    let int = await reformatJSON(inputData, inputData.name, regionData, inputData.group)
    finalJSON.push(int)
}

for (let i = 0; i < yiTiInDir.length; i++){
    let inputData = await fetchJson(yiTiInDir[i], './rawScrape/yiTi' )
    let regionData = inputData.region
    regionData = regionData.replace(/(;.+)?(\s\(.+\))?/gm, "")
    let int = await reformatJSON(inputData, inputData.name, regionData, inputData.group)
    finalJSON.push(int)
}

await mkdir(`./export/`, { recursive: true });
await fs.writeFile(`./export/POV-scrape.json`,JSON.stringify(finalJSON, null, 4))
