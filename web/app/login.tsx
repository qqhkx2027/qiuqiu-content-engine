"use client";

import { useState } from "react";
import type { FormEvent } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        setError("账号或密码不正确");
        return;
      }
      window.location.assign("/");
    } catch {
      setError("登录失败，请稍后再试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="brand login-brand"><span className="brand-mark">Q</span><span>QIUQIU<br />CONTENT ENGINE</span></div>
        <p className="eyebrow">PRIVATE CONTENT WORKSPACE</p>
        <h1>欢迎回来</h1>
        <p className="login-intro">登录秋秋内容引擎，继续管理选题、排期和内容资产。</p>
        <form onSubmit={submit} className="login-form">
          <label>账号<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} required /></label>
          <label>密码<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <p className="login-error" role="alert">{error}</p>}
          <button className="primary-button login-submit" type="submit" disabled={busy}>{busy ? "登录中…" : "登录"}</button>
        </form>
      </section>
    </main>
  );
}
