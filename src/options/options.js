import { activateInactiveVocabs, addInactiveVocabs, removeInactiveVocabsList, removeAllInactiveVocabsLists, clearActiveVocabsList } from '../utils/storageUtils.js';
import { setSubText } from '../utils/commonUtils.js';

// HTML elements
const vocabUpload = document.getElementById('vocabUpload');
const uploadVocabBtn = document.getElementById('uploadVocabsBtn');
const vocabsListSelected = document.getElementById('vocabsListSelected');
const loadCountInput = document.getElementById('loadCount');
const loadRandomVocabsBtn = document.getElementById('loadRandomVocabsBtn');
const loadOrderedVocabsBtn = document.getElementById('loadOrderedVocabsBtn');
const loadAllVocabsBtn = document.getElementById('loadAllVocabsBtn');
const exportAllInactiveVocabsListsBtn = document.getElementById('exportAllInactiveVocabsListsBtn');
const exportSelectedInactiveVocabsListBtn = document.getElementById('exportSelectedInactiveVocabsListBtn');
const exportActiveVocabListBtn = document.getElementById('exportActiveVocabsListBtn');
const removeAllInactiveVocabsListsBtn = document.getElementById('removeAllInactiveVocabsListsBtn');
const removeSelectedInactiveVocabsListBtn = document.getElementById('removeSelectedInactiveVocabsListBtn');
const clearActiveVocabsListBtn = document.getElementById('clearActiveVocabsListBtn');
const topkEntry = document.getElementById('topkEntry');
const careCheck = document.getElementById('careCheck');
const argsApplyBtn = document.getElementById('argsApplyBtn');
const status_info = document.getElementById('status');
let status_tmps = [];
const setStatus = (asay, color, killTimeout=false) => {
	status_tmps.forEach(tmp=>tmp.remove());
	status_tmps = [];
	status_info.style.color = color;
	status_tmps.push(
		setSubText(status_info, asay, killTimeout)
	);
}
const withAutoStatus = async (fn) => {
	setStatus('Processing...', 'grey');
	await fn(
		(good_show)=>{setStatus(good_show, 'green', 3500)},
		(bad_show)=>{setStatus(bad_show, 'red', 6600)}
	).catch(err => setBadStatus(`Error: ${err}`, 6600));
}

// Helper functions
const updateTopkShowing = async () => {
  const { topk=25 } = await chrome.storage.local.get('topk');
  topkEntry.value = topk;
}

const updateCareShowing = async () => {
  const { care=false } = await chrome.storage.local.get('care');
  careCheck.checked = care;
}

const updateInactiveListsShowing = async () => {
  const { inactiveVocabsLists = {} } = await chrome.storage.local.get(['inactiveVocabsLists']);
  vocabsListSelected.innerHTML = '';
  Object.keys(inactiveVocabsLists).forEach((listName) => {
    const option = document.createElement('option');
    option.value = listName;
    option.textContent = listName;
    vocabsListSelected.appendChild(option);
  });
};

const downloadJson = (data, filename) => {
  //console.log("saving for ", filename, " with data ", data);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// Event listeners
uploadVocabBtn.addEventListener('click', async () => {
  const vocabFile = vocabUpload.files[0];
  if (!vocabFile) {
    setStatus('Please select a vocab list file to upload.', 'red');
    return;
  }
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
    try {
    	const vocabText = await vocabFile.text();
    	const vocabList = JSON.parse(vocabText);
    	const listName = vocabFile.name.split('.')[0];
    	await addInactiveVocabs(listName, vocabList);
	setGoodStatus('Vocab list uploaded successfully');
    } catch (err) {
	setBadStatus('An error occured when loading the vocab list into storage. Ensure it is a valid JSON file.');
	console.error('Error loading inactive vocab list: ', err);
    }
  });
});

loadOrderedVocabsBtn.addEventListener('click', async () => {loadVocabs('ordered')});
loadRandomVocabsBtn.addEventListener('click', async () => {loadVocabs('random')});
loadAllVocabsBtn.addEventListener('click', async () => {loadVocabs('all')});

