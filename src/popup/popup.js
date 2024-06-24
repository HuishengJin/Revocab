import { setStorageData } from '../utils/storageUtils.js';

class PopupController {
    constructor() {
        this.initializationProgress = document.getElementById('initializationProgress');
        this.initializationStatus = document.getElementById('initializationStatus');
        this.autoReplaceCheckbox = document.getElementById('autoReplaceCheckbox');
        this.manageActiveVocabListBtn = document.getElementById('manageActiveVocabListBtn');

        this.manageActiveVocabListBtn.addEventListener('click', () => {
            chrome.tabs.create({ url: chrome.runtime.getURL('active_vocab_management.html') });
        });
        //this.tryValidityCalBtn = document.getElementById('tryValidityValBtn');
	    /*
	this.tryValidityCalBtn.addEventListener('click', () => {}
	    chrome.tabs.create({ url: chrome.runtime.getURL('try_validity_calculator.html') });
	);*/

        this.autoReplaceCheckbox.addEventListener('change', async () => {
            const isEnabled = this.autoReplaceCheckbox.checked;
            await setStorageData({ autoReplace: isEnabled });
        });


	chrome.storage.local.onChanged.addListener(() => {
   	  this.updateWithStorageChange();
	});
	this.updateWithStorageChange(this);
    }

    async updateWithStorageChange() {
	const {autoReplace, modelProgress, modelLoadingStatus, somethingJustFinishedDownloading} = await chrome.storage.local.get(['autoReplace', 'modelProgress', 'modelLoadingStatus', 'somethingJustFinishedDownloading']);
	//console.log(await chrome.storage.local.get());
        
	this.autoReplaceCheckbox.checked = autoReplace || false;
    
	//console.log(`initializationProgress ${modelProgress}`);
        if (modelProgress!==false) {
	        //this.initializationProgress.style.display = '';
	        this.initializationProgress.value = Number(modelProgress).toFixed(2);
	} else {
	    if (! somethingJustFinishedDownloading) {
                this.initializationProgress.removeAttribute('value');
	    } else {
		this.initializationProgress.value = 100;
	    }
	}

        this.initializationStatus.textContent = modelLoadingStatus;
    }
}

// Initialize PopupController when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});
