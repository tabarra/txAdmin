import React, { createContext, useContext, useState } from 'react';

interface IMenuProvider {
    visibility: boolean,
    setVisibility: (visible: boolean) => void
}

export const MenuContext = createContext(null);

export const MenuProvider: React.FC = ({children}) => {
    const [visibility, setVisibility] = useState<boolean>(process.env.NODE_ENV === 'development')

    return (
      <MenuContext.Provider
        value={{
            visibility,
            setVisibility
        }}
      >
        {children}
      </MenuContext.Provider>)
}

export const useMenuContext = () => useContext<IMenuProvider>(MenuContext)

