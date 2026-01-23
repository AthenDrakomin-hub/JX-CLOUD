import React from 'react';
import VehicleDetail from './pages/VehicleDetail';
import LanguageSwitcher from './components/LanguageSwitcher';

export default function App() {
  const mockVehicle = {
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    vin: 'JTDBR32E...'
  };

  return (
    <div style={{ padding: 20 }}>
      <LanguageSwitcher />
      <VehicleDetail vehicle={mockVehicle} />
    </div>
  );
}