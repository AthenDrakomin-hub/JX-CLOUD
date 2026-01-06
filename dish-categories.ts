// 菜品分类体系的TypeScript类型定义 - 优化版

// 主要分类枚举
export enum MainCategory {
  MAIN_DISHES = '主食套餐类',      // 扒饭系列、意面系列、汤饭系列
  CHINESE_MAIN = '中式主食类',     // 面食类、炒饭类
  CHINESE_STIR_FRY = '中式炒菜类', // 辣味炒菜、家常炒菜、酸菜鱼系列
  CANTONESE_DISHES = '粤式菜品',   // 蒸菜类、煲仔类、粤式特色炒菜、特色菜品
  BASIC_STAPLE = '基础主食'        // 米饭类、其他主食
}

// 子分类枚举
export enum SubCategory {
  // 主食套餐类子分类
  GRILLED_RICE_SERIES = '扒饭系列',
  PASTA_SERIES = '意面系列',
  SOUP_RICE_SERIES = '汤饭系列',
  
  // 中式主食类子分类
  NOODLE_DISHES = '面食类',
  FRIED_RICE_DISHES = '炒饭类',
  
  // 中式炒菜类子分类
  SPICY_STIR_FRY = '辣味炒菜',
  HOME_STIR_FRY = '家常炒菜',
  SAUERKRAUT_FISH_SERIES = '酸菜鱼系列',
  
  // 粤式菜品子分类
  STEAMED_DISHES = '蒸菜类',
  HOT_POT_DISHES = '煲仔类',
  CANTONESE_SPECIAL_STIR_FRY = '粤式特色炒菜',
  SPECIAL_DISHES = '特色菜品',
  
  // 基础主食子分类
  RICE_DISHES = '米饭类',
  OTHER_STAPLE = '其他主食'
}

// 菜品分类结构
export interface DishCategory {
  id: number;                    // 分类ID
  name: string;                  // 分类名称
  code: string;                  // 分类代码 (如 'A', 'B', 'C', 'D', 'E')
  mainCategory: MainCategory;    // 主分类
  subCategory: SubCategory;      // 子分类
  parentCategoryId?: number;     // 父分类ID (用于层级结构)
  level: number;                 // 分类层级 (1=主分类, 2=子分类, 3=细分类)
  dishIds?: string[] | undefined; // 属于该分类的菜品ID列表
  displayOrder: number;          // 显示顺序
  isActive: boolean;             // 是否激活
  createdAt?: string | null;     // 创建时间
  updatedAt?: string | null;     // 更新时间
}

// 完整的菜品分类树结构
export interface DishCategoryTree {
  id: number;
  name: string;
  code: string;                  // 分类代码 (如 'A', 'B', 'C', 'D', 'E')
  mainCategory: MainCategory;
  children: DishCategoryTree[];  // 子分类
  dishes: DishInCategory[];      // 直接属于该分类的菜品
  displayOrder: number;
  createdAt?: string | null;     // 创建时间
  updatedAt?: string | null;     // 更新时间
}

// 分类中的菜品信息
export interface DishInCategory {
  idx: number;                   // 序号
  id: string;                    // 菜品ID (如 'A1', 'A2', 'B1', etc.)
  name: string;                  // 中文名称
  nameEn?: string;               // 英文名称
  price: number;                 // 价格 (单位: 元)
  stock: number;                 // 库存
  imageUrl?: string;             // 图片链接
  isAvailable: boolean;          // 是否可用
  createdAt?: string | null;     // 创建时间
  categoryPath: string;          // 分类路径 (如 '主食套餐类/扒饭系列')
}

// 菜品分类配置
export interface CategoryConfig {
  categories: DishCategoryTree[];
  totalDishCount: number;        // 总菜品数量
  categoryCount: number;         // 分类总数
  coverageRate: number;          // 分类覆盖率
  distribution: CategoryDistribution[]; // 分类分布统计
}

// 分类分布统计
export interface CategoryDistribution {
  mainCategory: MainCategory;
  dishCount: number;
  percentage: number;
}

