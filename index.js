import puppeteer from 'puppeteer';
import * as fs from 'node:fs/promises';
import * as path from 'path';
import { mkdir } from 'node:fs/promises';
import _ from 'lodash'
let pageErrorCount = []
export async function extractPage(inputLink, pageTitle, groupName, region ) {

    
    let browser
    try {
//         console.log(`testing 1`)
      const browser = await puppeteer.launch({
            headless: "new",
            args: ["--disable-setuid-sandbox",'--no-sandbox'],
            'ignoreHTTPSErrors': true
        });
//         console.log(`testing 2`)
        const page = await browser.newPage();
//      DO NOT REMOVE 
//      setUserAgent is necessary for puppeteer to run 
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36')
        await page.goto(inputLink, {
            waitUntil: "domcontentloaded",
        });

//         scrape through content and only select titles, subtitles and paragraphs
       let pageContent
        try {
            
            pageContent = await page.$eval('.mw-parser-output', e => {
                const data = [];
                console.log(e.length)
    //         loop through each child element and push when they match what we want with appropriate key names
    //         stop once you reach the family tree
                for (const child of e.children) {
                    if(child.tagName === "H2"){
                        data.push({ title: child.textContent });
                        if(child.textContent === "References"){
                            data.push({references: child.nextElementSibling.innerHTML})
                        }
                    } else if(child.tagName === "H3"){
                        data.push({ subtitle: child.textContent });
                    } else if (child.tagName === "P"){
                        data.push({ text: child.textContent });
                    } else if (child.tagName === "UL"){
                        data.push({ unorderedParent: child.innerHTML });
                    } else if (child.className === ".references-small"){
                        data.push({ references: child.innerHTML });
                    } else if (child.className === "treeview"){
                        
                    }
                } 
                return data
            })
            if(!pageContent){
                console.log("Error: Page content missing")
                pageErrorCount.push(pageTitle)
            }
   
            try {
//                 fixing the errors in the houseCard 
//                 initially in a separate file but I chose to run it here
                let houseCardData = await page.$eval("table tbody", e => {
                    const data = [];

                    for (const child of e.children) {
                        if ( child.textContent !== "\n" ){
                            data.push({ value: child.textContent });
                        }
                    } 
                    return data

                })
                
                const replaceString = (data, obj) => {
                    for(let i = 1; i < data.length; i++){
                                
                    let oldStr = Object.values(data)[i].value
                    const breakpoint = /\n/
                    let intKey = oldStr.split(breakpoint)[0]
                    let key = _.camelCase(intKey)
                    let intValue = oldStr.split(breakpoint)[1]
                    let value = _.chain(intValue)
                        .split(/(.*?\(.*?\))/gm).compact().value()
                //     console.log(intKey)
                        if(key.length > 3){
                        obj[key] = {}
                        obj[key].title = intKey
                        obj[key].content = value
                        } else {
                            console.log(key, key.length)
                            pageErrorCount++
                        }
                    }
                }
        
                const reformatHouseCard = (input) => {
                    let output = {}
                    let titleOne = Object.values(input)[0].value
                    output.header = titleOne
                    replaceString(input, output)
                    return output
                }
                
                try{
                    houseCardData = await reformatHouseCard(houseCardData)
                    
                } catch(e){
                    console.log(`Error: House card was not reformated \n ${e}`)
                }
                let outputObject = {name: pageTitle, content: pageContent, houseCard: houseCardData, group: groupName, region: region}
//                 exporting the data
//                 
                await mkdir(`./rawScrape/${groupName}`, { recursive: true });
                await fs.writeFile(`./rawScrape/${groupName}/${pageTitle}-scrape.json`, JSON.stringify(outputObject));
//                 console.log(outputObject.houseCard)
                    
            } catch {
//                 some pages do not have houseCard data such as the Yi Ti pages
                console.log(`No housecard was found on ${pageTitle}`)
                let outputObject = {name: pageTitle, content: pageContent, group: groupName, region: region}
                await mkdir(`./rawScrape/${groupName}`, { recursive: true });
                await fs.writeFile(`./rawScrape/${groupName}/${pageTitle}-scrape.json`, JSON.stringify(outputObject))
            }
             await browser.close();
            console.log(`Success: Page ${pageTitle} has been scraped`)
        } catch {
            console.log(`Fail: Page ${pageTitle} does not exist`)
            await browser.close();
        }
    } catch (e) {
        console.error("scrape failed", e)
    }
    finally {
          await browser?.close();
    }
}

// creates an array of the file names
const jsonsInDir = await fs.readdir('./inputList')
    
// chose not to include file path initially 
async function fetchJson(file){
//      fetch the data and set it to the variable
        const fileData = await fs.readFile(path.join('./inputList', file));
//      convert the data to json so it can be used
        const json = JSON.parse(fileData.toString());
        return json
        }
//  fetching the links of every region
let basedOnGames = await fetchJson(jsonsInDir[0])
let freeCities = await fetchJson(jsonsInDir[1])
let ghiscarAndSlaversBay = await fetchJson(jsonsInDir[2])
let summerIsles = await fetchJson(jsonsInDir[3])
let westerosi = await fetchJson(jsonsInDir[4])
let yiTi = await fetchJson(jsonsInDir[5])

// this will just display what will be fetched in the terminal 
console.log(`A total of ${basedOnGames.length + freeCities.length + ghiscarAndSlaversBay.length + summerIsles.length + westerosi.length + yiTi.length} pages to be scraped`)

console.log(`westerosi: ${westerosi.length} pages`)
console.log(`ghiscarAndSlaversBay: ${ghiscarAndSlaversBay.length} pages`)
console.log(`yiTi: ${yiTi.length} pages`)
console.log(`basedOnGames: ${basedOnGames.length} pages`)
console.log(`freeCities: ${freeCities.length} pages`)
console.log(`summerIsles: ${summerIsles.length} pages`)
        

// forEach and map does not work since it runs everything in parallel so use a for loop to ensure the code runs sequentially

for (let i = 0; i < westerosi.length; i++){
    await extractPage(westerosi[i].link, westerosi[i].name, "westerosi",  westerosi[i].region)
}

for (let i = 0; i < basedOnGames.length; i++){
    await extractPage(basedOnGames[i].link, basedOnGames[i].name, "basedOnGames", basedOnGames[i].region)
}

for (let i = 0; i < freeCities.length; i++){
    await extractPage(freeCities[i].link, freeCities[i].name, "freeCities", freeCities[i].region)
}

for (let i = 0; i < ghiscarAndSlaversBay.length; i++){
    await extractPage(ghiscarAndSlaversBay[i].link, ghiscarAndSlaversBay[i].name, "ghiscarAndSlaversBay", ghiscarAndSlaversBay[i].region)
}

for (let i = 0; i < summerIsles.length; i++){
    await extractPage(summerIsles[i].link, summerIsles[i].name, "summerIsles",summerIsles[i].region)
}

for (let i = 0; i < yiTi.length; i++){
    await extractPage(yiTi[i].link, yiTi[i].name, "yiTi", "Yi Ti")
}
console.log(pageErrorCount)
    process.exit()
//     test.map(inputLink => scrapeMap({inputLink}, "Yiti"))

// await scrapeMap("https://awoiaf.westeros.org/index.php/Azure_emperors", "yiti")
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    
    

