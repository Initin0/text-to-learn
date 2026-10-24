// Rule-based template engine. Used when no GEMINI_API_KEY is set (local dev, CI, demos without quota).
// It returns the same JSON shapes the real model returns, so the rest of the pipeline is identical.

const TECH = /\b(code|program|python|java|javascript|react|node|sql|api|algorithm|data|c\+\+|rust|go|html|css|git|docker|linux|machine learning|ml|ai)\b/i;

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function outline({ topic, level }) {
  const t = cap(topic.trim());
  const modules = [
    {
      title: `Foundations of ${t}`,
      summary: `Build the vocabulary and mental model behind ${t}.`,
      lessons: [`What ${t} is and why it matters`, `Key terms and core ideas in ${t}`, `How ${t} fits into the bigger picture`],
    },
    {
      title: `Core Concepts of ${t}`,
      summary: `The ideas you will use every time you work with ${t}.`,
      lessons: [`The first core principle of ${t}`, `Common patterns in ${t}`, `Worked example: ${t} step by step`, `Mistakes beginners make with ${t}`],
    },
    {
      title: `${t} in Practice`,
      summary: `Apply what you learned to realistic problems.`,
      lessons: [`Setting up a small ${t} project`, `Solving a real problem with ${t}`, `Evaluating and improving your ${t} work`],
    },
    {
      title: `Going Further with ${t}`,
      summary: `Advanced directions and how to keep learning.`,
      lessons: [`Advanced techniques in ${t}`, `Tools and resources for ${t}`, `Capstone: putting ${t} together`],
    },
  ];
  return {
    title: `${t}: A ${cap(level)} Course`,
    description: `A structured ${level} course on ${t}. You will move from the basic vocabulary to applying ${t} on a small project, with quizzes after every lesson.`,
    tags: topic.toLowerCase().split(/\s+/).filter((w) => w.length > 2).slice(0, 4).concat(level),
    modules: modules.map((m) => ({
      ...m,
      lessons: m.lessons.map((title) => ({ title, keyTopics: ['definitions', 'examples', 'practice'] })),
    })),
  };
}

function lesson({ courseTitle, moduleTitle, lessonTitle }) {
  const tech = TECH.test(`${courseTitle} ${lessonTitle}`);
  const content = [
    { type: 'heading', text: 'Overview' },
    {
      type: 'paragraph',
      text: `This lesson covers "${lessonTitle}" as part of the module "${moduleTitle}". By the end you should be able to explain the idea in your own words and apply it to a small example.`,
    },
    { type: 'heading', text: 'Key ideas' },
    {
      type: 'list',
      items: [
        `Start from the definition: what problem does ${lessonTitle.toLowerCase()} solve?`,
        'Connect it to something you already know.',
        'Look at one concrete example before generalising.',
      ],
    },
    { type: 'callout', variant: 'tip', text: 'Pause after each section and try to restate it in one sentence.' },
    { type: 'heading', text: 'Worked example' },
    {
      type: 'paragraph',
      text: 'Take a small, realistic case and walk through it step by step. Note the inputs, what you do, and what you get out. Then change one input and predict the new result.',
    },
  ];
  if (tech) content.push({ type: 'code', language: 'javascript', text: `// ${lessonTitle}\nfunction example(input) {\n  return input;\n}\nconsole.log(example('hello'));` });
  content.push({ type: 'video', query: `${lessonTitle} explained` });
  content.push({ type: 'heading', text: 'Summary' });
  content.push({ type: 'paragraph', text: `You have seen what ${lessonTitle.toLowerCase()} means, why it matters, and how to use it on a small example.` });

  const mcqs = [
    ['What is the best first step when learning a new concept?', ['Memorise every detail', 'Understand the problem it solves', 'Skip to advanced material', 'Avoid examples'], 1, 'Knowing the problem a concept solves gives you a hook for everything else.'],
    ['Why use a worked example?', ['It replaces theory', 'It makes abstract ideas concrete', 'It is only for experts', 'It slows learning'], 1, 'Concrete cases make abstract rules easier to remember and apply.'],
    ['What should you do after reading a section?', ['Move on immediately', 'Restate it in your own words', 'Reread it five times', 'Ignore it'], 1, 'Retrieval and rephrasing are proven ways to strengthen memory.'],
    ['Changing one input in an example helps you...', ['Test your understanding', 'Make it longer', 'Avoid mistakes forever', 'Skip the quiz'], 0, 'Predicting the effect of a change checks if you understand the mechanism.'],
  ];
  for (const [question, options, answer, explanation] of mcqs) content.push({ type: 'mcq', question, options, answer, explanation });

  return {
    title: lessonTitle,
    objectives: [`Explain ${lessonTitle.toLowerCase()} in plain words`, 'Apply the idea to a small example', 'Spot common mistakes'],
    keyTopics: ['definition', 'example', 'common mistakes'],
    readings: [
      { title: `Wikipedia: ${courseTitle.split(':')[0]}`, url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(courseTitle.split(':')[0])}`, note: 'Background reading' },
    ],
    content,
  };
}

function hinglish({ lessonTitle }) {
  return `Namaste! Aaj hum "${lessonTitle}" ke baare mein baat karenge. Sabse pehle samajhte hain ki yeh concept kis problem ko solve karta hai. Jab aapko problem clear ho jaati hai, tab baaki sab cheezein easily samajh aati hain. Phir hum ek chhota sa example lete hain, step by step dekhte hain ki input kya hai, hum kya karte hain, aur output kya aata hai. Ek tip yaad rakhiye: har section ke baad usse apne words mein ek line mein bolne ki koshish kijiye. Aur end mein quiz zaroor try kijiye, kyunki practice se hi concept pakka hota hai. Chaliye, shuru karte hain!`;
}

export function createMockProvider() {
  return {
    name: 'mock',
    supportsTTS: false,
    async generateText({ task, vars }) {
      if (task === 'outline') return JSON.stringify(outline(vars));
      if (task === 'lesson') return JSON.stringify(lesson(vars));
      if (task === 'hinglish') return hinglish(vars);
      throw new Error(`mock provider: unknown task ${task}`);
    },
    async textToSpeech() {
      throw new Error('TTS is not available in mock mode');
    },
  };
}
