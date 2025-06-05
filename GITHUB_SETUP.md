# GitHub Setup Guide

## 🚀 Getting Your Rick and Morty Database on GitHub

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
```bash
git init
```

2. **Add all files**:
```bash
git add .
```

3. **Create initial commit**:
```bash
git commit -m "Initial commit: Rick and Morty Database with portal-themed UI"
```

### Step 2: Create GitHub Repository

1. Go to [GitHub.com](https://github.com) and sign in
2. Click the "+" icon in the top right corner
3. Select "New repository"
4. Fill in the details:
   - **Repository name**: `rick-and-morty-database`
   - **Description**: `A comprehensive Rick and Morty fanworks database with portal-themed UI`
   - **Visibility**: Public (recommended) or Private
   - **DO NOT** initialize with README, .gitignore, or license (we already have these)

5. Click "Create repository"

### Step 3: Connect Local Repository to GitHub

```bash
# Add GitHub as remote origin
git remote add origin https://github.com/YOUR_USERNAME/rick-and-morty-database.git

# Rename main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

### Step 4: Set Up Repository Settings

#### Enable GitHub Pages (Optional)
1. Go to repository Settings
2. Scroll to "Pages" section
3. Select source: "Deploy from a branch"
4. Choose branch: `main` and folder: `/ (root)`

#### Add Repository Topics
1. Go to your repository main page
2. Click the gear icon next to "About"
3. Add topics: `rick-and-morty`, `fanworks`, `database`, `react`, `nodejs`, `mongodb`

#### Create Repository Description
Add this to the "About" section:
```
A comprehensive Rick and Morty fanworks database featuring art galleries, fanfiction archives, and community interactions with a portal-themed UI.
```

### Step 5: Environment Variables for Deployment

#### Required Secrets for GitHub Actions
If using the provided GitHub Actions workflow, add these secrets:

1. Go to repository Settings → Secrets and variables → Actions
2. Add the following secrets:

**For Vercel Deployment:**
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

**For Railway Deployment:**
- `RAILWAY_TOKEN`: Your Railway API token

**For Heroku Deployment:**
- `HEROKU_API_KEY`: Your Heroku API key
- `HEROKU_APP_NAME`: Your Heroku app name
- `HEROKU_EMAIL`: Your Heroku account email

### Step 6: Set Up Branch Protection (Recommended)

1. Go to Settings → Branches
2. Click "Add rule"
3. Branch name pattern: `main`
4. Enable:
   - ✅ Require a pull request before merging
   - ✅ Require status checks to pass before merging
   - ✅ Require branches to be up to date before merging
   - ✅ Include administrators

### Step 7: Create Issues Templates

Create `.github/ISSUE_TEMPLATE/` directory with these templates:

#### Bug Report Template
```markdown
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Screenshots**
If applicable, add screenshots to help explain your problem.

**Environment:**
- OS: [e.g. iOS]
- Browser [e.g. chrome, safari]
- Version [e.g. 22]

**Additional context**
Add any other context about the problem here.
```

#### Feature Request Template
```markdown
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
```

### Step 8: Add Useful Labels

Create these labels in Issues → Labels:
- `bug` (red) - Something isn't working
- `enhancement` (blue) - New feature or request
- `documentation` (green) - Improvements or additions to documentation
- `good first issue` (purple) - Good for newcomers
- `help wanted` (yellow) - Extra attention is needed
- `frontend` (orange) - React/UI related
- `backend` (brown) - Node.js/API related
- `database` (gray) - MongoDB related

### Step 9: Create a Contributing Guide

Create `CONTRIBUTING.md`:
```markdown
# Contributing to Rick and Morty Database

We love your input! We want to make contributing as easy and transparent as possible.

## Development Process

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Local Development

1. Clone your fork
2. Run `npm run install-all`
3. Set up your `.env` file (see DEPLOYMENT.md)
4. Run `npm run dev`

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the version numbers in any examples files and the README.md
3. The PR will be merged once you have the sign-off of at least one maintainer

## Code of Conduct

Be respectful and inclusive. This is a fan project meant to bring the community together.
```

### Step 10: Add a License

Create `LICENSE` file with MIT License:
```
MIT License

Copyright (c) 2024 Rick and Morty Database

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🎉 You're All Set!

Your Rick and Morty Database is now on GitHub with:
- ✅ Professional repository setup
- ✅ Automated deployment workflows
- ✅ Issue templates and labels
- ✅ Contributing guidelines
- ✅ Branch protection
- ✅ Comprehensive documentation

### Next Steps:
1. Set up your production database (MongoDB Atlas)
2. Configure deployment platform (Vercel, Railway, Heroku)
3. Add environment variables to your deployment platform
4. Test your deployment
5. Share your awesome Rick and Morty database with the community!

### Useful Commands:
```bash
# Check repository status
git status

# Create and switch to new branch
git checkout -b feature/new-feature

# Add changes and commit
git add .
git commit -m "Add new feature"

# Push changes
git push origin feature/new-feature

# Switch back to main
git checkout main

# Pull latest changes
git pull origin main
```