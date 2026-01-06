
import { RoomStatus, Dish, User, UserRole, CRUDPermissions, AppModule } from './types';

export const ROOM_NUMBERS = [
  ...Array.from({ length: 32 }, (_, i) => (8201 + i).toString()),
  ...Array.from({ length: 32 }, (_, i) => (8301 + i).toString()),
  'VIP-666', 'VIP-888', 'VIP-000'
];

const FULL_CRUD: CRUDPermissions = { enabled: true, c: true, r: true, u: true, d: true };
const ALL_MODULE_PERMS: Record<AppModule, CRUDPermissions> = {
  dashboard: FULL_CRUD,
  rooms: FULL_CRUD,
  orders: FULL_CRUD,
  menu: FULL_CRUD,
  finance: FULL_CRUD,
  partners: FULL_CRUD,
  users: FULL_CRUD,
  settings: FULL_CRUD,
  database: FULL_CRUD,
  images: FULL_CRUD,
  inventory: FULL_CRUD,
  payments: FULL_CRUD,
  supply_chain: FULL_CRUD,
  financial_hub: FULL_CRUD
};

// 分类体系定义 - 严格对齐规格说明
export const CATEGORIES = ['主食套餐类', '中式炒菜类', '粤式菜品', '中式主食类', '基础主食'];

