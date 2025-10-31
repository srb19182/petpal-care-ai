import React, { useState, useEffect, useRef } from 'react';
import type { PetProfile, ChatMessage } from '../types';
import { getPetAdvice } from '../services/geminiService';

interface ChatProps {
    pet: PetProfile;
}

const Chat: React.FC<ChatProps> = ({ pet }) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Reset chat when pet changes
        setChatHistory([]);
    }, [pet.id]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', parts: [{ text: input }] };
        const newHistory = [...chatHistory, userMessage];
        setChatHistory(newHistory);
        setInput('');
        setIsLoading(true);

        try {
            const response = await getPetAdvice(input, chatHistory, pet);
            const modelMessage: ChatMessage = { role: 'model', parts: [{ text: response.text }] };
            setChatHistory([...newHistory, modelMessage]);
        } catch (err) {
            console.error(err);
            const errorMessage: ChatMessage = { role: 'model', parts: [{ text: "Sorry, I couldn't get a response. Please try again." }] };
            setChatHistory([...newHistory, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-6 h-full flex flex-col">
            <h1 className="text-3xl font-bold mb-2">AI Assistant</h1>
            <p className="text-gray-500 mb-6">Ask anything about your pet, {pet.name}.</p>
            
            <div className="flex-grow overflow-y-auto bg-white p-4 rounded-2xl shadow-md mb-4 space-y-4">
                {chatHistory.length === 0 && (
                     <div className="text-center text-gray-400 pt-10">
                        <p>Ask questions like "How much should I feed my puppy?" or "Why is my cat scratching the furniture?".</p>
                    </div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl ${msg.role === 'user' ? 'bg-[#A2D2FF] text-white' : 'bg-gray-200 text-gray-800'}`}>
                            {msg.parts[0].text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ))}
                {isLoading && <div className="flex justify-start"><div className="p-3 rounded-2xl bg-gray-200">...</div></div>}
                <div ref={chatEndRef} />
            </div>
            <div className="flex space-x-2">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your pet..."
                    className="flex-grow p-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#A2D2FF]"
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading || !input.trim()} className="bg-[#FFC8DD] text-white font-bold p-3 rounded-xl hover:bg-pink-400 disabled:bg-gray-300">Send</button>
            </div>
        </div>
    );
};

export default Chat;
