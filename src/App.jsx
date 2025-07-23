import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import Footer from "./Footer";
import ShareButtons from "./components/ShareButtons";
import { FaMicrophone, FaPaperPlane, FaVolumeUp } from "react-icons/fa";
import { LoadingScreen } from "./components/LoadingScreen";

const cache = new Map();

export default function App() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { type: "bot", text: "Hello👋" },
    { type: "bot", text: "How can I help you?" },
  ]);
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recog = new window.webkitSpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = "en-US";

      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setQuestion(transcript);
        setIsListening(false);
      };

      recog.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recog.onend = () => {
        setIsListening(false);
      };

      setRecognition(recog);
    }
  }, []);

  const toggleListening = () => {
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const toggleSpeaking = (text) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    }
  };

  async function generateAnswer(e) {
    e.preventDefault();
    if (!question.trim()) return;

    if (generatingAnswer) return;
    setGeneratingAnswer(true);

    if (cache.has(question)) {
      setChatHistory((prevChat) => [
        ...prevChat,
        { type: "user", text: question },
        { type: "bot", text: cache.get(question) },
      ]);
      setQuestion("");
      setGeneratingAnswer(false);
      return;
    }

    const apiKey = import.meta.env.VITE_API_GENERATIVE_LANGUAGE_CLIENT;
    let attempts = 0;
    const maxAttempts = 3;
    let delay = 2000;

    while (attempts < maxAttempts) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
          {
            contents: [{ parts: [{ text: question }] }],
          },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.data?.candidates?.length > 0) {
          const fullAnswer = response.data.candidates[0].content.parts[0].text;

          cache.set(question, fullAnswer);

          setChatHistory((prevChat) => [
            ...prevChat,
            { type: "user", text: question },
            { type: "bot", text: fullAnswer },
          ]);

          setQuestion("");
        } else {
          throw new Error("Invalid API response structure");
        }
        break;
      } catch (error) {
        console.error("API Error:", error);

        if (error.response?.status === 429) {
          if (attempts < maxAttempts - 1) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2;
            attempts++;
          } else {
            setChatHistory((prevChat) => [
              ...prevChat,
              { type: "bot", text: "Rate limit exceeded. Please try again later." },
            ]);
            break;
          }
        } else {
          setChatHistory((prevChat) => [
            ...prevChat,
            { type: "bot", text: "Sorry, something went wrong. Please try again!" },
          ]);
          break;
        }
      }
    }

    setGeneratingAnswer(false);
  }

  return (
    <>
      {!isLoaded && <LoadingScreen onComplete={() => setIsLoaded(true)} />}
      <div className={`transition-opacity duration-700 ${isLoaded ? "opacity-100" : "opacity-0"} bg-gray-100 text-gray-900 min-h-screen flex items-center justify-center`}>
        <div className="w-[560px] h-[640px] bg-white rounded-[2rem] shadow-xl flex flex-col overflow-hidden">
          {/* Top Welcome Section */}
          <div className="bg-violet-600 text-white text-center py-6 px-4">
            <div className="text-2xl font-semibold">Hello,ChatBox-Ai 🤖</div>
            <div className="text-sm mt-1">How can I help you?</div>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-scroll p-4 space-y-4 bg-white scrollbar-thin scrollbar-thumb-violet-400 scrollbar-track-violet-100">
            {chatHistory.map((chat, index) => (
              <div
                key={index}
                className={`max-w-[75%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                  chat.type === "bot"
                    ? "bg-purple-100 text-left text-gray-700"
                    : "bg-violet-600 text-white self-end ml-auto text-right"
                }`}
              >
                <ReactMarkdown>{chat.text}</ReactMarkdown>
                {chat.type === "bot" && (
                  <div className="flex flex-wrap justify-end mt-2 space-x-2">
                    <button onClick={() => toggleSpeaking(chat.text)} className="text-violet-600">
                      <FaVolumeUp />
                    </button>
                    <ShareButtons answer={chat.text} />
                  </div>
                )}
              </div>
            ))}
            {generatingAnswer && (
              <div className="p-3 rounded-lg bg-gray-200 animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
              </div>
            )}
          </div>

          {/* Input Section */}
          <form onSubmit={generateAnswer} className="p-4 bg-violet-100 flex items-center space-x-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-3 rounded-full bg-white focus:outline-none text-sm"
            />
            {recognition && (
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2 rounded-full ${isListening ? "bg-red-500" : "bg-violet-600"} text-white`}
              >
                <FaMicrophone />
              </button>
            )}
            <button type="submit" className="bg-violet-600 text-white px-4 py-2 rounded-full text-sm">
              <FaPaperPlane />
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}
