async function nameInJapanese(name) {
    const articles = await searchForName(name)
    const titles = articles.map((a) => a.title)
    const jaTitles = await getAvailableLanguages(titles).then(getJapaneseTitles)
    const names = extractNames(jaTitles)
    const nameFreq = countFrequency(names.map((n) => n[1]))
    const [spelling, freq] = Object.entries(nameFreq).reduce((max, curr) => (curr[1] > max[1] ? curr : max), [0, 0])

    const alsoCommon = Object.entries(nameFreq).filter(
        ([key, value]) => key !== spelling && value > freq * 0.5 && value > 1,
    )

    console.log(
        `\nThe name "${name}" was found in the title of ${articles.length} articles on Wikipedia`,
        `\n${jaTitles.length} of which were available in Japanese.`,
    )
    if (freq === 1) {
        return console.log(`But none were mentioned more than once`)
    }
    console.log(`\n\nThe most common Japanese spelling is: ${spelling} with ${freq} occurances`)
    if (alsoCommon.length) {
        console.log('Alternatives include:')
        for (let i = 0; i < alsoCommon.length; i++) {
            console.log(`\t${alsoCommon[i][0]} found ${alsoCommon[i][1]} times`)
        }
    }

    if (jaTitles.length > 0 && jaTitles.length <= 10) {
        console.log(`There were not many results, but I found these articles which may be of help`)
        jaTitles.forEach((title) => {
            const article = articles.find((a) => a.pageid === title[0])
            console.log(title[0], title[1], article.title, article.snippet)
        })
    }
    return spelling
}

function countFrequency(arr) {
    const freqs = {}
    arr.forEach((v) => (freqs[v] = (freqs[v] ?? 0) + 1))
    return freqs
}

function extractNames(pages) {
    const names = []
    pages.forEach((page) => page[1].split('・').forEach((name) => names.push([page[0], name])))
    return names
}
function fetchArticles(name, offset) {
    return searchWikipedia({
        list: 'search',
        srlimit: 500,
        srsearch: `intitle:${name}`,
        sroffset: offset,
    })
}

async function searchForName(name) {
    const articles = []
    const first500 = await fetchArticles(name, 0)
    const promises = []
    for (let i = 500; i < first500.query.searchinfo.totalhits; i += 500) {
        promises.push(fetchArticles(name, i))
    }
    const results = await Promise.all(promises)
    results.concat([first500]).forEach((p) => articles.push(...p.query.search))
    return articles
}
function fetchLanguages(titles) {
    return searchWikipedia({
        prop: 'langlinks',
        lllimit: 500,
        titles,
    })
}

async function getAvailableLanguages(titles) {
    const pages = []
    const promises = []
    for (let i = 0; i < titles.length; i += 50) {
        promises.push(fetchLanguages(titles.slice(i, i + 50).join('|')))
    }
    const results = await Promise.all(promises)
    results.forEach((p) => pages.push(...Object.values(p.query.pages)))
    return pages
}

function getJapaneseTitles(pages) {
    return Object.values(pages)
        .map((page) => [page.pageid, page.langlinks?.find((link) => link.lang == 'ja')?.['*']]) // Extract Japanese title
        .filter((page) => page[1]) // Filter out pages without Japanese titles
}

function searchWikipedia(searchParams) {
    const config = { action: 'query', format: 'json', namespace: 0, ...searchParams }
    const query = Object.entries(config)
        .map((c) => c.join('='))
        .join('&')
    const url = `https://en.wikipedia.org/w/api.php?origin=*&${query}`
    return fetch(url).then((r) => r.json())
}

export default nameInJapanese
