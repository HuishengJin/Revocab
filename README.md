# Welcome to Revocab

Revocab is a Chrome extension designed to help you enhance your English vocabulary. By replacing synonyms with new vocabulary words, Revocab aids you in learning and retaining new words more effectively. The extension's standout feature is its context consideration during replacement. This ensures that vocabulary replacements occur naturally and contextually, helping users understand and remember words better.

## Installation Guide

Follow these steps to install the Revocab extension:

1. Ensure you are using the Chrome browser. If you are not, please switch to Chrome to continue.
2. Download the extension source code and save it to a local directory. The directory should include the `build` folder.
3. Open Chrome and navigate to [chrome://extensions/](chrome://extensions/).
4. Enable "Developer mode" by toggling the switch in the upper-right corner.
5. Click the "Load unpacked" button and select the directory containing the `build` folder.
6. Revocab should now appear in your list of extensions. Make sure it is enabled.

## Usage Guide

Revocab offers several user-friendly features to help you with vocabulary learning. Here are detailed instructions for each feature:

### 1. Adding Active Vocabulary
- Click on the Revocab icon in the Chrome toolbar and select "Manage Active Vocab List."
- Enter a new vocabulary word into the input field at the top and click "Add to Active Vocab."
- The new word will be added to your active vocabulary list.

### 2. Managing Synonyms
- In "Manage Active Vocab List," click the "Edit Synonyms" button next to a word to manage its synonyms.
- Enter synonyms separated by commas and click "Save Synonyms."

### 3. Replacing Synonyms on a Page
- Right-click on a page, select "Replace With Vocabulary on This Page" to replace all detected synonyms automatically.
- To replace only selected text, highlight the text, right-click, and select "Replace for Selected."
- To revert replacements, right-click the page and select "Revert All Replacements on This Page."

### 4. Auto Replace Setting
- Click on the Revocab icon and use the checkbox to enable or disable auto replacement.

### 5. Managing Inactive Vocabulary Lists
- Click the Revocab icon and go to "Manage Active Vocab List."
- Under "Upload Vocabs List," upload a JSON file of vocabulary (like `vocabs_for_try_on_me.json`), which should be located in the same directory as this HTML file.
- Select and load vocabularies into active vocabulary from the dropdown list under "Select Vocabs List."

### 6. Experiment and Practice
- Try out the features on a sample text by visiting the [Try On Me](try_on_me.html) page.
- Import the vocabulary from `vocabs_for_try_on_me.json` and try replacing synonyms on the sample text.
