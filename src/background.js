// src/background.js

import { setLocalMutexes, withLocked, setStorageData, activateVocabs } from './utils/storageUtils.js';
import { cos_sim, Tensor, mean_pooling, pipeline, env, AutoTokenizer, AutoConfig, PreTrainedModel, AutoModelForMaskedLM } from '@xenova/transformers';
env.allowRemoteModels = true;
env.backends.onnx.wasm.numThreads = 1;
env.remoteHost = "https://hf-mirror.com";
import { Mutex, withTimeout, E_TIMEOUT } from 'async-mutex';
let mutexes = {};
setLocalMutexes(mutexes);

let unmaskerP = null;

let manualMaskTokenizerP = null;
let manualMaskModelP = null;

let embederTokenizerP = null;
let embederModelP = null;

const download_callback = (data) => {
		let modelLoadingStatus = '';
		let somethingJustFinishedDownloading = false;
		switch (data.status) {
			case 'initiate':
			    modelLoadingStatus = `initiating ${data.file}`;
		            break;
			case 'download':
			    modelLoadingStatus = `downloading ${data.file}`;
		            break;
			case 'done':
			    modelLoadingStatus = `${data.file} done`;
		            somethingJustFinishedDownloading = true;
		            break;
			case 'progress':
			    modelLoadingStatus = `downloading ${data.file}`;
		            break;
			case 'ready':
			    modelLoadingStatus = `${data.task} ready`;
		            console.log(new Date(), `${data.task} ready`);
		            somethingJustFinishedDownloading = 'allDone';
		            break;
		        default:
			    modelLoadingStatus = `${data.file}${data.task} ${data.status}`;
		}
		chrome.storage.local.set({ somethingJustFinishedDownloading, modelLoadingStatus, modelProgress: (data.progress || false) });
		//console.log(new Date(), "Model Data:", data);
	}

async function initializeMaskModel() {
    try {
    	//console.log('env', env);
    	unmaskerP = pipeline('fill-mask', 'Xenova/albert-base-v2', {progress_callback: download_callback});
    	await unmaskerP;
    	unmaskerP.mask = "[MASK]";
    	embederTokenizerP = null;
    	embederModelP = null;
        manualMaskTokenizerP = null;
        manualMaskModelP = null;
    } catch (err) {
	console.error("[ERROR] An error occured while loading unmasker pipeline: ", err);
	unmaskP = null;
	return false;
    }
}

async function initializeSimilarityModel() {
    try {
	//console.log('env', env);
	const modelName = 'Xenova/paraphrase-MiniLM-L6-v2';
	embederModelP = new Promise(()=>null);
	console.log(new Date(), 'loading tokenizer...');
	embederTokenizerP = AutoTokenizer.from_pretrained(modelName);
	console.log({ embederTokenizerP });
	console.log(new Date(), `loading the config and model of ${modelName}...`);
	const config = await AutoConfig.from_pretrained(modelName);
	config.is_encoder = true;
	console.log({ config });
	embederModelP = PreTrainedModel.from_pretrained(modelName, { config,  progress_callback: download_callback });
	await embederTokenizerP;
	const model = await embederModelP;
	chrome.storage.local.set({ somethingJustFinishedDownloading: true, modelLoadingStatus: `Embeder Ready`, modelProgress: false });
	console.log(new Date(), "model loaded");
	console.log({ model });
	unmaskerP = null;
        manualMaskTokenizerP = null;
        manualMaskModelP = null;
    } catch (err) {
	console.error("[ERROR] An error occured while loading similarity model: ", err);
	embederTokenizerP = null;
	embederModelP = null;
	return false;
    }
}

async function initializeManualMaskModel() {
  try {
    	const modelName = "Xenova/albert-base-v2";
	console.log(new Date(), `loading the tokenizer of ${modelName}...`);
	manualMaskTokenizerP = AutoTokenizer.from_pretrained(modelName);
    	manualMaskTokenizerP.then(()=>console.log(new Date(), "manual mask tokenizer loaded"));
	console.log(new Date(), `loading the model of ${modelName}...`);
	manualMaskModelP = AutoModelForMaskedLM.from_pretrained(modelName, { progress_callback: download_callback });
    	manualMaskModelP.then(()=>console.log(new Date(), "multi-token mask model solution loaded"));
    	await manualMaskTokenizerP;
    	await manualMaskModelP;
	chrome.storage.local.set({ somethingJustFinishedDownloading: true, modelLoadingStatus: `${modelName} Ready`, modelProgress: false });
	console.log(new Date(), "model loaded");
  	unmaskerP = null;
    	embederTokenizerP = null;
    	embederModelP = null;
  } catch (err) {
	console.error("[ERROR] An error occured while loading manual mask model: ", err);
    	manualMaskTokenizerP = null;
    	manualMaskModelP = null;
    	return false;
  }
}

