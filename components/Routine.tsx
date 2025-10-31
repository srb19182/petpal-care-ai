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
const colorMap: { [key: string]: string } = {
    food: 'bg-[#FFD166]',
    water: 'bg-[#A2D2FF]',
    walk: 'bg-[#B8E0D2]',
    medicine: 'bg-[#FFC8DD]',
    sleep: 'bg-gray-400',
}

const Routine: React.FC<RoutineProps> = ({ pet }) => {
    const [routine, setRoutine] = useState<RoutineItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState<RoutineItem | null>(null);

    useEffect(() => {
        const savedRoutines = JSON.parse(localStorage.getItem('routines') || '{}');
        setRoutine(savedRoutines[pet.id] || []);
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
        <div className="p-6 pb-24">
            <h1 className="text-3xl font-bold mb-2">Daily Routine</h1>
            <p className="text-gray-500 mb-6">A plan to keep {pet.name} happy and healthy.</p>

            <div className="bg-white p-6 rounded-2xl shadow-md mb-6">
                <h2 className="text-xl font-semibold mb-1">Smart Routine Planner</h2>
                <p className="text-sm text-gray-500 mb-4">AI + You: The perfect team</p>
                <div className="flex justify-between items-center text-sm mb-4">
                    <span><span className="font-semibold">Breed:</span> {pet.breed}</span>
                    <span><span className="font-semibold">Age:</span> {pet.age}</span>
                    <span><span className="font-semibold">Weight:</span> {pet.weight}</span>
                </div>
                <button
                    onClick={handleGenerateRoutine}
                    disabled={isLoading}
                    className="w-full bg-[#A2D2FF] text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-500 transition-colors disabled:bg-gray-300"
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
                            <div key={item.id} className="bg-white p-4 rounded-2xl shadow-md flex items-center space-x-4">
                                <div className={`p-3 rounded-full ${colorMap[item.icon] || 'bg-gray-400'}`}>
                                    {iconMap[item.icon] || <div className="w-6 h-6" />}
                                </div>
                                <div className="flex-grow">
                                    <p className="font-semibold">{item.activity}</p>
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
                    <div className="text-center py-8 px-4 bg-gray-50 rounded-2xl">
                        <p className="text-gray-500">No routine items yet for {pet.name}.</p>
                        <p className="text-gray-400 text-sm">Tap '+' to add a task or generate an AI routine to start!</p>
                    </div>
                )}
            </div>

            <button onClick={() => handleOpenModal()} className="fixed bottom-24 right-6 bg-[#FFC8DD] text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-3xl font-bold hover:bg-pink-400 transition-transform transform hover:scale-110 z-40">
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

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-white p-6 rounded-2xl shadow-xl w-11/12 max-w-md">
                <h2 className="text-xl font-bold mb-4">{item.activity ? 'Edit' : 'Add'} Routine Item</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Activity</label>
                        <input type="text" name="activity" value={formData.activity || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#A2D2FF] focus:border-[#A2D2FF]" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Time</label>
                        <input type="time" name="time" value={formData.time || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#A2D2FF] focus:border-[#A2D2FF]" required />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Details</label>
                        <input type="text" name="details" value={formData.details || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#A2D2FF] focus:border-[#A2D2FF]" />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Icon</label>
                        <select name="icon" value={formData.icon || 'food'} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-[#A2D2FF] focus:border-[#A2D2FF]">
                            {Object.keys(iconMap).map(icon => <option key={icon} value={icon}>{icon.charAt(0).toUpperCase() + icon.slice(1)}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">Cancel</button>
                        <button type="submit" className="py-2 px-4 bg-[#A2D2FF] text-white rounded-lg hover:bg-blue-500">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default Routine;