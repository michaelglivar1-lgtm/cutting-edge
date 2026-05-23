# Cutting Edge Design and Construction — Website

Static website (HTML/CSS/JS only). No build step needed.

## To deploy on Vercel

1. Go to vercel.com → sign in with Google (your Gmail)
2. Click "Add New..." → "Project"
3. Drag this entire folder into the upload area, OR
4. Use the Vercel CLI: `cd cutting-edge-vercel && npx vercel`

## To make local edits

Open index.html, style.css, or base.css in any editor.
All images are in /assets/img/.

## Form & analytics setup (after deploy)

1. Sign up at formspree.io (free) → create form → grab 8-char ID
2. Open index.html, search for `FORMSPREE_ID = 'REPLACE_ME'`, paste your ID
3. Sign up at analytics.google.com → create property → grab Measurement ID
4. (Ask AI assistant to add the GA snippet)

## Calendly

Open index.html, search for `CALENDLY_URL` and paste your real Calendly link.
