import { fetchSynonymsBatch } from './synonymUtils.js';
import { Mutex, withTimeout, E_TIMEOUT } from 'async-mutex';

let localMutexes = false;
export function setLocalMutexes(mutexes) {
  localMutexes = mutexes;
}
export function acquireLocks(lockNames) {
  //console.log('acquring locks', lockNames);
  //console.log('localm', localMutexes);
  if (localMutexes) {
      return Promise.all(lockNames.map(lockName =>
        localMutexes[lockName] ? localMutexes[lockName].acquire() : localMutexes[lockName] = withTimeout(new Mutex(), 16000)
      ))
  } else {
      return Promise.all(lockNames.map(lockName => 
        chrome.runtime.sendMessage({action: 'lockOperation', lockName: lockName, operation: 'acquire'}).catch((e)=>console.error(`Error acquiring lock: ${e}`))
      ));
  }
}
export function releaseLocks(lockNames) {
  //console.log('releasing locks', lockNames);
  if (localMutexes) {
      return Promise.all(lockNames.map(async lockName =>
	localMutexes[lockName].release()
      ));
  } else {
      return Promise.all(lockNames.map(async lockName => 
        chrome.runtime.sendMessage({action: 'lockOperation', lockName: lockName, operation: 'release'})
      ));
  }
}
export async function withLocked(lockNames, fn) {
  const id = Math.random();
  const old = new Date().getTime();
  //console.log("getting lock of", lockNames, "id", id, "old", await chrome.storage.local.get());
  await acquireLocks(lockNames);
  //console.log("lock got", lockNames, "id", id, "old", await chrome.storage.local.get());
  try {
      await fn();
  }
  finally {
      await releaseLocks(lockNames);
  }
  //console.log("lock released, storage:", await chrome.storage.local.get(), "id", id, "took", new Date().getTime()-old, 'ms');
  //console.log();
}

export async function getStorageData(keys) { // This function waits for the lock to be removed
  if (! Array.isArray(keys)) keys = [keys];
  if (keys.length) {
    await withLocked(keys, ()=>{});
  }
  return await chrome.storage.local.get(keys);
}

export async function setStorageData(data) {
  return await chrome.storage.local.set(data);
}

// Add activated vocabs and their synonyms
async function getAddedVocabsToSyns(vocabsToSyns, vocabsToAdd, synonymsBatchToAdd) {
  for (let idx in vocabsToAdd) {
    vocabsToSyns[vocabsToAdd[idx]] = Array.from(new Set(synonymsBatchToAdd[idx]));
  }
  return vocabsToSyns;
}

async function getAddedSynsToVocabs(synsToVocabs, vocabsToAdd, synonymsBatchToAdd) {
  for (let idx in synonymsBatchToAdd) {
    synonymsBatchToAdd[idx].forEach(synonym => {
      console.log('synonym:', synonym);
      console.log('s2v:', synsToVocabs[synonym]);
      console.log('v2s:', vocabsToAdd[idx]);
      synsToVocabs[synonym] = synsToVocabs[synonym] ? Array.from(new Set([...synsToVocabs[synonym], vocabsToAdd[idx]])) : [vocabsToAdd[idx]];
    });
  }
  return synsToVocabs;
}

// Major Exports
export async function deactivateVocabs(vocabsToDel) {
  vocabsToDel = await normalizeWords(vocabsToDel, false);
  if (!vocabsToDel.length) {
    return 0;
  }
  
  await withLocked(['vocabsToSyns', 'synsToVocabs', 'activeVocabsList'], async () => {
    let { vocabsToSyns = {}, synsToVocabs = {}, activeVocabsList = [] } = await chrome.storage.local.get(['vocabsToSyns', 'synsToVocabs', 'activeVocabsList']);
    const delSet = new Set(vocabsToDel);
    activeVocabsList = activeVocabsList.filter(vocab => !delSet.has(vocab));
    const synonyms = vocabsToDel.flatMap((vocabToDel) => vocabsToSyns[vocabToDel]);
    synonyms.forEach((synonym) => { delete synsToVocabs[synonym]; });
    vocabsToDel.forEach((vocabToDel) => { delete vocabsToSyns[vocabToDel]; });

    await setStorageData({ vocabsToSyns, synsToVocabs, activeVocabsList });
  });
}

export async function activateVocabs(vocabsToAdd) {
  //console.log("started normalizing");
  vocabsToAdd = await normalizeWords(vocabsToAdd, false);
  if (!vocabsToAdd.length) {
    return 0;
  }

  //console.log("started waiting when activating vocabs!");
  let { vocabsToSyns = {}, synsToVocabs = {}, activeVocabsList = [] } = await chrome.storage.local.get(['vocabsToSyns', 'synsToVocabs', 'activeVocabsList']);
  let synonymsBatchToAdd = [];
  synonymsBatchToAdd = await fetchSynonymsBatch(vocabsToAdd);

  let returnValue = 0;
  await withLocked(['vocabsToSyns', 'synsToVocabs', 'activeVocabsList'], async () => {
    console.log("vocabsToAdd", vocabsToAdd);
    [vocabsToSyns, synsToVocabs] = await Promise.all([
      getAddedVocabsToSyns(vocabsToSyns, vocabsToAdd, synonymsBatchToAdd),
      getAddedSynsToVocabs(synsToVocabs, vocabsToAdd, synonymsBatchToAdd)
    ]);
    activeVocabsList = Array.from(new Set([...activeVocabsList, ...vocabsToAdd]));

    await setStorageData({ vocabsToSyns, synsToVocabs, activeVocabsList });
    returnValue = vocabsToAdd.length;
  });
  return returnValue;
}

