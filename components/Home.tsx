
import React from 'react';
import type { PetProfile } from '../types';
import { FoodIcon, WalkIcon, HeartIcon } from './icons/Icons';

interface HomeProps {
    pet: PetProfile;
    setActiveTab: (tab: string) => void;
}

const Home: React.FC<HomeProps> = ({ pet, setActiveTab }) => {
    const isBirthday = new Date().getMonth() === pet.birthday.getMonth() && new Date().getDate() === pet.birthday.getDate();

    return (
        <div className="p-6 bg-[#FFFDF7] animate-fade-in">
            <header className="flex items-center space-x-4">
                <img src={pet.avatar} alt={pet.name} className="w-20 h-20 rounded-full border-4 border-white shadow-lg" />
                <div>
                    <p className="text-lg text-gray-500">Hello Owner!</p>
                    <h1 className="text-3xl font-bold text-gray-800">It's a lovely day for {pet.name}</h1>
                </div>
            </header>

            {isBirthday && (
                <div className="mt-6 p-4 bg-gradient-to-r from-[#FFC8DD] to-[#A2D2FF] rounded-2xl text-white text-center shadow-lg animate-pulse">
                    <p className="font-bold text-lg">🎉 Happy Birthday, {pet.name}! 🐾</p>
                </div>
            )}

            <section className="mt-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Today's Quick View</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab('Routine')}>
                        <div className="bg-[#B8E0D2] p-3 rounded-full">
                            <FoodIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">Next Meal</p>
                            <p className="text-gray-500">Dinner at 7:00 PM</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab('Routine')}>
                        <div className="bg-[#A2D2FF] p-3 rounded-full">
                            <WalkIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="font-semibold">Last Walk</p>
                            <p className="text-gray-500">Morning walk at 8:30 AM</p>
                        </div>
                    </div>
                     <div className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4 cursor-pointer hover:shadow-xl transition-shadow" onClick={() => setActiveTab('Health')}>
                        <div className="bg-[#FFC8DD] p-3 rounded-full">
                           <HeartIcon />
                        </div>
                        <div>
                            <p className="font-semibold">Health Scan</p>
                            <p className="text-gray-500">Check on {pet.name}'s well-being</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
