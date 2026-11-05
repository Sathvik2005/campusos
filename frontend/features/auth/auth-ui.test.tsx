import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }), usePathname: () => "/dashboard" }));
vi.mock("@/lib/env", () => ({ env: { apiBaseUrl: "http://api.test", supabaseUrl: "", supabaseAnonKey: "" } }));
vi.mock("@/components/feedback/backend-status", () => ({ BackendStatus: () => null }));

import { AuthGuard } from "@/components/layout/auth-guard";
import { AuthTestProvider, type AuthState } from "./auth-provider";
import { LoginView } from "./login-view";

function withAuth(state: AuthState, ui: React.ReactNode, signIn = vi.fn().mockResolvedValue(null)) {
  return render(
    <AuthTestProvider value={{ state, signIn, signOut: vi.fn(), retry: vi.fn() }}>{ui}</AuthTestProvider>,
  );
}

beforeEach(() => replace.mockClear());

describe("AuthGuard", () => {
  it("redirects anonymous visitors to /login", async () => {
    withAuth({ status: "anonymous" }, <AuthGuard>secret</AuthGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("shows a loading state, not the page, while the session resolves", () => {
    withAuth({ status: "loading" }, <AuthGuard>secret</AuthGuard>);
    expect(screen.getByRole("status", { name: /loading/i })).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("sends visitors to /login (which explains the missing configuration) when sign-in is not configured", async () => {
    withAuth({ status: "unconfigured" }, <AuthGuard>secret</AuthGuard>);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/login"));
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("tells a profile-less account it has no access, without showing the page", () => {
    withAuth({ status: "forbidden", message: "No access for this account" }, <AuthGuard>secret</AuthGuard>);
    expect(screen.getByRole("alert")).toHaveTextContent("No access for this account");
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders the shell and page for an authenticated faculty member, with their identity and role", () => {
    withAuth({ status: "authenticated", user: { id: "1", role: "faculty", display_name: "Demo Faculty 1", faculty_id: "f" } }, <AuthGuard>secret</AuthGuard>);
    expect(screen.getByText("secret")).toBeInTheDocument();
    expect(screen.getAllByText("Demo Faculty 1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Faculty").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: /sign out/i }).length).toBeGreaterThan(0);
  });
});

describe("LoginView", () => {
  it("validates fields before submitting", async () => {
    const signIn = vi.fn().mockResolvedValue(null);
    withAuth({ status: "anonymous" }, <LoginView />, signIn);
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter your email")).toBeInTheDocument();
    expect(screen.getByText("Enter your password")).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("Email"), "not-an-email");
    await userEvent.type(screen.getByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("Enter a valid email address")).toBeInTheDocument();
    expect(signIn).not.toHaveBeenCalled();
  });

  it("submits valid credentials and shows an authentication error from the server", async () => {
    const signIn = vi.fn().mockResolvedValue("That email or password is not correct.");
    withAuth({ status: "anonymous" }, <LoginView />, signIn);
    await userEvent.type(screen.getByLabelText("Email"), "a@b.co");
    await userEvent.type(screen.getByLabelText("Password"), "pw");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByText("That email or password is not correct.")).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith("a@b.co", "pw");
  });

  it("shows the expired-session message and disables sign-in when unconfigured", () => {
    withAuth({ status: "anonymous", message: "Your session expired. Please sign in again." }, <LoginView />);
    expect(screen.getByText("Your session expired. Please sign in again.")).toBeInTheDocument();
  });

  it("is disabled with a clear notice when Supabase is not configured", () => {
    withAuth({ status: "unconfigured" }, <LoginView />);
    expect(screen.getByText(/isn.t configured/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
  });

  it("sends an already-authenticated user to the dashboard", async () => {
    withAuth({ status: "authenticated", user: { id: "1", role: "office_admin", display_name: "A", faculty_id: null } }, <LoginView />);
    await waitFor(() => expect(replace).toHaveBeenCalledWith("/dashboard"));
  });
});
