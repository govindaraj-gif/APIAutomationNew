import React from 'react';
import { CheckCircle2, XCircle, ChevronRight } from 'lucide-react';
import { AssertionResults as IAssertionResults } from '../types';

interface AssertionResultsProps {
  results: IAssertionResults;
}

const AssertionResults: React.FC<AssertionResultsProps> = ({ results }) => {
  if (!results) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-medium text-gray-700">Assertions</h3>
        {results.passed ? (
          <span className="text-green-500 flex items-center gap-1">
            <CheckCircle2 size={16} />
            All Passed
          </span>
        ) : (
          <span className="text-red-500 flex items-center gap-1">
            <XCircle size={16} />
            Failed
          </span>
        )}
      </div>

      {results.failureMessages.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-2 space-y-1">
          {results.failureMessages.map((message, index) => (
            <div key={index} className="text-sm text-red-700 flex items-center gap-1">
              <ChevronRight size={14} />
              {message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssertionResults;