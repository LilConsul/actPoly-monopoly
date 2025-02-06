import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Routes, Route} from "react-router";
import {MainPage} from "./pages/MainPage.jsx";
import {GamePage} from "./pages/GamePage.jsx";


createRoot(document.getElementById('root')).render(
    <div className="min-h-screen flex flex-col bg-gray-50">
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/game/:game_uuid" element={<GamePage/>}/>
            </Routes>
        </BrowserRouter>
    </div>
)
