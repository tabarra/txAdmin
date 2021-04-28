import React from 'react';
import './App.css';
import { useMenuContext } from "./provider/MenuProvider";
import { Fade } from "@material-ui/core";
import MenuRoot from "./components/MenuRoot";

const App: React.FC = () => {
  const { visibility } = useMenuContext()

  return (
    <div>
      <Fade in={visibility}>
        <MenuRoot />
      </Fade>
    </div>
  )
}

export default App