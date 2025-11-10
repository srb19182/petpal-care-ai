import React, { useState, useMemo } from 'react';
import type { PetProfile } from '../types';
import { DogIcon, CatIcon } from './icons/Icons';

interface ProfileProps {
    pets: PetProfile[];
    setPets: React.Dispatch<React.SetStateAction<PetProfile[]>>;
    currentPetId: string | null;
    setCurrentPetId: (id: string) => void;
}

const Profile: React.FC<ProfileProps> = ({ pets, setPets, currentPetId, setCurrentPetId }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [petToEdit, setPetToEdit] = useState<Partial<PetProfile> | null>(null);

    const currentPet = useMemo(() => pets.find(p => p.id === currentPetId), [pets, currentPetId]);

    const handleAddPet = () => {
        setPetToEdit({
            avatar: `https://picsum.photos/seed/${crypto.randomUUID()}/200`
        });
        setIsModalOpen(true);
    };

    const handleEditPet = (pet: PetProfile) => {
        setPetToEdit(pet);
        setIsModalOpen(true);
    };

    const handleDeletePet = (petId: string) => {
        if (confirm('Are you sure you want to delete this pet profile? This action cannot be undone.')) {
            setPets(prev => prev.filter(p => p.id !== petId));
            if (currentPetId === petId) {
                const remainingPets = pets.filter(p => p.id !== petId);
                setCurrentPetId(remainingPets.length > 0 ? remainingPets[0].id : '');
            }
            const routines = JSON.parse(localStorage.getItem('routines') || '{}');
            delete routines[petId];
            localStorage.setItem('routines', JSON.stringify(routines));
            const healthData = JSON.parse(localStorage.getItem('healthData') || '{}');
            delete healthData[petId];
            localStorage.setItem('healthData', JSON.stringify(healthData));
        }
    };
    
    const handleSavePet = (petData: PetProfile) => {
        setPets(prev => {
            const existing = prev.find(p => p.id === petData.id);
            if (existing) {
                return prev.map(p => p.id === petData.id ? petData : p);
            }
            const newPet = { ...petData, id: petData.id || crypto.randomUUID() };
            if (!currentPetId) {
                setCurrentPetId(newPet.id);
            }
            return [...prev, newPet];
        });
        setIsModalOpen(false);
        setPetToEdit(null);
    };

    return (
        <div className="p-6 pb-28">
            <h1 className="text-3xl font-bold mb-6 text-center">{currentPet ? `${currentPet.name}'s Profile` : 'My Pets'}</h1>
            
            {pets.length > 0 && (
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-600 mb-3 text-center">Switch Pet</h2>
                    <div className="flex items-center justify-center space-x-4 overflow-x-auto pb-2">
                        {pets.map(pet => (
                            <div key={pet.id} className="text-center flex-shrink-0 group" onClick={() => setCurrentPetId(pet.id)}>
                                <img 
                                    src={pet.avatar} 
                                    alt={pet.name} 
                                    className={`w-20 h-20 rounded-full border-4 object-cover shadow-lg cursor-pointer transition-all duration-300 transform group-hover:scale-110 ${pet.id === currentPetId ? 'border-[var(--primary)] scale-110' : 'border-transparent'}`} 
                                />
                                <p className={`mt-2 text-sm font-semibold transition-colors duration-300 ${pet.id === currentPetId ? 'text-gray-800' : 'text-gray-500 group-hover:text-gray-700'}`}>{pet.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {currentPet ? (
                <>
                    <div className="bg-white p-6 rounded-3xl shadow-lg">
                        <InfoRow label="Name" value={currentPet.name} />
                        <InfoRow label="Species" value={currentPet.species} />
                        <InfoRow label="Breed" value={currentPet.breed} />
                        <InfoRow label="Age" value={currentPet.age} />
                        <InfoRow label="Weight" value={currentPet.weight} />
                        <InfoRow label="Birthday" value={currentPet.birthday.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} />
                         <InfoRow label="Vaccination Info" value={currentPet.vaccinationInfo || 'Not set'} />
                    </div>
                     <div className="mt-6 space-y-3">
                        <button onClick={() => handleEditPet(currentPet)} className="w-full text-center py-3 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-blue-400 transition-colors shadow-sm">
                            Edit Profile
                        </button>
                        <button onClick={() => handleDeletePet(currentPet.id)} className="w-full text-center py-3 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition-colors">
                            Delete Pet
                        </button>
                    </div>
                </>
            ) : (
                <div className="text-center py-10 px-4 bg-gray-50 rounded-3xl">
                    <p className="text-gray-600 font-semibold mb-2">Welcome to PetPal! 🐾</p>
                    <p className="text-gray-500 text-sm">Add your first furry friend to get started.</p>
                </div>
            )}
             <div className="mt-6">
                <button onClick={handleAddPet} className="w-full text-center py-3 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition-colors">
                    + Add a New Pet
                </button>
            </div>
             {isModalOpen && (
                <PetModal pet={petToEdit} onSave={handleSavePet} onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string; }> = ({ label, value }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
        <p className="text-gray-500">{label}</p>
        <p className="font-semibold text-right">{value}</p>
    </div>
);

const PetModal: React.FC<{pet: Partial<PetProfile> | null, onSave: (pet: PetProfile) => void, onClose: () => void}> = ({ pet, onSave, onClose }) => {
    const [formData, setFormData] = useState<Partial<PetProfile> | null>(pet);
    const [step, setStep] = useState(pet?.id ? 'form' : (pet?.species ? 'form' : 'selection'));

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, birthday: new Date(e.target.value) }));
    };

    const handleSelectSpecies = (species: 'Dog' | 'Cat') => {
        setFormData(prev => ({ ...prev, species }));
        setStep('form');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as PetProfile);
    };
    
    const inputClasses = "mt-1 block w-full bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm p-3 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition";

    if (step === 'selection') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-6 rounded-3xl shadow-xl w-full max-w-md">
                    <h2 className="text-2xl font-bold mb-2 text-center text-gray-700">Let’s meet your furry friend 🐾</h2>
                    <p className="text-center text-gray-500 mb-6">What kind of pet are you adding?</p>
                    <div className="grid grid-cols-1 gap-4">
                         <button
                            onClick={() => handleSelectSpecies('Dog')}
                            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-blue-100 border-blue-200 text-blue-600 hover:border-blue-400">
                            <DogIcon className="w-16 h-16 mb-2" />
                            <span className="font-bold text-xl">Add a Dog</span>
                        </button>
                        <button
                            onClick={() => handleSelectSpecies('Cat')}
                            className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 transform hover:scale-105 hover:shadow-lg bg-pink-100 border-pink-200 text-pink-600 hover:border-pink-400">
                            <CatIcon className="w-16 h-16 mb-2" />
                            <span className="font-bold text-xl">Add a Cat</span>
                        </button>
                    </div>
                     <div className="text-center mt-6">
                        <button type="button" onClick={onClose} className="py-2 px-5 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-gray-200/50 border border-gray-200">Cancel</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-6 rounded-3xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-1 text-center text-gray-700">{pet?.id ? 'Edit Pet' : `New ${formData?.species || 'Pet'}`}</h2>
                <p className="text-center text-gray-500 mb-6">Healthy pets, happy hearts 💖</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                     <div className="flex justify-center">
                        <img src={formData?.avatar} alt="Pet Avatar" className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"/>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Name</label>
                        <input type="text" name="name" value={formData?.name || ''} onChange={handleChange} className={inputClasses} required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Breed</label>
                        <input type="text" name="breed" value={formData?.breed || ''} onChange={handleChange} className={inputClasses} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Age</label>
                            <input type="text" name="age" value={formData?.age || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., 2 years" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Weight</label>
                            <input type="text" name="weight" value={formData?.weight || ''} onChange={handleChange} className={inputClasses} placeholder="e.g., 15 kg"/>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Birthday</label>
                        <input type="date" name="birthday" value={formData?.birthday ? new Date(formData.birthday).toISOString().split('T')[0] : ''} onChange={handleDateChange} className={inputClasses} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Vaccination Info</label>
                        <textarea name="vaccinationInfo" value={formData?.vaccinationInfo || ''} onChange={handleChange} className={inputClasses} rows={2}></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-4">
                        <button type="button" onClick={() => pet?.id || !pet?.species ? onClose() : setStep('selection')} className="py-2 px-5 bg-white/80 backdrop-blur-sm text-gray-700 rounded-lg hover:bg-gray-200/50 border border-gray-200">
                           { pet?.id ? 'Cancel' : 'Back'}
                        </button>
                        <button type="submit" className="py-2 px-5 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-blue-400 transition-colors shadow-sm">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default Profile;