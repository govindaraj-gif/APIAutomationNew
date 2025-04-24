import React, { useState } from 'react';
import { History, FolderTree, Database } from 'lucide-react';
import DataRepoModal from '../components/DataRepoModal';

interface SidebarProps {
  onCollectionsClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollectionsClick }) => {
  const [isDataRepoOpen, setIsDataRepoOpen] = useState(false);

  return (
    <>
      <aside className="w-16 bg-gray-800 text-white flex flex-col">
        <div className="flex-1 overflow-auto">
          <div className="p-2">
            <button
              className="flex flex-col items-center justify-center w-full p-2 hover:bg-gray-700 rounded cursor-pointer"
              onClick={onCollectionsClick}
              title="Collections"
            >
              <FolderTree size={20} />
              <span className="text-xs mt-1">Collections</span>
            </button>
            <button
              className="flex flex-col items-center justify-center w-full p-2 hover:bg-gray-700 rounded cursor-pointer"
              title="History"
            >
              <History size={20} />
              <span className="text-xs mt-1">History</span>
            </button>
            <button
              className="flex flex-col items-center justify-center w-full p-2 hover:bg-gray-700 rounded cursor-pointer"
              onClick={() => setIsDataRepoOpen(true)}
              title="Data Repo"
            >
              <Database size={20} />
              <span className="text-xs mt-1">Data Repo</span>
            </button>
          </div>
        </div>
      </aside>

      <DataRepoModal 
        isOpen={isDataRepoOpen} 
        onClose={() => setIsDataRepoOpen(false)} 
      />
    </>
  );
};

export default Sidebar;