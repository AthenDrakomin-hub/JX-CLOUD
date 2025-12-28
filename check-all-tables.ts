import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function checkAllTables() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  console.log('检查已知表是否存在...');
  
  const knownTables = [
    'dishes', 
    'rooms', 
    'orders', 
    'profiles', 
    'expenses', 
    'materials', 
    'payment_configs', 
    'translations', 
    'security_logs'
  ];
  
  const existingTables = [];
  const missingTables = [];
  
  for (const table of knownTables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count')
        .limit(1);
        
      if (error) {
        missingTables.push(table);
        console.log(`❌ ${table}: 不存在 - ${typeof error === 'object' && 'message' in error ? (error as any).message : 'Unknown error'}`);
      } else {
        existingTables.push(table);
        console.log(`✅ ${table}: 存在`);
      }
    } catch (err: any) {
      missingTables.push(table);
      console.log(`❌ ${table}: 不存在 - ${typeof err === 'object' && err && 'message' in err ? (err as any).message : 'Unknown error'}`);
    }
  }
  
  console.log(`\n总结: ${existingTables.length} 个表存在, ${missingTables.length} 个表缺失`);
  console.log('存在的表:', existingTables);
  console.log('缺失的表:', missingTables);
}

checkAllTables();