import React, { useState, useEffect, useRef } from 'react';
import type { PetProfile, ChatMessage } from '../types';
import { getPetAdvice } from '../services/geminiService';
import { SendIcon } from './icons/Icons';

interface ChatProps {
    pet: PetProfile;
}

const Chat: React.FC<ChatProps> = ({ pet }) => {
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
        <div className="p-6 h-[calc(100vh-8rem)] flex flex-col">
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-1">AI Assistant</h1>
                <p className="text-gray-500">Ask anything about your pet, {pet.name}.</p>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-white p-4 rounded-3xl shadow-lg mb-4 space-y-4">
                {chatHistory.length === 0 && (
                     <div className="text-center text-gray-400 p-8 flex flex-col justify-center items-center h-full">
                        <p className="font-semibold text-lg">How can I help you today?</p>
                        <p className="text-sm mt-2">Try asking "How much should I feed my puppy?" or "Why is my cat scratching the furniture?".</p>
                    </div>
                )}
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs md:max-w-md p-3 rounded-2xl text-base ${msg.role === 'user' ? 'bg-gradient-to-br from-[var(--primary)] to-[#80baf8] text-white rounded-br-lg' : 'bg-gray-100 text-gray-800 rounded-bl-lg'}`}>
                            {msg.parts[0].text.split('\n').map((line, i) => <p key={i}>{line}</p>)}
                        </div>
                    </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 rounded-2xl bg-gray-100 text-gray-800 rounded-bl-lg">
                      <div className="flex items-center space-x-1">
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
            </div>

            <div className="flex items-center space-x-2 bg-white p-2 rounded-full shadow-lg border border-gray-100">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask about your pet..."
                    className="flex-grow p-3 bg-transparent border-none rounded-full focus:outline-none"
                    disabled={isLoading}
                />
                <button 
                    onClick={handleSend} 
                    disabled={isLoading || !input.trim()} 
                    className="bg-gradient-to-r from-[var(--secondary)] to-[#f89ac1] text-white font-bold p-3 rounded-full hover:shadow-lg transition-all duration-300 disabled:from-gray-300 disabled:to-gray-400 transform hover:scale-110"
                >
                    <SendIcon className="w-5 h-5" />
                </button>
            </div>
        </div>
    );
};

export default Chat;