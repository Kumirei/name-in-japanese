// Get Japanese Names
// Description: Split full name into individual names then search Wikipedia for how they are spelled
// Input:       [string] One or more names separated by whitespace (ex: John Doe)
// Output:      [list] Objects containing #english articles, #japanese articles, and the names found
async function getJapaneseNames(fullName) {
    const names = fullName.split(/\s/)
    const japaneseNames = []
    for (let i = 0; i < names.length; i++) {
        japaneseNames.push(await getJapaneseName(names[i]))
    }
    return japaneseNames
}

// Get Japanese Name
// Description: Search Wikipedia for how the name is spelled in Japanese
// Input:       [string] A name (ex: John)
// Output:      [list] Object containing the name in Japanese, its frequency, total articles
//              and a list of objects containing the titles and a snippet of articles
async function getJapaneseName(name) {
    const articlesWithName = await searchWikipediaForName(name)
    const articlesWithJapaneseTitles = await getJapaneseTitles(articlesWithName)
    const japaneseNames = extractJapaneseNames(name, articlesWithJapaneseTitles) // [{name, article{ja, en, snippet}}]
    const japaneseNamesFreq = getNameFrequency(japaneseNames) // [{name, freq, inArticles[{ja, en, snippet}]}]

    return {
        enCount: articlesWithName.length,
        jaCount: Object.keys(articlesWithJapaneseTitles).length,
        names: japaneseNamesFreq,
        enName: name,
    }
}

// Search Wikipedia For Name
// Description: Search Wikipedia for articles with the name in the title
// Input:       [string] A name (ex: John)
// Output:      [list] A list of articles. Raw data from Wikipedia
async function searchWikipediaForName(name) {
    const articles = []
    // Fetch the first 500 synchronously to find out how many results there are,
    const first500 = await fetchArticlesFromWikipedia(name, 0)
    const totalArticles = first500.query.searchinfo.totalhits
    // then get the rest asynchronously
    const fetches = []
    for (let offset = 500; offset < totalArticles && offset < 10000; offset += 500) {
        fetches.push(fetchArticlesFromWikipedia(name, offset))
    }
    const results = await Promise.all(fetches)
    results.concat([first500]).forEach((p) => articles.push(...p.query.search))
    return articles
}

// Fetch articles From Wikipedia
// Description: Get up to 500 articles from Wikipedia with the name in the title
// Input:       [string] A name (ex: John)
//              [integer] Offset
// Output:      [list] A list of articles. Raw data from Wikipedia
function fetchArticlesFromWikipedia(name, offset) {
    return searchWikipedia({
        list: 'search',
        srlimit: 500,
        srsearch: `intitle:${name}`,
        sroffset: offset,
    })
}

// Search Wikipedia
// Description: Queries the Wikipedia API
// Input:       [object] Search parameters
// Output:      [object] Wikipedia response
async function searchWikipedia(searchParams) {
    const config = { action: 'query', format: 'json', namespace: 0, ...searchParams }
    const query = Object.entries(config)
        .map((c) => c.join('='))
        .join('&')
    const url = `https://en.wikipedia.org/w/api.php?origin=*&${query}`
    return await fetch(url).then((r) => r.json())
}

// Get Japanese Titles
// Description: Search gets the Japanese titles of the wikipedia articles
// Input:       [string] A name (ex: John)
// Output:      [object] {pageid: {id, en, ja, snippet}, length}
async function getJapaneseTitles(articles) {
    const pageids = articles.map((a) => a.pageid)
    // Get Japanese titles
    const promises = []
    for (let i = 0; i < pageids.length; i += 50) {
        promises.push(fetchLanguagesFromWikipedia(pageids.slice(i, i + 50).join('|'), 'ja'))
    }
    const results = await Promise.all(promises)
    const pages = []
    results.forEach((p) => pages.push(...Object.values(p.query.pages)))
    // Get articles that have Japanese titles
    const japaneseArticles = {}
    pages.forEach((page) => {
        if (page.langlinks) japaneseArticles[page.pageid] = { id: page.pageid, ja: page.langlinks[0]['*'] }
    })
    // Add English title and snippet
    articles.forEach((article) => {
        const page = japaneseArticles[article.pageid]
        if (page) {
            page.en = article.title
            page.snippet = new DOMParser().parseFromString(article.snippet, 'text/html').body.textContent ?? ''
        }
    })
    return japaneseArticles
}

// Fetch Languages From Wikipedia
// Description: Gets alternative languages of list of articles
// Input:       [string] A list of tittles separated by "|"
//              [string] Language code (ex: ja)
// Output:      [Object] Response from Wikipedia
function fetchLanguagesFromWikipedia(pageids, langCodes) {
    return searchWikipedia({
        prop: 'langlinks',
        lllimit: 500,
        lllang: langCodes,
        pageids,
    })
}

// Extract Japanese Names
// Description: Extracts the japanese names and creates a list
// Input:       [object] Wikipedia articles
// Output:      [array] Objects with name and articles
function extractJapaneseNames(name, articles) {
    name = name.toLowerCase()
    const names = []
    Object.values(articles).forEach((article) => {
        const enNameIndex = article.en.toLowerCase().split(/\s+/).indexOf(name)
        const jaName = article.ja.split('・')[enNameIndex]
        if (jaName) names.push({ name: jaName, article })
    })
    return names
}

// Get Name Frequency
// Description: Finds out the frequency of each name
// Input:       [{name, article}]
// Output:      [{freq, name, articles}]
function getNameFrequency(data) {
    const names = data.map((e) => e.name)
    const freqs = getFrequency(names)
    const articlesMap = {}
    data.forEach((d) => {
        if (!articlesMap[d.name]) articlesMap[d.name] = []
        articlesMap[d.name].push(d.article)
    })
    const freqList = Object.entries(freqs).map(([name, freq]) => ({ name, freq, articles: articlesMap[name] }))
    freqList.sort((a, b) => b.freq - a.freq)
    return freqList // [{freq, name, articles}]
}

// Get Frequency
// Description: Calculates frequency of items in array
// Input:       [item1, item2, ...]
// Output:      {item1: freq, ...}
function getFrequency(arr) {
    const freqs = {}
    arr.forEach((v) => (freqs[v] = (freqs[v] ?? 0) + 1))
    return freqs
}

export default getJapaneseNames
