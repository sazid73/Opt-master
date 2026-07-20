import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

const allQuestions = [
  {"id":"ue1","type":"grammar","section":"use_of_english","text":"I'm a student ____ university. I'm studying English.","options":{"a":"at","b":"in","c":"of","d":"on"},"correct":"a"},
  {"id":"ue2","type":"grammar","section":"use_of_english","text":"There is a green scarf on the chair, ____ is it?","options":{"a":"What","b":"Where","c":"Whose","d":"Which"},"correct":"c"},
  {"id":"ue3","type":"grammar","section":"use_of_english","text":"I don't know if they missed me or my cooking. I had ___ walked through the door when they were demanding supper!","options":{"a":"really","b":"barely","c":"nearly","d":"simply"},"correct":"b"},
  {"id":"ue4","type":"grammar","section":"use_of_english","text":"The tutor says it's always better to ____ personal experience for inspiration.","options":{"a":"draw on","b":"dwell on","c":"resort to","d":"revert to"},"correct":"a"},
  {"id":"ue5","type":"grammar","section":"use_of_english","text":"Very much so, ____ it provides further evidence on the link between greener lifestyles and well-being.","options":{"a":"as such","b":"in that","c":"just as","d":"by which"},"correct":"b"},
  {"id":"ue6","type":"grammar","section":"use_of_english","text":"I did a lot of preparation and ___ for the bad weather, I would've made it to the top.","options":{"a":"unless it was","b":"had it not been","c":"hadn't it been","d":"was it not"},"correct":"b"},
  {"id":"ue7","type":"grammar","section":"use_of_english","text":"It's time ___ a new car.","options":{"a":"I should buy","b":"I buy","c":"I bought","d":"I had bought"},"correct":"c"},
  {"id":"ue8","type":"grammar","section":"use_of_english","text":"Go for it. Don't let that hold you ____","options":{"a":"in","b":"off","c":"back","d":"down"},"correct":"c"},
  {"id":"ue9","type":"grammar","section":"use_of_english","text":"My brother works ___ a large software company.","options":{"a":"with","b":"for","c":"under","d":"along"},"correct":"b"},
  {"id":"ue10","type":"grammar","section":"use_of_english","text":"We arrived ___ the airport two hours before our flight.","options":{"a":"within","b":"in","c":"at","d":"for"},"correct":"c"},
  {"id":"ue11","type":"grammar","section":"use_of_english","text":"She isn't interested ___ watching horror movies.","options":{"a":"to","b":"in","c":"for","d":"after"},"correct":"b"},
  {"id":"ue12","type":"grammar","section":"use_of_english","text":"This is the restaurant ___ we first met.","options":{"a":"where","b":"when","c":"why","d":"what"},"correct":"a"},
  {"id":"ue13","type":"grammar","section":"use_of_english","text":"If I ___ enough money, I'd buy a new laptop.","options":{"a":"have","b":"has","c":"had","d":"were having"},"correct":"c"},
  {"id":"ue14","type":"grammar","section":"use_of_english","text":"You should look ___ the meaning of that word.","options":{"a":"at","b":"for","c":"in","d":"up"},"correct":"d"},
  {"id":"ue15","type":"grammar","section":"use_of_english","text":"They have lived here ___ 2018.","options":{"a":"from","b":"since","c":"for","d":"within"},"correct":"b"},
  {"id":"ue16","type":"grammar","section":"use_of_english","text":"The train was delayed, ___ we arrived late.","options":{"a":"as","b":"for","c":"so","d":"when"},"correct":"c"},
  {"id":"ue17","type":"grammar","section":"use_of_english","text":"I haven't seen him ___ a long time.","options":{"a":"after","b":"for","c":"from","d":"until"},"correct":"b"},
  {"id":"ue18","type":"grammar","section":"use_of_english","text":"Please turn ___ the lights before leaving.","options":{"a":"off","b":"up","c":"after","d":"around"},"correct":"a"},
  {"id":"ue19","type":"grammar","section":"use_of_english","text":"We were looking forward ___ everyone at the reunion.","options":{"a":"to see","b":"for seeing","c":"to seeing","d":"to have seen"},"correct":"c"},
  {"id":"ue20","type":"grammar","section":"use_of_english","text":"Hardly had I sat down ___ the phone rang.","options":{"a":"as","b":"when","c":"until","d":"after"},"correct":"b"},
  {"id":"ue21","type":"grammar","section":"use_of_english","text":"The manager insisted ___ reviewing the report personally.","options":{"a":"on","b":"for","c":"upon","d":"to"},"correct":"a"},
  {"id":"ue22","type":"grammar","section":"use_of_english","text":"We need to come ___ a better solution before Friday.","options":{"a":"up from","b":"up with","c":"towards","d":"in for"},"correct":"b"},
  {"id":"ue23","type":"grammar","section":"use_of_english","text":"Not only ___ she speak French fluently, but she also teaches it.","options":{"a":"be","b":"did","c":"does","d":"will"},"correct":"c"},
  {"id":"ue24","type":"grammar","section":"use_of_english","text":"The new regulations came ___ effect last month.","options":{"a":"from","b":"into","c":"upon","d":"with"},"correct":"b"},
  {"id":"ue25","type":"grammar","section":"use_of_english","text":"His explanation doesn't quite add ___.","options":{"a":"on","b":"in","c":"up","d":"to"},"correct":"c"},
  {"id":"ue26","type":"grammar","section":"use_of_english","text":"She was so tired that she could ___ keep her eyes open.","options":{"a":"gladly","b":"rarely","c":"softly","d":"barely"},"correct":"d"},
  {"id":"ue27","type":"grammar","section":"use_of_english","text":"Little ___ that the decision would change the company's future.","options":{"a":"did they know","b":"had they known","c":"until they knew","d":"from their knowledge"},"correct":"a"},
  {"id":"ue28","type":"grammar","section":"use_of_english","text":"Rarely ___ such an impressive performance.","options":{"a":"had I saw","b":"will I see","c":"have I seen","d":"until they see"},"correct":"c"},
  {"id":"ue29","type":"grammar","section":"use_of_english","text":"The report was accepted, ___ several minor revisions.","options":{"a":"amended to","b":"prior to","c":"exempted to","d":"subject to"},"correct":"d"},
  {"id":"ue30","type":"grammar","section":"use_of_english","text":"It wasn't ___ the manager explained the figures that everyone understood the issue.","options":{"a":"when","b":"before","c":"until","d":"around"},"correct":"c"},
  {"id":"ue31","type":"grammar","section":"use_of_english","text":"The committee decided to put the proposal ___ until further evidence became available.","options":{"a":"out","b":"up","c":"off","d":"in"},"correct":"c"},
  {"id":"ue32","type":"grammar","section":"use_of_english","text":"So convincing ___ his argument that nobody challenged it.","options":{"a":"was","b":"had been","c":"when","d":"will be"},"correct":"a"},
  {"id":"ue33","type":"grammar","section":"use_of_english","text":"The witness's account was consistent ___ the evidence collected at the scene.","options":{"a":"to","b":"with","c":"for","d":"from"},"correct":"b"},
  {"id":"ue34","type":"grammar","section":"use_of_english","text":"No sooner had the meeting begun ___ the fire alarm sounded.","options":{"a":"then","b":"until","c":"than","d":"that"},"correct":"c"},
  {"id":"ue35","type":"grammar","section":"use_of_english","text":"I would sooner ___ home than travel in such terrible weather.","options":{"a":"stay","b":"leave","c":"want","d":"stall"},"correct":"a"},
  {"id":"ue36","type":"grammar","section":"use_of_english","text":"The professor encouraged students to build ___ previous research rather than repeat it.","options":{"a":"from","b":"on","c":"to","d":"in"},"correct":"b"},
  {"id":"ue37","type":"grammar","section":"use_of_english","text":"Were the company ___ invest in renewable energy, its operating costs could decrease significantly.","options":{"a":"for","b":"into","c":"from","d":"to"},"correct":"d"},
  {"id":"ue38","type":"grammar","section":"use_of_english","text":"Much ___ he wanted to object, he remained silent throughout the discussion.","options":{"a":"as","b":"when","c":"for","d":"like"},"correct":"a"},
  {"id":"ue39","type":"grammar","section":"use_of_english","text":"The new policy was introduced ___ an effort to reduce unnecessary spending.","options":{"a":"to","b":"in","c":"for","d":"under"},"correct":"b"},
  {"id":"ue40","type":"grammar","section":"use_of_english","text":"The findings lend considerable support ___ the hypothesis that early intervention improves long-term outcomes.","options":{"a":"in","b":"for","c":"to","d":"from"},"correct":"c"},

  {"id":"ls1","type":"listening","section":"listening","text":"Listen to the dialogue. What does the wife mean by her first comment?","audioText":"Wife: Had we known that they were going to build a motorway so close to us, I'd have thought twice about us buying this house.","options":{"a":"I wish we hadn't bought this house.","b":"We ought to think again about buying this house.","c":"You should have reconsidered buying this house."},"correct":"a"},
  {"id":"ls2","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: If I'd remembered her birthday, she wouldn't have been so upset.","options":{"a":"He forgot her birthday and she was upset.","b":"He remembered her birthday too late.","c":"She wasn't upset because he remembered."},"correct":"a"},
  {"id":"ls3","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: It's about time we replaced this old washing machine.","options":{"a":"The washing machine is still quite new.","b":"The washing machine should be replaced now.","c":"The washing machine was replaced recently."},"correct":"b"},
  {"id":"ls4","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: I can barely keep my eyes open after that meeting.","options":{"a":"He feels extremely tired.","b":"He enjoyed the meeting.","c":"He wasn't paying attention."},"correct":"a"},
  {"id":"ls5","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: I wish I'd listened to your advice.","options":{"a":"She plans to follow the advice later.","b":"She regrets not listening.","c":"She doesn't remember the advice."},"correct":"b"},
  {"id":"ls6","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: By the time we reached the station, the train had already left.","options":{"a":"They caught the train just in time.","b":"They arrived before the train left.","c":"They arrived after the train left."},"correct":"c"},
  {"id":"ls7","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: Had I known about the traffic, I would have taken a different route.","options":{"a":"He knew about the traffic in advance.","b":"He didn't know about the traffic and regrets his route.","c":"He took a different route because of the traffic."},"correct":"b"},
  {"id":"ls8","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman imply?","audioText":"Woman: No sooner had we arrived than it started to pour with rain.","options":{"a":"The rain started before they arrived.","b":"It rained immediately after they arrived.","c":"They arrived during a break in the rain."},"correct":"b"},
  {"id":"ls9","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: I was on the point of leaving when you called.","options":{"a":"She had already left.","b":"She was just about to leave.","c":"She decided not to leave."},"correct":"b"},
  {"id":"ls10","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: Had it not been for Sarah's help, we'd never have finished on time.","options":{"a":"Sarah delayed the project.","b":"Sarah's help was essential.","c":"Sarah finished after everyone else."},"correct":"b"},
  {"id":"ls11","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: Little did I know that accepting the job would require so much travelling.","options":{"a":"He expected to travel frequently.","b":"He was unaware how much travel the job involved.","c":"He refused to travel."},"correct":"b"},
  {"id":"ls12","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: Much as I'd love to join you, I have to finish this report.","options":{"a":"She doesn't want to join them.","b":"She wants to join them but cannot.","c":"She has already finished her report."},"correct":"b"},
  {"id":"ls13","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: The proposal sounds good in theory, but I'm not convinced it'll work in practice.","options":{"a":"He believes the proposal will succeed.","b":"He doubts the proposal will work.","c":"He has his doubts about the longevity of the proposal."},"correct":"b"},
  {"id":"ls14","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: You may as well tell him the truth now.","options":{"a":"Telling him the truth is probably the best option.","b":"The truth should remain secret.","c":"She doesn't know the truth."},"correct":"a"},
  {"id":"ls15","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: Were it not for the heavy traffic, we'd have arrived ages ago.","options":{"a":"The traffic helped them arrive early.","b":"The traffic delayed their arrival.","c":"They left too late."},"correct":"b"},
  {"id":"ls16","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: His explanation doesn't quite add up.","options":{"a":"His explanation isn't convincing.","b":"His explanation is too long.","c":"His explanation is complete."},"correct":"a"},
  {"id":"ls17","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: Had she spoken up earlier, the mistake could have been avoided.","options":{"a":"Speaking earlier might have prevented the mistake.","b":"The mistake was unavoidable.","c":"She spoke up at the right time."},"correct":"a"},
  {"id":"ls18","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: For all his experience, he still made a beginner's mistake.","options":{"a":"His experience prevented mistakes.","b":"Despite being experienced, he made a simple mistake.","c":"He has very little experience."},"correct":"b"},
  {"id":"ls19","type":"listening","section":"listening","text":"Listen to the dialogue. What does the manager really mean?","audioText":"Manager: I'm not saying the presentation was poor, but it certainly left room for improvement.","options":{"a":"The presentation was excellent.","b":"The presentation was not as good as it should have been.","c":"The presentation should never have been given."},"correct":"b"},
  {"id":"ls20","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman imply?","audioText":"Woman: For someone who claimed to know the city so well, he got lost remarkably quickly.","options":{"a":"He knows the city well.","b":"She doubts that he really knows the city well.","c":"The city is impossible to navigate."},"correct":"b"},
  {"id":"ls21","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: It wasn't exactly the warm welcome I'd been expecting.","options":{"a":"He received a friendlier welcome than expected.","b":"The welcome was disappointing.","c":"Nobody welcomed him at all."},"correct":"b"},
  {"id":"ls22","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man imply?","audioText":"Man: He may have apologized, but the damage had already been done.","options":{"a":"The apology completely solved the problem.","b":"The apology came too late to change the situation.","c":"No apology was offered."},"correct":"b"},
  {"id":"ls23","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman suggest?","audioText":"Woman: Had they bothered to read the instructions, none of this would have happened.","options":{"a":"The instructions were unclear.","b":"The problem happened because the instructions were ignored.","c":"The instructions were unavailable."},"correct":"b"},
  {"id":"ls24","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man imply?","audioText":"Man: Much as I'd like to believe his explanation, something doesn't quite ring true.","options":{"a":"He completely trusts the explanation.","b":"He suspects the explanation isn't entirely honest.","c":"He doesn't understand the explanation."},"correct":"b"},
  {"id":"ls25","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: If anything, the latest figures make me even less optimistic.","options":{"a":"The new information has increased her confidence.","b":"The new information has made her more pessimistic.","c":"The figures haven't changed her opinion."},"correct":"b"},
  {"id":"ls26","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Man: By the time the government wake up to the real threat of global warming, we'll all have webbed feet. Woman: What a cheerful man you are!","options":{"a":"You're being rather pessimistic.","b":"I suppose you're trying to be funny.","c":"You shouldn't joke about such serious matters."},"correct":"a"},
  {"id":"ls27","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean by his second comment?","audioText":"Woman: Quite right, you've got to carve out another niche for yourself, for a start. Man: Yeah, but on the other hand, there's always the compensation of pastures new!","options":{"a":"The fear of the unknown can be concerning.","b":"Doing something different makes up for the problems involved.","c":"Things usually turn out much better than one would expect."},"correct":"b"},
  {"id":"ls28","type":"listening","section":"listening","text":"Listen to the dialogue. What does the man mean?","audioText":"Man: Well, it's good to see his growing confidence in his own ability over the season. And scoring a goal that soon into a match is bound to cause a stir, but as for the national squad – well that's another question.","options":{"a":"The match will have a significant impact on decisions about the national team.","b":"The player hasn't yet achieved the required level for selection into the national team.","c":"The man is not prepared to comment on speculation about the player's selection."},"correct":"b"},
  {"id":"ls29","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: Well, was skydiving everything it was cracked up to be?","options":{"a":"Was skydiving as good as people say it is?","b":"Was skydiving as scary as people say it is?","c":"Was skydiving as difficult as people say it is?"},"correct":"a"},
  {"id":"ls30","type":"listening","section":"listening","text":"Listen to the dialogue. What does the woman mean?","audioText":"Woman: Well, I wouldn't lose any sleep over his resignation. Man: That's a bit harsh, isn't it?","options":{"a":"She is deeply worried about his resignation.","b":"She thinks his resignation is of little importance.","c":"She believes he will soon change his mind."},"correct":"b"},

  {"id":"rd1","type":"reading","section":"reading","passage":"A grey morning in Hong Kong and I'm just setting off to photograph Courtney Gordon. In recent years she's come to be known as the 'strongest woman on Earth'. As a 13-year-old secondary school student growing up in Edinburgh, Scotland, she won the gold medal in the national archery competition. Not content to settle for success in one sport, however, she later became the national women's shot-put champion. It's safe to say Gordon is big news in the world of sport, having twice won the annual Women's World Weightlifting Competition. Her success has made her the face of this rapidly growing sport. I enter the unassuming downtown gym where she can regularly be found putting herself through a rigorous fitness regime.","text":"The writer says 'I'm just ___ off to photograph Courtney Gordon.' Which word completes the gap?","options":{"a":"setting","b":"getting","c":"taking","d":"going"},"correct":"a"},
  {"id":"rd2","type":"reading","section":"reading","passage":"A grey morning in Hong Kong and I'm just setting off to photograph Courtney Gordon. In recent years she's come to be known as the 'strongest woman on Earth'. As a 13-year-old secondary school student growing up in Edinburgh, Scotland, she won the gold medal in the national archery competition. Not content to settle for success in one sport, however, she later became the national women's shot-put champion. It's safe to say Gordon is big news in the world of sport, having twice won the annual Women's World Weightlifting Competition. Her success has made her the face of this rapidly growing sport.","text":"In recent years she's ___ to be known as the 'strongest woman on Earth'. Which word completes the gap?","options":{"a":"gone","b":"come","c":"been","d":"got"},"correct":"b"},
  {"id":"rd3","type":"reading","section":"reading","passage":"A grey morning in Hong Kong and I'm just setting off to photograph Courtney Gordon. In recent years she's come to be known as the 'strongest woman on Earth'. As a 13-year-old secondary school student growing up in Edinburgh, Scotland, she won the gold medal in the national archery competition. Not content to settle for success in one sport, however, she later became the national women's shot-put champion. It's safe to say Gordon is big news in the world of sport, having twice won the annual Women's World Weightlifting Competition.","text":"Not content to settle ___ success in one sport. Which word completes the gap?","options":{"a":"with","b":"on","c":"for","d":"to"},"correct":"c"},
  {"id":"rd4","type":"reading","section":"reading","passage":"A grey morning in Hong Kong and I'm just setting off to photograph Courtney Gordon. In recent years she's come to be known as the 'strongest woman on Earth'. As a 13-year-old secondary school student growing up in Edinburgh, Scotland, she won the gold medal in the national archery competition. Not content to settle for success in one sport, however, she later became the national women's shot-put champion. It's safe to say Gordon is big news in the world of sport, having twice won the annual Women's World Weightlifting Competition.","text":"It's safe to say Gordon is big news in the world of sport, ___ twice won the annual Women's World Weightlifting Competition. Which word completes the gap?","options":{"a":"being","b":"having","c":"after","d":"since"},"correct":"b"},
  {"id":"rd5","type":"reading","section":"reading","passage":"A grey morning in Hong Kong and I'm just setting off to photograph Courtney Gordon. In recent years she's come to be known as the 'strongest woman on Earth'. As a 13-year-old secondary school student growing up in Edinburgh, Scotland, she won the gold medal in the national archery competition. Not content to settle for success in one sport, however, she later became the national women's shot-put champion. It's safe to say Gordon is big news in the world of sport, having twice won the annual Women's World Weightlifting Competition. Her success has made her the face of this rapidly growing sport.","text":"Her success has ___ her the face of this rapidly growing sport. Which word completes the gap?","options":{"a":"given","b":"turned","c":"made","d":"let"},"correct":"c"},
  {"id":"rd6","type":"reading","section":"reading","passage":"I enter the unassuming downtown gym where she can regularly be found putting herself through a rigorous fitness regime. At the back of the room, two large bodybuilders struggle to drag huge tractor tires the weight of a grand piano from one side of the room to the other. On a weightlifting bench to my left, Gordon heaves two enormous dumb-bells into the air at least ten times before dropping to the floor and doing several sets of press-ups. And all this without even breaking into a sweat. I start to wonder whether my images will ever be able to capture the atmosphere of this place and do justice to this amazing woman.","text":"She can regularly be found putting herself ___ a rigorous fitness regime. Which word completes the gap?","options":{"a":"into","b":"across","c":"through","d":"over"},"correct":"c"},
  {"id":"rd7","type":"reading","section":"reading","passage":"At the back of the room, two large bodybuilders struggle to drag huge tractor tires the weight of a grand piano from one side of the room to the other. On a weightlifting bench to my left, Gordon heaves two enormous dumb-bells into the air at least ten times before dropping to the floor and doing several sets of press-ups. And all this without even breaking into a sweat. I start to wonder whether my images will ever be able to capture the atmosphere of this place and do justice to this amazing woman.","text":"I start to wonder whether my images will ever be able to capture the atmosphere of this place and ___ justice to this amazing woman. Which word completes the gap?","options":{"a":"make","b":"give","c":"do","d":"bring"},"correct":"c"}
];

