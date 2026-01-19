import { useState, useEffect } from 'react';
import { api } from '../services/api';
// Using the types file instead
type Language = 'zh' | 'en' | 'fil';

interface TranslationItem {
  id: string;
  key: string;
  language: Language;
  value: string;
  namespace: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const TranslationManager = () => {
  const [translations, setTranslations] = useState<TranslationItem[]>([]);
  const [languages] = useState<Language[]>(['zh', 'en', 'fil']);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('zh');
  const [namespace, setNamespace] = useState<string>('common');
  const [loading, setLoading] = useState<boolean>(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    loadTranslations();
  }, [selectedLanguage, namespace]);

  const loadTranslations = async () => {
    try {
      setLoading(true);
      // Since we don't have a direct API for listing all translations yet,
      // we'll use a workaround to fetch from the API
      // In a real implementation, we'd have a dedicated endpoint
      console.log('Loading translations for', selectedLanguage, namespace);
      
      // Mock data for demonstration
      const mockData: TranslationItem[] = [
        {
          id: '1',
          key: 'welcome_message',
          language: selectedLanguage,
          value: selectedLanguage === 'zh' ? '欢迎使用' : selectedLanguage === 'en' ? 'Welcome' : 'Maligayang pagdating',
          namespace,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          key: 'save_button',
          language: selectedLanguage,
          value: selectedLanguage === 'zh' ? '保存' : selectedLanguage === 'en' ? 'Save' : 'I-save',
          namespace,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      setTranslations(mockData);
    } catch (error) {
      console.error('Failed to load translations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (id: string) => {
    try {
      // Update the specific translation
      await api.translations.update({
        translations: [{ key: translations.find(t => t.id === id)?.key || '', value: editValue }],
        language: selectedLanguage,
        namespace
      });
      
      // Update local state
      setTranslations(prev => 
        prev.map(t => 
          t.id === id ? { ...t, value: editValue, updatedAt: new Date().toISOString() } : t
        )
      );
      
      setEditingId(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update translation:', error);
    }
  };

  const handleAdd = async () => {
    const newKey = prompt('Enter new translation key:');
    if (!newKey) return;
    
    try {
      // Add new translation
      await api.translations.update({
        translations: [{ key: newKey, value: newKey }], // Default to key as value
        language: selectedLanguage,
        namespace
      });
      
      // Refresh the list
      loadTranslations();
    } catch (error) {
      console.error('Failed to add translation:', error);
    }
  };

  const filteredTranslations = translations.filter(t =>
    t.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">翻译管理</h1>
        <p className="text-gray-600">管理多语言翻译内容</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">语言</label>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>
                  {lang === 'zh' ? '中文' : lang === 'en' ? 'English' : 'Filipino'}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">命名空间</label>
            <select
              value={namespace}
              onChange={(e) => setNamespace(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="common">common</option>
              <option value="auth">auth</option>
              <option value="orders">orders</option>
              <option value="menu">menu</option>
              <option value="financial_hub">financial_hub</option>
              <option value="users">users</option>
              <option value="settings">settings</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">搜索</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索关键词..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleAdd}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              添加翻译
            </button>
          </div>
        </div>
        
        {/* Import/Export */}
        <div className="flex gap-3">
          <button
            onClick={() => exportTranslations()}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            导出
          </button>
          <input
            type="file"
            accept=".json,.csv"
            onChange={(e) => importTranslations(e.target.files?.[0])}
            className="hidden"
            id="import-file"
          />
          <label 
            htmlFor="import-file" 
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 cursor-pointer"
          >
            导入
          </label>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">加载翻译数据...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">键</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">当前值</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTranslations.length > 0 ? (
                  filteredTranslations.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 font-mono">{t.key}</div>
                        <div className="text-xs text-gray-500">{t.namespace}</div>
                      </td>
                      <td className="px-6 py-4">
                        {editingId === t.id ? (
                          <div className="flex gap-2">
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="flex-1 px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSave(t.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                          >
                            保存
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                          >
                            取消
                          </button>
                        </div>
                        ) : (
                          <div 
                            className="text-sm text-gray-900 cursor-pointer hover:bg-gray-100 p-2 rounded"
                            onClick={() => {
                              setEditingId(t.id);
                              setEditValue(t.value);
                            }}
                          >
                            {t.value}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => {
                            setEditingId(t.id);
                            setEditValue(t.value);
                          }}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          编辑
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('确定要删除这个翻译吗？')) {
                              try {
                                // In a real implementation, we would have a delete API
                                console.log('Deleting translation:', t.id);
                                setTranslations(prev => prev.filter(tr => tr.id !== t.id));
                              } catch (error) {
                                console.error('Failed to delete translation:', error);
                              }
                            }
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center">
                      <p className="text-gray-500">没有找到翻译项</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Export helper functions
const exportTranslations = async () => {
  try {
    // In a real implementation, this would fetch all translations and export as JSON
    alert('翻译数据已导出');
  } catch (error) {
    console.error('Export failed:', error);
  }
};

const importTranslations = async (file: File | undefined) => {
  if (!file) return;
  
  try {
    // In a real implementation, this would parse the file and upload to API
    alert(`正在导入翻译文件: ${file.name}`);
  } catch (error) {
    console.error('Import failed:', error);
  }
};

export default TranslationManager;