import React, { useState, useCallback, useEffect } from 'react';
import type { CommunityPost, Vet } from '../types';
import { findNearbyVets } from '../services/geminiService';

const mockPosts: CommunityPost[] = [
    { id: 1, author: 'Jane Doe', avatar: 'https://picsum.photos/seed/jane/100', image: 'https://picsum.photos/seed/pet1/400', caption: 'Buddy enjoying the sunshine! ☀️', likes: 125 },
    { id: 2, author: 'John Smith', avatar: 'https://picsum.photos/seed/john/100', image: 'https://picsum.photos/seed/pet2/400', caption: 'My sleepy cat, Mittens.', likes: 230 },
];

const Community: React.FC = () => {
    const [activeTab, setActiveTab] = useState('Feed');

    return (
        <div className="p-6 pb-28">
            <h1 className="text-3xl font-bold mb-6">Community Hub</h1>
             <div className="bg-gray-100 p-1.5 rounded-full flex space-x-2 mb-6">
                <TabButton name="Feed" activeTab={activeTab} setActiveTab={setActiveTab} color="var(--accent)"/>
                <TabButton name="Vet Finder" activeTab={activeTab} setActiveTab={setActiveTab} color="var(--accent)"/>
            </div>
            <div className="animate-fade-in">
                {activeTab === 'Feed' && <Feed />}
                {activeTab === 'Vet Finder' && <VetFinder />}
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

const Feed: React.FC = () => (
    <div className="space-y-6">
        {mockPosts.map(post => (
            <div key={post.id} className="bg-white rounded-3xl shadow-lg overflow-hidden transition-shadow hover:shadow-xl">
                <div className="p-4 flex items-center space-x-3">
                    <img src={post.avatar} alt={post.author} className="w-10 h-10 rounded-full" />
                    <span className="font-semibold">{post.author}</span>
                </div>
                <img src={post.image} alt="Pet post" className="w-full h-auto" />
                <div className="p-4">
                    <p className="mb-2 text-gray-700">{post.caption}</p>
                    <div className="flex items-center text-red-400">
                        <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path></svg>
                        <span>{post.likes}</span>
                    </div>
                </div>
            </div>
        ))}
    </div>
);


const VetFinder: React.FC = () => {
    const [vets, setVets] = useState<Vet[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);

    const handleFindVets = useCallback(async () => {
        if (!location) {
             setError('Please enable location services to find nearby vets.');
             return;
        }
        setIsLoading(true);
        setError(null);
        try {
            const response = await findNearbyVets(location.lat, location.lon);
            const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
            if (groundingChunks) {
                const foundVets = groundingChunks
                    .filter((chunk: any) => chunk.maps)
                    .map((chunk: any) => ({
                        title: chunk.maps.title,
                        uri: chunk.maps.uri
                    }));
                setVets(foundVets);
            } else {
                setVets([]);
                setError("Could not find any vets nearby based on the AI's response.");
            }
        } catch (err) {
            setError('An error occurred while searching for vets.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [location]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lon: position.coords.longitude,
                });
                setError(null);
            },
            () => {
                setError('Geolocation is not supported or permission was denied.');
            }
        );
    }, []);

    return (
        <div className="bg-white p-6 rounded-3xl shadow-lg">
            <h2 className="text-xl font-semibold mb-2">Nearby Vet Finder</h2>
            <p className="text-gray-500 mb-4 text-sm">Let our AI find the best vets near you based on your location.</p>
            <button onClick={handleFindVets} disabled={isLoading || !location} className="w-full bg-gradient-to-r from-[var(--accent)] to-[#8ac9b8] text-white font-bold py-3 rounded-xl hover:shadow-xl transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 transform hover:scale-105">
                {isLoading ? 'Searching...' : 'Find Vets Now'}
            </button>
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
            {vets.length > 0 && (
                <div className="mt-6 space-y-3">
                    <h3 className="font-semibold">Top Vets Near You:</h3>
                    {vets.map((vet, index) => (
                        <a href={vet.uri} key={index} target="_blank" rel="noopener noreferrer" className="block p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors">
                            <p className="font-semibold text-green-800">{vet.title}</p>
                            <p className="text-sm text-green-600">Click to view on map</p>
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Community;