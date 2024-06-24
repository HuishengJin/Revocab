// src/content.js

import { setStorageData, activateVocabs } from './utils/storageUtils.js';
import { requestForValidReplacements } from './utils/modelUtils.js';
import { shuffleArray, addStyle } from './utils/commonUtils.js';


const readableElementList = [
    "P", "H1", "H2", "H3", "H4", "H5", "H6", "LI", 
    "TD",
    "DT", "DD", "SUMMARY", "FIGCAPTION", 
    "LEGEND", "LABEL"
];
const readableElementSet = new Set(readableElementList);
function isReadableElement(element) {
    return readableElementSet.has(element.nodeName);
}
let originalContents = new Map(); // To store original contents of elements

async function replaceSelected(lang='en') {


    const selection = window.getSelection();
    if (!selection.rangeCount) {
        return;
    }

    const { topk=240, care=true, synsToVocabs={} } = await chrome.storage.local.get(['topk', 'care', 'synsToVocabs']);
    
    const range = selection.getRangeAt(0);
    const commonAncestor = range.commonAncestorContainer;
    if (commonAncestor.nodeType === Node.TEXT_NODE && isReadableElement(commonAncestor.parentElement)) {
        replaceWithVocabs(commonAncestor.parentElement, synsToVocabs, topk, care, lang);
        return;
    }
    if (commonAncestor.nodeType === Node.ELEMENT_NODE && isReadableElement(commonAncestor)) {
        replaceWithVocabs(commonAncestor, synsToVocabs, topk, care, lang);
        return;
    }

    const treeWalker = document.createTreeWalker(
        commonAncestor,
        NodeFilter.SHOW_ELEMENT,
        {
            acceptNode(node) {
                if (range.intersectsNode(node) && isReadableElement(node)) {
                    return NodeFilter.FILTER_ACCEPT;
                }
                return NodeFilter.FILTER_REJECT;
            }
        },
        false
    );

    let p = [];
    while (treeWalker.nextNode()) {
        p.push(replaceWithVocabs(treeWalker.currentNode, synsToVocabs, topk, care, lang));
    }
    await Promise.all(p);
    //console.log("All walked");
}

function getDirectTextPositions(element) {
    const textContent = element.textContent;
    let childNodes = element.childNodes;
    let positions = [];
    let currentIndex = 0;
    
    for (let node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            let length = node.textContent.length;
            positions.push({ startPos: currentIndex, endPos: currentIndex + length - 1 });
            currentIndex += length;
        } else {
            currentIndex += node.textContent.length;
        }
    }
    
    return positions;
}

function replaceDirectText(element, directTextReplacementFragments) {
    let childNodes = Array.from(element.childNodes);
    let textIndex = 0;
    
    for (let node of childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            if (textIndex < directTextReplacementFragments.length) {
                element.replaceChild(directTextReplacementFragments[textIndex++], node);
            }
        }
    }
}

async function replaceWordsAutomatically(ancestor, lang='en', highlight=true) {
    const readableElements = Array.from(ancestor.querySelectorAll(readableElementList));
    const { topk=240 } = await chrome.storage.local.get('topk');
    const { synsToVocabs = {} } = await chrome.storage.local.get('synsToVocabs');
    const { care = true } = await chrome.storage.local.get('care');
    if (highlight) addStyle('.RevocabINS{ background-color: yellow }'/*, 6000*/);
    await Promise.all(readableElements.map(element => replaceWithVocabs(element, synsToVocabs, topk, care, lang)));
}

