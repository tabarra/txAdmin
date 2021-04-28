import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import './index.css'
import { MenuProvider } from "./provider/MenuProvider";

ReactDOM.render(
  <MenuProvider>
    <App />
  </MenuProvider>,
 document.getElementById('root')
)