export const INITIAL_DISHES: Dish[] = [
  // --- 一、主食套餐类 (扒饭 + 意面 + 汤饭) ---
  // 1.1 扒饭系列
  { id: 'A1', name: '黑椒猪扒饭', nameEn: 'Black Pepper Pork Chop Rice', price: 260, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/fOtr1vngVN', isAvailable: true },
  { id: 'A2', name: '黑椒牛扒饭', nameEn: 'Black Pepper Beef Steak Rice', price: 320, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/O9k01vngVg', isAvailable: true },
  { id: 'A3', name: '黑椒鸡扒饭', nameEn: 'Black Pepper Chicken Chop Rice', price: 240, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/fOtr1vngVN', isAvailable: true },
  { id: 'A8', name: '咖喱牛排饭', nameEn: 'Curry Beef Steak Rice', price: 330, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/GhGJ1vngVg', isAvailable: true },
  { id: 'A9', name: '咖喱猪排饭', nameEn: 'Curry Pork Chop Rice', price: 270, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/kdV61vngVg', isAvailable: true },
  { id: 'A10', name: '咖喱鸡排饭', nameEn: 'Curry Chicken Chop Rice', price: 250, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/kdV61vngVg', isAvailable: true },
  { id: 'A18', name: '可乐鸡翅饭', nameEn: 'Coke Chicken Wings Rice', price: 220, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/TxZ31vngV4', isAvailable: true },
  { id: 'A19', name: '台式卤肉饭', nameEn: 'Taiwanese Braised Pork Rice', price: 200, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/s3e11vngV4', isRecommended: true },
  { id: 'A20', name: '蜜汁鸡腿饭', nameEn: 'Honey Glazed Chicken Leg Rice', price: 240, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/bQXL1vngV4', isAvailable: true },
  { id: 'A21', name: '白切鸡腿饭', nameEn: 'Poached Chicken Leg Rice', price: 240, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/cd7J1vngVN', isAvailable: true },
  { id: 'A22', name: '糖醋鸡扒饭', nameEn: 'Sweet & Sour Chicken Chop Rice', price: 240, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/Y8in1vngVN', isAvailable: true },
  { id: 'A23', name: '糖醋牛扒饭', nameEn: 'Sweet & Sour Beef Steak Rice', price: 300, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/JVHR1vngVO', isAvailable: true },
  { id: 'A24', name: '糖醋猪扒饭', nameEn: 'Sweet & Sour Pork Chop Rice', price: 260, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/UC6V1vngVN', isAvailable: true },
  { id: 'A25', name: '糖醋鱼块饭', nameEn: 'Sweet & Sour Fish Fillet Rice', price: 260, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/NVrH1vngVO', isAvailable: true },
  
  // 1.2 意面系列
  { id: 'A4', name: '黑椒牛柳意面', nameEn: 'Black Pepper Beef Spaghetti', price: 280, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/bwHV1vngVg', isAvailable: true },
  { id: 'A5', name: '黑椒猪扒意面', nameEn: 'Black Pepper Pork Spaghetti', price: 260, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/gJWb1vngVg', isAvailable: true },
  { id: 'A6', name: '黑椒鸡扒意面', nameEn: 'Black Pepper Chicken Spaghetti', price: 240, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/jlJB1vngVg', isAvailable: true },
  { id: 'A7', name: '黑椒牛扒意面', nameEn: 'Black Pepper Steak Spaghetti', price: 320, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/O9k01vngVg', isAvailable: true },
  { id: 'A11', name: '咖喱牛排意面', nameEn: 'Curry Beef Steak Spaghetti', price: 330, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isAvailable: true },
  { id: 'A12', name: '咖喱猪排意面', nameEn: 'Curry Pork Chop Spaghetti', price: 270, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/25Lc1vngV4', isAvailable: true },
  { id: 'A13', name: '咖喱鸡排意面', nameEn: 'Curry Chicken Chop Spaghetti', price: 250, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isAvailable: true },
  { id: 'A14', name: '番茄肉酱意面', nameEn: 'Tomato Bolognese Spaghetti', price: 220, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isAvailable: true },
  { id: 'A15', name: '番茄香肠意面', nameEn: 'Tomato Sausage Spaghetti', price: 210, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/25Lc1vngV4', isAvailable: true },
  { id: 'A16', name: '番茄牛肉意面', nameEn: 'Tomato Beef Spaghetti', price: 240, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isAvailable: true },
  { id: 'A17', name: '番茄虾仁意面', nameEn: 'Tomato Shrimp Spaghetti', price: 280, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/BULP1vngV4', isAvailable: true },

  // 1.3 汤饭系列
  { id: 'E1', name: '酸菜鱼 + 米饭', nameEn: 'Sauerkraut Fish with Rice', price: 320, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/XCPO1vngWj', isAvailable: true },
  { id: 'E2', name: '水煮鱼 + 米饭', nameEn: 'Boiled Fish with Rice', price: 320, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/WUVa1vngZS', isAvailable: true },
  { id: 'E3', name: '腌菜扣肉 + 米饭', nameEn: 'Preserved Veggie with Pork Rice', price: 280, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/s3e11vngV4', isAvailable: true },
  { id: 'E4', name: '脆皮五花肉 + 米饭', nameEn: 'Crispy Pork Belly with Rice', price: 350, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/25FF1vngmT', isAvailable: true },
  { id: 'E5', name: '海滲鲍鱼捞饭', nameEn: 'Abalone & Sea Cucumber Rice', price: 980, category: '主食套餐类', stock: 20, imageUrl: 'https://aka.doubaocdn.com/s/6EA01vngmk', isRecommended: true },
  { id: 'E6', name: '剁椒蒸鱼头 + 米饭', nameEn: 'Steamed Fish Head with Rice', price: 420, category: '主食套餐类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/j2511vngXW', isAvailable: true },
  { id: 'E7', name: '水煮肉片 + 米饭', nameEn: 'Sichuan Boiled Pork with Rice', price: 320, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: true },
  { id: 'E8', name: '金汤酸菜肉片 + 米饭', nameEn: 'Golden Soup Pork with Rice', price: 320, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/axCm1vngZT', isAvailable: true },
  { id: 'E9', name: '金汤酸菜鱼 + 米饭', nameEn: 'Golden Soup Fish with Rice', price: 350, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/2doW1vngWN', isAvailable: true },
  { id: 'E10', name: '酸汤肥牛 + 米饭', nameEn: 'Sour Soup Beef with Rice', price: 380, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/HcU81vngWj', isAvailable: true },
  { id: 'E11', name: '海鲜冬阴功 + 米饭', nameEn: 'Seafood Tom Yum with Rice', price: 380, category: '主食套餐类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/QEzX1vngWk', isAvailable: true },

  // --- 二、中式主食类 (面食 + 炒饭) ---
  { id: 'B1', name: '云吞', nameEn: 'Wonton Soup', price: 150, category: '中式主食类', stock: 200, imageUrl: 'https://aka.doubaocdn.com/s/DDJg1vngX9', isAvailable: true },
  { id: 'B2', name: '水饺', nameEn: 'Dumplings', price: 160, category: '中式主食类', stock: 200, imageUrl: 'https://aka.doubaocdn.com/s/TQ0Y1vngX9', isAvailable: true },
  { id: 'B3', name: '海鲜炒饭', nameEn: 'Seafood Fried Rice', price: 220, category: '中式主食类', stock: 150, imageUrl: 'https://aka.doubaocdn.com/s/XO3W1vngX9', isRecommended: true },
  { id: 'B4', name: '三丝炒面', nameEn: 'Fried Noodles with Three Shreds', price: 180, category: '中式主食类', stock: 150, imageUrl: 'https://aka.doubaocdn.com/s/xErt1vngXA', isAvailable: true },
  { id: 'B5', name: '酸菜炒米粉', nameEn: 'Stir-fried Rice Noodles with Pickled Veg', price: 180, category: '中式主食类', stock: 150, imageUrl: 'https://aka.doubaocdn.com/s/q1Db1vngX9', isAvailable: true },

  // --- 三、中式炒菜类 (辣味 + 家常 + 酸菜鱼) ---
  { id: 'C1', name: '野山椒爆牛肉', nameEn: 'Beef with Wild Chili', price: 480, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/UI5c1vngXA', isRecommended: true },
  { id: 'C2', name: '柠檬酸菜鱼', nameEn: 'Lemon Sauerkraut Fish', price: 580, category: '中式炒菜类', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/gE6j1vngWN', isAvailable: true },
  { id: 'C3', name: '歌山辣子鸡', nameEn: 'Geshan Spicy Chicken', price: 420, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/JTO21vngXW', isAvailable: true },
  { id: 'C4', name: '新派麻婆豆腐', nameEn: 'Modern Mapo Tofu', price: 260, category: '中式炒菜类', stock: 80, imageUrl: 'https://aka.doubaocdn.com/s/CvQO1vngXW', isAvailable: true },
  { id: 'C5', name: '湖南小炒肉', nameEn: 'Hunan Fried Pork', price: 380, category: '中式炒菜类', stock: 60, imageUrl: 'https://aka.doubaocdn.com/s/GfZG1vngXW', isRecommended: true },
  { id: 'C6', name: '剁椒鱼头', nameEn: 'Steamed Fish Head with Chili', price: 680, category: '中式炒菜类', stock: 30, imageUrl: 'https://aka.doubaocdn.com/s/j2511vngXW', isAvailable: true },
  { id: 'C7', name: '川味大虾球', nameEn: 'Sichuan Prawn Balls', price: 580, category: '中式炒菜类', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/Ni9l1vngXW', isAvailable: true },
  { id: 'C8', name: '干锅椒麻鸭', nameEn: 'Spicy Dry-Pot Duck', price: 450, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/kUCF1vngWM', isAvailable: true },
  { id: 'C9', name: '小炒黄牛肉', nameEn: 'Sautéed Yellow Beef', price: 480, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/bC2T1vngWM', isAvailable: true },
  { id: 'C10', name: '土豆红烧肉', nameEn: 'Braised Pork with Potatoes', price: 420, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/yjr11vngW0', isAvailable: true },
  { id: 'C11', name: '红烧茄子', nameEn: 'Braised Eggplant', price: 280, category: '中式炒菜类', stock: 80, imageUrl: 'https://aka.doubaocdn.com/s/yjr11vngW0', isAvailable: true },
  { id: 'C12', name: '酸辣土豆丝', nameEn: 'Sour & Spicy Potato Shreds', price: 220, category: '中式炒菜类', stock: 100, imageUrl: 'https://aka.doubaocdn.com/s/N2Bm1vngW0', isAvailable: true },
  { id: 'C13', name: '香辣鱼块', nameEn: 'Spicy Fish Fillets', price: 380, category: '中式炒菜类', stock: 60, imageUrl: 'https://aka.doubaocdn.com/s/Bhv81vngW0', isAvailable: true },
  { id: 'C14', name: '水煮肉片', nameEn: 'Sichuan Boiled Pork', price: 420, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: true },
  { id: 'C15', name: '水煮鱼', nameEn: 'Sichuan Boiled Fish', price: 580, category: '中式炒菜类', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/BId41vngW0', isAvailable: true },
  { id: 'C16', name: '葱烧豆腐', nameEn: 'Tofu with Scallions', price: 260, category: '中式炒菜类', stock: 80, imageUrl: 'https://aka.doubaocdn.com/s/YYAJ1vngW0', isAvailable: true },
  { id: 'C17', name: '红烧腐竹', nameEn: 'Braised Tofu Skin', price: 280, category: '中式炒菜类', stock: 70, imageUrl: 'https://aka.doubaocdn.com/s/4N4Y1vngn1', isAvailable: true },
  { id: 'C18', name: '辣椒炒鸡', nameEn: 'Stir-fried Chicken with Chili', price: 380, category: '中式炒菜类', stock: 60, imageUrl: 'https://aka.doubaocdn.com/s/VOwP1vngWM', isAvailable: true },
  { id: 'C19', name: '剁椒牛肉', nameEn: 'Beef with Diced Chili', price: 480, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/hlrV1vngWM', isAvailable: true },
  { id: 'C20', name: '梅菜扣肉', nameEn: 'Steamed Pork with Preserved Veg', price: 450, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/s3e11vngV4', isAvailable: true },
  { id: 'C21', name: '黄豆焖鸡爪', nameEn: 'Chicken Feet with Soybeans', price: 350, category: '中式炒菜类', stock: 60, imageUrl: 'https://aka.doubaocdn.com/s/5yT81vngmU', isAvailable: true },
  { id: 'C22', name: '酸菜扣肉', nameEn: 'Pork with Sauerkraut', price: 450, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/25FF1vngmT', isAvailable: true },
  { id: 'C23', name: '生炒啤酒鸭', nameEn: 'Beer Duck', price: 420, category: '中式炒菜类', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/xIxT1vngmk', isAvailable: true },
  { id: 'C24', name: '香辣铁板鱿鱼', nameEn: 'Spicy Sizzling Squid', price: 580, category: '中式炒菜类', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/490U1vngnf', isAvailable: true },

  // --- 四、粤式菜品 (蒸菜 + 煲仔 + 特色) ---
  { id: 'D1', name: '白切鸡', nameEn: 'Poached Chicken', price: 550, category: '粤式菜品', stock: 30, imageUrl: 'https://aka.doubaocdn.com/s/L5RT1vngXW', isRecommended: true },
  { id: 'D2', name: '豆鼓蒸排骨', nameEn: 'Steamed Ribs with Black Bean', price: 420, category: '粤式菜品', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/wOQT1vngnJ', isAvailable: true },
  { id: 'D3', name: '酸菜炒牛肉', nameEn: 'Fried Beef with Sauerkraut', price: 480, category: '粤式菜品', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/UI5c1vngXA', isAvailable: true },
  { id: 'D4', name: '啫啫鸡煲', nameEn: 'Sizzling Chicken Pot', price: 520, category: '粤式菜品', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/gyM51vngnJ', isAvailable: true },
  { id: 'D5', name: '黑松露芦笋炒澳带', nameEn: 'Scallops with Truffle & Asparagus', price: 880, category: '粤式菜品', stock: 20, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isRecommended: true },
  { id: 'D6', name: '铁棍山药羊肚菌', nameEn: 'Yam with Morel Mushrooms', price: 580, category: '粤式菜品', stock: 30, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isAvailable: true },
  { id: 'D7', name: '凉瓜黑椒牛柳', nameEn: 'Beef with Bitter Melon', price: 480, category: '粤式菜品', stock: 50, imageUrl: 'https://aka.doubaocdn.com/s/490U1vngnf', isAvailable: true },
  { id: 'D8', name: '野菜花炒五花肉', nameEn: 'Cauliflower with Pork Belly', price: 380, category: '粤式菜品', stock: 60, imageUrl: 'https://aka.doubaocdn.com/s/25FF1vngmT', isAvailable: true },
  { id: 'D9', name: '荷塘月色', nameEn: 'Stir-fried Lotus & Veggies', price: 320, category: '粤式菜品', stock: 80, imageUrl: 'https://aka.doubaocdn.com/s/4N4Y1vngn1', isAvailable: true },
  { id: 'D10', name: '虫草花蒸土鸡', nameEn: 'Steamed Chicken with Cordyceps', price: 650, category: '粤式菜品', stock: 30, imageUrl: 'https://aka.doubaocdn.com/s/vSQU1vngWj', isAvailable: true },
  { id: 'D11', name: '凉瓜排骨煲', nameEn: 'Bitter Melon Ribs Pot', price: 480, category: '粤式菜品', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/gyM51vngnJ', isAvailable: true },
  { id: 'D12', name: '金汤酸菜鱼', nameEn: 'Golden Soup Sauerkraut Fish', price: 580, category: '中式炒菜类', stock: 40, imageUrl: 'https://aka.doubaocdn.com/s/2doW1vngWN', isAvailable: true },
  { id: 'D13', name: '铁牛仔骨', nameEn: 'Sizzling Beef Short Ribs', price: 680, category: '粤式菜品', stock: 30, imageUrl: 'https://aka.doubaocdn.com/s/ldsg1vngWj', isAvailable: true },
  { id: 'D14', name: '金汤土鸡海鲜煲', nameEn: 'Chicken & Seafood Pot', price: 880, category: '粤式菜品', stock: 20, imageUrl: 'https://aka.doubaocdn.com/s/QEzX1vngWk', isAvailable: true },
  { id: 'D15', name: '酸梅鸭', nameEn: 'Plum Duck', price: 550, category: '粤式菜品', stock: 30, imageUrl: 'https://aka.doubaocdn.com/s/xIxT1vngmk', isAvailable: true },

  // --- 五、基础主食 ---
  { id: 'E12', name: '米饭', nameEn: 'Steamed Rice', price: 30, category: '基础主食', stock: 999, imageUrl: 'https://aka.doubaocdn.com/s/Ywp51vngWj', isAvailable: true },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-root',
    username: 'admin',
    email: 'admin@jxcloud.com',
    password: 'admin',
    role: UserRole.ADMIN,
    name: '系统管理员',
    modulePermissions: ALL_MODULE_PERMS,
    isOnline: false
  }
];

export const COLORS = { primary: '#2563eb', success: '#22c55e', danger: '#ef4444', warning: '#f59e0b' };