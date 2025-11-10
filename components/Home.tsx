import React from 'react';
import type { PetProfile } from '../types';
import { FoodIcon, HeartIcon, ChatIcon } from './icons/Icons';

interface HomeProps {
    pet: PetProfile;
    setActiveTab: (tab: string) => void;
}

const Home: React.FC<HomeProps> = ({ pet, setActiveTab }) => {
    const isBirthday = new Date().getMonth() === pet.birthday.getMonth() && new Date().getDate() === pet.birthday.getDate();

    return (
        <div className="p-6 bg-[var(--background)] min-h-screen">
            <header className="flex items-center space-x-4 mb-8">
                <img src={pet.avatar} alt={pet.name} className="w-24 h-24 rounded-full border-4 border-white shadow-xl object-cover" />
                <div>
                    <p className="text-lg text-gray-500">Welcome Back!</p>
                    <h1 className="text-3xl font-bold text-gray-800">How's {pet.name} today?</h1>
                </div>
            </header>

            {isBirthday && (
                <div className="mb-8 p-5 bg-gradient-to-r from-[var(--secondary)] to-[var(--primary)] rounded-2xl text-white text-center shadow-lg animate-pulse-slow">
                    <p className="font-bold text-lg">🎉 Happy Birthday, {pet.name}! 🐾</p>
                    <p className="text-sm">Wishing you a day full of treats and cuddles!</p>
                </div>
            )}

            <section>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <ActionCard
                        title="Daily Routine"
                        subtitle="Check today's schedule"
                        icon={<FoodIcon className="w-10 h-10 text-white" />}
                        color="from-[var(--accent)] to-[#8ac9b8]"
                        onClick={() => setActiveTab('Routine')}
                    />
                    <ActionCard
                        title="Health Scan"
                        subtitle="Check on your pet's health"
                        icon={<HeartIcon className="w-10 h-10 text-white" />}
                        color="from-[var(--secondary)] to-[#f89ac1]"
                        onClick={() => setActiveTab('Health')}
                    />
                     <ActionCard
                        title="AI Assistant"
                        subtitle="Ask questions & get advice"
                        icon={<ChatIcon className="w-10 h-10 text-white" />}
                        color="from-[var(--primary)] to-[#80baf8]"
                        onClick={() => setActiveTab('Chat')}
                    />
                </div>
            </section>
        </div>
    );
};

const ActionCard: React.FC<{ title: string; subtitle: string; icon: React.ReactNode; color: string; onClick: () => void; }> = ({ title, subtitle, icon, color, onClick }) => (
    <div
        onClick={onClick}
        className={`bg-gradient-to-br ${color} p-6 rounded-3xl shadow-lg text-white cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2`}
    >
        <div className="mb-4">
            {icon}
        </div>
        <p className="font-bold text-2xl">{title}</p>
        <p className="text-md opacity-90">{subtitle}</p>
    </div>
);


export default Home;