//const synonyms = require('synonyms');

export async function fetchSynonyms(word) {
    const id = Math.random();
    const old = new Date().getTime();
    //console.log("\tfetching for word", word, "id", id);
    const response = await fetch(`http://api.datamuse.com/words?rel_syn=${word}`);
    if (!response.ok) {
        throw new Error('Failed to fetch synonyms');
    }
    const data = await response.json();
    //console.log("\tfetched", data, "id", id, "took", new Date().getTime()-old);
    return data.map(entry => entry.word);
}
/*
export async function fetchSynonyms(word) {
    return synonyms(word).filter(synonym => synonym!==word);
}
*/

export async function fetchSynonymsBatch(words) {
    const synonymsPromises = words.map(word => fetchSynonyms(word));
    return await Promise.all(synonymsPromises);
}


