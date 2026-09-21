export const dimensions = [
 {name:'表达与倾听',en:'COMMUNICATION',questions:['我能向对方清楚表达自己的需要。','当我认真说一件事时，我感到对方愿意听完。','意见不同时，我仍能表达自己的想法。','我们会确认是否理解了对方的意思。'],action:'留出 15 分钟轮流说一件最近在意的事，听的人先复述，再给回应。'},
 {name:'信任与边界',en:'TRUST & BOUNDARIES',questions:['对方通常会兑现我们约定好的事情。','我的独处时间和个人空间受到尊重。','当我说“不愿意”时，我感到自己的决定受到尊重。','对涉及双方的重要事情，我能获得必要的信息。'],action:'各自说出一项希望被尊重的边界，商量一种双方都舒服的回应方式。'},
 {name:'情感回应',en:'EMOTIONAL SUPPORT',questions:['当我情绪低落时，我能获得自己需要的支持。','我感到自己的努力和付出被对方看见。','我能感受到对方主动表达的关心。','我可以向对方表达脆弱，而不担心被嘲笑。'],action:'下次对方倾诉时，先问：“你希望我听你说，还是一起想办法？”'},
 {name:'分歧与修复',en:'REPAIR & GROWTH',questions:['发生分歧时，我们能够围绕具体事情讨论。','情绪激动时，我们能暂停，并约定稍后继续沟通。','发生不愉快后，我们有机会重新建立连接。','对反复出现的问题，我们会尝试调整做法。'],action:'在心情平稳时商量一个暂停信号，同时约定何时回来继续对话。'},
 {name:'陪伴与亲密',en:'QUALITY TIME',questions:['我对我们相处时间的质量感到满意。','我们表达亲昵的方式让我感到舒服。','我可以自在地谈论自己对陪伴和亲密的需要。','我们有双方都愿意参与的共同活动或小习惯。'],action:'共同选择一件 30 分钟的小事，收起手机，把注意力留给彼此。'},
 {name:'期待与协商',en:'SHARED EXPECTATIONS',questions:['我们了解彼此对当前关系的期待。','在影响双方的安排上，我有参与决定的机会。','我们能讨论金钱、时间等现实问题。','对现阶段的重要计划，我们有清楚的约定，或愿意继续协商。'],action:'一起选一个近期安排，分别说出最在意的条件，再找到可行的约定。'}
];
export const giftSteps=['送给谁','了解 TA','礼物的心意','最后的细节'];
export const giftQuestions=[
 {id:'relation',step:0,label:'这份心意，送给谁？',type:'choice',options:['伴侣','暧昧对象','朋友','家人','同事','其他'],required:true},
 {id:'name',step:0,label:'你想怎么称呼 TA？',type:'text',placeholder:'例如：小林、我的另一半',required:true},
 {id:'occasion',step:0,label:'值得记住的日子',type:'choice',options:['生日','纪念日','节日','表达感谢','日常心意','其他'],required:true},
 {id:'duration',step:0,label:'你们相识多久了？',type:'choice',options:['不到 3 个月','3～12 个月','1～3 年','3 年以上'],required:true},
 {id:'interests',step:1,label:'TA 会把时间花在哪些爱好上？',hint:'最多选择 3 项',type:'multi',options:['阅读','游戏','运动','美食','音乐','旅行','手作','科技','穿搭','不确定'],required:true},
 {id:'need',step:1,label:'TA 最近有没有提到想要的东西？',type:'text',placeholder:'一件想买的东西，或一个想解决的小麻烦；不知道可以留空'},
 {id:'social',step:1,label:'TA 更喜欢怎样度过空闲时间？',type:'choice',options:['独处','两人相处','小范围朋友聚会','热闹活动','不确定'],required:true},
 {id:'novelty',step:1,label:'面对新事物，TA 通常会…',type:'choice',options:['喜欢尝鲜','愿意尝试但重视品质','更喜欢熟悉可靠的选择','不确定'],required:true},
 {id:'values',step:2,label:'TA 收到礼物时，更在意什么？',hint:'最多选择 2 项',type:'multi',max:2,options:['实用','心意','审美','惊喜','品质','一起经历','不确定'],required:true},
 {id:'surprise',step:2,label:'怎样的惊喜最舒服？',type:'choice',options:['提前商量','小惊喜','完全保密','不确定'],required:true},
 {id:'setting',step:2,label:'更适合在哪里送出？',type:'choice',options:['私下赠送','公开赠送','不确定'],required:true},
 {id:'evidence',step:2,label:'以上偏好，主要来自哪里？',type:'choice',options:['TA 明确说过','我观察到的','我的猜测'],required:true},
 {id:'budget',step:3,label:'总预算上限',type:'number',placeholder:'包含包装、配送或共同活动费用',required:true},
 {id:'date',step:3,label:'最迟需要的日期',type:'date',required:true},
 {id:'city',step:3,label:'收礼或活动所在城市',type:'text',placeholder:'用于判断活动可行性，不需要详细地址',required:true},
 {id:'avoid',step:3,label:'有哪些绝对不要选的？',type:'text',placeholder:'例如：不要香水、尺寸不明、不喜欢占用时间'},
 {id:'history',step:3,label:'过去的礼物，TA 有什么真实反馈？',type:'text',placeholder:'选填；请区分明确反馈和自己的猜测'},
 {id:'memory',step:3,label:'一段想放进礼物里的共同回忆',type:'text',placeholder:'选填；一句话、一个地点或一件小事'},
 {id:'effort',step:3,label:'你愿意花多少时间准备？',type:'choice',options:['只想直接购买','愿意简单搭配','愿意定制或亲手制作'],required:true}
];
export const ratings=['完全不符合','比较不符合','一半符合','比较符合','非常符合','暂时无法判断'];