async function findValidReplacements(originalWords, revocabPos, candidateWords) {
    const { findValidReplacementsMethod, halfContextLen } = await chrome.storage.local.get(['findValidReplacementsMethod', 'halfContextLen']);
    if (findValidReplacementsMethod==='fill-mask') {
	const { topk } = await chrome.storage.local.get('topk');
	if (unmaskerP===null) { await initializeMaskModel() }
    	const pipe = await unmaskerP;
	const masked =
		originalWords.slice(
			Math.max(0, revocabPos-halfContextLen),
			revocabPos
		).join('').replace(unmaskerP.mask, '')

			+

		unmaskerP.mask+`(${originalWords[revocabPos]})`

			+

		originalWords.slice(
			revocabPos+1,
			Math.min(originalWords.length, revocabPos+halfContextLen+1)).join('').replace(unmaskerP.mask, '')
	;
        if (! /\[MASK\].*?[\w,.!?]+.*?/.test(masked)) masked += '.';
    	const validReplacements = new Set((await pipe(masked, { topk })).map((tokenPredict) => tokenPredict.token_str.replace(/^\W*/, '').replace(/\W*$/, '').toLowerCase()));
    	const finalValids = candidateWords.filter(candidate => validReplacements.has(candidate));
      	return [finalValids, new Array(len(finalValids))];
    }

    

    else if (findValidReplacementsMethod==='similarity') {
	if (embederTokenizerP===null || embederModelP===null) { await initializeSimilarityModel() }
	const tokenizer = await embederTokenizerP;
	const model = await embederModelP;

	const front = originalWords.slice(0, revocabPos).join('');
	const targetWord = originalWords[revocabPos];
	const back = originalWords.slice(revocabPos+1).join('');
	const originalWordEmbedding = await get_mem(targetWord);
	const originalWordContextualEmbedding = await get_part2_mem(front, targetWord, back);
	//console.log("TODO: Maybe this should be optimized?");
	//console.log("candidates", candidateWords);
	const candidatesContextualEmbeddings = await Promise.all(
		candidateWords.map(candidate => get_part2_mem(front, candidate, back))
	);
	function subtractArrays(arr1, arr2) {
    		if (Array.isArray(arr1) && Array.isArray(arr2)) {
    		    if (arr1.length !== arr2.length) {
    		        throw new Error('Arrays must be of the same length');
    		    }
    		    return arr1.map((item, index) => subtractArrays(item, arr2[index]));
    		} else if (typeof arr1 === 'number' && typeof arr2 === 'number') {
    		    return arr1 - arr2;
    		} else {
    		    throw new Error('Array elements must be of the same type');
    		}
	}
	//const originalDif = subtractArrays(originalWordEmbedding.tolist(), originalWordContextualEmbedding.tolist());
	//const cses = candidatesContextualEmbeddings.map(
	//	candidateContextualEmbedding => cos_sim(originalDif, subtractArrays(originalWordEmbedding.tolist(), candidateContextualEmbedding.tolist()))
	//);
	const cses = candidatesContextualEmbeddings.map(
		candidateContextualEmbedding => cos_sim(originalWordContextualEmbedding.tolist(), candidateContextualEmbedding.tolist())
	);
	const threshold = 0.501 + 0.1; // TODO: Assign it a better value
	// TODO: Make threshold customizable
        candidatesContextualEmbeddings.forEach((candidateContextualEmbedding, idx) => {
		const sim = cos_sim(originalWordContextualEmbedding.tolist(), candidateContextualEmbedding.tolist());
	  	if (sim >= threshold) {
		  return [ [candidateWords[idx]], [sim] ];
		}
	});
      	return [[], []];

	async function get_part2_mem(part1, part2, part3) {
	    const tokens_part1 = [
		    ...tokenizer.encode('[CLS]', null, { add_special_tokens: false }),
		    ...tokenizer.encode(part1, null, { add_special_tokens: false, truncation: true })
	    ];
	    console.log({part1, part2, part3});
	    const tokens_part2 = tokenizer.encode(part2, null, { add_special_tokens: false, truncation: true });
	    const tokens_part3 = [
		    ...tokenizer.encode(part3, null, { add_special_tokens: false, truncation: true }),
		    ...tokenizer.encode('[SEP]', null, { add_special_tokens: false })
	    ];
	    const token_ids = [ ...tokens_part1 , ...tokens_part2 , ...tokens_part3 ];
	    const part2_poses = [ tokens_part1.length, tokens_part1.length + tokens_part2.length ];
	
	    //console.log("ids", token_ids.map(num=>num));
	    const tokenized = {
	            'input_ids': new Tensor('int64', token_ids.map(num=>BigInt(num)), [1, token_ids.length]),
	            'attention_mask': new Tensor('int64', new Array(token_ids.length).fill(1n), [1, token_ids.length]),
	            'token_type_ids': new Tensor('int64', new Array(token_ids.length).fill(0n), [1, token_ids.length])
	            };
	
	    const output = await model({ ...tokenized });
	    const embeddings = output.last_hidden_state.squeeze();

	    const part2_attention_mask = tokenized['attention_mask'].squeeze().slice([part2_poses[0], part2_poses[1]]);
	    const part2_embeddings = embeddings.slice([part2_poses[0], part2_poses[1]]);
	    
	    const part2_mean_embeddings = mean_pooling(part2_embeddings.unsqueeze(0), part2_attention_mask.unsqueeze(0)).squeeze();
	
	    return part2_mean_embeddings;
	}


	async function get_mem(word) {
	    const token_ids = tokenizer.encode(word, null, { add_special_token_ids: true, truncation: true });
	    //console.log("ids", token_ids.map(num=>num));
	    const tokenized = {
	        'input_ids': new Tensor('int64', token_ids.map(num=>BigInt(num)), [1, token_ids.length]),
	        'attention_mask': new Tensor('int64', new Array(token_ids.length).fill(1n), [1, token_ids.length]),
	        'token_type_ids': new Tensor('int64', new Array(token_ids.length).fill(0n), [1, token_ids.length])
	    };
	
	    const output = await model({ ...tokenized });
	    
	    const word_embeddings = output.last_hidden_state.squeeze().slice([1, output.last_hidden_state.dims[1]-1]);
	    const word_masks = tokenized['attention_mask'].squeeze().slice([1, output.last_hidden_state.dims[1]-1]);
	    const mean_embeddings = mean_pooling(word_embeddings.unsqueeze(0), word_masks.unsqueeze(0)).squeeze();
	    return mean_embeddings;
	}
    }
    



    else if (findValidReplacementsMethod==='fill-multi-masks') {
	if (manualMaskModelP===null || manualMaskTokenizerP===null) { await initializeManualMaskModel() }
     	const tokenizer = await manualMaskTokenizerP;
        const model = await manualMaskModelP;
      	//const threshold = 12.3; // Prioritize Accuracy // TODO: Make threshold customizable
        //const threshold = 10;
        const threshold = 9.4;
      	//const threshold = 5.8; // Prioritize F1 // TODO: Make threshold customizable
      	let debugReturn = [];
      	let toReturn = [];
      	for (let candidate of candidateWords) {
        	const [ part1, part2, part3 ] = [ tokenizer._tokenizer_config.cls_token + originalWords.slice(0, revocabPos).join(''), candidate, originalWords.slice(revocabPos+1).join('') + tokenizer._tokenizer_config.sep_token ];
      		const newIdsPart1 = tokenizer.encode(part1, null, { add_special_tokens: false, truncation: true });
      		const newIdsPart2 = tokenizer.encode(part2, null, { add_special_tokens: false, truncation: false });
      		const newIdsPart3 = tokenizer.encode(part3, null, { add_special_tokens: false, truncation: true });
      		const newIds = [...newIdsPart1, ...newIdsPart2, ...newIdsPart3];
      		const newPart2Range = [newIdsPart1.length, newIdsPart1.length+newIdsPart2.length];
      		const input_ids = new Tensor('int64', newIds.map(id=>BigInt(id)), [1, newIds.length]);
      		const attention_mask = new Tensor('int64', new Array(newIds.length).fill(1n).fill(0n, ...newPart2Range), [1, newIds.length]);
	  	//const token_type_ids = new Tensor('int64', new Array(newIds.length).fill(0n), [1, newIds.length]);
        	const output = await model({ input_ids, attention_mask/*, token_type_ids*/ });
        	const logit = output.logits[0];
	  	//console.log({part1, part2, part3});
	  	//console.log({newIds, model});
	  	//console.log({input_ids, attention_mask/*, token_type_ids*/});
	  	//console.log({logit});
        	let reasonability = 1;
		for (let idx = 0; idx < (newPart2Range[1]-newPart2Range[0]); idx++) {
	  	  //console.log(`${candidate}: `, reasonability);
		  //console.log('*', logit[newPart2Range[0]+idx][newIdsPart2[idx]].item());
		  reasonability *= logit[newPart2Range[0]+idx][newIdsPart2[idx]].item();
		}
		reasonability **= 1/(newPart2Range[1]-newPart2Range[0]);
	  	//console.log(`${candidate}: `, reasonability);
		if (reasonability>=threshold) {
		  toReturn = [candidate];
		  debugReturn = [reasonability]
		  break;
		}
	};
      	return [toReturn, debugReturn];
    } else {
	throw new Error(`Unknown find valid replacements method '${findValidReplacementsMethod}'.`);
    }
}



