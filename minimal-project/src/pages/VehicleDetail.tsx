import React from 'react';
import { useTranslation } from 'react-i18next';

type Vehicle = {
  make: string;
  model: string;
  year: number;
  vin?: string;
};

export default function VehicleDetail({ vehicle }: { vehicle: Vehicle }) {
  const { t } = useTranslation(['vehicle', 'common']);

  return (
    <div>
      <h1>{t('vehicle:title')}</h1>
      <div>{t('vehicle:make')}: {vehicle.make}</div>
      <div>{t('vehicle:model')}: {vehicle.model}</div>
      <div>{t('vehicle:year')}: {vehicle.year}</div>
      <div>{t('vehicle:vin')}: {vehicle.vin ?? t('vehicle:no_vin')}</div>
      <button style={{ marginRight: 8 }}>{t('common:save')}</button>
      <button>{t('common:cancel')}</button>
    </div>
  );
}