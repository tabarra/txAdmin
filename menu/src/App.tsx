import React from 'react';
import './App.css';
import { useVisibleContext } from "./provider/VisibilityProvider";
import { Fade } from "@material-ui/core";
import MenuList from "./components/MenuList";
import { SnackbarProvider } from "./provider/SnackbarProvider";
import {TabProvider} from "./provider/TabProvider";

const App: React.FC = () => {
  const { visibility } = useVisibleContext()

  return (
    <SnackbarProvider>
      <TabProvider>
        <div className='App'>
          <Fade in={visibility}>
            <MenuList />
          </Fade>
        </div>
      </TabProvider>
    </SnackbarProvider>
  )
}

export default App