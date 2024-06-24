/**
 * Function to inject CSS styles into the document.
 * Originally inspired by a solution found on Stack Overflow.
 * Source: https://stackoverflow.com/questions/15505225/inject-css-stylesheet-as-string-using-javascript
 * (MODIFIED)
 */
export function addStyle(styleString, revertTimeout=false) {
  const style = document.createElement('style');
  document.head.append(style);
  style.textContent = styleString;
  if (revertTimeout) { setTimeout( (()=>style.remove()), revertTimeout ); }
  return style;
};
export function setSubText(element, textContent, revertTimeout) {
  element.textContent = '';
  const textNode = document.createTextNode(textContent);
  element.appendChild(textNode);
  if (revertTimeout) { setTimeout( (()=>textNode.remove()), revertTimeout ); }
  return textNode;
}
// Cut: From SOF

export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

