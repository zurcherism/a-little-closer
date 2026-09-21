import {dimensions} from './data.js';
export function scores(answers, other=null){return dimensions.map((d,i)=>{const ids=[0,1,2,3].map(n=>i*4+n);const valid=ids.filter(n=>Number.isInteger(answers[n])&&answers[n]>=1&&answers[n]<=5&&(!other||(Number.isInteger(other[n])&&other[n]>=1&&other[n]<=5)));const calc=a=>valid.length>=3?Math.round((valid.reduce((s,n)=>s+a[n],0)/valid.length-1)*25):null;return {...d,count:valid.length,score:calc(answers),other:other?calc(other):null}})}
const catalog=[
 {name:'随身阅读灯',tags:['阅读','实用','品质'],price:80,high:220,kind:'实物',tip:'确认夹持位置、调光方式与充电接口。',keywords:['灯','照明']},
 {name:'一本想读的书，配一张手写书签',tags:['阅读','心意'],price:40,high:120,kind:'实物',tip:'先确认书名和是否已经拥有，留出写书签的时间。',keywords:['书','书单']},
 {name:'轻巧便携的保温杯',tags:['运动','实用','品质'],price:80,high:240,kind:'实物',tip:'确认容量、清洁便利性及 TA 是否已有常用杯子。',keywords:['杯','喝水']},
 {name:'一份精心挑选的茶或咖啡',tags:['美食','品质','实用'],price:60,high:200,kind:'食品',tip:'先确认口味、咖啡因接受程度和饮食限制。',keywords:['茶','咖啡']},
 {name:'给日常穿搭加一点细节的帆布袋',tags:['穿搭','审美','实用'],price:50,high:180,kind:'实物',tip:'根据常穿颜色选择，确认材质与使用场景。',keywords:['袋','包']},
 {name:'桌面手机支架',tags:['科技','游戏','实用'],price:30,high:130,kind:'实物',tip:'确认设备尺寸和桌面空间，优先考虑稳定与收纳。',keywords:['支架','手机','桌面']},
 {name:'一起做一次陶艺',tags:['手作','一起经历','尝鲜','审美'],price:180,high:500,kind:'体验',tip:'在所在城市确认双人总价、档期与退改规则，先征求对方意愿。',keywords:['陶','手作']},
 {name:'一起听一场小型现场音乐',tags:['音乐','一起经历','尝鲜'],price:200,high:600,kind:'体验',tip:'先确认音乐类型、双方档期和双人票价，不假定任何场次在售。',keywords:['音乐','演出']},
 {name:'一张共同回忆的照片与简约相框',tags:['心意','审美','旅行'],price:30,high:150,kind:'实物',tip:'选择双方都喜欢的照片，确认摆放空间。',keywords:['照片','相框']},
 {name:'一张认真写下的卡片',tags:['心意'],price:0,high:30,kind:'手作',tip:'写一件真实发生的小事和一句具体的感谢。',keywords:['卡片']}
];
export function gifts(a){const budget=Number(a.budget);const avoid=String(a.avoid||'');const blockedFood=/饮食|过敏|忌口|咖啡|茶|食物|食品/.test(avoid);const blockedExperience=/时间|活动|出门|体验|社交/.test(avoid);let candidates=catalog.filter(c=>c.price<=budget&&!(c.kind==='食品'&&blockedFood)&&!(c.kind==='体验'&&blockedExperience)&&!c.keywords.some(k=>avoid.includes(k))&&!c.tags.some(t=>avoid.includes(t))&&!(c.kind==='手作'&&a.effort==='只想直接购买'));candidates=candidates.map(c=>{const reasons=[];let rank=0;const interest=c.tags.filter(t=>(a.interests||[]).includes(t));if(interest.length){rank+=25;reasons.push(`呼应 TA 对「${interest.join('、')}」的兴趣`)}const values=c.tags.filter(t=>(a.values||[]).includes(t));if(values.length){rank+=20;reasons.push(`契合 TA 在意的「${values.join('、')}」`)}if(c.keywords.some(k=>a.need?.includes(k))){rank+=30;reasons.push('与你记录的近期需求有关，购买前再确认具体规格')}if(c.tags.includes('心意')&&a.memory){rank+=15;reasons.push('可以融入你记录的共同回忆')}if(c.kind==='体验'&&a.social==='两人相处'){rank+=10;reasons.push('适合你记录的两人相处偏好')}if(c.tags.includes('尝鲜')&&a.novelty==='喜欢尝鲜'){rank+=10;reasons.push('呼应 TA 喜欢尝试新事物的倾向')}if(c.kind==='实物'&&a.effort==='只想直接购买')rank+=10;return {...c,rank,reasons:reasons.length?reasons:['预算范围内的备选方向，偏好依据仍需补充'],high:Math.min(budget,c.high)}}).sort((x,y)=>y.rank-x.rank);return candidates.slice(0,3)}
