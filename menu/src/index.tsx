import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css'
import { MenuProvider } from "./provider/MenuProvider";
import { MuiThemeProvider } from "@material-ui/core";
import { MenuTheme } from "./styles/theme";

ReactDOM.render(
  <MenuProvider>
    <MuiThemeProvider theme={MenuTheme} >
      <App />
    </MuiThemeProvider>
  </MenuProvider>,
 document.getElementById('root')
)