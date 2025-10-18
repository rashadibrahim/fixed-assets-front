import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AddTransaction from './AddTransaction';

const TransactionInFormView = ({ onBack, selectedTransaction, onTransactionSaved }) => {
  const [showForm, setShowForm] = React.useState(true);

  const handleClose = () => {
    setShowForm(false);
    if (onBack) {
      onBack();
    }
  };

  const handleTransactionAdded = () => {
    if (onTransactionSaved) {
      onTransactionSaved();
    }
    handleClose();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Transactions
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedTransaction ? 'Edit Transaction In' : 'Add Transaction In'}
          </h2>
        </div>
      </div>

      {/* Form Content - Render AddTransaction without modal wrapper */}
      <div className="flex-1 overflow-y-auto">
        <AddTransaction
          isOpen={showForm}
          onClose={handleClose}
          onTransactionAdded={handleTransactionAdded}
          defaultTransactionType="IN"
          editTransactionId={selectedTransaction?.id}
          asContentView={true}
        />
      </div>
    </div>
  );
};

export default TransactionInFormView;