async function loadVocabs(selectionType='ordered') {
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
  	const loadCount = parseInt(loadCountInput.value, 10);
  	const selectedListName = vocabsListSelected.value;
  	if (!selectedListName) {
	  setBadStatus('Please select a list.');
  	  return;
  	}
  	if (isNaN(loadCount) && selectionType!=='all') {
	  setBadStatus('Please select a list.');
  	  return;
  	}

  	try {
  	  const loadc = await activateInactiveVocabs(selectedListName, loadCount, selectionType);
	  setGoodStatus(`Loaded ${loadc} vocabs from ${selectedListName}.`);
  	} catch (err) {
  	  console.error('Error activating vocabs from inactive list:', err);
	  setBadStatus('Error activating vocabs from inactive list.');
  	}
  });
}

exportAllInactiveVocabsListsBtn.addEventListener('click', async () => {
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
  	const { inactiveVocabsLists = {} } = await chrome.storage.local.get(['inactiveVocabsLists']);
  	Object.keys(inactiveVocabsLists).forEach(inactiveVocabsListName => {
  	    downloadJson(inactiveVocabsLists[inactiveVocabsListName], inactiveVocabsListName);
  	});
	setGoodStatus("Exported.");
  });
});

exportSelectedInactiveVocabsListBtn.addEventListener('click', async () => {
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
  	const selectedListName = vocabsListSelected.value;
  	if (!selectedListName) {
	  setBadStatus("Please select a list first.");
  	  return;
  	}

  	const { inactiveVocabsLists = {} } = await chrome.storage.local.get(['inactiveVocabsLists']);
  	const selectedList = inactiveVocabsLists[selectedListName];
  	downloadJson(selectedList, selectedListName);
	setGoodStatus("Exported.");
  });
});

exportActiveVocabListBtn.addEventListener('click', async () => {
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
  	const { activeVocabsList = [] } = await chrome.storage.local.get(['activeVocabsList']);
  	downloadJson(activeVocabsList, 'ActiveVocabsList');
	setGoodStatus("Exported.");
  });
});

removeAllInactiveVocabsListsBtn.addEventListener('click', async ()=>{
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
	try {
  		await removeAllInactiveVocabsLists();
		setGoodStatus("All inactive vocabs lists removed");
	} catch (err) {
		console.error("Failed to remove all inactive vocabs lists: ", err);
		setBadStatus("Failed to remove all inactive vocabs lists");
	}
  });
});

removeSelectedInactiveVocabsListBtn.addEventListener('click', async ()=>{
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
	try {
  		await removeInactiveVocabsList([vocabsListSelected.value]);
		setGoodStatus("Selected inactive vocabs list removed");
	} catch (err) {
		console.error("Failed to remove inactive vocabs list: ", err);
		setBadStatus("Failed to remove inactive vocabs list");
	}
  });
});

clearActiveVocabsListBtn.addEventListener('click', async ()=>{
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
	try {
  		await clearActiveVocabsList();
		setGoodStatus("Active vocabs list cleared");
	} catch (err) {
		console.error("Failed to clear active vocabs list: ", err);
		setBadStatus("Failed to clear active vocabs list");
	}
  });
});

argsApplyBtn.addEventListener('click', async ()=>{
  withAutoStatus(async (setGoodStatus, setBadStatus) => {
	try {
  		await chrome.storage.local.set({
  		        topk: Number(topkEntry.value),
  		        care: careCheck.checked
  		});
		setGoodStatus("Arguments applied");
	} catch (err) {
		console.error("Failed to apply arguments: ", err);
		setBadStatus("Failed to apply arguments");
	}
  });
});

// Initialize select options on page load
document.addEventListener('DOMContentLoaded', ()=>{
	updateInactiveListsShowing();
	updateTopkShowing();
	updateCareShowing();
});

chrome.storage.onChanged.addListener((changes) => {
	if (changes['inactiveVocabsLists']) { updateInactiveListsShowing() }
	if (changes['topk']) { updateTopkShowing() }
	if (changes['care']) { updateCareShowing() }
})
