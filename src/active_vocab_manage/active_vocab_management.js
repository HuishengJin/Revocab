import { activateVocabs, deactivateVocabs } from '../utils/storageUtils.js';

const vocabFatherNode = 'span';
document.addEventListener('DOMContentLoaded', async () => {
    const activeVocabsListElement = document.getElementById('activeVocabList');

    const updateUI = async () => {
        let { activeVocabsList = [] } = await chrome.storage.local.get(['activeVocabsList']);
        activeVocabsListElement.innerHTML = '';
        activeVocabsList.forEach(async vocab => {
            const item = document.createElement('li');
            item.innerHTML = `
                <div>
		    <input type="checkbox" class="vocab-checkbox">
                    <${vocabFatherNode} class='vocab'><b>${vocab}</b></${vocabFatherNode}>
                    <button class="editSynonymsBtn">Edit Synonyms</button>
                </div>
            `;

	    //console.log('.editSynonymsBtn', new Date().getTime());
            item.querySelector('.editSynonymsBtn').addEventListener('click', () => {
                chrome.tabs.create({ url: chrome.runtime.getURL(`synonym_management.html?vocab=${vocab}`) });
            });
	    //console.log('good listener', new Date().getTime());

            activeVocabsListElement.appendChild(item);
        });
    };

    document.getElementById('addNewVocabBtn').addEventListener('click', async () => {
        const newVocab = document.getElementById('newVocabInput').value;
        if (newVocab) {
	    //console.log('activating...', new Date().getTime());
            await activateVocabs([newVocab]);
	    //console.log('updating', new Date().getTime());
        }
    });

    document.getElementById('removeSelectedBtn').addEventListener('click', async () => {
        const checkedVocabs = Array.from(activeVocabsListElement.querySelectorAll('.vocab-checkbox:checked')).map(cb => cb.parentElement.querySelector(vocabFatherNode).textContent.trim());
        if (checkedVocabs.length > 0) {
            await deactivateVocabs(checkedVocabs);
	    //console.log("Removed", checkedVocabs);
            document.getElementById('status').textContent = `${checkedVocabs.length} vocabs removed from active vocab list.`;
        }
    });
    
    chrome.storage.local.onChanged.addListener(updateUI);
    await updateUI();
});
