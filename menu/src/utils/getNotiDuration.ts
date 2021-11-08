const minDuration = 7.5;
const maxDuration = 30;
const avgWordSize = 5.5; //We could count words, but this is probably better.
const avgWordReadingTime = 60 / 150; //Assuming slow-reading speeds

/**
 * Will return the ideal notification duration (in ms) given the length of the
 * passed string
 * @param text - Text to display
 **/
export const getNotiDuration = (text: string): number => {
  const idealSeconds = (text.length / avgWordSize) * avgWordReadingTime;
  if (idealSeconds < minDuration) return minDuration;
  if (idealSeconds > maxDuration) return maxDuration;

  return idealSeconds;
};
