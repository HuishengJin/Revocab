#!/bin/bash

cat_with_echo() {
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo '' >> caty.txt;
    echo "## !!!!  Below: Content of $@ !!!! ##" >> caty.txt;
    echo >> caty.txt;
    echo >> caty.txt;
    echo >> caty.txt;
    cat "$@" >> caty.txt;
    echo >> caty.txt;
}

# Logging the directory structure
echo "Dir tree of the project: " > caty.txt
tree -I node_modules >> caty.txt

# Using the function directly instead of alias
cat_with_echo ./webpack.config.js
cat_with_echo ./src/background.js
cat_with_echo ./src/content.js
cat_with_echo ./src/manifest.json
cat_with_echo ./src/options/options.html
cat_with_echo ./src/options/options.css
cat_with_echo ./src/options/options.js
cat_with_echo ./src/popup/popup.html
cat_with_echo ./src/popup/popup.css
cat_with_echo ./src/popup/popup.js
cat_with_echo ./src/utils/synonymUtils.js
cat_with_echo ./src/utils/modelUtils.js
cat_with_echo ./src/utils/commonUtils.js
cat_with_echo ./src/utils/storageUtils.js
cat_with_echo ./src/active_vocab_manage/active_vocab_management.html
cat_with_echo ./src/active_vocab_manage/active_vocab_management.css
cat_with_echo ./src/active_vocab_manage/active_vocab_management.js
cat_with_echo ./src/active_vocab_manage/synonym_management.html
cat_with_echo ./src/active_vocab_manage/synonym_management.css
cat_with_echo ./src/active_vocab_manage/synonym_management.js
cat_with_echo ./try_on_me.html

# Perform the substitution and copy to clipboard
perl -pe 'BEGIN{open my $fh, "<", "caty.txt"; our @caty=<$fh>; close $fh} s/{PLACEHOLDER}/@caty/g' prompt_template.txt | xclip -selection clipboard
