import React, { useState } from 'react';
import { X, Move, FolderTree } from 'lucide-react';
import { Collection, CollectionFolder } from '../types';

interface MoveRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMove: (targetCollectionId: string, targetFolderId?: string) => void;
  collections: Collection[];
  currentCollectionId: string;
  currentFolderId?: string;
}

const MoveRequestModal: React.FC<MoveRequestModalProps> = ({
  isOpen,
  onClose,
  onMove,
  collections,
  currentCollectionId,
  currentFolderId
}) => {
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(currentCollectionId);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(currentFolderId);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  if (!isOpen) return null;

  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const renderFolders = (folders: CollectionFolder[], level = 0) => {
    return folders.map(folder => (
      <div key={folder.id} style={{ marginLeft: `${level * 20}px` }}>
        <div className="flex items-center py-1">
          <button
            onClick={() => toggleFolder(folder.id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <FolderTree size={16} className="text-gray-500" />
          </button>
          <button
            onClick={() => setSelectedFolderId(folder.id)}
            className={`flex-1 px-2 py-1 text-left text-sm rounded hover:bg-gray-100 ${
              selectedFolderId === folder.id ? 'bg-blue-50 text-blue-600' : ''
            }`}
          >
            {folder.name}
          </button>
        </div>
        {expandedFolders.has(folder.id) && folder.folders.length > 0 && (
          renderFolders(folder.folders, level + 1)
        )}
      </div>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Move Request</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Collection
            </label>
            <select
              value={selectedCollectionId}
              onChange={(e) => {
                setSelectedCollectionId(e.target.value);
                setSelectedFolderId(undefined);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Folder (Optional)
            </label>
            <div className="border border-gray-300 rounded-md max-h-48 overflow-y-auto">
              <div className="p-2">
                <button
                  onClick={() => setSelectedFolderId(undefined)}
                  className={`w-full px-2 py-1 text-left text-sm rounded hover:bg-gray-100 ${
                    !selectedFolderId ? 'bg-blue-50 text-blue-600' : ''
                  }`}
                >
                  Root Level
                </button>
                {collections
                  .find(c => c.id === selectedCollectionId)
                  ?.folders.map(folder => (
                    <div key={folder.id}>
                      <div className="flex items-center py-1">
                        <button
                          onClick={() => toggleFolder(folder.id)}
                          className="p-1 hover:bg-gray-100 rounded"
                        >
                          <FolderTree size={16} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => setSelectedFolderId(folder.id)}
                          className={`flex-1 px-2 py-1 text-left text-sm rounded hover:bg-gray-100 ${
                            selectedFolderId === folder.id ? 'bg-blue-50 text-blue-600' : ''
                          }`}
                        >
                          {folder.name}
                        </button>
                      </div>
                      {expandedFolders.has(folder.id) && folder.folders.length > 0 && (
                        renderFolders(folder.folders)
                      )}
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onMove(selectedCollectionId, selectedFolderId);
              onClose();
            }}
            disabled={selectedCollectionId === currentCollectionId && selectedFolderId === currentFolderId}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Move size={16} />
            Move Request
          </button>
        </div>
      </div>
    </div>
  );
};

export default MoveRequestModal;