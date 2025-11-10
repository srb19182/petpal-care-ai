import React, { useState, useRef, ChangeEvent, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { analyzePetHealth, simplifyText } from '../services/geminiService';
import type { HealthScanResult, Reminder, PetProfile } from '../types';
import { CameraIcon } from './icons/Icons';

const weightData = [
  { name: 'Jan', weight: 25 }, { name: 'Feb', weight: 25.5 }, { name: 'Mar', weight: 26 },
  { name: 'Apr', weight: 26.2 }, { name: 'May', weight: 27 }, { name: 'Jun', weight: 28 },
];
const activityData = [
  { name: 'Jan', level: 8 }, { name: 'Feb', level: 8.5 }, { name: 'Mar', level: 9 },
  { name: 'Apr', level: 8.7 }, { name: 'May', level: 9.2 }, { name: 'Jun', level: 9.5 },
];

interface HealthProps {
    pet: PetProfile;
}

const Health: React.FC<HealthProps> = ({ pet }) => {
    const [activeTab, setActiveTab] = useState('Scan');
    
    return (
        <div className="p-6 pb-28">
            <h1 className="text-3xl font-bold mb-6">Health Tracker</h1>
            <div className="bg-gray-100 p-1.5 rounded-full flex space-x-2 mb-6">
                <TabButton name="Scan" activeTab={activeTab} setActiveTab={setActiveTab} color="var(--primary)" />
                <TabButton name="Dashboard" activeTab={activeTab} setActiveTab={setActiveTab} color="var(--primary)" />
                <TabButton name="Reminders" activeTab={activeTab} setActiveTab={setActiveTab} color="var(--primary)" />
            </div>
            <div className="animate-fade-in">
                {activeTab === 'Scan' && <AIScan pet={pet} />}
                {activeTab === 'Dashboard' && <Dashboard />}
                {activeTab === 'Reminders' && <Reminders pet={pet} />}
            </div>
        </div>
    );
};

const TabButton: React.FC<{name: string, activeTab: string, setActiveTab: (name: string) => void, color: string}> = ({ name, activeTab, setActiveTab, color }) => (
    <button 
        onClick={() => setActiveTab(name)}
        className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 focus:outline-none ${activeTab === name ? 'bg-white shadow-md' : 'text-gray-500'}`}
        style={{ color: activeTab === name ? color : '' }}
    >
        {name}
    </button>
);


const usePetHealthData = (petId: string) => {
    const [healthData, setHealthData] = useState<{ result: HealthScanResult | null, previousResult: HealthScanResult | null }>({ result: null, previousResult: null });

    useEffect(() => {
        const allHealthData = JSON.parse(localStorage.getItem('healthData') || '{}');
        setHealthData(allHealthData[petId] || { result: null, previousResult: null });
    }, [petId]);

    const updateHealthData = (newResult: HealthScanResult) => {
        setHealthData(prev => {
            const updatedData = { result: newResult, previousResult: prev.result };
            const allHealthData = JSON.parse(localStorage.getItem('healthData') || '{}');
            allHealthData[petId] = updatedData;
            localStorage.setItem('healthData', JSON.stringify(allHealthData));
            return updatedData;
        });
    };

    return { healthData, updateHealthData };
};


const AIScan: React.FC<{ pet: PetProfile }> = ({ pet }) => {
    const [image, setImage] = useState<string | null>(null);
    const { healthData, updateHealthData } = usePetHealthData(pet.id);
    const { result, previousResult } = healthData;
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isSimpleMode, setIsSimpleMode] = useState(false);
    const [simpleExplanation, setSimpleExplanation] = useState<string | null>(null);
    const [isSimplifying, setIsSimplifying] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    useEffect(() => {
      setImage(null);
      // Reset other states if needed when pet changes
    }, [pet.id]);

    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setError(null);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleScan = async () => {
        if (!image) return;
        setIsLoading(true);
        setError(null);
        setSimpleExplanation(null);
        setIsSimpleMode(false);
        setShowComparison(false);
        try {
            const base64Data = image.split(',')[1];
            const mimeType = image.split(';')[0].split(':')[1];
            const response = await analyzePetHealth(base64Data, mimeType, pet.species);
            const scanResult = JSON.parse(response.text);
            updateHealthData(scanResult);
        } catch (err) {
            setError('Failed to analyze the image. Please try again.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleToggleSimpleMode = async (enabled: boolean) => {
        setIsSimpleMode(enabled);
        if (enabled && result && !simpleExplanation) {
            setIsSimplifying(true);
            try {
                const response = await simplifyText(result.analysis);
                setSimpleExplanation(response.text);
            } catch (err) {
                console.error("Failed to simplify text", err);
                setSimpleExplanation("Could not simplify the explanation.");
            } finally {
                setIsSimplifying(false);
            }
        }
    };

    const statusMap: { [key: string]: { color: string; bgColor: string; emoji: string } } = {
        Normal: { color: 'text-green-600', bgColor: 'bg-green-100', emoji: '🟢' },
        Caution: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', emoji: '🟡' },
        Alert: { color: 'text-red-600', bgColor: 'bg-red-100', emoji: '🔴' },
    };
    
    const currentStatus = result ? statusMap[result.status] : null;

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">AI Health Scan for {pet.name}</h2>
            
            <div 
                className="w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 mb-4 cursor-pointer hover:border-[var(--primary)] transition-colors"
                onClick={() => fileInputRef.current?.click()}
            >
                {image ? <img src={image} alt="Pet preview" className="object-cover h-full w-full rounded-2xl" /> : 
                <div className="text-center text-gray-400">
                    <CameraIcon />
                    <p className="text-gray-500 mt-2 font-semibold">Tap to upload a photo</p>
                    <p className="text-sm text-gray-400">Let's check on your {pet.species.toLowerCase()}</p>
                </div>}
            </div>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <button onClick={handleScan} disabled={!image || isLoading} className="w-full bg-gradient-to-r from-[var(--primary)] to-[#80baf8] text-white font-bold py-3 rounded-xl hover:shadow-xl transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 transform hover:scale-105">
                {isLoading ? 'Scanning...' : `Scan ${pet.name}'s Health`}
            </button>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            
            {result && currentStatus && (
                <div className="mt-6 p-4 bg-gray-50 rounded-2xl animate-fade-in">
                    <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-lg">Scan Results</h3>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${currentStatus.bgColor} ${currentStatus.color}`}>{currentStatus.emoji} {result.status}</span>
                    </div>
                    <p className="text-gray-600"><span className="font-semibold">Health Score:</span> <span className={`font-bold ${currentStatus.color}`}>{result.score}/100</span></p>
                    
                    <div className="flex items-center justify-between mt-4">
                        <h4 className="font-semibold">AI Analysis:</h4>
                         <label htmlFor="simple-mode" className="flex items-center cursor-pointer">
                            <span className="text-sm text-gray-600 mr-2">Simple Explanation</span>
                            <div className="relative">
                                <input id="simple-mode" type="checkbox" className="sr-only" checked={isSimpleMode} onChange={(e) => handleToggleSimpleMode(e.target.checked)} />
                                <div className={`block w-12 h-7 rounded-full transition-colors ${isSimpleMode ? 'bg-[var(--primary)]' : 'bg-gray-200'}`}></div>
                                <div className={`dot absolute left-1 top-1 bg-white w-5 h-5 rounded-full transition-transform ${isSimpleMode ? 'transform translate-x-5' : ''}`}></div>
                            </div>
                        </label>
                    </div>

                    <p className="text-gray-700 mt-1 p-3 bg-white rounded-lg text-sm">
                        {isSimpleMode ? (isSimplifying ? 'Simplifying...' : simpleExplanation) : result.analysis}
                    </p>

                    <h4 className="font-semibold mt-4">Recommendations:</h4>
                    <ul className="list-disc list-inside text-gray-700 mt-1 space-y-1 p-3 bg-white rounded-lg text-sm">
                        {result.recommendations.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>

                    {previousResult && (
                        <button onClick={() => setShowComparison(!showComparison)} className="mt-4 w-full text-center py-2 bg-blue-100 text-blue-700 font-semibold rounded-lg hover:bg-blue-200 transition-colors">
                           {showComparison ? 'Hide Comparison' : 'Compare to Last Scan'}
                        </button>
                    )}

                    {showComparison && previousResult && (
                         <div className="mt-4 p-4 border-t border-gray-200 animate-fade-in">
                            <h4 className="font-bold text-md mb-2">Comparison with Last Scan</h4>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <p className="font-semibold text-gray-500">Previous Score</p>
                                    <p className="font-bold text-lg">{previousResult.score}/100 ({previousResult.status})</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-500">Current Score</p>
                                    <p className="font-bold text-lg">{result.score}/100 ({result.status})</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Dashboard: React.FC = () => {
    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Health Dashboard</h2>
            <div className="mb-8">
                <h3 className="font-semibold mb-2">Weight Trend (kg)</h3>
                <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={weightData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                        <XAxis dataKey="name" stroke="#a0a0a0" />
                        <YAxis stroke="#a0a0a0"/>
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="weight" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5, fill: 'var(--primary)' }} activeDot={{ r: 8, stroke: 'var(--primary)', fill: '#fff' }}/>
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div>
                <h3 className="font-semibold mb-2">Activity Level (1-10)</h3>
                 <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={activityData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#a0a0a0" />
                        <YAxis stroke="#a0a0a0" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="level" stroke="var(--accent)" strokeWidth={3} dot={{ r: 5, fill: 'var(--accent)' }} activeDot={{ r: 8, stroke: 'var(--accent)', fill: '#fff' }} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <button onClick={() => window.print()} className="mt-6 w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors">
                Export as PDF
            </button>
        </div>
    );
};

const Reminders: React.FC<{ pet: PetProfile }> = ({ pet }) => {
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        const allReminders: Reminder[] = JSON.parse(localStorage.getItem('reminders') || '[]');
        setReminders(allReminders.filter(r => r.petId === pet.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    }, [pet.id]);
    
    const handleSave = (reminder: Reminder) => {
        const allReminders: Reminder[] = JSON.parse(localStorage.getItem('reminders') || '[]');
        const existingIndex = allReminders.findIndex(r => r.id === reminder.id);

        if (existingIndex > -1) {
            allReminders[existingIndex] = reminder;
        } else {
            allReminders.push(reminder);
        }
        localStorage.setItem('reminders', JSON.stringify(allReminders));
        setReminders(allReminders.filter(r => r.petId === pet.id).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setIsModalOpen(false);
    };

    const handleDelete = (reminderId: string) => {
        const allReminders: Reminder[] = JSON.parse(localStorage.getItem('reminders') || '[]');
        const updatedReminders = allReminders.filter(r => r.id !== reminderId);
        localStorage.setItem('reminders', JSON.stringify(updatedReminders));
        setReminders(updatedReminders.filter(r => r.petId === pet.id));
    };

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Reminders for {pet.name}</h2>
            <div className="space-y-3">
                {reminders.length > 0 ? reminders.map(r => (
                    <div key={r.id} className="p-4 bg-blue-50 rounded-xl flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{r.title}</p>
                            <p className="text-sm text-blue-600">{new Date(r.date).toDateString()} at {r.time}</p>
                        </div>
                        <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600 text-xs">Delete</button>
                    </div>
                )) : <p className="text-gray-500 text-sm text-center py-4">No reminders set for {pet.name}.</p>}
            </div>
             <button onClick={() => setIsModalOpen(true)} className="mt-6 w-full bg-gray-200 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-300 transition-colors">
                + Add New Reminder
            </button>
            {isModalOpen && <ReminderModal pet={pet} onSave={handleSave} onClose={() => setIsModalOpen(false)} />}
        </div>
    );
};

const ReminderModal: React.FC<{pet: PetProfile, onSave: (reminder: Reminder) => void, onClose: () => void}> = ({ pet, onSave, onClose }) => {
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [frequency, setFrequency] = useState<'none' | 'daily' | 'weekly'>('none');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: crypto.randomUUID(), petId: pet.id, title, date, time, frequency });
    };

    const inputClasses = "mt-1 block w-full bg-white/60 backdrop-blur-sm border border-gray-300/50 rounded-lg shadow-sm p-3 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition";

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="bg-gradient-to-br from-blue-50 to-pink-50 p-6 rounded-3xl shadow-xl w-full max-w-md">
                <h2 className="text-xl font-bold mb-4 text-gray-700">New Reminder</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClasses} required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-sm font-medium text-gray-700">Date</label>
                           <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputClasses} required />
                        </div>
                        <div>
                           <label className="block text-sm font-medium text-gray-700">Time</label>
                           <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputClasses} required />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Frequency</label>
                        <select value={frequency} onChange={e => setFrequency(e.target.value as any)} className={inputClasses}>
                            <option value="none">One Time</option>
                            <option value="daily">Daily</option>
                            <option value="weekly">Weekly</option>
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

export default Health;