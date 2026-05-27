@echo off
git add .gitignore
git commit -m "chore: update gitignore for db artifacts"
git branch -M main
git remote add origin https://github.com/Gryff1ndor/youtube-scheduler.git
git push -u origin main
