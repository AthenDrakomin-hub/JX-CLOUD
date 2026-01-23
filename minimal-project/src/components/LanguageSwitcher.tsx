import React from 'react';
import { changeLanguage } from '../i18n';

export default function LanguageSwitcher() {
  return (
    <div style={{ marginBottom: 20 }}>
      <button onClick={() => changeLanguage('en')}>EN</button>
      <button onClick={() => changeLanguage('zh')} style={{ marginLeft: 8 }}>中文</button>
      <button onClick={() => changeLanguage('fil')} style={{ marginLeft: 8 }}>Fil</button>
    </div>
  );
}