console.log(new Date(), "Background script initializing...");


async function checkAndLoad() {
	// Check and Set chrome.storage
	const storage = await chrome.storage.local.get();
	//console.log(new Date(), 'Original: ', storage);
	//await chrome.storage.local.clear();
        await chrome.storage.local.set({
            activeVocabsList: storage.activeVocabsList || [],
            synsToVocabs: storage.synsToVocabs || {},
            vocabsToSyns: storage.vocabsToSyns || {},
            inactiveVocabsLists: storage.inactiveVocabsLists || {},
	    topk: storage.topk || 200,
	    halfContextLen: storage.halfContextLen || 12,
	    findValidReplacementsMethod: 'fill-multi-masks',
	    care: storage.care===undefined ? true : storage.care,
	    autoReplace: storage.autoReplace===undefined ? false : storage.autoReplace,
        });
	chrome.storage.local.set({
		modelProgress: false,
		modelLoadingStatus: '',
		somethingJustFinishedDownloading: false
	}); // TODO: Move these to chrome's session storage
    	console.log(new Date(), 'Storage initialized.');
	//console.log('Now: ', await chrome.storage.local.get());

	// Load Transformers Model
	const { findValidReplacementsMethod } = await chrome.storage.local.get('findValidReplacementsMethod');
	switch (findValidReplacementsMethod) {
		case 'fill-mask':
			await initializeMaskModel();
			break;
		case 'similarity':
			await initializeSimilarityModel();
			break;
	  case 'fill-multi-masks':
	    		await initializeManualMaskModel();
	    		break;
		default:
			console.error("Unknown method:", findValidReplacementsMethod);
	}
}

