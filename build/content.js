/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/async-mutex/index.mjs":
/*!********************************************!*\
  !*** ./node_modules/async-mutex/index.mjs ***!
  \********************************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   E_ALREADY_LOCKED: () => (/* binding */ E_ALREADY_LOCKED),
/* harmony export */   E_CANCELED: () => (/* binding */ E_CANCELED),
/* harmony export */   E_TIMEOUT: () => (/* binding */ E_TIMEOUT),
/* harmony export */   Mutex: () => (/* binding */ Mutex),
/* harmony export */   Semaphore: () => (/* binding */ Semaphore),
/* harmony export */   tryAcquire: () => (/* binding */ tryAcquire),
/* harmony export */   withTimeout: () => (/* binding */ withTimeout)
/* harmony export */ });
const E_TIMEOUT = new Error('timeout while waiting for mutex to become available');
const E_ALREADY_LOCKED = new Error('mutex already locked');
const E_CANCELED = new Error('request for lock canceled');

var __awaiter$2 = ( false) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Semaphore {
    constructor(_value, _cancelError = E_CANCELED) {
        this._value = _value;
        this._cancelError = _cancelError;
        this._queue = [];
        this._weightedWaiters = [];
    }
    acquire(weight = 1, priority = 0) {
        if (weight <= 0)
            throw new Error(`invalid weight ${weight}: must be positive`);
        return new Promise((resolve, reject) => {
            const task = { resolve, reject, weight, priority };
            const i = findIndexFromEnd(this._queue, (other) => priority <= other.priority);
            if (i === -1 && weight <= this._value) {
                // Needs immediate dispatch, skip the queue
                this._dispatchItem(task);
            }
            else {
                this._queue.splice(i + 1, 0, task);
            }
        });
    }
    runExclusive(callback_1) {
        return __awaiter$2(this, arguments, void 0, function* (callback, weight = 1, priority = 0) {
            const [value, release] = yield this.acquire(weight, priority);
            try {
                return yield callback(value);
            }
            finally {
                release();
            }
        });
    }
    waitForUnlock(weight = 1, priority = 0) {
        if (weight <= 0)
            throw new Error(`invalid weight ${weight}: must be positive`);
        if (this._couldLockImmediately(weight, priority)) {
            return Promise.resolve();
        }
        else {
            return new Promise((resolve) => {
                if (!this._weightedWaiters[weight - 1])
                    this._weightedWaiters[weight - 1] = [];
                insertSorted(this._weightedWaiters[weight - 1], { resolve, priority });
            });
        }
    }
    isLocked() {
        return this._value <= 0;
    }
    getValue() {
        return this._value;
    }
    setValue(value) {
        this._value = value;
        this._dispatchQueue();
    }
    release(weight = 1) {
        if (weight <= 0)
            throw new Error(`invalid weight ${weight}: must be positive`);
        this._value += weight;
        this._dispatchQueue();
    }
    cancel() {
        this._queue.forEach((entry) => entry.reject(this._cancelError));
        this._queue = [];
    }
    _dispatchQueue() {
        this._drainUnlockWaiters();
        while (this._queue.length > 0 && this._queue[0].weight <= this._value) {
            this._dispatchItem(this._queue.shift());
            this._drainUnlockWaiters();
        }
    }
    _dispatchItem(item) {
        const previousValue = this._value;
        this._value -= item.weight;
        item.resolve([previousValue, this._newReleaser(item.weight)]);
    }
    _newReleaser(weight) {
        let called = false;
        return () => {
            if (called)
                return;
            called = true;
            this.release(weight);
        };
    }
    _drainUnlockWaiters() {
        if (this._queue.length === 0) {
            for (let weight = this._value; weight > 0; weight--) {
                const waiters = this._weightedWaiters[weight - 1];
                if (!waiters)
                    continue;
                waiters.forEach((waiter) => waiter.resolve());
                this._weightedWaiters[weight - 1] = [];
            }
        }
        else {
            const queuedPriority = this._queue[0].priority;
            for (let weight = this._value; weight > 0; weight--) {
                const waiters = this._weightedWaiters[weight - 1];
                if (!waiters)
                    continue;
                const i = waiters.findIndex((waiter) => waiter.priority <= queuedPriority);
                (i === -1 ? waiters : waiters.splice(0, i))
                    .forEach((waiter => waiter.resolve()));
            }
        }
    }
    _couldLockImmediately(weight, priority) {
        return (this._queue.length === 0 || this._queue[0].priority < priority) &&
            weight <= this._value;
    }
}
function insertSorted(a, v) {
    const i = findIndexFromEnd(a, (other) => v.priority <= other.priority);
    a.splice(i + 1, 0, v);
}
function findIndexFromEnd(a, predicate) {
    for (let i = a.length - 1; i >= 0; i--) {
        if (predicate(a[i])) {
            return i;
        }
    }
    return -1;
}

var __awaiter$1 = ( false) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class Mutex {
    constructor(cancelError) {
        this._semaphore = new Semaphore(1, cancelError);
    }
    acquire() {
        return __awaiter$1(this, arguments, void 0, function* (priority = 0) {
            const [, releaser] = yield this._semaphore.acquire(1, priority);
            return releaser;
        });
    }
    runExclusive(callback, priority = 0) {
        return this._semaphore.runExclusive(() => callback(), 1, priority);
    }
    isLocked() {
        return this._semaphore.isLocked();
    }
    waitForUnlock(priority = 0) {
        return this._semaphore.waitForUnlock(1, priority);
    }
    release() {
        if (this._semaphore.isLocked())
            this._semaphore.release();
    }
    cancel() {
        return this._semaphore.cancel();
    }
}

var __awaiter = ( false) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function withTimeout(sync, timeout, timeoutError = E_TIMEOUT) {
    return {
        acquire: (weightOrPriority, priority) => {
            let weight;
            if (isSemaphore(sync)) {
                weight = weightOrPriority;
            }
            else {
                weight = undefined;
                priority = weightOrPriority;
            }
            if (weight !== undefined && weight <= 0) {
                throw new Error(`invalid weight ${weight}: must be positive`);
            }
            return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
                let isTimeout = false;
                const handle = setTimeout(() => {
                    isTimeout = true;
                    reject(timeoutError);
                }, timeout);
                try {
                    const ticket = yield (isSemaphore(sync)
                        ? sync.acquire(weight, priority)
                        : sync.acquire(priority));
                    if (isTimeout) {
                        const release = Array.isArray(ticket) ? ticket[1] : ticket;
                        release();
                    }
                    else {
                        clearTimeout(handle);
                        resolve(ticket);
                    }
                }
                catch (e) {
                    if (!isTimeout) {
                        clearTimeout(handle);
                        reject(e);
                    }
                }
            }));
        },
        runExclusive(callback, weight, priority) {
            return __awaiter(this, void 0, void 0, function* () {
                let release = () => undefined;
                try {
                    const ticket = yield this.acquire(weight, priority);
                    if (Array.isArray(ticket)) {
                        release = ticket[1];
                        return yield callback(ticket[0]);
                    }
                    else {
                        release = ticket;
                        return yield callback();
                    }
                }
                finally {
                    release();
                }
            });
        },
        release(weight) {
            sync.release(weight);
        },
        cancel() {
            return sync.cancel();
        },
        waitForUnlock: (weightOrPriority, priority) => {
            let weight;
            if (isSemaphore(sync)) {
                weight = weightOrPriority;
            }
            else {
                weight = undefined;
                priority = weightOrPriority;
            }
            if (weight !== undefined && weight <= 0) {
                throw new Error(`invalid weight ${weight}: must be positive`);
            }
            return new Promise((resolve, reject) => {
                const handle = setTimeout(() => reject(timeoutError), timeout);
                (isSemaphore(sync)
                    ? sync.waitForUnlock(weight, priority)
                    : sync.waitForUnlock(priority)).then(() => {
                    clearTimeout(handle);
                    resolve();
                });
            });
        },
        isLocked: () => sync.isLocked(),
        getValue: () => sync.getValue(),
        setValue: (value) => sync.setValue(value),
    };
}
function isSemaphore(sync) {
    return sync.getValue !== undefined;
}

// eslint-disable-next-lisne @typescript-eslint/explicit-module-boundary-types
function tryAcquire(sync, alreadyAcquiredError = E_ALREADY_LOCKED) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return withTimeout(sync, 0, alreadyAcquiredError);
}




/***/ }),

/***/ "./src/utils/commonUtils.js":
/*!**********************************!*\
  !*** ./src/utils/commonUtils.js ***!
  \**********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   addStyle: () => (/* binding */ addStyle),
/* harmony export */   setSubText: () => (/* binding */ setSubText),
/* harmony export */   shuffleArray: () => (/* binding */ shuffleArray)
/* harmony export */ });
/**
 * Function to inject CSS styles into the document.
 * Originally inspired by a solution found on Stack Overflow.
 * Source: https://stackoverflow.com/questions/15505225/inject-css-stylesheet-as-string-using-javascript
 * (MODIFIED)
 */
function addStyle(styleString, revertTimeout=false) {
  const style = document.createElement('style');
  document.head.append(style);
  style.textContent = styleString;
  if (revertTimeout) { setTimeout( (()=>style.remove()), revertTimeout ); }
  return style;
};
function setSubText(element, textContent, revertTimeout) {
  element.textContent = '';
  const textNode = document.createTextNode(textContent);
  element.appendChild(textNode);
  if (revertTimeout) { setTimeout( (()=>textNode.remove()), revertTimeout ); }
  return textNode;
}
// Cut: From SOF

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}



/***/ }),

/***/ "./src/utils/modelUtils.js":
/*!*********************************!*\
  !*** ./src/utils/modelUtils.js ***!
  \*********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   requestForValidReplacements: () => (/* binding */ requestForValidReplacements)
/* harmony export */ });
async function requestForValidReplacements(...data) {
    //console.log("Sending request", data);
    const r =  await chrome.runtime.sendMessage({ action: "findValidReplacements", data });
    //console.log('RESPONSE!', r);
    return r;
}


/***/ }),

/***/ "./src/utils/storageUtils.js":
/*!***********************************!*\
  !*** ./src/utils/storageUtils.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   acquireLocks: () => (/* binding */ acquireLocks),
/* harmony export */   activateInactiveVocabs: () => (/* binding */ activateInactiveVocabs),
/* harmony export */   activateVocabs: () => (/* binding */ activateVocabs),
/* harmony export */   addInactiveVocabs: () => (/* binding */ addInactiveVocabs),
/* harmony export */   clearActiveVocabsList: () => (/* binding */ clearActiveVocabsList),
/* harmony export */   deactivateVocabs: () => (/* binding */ deactivateVocabs),
/* harmony export */   getStorageData: () => (/* binding */ getStorageData),
/* harmony export */   releaseLocks: () => (/* binding */ releaseLocks),
/* harmony export */   removeAllInactiveVocabsLists: () => (/* binding */ removeAllInactiveVocabsLists),
/* harmony export */   removeInactiveVocabsList: () => (/* binding */ removeInactiveVocabsList),
/* harmony export */   setLocalMutexes: () => (/* binding */ setLocalMutexes),
/* harmony export */   setStorageData: () => (/* binding */ setStorageData),
/* harmony export */   updateVocabSynonyms: () => (/* binding */ updateVocabSynonyms),
/* harmony export */   withLocked: () => (/* binding */ withLocked)
/* harmony export */ });
/* harmony import */ var _synonymUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./synonymUtils.js */ "./src/utils/synonymUtils.js");
/* harmony import */ var async_mutex__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! async-mutex */ "./node_modules/async-mutex/index.mjs");



