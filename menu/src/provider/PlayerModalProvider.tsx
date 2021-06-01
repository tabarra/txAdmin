import React, { useContext, createContext, useState, useCallback, useEffect } from 'react';
import PlayerModal from '../components/PlayerModal/PlayerModal';
import { useSetDisableTab, useSetListenForExit } from '../state/keys.state';
import { useSetIsMenuVisible } from '../state/visibility.state';
import { fetchNui } from '../utils/fetchNui';

const PlayerContext = createContext(null);

interface PlayerProviderCtx {
  tab: number,
  isModalOpen: boolean,
  setModalOpen: (bool: boolean) => void
  setTab: (tab: number) => void
  closeMenu: () => void
}

export const PlayerModalProvider: React.FC = ({ children }) => {
  const [tab, setTab] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const setDisableTabNav = useSetDisableTab()
  const setListenForExit = useSetListenForExit()
  const setMenuVisible = useSetIsMenuVisible()

  useEffect(() => {
    setDisableTabNav(modalOpen)
    setListenForExit(!modalOpen)
  }, [modalOpen])

  // Will close both the modal and set the menu to invisible
  const closeMenu = useCallback(() => {
    setModalOpen(false)
    setMenuVisible(false)
    fetchNui('closeMenu')
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        tab,
        setTab,
        isModalOpen: modalOpen,
        setModalOpen,
        closeMenu
      }}
    >
      <>
        <PlayerModal />
        {children}
      </>
    </PlayerContext.Provider>)
}

export const usePlayerModalContext = () => useContext<PlayerProviderCtx>(PlayerContext)