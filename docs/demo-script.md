# 5-minute demo video script

Record at 1080p with the live Vercel site. Talk while you click. Times are targets.

**0:00 to 0:30. Intro.**
"This is Text-to-Learn. You type any topic and it builds a full course with lessons, quizzes, videos, a PDF download and a Hinglish explanation. It's React on Vercel, Express and MongoDB on Render, Auth0 for login and Gemini for generation."

**0:30 to 1:00. Login.**
Log out first, then click Log in. Show the Auth0 page, sign in with Google, land back on the home page.

**1:00 to 1:45. Prompt to course.**
Type "Intro to React Hooks", pick Beginner, click Generate course. While it loads: "The server asks Gemini for a strict JSON outline, validates it with Zod, and saves Course, Module and Lesson documents." Show the syllabus: modules, lessons, key topics, the progress bar.

**1:45 to 3:00. Lesson.**
Open lesson 1.1. Point out objectives, headings, the code block with copy, the embedded YouTube video, readings. Answer two quiz questions, one wrong, show the explanation and the score. Mention: "Lesson content is only generated when you first open it, which saves a lot of tokens."

**3:00 to 3:40. Hinglish and PDF.**
Click Listen in Hinglish, play 5 seconds, open the transcript. Click Download PDF, open the file, scroll two pages. Click Dark for the dark PDF.

**3:40 to 4:00. Progress and persistence.**
Mark the lesson done, show the check in the sidebar. Refresh the page: the course and progress are still there.

**4:00 to 5:00. Code tour.**
In VS Code or GitHub:
- `server/` folder structure: routes, controllers, middlewares, models, services.
- `services/ai/prompts.js` and `generators.js`: the two prompts, JSON parsing, validation and retry.
- `middlewares/auth.js`: JWT check and user sync.
- `client/src/components/LessonRenderer.jsx` and `blocks/`.
- `.github/workflows/ci.yml` and the merged pull requests list on GitHub.
End: "Live link and repo are in the description. Thanks."
