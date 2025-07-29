import Link from 'next/link'
import { AlertCircle, Home } from 'lucide-react'

export default function AuthCodeError() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-white rounded-lg shadow-lg p-8 border border-red-200">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-6">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Authentication Error
          </h1>
          
          <p className="text-gray-600 mb-6">
            Sorry, there was an error during the authentication process. 
            This could be due to an expired or invalid authentication code.
          </p>
          
          <div className="space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Home className="h-4 w-4" />
              Return to Dashboard
            </Link>
            
            <p className="text-sm text-gray-500">
              You can try signing in again from the main page.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}