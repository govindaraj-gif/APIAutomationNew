import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, RefreshCw, ChevronDown, Copy, Check, Search } from 'lucide-react';
import { DataVariable, DataVariableType } from '../types';
import { generateDynamicValue } from '../utils/dynamicDataGenerator';
import fuzzysort from 'fuzzysort';

interface DataRepoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const VARIABLE_TYPES: { label: string; value: DataVariableType }[] = [
  { label: 'String', value: 'string' },
  { label: 'Number', value: 'number' },
  { label: 'Single Digit', value: 'singleDigit' },
  { label: 'Boolean', value: 'boolean' },
  { label: 'Object', value: 'object' },
  { label: 'Alphanumeric', value: 'alphanumeric' },
  { label: 'First Name', value: 'firstName' },
  { label: 'Last Name', value: 'lastName' },
  { label: 'Full Name', value: 'fullName' },
  { label: 'Email', value: 'email' },
  { label: 'Email with Domain', value: 'emailWithDomain' },
  { label: 'Static Password', value: 'staticPassword' },
  { label: 'Dynamic Password', value: 'dynamicPassword' },
  { label: 'Phone Number', value: 'phoneNumber' },
  { label: 'Date (Recent)', value: 'date' },
  { label: 'Date (Past)', value: 'pastDate' },
  { label: 'Date (Future)', value: 'futureDate' },
  { label: 'City', value: 'city' },
  { label: 'State', value: 'state' },
  { label: 'Country', value: 'country' },
  { label: 'Country Code', value: 'countryCode' },
  { label: 'ZIP Code', value: 'zipCode' },
  { label: 'UUID', value: 'uuid' },
  { label: 'Color', value: 'color' },
  { label: 'URL', value: 'url' },
  { label: 'IPv4', value: 'ipv4' },
  { label: 'IPv6', value: 'ipv6' },
];

const DataRepoModal: React.FC<DataRepoModalProps> = ({ isOpen, onClose }) => {
  const [variables, setVariables] = useState<DataVariable[]>([]);
  const [newVariable, setNewVariable] = useState<DataVariable>({
    name: '',
    type: 'string',
    value: '',
    isDynamic: true,
    config: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<DataVariableType | ''>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const storedVariables = localStorage.getItem('dataRepoVariables');
      if (storedVariables) {
        setVariables(JSON.parse(storedVariables));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (newVariable.type) {
      const value = generateDynamicValue(newVariable.type, newVariable.config);
      setNewVariable(prev => ({ ...prev, value }));
    }
  }, [newVariable.type, newVariable.config]);

  if (!isOpen) return null;

  const handleAddVariable = () => {
    if (newVariable.name) {
      const finalName = `rnd${newVariable.name}`;
      setVariables([...variables, { ...newVariable, name: finalName }]);
      setNewVariable({
        name: '',
        type: 'string',
        value: generateDynamicValue('string'),
        isDynamic: true,
        config: {}
      });
    }
  };

  const handleRemoveVariable = (index: number) => {
    const updatedVariables = variables.filter((_, i) => i !== index);
    setVariables(updatedVariables);
  };

  const handleSave = () => {
    localStorage.setItem('dataRepoVariables', JSON.stringify(variables));
    onClose();
  };

  const handleRegenerateValue = (index: number) => {
    const variable = variables[index];
    const newValue = generateDynamicValue(variable.type, variable.config);
    const updatedVariables = [...variables];
    updatedVariables[index] = { ...variable, value: newValue };
    setVariables(updatedVariables);
  };

  const handleCopyVariable = (variableName: string) => {
    navigator.clipboard.writeText(`\${${variableName}}`);
    setCopiedId(variableName);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyValue = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const handleConfigChange = (updates: Partial<DataVariable['config']>) => {
    setNewVariable(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
      value: generateDynamicValue(prev.type, { ...prev.config, ...updates })
    }));
  };

  const renderVariableConfig = () => {
    switch (newVariable.type) {
      case 'emailWithDomain':
        return (
          <div className="col-span-12 mt-2">
            <input
              type="text"
              placeholder="Domain (e.g., example.com)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newVariable.config?.emailDomain || ''}
              onChange={(e) => handleConfigChange({ emailDomain: e.target.value })}
            />
          </div>
        );
      case 'staticPassword':
        return (
          <div className="col-span-12 mt-2">
            <input
              type="text"
              placeholder="Enter static password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newVariable.config?.staticValue || ''}
              onChange={(e) => handleConfigChange({ staticValue: e.target.value })}
            />
          </div>
        );
      case 'dynamicPassword':
        return (
          <div className="col-span-12 mt-2 grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Length (default: 10)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newVariable.config?.passwordLength || ''}
              onChange={(e) => handleConfigChange({ passwordLength: parseInt(e.target.value) || 10 })}
            />
            <input
              type="text"
              placeholder="Special chars (default: !@#$%^&*)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              value={newVariable.config?.specialChars || ''}
              onChange={(e) => handleConfigChange({ specialChars: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  const filteredVariables = variables.filter(variable => {
    const nameMatch = searchTerm
      ? fuzzysort.single(searchTerm.toLowerCase(), variable.name.toLowerCase())
      : true;
    const typeMatch = searchType ? variable.type === searchType : true;
    return nameMatch && typeMatch;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Data Repository</h2>
          <div className="text-sm text-gray-500">
            Use variables with ${'{variableName}'} syntax
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-hidden flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Add New Variable</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-4">
                  <input
                    type="text"
                    placeholder="Name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    value={newVariable.name}
                    onChange={(e) => setNewVariable({ ...newVariable, name: e.target.value })}
                  />
                </div>
                <div className="col-span-7">
                  <div className="relative">
                    <select
                      value={newVariable.type}
                      onChange={(e) => setNewVariable({ 
                        ...newVariable, 
                        type: e.target.value as DataVariableType,
                        value: generateDynamicValue(e.target.value as DataVariableType),
                        config: {}
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md appearance-none pr-10"
                    >
                      {VARIABLE_TYPES.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown 
                      size={16} 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" 
                    />
                  </div>
                </div>
                <div className="col-span-1">
                  <button
                    onClick={handleAddVariable}
                    disabled={!newVariable.name}
                    className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
              {renderVariableConfig()}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search 
                size={16} 
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" 
              />
            </div>
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as DataVariableType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              {VARIABLE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVariables.map((variable, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <span>${'{' + variable.name + '}'}</span>
                        <button
                          onClick={() => handleCopyVariable(variable.name)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy variable"
                        >
                          {copiedId === variable.name ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {VARIABLE_TYPES.find(t => t.value === variable.type)?.label || variable.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      <div className="flex items-center gap-2">
                        <span className="max-w-xs truncate">{variable.value}</span>
                        <button
                          onClick={() => handleCopyValue(variable.value)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Copy value"
                        >
                          {copiedValue === variable.value ? (
                            <Check size={14} className="text-green-500" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                        {variable.isDynamic && (
                          <button
                            onClick={() => handleRegenerateValue(index)}
                            className="text-blue-500 hover:text-blue-600"
                            title="Regenerate value"
                          >
                            <RefreshCw size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleRemoveVariable(index)}
                        className="text-red-500 hover:text-red-600"
                        title="Remove variable"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredVariables.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No variables found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataRepoModal;