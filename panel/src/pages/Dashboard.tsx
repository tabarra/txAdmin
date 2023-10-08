import reactLogo from '../assets/react.svg';

export default function Dashboard() {
    return (
        <div className="w-full flex flex-col items-center justify-center gap-2">
            <div className='flex flex-row justify-center'>
                <img src='./vite.svg' className="w-20 h-20" alt="Vite logo" />
                <img src={reactLogo} className="w-20 h-20" alt="React logo" />
            </div>
            <h1 className="bg-fuchsia-600 text-4xl">Dashboard</h1>
        </div>
    );
}
