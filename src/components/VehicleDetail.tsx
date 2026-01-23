import React from 'react';
import { useTranslation } from 'react-i18next';

type Vehicle = {
  make: string;
  model: string;
  year: number;
  vin?: string;
};

export default function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation(['vehicle', 'common']); // 指定命名空间

  return (
    <div>
      <h1>{t('vehicle:title')}</h1>
      <div>
        <strong>{t('vehicle:make')}:</strong> {vehicle.make}
      </div>
      <div>
        <strong>{t('vehicle:model')}:</strong> {vehicle.model}
      </div>
      <div>
        <strong>{t('vehicle:year')}:</strong> {vehicle.year}
      </div>
      <button>{t('common:save')}</button>
      <button>{t('common:cancel')}</button>
    </div>
  );
}