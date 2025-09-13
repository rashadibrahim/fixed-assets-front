# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b9c3e4a8-32f4-4722-8c9c-9e95d08309e7

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b9c3e4a8-32f4-4722-8c9c-9e95d08309e7) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/b9c3e4a8-32f4-4722-8c9c-9e95d08309e7) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Troubleshooting

### Backend Connection Issues

If you're seeing "Cannot connect to server" errors in the login page, this means the backend API is not running. Here are your options:

1. **Use Demo Login**: Click the "Demo Login" button to explore the application with sample data (no backend required)

2. **Start Backend Service**: If you have the backend code, make sure it's running on `http://localhost:8000`

3. **Configure API URL**: Update the `VITE_API_URL` in your `.env` file to point to your backend server:
   ```
   VITE_API_URL=http://your-backend-url:port
   ```

### React Router Warnings

The React Router future flag warnings have been addressed in the latest version. If you still see them, make sure your `BrowserRouter` includes the future flags:

```jsx
<BrowserRouter
  future={{
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  }}
>
```