export async function activateInactiveVocabs(listName, loadAmount, selectionType) {
  let splicedVocabs = [];
  await withLocked(['inactiveVocabsLists'], async () => {
    let { inactiveVocabsLists = {} } = await chrome.storage.local.get('inactiveVocabsLists');
    let inactiveVocabsList = inactiveVocabsLists[listName] || [];
    if (selectionType==='random') {
      while (splicedVocabs.length < loadAmount && inactiveVocabsList.length > 0) {
        const randomIdx = Math.floor(Math.random() * inactiveVocabsList.length);
        splicedVocabs.push(inactiveVocabsList.splice(randomIdx, 1)[0]);
      }
    } else if (selectionType==='ordered') {
      splicedVocabs = inactiveVocabsList.splice(0, loadAmount);
    } else {
      [splicedVocabs, inactiveVocabsList] = [inactiveVocabsList, []];
    }
    inactiveVocabsLists[listName] = inactiveVocabsList;
    await setStorageData({ inactiveVocabsLists });
  });

  const returnValue = await activateVocabs(splicedVocabs);
  return returnValue; // return the number of loaded vocabs
}

export async function addInactiveVocabs(listName, vocabsToAdd) {
  vocabsToAdd = await normalizeWords(vocabsToAdd, false);
  if (!vocabsToAdd.length) {
    return 0;
  }
  await withLocked(['inactiveVocabsLists'], async () => {
    const { inactiveVocabsLists = {} } = await chrome.storage.local.get('inactiveVocabsLists');
    if (!inactiveVocabsLists[listName]) {
      inactiveVocabsLists[listName] = [];
    }
    inactiveVocabsLists[listName] = [...new Set([...inactiveVocabsLists[listName], ...vocabsToAdd])];
    await setStorageData({ 'inactiveVocabsLists': inactiveVocabsLists });
  });
}

export async function removeInactiveVocabsList(listNames) {
  withLocked(['inactiveVocabsLists'], async () => {
      let { inactiveVocabsLists = {} } = await chrome.storage.local.get('inactiveVocabsLists');
      listNames.forEach(listName => delete inactiveVocabsLists[listName]);
      await chrome.storage.local.set({ inactiveVocabsLists });
  })
}

export async function removeAllInactiveVocabsLists() {
  withLocked(['inactiveVocabsLists'], () => chrome.storage.local.set({ inactiveVocabsLists: {} }));
}

export async function clearActiveVocabsList() {
  withLocked(['activeVocabsList'], () => chrome.storage.local.set({ activeVocabsList: [], vocabsToSyns: {}, synsToVocabs: {} }));
}

export async function updateVocabSynonyms(vocab, updatedSynonyms) {
    updatedSynonyms = await normalizeWords(updatedSynonyms, false);
    await withLocked(['vocabsToSyns', 'synsToVocabs'], async () => {
        let { vocabsToSyns = {}, synsToVocabs = {} } = await chrome.storage.local.get(['vocabsToSyns', 'synsToVocabs']);


        const oldSynonyms = vocabsToSyns[vocab] || [];
        const updatedSynonymsSet = new Set(updatedSynonyms);
        const oldSynonymsSet = new Set(oldSynonyms);
        const synonymsToDelete = oldSynonyms.filter(syn => !updatedSynonymsSet.has(syn));
        const synonymsToAdd = updatedSynonyms.filter(syn => !oldSynonymsSet.has(syn));

        for (const syn of synonymsToDelete) {
            if (synsToVocabs[syn]) {
                synsToVocabs[syn] = synsToVocabs[syn].filter(v => v !== vocab);
                if (synsToVocabs[syn].length === 0) {
                    delete synsToVocabs[syn];
                }
            }
        }

        for (const syn of synonymsToAdd) {
            if (!synsToVocabs[syn]) {
                synsToVocabs[syn] = [];
            }
            synsToVocabs[syn].push(vocab);
        }

        vocabsToSyns[vocab] = Array.from(new Set(updatedSynonyms));

	console.log('added', {synsToVocabs});
        await setStorageData({ vocabsToSyns, synsToVocabs });
    });
}

async function normalizeWords(words, checkAddedAlready=false, checkLock=false) {
  words = words.map(word => word.trim().toLowerCase());
  words = words.filter(word => word && word !== '');
  if (checkAddedAlready) {
    const {activeVocabsList=[]} = await (checkLock ? getStorageData('activeVocabsList') : chrome.storage.local.get('activeVocabsList'));
    const existingVocabsSet = new Set(activeVocabsList);
    words = words.filter(word => !existingVocabsSet.has(word));
  }
  words = Array.from(new Set(words));
  return words;
}

