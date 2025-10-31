import React, { useState, useEffect, useCallback } from 'react';
import Home from './components/Home';
import Routine from './components/Routine';
import Health from './components/Health';
import Community from './components/Community';
import Profile from './components/Profile';
import Chat from './components/Chat';
import { HomeIcon, CalendarIcon, HeartIcon, UsersIcon, PawIcon, ChatIcon } from './components/icons/Icons';
import type { PetProfile, Reminder } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Home');

  const [pets, setPets] = useState<PetProfile[]>(() => {
    const savedPets = localStorage.getItem('pets');
    if (savedPets) {
      const parsed = JSON.parse(savedPets);
      return parsed.map((p: PetProfile) => ({ ...p, birthday: new Date(p.birthday)}));
    }
    return [];
  });

  const [currentPetId, setCurrentPetId] = useState<string | null>(() => {
    const savedId = localStorage.getItem('currentPetId');
    if (savedId) return savedId;
    const savedPets = localStorage.getItem('pets');
    if (savedPets) {
        const parsed = JSON.parse(savedPets);
        if (parsed.length > 0) return parsed[0].id;
    }
    return null;
  });

  const currentPet = pets.find(p => p.id === currentPetId);

  useEffect(() => {
    localStorage.setItem('pets', JSON.stringify(pets));
    if (pets.length > 0 && !currentPetId) {
        setCurrentPetId(pets[0].id);
    }
    if (pets.length === 0) {
        setCurrentPetId(null);
    }
  }, [pets, currentPetId]);

  useEffect(() => {
    if (currentPetId) {
        localStorage.setItem('currentPetId', currentPetId);
    } else {
        localStorage.removeItem('currentPetId');
    }
  }, [currentPetId]);
  
  const checkReminders = useCallback(() => {
    const allReminders: Reminder[] = JSON.parse(localStorage.getItem('reminders') || '[]');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueReminders = allReminders.filter(r => {
        const reminderDate = new Date(r.date);
        reminderDate.setHours(0, 0, 0, 0);

        if (reminderDate > today) return false;

        switch (r.frequency) {
            case 'daily':
                return true;
            case 'weekly':
                return reminderDate.getDay() === today.getDay();
            case 'none':
            default:
                return reminderDate.getTime() === today.getTime();
        }
    });

    if (dueReminders.length > 0) {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                 const petNames = [...new Set(dueReminders.map(r => {
                    const pet = pets.find(p => p.id === r.petId);
                    return pet ? pet.name : 'your pet';
                }))].join(', ');
                
                const reminderTitles = dueReminders.map(r => r.title).join(', ');

                new Notification(`Reminder for ${petNames}`, {
                    body: `Today's tasks: ${reminderTitles}`,
                    icon: '/vite.svg'
                });
            }
        });
    }
  }, [pets]);

  useEffect(() => {
    checkReminders();
  }, [checkReminders]);

  const renderContent = () => {
    if (!currentPet) {
        if (activeTab !== 'Profile') setActiveTab('Profile');
        return <Profile 
            pets={pets} 
            setPets={setPets} 
            currentPetId={currentPetId} 
            setCurrentPetId={setCurrentPetId}
        />;
    }

    switch (activeTab) {
      case 'Home':
        return <Home pet={currentPet} setActiveTab={setActiveTab} />;
      case 'Routine':
        return <Routine pet={currentPet} />;
      case 'Chat':
        return <Chat pet={currentPet} />;
      case 'Health':
        return <Health pet={currentPet} />;
      case 'Community':
        return <Community />;
      case 'Profile':
        return <Profile 
            pets={pets} 
            setPets={setPets}
            currentPetId={currentPetId}
            setCurrentPetId={setCurrentPetId}
        />;
      default:
        return <Home pet={currentPet} setActiveTab={setActiveTab}/>;
    }
  };
  
  const NavItem: React.FC<{ tabName: string; icon: React.ReactNode }> = ({ tabName, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex flex-col items-center justify-center w-full pt-2 pb-1 transition-colors duration-300 ${activeTab === tabName ? 'text-[#A2D2FF]' : 'text-gray-400'}`}
      aria-label={tabName}
    >
      {icon}
      <span className={`text-xs mt-1 ${activeTab === tabName ? 'font-semibold' : 'font-normal'}`}>{tabName}</span>
    </button>
  );

  return (
    <div className="bg-[#FFFDF7] min-h-screen text-gray-800 font-sans flex flex-col">
      <main className="flex-grow pb-20">
        {renderContent()}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.05)] rounded-t-2xl z-50">
        <nav className="flex justify-around items-center h-16">
          <NavItem tabName="Home" icon={<HomeIcon />} />
          <NavItem tabName="Routine" icon={<CalendarIcon />} />
          <NavItem tabName="Chat" icon={<ChatIcon />} />
          <NavItem tabName="Health" icon={<HeartIcon />} />
          <NavItem tabName="Community" icon={<UsersIcon />} />
          <NavItem tabName="Profile" icon={<PawIcon />} />
        </nav>
      </footer>
    </div>
  );
};

export default App;