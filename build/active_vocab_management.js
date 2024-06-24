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
/*!************************************************************!*\
  !*** ./src/active_vocab_manage/active_vocab_management.js ***!
  \************************************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _utils_storageUtils_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../utils/storageUtils.js */ "./src/utils/storageUtils.js");


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
            await (0,_utils_storageUtils_js__WEBPACK_IMPORTED_MODULE_0__.activateVocabs)([newVocab]);
	    //console.log('updating', new Date().getTime());
        }
    });

    document.getElementById('removeSelectedBtn').addEventListener('click', async () => {
        const checkedVocabs = Array.from(activeVocabsListElement.querySelectorAll('.vocab-checkbox:checked')).map(cb => cb.parentElement.querySelector(vocabFatherNode).textContent.trim());
        if (checkedVocabs.length > 0) {
            await (0,_utils_storageUtils_js__WEBPACK_IMPORTED_MODULE_0__.deactivateVocabs)(checkedVocabs);
	    //console.log("Removed", checkedVocabs);
            document.getElementById('status').textContent = `${checkedVocabs.length} vocabs removed from active vocab list.`;
        }
    });
    
    chrome.storage.local.onChanged.addListener(updateUI);
    await updateUI();
});

})();

/******/ })()
;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,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RTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRU87QUFDUDtBQUNBO0FBQ0E7Ozs7Ozs7OztVQ3ZCQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBOztVQUVBO1VBQ0E7O1VBRUE7VUFDQTtVQUNBOzs7OztXQ3RCQTtXQUNBO1dBQ0E7V0FDQTtXQUNBLHlDQUF5Qyx3Q0FBd0M7V0FDakY7V0FDQTtXQUNBOzs7OztXQ1BBOzs7OztXQ0FBO1dBQ0E7V0FDQTtXQUNBLHVEQUF1RCxpQkFBaUI7V0FDeEU7V0FDQSxnREFBZ0QsYUFBYTtXQUM3RDs7Ozs7Ozs7Ozs7O0FDTjRFOztBQUU1RTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxjQUFjLHdCQUF3QjtBQUN0QztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSx1QkFBdUIsaUJBQWlCLG1CQUFtQixNQUFNLFFBQVEsZ0JBQWdCO0FBQ3pGO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0EscUNBQXFDLDREQUE0RCxNQUFNLElBQUk7QUFDM0csYUFBYTtBQUNiOztBQUVBO0FBQ0EsU0FBUztBQUNUOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0Esa0JBQWtCLHNFQUFjO0FBQ2hDO0FBQ0E7QUFDQSxLQUFLOztBQUVMO0FBQ0E7QUFDQTtBQUNBLGtCQUFrQix3RUFBZ0I7QUFDbEM7QUFDQSwrREFBK0Qsc0JBQXNCO0FBQ3JGO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQTtBQUNBLENBQUMiLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9leHRlbnNpb24vLi9ub2RlX21vZHVsZXMvYXN5bmMtbXV0ZXgvaW5kZXgubWpzIiwid2VicGFjazovL2V4dGVuc2lvbi8uL3NyYy91dGlscy9zdG9yYWdlVXRpbHMuanMiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uLy4vc3JjL3V0aWxzL3N5bm9ueW1VdGlscy5qcyIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZXh0ZW5zaW9uL3dlYnBhY2svcnVudGltZS9kZWZpbmUgcHJvcGVydHkgZ2V0dGVycyIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ydW50aW1lL2hhc093blByb3BlcnR5IHNob3J0aGFuZCIsIndlYnBhY2s6Ly9leHRlbnNpb24vd2VicGFjay9ydW50aW1lL21ha2UgbmFtZXNwYWNlIG9iamVjdCIsIndlYnBhY2s6Ly9leHRlbnNpb24vLi9zcmMvYWN0aXZlX3ZvY2FiX21hbmFnZS9hY3RpdmVfdm9jYWJfbWFuYWdlbWVudC5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBFX1RJTUVPVVQgPSBuZXcgRXJyb3IoJ3RpbWVvdXQgd2hpbGUgd2FpdGluZyBmb3IgbXV0ZXggdG8gYmVjb21lIGF2YWlsYWJsZScpO1xuY29uc3QgRV9BTFJFQURZX0xPQ0tFRCA9IG5ldyBFcnJvcignbXV0ZXggYWxyZWFkeSBsb2NrZWQnKTtcbmNvbnN0IEVfQ0FOQ0VMRUQgPSBuZXcgRXJyb3IoJ3JlcXVlc3QgZm9yIGxvY2sgY2FuY2VsZWQnKTtcblxudmFyIF9fYXdhaXRlciQyID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5jbGFzcyBTZW1hcGhvcmUge1xuICAgIGNvbnN0cnVjdG9yKF92YWx1ZSwgX2NhbmNlbEVycm9yID0gRV9DQU5DRUxFRCkge1xuICAgICAgICB0aGlzLl92YWx1ZSA9IF92YWx1ZTtcbiAgICAgICAgdGhpcy5fY2FuY2VsRXJyb3IgPSBfY2FuY2VsRXJyb3I7XG4gICAgICAgIHRoaXMuX3F1ZXVlID0gW107XG4gICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVycyA9IFtdO1xuICAgIH1cbiAgICBhY3F1aXJlKHdlaWdodCA9IDEsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICBpZiAod2VpZ2h0IDw9IDApXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoYGludmFsaWQgd2VpZ2h0ICR7d2VpZ2h0fTogbXVzdCBiZSBwb3NpdGl2ZWApO1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgY29uc3QgdGFzayA9IHsgcmVzb2x2ZSwgcmVqZWN0LCB3ZWlnaHQsIHByaW9yaXR5IH07XG4gICAgICAgICAgICBjb25zdCBpID0gZmluZEluZGV4RnJvbUVuZCh0aGlzLl9xdWV1ZSwgKG90aGVyKSA9PiBwcmlvcml0eSA8PSBvdGhlci5wcmlvcml0eSk7XG4gICAgICAgICAgICBpZiAoaSA9PT0gLTEgJiYgd2VpZ2h0IDw9IHRoaXMuX3ZhbHVlKSB7XG4gICAgICAgICAgICAgICAgLy8gTmVlZHMgaW1tZWRpYXRlIGRpc3BhdGNoLCBza2lwIHRoZSBxdWV1ZVxuICAgICAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoSXRlbSh0YXNrKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuX3F1ZXVlLnNwbGljZShpICsgMSwgMCwgdGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH1cbiAgICBydW5FeGNsdXNpdmUoY2FsbGJhY2tfMSkge1xuICAgICAgICByZXR1cm4gX19hd2FpdGVyJDIodGhpcywgYXJndW1lbnRzLCB2b2lkIDAsIGZ1bmN0aW9uKiAoY2FsbGJhY2ssIHdlaWdodCA9IDEsIHByaW9yaXR5ID0gMCkge1xuICAgICAgICAgICAgY29uc3QgW3ZhbHVlLCByZWxlYXNlXSA9IHlpZWxkIHRoaXMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHlpZWxkIGNhbGxiYWNrKHZhbHVlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfVxuICAgIHdhaXRGb3JVbmxvY2sod2VpZ2h0ID0gMSwgcHJpb3JpdHkgPSAwKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIGlmICh0aGlzLl9jb3VsZExvY2tJbW1lZGlhdGVseSh3ZWlnaHQsIHByaW9yaXR5KSkge1xuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKCF0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV0pXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSA9IFtdO1xuICAgICAgICAgICAgICAgIGluc2VydFNvcnRlZCh0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV0sIHsgcmVzb2x2ZSwgcHJpb3JpdHkgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3ZhbHVlIDw9IDA7XG4gICAgfVxuICAgIGdldFZhbHVlKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fdmFsdWU7XG4gICAgfVxuICAgIHNldFZhbHVlKHZhbHVlKSB7XG4gICAgICAgIHRoaXMuX3ZhbHVlID0gdmFsdWU7XG4gICAgICAgIHRoaXMuX2Rpc3BhdGNoUXVldWUoKTtcbiAgICB9XG4gICAgcmVsZWFzZSh3ZWlnaHQgPSAxKSB7XG4gICAgICAgIGlmICh3ZWlnaHQgPD0gMClcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgIHRoaXMuX3ZhbHVlICs9IHdlaWdodDtcbiAgICAgICAgdGhpcy5fZGlzcGF0Y2hRdWV1ZSgpO1xuICAgIH1cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHRoaXMuX3F1ZXVlLmZvckVhY2goKGVudHJ5KSA9PiBlbnRyeS5yZWplY3QodGhpcy5fY2FuY2VsRXJyb3IpKTtcbiAgICAgICAgdGhpcy5fcXVldWUgPSBbXTtcbiAgICB9XG4gICAgX2Rpc3BhdGNoUXVldWUoKSB7XG4gICAgICAgIHRoaXMuX2RyYWluVW5sb2NrV2FpdGVycygpO1xuICAgICAgICB3aGlsZSAodGhpcy5fcXVldWUubGVuZ3RoID4gMCAmJiB0aGlzLl9xdWV1ZVswXS53ZWlnaHQgPD0gdGhpcy5fdmFsdWUpIHtcbiAgICAgICAgICAgIHRoaXMuX2Rpc3BhdGNoSXRlbSh0aGlzLl9xdWV1ZS5zaGlmdCgpKTtcbiAgICAgICAgICAgIHRoaXMuX2RyYWluVW5sb2NrV2FpdGVycygpO1xuICAgICAgICB9XG4gICAgfVxuICAgIF9kaXNwYXRjaEl0ZW0oaXRlbSkge1xuICAgICAgICBjb25zdCBwcmV2aW91c1ZhbHVlID0gdGhpcy5fdmFsdWU7XG4gICAgICAgIHRoaXMuX3ZhbHVlIC09IGl0ZW0ud2VpZ2h0O1xuICAgICAgICBpdGVtLnJlc29sdmUoW3ByZXZpb3VzVmFsdWUsIHRoaXMuX25ld1JlbGVhc2VyKGl0ZW0ud2VpZ2h0KV0pO1xuICAgIH1cbiAgICBfbmV3UmVsZWFzZXIod2VpZ2h0KSB7XG4gICAgICAgIGxldCBjYWxsZWQgPSBmYWxzZTtcbiAgICAgICAgcmV0dXJuICgpID0+IHtcbiAgICAgICAgICAgIGlmIChjYWxsZWQpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgY2FsbGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMucmVsZWFzZSh3ZWlnaHQpO1xuICAgICAgICB9O1xuICAgIH1cbiAgICBfZHJhaW5VbmxvY2tXYWl0ZXJzKCkge1xuICAgICAgICBpZiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB3ZWlnaHQgPSB0aGlzLl92YWx1ZTsgd2VpZ2h0ID4gMDsgd2VpZ2h0LS0pIHtcbiAgICAgICAgICAgICAgICBjb25zdCB3YWl0ZXJzID0gdGhpcy5fd2VpZ2h0ZWRXYWl0ZXJzW3dlaWdodCAtIDFdO1xuICAgICAgICAgICAgICAgIGlmICghd2FpdGVycylcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgd2FpdGVycy5mb3JFYWNoKCh3YWl0ZXIpID0+IHdhaXRlci5yZXNvbHZlKCkpO1xuICAgICAgICAgICAgICAgIHRoaXMuX3dlaWdodGVkV2FpdGVyc1t3ZWlnaHQgLSAxXSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29uc3QgcXVldWVkUHJpb3JpdHkgPSB0aGlzLl9xdWV1ZVswXS5wcmlvcml0eTtcbiAgICAgICAgICAgIGZvciAobGV0IHdlaWdodCA9IHRoaXMuX3ZhbHVlOyB3ZWlnaHQgPiAwOyB3ZWlnaHQtLSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IHdhaXRlcnMgPSB0aGlzLl93ZWlnaHRlZFdhaXRlcnNbd2VpZ2h0IC0gMV07XG4gICAgICAgICAgICAgICAgaWYgKCF3YWl0ZXJzKVxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICBjb25zdCBpID0gd2FpdGVycy5maW5kSW5kZXgoKHdhaXRlcikgPT4gd2FpdGVyLnByaW9yaXR5IDw9IHF1ZXVlZFByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAoaSA9PT0gLTEgPyB3YWl0ZXJzIDogd2FpdGVycy5zcGxpY2UoMCwgaSkpXG4gICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKCh3YWl0ZXIgPT4gd2FpdGVyLnJlc29sdmUoKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIF9jb3VsZExvY2tJbW1lZGlhdGVseSh3ZWlnaHQsIHByaW9yaXR5KSB7XG4gICAgICAgIHJldHVybiAodGhpcy5fcXVldWUubGVuZ3RoID09PSAwIHx8IHRoaXMuX3F1ZXVlWzBdLnByaW9yaXR5IDwgcHJpb3JpdHkpICYmXG4gICAgICAgICAgICB3ZWlnaHQgPD0gdGhpcy5fdmFsdWU7XG4gICAgfVxufVxuZnVuY3Rpb24gaW5zZXJ0U29ydGVkKGEsIHYpIHtcbiAgICBjb25zdCBpID0gZmluZEluZGV4RnJvbUVuZChhLCAob3RoZXIpID0+IHYucHJpb3JpdHkgPD0gb3RoZXIucHJpb3JpdHkpO1xuICAgIGEuc3BsaWNlKGkgKyAxLCAwLCB2KTtcbn1cbmZ1bmN0aW9uIGZpbmRJbmRleEZyb21FbmQoYSwgcHJlZGljYXRlKSB7XG4gICAgZm9yIChsZXQgaSA9IGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgaWYgKHByZWRpY2F0ZShhW2ldKSkge1xuICAgICAgICAgICAgcmV0dXJuIGk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIC0xO1xufVxuXG52YXIgX19hd2FpdGVyJDEgPSAodW5kZWZpbmVkICYmIHVuZGVmaW5lZC5fX2F3YWl0ZXIpIHx8IGZ1bmN0aW9uICh0aGlzQXJnLCBfYXJndW1lbnRzLCBQLCBnZW5lcmF0b3IpIHtcbiAgICBmdW5jdGlvbiBhZG9wdCh2YWx1ZSkgeyByZXR1cm4gdmFsdWUgaW5zdGFuY2VvZiBQID8gdmFsdWUgOiBuZXcgUChmdW5jdGlvbiAocmVzb2x2ZSkgeyByZXNvbHZlKHZhbHVlKTsgfSk7IH1cbiAgICByZXR1cm4gbmV3IChQIHx8IChQID0gUHJvbWlzZSkpKGZ1bmN0aW9uIChyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgICAgZnVuY3Rpb24gZnVsZmlsbGVkKHZhbHVlKSB7IHRyeSB7IHN0ZXAoZ2VuZXJhdG9yLm5leHQodmFsdWUpKTsgfSBjYXRjaCAoZSkgeyByZWplY3QoZSk7IH0gfVxuICAgICAgICBmdW5jdGlvbiByZWplY3RlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvcltcInRocm93XCJdKHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gc3RlcChyZXN1bHQpIHsgcmVzdWx0LmRvbmUgPyByZXNvbHZlKHJlc3VsdC52YWx1ZSkgOiBhZG9wdChyZXN1bHQudmFsdWUpLnRoZW4oZnVsZmlsbGVkLCByZWplY3RlZCk7IH1cbiAgICAgICAgc3RlcCgoZ2VuZXJhdG9yID0gZ2VuZXJhdG9yLmFwcGx5KHRoaXNBcmcsIF9hcmd1bWVudHMgfHwgW10pKS5uZXh0KCkpO1xuICAgIH0pO1xufTtcbmNsYXNzIE11dGV4IHtcbiAgICBjb25zdHJ1Y3RvcihjYW5jZWxFcnJvcikge1xuICAgICAgICB0aGlzLl9zZW1hcGhvcmUgPSBuZXcgU2VtYXBob3JlKDEsIGNhbmNlbEVycm9yKTtcbiAgICB9XG4gICAgYWNxdWlyZSgpIHtcbiAgICAgICAgcmV0dXJuIF9fYXdhaXRlciQxKHRoaXMsIGFyZ3VtZW50cywgdm9pZCAwLCBmdW5jdGlvbiogKHByaW9yaXR5ID0gMCkge1xuICAgICAgICAgICAgY29uc3QgWywgcmVsZWFzZXJdID0geWllbGQgdGhpcy5fc2VtYXBob3JlLmFjcXVpcmUoMSwgcHJpb3JpdHkpO1xuICAgICAgICAgICAgcmV0dXJuIHJlbGVhc2VyO1xuICAgICAgICB9KTtcbiAgICB9XG4gICAgcnVuRXhjbHVzaXZlKGNhbGxiYWNrLCBwcmlvcml0eSA9IDApIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5ydW5FeGNsdXNpdmUoKCkgPT4gY2FsbGJhY2soKSwgMSwgcHJpb3JpdHkpO1xuICAgIH1cbiAgICBpc0xvY2tlZCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX3NlbWFwaG9yZS5pc0xvY2tlZCgpO1xuICAgIH1cbiAgICB3YWl0Rm9yVW5sb2NrKHByaW9yaXR5ID0gMCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fc2VtYXBob3JlLndhaXRGb3JVbmxvY2soMSwgcHJpb3JpdHkpO1xuICAgIH1cbiAgICByZWxlYXNlKCkge1xuICAgICAgICBpZiAodGhpcy5fc2VtYXBob3JlLmlzTG9ja2VkKCkpXG4gICAgICAgICAgICB0aGlzLl9zZW1hcGhvcmUucmVsZWFzZSgpO1xuICAgIH1cbiAgICBjYW5jZWwoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9zZW1hcGhvcmUuY2FuY2VsKCk7XG4gICAgfVxufVxuXG52YXIgX19hd2FpdGVyID0gKHVuZGVmaW5lZCAmJiB1bmRlZmluZWQuX19hd2FpdGVyKSB8fCBmdW5jdGlvbiAodGhpc0FyZywgX2FyZ3VtZW50cywgUCwgZ2VuZXJhdG9yKSB7XG4gICAgZnVuY3Rpb24gYWRvcHQodmFsdWUpIHsgcmV0dXJuIHZhbHVlIGluc3RhbmNlb2YgUCA/IHZhbHVlIDogbmV3IFAoZnVuY3Rpb24gKHJlc29sdmUpIHsgcmVzb2x2ZSh2YWx1ZSk7IH0pOyB9XG4gICAgcmV0dXJuIG5ldyAoUCB8fCAoUCA9IFByb21pc2UpKShmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XG4gICAgICAgIGZ1bmN0aW9uIGZ1bGZpbGxlZCh2YWx1ZSkgeyB0cnkgeyBzdGVwKGdlbmVyYXRvci5uZXh0KHZhbHVlKSk7IH0gY2F0Y2ggKGUpIHsgcmVqZWN0KGUpOyB9IH1cbiAgICAgICAgZnVuY3Rpb24gcmVqZWN0ZWQodmFsdWUpIHsgdHJ5IHsgc3RlcChnZW5lcmF0b3JbXCJ0aHJvd1wiXSh2YWx1ZSkpOyB9IGNhdGNoIChlKSB7IHJlamVjdChlKTsgfSB9XG4gICAgICAgIGZ1bmN0aW9uIHN0ZXAocmVzdWx0KSB7IHJlc3VsdC5kb25lID8gcmVzb2x2ZShyZXN1bHQudmFsdWUpIDogYWRvcHQocmVzdWx0LnZhbHVlKS50aGVuKGZ1bGZpbGxlZCwgcmVqZWN0ZWQpOyB9XG4gICAgICAgIHN0ZXAoKGdlbmVyYXRvciA9IGdlbmVyYXRvci5hcHBseSh0aGlzQXJnLCBfYXJndW1lbnRzIHx8IFtdKSkubmV4dCgpKTtcbiAgICB9KTtcbn07XG5mdW5jdGlvbiB3aXRoVGltZW91dChzeW5jLCB0aW1lb3V0LCB0aW1lb3V0RXJyb3IgPSBFX1RJTUVPVVQpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBhY3F1aXJlOiAod2VpZ2h0T3JQcmlvcml0eSwgcHJpb3JpdHkpID0+IHtcbiAgICAgICAgICAgIGxldCB3ZWlnaHQ7XG4gICAgICAgICAgICBpZiAoaXNTZW1hcGhvcmUoc3luYykpIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2VpZ2h0ID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHByaW9yaXR5ID0gd2VpZ2h0T3JQcmlvcml0eTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICh3ZWlnaHQgIT09IHVuZGVmaW5lZCAmJiB3ZWlnaHQgPD0gMCkge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgaW52YWxpZCB3ZWlnaHQgJHt3ZWlnaHR9OiBtdXN0IGJlIHBvc2l0aXZlYCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGxldCBpc1RpbWVvdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBjb25zdCBoYW5kbGUgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgaXNUaW1lb3V0ID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmVqZWN0KHRpbWVvdXRFcnJvcik7XG4gICAgICAgICAgICAgICAgfSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgdGlja2V0ID0geWllbGQgKGlzU2VtYXBob3JlKHN5bmMpXG4gICAgICAgICAgICAgICAgICAgICAgICA/IHN5bmMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KVxuICAgICAgICAgICAgICAgICAgICAgICAgOiBzeW5jLmFjcXVpcmUocHJpb3JpdHkpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGlzVGltZW91dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc3QgcmVsZWFzZSA9IEFycmF5LmlzQXJyYXkodGlja2V0KSA/IHRpY2tldFsxXSA6IHRpY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlbGVhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSh0aWNrZXQpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGNhdGNoIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghaXNUaW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQoaGFuZGxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfSxcbiAgICAgICAgcnVuRXhjbHVzaXZlKGNhbGxiYWNrLCB3ZWlnaHQsIHByaW9yaXR5KSB7XG4gICAgICAgICAgICByZXR1cm4gX19hd2FpdGVyKHRoaXMsIHZvaWQgMCwgdm9pZCAwLCBmdW5jdGlvbiogKCkge1xuICAgICAgICAgICAgICAgIGxldCByZWxlYXNlID0gKCkgPT4gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHRpY2tldCA9IHlpZWxkIHRoaXMuYWNxdWlyZSh3ZWlnaHQsIHByaW9yaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKEFycmF5LmlzQXJyYXkodGlja2V0KSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSA9IHRpY2tldFsxXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCBjYWxsYmFjayh0aWNrZXRbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVsZWFzZSA9IHRpY2tldDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB5aWVsZCBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGZpbmFsbHkge1xuICAgICAgICAgICAgICAgICAgICByZWxlYXNlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlbGVhc2Uod2VpZ2h0KSB7XG4gICAgICAgICAgICBzeW5jLnJlbGVhc2Uod2VpZ2h0KTtcbiAgICAgICAgfSxcbiAgICAgICAgY2FuY2VsKCkge1xuICAgICAgICAgICAgcmV0dXJuIHN5bmMuY2FuY2VsKCk7XG4gICAgICAgIH0sXG4gICAgICAgIHdhaXRGb3JVbmxvY2s6ICh3ZWlnaHRPclByaW9yaXR5LCBwcmlvcml0eSkgPT4ge1xuICAgICAgICAgICAgbGV0IHdlaWdodDtcbiAgICAgICAgICAgIGlmIChpc1NlbWFwaG9yZShzeW5jKSkge1xuICAgICAgICAgICAgICAgIHdlaWdodCA9IHdlaWdodE9yUHJpb3JpdHk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3ZWlnaHQgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgcHJpb3JpdHkgPSB3ZWlnaHRPclByaW9yaXR5O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHdlaWdodCAhPT0gdW5kZWZpbmVkICYmIHdlaWdodCA8PSAwKSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBpbnZhbGlkIHdlaWdodCAke3dlaWdodH06IG11c3QgYmUgcG9zaXRpdmVgKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3QgaGFuZGxlID0gc2V0VGltZW91dCgoKSA9PiByZWplY3QodGltZW91dEVycm9yKSwgdGltZW91dCk7XG4gICAgICAgICAgICAgICAgKGlzU2VtYXBob3JlKHN5bmMpXG4gICAgICAgICAgICAgICAgICAgID8gc3luYy53YWl0Rm9yVW5sb2NrKHdlaWdodCwgcHJpb3JpdHkpXG4gICAgICAgICAgICAgICAgICAgIDogc3luYy53YWl0Rm9yVW5sb2NrKHByaW9yaXR5KSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dChoYW5kbGUpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgaXNMb2NrZWQ6ICgpID0+IHN5bmMuaXNMb2NrZWQoKSxcbiAgICAgICAgZ2V0VmFsdWU6ICgpID0+IHN5bmMuZ2V0VmFsdWUoKSxcbiAgICAgICAgc2V0VmFsdWU6ICh2YWx1ZSkgPT4gc3luYy5zZXRWYWx1ZSh2YWx1ZSksXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGlzU2VtYXBob3JlKHN5bmMpIHtcbiAgICByZXR1cm4gc3luYy5nZXRWYWx1ZSAhPT0gdW5kZWZpbmVkO1xufVxuXG4vLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpc25lIEB0eXBlc2NyaXB0LWVzbGludC9leHBsaWNpdC1tb2R1bGUtYm91bmRhcnktdHlwZXNcbmZ1bmN0aW9uIHRyeUFjcXVpcmUoc3luYywgYWxyZWFkeUFjcXVpcmVkRXJyb3IgPSBFX0FMUkVBRFlfTE9DS0VEKSB7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICByZXR1cm4gd2l0aFRpbWVvdXQoc3luYywgMCwgYWxyZWFkeUFjcXVpcmVkRXJyb3IpO1xufVxuXG5leHBvcnQgeyBFX0FMUkVBRFlfTE9DS0VELCBFX0NBTkNFTEVELCBFX1RJTUVPVVQsIE11dGV4LCBTZW1hcGhvcmUsIHRyeUFjcXVpcmUsIHdpdGhUaW1lb3V0IH07XG4iLCJpbXBvcnQgeyBmZXRjaFN5bm9ueW1zQmF0Y2ggfSBmcm9tICcuL3N5bm9ueW1VdGlscy5qcyc7XG5pbXBvcnQgeyBNdXRleCwgd2l0aFRpbWVvdXQsIEVfVElNRU9VVCB9IGZyb20gJ2FzeW5jLW11dGV4JztcblxubGV0IGxvY2FsTXV0ZXhlcyA9IGZhbHNlO1xuZXhwb3J0IGZ1bmN0aW9uIHNldExvY2FsTXV0ZXhlcyhtdXRleGVzKSB7XG4gIGxvY2FsTXV0ZXhlcyA9IG11dGV4ZXM7XG59XG5leHBvcnQgZnVuY3Rpb24gYWNxdWlyZUxvY2tzKGxvY2tOYW1lcykge1xuICAvL2NvbnNvbGUubG9nKCdhY3F1cmluZyBsb2NrcycsIGxvY2tOYW1lcyk7XG4gIC8vY29uc29sZS5sb2coJ2xvY2FsbScsIGxvY2FsTXV0ZXhlcyk7XG4gIGlmIChsb2NhbE11dGV4ZXMpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChsb2NrTmFtZXMubWFwKGxvY2tOYW1lID0+XG4gICAgICAgIGxvY2FsTXV0ZXhlc1tsb2NrTmFtZV0gPyBsb2NhbE11dGV4ZXNbbG9ja05hbWVdLmFjcXVpcmUoKSA6IGxvY2FsTXV0ZXhlc1tsb2NrTmFtZV0gPSB3aXRoVGltZW91dChuZXcgTXV0ZXgoKSwgMTYwMDApXG4gICAgICApKVxuICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIFByb21pc2UuYWxsKGxvY2tOYW1lcy5tYXAobG9ja05hbWUgPT4gXG4gICAgICAgIGNocm9tZS5ydW50aW1lLnNlbmRNZXNzYWdlKHthY3Rpb246ICdsb2NrT3BlcmF0aW9uJywgbG9ja05hbWU6IGxvY2tOYW1lLCBvcGVyYXRpb246ICdhY3F1aXJlJ30pLmNhdGNoKChlKT0+Y29uc29sZS5lcnJvcihgRXJyb3IgYWNxdWlyaW5nIGxvY2s6ICR7ZX1gKSlcbiAgICAgICkpO1xuICB9XG59XG5leHBvcnQgZnVuY3Rpb24gcmVsZWFzZUxvY2tzKGxvY2tOYW1lcykge1xuICAvL2NvbnNvbGUubG9nKCdyZWxlYXNpbmcgbG9ja3MnLCBsb2NrTmFtZXMpO1xuICBpZiAobG9jYWxNdXRleGVzKSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwobG9ja05hbWVzLm1hcChhc3luYyBsb2NrTmFtZSA9PlxuXHRsb2NhbE11dGV4ZXNbbG9ja05hbWVdLnJlbGVhc2UoKVxuICAgICAgKSk7XG4gIH0gZWxzZSB7XG4gICAgICByZXR1cm4gUHJvbWlzZS5hbGwobG9ja05hbWVzLm1hcChhc3luYyBsb2NrTmFtZSA9PiBcbiAgICAgICAgY2hyb21lLnJ1bnRpbWUuc2VuZE1lc3NhZ2Uoe2FjdGlvbjogJ2xvY2tPcGVyYXRpb24nLCBsb2NrTmFtZTogbG9ja05hbWUsIG9wZXJhdGlvbjogJ3JlbGVhc2UnfSlcbiAgICAgICkpO1xuICB9XG59XG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd2l0aExvY2tlZChsb2NrTmFtZXMsIGZuKSB7XG4gIGNvbnN0IGlkID0gTWF0aC5yYW5kb20oKTtcbiAgY29uc3Qgb2xkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gIC8vY29uc29sZS5sb2coXCJnZXR0aW5nIGxvY2sgb2ZcIiwgbG9ja05hbWVzLCBcImlkXCIsIGlkLCBcIm9sZFwiLCBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoKSk7XG4gIGF3YWl0IGFjcXVpcmVMb2Nrcyhsb2NrTmFtZXMpO1xuICAvL2NvbnNvbGUubG9nKFwibG9jayBnb3RcIiwgbG9ja05hbWVzLCBcImlkXCIsIGlkLCBcIm9sZFwiLCBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoKSk7XG4gIHRyeSB7XG4gICAgICBhd2FpdCBmbigpO1xuICB9XG4gIGZpbmFsbHkge1xuICAgICAgYXdhaXQgcmVsZWFzZUxvY2tzKGxvY2tOYW1lcyk7XG4gIH1cbiAgLy9jb25zb2xlLmxvZyhcImxvY2sgcmVsZWFzZWQsIHN0b3JhZ2U6XCIsIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgpLCBcImlkXCIsIGlkLCBcInRvb2tcIiwgbmV3IERhdGUoKS5nZXRUaW1lKCktb2xkLCAnbXMnKTtcbiAgLy9jb25zb2xlLmxvZygpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZ2V0U3RvcmFnZURhdGEoa2V5cykgeyAvLyBUaGlzIGZ1bmN0aW9uIHdhaXRzIGZvciB0aGUgbG9jayB0byBiZSByZW1vdmVkXG4gIGlmICghIEFycmF5LmlzQXJyYXkoa2V5cykpIGtleXMgPSBba2V5c107XG4gIGlmIChrZXlzLmxlbmd0aCkge1xuICAgIGF3YWl0IHdpdGhMb2NrZWQoa2V5cywgKCk9Pnt9KTtcbiAgfVxuICByZXR1cm4gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KGtleXMpO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2V0U3RvcmFnZURhdGEoZGF0YSkge1xuICByZXR1cm4gYXdhaXQgY2hyb21lLnN0b3JhZ2UubG9jYWwuc2V0KGRhdGEpO1xufVxuXG4vLyBBZGQgYWN0aXZhdGVkIHZvY2FicyBhbmQgdGhlaXIgc3lub255bXNcbmFzeW5jIGZ1bmN0aW9uIGdldEFkZGVkVm9jYWJzVG9TeW5zKHZvY2Fic1RvU3lucywgdm9jYWJzVG9BZGQsIHN5bm9ueW1zQmF0Y2hUb0FkZCkge1xuICBmb3IgKGxldCBpZHggaW4gdm9jYWJzVG9BZGQpIHtcbiAgICB2b2NhYnNUb1N5bnNbdm9jYWJzVG9BZGRbaWR4XV0gPSBBcnJheS5mcm9tKG5ldyBTZXQoc3lub255bXNCYXRjaFRvQWRkW2lkeF0pKTtcbiAgfVxuICByZXR1cm4gdm9jYWJzVG9TeW5zO1xufVxuXG5hc3luYyBmdW5jdGlvbiBnZXRBZGRlZFN5bnNUb1ZvY2FicyhzeW5zVG9Wb2NhYnMsIHZvY2Fic1RvQWRkLCBzeW5vbnltc0JhdGNoVG9BZGQpIHtcbiAgZm9yIChsZXQgaWR4IGluIHN5bm9ueW1zQmF0Y2hUb0FkZCkge1xuICAgIHN5bm9ueW1zQmF0Y2hUb0FkZFtpZHhdLmZvckVhY2goc3lub255bSA9PiB7XG4gICAgICBjb25zb2xlLmxvZygnc3lub255bTonLCBzeW5vbnltKTtcbiAgICAgIGNvbnNvbGUubG9nKCdzMnY6Jywgc3luc1RvVm9jYWJzW3N5bm9ueW1dKTtcbiAgICAgIGNvbnNvbGUubG9nKCd2MnM6Jywgdm9jYWJzVG9BZGRbaWR4XSk7XG4gICAgICBzeW5zVG9Wb2NhYnNbc3lub255bV0gPSBzeW5zVG9Wb2NhYnNbc3lub255bV0gPyBBcnJheS5mcm9tKG5ldyBTZXQoWy4uLnN5bnNUb1ZvY2Fic1tzeW5vbnltXSwgdm9jYWJzVG9BZGRbaWR4XV0pKSA6IFt2b2NhYnNUb0FkZFtpZHhdXTtcbiAgICB9KTtcbiAgfVxuICByZXR1cm4gc3luc1RvVm9jYWJzO1xufVxuXG4vLyBNYWpvciBFeHBvcnRzXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZGVhY3RpdmF0ZVZvY2Ficyh2b2NhYnNUb0RlbCkge1xuICB2b2NhYnNUb0RlbCA9IGF3YWl0IG5vcm1hbGl6ZVdvcmRzKHZvY2Fic1RvRGVsLCBmYWxzZSk7XG4gIGlmICghdm9jYWJzVG9EZWwubGVuZ3RoKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgXG4gIGF3YWl0IHdpdGhMb2NrZWQoWyd2b2NhYnNUb1N5bnMnLCAnc3luc1RvVm9jYWJzJywgJ2FjdGl2ZVZvY2Fic0xpc3QnXSwgYXN5bmMgKCkgPT4ge1xuICAgIGxldCB7IHZvY2Fic1RvU3lucyA9IHt9LCBzeW5zVG9Wb2NhYnMgPSB7fSwgYWN0aXZlVm9jYWJzTGlzdCA9IFtdIH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd2b2NhYnNUb1N5bnMnLCAnc3luc1RvVm9jYWJzJywgJ2FjdGl2ZVZvY2Fic0xpc3QnXSk7XG4gICAgY29uc3QgZGVsU2V0ID0gbmV3IFNldCh2b2NhYnNUb0RlbCk7XG4gICAgYWN0aXZlVm9jYWJzTGlzdCA9IGFjdGl2ZVZvY2Fic0xpc3QuZmlsdGVyKHZvY2FiID0+ICFkZWxTZXQuaGFzKHZvY2FiKSk7XG4gICAgY29uc3Qgc3lub255bXMgPSB2b2NhYnNUb0RlbC5mbGF0TWFwKCh2b2NhYlRvRGVsKSA9PiB2b2NhYnNUb1N5bnNbdm9jYWJUb0RlbF0pO1xuICAgIHN5bm9ueW1zLmZvckVhY2goKHN5bm9ueW0pID0+IHsgZGVsZXRlIHN5bnNUb1ZvY2Fic1tzeW5vbnltXTsgfSk7XG4gICAgdm9jYWJzVG9EZWwuZm9yRWFjaCgodm9jYWJUb0RlbCkgPT4geyBkZWxldGUgdm9jYWJzVG9TeW5zW3ZvY2FiVG9EZWxdOyB9KTtcblxuICAgIGF3YWl0IHNldFN0b3JhZ2VEYXRhKHsgdm9jYWJzVG9TeW5zLCBzeW5zVG9Wb2NhYnMsIGFjdGl2ZVZvY2Fic0xpc3QgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWN0aXZhdGVWb2NhYnModm9jYWJzVG9BZGQpIHtcbiAgLy9jb25zb2xlLmxvZyhcInN0YXJ0ZWQgbm9ybWFsaXppbmdcIik7XG4gIHZvY2Fic1RvQWRkID0gYXdhaXQgbm9ybWFsaXplV29yZHModm9jYWJzVG9BZGQsIGZhbHNlKTtcbiAgaWYgKCF2b2NhYnNUb0FkZC5sZW5ndGgpIHtcbiAgICByZXR1cm4gMDtcbiAgfVxuXG4gIC8vY29uc29sZS5sb2coXCJzdGFydGVkIHdhaXRpbmcgd2hlbiBhY3RpdmF0aW5nIHZvY2FicyFcIik7XG4gIGxldCB7IHZvY2Fic1RvU3lucyA9IHt9LCBzeW5zVG9Wb2NhYnMgPSB7fSwgYWN0aXZlVm9jYWJzTGlzdCA9IFtdIH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd2b2NhYnNUb1N5bnMnLCAnc3luc1RvVm9jYWJzJywgJ2FjdGl2ZVZvY2Fic0xpc3QnXSk7XG4gIGxldCBzeW5vbnltc0JhdGNoVG9BZGQgPSBbXTtcbiAgc3lub255bXNCYXRjaFRvQWRkID0gYXdhaXQgZmV0Y2hTeW5vbnltc0JhdGNoKHZvY2Fic1RvQWRkKTtcblxuICBsZXQgcmV0dXJuVmFsdWUgPSAwO1xuICBhd2FpdCB3aXRoTG9ja2VkKFsndm9jYWJzVG9TeW5zJywgJ3N5bnNUb1ZvY2FicycsICdhY3RpdmVWb2NhYnNMaXN0J10sIGFzeW5jICgpID0+IHtcbiAgICBjb25zb2xlLmxvZyhcInZvY2Fic1RvQWRkXCIsIHZvY2Fic1RvQWRkKTtcbiAgICBbdm9jYWJzVG9TeW5zLCBzeW5zVG9Wb2NhYnNdID0gYXdhaXQgUHJvbWlzZS5hbGwoW1xuICAgICAgZ2V0QWRkZWRWb2NhYnNUb1N5bnModm9jYWJzVG9TeW5zLCB2b2NhYnNUb0FkZCwgc3lub255bXNCYXRjaFRvQWRkKSxcbiAgICAgIGdldEFkZGVkU3luc1RvVm9jYWJzKHN5bnNUb1ZvY2Ficywgdm9jYWJzVG9BZGQsIHN5bm9ueW1zQmF0Y2hUb0FkZClcbiAgICBdKTtcbiAgICBhY3RpdmVWb2NhYnNMaXN0ID0gQXJyYXkuZnJvbShuZXcgU2V0KFsuLi5hY3RpdmVWb2NhYnNMaXN0LCAuLi52b2NhYnNUb0FkZF0pKTtcblxuICAgIGF3YWl0IHNldFN0b3JhZ2VEYXRhKHsgdm9jYWJzVG9TeW5zLCBzeW5zVG9Wb2NhYnMsIGFjdGl2ZVZvY2Fic0xpc3QgfSk7XG4gICAgcmV0dXJuVmFsdWUgPSB2b2NhYnNUb0FkZC5sZW5ndGg7XG4gIH0pO1xuICByZXR1cm4gcmV0dXJuVmFsdWU7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhY3RpdmF0ZUluYWN0aXZlVm9jYWJzKGxpc3ROYW1lLCBsb2FkQW1vdW50LCBzZWxlY3Rpb25UeXBlKSB7XG4gIGxldCBzcGxpY2VkVm9jYWJzID0gW107XG4gIGF3YWl0IHdpdGhMb2NrZWQoWydpbmFjdGl2ZVZvY2Fic0xpc3RzJ10sIGFzeW5jICgpID0+IHtcbiAgICBsZXQgeyBpbmFjdGl2ZVZvY2Fic0xpc3RzID0ge30gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnaW5hY3RpdmVWb2NhYnNMaXN0cycpO1xuICAgIGxldCBpbmFjdGl2ZVZvY2Fic0xpc3QgPSBpbmFjdGl2ZVZvY2Fic0xpc3RzW2xpc3ROYW1lXSB8fCBbXTtcbiAgICBpZiAoc2VsZWN0aW9uVHlwZT09PSdyYW5kb20nKSB7XG4gICAgICB3aGlsZSAoc3BsaWNlZFZvY2Ficy5sZW5ndGggPCBsb2FkQW1vdW50ICYmIGluYWN0aXZlVm9jYWJzTGlzdC5sZW5ndGggPiAwKSB7XG4gICAgICAgIGNvbnN0IHJhbmRvbUlkeCA9IE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIGluYWN0aXZlVm9jYWJzTGlzdC5sZW5ndGgpO1xuICAgICAgICBzcGxpY2VkVm9jYWJzLnB1c2goaW5hY3RpdmVWb2NhYnNMaXN0LnNwbGljZShyYW5kb21JZHgsIDEpWzBdKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHNlbGVjdGlvblR5cGU9PT0nb3JkZXJlZCcpIHtcbiAgICAgIHNwbGljZWRWb2NhYnMgPSBpbmFjdGl2ZVZvY2Fic0xpc3Quc3BsaWNlKDAsIGxvYWRBbW91bnQpO1xuICAgIH0gZWxzZSB7XG4gICAgICBbc3BsaWNlZFZvY2FicywgaW5hY3RpdmVWb2NhYnNMaXN0XSA9IFtpbmFjdGl2ZVZvY2Fic0xpc3QsIFtdXTtcbiAgICB9XG4gICAgaW5hY3RpdmVWb2NhYnNMaXN0c1tsaXN0TmFtZV0gPSBpbmFjdGl2ZVZvY2Fic0xpc3Q7XG4gICAgYXdhaXQgc2V0U3RvcmFnZURhdGEoeyBpbmFjdGl2ZVZvY2Fic0xpc3RzIH0pO1xuICB9KTtcblxuICBjb25zdCByZXR1cm5WYWx1ZSA9IGF3YWl0IGFjdGl2YXRlVm9jYWJzKHNwbGljZWRWb2NhYnMpO1xuICByZXR1cm4gcmV0dXJuVmFsdWU7IC8vIHJldHVybiB0aGUgbnVtYmVyIG9mIGxvYWRlZCB2b2NhYnNcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFkZEluYWN0aXZlVm9jYWJzKGxpc3ROYW1lLCB2b2NhYnNUb0FkZCkge1xuICB2b2NhYnNUb0FkZCA9IGF3YWl0IG5vcm1hbGl6ZVdvcmRzKHZvY2Fic1RvQWRkLCBmYWxzZSk7XG4gIGlmICghdm9jYWJzVG9BZGQubGVuZ3RoKSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbiAgYXdhaXQgd2l0aExvY2tlZChbJ2luYWN0aXZlVm9jYWJzTGlzdHMnXSwgYXN5bmMgKCkgPT4ge1xuICAgIGNvbnN0IHsgaW5hY3RpdmVWb2NhYnNMaXN0cyA9IHt9IH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoJ2luYWN0aXZlVm9jYWJzTGlzdHMnKTtcbiAgICBpZiAoIWluYWN0aXZlVm9jYWJzTGlzdHNbbGlzdE5hbWVdKSB7XG4gICAgICBpbmFjdGl2ZVZvY2Fic0xpc3RzW2xpc3ROYW1lXSA9IFtdO1xuICAgIH1cbiAgICBpbmFjdGl2ZVZvY2Fic0xpc3RzW2xpc3ROYW1lXSA9IFsuLi5uZXcgU2V0KFsuLi5pbmFjdGl2ZVZvY2Fic0xpc3RzW2xpc3ROYW1lXSwgLi4udm9jYWJzVG9BZGRdKV07XG4gICAgYXdhaXQgc2V0U3RvcmFnZURhdGEoeyAnaW5hY3RpdmVWb2NhYnNMaXN0cyc6IGluYWN0aXZlVm9jYWJzTGlzdHMgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVtb3ZlSW5hY3RpdmVWb2NhYnNMaXN0KGxpc3ROYW1lcykge1xuICB3aXRoTG9ja2VkKFsnaW5hY3RpdmVWb2NhYnNMaXN0cyddLCBhc3luYyAoKSA9PiB7XG4gICAgICBsZXQgeyBpbmFjdGl2ZVZvY2Fic0xpc3RzID0ge30gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldCgnaW5hY3RpdmVWb2NhYnNMaXN0cycpO1xuICAgICAgbGlzdE5hbWVzLmZvckVhY2gobGlzdE5hbWUgPT4gZGVsZXRlIGluYWN0aXZlVm9jYWJzTGlzdHNbbGlzdE5hbWVdKTtcbiAgICAgIGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IGluYWN0aXZlVm9jYWJzTGlzdHMgfSk7XG4gIH0pXG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZW1vdmVBbGxJbmFjdGl2ZVZvY2Fic0xpc3RzKCkge1xuICB3aXRoTG9ja2VkKFsnaW5hY3RpdmVWb2NhYnNMaXN0cyddLCAoKSA9PiBjaHJvbWUuc3RvcmFnZS5sb2NhbC5zZXQoeyBpbmFjdGl2ZVZvY2Fic0xpc3RzOiB7fSB9KSk7XG59XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBjbGVhckFjdGl2ZVZvY2Fic0xpc3QoKSB7XG4gIHdpdGhMb2NrZWQoWydhY3RpdmVWb2NhYnNMaXN0J10sICgpID0+IGNocm9tZS5zdG9yYWdlLmxvY2FsLnNldCh7IGFjdGl2ZVZvY2Fic0xpc3Q6IFtdLCB2b2NhYnNUb1N5bnM6IHt9LCBzeW5zVG9Wb2NhYnM6IHt9IH0pKTtcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHVwZGF0ZVZvY2FiU3lub255bXModm9jYWIsIHVwZGF0ZWRTeW5vbnltcykge1xuICAgIHVwZGF0ZWRTeW5vbnltcyA9IGF3YWl0IG5vcm1hbGl6ZVdvcmRzKHVwZGF0ZWRTeW5vbnltcywgZmFsc2UpO1xuICAgIGF3YWl0IHdpdGhMb2NrZWQoWyd2b2NhYnNUb1N5bnMnLCAnc3luc1RvVm9jYWJzJ10sIGFzeW5jICgpID0+IHtcbiAgICAgICAgbGV0IHsgdm9jYWJzVG9TeW5zID0ge30sIHN5bnNUb1ZvY2FicyA9IHt9IH0gPSBhd2FpdCBjaHJvbWUuc3RvcmFnZS5sb2NhbC5nZXQoWyd2b2NhYnNUb1N5bnMnLCAnc3luc1RvVm9jYWJzJ10pO1xuXG5cbiAgICAgICAgY29uc3Qgb2xkU3lub255bXMgPSB2b2NhYnNUb1N5bnNbdm9jYWJdIHx8IFtdO1xuICAgICAgICBjb25zdCB1cGRhdGVkU3lub255bXNTZXQgPSBuZXcgU2V0KHVwZGF0ZWRTeW5vbnltcyk7XG4gICAgICAgIGNvbnN0IG9sZFN5bm9ueW1zU2V0ID0gbmV3IFNldChvbGRTeW5vbnltcyk7XG4gICAgICAgIGNvbnN0IHN5bm9ueW1zVG9EZWxldGUgPSBvbGRTeW5vbnltcy5maWx0ZXIoc3luID0+ICF1cGRhdGVkU3lub255bXNTZXQuaGFzKHN5bikpO1xuICAgICAgICBjb25zdCBzeW5vbnltc1RvQWRkID0gdXBkYXRlZFN5bm9ueW1zLmZpbHRlcihzeW4gPT4gIW9sZFN5bm9ueW1zU2V0LmhhcyhzeW4pKTtcblxuICAgICAgICBmb3IgKGNvbnN0IHN5biBvZiBzeW5vbnltc1RvRGVsZXRlKSB7XG4gICAgICAgICAgICBpZiAoc3luc1RvVm9jYWJzW3N5bl0pIHtcbiAgICAgICAgICAgICAgICBzeW5zVG9Wb2NhYnNbc3luXSA9IHN5bnNUb1ZvY2Fic1tzeW5dLmZpbHRlcih2ID0+IHYgIT09IHZvY2FiKTtcbiAgICAgICAgICAgICAgICBpZiAoc3luc1RvVm9jYWJzW3N5bl0ubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBzeW5zVG9Wb2NhYnNbc3luXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKGNvbnN0IHN5biBvZiBzeW5vbnltc1RvQWRkKSB7XG4gICAgICAgICAgICBpZiAoIXN5bnNUb1ZvY2Fic1tzeW5dKSB7XG4gICAgICAgICAgICAgICAgc3luc1RvVm9jYWJzW3N5bl0gPSBbXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHN5bnNUb1ZvY2Fic1tzeW5dLnB1c2godm9jYWIpO1xuICAgICAgICB9XG5cbiAgICAgICAgdm9jYWJzVG9TeW5zW3ZvY2FiXSA9IEFycmF5LmZyb20obmV3IFNldCh1cGRhdGVkU3lub255bXMpKTtcblxuXHRjb25zb2xlLmxvZygnYWRkZWQnLCB7c3luc1RvVm9jYWJzfSk7XG4gICAgICAgIGF3YWl0IHNldFN0b3JhZ2VEYXRhKHsgdm9jYWJzVG9TeW5zLCBzeW5zVG9Wb2NhYnMgfSk7XG4gICAgfSk7XG59XG5cbmFzeW5jIGZ1bmN0aW9uIG5vcm1hbGl6ZVdvcmRzKHdvcmRzLCBjaGVja0FkZGVkQWxyZWFkeT1mYWxzZSwgY2hlY2tMb2NrPWZhbHNlKSB7XG4gIHdvcmRzID0gd29yZHMubWFwKHdvcmQgPT4gd29yZC50cmltKCkudG9Mb3dlckNhc2UoKSk7XG4gIHdvcmRzID0gd29yZHMuZmlsdGVyKHdvcmQgPT4gd29yZCAmJiB3b3JkICE9PSAnJyk7XG4gIGlmIChjaGVja0FkZGVkQWxyZWFkeSkge1xuICAgIGNvbnN0IHthY3RpdmVWb2NhYnNMaXN0PVtdfSA9IGF3YWl0IChjaGVja0xvY2sgPyBnZXRTdG9yYWdlRGF0YSgnYWN0aXZlVm9jYWJzTGlzdCcpIDogY2hyb21lLnN0b3JhZ2UubG9jYWwuZ2V0KCdhY3RpdmVWb2NhYnNMaXN0JykpO1xuICAgIGNvbnN0IGV4aXN0aW5nVm9jYWJzU2V0ID0gbmV3IFNldChhY3RpdmVWb2NhYnNMaXN0KTtcbiAgICB3b3JkcyA9IHdvcmRzLmZpbHRlcih3b3JkID0+ICFleGlzdGluZ1ZvY2Fic1NldC5oYXMod29yZCkpO1xuICB9XG4gIHdvcmRzID0gQXJyYXkuZnJvbShuZXcgU2V0KHdvcmRzKSk7XG4gIHJldHVybiB3b3Jkcztcbn1cblxuIiwiLy9jb25zdCBzeW5vbnltcyA9IHJlcXVpcmUoJ3N5bm9ueW1zJyk7XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBmZXRjaFN5bm9ueW1zKHdvcmQpIHtcbiAgICBjb25zdCBpZCA9IE1hdGgucmFuZG9tKCk7XG4gICAgY29uc3Qgb2xkID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG4gICAgLy9jb25zb2xlLmxvZyhcIlxcdGZldGNoaW5nIGZvciB3b3JkXCIsIHdvcmQsIFwiaWRcIiwgaWQpO1xuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYGh0dHA6Ly9hcGkuZGF0YW11c2UuY29tL3dvcmRzP3JlbF9zeW49JHt3b3JkfWApO1xuICAgIGlmICghcmVzcG9uc2Uub2spIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdGYWlsZWQgdG8gZmV0Y2ggc3lub255bXMnKTtcbiAgICB9XG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcbiAgICAvL2NvbnNvbGUubG9nKFwiXFx0ZmV0Y2hlZFwiLCBkYXRhLCBcImlkXCIsIGlkLCBcInRvb2tcIiwgbmV3IERhdGUoKS5nZXRUaW1lKCktb2xkKTtcbiAgICByZXR1cm4gZGF0YS5tYXAoZW50cnkgPT4gZW50cnkud29yZCk7XG59XG4vKlxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGZldGNoU3lub255bXMod29yZCkge1xuICAgIHJldHVybiBzeW5vbnltcyh3b3JkKS5maWx0ZXIoc3lub255bSA9PiBzeW5vbnltIT09d29yZCk7XG59XG4qL1xuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gZmV0Y2hTeW5vbnltc0JhdGNoKHdvcmRzKSB7XG4gICAgY29uc3Qgc3lub255bXNQcm9taXNlcyA9IHdvcmRzLm1hcCh3b3JkID0+IGZldGNoU3lub255bXMod29yZCkpO1xuICAgIHJldHVybiBhd2FpdCBQcm9taXNlLmFsbChzeW5vbnltc1Byb21pc2VzKTtcbn1cblxuXG4iLCIvLyBUaGUgbW9kdWxlIGNhY2hlXG52YXIgX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fID0ge307XG5cbi8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG5mdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuXHR2YXIgY2FjaGVkTW9kdWxlID0gX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXTtcblx0aWYgKGNhY2hlZE1vZHVsZSAhPT0gdW5kZWZpbmVkKSB7XG5cdFx0cmV0dXJuIGNhY2hlZE1vZHVsZS5leHBvcnRzO1xuXHR9XG5cdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG5cdHZhciBtb2R1bGUgPSBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdID0ge1xuXHRcdC8vIG5vIG1vZHVsZS5pZCBuZWVkZWRcblx0XHQvLyBubyBtb2R1bGUubG9hZGVkIG5lZWRlZFxuXHRcdGV4cG9ydHM6IHt9XG5cdH07XG5cblx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG5cdF9fd2VicGFja19tb2R1bGVzX19bbW9kdWxlSWRdKG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG5cdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG5cdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbn1cblxuIiwiLy8gZGVmaW5lIGdldHRlciBmdW5jdGlvbnMgZm9yIGhhcm1vbnkgZXhwb3J0c1xuX193ZWJwYWNrX3JlcXVpcmVfXy5kID0gKGV4cG9ydHMsIGRlZmluaXRpb24pID0+IHtcblx0Zm9yKHZhciBrZXkgaW4gZGVmaW5pdGlvbikge1xuXHRcdGlmKF9fd2VicGFja19yZXF1aXJlX18ubyhkZWZpbml0aW9uLCBrZXkpICYmICFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywga2V5KSkge1xuXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIGtleSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGRlZmluaXRpb25ba2V5XSB9KTtcblx0XHR9XG5cdH1cbn07IiwiX193ZWJwYWNrX3JlcXVpcmVfXy5vID0gKG9iaiwgcHJvcCkgPT4gKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmosIHByb3ApKSIsIi8vIGRlZmluZSBfX2VzTW9kdWxlIG9uIGV4cG9ydHNcbl9fd2VicGFja19yZXF1aXJlX18uciA9IChleHBvcnRzKSA9PiB7XG5cdGlmKHR5cGVvZiBTeW1ib2wgIT09ICd1bmRlZmluZWQnICYmIFN5bWJvbC50b1N0cmluZ1RhZykge1xuXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBTeW1ib2wudG9TdHJpbmdUYWcsIHsgdmFsdWU6ICdNb2R1bGUnIH0pO1xuXHR9XG5cdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG59OyIsImltcG9ydCB7IGFjdGl2YXRlVm9jYWJzLCBkZWFjdGl2YXRlVm9jYWJzIH0gZnJvbSAnLi4vdXRpbHMvc3RvcmFnZVV0aWxzLmpzJztcblxuY29uc3Qgdm9jYWJGYXRoZXJOb2RlID0gJ3NwYW4nO1xuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignRE9NQ29udGVudExvYWRlZCcsIGFzeW5jICgpID0+IHtcbiAgICBjb25zdCBhY3RpdmVWb2NhYnNMaXN0RWxlbWVudCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdhY3RpdmVWb2NhYkxpc3QnKTtcblxuICAgIGNvbnN0IHVwZGF0ZVVJID0gYXN5bmMgKCkgPT4ge1xuICAgICAgICBsZXQgeyBhY3RpdmVWb2NhYnNMaXN0ID0gW10gfSA9IGF3YWl0IGNocm9tZS5zdG9yYWdlLmxvY2FsLmdldChbJ2FjdGl2ZVZvY2Fic0xpc3QnXSk7XG4gICAgICAgIGFjdGl2ZVZvY2Fic0xpc3RFbGVtZW50LmlubmVySFRNTCA9ICcnO1xuICAgICAgICBhY3RpdmVWb2NhYnNMaXN0LmZvckVhY2goYXN5bmMgdm9jYWIgPT4ge1xuICAgICAgICAgICAgY29uc3QgaXRlbSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2xpJyk7XG4gICAgICAgICAgICBpdGVtLmlubmVySFRNTCA9IGBcbiAgICAgICAgICAgICAgICA8ZGl2PlxuXHRcdCAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgY2xhc3M9XCJ2b2NhYi1jaGVja2JveFwiPlxuICAgICAgICAgICAgICAgICAgICA8JHt2b2NhYkZhdGhlck5vZGV9IGNsYXNzPSd2b2NhYic+PGI+JHt2b2NhYn08L2I+PC8ke3ZvY2FiRmF0aGVyTm9kZX0+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gY2xhc3M9XCJlZGl0U3lub255bXNCdG5cIj5FZGl0IFN5bm9ueW1zPC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICBgO1xuXG5cdCAgICAvL2NvbnNvbGUubG9nKCcuZWRpdFN5bm9ueW1zQnRuJywgbmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgaXRlbS5xdWVyeVNlbGVjdG9yKCcuZWRpdFN5bm9ueW1zQnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgICAgICAgY2hyb21lLnRhYnMuY3JlYXRlKHsgdXJsOiBjaHJvbWUucnVudGltZS5nZXRVUkwoYHN5bm9ueW1fbWFuYWdlbWVudC5odG1sP3ZvY2FiPSR7dm9jYWJ9YCkgfSk7XG4gICAgICAgICAgICB9KTtcblx0ICAgIC8vY29uc29sZS5sb2coJ2dvb2QgbGlzdGVuZXInLCBuZXcgRGF0ZSgpLmdldFRpbWUoKSk7XG5cbiAgICAgICAgICAgIGFjdGl2ZVZvY2Fic0xpc3RFbGVtZW50LmFwcGVuZENoaWxkKGl0ZW0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2FkZE5ld1ZvY2FiQnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IG5ld1ZvY2FiID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ25ld1ZvY2FiSW5wdXQnKS52YWx1ZTtcbiAgICAgICAgaWYgKG5ld1ZvY2FiKSB7XG5cdCAgICAvL2NvbnNvbGUubG9nKCdhY3RpdmF0aW5nLi4uJywgbmV3IERhdGUoKS5nZXRUaW1lKCkpO1xuICAgICAgICAgICAgYXdhaXQgYWN0aXZhdGVWb2NhYnMoW25ld1ZvY2FiXSk7XG5cdCAgICAvL2NvbnNvbGUubG9nKCd1cGRhdGluZycsIG5ldyBEYXRlKCkuZ2V0VGltZSgpKTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlbW92ZVNlbGVjdGVkQnRuJykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCBhc3luYyAoKSA9PiB7XG4gICAgICAgIGNvbnN0IGNoZWNrZWRWb2NhYnMgPSBBcnJheS5mcm9tKGFjdGl2ZVZvY2Fic0xpc3RFbGVtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJy52b2NhYi1jaGVja2JveDpjaGVja2VkJykpLm1hcChjYiA9PiBjYi5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3Iodm9jYWJGYXRoZXJOb2RlKS50ZXh0Q29udGVudC50cmltKCkpO1xuICAgICAgICBpZiAoY2hlY2tlZFZvY2Ficy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICBhd2FpdCBkZWFjdGl2YXRlVm9jYWJzKGNoZWNrZWRWb2NhYnMpO1xuXHQgICAgLy9jb25zb2xlLmxvZyhcIlJlbW92ZWRcIiwgY2hlY2tlZFZvY2Ficyk7XG4gICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhdHVzJykudGV4dENvbnRlbnQgPSBgJHtjaGVja2VkVm9jYWJzLmxlbmd0aH0gdm9jYWJzIHJlbW92ZWQgZnJvbSBhY3RpdmUgdm9jYWIgbGlzdC5gO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgXG4gICAgY2hyb21lLnN0b3JhZ2UubG9jYWwub25DaGFuZ2VkLmFkZExpc3RlbmVyKHVwZGF0ZVVJKTtcbiAgICBhd2FpdCB1cGRhdGVVSSgpO1xufSk7XG4iXSwibmFtZXMiOltdLCJzb3VyY2VSb290IjoiIn0=