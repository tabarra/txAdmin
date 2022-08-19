interface TxAdminHelpData {
  date: Date;
}

const TXADMIN_HELP_DATA_KEY = "txAdminHelpData";

const dayInMs = 24 * 60 * 60 * 1000;

export const shouldHelpAlertShow = (): boolean => {
  const rawLocalStorageStr = localStorage.getItem(TXADMIN_HELP_DATA_KEY);

  const setNewItemDate = JSON.stringify({ date: new Date() });

  if (rawLocalStorageStr) {
    const data: TxAdminHelpData = JSON.parse(rawLocalStorageStr);
    const oneDayAgo = new Date(Date.now() - dayInMs);

    // If the last time message was shown was over a day ago
    if (data.date > oneDayAgo) {
      localStorage.setItem(TXADMIN_HELP_DATA_KEY, setNewItemDate);
      return true;
    }

    return false;
  }

  localStorage.setItem(TXADMIN_HELP_DATA_KEY, setNewItemDate);
  return true;
};
