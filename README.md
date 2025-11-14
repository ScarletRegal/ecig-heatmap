# Instructions for GitHub Pages Project for URMC RCOE

These are instructions for the URMC RCOE Heatmap

After the repository is transferred to the correct account, there will be some lines of code that need to be changed.

This will assume that the person doing this process knows how to make a GitHub page.

## package.json
- Locate the "homepage" field (Line 6)
- Change the field of "http://ScarletRegal.github.io/ecig-heatmap" to "http://YourUsername.github.io/page-name"
- page-name refers to the new page name if necessary

## vite.config.ts
- Locate the "base" field (Line 6)
- Change the field of "/ecig-heatmap" to "page-name"
- page-name refers to the new page name if necessary

## Deployment
- All of the proper packages should be installed so...
- Connect to your GitHub repo via VSCode
- Use "npm run deploy" in the terminal on your device to push the deployment "dist" folder to GitHub

