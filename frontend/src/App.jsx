const DEPLOY_DOCKERHUB_URL = "http://localhost:3000/deploy-dockerhub";
  const [deployUsername, setDeployUsername] = useState("");
  const [deployPassword, setDeployPassword] = useState("");
  const [deployImageName, setDeployImageName] = useState("");
  const [deployStatus, setDeployStatus] = useState("");
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployError, setDeployError] = useState("");

  async function onDeployDockerHub() {
    setDeployStatus("");
    setDeployError("");
    if (!dockerfile || !deployUsername || !deployPassword || !deployImageName) {
      setDeployError("Please provide Dockerfile, username, password, and image name.");
      return;
    }
    setDeployLoading(true);
    try {
      const resp = await fetch(DEPLOY_DOCKERHUB_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          dockerfile,
          imageName: deployImageName,
          username: deployUsername,
          password: deployPassword,
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || `Request failed with status ${resp.status}`);
      }
      setDeployStatus(data.message || "Deployment successful.");
    } catch (err) {
      setDeployError(err?.message || String(err));
    } finally {
      setDeployLoading(false);
    }
  }
import { useMemo, useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/analyze";
const DOCKERFILE_URL = "http://localhost:3000/generate-dockerfile";
const CICD_URL = "http://localhost:3000/generate-cicd";
const MAX_CODE_CHARS = 100000;

export default function App() {
  const [code, setCode] = useState("");
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [dockerfile, setDockerfile] = useState("");
  const [dockerLoading, setDockerLoading] = useState(false);
  const [dockerError, setDockerError] = useState("");
  const [cicd, setCicd] = useState("");
  const [cicdLoading, setCicdLoading] = useState(false);
  const [cicdError, setCicdError] = useState("");
    async function onGenerateCICD() {
      if (!code.trim()) {
        setCicdError("Please paste code or upload a file first.");
        return;
      }
      setCicdLoading(true);
      setCicdError("");
      setCicd("");
      try {
        const resp = await fetch(CICD_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        const data = await resp.json().catch(() => null);
        if (!resp.ok) {
          throw new Error(data?.error || `Request failed with status ${resp.status}`);
        }
        setCicd(data.cicd || "");
      } catch (err) {
        setCicdError(err?.message || String(err));
      } finally {
        setCicdLoading(false);
      }
    }

    function onDownloadCICD() {
      if (!cicd) return;
      const blob = new Blob([cicd], { type: "text/yaml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "ci-cd-pipeline.yml";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    }
  async function onGenerateDockerfile() {
    if (!code.trim()) {
      setDockerError("Please paste code or upload a file first.");
      return;
    }
    setDockerLoading(true);
    setDockerError("");
    setDockerfile("");
    try {
      const resp = await fetch(DOCKERFILE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || `Request failed with status ${resp.status}`);
      }
      setDockerfile(data.dockerfile || "");
    } catch (err) {
      setDockerError(err?.message || String(err));
    } finally {
      setDockerLoading(false);
    }
  }

  function onDownloadDockerfile() {
    if (!dockerfile) return;
    const blob = new Blob([dockerfile], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Dockerfile";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  const canSubmit = useMemo(
    () => code.trim().length > 0 && code.length <= MAX_CODE_CHARS && !loading,
    [code, loading]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) {
      if (code.trim().length === 0) setError("Please paste code before analyzing.");
      else if (code.length > MAX_CODE_CHARS) setError(`Code is too large (max ${MAX_CODE_CHARS} characters).`);
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const resp = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await resp.json().catch(() => null);
      if (!resp.ok) {
        throw new Error(data?.error || `Request failed with status ${resp.status}`);
      }

      setResult({
        explanation: data?.explanation || "",
        suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      });
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  function onClear() {
    if (loading) return;
    setCode("");
    setFileName("");
    setResult(null);
    setError("");
  }

  function onFileChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setCode(typeof text === "string" ? text : "");
      setFileName(file.name);
    };
    reader.readAsText(file);
  }

  return (
    <div className="page">
      <div className="container">
        <header className="header">
          <h1 className="title">Smart Code Assistant</h1>
          <p className="subtitle">Paste code, get a simple explanation and improvement suggestions.</p>
        </header>

        <form onSubmit={onSubmit} className="form">
          <div className="field">
            <label className="label">
              Code
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                rows={14}
                className="textarea"
                placeholder="Enter code here..."
                disabled={loading}
              />
            </label>
            <div style={{ marginTop: 8 }}>
              <input
                type="file"
                accept=".js,.jsx,.ts,.tsx,.py,.java,.c,.cpp,.cs,.rb,.go,.php,.rs,.swift,.kt,.m,.scala,.sh,.txt,.json,.html,.css,.md,.yml,.yaml,.xml,.pl,.r,.sql,.dart,.lua,.vb,.bat,.ps1,.ini,.cfg,.conf,.env,.dockerfile,.makefile,.gradle,.pom,.toml,.lock,.lock.json,.lock.yaml,.lock.yml,.lock.toml,.lock.txt,.lock.js,.lock.py,.lock.rb,.lock.go,.lock.php,.lock.rs,.lock.swift,.lock.kt,.lock.m,.lock.scala,.lock.sh,.lock.md,.lock.yml,.lock.yaml,.lock.xml,.lock.pl,.lock.r,.lock.sql,.lock.dart,.lock.lua,.lock.vb,.lock.bat,.lock.ps1,.lock.ini,.lock.cfg,.lock.conf,.lock.env,.lock.dockerfile,.lock.makefile,.lock.gradle,.lock.pom,.lock.toml,.lock.txt"
                onChange={onFileChange}
                disabled={loading}
                style={{ marginTop: 4 }}
              />
              {fileName && (
                <span style={{ marginLeft: 8, color: '#64748b', fontSize: 13 }}>
                  Loaded: <strong>{fileName}</strong>
                </span>
              )}
            </div>
            <div className="help">
              Tip: paste code or upload a file for analysis. Include the full function/file for more accurate suggestions.
            </div>
            <div className="charCount" aria-live="polite">
              {code.length}/{MAX_CODE_CHARS}
            </div>
          </div>

          <div className="buttonRow">
            <button type="submit" disabled={!canSubmit} className="button">
              {loading ? (
                <span className="buttonContent">
                  <span className="spinner" aria-hidden="true" />
                  Analyzing...
                </span>
              ) : (
                "Analyze"
              )}
            </button>

            <button type="button" onClick={onClear} disabled={loading || (!code && !result && !error)} className="button buttonSecondary">
              Clear
            </button>
          </div>
        </form>

        {error ? <div className="error">Error: {error}</div> : null}

        <section className="resultWrap">
          {result ? (
            <div className="resultCard">
              <h2 className="resultTitle">Assistant Response</h2>

              <div className="section">
                <div className="sectionHeading">Explanation</div>
                {result.explanation ? (
                  <p className="paragraph">{result.explanation}</p>
                ) : (
                  <p className="paragraph" style={{ color: "#64748b" }}>
                    No explanation returned.
                  </p>
                )}
              </div>

              <div className="section">
                <div className="sectionHeading">Suggestions</div>
                {result.suggestions.length ? (
                  <ol className="suggestions">
                    {result.suggestions.map((s, idx) => (
                      <li key={idx} className="suggestionItem">
                        {s}
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="paragraph">No suggestions returned.</p>
                )}
              </div>

              <div className="section">
                <div className="sectionHeading">Dockerfile Generator</div>
                <button
                  type="button"
                  className="button buttonSecondary"
                  style={{ width: 180, marginBottom: 8 }}
                  onClick={onGenerateDockerfile}
                  disabled={dockerLoading || !code.trim()}
                >
                  {dockerLoading ? "Generating..." : "Generate Dockerfile"}
                </button>
                {dockerError && <div className="error">Error: {dockerError}</div>}
                {dockerfile && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      className="textarea"
                      style={{ minHeight: 120, fontFamily: 'monospace', marginBottom: 8 }}
                      value={dockerfile}
                      readOnly
                    />
                    <button
                      type="button"
                      className="button buttonSecondary"
                      style={{ width: 160 }}
                      onClick={onDownloadDockerfile}
                    >
                      Download Dockerfile
                    </button>
                    <div style={{ marginTop: 18, borderTop: '1px solid #e5e7eb', paddingTop: 14 }}>
                      <div className="sectionHeading">Deploy to DockerHub</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400 }}>
                        <input
                          type="text"
                          placeholder="DockerHub Username"
                          value={deployUsername}
                          onChange={e => setDeployUsername(e.target.value)}
                          disabled={deployLoading}
                          style={{ padding: 8, borderRadius: 6, border: '1px solid #dbe2ea' }}
                        />
                        <input
                          type="password"
                          placeholder="DockerHub Password"
                          value={deployPassword}
                          onChange={e => setDeployPassword(e.target.value)}
                          disabled={deployLoading}
                          style={{ padding: 8, borderRadius: 6, border: '1px solid #dbe2ea' }}
                        />
                        <input
                          type="text"
                          placeholder="Image Name (e.g. username/repo:tag)"
                          value={deployImageName}
                          onChange={e => setDeployImageName(e.target.value)}
                          disabled={deployLoading}
                          style={{ padding: 8, borderRadius: 6, border: '1px solid #dbe2ea' }}
                        />
                        <button
                          type="button"
                          className="button buttonSecondary"
                          style={{ width: 180 }}
                          onClick={onDeployDockerHub}
                          disabled={deployLoading}
                        >
                          {deployLoading ? "Deploying..." : "Deploy to DockerHub"}
                        </button>
                        {deployError && <div className="error">Error: {deployError}</div>}
                        {deployStatus && <div className="help" style={{ color: '#059669', fontWeight: 600 }}>{deployStatus}</div>}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="section">
                <div className="sectionHeading">CI/CD Pipeline Generator</div>
                <button
                  type="button"
                  className="button buttonSecondary"
                  style={{ width: 220, marginBottom: 8 }}
                  onClick={onGenerateCICD}
                  disabled={cicdLoading || !code.trim()}
                >
                  {cicdLoading ? "Generating..." : "Generate CI/CD Pipeline"}
                </button>
                {cicdError && <div className="error">Error: {cicdError}</div>}
                {cicd && (
                  <div style={{ marginTop: 10 }}>
                    <textarea
                      className="textarea"
                      style={{ minHeight: 120, fontFamily: 'monospace', marginBottom: 8 }}
                      value={cicd}
                      readOnly
                    />
                    <button
                      type="button"
                      className="button buttonSecondary"
                      style={{ width: 180 }}
                      onClick={onDownloadCICD}
                    >
                      Download CI/CD YAML
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="emptyState">
              <div className="emptyTitle">Waiting for code…</div>
              <div className="emptyText">
                Paste some code above and click <strong>Analyze</strong>.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

