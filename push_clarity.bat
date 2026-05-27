@echo off
git add package.json src/app/layout.tsx src/components/layout/Sidebar.tsx
git commit -m "chore: rename app to Clarity"
git push origin main