async function replaceWithVocabs(element, synsToVocabs, topk=240, care, lang='en') {
    try {
    	//console.log("REPLACING", element);

    	const text = element.textContent;
    	const directTextPositions = getDirectTextPositions(element);
    	if (directTextPositions.length===0) return false;

    	const text2sentencer = new Intl.Segmenter(lang, { granularity: 'sentence' });
    	const sentence2worder = new Intl.Segmenter(lang, { granularity: 'word' });
    	const segmenter = (model, text) => Array.from(model.segment(text)).map(r => r.segment);

    	let sentences = segmenter(text2sentencer, text);
    	let replaced = false;
    	
    	let directTextReplacementFragments = [document.createDocumentFragment()];
    	let wordPos = {endPos: -1};
sentencesIteration:
    	for (let sentence of sentences) {
    	    let words = segmenter(sentence2worder, sentence);
wordsIteration:
    	    for (let i = 0; i < words.length; i++) {
    	        const word = words[i];
    	        if (! word.length) continue;
    	        [ wordPos.startPos, wordPos.endPos ] = [ wordPos.endPos+1, wordPos.endPos+word.length ];
    	        while (directTextPositions[0].endPos < wordPos.startPos) {
    	            directTextPositions.shift();
    	            directTextReplacementFragments.push(document.createDocumentFragment());
    	            if (! directTextPositions.length) break sentencesIteration;
    	        }
    	        if (! (directTextPositions[0].startPos <= wordPos.startPos && wordPos.endPos <= directTextPositions[0].endPos)) {
    	            continue;
    	        } 
    	        if (! (/[\W_]/.test(word))) {
    	            const targets = synsToVocabs[word.toLowerCase()];
    	            if (targets) {
    	    		//console.log(`Targets for ${word} are`, targets);
    	                const shuffledTargets = shuffleArray(targets);
    	    	    	let validReplacements = [shuffledTargets[0]];
		      	let scores = ['Reckless replacement here.'];
    	    	    	if (care) {
    	            	    [validReplacements, scores] = await requestForValidReplacements(words, i, shuffledTargets);
			    //console.log([validReplacements, scores]);
    	    	    	    //console.log('For', [words, words[i], shuffledTargets]);
    	            	    //console.log('Valids:',validReplacements);
    	    	    	}
    	            	        
    	            	for (let ridx=0; ridx<validReplacements.length; ridx++) {
			    const target = validReplacements[ridx];
			    const score = scores[ridx];
    	            	    words[i] = matchCase(word, target);
    	            	    if (!replaced && !originalContents.has(element)) {
    	            	        originalContents.set(element, element.innerHTML); 
    	            	    }
    	            	    replaced = true;
    	    	    	    const insElement = document.createElement("ins");
    	    	    	    insElement.textContent = words[i];
    	    	    	    insElement.title = `Originally: '${word}',  Reasonability Score: '${score}'`;
    	    	    	    insElement.classList.add('RevocabINS');
    	            	    directTextReplacementFragments[directTextReplacementFragments.length-1].appendChild(insElement);
    	            	    continue wordsIteration;
    	            	}
    	            }
    	        }
    	        directTextReplacementFragments[directTextReplacementFragments.length-1].appendChild(document.createTextNode(words[i]));
    	        //console.log('word', word);
    	    }

    	};
    	//console.log('element', element);
    	//console.log('reps', directTextReplacementFragments);
    	if (replaced) {
    	    replaceDirectText(element, directTextReplacementFragments);
    	    return true;
    	} else {
    	    return false;
    	}
    } catch (err) {
	console.error("Failed replacing: ", err);
    }
}

function matchCase(original, replacement) {
    if (original === original.toUpperCase()) return replacement.toUpperCase();
    if (original === original.toLowerCase()) return replacement.toLowerCase();
    if (original[0] === original[0].toUpperCase()) return replacement[0].toUpperCase() + replacement.slice(1);
    return replacement;
}

// Revert function implementation
function revertAllChanges() {
    for (let [element, originalContent] of originalContents) {
        element.innerHTML = originalContent;
    }
    originalContents.clear(); // Clear after reverting to prevent further use
}


// Message Handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    //console.log('received',request);
    //console.log('sender',sender);
    //console.log('sendResponse',sendResponse);
    if (request.action === 'replaceSelected') {
       replaceSelected().then(()=>{console.log("replacement list", originalContents)});
       ;
    } else if (request.action === 'revertReplacementsForPage') {
       revertAllChanges();
    } else if (request.action === 'replaceWordsForPage') {
       replaceWordsAutomatically(document).then(()=>{console.log("replacement list", originalContents)});
       ;
    } else {
       console.error("Unkown action:", request.action);
    }
});


chrome.storage.local.get('autoReplace').then(({ autoReplace = false }) => {
//console.log("replacement list", originalContents);
    if (autoReplace) {
       replaceWordsAutomatically(document).then(()=>{console.log("replacement list length", originalContents)});
;
    }
});
