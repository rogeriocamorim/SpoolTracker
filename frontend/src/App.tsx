import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
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
  },
});

function App() {
  return (
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
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
