// DockerHub deployment endpoint (stub)
app.post("/deploy-dockerhub", async (req, res) => {
  // Expected body: { code: string, dockerfile: string, imageName: string, username: string, password: string }
  // For security, in production use OAuth/token-based auth and never store passwords.
  const { code, dockerfile, imageName, username, password } = req.body || {};
  if (!code || !dockerfile || !imageName || !username || !password) {
    return res.status(400).json({ error: "Missing required fields: code, dockerfile, imageName, username, password" });
  }
  // Write Dockerfile and code to a temp directory
  const fs = require("fs");
  const os = require("os");
  const path = require("path");
  const { exec } = require("child_process");
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "dockerbuild-"));
  try {
    fs.writeFileSync(path.join(tmpDir, "Dockerfile"), dockerfile);
    fs.writeFileSync(path.join(tmpDir, "app_code.txt"), code); // Save code as a generic file
    // Build the Docker image
    const buildCmd = `docker build -t ${imageName} "${tmpDir}"`;
    // Login to DockerHub
    const loginCmd = `echo ${password} | docker login -u ${username} --password-stdin`;
    // Push the Docker image
    const pushCmd = `docker push ${imageName}`;
    // Run commands in sequence
    exec(`${loginCmd} && ${buildCmd} && ${pushCmd}`, { cwd: tmpDir }, (err, stdout, stderr) => {
      // Clean up temp dir
      fs.rmSync(tmpDir, { recursive: true, force: true });
      if (err) {
        return res.status(500).json({ error: "Docker build/push failed", details: stderr || err.message });
      }
      return res.json({ message: `Image '${imageName}' built and pushed to DockerHub.`, status: "success", output: stdout });
    });
  } catch (e) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    return res.status(500).json({ error: "Internal server error during Docker build/push", details: e.message });
  }
});
// CI/CD pipeline generation endpoint
app.post("/generate-cicd", async (req, res) => {
  if (typeof req.body !== "object" || req.body === null) {
    return res.status(400).json({
      error: "Invalid JSON body. Expected: { \"code\": \"...\" }",
    });
  }

  const code = req.body.code;

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({
      error: "Code must be a non-empty string.",
    });
  }

  if (code.length > MAX_CODE_CHARS) {
    return res.status(413).json({
      error: `Code too large. Max allowed: ${MAX_CODE_CHARS} characters.`,
    });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in .env file",
    });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const prompt = `You are a DevOps assistant.\nGiven the following code, generate a suitable GitHub Actions YAML workflow for building and deploying this application. Only return the YAML content, no explanations or comments.\n\nCode:\n${code}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Generate only the CI/CD YAML content." },
        { role: "user", content: prompt },
      ],
    });

    const cicdContent = completion.choices[0].message.content;

    if (!cicdContent || typeof cicdContent !== "string") {
      return res.status(500).json({
        error: "No CI/CD content returned by AI.",
      });
    }

    return res.json({ cicd: cicdContent.trim() });
  } catch (error) {
    return res.status(500).json({
      error: "CI/CD pipeline generation failed",
      details: error.message,
    });
  }
});
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "..", ".env") });

const express = require("express");
const cors = require("cors");
const { OpenAI } = require("openai");

const app = express();
app.disable("x-powered-by");

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Test route
app.get("/", (req, res) => {
  res.send("Server is running");
});

const apiKey = process.env.OPENAI_API_KEY;
const MAX_CODE_CHARS = Number(process.env.MAX_CODE_CHARS || 100000);

// Main API
console.log("Analyze route is loaded");
app.post("/analyze", async (req, res) => {
  if (typeof req.body !== "object" || req.body === null) {
    return res.status(400).json({
      error: "Invalid JSON body. Expected: { \"code\": \"...\" }",
    });
  }

  const code = req.body.code;

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({
      error: "Code must be a non-empty string.",
    });
  }

  if (code.length > MAX_CODE_CHARS) {
    return res.status(413).json({
      error: `Code too large. Max allowed: ${MAX_CODE_CHARS} characters.`,
    });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in .env file",
    });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const prompt = `
You are a helpful coding assistant.

Analyze the following code and return:
1. explanation (simple English, max 5 lines)
2. suggestions (max 5 improvements)

Return ONLY JSON in this format:
{ "explanation": "...", "suggestions": ["...", "..."] }

Code:
${code}
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Be clear and simple." },
        { role: "user", content: prompt },
      ],
    });

    const content = completion.choices[0].message.content;

    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch {
      return res.status(500).json({
        error: "AI response not valid JSON",
        raw: content,
      });
    }

    return res.json(parsed);
  } catch (error) {
    return res.status(500).json({
      error: "AI processing failed",
      details: error.message,
    });
  }
});

// Dockerfile generation endpoint
app.post("/generate-dockerfile", async (req, res) => {
  if (typeof req.body !== "object" || req.body === null) {
    return res.status(400).json({
      error: "Invalid JSON body. Expected: { \"code\": \"...\" }",
    });
  }

  const code = req.body.code;

  if (typeof code !== "string" || code.trim().length === 0) {
    return res.status(400).json({
      error: "Code must be a non-empty string.",
    });
  }

  if (code.length > MAX_CODE_CHARS) {
    return res.status(413).json({
      error: `Code too large. Max allowed: ${MAX_CODE_CHARS} characters.`,
    });
  }

  if (!apiKey) {
    return res.status(500).json({
      error: "Missing OPENAI_API_KEY in .env file",
    });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const prompt = `You are a DevOps assistant.\nGiven the following code, generate a suitable Dockerfile for running this application. Only return the Dockerfile content, no explanations or comments.\n\nCode:\n${code}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: "Generate only the Dockerfile content." },
        { role: "user", content: prompt },
      ],
    });

    const dockerfileContent = completion.choices[0].message.content;

    if (!dockerfileContent || typeof dockerfileContent !== "string") {
      return res.status(500).json({
        error: "No Dockerfile content returned by AI.",
      });
    }

    return res.json({ dockerfile: dockerfileContent.trim() });
  } catch (error) {
    return res.status(500).json({
      error: "Dockerfile generation failed",
      details: error.message,
    });
  }
});

// Start server (LAST LINE)
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});