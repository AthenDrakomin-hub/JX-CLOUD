import React from 'react';
import { changeLanguage } from '../i18n';

export default function LanguageSwitcher() {
  return (
    <div>
      <button onClick={() => changeLanguage('en')}>EN</button>
      <button onClick={() => changeLanguage('zh')}>中文</button>
      <button onClick={() => changeLanguage('fil')}>Filipino</button>
    </div>
  );
}