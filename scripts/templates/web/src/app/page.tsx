import { cn } from '@modular-ai-scaffold/core/utils'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className={cn(
          "text-4xl font-bold text-center mb-8",
          "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
        )}>
          Welcome to {{WORKSPACE_NAME}}
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">🚀 Get Started</h2>
            <p className="text-gray-600">
              This workspace is ready for development. Start building your application!
            </p>
          </div>
          
          <div className="p-6 border rounded-lg">
            <h2 className="text-xl font-semibold mb-2">📦 Features</h2>
            <ul className="text-gray-600 space-y-1">
              <li>• Next.js 14 with App Router</li>
              <li>• Tailwind CSS styling</li>
              <li>• TypeScript support</li>
              <li>• Shared core utilities</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Edit <code className="bg-gray-100 px-2 py-1 rounded">src/app/page.tsx</code> to get started
          </p>
        </div>
      </div>
    </main>
  )
}