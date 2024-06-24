import { updateVocabSynonyms } from '../utils/storageUtils.js';



document.addEventListener('DOMContentLoaded', async () => {
    const updateSynonymsShowing = async () => {
    	const { vocabsToSyns = {} } = await chrome.storage.local.get(['vocabsToSyns']);
    	const synonyms = vocabsToSyns[vocabWord] || [];
    	document.getElementById('synonymsInput').value = synonyms.join(',');
    }

    const vocabWord = new URLSearchParams(window.location.search).get('vocab');
    if (!vocabWord) {
        document.getElementById('status').textContent = 'No vocab selected.';
        return;
    }

    document.getElementById('vocab-word').textContent = vocabWord;
   
    document.getElementById('saveSynonymsBtn').addEventListener('click', async () => {
        const updatedSynonyms = document.getElementById('synonymsInput').value.split(',');
        await updateVocabSynonyms(vocabWord, updatedSynonyms);
        document.getElementById('status').textContent = 'Synonyms updated successfully!';
	await updateSynonymsShowing();
    });

    chrome.storage.local.onChanged.addListener(updateSynonymsShowing);
    await updateSynonymsShowing();
});
