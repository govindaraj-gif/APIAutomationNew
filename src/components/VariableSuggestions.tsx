import React, { useEffect, useRef, useState } from 'react';
import { DataVariable, VariableState } from '../types';

interface VariableSuggestionsProps {
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement>;
  chainVariables?: Record<string, VariableState>;
  dataRepoVariables?: DataVariable[];
  onSelect: (variableName: string) => void;
}

const VariableSuggestions: React.FC<VariableSuggestionsProps> = ({
  inputRef,
  chainVariables = {},
  dataRepoVariables = [],
  onSelect,
}) => {
  const [show, setShow] = useState(false);
  const [search, setSearch] = useState('');
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleInput = () => {
      const input = inputRef.current;
      if (!input) return;

      const value = input.value;
      const cursorPosition = input.selectionStart || 0;
      
      // Find the start of the current variable
      let start = cursorPosition - 1;
      while (start >= 0 && value[start] !== '$') {
        start--;
      }

      if (start >= 0 && value[start] === '$' && value[start + 1] === '{') {
        const searchText = value.slice(start + 2, cursorPosition).toLowerCase();
        setSearch(searchText);

        // Calculate position for suggestions
        if (input instanceof HTMLTextAreaElement) {
          const textBeforeCursor = value.substring(0, cursorPosition);
          const lines = textBeforeCursor.split('\n');
          const currentLineNumber = lines.length - 1;
          const currentLine = lines[currentLineNumber];
          
          const lineHeight = 20; // Approximate line height
          const { offsetTop, offsetLeft } = input;
          
          setPosition({
            top: offsetTop + (currentLineNumber * lineHeight) + 24,
            left: offsetLeft + (currentLine.length * 8), // Approximate character width
          });
        } else {
          const rect = input.getBoundingClientRect();
          setPosition({
            top: rect.bottom + window.scrollY,
            left: rect.left + (cursorPosition * 8), // Approximate character width
          });
        }

        setShow(true);
      } else {
        setShow(false);
      }
    };

    const input = inputRef.current;
    if (input) {
      input.addEventListener('input', handleInput);
      input.addEventListener('keyup', handleInput);
      input.addEventListener('click', handleInput);
    }

    return () => {
      if (input) {
        input.removeEventListener('input', handleInput);
        input.removeEventListener('keyup', handleInput);
        input.removeEventListener('click', handleInput);
      }
    };
  }, [inputRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShow(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [inputRef]);

  if (!show) return null;

  const chainSuggestions = Object.entries(chainVariables)
    .map(([_, variable]) => variable.name)
    .filter(name => name.toLowerCase().includes(search));

  const repoSuggestions = dataRepoVariables
    .map(variable => variable.name)
    .filter(name => name.toLowerCase().includes(search));

  const allSuggestions = [...chainSuggestions, ...repoSuggestions];

  if (allSuggestions.length === 0) return null;

  return (
    <div
      ref={suggestionsRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto"
      style={{
        top: position.top,
        left: position.left,
        minWidth: '200px',
      }}
    >
      {chainSuggestions.length > 0 && (
        <div className="p-1 border-b border-gray-200">
          <div className="px-2 py-1 text-xs text-gray-500 font-medium">Chain Variables</div>
          {chainSuggestions.map(name => (
            <button
              key={name}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
              onClick={() => {
                onSelect(name);
                setShow(false);
              }}
            >
              ${name}
            </button>
          ))}
        </div>
      )}
      {repoSuggestions.length > 0 && (
        <div className="p-1">
          <div className="px-2 py-1 text-xs text-gray-500 font-medium">Data Repo Variables</div>
          {repoSuggestions.map(name => (
            <button
              key={name}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-50"
              onClick={() => {
                onSelect(name);
                setShow(false);
              }}
            >
              ${name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VariableSuggestions;