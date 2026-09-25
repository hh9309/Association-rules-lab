import { DatasetCase } from '../types';

export const CLASSIC_CASES: DatasetCase[] = [
  {
    id: 'supermarket',
    title: '超市零售购物篮分析',
    subtitle: 'Classic Market Basket Analysis',
    category: '零售商业',
    algorithmHighlight: 'Apriori 逐层剪枝',
    description: '通过对顾客购物小票中高频共现商品的统计挖掘，发现顾客在一次购物行为中潜在的联合购买习惯。典型发现包括“啤酒与尿布”、“面包与黄油”、“咖啡与奶精”，指导商品货架捆绑陈列与促销策略。',
    businessGoal: '识别连带销售机会（Cross-selling），优化零售卖场动线与货架邻近陈列，提升客单价与毛利空间。',
    recommendedMinSup: 0.25,
    recommendedMinConf: 0.60,
    recommendedMinLift: 1.20,
    items: [
      { id: 'bread', name: '面包 (Bread)', category: '烘焙', price: 8.5 },
      { id: 'milk', name: '牛奶 (Milk)', category: '乳品', price: 6.0 },
      { id: 'diaper', name: '纸尿裤 (Diaper)', category: '母婴', price: 128.0 },
      { id: 'beer', name: '啤酒 (Beer)', category: '酒饮', price: 12.0 },
      { id: 'butter', name: '黄油 (Butter)', category: '乳品', price: 18.0 },
      { id: 'eggs', name: '鲜鸡蛋 (Eggs)', category: '生鲜', price: 15.0 },
      { id: 'coffee', name: '研磨咖啡 (Coffee)', category: '冲饮', price: 45.0 },
      { id: 'tissue', name: '抽纸 (Tissue)', category: '日化', price: 4.5 },
    ],
    transactions: [
      { id: 'T101', items: ['面包 (Bread)', '牛奶 (Milk)', '黄油 (Butter)'] },
      { id: 'T102', items: ['面包 (Bread)', '纸尿裤 (Diaper)', '啤酒 (Beer)', '鲜鸡蛋 (Eggs)'] },
      { id: 'T103', items: ['牛奶 (Milk)', '纸尿裤 (Diaper)', '啤酒 (Beer)', '研磨咖啡 (Coffee)'] },
      { id: 'T104', items: ['面包 (Bread)', '牛奶 (Milk)', '纸尿裤 (Diaper)', '啤酒 (Beer)'] },
      { id: 'T105', items: ['面包 (Bread)', '牛奶 (Milk)', '鲜鸡蛋 (Eggs)', '黄油 (Butter)'] },
      { id: 'T106', items: ['纸尿裤 (Diaper)', '啤酒 (Beer)', '抽纸 (Tissue)'] },
      { id: 'T107', items: ['面包 (Bread)', '牛奶 (Milk)', '研磨咖啡 (Coffee)', '黄油 (Butter)'] },
      { id: 'T108', items: ['面包 (Bread)', '纸尿裤 (Diaper)', '啤酒 (Beer)'] },
      { id: 'T109', items: ['牛奶 (Milk)', '鲜鸡蛋 (Eggs)', '黄油 (Butter)'] },
      { id: 'T110', items: ['面包 (Bread)', '牛奶 (Milk)', '啤酒 (Beer)', '纸尿裤 (Diaper)'] },
      { id: 'T111', items: ['研磨咖啡 (Coffee)', '牛奶 (Milk)', '面包 (Bread)'] },
      { id: 'T112', items: ['纸尿裤 (Diaper)', '啤酒 (Beer)', '黄油 (Butter)'] },
    ],
    domainInsights: [
      '“纸尿裤”与“啤酒”的支持度为 50%，提升度 Lift = 1.60，显示出极显著的年轻父亲下班采购共现特征。',
      '“黄油”几乎总与“面包”或“牛奶”同时出现（置信度 > 80%），适合作为捆绑搭配引流品。',
      '“抽纸”多为偶发凑单项，与核心烘焙品类独立性较高（Lift ≈ 1.0）。'
    ],
    crossSellingAdvice: [
      '货架动线优化：将啤酒展架置于婴儿纸尿裤专区拐角处的必经主通道上。',
      '组合特惠装：推出“早餐晨光组合”（吐司面包 + 高钙鲜奶 + 减盐黄油享 8.8 折）。',
      '结账台数字副屏推荐：若扫描命中纸尿裤，收银台副屏即刻弹出进口精酿啤酒换购券。'
    ]
  },
  {
    id: 'ecommerce_funnel',
    title: '电商网站浏览与加购路径挖掘',
    subtitle: 'Web Session Clickstream & Navigation Mining',
    category: '互联网电商',
    algorithmHighlight: 'FP-Growth 树图切割',
    description: '通过记录用户在单个 Session 会话内的页面访问事件与交互节点，分析由“首页导流”到“商详页”、“评价区”、“配选碎屏险”直至“加入购物车与结算”的高频行为序列与共现组合。',
    businessGoal: '识别高转化阻断点与加购强附着节点，针对高关联浏览路径实施动态弹窗与配件智能推荐。',
    recommendedMinSup: 0.30,
    recommendedMinConf: 0.65,
    recommendedMinLift: 1.30,
    items: [
      { id: 'home', name: '首页推荐 (Home)', category: '导航' },
      { id: 'search', name: '搜索直达 (Search)', category: '意图' },
      { id: 'phone', name: '旗舰手机详情 (Flagship_Phone)', category: '主品' },
      { id: 'case', name: '防摔保护壳 (Phone_Case)', category: '配件' },
      { id: 'care', name: '两年碎屏保 (Screen_Care)', category: '增值服务' },
      { id: 'charger', name: '67W闪充头 (Fast_Charger)', category: '配件' },
      { id: 'review', name: '带图买家秀 (User_Reviews)', category: '信任' },
      { id: 'cart', name: '加购物车/支付 (Add_To_Cart)', category: '转化' },
    ],
    transactions: [
      { id: 'S201', items: ['首页推荐 (Home)', '旗舰手机详情 (Flagship_Phone)', '防摔保护壳 (Phone_Case)', '两年碎屏保 (Screen_Care)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S202', items: ['搜索直达 (Search)', '旗舰手机详情 (Flagship_Phone)', '带图买家秀 (User_Reviews)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S203', items: ['首页推荐 (Home)', '旗舰手机详情 (Flagship_Phone)', '防摔保护壳 (Phone_Case)', '67W闪充头 (Fast_Charger)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S204', items: ['搜索直达 (Search)', '防摔保护壳 (Phone_Case)', '67W闪充头 (Fast_Charger)'] },
      { id: 'S205', items: ['首页推荐 (Home)', '旗舰手机详情 (Flagship_Phone)', '带图买家秀 (User_Reviews)', '两年碎屏保 (Screen_Care)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S206', items: ['旗舰手机详情 (Flagship_Phone)', '防摔保护壳 (Phone_Case)', '两年碎屏保 (Screen_Care)', '67W闪充头 (Fast_Charger)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S207', items: ['首页推荐 (Home)', '搜索直达 (Search)', '旗舰手机详情 (Flagship_Phone)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S208', items: ['旗舰手机详情 (Flagship_Phone)', '防摔保护壳 (Phone_Case)', '两年碎屏保 (Screen_Care)'] },
      { id: 'S209', items: ['首页推荐 (Home)', '旗舰手机详情 (Flagship_Phone)', '防摔保护壳 (Phone_Case)', '加购物车/支付 (Add_To_Cart)'] },
      { id: 'S210', items: ['搜索直达 (Search)', '带图买家秀 (User_Reviews)', '旗舰手机详情 (Flagship_Phone)', '两年碎屏保 (Screen_Care)', '加购物车/支付 (Add_To_Cart)'] },
    ],
    domainInsights: [
      '【旗舰手机详情 + 两年碎屏保】 $\\Rightarrow$ 【加购物车/支付】 置信度高达 90%，提升度 Lift = 1.25。',
      '【带图买家秀】经常作为消除高客单价顾虑的关键信任前缀节点，其后置转化率较直接跳过买家秀高出 42%。',
      '配件中“防摔保护壳 + 67W闪充头”具有高频强互补性（Support = 30%, Lift = 1.45）。'
    ],
    crossSellingAdvice: [
      '在手机详情页右侧常驻“随新机换购”浮窗，将防摔壳与碎屏保打包，立减 30 元。',
      '用户在详情页停留超 45 秒且未加购时，主动折叠展示好评带图买家秀。',
      '在结算页面底栏追加闪充头一键勾选，利用结账顺手心理提升加购率。'
    ]
  },
  {
    id: 'healthcare',
    title: '医疗临床症状与并发症诊断关联',
    subtitle: 'Clinical Symptom & Comorbidity Pattern Mining',
    category: '医疗健康',
    algorithmHighlight: 'ECLAT 垂直数据求交',
    description: '采集急诊与内科患者门诊主诉症状、生化检查异常指标及既往病史记录，利用垂直倒排求交快速发现隐匿性合并症、高危前驱症状链与潜在并发症风险。',
    businessGoal: '辅助医生进行多病共存早期筛查，提示高危隐蔽并发症，规避漏诊误诊与药物配伍冲突。',
    recommendedMinSup: 0.20,
    recommendedMinConf: 0.70,
    recommendedMinLift: 1.35,
    items: [
      { id: 'fever', name: '发热 >38.5℃ (High_Fever)', category: '体征' },
      { id: 'cough', name: '剧烈干咳 (Severe_Cough)', category: '呼吸系统' },
      { id: 'chest_pain', name: '胸骨后钝痛 (Chest_Pain)', category: '循环呼吸' },
      { id: 'wbc_high', name: '白细胞显著升高 (High_WBC)', category: '血液检验' },
      { id: 'lung_shadow', name: '肺部局灶阴影 (Lung_Infiltrate)', category: '影像学' },
      { id: 'hypertension', name: '高血压史 (Hypertension)', category: '慢性病' },
      { id: 'diabetes', name: '2型糖尿病 (Type2_Diabetes)', category: '慢性病' },
      { id: 'crp_high', name: 'C反应蛋白超标 (Elevated_CRP)', category: '生化炎症' },
    ],
    transactions: [
      { id: 'P301', items: ['发热 >38.5℃ (High_Fever)', '剧烈干咳 (Severe_Cough)', '白细胞显著升高 (High_WBC)', '肺部局灶阴影 (Lung_Infiltrate)', 'C反应蛋白超标 (Elevated_CRP)'] },
      { id: 'P302', items: ['高血压史 (Hypertension)', '2型糖尿病 (Type2_Diabetes)', '胸骨后钝痛 (Chest_Pain)'] },
      { id: 'P303', items: ['发热 >38.5℃ (High_Fever)', '剧烈干咳 (Severe_Cough)', 'C反应蛋白超标 (Elevated_CRP)'] },
      { id: 'P304', items: ['高血压史 (Hypertension)', '胸骨后钝痛 (Chest_Pain)', '白细胞显著升高 (High_WBC)'] },
      { id: 'P305', items: ['发热 >38.5℃ (High_Fever)', '剧烈干咳 (Severe_Cough)', '白细胞显著升高 (High_WBC)', '肺部局灶阴影 (Lung_Infiltrate)'] },
      { id: 'P306', items: ['高血压史 (Hypertension)', '2型糖尿病 (Type2_Diabetes)', 'C反应蛋白超标 (Elevated_CRP)'] },
      { id: 'P307', items: ['发热 >38.5℃ (High_Fever)', '剧烈干咳 (Severe_Cough)', '胸骨后钝痛 (Chest_Pain)', '肺部局灶阴影 (Lung_Infiltrate)', 'C反应蛋白超标 (Elevated_CRP)'] },
      { id: 'P308', items: ['白细胞显著升高 (High_WBC)', 'C反应蛋白超标 (Elevated_CRP)', '发热 >38.5℃ (High_Fever)'] },
      { id: 'P309', items: ['高血压史 (Hypertension)', '2型糖尿病 (Type2_Diabetes)', '胸骨后钝痛 (Chest_Pain)', 'C反应蛋白超标 (Elevated_CRP)'] },
      { id: 'P310', items: ['剧烈干咳 (Severe_Cough)', '肺部局灶阴影 (Lung_Infiltrate)', 'C反应蛋白超标 (Elevated_CRP)'] },
    ],
    domainInsights: [
      '【发热 + 剧烈干咳 + CRP超标】 $\\Rightarrow$ 【肺部局灶阴影】 置信度 75%，提升度 1.88，强烈指向细菌性或重症肺实质感染。',
      '【高血压史 + 2型糖尿病】 $\\Rightarrow$ 【胸骨后钝痛】 置信度 67%，提升度 1.67，提示微血管病变合并冠心病心绞痛的隐匿风险。',
      '单有高血压的孤立胸痛提升度较低，但结合糖尿病病程后心血管事件概率成倍激增。'
    ],
    crossSellingAdvice: [
      '临床警示提示：当接诊录入高热与干咳且CRP异常时，门诊工作站自动标红推荐急诊胸部CT及血气检查。',
      '内科联合随访：针对内分泌糖尿病就诊患者，若既往有高血压，强制触发心电图负荷试验与颈动脉超声提醒。',
      '处方禁忌联检：若检测到并发感染且既往有肾功能隐患，自动限制氨基糖苷类抗生素处方。'
    ]
  },
  {
    id: 'fraud_detection',
    title: '金融信用卡欺诈套现团伙联查',
    subtitle: 'Credit Card Fraud & Organized Cash-out Rings',
    category: '金融风控',
    algorithmHighlight: '多维特征关联规则',
    description: '整合账户在短时窗口内的设备指纹、异地突发大额、深夜集中交易、高危商户代码（MCC 码）、以及转账后资金秒出等异常行为特征，挖掘地下中介套现与黑产洗钱的团伙特征模板。',
    businessGoal: '自动生成动态拦截风控规则，识别并阻断集团化信用卡非法套现与被盗刷事件。',
    recommendedMinSup: 0.20,
    recommendedMinConf: 0.75,
    recommendedMinLift: 1.50,
    items: [
      { id: 'midnight', name: '深夜凌晨交易 (Midnight_Tx)', category: '时序特征' },
      { id: 'remote_ip', name: '异地IP突变 (Remote_IP_Drift)', category: '环境特征' },
      { id: 'high_amt', name: '顶格整额交易 (Near_Limit_Amount)', category: '金额特征' },
      { id: 'pos_cash', name: '高危套现MCC码 (High_Risk_MCC)', category: '商户特征' },
      { id: 'quick_out', name: '资金秒进秒出 (Instant_Fund_Out)', category: '资金流转' },
      { id: 'new_device', name: '陌生未授信设备 (Untrusted_Device)', category: '指纹特征' },
      { id: 'multi_cards', name: '单终端轮询多卡 (Multi_Cards_Per_POS)', category: '团伙行为' },
      { id: 'pwd_retry', name: '多次密码试错 (Password_Retries)', category: '操作风险' },
    ],
    transactions: [
      { id: 'F401', items: ['深夜凌晨交易 (Midnight_Tx)', '顶格整额交易 (Near_Limit_Amount)', '高危套现MCC码 (High_Risk_MCC)', '资金秒进秒出 (Instant_Fund_Out)', '单终端轮询多卡 (Multi_Cards_Per_POS)'] },
      { id: 'F402', items: ['异地IP突变 (Remote_IP_Drift)', '陌生未授信设备 (Untrusted_Device)', '多次密码试错 (Password_Retries)', '顶格整额交易 (Near_Limit_Amount)'] },
      { id: 'F403', items: ['深夜凌晨交易 (Midnight_Tx)', '高危套现MCC码 (High_Risk_MCC)', '资金秒进秒出 (Instant_Fund_Out)', '单终端轮询多卡 (Multi_Cards_Per_POS)'] },
      { id: 'F404', items: ['异地IP突变 (Remote_IP_Drift)', '顶格整额交易 (Near_Limit_Amount)', '高危套现MCC码 (High_Risk_MCC)', '资金秒进秒出 (Instant_Fund_Out)'] },
      { id: 'F405', items: ['深夜凌晨交易 (Midnight_Tx)', '异地IP突变 (Remote_IP_Drift)', '陌生未授信设备 (Untrusted_Device)'] },
      { id: 'F406', items: ['顶格整额交易 (Near_Limit_Amount)', '高危套现MCC码 (High_Risk_MCC)', '资金秒进秒出 (Instant_Fund_Out)', '单终端轮询多卡 (Multi_Cards_Per_POS)'] },
      { id: 'F407', items: ['深夜凌晨交易 (Midnight_Tx)', '顶格整额交易 (Near_Limit_Amount)', '资金秒进秒出 (Instant_Fund_Out)', '单终端轮询多卡 (Multi_Cards_Per_POS)'] },
      { id: 'F408', items: ['异地IP突变 (Remote_IP_Drift)', '陌生未授信设备 (Untrusted_Device)', '多次密码试错 (Password_Retries)'] },
      { id: 'F409', items: ['深夜凌晨交易 (Midnight_Tx)', '高危套现MCC码 (High_Risk_MCC)', '单终端轮询多卡 (Multi_Cards_Per_POS)', '顶格整额交易 (Near_Limit_Amount)'] },
      { id: 'F410', items: ['顶格整额交易 (Near_Limit_Amount)', '资金秒进秒出 (Instant_Fund_Out)', '高危套现MCC码 (High_Risk_MCC)'] },
    ],
    domainInsights: [
      '【高危套现MCC码 + 资金秒进秒出】 $\\Rightarrow$ 【单终端轮询多卡】 置信度 80%，提升度 1.60，是典型的地下POS机商户洗钱特征。',
      '【异地IP突变 + 陌生设备】常伴随【密码多次试错】，高概率为黑灰产撞库或钓鱼窃卡。',
      '“顶格整额交易”（如刚好 9999 元）出现频次高达 70%，体现出中介为了避开单笔 1 万元大额报送风控的作弊心理。'
    ],
    crossSellingAdvice: [
      '风控实时拦截：对命中【高危MCC + 资金秒出】的交易直接阻断划转，触发人脸生物识别二次核验。',
      '商户巡检与黑名单：同一物理POS机在 1 小时内刷卡超过 3 张不同姓名信用卡，商户直接冻结结算账户。',
      '反向额度调降：对持续发生顶格整数刷卡且深夜操作的持卡人，自动将临时额度归零并启动授信重审。'
    ]
  }
];
