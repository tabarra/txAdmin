import { useState } from 'react';
import reactLogo from './assets/react.svg';

function App() {
    const [count, setCount] = useState(0)

    return (
        <>
            <div>
                <img src='./vite.svg' className="logo" alt="Vite logo" />
                <img src={reactLogo} className="logo react" alt="React logo" />
            </div>
            <h1>example</h1>
            <button onClick={() => setCount((count) => count + 1)}>
                count is {count}
            </button>
        </>
    )
}

export default App
