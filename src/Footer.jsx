import { FaGithub, FaRocket } from "react-icons/fa";

const Footer = () => {
  return (
    <footer className="bg-rgb(16, 25, 46) text-white py-4 text-center shadow-lg w-full">
      <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold text-center">ChatMate🤖</h1>
        <p className="text-sm text-gray-300 mb-4">
         ChatBox-AI has been selected for the Gemini API Developer Competition and is recognized by Google AI.
        </p>
        <div className="flex justify-center space-x-4 mb-3">
          <a
            href="https://github.com/arpiztech/CHATBOX-AI"
            className="text-white-400 hover:text-white transform hover:scale-110 transition duration-300 flex items-center"
          >
            <FaGithub className="mr-1" /> GitHub
          </a>
          
        </div>
        <p className="text-xs text-gray-500">&copy; 2025 ChatBox-AI . All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;