let localMutexes = false;
function setLocalMutexes(mutexes) {
  localMutexes = mutexes;
}
function acquireLocks(lockNames) {
  //console.log('acquring locks', lockNames);
  //console.log('localm', localMutexes);
  if (localMutexes) {
      return Promise.all(lockNames.map(lockName =>
        localMutexes[lockName] ? localMutexes[lockName].acquire() : localMutexes[lockName] = (0,async_mutex__WEBPACK_IMPORTED_MODULE_1__.withTimeout)(new async_mutex__WEBPACK_IMPORTED_MODULE_1__.Mutex(), 16000)
      ))
  } else {
      return Promise.all(lockNames.map(lockName => 
        chrome.runtime.sendMessage({action: 'lockOperation', lockName: lockName, operation: 'acquire'}).catch((e)=>console.error(`Error acquiring lock: ${e}`))
      ));
  }
}
function releaseLocks(lockNames) {
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
async function withLocked(lockNames, fn) {
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

async function getStorageData(keys) { // This function waits for the lock to be removed
  if (! Array.isArray(keys)) keys = [keys];
  if (keys.length) {
    await withLocked(keys, ()=>{});
  }
  return await chrome.storage.local.get(keys);
}

async function setStorageData(data) {
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
async function deactivateVocabs(vocabsToDel) {
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

async function activateVocabs(vocabsToAdd) {
  //console.log("started normalizing");
  vocabsToAdd = await normalizeWords(vocabsToAdd, false);
  if (!vocabsToAdd.length) {
    return 0;
  }

  //console.log("started waiting when activating vocabs!");
  let { vocabsToSyns = {}, synsToVocabs = {}, activeVocabsList = [] } = await chrome.storage.local.get(['vocabsToSyns', 'synsToVocabs', 'activeVocabsList']);
  let synonymsBatchToAdd = [];
  synonymsBatchToAdd = await (0,_synonymUtils_js__WEBPACK_IMPORTED_MODULE_0__.fetchSynonymsBatch)(vocabsToAdd);

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

async function activateInactiveVocabs(listName, loadAmount, selectionType) {
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

async function addInactiveVocabs(listName, vocabsToAdd) {
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

async function removeInactiveVocabsList(listNames) {
  withLocked(['inactiveVocabsLists'], async () => {
      let { inactiveVocabsLists = {} } = await chrome.storage.local.get('inactiveVocabsLists');
      listNames.forEach(listName => delete inactiveVocabsLists[listName]);
      await chrome.storage.local.set({ inactiveVocabsLists });
  })
}

async function removeAllInactiveVocabsLists() {
  withLocked(['inactiveVocabsLists'], () => chrome.storage.local.set({ inactiveVocabsLists: {} }));
}

async function clearActiveVocabsList() {
  withLocked(['activeVocabsList'], () => chrome.storage.local.set({ activeVocabsList: [], vocabsToSyns: {}, synsToVocabs: {} }));
}

async function updateVocabSynonyms(vocab, updatedSynonyms) {
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



/***/ }),

/***/ "./src/utils/synonymUtils.js":
/*!***********************************!*\
  !*** ./src/utils/synonymUtils.js ***!
  \***********************************/
/***/ ((__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   fetchSynonyms: () => (/* binding */ fetchSynonyms),
/* harmony export */   fetchSynonymsBatch: () => (/* binding */ fetchSynonymsBatch)
/* harmony export */ });
//const synonyms = require('synonyms');

async function fetchSynonyms(word) {
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

async function fetchSynonymsBatch(words) {
    const synonymsPromises = words.map(word => fetchSynonyms(word));
    return await Promise.all(synonymsPromises);
}




/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!************************!*\
  !*** ./src/content.js ***!
  \************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_storageUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./utils/storageUtils.js */ "./src/utils/storageUtils.js");
/* harmony import */ var _utils_modelUtils_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/modelUtils.js */ "./src/utils/modelUtils.js");
/* harmony import */ var _utils_commonUtils_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./utils/commonUtils.js */ "./src/utils/commonUtils.js");
// src/content.js






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
    if (highlight) (0,_utils_commonUtils_js__WEBPACK_IMPORTED_MODULE_2__.addStyle)('.RevocabINS{ background-color: yellow }'/*, 6000*/);
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
    	                const shuffledTargets = (0,_utils_commonUtils_js__WEBPACK_IMPORTED_MODULE_2__.shuffleArray)(targets);
    	    	    	let validReplacements = [shuffledTargets[0]];
		      	let scores = ['Reckless replacement here.'];
    	    	    	if (care) {
    	            	    [validReplacements, scores] = await (0,_utils_modelUtils_js__WEBPACK_IMPORTED_MODULE_1__.requestForValidReplacements)(words, i, shuffledTargets);
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

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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a0Q7QUFDckY7QUFDQSxNQUFNO0FBQ047QUFDQSxNQUFNO0FBQ04scURBQXFELGtEQUFrRDtBQUN2RztBQUNBLE1BQU07QUFDTjtBQUNBO0FBQ0EsQ0FBQzs7O0FBR0QsZ0RBQWdELHFCQUFxQjtBQUNyRTtBQUNBO0FBQ0EscURBQXFELHlEQUF5RDtBQUM5RztBQUNBO0FBQ0EsQ0FBQyIsInNvdXJjZXMiOlsid2VicGFjazovL2V4dGVuc2lvbi8uL25vZGVfbW9kdWxlcy9hc3luYy1tdXRleC9pbmRleC5tanMiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL2NvbW1vblV0aWxzLmpzIiwid2VicGFjazovL2V4dGVuc2lvbi8uL3NyYy91dGlscy9tb2RlbFV0aWxzLmpzIiwid2VicGFjazovL2V4dGVuc2lvbi8uL3NyYy91dGlscy9zdG9yYWdlVXRpbHMuanMiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL3N5bm9ueW1VdGlscy5qcyIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9leHRlbnNpb24vLi9zcmMvY29udGVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFX1RJTUVPVVQgPSBuZXcgRXJyb3IoJ3RpbWVvdXQgd2hpbGUgd2FpdGluZyBmb3IgbXV0ZXggdG8gYmVjb21lIGF2YWlsYWJsZScpO1xuY29uc3QgRV9BTFJFQURZX0xPQ0tFRCA9IG5ldyBFcnJvcignbXV0ZXggYWxyZWFkeSBsb2NrZWQnKTtcbmNvbnN0IEVfQ0FOQ0VMRUQgPSBuZXcgRXJyb3IoJ3JlcXVlc3QgZm9yIGxvY2sgY2FuY2VsZWQnKTtcblxudmFyIF9fYXdhaXRlciQyID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jbGFzcyBTZW1hcGhvcmUge1xuICAgIGNvbnN0cnVjdG9yKF92YWx1ZSwgX2NhbmNlbEVycm9yID0gRV9DQU5DRUxFRCkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IF92YWx1ZTtcbiAgICAgICAgdGhpcy5fY2FuY2VsRXJyb3IgPSBfY2FuY2VsRXJyb3I7XG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVycyA9IFtdO1xuICAgIH1cbiAgICBhY3F1aXJlKHdlaWdodCA9IDEsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICBpZiAod2VpZ2h0IDw9IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgd2VpZ2h0ICR7d2VpZ2h0fTogbXVzdCBiZSBwb3NpdGl2ZWApO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFzayA9IHsgcmVzb2x2ZSwgcmVqZWN0LCB3ZWlnaHQsIHByaW9yaXR5IH07XG4gICAgICAgICAgICBjb25zdCBpID0gZmluZEluZGV4RnJvbUVuZCh0aGlzLl9xdWV1ZSwgKG90aGVyKSA9PiBwcmlvcml0eSA8PSBvdGhlci5wcmlvcml0eSk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEgJiYgd2VpZ2h0IDw9IHRoaXMuX3ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gTmVlZHMgaW1tZWRpYXRlIGRpc3BhdGNoLCBza2lwIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoSXRlbSh0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNwbGljZShpICsgMSwgMCwgdGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBydW5FeGNsdXNpdmUoY2FsbGJhY2tfMSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyJDIodGhpcywgYXJndW1lbnRzLCB2b2lkIDAsIGZ1bmN0aW9uKiAoY2FsbGJhY2ssIHdlaWdodCA9IDEsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICAgICAgY29uc3QgW3ZhbHVlLCByZWxlYXNlXSA9IHlpZWxkIHRoaXMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHdhaXRGb3JVbmxvY2sod2VpZ2h0ID0gMSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIGlmICh0aGlzLl9jb3VsZExvY2tJbW1lZGlhdGVseSh3ZWlnaHQsIHByaW9yaXR5KSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV0pXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSA9IFtdO1xuICAgICAgICAgICAgICAgIGluc2VydFNvcnRlZCh0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV0sIHsgcmVzb2x2ZSwgcHJpb3JpdHkgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlIDw9IDA7XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoUXVldWUoKTtcbiAgICB9XG4gICAgcmVsZWFzZSh3ZWlnaHQgPSAxKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlICs9IHdlaWdodDtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hRdWV1ZSgpO1xuICAgIH1cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlLmZvckVhY2goKGVudHJ5KSA9PiBlbnRyeS5yZWplY3QodGhpcy5fY2FuY2VsRXJyb3IpKTtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICB9XG4gICAgX2Rpc3BhdGNoUXVldWUoKSB7XG4gICAgICAgIHRoaXMuX2RyYWluVW5sb2NrV2FpdGVycygpO1xuICAgICAgICB3aGlsZSAodGhpcy5fcXVldWUubGVuZ3RoID4gMCAmJiB0aGlzLl9xdWV1ZVswXS53ZWlnaHQgPD0gdGhpcy5fdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoSXRlbSh0aGlzLl9xdWV1ZS5zaGlmdCgpKTtcbiAgICAgICAgICAgIHRoaXMuX2RyYWluVW5sb2NrV2FpdGVycygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9kaXNwYXRjaEl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gdGhpcy5fdmFsdWU7XG4gICAgICAgIHRoaXMuX3ZhbHVlIC09IGl0ZW0ud2VpZ2h0O1xuICAgICAgICBpdGVtLnJlc29sdmUoW3ByZXZpb3VzVmFsdWUsIHRoaXMuX25ld1JlbGVhc2VyKGl0ZW0ud2VpZ2h0KV0pO1xuICAgIH1cbiAgICBfbmV3UmVsZWFzZXIod2VpZ2h0KSB7XG4gICAgICAgIGxldCBjYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjYWxsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVsZWFzZSh3ZWlnaHQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBfZHJhaW5VbmxvY2tXYWl0ZXJzKCkge1xuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB3ZWlnaHQgPSB0aGlzLl92YWx1ZTsgd2VpZ2h0ID4gMDsgd2VpZ2h0LS0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YWl0ZXJzID0gdGhpcy5fd2VpZ2h0ZWRXYWl0ZXJzW3dlaWdodCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmICghd2FpdGVycylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgd2FpdGVycy5mb3JFYWNoKCh3YWl0ZXIpID0+IHdhaXRlci5yZXNvbHZlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcXVldWVkUHJpb3JpdHkgPSB0aGlzLl9xdWV1ZVswXS5wcmlvcml0eTtcbiAgICAgICAgICAgIGZvciAobGV0IHdlaWdodCA9IHRoaXMuX3ZhbHVlOyB3ZWlnaHQgPiAwOyB3ZWlnaHQtLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhaXRlcnMgPSB0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKCF3YWl0ZXJzKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBpID0gd2FpdGVycy5maW5kSW5kZXgoKHdhaXRlcikgPT4gd2FpdGVyLnByaW9yaXR5IDw9IHF1ZXVlZFByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAoaSA9PT0gLTEgPyB3YWl0ZXJzIDogd2FpdGVycy5zcGxpY2UoMCwgaSkpXG4gICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKCh3YWl0ZXIgPT4gd2FpdGVyLnJlc29sdmUoKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9jb3VsZExvY2tJbW1lZGlhdGVseSh3ZWlnaHQsIHByaW9yaXR5KSB7XG4gICAgICAgIHJldHVybiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwIHx8IHRoaXMuX3F1ZXVlWzBdLnByaW9yaXR5IDwgcHJpb3JpdHkpICYmXG4gICAgICAgICAgICB3ZWlnaHQgPD0gdGhpcy5fdmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0U29ydGVkKGEsIHYpIHtcbiAgICBjb25zdCBpID0gZmluZEluZGV4RnJvbUVuZChhLCAob3RoZXIpID0+IHYucHJpb3JpdHkgPD0gb3RoZXIucHJpb3JpdHkpO1xuICAgIGEuc3BsaWNlKGkgKyAxLCAwLCB2KTtcbn1cbmZ1bmN0aW9uIGZpbmRJbmRleEZyb21FbmQoYSwgcHJlZGljYXRlKSB7XG4gICAgZm9yIChsZXQgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShhW2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG52YXIgX19hd2FpdGVyJDEgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNsYXNzIE11dGV4IHtcbiAgICBjb25zdHJ1Y3RvcihjYW5jZWxFcnJvcikge1xuICAgICAgICB0aGlzLl9zZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKDEsIGNhbmNlbEVycm9yKTtcbiAgICB9XG4gICAgYWNxdWlyZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlciQxKHRoaXMsIGFyZ3VtZW50cywgdm9pZCAwLCBmdW5jdGlvbiogKHByaW9yaXR5ID0gMCkge1xuICAgICAgICAgICAgY29uc3QgWywgcmVsZWFzZXJdID0geWllbGQgdGhpcy5fc2VtYXBob3JlLmFjcXVpcmUoMSwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlbGVhc2VyO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcnVuRXhjbHVzaXZlKGNhbGxiYWNrLCBwcmlvcml0eSA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5ydW5FeGNsdXNpdmUoKCkgPT4gY2FsbGJhY2soKSwgMSwgcHJpb3JpdHkpO1xuICAgIH1cbiAgICBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5pc0xvY2tlZCgpO1xuICAgIH1cbiAgICB3YWl0Rm9yVW5sb2NrKHByaW9yaXR5ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VtYXBob3JlLndhaXRGb3JVbmxvY2soMSwgcHJpb3JpdHkpO1xuICAgIH1cbiAgICByZWxlYXNlKCkge1xuICAgICAgICBpZiAodGhpcy5fc2VtYXBob3JlLmlzTG9ja2VkKCkpXG4gICAgICAgICAgICB0aGlzLl9zZW1hcGhvcmUucmVsZWFzZSgpO1xuICAgIH1cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZW1hcGhvcmUuY2FuY2VsKCk7XG4gICAgfVxufVxuXG52YXIgX19hd2FpdGVyID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5mdW5jdGlvbiB3aXRoVGltZW91dChzeW5jLCB0aW1lb3V0LCB0aW1lb3V0RXJyb3IgPSBFX1RJTUVPVVQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhY3F1aXJlOiAod2VpZ2h0T3JQcmlvcml0eSwgcHJpb3JpdHkpID0+IHtcbiAgICAgICAgICAgIGxldCB3ZWlnaHQ7XG4gICAgICAgICAgICBpZiAoaXNTZW1hcGhvcmUoc3luYykpIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2VpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHByaW9yaXR5ID0gd2VpZ2h0T3JQcmlvcml0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3ZWlnaHQgIT09IHVuZGVmaW5lZCAmJiB3ZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGxldCBpc1RpbWVvdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaXNUaW1lb3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHRpbWVvdXRFcnJvcik7XG4gICAgICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGlja2V0ID0geWllbGQgKGlzU2VtYXBob3JlKHN5bmMpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHN5bmMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBzeW5jLmFjcXVpcmUocHJpb3JpdHkpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsZWFzZSA9IEFycmF5LmlzQXJyYXkodGlja2V0KSA/IHRpY2tldFsxXSA6IHRpY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aWNrZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgcnVuRXhjbHVzaXZlKGNhbGxiYWNrLCB3ZWlnaHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGxldCByZWxlYXNlID0gKCkgPT4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpY2tldCA9IHlpZWxkIHRoaXMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGlja2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSA9IHRpY2tldFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCBjYWxsYmFjayh0aWNrZXRbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSA9IHRpY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICByZWxlYXNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbGVhc2Uod2VpZ2h0KSB7XG4gICAgICAgICAgICBzeW5jLnJlbGVhc2Uod2VpZ2h0KTtcbiAgICAgICAgfSxcbiAgICAgICAgY2FuY2VsKCkge1xuICAgICAgICAgICAgcmV0dXJuIHN5bmMuY2FuY2VsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhaXRGb3JVbmxvY2s6ICh3ZWlnaHRPclByaW9yaXR5LCBwcmlvcml0eSkgPT4ge1xuICAgICAgICAgICAgbGV0IHdlaWdodDtcbiAgICAgICAgICAgIGlmIChpc1NlbWFwaG9yZShzeW5jKSkge1xuICAgICAgICAgICAgICAgIHdlaWdodCA9IHdlaWdodE9yUHJpb3JpdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcHJpb3JpdHkgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdlaWdodCAhPT0gdW5kZWZpbmVkICYmIHdlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHdlaWdodCAke3dlaWdodH06IG11c3QgYmUgcG9zaXRpdmVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QodGltZW91dEVycm9yKSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgKGlzU2VtYXBob3JlKHN5bmMpXG4gICAgICAgICAgICAgICAgICAgID8gc3luYy53YWl0Rm9yVW5sb2NrKHdlaWdodCwgcHJpb3JpdHkpXG4gICAgICAgICAgICAgICAgICAgIDogc3luYy53YWl0Rm9yVW5sb2NrKHByaW9yaXR5KSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNMb2NrZWQ6ICgpID0+IHN5bmMuaXNMb2NrZWQoKSxcbiAgICAgICAgZ2V0VmFsdWU6ICgpID0+IHN5bmMuZ2V0VmFsdWUoKSxcbiAgICAgICAgc2V0VmFsdWU6ICh2YWx1ZSkgPT4gc3luYy5zZXRWYWx1ZSh2YWx1ZSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGlzU2VtYXBob3JlKHN5bmMpIHtcbiAgICByZXR1cm4gc3luYy5nZXRWYWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpc25lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXNcbmZ1bmN0aW9uIHRyeUFjcXVpcmUoc3luYywgYWxyZWFkeUFjcXVpcmVkRXJyb3IgPSBFX0FMUkVBRFlfTE9DS0VEKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gd2l0aFRpbWVvdXQoc3luYywgMCwgYWxyZWFkeUFjcXVpcmVkRXJyb3IpO1xufVxuXG5leHBvcnQgeyBFX0FMUkVBRFlfTE9DS0VELCBFX0NBTkNFTEVELCBFX1RJTUVPVVQsIE11dGV4LCBTZW1hcGhvcmUsIHRyeUFjcXVpcmUsIHdpdGhUaW1lb3V0IH07XG4iLCIvKipcbiAqIEZ1bmN0aW9uIHRvIGluamVjdCBDU1Mgc3R5bGVzIGludG8gdGhlIGRvY3VtZW50LlxuICogT3JpZ2luYWxseSBpbnNwaXJlZCBieSBhIHNvbHV0aW9uIGZvdW5kIG9uIFN0YWNrIE92ZXJmbG93LlxuICogU291cmNlOiBodHRwczovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTUwNTIyNS9pbmplY3QtY3NzLXN0eWxlc2hlZXQtYXMtc3RyaW5nLXVzaW5nLWphdmFzY3JpcHRcbiAqIChNT0RJRklFRClcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFkZFN0eWxlKHN0eWxlU3RyaW5nLCByZXZlcnRUaW1lb3V0PWZhbHNlKSB7XG4gIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgZG9jdW1lbnQuaGVhZC5hcHBlbmQoc3R5bGUpO1xuICBzdHlsZS50ZXh0Q29udGVudCA9IHN0eWxlU3RyaW5nO1xuICBpZiAocmV2ZXJ0VGltZW91dCkgeyBzZXRUaW1lb3V0KCAoKCk9PnN0eWxlLnJlbW92ZSgpKSwgcmV2ZXJ0VGltZW91dCApOyB9XG4gIHJldHVybiBzdHlsZTtcbn07XG5leHBvcnQgZnVuY3Rpb24gc2V0U3ViVGV4dChlbGVtZW50LCB0ZXh0Q29udGVudCwgcmV2ZXJ0VGltZW91dCkge1xuICBlbGVtZW50LnRleHRDb250ZW50ID0gJyc7XG4gIGNvbnN0IHRleHROb2RlID0gZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUodGV4dENvbnRlbnQpO1xuICBlbGVtZW50LmFwcGVuZENoaWxkKHRleHROb2RlKTtcbiAgaWYgKHJldmVydFRpbWVvdXQpIHsgc2V0VGltZW91dCggKCgpPT50ZXh0Tm9kZS5yZW1vdmUoKSksIHJldmVydFRpbWVvdXQgKTsgfVxuICByZXR1cm4gdGV4dE5vZGU7XG59XG4vLyBDdXQ6IEZyb20gU09GXG5cbmV4cG9ydCBmdW5jdGlvbiBzaHVmZmxlQXJyYXkoYXJyYXkpIHtcbiAgZm9yIChsZXQgaSA9IGFycmF5Lmxlbmd0aCAtIDE7IGkgPiAwOyBpLS0pIHtcbiAgICBjb25zdCBqID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGkgKyAxKSk7XG4gICAgW2FycmF5W2ldLCBhcnJheVtqXV0gPSBbYXJyYXlbal0sIGFycmF5W2ldXTtcbiAgfVxuICByZXR1cm4gYXJyYXk7XG59XG5cbiIsImV4cG9ydCBhc3luYyBmdW5jdGlvbiByZXF1ZXN0Rm9yVmFsaWRSZXBsYWNlbWVudHMoLi4uZGF0YSkge1xuICAgIC8vY29uc29sZS5sb2coXCJTZW5kaW5nIHJlcXVlc3RcIiwgZGF0YSk7XG4gICAgY29uc3QgciA9ICBhd2FpdCBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7IGFjdGlvbjogXCJmaW5kVmFsaWRSZXBsYWNlbWVudHNcIiwgZGF0YSB9KTtcbiAgICAvL2NvbnNvbGUubG9nKCdSRVNQT05TRSEnLCByKTtcbiAgICByZXR1cm4gcjtcbn1cbiIsImltcG9ydCB7IGZldGNoU3lub255bXNCYXRjaCB9IGZyb20gJy4vc3lub255bVV0aWxzLmpzJztcbmltcG9ydCB7IE11dGV4LCB3aXRoVGltZW91dCwgRV9USU1FT1VUIH0gZnJvbSAnYXN5bmMtbXV0ZXgnO1xuXG5sZXQgbG9jYWxNdXRleGVzID0gZmFsc2U7XG5leHBvcnQgZnVuY3Rpb24gc2V0TG9jYWxNdXRleGVzKG11dGV4ZXMpIHtcbiAgbG9jYWxNdXRleGVzID0gbXV0ZXhlcztcbn1cbmV4cG9ydCBmdW5jdGlvbiBhY3F1aXJlTG9ja3MobG9ja05hbWVzKSB7XG4gIC8vY29uc29sZS5sb2coJ2FjcXVyaW5nIGxvY2tzJywgbG9ja05hbWVzKTtcbiAgLy9jb25zb2xlLmxvZygnbG9jYWxtJywgbG9jYWxNdXRleGVzKTtcbiAgaWYgKGxvY2FsTXV0ZXhlcykge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGxvY2tOYW1lcy5tYXAobG9ja05hbWUgPT5cbiAgICAgICAgbG9jYWxNdXRleGVzW2xvY2tOYW1lXSA/IGxvY2FsTXV0ZXhlc1tsb2NrTmFtZV0uYWNxdWlyZSgpIDogbG9jYWxNdXRleGVzW2xvY2tOYW1lXSA9IHdpdGhUaW1lb3V0KG5ldyBNdXRleCgpLCAxNjAwMClcbiAgICAgICkpXG4gIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwobG9ja05hbWVzLm1hcChsb2NrTmFtZSA9PiBcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe2FjdGlvbjogJ2xvY2tPcGVyYXRpb24nLCBsb2NrTmFtZTogbG9ja05hbWUsIG9wZXJhdGlvbjogJ2FjcXVpcmUnfSkuY2F0Y2goKGUpPT5jb25zb2xlLmVycm9yKGBFcnJvciBhY3F1aXJpbmcgbG9jazogJHtlfWApKVxuICAgICAgKSk7XG4gIH1cbn1cbmV4cG9ydCBmdW5jdGlvbiByZWxlYXNlTG9ja3MobG9ja05hbWVzKSB7XG4gIC8vY29uc29sZS5sb2coJ3JlbGVhc2luZyBsb2NrcycsIGxvY2tOYW1lcyk7XG4gIGlmIChsb2NhbE11dGV4ZXMpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChsb2NrTmFtZXMubWFwKGFzeW5jIGxvY2tOYW1lID0+XG5cdGxvY2FsTXV0ZXhlc1tsb2NrTmFtZV0ucmVsZWFzZSgpXG4gICAgICApKTtcbiAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChsb2NrTmFtZXMubWFwKGFzeW5jIGxvY2tOYW1lID0+IFxuICAgICAgICBjaHJvbWUucnVudGltZS5zZW5kTWVzc2FnZSh7YWN0aW9uOiAnbG9ja09wZXJhdGlvbicsIGxvY2tOYW1lOiBsb2NrTmFtZSwgb3BlcmF0aW9uOiAncmVsZWFzZSd9KVxuICAgICAgKSk7XG4gIH1cbn1cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiB3aXRoTG9ja2VkKGxvY2tOYW1lcywgZm4pIHtcbiAgY29uc3QgaWQgPSBNYXRoLnJhbmRvbSgpO1xuICBjb25zdCBvbGQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgLy9jb25zb2xlLmxvZyhcImdldHRpbmcgbG9jayBvZlwiLCBsb2NrTmFtZXMsIFwiaWRcIiwgaWQsIFwib2xkXCIsIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgpKTtcbiAgYXdhaXQgYWNxdWlyZUxvY2tzKGxvY2tOYW1lcyk7XG4gIC8vY29uc29sZS5sb2coXCJsb2NrIGdvdFwiLCBsb2NrTmFtZXMsIFwiaWRcIiwgaWQsIFwib2xkXCIsIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgpKTtcbiAgdHJ5IHtcbiAgICAgIGF3YWl0IGZuKCk7XG4gIH1cbiAgZmluYWxseSB7XG4gICAgICBhd2FpdCByZWxlYXNlTG9ja3MobG9ja05hbWVzKTtcbiAgfVxuICAvL2NvbnNvbGUubG9nKFwibG9jayByZWxlYXNlZCwgc3RvcmFnZTpcIiwgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCksIFwiaWRcIiwgaWQsIFwidG9va1wiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKS1vbGQsICdtcycpO1xuICAvL2NvbnNvbGUubG9nKCk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBnZXRTdG9yYWdlRGF0YShrZXlzKSB7IC8vIFRoaXMgZnVuY3Rpb24gd2FpdHMgZm9yIHRoZSBsb2NrIHRvIGJlIHJlbW92ZWRcbiAgaWYgKCEgQXJyYXkuaXNBcnJheShrZXlzKSkga2V5cyA9IFtrZXlzXTtcbiAgaWYgKGtleXMubGVuZ3RoKSB7XG4gICAgYXdhaXQgd2l0aExvY2tlZChrZXlzLCAoKT0+e30pO1xuICB9XG4gIHJldHVybiBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoa2V5cyk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBzZXRTdG9yYWdlRGF0YShkYXRhKSB7XG4gIHJldHVybiBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoZGF0YSk7XG59XG5cbi8vIEFkZCBhY3RpdmF0ZWQgdm9jYWJzIGFuZCB0aGVpciBzeW5vbnltc1xuYXN5bmMgZnVuY3Rpb24gZ2V0QWRkZWRWb2NhYnNUb1N5bnModm9jYWJzVG9TeW5zLCB2b2NhYnNUb0FkZCwgc3lub255bXNCYXRjaFRvQWRkKSB7XG4gIGZvciAobGV0IGlkeCBpbiB2b2NhYnNUb0FkZCkge1xuICAgIHZvY2Fic1RvU3luc1t2b2NhYnNUb0FkZFtpZHhdXSA9IEFycmF5LmZyb20obmV3IFNldChzeW5vbnltc0JhdGNoVG9BZGRbaWR4XSkpO1xuICB9XG4gIHJldHVybiB2b2NhYnNUb1N5bnM7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIGdldEFkZGVkU3luc1RvVm9jYWJzKHN5bnNUb1ZvY2Ficywgdm9jYWJzVG9BZGQsIHN5bm9ueW1zQmF0Y2hUb0FkZCkge1xuICBmb3IgKGxldCBpZHggaW4gc3lub255bXNCYXRjaFRvQWRkKSB7XG4gICAgc3lub255bXNCYXRjaFRvQWRkW2lkeF0uZm9yRWFjaChzeW5vbnltID0+IHtcbiAgICAgIGNvbnNvbGUubG9nKCdzeW5vbnltOicsIHN5bm9ueW0pO1xuICAgICAgY29uc29sZS5sb2coJ3MydjonLCBzeW5zVG9Wb2NhYnNbc3lub255bV0pO1xuICAgICAgY29uc29sZS5sb2coJ3YyczonLCB2b2NhYnNUb0FkZFtpZHhdKTtcbiAgICAgIHN5bnNUb1ZvY2Fic1tzeW5vbnltXSA9IHN5bnNUb1ZvY2Fic1tzeW5vbnltXSA/IEFycmF5LmZyb20obmV3IFNldChbLi4uc3luc1RvVm9jYWJzW3N5bm9ueW1dLCB2b2NhYnNUb0FkZFtpZHhdXSkpIDogW3ZvY2Fic1RvQWRkW2lkeF1dO1xuICAgIH0pO1xuICB9XG4gIHJldHVybiBzeW5zVG9Wb2NhYnM7XG59XG5cbi8vIE1ham9yIEV4cG9ydHNcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBkZWFjdGl2YXRlVm9jYWJzKHZvY2Fic1RvRGVsKSB7XG4gIHZvY2Fic1RvRGVsID0gYXdhaXQgbm9ybWFsaXplV29yZHModm9jYWJzVG9EZWwsIGZhbHNlKTtcbiAgaWYgKCF2b2NhYnNUb0RlbC5sZW5ndGgpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBcbiAgYXdhaXQgd2l0aExvY2tlZChbJ3ZvY2Fic1RvU3lucycsICdzeW5zVG9Wb2NhYnMnLCAnYWN0aXZlVm9jYWJzTGlzdCddLCBhc3luYyAoKSA9PiB7XG4gICAgbGV0IHsgdm9jYWJzVG9TeW5zID0ge30sIHN5bnNUb1ZvY2FicyA9IHt9LCBhY3RpdmVWb2NhYnNMaXN0ID0gW10gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3ZvY2Fic1RvU3lucycsICdzeW5zVG9Wb2NhYnMnLCAnYWN0aXZlVm9jYWJzTGlzdCddKTtcbiAgICBjb25zdCBkZWxTZXQgPSBuZXcgU2V0KHZvY2Fic1RvRGVsKTtcbiAgICBhY3RpdmVWb2NhYnNMaXN0ID0gYWN0aXZlVm9jYWJzTGlzdC5maWx0ZXIodm9jYWIgPT4gIWRlbFNldC5oYXModm9jYWIpKTtcbiAgICBjb25zdCBzeW5vbnltcyA9IHZvY2Fic1RvRGVsLmZsYXRNYXAoKHZvY2FiVG9EZWwpID0+IHZvY2Fic1RvU3luc1t2b2NhYlRvRGVsXSk7XG4gICAgc3lub255bXMuZm9yRWFjaCgoc3lub255bSkgPT4geyBkZWxldGUgc3luc1RvVm9jYWJzW3N5bm9ueW1dOyB9KTtcbiAgICB2b2NhYnNUb0RlbC5mb3JFYWNoKCh2b2NhYlRvRGVsKSA9PiB7IGRlbGV0ZSB2b2NhYnNUb1N5bnNbdm9jYWJUb0RlbF07IH0pO1xuXG4gICAgYXdhaXQgc2V0U3RvcmFnZURhdGEoeyB2b2NhYnNUb1N5bnMsIHN5bnNUb1ZvY2FicywgYWN0aXZlVm9jYWJzTGlzdCB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhY3RpdmF0ZVZvY2Ficyh2b2NhYnNUb0FkZCkge1xuICAvL2NvbnNvbGUubG9nKFwic3RhcnRlZCBub3JtYWxpemluZ1wiKTtcbiAgdm9jYWJzVG9BZGQgPSBhd2FpdCBub3JtYWxpemVXb3Jkcyh2b2NhYnNUb0FkZCwgZmFsc2UpO1xuICBpZiAoIXZvY2Fic1RvQWRkLmxlbmd0aCkge1xuICAgIHJldHVybiAwO1xuICB9XG5cbiAgLy9jb25zb2xlLmxvZyhcInN0YXJ0ZWQgd2FpdGluZyB3aGVuIGFjdGl2YXRpbmcgdm9jYWJzIVwiKTtcbiAgbGV0IHsgdm9jYWJzVG9TeW5zID0ge30sIHN5bnNUb1ZvY2FicyA9IHt9LCBhY3RpdmVWb2NhYnNMaXN0ID0gW10gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3ZvY2Fic1RvU3lucycsICdzeW5zVG9Wb2NhYnMnLCAnYWN0aXZlVm9jYWJzTGlzdCddKTtcbiAgbGV0IHN5bm9ueW1zQmF0Y2hUb0FkZCA9IFtdO1xuICBzeW5vbnltc0JhdGNoVG9BZGQgPSBhd2FpdCBmZXRjaFN5bm9ueW1zQmF0Y2godm9jYWJzVG9BZGQpO1xuXG4gIGxldCByZXR1cm5WYWx1ZSA9IDA7XG4gIGF3YWl0IHdpdGhMb2NrZWQoWyd2b2NhYnNUb1N5bnMnLCAnc3luc1RvVm9jYWJzJywgJ2FjdGl2ZVZvY2Fic0xpc3QnXSwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnNvbGUubG9nKFwidm9jYWJzVG9BZGRcIiwgdm9jYWJzVG9BZGQpO1xuICAgIFt2b2NhYnNUb1N5bnMsIHN5bnNUb1ZvY2Fic10gPSBhd2FpdCBQcm9taXNlLmFsbChbXG4gICAgICBnZXRBZGRlZFZvY2Fic1RvU3lucyh2b2NhYnNUb1N5bnMsIHZvY2Fic1RvQWRkLCBzeW5vbnltc0JhdGNoVG9BZGQpLFxuICAgICAgZ2V0QWRkZWRTeW5zVG9Wb2NhYnMoc3luc1RvVm9jYWJzLCB2b2NhYnNUb0FkZCwgc3lub255bXNCYXRjaFRvQWRkKVxuICAgIF0pO1xuICAgIGFjdGl2ZVZvY2Fic0xpc3QgPSBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLmFjdGl2ZVZvY2Fic0xpc3QsIC4uLnZvY2Fic1RvQWRkXSkpO1xuXG4gICAgYXdhaXQgc2V0U3RvcmFnZURhdGEoeyB2b2NhYnNUb1N5bnMsIHN5bnNUb1ZvY2FicywgYWN0aXZlVm9jYWJzTGlzdCB9KTtcbiAgICByZXR1cm5WYWx1ZSA9IHZvY2Fic1RvQWRkLmxlbmd0aDtcbiAgfSk7XG4gIHJldHVybiByZXR1cm5WYWx1ZTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFjdGl2YXRlSW5hY3RpdmVWb2NhYnMobGlzdE5hbWUsIGxvYWRBbW91bnQsIHNlbGVjdGlvblR5cGUpIHtcbiAgbGV0IHNwbGljZWRWb2NhYnMgPSBbXTtcbiAgYXdhaXQgd2l0aExvY2tlZChbJ2luYWN0aXZlVm9jYWJzTGlzdHMnXSwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCB7IGluYWN0aXZlVm9jYWJzTGlzdHMgPSB7fSB9ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdpbmFjdGl2ZVZvY2Fic0xpc3RzJyk7XG4gICAgbGV0IGluYWN0aXZlVm9jYWJzTGlzdCA9IGluYWN0aXZlVm9jYWJzTGlzdHNbbGlzdE5hbWVdIHx8IFtdO1xuICAgIGlmIChzZWxlY3Rpb25UeXBlPT09J3JhbmRvbScpIHtcbiAgICAgIHdoaWxlIChzcGxpY2VkVm9jYWJzLmxlbmd0aCA8IGxvYWRBbW91bnQgJiYgaW5hY3RpdmVWb2NhYnNMaXN0Lmxlbmd0aCA+IDApIHtcbiAgICAgICAgY29uc3QgcmFuZG9tSWR4ID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogaW5hY3RpdmVWb2NhYnNMaXN0Lmxlbmd0aCk7XG4gICAgICAgIHNwbGljZWRWb2NhYnMucHVzaChpbmFjdGl2ZVZvY2Fic0xpc3Quc3BsaWNlKHJhbmRvbUlkeCwgMSlbMF0pO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoc2VsZWN0aW9uVHlwZT09PSdvcmRlcmVkJykge1xuICAgICAgc3BsaWNlZFZvY2FicyA9IGluYWN0aXZlVm9jYWJzTGlzdC5zcGxpY2UoMCwgbG9hZEFtb3VudCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIFtzcGxpY2VkVm9jYWJzLCBpbmFjdGl2ZVZvY2Fic0xpc3RdID0gW2luYWN0aXZlVm9jYWJzTGlzdCwgW11dO1xuICAgIH1cbiAgICBpbmFjdGl2ZVZvY2Fic0xpc3RzW2xpc3ROYW1lXSA9IGluYWN0aXZlVm9jYWJzTGlzdDtcbiAgICBhd2FpdCBzZXRTdG9yYWdlRGF0YSh7IGluYWN0aXZlVm9jYWJzTGlzdHMgfSk7XG4gIH0pO1xuXG4gIGNvbnN0IHJldHVyblZhbHVlID0gYXdhaXQgYWN0aXZhdGVWb2NhYnMoc3BsaWNlZFZvY2Ficyk7XG4gIHJldHVybiByZXR1cm5WYWx1ZTsgLy8gcmV0dXJuIHRoZSBudW1iZXIgb2YgbG9hZGVkIHZvY2Fic1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWRkSW5hY3RpdmVWb2NhYnMobGlzdE5hbWUsIHZvY2Fic1RvQWRkKSB7XG4gIHZvY2Fic1RvQWRkID0gYXdhaXQgbm9ybWFsaXplV29yZHModm9jYWJzVG9BZGQsIGZhbHNlKTtcbiAgaWYgKCF2b2NhYnNUb0FkZC5sZW5ndGgpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuICBhd2FpdCB3aXRoTG9ja2VkKFsnaW5hY3RpdmVWb2NhYnNMaXN0cyddLCBhc3luYyAoKSA9PiB7XG4gICAgY29uc3QgeyBpbmFjdGl2ZVZvY2Fic0xpc3RzID0ge30gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnaW5hY3RpdmVWb2NhYnNMaXN0cycpO1xuICAgIGlmICghaW5hY3RpdmVWb2NhYnNMaXN0c1tsaXN0TmFtZV0pIHtcbiAgICAgIGluYWN0aXZlVm9jYWJzTGlzdHNbbGlzdE5hbWVdID0gW107XG4gICAgfVxuICAgIGluYWN0aXZlVm9jYWJzTGlzdHNbbGlzdE5hbWVdID0gWy4uLm5ldyBTZXQoWy4uLmluYWN0aXZlVm9jYWJzTGlzdHNbbGlzdE5hbWVdLCAuLi52b2NhYnNUb0FkZF0pXTtcbiAgICBhd2FpdCBzZXRTdG9yYWdlRGF0YSh7ICdpbmFjdGl2ZVZvY2Fic0xpc3RzJzogaW5hY3RpdmVWb2NhYnNMaXN0cyB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVJbmFjdGl2ZVZvY2Fic0xpc3QobGlzdE5hbWVzKSB7XG4gIHdpdGhMb2NrZWQoWydpbmFjdGl2ZVZvY2Fic0xpc3RzJ10sIGFzeW5jICgpID0+IHtcbiAgICAgIGxldCB7IGluYWN0aXZlVm9jYWJzTGlzdHMgPSB7fSB9ID0gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdpbmFjdGl2ZVZvY2Fic0xpc3RzJyk7XG4gICAgICBsaXN0TmFtZXMuZm9yRWFjaChsaXN0TmFtZSA9PiBkZWxldGUgaW5hY3RpdmVWb2NhYnNMaXN0c1tsaXN0TmFtZV0pO1xuICAgICAgYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgaW5hY3RpdmVWb2NhYnNMaXN0cyB9KTtcbiAgfSlcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlbW92ZUFsbEluYWN0aXZlVm9jYWJzTGlzdHMoKSB7XG4gIHdpdGhMb2NrZWQoWydpbmFjdGl2ZVZvY2Fic0xpc3RzJ10sICgpID0+IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IGluYWN0aXZlVm9jYWJzTGlzdHM6IHt9IH0pKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNsZWFyQWN0aXZlVm9jYWJzTGlzdCgpIHtcbiAgd2l0aExvY2tlZChbJ2FjdGl2ZVZvY2Fic0xpc3QnXSwgKCkgPT4gY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KHsgYWN0aXZlVm9jYWJzTGlzdDogW10sIHZvY2Fic1RvU3luczoge30sIHN5bnNUb1ZvY2Ficzoge30gfSkpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gdXBkYXRlVm9jYWJTeW5vbnltcyh2b2NhYiwgdXBkYXRlZFN5bm9ueW1zKSB7XG4gICAgdXBkYXRlZFN5bm9ueW1zID0gYXdhaXQgbm9ybWFsaXplV29yZHModXBkYXRlZFN5bm9ueW1zLCBmYWxzZSk7XG4gICAgYXdhaXQgd2l0aExvY2tlZChbJ3ZvY2Fic1RvU3lucycsICdzeW5zVG9Wb2NhYnMnXSwgYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgeyB2b2NhYnNUb1N5bnMgPSB7fSwgc3luc1RvVm9jYWJzID0ge30gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ3ZvY2Fic1RvU3lucycsICdzeW5zVG9Wb2NhYnMnXSk7XG5cblxuICAgICAgICBjb25zdCBvbGRTeW5vbnltcyA9IHZvY2Fic1RvU3luc1t2b2NhYl0gfHwgW107XG4gICAgICAgIGNvbnN0IHVwZGF0ZWRTeW5vbnltc1NldCA9IG5ldyBTZXQodXBkYXRlZFN5bm9ueW1zKTtcbiAgICAgICAgY29uc3Qgb2xkU3lub255bXNTZXQgPSBuZXcgU2V0KG9sZFN5bm9ueW1zKTtcbiAgICAgICAgY29uc3Qgc3lub255bXNUb0RlbGV0ZSA9IG9sZFN5bm9ueW1zLmZpbHRlcihzeW4gPT4gIXVwZGF0ZWRTeW5vbnltc1NldC5oYXMoc3luKSk7XG4gICAgICAgIGNvbnN0IHN5bm9ueW1zVG9BZGQgPSB1cGRhdGVkU3lub255bXMuZmlsdGVyKHN5biA9PiAhb2xkU3lub255bXNTZXQuaGFzKHN5bikpO1xuXG4gICAgICAgIGZvciAoY29uc3Qgc3luIG9mIHN5bm9ueW1zVG9EZWxldGUpIHtcbiAgICAgICAgICAgIGlmIChzeW5zVG9Wb2NhYnNbc3luXSkge1xuICAgICAgICAgICAgICAgIHN5bnNUb1ZvY2Fic1tzeW5dID0gc3luc1RvVm9jYWJzW3N5bl0uZmlsdGVyKHYgPT4gdiAhPT0gdm9jYWIpO1xuICAgICAgICAgICAgICAgIGlmIChzeW5zVG9Wb2NhYnNbc3luXS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgZGVsZXRlIHN5bnNUb1ZvY2Fic1tzeW5dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoY29uc3Qgc3luIG9mIHN5bm9ueW1zVG9BZGQpIHtcbiAgICAgICAgICAgIGlmICghc3luc1RvVm9jYWJzW3N5bl0pIHtcbiAgICAgICAgICAgICAgICBzeW5zVG9Wb2NhYnNbc3luXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc3luc1RvVm9jYWJzW3N5bl0ucHVzaCh2b2NhYik7XG4gICAgICAgIH1cblxuICAgICAgICB2b2NhYnNUb1N5bnNbdm9jYWJdID0gQXJyYXkuZnJvbShuZXcgU2V0KHVwZGF0ZWRTeW5vbnltcykpO1xuXG5cdGNvbnNvbGUubG9nKCdhZGRlZCcsIHtzeW5zVG9Wb2NhYnN9KTtcbiAgICAgICAgYXdhaXQgc2V0U3RvcmFnZURhdGEoeyB2b2NhYnNUb1N5bnMsIHN5bnNUb1ZvY2FicyB9KTtcbiAgICB9KTtcbn1cblxuYXN5bmMgZnVuY3Rpb24gbm9ybWFsaXplV29yZHMod29yZHMsIGNoZWNrQWRkZWRBbHJlYWR5PWZhbHNlLCBjaGVja0xvY2s9ZmFsc2UpIHtcbiAgd29yZHMgPSB3b3Jkcy5tYXAod29yZCA9PiB3b3JkLnRyaW0oKS50b0xvd2VyQ2FzZSgpKTtcbiAgd29yZHMgPSB3b3Jkcy5maWx0ZXIod29yZCA9PiB3b3JkICYmIHdvcmQgIT09ICcnKTtcbiAgaWYgKGNoZWNrQWRkZWRBbHJlYWR5KSB7XG4gICAgY29uc3Qge2FjdGl2ZVZvY2Fic0xpc3Q9W119ID0gYXdhaXQgKGNoZWNrTG9jayA/IGdldFN0b3JhZ2VEYXRhKCdhY3RpdmVWb2NhYnNMaXN0JykgOiBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ2FjdGl2ZVZvY2Fic0xpc3QnKSk7XG4gICAgY29uc3QgZXhpc3RpbmdWb2NhYnNTZXQgPSBuZXcgU2V0KGFjdGl2ZVZvY2Fic0xpc3QpO1xuICAgIHdvcmRzID0gd29yZHMuZmlsdGVyKHdvcmQgPT4gIWV4aXN0aW5nVm9jYWJzU2V0Lmhhcyh3b3JkKSk7XG4gIH1cbiAgd29yZHMgPSBBcnJheS5mcm9tKG5ldyBTZXQod29yZHMpKTtcbiAgcmV0dXJuIHdvcmRzO1xufVxuXG4iLCIvL2NvbnN0IHN5bm9ueW1zID0gcmVxdWlyZSgnc3lub255bXMnKTtcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoU3lub255bXMod29yZCkge1xuICAgIGNvbnN0IGlkID0gTWF0aC5yYW5kb20oKTtcbiAgICBjb25zdCBvbGQgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKTtcbiAgICAvL2NvbnNvbGUubG9nKFwiXFx0ZmV0Y2hpbmcgZm9yIHdvcmRcIiwgd29yZCwgXCJpZFwiLCBpZCk7XG4gICAgY29uc3QgcmVzcG9uc2UgPSBhd2FpdCBmZXRjaChgaHR0cDovL2FwaS5kYXRhbXVzZS5jb20vd29yZHM/cmVsX3N5bj0ke3dvcmR9YCk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0ZhaWxlZCB0byBmZXRjaCBzeW5vbnltcycpO1xuICAgIH1cbiAgICBjb25zdCBkYXRhID0gYXdhaXQgcmVzcG9uc2UuanNvbigpO1xuICAgIC8vY29uc29sZS5sb2coXCJcXHRmZXRjaGVkXCIsIGRhdGEsIFwiaWRcIiwgaWQsIFwidG9va1wiLCBuZXcgRGF0ZSgpLmdldFRpbWUoKS1vbGQpO1xuICAgIHJldHVybiBkYXRhLm1hcChlbnRyeSA9PiBlbnRyeS53b3JkKTtcbn1cbi8qXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hTeW5vbnltcyh3b3JkKSB7XG4gICAgcmV0dXJuIHN5bm9ueW1zKHdvcmQpLmZpbHRlcihzeW5vbnltID0+IHN5bm9ueW0hPT13b3JkKTtcbn1cbiovXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFN5bm9ueW1zQmF0Y2god29yZHMpIHtcbiAgICBjb25zdCBzeW5vbnltc1Byb21pc2VzID0gd29yZHMubWFwKHdvcmQgPT4gZmV0Y2hTeW5vbnltcyh3b3JkKSk7XG4gICAgcmV0dXJuIGF3YWl0IFByb21pc2UuYWxsKHN5bm9ueW1zUHJvbWlzZXMpO1xufVxuXG5cbiIsIi8vIFRoZSBtb2R1bGUgY2FjaGVcbnZhciBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX18gPSB7fTtcblxuLy8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbmZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG5cdHZhciBjYWNoZWRNb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdO1xuXHRpZiAoY2FjaGVkTW9kdWxlICE9PSB1bmRlZmluZWQpIHtcblx0XHRyZXR1cm4gY2FjaGVkTW9kdWxlLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0obW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9ucyBmb3IgaGFybW9ueSBleHBvcnRzXG5fX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSAoZXhwb3J0cywgZGVmaW5pdGlvbikgPT4ge1xuXHRmb3IodmFyIGtleSBpbiBkZWZpbml0aW9uKSB7XG5cdFx0aWYoX193ZWJwYWNrX3JlcXVpcmVfXy5vKGRlZmluaXRpb24sIGtleSkgJiYgIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBrZXkpKSB7XG5cdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywga2V5LCB7IGVudW1lcmFibGU6IHRydWUsIGdldDogZGVmaW5pdGlvbltrZXldIH0pO1xuXHRcdH1cblx0fVxufTsiLCJfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSAob2JqLCBwcm9wKSA9PiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwgcHJvcCkpIiwiLy8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5yID0gKGV4cG9ydHMpID0+IHtcblx0aWYodHlwZW9mIFN5bWJvbCAhPT0gJ3VuZGVmaW5lZCcgJiYgU3ltYm9sLnRvU3RyaW5nVGFnKSB7XG5cdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFN5bWJvbC50b1N0cmluZ1RhZywgeyB2YWx1ZTogJ01vZHVsZScgfSk7XG5cdH1cblx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsICdfX2VzTW9kdWxlJywgeyB2YWx1ZTogdHJ1ZSB9KTtcbn07IiwiLy8gc3JjL2NvbnRlbnQuanNcblxuaW1wb3J0IHsgc2V0U3RvcmFnZURhdGEsIGFjdGl2YXRlVm9jYWJzIH0gZnJvbSAnLi91dGlscy9zdG9yYWdlVXRpbHMuanMnO1xuaW1wb3J0IHsgcmVxdWVzdEZvclZhbGlkUmVwbGFjZW1lbnRzIH0gZnJvbSAnLi91dGlscy9tb2RlbFV0aWxzLmpzJztcbmltcG9ydCB7IHNodWZmbGVBcnJheSwgYWRkU3R5bGUgfSBmcm9tICcuL3V0aWxzL2NvbW1vblV0aWxzLmpzJztcblxuXG5jb25zdCByZWFkYWJsZUVsZW1lbnRMaXN0ID0gW1xuICAgIFwiUFwiLCBcIkgxXCIsIFwiSDJcIiwgXCJIM1wiLCBcIkg0XCIsIFwiSDVcIiwgXCJINlwiLCBcIkxJXCIsIFxuICAgIFwiVERcIixcbiAgICBcIkRUXCIsIFwiRERcIiwgXCJTVU1NQVJZXCIsIFwiRklHQ0FQVElPTlwiLCBcbiAgICBcIkxFR0VORFwiLCBcIkxBQkVMXCJcbl07XG5jb25zdCByZWFkYWJsZUVsZW1lbnRTZXQgPSBuZXcgU2V0KHJlYWRhYmxlRWxlbWVudExpc3QpO1xuZnVuY3Rpb24gaXNSZWFkYWJsZUVsZW1lbnQoZWxlbWVudCkge1xuICAgIHJldHVybiByZWFkYWJsZUVsZW1lbnRTZXQuaGFzKGVsZW1lbnQubm9kZU5hbWUpO1xufVxubGV0IG9yaWdpbmFsQ29udGVudHMgPSBuZXcgTWFwKCk7IC8vIFRvIHN0b3JlIG9yaWdpbmFsIGNvbnRlbnRzIG9mIGVsZW1lbnRzXG5cbmFzeW5jIGZ1bmN0aW9uIHJlcGxhY2VTZWxlY3RlZChsYW5nPSdlbicpIHtcblxuXG4gICAgY29uc3Qgc2VsZWN0aW9uID0gd2luZG93LmdldFNlbGVjdGlvbigpO1xuICAgIGlmICghc2VsZWN0aW9uLnJhbmdlQ291bnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IHsgdG9waz0yNDAsIGNhcmU9dHJ1ZSwgc3luc1RvVm9jYWJzPXt9IH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd0b3BrJywgJ2NhcmUnLCAnc3luc1RvVm9jYWJzJ10pO1xuICAgIFxuICAgIGNvbnN0IHJhbmdlID0gc2VsZWN0aW9uLmdldFJhbmdlQXQoMCk7XG4gICAgY29uc3QgY29tbW9uQW5jZXN0b3IgPSByYW5nZS5jb21tb25BbmNlc3RvckNvbnRhaW5lcjtcbiAgICBpZiAoY29tbW9uQW5jZXN0b3Iubm9kZVR5cGUgPT09IE5vZGUuVEVYVF9OT0RFICYmIGlzUmVhZGFibGVFbGVtZW50KGNvbW1vbkFuY2VzdG9yLnBhcmVudEVsZW1lbnQpKSB7XG4gICAgICAgIHJlcGxhY2VXaXRoVm9jYWJzKGNvbW1vbkFuY2VzdG9yLnBhcmVudEVsZW1lbnQsIHN5bnNUb1ZvY2FicywgdG9waywgY2FyZSwgbGFuZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKGNvbW1vbkFuY2VzdG9yLm5vZGVUeXBlID09PSBOb2RlLkVMRU1FTlRfTk9ERSAmJiBpc1JlYWRhYmxlRWxlbWVudChjb21tb25BbmNlc3RvcikpIHtcbiAgICAgICAgcmVwbGFjZVdpdGhWb2NhYnMoY29tbW9uQW5jZXN0b3IsIHN5bnNUb1ZvY2FicywgdG9waywgY2FyZSwgbGFuZyk7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBjb25zdCB0cmVlV2Fsa2VyID0gZG9jdW1lbnQuY3JlYXRlVHJlZVdhbGtlcihcbiAgICAgICAgY29tbW9uQW5jZXN0b3IsXG4gICAgICAgIE5vZGVGaWx0ZXIuU0hPV19FTEVNRU5ULFxuICAgICAgICB7XG4gICAgICAgICAgICBhY2NlcHROb2RlKG5vZGUpIHtcbiAgICAgICAgICAgICAgICBpZiAocmFuZ2UuaW50ZXJzZWN0c05vZGUobm9kZSkgJiYgaXNSZWFkYWJsZUVsZW1lbnQobm9kZSkpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX0FDQ0VQVDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIE5vZGVGaWx0ZXIuRklMVEVSX1JFSkVDVDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZmFsc2VcbiAgICApO1xuXG4gICAgbGV0IHAgPSBbXTtcbiAgICB3aGlsZSAodHJlZVdhbGtlci5uZXh0Tm9kZSgpKSB7XG4gICAgICAgIHAucHVzaChyZXBsYWNlV2l0aFZvY2Ficyh0cmVlV2Fsa2VyLmN1cnJlbnROb2RlLCBzeW5zVG9Wb2NhYnMsIHRvcGssIGNhcmUsIGxhbmcpKTtcbiAgICB9XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocCk7XG4gICAgLy9jb25zb2xlLmxvZyhcIkFsbCB3YWxrZWRcIik7XG59XG5cbmZ1bmN0aW9uIGdldERpcmVjdFRleHRQb3NpdGlvbnMoZWxlbWVudCkge1xuICAgIGNvbnN0IHRleHRDb250ZW50ID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgICBsZXQgY2hpbGROb2RlcyA9IGVsZW1lbnQuY2hpbGROb2RlcztcbiAgICBsZXQgcG9zaXRpb25zID0gW107XG4gICAgbGV0IGN1cnJlbnRJbmRleCA9IDA7XG4gICAgXG4gICAgZm9yIChsZXQgbm9kZSBvZiBjaGlsZE5vZGVzKSB7XG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09PSBOb2RlLlRFWFRfTk9ERSkge1xuICAgICAgICAgICAgbGV0IGxlbmd0aCA9IG5vZGUudGV4dENvbnRlbnQubGVuZ3RoO1xuICAgICAgICAgICAgcG9zaXRpb25zLnB1c2goeyBzdGFydFBvczogY3VycmVudEluZGV4LCBlbmRQb3M6IGN1cnJlbnRJbmRleCArIGxlbmd0aCAtIDEgfSk7XG4gICAgICAgICAgICBjdXJyZW50SW5kZXggKz0gbGVuZ3RoO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudEluZGV4ICs9IG5vZGUudGV4dENvbnRlbnQubGVuZ3RoO1xuICAgICAgICB9XG4gICAgfVxuICAgIFxuICAgIHJldHVybiBwb3NpdGlvbnM7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VEaXJlY3RUZXh0KGVsZW1lbnQsIGRpcmVjdFRleHRSZXBsYWNlbWVudEZyYWdtZW50cykge1xuICAgIGxldCBjaGlsZE5vZGVzID0gQXJyYXkuZnJvbShlbGVtZW50LmNoaWxkTm9kZXMpO1xuICAgIGxldCB0ZXh0SW5kZXggPSAwO1xuICAgIFxuICAgIGZvciAobGV0IG5vZGUgb2YgY2hpbGROb2Rlcykge1xuICAgICAgICBpZiAobm9kZS5ub2RlVHlwZSA9PT0gTm9kZS5URVhUX05PREUpIHtcbiAgICAgICAgICAgIGlmICh0ZXh0SW5kZXggPCBkaXJlY3RUZXh0UmVwbGFjZW1lbnRGcmFnbWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgZWxlbWVudC5yZXBsYWNlQ2hpbGQoZGlyZWN0VGV4dFJlcGxhY2VtZW50RnJhZ21lbnRzW3RleHRJbmRleCsrXSwgbm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcGxhY2VXb3Jkc0F1dG9tYXRpY2FsbHkoYW5jZXN0b3IsIGxhbmc9J2VuJywgaGlnaGxpZ2h0PXRydWUpIHtcbiAgICBjb25zdCByZWFkYWJsZUVsZW1lbnRzID0gQXJyYXkuZnJvbShhbmNlc3Rvci5xdWVyeVNlbGVjdG9yQWxsKHJlYWRhYmxlRWxlbWVudExpc3QpKTtcbiAgICBjb25zdCB7IHRvcGs9MjQwIH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ3RvcGsnKTtcbiAgICBjb25zdCB7IHN5bnNUb1ZvY2FicyA9IHt9IH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ3N5bnNUb1ZvY2FicycpO1xuICAgIGNvbnN0IHsgY2FyZSA9IHRydWUgfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnY2FyZScpO1xuICAgIGlmIChoaWdobGlnaHQpIGFkZFN0eWxlKCcuUmV2b2NhYklOU3sgYmFja2dyb3VuZC1jb2xvcjogeWVsbG93IH0nLyosIDYwMDAqLyk7XG4gICAgYXdhaXQgUHJvbWlzZS5hbGwocmVhZGFibGVFbGVtZW50cy5tYXAoZWxlbWVudCA9PiByZXBsYWNlV2l0aFZvY2FicyhlbGVtZW50LCBzeW5zVG9Wb2NhYnMsIHRvcGssIGNhcmUsIGxhbmcpKSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIHJlcGxhY2VXaXRoVm9jYWJzKGVsZW1lbnQsIHN5bnNUb1ZvY2FicywgdG9waz0yNDAsIGNhcmUsIGxhbmc9J2VuJykge1xuICAgIHRyeSB7XG4gICAgXHQvL2NvbnNvbGUubG9nKFwiUkVQTEFDSU5HXCIsIGVsZW1lbnQpO1xuXG4gICAgXHRjb25zdCB0ZXh0ID0gZWxlbWVudC50ZXh0Q29udGVudDtcbiAgICBcdGNvbnN0IGRpcmVjdFRleHRQb3NpdGlvbnMgPSBnZXREaXJlY3RUZXh0UG9zaXRpb25zKGVsZW1lbnQpO1xuICAgIFx0aWYgKGRpcmVjdFRleHRQb3NpdGlvbnMubGVuZ3RoPT09MCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgXHRjb25zdCB0ZXh0MnNlbnRlbmNlciA9IG5ldyBJbnRsLlNlZ21lbnRlcihsYW5nLCB7IGdyYW51bGFyaXR5OiAnc2VudGVuY2UnIH0pO1xuICAgIFx0Y29uc3Qgc2VudGVuY2Uyd29yZGVyID0gbmV3IEludGwuU2VnbWVudGVyKGxhbmcsIHsgZ3JhbnVsYXJpdHk6ICd3b3JkJyB9KTtcbiAgICBcdGNvbnN0IHNlZ21lbnRlciA9IChtb2RlbCwgdGV4dCkgPT4gQXJyYXkuZnJvbShtb2RlbC5zZWdtZW50KHRleHQpKS5tYXAociA9PiByLnNlZ21lbnQpO1xuXG4gICAgXHRsZXQgc2VudGVuY2VzID0gc2VnbWVudGVyKHRleHQyc2VudGVuY2VyLCB0ZXh0KTtcbiAgICBcdGxldCByZXBsYWNlZCA9IGZhbHNlO1xuICAgIFx0XG4gICAgXHRsZXQgZGlyZWN0VGV4dFJlcGxhY2VtZW50RnJhZ21lbnRzID0gW2RvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKV07XG4gICAgXHRsZXQgd29yZFBvcyA9IHtlbmRQb3M6IC0xfTtcbnNlbnRlbmNlc0l0ZXJhdGlvbjpcbiAgICBcdGZvciAobGV0IHNlbnRlbmNlIG9mIHNlbnRlbmNlcykge1xuICAgIFx0ICAgIGxldCB3b3JkcyA9IHNlZ21lbnRlcihzZW50ZW5jZTJ3b3JkZXIsIHNlbnRlbmNlKTtcbndvcmRzSXRlcmF0aW9uOlxuICAgIFx0ICAgIGZvciAobGV0IGkgPSAwOyBpIDwgd29yZHMubGVuZ3RoOyBpKyspIHtcbiAgICBcdCAgICAgICAgY29uc3Qgd29yZCA9IHdvcmRzW2ldO1xuICAgIFx0ICAgICAgICBpZiAoISB3b3JkLmxlbmd0aCkgY29udGludWU7XG4gICAgXHQgICAgICAgIFsgd29yZFBvcy5zdGFydFBvcywgd29yZFBvcy5lbmRQb3MgXSA9IFsgd29yZFBvcy5lbmRQb3MrMSwgd29yZFBvcy5lbmRQb3Mrd29yZC5sZW5ndGggXTtcbiAgICBcdCAgICAgICAgd2hpbGUgKGRpcmVjdFRleHRQb3NpdGlvbnNbMF0uZW5kUG9zIDwgd29yZFBvcy5zdGFydFBvcykge1xuICAgIFx0ICAgICAgICAgICAgZGlyZWN0VGV4dFBvc2l0aW9ucy5zaGlmdCgpO1xuICAgIFx0ICAgICAgICAgICAgZGlyZWN0VGV4dFJlcGxhY2VtZW50RnJhZ21lbnRzLnB1c2goZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpKTtcbiAgICBcdCAgICAgICAgICAgIGlmICghIGRpcmVjdFRleHRQb3NpdGlvbnMubGVuZ3RoKSBicmVhayBzZW50ZW5jZXNJdGVyYXRpb247XG4gICAgXHQgICAgICAgIH1cbiAgICBcdCAgICAgICAgaWYgKCEgKGRpcmVjdFRleHRQb3NpdGlvbnNbMF0uc3RhcnRQb3MgPD0gd29yZFBvcy5zdGFydFBvcyAmJiB3b3JkUG9zLmVuZFBvcyA8PSBkaXJlY3RUZXh0UG9zaXRpb25zWzBdLmVuZFBvcykpIHtcbiAgICBcdCAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgIFx0ICAgICAgICB9IFxuICAgIFx0ICAgICAgICBpZiAoISAoL1tcXFdfXS8udGVzdCh3b3JkKSkpIHtcbiAgICBcdCAgICAgICAgICAgIGNvbnN0IHRhcmdldHMgPSBzeW5zVG9Wb2NhYnNbd29yZC50b0xvd2VyQ2FzZSgpXTtcbiAgICBcdCAgICAgICAgICAgIGlmICh0YXJnZXRzKSB7XG4gICAgXHQgICAgXHRcdC8vY29uc29sZS5sb2coYFRhcmdldHMgZm9yICR7d29yZH0gYXJlYCwgdGFyZ2V0cyk7XG4gICAgXHQgICAgICAgICAgICAgICAgY29uc3Qgc2h1ZmZsZWRUYXJnZXRzID0gc2h1ZmZsZUFycmF5KHRhcmdldHMpO1xuICAgIFx0ICAgIFx0ICAgIFx0bGV0IHZhbGlkUmVwbGFjZW1lbnRzID0gW3NodWZmbGVkVGFyZ2V0c1swXV07XG5cdFx0ICAgICAgXHRsZXQgc2NvcmVzID0gWydSZWNrbGVzcyByZXBsYWNlbWVudCBoZXJlLiddO1xuICAgIFx0ICAgIFx0ICAgIFx0aWYgKGNhcmUpIHtcbiAgICBcdCAgICAgICAgICAgIFx0ICAgIFt2YWxpZFJlcGxhY2VtZW50cywgc2NvcmVzXSA9IGF3YWl0IHJlcXVlc3RGb3JWYWxpZFJlcGxhY2VtZW50cyh3b3JkcywgaSwgc2h1ZmZsZWRUYXJnZXRzKTtcblx0XHRcdCAgICAvL2NvbnNvbGUubG9nKFt2YWxpZFJlcGxhY2VtZW50cywgc2NvcmVzXSk7XG4gICAgXHQgICAgXHQgICAgXHQgICAgLy9jb25zb2xlLmxvZygnRm9yJywgW3dvcmRzLCB3b3Jkc1tpXSwgc2h1ZmZsZWRUYXJnZXRzXSk7XG4gICAgXHQgICAgICAgICAgICBcdCAgICAvL2NvbnNvbGUubG9nKCdWYWxpZHM6Jyx2YWxpZFJlcGxhY2VtZW50cyk7XG4gICAgXHQgICAgXHQgICAgXHR9XG4gICAgXHQgICAgICAgICAgICBcdCAgICAgICAgXG4gICAgXHQgICAgICAgICAgICBcdGZvciAobGV0IHJpZHg9MDsgcmlkeDx2YWxpZFJlcGxhY2VtZW50cy5sZW5ndGg7IHJpZHgrKykge1xuXHRcdFx0ICAgIGNvbnN0IHRhcmdldCA9IHZhbGlkUmVwbGFjZW1lbnRzW3JpZHhdO1xuXHRcdFx0ICAgIGNvbnN0IHNjb3JlID0gc2NvcmVzW3JpZHhdO1xuICAgIFx0ICAgICAgICAgICAgXHQgICAgd29yZHNbaV0gPSBtYXRjaENhc2Uod29yZCwgdGFyZ2V0KTtcbiAgICBcdCAgICAgICAgICAgIFx0ICAgIGlmICghcmVwbGFjZWQgJiYgIW9yaWdpbmFsQ29udGVudHMuaGFzKGVsZW1lbnQpKSB7XG4gICAgXHQgICAgICAgICAgICBcdCAgICAgICAgb3JpZ2luYWxDb250ZW50cy5zZXQoZWxlbWVudCwgZWxlbWVudC5pbm5lckhUTUwpOyBcbiAgICBcdCAgICAgICAgICAgIFx0ICAgIH1cbiAgICBcdCAgICAgICAgICAgIFx0ICAgIHJlcGxhY2VkID0gdHJ1ZTtcbiAgICBcdCAgICBcdCAgICBcdCAgICBjb25zdCBpbnNFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImluc1wiKTtcbiAgICBcdCAgICBcdCAgICBcdCAgICBpbnNFbGVtZW50LnRleHRDb250ZW50ID0gd29yZHNbaV07XG4gICAgXHQgICAgXHQgICAgXHQgICAgaW5zRWxlbWVudC50aXRsZSA9IGBPcmlnaW5hbGx5OiAnJHt3b3JkfScsICBSZWFzb25hYmlsaXR5IFNjb3JlOiAnJHtzY29yZX0nYDtcbiAgICBcdCAgICBcdCAgICBcdCAgICBpbnNFbGVtZW50LmNsYXNzTGlzdC5hZGQoJ1Jldm9jYWJJTlMnKTtcbiAgICBcdCAgICAgICAgICAgIFx0ICAgIGRpcmVjdFRleHRSZXBsYWNlbWVudEZyYWdtZW50c1tkaXJlY3RUZXh0UmVwbGFjZW1lbnRGcmFnbWVudHMubGVuZ3RoLTFdLmFwcGVuZENoaWxkKGluc0VsZW1lbnQpO1xuICAgIFx0ICAgICAgICAgICAgXHQgICAgY29udGludWUgd29yZHNJdGVyYXRpb247XG4gICAgXHQgICAgICAgICAgICBcdH1cbiAgICBcdCAgICAgICAgICAgIH1cbiAgICBcdCAgICAgICAgfVxuICAgIFx0ICAgICAgICBkaXJlY3RUZXh0UmVwbGFjZW1lbnRGcmFnbWVudHNbZGlyZWN0VGV4dFJlcGxhY2VtZW50RnJhZ21lbnRzLmxlbmd0aC0xXS5hcHBlbmRDaGlsZChkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSh3b3Jkc1tpXSkpO1xuICAgIFx0ICAgICAgICAvL2NvbnNvbGUubG9nKCd3b3JkJywgd29yZCk7XG4gICAgXHQgICAgfVxuXG4gICAgXHR9O1xuICAgIFx0Ly9jb25zb2xlLmxvZygnZWxlbWVudCcsIGVsZW1lbnQpO1xuICAgIFx0Ly9jb25zb2xlLmxvZygncmVwcycsIGRpcmVjdFRleHRSZXBsYWNlbWVudEZyYWdtZW50cyk7XG4gICAgXHRpZiAocmVwbGFjZWQpIHtcbiAgICBcdCAgICByZXBsYWNlRGlyZWN0VGV4dChlbGVtZW50LCBkaXJlY3RUZXh0UmVwbGFjZW1lbnRGcmFnbWVudHMpO1xuICAgIFx0ICAgIHJldHVybiB0cnVlO1xuICAgIFx0fSBlbHNlIHtcbiAgICBcdCAgICByZXR1cm4gZmFsc2U7XG4gICAgXHR9XG4gICAgfSBjYXRjaCAoZXJyKSB7XG5cdGNvbnNvbGUuZXJyb3IoXCJGYWlsZWQgcmVwbGFjaW5nOiBcIiwgZXJyKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIG1hdGNoQ2FzZShvcmlnaW5hbCwgcmVwbGFjZW1lbnQpIHtcbiAgICBpZiAob3JpZ2luYWwgPT09IG9yaWdpbmFsLnRvVXBwZXJDYXNlKCkpIHJldHVybiByZXBsYWNlbWVudC50b1VwcGVyQ2FzZSgpO1xuICAgIGlmIChvcmlnaW5hbCA9PT0gb3JpZ2luYWwudG9Mb3dlckNhc2UoKSkgcmV0dXJuIHJlcGxhY2VtZW50LnRvTG93ZXJDYXNlKCk7XG4gICAgaWYgKG9yaWdpbmFsWzBdID09PSBvcmlnaW5hbFswXS50b1VwcGVyQ2FzZSgpKSByZXR1cm4gcmVwbGFjZW1lbnRbMF0udG9VcHBlckNhc2UoKSArIHJlcGxhY2VtZW50LnNsaWNlKDEpO1xuICAgIHJldHVybiByZXBsYWNlbWVudDtcbn1cblxuLy8gUmV2ZXJ0IGZ1bmN0aW9uIGltcGxlbWVudGF0aW9uXG5mdW5jdGlvbiByZXZlcnRBbGxDaGFuZ2VzKCkge1xuICAgIGZvciAobGV0IFtlbGVtZW50LCBvcmlnaW5hbENvbnRlbnRdIG9mIG9yaWdpbmFsQ29udGVudHMpIHtcbiAgICAgICAgZWxlbWVudC5pbm5lckhUTUwgPSBvcmlnaW5hbENvbnRlbnQ7XG4gICAgfVxuICAgIG9yaWdpbmFsQ29udGVudHMuY2xlYXIoKTsgLy8gQ2xlYXIgYWZ0ZXIgcmV2ZXJ0aW5nIHRvIHByZXZlbnQgZnVydGhlciB1c2Vcbn1cblxuXG4vLyBNZXNzYWdlIEhhbmRsZXJcbmNocm9tZS5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigocmVxdWVzdCwgc2VuZGVyLCBzZW5kUmVzcG9uc2UpID0+IHtcbiAgICAvL2NvbnNvbGUubG9nKCdyZWNlaXZlZCcscmVxdWVzdCk7XG4gICAgLy9jb25zb2xlLmxvZygnc2VuZGVyJyxzZW5kZXIpO1xuICAgIC8vY29uc29sZS5sb2coJ3NlbmRSZXNwb25zZScsc2VuZFJlc3BvbnNlKTtcbiAgICBpZiAocmVxdWVzdC5hY3Rpb24gPT09ICdyZXBsYWNlU2VsZWN0ZWQnKSB7XG4gICAgICAgcmVwbGFjZVNlbGVjdGVkKCkudGhlbigoKT0+e2NvbnNvbGUubG9nKFwicmVwbGFjZW1lbnQgbGlzdFwiLCBvcmlnaW5hbENvbnRlbnRzKX0pO1xuICAgICAgIDtcbiAgICB9IGVsc2UgaWYgKHJlcXVlc3QuYWN0aW9uID09PSAncmV2ZXJ0UmVwbGFjZW1lbnRzRm9yUGFnZScpIHtcbiAgICAgICByZXZlcnRBbGxDaGFuZ2VzKCk7XG4gICAgfSBlbHNlIGlmIChyZXF1ZXN0LmFjdGlvbiA9PT0gJ3JlcGxhY2VXb3Jkc0ZvclBhZ2UnKSB7XG4gICAgICAgcmVwbGFjZVdvcmRzQXV0b21hdGljYWxseShkb2N1bWVudCkudGhlbigoKT0+e2NvbnNvbGUubG9nKFwicmVwbGFjZW1lbnQgbGlzdFwiLCBvcmlnaW5hbENvbnRlbnRzKX0pO1xuICAgICAgIDtcbiAgICB9IGVsc2Uge1xuICAgICAgIGNvbnNvbGUuZXJyb3IoXCJVbmtvd24gYWN0aW9uOlwiLCByZXF1ZXN0LmFjdGlvbik7XG4gICAgfVxufSk7XG5cblxuY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdhdXRvUmVwbGFjZScpLnRoZW4oKHsgYXV0b1JlcGxhY2UgPSBmYWxzZSB9KSA9PiB7XG4vL2NvbnNvbGUubG9nKFwicmVwbGFjZW1lbnQgbGlzdFwiLCBvcmlnaW5hbENvbnRlbnRzKTtcbiAgICBpZiAoYXV0b1JlcGxhY2UpIHtcbiAgICAgICByZXBsYWNlV29yZHNBdXRvbWF0aWNhbGx5KGRvY3VtZW50KS50aGVuKCgpPT57Y29uc29sZS5sb2coXCJyZXBsYWNlbWVudCBsaXN0IGxlbmd0aFwiLCBvcmlnaW5hbENvbnRlbnRzKX0pO1xuO1xuICAgIH1cbn0pO1xuIl0sIm5hbWVzIjpbXSwic291cmNlUm9vdCI6IiJ9