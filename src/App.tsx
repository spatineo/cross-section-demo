import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './App.css'
import { EDRPanel } from './EDRPanel'

const queryClient = new QueryClient()

function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <EDRPanel />
    </QueryClientProvider>
  )
}

export default App
