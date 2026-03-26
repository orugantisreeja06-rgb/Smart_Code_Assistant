# SmartCodeAssistant

AI-powered Coding + DevOps Automation Platform

## Features
- AI code analysis: error detection, explanations, and suggestions
- Dockerfile and CI/CD pipeline (GitHub Actions) generation
- File upload and code input
- DockerHub deployment integration
- Modern React frontend and Express backend

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- Docker (for DockerHub deployment)
- OpenAI API key

### Setup
1. Clone the repository:
   ```sh
   git clone <your-repo-url>
   cd SmartCodeAssistant
   ```
2. Install backend dependencies:
   ```sh
   cd backend
   npm install
   ```
3. Install frontend dependencies:
   ```sh
   cd ../frontend
   npm install
   ```
4. Set up environment variables:
   - Create a `.env` file in the root directory:
     ```env
     OPENAI_API_KEY=your_openai_api_key
     ```

### Running Locally
1. Start the backend:
   ```sh
   cd backend
   npm start
   ```
2. Start the frontend:
   ```sh
   cd ../frontend
   npm run dev
   ```
3. Open [http://localhost:5173](http://localhost:5173) in your browser.

### DockerHub Deployment
- Enter your DockerHub credentials and image name in the frontend UI to deploy your generated Docker image.
- **Security Note:** For production, use DockerHub access tokens or OAuth, not plain passwords.

## Deployment
- You can deploy this app to any cloud platform that supports Node.js and Docker.
- For production, set up HTTPS and secure environment variable management.

## Security
- Credentials are never stored; they are used only for the current deployment request.
- Add rate limiting and abuse protection for public deployments.

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
