import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [count, setCount] = useState<number>(0);

  return (
    <div>
      <h1>{count}</h1>
      <button className="App" onClick={() => setCount(count + 1)}>Increase</button>
    </div>
  )
}

