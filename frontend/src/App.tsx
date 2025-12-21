import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Spools } from './pages/Spools';
import { Materials } from './pages/Materials';
import { Manufacturers } from './pages/Manufacturers';
import { FilamentTypes } from './pages/FilamentTypes';
import { Settings } from './pages/Settings';
import { SpoolDetail } from './pages/SpoolDetail';
import { ColorDetail } from './pages/ColorDetail';
import { MyPrint } from './pages/MyPrint';
import { Locations } from './pages/Locations';
import { LocationDetail } from './pages/LocationDetail';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/spools" element={<Spools />} />
                <Route path="/spools/:uid" element={<SpoolDetail />} />
                <Route path="/spools/color" element={<ColorDetail />} />
                <Route path="/locations" element={<Locations />} />
                <Route path="/locations/:id" element={<LocationDetail />} />
                <Route path="/materials" element={<Materials />} />
                <Route path="/manufacturers" element={<Manufacturers />} />
                <Route path="/filament-types" element={<FilamentTypes />} />
                <Route path="/my-print" element={<MyPrint />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Layout>
          </BrowserRouter>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              },
              success: {
                iconTheme: {
                  primary: 'var(--color-success)',
                  secondary: 'var(--color-bg-secondary)',
                },
              },
              error: {
                iconTheme: {
                  primary: 'var(--color-danger)',
                  secondary: 'var(--color-bg-secondary)',
                },
              },
            }}
          />
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
