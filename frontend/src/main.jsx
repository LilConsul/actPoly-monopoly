import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Routes, Route} from "react-router";
import {MainPage} from "./pages/MainPage.jsx";


createRoot(document.getElementById('root')).render(
    <StrictMode>
        <div className="min-h-screen flex flex-col bg-gray-50">
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainPage/>}/>
                </Routes>
            </BrowserRouter>
        </div>
    </StrictMode>
    ,
)
