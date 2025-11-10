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
    const interval = setInterval(checkReminders, 60 * 60 * 1000); // Check every hour
    return () => clearInterval(interval);
  }, [checkReminders]);


  const renderContent = () => {
    const contentKey = `${activeTab}-${currentPetId || 'no-pet'}`;
    const component = (() => {
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
    })();

    return <div key={contentKey} className="animate-fade-in">{component}</div>;
  };
  
  const NavItem: React.FC<{ tabName: string; icon: React.ReactNode }> = ({ tabName, icon }) => {
    const isActive = activeTab === tabName;
    return (
      <button
        onClick={() => setActiveTab(tabName)}
        className="flex flex-col items-center justify-center w-full h-16 transition-all duration-300 transform focus:outline-none group"
        aria-label={tabName}
      >
        <div className={`relative transition-all duration-300 ${isActive ? 'transform -translate-y-2' : ''}`}>
          <div className={`absolute -inset-2.5 bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] rounded-full transition-all duration-300 opacity-0 scale-75 blur-md ${isActive ? 'opacity-30 scale-100' : ''}`}></div>
          <div className={`relative p-3 rounded-full transition-all duration-300 ${isActive ? 'bg-white shadow-lg' : 'bg-transparent'}`}>
            <div className={`transition-colors duration-300 ${isActive ? 'text-[var(--primary)]' : 'text-gray-400 group-hover:text-[var(--primary)]'}`}>
              {icon}
            </div>
          </div>
        </div>
        <span className={`text-xs mt-1 transition-all duration-300 font-medium ${isActive ? 'opacity-0' : 'opacity-100 group-hover:text-gray-800'}`}>{tabName}</span>
      </button>
    );
  };


  return (
    <div className="bg-[var(--background)] min-h-screen text-[var(--text-dark)] font-sans flex flex-col">
       <main className="flex-grow pb-24">
        {renderContent()}
      </main>
      <footer className="fixed bottom-0 left-0 right-0 bg-white/70 backdrop-blur-xl shadow-[0_-4px_30px_rgba(0,0,0,0.06)] rounded-t-[2.5rem] z-50">
        <nav className="flex justify-around items-center h-20 px-2">
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