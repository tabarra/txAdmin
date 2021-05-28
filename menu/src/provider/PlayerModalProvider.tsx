import React, { useContext, createContext, useState } from 'react';
import PlayerModal from '../components/PlayerModal/PlayerModal';

const PlayerContext = createContext(null);

interface PlayerProviderCtx {
  tab: number,
  isModalOpen: boolean,
  setModalOpen: (bool: boolean) => void
  setTab: (tab: number) => void
}

export const PlayerModalProvider: React.FC = ({ children }) => {
  const [tab, setTab] = useState(1);
  const [modal, setModal] = useState(true);

  return (
    <PlayerContext.Provider
      value={{
        tab,
        setTab,
        isModalOpen: modal,
        setModalOpen: setModal
      }}
    >
      <>
        <PlayerModal />
        {children}
      </>
    </PlayerContext.Provider>)
}

export const usePlayerModalContext = () => useContext<PlayerProviderCtx>(PlayerContext)