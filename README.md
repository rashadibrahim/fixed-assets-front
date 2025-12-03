# Welcome to Fixed Assets Management Project



To Run the Front End Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <git@github.com:rashadibrahim/fixed-assets-front.git>

# Step 2: Navigate to the project directory.
cd <fixed-assets-front>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```



## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS


## Troubleshooting

### Backend Connection Issues

If you're seeing "Cannot connect to server" errors in the login page, this means the backend API is not running. Here are your options:

1. **Use Demo Login**: Click the "Demo Login" button to explore the application with sample data (no backend required)

2. **Start Backend Service**: If you have the backend code, make sure it's running on `http://localhost:8000`

3. **Configure API URL**: Update the `VITE_API_URL` in your `.env` file to point to your backend server:
   ```
   VITE_API_URL=http://localhost:5000
   ```

