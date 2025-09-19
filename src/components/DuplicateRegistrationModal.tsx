import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface DuplicateRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DuplicateRegistrationModal({ isOpen, onClose }: DuplicateRegistrationModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleClose = () => {
    onClose();
    navigate(-1);
  };

  // Auto-close after 10 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        handleClose();
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div ref={modalRef} className="bg-background rounded-2xl max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center p-8 text-center">
          <div className="text-8xl mb-4">🤔</div>
          <div className="bg-yellow-100 text-yellow-800 px-6 py-3 rounded-full mb-6">
            <span className="text-2xl font-bold">ALLEREDE REGISTRERT!</span>
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Rolig an der, ivrig skytter! 😄
          </h2>
          <p className="text-muted-foreground mb-6 text-lg">
            Du har allerede registrert trening i dag.<br />
            <strong>Én trening per dag</strong> er nok for å holde seg i form! 🎯
          </p>
          <div className="bg-muted rounded-lg p-4 mb-6 w-full">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Tips:</strong> Kom tilbake i morgen for å registrere ny trening!
            </p>
          </div>
          <button 
            onClick={handleClose}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors duration-200 w-full"
          >
            Skjønner! 👍
          </button>
        </div>
      </div>
    </div>
  );
}