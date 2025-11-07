
import React, { ReactNode } from 'react';

interface ModalProps {
  children: ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
        onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-4 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal;
   