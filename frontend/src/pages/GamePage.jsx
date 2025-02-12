import React from 'react';
import {Header} from '../components/Header';
import {Footer} from '../components/Footer';
import {GameComponent} from "../components/GameComponent.jsx";

export const GamePage = () => {
    return (
        <>
            <Header/>
            <GameComponent/>
            <Footer/>
        </>
    );
};
