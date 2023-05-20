import * as fs from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import * as path from 'path';
import puppeteer from 'puppeteer';

const pageErrorCount = []

// // returns a list of all the links to the directory pages containing the svg file
const getDirectoryLink = async (inputLink) => {
    let browser
//     console.log(inputLink)

    browser = await puppeteer.launch({
        headless: "new",
        args: ["--disable-setuid-sandbox",'--no-sandbox'],
        'ignoreHTTPSErrors': true
    })
    
    const page = await browser.newPage()
//      DO NOT REMOVE 
//      setUserAgent is necessary for puppeteer to run 
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36')

//     page.on('response',async response => {
//         if(response.headers()["content-type"]==="text/html; charset=UTF-8"){
//         console.log(response.type)
//         }
//     })
    await page.goto(inputLink, {
        waitUntil: "domcontentloaded",
    });
//     let svgFile = await page.$x("//a[contains(@class, 'galleryfilename')]");
//     let svgLink = await page.evaluate((...svgFile) => {
//         return svgFile.map(item => item.href)
//     }, ...svgFile)
//     console.log(svgLink[0])
    const nextButton = await page.$x("//a[contains(text(), 'next page')]")
//     console.log(nextButton[0])
    const buttonLink = await page.evaluate((...nextButton) => {
            return nextButton.map(item => item.href)
        }, ...nextButton)
    
    browser.close()
    return buttonLink[0]
}
// // returns a list of all the links to the pages containing the svg file 
const getPageLink = async (inputLink) => {
    let browser
    browser = await puppeteer.launch({
        headless: "new",
        args: ["--disable-setuid-sandbox",'--no-sandbox'],
        'ignoreHTTPSErrors': true
    })
    
    const page = await browser.newPage()
//      DO NOT REMOVE 
//      setUserAgent is necessary for puppeteer to run 
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36')
        await page.goto(inputLink, {
        waitUntil: "domcontentloaded",
    });
    
    let svgFile = await page.$x("//a[contains(@class, 'galleryfilename')]");
    let svgLink = await page.evaluate((...svgFile) => {
        return svgFile.map(item => item.href)
    }, ...svgFile)
    console.log(svgLink.length)
    browser.close()
    return svgLink
}
// // returns a list of all the download links for the svg file
const getDownloadLink = async (inputLink) => {
    let browser
//         console.log(`testing 1`)
    browser = await puppeteer.launch({
        headless: "new",
        args: ["--disable-setuid-sandbox",'--no-sandbox'],
        'ignoreHTTPSErrors': true
    });
//         console.log(`testing 2`)
    const page = await browser.newPage();
//      DO NOT REMOVE 
//      setUserAgent is necessary for puppeteer to run 
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36')
    
    try {
        await page.goto(inputLink, {
            waitUntil: "domcontentloaded",
        });

        const svgFile = await page.$x("//a[contains(text(), 'Original file')]");
        const svgLink = await page.evaluate((...svgFile) => {
            return svgFile.map(item => item.href)
        }, ...svgFile)
//         console.log(svgLink[0])
//         output.push(svgLink[0])
        await browser.close()
        return svgLink[0]
    } catch (e) {
//         console.log(e)
    }
   
       await browser.close()
}
// // downloads the svg file and saves to a directory
const downloadFunc = async (inputArr) => {
    await mkdir(`./sigils`, { recursive: true });
    for (let i = 0; i < inputArr.length; i++){
        try{
            console.log(inputArr[i])
            const int = inputArr[i].replace("(", "").replace(")", "")
            const name = int.replace(/https:\/\/awoiaf\.westeros\.org\/index\.php\/File:([\w]*)'?(%27)?([\w]*)\.svg/gm, "$1$3")
            console.log(name)
            const downloadLink = await getDownloadLink(inputArr[i])
            const response = await fetch(downloadLink)
            const blob = await response.blob()
            const arrayBuffer = await blob.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            await fs.writeFile(`./sigils/${name}.svg`, buffer)
//             console.log(buffer)
        } catch (e){
    //         console.error(e)
            pageErrorCount.push(inputArr[i])
        }
    }
}

let array = []
let listOfLinks = [
                    "https://awoiaf.westeros.org/index.php/Category:SVG_coat_of_arms",
                    "https://awoiaf.westeros.org/index.php/Category:SVG_symbols_of_the_Free_Cities",
                    "https://awoiaf.westeros.org/index.php/Category:SVG_banners",
                    "https://awoiaf.westeros.org/index.php/Category:SVG_placeholder_coat_of_arms"
                ]
for (let i = 0; i < listOfLinks.length; i++){
    let recurser = listOfLinks[i]
// // if there is no next page containing a list of page links it returns undefined and stops the while loop after running once with the original link
// // getPageLink must be before getDirectoryLink to ensure first link is run
    while(recurser){
        array.push(...(await getPageLink(recurser)))
        recurser = await getDirectoryLink(recurser)
    }
}
console.log("complete")
console.log(array.length)
await downloadFunc(array)








