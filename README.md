This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Demo videos

End-to-end walkthrough of Voluntrack's two main user flows. Click either
thumbnail to watch on YouTube.

### Student experience

Full walkthrough of the student-facing flow:

- **Sign-up and onboarding**
- The **Opportunities** page: browsing and discovering volunteer postings
- The personal **Dashboard**
- The activity **Feed**
- **Applying** to volunteer opportunities
- **Saving** opportunities to revisit later
- **Reporting** and logging volunteer hours

[![Voluntrack: student experience demo](https://img.youtube.com/vi/HeRixfa3pZo/maxresdefault.jpg)](https://www.youtube.com/watch?v=HeRixfa3pZo)

### Organization experience

Walks through every page and function on the organization side
(opportunity creation, listing management, applicant review, and
contribution tracking), then closes with an **end-to-end application
demo**: the video flips between a student applying and the organization
accepting in real time, confirming the Firestore backend wires both
flows together live.

[![Voluntrack: organization experience demo](https://img.youtube.com/vi/RQ8vXp6XdRo/maxresdefault.jpg)](https://www.youtube.com/watch?v=RQ8vXp6XdRo)

---

## Getting Started

First, run the development server:

```bash
npm run dev
```

**Important:** Use `npm run dev` (not `npm dev run`). When the server starts, it will show a URL like:

- **http://127.0.0.1:3000**, or **http://127.0.0.1:3001** / **3002** if port 3000 is already in use.

Open that exact URL in your browser. If the app doesn’t load, check the terminal for the correct port and use that.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
