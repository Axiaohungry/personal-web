export const foodLibraryGroups = [
  {
    key: 'staples',
    title: '主食与碳水来源',
    description: '适合围绕训练安排碳水的基础食物，优先选择容易称量、容易长期执行的来源。',
    items: [
      { name: '米饭 100g', calories: 116, carbs: 25.9, protein: 2.6, fat: 0.3, scene: '训练后 / 主餐基础碳水' },
      { name: '燕麦 100g', calories: 380, carbs: 62, protein: 13.4, fat: 7, scene: '早餐 / 训练前 2 小时' },
      { name: '土豆 100g', calories: 77, carbs: 17, protein: 2.1, fat: 0.1, scene: '减脂期提高饱腹感' },
      { name: '意面 100g（熟）', calories: 157, carbs: 30.9, protein: 5.8, fat: 0.9, scene: '高碳日和高容量训练' },
    ],
  },
  {
    key: 'protein',
    title: '高蛋白食材',
    description: '蛋白质优先固定，再在这个基础上做碳水策略调整。',
    items: [
      { name: '鸡胸肉 100g', calories: 118, carbs: 0, protein: 24, fat: 1.9, scene: '低脂、高频备餐' },
      { name: '牛里脊 100g', calories: 133, carbs: 0, protein: 20, fat: 5.4, scene: '训练期轮换、补铁' },
      { name: '鸡蛋 100g', calories: 144, carbs: 1.1, protein: 13, fat: 9.5, scene: '早餐 / 加餐' },
      { name: '低脂希腊酸奶 100g', calories: 65, carbs: 4, protein: 10, fat: 0.4, scene: '训练后 / 控制脂肪' },
    ],
  },
  {
    key: 'satiety',
    title: '高纤维与高体积食材',
    description: '用来撑体积、补纤维、稳定饱腹感，尤其适合减脂和低碳日。',
    items: [
      { name: '西兰花 100g', calories: 34, carbs: 6.5, protein: 2.8, fat: 0.4, scene: '减脂期标配蔬菜' },
      { name: '菠菜 100g', calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, scene: '汤、炒菜、蛋饼' },
      { name: '番茄 100g', calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, scene: '增加体积感和风味' },
      { name: '蘑菇 100g', calories: 22, carbs: 3.4, protein: 3, fat: 0.3, scene: '替换高油配菜' },
    ],
  },
]
