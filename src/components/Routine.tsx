import React, { useState, useEffect } from 'react';
import type { PetProfile, RoutineItem } from '../types';
import { generateRoutine } from '../services/geminiService';
import { FoodIcon, WaterIcon, WalkIcon, MedicineIcon, SleepIcon } from './icons/Icons';

interface RoutineProps {
    pet: PetProfile;
}

const iconMap: { [key: string]: React.ReactNode } = {
    food: <FoodIcon className="w-6 h-6 text-white" />,
    water: <WaterIcon className="w-6 h-6 text-white" />,
    walk: <WalkIcon className="w-6 h-6 text-white" />,
    medicine: <MedicineIcon className="w-6 h-6 text-white" />,
    sleep: <SleepIcon className="w-6 h-6 text-white" />,
};
const colorMap: { [key:string]: string } = {
    food: 'bg-gradient-to-br from-[var(--highlight)] to-[#fca63c]',
    water: 'bg-gradient-to-br from-[var(--primary)] to-[#80baf8]',
    walk: 'bg-gradient-to-br from-[var(--accent)] to-[#8ac9b8]',
    medicine: 'bg-gradient-to-br from-[var(--secondary)] to-[#f89ac1]',
    sleep: 'bg-gradient-to-br from-gray-400 to-gray-600',
}

const Routine: React.FC<RoutineProps> = ({ pet }) => {
    const [routine, setRoutine] = useState<RoutineItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<RoutineItem | null>(null);

    useEffect(() => {
        const savedRoutines = JSON.parse(localStorage.getItem('routines') || '{}');
        const petRoutine = savedRoutines[pet.id] || [];
        setRoutine(petRoutine.sort((a,b) => a.time.localeCompare(b.time)));
    }, [pet.id]);

    useEffect(() => {
        const allRoutines = JSON.parse(localStorage.getItem('routines') || '{}');
        allRoutines[pet.id] = routine;
        localStorage.setItem('routines', JSON.stringify(allRoutines));
    }, [routine, pet.id]);

    const handleGenerateRoutine = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await generateRoutine({ age: pet.age, breed: pet.breed, weight: pet.weight });
            const generatedItems = JSON.parse(response.text).map((item: Omit<RoutineItem, 'id'>) => ({...item, id: crypto.randomUUID()}));
            
            setRoutine(prevRoutine => {
                const newItems = generatedItems.filter((genItem: RoutineItem) => 
                    !prevRoutine.some(existItem => existItem.activity.toLowerCase() === genItem.activity.toLowerCase() && existItem.time === genItem.time)
                );
                return [...prevRoutine, ...newItems].sort((a, b) => a.time.localeCompare(b.time));
            });
            
        } catch (err) {
            setError('Failed to generate routine. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (item?: RoutineItem) => {
        setCurrentItem(item || { id: crypto.randomUUID(), time: '', activity: '', details: '', icon: 'food' });
        setIsModalOpen(true);
    };
    
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const handleSaveItem = (itemToSave: RoutineItem) => {
        setRoutine(prev => {
            const existing = prev.find(i => i.id === itemToSave.id);
            if (existing) {
                return prev.map(i => i.id === itemToSave.id ? itemToSave : i).sort((a, b) => a.time.localeCompare(b.time));
            }
            return [...prev, itemToSave].sort((a, b) => a.time.localeCompare(b.time));
        });
        handleCloseModal();
    };

    const handleDeleteItem = (id: string) => {
        setRoutine(prev => prev.filter(item => item.id !== id));
    };

    return (
        <div className="p-6 pb-28">
            <h1 className="text-3xl font-bold mb-2">Daily Routine</h1>
            <p className="text-gray-500 mb-6">A plan to keep {pet.name} happy and healthy.</p>

            <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-6 rounded-3xl shadow-lg mb-8">
                <h2 className="text-xl font-semibold mb-1 text-gray-800">Smart Routine Planner</h2>
                <p className="text-sm text-gray-500 mb-4">AI + You: The perfect team for {pet.name}</p>
                <div className="flex justify-between items-center text-sm mb-4 bg-white/50 p-3 rounded-xl text-gray-700">
                    <span><span className="font-semibold">Breed:</span> {pet.breed}</span>
                    <span><span className="font-semibold">Age:</span> {pet.age}</span>
                    <span><span className="font-semibold">Weight:</span> {pet.weight}</span>
                </div>
                <button
                    onClick={handleGenerateRoutine}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-[var(--primary)] to-[#80baf8] text-white font-bold py-3 px-4 rounded-xl hover:shadow-xl transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 transform hover:scale-105"
                >
                    {isLoading ? 'Merging Suggestions...' : '✨ Merge AI-Powered Routine'}
                </button>
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            </div>

            <div>
                <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
                {routine.length > 0 ? (
                    <div className="space-y-4">
                        {routine.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]">
                                <div className={`p-4 rounded-xl shadow-inner ${colorMap[item.icon] || 'bg-gray-400'}`}>
                                    {iconMap[item.icon] || <div className="w-6 h-6" />}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold text-lg text-gray-800">{item.activity}</p>
                                    <p className="text-sm text-gray-500">{item.details}</p>
                                </div>
                                <span className="text-sm font-medium text-gray-600 mr-2">{item.time}</span>
                                <div className="flex flex-col space-y-1">
                                    <button onClick={() => handleOpenModal(item)} className="text-xs text-blue-500 hover:underline">Edit</button>
                                    <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-500 hover:underline">Delete</button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 px-4 bg-gray-50 rounded-3xl">
                        <p className="text-gray-500">No routine items yet for {pet.name}.</p>
                        <p className="text-gray-400 text-sm mt-1">Tap '+' to add a task or generate an AI routine to start!</p>
                    </div>
                )}
            </div>

            <button onClick={() => handleOpenModal()} className="fixed bottom-28 right-6 bg-gradient-to-r from-[var(--secondary)] to-[#f89ac1] text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center text-4xl font-light hover:shadow-xl transition-transform transform hover:scale-110 hover:rotate-90 z-40">
                +
            </button>

            {isModalOpen && currentItem && (
                 <RoutineModal item={currentItem} onSave={handleSaveItem} onClose={handleCloseModal} />
            )}
        </div>
    );
};

const RoutineModal: React.FC<{item: RoutineItem, onSave: (item: RoutineItem) => void, onClose: () => void}> = ({ item, onSave, onClose }) => {
    const [formData, setFormData] = useState(item);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    };
    
    const inputClasses = "mt-1 block w-full bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm p-3 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-6 rounded-3xl shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-700">{item.activity ? 'Edit' : 'Add'} Routine Item</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Activity</label>
                        <input type="text" name="activity" value={formData.activity || ''} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input type="time" name="time" value={formData.time || ''} onChange={handleChange} className={inputClasses} required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Details</label>
                        <input type="text" name="details" value={formData.details || ''} onChange={handleChange} className={inputClasses} />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Icon</label>
                        <select name="icon" value={formData.icon || 'food'} onChange={handleChange} className={inputClasses}>
                            {Object.keys(iconMap).map(icon => <option key={icon} value={icon}>{icon.charAt(0).toUpperCase() + icon.slice(1)}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-gray-200/50 border border-gray-200">Cancel</button>
                        <button type="submit" className="py-2 px-5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors shadow-sm">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default Routine;