import React from 'react';
import { Save, Share2 } from 'lucide-react';

interface TopBarProps {
    activeTab: 'single' | 'chain';
    setActiveTab: (tab: 'single' | 'chain') => void;
    setShowSaveRequestModal: (show: boolean) => void;
  }
  
const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  setActiveTab,
  setShowSaveRequestModal,
}) => {
  return (
    <header className="bg-white border-b border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-800">API Testing</h1>
          <div className="flex rounded-lg bg-gray-100 p-1">
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'single'
                  ? 'bg-white text-gray-800 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('single')}
            >
              Single Request
            </button>
            <button
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'chain'
                  ? 'bg-white text-gray-800 shadow'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
              onClick={() => setActiveTab('chain')}
            >
              Request Chain
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setShowSaveRequestModal(true)}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1"
          >
            <Save size={16} />
            Save
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 flex items-center gap-1">
            <Share2 size={16} />
            Share
          </button>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
