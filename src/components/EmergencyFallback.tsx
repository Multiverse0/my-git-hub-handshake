export function EmergencyFallback() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold text-yellow-400 mb-4">
          System Loading...
        </h1>
        <p className="text-gray-300 mb-6">
          If you're seeing this for more than 30 seconds, there might be a connection issue.
        </p>
        
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 mb-6">
          <h3 className="font-semibold text-yellow-400 mb-2">Quick Actions:</h3>
          <div className="space-y-2">
            <button 
              className="w-full bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-400 transition-colors"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </button>
            <button 
              className="w-full bg-gray-700 text-white px-4 py-2 rounded hover:bg-gray-600 transition-colors"
              onClick={() => window.location.href = '/login'}
            >
              Go to Login
            </button>
          </div>
        </div>

        <details className="text-left">
          <summary className="cursor-pointer text-gray-400 hover:text-gray-300">
            System Status
          </summary>
          <div className="mt-2 text-sm text-gray-500 space-y-1">
            <div>URL: {window.location.href}</div>
            <div>User Agent: {navigator.userAgent.slice(0, 50)}...</div>
            <div>Time: {new Date().toLocaleTimeString()}</div>
          </div>
        </details>
      </div>
    </div>
  );
}