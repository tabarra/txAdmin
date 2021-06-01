// Because we don't have access to Clipboard API in FiveM's CEF,
// we need to use the old school method
export const copyToClipboard = (value: string) => {
  const clipElem = document.createElement("input");
  clipElem.style.opacity = "0";
  clipElem.style.zIndex = "-1";
  clipElem.value = value;
  document.body.appendChild(clipElem);
  clipElem.select();
  document.execCommand("copy");
  document.body.removeChild(clipElem);
};