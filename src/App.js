import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  MessageCircle,
  Settings,
  RefreshCw,
  Bot,
  User,
  Moon,
  Sun,
  Sparkles,
  BookOpen,
  GraduationCap,
  FileText,
  BarChart2,
  Save,
  Download,
  Star,
} from "lucide-react";

const GeminiChatbot = () => {
  // Embedded API key (replace with your actual key)
  const GEMINI_API_KEY = "AIzaSyC1rqJNrVASpS60cW3IMBoIUZeJWpCavEs";
  
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content: "Hello! I'm your Academic Assistant. I can help with homework, study tips, and simplify complex texts for young learners. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [darkMode, setDarkMode] = useState(false);
  const [apiError, setApiError] = useState("");
  
  // Text Simplification States
  const [complexText, setComplexText] = useState("");
  const [simplifiedText, setSimplifiedText] = useState("");
  const [simplificationLevel, setSimplificationLevel] = useState("grade3"); // Default to 3rd grade
  const [simplificationHistory, setSimplificationHistory] = useState([]);
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  
  // Dataset Management
  const [dataset, setDataset] = useState([]);
  const [showDataset, setShowDataset] = useState(false);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load dataset from localStorage on mount
  useEffect(() => {
    const savedDataset = localStorage.getItem("simplificationDataset");
    if (savedDataset) {
      setDataset(JSON.parse(savedDataset));
    }
  }, []);

  // Save dataset to localStorage whenever it changes
  useEffect(() => {
    if (dataset.length > 0) {
      localStorage.setItem("simplificationDataset", JSON.stringify(dataset));
    }
  }, [dataset]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = { id: Date.now(), type: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);
    setApiError("");
    
    try {
      const response = await getGeminiResponse(input);
      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: response || "I'm sorry, I couldn't generate a response. Please try again later.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error:", error);
      setApiError(error.message || "Failed to connect to Gemini API");
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          type: "bot",
          content: "I'm experiencing technical difficulties. Please try again later.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const getGeminiResponse = async (query) => {
    const prompt = `You are an Academic Assistant AI designed to help students and parents with educational matters. 
    Provide helpful, accurate information about homework, study strategies, academic subjects, college applications, 
    educational resources, and learning techniques. Always be encouraging and supportive.
    
    Question: "${query}"`;
    
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 800,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("API Error:", errorData);
        throw new Error(errorData.error?.message || "API request failed");
      }
      
      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from API");
      }
      
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Fetch Error:", error);
      throw new Error(error.message || "Failed to fetch from Gemini API");
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        type: "bot",
        content: "Chat cleared. I'm here to help with your academic questions. What would you like to know?",
      },
    ]);
  };

  // Text Simplification Function
  const simplifyText = async () => {
    if (!complexText.trim()) return;
    
    setIsThinking(true);
    setApiError("");
    setSimplifiedText("");
    
    try {
      const levelDescriptions = {
        grade1: "1st grade (ages 6-7)",
        grade2: "2nd grade (ages 7-8)",
        grade3: "3rd grade (ages 8-9)",
        grade4: "4th grade (ages 9-10)",
        grade5: "5th grade (ages 10-11)",
      };
      
      const prompt = `You are an expert text simplification AI for primary education. Your task is to simplify the following text to make it appropriate for ${levelDescriptions[simplificationLevel]} students.
      
      Instructions:
      1. Use simple vocabulary appropriate for the grade level
      2. Break down complex sentences into shorter ones
      3. Explain difficult concepts using analogies familiar to children
      4. Maintain the original meaning and key information
      5. Use an encouraging, friendly tone
      6. Keep paragraphs short (2-3 sentences maximum)
      7. Avoid jargon and technical terms unless necessary, and explain them if needed
      
      Original text: "${complexText}"
      
      Simplified text:`;
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.3, // Lower temperature for more consistent simplification
              topK: 20,
              topP: 0.9,
              maxOutputTokens: 1000,
            },
          }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "API request failed");
      }
      
      const data = await response.json();
      if (!data.candidates || data.candidates.length === 0) {
        throw new Error("No response from API");
      }
      
      const simplified = data.candidates[0].content.parts[0].text;
      setSimplifiedText(simplified);
      
      // Add to history
      const newEntry = {
        id: Date.now(),
        original: complexText,
        simplified: simplified,
        level: simplificationLevel,
        timestamp: new Date().toISOString(),
      };
      
      setSimplificationHistory(prev => [newEntry, ...prev.slice(0, 9)]); // Keep last 10
      
      // Add to dataset if rated
      if (rating > 0) {
        setDataset(prev => [...prev, {...newEntry, rating, feedback}]);
      }
      
    } catch (error) {
      console.error("Simplification Error:", error);
      setApiError(error.message || "Failed to simplify text");
    } finally {
      setIsThinking(false);
    }
  };

  const saveToDataset = () => {
    if (!simplifiedText || rating === 0) {
      setApiError("Please provide a rating before saving to dataset");
      return;
    }
    
    const newEntry = {
      id: Date.now(),
      original: complexText,
      simplified: simplifiedText,
      level: simplificationLevel,
      rating,
      feedback,
      timestamp: new Date().toISOString(),
    };
    
    setDataset(prev => [...prev, newEntry]);
    setApiError("Saved to dataset successfully!");
    setRating(0);
    setFeedback("");
  };

  const downloadDataset = () => {
    const dataStr = JSON.stringify(dataset, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'simplification_dataset.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <div className={`flex h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"}`}>
      {/* Sidebar */}
      <div className={`w-64 ${darkMode ? "bg-gray-800" : "bg-white"} shadow-md p-4 flex flex-col`}>
        <div className="flex items-center mb-8">
          <div className="bg-blue-500 p-2 rounded-lg mr-3">
            <GraduationCap size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold">Academic Assistant</h1>
        </div>
        
        <nav className="space-y-2 mb-8">
          {[
            { id: "chat", label: "Chat", icon: MessageCircle },
            { id: "simplify", label: "Simplify Text", icon: FileText },
            { id: "dataset", label: "Dataset", icon: BarChart2 },
            { id: "settings", label: "About", icon: BookOpen },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 w-full px-4 py-3 rounded-lg transition ${
                activeTab === tab.id
                  ? darkMode 
                    ? "bg-blue-600 text-white" 
                    : "bg-blue-100 text-blue-700"
                  : darkMode 
                    ? "text-gray-300 hover:bg-gray-700" 
                    : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-auto">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`flex items-center space-x-2 w-full px-4 py-3 rounded-lg transition ${
              darkMode ? "bg-gray-700 text-yellow-300" : "bg-gray-200 text-gray-700"
            }`}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className={`${darkMode ? "bg-gray-800" : "bg-white"} shadow px-6 py-4 flex items-center justify-between`}>
          <div className="flex items-center">
            {activeTab === "chat" && <BookOpen className="text-blue-500 mr-2" size={20} />}
            {activeTab === "simplify" && <FileText className="text-blue-500 mr-2" size={20} />}
            {activeTab === "dataset" && <BarChart2 className="text-blue-500 mr-2" size={20} />}
            {activeTab === "settings" && <BookOpen className="text-blue-500 mr-2" size={20} />}
            <h2 className="text-xl font-semibold">
              {activeTab === "chat" && "Academic AI Assistant"}
              {activeTab === "simplify" && "Text Simplification Tool"}
              {activeTab === "dataset" && "Simplification Dataset"}
              {activeTab === "settings" && "About This Assistant"}
            </h2>
          </div>
          {activeTab === "chat" && (
            <button
              onClick={clearChat}
              className={`px-4 py-2 rounded-lg flex items-center ${
                darkMode 
                  ? "bg-gray-700 hover:bg-gray-600" 
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Clear Chat
            </button>
          )}
          {activeTab === "dataset" && (
            <button
              onClick={downloadDataset}
              className={`px-4 py-2 rounded-lg flex items-center ${
                darkMode 
                  ? "bg-gray-700 hover:bg-gray-600" 
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              <Download className="mr-2" size={16} />
              Download
            </button>
          )}
        </div>
        
        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Chat Tab */}
          {activeTab === "chat" && (
            <div className="flex flex-col h-full max-w-4xl mx-auto">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-sm ${
                        msg.type === "user"
                          ? darkMode 
                            ? "bg-blue-600 text-white rounded-br-none" 
                            : "bg-blue-500 text-white rounded-br-none"
                          : darkMode 
                            ? "bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700" 
                            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                      }`}
                    >
                      <div className="flex items-start mb-1">
                        {msg.type === "bot" ? (
                          <GraduationCap size={16} className="mr-2 mt-1 text-blue-500" />
                        ) : (
                          <User size={16} className="mr-2 mt-1 text-gray-500" />
                        )}
                        <div className="whitespace-pre-line">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {isThinking && (
                  <div className="flex justify-start">
                    <div
                      className={`max-w-[80%] px-5 py-3 rounded-2xl shadow-sm ${
                        darkMode 
                          ? "bg-gray-800 text-gray-300 rounded-bl-none border border-gray-700" 
                          : "bg-white text-gray-500 rounded-bl-none border border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <GraduationCap size={16} className="mr-2 text-blue-500" />
                        <RefreshCw className="inline mr-2 animate-spin" size={16} />
                        Thinking...
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Input Box */}
              <div className={`mt-4 p-4 rounded-2xl ${darkMode ? "bg-gray-800" : "bg-white"} shadow-lg`}>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Ask about homework, study tips, college applications..."
                    className={`flex-1 px-4 py-3 rounded-full border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      darkMode 
                        ? "bg-gray-700 border-gray-600 text-white" 
                        : "bg-gray-50 border-gray-300 text-gray-900"
                    }`}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isThinking}
                    className={`p-3 rounded-full transition ${
                      input.trim() && !isThinking
                        ? darkMode 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                        : darkMode 
                          ? "bg-gray-700 text-gray-500" 
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
                <p className={`text-xs mt-2 text-center ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                  Powered by Google Gemini 1.5 Flash
                </p>
              </div>
            </div>
          )}
          
          {/* Text Simplification Tab */}
          {activeTab === "simplify" && (
            <div className="max-w-4xl mx-auto">
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <FileText className="mr-2 text-blue-500" size={20} />
                  Text Simplification Tool
                </h3>
                
                {apiError && (
                  <div className={`mb-4 p-3 rounded-lg ${
                    apiError.includes("success") 
                      ? (darkMode ? "bg-green-900 text-green-200" : "bg-green-100 text-green-800")
                      : (darkMode ? "bg-red-900 text-red-200" : "bg-red-100 text-red-800")
                  }`}>
                    {apiError}
                  </div>
                )}
                
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Grade Level
                    </label>
                    <select
                      value={simplificationLevel}
                      onChange={(e) => setSimplificationLevel(e.target.value)}
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-gray-700 border-gray-600 text-white" 
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    >
                      <option value="grade1">1st Grade (Ages 6-7)</option>
                      <option value="grade2">2nd Grade (Ages 7-8)</option>
                      <option value="grade3">3rd Grade (Ages 8-9)</option>
                      <option value="grade4">4th Grade (Ages 9-10)</option>
                      <option value="grade5">5th Grade (Ages 10-11)</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Complex Text
                    </label>
                    <textarea
                      value={complexText}
                      onChange={(e) => setComplexText(e.target.value)}
                      placeholder="Paste complex text here..."
                      rows={6}
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        darkMode 
                          ? "bg-gray-700 border-gray-600 text-white" 
                          : "bg-gray-50 border-gray-300 text-gray-900"
                      }`}
                    />
                  </div>
                  
                  <button
                    onClick={simplifyText}
                    disabled={!complexText.trim() || isThinking}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                      complexText.trim() && !isThinking
                        ? darkMode 
                          ? "bg-blue-600 hover:bg-blue-700 text-white" 
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                        : darkMode 
                          ? "bg-gray-700 text-gray-500" 
                          : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    {isThinking ? "Simplifying..." : "Simplify Text"}
                  </button>
                  
                  {simplifiedText && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Simplified Text
                      </label>
                      <div className={`p-4 rounded-lg border ${
                        darkMode 
                          ? "bg-gray-700 border-gray-600" 
                          : "bg-white border-gray-200"
                      }`}>
                        <div className="whitespace-pre-line">{simplifiedText}</div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                          Rate this simplification
                        </label>
                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              onClick={() => setRating(star)}
                              className={`p-1 rounded-full ${
                                star <= rating
                                  ? "text-yellow-500"
                                  : darkMode 
                                    ? "text-gray-600" 
                                    : "text-gray-300"
                              }`}
                            >
                              <Star size={24} fill={star <= rating ? "currentColor" : "none"} />
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-2">
                          Feedback (optional)
                        </label>
                        <textarea
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="What did you like or dislike about this simplification?"
                          rows={3}
                          className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            darkMode 
                              ? "bg-gray-700 border-gray-600 text-white" 
                              : "bg-gray-50 border-gray-300 text-gray-900"
                          }`}
                        />
                      </div>
                      
                      <div className="mt-4 flex space-x-3">
                        <button
                          onClick={saveToDataset}
                          disabled={rating === 0}
                          className={`flex-1 py-2 rounded-lg font-medium transition flex items-center justify-center ${
                            rating > 0
                              ? darkMode 
                                ? "bg-green-600 hover:bg-green-700 text-white" 
                                : "bg-green-500 hover:bg-green-600 text-white"
                              : darkMode 
                                ? "bg-gray-700 text-gray-500" 
                                : "bg-gray-200 text-gray-400"
                          }`}
                        >
                          <Save className="mr-2" size={16} />
                          Save to Dataset
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {simplificationHistory.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-2">Recent Simplifications</h4>
                      <div className={`rounded-lg border max-h-60 overflow-y-auto ${
                        darkMode ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                      }`}>
                        {simplificationHistory.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-3 border-b ${
                              darkMode ? "border-gray-600" : "border-gray-200"
                            }`}
                          >
                            <div className="text-sm font-medium mb-1">
                              {item.level.replace('grade', 'Grade ')}
                            </div>
                            <div className="text-xs text-gray-500 mb-1">
                              {new Date(item.timestamp).toLocaleString()}
                            </div>
                            <div className="text-sm truncate">
                              {item.original.substring(0, 100)}...
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Dataset Tab */}
          {activeTab === "dataset" && (
            <div className="max-w-4xl mx-auto">
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <BarChart2 className="mr-2 text-blue-500" size={20} />
                  Simplification Dataset
                </h3>
                
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">
                      {dataset.length} entries
                    </span>
                  </div>
                  <button
                    onClick={() => setShowDataset(!showDataset)}
                    className={`px-4 py-2 rounded-lg ${
                      darkMode 
                        ? "bg-gray-700 hover:bg-gray-600" 
                        : "bg-gray-200 hover:bg-gray-300"
                    }`}
                  >
                    {showDataset ? "Hide Dataset" : "Show Dataset"}
                  </button>
                </div>
                
                {showDataset && dataset.length > 0 && (
                  <div className={`rounded-lg border overflow-hidden ${
                    darkMode ? "border-gray-700" : "border-gray-200"
                  }`}>
                    <div className={`grid grid-cols-12 gap-2 p-3 font-medium text-sm ${
                      darkMode ? "bg-gray-700" : "bg-gray-100"
                    }`}>
                      <div className="col-span-1">Level</div>
                      <div className="col-span-2">Rating</div>
                      <div className="col-span-4">Original</div>
                      <div className="col-span-4">Simplified</div>
                      <div className="col-span-1">Date</div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {dataset.map((item) => (
                        <div 
                          key={item.id} 
                          className={`grid grid-cols-12 gap-2 p-3 text-sm border-b ${
                            darkMode ? "border-gray-700" : "border-gray-200"
                          }`}
                        >
                          <div className="col-span-1">
                            {item.level.replace('grade', '')}
                          </div>
                          <div className="col-span-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  size={14} 
                                  className={i < item.rating ? "text-yellow-500" : darkMode ? "text-gray-600" : "text-gray-300"}
                                  fill={i < item.rating ? "currentColor" : "none"}
                                />
                              ))}
                            </div>
                          </div>
                          <div className="col-span-4 truncate">
                            {item.original}
                          </div>
                          <div className="col-span-4 truncate">
                            {item.simplified}
                          </div>
                          <div className="col-span-1 text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {dataset.length === 0 && (
                  <div className={`p-8 text-center rounded-lg ${
                    darkMode ? "bg-gray-700" : "bg-gray-100"
                  }`}>
                    <p>No dataset entries yet. Simplify some text and rate the results to build your dataset.</p>
                  </div>
                )}
                
                <div className={`mt-6 p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                  <h4 className="font-medium mb-2">About this dataset:</h4>
                  <p className="text-sm">
                    This dataset contains complex-simplified text pairs that have been rated by users. 
                    It can be used to train and evaluate text simplification models. The dataset is stored 
                    locally in your browser and can be downloaded for further analysis.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* About Tab */}
          {activeTab === "settings" && (
            <div className="max-w-2xl mx-auto">
              <div className={`p-6 rounded-2xl shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <h3 className="text-xl font-semibold mb-6 flex items-center">
                  <BookOpen className="mr-2 text-blue-500" size={20} />
                  About Your Academic Assistant
                </h3>
                
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">What I can help with:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Homework help across various subjects</li>
                      <li>Study strategies and techniques</li>
                      <li>College application guidance</li>
                      <li>Academic planning and time management</li>
                      <li>Learning resources and recommendations</li>
                      <li>Text simplification for young learners</li>
                      <li>Answers to general educational questions</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Text Simplification Tool:</h4>
                    <p className="text-sm">
                      Our text simplification tool helps make complex academic content accessible to primary students. 
                      It adjusts vocabulary, sentence structure, and explanations based on grade level while preserving 
                      the original meaning. The tool also collects user feedback to improve its performance over time.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Tips for best results:</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>Be specific about your question or topic</li>
                      <li>Include relevant details like grade level or subject</li>
                      <li>For text simplification, select the appropriate grade level</li>
                      <li>Rate simplification results to help improve the tool</li>
                      <li>Ask follow-up questions if you need clarification</li>
                    </ul>
                  </div>
                  
                  <div className={`p-4 rounded-lg ${darkMode ? "bg-gray-700" : "bg-blue-50"}`}>
                    <h4 className="font-medium mb-2">Note:</h4>
                    <p className="text-sm">
                      This assistant is powered by Google Gemini 1.5 Flash. While we strive to provide accurate information, 
                      always verify important academic information with official sources or teachers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeminiChatbot;
