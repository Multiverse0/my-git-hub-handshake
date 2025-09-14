interface LoadingFallbackProps {
  message?: string;
  submessage?: string;
}

export function LoadingFallback({ 
  message = 'Laster...', 
  submessage 
}: LoadingFallbackProps) {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
        <p className="text-gray-400">{message}</p>
        {submessage && (
          <p className="text-gray-500 text-sm mt-2">{submessage}</p>
        )}
      </div>
    </div>
  );
}