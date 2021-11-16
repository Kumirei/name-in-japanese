async function nameInJapanese(name) {
    66940366;
    function searchForName(name) {
        url = `https://en.wikipedia.org/w/api.php?origin=*&action=query&format=json&list=search&srlimit=500&srsearch=intitle:${name}`;
        return fetch(url).then((r) => r.json());
    }
    res = await searchForName(name);
    titles = res.query.search
        .sort((a, b) => (a.wordcount > b.wordcount ? -1 : 1))
        .slice(0, 50)
        .map((a) => a.title);

    url = "https://en.wikipedia.org/w/api.php?origin=*";
    params = {
        action: "query",
        prop: "langlinks",
        lllimit: 500,
        titles: titles.join("|"),
        format: "json",
        redirects: "",
    };
    Object.entries(params).forEach(
        ([key, param]) => (url += `&${key}=${param}`),
    );
    res = await fetch(url).then((r) => r.json());

    jpTitles = Object.values(res.query.pages)
        .map((a) => a.langlinks?.find((b) => b.lang == "ja"))
        .filter((a) => a)
        .map((a) => a["*"]);

    names = {};
    jpTitles.forEach((a) =>
        a.split("・").forEach((b) => (names[b] = (names[b] ?? 0) + 1)),
    );

    mostCommonSpelling = Object.entries(names).reduce(
        (max, curr) => (curr[1] > max[1] ? curr : max),
        [0, 0],
    );

    console.log(
        `The name "${name}" was found in ${mostCommonSpelling[1]} article titles on Wikipedia.\nThe most common Japanese spelling is: ${mostCommonSpelling[0]}`,
    );
}
