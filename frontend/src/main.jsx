import {createRoot} from 'react-dom/client'
import './index.css'
import {BrowserRouter, Routes, Route} from "react-router";
import {MainPage} from "./pages/MainPage.jsx";
import {GamePage} from "./pages/GamePage.jsx";
import VerifyUser from "./pages/UserVerifyPage.jsx";
import ResetPassword from "./pages/PasswordResetPage.jsx";


createRoot(document.getElementById('root')).render(
    <div className="min-h-screen flex flex-col bg-gray-150">
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MainPage/>}/>
                <Route path="/game/:game_uuid" element={<GamePage/>}/>
                <Route path="/user/verify/:token" element={<VerifyUser/>}/>
                <Route path="/user/password-reset/:token" element={<ResetPassword/>}/>
            </Routes>
        </BrowserRouter>
    </div>
)
