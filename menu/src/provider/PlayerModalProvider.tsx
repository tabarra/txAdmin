import React, { useContext, createContext, useState, useCallback, useEffect } from 'react';
import PlayerModal from '../components/PlayerModal/PlayerModal';
import { useSetDisableTab, useSetListenForExit } from '../state/keys.state';

const PlayerContext = createContext(null);

interface PlayerProviderCtx {
  tab: number,
  isModalOpen: boolean,
  setModalOpen: (bool: boolean) => void
  setTab: (tab: number) => void
}

export const PlayerModalProvider: React.FC = ({ children }) => {
  const [tab, setTab] = useState(1);
  const [modalOpen, setModalOpen] = useState(true);
  // const setDisableTabNav = useSetDisableTab()
  // const setListenForExit = useSetListenForExit()

  // useEffect(() => {
  //   setDisableTabNav(!modalOpen)
  //   setListenForExit(modalOpen)
  // }, [modalOpen])

  return (
    <PlayerContext.Provider
      value={{
        tab,
        setTab,
        isModalOpen: modalOpen,
        setModalOpen
      }}
    >
      <>
        <PlayerModal />
        {children}
      </>
    </PlayerContext.Provider>)
}

export const usePlayerModalContext = () => useContext<PlayerProviderCtx>(PlayerContext)