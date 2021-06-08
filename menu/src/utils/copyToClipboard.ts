// Because we don't have access to Clipboard API in FiveM's CEF,
// we need to use the old school method.
// NOTE: Since the only place we use this is in the player-modal. This is
// currently targeting the wrapper element for where it appends

export const copyToClipboard = (value: string, isPlayerModal?: boolean): void => {
  const targetElement = isPlayerModal ? document.getElementById('player-modal-container') : document.body
  const clipElem = document.createElement("input");
  clipElem.value = value;
  targetElement.appendChild(clipElem);
  clipElem.select();
  document.execCommand("copy");
  targetElement.removeChild(clipElem);
};