/* function defining mostly above */

checkAndLoad();

// Installation Listener
chrome.runtime.onInstalled.addListener(async details => {
    console.log(new Date(), "Handling installation", details);
    if (details.reason === "install") {
        console.log("First-time install!");
    } else if (details.reason === "update") {
        const thisVersion = chrome.runtime.getManifest().version;
        console.log(`Updated from ${details.previousVersion} to ${thisVersion}`);
    }

});

// Set up context menus
chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
        id: 'addToActiveVocabList',
        title: 'Add to Active Vocab List',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'revertReplacementsForPage',
        title: 'Revert All Replacements on This Page',
        contexts: ['page']
    });

    chrome.contextMenus.create({
        id: 'replaceSelected',
        title: 'Replace for Selected',
        contexts: ['selection']
    });

    chrome.contextMenus.create({
        id: 'replaceForPage',
        title: 'Replace With Vocabulary on This Page',
        contexts: ['page']
    });

    // Add event listener for context menu options
    console.log(new Date(), "Context menus initialized");
    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId === "addToActiveVocabList") {
            activateVocabs([info.selectionText]);
        } else if (info.menuItemId === "revertReplacementsForPage") {
	    chrome.tabs.sendMessage(tab.id, { action: "revertReplacementsForPage" });
	} else if (info.menuItemId === "replaceSelected") {
            chrome.tabs.sendMessage(tab.id, {action: "replaceSelected"});
        } else if (info.menuItemId === "replaceForPage") {
            chrome.tabs.sendMessage(tab.id, { action: 'replaceWordsForPage' });
        }
    });
    console.log(new Date(), "Context menus listener initialized");
});

// Add message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  //console.log(new Date(), {message, sender, sendResponse});
  if (message.action === 'findValidReplacements') {
    const p = findValidReplacements(...message.data);
    p.catch((err) => {
	console.error("Error when finding valid replacements: ", err);
      	sendResponse([[], []]);
    });
    p.then((result) => {
    	sendResponse(result);
    });
    return true;
  } else if (message.action === 'lockOperation') {
        if (! mutexes[message.lockName]) mutexes[message.lockName] = withTimeout(new Mutex(), 16000);
        if (message.operation === 'acquire') {
	  mutexes[message.lockName].acquire().then(()=>sendResponse());
	  return true;
	} if (message.operation === 'release') {
	  mutexes[message.lockName].release();
	  sendResponse();
	} else {
	  console.error("Unkown mutex operation:", message.lockName);
	}
  } else if (message.action === 'lockCheck') {
  	sendResponse(mutexes);
  } else {
	console.error(`Unkown action ${action}`);
  }
});
console.log(new Date(), "Message listener added.");
