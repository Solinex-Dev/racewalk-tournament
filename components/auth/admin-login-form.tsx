"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Logo } from "@/components/partials/admin-sidebar/logo";
import { useState } from "react";

const DEV_QUICK_LOGIN_EMAIL = "owner@racewalk.local";
const DEV_QUICK_LOGIN_PASSWORD = "owner1234";

type AdminLoginFormProps = {
  showDevQuickLogin?: boolean;
};

export function AdminLoginForm({ showDevQuickLogin = false }: AdminLoginFormProps) {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devOpen, setDevOpen] = useState(false);

  async function performLogin(loginEmail: string, loginPassword: string) {
    setError(null);
    if (!loginEmail || !loginPassword) {
      setError("กรุณากรอกอีเมลและรหัสผ่าน");
      return;
    }
    setPending(true);
    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      rememberMe: "true",
      redirect: false,
    });
    setPending(false);
    if (!result || result.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }
    const callbackUrl = searchParams.get("callbackUrl");
    const target =
      callbackUrl && callbackUrl.startsWith("/") ? callbackUrl : "/admin";
    window.location.assign(target);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await performLogin(email, password);
  }

  async function handleDevQuickLogin() {
    setEmail(DEV_QUICK_LOGIN_EMAIL);
    setPassword(DEV_QUICK_LOGIN_PASSWORD);
    await performLogin(DEV_QUICK_LOGIN_EMAIL, DEV_QUICK_LOGIN_PASSWORD);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 px-4">
      <Card className="w-full max-w-sm rounded-3xl px-6 py-10 pt-14 shadow-lg">
        <CardContent>
          <form className="flex flex-col items-center space-y-8" onSubmit={handleSubmit}>
            <Logo className="h-12 w-12" />

            <div className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold text-foreground">
                เข้าสู่ระบบผู้ดูแล
              </h1>
              <p className="text-muted-foreground text-sm">
                ระบุอีเมลและรหัสผ่านเพื่อเข้าแดชบอร์ดจัดการการแข่งขัน
              </p>
            </div>

            <div className="w-full space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground"
                >
                  อีเมล
                </label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  className="w-full rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={pending}
                  required
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-foreground"
                >
                  รหัสผ่าน
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={pending}
                  required
                />
              </div>

              {error && (
                <p
                  role="alert"
                  className="text-center text-sm text-destructive"
                >
                  {error}
                </p>
              )}

              <Button
                className="w-full cursor-pointer rounded-xl"
                size="lg"
                type="submit"
                disabled={pending}
              >
                {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
              </Button>
            </div>

            <p className="w-11/12 text-center text-xs text-muted-foreground">
              สำหรับผู้ดูแลระบบ Racewalk Tournament เท่านั้น
            </p>

            {showDevQuickLogin && (
              <div className="flex w-full flex-col items-center gap-2">
                <button
                  type="button"
                  aria-expanded={devOpen}
                  aria-label={devOpen ? "ซ่อนเมนู dev" : "แสดงเมนู dev"}
                  className="cursor-pointer text-[10px] leading-none text-muted-foreground/60 transition-transform hover:text-muted-foreground"
                  style={{ transform: devOpen ? "rotate(180deg)" : undefined }}
                  onClick={() => setDevOpen((open) => !open)}
                >
                  ^
                </button>
                {devOpen && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full cursor-pointer rounded-xl text-xs"
                    disabled={pending}
                    onClick={handleDevQuickLogin}
                  >
                    Quick login for dev
                  </Button>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      <Link
        href="/"
        className="text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
      >
        ← กลับสู่หน้าหลัก
      </Link>
    </div>
  );
}