const grammarQs = allQuestions.filter(q => q.section === 'use_of_english');
const listeningQs = allQuestions.filter(q => q.section === 'listening');
const readingQs = allQuestions.filter(q => q.section === 'reading');

// Transform Listening Questions
listeningQs.forEach(q => {
  q.dialogue = q.audioText;
  delete q.audioText;
  q.text = q.text.replace('Listen to the dialogue.', 'Read the dialogue below.');
});

// Transform Reading Questions
const readingAnswers = {
  rd1: "setting", rd2: "come", rd3: "for", rd4: "having", rd5: "made", rd6: "through", rd7: "do"
};
readingQs.forEach(q => {
  q.type = 'fill_in_the_blank';
  delete q.options;
  q.correct = readingAnswers[q.id];
});

// Original Exam
const examFull = {
  id: "opt_full_cefr",
  title: "Oxford Placement Test — Full CEFR Assessment",
  description: "Complete OPT covering Use of English (40 Grammar), Listening Comprehension (30 Dialogues), and Reading Comprehension (Cloze Passage). 77 questions total. Duration: 60 minutes.",
  duration: 3600,
  isActive: false, // hidden from students by default
  questions: [...grammarQs, ...listeningQs, ...readingQs]
};

// Split
const grammarSet1 = grammarQs.slice(0, 20);
const grammarSet2 = grammarQs.slice(20, 40);
const listeningSet1 = listeningQs.slice(0, 15);
const listeningSet2 = listeningQs.slice(15, 30);

const exam1 = {
  id: "opt_set_1",
  title: "Oxford Placement Test — Set 1",
  description: "Use of English Part 1 (20 Grammar Qs), Part 2 (15 Dialogue Qs), Part 3 (7 Cloze Fill-in-the-blanks).",
  duration: 2700,
  isActive: true,
  questions: [...grammarSet1, ...listeningSet1, ...readingQs]
};

const exam2 = {
  id: "opt_set_2",
  title: "Oxford Placement Test — Set 2",
  description: "Use of English Part 1 (20 Grammar Qs), Part 2 (15 Dialogue Qs), Part 3 (7 Cloze Fill-in-the-blanks).",
  duration: 2700,
  isActive: true,
  questions: [...grammarSet2, ...listeningSet2, ...readingQs]
};

// Read current db to preserve settings and submissions
let db = { settings: { adminPasscode: "hello123", maxTabSwitches: 3 }, exams: [], submissions: [] };
try {
  db = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
} catch (e) {}

db.exams = [examFull, exam1, exam2];

fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));

console.log("Successfully completely restored and split the database into 3 accurate exams!");
