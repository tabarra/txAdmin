import React, { createContext, useContext, useState } from 'react';

export const MenuContext = createContext(undefined);

export default function MenuProvider({ children }) {
    const [visibility, setVisibility] = useState(false)
    const value = {
        visibility,
        setVisibility
    }

    return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export const useVisibility = () => {
    const { visibility, setVisibility } = useContext(MenuContext);
    return { visibility, setVisibility }
}       