// 实用工具函数
export const DishCategoryUtils = {
  // 统计总菜品数量
  getTotalDishCount: (config: CategoryConfig): number => {
    let count = 0;
    const countDishes = (categories: DishCategoryTree[]) => {
      for (const cat of categories) {
        count += cat.dishes.length;
        if (cat.children.length > 0) {
          countDishes(cat.children);
        }
      }
    };
    countDishes(config.categories);
    return count;
  },

  // 统计分类数量
  getCategoryCount: (config: CategoryConfig): number => {
    let count = 0;
    const countCategories = (categories: DishCategoryTree[]) => {
      count += categories.length;
      for (const cat of categories) {
        if (cat.children.length > 0) {
          countCategories(cat.children);
        }
      }
    };
    countCategories(config.categories);
    return count;
  },

  // 按主分类统计菜品数量
  getDistribution: (config: CategoryConfig): CategoryDistribution[] => {
    const distributionMap = new Map<MainCategory, number>();
    
    const countByMainCategory = (categories: DishCategoryTree[]) => {
      for (const cat of categories) {
        const currentCount = distributionMap.get(cat.mainCategory) || 0;
        distributionMap.set(cat.mainCategory, currentCount + cat.dishes.length);
        
        if (cat.children.length > 0) {
          countByMainCategory(cat.children);
        }
      }
    };
    
    countByMainCategory(config.categories);
    
    return Array.from(distributionMap.entries()).map(([mainCategory, dishCount]) => {
      const percentage = parseFloat(((dishCount / config.totalDishCount) * 100).toFixed(1));
      return { mainCategory, dishCount, percentage };
    });
  },

  // 根据ID查找菜品
  findDishById: (config: CategoryConfig, dishId: string): DishInCategory | undefined => {
    const findInTree = (categories: DishCategoryTree[]): DishInCategory | undefined => {
      for (const cat of categories) {
        const dish = cat.dishes.find(d => d.id === dishId);
        if (dish) return dish;
        
        if (cat.children.length > 0) {
          const found = findInTree(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return findInTree(config.categories);
  },

  // 根据分类路径查找分类
  findCategoryByPath: (config: CategoryConfig, path: string): DishCategoryTree | undefined => {
    const findInTree = (categories: DishCategoryTree[]): DishCategoryTree | undefined => {
      for (const cat of categories) {
        if (cat.name === path.split('/').pop()) {
          return cat;
        }
        
        if (cat.children.length > 0) {
          const found = findInTree(cat.children);
          if (found) return found;
        }
      }
      return undefined;
    };
    
    return findInTree(config.categories);
  },

  // 价格转换：分转元
  convertPriceToYuan: (priceInCents: number): number => {
    return priceInCents / 100;
  },

  // 价格转换：元转分
  convertPriceToCents: (priceInYuan: number): number => {
    return Math.round(priceInYuan * 100);
  }
};

// 菜品分类数据
export const DISH_CATEGORIES: CategoryConfig = (() => {
  const categories: DishCategoryTree[] = [
    {
      id: 1,
      name: '主食套餐类',
      code: 'A',
      mainCategory: MainCategory.MAIN_DISHES,
      displayOrder: 1,
      createdAt: null,
      updatedAt: null,
      children: [
        {
          id: 11,
          name: '扒饭系列',
          code: 'A',
          mainCategory: MainCategory.MAIN_DISHES,
          displayOrder: 1,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 0, id: 'A1', name: '黑椒猪扒饭', nameEn: 'Black pepper pork chop rice', price: 999.00, stock: 10, imageUrl: 'https://aka.doubaocdn.com/s/jiIt1vneNC', isAvailable: true, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 1, id: 'A2', name: '黑椒牛扒饭', nameEn: 'Black pepper steak rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/O9k01vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 2, id: 'A3', name: '黑椒鸡扒饭', nameEn: 'Black pepper chicken rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/fOtr1vngVN', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 7, id: 'A8', name: '咖喱牛排饭', nameEn: 'Curry Steak Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/GhGJ1vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 8, id: 'A9', name: '咖喱猪排饭', nameEn: 'Curry Pork Chop Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/kdV61vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 9, id: 'A10', name: '咖喱鸡排饭', nameEn: 'Curry Chicken Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/yvSv1vneNC', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 17, id: 'A18', name: '可乐鸡翅饭', nameEn: 'Cola Chicken Wings Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/TxZ31vngV4', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 18, id: 'A19', name: '台式卤肉饭', nameEn: 'Taiwanese braised pork rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/s3e11vngV4', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 19, id: 'A20', name: '蜜汁鸡腿饭', nameEn: 'Honey Glazed Chicken Leg Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/bQXL1vngV4', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 20, id: 'A21', name: '白切鸡腿饭', nameEn: 'White-cut chicken leg rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/cd7J1vngVN', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 21, id: 'A22', name: '糖醋鸡扒饭', nameEn: 'Sweet and Sour Chicken Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/Y8in1vngVN', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 22, id: 'A23', name: '糖醋牛扒饭', nameEn: 'Sweet and Sour Beef Steak Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/JVHR1vngVO', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 23, id: 'A24', name: '糖醋猪扒饭', nameEn: 'Sweet and Sour Pork Chop Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/UC6V1vngVN', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' },
            { idx: 24, id: 'A25', name: '糖醋鱼块饭', nameEn: 'Sweet and Sour Fish Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/NVrH1vngVO', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/扒饭系列' }
          ]
        },
        {
          id: 12,
          name: '意面系列',
          code: 'A',
          mainCategory: MainCategory.MAIN_DISHES,
          displayOrder: 2,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 3, id: 'A4', name: '黑椒牛柳意面', nameEn: 'Black pepper beef tenderloin pasta', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/bwHV1vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 4, id: 'A5', name: '黑椒猪扒意面', nameEn: 'Black pepper pork chop pasta', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/gJWb1vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 5, id: 'A6', name: '黑椒鸡扒意面', nameEn: 'Black Pepper Chicken Spaghetti', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/jlJB1vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 6, id: 'A7', name: '黑椒牛扒意面', nameEn: 'Black pepper steak pasta', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/O9k01vngVg', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 10, id: 'A11', name: '咖喱牛排意面', nameEn: 'Curry Steak Pasta', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/BqeH1vneNC', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 11, id: 'A12', name: '咖喱猪排意面', nameEn: 'Curry Pork Chop Spaghetti', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/YUky1vneNC', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 12, id: 'A13', name: '咖喱鸡排意面', nameEn: 'Curry Chicken Spaghetti', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/gqw61vneNC', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 13, id: 'A14', name: '番茄肉酱意面', nameEn: 'Spaghetti Bolognese', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/lCKA1vneNC', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 14, id: 'A15', name: '番茄香肠意面', nameEn: 'Tomato and sausage pasta', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/25Lc1vngV4', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 15, id: 'A16', name: '番茄牛肉意面', nameEn: 'Tomato Beef Spaghetti', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/RaUY1vngV4', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' },
            { idx: 16, id: 'A17', name: '番茄虾仁意面', nameEn: 'Tomato and Shrimp Spaghetti', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/BULP1vngV4', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/意面系列' }
          ]
        },
        {
          id: 13,
          name: '汤饭系列',
          code: 'E',
          mainCategory: MainCategory.MAIN_DISHES,
          displayOrder: 3,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 69, id: 'E1', name: '酸菜鱼+米饭', nameEn: 'Sauerkraut fish + rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/XCPO1vngWj', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 73, id: 'E2', name: '水煮鱼+米饭', nameEn: 'Boiled fish with rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/BId41vngW0', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 74, id: 'E3', name: '腌菜扣肉+米饭', nameEn: 'Pickled vegetables and braised pork belly + rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 75, id: 'E4', name: '脆皮五花肉+米饭', nameEn: 'Crispy pork belly + rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 76, id: 'E5', name: '海滲鲍鱼捞饭', nameEn: 'Seaweed Abalone Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 77, id: 'E6', name: '剁椒蒸鱼头+米饭', nameEn: 'Steamed fish head with chopped chili peppers and rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/hlrV1vngWM', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 78, id: 'E7', name: '水煮肉片+米饭', nameEn: 'Boiled sliced pork with rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 79, id: 'E8', name: '金汤酸菜肉片+米饭', nameEn: 'Golden Broth with Sauerkraut and Sliced Pork + Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/2doW1vngWN', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 80, id: 'E9', name: '金汤酸菜鱼+米饭', nameEn: 'Golden Broth Sauerkraut Fish + Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/2doW1vngWN', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 70, id: 'E10', name: '酸汤肥牛+米饭', nameEn: 'Sour Soup Beef with Rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/HcU81vngWj', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' },
            { idx: 71, id: 'E11', name: '海鲜冬阴功+米饭', nameEn: 'Seafood Tom Yum soup with rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/QEzX1vngWk', isAvailable: false, createdAt: null, categoryPath: '主食套餐类/汤饭系列' }
          ]
        }
      ],
      dishes: []
    },
    {
      id: 2,
      name: '中式主食类',
      code: 'B',
      mainCategory: MainCategory.CHINESE_MAIN,
      displayOrder: 2,
      createdAt: null,
      updatedAt: null,
      children: [
        {
          id: 21,
          name: '面食类',
          code: 'B',
          mainCategory: MainCategory.CHINESE_MAIN,
          displayOrder: 1,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 25, id: 'B1', name: '云吞', nameEn: 'ravioli', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/mpp11vnePQ', isAvailable: false, createdAt: null, categoryPath: '中式主食类/面食类' },
            { idx: 26, id: 'B2', name: '水饺', nameEn: 'Dumplings', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/VphQ1vnePQ', isAvailable: false, createdAt: null, categoryPath: '中式主食类/面食类' },
            { idx: 28, id: 'B4', name: '三丝炒面', nameEn: 'Three shredded fried noodles', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/R2191vnePQ', isAvailable: false, createdAt: null, categoryPath: '中式主食类/面食类' },
            { idx: 29, id: 'B5', name: '酸菜炒米粉', nameEn: 'Pickled cabbage fried rice noodles', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/nNrf1vnePQ', isAvailable: false, createdAt: null, categoryPath: '中式主食类/面食类' }
          ]
        },
        {
          id: 22,
          name: '炒饭类',
          code: 'B',
          mainCategory: MainCategory.CHINESE_MAIN,
          displayOrder: 2,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 27, id: 'B3', name: '海鲜炒饭', nameEn: 'Seafood fried rice', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/GRhd1vnePR', isAvailable: false, createdAt: null, categoryPath: '中式主食类/炒饭类' }
          ]
        }
      ],
      dishes: []
    },
    {
      id: 3,
      name: '中式炒菜类',
      code: 'C',
      mainCategory: MainCategory.CHINESE_STIR_FRY,
      displayOrder: 3,
      createdAt: null,
      updatedAt: null,
      children: [
        {
          id: 31,
          name: '辣味炒菜',
          code: 'C',
          mainCategory: MainCategory.CHINESE_STIR_FRY,
          displayOrder: 1,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 30, id: 'C1', name: '野山椒爆牛肉', nameEn: 'Stir-fried Beef with Wild Chili', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/GZCF1vneNr', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 47, id: 'C3', name: '歌山辣子鸡', nameEn: 'Geshan Spicy Chicken', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/FGhq1vneNs', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 48, id: 'C4', name: '新派麻婆豆腐', nameEn: 'New-style Mapo Tofu', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/8d1z1vneNs', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 49, id: 'C5', name: '湖南小炒肉', nameEn: 'Hunan-style stir-fried pork', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/qoiw1vneNr', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 50, id: 'C6', name: '剁椒鱼头', nameEn: 'Steamed Fish Head with Chopped Chili', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/c4pA1vneNr', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 51, id: 'C7', name: '川味大虾球', nameEn: 'Sichuan-style shrimp balls', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/0hGt1vneNr', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 52, id: 'C8', name: '干锅椒麻鸭', nameEn: 'Dry Pot Sichuan Pepper Duck', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/kUCF1vngWM', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 53, id: 'C9', name: '小炒黄牛肉', nameEn: 'Stir-fried yellow beef', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/bC2T1vngWM', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 34, id: 'C13', name: '香辣鱼块', nameEn: 'Spicy Fish Chunks', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/Bhv81vngW0', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 35, id: 'C14', name: '水煮肉片', nameEn: 'Boiled Sliced Pork', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/edXg1vngW1', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 36, id: 'C15', name: '水煮鱼', nameEn: 'boiled fish', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/BId41vngW0', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 39, id: 'C18', name: '辣椒炒鸡', nameEn: 'Chili Fried Chicken', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/VOwP1vngWM', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 40, id: 'C19', name: '剁椒牛肉', nameEn: 'Beef with chopped peppers', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/hlrV1vngWM', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' },
            { idx: 46, id: 'C24', name: '香辣铁板鱿鱼', nameEn: 'Spicy Grilled Squid', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/lnh01vneQs', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/辣味炒菜' }
          ]
        },
        {
          id: 32,
          name: '家常炒菜',
          code: 'C',
          mainCategory: MainCategory.CHINESE_STIR_FRY,
          displayOrder: 2,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 31, id: 'C10', name: '土豆红烧肉', nameEn: 'Braised Pork with Potatoes', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/G5x71vnePQ', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 32, id: 'C11', name: '红烧茄子', nameEn: 'Braised eggplant', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/yjr11vngW0', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 33, id: 'C12', name: '酸辣土豆丝', nameEn: 'Hot and Sour Shredded Potatoes', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/N2Bm1vngW0', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 37, id: 'C16', name: '葱烧豆腐', nameEn: 'Braised tofu with green onion', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/YYAJ1vngW0', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 38, id: 'C17', name: '红烧腐竹', nameEn: 'Braised yuba', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/0iPW1vneQr', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 42, id: 'C20', name: '梅菜扣肉', nameEn: 'Braised Pork Belly with Preserved Mustard Greens', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/EOAG1vneQt', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 43, id: 'C21', name: '黄豆焖鸡爪', nameEn: 'Braised Pork Belly with Preserved Mustard Greens', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/eqId1vneQs', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 44, id: 'C22', name: '酸菜扣肉', nameEn: 'Sauerkraut and Braised Pork Belly', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/uMoD1vneQr', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' },
            { idx: 45, id: 'C23', name: '生炒啤酒鸭', nameEn: 'Stir-fried Beer Duck', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/JkGJ1vneQs', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/家常炒菜' }
          ]
        },
        {
          id: 33,
          name: '酸菜鱼系列',
          code: 'C',
          mainCategory: MainCategory.CHINESE_STIR_FRY,
          displayOrder: 3,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 41, id: 'C2', name: '柠檬酸菜鱼', nameEn: 'Lemon Sauerkraut Fish', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/gE6j1vngWN', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/酸菜鱼系列' },
            { idx: 57, id: 'D12', name: '金汤酸菜鱼', nameEn: 'Golden Broth Sauerkraut Fish', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/2doW1vngWN', isAvailable: false, createdAt: null, categoryPath: '中式炒菜类/酸菜鱼系列' }
          ]
        }
      ],
      dishes: []
    },
    {
      id: 4,
      name: '粤式菜品',
      code: 'D',
      mainCategory: MainCategory.CANTONESE_DISHES,
      displayOrder: 4,
      createdAt: null,
      updatedAt: null,
      children: [
        {
          id: 41,
          name: '蒸菜类',
          code: 'D',
          mainCategory: MainCategory.CANTONESE_DISHES,
          displayOrder: 1,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 54, id: 'D1', name: '白切鸡', nameEn: 'Blanched chicken', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/ALZI1vneOM', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/蒸菜类' },
            { idx: 61, id: 'D2', name: '豆鼓蒸排骨', nameEn: 'Steamed Pork Ribs with Black Bean Sauce', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/42Ah1vneON', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/蒸菜类' },
            { idx: 55, id: 'D10', name: '虫草花蒸土鸡', nameEn: 'Steamed Chicken with Cordyceps Flower', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/vSQU1vngWj', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/蒸菜类' }
          ]
        },
        {
          id: 42,
          name: '煲仔类',
          code: 'D',
          mainCategory: MainCategory.CANTONESE_DISHES,
          displayOrder: 2,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 63, id: 'D4', name: '啫啫鸡煲', nameEn: 'Sizzling Chicken Hot Pot', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/R9WV1vneOM', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/煲仔类' },
            { idx: 56, id: 'D11', name: '凉瓜排骨煲', nameEn: 'Bitter Melon and Pork Rib Soup', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/C2HI1vneRa', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/煲仔类' },
            { idx: 59, id: 'D14', name: '金汤土鸡海鲜煲', nameEn: 'Golden Broth Chicken and Seafood Hot Pot', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/ArQU1vneRb', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/煲仔类' }
          ]
        },
        {
          id: 43,
          name: '粤式特色炒菜',
          code: 'D',
          mainCategory: MainCategory.CANTONESE_DISHES,
          displayOrder: 3,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 64, id: 'D5', name: '黑松露芦笋炒澳带', nameEn: 'Black Truffle Asparagus Stir-fried with Australian Scallops', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/FlDj1vneON', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/粤式特色炒菜' },
            { idx: 65, id: 'D6', name: '铁棍山药羊肚菌', nameEn: 'Iron yam and morel mushroom', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/Wd541vneOM', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/粤式特色炒菜' },
            { idx: 66, id: 'D7', name: '凉瓜黑椒牛柳', nameEn: 'Bitter melon and black pepper beef tenderloin', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/n5CB1vneRc', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/粤式特色炒菜' },
            { idx: 67, id: 'D8', name: '野菜花炒五花肉', nameEn: 'Stir-fried wild vegetable flowers with pork belly', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/ylhQ1vneRa', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/粤式特色炒菜' },
            { idx: 68, id: 'D9', name: '荷塘月色', nameEn: 'Moonlight over the Lotus Pond', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/dsUA1vneRa', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/粤式特色炒菜' },
            { idx: 60, id: 'D15', name: '酸梅鸭', nameEn: 'Sour plum duck', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/bZt11vneRb', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/粤式特色炒菜' }
          ]
        },
        {
          id: 44,
          name: '特色菜品',
          code: 'D',
          mainCategory: MainCategory.CANTONESE_DISHES,
          displayOrder: 4,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 58, id: 'D13', name: '铁牛仔骨', nameEn: 'Iron Cowboy Bones', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/ldsg1vngWj', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/特色菜品' },
            { idx: 62, id: 'D3', name: '酸菜炒牛肉', nameEn: 'Stir-fried beef with pickled cabbage', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/XUaW1vneOM', isAvailable: false, createdAt: null, categoryPath: '粤式菜品/特色菜品' }
          ]
        }
      ],
      dishes: []
    },
    {
      id: 5,
      name: '基础主食',
      code: 'E',
      mainCategory: MainCategory.BASIC_STAPLE,
      displayOrder: 5,
      createdAt: null,
      updatedAt: null,
      children: [
        {
          id: 51,
          name: '米饭类',
          code: 'E',
          mainCategory: MainCategory.BASIC_STAPLE,
          displayOrder: 1,
          createdAt: null,
          updatedAt: null,
          children: [],
          dishes: [
            { idx: 72, id: 'E12', name: '米饭30p/碗', nameEn: 'Rice 30p/bowl', price: 999.00, stock: 0, imageUrl: 'https://aka.doubaocdn.com/s/Ywp51vngWj', isAvailable: false, createdAt: null, categoryPath: '基础主食/米饭类' }
          ]
        }
      ],
      dishes: []
    }
  ];

  // 动态计算统计数据
  const tempConfig: CategoryConfig = { categories, totalDishCount: 0, categoryCount: 0, coverageRate: 0, distribution: [] };
  const totalDishCount = DishCategoryUtils.getTotalDishCount(tempConfig);
  const categoryCount = DishCategoryUtils.getCategoryCount(tempConfig);
  const distribution = DishCategoryUtils.getDistribution(tempConfig);

  return {
    categories,
    totalDishCount,
    categoryCount,
    coverageRate: 100,
    distribution
  };
})();

// 导出工具函数
export default DishCategoryUtils;