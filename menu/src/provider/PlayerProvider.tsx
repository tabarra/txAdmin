import React, { useContext, createContext, useState } from 'react';

const PlayerContext = createContext(null);

const PlayerProvider: React.FC = ({ children }) => {
  const [tab, setTab] = useState(1);
  const [modal, setModal] = useState(false);

  const value = {
    tab,
    setTab,
    modal,
    setModal
  }

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>
}

export const useTabs = () => {
  const { tab, setTab } = useContext(PlayerContext);
  return { tab, setTab }
}

export const usePlayerModal = () => {
  const { modal, setModal } = useContext(PlayerContext);
  return { modal, setModal }
}


export default PlayerProvider