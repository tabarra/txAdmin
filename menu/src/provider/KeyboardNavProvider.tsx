import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { fetchNui } from "../utils/fetchNui";

const KeyboardNavContext = createContext(null);

export const KeyboardNavProvider: React.FC = ({ children }) => {
  const [disabledKeyNav, setDisabledKeyNav] = useState(false);

  const handleSetDisabledInputs = useCallback((bool: boolean) => {
    setDisabledKeyNav(bool);
  }, []);

  useEffect(() => {
    fetchNui("focusInputs", disabledKeyNav);
  }, [disabledKeyNav]);

  return (
    <KeyboardNavContext.Provider
      value={{
        disabledKeyNav: disabledKeyNav,
        setDisabledKeyNav: handleSetDisabledInputs,
      }}
    >
      {children}
    </KeyboardNavContext.Provider>
  );
};

interface KeyboardNavProviderValue {
  disabledKeyNav: boolean;
  setDisabledKeyNav: (bool: boolean) => void;
}

export const useKeyboardNavContext = () =>
  useContext<KeyboardNavProviderValue>(KeyboardNavContext);
